import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('products')
  async getAllProducts() {
    return this.appService.getProducts();
  }

  @Get('products/:id')
  async getProductById(@Param('id') id: string) {
  
    return this.appService.getProductById(Number(id));
  }
}