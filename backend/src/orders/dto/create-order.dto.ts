import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsInt({ message: 'productId phải là số nguyên' })
  @IsNotEmpty({ message: 'productId không được để trống' })
  productId: number;

  @IsString()
  @IsNotEmpty({ message: 'size không được để trống' })
  size: string;

  @IsString()
  @IsOptional() // Topping có thể có hoặc không
  topping?: string;

  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  qty: number;

  @IsInt({ message: 'lineTotal phải là số nguyên' })
  lineTotal: number;
}

export class CreateOrderDto {
  @IsArray({ message: 'Danh sách sản phẩm phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}