import {IntercomDevice} from "../../domain/entities/IntercomDevice";
import {DiskRepository} from "./base/DiskRepository";

export interface IntercomDeviceRepository extends DiskRepository<IntercomDevice> {
}