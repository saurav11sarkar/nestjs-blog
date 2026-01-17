import {
  Controller,
  Get,
  Post,
  Body,
  // Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import sendResponse from 'src/utils/sendResponse';
import { AuthGuard } from 'src/auth/auth.guard';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileUpload } from 'src/helper/fileUploades';
import pick from 'src/helper/pick';
import { Prisma } from 'src/generated/prisma/client';
import { ResponseInterceptor } from 'src/utils/interceptors/interceptors.interceptor';

@UseInterceptors(ResponseInterceptor)
@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseGuards(AuthGuard('user'))
  @UseInterceptors(FileInterceptor('thumbnal', fileUpload.uploadConfig))
  async create(
    @Body() createPostDto: CreatePostDto,
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const userId = req.user!.id;
    console.log(userId);
    const result = await this.postService.createPost(
      userId,
      createPostDto,
      file,
    );
    return sendResponse({
      statusCode: 201,
      success: true,
      message: 'Post created successfully',
      data: result,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllPosts(@Req() req: Request) {
    const filters = pick(req.query, ['searchTerm', 'title', 'content', 'tags']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
    const result = await this.postService.getAllPosts(filters, options);

    return {
      message: 'Post found successfully',
      meta: result.meta,
      data: result.data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getSinglePost(@Param('id') id: string) {
    const result = await this.postService.getSinglePost(id);
    return {
      message: 'User found successfully',
      data: result,
    };
  }

  @Patch(':id')
  @UseGuards(AuthGuard('user', 'admin', 'super_admin'))
  @UseInterceptors(FileInterceptor('thumbnal', fileUpload.uploadConfig))
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: Prisma.PostUpdateInput,
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const userId = req.user!.id;
    const result = await this.postService.updatePost(
      userId,
      id,
      updatePostDto,
      file,
    );
    return sendResponse({
      statusCode: 200,
      success: true,
      message: 'Post updated successfully',
      data: result,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deletePost(@Param('id') id: string) {
    const result = await this.postService.deletePost(id);

    return {
      message: 'Post deleted successfully',
      data: result,
    };
  }
}
