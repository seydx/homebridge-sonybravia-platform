var http = require("http"),
    async = require("async");

var TV_Accessory = require('./accessories/TV.js'),
    VOLUME_Accessory = require('./accessories/Volume.js'),
    APP_Accessory = require('./accessories/Apps.js'),
    CHANNEL_Accessory = require('./accessories/Channels.js'),
    SOURCE_Accessory = require('./accessories/Inputs.js'),
    EXTRAS_Accessory = require('./accessories/Extras.js');

var Accessory,
    Service,
    Characteristic;

module.exports = function(homebridge) {

    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerPlatform("homebridge-sonybravia-platform", "SonyBravia", SonyBraviaPlatform);

}

function SonyBraviaPlatform(log, config, api) {
    var platform = this;

    this.api = api;
    this.config = config;
    this.log = log;

    //Base
    this.name = config["name"] || "Sony";
    this.psk = config["psk"];
    if (!this.psk) throw new Error("PSK is required!");
    this.ipadress = config["ipadress"];
    if (!this.ipadress) throw new Error("IP Adress is required!");
    this.port = config["port"] || 80;
    this.interval = (config['interval'] * 1000) || 10000;
    if ((this.interval / 1000) < 10) {
        this.log("Critical interval value! Setting interval to 10 seconds");
        this.interval = 10000;
    }

    //Volume
    this.volumeEnabled = config["volumeEnabled"] || true;
    this.maxVolume = config["maxVolume"] || 35;

    //Extra Inputs
    this.extraInputs = config["extraInputs"] || false;

    //Apps
    this.appsEnabled = config["appsEnabled"] || true;
    this.homeapp = config["homeapp"];

    //Channels
    this.channelsEnabled = config["channelsEnabled"] || false;
    this.channelSource = config["channelSource"] || "tv:dvbt";
    this.favChannel = config["favChannel"];

    //CECs
    this.cecs = config["cecs"];

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

    if (this.channelsEnabled && !this.favChannel) {
        this.log("No favourite Channel found in config. Setting channel number to 1")
        this.getContent("/sony/avContent", "getContentList", {
                "source": platform.channelSource,
                "stIdx": 0
            }, "1.2")
            .then((data) => {

                var response = JSON.parse(data);
                var name = response.result[0];

                for (var i = 0; i <= name.length; i++) {

                    switch (i) {
                        case 0:
                            platform.favChannel = name[0].uri;
                            platform.favchannelname = name[0].title;
                            break;
                    }

                }

            })
            .catch((err) => {
                platform.log(self.name + ": " + err);
                platform.favChannel = "";
            });
    } else {
        if (this.channelsEnabled && this.favChannel) {
            platform.favchannelname = platform.favChannel.split("Name=").pop();
        }
    }

}

SonyBraviaPlatform.prototype = {

    accessories: function(callback) {

        var self = this;
        var accessoriesArray = []

        async.waterfall([

                function(next) {
                    var tvConfig = {
                        uri: self.uri,
                        name: self.name,
                        psk: self.psk,
                        ipadress: self.ipadress,
                        interval: self.interval,
                        homeapp: self.homeapp,
                        port: self.port
                    }
                    var tvAccessory = new TV_Accessory(self.log, tvConfig, self.api)
                    accessoriesArray.push(tvAccessory);
                    next();
                },

                function(next) {

                    function fetchAppService(next) {

                        if (self.appsEnabled) {

                            self.log("Getting apps...")

                            self.getContent("/sony/appControl", "getApplicationList", "1.0", "1.0")
                                .then((data) => {

                                    var response = JSON.parse(data);
                                    var result = response.result[0]

                                    if (!self.homeapp) {
                                        self.log("No home app found in config. Setting home app to " + result[0].title)
                                        self.homeapp = result[0].uri;
                                        self.favappname = result[0].title;
                                    } else {
                                        for (var i = 0; i < result.length; i++) {
                                            if (self.homeapp == result[i].uri) {
                                                self.favappname = result[i].title;
                                            }
                                        }
                                    }

                                    self.log("Found " + response.result[0].length + " apps!")

                                    var appListConfig = {
                                        name: self.name,
                                        psk: self.psk,
                                        ipadress: self.ipadress,
                                        maxApps: response.result[0].length,
                                        port: self.port,
                                        interval: self.interval,
                                        homeapp: self.homeapp,
                                        favappname: self.favappname
                                    }

                                    var appListAccessory = new APP_Accessory(self.log, appListConfig, self.api, result)
                                    accessoriesArray.push(appListAccessory);

                                    next();

                                })
                                .catch((err) => {
                                    self.log(self.name + ": " + err + " - Trying again");
                                    setTimeout(function() {
                                        fetchAppService(next);
                                    }, 10000)
                                });

                        } else {
                            next();
                        }

                    }
                    fetchAppService(next)

                },

                function(next) {

                    function fetchChannels(next) {

                        if (self.channelsEnabled) {

                            self.log("Getting channels...")

                            self.getContent("/sony/avContent", "getContentCount", {
                                    "source": self.channelSource
                                }, "1.0")
                                .then((data) => {

                                    var response = JSON.parse(data);

                                    var channelListConfig = {
                                        name: self.name,
                                        psk: self.psk,
                                        ipadress: self.ipadress,
                                        maxChannels: response.result[0].count - 1,
                                        port: self.port,
                                        interval: self.interval,
                                        channelSource: self.channelSource,
                                        homeapp: self.homeapp,
                                        favChannel: self.favChannel,
                                        favchannelname: self.favchannelname
                                    }

                                    self.log("Found " + channelListConfig.maxChannels + " channels!")

                                    var channelListAccessory = new CHANNEL_Accessory(self.log, channelListConfig, self.api)
                                    accessoriesArray.push(channelListAccessory);

                                    next();

                                })
                                .catch((err) => {
                                    self.log(self.name + ": " + err + " - Trying again");
                                    setTimeout(function() {
                                        fetchChannels(next);
                                    }, 10000)
                                });

                        } else {
                            next();
                        }

                    }
                    fetchChannels(next)

                },

                function(next) {

                    function fetchSources(next) {

                        self.log("Getting inputs...")

                        self.getContent("/sony/avContent", "getCurrentExternalInputsStatus", "1.0", "1.0")
                            .then((data) => {

                                var response = JSON.parse(data);
                                var result = response.result[0];
                                var counthdmi = 0;
                                var countcec = 0;
                                var hdmiArray = []

                                for (var i = 0; i < result.length; i++) {
                                    if (result[i].icon == "meta:hdmi") {

                                        counthdmi += 1;

                                        var toConfig = {
                                            uri: result[i].uri,
                                            hdminame: result[i].title,
                                            hdmiuri: result[i].uri,
                                            name: self.name,
                                            psk: self.psk,
                                            ipadress: self.ipadress,
                                            interval: self.interval,
                                            homeapp: self.homeapp,
                                            port: self.port
                                        }

                                        if (self.config.cecs) {

                                            for (var j = 0; j < self.config.cecs.length; j++) {

                                                countcec += 1;

                                                var cecs = self.config.cecs;

                                                if (result[i].uri.match(cecs[j].port)) {
                                                    toConfig["cecname"] = cecs[j].label;
                                                    toConfig["cecuri"] = "extInput:cec?type=player&port=" + cecs[j].port + "&logicalAddr=" + cecs[j].logaddr;
                                                    toConfig["cecport"] = cecs[j].port;
                                                    toConfig["ceclogaddr"] = cecs[j].logaddr;
                                                }

                                            }

                                        }

                                        hdmiArray.push(toConfig);

                                    }
                                }

                                self.log("Found " + counthdmi + " HDMI inputs with " + countcec / counthdmi + " inserted CEC devices");

                                next(null, hdmiArray)

                            })
                            .catch((err) => {
                                self.log(self.name + ": " + err + " - Trying again");
                                setTimeout(function() {
                                    fetchSources(next);
                                }, 10000)
                            });

                    }
                    fetchSources(next)
                },

                function(hdmiArray, next) {

                    async.forEachOf(hdmiArray, function(zone, key, step) {

                        function pushMyAccessories(step) {

                            var hdmiAccessory = new SOURCE_Accessory(self.log, zone, self.api)
                            accessoriesArray.push(hdmiAccessory);
                            step()

                        }
                        pushMyAccessories(step)
                    }, function(err) {
                        if (err) next(err)
                        else next()
                    })

                },

                function(next) {
                    function fetchExtras(next) {

                        if (self.extraInputs) {

                            self.log("Getting extra inputs...")

                            self.getContent("/sony/avContent", "getCurrentExternalInputsStatus", "1.0", "1.0")
                                .then((data) => {

                                    var response = JSON.parse(data);
                                    var result = response.result[0];
                                    var countex = 0;
                                    var extraArray = []

                                    for (var i = 0; i < result.length; i++) {
                                        if (result[i].icon == "meta:scart" || result[i].icon == "meta:composite" || result[i].icon == "meta:wifidisplay") {

                                            countex += 1;

                                            var extraConfig = {
                                                uri: result[i].uri,
                                                extraname: result[i].title,
                                                name: self.name,
                                                psk: self.psk,
                                                ipadress: self.ipadress,
                                                interval: self.interval,
                                                homeapp: self.homeapp,
                                                port: self.port,
                                            }

                                            extraArray.push(extraConfig);

                                        }
                                    }

                                    self.log("Found " + countex + " extra inputs")

                                    next(null, extraArray)

                                })
                                .catch((err) => {
                                    self.log(self.name + ": " + err + " - Trying again");
                                    setTimeout(function() {
                                        fetchExtras(next);
                                    }, 10000)
                                });

                        } else {
                            var extraArray;
                            next(null, extraArray)
                        }

                    }
                    fetchExtras(next)
                },

                function(extraArray, next) {
                    if (self.extraInputs) {
                        async.forEachOf(extraArray, function(zone, key, step) {

                            function pushMyExtraAccessories(step) {

                                var extraAccessory = new EXTRAS_Accessory(self.log, zone, self.api)
                                accessoriesArray.push(extraAccessory);
                                step()

                            }
                            pushMyExtraAccessories(step)
                        }, function(err) {
                            if (err) next(err)
                            else next()
                        })
                    } else {
                        next();
                    }
                },

                function(next) {

                    if (self.volumeEnabled) {

                        var volConfig = {
                            uri: self.uri,
                            name: self.name,
                            psk: self.psk,
                            ipadress: self.ipadress,
                            interval: self.interval,
                            maxVolume: self.maxVolume,
                            port: self.port
                        }
                        var volAccessory = new VOLUME_Accessory(self.log, volConfig, self.api)
                        accessoriesArray.push(volAccessory);

                    }

                    next();
                }

            ],

            function(err, result) {
                if (err) callback(err)
                else callback(accessoriesArray);
            }

        )

    }
}
