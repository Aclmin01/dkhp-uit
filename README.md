<div align="center">

# 🎓 DKHP UIT
### Hệ Thống Tự Động Xếp Thời Khóa Biểu & Hỗ Trợ Đăng Ký Học Phần UIT

[![Live Production App](https://img.shields.io/badge/Production-dkhpuit.vercel.app-2563eb?style=for-the-badge&logo=vercel&logoColor=white)](https://dkhpuit.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Ins0720%2Fdkhp--uit-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Ins0720/dkhp-uit)
[![Everytime Reviews](https://img.shields.io/badge/Everytime%20UIT-900+%20Reviews-d97706?style=for-the-badge&logo=star&logoColor=white)](https://dkhpuit.vercel.app/)
[![Constraint Solver](https://img.shields.io/badge/Algorithm-CSP%20Auto--Scheduler-059669?style=for-the-badge&logo=speedtest&logoColor=white)](https://dkhpuit.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-7c3aed?style=for-the-badge)](LICENSE)

<p align="center">
  <b>Giải pháp xếp lịch học thông minh, chống trùng giờ 100%, tra cứu review giảng viên thực tế và tạo Script Auto ĐKHP 1-click dành cho sinh viên Trường Đại học Công nghệ Thông tin (ĐHQG TP.HCM - UIT).</b>
</p>

[🌐 Trải nghiệm trực tiếp](https://dkhpuit.vercel.app/) • [⚡ Hướng dẫn sử dụng](#-hướng-dẫn-sử-dụng-nhanh) • [👨‍🏫 Review Giảng viên](#-tích-hợp-dữ-liệu-everytime-vn) • [📜 Script Auto ĐKHP](#-xuất-script-auto-đkhp-1-click) • [🤝 Đóng góp mã nguồn](#-đóng-góp-cộng-đồng)

</div>

---

## 🌐 Hệ thống Tên miền & Mirror Links

Nếu bạn gặp tình trạng nghẽn mạng trong giờ cao điểm đăng ký học phần, vui lòng truy cập qua các mirror links dự phòng:

| Tên miền | Trạng thái | Loại mạng |
| :--- | :---: | :--- |
| 🚀 **[dkhpuit.vercel.app](https://dkhpuit.vercel.app)** | 🟢 Hoạt động | **Primary Production** (Khuyên dùng) |
| 🔗 **[uit-tkb.vercel.app](https://uit-tkb.vercel.app)** | 🟢 Hoạt động | Mirror Backup 1 |
| 🔗 **[xeptkb-uit.vercel.app](https://xeptkb-uit.vercel.app)** | 🟢 Hoạt động | Mirror Backup 2 |
| 🔗 **[dkhp-uit-ai.vercel.app](https://dkhp-uit-ai.vercel.app)** | 🟢 Hoạt động | Mirror Backup 3 |
| 🔗 **[dkhp-uit-scheduler.vercel.app](https://dkhp-uit-scheduler.vercel.app)** | 🟢 Hoạt động | Mirror Backup 4 |
| 🔗 **[dkhp-uit-helper.vercel.app](https://dkhp-uit-helper.vercel.app)** | 🟢 Hoạt động | Mirror Backup 5 |
| 🔗 **[uit-auto-dkhp.vercel.app](https://uit-auto-dkhp.vercel.app)** | 🟢 Hoạt động | Mirror Backup 6 |

---

## 🌟 Tính Năng Trọng Tâm

### 1. ⚡ Tự Động Xếp TKB Thông Minh (CSP Backtracking Engine)
* **Giải bài toán xếp lịch chỉ trong 0.01 giây**: Quét và kết hợp hàng nghìn tổ hợp lớp Lý thuyết + nhóm Thực hành để tìm ra các phương án **hoàn toàn không bị trùng lịch**.
* **Chấm điểm phương án trực quan (Score/100)**: Đánh giá theo mức độ tập trung ca học, độ giãn tiết và xếp hạng giảng viên.
* **Bộ lọc nâng cao theo nhu cầu**:
  * Ưu tiên ngày nghỉ trong tuần (Thứ 2 $\rightarrow$ Thứ 7).
  * Lựa chọn ca học cố định: Chỉ học buổi Sáng (Tiết 1-5) hoặc Chiều (Tiết 6-10).
  * Tự động né giảng viên bị cộng đồng cảnh báo.

### 2. 👨‍🏫 Tích Hợp 900+ Review Giảng Viên Từ Everytime VN
* **Dữ liệu thực tế từ sinh viên UIT**: Tổng hợp 909 đánh giá chân thực của **218 giảng viên**.
* **Phân tầng độ uy tín rõ ràng**:
  * 🏆 **Tier S ("Phật Sống UIT")**: Đánh giá $\ge 4.8★$, 100% sinh viên đề xuất, chấm điểm thoáng, bài tập vừa sức.
  * 🌟 **Tier A ("Dạy Tốt & Có Tâm")**: Giảng viên giảng dạy tâm huyết, hỗ trợ sinh viên nhiệt tình.
  * ⚠️ **Tier C ("Cảnh Báo")**: Giảng viên có nhiều phản hồi về khối lượng bài tập nặng hoặc chấm gắt.
* **Chi tiết tiêu chí**: Tra cứu nhanh mức độ điểm danh, cách chấm điểm (Thoáng / Chuẩn / Gắt), bài tập và đề thi.

### 3. 📜 Xuất Script Auto Đăng Ký Học Phần 1-Click
* Tự động trích xuất toàn bộ mã lớp Lý thuyết và nhóm Thực hành trong kế hoạch của bạn.
* Sinh mã JavaScript tương thích trực tiếp với cổng chính thức **[dkhp.uit.edu.vn](https://dkhp.uit.edu.vn)**.
* Khi mở cổng ĐKHP, chỉ cần mở **Console (F12)** $\rightarrow$ Dán script $\rightarrow$ Hệ thống tự động tick chọn toàn bộ các môn trong tích tắc!

### 4. 📱 Giao Diện Mobile-First & Đa Nền Tảng
* **Segmented Navigation trên điện thoại**: Chuyển đổi mượt mà giữa *Lịch TKB*, *Tìm & Chọn môn* và *Môn đã chọn*.
* **Cột Tiết học cố định (Sticky Column)**: Khi vuốt ngang xem từ Thứ 2 đến Thứ 7 trên điện thoại, cột giờ học luôn được ghim bên trái giúp dễ dàng đối chiếu.
* **Hỗ trợ Dark Mode & Light Mode**: Bảo vệ mắt khi xếp lịch vào ban đêm.

### 5. 🔒 Bảo Mật & Lưu Trữ Đa Kế Hoạch
* **100% Client-Side**: Toàn bộ dữ liệu được lưu trữ trên trình duyệt của người dùng (LocalStorage).
* **Quản lý đa kế hoạch**: Tạo Kế hoạch 1 (Chính), Kế hoạch 2 (Dự phòng), Kế hoạch 3 song song.
* **Sao lưu & Phục hồi JSON an toàn**: Xuất/nhập file JSON kế hoạch với mã băm SHA-256 chống lỗi dữ liệu.
* **Xuất ảnh TKB chất lượng cao**: Lưu ảnh lịch học dưới định dạng PNG sắc nét để cài hình nền hoặc chia sẻ.

---

## 🛠️ Hướng Dẫn Sử Dụng Nhanh

1. Truy cập **[https://dkhpuit.vercel.app](https://dkhpuit.vercel.app)**.
2. **Cách 1: Xếp lịch thủ công**:
   * Gõ tên môn (ví dụ: `IT001`, `Giải tích`) hoặc tên giảng viên vào ô tìm kiếm ở thanh bên trái.
   * Bấm `+ Chọn vào TKB` và chọn nhóm thực hành mong muốn.
3. **Cách 2: Xếp lịch tự động bằng AI**:
   * Bấm nút **`✨ Tự động xếp TKB`** trên thanh Header.
   * Chọn các môn bạn cần học trong học kỳ ➡️ Chọn tiêu chí ưu tiên (ngày nghỉ, ca học) ➡️ Bấm **Tạo & Tìm Kiếm**.
   * Duyệt qua các phương án tối ưu và bấm **Áp dụng vào TKB**.
4. **Đăng ký học phần**:
   * Bấm **`</> Xuất Script ĐKHP`** ➡️ Copy đoạn mã script.
   * Đăng nhập vào [dkhp.uit.edu.vn](https://dkhp.uit.edu.vn) ➡️ Nhấn `F12` ➡️ Chọn tab `Console` ➡️ Dán mã và nhấn `Enter`.

---

## 💻 Kiến Trúc Công Nghệ

```
dkhp-uit/
├── index.html        # Giao diện chính, thẻ SEO Semantic & Modals
├── style.css         # Hệ thống Design System, Token CSS, Dark/Light theme & Responsive Mobile
├── app.js            # Engine điều phối TKB, CSP Solver, Event Delegation & LocalStorage
├── ratings.js        # Cơ sở dữ liệu 900+ Review Giảng viên Everytime UIT
├── data.js           # Dữ liệu Thời khóa biểu mẫu các khoa UIT
├── security.js       # Thư viện bảo mật băm SHA-256, FastHash & RateLimiter
├── vercel.json       # Cấu hình Vercel Edge Server, CSP Headers, HSTS & Cache
└── libs/             # Thư viện xử lý tĩnh (XLSX, html2canvas)
```

- **Frontend**: Pure Vanilla HTML5 / Modern CSS3 / Modern JavaScript (ES6+).
- **Security & Integrity**: Content Security Policy (CSP), SHA-256 Data Hash, Zero 3rd-party tracking.
- **Edge Deployment**: Vercel Global Edge Network (HTTP/2, HTTPS, Anycast CDN).

---

## 💡 Lưu Ý Về Vibe Coding & Đóng Góp Cộng Đồng

- **Vibe Coding Project**: Dự án được xây dựng theo định hướng **Vibe Coding** với mục tiêu hỗ trợ cộng đồng sinh viên UIT giải quyết bài toán đăng ký học phần một cách nhanh chóng, trực quan và tiện lợi nhất.
- **Mã nguồn mở 100%**: Mọi đóng góp, báo lỗi (Bug Reports), góp ý tính năng (Feature Requests) hoặc Pull Requests đều được hoan nghênh nồng nhiệt! 🤝

---

## 📄 Giấy Phép (License)

Phát hành theo giấy phép **[MIT License](LICENSE)**. Dự án phục vụ mục đích phi lợi nhuận cho cộng đồng sinh viên Đại học Công nghệ Thông tin (ĐHQG TP.HCM).

---

<div align="center">
  <sub>Phát triển vì cộng đồng sinh viên UIT ❤️ • Chúc các bạn có một mùa ĐKHP thành công và trúng trọn vẹn TKB như ý!</sub>
</div>
