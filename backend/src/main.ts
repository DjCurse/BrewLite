import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  app.enableCors();

  await app.listen(process.env.PORT ?? 3001);
  console.log('Backend BrewLite đang chạy tại: http://localhost:3001');
}
void bootstrap();
