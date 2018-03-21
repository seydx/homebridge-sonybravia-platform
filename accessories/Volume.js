var http = require("http");

var Accessory,
    Service,
    Characteristic;

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
        this.interval = config.interval;
        this.maxVolume = config.maxVolume;
        this.port = config.port;
        this.setOnCount = 0;
        this.setOffCount = 0;
        this.getCount = 0;

        !this.state ? this.state = false : this.state;
        !this.volume ? this.volume = 0 : this.volume;

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

                req.on('error', (err) => reject(err));

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
            .setCharacteristic(Characteristic.Model, 'Volume Control')
            .setCharacteristic(Characteristic.SerialNumber, "Sony-Volume")
            .setCharacteristic(Characteristic.FirmwareRevision, require('../package.json').version);

        this.VolumeBulb = new Service.Lightbulb(this.name);

        this.VolumeBulb.getCharacteristic(Characteristic.On)
            .updateValue(self.state)
            .on('set', this.setMuteState.bind(this));

        this.VolumeBulb.addCharacteristic(new Characteristic.Brightness())
            .setProps({
                maxValue: self.maxVolume,
                minValue: 0,
                minStep: 1
            })
            .updateValue(self.volume)
            .on('set', this.setVolume.bind(this));

        this.getStates();

        return [this.informationService, this.VolumeBulb];
    }

    getStates() {

        var self = this;

        self.getContent("/sony/audio", "getVolumeInformation", "1.0", "1.0")
            .then((data) => {

                var response = JSON.parse(data);

                if ("result" in response) {

                    var name = response.result[0];

                    for (var i = 0; i < name.length; i++) {

                        if (name[i].target.match("speaker")) {

                            self.state = name[i].mute == false;
                            self.volume = name[i].volume;

                        }

                    }

                } else {
                    self.state = false;
                    self.volume = 0;
                }

                self.VolumeBulb.getCharacteristic(Characteristic.On).updateValue(self.state);
                self.VolumeBulb.getCharacteristic(Characteristic.Brightness).updateValue(self.volume);
                self.getCount = 0;
                setTimeout(function() {
                    self.getStates();
                }, self.interval)

            })
            .catch((err) => {
                self.VolumeBulb.getCharacteristic(Characteristic.On).updateValue(self.state);
                self.VolumeBulb.getCharacteristic(Characteristic.Brightness).updateValue(self.volume);
                if (self.getCount > 5) {
                    self.log(self.name + ": " + err);
                }
                setTimeout(function() {
                    self.getCount += 1;
                    self.getStates();
                }, 60000￼)
            });

    }

    setMuteState(state, callback) {

        var self = this;

        if (state) {

            self.getContent("/sony/audio", "setAudioMute", {
                    "status": false
                }, "1.0")
                .then((data) => {

                    var response = JSON.parse(data);

                    if ("error" in response) {
                        self.log("Could not set mute state, TV seems to be off");
                        self.state = false;
                    } else {
                        //self.log("Turn ON: " + self.name);
                        self.state = true;
                    }

                    self.VolumeBulb.getCharacteristic(Characteristic.On).updateValue(self.state);
                    self.setOnCount = 0;
                    callback(null, self.state)

                })
                .catch((err) => {
                    if (self.setOnCount <= 5) {
                        self.state = true;
                        setTimeout(function() {
                            self.setOnCount += 1;
                            self.VolumeBulb.getCharacteristic(Characteristic.On).setValue(self.state);
                        }, 3000￼)
                        callback(null, self.state)
                    } else {
                        self.state = false;
                        self.log("Can't set " + self.name + " on! " + err)
                        callback(null, self.state)
                    }
                });

        } else {

            self.getContent("/sony/audio", "setAudioMute", {
                    "status": true
                }, "1.0")
                .then((data) => {

                    var response = JSON.parse(data);

                    if ("error" in response) {
                        self.log("Could not set mute state, TV seems to be off");
                        self.state = false;
                    } else {
                        //self.log("Turn OFF: " + self.name);
                        self.state = false;
                    }

                    self.VolumeBulb.getCharacteristic(Characteristic.On).updateValue(self.state);
                    self.setOffCount = 0;
                    callback(null, self.state)

                })
                .catch((err) => {
                    if (self.setOffCount <= 5) {
                        self.state = false;
                        setTimeout(function() {
                            self.setOffCount += 1;
                            self.VolumeBulb.getCharacteristic(Characteristic.On).setValue(self.state);
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

    setVolume(value, callback) {

        var self = this;
        var newValue = value.toString();

        self.getContent("/sony/audio", "setAudioVolume", {
                "target": "speaker",
                "volume": newValue
            }, "1.0")
            .then((data) => {

                var response = JSON.parse(data);

                if ("error" in response) {
                    self.log("Could not change volume, TV seems to be off");
                    self.volume = 0;
                } else {
                    self.log("Volume: " + value);
                    self.volume = value;
                }

                self.VolumeBulb.getCharacteristic(Characteristic.Brightness).updateValue(self.volume);
                callback(null, self.volume)

            })
            .catch((err) => {
                self.log(self.name + ": " + err);
                self.VolumeBulb.getCharacteristic(Characteristic.Brightness).updateValue(self.volume);
                callback(null, self.volume)
            });

    }
}

module.exports = VOLUME
