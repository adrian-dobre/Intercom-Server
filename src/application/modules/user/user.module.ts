import {Module} from '@nestjs/common';
import {UserRepositoryImpl} from "../../../infrastructure/repositories/impl/UserRepositoryImpl";
import {UserController} from "../../controllers/UserController";

const UserRepositoryProvider = {
    provide: 'UserRepository',
    useClass: UserRepositoryImpl
}

@Module({
    providers: [UserRepositoryProvider],
    exports: [UserRepositoryProvider],
    controllers: [UserController]
})
export class UserModule {
}
