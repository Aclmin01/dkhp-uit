<div align="center">

# 🎓 DKHP UIT
### Hệ Thống Tự Động Xếp Thời Khóa Biểu & Hỗ Trợ Đăng Ký Học Phần UIT

[![Live Production App](https://img.shields.io/badge/Production-dkhpuit.vercel.app-2563eb?style=for-the-badge&logo=vercel&logoColor=white)](https://dkhpuit.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Ins0720%2Fdkhp--uit-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Ins0720/dkhp-uit)
[![Everytime Reviews](https://img.shields.io/badge/Everytime%20UIT-900+%20Reviews-d97706?style=for-the-badge&logo=star&logoColor=white)](https://dkhpuit.vercel.app/)
[![Constraint Solver](https://img.shields.io/badge/Algorithm-CSP%20Auto--Scheduler-059669?style=for-the-badge&logo=speedtest&logoColor=white)](https://dkhpuit.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-7c3aed?style=for-the-badge)](LICENSE)

<p align="center">
  <b>Giải pháp xếp lịch học thông minh, chống trùng giờ 100%, tra cứu 900+ review giảng viên thực tế, xuất danh sách mã lớp đa định dạng và tạo Script Auto ĐKHP 1-click dành cho sinh viên Trường Đại học Công nghệ Thông tin (ĐHQG TP.HCM - UIT).</b>
</p>

[🌐 Trải nghiệm trực tiếp](https://dkhpuit.vercel.app/) • [⚡ Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng-nhanh) • [✨ Tính năng mới](#-tính-năng-nổi-bật) • [👨‍🏫 Review Giảng viên](#5-tra-cứu-900-review-giảng-viên-everytime-uit--đánh-giá-cộng-đồng) • [📜 Script Auto ĐKHP](#6-xuất-script-auto-đăng-ký-học-phần-1-click) • [🤝 Đóng góp mã nguồn](#-đóng-góp-cộng-đồng)

</div>

---

## 🌐 Hệ thống Tên miền & Mirror Links

Khi hệ thống mạng bị nghẽn trong giờ cao điểm đăng ký học phần, bạn có thể truy cập qua các mirror links dự phòng:

| Tên miền | Trạng thái | Loại mạng |
| :--- | :---: | :--- |
| 🚀 **[dkhpuit.vercel.app](https://dkhpuit.vercel.app)** | 🟢 Hoạt động | **Primary Production** (Khuyên dùng) |
| 🔗 **[tkb-scheduler.vercel.app](https://tkb-scheduler.vercel.app)** | 🟢 Hoạt động | Production Alias |
| 🔗 **[uit-tkb.vercel.app](https://uit-tkb.vercel.app)** | 🟢 Hoạt động | Mirror Backup 1 |
| 🔗 **[xeptkb-uit.vercel.app](https://xeptkb-uit.vercel.app)** | 🟢 Hoạt động | Mirror Backup 2 |
| 🔗 **[dkhp-uit-ai.vercel.app](https://dkhp-uit-ai.vercel.app)** | 🟢 Hoạt động | Mirror Backup 3 |

---

## ✨ Tính Năng Nổi Bật

### 1. 📅 Giao Diện Thời Khóa Biểu Hiện Đại (Modern Calendar UI)
* **Phong cách Linear / Notion / Apple Calendar**: Thiết kế thẻ môn học với nền tối sâu sang trọng (`Deep Contrast`), viền điểm nhấn màu riêng biệt bên trái (`border-left: 4px solid ...`) cho từng môn học.
* **Bố cục Top-to-Bottom Flow**: Trình bày thông tin liền mạch gồm `[Mã lớp/Loại lớp/Số TC]` ➔ `[Tên môn học]` ➔ `[Phòng học & Giảng viên]`. Chấm dứt hoàn toàn tình trạng mất chữ hay khoảng trống thừa ở giữa.
* **Tương thích hoàn hảo cho ca ngắn & dài**: Hiển thị sắc nét, trọn vẹn thông tin cho cả lớp 2 tiết lẫn ca học 3–5 tiết.
* **Huy hiệu Everytime Compact (`🏆 4.9`, `⭐ 5.0`)**: Tích hợp xếp hạng giảng viên trực tiếp vào thẻ môn trên bảng TKB.

---

### 2. 🎛️ Chế Độ Xem Tuần Tinh Gọn (2 View Modes)
Dễ dàng chuyển đổi chỉ với 1 click:
* 🔬 **Tuần Có Thực Hành** *(Mặc định)*: Hiển thị trọn vẹn toàn bộ lịch học gồm ca Lý thuyết và các buổi Thực hành.
* 📘 **Tuần Không TH (Chỉ LT)**: Lọc hiển thị riêng các buổi Lý thuyết cho những tuần không có lịch thực hành.

---

### 3. 📤 Nhập & Xuất Mã Lớp Học Phần Đa Định Dạng
Hỗ trợ lưu trữ, chia sẻ và nạp TKB siêu tốc:
* **Xuất mã lớp đa định dạng**:
  * 📄 **Mỗi mã một dòng (`\n`)**: Định dạng danh sách dọc chuẩn văn bản.
  * 🚀 **Dấu cách (Space ` `)**: `NT105.R11 NT105.R11.1 MA005.R14...` (Cách nhau bằng dấu khoảng trắng).
  * 🏷️ **Dấu phẩy + Khoảng trắng (`, `)**: `NT105.R11, NT105.R11.1, MA005.R14...`
  * 콤 **Dấu phẩy liền nhau (`,`)**: `NT105.R11,NT105.R11.1,MA005.R14...`
  * 🔖 **Mã Bookmarklet 1-Click (`javascript:...`)**: Tự động tạo Bookmark trên trình duyệt để chọn & đăng ký môn tức thì.
  * 💻 **Mảng Array JavaScript (`['...']`)**: `['NT105.R11', 'NT105.R11.1'...]`
* **Lưu & Tải file `.txt` trực tiếp**: Tải về file danh sách mã lớp trong 1 chạm.
* **Nhập mã lớp thông minh (Auto-Scheduler from Codes)**:
  * Tự động giải mã văn bản thô, mảng mã lớp, hoặc **toàn bộ mã Bookmarklet/Script**.
  * Hỗ trợ **kéo thả 1 hoặc nhiều file `.txt`** vào khung nhập để tự động tick chọn môn & nhóm thực hành tương ứng.

---

### 4. ⚡ Tự Động Xếp TKB Thông Minh (CSP Backtracking Engine)
* **Giải bài toán xếp lịch trong 0.01s**: Quét và kết hợp hàng nghìn tổ hợp lớp Lý thuyết + nhóm Thực hành để tìm ra các phương án **hoàn toàn không bị trùng lịch**.
* **Chấm điểm phương án trực quan (Score / 100)**: Đánh giá theo mức độ tập trung ca học, độ giãn tiết và xếp hạng giảng viên.
* **Bộ lọc nâng cao theo nhu cầu**:
  * Ưu tiên ngày nghỉ trong tuần (Nghỉ Thứ 2, Nghỉ Thứ 7, Nghỉ Thứ 6...).
  * Lựa chọn ca học cố định: Chỉ học buổi Sáng (Tiết 1–5), Chiều (Tiết 6–10) hoặc Tối.
  * Tự động né giảng viên trong danh sách loại trừ (Blacklist).

---

### 5. 👨‍🏫 Tra Cứu 900+ Review Giảng Viên Everytime UIT & Đánh Giá Cộng Đồng
* **Dữ liệu thực tế từ sinh viên UIT**: Tổng hợp 909 đánh giá chân thực của **218 giảng viên**.
* **Phân tầng độ uy tín (Tiers)**:
  * 🏆 **Tier S ("Phật Sống UIT")**: Đánh giá $\ge 4.8★$, 100% sinh viên đề xuất, chấm điểm thoáng, bài tập vừa sức.
  * 🌟 **Tier A ("Dạy Tốt & Có Tâm")**: Giảng viên giảng dạy tâm huyết, hỗ trợ sinh viên nhiệt tình.
  * ⚠️ **Tier C ("Cảnh Báo")**: Giảng viên có nhiều phản hồi về khối lượng bài tập nặng hoặc chấm gắt.
* **Trang Review riêng biệt (`reviews.html`)**:
  * Tìm kiếm giảng viên theo tên, mã môn, khoa.
  * Gửi review và đánh giá giảng viên mới kết nối cơ sở dữ liệu Supabase theo thời gian thực.

---

### 6. 📜 Xuất Script Auto Đăng Ký Học Phần 1-Click
* Tự động trích xuất toàn bộ mã lớp Lý thuyết và nhóm Thực hành trong kế hoạch của bạn.
* Sinh mã JavaScript tương thích trực tiếp với cổng chính thức **[dkhp.uit.edu.vn](https://dkhp.uit.edu.vn)**.
* Khi mở cổng ĐKHP, chỉ cần mở **Console (F12)** $\rightarrow$ Dán script $\rightarrow$ Hệ thống tự động tick chọn toàn bộ các môn trong tích tắc!

---

### 7. 📱 Mobile-First, Dark Mode & Đa Nền Tảng
* **Segmented Navigation trên điện thoại**: Chuyển đổi mượt mà giữa *Lịch TKB*, *Tìm & Chọn môn* và *Môn đã chọn*.
* **Cột Tiết học cố định (Sticky Column)**: Khi vuốt ngang xem từ Thứ 2 đến Thứ 7 trên điện thoại, cột giờ học luôn được ghim bên trái giúp dễ dàng đối chiếu.
* **Giao diện Dark / Light Theme**: Tự động ghi nhớ chế độ sáng/tối bảo vệ mắt.
* **Xuất ảnh TKB chất lượng cao (PNG)**: Lưu ảnh lịch học sắc nét để cài hình nền hoặc gửi cho bạn bè.

---

### 8. 🔒 Lưu Trữ Đa Kế Hoạch & Tự Động Phục Hồi (Auto-Recovery)
* **100% Client-Side**: Toàn bộ dữ liệu được lưu trữ trực tiếp trên trình duyệt của người dùng (LocalStorage).
* **Quản lý đa kế hoạch**: Tạo song song Kế hoạch 1 (Chính), Kế hoạch 2 (Dự phòng), Kế hoạch 3...
* **Auto-Recovery**: Tự động phục hồi kế hoạch môn học, chống tình trạng mất dữ liệu do cập nhật mã nguồn hay xoá cache trình duyệt.

---

## 🛠️ Hướng Dẫn Sử Dụng Nhanh

### Cách 1: Xếp lịch thủ công
1. Gõ tên môn (ví dụ: `IT004`, `Cơ sở dữ liệu`) hoặc tên giảng viên vào thanh tìm kiếm bên trái.
2. Bấm **`+ Thêm vào TKB`** và chọn nhóm Thực hành mong muốn.

### Cách 2: Tự động xếp TKB bằng AI
1. Bấm nút **`⚡ Tự động xếp TKB`** trên thanh Header.
2. Chọn các môn cần học trong học kỳ ➔ Chọn tiêu chí (Nghỉ thứ mấy, ca học Sáng/Chiều) ➔ Bấm **`Tạo & Tìm Kiếm`**.
3. Xem các phương án tối ưu và bấm **`Áp dụng vào TKB`**.

### Cách 3: Nạp nhanh từ danh sách mã lớp / File .txt
1. Bấm nút **`⇄ Nhập/Xuất mã lớp`** trên thanh Header.
2. Dán danh sách mã lớp hoặc kéo thả file `.txt` vào khung ➔ Bấm **`Tự động giải mã & Xếp TKB`**.

### Cách 4: Đăng ký học phần 1-Click
1. Bấm **`</> Xuất Script ĐKHP`** ➔ Bấm **`Sao chép Script`**.
2. Đăng nhập vào **[dkhp.uit.edu.vn](https://dkhp.uit.edu.vn)** ➔ Nhấn `F12` ➔ Chọn tab `Console` ➔ Dán script và nhấn `Enter`.

---

## 💻 Cấu Trúc Mã Nguồn

```
dkhp-uit/
├── index.html            # Giao diện chính, TKB Matrix, Modals & Bộ lọc
├── reviews.html          # Trang tra cứu & đóng góp 900+ Review Giảng viên Everytime
├── style.css             # Hệ thống Design System, Token CSS, Dark/Light theme & Responsive Mobile
├── build.js              # Script tự động Đóng gói & Nén làm rối mã nguồn (Terser Bundler)
├── security-guard.js     # Lớp bảo vệ Anti-DevTools, Anti-Inspection & Watchdog
├── bundle.main.min.js    # Single-file Bundle mã nguồn nén & làm rối cho App chính
├── bundle.reviews.min.js # Single-file Bundle mã nguồn nén & làm rối cho Trang Reviews
├── supabase_security_setup.sql # Script SQL thiết lập Row Level Security (RLS) trên Supabase
├── app.js                # Engine điều phối TKB, CSP Solver, Import/Export & LocalStorage (Source)
├── reviews.js            # Logic tìm kiếm, lọc và gửi review giảng viên qua Supabase (Source)
├── ratings.js            # Cơ sở dữ liệu 900+ Review Giảng viên Everytime UIT (Source)
├── data.js               # Cơ sở dữ liệu Thời khóa biểu lớp học phần UIT (Source)
├── security.js           # Module bảo mật Web Crypto SHA-256, FastHash & RateLimiter (Source)
├── supabase-config.js    # Cấu hình kết nối Supabase API cho tính năng Review (Source)
├── vercel.json           # Cấu hình Vercel Edge Server, Build Command, CSP Headers & HSTS
└── libs/                 # Thư viện tĩnh (XLSX, html2canvas, Supabase client)
```

- **Frontend Architecture**: Single-Bundle Delivery (Đóng gói 1 file JS duy nhất, nén Mangle & Obfuscate, không lộ file rời rạc khi F12).
- **Client Security Guard**: Chống mở F12/Inspect, bẫy Anti-Debugging Watchdog, ẩn Console Logs và bẫy Anti-Bot Honeypot.
- **Backend Security**: Supabase Row-Level Security (RLS) với ràng buộc kiểm tra nghiêm ngặt từ Database.
- **Edge Deployment**: Vercel Global Edge Network tự động build `node build.js` mỗi lần deploy.

---

## 🤝 Đóng Góp Cộng Đồng

Dự án được xây dựng theo tinh thần **Vibe Coding** phục vụ phi lợi nhuận cho cộng đồng sinh viên Trường Đại học Công nghệ Thông tin (ĐHQG TP.HCM).

Mọi đóng góp, báo lỗi (Bug Reports), góp ý tính năng (Feature Requests) hoặc Pull Requests đều được hoan nghênh nồng nhiệt! 💖

* **Tác giả / Maintainer**: [Ins0720](https://github.com/Ins0720)
* **GitHub Repository**: [https://github.com/Ins0720/dkhp-uit](https://github.com/Ins0720/dkhp-uit)

---

## 📄 Giấy Phép (License)

Dự án được phân phối dưới giấy phép **[MIT License](LICENSE)**.

---

<div align="center">
  <sub>Phát triển vì cộng đồng sinh viên UIT ❤️ • Chúc các bạn luôn có một mùa ĐKHP suôn sẻ và đạt trọn vẹn TKB như ý!</sub>
</div>
