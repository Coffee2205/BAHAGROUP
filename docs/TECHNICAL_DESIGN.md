# Technical Design Document: Hệ thống Thiết lập Quảng cáo Trả phí Tự động

## 1. Kiến trúc hệ thống & Công nghệ (Tech Stack)
- **Frontend / UI Layer:** ReactJS kết hợp Tailwind CSS và thư viện biểu tượng `lucide-react` để đảm bảo tốc độ triển khai nhanh, giao diện hiện đại và responsive trên mọi thiết bị.
- **State Management:** Sử dụng React `useState` để quản lý luồng dữ liệu qua 8 bước Wizard.
- **Storage Layer:** Sử dụng trình duyệt `localStorage` để lưu trữ danh sách chiến dịch đã tạo, hỗ trợ xem lại danh sách ở Bước 8.
- **Integration Layer:** 
  - **Telegram Bot API:** Gửi yêu cầu HTTP `POST` trực tiếp tới `https://api.telegram.org/bot<BOT_TOKEN>/sendMessage` để thông báo thời gian thực về nhóm hoặc tài khoản quản lý.
  - **Meta/Google Ads Integration:** Ở giai đoạn MVP, tích hợp bộ kết nối dạng mô phỏng (Simulation Adapter) với đầy đủ thông số cấu trúc JSON chuẩn bị sẵn sàng cho việc map sang API chính thức khi được cấp quyền.

## 2. Cấu trúc mã nguồn đề xuất (Project Structure)
```text
src/
├── components/
│   ├── Step1Info.jsx         # Nhập thông tin sản phẩm
│   ├── Step2Objective.jsx    # Chọn mục tiêu
│   ├── Step3Audience.jsx     # Khu vực & đối tượng
│   ├── Step4Budget.jsx       # Ngân sách & thời gian
│   ├── Step5Content.jsx      # Nội dung & đề xuất AI
│   ├── Step6Preview.jsx      # Xem trước giao diện quảng cáo
│   ├── Step7Confirm.jsx      # Xác nhận thông tin
│   └── Step8Management.jsx   # Quản lý chiến dịch & Telegram Bot
├── utils/
│   └── telegram.js           # Hàm gọi API Telegram Bot
├── App.jsx                   # Component điều phối chính (Wizard State)
└── main.jsx                  # Điểm khởi chạy ứng dụng