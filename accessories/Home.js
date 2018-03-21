var http = require("http");

var Accessory,
    Service,
    Characteristic;

class HOMEAPP {

    constructor(log, config, api) {

        Accessory = api.platformAccessory;
        Service = api.hap.Service;
        Characteristic = api.hap.Characteristic;

        var platform = this;

        this.log = log;
        this.name = config.name + " Home";
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

        var self = this;

        this.informationService = new Service.AccessoryInformation()
            .setCharacteristic(Characteristic.Name, this.name)
            .setCharacteristic(Characteristic.Identify, this.name)
            .setCharacteristic(Characteristic.Manufacturer, 'Sony')
            .setCharacteristic(Characteristic.Model, 'Home Switch')
            .setCharacteristic(Characteristic.SerialNumber, "Sony-Home")
            .setCharacteristic(Characteristic.FirmwareRevision, require('../package.json').version);

        this.HomeSwitch = new Service.Switch(this.name);

        this.HomeSwitch.getCharacteristic(Characteristic.On)
            .updateValue(this.state)
            .on('set', this.setHomeSwitch.bind(this));

        this.getStates();

        return [this.informationService, this.HomeSwitch];
    }

    getStates() {

        var self = this;

        self.getContent("/sony/avContent", "getPlayingContentInfo", "1.0", "1.0")
            .then((data) => {

                var response = JSON.parse(data);

                if ("error" in response) {
                    if (response.error[0] === 7) {
                        self.state = true;
                    } else {
                        self.state = false;
                    }
                } else {
                    self.state = false;
                }

                self.HomeSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                self.getCount = 0;
                setTimeout(function() {
                    self.getStates();
                }, self.interval)

            })
            .catch((err) => {
                self.HomeSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                if (self.getCount > 5) {
                    self.log(self.name + ": " + err);
                }
                setTimeout(function() {
                    self.getCount += 1;
                    self.getStates();
                }, 60000￼)
            });

    }

    setHomeSwitch(state, callback) {

        var self = this;

        if (state) {

            self.getContent("/sony/appControl", "setActiveApp", {
                    "uri": self.homeapp
                }, "1.0")
                .then((data) => {

                    var response = JSON.parse(data);

                    self.log("Turn ON: " + self.name);
                    self.state = true;
                    self.setOnCount = 0;
                    self.HomeSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    callback(null, self.state)

                })
                .catch((err) => {
                    if (self.setOnCount <= 5) {
                        self.state = true;
                        setTimeout(function() {
                            self.setOnCount += 1;
                            self.HomeSwitch.getCharacteristic(Characteristic.On).setValue(self.state);
                        }, 3000￼)
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

                    self.log("Turn OFF: " + self.name);
                    self.state = false;
                    self.setOffCount = 0;
                    self.HomeSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    callback(null, self.state)

                })
                .catch((err) => {
                    if (self.setOffCount <= 5) {
                        self.state = false;
                        setTimeout(function() {
                            self.setOffCount += 1;
                            self.HomeSwitch.getCharacteristic(Characteristic.On).setValue(self.state);
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

module.exports = HOMEAPP
