var http = require("http");

var Accessory,
    Service,
    Characteristic;

class HOME_APP {

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

        !this.state ? this.state = false : this.state;

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
                setTimeout(function() {
                    self.getStates();
                }, self.interval)

            })
            .catch((err) => {
                self.log(self.name + ": " + err + " - Trying again");
                self.HomeSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                setTimeout(function() {
                    self.getStates();
                }, 60000)
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
                    self.HomeSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    callback(null, self.state)

                })
                .catch((err) => {
                    self.log(self.name + ": " + err);
                    self.state = false;
                    self.HomeSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    callback(null, self.state)
                });

        } else {

            self.getContent("/sony/appControl", "terminateApps", "1.0", "1.0")
                .then((data) => {

                    var response = JSON.parse(data);

                    self.log("Turn OFF: " + self.name);
                    self.state = false;
                    self.HomeSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    callback(null, self.state)

                })
                .catch((err) => {
                    self.log(self.name + ": " + err);
                    self.state = true;
                    self.HomeSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    callback(null, self.state)
                });

        }
    }
}

module.exports = HOME_APP
