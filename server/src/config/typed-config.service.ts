import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfig } from './config.type';

@Injectable()
export class TypedConfigService {
  constructor(private readonly configService: ConfigService<AllConfig>) {}

  get app(): AllConfig['app'] {
    return this.configService.get('app', { infer: true })!;
  }

  get database(): AllConfig['database'] {
    return this.configService.get('database', { infer: true })!;
  }

  get auth(): AllConfig['auth'] {
    return this.configService.get('auth', { infer: true })!;
  }

  get redis(): AllConfig['redis'] {
    return this.configService.get('redis', { infer: true })!;
  }

  get ai(): AllConfig['ai'] {
    return this.configService.get('ai', { infer: true })!;
  }

  get rag(): AllConfig['rag'] {
    return this.configService.get('rag', { infer: true })!;
  }
}
