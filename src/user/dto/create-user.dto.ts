/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { Status, UserRole } from 'src/generated/prisma/enums';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsStrongPassword()
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  photo?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}
