export enum ClientType {
    MOBILE_APPLICATION = 'MOBILE_APPLICATION',
    INTERCOM_DEVICE = 'INTERCOM_DEVICE'
}

export class ClientInformation {
    type: ClientType;
    id?: string;
    notificationToken?: string;
    name?: string;

    constructor(type: ClientType, id?: string, notificationToken?: string, name?: string) {
        this.type = type;
        this.id = id;
        this.notificationToken = notificationToken;
        this.name = name;
    }
}