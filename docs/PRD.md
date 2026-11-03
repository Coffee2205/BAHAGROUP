# Product Requirement Document (PRD): Hệ thống Thiết lập Quảng cáo Trả phí Tự động

## 1. Tổng quan dự án & Mục tiêu sản phẩm
- **Bối cảnh:** Nhiều chủ cửa hàng và doanh nghiệp nhỏ (khoảng 45 tuổi) muốn chạy quảng cáo trả phí nhưng gặp khó khăn vì giao diện trình quản lý quảng cáo phức tạp, nhiều thuật ngữ chuyên môn (CPC, CPM, CTR) và dễ thao tác sai lầm gây lãng phí ngân sách[cite: 2].
- **Mục tiêu:** Xây dựng một ứng dụng web hướng dẫn từng bước (Wizard) giúp người dùng hoàn toàn không có chuyên môn marketing vẫn có thể tự thiết lập chiến dịch quảng cáo trả phí một cách trực quan, an toàn, được gợi ý nội dung và kiểm tra trước khi xác nhận[cite: 1, 2].

## 2. Đối tượng sử dụng (Target Users)
- Chủ cửa hàng, hộ kinh doanh cá thể, doanh nghiệp nhỏ (Ví dụ: Chủ cửa hàng dịch vụ làm đẹp tại TP.HCM).

## 3. Luồng sử dụng bắt buộc (8 bước Wizard)
1. **Bước 1 (Nhập thông tin):** Nhập tên sản phẩm/dịch vụ, mô tả ngắn và tùy chọn hình ảnh/video[cite: 2].
2. **Bước 2 (Chọn kết quả mong muốn):** Lựa chọn mục tiêu kinh doanh (Ví dụ: Có thêm khách hàng liên hệ tư vấn, tăng truy cập, tăng doanh số)[cite: 2].
3. **Bước 3 (Chọn đối tượng & khu vực):** Nhập vị trí (Mặc định gợi ý TP.HCM theo kịch bản mẫu) và hệ thống gợi ý nhóm khách hàng phù hợp[cite: 2, 3].
4. **Bước 4 (Ngân sách & Thời gian):** Nhập ngân sách theo ngày (Mặc định 200.000đ/ngày) và số ngày chạy (Mặc định 7 ngày), hệ thống tự động tính tổng chi phí và hiển thị cảnh báo hợp lệ[cite: 2, 3].
5. **Bước 5 (Hoàn thiện nội dung):** Hệ thống đề xuất tiêu đề, nội dung quảng cáo, nút kêu gọi hành động (CTA) và cho phép người dùng chỉnh sửa trực tiếp[cite: 2].
6. **Bước 6 (Xem trước - Preview):** Hiển thị khung giả lập giao diện quảng cáo trực quan trên bảng tin mạng xã hội[cite: 2].
7. **Bước 7 (Kiểm tra & Xác nhận):** Tổng hợp toàn bộ thông tin cấu hình, yêu cầu người dùng xác nhận trước khi lưu; tuyệt đối không tự động chạy quảng cáo trả phí thật[cite: 2, 3].
8. **Bước 8 (Quản lý & Thông báo):** Hiển thị danh sách chiến dịch đã tạo với trạng thái rõ ràng và gửi thông báo qua Telegram[cite: 2].

## 4. Yêu cầu chức năng cốt lõi
- **Trạng thái chiến dịch:** Phân định rõ ràng các trạng thái: `Bản nháp`, `Mô phỏng`, `Chờ phê duyệt`, `Đã gửi nền tảng`, `Đang chạy thực tế`[cite: 2].
- **Tích hợp Telegram:** Gửi tin nhắn THẬT qua Telegram Bot API ngay khi người dùng xác nhận lưu chiến dịch thành công (bao gồm tên, mục tiêu, ngân sách, thời gian, trạng thái)[cite: 2].
## Cập nhật Phạm vi Nền tảng Quảng cáo & Thông báo
1. **Nền tảng quảng cáo được chọn:** thêm **Google Ads làm nền tảng quảng cáo cốt lõi thứ hai, cho phép người dùng linh hoạt lựa chọn loại hình chiến dịch (quảng cáo tìm kiếm, hiển thị hoặc video YouTube)[cite: 2].
2. **Yêu cầu bắt buộc về Telegram:** 
   - Telegram **không** được tính là nền tảng quảng cáo thay thế[cite: 2].
   - Telegram bắt buộc là kênh **nhận thông báo THẬT** về hoạt động của hệ thống (khi người dùng hoàn tất xác nhận lưu/gửi chiến dịch, tin nhắn phải xuất hiện lập tức trên Telegram chứa đầy đủ: Tên chiến dịch, nền tảng đã chọn, ngân sách, thời gian và trạng thái)[cite: 2, 3].