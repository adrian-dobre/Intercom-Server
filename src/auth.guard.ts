import {CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException} from '@nestjs/common';
import {Observable} from 'rxjs';
import {Helpers} from "./application/utils/Helpers";
import {UserRepository} from "./infrastructure/repositories/UserRepository";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        @Inject('UserRepository')
        private userRepository: UserRepository
    ) {
    }

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        return Helpers
            .getUserInformation(request)
            .then(user => {
                return this.userRepository
                    .findByUsernameAndPassword(user.username, user.password)
                    .then(user => {
                        if (!user) {
                            throw new UnauthorizedException("Invalid credentials");
                        }
                        request.user = user;
                        return true;
                    });
            }).catch(e => {
                throw new UnauthorizedException(e.message);
            });

    }
}