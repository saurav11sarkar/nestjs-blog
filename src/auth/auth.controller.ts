import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';

import sendResponse from 'src/utils/sendResponse';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerUser(@Body() createAuthDto: CreateAuthDto) {
    const result = await this.authService.registerUser(createAuthDto);
    return sendResponse({
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'User created successfully',
      data: result,
    });
  }

  @Post('verify-account')
  @HttpCode(HttpStatus.OK)
  async verifyAccount(@Body() payload: { email: string; otp: string }) {
    const result = await this.authService.verifyAccount(payload);
    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User verified successfully',
      data: result,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginUser(@Body() payload: { email: string; password: string }) {
    const result = await this.authService.loginUser(payload);
    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User logged in successfully',
      data: result,
    });
  }
}
