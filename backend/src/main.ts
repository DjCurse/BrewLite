import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module'; // Đã lược bỏ ObserveInstrument

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.enableCors();

  await app.listen(process.env.PORT ?? 3001);
  console.log('Backend BrewLite đang chạy tại: http://localhost:3001');
}
bootstrap();