import { Module } from '@nestjs/common';

import { AuthService } from './auth/auth.service';
import { McpController } from './mcp/mcp.controller';
import { McpService } from './mcp/mcp.service';
import { APP_CONFIG, loadEnvironment } from './config/environment';
import { HealthController } from './health/health.controller';
import { InstagramService } from './instagram/instagram.service';

@Module({
  controllers: [HealthController, McpController],
  providers: [
    { provide: APP_CONFIG, useFactory: loadEnvironment },
    AuthService,
    InstagramService,
    McpService,
  ],
})
export class AppModule {}
