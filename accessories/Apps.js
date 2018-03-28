var http = require("http"),
    inherits = require("util").inherits;

var Accessory,
    Service,
    Characteristic;

class APPS {

    constructor(log, config, api, apps) {

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
            Characteristic.call(this, "Target App", "e2454387-a3e9-44a9-82f2-852f9628ecbc");
            this.setProps({
                format: Characteristic.Formats.STRING,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.TargetName, Characteristic);
        Characteristic.TargetName.UUID = "e2454387-a3e9-44a9-82f2-852f9628ecbc";

        Characteristic.FavouriteAppName = function() {
            Characteristic.call(this, "Home App", "a7dfed60-96ab-4b16-a265-d77ccf070a6f");
            this.setProps({
                format: Characteristic.Formats.STRING,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.FavouriteAppName, Characteristic);
        Characteristic.FavouriteAppName.UUID = "a7dfed60-96ab-4b16-a265-d77ccf070a6f";

        Characteristic.AppList = function() {
            Characteristic.call(this, "Applist", "d02e8466-323b-4773-b771-e7bfdc479d3f");
            this.setProps({
                format: Characteristic.Formats.BOOL,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.AppList, Characteristic);
        Characteristic.AppList.UUID = "d02e8466-323b-4773-b771-e7bfdc479d3f";

        Characteristic.SaveHomeApp = function() {
            Characteristic.call(this, "Save Home App", "734d1835-662c-4ec4-b3b5-a0bfe1d76844");
            this.setProps({
                format: Characteristic.Formats.BOOL,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.SaveHomeApp, Characteristic);
        Characteristic.SaveHomeApp.UUID = "734d1835-662c-4ec4-b3b5-a0bfe1d76844";

        var platform = this;

        this.api = api;
        this.log = log;
        this.name = config.name + " Apps";
        this.psk = config.psk;
        this.ipadress = config.ipadress;
        this.interval = config.interval;
        this.maxApps = config.maxApps;
        this.port = config.port;
        this.setOnCount = 0;
        this.setOffCount = 0;
        this.setCount = 0;
        this.getCount = 0;
        //this.homeapp = config.homeapp;
        this.favappname = config.favappname;
        this.apps = apps;

        //STORAGE
        this.storage = require('node-persist');
        this.storage.initSync({
            dir: this.api.user.persistPath()
        });

        this.homeapp = config.homeapp;

        !this.appnr ? this.appnr = 0 : this.appnr;
        !this.appname ? this.appname = "" : this.appname;
        !this.state ? this.state = false : this.state;

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

        this.AppService = new Service.Switch(this.name);

        this.AppService.addCharacteristic(Characteristic.TargetApp);
        this.AppService.getCharacteristic(Characteristic.TargetApp)
            .setProps({
                maxValue: self.maxApps,
                minValue: 0,
                minStep: 1
            })
            .updateValue(self.appnr)
            .on("set", this.setTargetApp.bind(this));

        this.AppService.addCharacteristic(Characteristic.AppList);
        this.AppService.getCharacteristic(Characteristic.AppList)
            .updateValue(false)
            .on("set", this.setAppList.bind(this));

        this.AppService.addCharacteristic(Characteristic.TargetName);
        this.AppService.getCharacteristic(Characteristic.TargetName)
            .updateValue(self.appname);

        this.AppService.addCharacteristic(Characteristic.FavouriteAppName);
        this.AppService.getCharacteristic(Characteristic.FavouriteAppName)
            .updateValue(self.favappname);

        this.AppService.addCharacteristic(Characteristic.SaveHomeApp);
        this.AppService.getCharacteristic(Characteristic.SaveHomeApp)
            .updateValue(false)
            .on("set", this.setNewHomeApp.bind(this));

        this.AppService.getCharacteristic(Characteristic.On)
            .updateValue(self.state)
            .on('set', this.setHomeApp.bind(this));

        this.getStates();

        return [this.informationService, this.AppService];
    }

    getStates() {

        var self = this;
        self.appnr = self.AppService.getCharacteristic(Characteristic.TargetApp).value;

        for (var i = 0; i < self.apps.length; i++) {

            switch (i) {
                case self.appnr:
                    self.appname = self.apps[i].title;
                    self.newhomeapp = self.apps[i].uri;
                    self.newfavappname = self.apps[i].title;
                    break;
            }

            if (self.homeapp == self.apps[i].uri) {
                self.favappname = self.apps[i].title;
            }

        }

        self.AppService.getCharacteristic(Characteristic.TargetApp).updateValue(self.appnr);
        self.AppService.getCharacteristic(Characteristic.TargetName).updateValue(self.appname);
        self.AppService.getCharacteristic(Characteristic.FavouriteAppName).updateValue(self.favappname);
        self.AppService.getCharacteristic(Characteristic.SaveHomeApp).updateValue(false);

        self.getContent("/sony/avContent", "getPlayingContentInfo", "1.0", "1.0")
            .then((data) => {

                var response = JSON.parse(data);

                if ("error" in response) {
                    if (response.error[0] == 7) {
                        self.state = true;
                    } else {
                        self.state = false;
                    }
                } else {
                    self.state = false;
                }

                self.AppService.getCharacteristic(Characteristic.On).updateValue(self.state);
                self.getCount = 0;
                setTimeout(function() {
                    self.getStates();
                }, self.interval)

            })
            .catch((err) => {
                self.AppService.getCharacteristic(Characteristic.On).updateValue(self.state);
                if (self.getCount > 5) {
                    self.log(self.name + ": " + err);
                }
                setTimeout(function() {
                    self.getCount += 1;
                    self.getStates();
                }, 60000)
            });

    }

    setAppList(state, callback) {

        var self = this;

        if (state) {

            this.getContent("/sony/appControl", "getApplicationList", "1.0", "1.0")
                .then((data) => {

                    var response = JSON.parse(data);
                    self.log("Caching apps.")
                    self.storage.setItem("Sony_Apps", response)

                    if ("error" in response) {
                        if (response.error[0] == 7 || response.error[0] == 40005) {
                            self.log("TV OFF");
                        } else if (response.error[0] == 3 || response.error[0] == 5) {
                            self.log("Illegal argument!");
                        } else {
                            self.log("ERROR: " + JSON.stringify(response));
                        }
                    } else {

                        var name = response.result[0];

                        self.log("Following, a list of all installed Apps on the TV. Have fun.");
                        for (var i = 0; i < name.length; i++) {
                            self.log(i + ": " + name[i].title);
                        }

                    }

                    setTimeout(function(){self.AppService.getCharacteristic(Characteristic.AppList).updateValue(false);},500);
                    callback()

                })
                .catch((err) => {
                    self.log("Can't show Application list! " + err + ". Try again...");
                    setTimeout(function(){self.AppService.getCharacteristic(Characteristic.AppList).updateValue(false);},500);
                    callback()
                });

        } else {

            callback()

        }

    }

    setNewHomeApp(state, callback)  {

        var self = this;

        if (state) {
            self.storage.setItem("Sony_HomeApp", self.newhomeapp);
            self.homeapp = self.newhomeapp;
            self.favappname = self.newfavappname;
            self.log(self.newfavappname + " was saved as new Home App!");
            //self.AppService.getCharacteristic(Characteristic.FavouriteAppName).updateValue(self.favappname);
            self.AppService.getCharacteristic(Characteristic.SaveHomeApp).setValue(false);
            callback()
        } else {
            //self.log("Resetting switch");
            callback()
        }

    }

    setTargetApp(value, callback) {

        var self = this;
        var uri;

        for (var i = 0; i <= self.apps.length; i++) {

            switch (i) {
                case value:
                    self.appname = self.apps[i].title;
                    self.appnr = value;
                    uri = self.apps[i].uri;
                    break;
            }

        }

        self.AppService.getCharacteristic(Characteristic.TargetApp).updateValue(self.appnr);
        self.AppService.getCharacteristic(Characteristic.TargetName).updateValue(self.appname);

        self.getContent("/sony/appControl", "setActiveApp", {
                "uri": uri
            }, "1.0")
            .then((data) => {

                var response = JSON.parse(data);

                if ("error" in response) {
                    if (response.error[0] == 7 || response.error[0] == 40005) {
                        self.log("TV OFF");
                    } else if (response.error[0] == 3 || response.error[0] == 5) {
                        self.log("Illegal argument!");
                    } else {
                        self.log("ERROR: " + JSON.stringify(response));
                    }
                } else {
                    self.log("Turn ON: " + self.appname);
                }

                self.setCount = 0;
                callback();

            })
            .catch((err) => {
                if (self.setCount <= 5) {
                    setTimeout(function() {
                        self.setCount += 1;
                    }, 3000)
                    callback()
                } else {
                    self.log("Can't set App! " + err)
                    callback()
                }

            });

    }

    setHomeApp(state, callback) {

        var self = this;

        if (state) {
            self.getContent("/sony/appControl", "setActiveApp", {
                    "uri": self.homeapp
                }, "1.0")
                .then((data) => {

                    var response = JSON.parse(data);

                    if ("error" in response) {
                        if (response.error[0] == 7 || response.error[0] == 40005) {
                            self.getContent("/sony/system", "setPowerStatus", {
                                    "status": true
                                }, "1.0")
                                .then((data) => {

                                    self.log("Turning on the TV...");
                                    self.state = true;
                                    setTimeout(function() {
                                        self.AppService.getCharacteristic(Characteristic.On).setValue(self.state);
                                    }, 2000)

                                })
                                .catch((err) => {
                                    self.log(self.name + ": " + err + " Try setting again...");
                                    self.state = true;
                                    self.AppService.getCharacteristic(Characteristic.On).setValue(self.state);
                                    callback(null, self.state)
                                });
                        } else if (response.error[0] == 3 || response.error[0] == 5) {
                            self.log("Illegal argument!");
                            self.state = false;
                        } else {
                            self.log("ERROR: " + JSON.stringify(response));
                            self.state = false;
                        }
                    } else {
                        self.log("Turn ON: " + self.favappname);
                        self.state = true;
                    }

                    self.setOnCount = 0;
                    self.AppService.getCharacteristic(Characteristic.On).updateValue(self.state);
                    callback(null, self.state)

                })
                .catch((err) => {
                    if (self.setOnCount <= 5) {
                        self.state = true;
                        setTimeout(function() {
                            self.setOnCount += 1;
                            self.AppService.getCharacteristic(Characteristic.On).setValue(self.state);
                        }, 3000)
                        callback(null, self.state)
                    } else {
                        self.state = false;
                        self.log("Can't set " + self.name + " on! " + err)
                        callback(null, self.state)
                    }
                });
        } else {
            self.getContent("/sony/appControl", "terminateApps", "1.0", "1.0")
                .then((data) => {

                    var response = JSON.parse(data);

                    if ("error" in response) {
                        if (response.error[0] == 7 || response.error[0] == 40005) {
                            self.log("TV OFF");
                            self.state = true;
                        } else if (response.error[0] == 3 || response.error[0] == 5) {
                            self.log("Illegal argument!");
                            self.state = true;
                        } else {
                            self.log("ERROR: " + JSON.stringify(response));
                            self.state = true;
                        }
                    } else {
                        self.log("Turn OFF: " + self.favappname);
                        self.state = false;
                    }

                    self.setOffCount = 0;
                    self.AppService.getCharacteristic(Characteristic.On).updateValue(self.state);
                    callback(null, self.state)

                })
                .catch((err) => {
                    if (self.setOffCount <= 5) {
                        self.state = false;
                        setTimeout(function() {
                            self.setOffCount += 1;
                            self.AppService.getCharacteristic(Characteristic.On).setValue(self.state);
                        }, 3000)
                        callback(null, self.state)
                    } else {
                        self.state = true;
                        self.log("Can't set " + self.name + " off! " + err)
                        callback(null, self.state)
                    }
                });
        }

    }

}

module.exports = APPS
