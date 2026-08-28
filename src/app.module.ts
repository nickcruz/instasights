import { Module } from '@nestjs/common';

import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { CredentialGuard } from './auth/credential.guard';
import { APP_CONFIG, loadEnvironment } from './config/environment';
import { HealthController } from './health/health.controller';
import { InstagramController } from './instagram/instagram.controller';
import { InstagramService } from './instagram/instagram.service';

@Module({
  controllers: [AuthController, HealthController, InstagramController],
  providers: [
    { provide: APP_CONFIG, useFactory: loadEnvironment },
    AuthService,
    CredentialGuard,
    InstagramService,
  ],
})
export class AppModule {}
