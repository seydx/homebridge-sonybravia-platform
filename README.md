# homebridge-sonybravia-platform v2.0

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
 
 
## Example config.json:

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
  "psk":"YourPSK",
  "interval": 5,
  "maxVolume":30,
  "extraInputs":false,
  "homeapp":"com.sony.dtv.eu.siptv.video.eu.siptv.atv.MainActivity",
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


### Multiple TVs

If you want to control multiple TVs , just add a second platform (see above), change the IP and PSK **and** give the platform an own unique "name".


### Home APP

Home App is an on the TV installed app that must be defined in the config.json file. Due to the reason that its not possible to **deactivate** a HDMI input, this App will start instead. So if you switch off HDMI, the input will change from HDMI to the Home App (_in my case it is an IPTV app_)

With the following command for terminal you will get list of apps that are installed on your TV (Change TVIPHERE, YOURPSKERE with your data, be sure that **jq** is installed, see above)

- ```curl -XPOST http://TVIPHERE/sony/appControl -d '{"id":2,"method":"getApplicationList","version":"1.0","params":["1.0"]}' -H 'X-Auth-PSK: YOURPSKERE' | jq -r '.result[]'```

Just search your app and copy the adress of the coosen app. This is an example adress of my IPTV: com.sony.dtv.eu.siptv.video.eu.siptv.atv.MainActivity


### CEC Device

If you want to control your CEC devices too, do following steps (it is important to get the logical adress! the "port" ist just the hdmi port where the device is plugged in! Dont forget to change TVIPHERE and YOURPSKERE with your data and be sure that **jq** is installed! See above):

1. TURN ON the TV

2. ```curl -XPOST http://TVIPHERE/sony/avContent -d '{"id":2,"method":"getCurrentExternalInputsStatus","version":"1.0","params":["1.0"]}' -H 'X-Auth-PSK: YOURPSKERE' | jq -r '.result[]'```

3. You will get a list of source inputs, search for your "CEC" device like Apple TV. The "port" and "logaddr" (needed for config.json) is in the adress line, in the list defined as **"uri"**, so if your "uri" is **"extInput:cec?type=player&port=3&logicalAddr=4"** then your **port is 3** and **logaddr is 4**, the "label" (also needed for config.json) is in the list defined as "title"

- See [Example Config](https://github.com/SeydX/homebridge-sonybravia-platform/blob/master/example-config.json) for more details.


## APPS

This plugin creates a Service that detects automatically all Apps from the TV. With Elgato EVE App it is possible to create scenes to activate an certain app like Amazon or YouTube etc or just switching between them. **Note:** Apple Home dont support this. The scenes must be created with Elagto Eve (tested) or other apps.


## Options

| **Attributes** | **Required** | **Usage** |
|------------|----------|-------|
| name | **Yes** | **Unique Name** for the Platform.   |
| ipadress | **Yes** | IP adress from your Sony Bravia TV |
| psk | **Yes** | Your Pre Shared Key |
| interval | No | Polling Interval in seconds (Default: 2s) |
| extraInputs | No | Expose extra sources like AV, display mirroring etc. (Default: true) |
| homeapp | **Yes** | Cause it is not possible to switch off a HDMI Input or CEC, the homeapp will be activated instead |
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
- [ ] TODO: Service to switch between Channels


## Contributing

You can contribute to this homebridge plugin in following ways:

- [Report issues](https://github.com/SeydX/homebridge-sonybravia-platform/issues) and help verify fixes as they are checked in.
- Review the [source code changes](https://github.com/SeydX/homebridge-sonybravia-platform/pulls).
- Contribute bug fixes.
- Contribute changes to extend the capabilities

Pull requests are accepted.
