---
version: alpha
name: Botanical Zen
description: A biophilic, tranquil design system for habit tracking and personal self-development, inspired by the steady growth of nature and the 1% philosophy of Atomic Habits.
colors:
  canvas: "#F8F7F2"
  canvas-subtle: "#F2EFE9"
  surface: "#FFFFFF"
  surface-soft: "#FAFCFA"
  surface-container: "#F2EFE9"
  surface-container-high: "#EAE6DC"
  border: "#E6E2D8"
  border-subtle: "#EEEAE0"
  border-focus: "#205A42"
  primary: "#205A42"
  on-primary: "#FFFFFF"
  primary-hover: "#184432"
  primary-container: "#E4EFE9"
  on-primary-container: "#174633"
  text-primary: "#1C2621"
  text-secondary: "#5E6D66"
  text-tertiary: "#8E9E96"
  accent-sage: "#528B70"
  accent-clay: "#C97255"
  accent-amber: "#D89839"
  accent-sprout: "#E4EFE9"
  accent-sprout-dark: "#2F6A4F"
  success: "#205A42"
  error: "#BA3D2A"
typography:
  display-quote:
    fontFamily: Newsreader
    fontSize: 1.625rem
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: -0.01em
  h1:
    fontFamily: Newsreader
    fontSize: 1.875rem
    fontWeight: 600
    lineHeight: 1.25
  h2:
    fontFamily: Newsreader
    fontSize: 1.375rem
    fontWeight: 600
    lineHeight: 1.3
  h3:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.4
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.0625rem
    fontWeight: 400
    lineHeight: 1.55
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.8125rem
    fontWeight: 500
    lineHeight: 1.4
  label-tag:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.02em
  mono-stat:
    fontFamily: JetBrains Mono
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.2
  mono-streak:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: 600
    lineHeight: 1
rounded:
  xs: 4px
  sm: 8px
  md: 14px
  lg: 20px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-max: 760px
components:
  identity-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  habit-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: 16px 20px
  habit-card-completed:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.text-tertiary}"
  check-circle:
    size: 32px
    rounded: "{rounded.full}"
    borderColor: "{colors.border}"
  check-circle-completed:
    backgroundColor: "{colors.primary}"
    borderColor: "{colors.primary}"
  tag-pill:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
  streak-badge:
    backgroundColor: "#FEF6EC"
    textColor: "{colors.accent-amber}"
    rounded: "{rounded.sm}"
---

# Botanical Zen & Organic Growth Design System

## Overview
**Botanical Zen** là hệ thống thiết kế hòa trộn giữa vẻ đẹp tĩnh tại của thiên nhiên (Biophilic Minimalism) và nghệ thuật chế tác sổ tay thủ công cao cấp.

Lấy cảm hứng từ triết lý cốt lõi của *Atomic Habits* ("Mỗi thói quen nhỏ như một hạt mầm, kiên trì tích lũy 1% mỗi ngày sẽ lớn mạnh thành cây đại thụ"), giao diện mang đến một không gian số tĩnh lặng, giảm thiểu tối đa căng thẳng và cảm giác tội lỗi (no-guilt tracking). Người dùng bước vào ứng dụng không phải để đối mặt với một bảng việc cần làm khô khan hay áp lực deadline, mà để chăm sóc khu vườn tâm thức và vun bồi bản sắc cá nhân.

### Tinh thần & Nguyên tắc Cảm xúc
- **Không áp lực (Tranquil & Non-punitive):** Không sử dụng màu đỏ rực cảnh báo hay âm báo gắt gỏng khi lỡ quên một thói quen. Thay vào đó, khuyến khích phục hồi nhẹ nhàng bằng quy tắc *"Never Miss Twice"*.
- **Tập trung vào Danh tính (Identity-first):** Mọi thói quen đều hướng đến việc củng cố câu khẳng định: *"Tôi muốn trở thành con người như thế nào?"*.
- **Xúc giác hữu cơ (Tactile Organic Quality):** Bề mặt gợi nhớ chất liệu giấy lụa Alabaster ấm áp, kết hợp các nét vẽ mực rêu sẫm và điểm xuyết đất nung nhạt.

---

## Colors
Hệ màu được tuyển chọn từ sắc thái cây cỏ, đất mẹ và ánh nắng sớm mai, triệt để tránh màu trắng tinh khiết (`#FFFFFF` gắt) trên nền lớn và màu đen tuyệt đối (`#000000`).

- **Canvas ({colors.canvas} - `#F8F7F2`):** Nền chính mô phỏng giấy sợi tự nhiên (Alabaster Linen), êm dịu cho mắt ngay cả khi nhìn vào ban đêm hoặc buổi sáng sớm.
- **Deep Cypress Ink ({colors.primary} - `#205A42`):** Mực xanh bách sẫm mang lại sự tĩnh tại, được dùng cho các tiêu đề chính, nút hành động then chốt và trạng thái check-in thành công.
- **Text Primary ({colors.text-primary} - `#1C2621`):** Màu mực đen pha sắc rêu rừng, thay thế hoàn toàn đen thuần để giữ cho văn bản sắc nét nhưng mềm mại.
- **Sage Leaf Accent ({colors.accent-sage} - `#528B70`):** Sắc xanh lá xô thơm dịu dàng, đại diện cho quá trình sinh trưởng và trạng thái hover/focus.
- **Terracotta Clay ({colors.accent-clay} - `#C97255`):** Màu đất nung ấm cúng, dành riêng cho các trích dẫn triết lý, phản tư nội tâm và các điểm chạm cảm xúc.
- **Warm Amber Ochre ({colors.accent-amber} - `#D89839`):** Ánh hoàng kim ấm áp của mật ong rừng, sử dụng cho huy hiệu chuỗi ngày kiên trì (streak) và thành quả tích lũy.
- **Sprout Mist ({colors.accent-sprout} - `#E4EFE9`):** Màu mầm non mới nhú, dùng làm nền cho các thẻ danh tính hoặc nhãn trạng thái đặc biệt.

---

## Typography
Sự kết hợp hài hòa giữa chất thơ học thuật của font Serif và tính trực quan, hiện đại của font Sans-serif:

- **Phông Tiêu đề & Trích dẫn — Newsreader:** Font serif đương đại tinh tế, giàu tính văn học. Dành cho câu khẳng định danh tính (`display-quote`), tiêu đề các nghi thức hàng ngày (`h1`, `h2`) và lời khuyên phản tư.
- **Phông Giao diện & Thao tác — Plus Jakarta Sans:** Font sans-serif tròn trịa, hiện đại với độ đọc cao. Dành cho nội dung tên thói quen, nhãn phân loại, mô tả và các nút bấm.
- **Phông Số liệu & Đo lường — JetBrains Mono:** Phông monospace kỹ thuật chuẩn xác, dành riêng cho tỉ lệ phần trăm sinh trưởng, số đo chuỗi ngày (streak count) và thời gian thực hiện.

---

## Layout
Bố cục ứng dụng được xây dựng theo mô hình **Master-Detail Responsive Workspace** (lấy cảm hứng từ Flomo / FlareMo) kết hợp dòng đọc tự nhiên:

- **Bản Desktop (Màn hình rộng ≥ 768px):**
  - **Sidebar Cố định bên trái (`w-[260px]` - `w-[280px]`):** Chứa Logo thương hiệu, trạng thái đồng bộ, 3 chỉ số lớn (Thói quen, Kỷ lục Streak, Tỉ lệ hôm nay), Ma trận ô vuông Khu vườn (Garden Heatmap mini), Menu điều hướng có thanh chỉ báo bên trái (`border-l-3 border-primary`), và danh sách thẻ `#Tags`.
  - **Khu vực Nội dung Chính (Main Feed Stream - tối đa 760px):** Thanh tìm kiếm & Breadcrumb, Hộp ghi chép phản tư nhanh (Quick Jot Box), và Dòng thời gian các thói quen phân nhóm theo nhịp sinh học.
- **Bản Mobile (Màn hình điện thoại < 768px):**
  - Sidebar được thu gọn thành **Off-canvas Drawer trượt từ bên trái ra** khi bấm nút menu Hamburger trên Header, có lớp nền mờ backdrop-blur và nút đóng `X`.
  - Giao diện chính ưu tiên 1 chạm (1-tap check-in) và hỗ trợ vùng đệm an toàn iOS (`pb-safe`).

---

## Iconography (Hệ Thống Biểu Tượng Chuẩn Hóa)
Để bảo đảm tính thẩm mỹ cao cấp, đồng bộ và chuyên nghiệp trên mọi thiết bị (iOS, Android, Windows, macOS):

- **Thư viện duy nhất:** Toàn bộ biểu tượng trong giao diện **BẮT BUỘC sử dụng thư viện Lucide React (`lucide-react`)** hoặc SVG vector chuẩn hóa (viewBox `0 0 24 24`, `stroke-width: 1.75px` đến `2px`, `strokeLinecap: round`, `strokeLinejoin: round`).
- **CẤM DÙNG EMOJI MẶC ĐỊNH HỆ ĐIỀU HÀNH:** Tuyệt đối không sử dụng raw emoji của hệ điều hành (như 🌅, 🌿, 🌙, 🔥, 🍃, 🌱) làm biểu tượng trên các nút bấm, menu điều hướng, nhãn phân loại hoặc header cards. Emojis hiển thị sai lệch sắc thái giữa các hệ điều hành, làm mất đi vẻ thanh lịch tĩnh tại của phong cách Botanical Zen.
- **Bảng ánh xạ biểu tượng chuẩn (Semantic Icon Mapping):**
  - *Mầm sinh trưởng & Bản sắc:* `<Sprout />` (kích thước 16-20px, màu `{colors.primary}`)
  - *Nghi thức Rạng Đông (Morning):* `<Sunrise />` hoặc `<SunMedium />` (màu `{colors.accent-amber}`)
  - *Khối Tập Trung (Midday):* `<Compass />` hoặc `<Target />` (màu `{colors.accent-sage}`)
  - *Lắng Đọng Hoàng Hôn (Evening):* `<Moon />` (màu `{colors.primary}`)
  - *Chuỗi ngày kiên trì (Streak):* `<Flame />` (màu `{colors.accent-amber}`)
  - *Quy tắc 2 phút (Micro-habit):* `<Zap />` (màu `{colors.accent-clay}`)
  - *Nhật ký Phản tư & Bài học:* `<PenLine />` hoặc `<BookOpen />`
  - *Bản sắc khẳng định:* `<Sparkles />` (màu `{colors.primary}`)
  - *Danh mục (Tags):* `<Hash />` (màu `{colors.text-tertiary}`)
  - *Phục hồi nhân ái (Never Miss Twice):* `<HeartHandshake />` hoặc `<ShieldCheck />`
  - *Điều hướng & Thao tác:* `<Search />`, `<Settings />`, `<Menu />`, `<X />`, `<Plus />`, `<Check />`, `<Trash2 />`, `<Send />`.

---

## Elevation & Depth
Hệ thống thiết kế theo đuổi triết lý **Flat Organic Layering**, hạn chế bóng đổ nặng nề:

- **Bề mặt (Surfaces):** Thẻ thông tin nằm trên nền Canvas với độ chênh lệch màu tinh tế (`#FFFFFF` trên `#F8F7F2`).
- **Đường viền (Hairline Borders):** Sử dụng viền siêu mỏng `1px solid {colors.border}` (`#E6E2D8`) tạo cảm giác ranh giới rõ ràng nhưng không thô cứng.
- **Bóng đổ (Organic Shadows):** Bóng mờ khuếch tán diện rộng nhưng độ mờ rất thấp: `0 4px 20px -4px rgba(28, 38, 33, 0.05)`, mang lại cảm giác tờ giấy đặt nhẹ trên mặt bàn gỗ.

---

## Shapes
- Bo góc thẻ lớn (`identity-card`): `{rounded.lg}` (20px).
- Bo góc thẻ thói quen (`habit-card`): `{rounded.md}` (14px).
- Bo góc huy hiệu & nhãn nhỏ (`tag-pill`): `{rounded.sm}` (8px).
- Nút bấm & Vòng tròn Check-in: `{rounded.full}` (hình tròn hoàn hảo 9999px).

---

## Components

### 1. Sidebar / Drawer Component (Bản Đồ Điều Hướng & Chỉ Số)
- Tích hợp 3 khối số liệu đo lường lớn: Số thói quen, Kỷ lục chuỗi, Tỉ lệ sinh trưởng hôm nay.
- Lưới ma trận đóng góp nhỏ gọn (Mini Garden Heatmap) đặt trực quan ngay dưới các chỉ số.
- Các liên kết điều hướng có thanh chỉ báo dọc bên trái (`border-l-3`) khi active.
- Danh mục Tags có ký tự `<Hash />` dẫn đầu.

### 2. Quick Jot Box (Khung Phản Tư 1 Dòng Nhanh)
- Nằm ở đầu dòng thời gian, thiết kế như một tấm thẻ giấy ấm Alabaster.
- Hỗ trợ gõ nhanh 1 dòng suy ngẫm / điều biết ơn trong ngày, gắn thẻ danh mục và nút gửi với icon `<Send />` màu Cypress Ink.

### 3. Identity Card (Thẻ Định Hình Bản Sắc)
Thẻ nổi bật dẫn đường cho cả ngày:
- Huy hiệu loại bản sắc với icon `<Sparkles />`.
- Tiêu đề trích dẫn lớn viết bằng font `Newsreader` in nghiêng nhẹ.
- Hỗ trợ chỉnh sửa nhanh câu tuyên ngôn danh tính.

### 4. Habit Card (Thẻ Thói Quen Tương Tác)
- Vòng tròn check-in bên trái đường kính 32px. Khi hoàn thành: chuyển sang màu xanh Cypress `{colors.primary}`, icon `<Check />` trắng hiện lên với hiệu ứng phóng đại nhẹ nhàng (scale spring).
- Tên thói quen gạch ngang tinh tế và mờ xuống `{colors.text-tertiary}` khi hoàn tất.
- Nhãn phân loại mềm mại đi kèm icon vector tương ứng.
- Huy hiệu chuỗi kiên trì hiển thị bên phải: `<Flame /> 18d` màu vàng ấm Amber.

### 5. Never Miss Twice Card (Thẻ Phục Hồi Nhân Ái)
- Khung viền nét đứt màu nâu gốm nhạt, nền ấm `#F4EFEB` cùng icon `<HeartHandshake />` hoặc `<ShieldCheck />`.
- Nhắc nhở người dùng tha thứ cho bản thân nếu lỡ một ngày, nhưng cương quyết quay lại vào ngày hôm sau.

---

## Do's and Don'ts

### Do's (Nên làm)
- Luôn sử dụng icon vector từ thư viện **Lucide React** đồng nhất về nét vẽ (`1.75px` - `2px`).
- Luôn sử dụng ngôn từ tích cực, khích lệ và tập trung vào sự bền bỉ lâu dài.
- Luôn kiểm tra độ tương phản văn bản theo tiêu chuẩn WCAG AA đối với mọi sắc độ màu nền.
- Giữ hiệu ứng chuyển động (animations) ở mức tinh tế (200ms - 400ms ease), mang lại cảm giác hữu cơ, tự nhiên như chiếc lá khẽ lay.
- Sử dụng số liệu dạng `JetBrains Mono` để đảm bảo độ thẳng hàng khi hiển thị các chuỗi số hoặc thời gian.

### Don'ts (Không làm)
- **TUYỆT ĐỐI KHÔNG sử dụng raw emoji hệ điều hành** làm icon giao diện trong ứng dụng.
- Không dùng màu đỏ tươi cảnh báo lỗi kiểu hệ thống (`#FF0000`). Nếu cần cảnh báo, dùng sắc son đất Terracotta hoặc Vermilion trầm.
- Không áp dụng giao diện kính bóng bẩy (Glassmorphism) hay đèn neon dạ quang vào phong cách này, vì sẽ phá vỡ cảm giác mộc mạc và tĩnh lặng của thiên nhiên.
- Không xóa sạch chuỗi ngày tích lũy của người dùng về số 0 một cách tàn nhẫn khi họ lỡ quên 1 ngày; hãy kích hoạt cơ chế phục hồi tích cực.
- Không đặt các nút bấm góc nhọn 90 độ; tất cả thành phần phải có độ bo góc tối thiểu từ 8px trở lên.
