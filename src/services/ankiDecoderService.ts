import * as fflate from 'fflate';
import {
  AnkiCard,
  AnkiDeck,
  AnkiMediaItem,
  AnkiZipFileInfo,
  AnkiModelField,
  AnkiModelDefinition,
  AnkiSubdeckInfo,
  AnkiRawNote,
  AnkiDiagnosticIssue,
  AnkiFieldMappingConfig,
  AnkiInspectionReport
} from '../types/anki';
import { getMimeType, cleanAnkiField, getSqlJsInstance } from './ankiParser';
import { indexedDbService } from './indexedDbService';

/**
 * Thuật toán suy luận trường thông minh (Smart Field Detection)
 * Tự động tìm trường phù hợp nhất cho Front, Back, Audio, Image dựa trên tên trường
 */
export function detectSmartFieldMapping(fields: AnkiModelField[]): AnkiFieldMappingConfig {
  let frontIdx = 0;
  const backIndices: number[] = [];
  let audioIdx: number | undefined = undefined;
  let imageIdx: number | undefined = undefined;

  // Từ khóa nhận diện
  const frontKeywords = ['target', 'word', 'front', 'question', 'term', 'expression', 'vocab', 'từ', 'câu hỏi', 'heading'];
  const backKeywords = ['vietnamese', 'meaning', 'translation', 'definition', 'answer', 'back', 'nghĩa', 'giải thích', 'dịch'];
  const audioKeywords = ['sound', 'audio', 'pronounce', 'pronouncing', 'phát âm', 'nghe', 'voice'];
  const imageKeywords = ['image', 'img', 'picture', 'pic', 'photo', 'hình', 'ảnh'];

  fields.forEach((f) => {
    const lower = f.name.toLowerCase();

    // Nhận diện Audio
    if (audioIdx === undefined && audioKeywords.some((k) => lower.includes(k))) {
      audioIdx = f.index;
      return;
    }

    // Nhận diện Image
    if (imageIdx === undefined && imageKeywords.some((k) => lower.includes(k))) {
      imageIdx = f.index;
      return;
    }

    // Nhận diện Front
    if (frontKeywords.some((k) => lower.includes(k))) {
      frontIdx = f.index;
      return;
    }

    // Nhận diện Back
    if (backKeywords.some((k) => lower.includes(k))) {
      backIndices.push(f.index);
    }
  });

  // Nếu không tìm thấy Back rõ ràng, lấy tất cả các trường còn lại (trừ front, audio, image)
  if (backIndices.length === 0) {
    fields.forEach((f) => {
      if (f.index !== frontIdx && f.index !== audioIdx && f.index !== imageIdx) {
        backIndices.push(f.index);
      }
    });
  }

  // Nếu vẫn rỗng, mặc định lấy trường kế tiếp
  if (backIndices.length === 0 && fields.length > 1) {
    backIndices.push(frontIdx === 0 ? 1 : 0);
  }

  return {
    modelId: '',
    frontFieldIndex: frontIdx,
    frontFieldIndices: [frontIdx],
    backFieldIndices: backIndices.length > 0 ? backIndices : [1],
    audioFieldIndex: audioIdx,
    imageFieldIndex: imageIdx
  };
}

/**
 * Service Chẩn Đoán & Giải Mã Gói Bộ Thẻ Anki (.apkg)
 */
export class AnkiDecoderService {
  /**
   * Bóc tách và kiểm tra chuyên sâu toàn bộ gói Anki
   * Sử dụng kỹ thuật Stream/Filter giải nén có chọn lọc để không làm tràn bộ nhớ
   */
  static async inspectPackage(
    file: File,
    onProgress?: (percent: number, message: string) => void
  ): Promise<AnkiInspectionReport> {
    onProgress?.(5, 'Đang đọc tệp .apkg...');
    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    onProgress?.(20, 'Đang phân tích cấu trúc tệp nén ZIP...');
    const zipFiles: AnkiZipFileInfo[] = [];
    const extractedData: Record<string, Uint8Array> = {};

    // 1. Giải nén có lọc (Chỉ giải nén SQLite & Media Map để tiết kiệm 95% RAM)
    await new Promise<void>((resolve, reject) => {
      fflate.unzip(
        fileBytes,
        {
          filter: (fileEntry) => {
            const isDb =
              fileEntry.name === 'collection.anki21' ||
              fileEntry.name === 'collection.anki2' ||
              fileEntry.name === 'collection.anki21b';
            const isMedia = fileEntry.name === 'media';

            zipFiles.push({
              name: fileEntry.name,
              sizeBytes: fileEntry.originalSize || 0,
              compressedSizeBytes: fileEntry.size || 0,
              isDatabaseFile: isDb,
              isMediaMapFile: isMedia
            });

            // Chỉ giải nén vào RAM các file metadata quan trọng
            return isDb || isMedia;
          }
        },
        (err, unzipped) => {
          if (err) {
            reject(new Error(`Không thể giải nén gói ZIP: ${err.message}`));
          } else {
            Object.assign(extractedData, unzipped);
            resolve();
          }
        }
      );
    });

    const issues: AnkiDiagnosticIssue[] = [];

    // 2. Xác định loại cơ sở dữ liệu
    let dbType: 'anki21' | 'anki2' | 'anki21b_zstd' | 'not_found' = 'not_found';
    let sqliteBytes: Uint8Array | undefined = undefined;

    if (extractedData['collection.anki21']) {
      dbType = 'anki21';
      sqliteBytes = extractedData['collection.anki21'];
      issues.push({
        id: 'db_anki21',
        level: 'info',
        title: 'Định dạng chuẩn hiện đại: Anki 2.1 (SQLite v21)',
        description: 'Tệp collection.anki21 được phát hiện. Đây là định dạng chuẩn có độ tương thích cao nhất.'
      });
    } else if (extractedData['collection.anki2']) {
      dbType = 'anki2';
      sqliteBytes = extractedData['collection.anki2'];
      issues.push({
        id: 'db_anki2',
        level: 'info',
        title: 'Định dạng tương thích cũ: Anki 2.0 (SQLite v2)',
        description: 'Tệp collection.anki2 được phát hiện. Tương thích tốt với các phiên bản Anki đời cũ.'
      });
    } else if (zipFiles.some((f) => f.name === 'collection.anki21b')) {
      dbType = 'anki21b_zstd';
      issues.push({
        id: 'db_zstd_warning',
        level: 'error',
        title: 'Bộ thẻ sử dụng nén Zstandard (collection.anki21b)',
        description:
          'File database bên trong được nén bằng thuật toán Zstandard của các bản Anki mới nhất, trình duyệt không thể đọc trực tiếp nếu không qua giải mã zstd.',
        solution:
          'Cách khắc phục: Trên Anki Desktop, khi xuất file (Export), hãy tích chọn vào ô "Support older Anki versions (anki21)" để Anki xuất ra file SQLite thông thường.'
      });
    } else {
      issues.push({
        id: 'db_not_found',
        level: 'error',
        title: 'Không tìm thấy cơ sở dữ liệu Anki',
        description: 'Gói .apkg này không chứa file collection.anki21 hoặc collection.anki2 hợp lệ.',
        solution: 'Vui lòng kiểm tra lại file xuất từ phần mềm Anki.'
      });
    }

    // 3. Phân tích tệp mapping media
    const mediaMap: Record<string, string> = {};
    let mediaCount = 0;
    if (extractedData['media']) {
      try {
        const mediaStr = new TextDecoder().decode(extractedData['media']);
        const parsed = JSON.parse(mediaStr);
        Object.assign(mediaMap, parsed);
        mediaCount = Object.keys(mediaMap).length;
        issues.push({
          id: 'media_count',
          level: 'info',
          title: `Tìm thấy ${mediaCount} tệp đa phương tiện`,
          description: `Gói này chứa ${mediaCount} tệp âm thanh/hình ảnh đính kèm.`
        });
      } catch (err: any) {
        issues.push({
          id: 'media_corrupt',
          level: 'warning',
          title: 'Tệp ánh xạ media bị hỏng hoặc không đúng định dạng JSON',
          description: err?.message || 'Không thể đọc tệp media.'
        });
      }
    }

    // Nếu không có SQLite bytes (do lỗi hoặc Zstandard), trả về báo cáo sớm
    if (!sqliteBytes) {
      return {
        fileName: file.name,
        fileSizeBytes: file.size,
        zipFiles,
        dbType,
        sqliteTables: [],
        decks: [],
        models: {},
        totalNotes: 0,
        totalCards: 0,
        mediaCount,
        mediaMap,
        rawNotes: [],
        issues,
        defaultMapping: {}
      };
    }

    onProgress?.(45, 'Đang khởi tạo bộ xử lý SQLite WebAssembly...');
    const SQL = await getSqlJsInstance();
    const db = new SQL.Database(sqliteBytes);

    onProgress?.(60, 'Đang phân tích cấu trúc các bảng dữ liệu...');
    // 4. Lấy danh sách các bảng SQLite
    const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
    const sqliteTables: string[] = tablesRes[0]?.values?.map((v) => String(v[0])) || [];

    // 5. Đọc Decks & Models từ bảng `col`
    const subdecks: AnkiSubdeckInfo[] = [];
    const models: Record<string, AnkiModelDefinition> = {};
    const defaultMapping: Record<string, AnkiFieldMappingConfig> = {};

    try {
      const colRes = db.exec('SELECT decks, models FROM col LIMIT 1;');
      if (colRes.length > 0 && colRes[0].values.length > 0) {
        const decksJson = String(colRes[0].values[0][0] || '{}');
        const modelsJson = String(colRes[0].values[0][1] || '{}');

        const parsedDecks = JSON.parse(decksJson);
        const parsedModels = JSON.parse(modelsJson);

        // Đọc số lượng thẻ của từng deck từ bảng cards
        const cardCountsByDeck: Record<string, number> = {};
        try {
          const cardCountRes = db.exec('SELECT did, COUNT(*) FROM cards GROUP BY did;');
          if (cardCountRes.length > 0) {
            cardCountRes[0].values.forEach((row) => {
              cardCountsByDeck[String(row[0])] = Number(row[1]);
            });
          }
        } catch {
          // Bỏ qua nếu bảng cards không query được
        }

        // Tạo danh sách subdecks
        for (const [did, d] of Object.entries<any>(parsedDecks)) {
          if (did === '1' && d.name === 'Default' && !cardCountsByDeck[did]) {
            continue; // Bỏ qua deck Default rỗng
          }
          const fullName = String(d.name || did);
          const cleanTitle = fullName.replace(/::/g, ' ➔ ');
          subdecks.push({
            id: did,
            name: fullName,
            cleanTitle,
            cardCount: cardCountsByDeck[did] || 0,
            isParent: fullName.includes('::') === false
          });
        }

        // Tạo danh sách models
        for (const [mid, m] of Object.entries<any>(parsedModels)) {
          const fields: AnkiModelField[] = (m.flds || []).map((f: any, idx: number) => ({
            index: idx,
            name: String(f.name || `Trường ${idx + 1}`)
          }));
          const templateNames: string[] = (m.tmpls || []).map((t: any) => String(t.name || 'Thẻ'));

          models[mid] = {
            id: mid,
            name: String(m.name || 'Mẫu ghi chú'),
            fields,
            templateNames
          };

          // Tạo gợi ý mapping thông minh cho model này
          const smartConfig = detectSmartFieldMapping(fields);
          smartConfig.modelId = mid;
          defaultMapping[mid] = smartConfig;
        }
      }
    } catch (err: any) {
      issues.push({
        id: 'col_parse_error',
        level: 'warning',
        title: 'Lỗi khi đọc bảng metadata `col`',
        description: err?.message || 'Không thể giải mã trường decks hoặc models.'
      });
    }

    onProgress?.(75, 'Đang trích xuất ghi chú và thẻ học...');
    // 6. Đọc Notes & map sang RawNotes
    const rawNotes: AnkiRawNote[] = [];
    let totalNotes = 0;

    // Đọc mapping giữa noteId và deckId từ bảng cards
    const noteToDeckMap: Record<string, string> = {};
    let totalCards = 0;
    try {
      const cardsRes = db.exec('SELECT id, nid, did FROM cards;');
      if (cardsRes.length > 0) {
        totalCards = cardsRes[0].values.length;
        cardsRes[0].values.forEach((row) => {
          const nid = String(row[1]);
          const did = String(row[2]);
          if (!noteToDeckMap[nid]) {
            noteToDeckMap[nid] = did;
          }
        });
      }
    } catch {
      // Bỏ qua
    }

    try {
      const notesRes = db.exec('SELECT id, mid, flds, tags FROM notes;');
      if (notesRes.length > 0) {
        totalNotes = notesRes[0].values.length;
        notesRes[0].values.forEach((row) => {
          const noteId = String(row[0]);
          const modelId = String(row[1]);
          const fldsRaw = String(row[2] || '');
          const tagsRaw = String(row[3] || '').trim();

          const fields = fldsRaw.split('\x1f');
          const tags = tagsRaw ? tagsRaw.split(/\s+/).filter(Boolean) : [];

          rawNotes.push({
            id: noteId,
            modelId,
            deckId: noteToDeckMap[noteId],
            fields,
            tags
          });
        });
      }
    } catch (err: any) {
      issues.push({
        id: 'notes_read_error',
        level: 'error',
        title: 'Lỗi khi đọc dữ liệu bảng `notes`',
        description: err?.message || 'Không thể trích xuất danh sách ghi chú.'
      });
    }

    db.close();

    // 7. Chẩn đoán sâu các trường hợp phổ biến
    if (subdecks.length > 1) {
      issues.push({
        id: 'multiple_subdecks',
        level: 'info',
        title: `Phát hiện ${subdecks.length} bộ thẻ / chủ đề con`,
        description:
          'Gói thẻ này được chia thành nhiều chủ đề nhỏ. Bạn có thể chọn nhập toàn bộ hoặc chọn riêng từng chủ đề cần học.'
      });
    }

    // Kiểm tra cấu trúc fields của các models
    for (const [mid, m] of Object.entries(models)) {
      if (m.fields.length > 3) {
        issues.push({
          id: `model_fields_${mid}`,
          level: 'warning',
          title: `Mẫu ghi chú "${m.name}" có ${m.fields.length} trường phong phú`,
          description: `Gói thẻ này không dùng định dạng cơ bản 2 mặt (Front/Back) mà có các trường: [${m.fields.map((f) => f.name).join(', ')}]. Hãy kiểm tra lại tab "Ghép Trường" để chắc chắn từ vựng và nghĩa được hiển thị đúng ý.`,
          solution: 'Chuyển sang tab "Mô hình & Ghép Trường" để chọn trường nào làm câu hỏi, trường nào làm lời giải.'
        });
      }
    }

    onProgress?.(100, 'Hoàn tất phân tích gói Anki!');

    return {
      fileName: file.name,
      fileSizeBytes: file.size,
      zipFiles,
      dbType,
      sqliteTables,
      decks: subdecks,
      models,
      totalNotes,
      totalCards,
      mediaCount,
      mediaMap,
      rawNotes,
      issues,
      defaultMapping
    };
  }

  /**
   * Tạo danh sách thẻ AnkiCard dựa trên cấu hình ghép trường (Mapping)
   * và bộ lọc Subdeck (nếu người dùng chỉ muốn nhập 1 chủ đề cụ thể)
   */
  static generateMappedCards(
    inspection: AnkiInspectionReport,
    mappings: Record<string, AnkiFieldMappingConfig>,
    targetDeckId?: string
  ): AnkiCard[] {
    const cards: AnkiCard[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    // Tạo bản đồ chuyển đổi deckId sang tên chủ đề ngắn gọn (ví dụ: "01. Contract")
    const deckIdToSubdeckName: Record<string, string> = {};
    inspection.decks.forEach((d) => {
      const parts = d.name.split('::');
      const cleanSubName = parts.length > 1 ? parts[parts.length - 1].trim() : d.cleanTitle;
      // Chỉ lấy nếu không phải là deck cha rỗng
      if (d.cardCount > 0 || parts.length > 1) {
        deckIdToSubdeckName[d.id] = cleanSubName;
      }
    });

    inspection.rawNotes.forEach((note, index) => {
      // Lọc theo subdeck nếu có chỉ định
      if (targetDeckId && note.deckId && note.deckId !== targetDeckId) {
        return;
      }

      const mapping = mappings[note.modelId] || inspection.defaultMapping[note.modelId];
      const frontIndices =
        mapping?.frontFieldIndices && mapping.frontFieldIndices.length > 0
          ? mapping.frontFieldIndices
          : mapping?.frontFieldIndex !== undefined
          ? [mapping.frontFieldIndex]
          : [0];
      const backIndices = mapping ? mapping.backFieldIndices : [1];
      const audioIdx = mapping?.audioFieldIndex;
      const imageIdx = mapping?.imageFieldIndex;

      // Xử lý Mặt trước (Hỗ trợ nhiều trường: trường đầu tiên #1 là trường "Chính", các trường sau là phụ trợ)
      const frontParts: string[] = [];
      const collectedAudio: string[] = [];
      const collectedImages: string[] = [];
      let primaryFrontText: string | undefined = undefined;

      frontIndices.forEach((fIdx, i) => {
        const fRaw = note.fields[fIdx] || '';
        const fParsed = cleanAnkiField(fRaw);
        if (fParsed.cleanText) {
          if (i === 0) {
            // Trường chọn đầu tiên được đánh dấu là "Chính"
            primaryFrontText = fParsed.cleanText;
            frontParts.push(`<div class="text-xl sm:text-2xl font-bold font-serif text-text-primary leading-snug">${fParsed.cleanText}</div>`);
          } else {
            // Các trường phụ trợ
            frontParts.push(`<div class="text-xs sm:text-sm font-sans text-text-secondary mt-1.5">${fParsed.cleanText}</div>`);
          }
        }
        collectedAudio.push(...fParsed.audioNames);
        collectedImages.push(...fParsed.imageNames);
      });

      const frontRawHtml = frontParts.join('');

      // Xử lý Mặt sau
      const backParts: string[] = [];

      // Nếu có chỉ định trường âm thanh riêng
      if (audioIdx !== undefined && note.fields[audioIdx]) {
        const audioParsed = cleanAnkiField(note.fields[audioIdx]);
        collectedAudio.push(...audioParsed.audioNames);
      }

      // Nếu có chỉ định trường hình ảnh riêng
      if (imageIdx !== undefined && note.fields[imageIdx]) {
        const imageRaw = note.fields[imageIdx];
        const imageParsed = cleanAnkiField(imageRaw);
        collectedImages.push(...imageParsed.imageNames);

        // Chèn thẻ hình ảnh vào đầu Mặt Sau để chắc chắn hình ảnh được hiển thị trực quan
        if (imageParsed.imageNames.length > 0) {
          const imgTags = imageParsed.imageNames
            .map(
              (name) =>
                `<div class="anki-image my-2.5 text-center"><img src="${name}" alt="Hình ảnh minh họa" class="max-w-full rounded-xl mx-auto shadow-2xs" /></div>`
            )
            .join('');
          backParts.unshift(imgTags);
        } else if (imageParsed.cleanText) {
          backParts.unshift(imageParsed.cleanText);
        }
      }

      // Ghép các trường mặt sau
      backIndices.forEach((bIdx) => {
        if (note.fields[bIdx]) {
          const bParsed = cleanAnkiField(note.fields[bIdx]);
          if (bParsed.cleanText) {
            backParts.push(bParsed.cleanText);
          }
          collectedAudio.push(...bParsed.audioNames);
          collectedImages.push(...bParsed.imageNames);
        }
      });

      const backRaw = backParts.join('<hr class="my-2 border-border-subtle" />');

      // Tự động gán tên phân nhóm / subdeck bài học
      const subdeckTitle = note.deckId ? deckIdToSubdeckName[note.deckId] : undefined;
      const combinedTags = [...(note.tags || [])];
      if (subdeckTitle && !combinedTags.includes(subdeckTitle)) {
        combinedTags.push(subdeckTitle);
      }

      cards.push({
        id: `card_${note.id}_${index + 1}`,
        deckId: targetDeckId || note.deckId || 'deck_default',
        noteId: note.id,
        primaryFront: primaryFrontText,
        front: frontRawHtml || '(Không có nội dung mặt trước)',
        back: backRaw || '(Không có nội dung mặt sau)',
        audioName: collectedAudio[0] || undefined,
        imageName: collectedImages[0] || undefined,
        dueDate: todayStr,
        interval: 0,
        reps: 0,
        lapses: 0,
        tags: combinedTags,
        subdeckName: subdeckTitle,
        state: 'new'
      });
    });

    return cards;
  }

  /**
   * Trích xuất chính xác một tệp âm thanh hoặc hình ảnh từ file ZIP gốc
   * Dùng để nghe thử / xem thử ngay trên giao diện mà không phải bung toàn bộ ZIP
   */
  static async extractMediaBlob(
    file: File,
    mediaFilename: string,
    mediaMap: Record<string, string>
  ): Promise<Blob | null> {
    // Tìm key trong zip tương ứng với mediaFilename
    let targetZipKey: string | undefined = undefined;
    for (const [zipKey, filename] of Object.entries(mediaMap)) {
      if (filename.toLowerCase() === mediaFilename.toLowerCase()) {
        targetZipKey = zipKey;
        break;
      }
    }

    if (!targetZipKey) return null;

    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    return new Promise<Blob | null>((resolve) => {
      fflate.unzip(
        fileBytes,
        {
          filter: (entry) => entry.name === targetZipKey
        },
        (err, data) => {
          if (err || !data || !data[targetZipKey!]) {
            resolve(null);
          } else {
            const mimeType = getMimeType(mediaFilename);
            const blob = new Blob([data[targetZipKey!].buffer as ArrayBuffer], { type: mimeType });
            resolve(blob);
          }
        }
      );
    });
  }

  /**
   * Lưu bộ thẻ đã cấu hình vào IndexedDB của dự án
   */
  static async saveConfiguredDeckToApp(
    deckTitle: string,
    cards: AnkiCard[],
    rawFile: File,
    mediaMap: Record<string, string>,
    onProgress?: (percent: number, message: string) => void
  ): Promise<string> {
    const deckId = `deck_${Date.now()}`;
    onProgress?.(10, 'Đang chuẩn bị lưu trữ...');

    // Cập nhật deckId cho toàn bộ cards
    const updatedCards = cards.map((c) => ({
      ...c,
      deckId
    }));

    // 1. Trích xuất toàn bộ các tệp media thực sự cần thiết
    const neededMediaNames = new Set<string>();
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const soundRegex = /\[sound:([^\]]+)\]/gi;

    updatedCards.forEach((c) => {
      if (c.audioName) {
        neededMediaNames.add(c.audioName);
        try {
          neededMediaNames.add(decodeURIComponent(c.audioName));
        } catch {}
      }
      if (c.imageName) {
        neededMediaNames.add(c.imageName);
        try {
          neededMediaNames.add(decodeURIComponent(c.imageName));
        } catch {}
      }

      // Quét tất cả thẻ <img> trong front và back
      const allText = `${c.front} ${c.back}`;
      for (const match of allText.matchAll(imgRegex)) {
        if (match[1] && !/^(https?:|data:|blob:)/i.test(match[1])) {
          const fn = match[1].trim();
          neededMediaNames.add(fn);
          try {
            neededMediaNames.add(decodeURIComponent(fn));
          } catch {}
        }
      }
      // Quét tất cả âm thanh trong front và back
      for (const match of allText.matchAll(soundRegex)) {
        if (match[1]) {
          const fn = match[1].trim();
          neededMediaNames.add(fn);
          try {
            neededMediaNames.add(decodeURIComponent(fn));
          } catch {}
        }
      }
    });

    onProgress?.(30, `Đang trích xuất ${neededMediaNames.size} tệp âm thanh/hình ảnh...`);

    // Tạo danh sách zipKeys cần giải nén
    const zipKeyToNameMap: Record<string, string> = {};
    for (const [zipKey, filename] of Object.entries(mediaMap)) {
      if (
        neededMediaNames.has(filename) ||
        neededMediaNames.has(decodeURIComponent(filename)) ||
        neededMediaNames.has(encodeURIComponent(filename))
      ) {
        zipKeyToNameMap[zipKey] = filename;
      }
    }

    const arrayBuffer = await rawFile.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    const mediaItems: AnkiMediaItem[] = [];

    await new Promise<void>((resolve) => {
      fflate.unzip(
        fileBytes,
        {
          filter: (entry) => Boolean(zipKeyToNameMap[entry.name])
        },
        (err, unzipped) => {
          if (!err && unzipped) {
            for (const [zipKey, bytes] of Object.entries(unzipped)) {
              const filename = zipKeyToNameMap[zipKey];
              if (filename) {
                const mimeType = getMimeType(filename);
                const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mimeType });
                mediaItems.push({
                  id: filename,
                  deckId,
                  mimeType,
                  blob
                });
              }
            }
          }
          resolve();
        }
      );
    });

    onProgress?.(70, 'Đang lưu vào cơ sở dữ liệu IndexedDB...');

    const newDeck: AnkiDeck = {
      id: deckId,
      title: deckTitle,
      cardCount: updatedCards.length,
      createdAt: new Date().toISOString(),
      rawFileName: rawFile.name
    };

    // 2. Lưu trữ vào IndexedDB
    await indexedDbService.saveDeckApkgBlob(deckId, rawFile);
    await indexedDbService.saveDeck(newDeck);
    await indexedDbService.saveCardsBatch(updatedCards);

    if (mediaItems.length > 0) {
      await indexedDbService.saveMediaItemsBatch(mediaItems);
    }

    onProgress?.(100, 'Nhập bộ thẻ thành công!');
    return deckId;
  }
}
