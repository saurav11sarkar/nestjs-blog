import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { fileUpload } from 'src/helper/fileUploades';
import pagenationHelpers, {
  FilterParams,
  IOptions,
} from 'src/helper/pagenation';
import { Prisma, UserRole } from 'src/generated/prisma/client';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  async createPost(
    userId: string,
    createPostDto: CreatePostDto,
    file?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (file) {
      const { url } = await fileUpload.uploadToCloudinary(file);
      createPostDto.thumbnal = url;
    }

    let tags: string[] = [];
    if (createPostDto.tags) {
      tags = (createPostDto.tags as string).split(',').map((tag) => tag.trim());
    }

    const result = await this.prisma.post.create({
      data: {
        title: createPostDto.title,
        content: createPostDto.content,
        thumbnal: createPostDto.thumbnal,
        tags: tags,
        authorId: user.id,
      },
    });

    if (!result)
      throw new HttpException('Failed to create post', HttpStatus.BAD_REQUEST);

    return result;
  }

  async getAllPosts(params: FilterParams, options: IOptions) {
    const { limit, page, skip, sortBy, sortOrder } = pagenationHelpers(options);
    const { searchTerm, ...filterData } = params;
    const andConditions: Prisma.PostWhereInput[] = [];
    const searchFileds: (keyof Prisma.PostWhereInput)[] = [
      'title',
      'content',
      'tags',
    ];

    if (searchTerm) {
      andConditions.push({
        OR: searchFileds.map((field) => ({
          [field]: {
            contains: searchTerm,
            mode: Prisma.QueryMode.insensitive,
          },
        })),
      });
    }

    if (Object.keys(filterData).length > 0) {
      andConditions.push({
        AND: Object.entries(filterData).map(([field, value]) => ({
          [field]: value as string,
        })),
      });
    }

    const whenConditions: Prisma.PostWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};
    const result = await this.prisma.post.findMany({
      where: whenConditions,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            photo: true,
          },
        },
      },
    });
    const total = await this.prisma.post.count({
      where: whenConditions,
    });
    return {
      data: result,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async getSinglePost(id: string) {
    const result = await this.prisma.post.findUnique({
      where: { id: id },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            photo: true,
          },
        },
      },
    });

    if (!result) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    return result;
  }

  async updatePost(
    userId: string,
    id: string,
    updatePostDto: Prisma.PostUpdateInput,
    file?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const post = await this.prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    const isAdmin =
      user.role === UserRole.admin || user.role === UserRole.super_admin;

    if (!isAdmin && post.authorId !== userId) {
      throw new HttpException(
        'You are not allowed to update this post',
        HttpStatus.FORBIDDEN,
      );
    }

    if (file) {
      const { url } = await fileUpload.uploadToCloudinary(file);
      updatePostDto.thumbnal = url;
    }

    const result = await this.prisma.post.update({
      where: { id },
      data: updatePostDto,
    });

    return result;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
