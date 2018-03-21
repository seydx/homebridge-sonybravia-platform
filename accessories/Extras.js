var http = require("http");

var Accessory,
    Service,
    Characteristic;

class EXTRAINPUTS {

    constructor(log, config, api) {

        Accessory = api.platformAccessory;
        Service = api.hap.Service;
        Characteristic = api.hap.Characteristic;

        var platform = this;

        this.log = log;
        this.extraname = config.extraname
        this.name = config.name + " " + this.extraname;
        this.psk = config.psk;
        this.ipadress = config.ipadress;
        this.interval = config.interval;
        this.uri = config.uri;
        this.homeapp = config.homeapp;
        this.port = config.port;
        this.setOnCount = 0;
        this.setOffCount = 0;
        this.getCount = 0;

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

        var accessory = this;

        this.informationService = new Service.AccessoryInformation()
            .setCharacteristic(Characteristic.Name, this.name)
            .setCharacteristic(Characteristic.Identify, this.name)
            .setCharacteristic(Characteristic.Manufacturer, 'Sony')
            .setCharacteristic(Characteristic.Model, 'Extra Input Control')
            .setCharacteristic(Characteristic.SerialNumber, "Sony-Extra-Inputs")
            .setCharacteristic(Characteristic.FirmwareRevision, require('../package.json').version);

        this.ExtraSourceSwitch = new Service.Switch(this.name);

        this.ExtraSourceSwitch.getCharacteristic(Characteristic.On)
            .updateValue(self.state)
            .on('set', this.setExtraSourceSwitch.bind(this));

        this.getStates();

        return [this.informationService, this.ExtraSourceSwitch];
    }

    getStates() {

        var self = this;

        self.getContent("/sony/avContent", "getPlayingContentInfo", "1.0", "1.0")
            .then((data) => {

                var response = JSON.parse(data);

                if ("result" in response) {

                    if (response.result[0].uri == self.uri) {
                        self.state = true;
                    } else {
                        self.state = false;
                    }

                } else {
                    self.state = false;
                }

                self.ExtraSourceSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                self.getCount = 0;
                setTimeout(function() {
                    self.getStates();
                }, self.interval)

            })
            .catch((err) => {
                self.ExtraSourceSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                if (self.getCount > 5) {
                    self.log(self.name + ": " + err);
                }
                setTimeout(function() {
                    self.getCount += 1;
                    self.getStates();
                }, 60000)
            });

    }

    setExtraSourceSwitch(state, callback) {

        var self = this;
        if (state) {

            self.getContent("/sony/avContent", "setPlayContent", {
                    "uri": self.uri
                }, "1.0")
                .then((data) => {

                    var response = JSON.parse(data);

                    if ("error" in response) {

                        self.getContent("/sony/system", "setPowerStatus", {
                                "status": true
                            }, "1.0")
                            .then((data) => {

                                self.log("Turning on the TV...");
                                self.state = true;
                                this.ExtraSourceSwitch.getCharacteristic(Characteristic.On).setValue(self.state);

                            })
                            .catch((err) => {
                                self.log(self.name + ": " + err);
                                self.state = false;
                                self.ExtraSourceSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                                callback(null, self.state)
                            });

                    } else {
                        self.log("Turn ON: " + self.name);
                        self.state = true;
                    }

                    self.ExtraSourceSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    self.setOnCount = 0;
                    callback(null, self.state)

                })
                .catch((err) => {
                    if (self.setOnCount <= 5) {
                        self.state = true;
                        setTimeout(function() {
                            self.setOnCount += 1;
                            self.ExtraSourceSwitch.getCharacteristic(Characteristic.On).setValue(self.state);
                        }, 3000￼)
                        callback(null, self.state)
                    } else {
                        self.state = false;
                        self.log("Can't set " + self.name + " on! " + err)
                        callback(null, self.state)
                    }
                });

        } else {

            self.getContent("/sony/appControl", "setActiveApp", {
                    "uri": self.homeapp
                }, "1.0")
                .then((data) => {

                    var response = JSON.parse(data);

                    if ("error" in response) {
                        self.log("TV OFF");
                        self.state = false;
                    } else {
                        self.log("Switch to Home App")
                        self.state = false;
                    }

                    self.ExtraSourceSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    self.setOffCount = 0;
                    callback(null, self.state)

                })
                .catch((err) => {
                    if (self.setOffCount <= 5) {
                        self.state = false;
                        setTimeout(function() {
                            self.setOffCount += 1;
                            self.ExtraSourceSwitch.getCharacteristic(Characteristic.On).setValue(self.state);
                        }, 3000￼)
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

module.exports = EXTRAINPUTS
