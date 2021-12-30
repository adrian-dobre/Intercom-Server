import {Module} from '@nestjs/common';
import {MobileApplicationModule} from "../mobile-application/mobile-application.module";
import {
    PushNotificationsRepositoryImpl
} from "../../../infrastructure/repositories/impl/PushNotificationsRepositoryImpl";

const PushNotificationsRepositoryProvider = {
  provide: 'PushNotificationsRepository',
  useClass: PushNotificationsRepositoryImpl
}

@Module({
  imports: [MobileApplicationModule],
  providers: [PushNotificationsRepositoryProvider],
  exports: [PushNotificationsRepositoryProvider]
})
export class PushNotificationModule {}
