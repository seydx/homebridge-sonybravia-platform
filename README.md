# Homebridge Plugin for Sony Bravia TV

A plugin that exposes all HDMI Inputs to HomeKit via [Homebridge](https://github.com/nfarina/homebridge). It can also detect CEC devices like Apple TV or Playstation to activate them via HomeKit.

## Why do we need this plugin?

With this plugin you can expose the HDMI inputs to HomeKit as "Switches". It's also possible to create a CEC list to activate devices like Apple TV or PlayStation that are plugged in.

See [Images](https://github.com/SeydX/homebridge-sonybravia-platform/tree/master/images/) for more details.


## Installation instructions

After [Homebridge](https://github.com/nfarina/homebridge) has been installed:

-  ```sudo npm install -g homebridge-sonybravia-platform```
- ```sudo apt-get install jq```
 
- Set "Remote start" to ON in your Android TV Settings->Network->Remote Start
- Change "Authentication" to "Normal and Pre-Shared Key" in your Android Settings->Network->IP Control->Authentication
- Enter a "Pre-Shared Key" in your Android TV Settings->Network->IP control->Pre-Shared Key
 
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
  "cecs":[{"label":"Apple TV","logaddr":8,"port":2},
          {"label":"PlayStation 4","logaddr":4,"port":3}
  ],
  "apps":[{"appName":"YouTube"},
          {"appName":"Kodi"},
          {"appName":"Smart IPTV"},
  ]
 }
 ]
}
```

### IP Adress and PSK

Enter the IP address of your television in the ipaddress field. On your TV go to Settings->Network->Home network->IP Control. Change Authentication to "Normal and Pre-Shared Key". Enter something for the Pre-Shared Key. Put that same string in the psk field.


### Home APP

To create a "Home APP" (config.json -> homeapp) put following in terminal to get the adress of the app you want set as Home App:

- ```curl -XPOST http://TVIPHERE/sony/appControl -d '{"id":2,"method":"getApplicationList","version":"1.0","params":["1.0"]}' -H 'X-Auth-PSK: YOURPSKERE' | jq -r '.result[]'```

- This will return a list of Apps installed on your TV, just search for the app you will as "Home APP" and copy the adress - Example: com.sony.dtv.eu.siptv.video.eu.siptv.atv.MainActivity


### CEC Device

If you want to set up a CEC device and need the Name (label), Port (port) and Logical Address (logaddr) do following steps:

1. TURN ON the TV

2. ```curl -XPOST http://TVIPHERE/sony/avContent -d '{"id":2,"method":"getCurrentExternalInputsStatus","version":"1.0","params":["1.0"]}' -H 'X-Auth-PSK: YOURPSKERE' | jq -r '.result[]'```

3. You will get a list of source inputs, search for your "CEC" device like Apple TV. The "port" and "logaddr" (needed for config.json) is in the adress, in the list defined as "uri", so if your "uri" is "extInput:cec?type=player&port=3&logicalAddr=4" then your port is 3 and logaddr is 4, the "label" (also needed for config.json) is in the list defined as "title"

- See [Example Config](https://github.com/SeydX/homebridge-sonybravia-platform/edit/master/config-example.json) for more details.


## Options
Following are tables to see which keys/values are required and which are optional for the config.json

### BASE (required)
If you put only required lines into your config.json, you will only get the HDMI Inputs withouts CEC functionality, Apps etc.

| Attributes | Required | Usage |
|------------|----------|-------|
| ipadress | Yes | IP adress from your Sony Bravia TV |
| psk | Yes | Your Pre Shared Key |
| homeapp | Yes | Cause it is not possible to "shutting down" or "deactivate" a HDMI Input or CEC, the homeapp will be activated instead - App installed on the Sony TV |

### OPTIONAL (not required)
If you put all optional lines, you will get CEC possiblity, Apps etc

| Attributes | Required | Usage |
|------------|----------|-------|
| name | no | Name for the Platform. |
| tvSwitch | No | Exposes a Switch for the TV (Default: true) |
| polling | No | Checking states of TV and Sources (Default: true) |
| interval | No | Polling Interval in seconds (Default: 2s) |

### OPTIONAL for CEC (not required)
| Attributes | Required | Usage |
|------------|----------|-------|
| cecs | No | By putting "cec" into your config.json, this plugin will expose the HDMI Input of the device with cec functionality |
| label | Yes (only if created a cec) | Is the name of your CEC Device (i.e. Apple TV)|
| port | Yes (only if created a cec) | HDMI port of the CEC device |
| logaddr | Yes (only if created a cec) | Logical Adress of the CEC device |

### OPTIONAL for APPS (not required)
| Attributes | Required | Usage |
|------------|----------|-------|
| apps | No | By putting "apps" into your config.json, this plugin will expose them to HomeKit |
| appName | Yes (only if created a app) | Is the name of your App (i.e. YouTube)|


## Known issues | TODO

- ISSUE: At the moment it is not possible to deactivate a CEC device or shutting it down, this plugin activates the "Home APP" setted in config.json instead

- TODO: create option to expose other Inputs like Scart, Composite, Screen mirroring
- TODO: function to volume up/down 
- ~~TODO: function to switch between apps~~
- TODO: function to switch between channels


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
