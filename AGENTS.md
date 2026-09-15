# Hướng Dẫn Dành Cho Coding Agents (AGENTS.md)

Tài liệu này định nghĩa các nguyên tắc hoạt động, quy chuẩn kiến trúc, môi trường thực thi và tiêu chuẩn chất lượng dành cho tất cả AI Coding Agents (Antigravity, Gemini, Cursor, Copilot...) khi tham gia phát triển và bảo trì repository **Atomic Growth**.

---

## 1. Tổng Quan & Tầm Nhìn Dự Án (Project Vision)

* **Tên dự án:** Atomic Growth — Habit Tracker & Self-Development Hub.
* **Mục tiêu cốt lõi:** Ứng dụng xây dựng thói quen và phát triển bản thân bền vững, ứng dụng triệt để tâm lý học hành vi từ cuốn sách kinh điển **Atomic Habits** của tác giả James Clear.
* **Các trụ cột phương pháp luận (Core Domain Logic):**
  1. **Tập trung vào Bản sắc (Identity-first Habits):** Thói quen bắt đầu từ câu hỏi *"Tôi muốn trở thành người như thế nào?"* chứ không chỉ là bảng đếm số vô hồn.
  2. **4 Quy luật Thay đổi Hành vi:**
     * *Make it Obvious (Rõ ràng):* Habit Stacking, chia nhóm theo nhịp sinh học (Morning / Midday / Evening).
     * *Make it Attractive (Hấp dẫn):* Cặp đôi cám dỗ, tạo cảm giác mong đợi tích cực.
     * *Make it Easy (Dễ dàng):* Quy tắc 2 phút (2-minute rule), 1-tap check-in, tối giản rào cản.
     * *Make it Satisfying (Thỏa mãn):* Trực quan hóa tiến độ (Garden Heatmap), củng cố cảm giác thành tựu.
  3. **Quy tắc "Never Miss Twice":** Tuyệt đối không xóa sạch chuỗi ngày về số 0 khi người dùng lỡ quên 1 ngày; luôn kích hoạt cơ chế hồi phục nhân ái (compassionate recovery).

---

## 2. Kim Chỉ Nam Thiết Kế (Design System Authority)

* **Nguồn chân lý duy nhất (Single Source of Truth):** Toàn bộ giao diện người dùng (UI), mã màu, khoảng cách, bo góc và phông chữ **PHẢI tuân thủ nghiêm ngặt theo đặc tả [DESIGN.md](./DESIGN.md)** (*Phong cách Botanical Zen & Organic Growth*).
* **Màu sắc cốt lõi:**
  * Nền Canvas: `#F8F7F2` (Alabaster Linen) — *Không dùng màu trắng tinh gắt mắt `#FFFFFF` làm nền chính.*
  * Mực chính (Primary): `#205A42` (Deep Cypress Ink).
  * Chữ chính: `#1C2621` (Rêu than sẫm) — *Không dùng `#000000` thuần.*
  * Nhấn sinh trưởng: `#528B70` (Sage Green).
  * Nhấn đất nung: `#C97255` (Terracotta Clay).
  * Nhấn chuỗi kiên trì: `#D89839` (Warm Amber Ochre).
* **Typography:**
  * Tiêu đề & Trích dẫn danh tính: `Newsreader` (Serif).
  * Nội dung & Thao tác UI: `Plus Jakarta Sans` (Sans-serif).
  * Đo lường, Tỉ lệ %, Chuỗi Streak: `JetBrains Mono` (Monospace).
* **Trải nghiệm mẫu:** Tham khảo file [demo/1-botanical-zen.html](./demo/1-botanical-zen.html) và [demo/index.html](./demo/index.html).

---

## 3. Quy Tắc Giao Tiếp & Quy Chuẩn Code (Coding Standards)

1. **Ngôn ngữ:**
   * Luôn giao tiếp, giải thích và lập kế hoạch (plan) bằng **Tiếng Việt**.
   * Toàn bộ comment trong mã nguồn phải viết bằng **Tiếng Việt** rõ ràng, giải thích rõ "Tại sao làm vậy" (Why) thay vì chỉ mô tả lại cú pháp (What).
2. **Chất lượng mã nguồn (Clean Code & SOLID):**
   * Tuân thủ các nguyên tắc **SOLID**:
     * *Single Responsibility:* Mỗi component/service chỉ chịu trách nhiệm cho một chức năng duy nhất.
     * *Open/Closed:* Dễ dàng mở rộng thêm loại thói quen/logic mới mà không sửa đổi code lõi.
     * *Dependency Inversion:* Các module tầng cao không phụ thuộc trực tiếp vào chi tiết tầng thấp (sử dụng interfaces/contracts).
   * Viết code sạch, đặt tên biến và hàm có ý nghĩa theo quy ước chuẩn.
3. **Tương tác & Xác nhận:**
   * Không tự ý suy đoán yêu cầu chưa rõ ràng; chủ động đặt câu hỏi để làm rõ intent của người dùng.
   * Khi cần chạy hoặc đề xuất một lệnh command làm thay đổi hệ thống, phải gửi kèm giải thích mục đích và tác động của lệnh đó.

---

## 4. Cấu Hình Môi Trường & Thực Thi Lệnh (Environment Setup)

* **Hệ điều hành:** Antigravity đang chạy trên Windows.
* **WSL2 (Windows Subsystem for Linux):** Toàn bộ các công cụ phát triển (Node.js, npm, Java, Docker, Git) được cài đặt và vận hành trong WSL.
* **Cú pháp thực thi bắt buộc:**
  * Khi chạy các lệnh `node`, `npm`, `npx`, `java`, `docker`, luôn sử dụng cú pháp:
    ```bash
    wsl bash -ic "<command>"
    ```
    *Ví dụ:* `wsl bash -ic "npm run dev"`, `wsl bash -ic "node -v"`.
    *(Mục đích: nạp đầy đủ cấu hình biến môi trường `.bashrc` của WSL, tránh lỗi `command not found`).*
* **Môi trường Python:** Máy host Windows **KHÔNG** cài đặt Python. Nếu cần viết script tự động hóa, luôn dùng Node.js thông qua WSL (ví dụ: `wsl bash -ic "node script.js"`).
* **Phiên bản công cụ có sẵn trong WSL:**
  * Node.js: `v24.18.0`
  * NPM: `11.16.0`
  * Java: OpenJDK 17 (`17.0.15`)
* **Docker:** Khi cần dùng Docker trong WSL, cần kiểm tra và khởi động service trước: `wsl bash -ic "service docker start"`.

---

## 5. Cấu Trúc Thư Mục Chuẩn (Project Structure)

```
Atomic-growth/
├── .agents/                 # Cấu hình agents & skills mở rộng
├── demo/                    # Các trang demo HTML showcase 4 phong cách
│   ├── index.html           # Trung tâm chuyển đổi & so sánh thiết bị (Design Lab Hub)
│   ├── 1-botanical-zen.html # Bản mẫu Hướng 1 (Botanical Zen & Organic Growth)
│   ├── 2-neo-brutalism.html # Bản mẫu Hướng 2 (High-Performance Neo-Brutalism)
│   ├── 3-editorial-heritage.html # Bản mẫu Hướng 3 (Editorial Broadsheet)
│   └── 4-atmospheric-glass.html  # Bản mẫu Hướng 4 (Atmospheric Glass)
├── src/
│   ├── components/          # Các UI components tái sử dụng (HabitCard, Heatmap, Ring...)
│   ├── context/             # Quản lý trạng thái toàn cục (HabitState, UserProfile...)
│   ├── services/            # Xử lý lưu trữ dữ liệu (IndexedDB, LocalStorage, Sync...)
│   ├── styles/              # CSS tokens, theme variables kế thừa từ DESIGN.md
│   ├── types/               # Type definitions TypeScript (Habit, Log, Identity...)
│   └── utils/               # Hàm trợ giúp (tính streak, ngày tháng, định dạng số...)
├── public/                  # Static assets, favicon, manifest PWA
├── DESIGN.md                # Đặc tả hệ thống thiết kế chuẩn Google Labs
├── AGENTS.md                # Tài liệu quy chuẩn này
└── README.md                # Giới thiệu tổng quan dự án
```

---

## 6. Quy Trình Làm Việc Chuẩn (Agent Workflow)

Mỗi khi nhận một yêu cầu phát triển mới từ người dùng:
1. **Tra cứu Kiến thức & Quy chuẩn:** Đọc kỹ `DESIGN.md` và `AGENTS.md` để đảm bảo nắm chắc phong cách và quy tắc kỹ thuật.
2. **Lập Kế Hoạch (Planning Mode):** Với các tính năng mở rộng hoặc thay đổi lớn, tạo `implementation_plan.md` để người dùng xét duyệt trước khi viết code.
3. **Thực thi & Tự kiểm thử (Execution & Verification):** Viết code sạch, có comment đầy đủ bằng Tiếng Việt; kiểm tra tính tương thích trên cả trình duyệt và các kích thước màn hình (Mobile/Desktop).
4. **Cập nhật Tài liệu:** Giữ cho tài liệu và mã nguồn luôn đồng bộ và phản ánh đúng thực tế.
