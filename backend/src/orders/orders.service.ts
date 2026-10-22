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

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let total = 0; // Khớp với cột `total` trong schema.prisma của Như Ý
    const orderItemsData = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Sản phẩm với ID ${item.productId} không tồn tại`);
      }

      const lineTotal = product.price * item.qty;
      total += lineTotal;

      return {
        productId: item.productId,
        size: item.size,
        topping: item.topping || null,
        qty: item.qty,
        lineTotal, // Khớp với cột `lineTotal` trong schema.prisma
      };
    }); 

    // Tạo đơn hàng và chi tiết đơn trong một Transaction
    const order = await this.prisma.order.create({
      data: {
        userId,
        total, // Khớp với cột `total`
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