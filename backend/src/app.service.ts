import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getProducts() {
    try {
      return await this.prisma.product.findMany({
        orderBy: { id: 'asc' },
      });
    } catch (error: any) {
      return { status: 'Connection failed', error: error.message };
    }
  }

  async getProductById(id: number) {
    try {
      return await this.prisma.product.findUnique({
        where: { id }, 
      });
    } catch (error: any) {
      return { status: 'Query failed', error: error.message };
    }
  }
}