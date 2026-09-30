# Champion Arena-Cards Plan (2026-09-16) — CHƯA CODE, CHỜ DUYỆT

## Chốt layout (user 2026-09-16)
Cards lên **arena**, ngay dưới thanh máu tổng (timebar). Arena chứa:
bossbar (timebar) → clock countdown → champ-cards → Boss/Hero → food-col trên đầu
Player → combo-star trên Player. Deck giữ nguyên judge/meter/shop.

## Code Champion hiện tại (đã có trong index.html, KHÔNG động Timer)
- `#champ-cards` absolute trong arena (`top:64px;bottom:200px`), `.champ-card` beyaz
  border vàng + nút ✓/✗ riêng từng thẻ + badge `champ-time` + overlay judged.
- `body.champ-play #deck{display:none}` — deck ẩn trong Champion (giữ hay bỏ: CHỜ DUYỆT).
- `body.champ-play #clock-display{display:none}` — clock ẩn (user muốn HIỆN countdown).
- `#champ-food-col` absolute, food dọc trên Player, xám khi thiếu mana.
- `#champ-combo-star` absolute 5 lửa hình sao trên Player.
- JS champ*: pool IndexedDB riêng, grid paste Excel, auto-fill, draw round 2-7 thẻ,
  Time Front bar chưa có, countdown clock Champion chưa có (clock Timer dùng
  remainingTimeMs; Champion dùng updateChampGame (bossProgress theo deck×cardSec)).

## Việc cần làm (sau duyệt)
1. Clock Champion hiện countdown tổng (vị trí y cũ) — quyết định lấy từ input nào.
2. `#champ-cards` lên ngay dưới bossbar (top ~8px, max-height ~38%), không che Boss/Hero.
3. Quyết định: giữ hay hiện deck trong Champion (hiện deck đang display:none).
4. Food-col + combo-star: giữ nguyên hay chỉnh vị trí theo cards mới.
5. Time Front bar (dưới bossbar hoặc trên cards) — thanh riêng, không lẫn timebar tổng.
6. Judge: nút ✓/✗ từng thẻ + phím + click trái/phải; sai fade mờ (pokemon-pvp).
7. Verify Timer untouched: startArena guard, champ-play class cleanup, clock Timer y nguyên.

## Rủi ro đã biết
- Cards 5-7 lá tràn arena nhỏ → cần co card/flex-wrap.
- Boss đi qua cards → cards z-index trên nhưng pointer-events chỉ trên thẻ.
- Timebar tổng vs Time Front bar dễ nhầm → tách màu/vị trí rõ.
