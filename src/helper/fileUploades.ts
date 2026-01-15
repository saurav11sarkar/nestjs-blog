/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */

import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';
import * as dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadConfig = {
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};

const uploadToCloudinary = async (
  file: Express.Multer.File,
): Promise<{ url: string; public_id: string }> => {
  if (!file) {
    throw new BadRequestException('File is required');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'uploads',
        resource_type: 'auto',
        transformation: {
          width: 500,
          height: 500,
          crop: 'limit',
        },
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) {
          return reject(new Error('Upload failed - no result returned'));
        }
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      },
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

export const fileUpload = {
  uploadToCloudinary,
  uploadConfig,
};
