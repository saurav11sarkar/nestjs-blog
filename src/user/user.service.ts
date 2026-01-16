import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { fileUpload } from 'src/helper/fileUploades';
import pagenationHelpers, {
  FilterParams,
  IOptions,
} from 'src/helper/pagenation';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
    const result = await this.prisma.user.create({
      data: createUserDto,
    });
    return result;
  }

  async findAllUser(params: FilterParams, options: IOptions) {
    const { page, skip, limit, sortBy, sortOrder } = pagenationHelpers(options);
    const { searchTerm, ...filterData } = params;
    const andConditions: Prisma.UserWhereInput[] = [];
    const searchFileds = ['name', 'email'];

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

    const whenConditions: Prisma.UserWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const result = await this.prisma.user.findMany({
      where: whenConditions,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        photo: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        posts: {
          select: {
            id: true,
            title: true,
            thumbnal: true,
            tags: true,
            views: true,
          },
        },
      },
    });

    const total = await this.prisma.user.count({
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

  async findOneUser(id: string) {
    const result = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    return result;
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    file?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (file) {
      const uploadProfile = await fileUpload.uploadToCloudinary(file);
      if (!uploadProfile?.url) {
        throw new NotFoundException('Failed to upload profile image');
      }
      updateUserDto.photo = uploadProfile.url;
    }

    const result = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    return result;
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User is not found');
    }

    const result = await this.prisma.user.delete({
      where: { id },
    });

    return result;
  }

  async profile(userId: string) {
    const result = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    return result;
  }
}
