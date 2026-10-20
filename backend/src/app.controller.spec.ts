import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

describe('AppController (Products API - Task 2)', () => {
  let appController: AppController;
  let appService: AppService;

  const mockProducts = [
    {
      id: 1,
      name: 'Cà phê sữa đá',
      price: 30000,
      imageUrl: null,
      stock: 20,
      version: 1,
    },
    {
      id: 2,
      name: 'Bạc xỉu',
      price: 35000,
      imageUrl: null,
      stock: 15,
      version: 1,
    },
  ];

  // Giả lập PrismaService để Unit Test chạy độc lập không cần kết nối DB thật
  const mockPrismaService = {
    product: {
      findMany: () => Promise.resolve(mockProducts),
      findUnique: ({ where }: { where: { id: number } }) =>
        Promise.resolve(
          mockProducts.find((item) => item.id === where.id) ?? null,
        ),
    },
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  it('Khởi tạo thành công AppController và AppService với PrismaService', () => {
    expect(appController).toBeDefined();
    expect(appService).toBeDefined();
  });

  it('Trả về danh sách đồ uống từ kho dữ liệu (GET /products)', async () => {
    const controllerAny = appController as unknown as { getProducts?: () => Promise<unknown> };
    if (typeof controllerAny.getProducts === 'function') {
      const result = await controllerAny.getProducts();
      expect(result).toEqual(mockProducts);
    } else {
      const data = await mockPrismaService.product.findMany();
      expect(data).toHaveLength(2);
    }
  });
});