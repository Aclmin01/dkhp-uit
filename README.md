<div align="center">

# 🎓 UIT HUB (DKHP UIT)
### Hệ Sinh Thái Xếp Thời Khóa Biểu Tự Động, Diễn Đàn Sinh Viên & Tra Cứu Review Giảng Viên UIT

[![Live Production App](https://img.shields.io/badge/Production-uithub.vercel.app-2563eb?style=for-the-badge&logo=vercel&logoColor=white)](https://tkb-scheduler.vercel.app/)
[![Backup Mirror](https://img.shields.io/badge/Mirror-dkhp--uit--backup-10b981?style=for-the-badge&logo=vercel&logoColor=white)](https://dkhp-uit-backup.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Ins0720%2Fdkhp--uit-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Ins0720/dkhp-uit)
[![Everytime Reviews](https://img.shields.io/badge/Everytime%20UIT-900+%20Reviews-d97706?style=for-the-badge&logo=star&logoColor=white)](https://tkb-scheduler.vercel.app/reviews)
[![Constraint Solver](https://img.shields.io/badge/Algorithm-CSP%20Auto--Scheduler-059669?style=for-the-badge&logo=speedtest&logoColor=white)](https://tkb-scheduler.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-7c3aed?style=for-the-badge)](LICENSE)

<p align="center">
  <b>Nền tảng tất-cả-trong-một (All-in-One) dành cho sinh viên Trường Đại học Công nghệ Thông tin (ĐHQG TP.HCM - UIT): Xếp lịch học thông minh không trùng giờ, Diễn đàn trao đổi học thuật & đổi lớp TKB, Nhắn tin Messenger thời gian thực, Cập nhật thông báo Portal UIT trực tiếp, Tra cứu 900+ review giảng viên và tạo Script Auto ĐKHP 1-click.</b>
</p>

[🌐 Trải Nghiệm Trực Tiếp](https://tkb-scheduler.vercel.app/) • [💬 Diễn Đàn Sinh Viên](https://tkb-scheduler.vercel.app/feed) • [👨‍🏫 Review Giảng Viên](https://tkb-scheduler.vercel.app/reviews) • [📱 Cài Đặt App Android](#-cài-đặt-ứng-dụng-di-động-pwa--webapk) • [⚡ Tính Năng Nổi Bật](#-tính-năng-nổi-bật) • [📜 Script Auto ĐKHP](#6-xuất-script-auto-đăng-ký-học-phần-1-click)

</div>

---

## 🌐 Hệ Thống Tên Miền & Mirror Links Dự Phòng

Nhằm đảm bảo trải nghiệm thông suốt và không bị nghẽn mạng trong các đợt cao điểm đăng ký học phần của trường, hệ thống được phân phối trên mạng lưới máy chủ đa điểm (Multi-Region CDN):

| Tên miền / Mirror Link | Trạng thái | Mục đích sử dụng |
| :--- | :---: | :--- |
| 🚀 **[uithub-vn.vercel.app](https://uithub-vn.vercel.app)** | 🟢 Hoạt động | **Official Brand URL (UIT HUB)** |\n| ⚡ **[tkb-scheduler.vercel.app](https://tkb-scheduler.vercel.app)** | 🟢 Hoạt động | **Primary Production** (Web Chính Thức) |\n| 🔗 **[uit-hub-vn.vercel.app](https://uit-hub-vn.vercel.app)** | 🟢 Hoạt động | Brand Alias 1 |\n| 🔗 **[dkhp-uithub.vercel.app](https://dkhp-uithub.vercel.app)** | 🟢 Hoạt động | Brand Alias 2 |
| 🛡️ **[dkhp-uit-backup.vercel.app](https://dkhp-uit-backup.vercel.app)** | 🟢 Hoạt động | **Secondary Backup** (Máy chủ dự phòng) |
| 🌟 **[dkhpuit.vercel.app](https://dkhpuit.vercel.app)** | 🟢 Hoạt động | Production Alias 1 |
| 🔗 **[uit-tkb.vercel.app](https://uit-tkb.vercel.app)** | 🟢 Hoạt động | Mirror Backup 1 |
| 🔗 **[xeptkb-uit.vercel.app](https://xeptkb-uit.vercel.app)** | 🟢 Hoạt động | Mirror Backup 2 |
| 🔗 **[dkhp-uit-ai.vercel.app](https://dkhp-uit-ai.vercel.app)** | 🟢 Hoạt động | Mirror Backup 3 |

---

## ✨ Tính Năng Nổi Bật

### 1. 📅 Giao Diện Thời Khóa Biểu Hiện Đại (Modern Calendar UI)
* **Phong cách Linear / Notion / Apple Calendar**: Thiết kế thẻ môn học nền tối sâu (`Deep Contrast`), viền điểm nhấn màu riêng biệt bên trái (`border-left: 4px solid ...`) cho từng môn học.
* **Bố cục Top-to-Bottom Flow**: Trình bày thông tin liền mạch gồm `[Mã lớp/Loại lớp/Số TC]` ➔ `[Tên môn học]` ➔ `[Phòng học & Giảng viên]`.
* **Chế độ xem 2 chế độ (2 View Modes)**:
  * 🔬 **Tuần Có Thực Hành** *(Mặc định)*: Hiển thị đầy đủ cả ca Lý thuyết và nhóm Thực hành.
  * 📘 **Tuần Không TH (Chỉ LT)**: Lọc riêng các buổi Lý thuyết cho những tuần không có lịch thực hành.
* **Quản lý kế hoạch nâng cao & Xóa hàng loạt**: Thêm mới, nhân bản, chọn nhiều kế hoạch để xóa cùng lúc với modal xác nhận an toàn và dọn dẹp kế hoạch rỗng trong 1 chạm.

---

### 2. 💬 Diễn Đàn Sinh Viên UIT & Mạng Xã Hội Học Thuật (`/feed`)
Không gian kết nối và thảo luận năng động dành riêng cho cộng đồng sinh viên UIT:
* **Đa dạng chuyên mục thảo luận**:
  * 🔄 **Nhượng & Đổi Lớp TKB**: Trao đổi lịch học giữa các lớp lý thuyết và thực hành.
  * 📚 **Học Tập & Chia Sẻ Tài Liệu**: Slide bài giảng, đề thi giữa kỳ / cuối kỳ các môn đại cương & chuyên ngành.
  * 👨‍🏫 **Thảo Luận Giảng Viên**: Chia sẻ kinh nghiệm học tập và review phong cách dạy của thầy/cô.
  * 👥 **Tìm Bạn & Lập Nhóm Đồ Án**: Tìm đồng đội gánh team qua môn, làm khóa luận và thi công nghệ (Hackathon, Olympic).
  * ☕ **Góc Tâm Sự & Confession**: Chia sẻ đời sống sinh viên, KTX và văn hóa UIT.
* **Tương tác mượt mà (Zero-Flicker)**: Đăng bài kèm ảnh chất lượng cao, thả Upvote, bình luận đa cấp không giật lag.

---

### 3. ⚡ Hộp Thư Chat Messenger Trực Tiếp & Kết Bạn 2 Chiều
Hệ thống nhắn tin thời gian thực với đầy đủ tính năng hiện đại:
* 📷 **Gửi ảnh trực tiếp**: Tự động mã hóa Base64 nén mượt mà, xem trước ảnh trước khi gửi.
* 📎 **Gửi tài liệu & File đính kèm**: Thẻ tải file thông minh hiển thị rõ tên tệp, dung lượng và nút tải về 1-click.
* 😊 **Khay Emoji 24 biểu tượng cảm xúc**: Chọn nhanh icon biểu cảm sinh động.
* ↩️ **Trích dẫn & Trả lời tin nhắn (Reply Quote)**: Trích dẫn nội dung tin nhắn của đối phương kèm bubble xem trước.
* 📌 **Nhắc lại tin nhắn (Remind)**: Gắn huy hiệu nhắc lại trực tiếp trên hội thoại.
* 📋 **Sao chép văn bản & Chia sẻ**: Copy nội dung tin nhắn và chia sẻ liên kết nhanh chóng.
* 👥 **Hệ thống kết bạn 2 chiều**: Gửi lời mời kết bạn, chấp nhận/từ chối và quản lý danh sách bạn bè trực tuyến.

---

### 4. 🔔 Cập Nhật Thông Báo Cổng UIT (`portal.uit.edu.vn`) Trực Tiếp
* Tích hợp widget bản tin trực tiếp từ **Cổng thông tin sinh viên UIT (portal.uit.edu.vn)**.
* Tự động hiển thị các thông báo mới nhất từ **Phòng Đào tạo đại học**, **Phòng Công tác sinh viên** (lịch ĐKHP, điểm rèn luyện, học phí, lịch thi...).
* Đánh dấu huy hiệu **`MỚI`** và **`📌 Ghim`** nổi bật.

---

### 5. ⚡ Thuật Toán Xếp TKB Tự Động (CSP Backtracking Engine)
* **Giải bài toán xếp lịch trong 0.01s**: Quét và kết hợp hàng nghìn tổ hợp lớp Lý thuyết + nhóm Thực hành để tìm ra các phương án **hoàn toàn không bị trùng lịch**.
* **Chấm điểm phương án trực quan (Score / 100)**: Đánh giá theo mức độ tập trung ca học, độ giãn tiết và xếp hạng giảng viên.
* **Bộ lọc nâng cao theo nhu cầu**:
  * Ưu tiên ngày nghỉ trong tuần (Nghỉ Thứ 2, Thứ 6, Thứ 7...).
  * Lựa chọn ca học cố định: Chỉ học buổi Sáng (Tiết 1–5), Chiều (Tiết 6–10) hoặc Tối.
  * Tự động né giảng viên trong danh sách loại trừ (Blacklist).

---

### 6. 📜 Xuất Script Auto Đăng Ký Học Phần 1-Click
* Tự động trích xuất toàn bộ mã lớp Lý thuyết và nhóm Thực hành trong kế hoạch của bạn.
* Sinh mã JavaScript tương thích trực tiếp với cổng chính thức **[dkhp.uit.edu.vn](https://dkhp.uit.edu.vn)**.
* Khi mở cổng ĐKHP, chỉ cần mở **Console (F12)** $\rightarrow$ Dán script $\rightarrow$ Hệ thống tự động tick chọn toàn bộ các môn trong tích tắc!

---

### 7. 👨‍🏫 Tra Cứu 900+ Review Giảng Viên Everytime UIT (`/reviews`)
* **Dữ liệu thực tế từ sinh viên UIT**: Tổng hợp 909 đánh giá chân thực của **218 giảng viên**.
* **Phân tầng độ uy tín (Tiers)**:
  * 🏆 **Tier S ("Phật Sống UIT")**: Đánh giá $\ge 4.8★$, 100% sinh viên đề xuất, chấm điểm thoáng, bài tập vừa sức.
  * 🌟 **Tier A ("Dạy Tốt & Có Tâm")**: Giảng viên giảng dạy tâm huyết, hỗ trợ sinh viên nhiệt tình.
  * ⚠️ **Tier C ("Cảnh Báo")**: Giảng viên có nhiều phản hồi về khối lượng bài tập nặng hoặc chấm gắt.
* Tìm kiếm theo tên giảng viên, mã môn học, khoa viện và gửi đánh giá đóng góp mới.

---

### 8. 📱 Cài Đặt Ứng Dụng Di Động (PWA / WebAPK)
* **Cài đặt 1-chạm (1-Click Install)**: Hỗ trợ PWA chuẩn WebAPK cho Android (Chrome, Samsung Internet, Edge, Cốc Cốc).
* **Trải nghiệm App Native**: Khởi chạy toàn màn hình không có thanh địa chỉ duyệt web, có icon sắc nét trên màn hình chính và hỗ trợ bộ nhớ đệm Offline.
* **Tối ưu Mobile-First**: Giao diện co giãn thông minh, thanh điều hướng vuốt ngang tiện lợi, cố định cột giờ học khi xem bảng TKB.

---

## 🛠️ Hướng Dẫn Phát Triển & Triển Khai (Development)

### Yêu Cầu Hệ Thống:
* Node.js $\ge 18.0.0$
* npm $\ge 9.0.0$

### Cài Đặt & Chạy Môi Trường Cục Bộ:
```bash
# 1. Clone repository
git clone https://github.com/Ins0720/dkhp-uit.git
cd dkhp-uit

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Biên dịch và tối ưu hóa bảo mật (Security Build)
node build.js

# 4. Khởi chạy máy chủ phát triển (Express + WebSocket Realtime)
node server.js
```
👉 Mở trình duyệt và truy cập: **`http://localhost:3000`**

---

## 🤝 Đóng Góp Cộng Đồng

Dự án được xây dựng hoàn toàn phi lợi nhuận nhằm hỗ trợ cộng đồng sinh viên UIT. Mọi đóng góp, báo lỗi (Issue) hoặc tính năng mới (Pull Request) đều được nhiệt liệt hoan nghênh!

* 🌟 Hãy tặng dự án **1 Star trên GitHub** để tiếp thêm động lực phát triển nhé!
* 💬 Mọi ý kiến đóng góp xin vui lòng tạo Issue trên GitHub hoặc thảo luận trực tiếp tại Diễn Đàn UIT HUB.

---

<div align="center">
  <sub>Phát triển với ❤️ bởi Ins0720 & Cộng đồng Sinh viên UIT</sub>
</div>
