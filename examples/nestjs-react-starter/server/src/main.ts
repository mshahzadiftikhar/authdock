import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { loadAuthConfig } from '@authdock/auth-nestjs';
import { AppModule } from './app.module';

async function bootstrap() {
  const config = loadAuthConfig();

  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.enableCors({ origin: config.FRONTEND_URL, credentials: true });
  // Required for AuthModule's pool-cleanup hook to actually run on shutdown
  // (it only fires from onModuleDestroy, which Nest doesn't listen for
  // process signals to trigger unless this is called).
  app.enableShutdownHooks();

  await app.listen(3000);
  console.log('nestjs-react-starter server listening on http://localhost:3000');
}

bootstrap();
