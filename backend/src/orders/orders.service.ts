import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Giỏ hàng không được để trống');
    }

    // Lấy danh sách sản phẩm từ DB để tính tổng tiền và validate
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalPrice = 0;
    const orderItemsData = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Sản phẩm với ID ${item.productId} không tồn tại`);
      }

      const itemTotal = product.price * item.qty;
      totalPrice += itemTotal;

      return {
        productId: item.productId,
        size: item.size,
        qty: item.qty,
        price: product.price,
      };
    });

    // Tạo đơn hàng và chi tiết đơn trong một Transaction
    const order = await this.prisma.order.create({
      data: {
        userId,
        totalPrice,
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
      order: {
        id: order.id,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt,
        items: order.items,
      },
    };
  }
}