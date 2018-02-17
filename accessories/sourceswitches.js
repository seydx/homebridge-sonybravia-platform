var rp = require("request-promise");

var HK_REQS = require('../src/Requests.js');

var Accessory, Service, Characteristic;

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
        this.polling = config.polling;
        this.interval = config.interval;
        this.uri = config.uri;
        this.homeapp = config.homeapp;
        this.cecname = config.cecname;
        this.cecuri = config.cecuri;
        this.cecport = config.cecport;
        this.logaddr = config.logaddr;

        if (this.cecname) {
            this.uri = this.cecuri;
            this.name = config.name + " " + this.cecname;
        }

        this.get = new HK_REQS(platform.psk, platform.ipadress, platform.uri, {
            "token": process.argv[2]
        });
    }

    getServices() {

        var accessory = this;

        this.informationService = new Service.AccessoryInformation()
            .setCharacteristic(Characteristic.Manufacturer, 'Sony')
            .setCharacteristic(Characteristic.Model, 'Sony Bravia Source Control')
            .setCharacteristic(Characteristic.SerialNumber, 'Bravia Serial Number');

        this.SourceSwitch = new Service.Switch(this.name);

        this.SourceSwitch.getCharacteristic(Characteristic.On)
            .on('get', this.getSourceSwitch.bind(this))
            .on('set', this.setSourceSwitch.bind(this));

        this.get = new HK_REQS(accessory.psk, accessory.ipadress, accessory.uri, {
            "token": process.argv[2]
        }, accessory.homeapp, accessory.cecuri);

        //SIMPLE POLLING

        if (this.polling) {
            (function poll() {
                setTimeout(function() {
                    accessory.SourceSwitch.getCharacteristic(Characteristic.On).getValue();
                    poll()
                }, accessory.interval)
            })();
        }

        return [this.informationService, this.SourceSwitch];
    }

    _getCurrentState(callback) {

        var self = this;

        var self = this;

        self.get.contentinfo()
            .then(response => {

                var state = JSON.stringify(response);
                callback(null, state);

            })
            .catch(err => {
                self.log("Could not retrieve status from " + self.name + "; error: " + err);
                callback(null, false)
            });

    }

    getSourceSwitch(callback) {

        var self = this;

        self._getCurrentState(function(err, state) {

            if (err) callback(err)
            else {

                self.get.powerstate()
                    .then(response => {

                        var currentPower = response.result[0].status;
                        var formatName = self.name.split("/")[0]

                        var newName = self.name;

                        if (self.cecname) {
                            self.name = self.cecname;
                            newName = "HDMI " + self.cecport;
                            formatName = newName.split("/")[0]
                        } else {
                            self.name = self.hdminame;
                        }

                        if (currentPower == "active") {

                            if (state.match(self.name) || state.match(formatName) || state.match(newName)) {
                                callback(null, true)
                            } else {
                                callback(null, false)
                            }

                        } else if (currentPower == "standby") {
                            callback(null, false)
                        } else {
                            self.log("Could not determine TV Status!")
                            callback(null, false)
                        }


                    })
                    .catch(err => {
                        self.log("Could not retrieve Source Status, error:" + err);
                        callback(null, false)
                    });

            }
        })

    }

    setSourceSwitch(state, callback) {

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
                                self.log("Cant set Source On (status code %s): %s", response.statusCode, err);
                                callback(null, false)
                            });

                    } else {

                        // TV IS OFF - TURN ON
                        self.get.poweron()
                            .then(response => {

                                self.log("TV is off, turning on...");

                            })
                            .catch(err => {
                                self.log("Cant set TV On (status code %s): %s", response.statusCode, err);
                                callback(null, false)
                            });

                        self._getCurrentState(function(err, state) {

                            var newName = self.name;
                            var formatName = self.name.split("/")[0]

                            if (self.cecname) {
                                var newName = "HDMI " + self.port;
                                var formatName = newName.split("/")[0]
                            }

                            if (state.match(self.name) || state.match(formatName) || state.match(newName)) {
	                            
                                self.log("TV and " + self.name + " is on!");

                                callback(null, true)

                            } else {
	                            
	                            self.log("Connecting to " + self.name);
	                            
								function sleep (time) {
								  return new Promise((resolve) => setTimeout(resolve, time));
								}
								
								sleep(3000).then(() => {
									
									self.log("Connected!");

	                                // TV ON NOW - ACTIVATE SOURCE
	                                self.get.setcontent()
	                                    .then(response => {
	
	                                        self.log("Activate " + self.name);
	                                        callback(null, true)
	                                    })
	                                    .catch(err => {
	                                        self.log("Cant set Source On (status code %s): %s", response.statusCode, err);
	                                        callback(null, false)
	                                    });
									
								});

                            }

                        })

                    }
                })
                .catch(err => {
                    self.log("Cant get TV status (status code %s): %s", response.statusCode, err);
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
                    self.log("Cant set HOMEAPP On (status code %s): %s", response.statusCode, err);
                    callback(null, false)
                });

        }
    }
}

module.exports = SOURCES