import {createParamDecorator, ExecutionContext} from '@nestjs/common';
import {User} from "../../domain/entities/User";

export const AuthUser = createParamDecorator(
    (data: string, ctx: ExecutionContext): User => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);