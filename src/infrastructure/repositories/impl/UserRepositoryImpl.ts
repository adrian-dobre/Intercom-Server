import {DiskRepositoryImpl} from "./base/DiskRepositoryImpl";
import {Injectable} from "@nestjs/common";
import {scrypt} from "crypto";
import {User} from "../../../domain/entities/User";

@Injectable()
export class UserRepositoryImpl extends DiskRepositoryImpl<User> {
    constructor() {
        super(User);
    }

    findByUsernameAndPassword(username: string, password: string): Promise<User | null> {
        return this
            .findByAttributes({username})
            .then(user => {
                if (!user) {
                    return;
                }
                return new Promise(resolve => {
                    scrypt(password, user.salt, 32, (error, result) => {
                        if (error) {
                            return resolve(null);
                        }
                        if (user.password === result.toString('base64')) {
                            return resolve(user);
                        }
                    });
                });
            });
    }

    save = (entity: User): Promise<User> => {
        return this
            .findAllByAttributes({username: entity.username})
            .then(users => {
                if (!users.length) {
                    return new Promise((resolve, reject) => {
                        scrypt(entity.password, entity.salt, 32, (error, result) => {
                            if (error) {
                                return reject(error);
                            }
                            entity.password = result.toString('base64');
                            return super.save(entity);
                        });
                    });
                } else if (users[0].id == entity.id) {
                    return super.save(entity);
                }
            });
    }
}