import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SlaLoggingInterceptor } from './common/sla-logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new SlaLoggingInterceptor());

  await app.listen(process.env.PORT ?? 3001);
  console.log('Backend BrewLite đang chạy tại: http://localhost:3001');
}
bootstrap();