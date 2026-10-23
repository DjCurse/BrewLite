import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(userId: number, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Giỏ hàng không được để trống');
    }

    const productIds = dto.items.map((i: any) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let total = 0; 
    const orderItemsData = dto.items.map((item: any) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Sản phẩm với ID ${item.productId} không tồn tại`);
      }

      const quantity = item.qty ?? 1;
      
      // ƯU TIÊN SỐ 1: Lấy trực tiếp lineTotal do Frontend truyền lên (Đã cộng chuẩn Size + Topping ở giỏ hàng)
      // Nếu không có thì fallback về giá gốc nhân số lượng
      const lineTotal = Number(item.lineTotal || (Number(product.price) * quantity));
      const unitPrice = lineTotal / quantity; // Suy ra đơn giá chuẩn để lưu DB

      total += lineTotal;

      return {
        productId: item.productId,
        size: item.size || 'M',
        topping: item.topping || null,
        price: unitPrice, // Lưu chuẩn đơn giá đã có topping vào DB
        qty: quantity,
        lineTotal, 
      };
    }); 

    // Tạo đơn hàng và chi tiết đơn trong một Transaction
    const order = await this.prisma.order.create({
      data: {
        userId,
        total,
        status: 'PENDING',
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return {
      message: 'Tạo đơn hàng thành công',
      order,
    };
  } 

  async getOrdersByUser(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}