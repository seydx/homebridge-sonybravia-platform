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
  "cecs":[
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

### IP Adress and PSK

Enter the IP address of your television in the ipaddress field. On your TV go to Settings->Network->Home network->IP Control. Change Authentication to "Normal and Pre-Shared Key". Enter something for the Pre-Shared Key. Put that same string in the psk field.


### Home APP

To create a "Home APP" put following in terminal to get the uri of your choosen app:

- ```curl -XPOST http://TVIPHERE/sony/appControl -d '{"id":2,"method":"getApplicationList","version":"1.0","params":["1.0"]}' -H 'X-Auth-PSK: YOURPSKERE' | jq -r '.result[]'```

- This will return a list of Apps installed on your TV, just search for the app you will as "Home APP" and copy the "uri" - Example: com.sony.dtv.eu.siptv.video.eu.siptv.atv.MainActivity


### CEC Device

If you want to set up a CEC device and need the Name (label), Port (port) and Logical Address (logaddr) do this steps:

1. TURN ON the TV

2. ```curl -XPOST http://TVIPHERE/sony/avContent -d '{"id":2,"method":"getCurrentExternalInputsStatus","version":"1.0","params":["1.0"]}' -H 'X-Auth-PSK: YOURPSKERE' | jq -r '.result[]'```

3. You will get a list of source inputs, search for your CEC device like Apple TV. The "port" and "logaddr" is in the "uri", so if your "uri" is "extInput:cec?type=player&port=3&logicalAddr=4" then your port is 3 and logaddr is 4, the "title" is your "label" for the config.json

- See [Example Config](https://github.com/SeydX/homebridge-sonybravia-platform/edit/master/config-example.json) for more details.


## Options

| Attributes | Required | Usage |
|------------|----------|-------|
| name | no | Name for the Platform. |
| ipadress | Yes | IP adress from your Sony Bravia TV |
| psk | Yes | Your Pre Shared Key |
| homeapp | Yes | Cause it is not possible to "shutting down" or "deactivate" a HDMI Input or CEC, the homeapp will be activated instead - App installed on the Sony TV |
| tvSwitch | No | Exposes a Switch for the TV (Default: true) |
| polling | No | Checking states of TV and Sources (Default: true) |
| interval | No | Polling Interval in seconds (Default: 2s) |
| cecs | No | When you write "CEC's" in the config.json, the plugin will not just expose the HDMI inputs, it also controls whether one of the "CECs" in config.json is plugged into the HDMI input. If "yes" so it will expose the CEC, if "no" it will only expose the HDMI-Input |


## Known issues | TODO

- At the moment it is not possible to deactivate a CEC or shutting it down, this plugin activates the "Home APP" setted in config.json instead



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
