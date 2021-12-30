import {DiskRepositoryImpl} from "./base/DiskRepositoryImpl";
import {Injectable} from "@nestjs/common";
import {CallLogEntry} from "../../../domain/entities/CallLogEntry";

@Injectable()
export class CallLogRepositoryImpl extends DiskRepositoryImpl<CallLogEntry> {
    constructor() {
        super(CallLogEntry);
    }
}