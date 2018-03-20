var http = require("http");

var Accessory,
    Service,
    Characteristic;

class TVSWITCH {

    constructor(log, config, api) {

        Accessory = api.platformAccessory;
        Service = api.hap.Service;
        Characteristic = api.hap.Characteristic;

        var platform = this;

        this.log = log;
        this.name = config.name + " Power";
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
            .setCharacteristic(Characteristic.Model, 'Power Switch')
            .setCharacteristic(Characteristic.SerialNumber, "Sony-Power")
            .setCharacteristic(Characteristic.FirmwareRevision, require('../package.json').version);

        this.TVSwitch = new Service.Switch(this.name);

        this.TVSwitch.getCharacteristic(Characteristic.On)
            .updateValue(this.state)
            .on('set', this.setTVSwitch.bind(this));

        this.getStates();

        return [this.informationService, this.TVSwitch];
    }

    getStates() {

        var self = this;

        self.getContent("/sony/system", "getPowerStatus", "1.0", "1.0")
            .then((data) => {

                var response = JSON.parse(data);
                var currentPower = response.result[0].status;

                if (currentPower == "active") {
                    self.state = true;
                } else if (currentPower == "standby") {
                    self.state = false;
                } else {
                    self.log("Could not determine TV status!")
                    self.state = false;
                }

                self.TVSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                setTimeout(function() {
                    self.getStates();
                }, self.interval)

            })
            .catch((err) => {
                self.log(self.name + ": " + err + " - Trying again");
                self.TVSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                setTimeout(function() {
                    self.getStates();
                }, 60000)
            });

    }

    setTVSwitch(state, callback) {

        var self = this;

        if (state) {

            self.getContent("/sony/system", "setPowerStatus", {
                    "status": true
                }, "1.0")
                .then((data) => {

                    var response = JSON.parse(data);

                    self.log("Turning on the TV");
                    self.state = true;
                    self.TVSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    callback(null, self.state)

                })
                .catch((err) => {
                    self.log(self.name + ": " + err);
                    self.state = false;
                    self.TVSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    callback(null, self.state)
                });

        } else {

            self.getContent("/sony/system", "setPowerStatus", {
                    "status": false
                }, "1.0")
                .then((data) => {

                    var response = JSON.parse(data);

                    self.log("Turning off the TV");
                    self.state = false;
                    self.TVSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    callback(null, self.state)

                })
                .catch((err) => {
                    self.log(self.name + ": " + err);
                    self.state = true;
                    self.TVSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    callback(null, self.state)
                });

        }
    }

}

module.exports = TVSWITCH
