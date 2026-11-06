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
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${dto.orderId}`);
    }

    const currentStatus = order.status as OrderStatus;

    if (currentStatus === OrderStatus.PAYMENT_FAILED) {
      assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PENDING);
    } else if (currentStatus !== OrderStatus.PENDING) {
      // Nếu đơn đang ở PAID, COMPLETED, CANCELLED... -> hàm assertTransition sẽ chặn và báo lỗi ngay
      assertTransition(currentStatus, OrderStatus.PAID);
    }

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

    const { discountAmount, finalTotal, appliedCode } = applyPromoCode(
      order.total,
      dto.promoCode,
    );
    const earnedPoints = calculateLoyaltyPoints(finalTotal);
    return await this.prisma.$transaction(async (tx) => {
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