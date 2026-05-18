import { HttpException, InternalServerErrorException } from '@nestjs/common';

export function rethrowAsInternal(e: unknown, message: string): never {
  if (e instanceof HttpException) throw e;
  throw new InternalServerErrorException(message);
}
