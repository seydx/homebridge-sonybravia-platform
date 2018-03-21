var http = require("http"),
    inherits = require("util").inherits;

var Accessory,
    Service,
    Characteristic;

class APPS {

    constructor(log, config, api) {

        Accessory = api.platformAccessory;
        Service = api.hap.Service;
        Characteristic = api.hap.Characteristic;

        Service.AppService = function(displayName, subtype) {
            Service.call(this, displayName, "1d837d23-84f7-424a-91b9-0b1fe288e1d2", subtype);
        };
        inherits(Service.AppService, Service);
        Service.AppService.UUID = "1d837d23-84f7-424a-91b9-0b1fe288e1d2";

        Characteristic.TargetApp = function() {
            Characteristic.call(this, "Target App Nr", "613f5692-4713-4743-85ca-627e8f17d3bf");
            this.setProps({
                format: Characteristic.Formats.UINT8,
                unit: Characteristic.Units.NONE,
                maxValue: 999,
                minValue: 0,
                minStep: 1,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.TargetApp, Characteristic);
        Characteristic.TargetApp.UUID = "613f5692-4713-4743-85ca-627e8f17d3bf";

        Characteristic.TargetName = function() {
            Characteristic.call(this, "Target App Name", "e2454387-a3e9-44a9-82f2-852f9628ecbc");
            this.setProps({
                format: Characteristic.Formats.STRING,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.TargetName, Characteristic);
        Characteristic.TargetName.UUID = "e2454387-a3e9-44a9-82f2-852f9628ecbc";

        var platform = this;

        this.log = log;
        this.name = config.name + " Apps";
        this.psk = config.psk;
        this.ipadress = config.ipadress;
        this.interval = config.interval;
        this.maxApps = config.maxApps;
        this.port = config.port;
        this.setOnCount = 0;
        this.setOffCount = 0;
        this.getCount = 0;

        !this.appnr ? this.appnr = 0 : this.appnr;
        !this.appname ? this.appname = "" : this.appname;

        this.getContent = function(setPath, setMethod, setParams, setVersion) {

            return new Promise((resolve, reject) => {

                var options = {
                    host: platform.ipadress,
                    port: platform.port,
                    family: 4,
                    path: setPath,
                    method: 'POST',
                    headers: {
                        'X-Auth-PSK': platform.psk
                    }
                };

                var post_data = {
                    "method": setMethod,
                    "params": [setParams],
                    "id": 1,
                    "version": setVersion
                };

                var req = http.request(options, function(res) {

                    if (res.statusCode < 200 || res.statusCode > 299) {
                        reject(new Error('Failed to load data, status code: ' + res.statusCode));
                    }

                    const body = []
                    res.on('data', (chunk) => body.push(chunk));
                    res.on('end', () => resolve(body.join('')));

                });

                req.on('error', (err) => reject(err))

                req.write(JSON.stringify(post_data));
                req.end();

            })

        };

    }

    getServices() {

        var self = this;

        this.informationService = new Service.AccessoryInformation()
            .setCharacteristic(Characteristic.Name, this.name)
            .setCharacteristic(Characteristic.Identify, this.name)
            .setCharacteristic(Characteristic.Manufacturer, 'Sony')
            .setCharacteristic(Characteristic.Model, 'App Control')
            .setCharacteristic(Characteristic.SerialNumber, "Sony-Apps")
            .setCharacteristic(Characteristic.FirmwareRevision, require('../package.json').version);

        this.AppService = new Service.AppService(this.name);

        this.AppService.addCharacteristic(Characteristic.TargetApp);
        this.AppService.getCharacteristic(Characteristic.TargetApp)
            .setProps({
                maxValue: self.maxApps,
                minValue: 0,
                minStep: 1
            })
            .updateValue(self.appnr)
            .on("set", this.setTargetApp.bind(this));

        this.AppService.addCharacteristic(Characteristic.TargetName);
        this.AppService.getCharacteristic(Characteristic.TargetName)
            .updateValue(self.appname);

        this.getContent("/sony/appControl", "getApplicationList", "1.0", "1.0")
            .then((data) => {

                var response = JSON.parse(data);

                var name = response.result[0];

                self.log("Following, a list of all installed Apps on the TV. Have fun.");
                for (var i = 0; i < name.length; i++) {
                    self.log(i + ": " + name[i].title);
                }

            })
            .catch((err) => {
                self.log("Can't show Application list! " + err + ". Try again...");
                setTimeout(function() {
                    self.getServices();
                }, 15000)
            });

        this.getStates();

        return [this.informationService, this.AppService];
    }

    getStates() {

        var self = this;

        self.appnr = self.AppService.getCharacteristic(Characteristic.TargetApp).value;

        self.getContent("/sony/appControl", "getApplicationList", "1.0", "1.0")
            .then((data) => {

                var response = JSON.parse(data);

                var name = response.result[0];

                for (var i = 0; i <= name.length; i++) {

                    switch (i) {
                        case self.appnr:
                            self.appname = name[i].title
                            break;
                    }

                }

                self.AppService.getCharacteristic(Characteristic.TargetApp).updateValue(self.appnr);
                self.AppService.getCharacteristic(Characteristic.TargetName).updateValue(self.appname);
                setTimeout(function() {
                        self.getStates();
                    }, 60 * 60 * 1000) //Checking all 60min for new Apps

            })
            .catch((err) => {
                self.AppService.getCharacteristic(Characteristic.TargetApp).updateValue(self.appnr);
                self.AppService.getCharacteristic(Characteristic.TargetName).updateValue(self.appname);
                if (self.getCount > 5) {
                    self.log(self.name + ": " + err);
                }
                setTimeout(function() {
                    self.getCount += 1;
                    self.getStates();
                }, 60000)
            });

    }

    setTargetApp(value, callback) {

        var self = this;

        var uri;

        self.getContent("/sony/appControl", "getApplicationList", "1.0", "1.0")
            .then((data) => {

                var response = JSON.parse(data);

                var name = response.result[0];

                for (var i = 0; i <= name.length; i++) {

                    switch (i) {
                        case value:
                            self.appname = name[i].title;
                            self.appnr = value;
                            uri = name[i].uri;
                            break;
                    }

                }

                self.getContent("/sony/appControl", "setActiveApp", {
                        "uri": uri
                    }, "1.0")
                    .then((data) => {

                        var response = JSON.parse(data);

                        self.log("Turn ON: " + self.appname);
                        self.AppService.getCharacteristic(Characteristic.TargetApp).updateValue(self.appnr);
                        self.AppService.getCharacteristic(Characteristic.TargetName).updateValue(self.appname);
                        callback();

                    })
                    .catch((err) => {
                        self.log(self.name + ": " + err);
                        self.AppService.getCharacteristic(Characteristic.TargetApp).updateValue(self.appnr);
                        self.AppService.getCharacteristic(Characteristic.TargetName).updateValue(self.appname);
                        callback();
                    });

            })
            .catch((err) => {
                self.log(self.name + ": " + err);
                self.AppService.getCharacteristic(Characteristic.TargetApp).updateValue(self.appnr);
                self.AppService.getCharacteristic(Characteristic.TargetName).updateValue(self.appname);
            });

    }

}

module.exports = APPS
