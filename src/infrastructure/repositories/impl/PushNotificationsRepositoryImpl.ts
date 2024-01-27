import {Inject, Injectable, Logger} from "@nestjs/common";
import {MobileApplicationRepository} from "../MobileApplicationRepository";
import {PushNotificationsRepository} from "../PushNotificationsRepository";
import admin from "firebase-admin";

@Injectable()
export class PushNotificationsRepositoryImpl implements PushNotificationsRepository {
    private readonly logger = new Logger(PushNotificationsRepositoryImpl.name);

    constructor(
        @Inject('MobileApplicationRepository')
        private mobileApplicationRepository: MobileApplicationRepository
    ) {
        const serviceAccount = require("../../../../__config/firebase-config.json");
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }

    sendNotificationToUser(userId: string, title: string, body: string, data: any = {}) {
        return this.mobileApplicationRepository
            .findAllByAttributes({userId})
            .then(applications => {
                const notification: admin.messaging.TokenMessage = {
                    token: "",
                    data,
                    notification: {
                        title,
                        body
                    },
                    android: {
                        priority: "high"
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: 'notification.aiff'
                            }
                        }
                    }
                };
                applications.forEach((application => {
                    if (typeof application.notificationToken === 'string' && application.notificationToken.length) {
                        notification.token = application.notificationToken;
                        ((mobileApp) => {
                            this.logger.debug(`Sending push notification to: ${notification.token}`);
                            return admin
                                .messaging()
                                .send(notification)
                                .catch(error => {
                                    if (error.errorInfo && error.errorInfo.code === "messaging/registration-token-not-registered") {
                                        this.mobileApplicationRepository.remove(mobileApp);
                                    }
                                    this.logger.error(error);
                                });
                        })(application);
                    }
                }));
            });
    }
}
