# BAHA Group Ad Builder

MVP giúp chủ cửa hàng thiết lập cấu hình quảng cáo Meta Ads theo 8 bước, bằng tiếng Việt. Meta Ads chỉ được **mô phỏng**; không có API quảng cáo thật, thanh toán hoặc kích hoạt chiến dịch. Telegram là kênh thông báo **thật** sau khi chiến dịch đã được lưu.

## Chạy local

Yêu cầu Node.js 18+ (để có `fetch` tích hợp sẵn).

```bash
npm install
Copy-Item .env.example .env
# Điền TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID trong .env
npm run dev
```

Mở `http://localhost:5173`. API kiểm tra tại `http://localhost:3001/api/health`.

Nếu chưa cấu hình Telegram, ứng dụng vẫn lưu chiến dịch vào `localStorage` và hiển thị lỗi cấu hình rõ ràng; không có token nào được gửi xuống trình duyệt.

## Luồng an toàn

1. Người dùng hoàn thành 8 bước và kiểm tra cấu hình.
2. Ứng dụng lưu chiến dịch cục bộ với trạng thái `Chờ phê duyệt`.
3. Frontend gọi proxy Express `/api/telegram`.
4. Backend gọi Telegram Bot API bằng biến môi trường.
5. Không có lời gọi nào tới Meta Ads thật và không phát sinh chi phí.

## Kiểm thử build

```bash
npm run build
```
