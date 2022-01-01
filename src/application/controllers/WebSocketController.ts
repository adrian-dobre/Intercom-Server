import {Server, WebSocket} from "ws";
import {createServer} from "http";
import {Helpers} from "../utils/Helpers";
import {Controller, Inject, Logger} from "@nestjs/common";
import {ClientInformation, ClientType} from "./dto/ClientInformation";
import {IntercomDevice, IntercomDeviceStatus} from "../../domain/entities/IntercomDevice";
import {UserRepository} from "../../infrastructure/repositories/UserRepository";
import {MobileApplication} from "../../domain/entities/MobileApplication";
import {IntercomDeviceRepository} from "../../infrastructure/repositories/IntercomDeviceRepository";
import {MobileApplicationRepository} from "../../infrastructure/repositories/MobileApplicationRepository";
import {PushNotificationsRepository} from "../../infrastructure/repositories/PushNotificationsRepository";
import {IntercomDeviceMessageType} from "./dto/IntercomMessage";
import {dateFormat} from "../utils/dateFormat";
import {RepositoryEvent} from "../../infrastructure/repositories/base/DiskRepository";
import {CallLogRepository} from "../../infrastructure/repositories/CallLogRepository";
import {CallLogEntry, CallLogEntryStatus} from "../../domain/entities/CallLogEntry";
import {User} from "../../domain/entities/User";

const connectedIntercomDevices: { [deviceId: string]: WebSocket[] } = {};
const connectedMobileApplications: { [userId: string]: WebSocket[] } = {};

@Controller()
export class WebSocketController {
    private wss: Server;

    private readonly logger = new Logger(WebSocketController.name);

    constructor(
        @Inject("UserRepository")
        private userRepository: UserRepository,
        @Inject("MobileApplicationRepository")
        private mobileApplicationRepository: MobileApplicationRepository,
        @Inject("IntercomDeviceRepository")
        private intercomDeviceRepository: IntercomDeviceRepository,
        @Inject("PushNotificationsRepository")
        private pushNotificationsRepository: PushNotificationsRepository,
        @Inject("CallLogRepository")
        private callLogRepository: CallLogRepository
    ) {
        const server = createServer();

        this.wss = new Server({
            noServer: true,
        });

        server.on('upgrade', this.handleUpgrade);
        server.listen(3005);
        this.monitorIntercomDevices();
        this.intercomDeviceRepository.on(RepositoryEvent.UPDATE, (updateEvent => {
            this.sendIntercomConfigUpdate(updateEvent);
        }));
    }

    private sendIntercomConfigUpdate(updateEvent: { entity: IntercomDevice; changedProperties: string[] }) {
        this.logger.debug(`Intercom device updated. Changed props: ${updateEvent.changedProperties.join(', ')}:\n${JSON.stringify(updateEvent.entity)}`);
        if (this.isIntercomConfigUpdate(updateEvent)) {
            const connectedDevices = connectedIntercomDevices[updateEvent.entity.id];
            if (Array.isArray(connectedDevices)) {
                const intercomConfigUpdate = `${IntercomDeviceMessageType.IntercomConfiguration}:${updateEvent.entity.getIntercomFormattedConfig()}`;
                this.logger.debug(`Sending intercom device config update: ${intercomConfigUpdate}`);
                connectedDevices.forEach((connectedDevice) => {
                    connectedDevice.send(intercomConfigUpdate);
                });
            }
        }
    }

    private isIntercomConfigUpdate(updateEvent: { entity: IntercomDevice; changedProperties: string[] }) {
        const configProperties = ['autoResponse', 'autoResponseDelay', 'delayForAutoActions', 'reportButtonStatus'];
        return updateEvent.changedProperties.some(property => configProperties.includes(property));
    }

    private handleUpgrade = (request, socket, head) => {
        Helpers
            .getUserInformation(request)
            .then((userInfo) => {
                return this.userRepository
                    .findByUsernameAndPassword(userInfo.username, userInfo.password)
                    .then((user) => {
                        if (!user) {
                            throw new Error('Unauthorized');
                        }
                        return Helpers
                            .getClientInformation(request)
                            .then((clientInfo) => {
                                this.wss.handleUpgrade(request, socket, head, (ws) => {
                                    this.wss.emit('connection', ws, request, socket);
                                    switch (clientInfo.type) {
                                        case ClientType.INTERCOM_DEVICE:
                                            this.handleIntercomConnectionUpgrade(clientInfo, user, ws);
                                            break;
                                        case ClientType.MOBILE_APPLICATION:
                                            this.handleMobileApplicationConnectionUpgrade(user, clientInfo, ws);
                                            break;
                                    }
                                });
                            });
                    });
            })
            .catch(() => {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            });
    }

    private handleMobileApplicationConnectionUpgrade(user: User, clientInfo: ClientInformation, ws) {
        this.mobileApplicationRepository
            .save(new MobileApplication(user.id, clientInfo.notificationToken))
            .then((application) => {
                if (!Array.isArray(connectedMobileApplications[user.id])) {
                    connectedMobileApplications[user.id] = [];
                }
                connectedMobileApplications[user.id].push(ws);
                this.handleMobileApplicationConnection(application, ws);
            })
            .catch(error => this.logger.error(error.message));
    }

    private handleIntercomConnectionUpgrade(clientInfo: ClientInformation, user: User, ws) {
        this.intercomDeviceRepository
            .findById(clientInfo.id)
            .then(device => {
                if (!device) {
                    return this
                        .intercomDeviceRepository
                        .save(new IntercomDevice(clientInfo.id, user.id, clientInfo.name));
                } else {
                    return this
                        .intercomDeviceRepository
                        .updateById(device.id, {lastSeen: Date.now()});
                }
            })
            .then((device) => {
                if (!Array.isArray(connectedIntercomDevices[device.id])) {
                    connectedIntercomDevices[device.id] = [];
                }
                connectedIntercomDevices[device.id].push(ws);
                this.handleIntercomConnection(device, ws);
            })
            .catch(error => this.logger.error(error.message));
    }

    private parseMessageType = (message: string): { type: IntercomDeviceMessageType, params: number[] } => {
        const parsedMessage = message.split(":").map(param => parseInt(param));
        return {
            type: parsedMessage.shift(),
            params: [...parsedMessage]
        };
    }

    private handleIntercomConnection = (device: IntercomDevice, ws) => {
        this.pushNotificationsRepository.sendNotificationToUser(
            device.userId,
            'Intercom device connected',
            `Intercom device ${device.name} connected to the server`,
            {
                deviceId: device.id
            }
        );
        ws.on('message', this.handleIntercomMessage.bind(this, device, ws));
        ws.on('ping', this.handleIntercomPing.bind(this, device, ws));
        ws.on('close', this.handleIntercomCloseEvent.bind(this, device, ws));
    }

    private handleMobileApplicationConnection = (application: MobileApplication, ws) => {
        this.intercomDeviceRepository
            .findAllByAttributes({userId: application.userId})
            .then(devices => {
                devices.forEach(device => {
                    ws.send(JSON.stringify({
                        type: IntercomDeviceMessageType.IntercomStatusEvent,
                        params: [device.lastStatus],
                        deviceId: device.id
                    }));
                });
            });
        ws.on('message', this.handleMobileApplicationMessage.bind(this, application, ws));
        ws.on('ping', this.handleMobileApplicationPing.bind(this, application, ws));
        ws.on('close', this.handleMobileApplicationCloseEvent.bind(this, application, ws))
    }

    private handleIntercomMessage(device: IntercomDevice, client: WebSocket, message) {
        this.intercomDeviceRepository
            .findById(device.id)
            .then(intercomDevice => {
                if (intercomDevice == null) {
                    return;
                }
                this.intercomDeviceRepository
                    .updateById(intercomDevice.id, {lastSeen: Date.now()})
                    .catch(error => this.logger.error(error.message));
                let parsedMessage = this.parseMessageType(message.toString());
                switch (parsedMessage.type) {
                    case IntercomDeviceMessageType.IntercomConfiguration:
                        const config = intercomDevice.getIntercomFormattedConfig();
                        if (config !== parsedMessage.params.join(':')) {
                            client.send(`${IntercomDeviceMessageType.IntercomConfiguration}:${config}`)
                        }
                        break;
                    case IntercomDeviceMessageType.IntercomStatusEvent:
                        let status = parsedMessage.params[0];
                        this.logger.debug(`Intercom status received: ${intercomDevice.lastStatus}`);
                        this.intercomDeviceRepository
                            .updateById(intercomDevice.id, {lastStatus: status})
                            .catch(error => this.logger.error(error.message));
                        if (status === IntercomDeviceStatus.Ring) {
                            this.handleNewIntercomIncomingCall(intercomDevice);
                        } else if ([IntercomDeviceStatus.Talk, IntercomDeviceStatus.Open, IntercomDeviceStatus.Ready].includes(status)) {
                            this.handleIntercomStatusUpdate(intercomDevice, status);
                        }
                    // fallthrough to default (send status to mobile apps)
                    default:
                        let apps = connectedMobileApplications[intercomDevice.userId];
                        if (Array.isArray(apps)) {
                            const _message = JSON.stringify({
                                type: parsedMessage.type,
                                params: parsedMessage.params,
                                deviceId: intercomDevice.id
                            });
                            apps.forEach((app) => {
                                app.send(_message);
                            });
                        }
                }
            });
    }

    private handleIntercomStatusUpdate(device: IntercomDevice, status: IntercomDeviceStatus) {
        this.callLogRepository
            .findAllByAttributes({deviceId: device.id})
            .then(callLogList => {
                return callLogList.sort((a, b) => b.time - a.time).shift();
            })
            .then(lastEntry => {
                if (lastEntry && (Date.now() - lastEntry.time < 120000)) {
                    const savedStatus = lastEntry.status;
                    let currentStatus = savedStatus;
                    switch (savedStatus) {
                        case CallLogEntryStatus.RINGING:
                            switch (status) {
                                case IntercomDeviceStatus.Talk:
                                    currentStatus = CallLogEntryStatus.ANSWERED;
                                    break;
                                case IntercomDeviceStatus.Open:
                                    currentStatus = CallLogEntryStatus.OPENED;
                                    break;
                                case IntercomDeviceStatus.Ready:
                                    currentStatus = CallLogEntryStatus.MISSED;
                            }
                            break;
                        case CallLogEntryStatus.ANSWERED:
                            if (status === IntercomDeviceStatus.Open) {
                                currentStatus = CallLogEntryStatus.OPENED;
                            }
                            break;
                    }
                    if (currentStatus !== savedStatus) {
                        this.callLogRepository
                            .updateById(lastEntry.id, {status: currentStatus})
                            .catch(error => this.logger.error(error.message));
                    }
                }
            });
    }

    private handleNewIntercomIncomingCall(device: IntercomDevice) {
        this.callLogRepository
            .save(new CallLogEntry(device.id, Date.now(), CallLogEntryStatus.RINGING))
            .catch(error => this.logger.error(error.message));
        this.pushNotificationsRepository.sendNotificationToUser(
            device.userId,
            'Incoming Intercom call',
            `Intercom device ${device.name} is ringing`,
            {
                deviceId: device.id
            }
        );
    }

    private handleMobileApplicationMessage(application: MobileApplication, client, message) {
        try {
            const _message = JSON.parse(message);
            this.sendApplicationMessageToIntercom(
                `${_message.type}:${_message.params.join(':')}`,
                _message.deviceId,
                application
            );
        } catch (error) {
            this.logger.error(error);
        }
    }

    private sendApplicationMessageToIntercom(message: string, deviceId: string, application: MobileApplication) {
        this.intercomDeviceRepository
            .findById(deviceId)
            .then(device => {
                if (device && device.userId === application.userId) {
                    const intercomDevices = connectedIntercomDevices[deviceId];
                    if (Array.isArray(intercomDevices)) {
                        intercomDevices.forEach(intercomDevice => {
                            intercomDevice.send(message);
                        });
                    }
                }
            });
    }

    private handleIntercomPing(device, client) {
        this.intercomDeviceRepository
            .updateById(device.id, {lastSeen: Date.now()})
            .catch(error => this.logger.error(error.message));
    }

    private handleMobileApplicationPing(application, client) {
        //noOp
    }

    private handleIntercomCloseEvent(device, client) {
        this.pushNotificationsRepository.sendNotificationToUser(
            device.userId,
            'Intercom device disconnected',
            `Intercom device ${device.name} was disconnected from the server`,
            {
                deviceId: device.id
            }
        );
        const intercomDevices = connectedIntercomDevices[device.id];
        if (Array.isArray(intercomDevices)) {
            connectedIntercomDevices[device.id] = intercomDevices.filter(connectedClient => connectedClient != client);
        }
    }

    private handleMobileApplicationCloseEvent(application: MobileApplication, client) {
        let connectedApps = connectedMobileApplications[application.userId]
        if (Array.isArray(connectedApps)) {
            connectedMobileApplications[application.userId] = connectedApps
                .filter(connectedApp => connectedApp !== client);
        }
    }

    private monitorIntercomDevices() {
        setTimeout(() => {
            this.intercomDeviceRepository
                .findAllByAttributes({})
                .then(devices => {
                    const time = Date.now();
                    devices.forEach((device) => {
                        if (time - device.lastSeen >= 15 * 60000) {
                            this.pushNotificationsRepository.sendNotificationToUser(
                                device.userId,
                                'Intercom device missing',
                                // @ts-ignore
                                `Intercom device ${device.name} was last seen at ${dateFormat(device.lastSeen, "dd/mm/yy HH:MM:ss o")}`,
                                {
                                    deviceId: device.id
                                }
                            );
                        }
                    });
                    this.monitorIntercomDevices();
                });
        }, 5 * 60000);
    }
}