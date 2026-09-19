import { Module } from '@nestjs/common';
import { AuthModule } from '@authdock/auth-nestjs';
import { PrismaClient } from '@prisma/client';

@Module({
  imports: [
    AuthModule.forRoot({
      prisma: new PrismaClient(),
    }),
  ],
})
export class AppModule {}
