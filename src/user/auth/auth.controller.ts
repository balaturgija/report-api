import {
  Body,
  Controller,
  Param,
  ParseEnumPipe,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDto, SignupDto, GenerateProductKeyDto } from '../dtos/auth.dto';
import { UserType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('/signup/:userType')
  async signUp(
    @Body() body: SignupDto,
    @Param('userType', new ParseEnumPipe(UserType)) userType: UserType,
  ) {
    if (userType !== UserType.BUYER) {
      if (!body.productKey) throw new UnauthorizedException();

      const validProductKey = `${body.email}-${userType}-${process.env.PRODUCT_SECRET}`;
      const isValidProductKey = await bcrypt.compare(
        validProductKey,
        body.productKey,
      );

      if (!isValidProductKey) throw new UnauthorizedException();
    }
    return this.authService.signUp(body, userType);
  }

  @Post('/signin/:userType')
  signIn(@Body() body: SigninDto) {
    return this.authService.signIn(body);
  }

  @Post('/key')
  generateProductKey(@Body() body: GenerateProductKeyDto) {
    return this.authService.generateProductKey(body.email, body.userType);
  }
}
