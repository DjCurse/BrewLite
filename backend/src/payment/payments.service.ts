import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrderStatus, assertTransition } from '../orders/order-state-machine';
import {
  applyPromoCode,
  calculateLoyaltyPoints,
} from '../orders/loyalty-promo.helper';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Xử lý thanh toán đơn hàng (Task 8 + Task 10):
   * 1. Idempotent bằng Idempotency-Key
   * 2. Kiểm tra chuyển trạng thái hợp lệ bằng Order State Machine
   * 3. Transaction + Optimistic Locking (kiểm tra version & stock) chống bán vượt tồn kho
   * 4. Áp mã khuyến mãi & cộng điểm thưởng Loyalty sau khi đơn PAID
   */
  async processPayment(dto: CreatePaymentDto, idempotencyKey: string) {
    const cleanKey = idempotencyKey?.trim();
    if (!cleanKey) {
      throw new BadRequestException(
        'Thiếu header "Idempotency-Key" để chống thanh toán lặp',
      );
    }

    // =========================================================================
    // 1. KIỂM TRA IDEMPOTENCY (Tính lũy đẳng - Task 10.2)
    // Nếu Idempotency-Key này đã từng được xử lý, trả về ngay kết quả cũ,
    // tuyệt đối không trừ tiền hay trừ tồn kho lần thứ 2.
    // =========================================================================
    const existingPayment = await this.prisma.payment.findUnique({
      where: { idempotencyKey: cleanKey },
      include: { order: true },
    });

    if (existingPayment) {
      return {
        isIdempotentReplay: true,
        message: 'Yêu cầu thanh toán lặp lại — trả về kết quả giao dịch đã xử lý trước đó',
        payment: existingPayment,
        orderStatus: existingPayment.order.status,
      };
    }

    // =========================================================================
    // 2. TẢI ĐƠN HÀNG & KIỂM TRA MÁY TRẠNG THÁI (State Machine - Task 10.1)
    // =========================================================================
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${dto.orderId}`);
    }

    const currentStatus = order.status as OrderStatus;

    // Nếu đơn đang ở PAYMENT_FAILED (khách bấm thử thanh toán lại),
    // chuyển hợp lệ về PENDING trước khi xử lý tiếp theo sơ đồ Mục 9.1
    if (currentStatus === OrderStatus.PAYMENT_FAILED) {
      assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PENDING);
    } else if (currentStatus !== OrderStatus.PENDING) {
      // Nếu đơn đang ở PAID, COMPLETED, CANCELLED... -> hàm assertTransition sẽ chặn và báo lỗi ngay
      assertTransition(currentStatus, OrderStatus.PAID);
    }

    // =========================================================================
    // 3. MÔ PHỎNG CỔNG THANH TOÁN LỖI (US-05 & Sơ đồ Mục 9.1)
    // Nếu thanh toán thất bại -> Đơn chuyển sang PAYMENT_FAILED, giữ nguyên tồn kho
    // =========================================================================
    if (dto.simulateFailure) {
      assertTransition(OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED);

      const failedOrder = await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAYMENT_FAILED },
      });

      return {
        isIdempotentReplay: false,
        message: 'Thanh toán thất bại từ cổng thanh toán. Đơn hàng chuyển sang PAYMENT_FAILED.',
        payment: null,
        orderStatus: failedOrder.status,
      };
    }

    // Kiểm tra hợp lệ chuyển từ PENDING -> PAID
    assertTransition(OrderStatus.PENDING, OrderStatus.PAID);

    // =========================================================================
    // 4. TÍNH KHUYẾN MÃI & ĐIỂM THƯỞNG LOYALTY (Task 10.4)
    // =========================================================================
    const { discountAmount, finalTotal, appliedCode } = applyPromoCode(
      order.total,
      dto.promoCode,
    );
    const earnedPoints = calculateLoyaltyPoints(finalTotal);

    // =========================================================================
    // 5. GIAO DỊCH NGUYÊN TỬ (PRISMA TRANSACTION) + OPTIMISTIC LOCKING (Task 10.3)
    // Tất cả các bước: Trừ kho (kèm kiểm tra version) -> Tạo Payment -> Đổi trạng thái Order
    // -> Cộng điểm Loyalty cho User đều nằm trong 1 Transaction duy nhất.
    // =========================================================================
    return await this.prisma.$transaction(async (tx) => {
      // 5.1. Duyệt từng món trong đơn để trừ kho với Khóa lạc quan (Optimistic Locking)
      for (const item of order.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(
            `Sản phẩm ID #${item.productId} không còn tồn tại`,
          );
        }

        if (product.stock < item.qty) {
          throw new BadRequestException(
            `Món "${product.name}" chỉ còn ${product.stock} ly trong kho (bạn đặt ${item.qty} ly)`,
          );
        }

        // TRỌNG TÂM OPTIMISTIC LOCKING:
        // Chỉ cập nhật nếu `version` trong DB vẫn khớp với `product.version` vừa đọc ra
        // VÀ `stock` vẫn >= số lượng cần mua (`item.qty`).
        const updateResult = await tx.product.updateMany({
          where: {
            id: product.id,
            version: product.version,
            stock: { gte: item.qty },
          },
          data: {
            stock: { decrement: item.qty },
            version: { increment: 1 }, // Tăng version lên 1 để chặn các giao dịch đồng thời khác
          },
        });

        // Nếu count === 0 nghĩa là ngay ở mili-giây vừa rồi đã có khách khác mua mất
        // làm thay đổi version hoặc làm cạn stock -> Rollback toàn bộ Transaction!
        if (updateResult.count === 0) {
          throw new ConflictException(
            `Tồn kho của món "${product.name}" vừa thay đổi do có khách hàng khác đặt cùng lúc. Vui lòng thử lại!`,
          );
        }
      }

      // 5.2. Lưu bản ghi Payment với Idempotency-Key
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          idempotencyKey: cleanKey,
          amount: finalTotal,
          method: dto.method,
        },
      });

      // 5.3. Cập nhật trạng thái đơn hàng sang PAID và lưu tổng tiền sau khuyến mãi
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          total: finalTotal,
        },
      });

      // 5.4. Cộng điểm tích lũy (Loyalty Points) cho khách hàng
      const updatedUser = await tx.user.update({
        where: { id: order.userId },
        data: {
          loyaltyPoints: { increment: earnedPoints },
        },
        select: {
          id: true,
          email: true,
          loyaltyPoints: true,
        },
      });

      return {
        isIdempotentReplay: false,
        message: 'Thanh toán đơn hàng thành công',
        payment,
        orderStatus: updatedOrder.status,
        pricing: {
          originalTotal: order.total,
          discountAmount,
          finalTotal,
          appliedPromoCode: appliedCode,
        },
        loyalty: {
          earnedPoints,
          totalLoyaltyPoints: updatedUser.loyaltyPoints,
        },
      };
    });
  }
}