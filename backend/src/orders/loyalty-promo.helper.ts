import { BadRequestException } from '@nestjs/common';

export type PromoRule = {
  code: string;
  discountPercent?: number;
  fixedDiscount?: number;
  minOrderTotal: number;
  maxDiscount?: number;
  description: string;
};

// Danh sách mã giảm giá hợp lệ của quán BrewLite
export const PROMO_CODES: Record<string, PromoRule> = {
  FREESHIP: {
    code: 'FREESHIP',
    fixedDiscount: 15000,
    minOrderTotal: 50000,
    description: 'Giảm 15.000đ cho đơn từ 50.000đ',
  },
  BREWLITE10: {
    code: 'BREWLITE10',
    discountPercent: 10,
    minOrderTotal: 40000,
    maxDiscount: 20000,
    description: 'Giảm 10% (tối đa 20.000đ) cho đơn từ 40.000đ',
  },
  SGU2026: {
    code: 'SGU2026',
    fixedDiscount: 10000,
    minOrderTotal: 30000,
    description: 'Ưu đãi sinh viên giảm 10.000đ cho đơn từ 30.000đ',
  },
};

/**
 * Tính số tiền được giảm và tổng tiền cuối cùng sau khi áp mã khuyến mãi
 */
export function applyPromoCode(
  subtotal: number,
  rawPromoCode?: string,
): { discountAmount: number; finalTotal: number; appliedCode: string | null } {
  if (!rawPromoCode || !rawPromoCode.trim()) {
    return { discountAmount: 0, finalTotal: subtotal, appliedCode: null };
  }

  const normalized = rawPromoCode.trim().toUpperCase();
  const rule = PROMO_CODES[normalized];

  if (!rule) {
    throw new BadRequestException(`Mã giảm giá "${normalized}" không tồn tại`);
  }

  if (subtotal < rule.minOrderTotal) {
    throw new BadRequestException(
      `Mã "${normalized}" chỉ áp dụng cho đơn hàng từ ${rule.minOrderTotal.toLocaleString('vi-VN')}đ`,
    );
  }

  let discount = 0;
  if (rule.fixedDiscount) {
    discount = rule.fixedDiscount;
  } else if (rule.discountPercent) {
    discount = Math.round((subtotal * rule.discountPercent) / 100);
    if (rule.maxDiscount) {
      discount = Math.min(discount, rule.maxDiscount);
    }
  }

  const finalTotal = Math.max(0, subtotal - discount);
  return {
    discountAmount: discount,
    finalTotal,
    appliedCode: normalized,
  };
}

/**
 * Quy đổi điểm thưởng tích lũy (Loyalty Points) sau khi đơn hàng chuyển sang PAID
 * Quy tắc: Mỗi 10.000đ thanh toán thực tế = +1 điểm thưởng
 */
export function calculateLoyaltyPoints(paidTotal: number): number {
  if (paidTotal <= 0) return 0;
  return Math.floor(paidTotal / 10000);
}