import {BaseEntity} from "./base/BaseEntity";
import {ApiProperty} from "@nestjs/swagger";

export enum CallLogEntryStatus {
    RINGING = 'RINGING',
    MISSED = 'MISSED',
    ANSWERED = 'ANSWERED',
    OPENED = 'OPENED'
}

export class CallLogEntry extends BaseEntity {
    @ApiProperty()
    deviceId: string;
    @ApiProperty()
    time: number;
    @ApiProperty()
    status: CallLogEntryStatus;

    constructor(
        deviceId: string,
        time: number,
        status: CallLogEntryStatus
    ) {
        super();
        this.time = time;
        this.status = status;
        this.deviceId = deviceId;
    }

    static from(json: CallLogEntry) {
        const callLogEntry = new CallLogEntry(json.deviceId, json.time, json.status);
        callLogEntry.id = json.id;
        return callLogEntry;
    }
}