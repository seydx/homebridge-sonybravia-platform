var rp = require("request-promise");

var HK_TYPES = require("../src/HomeKitTypes.js");
var HK_REQS = require('../src/Requests.js');

var Accessory, Service, Characteristic;

class VOLUME {

    constructor(log, config, api) {

        Accessory = api.platformAccessory;
        Service = api.hap.Service;
        Characteristic = api.hap.Characteristic;

        var platform = this;

        this.log = log;
        this.name = config.name + " Volume";
        this.psk = config.psk;
        this.ipadress = config.ipadress;
        this.mac = config.mac;
        this.polling = config.polling;
        this.interval = config.interval;
        this.maxVolume = config.maxVolume;

        HK_TYPES.registerWith(api);

        this.get = new HK_REQS(platform.psk, platform.ipadress, platform.uri, {
            "token": process.argv[2]
        });
    }

    getServices() {

        var accessory = this;

        this.informationService = new Service.AccessoryInformation();
        this.informationService.setCharacteristic(Characteristic.Manufacturer, "Sony Bravia Volume Control");
        this.informationService.setCharacteristic(Characteristic.Model, "Sony Bravia Model");

        this.VolumeBulb = new Service.Lightbulb(this.name);

        this.VolumeBulb.getCharacteristic(Characteristic.On)
            .on('get', this.getMuteState.bind(this))
            .on('set', this.setMuteState.bind(this));

        if (this.polling) {
            (function poll() {
                setTimeout(function() {
                    accessory.VolumeBulb.getCharacteristic(Characteristic.On).getValue();
                    poll()
                }, accessory.interval)
            })();
        }

        this.VolumeBulb.addCharacteristic(new Characteristic.Brightness())
            .setProps({
                maxValue: 30,
                minValue: 0,
                minStep: 1
            })
            .on('get', this.getVolume.bind(this))
            .on('set', this.setVolume.bind(this));

        this.get = new HK_REQS(accessory.psk, accessory.ipadress, accessory.uri, {
            "token": process.argv[2]
        });

        //SIMPLE POLLING

        if (this.polling) {
            (function poll() {
                setTimeout(function() {
                    accessory.VolumeBulb.getCharacteristic(Characteristic.Brightness).getValue();
                    poll()
                }, accessory.interval)
            })();
        }

        return [this.informationService, this.VolumeBulb];
    }

    getMuteState(callback) {

        var self = this;

        self.mute = false;

        self.get.powerstate()
            .then(response => {

                var currentPower = response.result[0].status;

                if (currentPower == "active") {

                    self.get.volume()
                        .then(response => {

                            var name = response.result[0];

                            for (var i = 0; i < name.length; i++) {

                                if (name[i].target.match("speaker")) {

                                    self.mute = name[i].mute == false;

                                }

                            }

                            callback(false, self.mute)

                        })
                        .catch(err => {
                            self.log("Could not retrieve mute state: " + err);
                            callback(false, false)
                        });

                } else {
                    callback(false, false)

                }

            })
            .catch(err => {
                self.log("Could not get TV status: " + err);
                callback(false, false)
            });

    }

    getVolume(callback) {

        var self = this;

        self.currentVolume = false;

        self.get.powerstate()
            .then(response => {

                var currentPower = response.result[0].status;

                if (currentPower == "active") {

                    self.get.volume()
                        .then(response => {

                            var name = response.result[0];

                            for (var i = 0; i < name.length; i++) {

                                if (name[i].target.match("speaker")) {

                                    self.currentVolume = name[i].volume;

                                }

                            }

                            callback(false, self.currentVolume)

                        })
                        .catch(err => {
                            self.log("Could not retrieve volume state: " + err);
                            callback(false, 0)
                        });

                } else {
                    callback(false, 0)

                }

            })
            .catch(err => {
                self.log("Could not get TV status: " + err);
                callback(false, 0)
            });
    }

    setMuteState(state, callback) {

        var self = this;

        if (state) {


            self.get.powerstate()
                .then(response => {

                    var currentPower = response.result[0].status;

                    if (currentPower == "active") {

                        self.get.muteon()
                            .then(response => {
                                self.log("Activate: " + self.name);
                                callback(false, true)
                            })
                            .catch(err => {
                                self.log("Could not get Volume status: " + err);
                                callback(false, false)
                            });

                    } else {

                        self.log("Could not set mute state, TV is off");
                        callback(false, false)

                    }

                })
                .catch(err => {
                    self.log("Could not get TV status: " + err);
                    callback(false, false)
                });

        } else {

            self.get.powerstate()
                .then(response => {

                    var currentPower = response.result[0].status;

                    if (currentPower == "active") {

                        self.get.muteoff()
                            .then(response => {

                                self.log("Deactivate: " + self.name);
                                callback(false, false)

                            })
                            .catch(err => {
                                self.log("Could not disable Volume: " + err);
                                callback(false, false)
                            });

                    } else {

                        self.log("Could not set mute state off, TV is off");
                        callback(false, false)

                    }

                })
                .catch(err => {
                    self.log("Could not get TV status: " + err);
                    callback(false, false)
                });

        }

    }

    setVolume(value, callback) {

        var self = this;
        var newValue = value.toString();

        self.get.powerstate()
            .then(response => {

                var currentPower = response.result[0].status;

                if (currentPower == "active") {

                    var tarVolume = {

                        token: null,

                        setTarVolume: function() {

                            return rp({

                                "method": "POST",
                                "uri": "http://" + self.ipadress + "/sony/audio",
                                "body": {
                                    "method": "setAudioVolume",
                                    "params": [{
                                        "target": "speaker",
                                        "volume": newValue
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

                    var reqTarVolume = function(params) {
                        tarVolume.token = params.token;
                        return tarVolume.setTarVolume();
                    }

                    reqTarVolume({
                            "token": process.argv[2]
                        })
                        .then(response => {

                            self.log("Setting Volume to: " + value);
                            callback();

                        })
                        .catch(err => {
                            self.log("Could not set volume: " + err)
                            callback()
                        });

                } else {

                    callback()

                }

            })
            .catch(err => {
                self.log("Could not get TV status: " + err);
                callback()
            });
    }
}

module.exports = VOLUME
