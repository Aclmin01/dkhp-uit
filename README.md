# 🎓 DKHP UIT - Tool Xếp Thời Khóa Biểu Tự Động & Đăng Ký Học Phần UIT (AI Everytime)

[![Live Web App](https://img.shields.io/badge/Live%20App-dkhpuit.vercel.app-e11d48?style=for-the-badge&logo=vercel)](https://dkhpuit.vercel.app/)
[![Everytime Real Reviews](https://img.shields.io/badge/Everytime%20UIT-900+%20Reviews-f59e0b?style=for-the-badge&logo=star)](https://dkhpuit.vercel.app/)
[![Auto Scheduler Algorithm](https://img.shields.io/badge/AI%20CSP-0.01s%20Optimization-10b981?style=for-the-badge&logo=lightning)](https://dkhpuit.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-38bdf8?style=for-the-badge)](LICENSE)

> 🚀 **Website chính thức:** [https://dkhpuit.vercel.app](https://dkhpuit.vercel.app)  
> 🔗 **Mirror Links:** [https://uit-tkb.vercel.app](https://uit-tkb.vercel.app) | [https://xeptkb-uit.vercel.app](https://xeptkb-uit.vercel.app)

---

## 📌 Giới thiệu về DKHP UIT

**DKHP UIT** là nền tảng hỗ trợ sinh viên **Trường Đại học Công nghệ Thông tin (ĐHQG TP.HCM - UIT)** tự động hóa 100% quá trình xếp lịch học, kiểm tra trùng lịch và hỗ trợ đăng ký học phần thông minh cho các kỳ học.

### 🌟 Tính năng nổi bật

1. **⚡ Thuật toán AI Tự Động Xếp TKB (CSP Backtracking)**:
   - Chỉ cần chọn danh sách môn học cần đăng ký.
   - Thuật toán giải quyết ràng buộc (CSP) quét hàng nghìn tổ hợp lớp lý thuyết + thực hành, đưa ra các phương án TKB **100% không trùng lịch** chỉ trong **0.01 giây**.
   - Bộ lọc tùy chỉnh: *Ưu tiên ngày nghỉ trong tuần (Thứ 2 - Thứ 7), chọn ca học Sáng / Chiều, hạn chế trống tiết giữa giờ*.

2. **⭐ Tích hợp 900+ Đánh Giá Giảng Viên Thực Tế Từ Everytime VN (NLP)**:
   - Dữ liệu đánh giá chi tiết của **218 Giảng viên UIT** từ cộng đồng sinh viên Everytime.
   - Phân cấp Tier rõ ràng:
     - 🏆 **Tier S ("Phật Sống UIT")**: Đánh giá $\ge 4.8★$, $100\%$ sinh viên đề xuất, chấm điểm thoáng, đề bám sát.
     - 🛑 **Tier C ("Cảnh Báo Né")**: Cảnh báo giảng viên chấm gắt, điểm danh nghiêm ngặt hoặc nhiều bài tập áp lực.
   - Bộ lọc AI: `[x] NÉ TUYỆT ĐỐI Giảng viên Cảnh báo` & `[x] Ưu tiên Giảng viên Phật Sống`.

3. **🚀 Xuất Script Auto Đăng Ký Học Phần 1-Click**:
   - Tự động sinh đoạn mã JavaScript đăng ký nhanh cho cổng [dkhocphan.uit.edu.vn](https://dkhocphan.uit.edu.vn).
   - Tích chọn toàn bộ mã lớp lý thuyết và thực hành chỉ trong 1 thao tác Console (F12).

4. **🔄 Import / Export Mã Lớp & Đồng Bộ Đa Nền Tảng**:
   - Nhập/xuất danh sách mã lớp dạng text (ví dụ: `IT004.R18, IT007.R111...`) chia sẻ cho bạn bè.
   - Lưu trữ đa kế hoạch (Kế hoạch 1, Dự phòng 2, Dự phòng 3) trên LocalStorage.
   - Xuất ảnh Thời khóa biểu dạng PNG chất lượng cao Full HD.

---

## 🛠️ Hướng dẫn sử dụng nhanh

1. Truy cập **[https://dkhpuit.vercel.app](https://dkhpuit.vercel.app)**.
2. Bấm vào nút **✨ Tự động xếp TKB** ở thanh menu.
3. Chọn các môn học bạn muốn đăng ký (hoặc bấm *⚡ Nạp 5 môn mẫu*).
4. Tích chọn tiêu chí ưu tiên giảng viên và ngày nghỉ ➡️ Bấm **Tạo & Tìm Kiếm**.
5. Chọn phương án ưng ý nhất ➡️ Bấm **Áp dụng vào TKB**.
6. Bấm **</> Xuất Script ĐKHP** để copy script đăng ký khi mở cổng ĐKHP UIT!

---

## 👨‍💻 Công nghệ phát triển

- **Core**: Vanilla HTML5, Modern CSS3 (CSS Variables, Flexbox, CSS Grid), ES6+ JavaScript.
- **Engine**: Backtracking Search Algorithm with Constraint Satisfaction Problem (CSP) Pruning.
- **NLP & Sentiment Analysis**: Python Review Mining & Tokenizer on 900+ real Everytime reviews.
- **Deployment**: Vercel Serverless Edge Network (SSL, HTTP/2, Global CDN).

---

## 📄 Bản quyền & Đóng góp

Dự án được phát triển phi lợi nhuận nhằm hỗ trợ cộng đồng sinh viên **Đại học Công nghệ Thông tin (UIT - VNU-HCM)**.  
Mọi đóng góp, báo lỗi hoặc gợi ý tính năng vui lòng tạo **Issue** hoặc **Pull Request**.

---
*Từ khóa SEO: tool dkhp uit, dkhp uit, dkhp, dang ky hoc phan uit, xếp tkb uit, tool xep tkb uit, xep thoi khoa bieu uit, thoi khoa bieu uit, review giang vien uit, phat song uit, script auto dkhp uit, auto dkhp uit, dkhpuit, uit tkb, dkhp.uit.edu.vn, dkhocphan uit, uit sniper.*
