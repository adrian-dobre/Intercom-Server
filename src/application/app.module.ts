import {Module} from '@nestjs/common';
import {CallLogModule} from "./modules/call-log/call-log.module";
import {IntercomDeviceModule} from "./modules/intercom-device/intercom-device.module";
import {MobileApplicationModule} from "./modules/mobile-application/mobile-application.module";
import {UserModule} from "./modules/user/user.module";
import {APP_GUARD} from "@nestjs/core";
import {AuthGuard} from "../auth.guard";
import {WebSocketModule} from "./modules/web-socket/web-socket.module";


@Module({
    providers: [
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
    ],
    imports: [
        IntercomDeviceModule,
        UserModule,
        CallLogModule,
        MobileApplicationModule,
        WebSocketModule
    ],
})
export class AppModule {
}
