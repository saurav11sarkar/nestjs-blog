/* eslint-disable @typescript-eslint/no-namespace */
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  mixin,
  Type,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';
import config from 'src/config/config';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function AuthGuard(...roles: string[]): Type<CanActivate> {
  @Injectable()
  class RoleAuthGuard implements CanActivate {
    constructor(readonly jwtService: JwtService) {}
    canActivate(
      context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
      const request = context.switchToHttp().getRequest<Request>();

      const token = request.headers.authorization?.split(' ')[1];
      if (!token)
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

      const decode = this.jwtService.verify<JwtPayload>(token, {
        secret: config.jwt.accessTokenSecret,
      });

      if (!decode)
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

      if (roles.length && !roles.includes(decode.role))
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      request.user = decode;

      return true;
    }
  }

  return mixin(RoleAuthGuard);
}
