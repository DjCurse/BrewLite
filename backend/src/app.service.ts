import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service'; 

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllProducts() {
    return await this.prisma.product.findMany();
  }

  async getProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: id }, 
    });

    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có ID: ${id}`);
    }

    return product;
  }
}
