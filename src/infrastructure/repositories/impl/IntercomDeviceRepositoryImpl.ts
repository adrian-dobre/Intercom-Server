import {DiskRepositoryImpl} from "./base/DiskRepositoryImpl";
import {Injectable} from "@nestjs/common";
import {IntercomDevice} from "../../../domain/entities/IntercomDevice";

@Injectable()
export class IntercomDeviceRepositoryImpl extends DiskRepositoryImpl<IntercomDevice> {
    constructor() {
        super(IntercomDevice);
    }
}