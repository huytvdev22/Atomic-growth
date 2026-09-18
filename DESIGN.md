---
version: 2.0.0
name: Modern Botanical Zen (Elera-Inspired Aesthetic)
description: Hệ thống thiết kế tối giản tĩnh tại kết hợp phong cách SaaS chuẩn mực cao cấp (lấy cảm hứng từ bộ thiết kế Elera UI), mang lại trải nghiệm thiền định, tinh tế, tràn đầy sinh khí sinh trưởng và tập trung tối đa vào thói quen cốt lõi.
colors:
  # Backgrounds & Canvas (Cấu trúc phân tầng lớp nền)
  backdrop: "#EAE8E3" # Nền xám ấm trung tính bên ngoài cửa sổ app
  canvas: "#F6F7F5" # Nền chính của App Window (Alabaster Off-white êm dịu)
  canvas-subtle: "#EFF1ED" # Nền phụ, hover background hoặc các container thứ cấp
  surface: "#FFFFFF" # Nền card trắng tinh khiết, nổi nhẹ
  surface-soft: "#FAFBFA" # Nền phụ mềm cho các khối lồng nhẹ hoặc ô nhập liệu
  surface-container: "#F0F2EE" # Nền cột nhịp sinh học / phân nhóm nhẹ

  # Đường viền & Phân cách (Hairline Borders)
  border: "#E7EAE4" # Viền mảnh siêu nhẹ 1px cho card và phân cách
  border-subtle: "#F1F3EE" # Viền mờ cho các thành phần thứ cấp
  border-focus: "#60B647" # Viền khi focus/hover kích hoạt

  # Màu thương hiệu & Sinh trưởng (Primary & Sprout Green)
  primary: "#1C4E3A" # Xanh bách sẫm sâu lắng (Deep Cypress Ink) - dùng cho text thương hiệu, nút CTA tối quan trọng
  primary-light: "#256B50" # Tone bách sáng hơn khi hover
  accent-sprout: "#6DC85A" # Xanh mầm tươi (Fresh Sprout Green) - điểm nhấn check-in, active tab, tăng sinh khí
  accent-sprout-soft: "#EAF7E6" # Nền pastel xanh mầm cho badge, chip trạng thái tích cực
  on-accent-sprout: "#184E1A" # Màu chữ trên nền mầm tươi

  # Màu chữ & Tương phản (Typography Inks)
  text-primary: "#19241E" # Rêu than sẫm (Charcoal Moss) - chữ chính sắc nét nhưng dịu mắt
  text-secondary: "#5C6C63" # Xám rêu trung tính - mô tả phụ, nhãn thời gian
  text-tertiary: "#96A59D" # Xám sáng - placeholder, trạng thái hoàn thành mờ
  text-quaternary: "#B8C4BD" # Icon inactive, đường ray tiến độ

  # Màu ngữ nghĩa Pastel (Elera Soft Pastel Semantics)
  semantic-green: "#5CB85C" # Tích cực / Hoàn thành / Chuỗi tăng
  semantic-green-bg: "#ECF8ED"
  semantic-amber: "#EAA63B" # Ngọn lửa chuỗi Streak / Đang chờ / Cần chú ý
  semantic-amber-bg: "#FEF7EB"
  semantic-terracotta: "#DE6B48" # Cảnh báo Never Miss Twice / Thói quen lỡ
  semantic-terracotta-bg: "#FDF2EE"
  semantic-sky: "#4B88E4" # Gợi ý ngữ cảnh / Quy tắc 2 phút / Trợ lý AI
  semantic-sky-bg: "#EEF4FD"
  semantic-lilac: "#8A68D5" # Phản tư nội tâm / Chiều sâu nhận thức
  semantic-lilac-bg: "#F4F0FC"

  # Dark Theme Accent (Dành riêng cho Obsidian Matrix Calendar)
  dark-surface: "#242826" # Nền than đá cao cấp cho widget thống kê đặc biệt
  dark-surface-hover: "#2F3532"
  dark-text: "#F2F5F3"
  dark-text-subtle: "#7E8A83"

typography:
  zen-quote:
    fontFamily: Newsreader
    fontSize: 1.125rem
    fontWeight: 400
    fontStyle: italic
    lineHeight: 1.45
  greeting-h1:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.02em
  h1:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.015em
  h2:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.3
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.9375rem
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.8125rem
    fontWeight: 400
    lineHeight: 1.4
  pill-label:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.01em
  mono-stat:
    fontFamily: JetBrains Mono
    fontSize: 1.375rem
    fontWeight: 600
    lineHeight: 1.2
  mono-streak:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: 600
    lineHeight: 1

rounded:
  xs: 4px
  sm: 6px
  md: 10px
  lg: 14px
  xl: 18px
  2xl: 24px
  app-frame: 28px # Bo góc khung cửa sổ ứng dụng Elera
  full: 9999px # Bo tròn dạng Pill cho buttons, tabs, search, badges

shadows:
  window: "0 24px 64px -12px rgba(28, 46, 36, 0.08), 0 8px 24px -4px rgba(28, 46, 36, 0.04)"
  card: "0 1px 3px rgba(25, 36, 30, 0.02), 0 6px 16px -4px rgba(25, 36, 30, 0.03)"
  card-hover: "0 4px 12px rgba(25, 36, 30, 0.04), 0 12px 28px -6px rgba(25, 36, 30, 0.06)"
  pill-active: "0 2px 6px rgba(0, 0, 0, 0.08)"

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  container-max: 760px # Khổ xem tập trung cho Timeline

icons:
  library: "lucide-react"
  stroke-width:
    default: 2px
    delicate: 1.75px
    emphasis: 2.25px
  sizes:
    xs: 12px # w-3 h-3 (badge, micro-pill, button suffix)
    sm: 14px # w-3.5 h-3.5 (compact action, toast close)
    md: 16px # w-4 h-4 (button primary, input prefix, sidebar menu)
    lg: 20px # w-5 h-5 (card header, toast status, section title)
    xl: 24px # w-6 h-6 (modal hero icon, mobile nav active)
---

# Modern Botanical Zen Design System

> **Phiên bản 2.0.0** — Hệ thống thiết kế được nâng cấp toàn diện dựa trên triết lý cốt lõi của cuốn sách **Atomic Habits** (James Clear) và tinh hoa thẩm mỹ từ bộ giao diện **Elera SaaS** (hiện đại, tinh tế, bố cục thoáng đãng, phân tầng lớp kính và bo góc mềm mại).

---

## 1. Triết Lý Thiết Kế: Giao Điểm Giữa Tĩnh Tại & Sinh Lực (Zen Clarity & Fresh Growth)

Thay vì cảm giác gò bó hoặc có phần cổ điển của phiên bản trước, phong cách **Modern Botanical Zen** kết hợp hai yếu tố tưởng chừng đối lập nhưng hòa quyện tuyệt đối:
1. **Zen Clarity (Tĩnh Tại & Không Nhiễu Thị Giác):** Giữ vững không gian thở rộng rãi (*Whitespace*), 1 màn hình chỉ 1 tiêu điểm tối thượng, loại bỏ hoàn toàn viền dày, bóng đổ gắt và các khối chữ triết lý thừa thãi.
2. **Fresh Botanical Energy (Sinh Khí Mầm Non):** Kế thừa từ giao diện Elera, ứng dụng bổ sung sắc **Xanh Mầm Tươi (Fresh Sprout Green - `#6DC85A`)** làm điểm nhấn tương tác sinh động (active state, nút check-in 1 chạm, chuỗi ngày rực rỡ) trên nền **Canvas Alabaster êm dịu (`#F6F7F5`)**.

### 4 Quy Luật Atomic Habits Trong Ngôn Ngữ Thị Giác Mới
- **Make it Obvious (Rõ Ràng):** Thanh tìm kiếm bo tròn nhanh (`⌘ K`), các nhịp sinh học được phân cột hoặc phân dải rành mạch với icon màu chuyên biệt.
- **Make it Attractive (Hấp Dẫn):** Thẻ thói quen trắng tinh khôi bo góc mềm mại (`16px - 18px`), hiệu ứng xúc giác nhẹ khi lướt chuột qua, huy hiệu chuỗi streak vàng hổ phách nổi bật.
- **Make it Easy (Dễ Dàng):** Nút check-in 1 chạm cực êm, hệ thống tab dạng **Pill** (viên thuốc) chuyển đổi mượt mà không cần tải lại trang.
- **Make it Satisfying (Thỏa Mãn):** Trực quan hóa thành tựu bằng thanh tiến độ bo tròn mượt mà và widget **Obsidian Matrix Calendar** hiển thị chuỗi ngày rực rỡ.

---

## 2. Hệ Thống Màu & Phân Tầng Thị Giác (Color & Depth Architecture)

### A. Cấu Trúc Nền Canvas Tràn Viền Tự Nhiên (Full-Viewport Canvas Architecture)
Ứng dụng hiển thị tràn viền tự nhiên (Full Viewport) chuẩn mực cho Web / SaaS, không đóng khung bo tròn toàn bộ trang web:
- **Nền Toàn Trang (`#F6F7F5` - Canvas Alabaster):** Nền chính êm dịu, ấm áp, giảm thiểu ánh sáng gắt, tạo không gian làm việc tĩnh tại và liền mạch.
- **Sidebar Cố Định Mép Trái (`#FFFFFF`):** Cố định toàn bộ chiều cao màn hình (`100vh`), phân chia rõ ràng với nội dung chính bằng đường viền mảnh `1px solid #E7EAE4`.
- **Thẻ Nội Dung Nổi Bật (`#FFFFFF` - White Surface Cards):** Các thẻ thói quen, danh sách và bảng thống kê là những khối màu trắng tinh khiết bo góc mềm mại `16px`, nổi nhẹ trên nền canvas với viền hairline `1px solid #E7EAE4` và bóng đổ mờ `shadow-card`.

### B. Hệ Thống Màu Ngữ Nghĩa Pastel (Soft Pastel Chips)
Kế thừa từ bảng trạng thái trực quan của Elera, các chip trạng thái và thẻ thông báo sử dụng nền pastel trong veo đi kèm chữ màu đậm cùng tone:
| Trạng Thái / Mục Tiêu | Màu Nền Pastel | Màu Chữ / Biểu Tượng | Ứng Dụng Thực Tế |
| :--- | :--- | :--- | :--- |
| **Hoàn Thành / Đạt Chuẩn** | `#ECF8ED` (Sprout Tint) | `#1E6B24` (Deep Forest) | Thói quen đã hoàn thành hôm nay, tỉ lệ sinh trưởng tốt |
| **Đang Thực Hiện / Streak** | `#FEF7EB` (Amber Tint) | `#A3660C` (Warm Honey) | Huy hiệu Streak kiên trì, thói quen đang trong phiên đếm |
| **Nhắc Nhở / Cần Hồi Phục** | `#FDF2EE` (Terracotta) | `#A83C19` (Clay Brick) | Cảnh báo *Never Miss Twice*, thói quen đã quên hôm qua |
| **Gợi Ý / Trợ Lý Ngữ Cảnh** | `#EEF4FD` (Sky Tint) | `#1F59B3` (Soft Azure) | Gợi ý Quy tắc 2 phút, mẹo Atomic Habits thông minh |
| **Phản Tư / Nhận Thức Sâu** | `#F4F0FC` (Lilac Tint) | `#58329E` (Deep Violet) | Nhãn nhật ký suy ngẫm, danh mục thói quen tâm hồn |

---

## 3. Hệ Thống Typography (Chữ & Số)

1. **Tin Cậy & Rõ Ràng (Plus Jakarta Sans):**
   - Phông chữ giao diện chủ đạo cho toàn bộ hệ thống (Header, tên thói quen, nút bấm, nhãn danh mục).
   - Thiết kế hình học mềm mại, độ dễ đọc cao nhất trên cả màn hình di động lẫn máy tính.
2. **Thiền Định & Bản Sắc (Newsreader - Serif):**
   - Sử dụng chọn lọc cho câu khẳng định bản sắc danh tính cá nhân (`zen-quote`) và các câu châm ngôn ngắn gọn.
   - Luôn sử dụng kiểu chữ nghiêng (*italic*), kích thước vừa phải (`14px - 16px`), màu xám rêu nhẹ, không đặt trong khung viền nặng nề.
3. **Đo Lường & Thành Tựu (JetBrains Mono):**
   - Dành riêng cho các giá trị số học: Đếm chuỗi (`12d`), tỉ lệ hoàn thành (`85%`), thời lượng (`20m`).
   - Giúp các con số thẳng hàng, tạo cảm giác chính xác, tin cậy.

---

## 4. Quy Chuẩn Iconography (Hệ Thống Biểu Tượng Vector)

Toàn bộ hệ thống biểu tượng trong **Atomic Growth** tuân thủ triết lý: **Đồng bộ — Thanh thoát — Trực quan — Không nhiễu loạn**.

### A. Nguồn Chân Lý & Thư Viện Tiêu Chuẩn
- **Thư viện duy nhất:** Toàn bộ icon vector bắt buộc nhập khẩu từ **Lucide React** (`lucide-react`).
- **Nghiêm cấm tuyệt đối:**
  - ❌ Không sử dụng ký tự unicode / raw emoji hệ điều hành (`▶`, `⚡`, `🌱`, `🔥`, `✓`...) làm icon giao diện, do sự khác biệt về hiển thị và font render thô trên các hệ điều hành (Windows, macOS, Android, iOS).
  - ❌ Không pha trộn các thư viện icon khác (FontAwesome, Material Icons, Heroicons).

### B. Bảng Phân Cấp Kích Thước Biểu Tượng (Icon Sizing Scale)

| Phân Cấp | Kích Thước | Class Tailwind | Ứng Dụng Thực Tế |
| :--- | :--- | :--- | :--- |
| **Micro (Siêu nhỏ)** | `12px × 12px` | `w-3 h-3` | Biểu tượng trong Streak pill, badge danh mục, icon hậu tố trong button nhỏ (`Play` trong nút Ôn 2p) |
| **Compact (Gọn gàng)** | `14px × 14px` | `w-3.5 h-3.5` | Nút thao tác phụ, icon nút đóng (X), hành động phụ trong Toast |
| **Standard (Tiêu chuẩn)** | `16px × 16px` | `w-4 h-4` | Nút bấm chính (CTA), tiền tố thanh tìm kiếm, liên kết menu Sidebar |
| **Focus (Nổi bật)** | `20px × 20px` | `w-5 h-5` | Biểu tượng phân nhóm nhịp sinh học, icon trạng thái Toast, tiêu đề thẻ |
| **Hero (Trọng tâm)** | `24px × 24px` | `w-6 h-6` | Biểu tượng trên Bottom Navigation bar di động, hero icon trong modal chào mừng |

### C. Độ Dày Nét Vẽ (Stroke Width Hierarchy)
- **Chuẩn mực (`strokeWidth={2}`):** Sử dụng cho 90% trường hợp giao diện để đảm bảo nét vẽ sắc sảo, cân đối với phông chữ *Plus Jakarta Sans*.
- **Thanh thoát (`strokeWidth={1.75}`):** Dành riêng cho các biểu tượng lớn (`20px - 24px`) trong không gian thiền định, tránh cảm giác nặng mắt.
- **Nhấn mạnh tương tác (`strokeWidth={2.25}`):** Dành cho biểu tượng xác nhận thành công (`Check`), hành động check-in 1 chạm.

### D. Bản Đồ Biểu Tượng Cốt Lõi (Core Semantic Icon Mapping)

| Miền Nghiệp Vụ | Biểu Tượng Lucide | Màu Sắc / Class | Ý Nghĩa Hành Vi (Atomic Habits) |
| :--- | :--- | :--- | :--- |
| **Bản Sắc & Mầm Sống** | `Sprout` | `text-accent-sprout` / `text-primary` | Nhận diện thương hiệu, gieo mầm thói quen mới |
| **Bộ Thẻ Trí Nhớ** | `Brain` | `text-accent-sage` / `text-semantic-sky` | Liên kết bộ thẻ Anki / Flashcards vào nhịp sống |
| **Quy Tắc 2 Phút** | `Play` | `fill-current opacity-80 w-2.5 h-2.5` | Bắt đầu hành động vi mô tức thì, giảm tối đa rào cản |
| **Ngọn Lửa Chuỗi** | `Flame` | `text-semantic-amber` | Duy trì quán tính hành vi (Never Break the Chain) |
| **Hồi Phục Ân Hạn** | `AlertTriangle` / `Heart` | `text-semantic-terracotta` | Quy tắc "Never Miss Twice" - phục hồi nhân ái |
| **Tia Chớp Hành Vi** | `Zap` | `text-semantic-amber` | Gợi ý thói quen vi mô / Habit Stacking |
| **Check-in Hoàn Thành** | `Check` | `text-white stroke-[2.5]` | Củng cố phần thưởng tức thì (Make it Satisfying) |
| **Nhịp Sáng (Morning)** | `Sunrise` / `Sun` | `text-semantic-amber` | Nghi thức khởi đầu ngày mới tỉnh thức |
| **Nhịp Chiều (Midday)** | `SunMedium` / `Compass` | `text-primary` | Nhịp duy trì năng lượng và sự tập trung cao độ |
| **Nhịp Tối (Evening)** | `Moon` / `Sparkles` | `text-semantic-lilac` | Nghi thức phục hồi, lắng đọng và phản tư |

### E. Hiệu Ứng Vi Tương Tác (Micro-Interactions)
- **Hiệu ứng thu phóng khi hover:** Thêm class `group-hover:scale-110 transition-transform` cho biểu tượng trạng thái để tạo cảm giác sống động.
- **Hiệu ứng đẩy nhẹ định hướng:** Thêm class `group-hover:translate-x-0.5 transition-transform` cho icon hành động chuyển tiếp (`Play`, `ArrowRight`).

---

## 5. Ngôn Ngữ Thành Phần "Pill-Centric" & Thẻ Tinh Gọn

Một trong những đặc điểm cuốn hút nhất của Elera là sự xuất hiện xuyên suốt của hình khối **Pill (Viên thuốc - `rounded-full`)**, tạo cảm giác thân thiện, mềm mại và tân tiến:

### 1. Thanh Tìm Kiếm & Lọc Nhanh (Pill Search & Action Bar)
- **Ô tìm kiếm:** Nền xám nhạt `#EFF1ED`, bo tròn tuyệt đối (`rounded-full`), biểu tượng kính lúp thanh mảnh ở bên trái, phím tắt `⌘ K` dạng badge nhỏ ở bên phải.
- **Nút CTA "+ Thói quen mới":** Nút chính màu than sẫm `#19241E` bo tròn (`rounded-full`), chữ trắng, hiệu ứng hover nhẹ sang màu xanh Cypress.
- **Segmented Filter Pills:** Bộ lọc nhịp sinh học hoặc trạng thái (Tất cả / Sáng / Trưa / Tối):
  - *Active Tab:* Nền than sẫm `#19241E` chữ trắng (hoặc nền trắng nổi trên ray xám), bo tròn mềm mại.
  - *Inactive Tab:* Chữ xám trung tính, không viền, hover chuyển màu mượt.

### 2. Thẻ Thói Quen Chuẩn Elera (Refined Habit Card)
- **Nền & Viền:** Nền trắng `#FFFFFF`, bo góc mềm mại `16px` (`rounded-2xl`), viền hairline `1px solid #E7EAE4`.
- **Vòng Tròn Check-in (Tap Ring):**
  - Kích thước chuẩn `32px × 32px`, viền xám nhạt `2px solid #D6DDD8`.
  - Khi hover: Viền phát sáng nhẹ màu xanh mầm tươi `#6DC85A`.
  - Khi hoàn thành: Vòng tròn được làm đầy tức thì bằng màu xanh mầm tươi `#6DC85A`, biểu tượng check trắng xuất hiện với animation mượt mà.
- **Nội dung thẻ:**
  - Tên thói quen: `Plus Jakarta Sans`, đậm vừa (`font-medium`), màu chữ than rêu `#19241E`. Khi hoàn thành: chuyển sang gạch ngang nhẹ và màu rêu mờ.
  - Nhãn danh mục & Ngữ cảnh: Badge chữ nhỏ dạng pill pastel (`#EFF1ED`), bo tròn `9999px`.
  - Huy hiệu Streak: Nằm gọn gàng ở góc phải: Icon ngọn lửa nhỏ + Số ngày bằng `JetBrains Mono` màu hổ phách `#A3660C` trên nền `#FEF7EB`.

### 3. Contextual Insight Banner (Thanh Khích Lệ Ngữ Cảnh)
Học hỏi từ thanh thông báo ngữ cảnh thông minh của Elera (như thông báo slot trống hay nhắc nhở bệnh nhân):
- **Cấu trúc:** Banner ngang bo góc `14px - 16px`, nền pastel dịu mắt.
- **Bên trái:** Biểu tượng tròn chứa icon chuyên biệt (Icon Trái tim cho *Never Miss Twice*, Icon Đồng hồ cát cho *Quy tắc 2 phút*, Icon Tia chớp cho *Habit Stacking*).
- **Ở giữa:** Lời nhắc ngắn gọn, đầy tính nhân ái và khoa học hành vi.
- **Bên phải:** Nút hành động nhanh dạng pill (ví dụ: `Thực hiện ngay`, `Bỏ qua hôm nay`).
- *Quy tắc tối thượng:* **CHỈ HIỂN THỊ KHI CÓ ĐIỀU KIỆN KÍCH HOẠT THỰC TẾ**, tự động biến mất khi người dùng hoàn thành check-in.

---

## 6. Các Mẫu Trực Quan Hóa Đột Phá (Breakthrough Visual Patterns)

### A. Widget "Obsidian Habit Matrix" (Lấy cảm hứng từ Elera Volume Calendar)
- **Ý tưởng:** Lấy cảm hứng từ thẻ lịch đen sang trọng trong màn hình Dashboard của Elera (`d1ad3837866a06345f7b3.jpg`).
- **Thiết kế:** Một widget phụ tinh tế với nền than đá cao cấp `#242826`, chữ trắng ngà:
  - Hiển thị ma trận các ngày trong tuần/tháng dưới dạng các ô tròn tối giản.
  - Các ngày hoàn thành đủ thói quen được làm nổi bật với viền hoặc fill màu xanh mầm `#6DC85A`.
  - Ngày hôm nay có vòng sáng bao quanh, kích thích cảm giác "không thể để vòng tròn hôm nay bị bỏ trống".

### B. Zen Reflection & Daily Prompt Shell (Lấy cảm hứng từ Elera AI Chat)
- **Ý tưởng:** Lấy cảm hứng từ màn hình chào hỏi tĩnh tại "Morning, Dr. Bennet" (`e4a1f13e4f63cf3d96726.jpg`).
- **Thiết kế màn hình Phản tư (Reflections Tab):**
  - Lời chào theo buổi trong ngày: *"Chào buổi sáng / Buổi tối tĩnh lặng, [Tên người dùng]"* với kích thước lớn, trang nhã.
  - 4 Prompt Pills dạng thẻ trắng bo góc nổi nhẹ:
    - 🌱 *Thói quen nào mang lại nhiều năng lượng nhất?*
    - ⚡ *Quy tắc 2 phút hôm nay đã giúp ích gì?*
    - 🛡️ *Rào cản nào khiến tôi suýt bỏ lỡ?*
    - ✨ *Một điều tôi tự hào về bản thân hôm nay.*
  - Vùng nhập liệu Quick Jot mở rộng ở phía dưới với hiệu ứng ánh sáng mờ nhẹ (ambient glow) từ đáy, tạo cảm giác tập trung tuyệt đối vào việc viết.

---

## 7. Bảng Phân Chia Không Gian Ứng Dụng (Layout & Space Partitioning)

Ứng dụng duy trì sự phân tách rõ ràng giữa 3 khu vực chính:

```
+-----------------------------------------------------------------------------------+
|  FULL VIEWPORT WEB APP (Nền #F6F7F5, Hiển thị tràn viền tự nhiên)                 |
+-------------------+---------------------------------------------------------------+
|  SIDEBAR (Trắng)  |  TOP HEADER: Tiêu đề + Pill Search Bar + User Profile Avatar  |
|  (260px, 100vh)   +---------------------------------------------------------------+
|                   |  FEED STREAM (Max-width 760px, Căn giữa thoáng đãng)          |
|  [Logo & Brand]   |                                                               |
|                   |  [Segmented Filter Pills: Tất cả | Rạng Đông | Tập Trung | ...]   |
|  [Active Tab Pill]|                                                               |
|  - Dòng thời gian |  [Contextual Callout Banner: Chỉ hiện khi lỡ nhịp hôm trước]  |
|  - Nhật ký suy ngẫm|                                                              |
|  - Góc ôn tập     |  [Danh Sách Thói Quen (Cards Trắng Bo Góc 16px)]              |
|  - Giải mã Anki   |  - Buổi sáng                                                  |
|                   |  - Buổi trưa                                                  |
|  [Obsidian Matrix]|  - Buổi tối                                                   |
|  Calendar Widget  |                                                               |
|                   |  [Clean Empty State nếu chưa có dữ liệu]                      |
|  [User & Sync]    |                                                               |
|-------------------+---------------------------------------------------------------+
```

---

## 8. Do's and Don'ts (Bộ Quy Tắc Bất Di Bất Dịch)

### Do's (Khuyến khích & Chuẩn hóa)
- ✅ **Bo góc lớn & Mềm mại:** Sử dụng `rounded-2xl` (16px) cho thẻ thói quen và `rounded-full` (9999px) cho nút bấm, badge, tabs, search.
- ✅ **Khoảng thở hào phóng:** Luôn dành khoảng cách tối thiểu 16px - 24px giữa các khối nội dung, tránh xếp san sát.
- ✅ **Hiển thị theo ngữ cảnh (Contextual):** Các lời nhắc chỉ xuất hiện khi thực sự cần giải quyết một vấn đề hành vi cụ thể.
- ✅ **Tương thích hoàn hảo Di động (Mobile Thumb-Zone Ergonomics):** Trên màn hình nhỏ (`md:hidden`), hệ thống sử dụng **Zen Bottom Navigation Bar** cố định ở đáy (`fixed bottom-0 pb-safe`), tích hợp 5 vị trí đối xứng: *Hôm nay*, *Ôn tập (Anki)*, *Nút gieo mầm trung tâm (+)*, *Phản tư*, và *Khu vườn (Mở Drawer)*. Người dùng có thể điều khiển 100% ứng dụng chỉ bằng 1 ngón cái.
- ✅ **Khoảng đệm an toàn:** Trang nội dung chính có đệm `pb-28 sm:pb-24` đảm bảo không bị thanh điều hướng đáy che khuất bất kỳ phần tử nào.

### Don'ts (Nghiêm cấm tuyệt đối)
- ❌ **CẤM VIỀN ĐẬM & BÓNG GẮT:** Tuyệt đối không dùng viền đen đậm hoặc bóng đổ cứng nhắc kiểu retro/brutalist; toàn bộ hệ thống là sự tinh tế, mượt mà.
- ❌ **CẤM RAW EMOJI LÀM BIỂU TƯỢNG HỆ THỐNG:** Dùng icon vector đồng bộ từ **Lucide React** với nét vẽ mỏng `1.75px` - `2px`.
- ❌ **CẤM CARD LỒNG CARD:** Không bọc thẻ thói quen bên trong các container viền nét đứt hay khung hộp dày đặc.
- ❌ **CẤM DỮ LIỆU GIẢ VÀO TÀI KHOẢN THẬT:** Khi người dùng đăng nhập tài khoản cá nhân, giữ nguyên trạng thái dữ liệu thực tế của họ, render Empty State trang nhã thay vì nạp mock data.
