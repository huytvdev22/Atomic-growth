/**
 * Service tích hợp Google Drive REST API v3
 * Quản lý sao lưu và khôi phục các bộ thẻ Anki (.apkg) theo cấu trúc thư mục mở rộng
 */

export interface DriveDeckItem {
  id: string;
  name: string;
  size: number;
  modifiedTime: string;
}

const APP_ROOT_FOLDER_NAME = 'Atomic Growth';
const ANKI_DECKS_SUBFOLDER_NAME = 'Anki Decks';
const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB per chunk (bội số của 256KB theo quy chuẩn Google Drive)

/**
 * Tìm hoặc tạo thư mục trên Google Drive
 */
async function getOrCreateFolder(
  token: string,
  folderName: string,
  parentFolderId?: string
): Promise<string> {
  let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  } else {
    query += ` and 'root' in parents`;
  }

  // 1. Tìm thư mục đã tồn tại
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!searchRes.ok) {
    throw new Error(`Lỗi tìm kiếm thư mục trên Google Drive: HTTP ${searchRes.status}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // 2. Tạo mới thư mục nếu chưa có
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : ['root']
    })
  });

  if (!createRes.ok) {
    throw new Error(`Lỗi tạo thư mục "${folderName}" trên Google Drive: HTTP ${createRes.status}`);
  }

  const createData = await createRes.json();
  return createData.id;
}

/**
 * Lấy cấu trúc thư mục phân cấp mở rộng trên Google Drive:
 * 📁 Atomic Growth/
 *    └── 📁 Anki Decks/
 */
async function getAnkiDecksFolderId(token: string): Promise<string> {
  const rootId = await getOrCreateFolder(token, APP_ROOT_FOLDER_NAME);
  const ankiFolderId = await getOrCreateFolder(token, ANKI_DECKS_SUBFOLDER_NAME, rootId);
  return ankiFolderId;
}

export const googleDriveService = {
  /**
   * Tải tệp .apkg lên Google Drive bằng giao thức Resumable Upload
   * Hỗ trợ tải các file dung lượng lớn (37MB - 170MB+) theo từng khối 4MB
   */
  async uploadDeckFile(
    token: string,
    file: File | Blob,
    filename: string,
    onProgress?: (percent: number, message: string) => void
  ): Promise<string> {
    onProgress?.(5, 'Đang chuẩn bị thư mục trên Google Drive...');
    const folderId = await getAnkiDecksFolderId(token);

    onProgress?.(15, 'Đang khởi tạo phiên tải lên Resumable Session...');
    // 1. Khởi tạo Resumable Upload Session
    const initRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': 'application/octet-stream',
          'X-Upload-Content-Length': String(file.size)
        },
        body: JSON.stringify({
          name: filename,
          parents: [folderId]
        })
      }
    );

    if (!initRes.ok) {
      throw new Error(`Lỗi khởi tạo phiên upload Google Drive: HTTP ${initRes.status}`);
    }

    const uploadUrl = initRes.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('Không nhận được đường dẫn Upload Session từ Google Drive');
    }

    // 2. Upload dữ liệu từng chunk 4MB
    const totalSize = file.size;
    let offset = 0;
    let fileId = '';

    while (offset < totalSize) {
      const chunkEnd = Math.min(offset + CHUNK_SIZE, totalSize);
      const chunkBlob = file.slice(offset, chunkEnd);
      const contentLength = chunkEnd - offset;

      const percent = Math.round((chunkEnd / totalSize) * 80) + 15;
      onProgress?.(
        percent,
        `Đang sao lưu lên Google Drive... (${Math.round(chunkEnd / 1024 / 1024)}MB / ${Math.round(totalSize / 1024 / 1024)}MB)`
      );

      const chunkRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes ${offset}-${chunkEnd - 1}/${totalSize}`,
          'Content-Length': String(contentLength)
        },
        body: chunkBlob
      });

      if (chunkRes.status === 200 || chunkRes.status === 201) {
        // Tải xong hoàn tất
        const resultJson = await chunkRes.json();
        fileId = resultJson.id;
        break;
      } else if (chunkRes.status === 308) {
        // Khối đã nhận thành công, tiếp tục khối tiếp theo
        offset = chunkEnd;
      } else {
        throw new Error(`Lỗi upload khối dữ liệu tới Google Drive: HTTP ${chunkRes.status}`);
      }
    }

    onProgress?.(100, 'Sao lưu lên Google Drive hoàn tất!');
    return fileId;
  },

  /**
   * Lấy danh sách các bộ thẻ Anki đã sao lưu trong thư mục "Atomic Growth/Anki Decks"
   */
  async listDecksOnDrive(token: string): Promise<DriveDeckItem[]> {
    const folderId = await getAnkiDecksFolderId(token);
    const query = `'${folderId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&fields=files(id,name,size,modifiedTime)&orderBy=modifiedTime desc`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error(`Lỗi lấy danh sách tệp từ Google Drive: HTTP ${res.status}`);
    }

    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      size: Number(f.size) || 0,
      modifiedTime: f.modifiedTime || ''
    }));
  },

  /**
   * Tải bộ thẻ từ Google Drive về thiết bị dạng Blob
   */
  async downloadDeckFile(
    token: string,
    fileId: string,
    onProgress?: (percent: number, message: string) => void
  ): Promise<Blob> {
    onProgress?.(10, 'Đang kết nối Google Drive...');
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error(`Lỗi tải tệp từ Google Drive: HTTP ${res.status}`);
    }

    const contentLength = Number(res.headers.get('Content-Length')) || 0;

    // Đọc stream để cập nhật thanh tiến trình % mượt mà
    if (res.body && contentLength > 0) {
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          receivedBytes += value.length;
          const percent = Math.min(95, Math.round((receivedBytes / contentLength) * 85) + 10);
          onProgress?.(
            percent,
            `Đang tải về máy... (${Math.round(receivedBytes / 1024 / 1024)}MB / ${Math.round(contentLength / 1024 / 1024)}MB)`
          );
        }
      }

      onProgress?.(100, 'Tải tệp hoàn tất!');
      return new Blob(chunks as unknown as BlobPart[], { type: 'application/octet-stream' });
    }

    // Fallback nếu không có stream content-length
    const blob = await res.blob();
    onProgress?.(100, 'Tải tệp hoàn tất!');
    return blob;
  },

  /**
   * Xóa vĩnh viễn tệp sao lưu khỏi Google Drive để giải phóng dung lượng
   */
  async deleteDeckFile(token: string, fileId: string): Promise<void> {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok && res.status !== 204) {
      throw new Error(`Lỗi xóa tệp trên Google Drive: HTTP ${res.status}`);
    }
  }
};
