import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import config from 'src/config/config';
import type { StringValue } from 'ms';
import { JwtPayload } from './auth.guard';
import sendMailer from 'src/helper/sendMailer';

@Injectable()
export class AuthService {
  constructor(
    public readonly prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async registerUser(createAuthDto: CreateAuthDto) {
    console.log(createAuthDto);
    const user = await this.prisma.user.findFirst({
      where: { email: createAuthDto.email },
    });

    if (user) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const hashPassword = await bcrypt.hash(
      createAuthDto.password,
      Number(config.bcryptSaltRounds),
    );
    console.log(hashPassword);

    if (!hashPassword) {
      throw new HttpException(
        'Failed to hash password',
        HttpStatus.BAD_REQUEST,
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const experOtp = new Date(new Date().getTime() + 10 * 60 * 1000);

    const result = await this.prisma.user.create({
      data: {
        name: createAuthDto.name,
        email: createAuthDto.email,
        password: hashPassword,
        otp,
        experOtp,
      },
    });

    await sendMailer(result.email, 'Verify your account', `<p>OTP: ${otp}</p>`);

    return result;
  }

  async verifyAccount(payload: { email: string; otp: string }) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { email: payload.email },
    });

    if (user.otp !== payload.otp) {
      throw new HttpException('Invalid OTP', HttpStatus.BAD_REQUEST);
    }

    if ((user.experOtp as Date) < new Date()) {
      throw new HttpException('OTP expired', HttpStatus.BAD_REQUEST);
    }

    const result = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otp: null,
        experOtp: null,
      },
    });

    return result;
  }

  async loginUser(payload: { email: string; password: string }) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { email: payload.email },
    });

    const isPasswordMatched = await bcrypt.compare(
      payload.password,
      user.password!,
    );

    if (!isPasswordMatched) {
      throw new HttpException('Invalid credentials', HttpStatus.BAD_REQUEST);
    }

    const accessToken = this.jwt.sign(
      { id: user.id, email: user.email, role: user.role } as JwtPayload,
      {
        secret: config.jwt.accessTokenSecret,
        expiresIn: config.jwt.accessTokenExpires as StringValue,
      },
    );

    const refreshToken = this.jwt.sign(
      { id: user.id, email: user.email, role: user.role } as JwtPayload,
      {
        secret: config.jwt.refreshTokenSecret,
        expiresIn: config.jwt.refreshTokenExpires as StringValue,
      },
    );

    return { accessToken, refreshToken };
  }
}
