import {DiskRepositoryImpl} from "./base/DiskRepositoryImpl";
import {Injectable} from "@nestjs/common";
import {MobileApplication} from "../../../domain/entities/MobileApplication";

@Injectable()
export class MobileApplicationRepositoryImpl extends DiskRepositoryImpl<MobileApplication> {
    constructor() {
        super(MobileApplication);
    }

    save = (entity: MobileApplication): Promise<MobileApplication> => {
        return this
            .findByAttributes({notificationToken: entity.notificationToken})
            .then(application => {
                if (!application) {
                    return super.save(entity);
                }
                return application;
            });
    }
}