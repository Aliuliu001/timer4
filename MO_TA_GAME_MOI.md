# Mô tả Game TIMER mới (đưa qua Google AI Studio)

> Copy toàn bộ file này dán vào Google AI Studio, nói thêm 1 câu:
> "Chỉ làm khung + màu sắc + bố cục đẹp. KHÔNG cần viết luật chơi."

---

## 1. Game này là gì

Game trả lời câu hỏi tiếng Anh cho lớp học. Quản trò bấm đúng/sai, Boss bên trái đi dần qua bạn (Hero) bên phải. Hết giờ mà Boss chưa chạm bạn là thắng.

## 2. Bố cục màn hình (1 màn duy nhất)

```
+--------------------------------------------------+
|  [Tên game TIMER]        [Đồng hồ 02:00]         |
|  [Thanh dài: Boss tới gần........]               |
+--------------------------------------------------+
|                                                  |
|   (Boss bên trái)  ----đi dần--->  (Bạn bên phải)|
|    [hình Boss]                       [hình bạn]  |
|                                                  |
+--------------------------------------------------+
|  [Bảng câu hỏi hiện tại]                         |
|  [Nút ĐÚNG ✓ to]  [Nút SAI ✗ to]                |
|  [Điểm xanh: ●●●○○]  [Combo: 3/5]               |
|  [6 món ăn: Pizza | Kem | Nấm | Ớt | Mì | Cô]    |
+--------------------------------------------------+
|  Tab: [Chơi] [Nhập câu hỏi] [Cài đặt]            |
+--------------------------------------------------+
```

## 3. Tab "Nhập câu hỏi"

- Bảng như Excel: cột | ID | Câu hỏi | Đáp án | Hình |
- Nút: Tự đánh số ID, Hiện hình nhỏ xem trước, Lấy file trong máy, Tải file Excel lên, Xóa hết
- Lưu tự động, tắt mở lại vẫn còn

## 4. Tab "Cài đặt"

- Boss / Hero: chỗ dán link hình (Pinterest / Google) HOẶC tải hình từ máy lên. Hỗ trợ ảnh tĩnh + ảnh động (gif).
- Hình nền (background): chỗ dán link Pinterest HOẶC chọn cảnh rừng rậm. Mặc định là rừng rậm nếu chưa dán link.
- Nhạc nền: nút tải file nhạc từ máy lên (file mp3 để trong máy, KHÔNG dùng link ngoài để trình duyệt khỏi chặn). Code làm sẵn khung phát nhạc, file nhạc thêm sau cũng được.
- Đồng hồ: nút chọn nhanh 2 phút / 3 phút / 5 phút / 10 phút + ô tự gõ phút:giây (vì lúc chơi thường, lúc speaking cần dài hơn).
- Tốc độ Boss: Chậm / Vừa / Nhanh.
- Chỗ đặt phím bấm: phím nào là Đúng, phím nào là Sai.
- Ảnh món ăn: mỗi món có chỗ dán link hình "lúc ăn" + hình "sau khi ăn" (món Ớt, Mì cần 2 hình).

## 5. Khung 6 món ăn (FRAMEWORK — sau này thêm món mới chỉ cần thêm 1 dòng)

> Dặn AI Studio: "Vẽ 6 thẻ món ăn theo khung chung này, mỗi thẻ có: hình + tên + giá 5 điểm + ô dán link hình lúc ăn. Thêm món mới = copy 1 thẻ, không sửa luật."

| # | Món | Lúc ăn hiện gì | Sau khi ăn | Đứng yên mấy giây | Tác dụng thêm |
|---|-----|----------------|------------|-------------------|---------------|
| 1 | 🍕 Pizza | Ảnh Boss ăn pizza | Ngồi yên | 6 giây | Không |
| 2 | 🍦 Kem | Ảnh Boss ăn kem | Người phủ lớp băng | 4 giây | Vừa ăn vừa đóng băng |
| 3 | 🍄 Nấm | Ảnh Boss ăn nấm | Người xanh lè | 5 giây | Ăn xong đi chậm thêm 5 giây |
| 4 | 🌶️ Ớt | Ảnh Boss ăn ớt | Ảnh nằm quạt cho đỡ nóng | 4 giây | Vừa ăn vừa phun lửa + đi chậm 4 giây |
| 5 | 🍜 Mì (Noodles) | Ảnh Boss ăn mì | Ảnh ngồi rửa tô | 5 giây | Không |
| 6 | 👩‍🏫 Ảnh cô giáo | Ảnh Boss ăn cùng cô | Vừa đi vừa hiện chữ "I love you, Ms. Vi" nhỏ → to dần, font pixel kiểu Minecraft | 5 giây | Chữ chạy theo Boss |

Ghi chú món 6: text mặc định là "I love you, Ms. Vi". Font pixel kiểu Minecraft. Chữ nhỏ lúc đầu, to dần lên, chạy theo Boss lúc Boss đi tiếp.

## 6. Cách bấm đúng/sai (cả 3 cùng xài chung 1 ruột)

- Cách 1: 2 nút to trên màn hình ✓ / ✗
- Cách 2: phím tự đặt trên bàn phím
- Cách 3: click trong khung chơi — chuột trái = đúng, chuột phải = sai
- Cả 3 cùng bật một lúc được, thích xài cái nào thì xài.

## 7. Điểm + combo

- Đúng 1 câu = +1 điểm xanh (mana). Đủ 5 điểm = mua 1 món, chủ động ném lúc nào cũng được.
- Đúng 5 câu liên tiếp = tự ném 1 món ngẫu nhiên vào Boss (miễn phí).

## 8. Màu sắc + cảm giác

- Nền mặc định: rừng rậm (ảnh nền tối, chữ to rõ cho lớp học).
- Đồng hồ + thanh Boss là 2 thứ to nhất màn hình.
- 2 nút ĐÚNG / SAI to bằng nửa màn hình điện thoại, bấm dễ.
- Điểm xanh hiện dạng 5 chấm tròn, combo hiện dạng 3/5.
- 6 món ăn hiện dạng 6 thẻ có hình + tên + giá 5 điểm.
- Chữ món cô giáo: font pixel kiểu Minecraft.

## 9. Yêu cầu kỹ thuật (nói với AI Studio)

- 1 file HTML + 1 file trang trí CSS + 1 file code JS, KHÔNG dùng thư viện lạ.
- KHUNG MÓN ĂN viết dạng mảng/mẫu chung (1 mẫu dùng cho cả 6 món), thêm món thứ 7 chỉ cần thêm 1 dòng dữ liệu, không sửa code luật.
- KHUNG NHẠC viết sẵn nút phát/dừng + chỗ tải file mp3 local, file nhạc thật thêm sau.
- Chữ tiếng Việt có dấu hiện đúng.
- Mở trên laptop + điện thoại đều đẹp.
- Chỗ nào là luật chơi thì để trống hàm, ghi chú "DEV sẽ viết sau".
