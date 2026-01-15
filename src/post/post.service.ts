import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
// import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { fileUpload } from 'src/helper/fileUploades';

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

  findAll() {
    return `This action returns all post`;
  }

  findOne(id: number) {
    return `This action returns a #${id} post`;
  }

  // update(id: number, updatePostDto: UpdatePostDto) {
  //   return `This action updates a #${id} post`;
  // }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
