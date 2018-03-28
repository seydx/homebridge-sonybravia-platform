# homebridge-sonybravia-platform v2.5

[![npm](https://img.shields.io/npm/v/homebridge-sonybravia-platform.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-sonybravia-platform)
[![npm](https://img.shields.io/npm/dt/homebridge-sonybravia-platform.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-sonybravia-platform)
[![GitHub last commit](https://img.shields.io/github/last-commit/SeydX/homebridge-sonybravia-platform.svg?style=flat-square)](https://github.com/SeydX/homebridge-sonybravia-platform)


# Homebridge Platform Plugin for Sony Bravia Android TV

This is a Plugin for [Homebridge](https://github.com/nfarina/homebridge) to control your **Sony Android TV**. 

Following functions can be exposed to HomeKit:

- Switch for TV Power (on/off)
- Switch for the inputs like HDMI, Scart, CEC Devices, AV, WIFI mirroring
- Switch for Apps with custom characteristics (see below)
- Switch for Channels with custom characteristics (see below)
- Bulb for controlling the volume
- Remote Controll with commands like toggle mute, toggle tv power, channel up, channel down, enter, return etc


## Why do we need this plugin?

With this plugin you can create scenes for apps (i.e. starting Amazon Prime), controll your CEC devices like Apple TV or PlayStation, track the state of the TV (on/off), Source Inputs and Volume

See [Images](https://github.com/SeydX/homebridge-sonybravia-platform/tree/master/images/) for more details.


## Installation instructions

After [Homebridge](https://github.com/nfarina/homebridge) has been installed:

-  ```sudo npm install -g homebridge-sonybravia-platform```
- ```sudo apt-get install jq```


## Preparing the TV

- Set "Remote start" to ON in your Android TV Settings -> Network -> Remote Start
- Change "Authentication" to "Normal and Pre-Shared Key" in your Android Settings -> Network -> IP Control -> Authentication
- Enter a "Pre-Shared Key" in your Android TV Settings -> Network -> IP control -> Pre-Shared Key
 
 
## Basic config.json:

 ```
{
 "bridge": {
   ...
},
 "accessories": [
   ...
],
 "platforms": [
 {
  "platform":"SonyBravia", 
  "name":"Sony",
  "ipadress":"192.168.1.1",
  "psk":"YourPSK",
 }
]
}
```
 
## Advanced config.json:

 ```
{
 "bridge": {
   ...
},
 "accessories": [
   ...
],
 "platforms": [
 {
  "platform":"SonyBravia", 
  "name":"Sony Bravia",
  "ipadress":"192.168.1.1",
  "port":80
  "psk":"YourPSK",
  "interval": 5,
  "maxVolume":35,
  "extraInputs":false,
  "volumeEnabled": true,
  "appsEnabled": true,
  "channelsEnabled":false,
  "detectCEC":true,
  "offState": "HOME",
  "remoteControl":true,
  "controlMode":"BASIC",
  "homeapp":"com.sony.dtv.eu.siptv.video.eu.siptv.atv.MainActivity",
  "favChannel":"tv:dvbt?trip=1.1051.10304&srvName=SWR RP HD"
 }
]
}
```


## Multiple TVs

If you want to control multiple TVs , just add a second platform (see above), change the IP, PSK **and** set a new **unique** NAME.


## APPS

Exposed as a **Switch** to HomeKit, that detects automatically all apps from the TV. It also has new characteristics, that allows to control and set the Home App withing the EVE App **AND** change between ALL installed apps on the TV. You will be able to create own scenes. You can dim the light if you start YouTube and many more.. **Note:** Apple Home App doesnt support Accessory with own characteristics. So you need to use apps like Elgato EVE or other to create own scenes.

See [Images](https://github.com/SeydX/homebridge-sonybravia-platform/tree/master/images/) for more details.


### *Home APP

Home App is an on the TV installed app that **can** be defined in the config.json file _(in **v2.3** you are also able to set the Home App within the app!)_. 

With the following command for terminal you will get a list of apps that are installed on your TV (Change TVIPHERE, YOURPSKERE with your data, be sure that **jq** is installed, see above)

- ```curl -XPOST http://TVIPHERE/sony/appControl -d '{"id":2,"method":"getApplicationList","version":"1.0","params":["1.0"]}' -H 'X-Auth-PSK: YOURPSKERE' | jq -r '.result[]'```

Just search your app and copy the adress of the coosen app. This is an example adress of my IPTV: **com.sony.dtv.eu.siptv.video.eu.siptv.atv.MainActivity**

If you dont set this in your config.json, the plugin will look for any cached home apps, if there is nothing, it will take the uri of the app in the first place (in most cases it is Play Store)


## Channels

Exposed as a **Switch** to HomeKit, that detects automatically all channels from the TV. It also has new characteristics, that allows to control and set the favourite channel withing the EVE App **AND** change between ALL channels on the TV. You will be able to create own scenes. **Note:** Apple Home App doesnt support Accessory with own characteristics. So you need to use apps like Elgato EVE or other to create own scenes.

See [Images](https://github.com/SeydX/homebridge-sonybravia-platform/tree/master/images/) for more details.


### *Favourite Channel (favChannel)

With the following command for terminal you will get your favourite channel (Change TVIPHERE, YOURPSKERE with your data, be sure that **jq** is installed, see above! NOTE: **"stIx"** is your channel number on the TV, BUT you need to substract with 1! i.e. Channel Numb on tv is 30, then **"stIx"** is 29!) _(in v2.3 you are able to set the favourite channel within the EVE app!)_

- ```curl -XPOST http://TVIPHERE/sony/avContent -d '{"id":2,"method":"getContentList","version":"1.2","params":[{"source":"tv:dvbt","stIx":0}]}' -H 'X-Auth-PSK: YOURPSKERE' | jq -r '.result[][0]'```

For your config.json you need the "uri" from output. i.e: **tv:dvbt?trip=1.1051.10304&srvName=SWR RP HD**

If you dont set this in your config.json, the plugin will look for any cached favourite channels, if there is nothing, it will take the first channel

## OFFSTATE
Due to the reason that its not possible to **deactivate / shut down** a HDMI input, CEC device etc., this option give you the possibility to set your own off command. There are 3 Modes: "HOME" for starting the home app, "CHANNEL" for switching to youor favourite channel and "OFF" for turning off the TV.


## CEC Device

In **v2.3** it's not necessary to do complicated steps to get a list of your cec devices. If you want to expose your CEC devices like Apple TV or PlayStation 4 just put **"detectCEC":true** in your config.json and follow the instructions in the log. Thats it.

**NOTE:** If you have issues with the state of your CEC Device (due to different tv models) you can set "cecDevices" in your config.json to set manually the HDMI port. The title must be the same as from the cec device. Example:
```
"cecDevices":[
    {
      "title":"Apple TV",
      "hdmiport":4
    }
]
```

## Remote Control

In **v2.5** you have the possibility to expose a remote control (if "remoteControl" is true in config.json) to HomeKit. With the remote control, you can send commands like channel up, channel down, volume up, volume down, enter, home, toggle mute, toggle power etc. You have also the possibility to choose between "BASIC" or "ADVANCED" mode ("controlMode" in config.json). "BASIC" will only expose basic switches to HomeKit. "ADVANCED" will expose some more stuff. All these "commands" will be available within the "Remote Control" service. Therefore, this service is **not compatible** with the Apple Home app! You can use this with apps like Elgato EVE, Home etc.


- See [Example Config](https://github.com/SeydX/homebridge-sonybravia-platform/blob/master/example-config.json) for more details.


## Options

| **Attributes** | **Required** | **Usage** |
|------------|----------|-------|
| name | **Yes** | **Unique Name** for the Platform.   |
| ipadress | **Yes** | IP adress from your Sony Bravia TV |
| port | No | If you have problems with connecting to the TV, try a different port (Default: 80) |
| psk | **Yes** | Your Pre Shared Key |
| interval | No | Polling Interval in seconds (Default: 2s) |
| extraInputs | No | Expose extra sources like AV, display mirroring etc. (Default: true) |
| appsEnabled | No | Expose App Service to HomeKit (Default: true, not compatible with Apple Home app) |
| volumeEnabled | No | Expose a bulb to HomeKit to control TV volume (Default: true) |
| channelsEnabled | No | Expose Channel Service to HomeKit (Default: false, not compatible with Apple Home app) |
| channelSource | No | Source type (tv:dvbt , tv:dvbc) (Default: tv:dvbt) |
| homeapp | No | URI of an installed app on the TV |
| favChannel | No | URI from the favourite channel |
| maxVolume | No | Max adjustable volume (Default: 35) |
| detectCEC | No | Expose CEC devices instead of HDMI inputs to HomeKit (Default: true) |
| cecDevices | No | **ONLY** if you have issues with the state of your cec devices, you can add this to manually define the hdmi port of the device |
| offState | No | choose between "HOME", "CHANNEL" or "OFF" to create your own off state command (Default: "HOME") |
| remoteControl | No | Exposes remote control to HomeKit (Default: false, not compatible with Apple Home app) |
| controlMode | No | choose between "BASIC" or "ADVANCED" or "OFF" to create your own remote control (Default: "BASIC") |


## Supported clients

This platform and the switches it creates have been verified to work with the following apps on iOS 11.2.5:

* Apple Home (no App/Channel controlling)
* Elgato Eve 


## Known issues | TODO

- ISSUE: At the moment it is not possible to deactivate a CEC device or shutting it down, this plugin activates the option setted in config.json instead (offState > "HOME" for Home App, "CHANNEL" for Channels and "OFF" for turning TV off)

- [x] TODO: create option to expose other Inputs like Scart, Composite, Screen mirroring
- [x] TODO: Bulb for volume up/down
- [x] TODO: Service to switch between apps
- [x] TODO: Better error handling
- [x] TODO: Service to switch between Channels
- [x] TODO: Better, faster and easier
- [x] TODO: Adding cache function
- [x] TODO: New option: offState
- [x] TODO: New function: Remote Control


## Contributing

You can contribute to this homebridge plugin in following ways:

- [Report issues](https://github.com/SeydX/homebridge-sonybravia-platform/issues) and help verify fixes as they are checked in.
- Review the [source code changes](https://github.com/SeydX/homebridge-sonybravia-platform/pulls).
- Contribute bug fixes.
- Contribute changes to extend the capabilities

Pull requests are accepted.
