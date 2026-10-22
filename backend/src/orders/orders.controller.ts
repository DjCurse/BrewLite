import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common'; // <-- Thêm Get vào đây
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(@Request() req: any, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.userId, createOrderDto);
  } 

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyOrders(@Request() req: any) {
    return this.ordersService.getOrdersByUser(req.user.userId);
  }
}