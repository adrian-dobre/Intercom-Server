export interface PushNotificationsRepository {
    sendNotificationToUser(userId: string, title: string, body: string, data: any);
}
