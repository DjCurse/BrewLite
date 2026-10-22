import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payment/payments.module';

@Module({
  imports: [AuthModule, OrdersModule, PaymentsModule], 
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}