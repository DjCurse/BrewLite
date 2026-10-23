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

export type OrderStatusType = OrderStatus | `${OrderStatus}`;

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.PAID,          
    OrderStatus.PAYMENT_FAILED,
    OrderStatus.CANCELLED,     
  ],
  [OrderStatus.PAYMENT_FAILED]: [
    OrderStatus.PENDING,     
    OrderStatus.CANCELLED,     
  ],
  [OrderStatus.PAID]: [
    OrderStatus.PREPARING,     
    OrderStatus.CANCELLED,     
  ],
  [OrderStatus.PREPARING]: [
    OrderStatus.READY,          
  ],
  [OrderStatus.READY]: [
    OrderStatus.COMPLETED,      
  ],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

export function assertTransition(
  current: OrderStatusType | string,
  next: OrderStatusType | string,
): void {
  const allowedNextStates = VALID_TRANSITIONS[current as OrderStatus] ?? [];
  if (!allowedNextStates.includes(next as OrderStatus)) {
    throw new BadRequestException(
      `Chuyển trạng thái đơn hàng không hợp lệ: Không thể chuyển từ [${current}] sang [${next}]`,
    );
  }
}