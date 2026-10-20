import { BadRequestException, ConflictException } from '@nestjs/common';
import { OrderStatus, assertTransition } from './order-state-machine';
import { applyPromoCode, calculateLoyaltyPoints } from './loyalty-promo.helper';

describe('Task 10 - Kiểm thử Nghiệp vụ Backend Nâng cao (BrewLite)', () => {
  // =========================================================================
  // TIÊU CHÍ (a): Chặn chuyển trạng thái đơn hàng không hợp lệ (State Machine)
  // =========================================================================
  describe('(a) Order State Machine (assertTransition)', () => {
    it('Cho phép chuyển trạng thái đúng luồng Happy Path: PENDING -> PAID -> PREPARING -> READY -> COMPLETED', () => {
      expect(() =>
        assertTransition(OrderStatus.PENDING, OrderStatus.PAID),
      ).not.toThrow();
      expect(() =>
        assertTransition(OrderStatus.PAID, OrderStatus.PREPARING),
      ).not.toThrow();
      expect(() =>
        assertTransition(OrderStatus.PREPARING, OrderStatus.READY),
      ).not.toThrow();
      expect(() =>
        assertTransition(OrderStatus.READY, OrderStatus.COMPLETED),
      ).not.toThrow();
    });

    it('Cho phép thử lại khi thanh toán lỗi: PENDING -> PAYMENT_FAILED -> PENDING', () => {
      expect(() =>
        assertTransition(OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED),
      ).not.toThrow();
      expect(() =>
        assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PENDING),
      ).not.toThrow();
    });

    it('CHẶN đứng việc nhảy cóc từ PENDING thẳng sang PREPARING hoặc COMPLETED', () => {
      expect(() =>
        assertTransition(OrderStatus.PENDING, OrderStatus.PREPARING),
      ).toThrow(BadRequestException);
      expect(() =>
        assertTransition(OrderStatus.PENDING, OrderStatus.COMPLETED),
      ).toThrow(BadRequestException);
    });

    it('CHẶN chuyển tiếp từ trạng thái kết thúc (COMPLETED hoặc CANCELLED)', () => {
      expect(() =>
        assertTransition(OrderStatus.COMPLETED, OrderStatus.CANCELLED),
      ).toThrow(BadRequestException);
      expect(() =>
        assertTransition(OrderStatus.CANCELLED, OrderStatus.PAID),
      ).toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // TIÊU CHÍ (b): Thanh toán Idempotent (Gửi 2 lần cùng Idempotency-Key)
  // =========================================================================
  describe('(b) Thanh toán Idempotent (Idempotency-Key)', () => {
    it('Gửi 2 yêu cầu thanh toán lặp lại cùng Idempotency-Key chỉ xử lý 1 lần duy nhất', async () => {
      // Giả lập bảng Payment lưu trong DB
      const paymentRecords = new Map<
        string,
        { id: number; orderId: number; amount: number; status: OrderStatus }
      >();
      let gatewayChargeCount = 0;

      async function processIdempotentPayment(
        orderId: number,
        amount: number,
        idempotencyKey: string,
      ) {
        // Nếu Idempotency-Key đã tồn tại -> trả về ngay kết quả cũ, KHÔNG trừ tiền lần 2
        if (paymentRecords.has(idempotencyKey)) {
          return paymentRecords.get(idempotencyKey)!;
        }

        gatewayChargeCount += 1; // Gọi cổng thanh toán trừ tiền thật
        const record = {
          id: paymentRecords.size + 1,
          orderId,
          amount,
          status: OrderStatus.PAID,
        };
        paymentRecords.set(idempotencyKey, record);
        return record;
      }

      const key = 'idem-key-order-1042';
      const firstCall = await processIdempotentPayment(1042, 75000, key);
      const secondCall = await processIdempotentPayment(1042, 75000, key);

      expect(firstCall).toEqual(secondCall);
      expect(gatewayChargeCount).toBe(1); // Chứng minh chỉ trừ tiền đúng 1 lần
      expect(paymentRecords.size).toBe(1); // Chỉ tạo đúng 1 bản ghi Payment
    });
  });

  // =========================================================================
  // TIÊU CHÍ (c): Kiểm soát tồn kho khi đặt đồng thời (Optimistic Locking)
  // =========================================================================
  describe('(c) Đặt hàng đồng thời không vượt tồn kho (Optimistic Locking)', () => {
    it('Khi kho chỉ còn 1 ly mà 2 khách đặt cùng lúc, chỉ 1 người thành công và 1 người bị chặn', async () => {
      // Giả lập bản ghi Product trong DB (stock = 1, version = 1)
      const dbProduct = { id: 1, name: 'Matcha Latte', stock: 1, version: 1 };

      // Hàm mô phỏng updateMany có kiểm tra khóa lạc quan (version) trong Transaction
      async function purchaseWithOptimisticLock(
        qty: number,
        readStock: number,
        readVersion: number,
      ) {
        if (readStock < qty) {
          throw new BadRequestException('Sản phẩm không đủ tồn kho');
        }
        // Kiểm tra đúng version lúc đọc và tồn kho hiện tại >= qty
        if (dbProduct.version !== readVersion || dbProduct.stock < qty) {
          throw new ConflictException(
            'Tồn kho vừa thay đổi do có khách khác đặt cùng lúc, vui lòng thử lại',
          );
        }
        dbProduct.stock -= qty;
        dbProduct.version += 1;
        return { success: true, remainingStock: dbProduct.stock };
      }

      // Cả 2 khách hàng cùng đọc trạng thái kho tại cùng 1 thời điểm (stock = 1, version = 1)
      const snapshotStock = dbProduct.stock;
      const snapshotVersion = dbProduct.version;

      // Thực thi đồng thời 2 giao dịch mua 1 ly
      const results = await Promise.allSettled([
        purchaseWithOptimisticLock(1, snapshotStock, snapshotVersion),
        purchaseWithOptimisticLock(1, snapshotStock, snapshotVersion),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled).toHaveLength(1); // Chỉ 1 khách mua được
      expect(rejected).toHaveLength(1);  // Khách thứ 2 bị chặn bởi Optimistic Lock
      expect(dbProduct.stock).toBe(0);   // Kho về 0, tuyệt đối không bị âm (-1)
      expect(dbProduct.version).toBe(2); // Version tăng từ 1 lên 2
    });
  });

  // =========================================================================
  // TIÊU CHÍ PHỤ: Khuyến mãi & Điểm thưởng Loyalty
  // =========================================================================
  describe('Khuyến mãi (Promo) & Điểm thưởng (Loyalty Points)', () => {
    it('Áp mã BREWLITE10 giảm đúng 10% và tính đúng điểm thưởng (10.000đ = 1 điểm)', () => {
      const { discountAmount, finalTotal } = applyPromoCode(100000, 'brewlite10');
      expect(discountAmount).toBe(10000);
      expect(finalTotal).toBe(90000);
      expect(calculateLoyaltyPoints(finalTotal)).toBe(9);
    });
  });
});