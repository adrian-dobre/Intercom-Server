import {ClientInformation, ClientType} from "../controllers/dto/ClientInformation";
import {UserInformation} from "../controllers/dto/UserInformation";


export class Helpers {
    static getUserInformation(request: { headers: { [x: string]: string; }; }): Promise<UserInformation> {
        const authorizationHeader = request.headers['authorization'];
        const basicAuthRegExp = /Basic (.+)/;
        let user;
        if (!basicAuthRegExp.test(authorizationHeader)) {
            return Promise.reject(new Error("Missing Authorization (Basic) header"));
        } else {
            const [username, password] = Buffer.from(basicAuthRegExp.exec(authorizationHeader)[1], "base64").toString().split(':');
            user = new UserInformation(username, password);
        }
        return Promise.resolve(user);
    }

    static getClientInformation(request: { headers: { [x: string]: string; }; }): Promise<ClientInformation> {
        switch (request.headers['device-type']) {
            case 'application':
                return Promise.resolve(new ClientInformation(ClientType.MOBILE_APPLICATION, null, request.headers['notification-token']));
            default:
                return Promise.resolve(new ClientInformation(ClientType.INTERCOM_DEVICE, request.headers['device-id'], null, request.headers['device-name']));
        }
    }
}