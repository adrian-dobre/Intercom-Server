import {ApiProperty} from "@nestjs/swagger";
import {v4} from "uuid";


export class BaseEntity {
    @ApiProperty()
    id?: string

    constructor(id: string = v4()) {
        this.id = id;
    }
}