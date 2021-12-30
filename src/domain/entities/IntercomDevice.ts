import {BaseEntity} from "./base/BaseEntity";
import {ApiProperty} from "@nestjs/swagger";

export enum IntercomDeviceStatus {
    Ready = 1,
    Ring = 2,
    Talk = 3,
    Listen = 4,
    Open = 5
}

export class IntercomDevice extends BaseEntity {
    @ApiProperty()
    userId: string;
    @ApiProperty()
    name: string;
    @ApiProperty()
    autoResponse: boolean;
    @ApiProperty()
    autoResponseDelay: number;
    @ApiProperty()
    delayForAutoActions: number;
    @ApiProperty()
    reportButtonStatus: boolean;
    @ApiProperty()
    lastSeen: number;
    @ApiProperty()
    lastStatus: IntercomDeviceStatus;

    constructor(
        id: string,
        userId: string,
        name: string = "",
        autoResponse: boolean = false,
        autoResponseDelay: number = 0,
        delayForAutoActions: number = 100,
        reportButtonStatus: boolean = true,
        lastSeen: number = Date.now(),
        lastStatus: IntercomDeviceStatus = IntercomDeviceStatus.Ready
    ) {
        super(id);
        this.userId = userId;
        this.name = name;
        this.autoResponse = autoResponse;
        this.autoResponseDelay = autoResponseDelay;
        this.delayForAutoActions = delayForAutoActions;
        this.reportButtonStatus = reportButtonStatus;
        this.lastSeen = lastSeen;
        this.lastStatus = lastStatus;
    }

    static from(json: IntercomDevice) {
        return new IntercomDevice(
            json.id,
            json.userId,
            json.name,
            json.autoResponse,
            json.autoResponseDelay,
            json.delayForAutoActions,
            json.reportButtonStatus,
            json.lastSeen,
            json.lastStatus
        );
    }

    getIntercomFormattedConfig(): string {
        return `${this.autoResponse ? 1 : 0}:${this.autoResponseDelay}:${this.delayForAutoActions}:${this.reportButtonStatus ? 1 : 0}`;
    }
}