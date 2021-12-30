import {BaseEntity} from "./base/BaseEntity";
import {v4} from "uuid";
import {ApiProperty} from "@nestjs/swagger";
import {Exclude} from "class-transformer";

export class User extends BaseEntity {
    @ApiProperty()
    username: string;
    @Exclude()
    password: string;
    @Exclude({toPlainOnly: true })
    salt: string;

    constructor(
        username: string,
        password: string,
        salt: string = v4()
    ) {
        super();
        this.username = username;
        this.password = password;
        this.salt = salt;
    }

    static from(json: User) {
        const user = new User(json.username, json.password, json.salt);
        user.id = json.id;
        return user;
    }
}