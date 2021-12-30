import {ClassSerializerInterceptor, Controller, Get, Inject, UseInterceptors} from "@nestjs/common";
import {ApiBasicAuth, ApiResponse, ApiTags} from "@nestjs/swagger";
import {AuthUser} from "../decorators/AuthUser";
import {User} from "../../domain/entities/User";
import {UserRepository} from "../../infrastructure/repositories/UserRepository";

@Controller('users')
@ApiTags("Users")
@ApiBasicAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
    constructor(
        @Inject('UserRepository')
        private userRepository: UserRepository
    ) {
    }

    @Get('/profile')
    @ApiResponse({type: User})
    getProfile(@AuthUser() user: User): User {
        return user;
    }
}
