import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tài khoản khách mẫu: mật khẩu đã được băm sẵn bằng bcrypt.
// Email/mật khẩu này chỉ dùng trong môi trường phát triển và kiểm thử.
const demoCustomer = {
  email: 'customer@brewlite.local',
  password: 'BrewLite123!',
  passwordHash: '$2b$10$G9sVVuFLJZjxMyDgbB2ikeKwKbc9HGPdrP95g0F0tt8ffmpLiRJcS',
};

const products = [
  {
    name: 'Cà phê sữa đá',
    price: 30000,
    imageUrl: null,
    stock: 20,
  },
  {
    name: 'Bạc xỉu',
    price: 35000,
    imageUrl: null,
    stock: 15,
  },
  {
    name: 'Trà đào cam sả',
    price: 40000,
    imageUrl: null,
    stock: 12,
  },
  {
    name: 'Trà sữa trân châu',
    price: 45000,
    imageUrl: null,
    stock: 25,
  },
];

async function main() {
  await prisma.user.upsert({
    where: { email: demoCustomer.email },
    update: { passwordHash: demoCustomer.passwordHash },
    create: {
      email: demoCustomer.email,
      passwordHash: demoCustomer.passwordHash,
      loyaltyPoints: 0,
    },
  });

  console.log('Đã tạo/cập nhật tài khoản khách mẫu:');
  console.log(`  Email: ${demoCustomer.email}`);
  console.log(`  Mật khẩu test: ${demoCustomer.password}`);

  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
    });

    if (!existing) {
      await prisma.product.create({ data: product });
      console.log(`Đã thêm: ${product.name}`);
    } else {
      console.log(`Đã tồn tại: ${product.name}`);
    }
  }

  console.log('Hoàn tất thêm dữ liệu mẫu BrewLite!');
}

main()
  .catch((error) => {
    console.error('Lỗi khi thêm dữ liệu mẫu:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
