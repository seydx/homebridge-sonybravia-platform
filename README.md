# Homebridge Platform Plugin for Sony Bravia Android TV

This is a Platform Plugin for [Homebridge](https://github.com/nfarina/homebridge) that expose a Switch to turn on/off the TV, Service for Apps installed on the TV and Switches for all HDMI inputs from your TV to Apple HomeKit. It can also detect CEC devices like Apple TV or PlayStation 4 and controll them. So it is possible to turn on your Apple TV or PlayStation etc. with polling to create awesome automations.

## Why do we need this plugin?

With this plugin you will get a switch to controll the power of your TV (on/off) , a Service to switch between App installed on the TV, switches for the TV Inputs (HDMI) and also switches for your CEC devices (must be defined in the config file to expose them) that are plugged in like Apple TV or PlayStation etc. So it will be possible to controll these devices (at the moment only powering on and changing input). More functions will come very soon! 

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
  "homeapp":"com.sony.dtv.eu.siptv.video.eu.siptv.atv.MainActivity",
  "tvSwitch": true,
  "polling":true,
  "interval": 2,
  "cecs":
  [
   {
    "label":"Apple TV",
    "logaddr":8,"port":2
   },
   {
    "label":"PlayStation 4",
    "logaddr":4,"port":3
   }
  ]
 }
]
}
```

### Home APP

Home App is an on the TV installed app that must be defined in the config.json file. Due to the reason that it makes no sense and also not possible to **deactivate** a HDMI input this App will start instead. So if you switch off an HDMI, the input will change from HDMI to the Home App (_in my case it is a IPTV app_)

With the following command for terminal you will get list of apps that are installed on your TV:

- ```curl -XPOST http://TVIPHERE/sony/appControl -d '{"id":2,"method":"getApplicationList","version":"1.0","params":["1.0"]}' -H 'X-Auth-PSK: YOURPSKERE' | jq -r '.result[]'```

Just search your app and copy the adress of the coosen app. This is an example adress for my IPTV: com.sony.dtv.eu.siptv.video.eu.siptv.atv.MainActivity


### CEC Device

If you dont want only HDMI inputs without special functional, you can also put your CEC devices that are plugged in on the tv to create HDMI switches with cec controlling functionality. To do these, it is important to get the port and the logical adress of the device. Do following steps:

1. TURN ON the TV

2. ```curl -XPOST http://TVIPHERE/sony/avContent -d '{"id":2,"method":"getCurrentExternalInputsStatus","version":"1.0","params":["1.0"]}' -H 'X-Auth-PSK: YOURPSKERE' | jq -r '.result[]'```

3. You will get a list of source inputs, search for your "CEC" device like Apple TV. The "port" and "logaddr" (needed for config.json) is in the adress, in the list defined as **"uri"**, so if your "uri" is **"extInput:cec?type=player&port=3&logicalAddr=4"** then your **port is 3** and **logaddr is 4**, the "label" (also needed for config.json) is in the list defined as "title"

- See [Example Config](https://github.com/SeydX/homebridge-sonybravia-platform/edit/master/config-example.json) for more details.

## APPS

This plugin creates a Service that detects automatically all Apps from the TV. With Elgato EVE App it is possibpe to create scenes to activate an certain app like Amazon or YouTube etc or just switching between them. **Note:** Apple Home dont support this. The scenes must be created with Elagto Eve (tested) or other apps.

## Options
Following are tables to see which keys/values are required and which are optional for the config.json

### BASE (required)
If you put only required lines into your config.json, you will only get the HDMI Inputs withouts CEC functionality, Apps etc.

| Attributes | Required | Usage |
|------------|----------|-------|
| ipadress | Yes | IP adress from your Sony Bravia TV |
| psk | Yes | Your Pre Shared Key |
| homeapp | Yes | Cause it is not possible to "shutting down" or "deactivate" a HDMI Input or CEC, the homeapp will be activated instead - App installed on the Sony TV |

### OPTIONAL (TV)
With these settings you will get a power switch and a polling functionality for your devices, inputs and tv

| Attributes | Required | Usage |
|------------|----------|-------|
| name | no | Name for the Platform. |
| tvSwitch | No | Exposes a Switch for the TV (Default: true) |
| polling | No | Checking states of TV and Sources (Default: true) |
| interval | No | Polling Interval in seconds (Default: 2s) |

### OPTIONAL (CEC)
With these settings, you will get cec functionality for your created HDMI switches.

| Attributes | Required | Usage |
|------------|----------|-------|
| cecs | No | By putting "cec" into your config.json, this plugin will expose the HDMI Input of the device with CEC functionality |
| label | Yes (only if created a cec) | Is the name of your CEC Device (i.e. Apple TV)|
| port | Yes (only if created a cec) | HDMI port of the CEC device |
| logaddr | Yes (only if created a cec) | Logical Adress of the CEC device |


## Supported clients

This platform and the switches it creates have been verified to work with the following apps on iOS 11:

* Home (no App controlling)
* Elgato Eve 


## Known issues | TODO

- ISSUE: At the moment it is not possible to deactivate a CEC device or shutting it down, this plugin activates the "Home APP" setted in config.json instead

- TODO: create option to expose other Inputs like Scart, Composite, Screen mirroring
- TODO: Switch/Bulb for volume up/down
- ~~TODO: Service to switch between apps~~
- TODO: Service to switch netween Channels


## Contributing

You can contribute to this homebridge plugin in following ways:

- [Report issues](https://github.com/SeydX/homebridge-sonybravia-platform/issues) and help verify fixes as they are checked in.
- Review the [source code changes](https://github.com/SeydX/homebridge-sonybravia-platform/pulls).
- Contribute bug fixes.
- Contribute changes to extend the capabilities

Pull requests are accepted.


## Credits

Thanks to @grover for this beatiful ReadMe template


## MIT License

Copyright (c) 2017 SeydX

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
