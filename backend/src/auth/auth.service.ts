import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Băm mật khẩu (Mục 4.2: Bảo mật)
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Lưu vào bảng User (Khớp với trường passwordHash của Như Ý)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        loyaltyPoints: 0,
      },
    });

    return {
      message: 'Đăng ký tài khoản thành công',
      user: { id: user.id, email: user.email },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // So sánh mật khẩu khách nhập với passwordHash trong DB
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Khớp 100% với JwtStrategy
    const payload = { sub: user.id, email: user.email };
    
    return {
      // Key này khớp chính xác với frontend của Tuyết Trâm đang gọi: body.access_token
      access_token: this.jwtService.sign(payload),
    };
  }
}