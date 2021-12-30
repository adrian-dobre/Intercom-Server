import {Module} from '@nestjs/common';
import {IntercomDeviceController} from "../../controllers/IntercomDeviceController";
import {IntercomDeviceRepositoryImpl} from "../../../infrastructure/repositories/impl/IntercomDeviceRepositoryImpl";


const IntercomDeviceRepositoryProvider = {
    provide: 'IntercomDeviceRepository',
    useClass: IntercomDeviceRepositoryImpl
}

@Module({
    providers: [IntercomDeviceRepositoryProvider],
    controllers: [IntercomDeviceController],
    exports: [IntercomDeviceRepositoryProvider],
})
export class IntercomDeviceModule {
}
