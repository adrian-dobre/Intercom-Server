# Electra PAS.17A Smart Intercom Adapter - Application Server

## Special thanks to [Nicolae Simpalean for inspiration](https://simpalean.site/interfon/)
You can contact him for a ready made solution adapted to you, which you can install yourself or have Mr. Simpalean send you a new device that "just works" :)
If, however you like DIY work and have time on your hands, you can stay here and read a bit :) and use these resources free of change :).

If you like my work, and want to give something back, you can also [Buy me a beer](https://www.paypal.com/donate/?hosted_button_id=LH4JS85SDZPKN)

## What's this about
This is a "smart" adapter tailor made for Electra PAS.17A units, that allows you to get Push Notifications on your phone whenever your Intercom device is ringing and also control de device via Talk/Open commands.

Note: It will NOT forward audio to/from device.

## How does it work

The solution is composed from 3 components:

1. A device that interfaces with the Electra device, it needs to be installed inside the device and connected to the PAS.17A board via 3 singnal wires and 2 power wires (see below). This will detect device signals (ring, talk, open) and send commands (talk, listen, open) and will communicate via WebSockets with an application server [see this page](https://github.com/adrian-dobre/Nano33IoT-Electra-Intercom)

2. An application server - this repository contains the source code for the Application Server.

3. A mobile application - to be updated.

![App Demo](./demo/images/app_demo.gif?raw=true)
![App Settings](./demo/images/app_settings.png?raw=true)
![App Call Log](./demo/images/app_call_log.png?raw=true)

## The "Application Server part"

This server forwards the events from the Intercom device to the Mobile App and the commands in the opposite direction (Mobile App -> Intercom device).
It can Push Mobile Notifications for different events:
- Incoming Intercom Call
- Intercom Device Connected
- Intercom Device Disconnected
- Intercom Device Missing (disconnected) for some time 

It allows storing a call log and changing device configuration (auto response, delays, etc.)
It stores everything in a JSON based "database" inside [__storage](./__storage) directory.

It uses [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging) for pushing notifications to the device,
but you'll have to configure your own Firebase application access tokens and add them to [__config](./__config) directory (as firebase-config.json)
or just disable push notifications in the code.

At this time there is no exposed functionality to create users, but you can do it manually by creating a user object and saving it to the repository
in the application code; once it's created, you can remove that code and restart the server. I plan to add an easier way to do this, but
this would have to do for now.

For example, in [app.module.ts](./src/application/app.module.ts), you could add something like:
```
export class AppModule {
    constructor(
        @Inject('UserRepository')
        private userRepository: UserRepository
    ) {
  
        userRepository.save(new User("john.doe@example.com", "s0m3p@ssw0rd!"))
    }
}
```
and then run the app, wait for about 10s until the entry is saved in the "DB" (the "DB" is synced to the disk every 10s),
close the app, remove the code and run the app again - you now have a user created.