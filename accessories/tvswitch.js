var rp = require("request-promise");

var HK_REQS = require('../src/Requests.js');

var Accessory, Service, Characteristic;

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
        this.mac = config.mac;
        this.polling = config.polling;
        this.interval = config.interval;
        this.uri = config.uri;
        this.homeapp = config.homeapp;

    }

    getServices() {

        var accessory = this;

        this.informationService = new Service.AccessoryInformation()
            .setCharacteristic(Characteristic.Manufacturer, 'Sony')
            .setCharacteristic(Characteristic.Model, 'Sony Bravia TV')
            .setCharacteristic(Characteristic.SerialNumber, 'Bravia Serial Number');

        this.TVSwitch = new Service.Switch(this.name);

        this.TVSwitch.getCharacteristic(Characteristic.On)
            .on('get', this.getTVSwitch.bind(this))
            .on('set', this.setTVSwitch.bind(this));

        this.get = new HK_REQS(accessory.psk, accessory.ipadress, accessory.uri, {
            "token": process.argv[2]
        }, accessory.homeapp);

        if (this.polling) {
            (function poll() {
                setTimeout(function() {
                    accessory.TVSwitch.getCharacteristic(Characteristic.On).getValue();
                    poll()
                }, accessory.interval)
            })();
        }

        return [this.informationService, this.TVSwitch];
    }

    getTVSwitch(callback) {

        var self = this;

        self.get.powerstate()
            .then(response => {

                var currentPower = response.result[0].status;

                if (currentPower == "active") {
                    callback(null, true)
                } else if (currentPower == "standby") {
                    callback(null, false)
                } else {
                    self.log("Could not determine TV status!")
                    callback(null, false)
                }

            })
            .catch(err => {
                self.log("Could not retrieve TV status: " + err);
                callback(null, false)
            });

    }

    setTVSwitch(state, callback) {

        var self = this;

        if (state) {

            // TURN ON
            if (self.mac) {

                var wol = require('wake_on_lan');

                wol.wake(self.mac, function(error) {
                    if (error) {
                        self.log("Can't turn on the TV with the given MAC adress! Delete the MAC adress from config.json and try only with the IP adress!");
                        callback(null, false)
                    } else {
                        self.log("Magic packets send to " + self.mac + " - If TV stay off, please delete MAC from config.json!");
                        callback(null, true)
                    }
                });

            } else {

                self.get.poweron()
                    .then(response => {

                        self.log("Turning on the TV");
                        callback(null, true)

                    })
                    .catch(err => {
                        self.log("Could not set TV on (status code %s): %s", response.statusCode, err);
                        callback(null, false)
                    });

            }

        } else {
            // TURN OFF
            self.get.poweroff()
                .then(response => {

                    self.log("Turning off the TV");
                    callback(null, false)

                })
                .catch(err => {
                    self.log("Could not set TV off (status code %s): %s", response.statusCode, err);
                    callback(null, false)
                });
        }
    }

}

module.exports = TVSWITCH
