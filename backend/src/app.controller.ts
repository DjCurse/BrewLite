import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('products')
  async getProducts() {
    return this.appService.getProducts();
  }

  @Get('products/:id')
  async getProductById(@Param('id') id: string) {
    const product = await this.appService.getProductById(Number(id));
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    return product;
  }
}