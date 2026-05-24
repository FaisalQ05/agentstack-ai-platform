import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AppLogger } from './common/logger/logger.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: AppLogger,
  ) {}

  @Get()
  getHello(): string {
    this.logger.log('Hello World! from AppController');
    return this.appService.getHello();
  }
}
