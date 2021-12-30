import {BaseEntity} from "./base/BaseEntity";

export class MobileApplication extends BaseEntity {
    userId: string;
    notificationToken: string;

    constructor(
        userId: string,
        notificationToken: string
    ) {
        super();
        this.userId = userId;
        this.notificationToken = notificationToken;
    }

    static from(json: MobileApplication) {
        const mobileApplication = new MobileApplication(json.userId, json.notificationToken);
        mobileApplication.id = json.id;
        return mobileApplication;
    }
}