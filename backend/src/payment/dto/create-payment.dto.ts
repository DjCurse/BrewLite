import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsInt()
  @Min(1)
  orderId: number;

  @IsString()
  @IsIn(['WALLET', 'CARD', 'QR_CODE'], {
    message: 'Phương thức thanh toán chỉ chấp nhận WALLET, CARD hoặc QR_CODE',
  })
  method: 'WALLET' | 'CARD' | 'QR_CODE';

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @IsBoolean()
  simulateFailure?: boolean;
}