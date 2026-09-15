# 🌱 Atomic Growth

> **Habit Tracker & Self-Development Hub**  
> Ứng dụng xây dựng thói quen và phát triển bản thân bền vững theo phương pháp **Atomic Habits** (James Clear).

---

## 🎨 Hệ Thống Thiết Kế (Design System)

Dự án sử dụng ngôn ngữ thiết kế **Botanical Zen & Organic Growth**, tuân thủ nghiêm ngặt đặc tả định dạng **[DESIGN.md](./DESIGN.md)** của [Google Labs](https://github.com/google-labs-code/design.md).

* **Màu sắc chủ đạo:** Giấy Alabaster tự nhiên (`#F8F7F2`), Mực xanh Cypress (`#205A42`), Điểm nhấn Đất nung (`#C97255`) và Vàng hoàng kim (`#D89839`).
* **Typography:** `Newsreader` (Serif tiêu đề & danh tính) + `Plus Jakarta Sans` (Nội dung & giao diện) + `JetBrains Mono` (Số liệu & chuỗi ngày).
* **Trải nghiệm Demo tương tác:** Mở file [demo/index.html](./demo/index.html) trên trình duyệt để trải nghiệm trực tiếp 4 phong cách thiết kế trên các chế độ màn hình Mobile / Tablet / Desktop.

---

## 🤖 Dành Cho Coding Agents

Mọi AI Agent khi làm việc trong repository này cần đọc kỹ tài liệu **[AGENTS.md](./AGENTS.md)** để nắm rõ:
1. Môi trường phát triển (WSL2, Node v24, npm v11, lệnh `wsl bash -ic "<command>"`).
2. Tiêu chuẩn viết code (Clean Code, SOLID, comment bằng Tiếng Việt).
3. Logic nghiệp vụ cốt lõi (4 quy luật Atomic Habits, quy tắc *Never Miss Twice*, cấu trúc dữ liệu thói quen).

---

## 📂 Cấu Trúc Dự Án

* `DESIGN.md`: Đặc tả Design Tokens và Design Prose chuẩn Google Labs.
* `AGENTS.md`: Nguyên tắc kiến trúc và hướng dẫn dành cho AI Agents.
* `demo/`: Bộ 4 trang demo HTML tương tác trực quan.
* `src/`: Mã nguồn chính của ứng dụng.
* `public/`: Tài nguyên tĩnh và cấu hình PWA.
