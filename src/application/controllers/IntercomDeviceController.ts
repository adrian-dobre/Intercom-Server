import {Body, Controller, Get, Inject, NotFoundException, Param, Put} from "@nestjs/common";
import {ApiBasicAuth, ApiResponse, ApiTags} from "@nestjs/swagger";
import {IntercomDeviceRepository} from "../../infrastructure/repositories/IntercomDeviceRepository";
import {IntercomDevice} from "../../domain/entities/IntercomDevice";
import {AuthUser} from "../decorators/AuthUser";
import {User} from "../../domain/entities/User";

@Controller()
@ApiTags("Intercom Device")
@ApiBasicAuth()
export class IntercomDeviceController {
    constructor(
        @Inject('IntercomDeviceRepository')
        private intercomDeviceRepository: IntercomDeviceRepository
    ) {
    }

    @Get('/devices')
    @ApiResponse({type: [IntercomDevice]})
    async getDeviceList(@AuthUser() user: User): Promise<IntercomDevice[]> {
        return await this.intercomDeviceRepository.findAllByAttributes({userId: user.id});
    }

    @Get('/devices/:id')
    @ApiResponse({type: IntercomDevice})
    async getDevice(@Param('id') id: string, @AuthUser() user: User): Promise<IntercomDevice> {
        const device = await this.intercomDeviceRepository.findByAttributes({id, userId: user.id});
        if (!device) {
            throw new NotFoundException()
        }
        return device;
    }

    @Put('/devices/:id')
    @ApiResponse({type: IntercomDevice})
    async updateDevice(@Param('id') id: string, @Body() device: IntercomDevice, @AuthUser() user: User): Promise<IntercomDevice> {
        let existingDevice = await this.intercomDeviceRepository.findByAttributes({id, userId: user.id});
        if (existingDevice) {
            existingDevice.autoResponse = device.autoResponse;
            existingDevice.autoResponseDelay = device.autoResponseDelay;
            existingDevice.delayForAutoActions = device.delayForAutoActions;
            existingDevice.reportButtonStatus = device.reportButtonStatus;
            existingDevice.name = device.name;
            return await this.intercomDeviceRepository.save(existingDevice);
        } else {
            throw new NotFoundException();
        }
    }
}
