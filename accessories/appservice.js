var rp = require("request-promise");

var HK_TYPES = require("../src/HomeKitTypes.js");
var HK_REQS = require('../src/Requests.js');

var Accessory, Service, Characteristic;

class APP_ACCESSORY {

    constructor(log, config, api) {

        Accessory = api.platformAccessory;
        Service = api.hap.Service;
        Characteristic = api.hap.Characteristic;

        var platform = this;

        this.log = log;
        this.name = config.name + " Apps";
        this.psk = config.psk;
        this.ipadress = config.ipadress;
        this.mac = config.mac;
        this.polling = config.polling;
        this.interval = config.interval;
        this.maxApps = config.maxApps;

        HK_TYPES.registerWith(api);

        this.get = new HK_REQS(platform.psk, platform.ipadress, platform.uri, {
            "token": process.argv[2]
        }, platform.homeapp);

    }

    getServices() {

        var accessory = this;

        this.informationService = new Service.AccessoryInformation();
        this.informationService.setCharacteristic(Characteristic.Manufacturer, "Sony Bravia Apps");
        this.informationService.setCharacteristic(Characteristic.Model, "Sony Bravia Model");

        this.AppService = new Service.AppService(this.name);

        this.AppService.addCharacteristic(Characteristic.TargetApp);
        this.AppService.getCharacteristic(Characteristic.TargetApp)
            .setProps({
                maxValue: accessory.maxApps,
                minValue: 0,
                minStep: 1
            })
            .on("get", this.getTargetApp.bind(this))
            .on("set", this.setTargetApp.bind(this));

        if (this.polling) {
            (function poll() {
                setTimeout(function() {
                    accessory.AppService.getCharacteristic(Characteristic.TargetApp).getValue();
                    poll()
                }, 15000)
            })();
        }

        this.AppService.addCharacteristic(Characteristic.TargetName);
        this.AppService.getCharacteristic(Characteristic.TargetName)
            .on("get", this.getTargetAppName.bind(this));

        (function poll() {
            setTimeout(function() {
                accessory.AppService.getCharacteristic(Characteristic.TargetName).getValue();
                poll()
            }, accessory.interval)
        })();

        accessory.get.apps()
            .then(response => {

                var name = response.result[0];
                var apps = response.result[0].length;


                accessory.log("Following, a list of all installed Apps on the TV. Have fun.");
                for (var i = 0; i < apps; i++) {
                    accessory.log("App: " + name[i].title + " - Number: " + i);
                }

            })
            .catch(err => {
                if (err.message.match("ETIMEDOUT") || err.message.match("EHOSTUNREACH")) {
                    accessory.log("Apps: No connection - Trying to reconnect...");
                } else {
                    accessory.log("Could not retrieve app list, Error: " + err)
                }
            });

        return [this.informationService, this.AppService];
    }

    getTargetApp(callback) {

        var self = this;
        var tarValue = self.AppService.getCharacteristic(Characteristic.TargetApp).value;

        if (tarValue != null || tarValue != undefined || tarValue != "") {
            callback(false, tarValue)
        } else {
            callback(false, 0)
        }

    }

    getTargetAppName(callback) {

        var self = this;
        var tarValue = self.AppService.getCharacteristic(Characteristic.TargetApp).value;

        self.appName = "";

        self.get.apps()
            .then(response => {

                var name = response.result[0];
                var apps = response.result[0].length;

                for (var i = 0; i <= apps; i++) {

                    switch (i) {
                        case tarValue:
                            self.appName = name[i].title
                            break;
                    }

                }
                callback(false, self.appName)

            })
            .catch(err => {
                if (err.message.match("ETIMEDOUT") || err.message.match("EHOSTUNREACH")) {
                    self.log("Apps: No connection - Trying to reconnect...");
                    callback(false, "CONNECTION ISSUES")
                } else {
                    self.log("Could not retrieve app name - Trying again... Error: " + err)
                    callback(false, "ERROR")
                }
            });



    }

    setTargetApp(value, callback) {

        var self = this;

        self.appName = "";
        self.appUri = "";

        self.get.apps()
            .then(response => {

                var name = response.result[0];
                var apps = response.result[0].length;

                for (var i = 0; i <= apps; i++) {

                    switch (i) {
                        case value:
                            self.appName = name[i].title
                            self.appUri = name[i].uri
                            break;
                    }

                }

                var HomeAPP = {

                    token: null,

                    setHomeAPP: function() {
                        return rp({

                            "method": "POST",
                            "uri": "http://" + self.ipadress + "/sony/appControl",
                            "body": {
                                "method": "setActiveApp",
                                "params": [{
                                    "uri": self.appUri
                                }],
                                "id": 1,
                                "version": "1.0"
                            },
                            "headers": {
                                "X-Auth-PSK": self.psk
                            },
                            "json": true

                        });
                    }
                }

                var reqHomeAPP = function(params) {
                    HomeAPP.token = params.token;
                    return HomeAPP.setHomeAPP();
                }

                reqHomeAPP({
                        "token": process.argv[2]
                    })
                    .then(response => {

                        self.log("Activate: " + self.appName);
                        callback()

                    })
                    .catch(err => {
                        if (err.message.match("ETIMEDOUT") || err.message.match("EHOSTUNREACH")) {
                            self.log("Apps: No connection - Trying to reconnect...");
                            callback()
                        } else {
                            self.log("Could not set Home App - Trying again... Error: " + err)
                            callback()
                        }
                    });


            })
            .catch(err => {
                if (err.message.match("ETIMEDOUT") || err.message.match("EHOSTUNREACH")) {
                    self.log("Apps: No connection - Trying to reconnect...");
                    callback()
                } else {
                    self.log("Could not retrieve apps - Trying again... Error: " + err)
                    callback()
                }
            });
    }

}

module.exports = APP_ACCESSORY
