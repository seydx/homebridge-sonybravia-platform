var http = require("http");

var Accessory,
    Service,
    Characteristic;

class SOURCES {

    constructor(log, config, api) {

        Accessory = api.platformAccessory;
        Service = api.hap.Service;
        Characteristic = api.hap.Characteristic;

        var platform = this;

        this.log = log;
        this.hdminame = config.hdminame
        this.name = config.name + " " + this.hdminame;
        this.psk = config.psk;
        this.ipadress = config.ipadress;
        this.interval = config.interval;
        this.uri = config.uri;
        this.homeapp = config.homeapp;
        this.hdmiuri = config.uri;
        this.formatname = config.hdminame.split("/")[0];

        !this.state ? this.state = false : this.state;

        if (config.cecname) {
            this.cecport = config.cecport;
            this.ceclogaddr = config.ceclogaddr;

            this.cecname = config.cecname;
            this.name = config.name + " " + config.cecname;
            this.formatname = config.cecname.split("/")[0];
            this.hdminame = "HDMI " + config.cecport;

            this.hdmiuri = "extInput:hdmi?port=" + config.cecport;
            this.cecuri = config.cecuri;
            this.uri = config.cecuri;
        }

        this.getContent = function(setPath, setMethod, setParams, setVersion) {

            return new Promise((resolve, reject) => {

                var options = {
                    host: platform.ipadress,
                    port: 80,
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
            .setCharacteristic(Characteristic.Model, 'Input Control')
            .setCharacteristic(Characteristic.SerialNumber, "Sony-Inputs")
            .setCharacteristic(Characteristic.FirmwareRevision, require('../package.json').version);

        this.SourceSwitch = new Service.Switch(this.name);

        this.SourceSwitch.getCharacteristic(Characteristic.On)
            .updateValue(self.state)
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

                    if (response.result[0].uri == self.hdmiuri || response.result[0].uri == self.cecuri) {
                        self.state = true;
                    } else {
                        self.state = false;
                    }

                } else {
                    self.state = false;
                }

                self.SourceSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                setTimeout(function() {
                    self.getStates();
                }, self.interval)

            })
            .catch((err) => {
                self.log(self.name + ": " + err + " - Trying again");
                self.SourceSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                setTimeout(function() {
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

                        self.getContent("/sony/system", "setPowerStatus", {
                                "status": true
                            }, "1.0")
                            .then((data) => {

                                self.log("Turning on the TV...");
                                self.state = true;
                                this.SourceSwitch.getCharacteristic(Characteristic.On).setValue(self.state);

                            })
                            .catch((err) => {
                                self.log(self.name + ": " + err);
                                self.state = false;
                                self.TVSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                                callback(null, self.state)
                            });

                    } else {
                        self.log("Turn ON: " + self.name);
                        self.state = true;
                    }

                    self.SourceSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    callback(null, self.state)

                })
                .catch((err) => {
                    self.log(self.name + ": " + err);
                    self.state = false;
                    self.SourceSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    callback(null, self.state)
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

                    self.SourceSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    callback(null, self.state)

                })
                .catch((err) => {
                    self.log(self.name + ": " + err);
                    self.state = true;
                    self.SourceSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    callback(null, self.state)
                });

        }
    }
}

module.exports = SOURCES
