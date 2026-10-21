import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsInt()
  @Min(1)
  orderId: number;

  @IsString()
  @IsIn(['WALLET', 'CARD'], {
    message: 'Phương thức thanh toán chỉ chấp nhận WALLET (Ví điện tử) hoặc CARD (Thẻ ngân hàng)',
  })
  method: 'WALLET' | 'CARD';

  @IsOptional()
  @IsString()
  promoCode?: string;

  // Cờ hỗ trợ khi Demo cho giảng viên: truyền true để giả lập cổng thanh toán báo lỗi -> chuyển đơn sang PAYMENT_FAILED
  @IsOptional()
  @IsBoolean()
  simulateFailure?: boolean;
}