import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as supertest from 'supertest';
import { AppModule } from './../src/app.module';

const request = ((
  supertest as unknown as { default?: supertest.SuperTestStatic }
).default ?? supertest) as supertest.SuperTestStatic;

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/products (GET) - Lấy danh sách sản phẩm', async () => {
    const res = await request(app.getHttpServer())
      .get('/products')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('/products/999999 (GET) - Trả về 404 khi không tìm thấy sản phẩm', () => {
    return request(app.getHttpServer()).get('/products/999999').expect(404);
  });

  afterEach(async () => {
    await app.close();
  });
});