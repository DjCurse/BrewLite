import { BadRequestException } from '@nestjs/common';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Bảng ánh xạ chính xác theo Sơ đồ Mục 9.1 trong đề bài
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.PAID,           // Thanh toán OK
    OrderStatus.PAYMENT_FAILED, // Thanh toán lỗi
    OrderStatus.CANCELLED,      // Khách hủy đơn khi chưa trả tiền
  ],
  [OrderStatus.PAYMENT_FAILED]: [
    OrderStatus.PENDING,        // Thử thanh toán lại
    OrderStatus.CANCELLED,      // Hủy đơn
  ],
  [OrderStatus.PAID]: [
    OrderStatus.PREPARING,      // Barista nhận đơn
    OrderStatus.CANCELLED,      // Hủy đơn (hoàn tiền)
  ],
  [OrderStatus.PREPARING]: [
    OrderStatus.READY,          // Pha chế xong
  ],
  [OrderStatus.READY]: [
    OrderStatus.COMPLETED,      // Giao khách thành công
  ],
  // COMPLETED và CANCELLED là 2 trạng thái kết thúc, không được đi tiếp
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

/**
 * Kiểm tra xem đơn hàng có được phép chuyển từ trạng thái `current` sang `next` hay không.
 * Ném lỗi BadRequestException nếu chuyển trạng thái sai quy trình.
 */
export function assertTransition(
  current: OrderStatus,
  next: OrderStatus,
): void {
  const allowedNextStates = VALID_TRANSITIONS[current] ?? [];
  if (!allowedNextStates.includes(next)) {
    throw new BadRequestException(
      `Chuyển trạng thái đơn hàng không hợp lệ: Không thể chuyển từ [${current}] sang [${next}]`,
    );
  }
}