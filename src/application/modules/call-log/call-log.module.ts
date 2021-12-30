import {Module} from '@nestjs/common';
import {CallLogController} from "../../controllers/CallLogController";
import {IntercomDeviceModule} from "../intercom-device/intercom-device.module";
import {CallLogRepositoryImpl} from "../../../infrastructure/repositories/impl/CallLogRepositoryImpl";

const CallLogRepositoryProvider = {
    provide: 'CallLogRepository',
    useClass: CallLogRepositoryImpl
}

@Module({
    imports: [IntercomDeviceModule],
    providers: [CallLogRepositoryProvider],
    exports: [CallLogRepositoryProvider],
    controllers: [CallLogController]
})
export class CallLogModule {
}
