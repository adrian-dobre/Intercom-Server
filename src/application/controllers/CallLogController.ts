import {Controller, Get, Inject, Param} from "@nestjs/common";
import {CallLogRepository} from "../../infrastructure/repositories/CallLogRepository";
import {CallLogEntry} from "../../domain/entities/CallLogEntry";
import {ApiBasicAuth, ApiResponse, ApiTags} from "@nestjs/swagger";
import {AuthUser} from "../decorators/AuthUser";
import {User} from "../../domain/entities/User";
import {IntercomDeviceRepository} from "../../infrastructure/repositories/IntercomDeviceRepository";

@Controller()
@ApiTags("Call Log")
@ApiBasicAuth()
export class CallLogController {
    constructor(
        @Inject('CallLogRepository')
        private callLogRepository: CallLogRepository,
        @Inject('IntercomDeviceRepository')
        private intercomDeviceRepository: IntercomDeviceRepository
    ) {
    }

    @Get('/devices/:deviceId/call-log')
    @ApiResponse({type: [CallLogEntry]})
    async getDeviceCallLog(@Param('deviceId') deviceId: string, @AuthUser() user: User): Promise<CallLogEntry[]> {
        return this.intercomDeviceRepository
            .findByAttributes({id: deviceId, userId: user.id})
            .then((device) => {
                return this.callLogRepository
                    .findAllByAttributes({deviceId: device.id})
                    .then((entries) => {
                        return entries.sort((a, b) => b.time - a.time)
                    });
            });
    }
}
