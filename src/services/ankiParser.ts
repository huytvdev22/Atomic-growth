import * as fflate from 'fflate';
import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { AnkiDeck, AnkiCard, AnkiMediaItem } from '../types/anki';

/**
 * Xác định định dạng MIME Type dựa theo phần mở rộng của file
 */
export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp3':
      return 'audio/mpeg';
    case 'ogg':
      return 'audio/ogg';
    case 'wav':
      return 'audio/wav';
    case 'm4a':
      return 'audio/mp4';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Làm sạch chuỗi HTML/Text từ trường của thẻ Anki
 * - Loại bỏ các thẻ [sound:filename.mp3] để tách riêng ra nút phát âm
 * - Trả về audioName nếu có
 */
export function cleanAnkiField(text: string): { cleanText: string; audioNames: string[]; imageNames: string[] } {
  let cleanText = text || '';
  const audioNames: string[] = [];
  const imageNames: string[] = [];

  // 1. Trích xuất toàn bộ file âm thanh từ tag [sound:abc.mp3]
  const soundMatches = cleanText.matchAll(/\[sound:([^\]]+)\]/gi);
  for (const match of soundMatches) {
    if (match[1]) {
      audioNames.push(match[1].trim());
    }
  }
  // Xóa thẻ [sound:...] để giao diện không bị rác chữ
  cleanText = cleanText.replace(/\[sound:[^\]]+\]/gi, '').trim();

  // 2. Trích xuất file hình ảnh từ tag <img src="xyz.png">
  const imgMatches = cleanText.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  for (const match of imgMatches) {
    if (match[1]) {
      imageNames.push(match[1].trim());
    }
  }

  // 3. Xử lý định dạng Cloze deletion: {{c1::câu trả lời::gợi ý}} hoặc {{c1::câu trả lời}}
  cleanText = cleanText.replace(/\{\{c\d+::([^:]+?)(?:::([^}]*?))?\}\}/g, (_match, answer, hint) => {
    return hint ? `[${hint}]` : `[${answer}]`;
  });

  // 4. Dọn bớt các thẻ div/br thừa ở đầu/cuối
  cleanText = cleanText
    .replace(/^<br\s*\/?>/i, '')
    .replace(/<br\s*\/?>$/i, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

  return { cleanText, audioNames, imageNames };
}

export interface ParseAnkiResult {
  deck: AnkiDeck;
  cards: AnkiCard[];
  mediaItems: AnkiMediaItem[];
}

export type ProgressCallback = (percent: number, message: string) => void;

/**
 * Khởi tạo sql.js an toàn với cơ chế fallback 3 tầng và kiểm tra magic header '\0asm'
 * Ngăn chặn tuyệt đối lỗi "WebAssembly.instantiate(): expected magic word 00 61 73 6d, found 3c 21 64 6f"
 * (nguyên nhân do Service Worker/PWA hoặc Vite dev server trả về HTML index.html thay vì wasm)
 */
export async function getSqlJsInstance() {
  const sources = [
    sqlWasmUrl,
    '/sql-wasm.wasm',
    'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.wasm'
  ];

  for (const src of sources) {
    try {
      const res = await fetch(src);
      if (!res.ok) continue;

      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Kiểm tra magic header WebAssembly: \0asm (0x00, 0x61, 0x73, 0x6d)
      if (
        bytes.length >= 4 &&
        bytes[0] === 0x00 &&
        bytes[1] === 0x61 &&
        bytes[2] === 0x73 &&
        bytes[3] === 0x6d
      ) {
        return await initSqlJs({ wasmBinary: buffer });
      } else {
        console.warn(`Nguồn WASM "${src}" trả về dữ liệu không phải binary WebAssembly (có thể là HTML fallback)`);
      }
    } catch (err) {
      console.warn(`Lỗi khi nạp WASM từ nguồn "${src}":`, err);
    }
  }

  // Fallback an toàn cuối cùng
  return await initSqlJs({
    locateFile: () => sqlWasmUrl
  });
}

/**
 * Service bóc tách tệp gói bộ thẻ Anki (.apkg)
 * Chạy 100% Client-side bằng fflate và WebAssembly SQLite (sql.js)
 */
export async function parseAnkiPackage(
  file: File,
  onProgress?: ProgressCallback
): Promise<ParseAnkiResult> {
  onProgress?.(5, 'Đang đọc tệp .apkg vào bộ nhớ...');
  const arrayBuffer = await file.arrayBuffer();
  const fileBytes = new Uint8Array(arrayBuffer);

  onProgress?.(15, 'Đang giải nén bộ thẻ Anki...');
  // 1. Giải nén ZIP bằng fflate
  const unzipped = await new Promise<{ [key: string]: Uint8Array }>((resolve, reject) => {
    fflate.unzip(fileBytes, (err, data) => {
      if (err) {
        reject(new Error(`Lỗi giải nén file Anki ZIP: ${err.message}`));
      } else {
        resolve(data);
      }
    });
  });

  // 2. Tìm file cơ sở dữ liệu SQLite:
  // QUAN TRỌNG: Ưu tiên collection.anki21 trước vì collection.anki2 trong các bản Anki mới chỉ là stub dummy!
  let sqliteBytes: Uint8Array | undefined = unzipped['collection.anki21'];
  if (!sqliteBytes && unzipped['collection.anki2']) {
    sqliteBytes = unzipped['collection.anki2'];
  }

  if (!sqliteBytes) {
    if (unzipped['collection.anki21b']) {
      throw new Error(
        'Bộ thẻ này sử dụng định dạng nén Zstandard mới của Anki 2.1b. Vui lòng xuất lại từ Anki với tùy chọn "Support older Anki versions" để nạp.'
      );
    }
    throw new Error('Không tìm thấy tệp cơ sở dữ liệu collection.anki21 hoặc collection.anki2 bên trong gói .apkg.');
  }

  onProgress?.(35, 'Đang khởi động bộ xử lý SQLite (WebAssembly)...');
  // 3. Khởi tạo sql.js với WebAssembly an toàn (loại bỏ lỗi HTML fallback)
  const SQL = await getSqlJsInstance();

  onProgress?.(50, 'Đang phân tích cấu trúc bộ thẻ...');
  const db = new SQL.Database(sqliteBytes);

  // 4. Lấy thông tin Tên Bộ Thẻ từ bảng `col`
  let deckName = file.name.replace(/\.apkg$/i, '').replace(/_/g, ' ');
  const deckId = `deck_${Date.now()}`;

  try {
    const colRes = db.exec('SELECT decks FROM col LIMIT 1;');
    if (colRes.length > 0 && colRes[0].values.length > 0) {
      const decksJson = colRes[0].values[0][0] as string;
      const decksObj = JSON.parse(decksJson);

      // Tìm deck có tên thực sự (khác với deck mặc định "1" - "Default")
      const deckKeys = Object.keys(decksObj).filter((k) => k !== '1');
      if (deckKeys.length > 0) {
        const targetDeck = decksObj[deckKeys[0]];
        if (targetDeck && targetDeck.name) {
          deckName = targetDeck.name.replace(/::/g, ' - ');
        }
      } else if (decksObj['1'] && decksObj['1'].name) {
        deckName = decksObj['1'].name;
      }
    }
  } catch (err) {
    console.warn('Không đọc được metadata deck từ col:', err);
  }

  onProgress?.(65, 'Đang trích xuất danh sách thẻ...');
  // 5. Đọc danh sách ghi chú (notes) từ SQLite
  const notesRes = db.exec('SELECT id, flds FROM notes;');
  const cards: AnkiCard[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  const neededMediaFilenames = new Set<string>();

  if (notesRes.length > 0 && notesRes[0].values.length > 0) {
    const rows = notesRes[0].values;

    rows.forEach((row, index) => {
      const noteId = String(row[0]);
      const fldsRaw = String(row[1] || '');
      const fields = fldsRaw.split('\x1f');

      // Mặt trước: Field 0 (Từ khóa, câu hỏi)
      const frontRaw = fields[0] || '';
      const frontParsed = cleanAnkiField(frontRaw);

      // Mặt sau: Ghép các trường còn lại (Định nghĩa, ví dụ minh họa, phiên âm)
      const backParts: string[] = [];
      const collectedAudio: string[] = [...frontParsed.audioNames];
      const collectedImages: string[] = [...frontParsed.imageNames];

      for (let i = 1; i < fields.length; i++) {
        const fieldParsed = cleanAnkiField(fields[i]);
        if (fieldParsed.cleanText) {
          backParts.push(fieldParsed.cleanText);
        }
        collectedAudio.push(...fieldParsed.audioNames);
        collectedImages.push(...fieldParsed.imageNames);
      }

      // Đưa các file media vào danh sách cần trích xuất
      collectedAudio.forEach((name) => neededMediaFilenames.add(name));
      collectedImages.forEach((name) => neededMediaFilenames.add(name));

      const backRaw = backParts.join('<hr class="my-2 border-border-subtle" />');

      cards.push({
        id: `card_${deckId}_${index + 1}`,
        deckId,
        noteId,
        front: frontParsed.cleanText || frontRaw,
        back: backRaw || '(Không có nội dung mặt sau)',
        audioName: collectedAudio[0] || undefined,
        imageName: collectedImages[0] || undefined,
        dueDate: todayStr,
        interval: 0,
        reps: 0,
        lapses: 0,
        state: 'new'
      });
    });
  }

  db.close();

  onProgress?.(80, 'Đang trích xuất tệp âm thanh và hình ảnh...');
  // 6. Đọc tệp map `media` trong ZIP
  const mediaItems: AnkiMediaItem[] = [];
  const mediaFileBytes = unzipped['media'];

  if (mediaFileBytes) {
    try {
      const mediaJsonStr = new TextDecoder().decode(mediaFileBytes);
      const mediaMap: Record<string, string> = JSON.parse(mediaJsonStr);

      // Đảo ngược map để tra cứu: tên file -> số thứ tự trong zip
      const reverseMap: Record<string, string> = {};
      for (const [key, val] of Object.entries(mediaMap)) {
        reverseMap[val] = key;
      }

      // Trích xuất các media blob được tham chiếu bởi các thẻ
      for (const filename of neededMediaFilenames) {
        const zipKey = reverseMap[filename];
        if (zipKey && unzipped[zipKey]) {
          const itemBytes = unzipped[zipKey];
          const mimeType = getMimeType(filename);
          // Ép kiểu sang ArrayBuffer để tương thích chặt chẽ với BlobPart
          const blob = new Blob([itemBytes.buffer as ArrayBuffer], { type: mimeType });

          mediaItems.push({
            id: filename,
            deckId,
            mimeType,
            blob
          });
        }
      }
    } catch (err) {
      console.warn('Lỗi khi đọc file mapping media:', err);
    }
  }

  onProgress?.(100, 'Bóc tách dữ liệu hoàn tất!');

  const deck: AnkiDeck = {
    id: deckId,
    title: deckName,
    cardCount: cards.length,
    createdAt: new Date().toISOString()
  };

  return { deck, cards, mediaItems };
}
