import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import sendResponse from 'src/utils/sendResponse';
import { fileUpload } from 'src/helper/fileUploades';
import type { Request } from 'express';
import pick from 'src/helper/pick';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @UseGuards(AuthGuard('user', 'admin', 'super_admin'))
  @HttpCode(HttpStatus.OK)
  async profile(@Req() req: Request) {
    console.log(req.user!.id);
    const result = await this.userService.profile(req.user!.id);

    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User found successfully',
      data: result,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const result = await this.userService.createUser(createUserDto);

    return sendResponse({
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'User created successfully',
      data: result,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAllUser(@Req() req: Request) {
    const filters = pick(req.query, ['searchTerm', 'name', 'email', 'role']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.userService.findAllUser(filters, options);

    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User found successfully',
      meta: result.meta,
      data: result.data,
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOneUser(@Param('id') id: string) {
    const result = await this.userService.findOneUser(id);

    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User found successfully',
      data: result,
    });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('profilePhoto', fileUpload.uploadConfig))
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.userService.updateUser(id, updateUserDto, file);

    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User updated successfully',
      data: result,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    const result = await this.userService.deleteUser(id);

    return sendResponse({
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User deleted successfully',
      data: result,
    });
  }
}
