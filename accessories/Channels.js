var http = require("http"),
    inherits = require("util").inherits;

var Accessory,
    Service,
    Characteristic;

class CHANNELS {

    constructor(log, config, api) {

        Accessory = api.platformAccessory;
        Service = api.hap.Service;
        Characteristic = api.hap.Characteristic;

        Service.Channels = function(displayName, subtype) {
            Service.call(this, displayName, "9a7bf0f7-694e-4ae1-9706-95891a1bc76e", subtype);
        };
        inherits(Service.Channels, Service);
        Service.Channels.UUID = "9a7bf0f7-694e-4ae1-9706-95891a1bc76e";

        Characteristic.FavouriteChannelName = function() {
            Characteristic.call(this, "Favourite Channel", "426ad0a9-4272-4749-836d-a76c1324e566");
            this.setProps({
                format: Characteristic.Formats.STRING,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.FavouriteChannelName, Characteristic);
        Characteristic.FavouriteChannelName.UUID = "426ad0a9-4272-4749-836d-a76c1324e566";

        Characteristic.ChannelName = function() {
            Characteristic.call(this, "Target Channel", "a4352cad-842b-47c1-9ef3-0300199ec849");
            this.setProps({
                format: Characteristic.Formats.STRING,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.ChannelName, Characteristic);
        Characteristic.ChannelName.UUID = "a4352cad-842b-47c1-9ef3-0300199ec849";

        Characteristic.TargetChannel = function() {
            Characteristic.call(this, "Target Channel Nr", "b098e733-c600-4e89-a079-9625e20d5424");
            this.setProps({
                format: Characteristic.Formats.UINT8,
                unit: Characteristic.Units.NONE,
                maxValue: 999,
                minValue: 0,
                minStep: 1,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.TargetChannel, Characteristic);
        Characteristic.TargetChannel.UUID = "b098e733-c600-4e89-a079-9625e20d5424";

        var platform = this;

        this.log = log;
        this.name = config.name + " Channels";
        this.psk = config.psk;
        this.ipadress = config.ipadress;
        this.interval = config.interval;
        this.maxChannels = config.maxChannels;
        this.port = config.port;
        this.setOnCount = 0;
        this.setOffCount = 0;
        this.getCount = 0;
        this.channelSource = config.channelSource;
        this.homeapp = config.homeapp;
        this.favChannel = config.favChannel;
        this.favchannelname = config.favchannelname;

        !this.channelnr ? this.channelnr = 0 : this.channelnr;
        !this.channelname ? this.channelname = "" : this.channelname;
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
            .setCharacteristic(Characteristic.Model, 'Channel Control')
            .setCharacteristic(Characteristic.SerialNumber, "Sony-Channels")
            .setCharacteristic(Characteristic.FirmwareRevision, require('../package.json').version);

        this.Channels = new Service.Channels(this.name + " Service");
        this.ChannelSwitch = new Service.Switch(this.name);

        this.Channels.addCharacteristic(Characteristic.TargetChannel);
        this.Channels.getCharacteristic(Characteristic.TargetChannel)
            .setProps({
                maxValue: self.maxChannels,
                minValue: 0,
                minStep: 1
            })
            .updateValue(self.channelnr)
            .on('set', this.setTargetChannel.bind(this));

        this.Channels.addCharacteristic(Characteristic.ChannelName);
        this.Channels.getCharacteristic(Characteristic.ChannelName)
            .updateValue(self.channelname);

        this.Channels.addCharacteristic(Characteristic.FavouriteChannelName);
        this.Channels.getCharacteristic(Characteristic.FavouriteChannelName)
            .updateValue(self.favchannelname);

        this.ChannelSwitch.getCharacteristic(Characteristic.On)
            .updateValue(self.state)
            .on('set', this.setChannel.bind(this));

        this.getStates();

        return [this.informationService, this.Channels, this.ChannelSwitch];
    }

    getStates(minChannels) {

        var self = this;

        self.channelnr = self.Channels.getCharacteristic(Characteristic.TargetChannel).value;
        minChannels = self.channelnr;

        self.getContent("/sony/avContent", "getPlayingContentInfo", "1.0", "1.0")
            .then((data) => {

                var response = JSON.parse(data);

                if ("error" in response) {
                    self.state = false;
                } else {
                    if (response.result[0].source == "tv:dvbt" || response.result[0].source == "tv:dvbc") {
                        self.state = true;
                    }
                }

                self.ChannelSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);

            })
            .catch((err) => {
                self.ChannelSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                if (self.getCount > 5) {
                    self.log(self.name + ": " + err);
                }
                setTimeout(function() {
                    self.getCount += 1;
                    self.getStates();
                }, 60000)
            });

        self.getContent("/sony/avContent", "getContentList", {
                "source": self.channelSource,
                "stIdx": minChannels
            }, "1.2")
            .then((data) => {

                var response = JSON.parse(data);

                var name = response.result[0];

                for (var i = 0; i <= name.length; i++) {

                    switch (i) {
                        case 0:
                            self.channelname = name[0].title;
                            self.uri = name[0].uri;
                            break;
                    }

                }

                self.Channels.getCharacteristic(Characteristic.TargetChannel).updateValue(self.channelnr);
                self.Channels.getCharacteristic(Characteristic.ChannelName).updateValue(self.channelname);
                setTimeout(function() {
                    self.getStates();
                }, self.interval)

            })
            .catch((err) => {
                self.Channels.getCharacteristic(Characteristic.TargetChannel).updateValue(self.channelnr);
                self.Channels.getCharacteristic(Characteristic.ChannelName).updateValue(self.channelname);
                if (self.getCount > 5) {
                    self.log(self.name + ": " + err);
                }
                setTimeout(function() {
                    self.getCount += 1;
                    self.getStates();
                }, 60000)
            });

    }

    setTargetChannel(value, callback) {

        var self = this;
        var uri;

        self.getContent("/sony/avContent", "getContentList", {
                "source": self.channelSource,
                "stIdx": value
            }, "1.2")
            .then((data) => {

                var response = JSON.parse(data);

                var name = response.result[0];

                for (var i = 0; i <= name.length; i++) {

                    switch (i) {
                        case 0:
                            self.channelname = name[0].title;
                            uri = name[0].uri;
                            self.channelnr = value;
                            break;
                    }

                }

                self.getContent("/sony/avContent", "setPlayContent", {
                        "uri": uri
                    }, "1.0")
                    .then((data) => {

                        var response = JSON.parse(data);

                        if ("error" in response) {
                            self.log("TV OFF");
                            self.state = false;
                        } else {
                            self.log("Turn ON: " + self.channelname)
                            self.state = true;
                        }

                        self.Channels.getCharacteristic(Characteristic.TargetChannel).updateValue(self.channelnr);
                        self.Channels.getCharacteristic(Characteristic.ChannelName).updateValue(self.channelname);
                        self.ChannelSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                        callback()

                    })
                    .catch((err) => {
                        self.log(self.name + ": " + err);
                        self.state = false;
                        self.Channels.getCharacteristic(Characteristic.TargetChannel).updateValue(self.channelnr);
                        self.Channels.getCharacteristic(Characteristic.ChannelName).updateValue(self.channelname);
                        self.ChannelSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                        callback()
                    });

            })
            .catch((err) => {
                self.log(self.name + ": " + err);
                self.state = false;
                self.Channels.getCharacteristic(Characteristic.TargetChannel).updateValue(self.channelnr);
                self.Channels.getCharacteristic(Characteristic.ChannelName).updateValue(self.channelname);
                self.ChannelSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                callback()
            });

    }

    setChannel(state, callback) {

        var self = this;

        if (state) {

            self.getContent("/sony/avContent", "setPlayContent", {
                    "uri": self.favChannel
                }, "1.0")
                .then((data) => {

                    var response = JSON.parse(data);

                    if ("error" in response) {
                        self.log("An Error occured. Try again. Error: " + JSON.stringify(response));
                        self.state = false;
                    } else {
                        self.log("Switch to " + self.favchannelname)
                        self.state = true;
                    }

                    self.ChannelSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    self.Channels.getCharacteristic(Characteristic.TargetChannel).updateValue(0);
                    self.Channels.getCharacteristic(Characteristic.ChannelName).updateValue(self.favchannelname);
                    self.setOffCount = 0;
                    callback(null, self.state)

                })
                .catch((err) => {
                    if (self.setOffCount <= 5) {
                        self.state = false;
                        setTimeout(function() {
                            self.setOffCount += 1;
                            self.ChannelSwitch.getCharacteristic(Characteristic.On).setValue(self.state);
                            self.Channels.getCharacteristic(Characteristic.TargetChannel).updateValue(self.channelnr);
                            self.Channels.getCharacteristic(Characteristic.ChannelName).updateValue(self.channelname);
                        }, 3000)
                        callback(null, self.state)
                    } else {
                        self.state = true;
                        self.log("Can't set " + self.favchannelname + " off! " + err)
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
                        self.log("An Error occured. Try again. Error: " + JSON.stringify(response));
                        self.state = false;
                    } else {
                        self.log("Switch to Home App")
                        self.state = false;
                    }

                    self.ChannelSwitch.getCharacteristic(Characteristic.On).updateValue(self.state);
                    self.setOffCount = 0;
                    callback(null, self.state)

                })
                .catch((err) => {
                    if (self.setOffCount <= 5) {
                        self.state = false;
                        setTimeout(function() {
                            self.setOffCount += 1;
                            self.ChannelSwitch.getCharacteristic(Characteristic.On).setValue(self.state);
                        }, 3000)
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

module.exports = CHANNELS
