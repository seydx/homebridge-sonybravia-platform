# homebridge-sonybravia-platform v2.2

[![npm](https://img.shields.io/npm/v/homebridge-sonybravia-platform.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-sonybravia-platform)
[![npm](https://img.shields.io/npm/dt/homebridge-sonybravia-platform.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-sonybravia-platform)
[![GitHub last commit](https://img.shields.io/github/last-commit/SeydX/homebridge-sonybravia-platform.svg?style=flat-square)](https://github.com/SeydX/homebridge-sonybravia-platform)


# Homebridge Platform Plugin for Sony Bravia Android TV

This is a Plugin for [Homebridge](https://github.com/nfarina/homebridge) to control your **Sony Android TV**. This plugin expose a Power Switch, HDMI Inputs with CEC functionality (if adjusted in config), a Service for your installed apps on the TV and a Bulb to controll the volume.


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
  "maxVolume":30,
  "extraInputs":false,
  "volumeEnabled": true,
  "appsEnabled": true,
  "channelsEnabled":false,
  "homeapp":"com.sony.dtv.eu.siptv.video.eu.siptv.atv.MainActivity",
  "favChannel":"tv:dvbt?trip=1.1051.10304&srvName=SWR RP HD",
  "cecs":
  [
   {
    "label":"Apple TV",
    "logaddr":8,
    "port":2
   },
   {
    "label":"PlayStation 4",
    "logaddr":4,
    "port":3
   }
  ]
 }
]
}
```


## Multiple TVs

If you want to control multiple TVs , just add a second platform (see above), change the IP and PSK **and** give the platform an own unique "name".


## APPS

This plugin expose a **Switch** that detects automatically all Apps from the TV. It will add new characteristic to the switch to control ***Home APP** and also all the other apps installed on the TV. With Elgato EVE App it is possible to create scenes to activate apps or just switching between them. **Note:** Apple Home dont support this. The scenes must be created with Elagto Eve (tested) or other apps.

See [Images](https://github.com/SeydX/homebridge-sonybravia-platform/tree/master/images/) for more details.


### *Home APP

Home App is an on the TV installed app that can be defined in the config.json file. Due to the reason that its not possible to **deactivate** a HDMI input, this App will start instead. So if you switch off HDMI, the input will change from HDMI to the Home App (_in my case it is an IPTV app_)

With the following command for terminal you will get list of apps that are installed on your TV (Change TVIPHERE, YOURPSKERE with your data, be sure that **jq** is installed, see above)

- ```curl -XPOST http://TVIPHERE/sony/appControl -d '{"id":2,"method":"getApplicationList","version":"1.0","params":["1.0"]}' -H 'X-Auth-PSK: YOURPSKERE' | jq -r '.result[]'```

Just search your app and copy the adress of the coosen app. This is an example adress of my IPTV: com.sony.dtv.eu.siptv.video.eu.siptv.atv.MainActivity

If you dont set this in your config.json, the plugin will take the uri of the app in the first place (in most cases it is Play Store)


## Channels

This plugin expose a **Switch** that detects automatically all Channels from the TV. It will add new characteristic to the switch to control ***Favourite Channel** and also all the other channels. With Elgato EVE App it is possible to create scenes to activate channel or just switching between them. **Note:** Apple Home dont support this. The scenes must be created with Elagto Eve (tested) or other apps.

See [Images](https://github.com/SeydX/homebridge-sonybravia-platform/tree/master/images/) for more details.


### *Favourite Channel (favChannel)

With the following command for terminal you will get your favourite channel (Change TVIPHERE, YOURPSKERE with your data, be sure that **jq** is installed, see above! NOTE: **"stIx"** is your channel number on the TV, BUT you need to substract with 1! i.e. Channel Numb on tv is 30, then **"stIx"** is 29!)

- ```curl -XPOST http://TVIPHERE/sony/avContent -d '{"id":2,"method":"getContentList","version":"1.2","params":[{"source":"tv:dvbt","stIx":0}]}' -H 'X-Auth-PSK: YOURPSKERE' | jq -r '.result[][0]'```

For your config.json you need the "uri" from output. i.e: **tv:dvbt?trip=1.1051.10304&srvName=SWR RP HD**

If you dont set this in your config.json, the plugin will take the first channel.


## CEC Device

If you want to control your CEC devices too, do following steps (it is important to get the logical adress! the "port" ist just the hdmi port where the device is plugged in! Dont forget to change TVIPHERE and YOURPSKERE with your data and be sure that **jq** is installed! See above):

1. TURN ON the TV

2. ```curl -XPOST http://TVIPHERE/sony/avContent -d '{"id":2,"method":"getCurrentExternalInputsStatus","version":"1.0","params":["1.0"]}' -H 'X-Auth-PSK: YOURPSKERE' | jq -r '.result[]'```

3. You will get a list of source inputs, search for your "CEC" device like Apple TV. The "port" and "logaddr" (needed for config.json) is in the adress line, in the list defined as **"uri"**, so if your "uri" is **"extInput:cec?type=player&port=3&logicalAddr=4"** then your **port is 3** and **logaddr is 4**, the "label" (also needed for config.json) is in the list defined as "title"

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
| appsEnabled | No | Expose App Service to HomeKit (Not compatible with Apple Home App!) (Default: true) |
| volumeEnabled | No | Expose a bulb to HomeKit to control TV volume (Default: true) |
| channelsEnabled | No | Expose Channel Service to HomeKit (Not compatible with Apple Home App!) (Default: false) |
| channelSource | No | Source type (tv:dvbt , tv:dvbc) (Default: tv:dvbt) |
| homeapp | No | Cause it is not possible to switch off a HDMI Input or CEC, the homeapp will be activated instead |
| favChannel | No | Setting favourite channel for the Channel Switch |
| maxVolume | No | Max adjustable volume (Default: 30) |
| cecs | No | By putting "cec" key into your config.json, this plugin will expose the HDMI Input of the device with CEC functionality |
| label | **Yes (only if created a cec)** | Is the name of your CEC Device (i.e. Apple TV)|
| port | **Yes (only if created a cec)** | HDMI port of the CEC device |
| logaddr | **Yes (only if created a cec)** | Logical Adress of the CEC device |


## Supported clients

This platform and the switches it creates have been verified to work with the following apps on iOS 11.2.5:

* Home (no App controlling)
* Elgato Eve 


## Known issues | TODO

- ISSUE: At the moment it is not possible to deactivate a CEC device or shutting it down, this plugin activates the "Home APP" setted in config.json instead

- [x] TODO: create option to expose other Inputs like Scart, Composite, Screen mirroring
- [x] TODO: Bulb for volume up/down
- [x] TODO: Service to switch between apps
- [x] TODO: Better error handling
- [x] TODO: Service to switch between Channels


## Contributing

You can contribute to this homebridge plugin in following ways:

- [Report issues](https://github.com/SeydX/homebridge-sonybravia-platform/issues) and help verify fixes as they are checked in.
- Review the [source code changes](https://github.com/SeydX/homebridge-sonybravia-platform/pulls).
- Contribute bug fixes.
- Contribute changes to extend the capabilities

Pull requests are accepted.
