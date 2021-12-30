import {DiskRepository} from "./base/DiskRepository";
import {CallLogEntry} from "../../domain/entities/CallLogEntry";


export interface CallLogRepository extends DiskRepository<CallLogEntry> {
}