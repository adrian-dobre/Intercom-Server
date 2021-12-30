import {Module} from '@nestjs/common';
import {WebSocketController} from "../../controllers/WebSocketController";
import {IntercomDeviceModule} from "../intercom-device/intercom-device.module";
import {MobileApplicationModule} from "../mobile-application/mobile-application.module";
import {UserModule} from "../user/user.module";
import {PushNotificationModule} from "../push-notification/push-notification.module";
import {CallLogModule} from "../call-log/call-log.module";


@Module({
  imports: [IntercomDeviceModule, MobileApplicationModule, UserModule, PushNotificationModule, CallLogModule],
  controllers: [WebSocketController]
})
export class WebSocketModule {}
