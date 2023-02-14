import { ConflictException, HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UserType } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

interface SignupParams {
  email: string;
  password: string;
  name: string;
  phone: string;
}

interface SigninParams {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}
  async signUp(
    { email, password, name, phone }: SignupParams,
    userType: UserType,
  ) {
    const userExists = await this.prismaService.user.findUnique({
      where: { email: email },
    });
    if (userExists) throw new ConflictException();

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prismaService.user.create({
      data: {
        email,
        name,
        phone,
        password: hashedPassword,
        userType: userType,
      },
    });

    const token = await this.generateJwt(name, user.id);
    return token;
  }

  async signIn({ email, password }: SigninParams) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) throw new HttpException('Invalid credentails', 400);

    const hashedPassword = user.password;

    const isPasswordValid = await bcrypt.compare(password, hashedPassword);
    if (!isPasswordValid) throw new HttpException('Invalid password', 400);

    const token = await this.generateJwt(user.name, user.id);
    return token;
  }

  private async generateJwt(name: string, id: number) {
    return await jwt.sign({ name: name, id: id }, process.env.JWT_SECRET, {
      expiresIn: 3600,
    });
  }

  generateProductKey(email: string, userType: UserType) {
    const string = `${email}-${userType}-${process.env.PRODUCT_SECRET}`;
    return bcrypt.hash(string, 10);
  }
}
