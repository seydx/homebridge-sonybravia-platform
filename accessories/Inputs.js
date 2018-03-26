var http = require("http");

var Accessory,
    Service,
    Characteristic;

class INPUTS {

    constructor(log, config, api) {

        Accessory = api.platformAccessory;
        Service = api.hap.Service;
        Characteristic = api.hap.Characteristic;

        var platform = this;

        this.log = log;
        this.name = config.name;
        this.title = config.title;
        this.uri = config.uri;
        this.meta = config.meta;
        this.ipadress = config.ipadress;
        this.port = config.port;
        this.psk = config.psk;
        this.interval = config.interval;
        this.homeapp = config.homeapp;

        this.setOnCount = 0;
        this.setOffCount = 0;
        this.getCount = 0;

        !this.state ? this.state = false : this.state;

        if (this.meta == "meta:playbackdevice") {

            if (this.uri.match("logicalAddr")) {
                var port = this.uri.split("port=")[1].split("&logicalAddr=")[0];
            } else {
                var port = this.uri.split("port=")[1];
            }

            //this.logaddr = this.uri.split("port=")[1].split("&logicalAddr=")[1];
            this.simpleuri = "extInput:hdmi?port=" + port;

        } else {

            this.simpleuri = this.uri;

        }

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
            .setCharacteristic(Characteristic.Model, 'Input Control')
            .setCharacteristic(Characteristic.SerialNumber, "Sony-Inputs")
            .setCharacteristic(Characteristic.FirmwareRevision, require('../package.json').version);

        this.SourceSwitch = new Service.Switch(this.name);

        this.SourceSwitch.getCharacteristic(Characteristic.On)
            .updateValue(this.state)
            .on('set', this.setSourceSwitch.bind(this));

        this.getStates();

        return [this.informationService, this.SourceSwitch];
    }

    getStates() {

        var self = this;

        self.getContent("/sony/avContent", "getPlayingContentInfo", "1.0", "1.0")
            .then((data) => {

                var response = JSON.parse(data);

                if ("result" in response) {

                    if (response.result[0].uri == self.uri || response.result[0].uri == self.simpleuri) {
                        self.state = true;
                    } else {
                        self.state = false;
                    }

                } else {
                    self.state = false;
                }

                self.SourceSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                self.getCount = 0;
                setTimeout(function() {
                    self.getStates();
                }, self.interval)

            })
            .catch((err) => {
                self.SourceSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                if (self.getCount > 5) {
                    self.log(self.name + ": " + err);
                }
                setTimeout(function() {
                    self.getCount += 1;
                    self.getStates();
                }, 60000)
            });

    }

    setSourceSwitch(state, callback) {

        var self = this;

        if (state) {

            self.getContent("/sony/avContent", "setPlayContent", {
                    "uri": self.uri
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
                                        this.SourceSwitch.getCharacteristic(Characteristic.On).setValue(self.state);
                                    }, 2000)

                                })
                                .catch((err) => {
                                    self.log(self.name + ": " + err + " Try setting again...");
                                    self.state = true;
                                    this.SourceSwitch.getCharacteristic(Characteristic.On).setValue(self.state);
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
                        self.setOnCount = 0;
                        self.log("Turn ON: " + self.name);
                        self.state = true;
                    }

                    self.SourceSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    callback(null, self.state)

                })
                .catch((err) => {
                    if (self.setOnCount <= 5) {
                        self.state = true;
                        setTimeout(function() {
                            self.setOnCount += 1;
                            self.SourceSwitch.getCharacteristic(Characteristic.On).setValue(self.state);
                        }, 3000)
                        callback(null, self.state)
                    } else {
                        self.state = false;
                        self.log("Can't set " + self.name + " on! " + err)
                        self.setOnCount = 0
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
                        if (response.error[0] == 7 || response.error[0] == 40005) {
                            self.log("TV OFF");
                            self.state = false;
                        } else if (response.error[0] == 3 || response.error[0] == 5) {
                            self.log("Illegal argument!");
                            self.state = true;
                        } else {
                            self.log("ERROR: " + JSON.stringify(response));
                            self.state = true;
                        }
                    } else {
                        self.log("Switch to Home App")
                        self.state = false;
                    }

                    self.SourceSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    self.setOffCount = 0;
                    callback(null, self.state)

                })
                .catch((err) => {
                    if (self.setOffCount <= 5) {
                        self.state = false;
                        setTimeout(function() {
                            self.setOffCount += 1;
                            self.SourceSwitch.getCharacteristic(Characteristic.On).setValue(self.state);
                        }, 3000)
                        callback(null, self.state)
                    } else {
                        self.state = true;
                        self.log("Can't set " + self.name + " off! " + err)
                        self.setOffCount = 0
                        callback(null, self.state)
                    }
                });

        }
    }
}

module.exports = INPUTS
