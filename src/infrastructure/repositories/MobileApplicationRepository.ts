import {DiskRepository} from "./base/DiskRepository";
import {MobileApplication} from "../../domain/entities/MobileApplication";

export interface MobileApplicationRepository extends DiskRepository<MobileApplication> {}