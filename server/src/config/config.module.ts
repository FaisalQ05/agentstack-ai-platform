import { Global, Module } from '@nestjs/common';
import { TypedConfigService } from './typed-config.service';

@Global() // 👈 makes it available everywhere
@Module({
  providers: [TypedConfigService],
  exports: [TypedConfigService],
})
export class TypedConfigModule {}
