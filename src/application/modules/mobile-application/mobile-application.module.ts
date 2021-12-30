import {Module} from '@nestjs/common';
import {
    MobileApplicationRepositoryImpl
} from "../../../infrastructure/repositories/impl/MobileApplicationRepositoryImpl";

const MobileApplicationRepositoryProvider = {
  provide: 'MobileApplicationRepository',
  useClass: MobileApplicationRepositoryImpl
}

@Module({
  providers: [MobileApplicationRepositoryProvider],
  exports: [MobileApplicationRepositoryProvider]
})
export class MobileApplicationModule {}
