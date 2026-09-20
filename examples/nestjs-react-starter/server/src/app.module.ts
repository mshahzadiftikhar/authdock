import { Module } from '@nestjs/common';
import { AuthModule } from '@authdock/auth-nestjs';

@Module({
  imports: [
    AuthModule.forRoot({
      database: process.env.DATABASE_URL!,
    }),
  ],
})
export class AppModule {}
