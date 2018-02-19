var rp = require("request-promise");

var HK_REQS = require('../src/Requests.js');

var Accessory, Service, Characteristic;

class EXTRAS {

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
        this.mac = config.mac;
        this.polling = config.polling;
        this.interval = config.interval;
        this.uri = config.uri;
        this.homeapp = config.homeapp;
        
        this.get = new HK_REQS(accessory.psk, accessory.ipadress, accessory.uri, {
            "token": process.argv[2]
        }, accessory.homeapp);
    }

    getServices() {

        var accessory = this;

        this.informationService = new Service.AccessoryInformation()
            .setCharacteristic(Characteristic.Manufacturer, 'Sony')
            .setCharacteristic(Characteristic.Model, 'Sony Bravia Source Control')
            .setCharacteristic(Characteristic.SerialNumber, 'Bravia Serial Number');

        this.ExtraSourceSwitch = new Service.Switch(this.name);

        this.ExtraSourceSwitch.getCharacteristic(Characteristic.On)
            .on('get', this.getExtraSourceSwitch.bind(this))
            .on('set', this.setExtraSourceSwitch.bind(this));

        //SIMPLE POLLING

        if (this.polling) {
            (function poll() {
                setTimeout(function() {
                    accessory.ExtraSourceSwitch.getCharacteristic(Characteristic.On).getValue();
                    poll()
                }, accessory.interval)
            })();
        }

        return [this.informationService, this.ExtraSourceSwitch];
    }

    _getCurrentState(callback) {

        var self = this;

        self.get.contentinfo()
            .then(response => {

                var state = JSON.stringify(response);
                callback(null, state);

            })
            .catch(err => {
                self.log("Could not retrieve status from " + self.name + ": " + err);
                callback(null, false)
            });

    }

    getExtraSourceSwitch(callback) {

        var self = this;

        self._getCurrentState(function(err, state) {

            if (err) callback(err)
            else {

                self.get.powerstate()
                    .then(response => {

                        var currentPower = response.result[0].status;

                        if (currentPower == "active") {

                            if (state.match(self.name)) {
                                callback(null, true)
                            } else {
                                callback(null, false)
                            }

                        } else if (currentPower == "standby") {
                            callback(null, false)
                        } else {
                            self.log("Could not determine TV status!")
                            callback(null, false)
                        }


                    })
                    .catch(err => {
                        self.log("Could not retrieve Extra Source Status: " + err);
                        callback(null, false)
                    });

            }
        })

    }

    setExtraSourceSwitch(state, callback) {

        var self = this;

        if (state) {

            self.get.powerstate()
                .then(response => {

                    var currentPower = response.result[0].status;

                    if (currentPower == "active") {

                        //TV ON - ACTIVATE SOURCE
                        self.get.setcontent()
                            .then(response => {

                                self.log("Activate " + self.name);
                                callback(null, true)
                            })
                            .catch(err => {
                                self.log("Could not set Extra Source on (status code %s): %s", err.statusCode, err);
                                callback(null, false)
                            });

                    } else {

                        // TURN ON
                        if (self.mac) {

                            var wol = require('wake_on_lan');

                            wol.wake(self.mac, function(error) {
                                if (error) {
                                    self.log("Can't turn on the TV with the given MAC adress! Delete the MAC adress from config.json and try only with the IP adress!");
                                    callback(null, false)
                                } else {
                                    self.log("Magic packets send to " + self.mac + " - If TV stay off, please delete MAC from config.json!");

                                    self.get.powerstate()
                                        .then(response => {

                                            var currentPower = response.result[0].status;

                                            if (currentPower == "active") {

                                                self._getCurrentState(function(err, state) {

                                                    if (state.match(self.name)) {
                                                        self.log(self.name + " already on");

                                                        callback(null, true)

                                                    } else {

                                                        self.log("Connecting to " + self.name);

                                                        function sleep(time) {
                                                            return new Promise((resolve) => setTimeout(resolve, time));
                                                        }

                                                        sleep(5000).then(() => {

                                                            self.log("Connected!");

                                                            // TV ON NOW - ACTIVATE SOURCE
                                                            self.get.setcontent()
                                                                .then(response => {

                                                                    self.log("Activate " + self.name);
                                                                    callback(null, true)
                                                                })
                                                                .catch(err => {
                                                                    self.log("Could not set Extra Source on (status code %s): %s", err.statusCode, err);
                                                                    callback(null, false)
                                                                });

                                                        });

                                                    }

                                                })

                                            } else {

                                                self.log("Could not turn on the TV!");
                                                callback(null, false)

                                            }

                                        })
                                        .catch(err => {
                                            self.log("Could not determine TV status: " + err);
                                            callback(null, false)
                                        });
                                }
                            });

                        } else {

                            self.get.poweron()
                                .then(response => {
                                    self.log("Turning on the TV");

                                    self.get.powerstate()
                                        .then(response => {

                                            var currentPower = response.result[0].status;

                                            if (currentPower == "active") {

                                                self._getCurrentState(function(err, state) {

                                                    if (state.match(self.name)) {
                                                        self.log(self.name + " already on");

                                                        callback(null, true)

                                                    } else {

                                                        self.log("Connecting to " + self.name);

                                                        function sleep(time) {
                                                            return new Promise((resolve) => setTimeout(resolve, time));
                                                        }

                                                        sleep(5000).then(() => {

                                                            self.log("Connected!");

                                                            // TV ON NOW - ACTIVATE SOURCE
                                                            self.get.setcontent()
                                                                .then(response => {

                                                                    self.log("Activate " + self.name);
                                                                    callback(null, true)
                                                                })
                                                                .catch(err => {
                                                                    self.log("Could not set Extra Source on (status code %s): %s", err.statusCode, err);
                                                                    callback(null, false)
                                                                });

                                                        });

                                                    }

                                                })

                                            } else {

                                                self.log("Could not turn on the TV!");
                                                callback(null, false)

                                            }

                                        })
                                        .catch(err => {
                                            self.log("Could not determine TV status: " + err);
                                            callback(null, false)
                                        });

                                })
                                .catch(err => {
                                    self.log("Could not set TV on (status code %s): %s", err.statusCode, err);
                                    callback(null, false)
                                });

                        }

                    }
                })
                .catch(err => {
                    self.log("Could not get TV status (status code %s): %s", err.statusCode, err);
                    callback(null, false)
                });

        } else {

            //TURN TO HOMEAPP
            self.get.sethomeapp()
                .then(response => {

                    self.log("Turn OFF: " + self.name);
                    callback(null, false)

                })
                .catch(err => {
                    self.log("Could not set Home App on (status code %s): %s", err.statusCode, err);
                    callback(null, false)
                });

        }
    }
}

module.exports = EXTRAS
