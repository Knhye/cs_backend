import { HttpException, InternalServerErrorException, Logger } from '@nestjs/common';

const logger = new Logger('rethrowAsInternal');

export function rethrowAsInternal(e: unknown, message: string): never {
  if (e instanceof HttpException) throw e;
  logger.error(message, e instanceof Error ? e.stack : String(e));
  throw new InternalServerErrorException(message);
}
