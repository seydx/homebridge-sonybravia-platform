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

    //HB
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
    this.detectCEC = config["detectCEC"] || true;

    //COUNT
    this.counthdmi = 0;
    this.countcec = 0;
    this.countapps = 0;
    this.countextras = 0;
    this.countchannels = 0;

    //STORAGE
    this.storage = require('node-persist');
    this.storage.initSync({
        dir: this.api.user.persistPath()
    });

    //PROMISE
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

                            self.log("Getting apps...");

                            self.getContent("/sony/appControl", "getApplicationList", "1.0", "1.0")
                                .then((data) => {

                                    var response = JSON.parse(data);

                                    if ("error" in response) {

                                        self.log("An error occured by getting application list!");

                                        if (response.error[0] == 7 || response.error[0] == 40005) {
                                            self.log("Please turn on the TV! Trying again...");
                                        } else if (response.error[0] == 3 || response.error[0] == 5) {
                                            self.log("Illegal argument!");
                                        } else {
                                            self.log("ERROR: " + JSON.stringify(response));
                                        }

                                        setTimeout(function() {
                                            fetchAppService(next);
                                        }, 10000)

                                    } else {

                                        var result = response.result[0];
                                        self.countapps = response.result[0].length;

                                        if (!self.homeapp && !self.storage.getItem("Sony_HomeApp")) {
                                            self.log("No home app found in config and storage. Setting home app to " + result[0].title + ". The Home App can also be changed within the EVE app!");
                                            self.homeapp = result[0].uri;
                                            self.favappname = result[0].title;
                                        } else if (self.storage.getItem("Sony_HomeApp")) {
                                            self.homeapp = self.storage.getItem("Sony_HomeApp");
                                            for (var i = 0; i < result.length; i++) {
                                                if (self.storage.getItem("Sony_HomeApp") == result[i].uri) {
                                                    self.favappname = result[i].title;
                                                }
                                            }
                                            self.log("Home App found in storage. Home App is: " + self.favappname);
                                        } else {
                                            for (var i = 0; i < result.length; i++) {
                                                if (self.homeapp == result[i].uri) {
                                                    self.favappname = result[i].title;
                                                }
                                            }
                                            self.log("Home App found in config. Home App is: " + self.favappname);
                                        }

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

                                    }

                                })
                                .catch((err) => {
                                    self.log(err);
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

                            self.log("Getting channels...");

                            if (!self.favChannel && !self.storage.getItem("Sony_FavChannel")) {

                                self.getContent("/sony/avContent", "getContentList", {
                                        "source": self.channelSource,
                                        "stIdx": 0
                                    }, "1.2")
                                    .then((data) => {

                                        var response = JSON.parse(data);

                                        if ("error" in response) {

                                            self.log("An error occured by setting favourite channel!");

                                            if (response.error[0] == 7 || response.error[0] == 40005) {
                                                self.log("Please turn on the TV! Trying again...");
                                            } else if (response.error[0] == 3 || response.error[0] == 5) {
                                                self.log("Illegal argument!");
                                            } else {
                                                self.log("ERROR: " + JSON.stringify(response));
                                            }

                                            setTimeout(function() {
                                                fetchChannels(next);
                                            }, 10000)

                                        } else {

                                            var name = response.result[0];

                                            for (var i = 0; i <= name.length; i++) {

                                                switch (i) {
                                                    case 0:
                                                        self.favChannel = name[0].uri;
                                                        self.favchannelname = name[0].title;
                                                        self.channelname = name[0].title;
                                                        break;
                                                }

                                            }

                                            self.log("No favourite channel found in config and storage. Setting channel to " + self.favchannelname + ". The channel can also be changed within the EVE app!");

                                        }

                                    })
                                    .catch((err) => {
                                        self.log("Favourite Channel: " + err + " - Trying again");
                                        setTimeout(function() {
                                            fetchChannels(next);
                                        }, 10000)
                                    });

                            } else if (self.storage.getItem("Sony_FavChannel")) {

                                self.favChannel = self.storage.getItem("Sony_FavChannel");
                                self.favchannelname = self.favChannel.split("Name=").pop();
                                self.channelname = "";
                                self.log("Favourite channel found in storage. Channel is: " + self.favChannel.split("Name=").pop());

                            } else {

                                self.favchannelname = self.favChannel.split("Name=").pop();
                                self.channelname = "";
                                self.log("Favourite channel found in config. Channel is: " + self.favchannelname);

                            }

                            self.getContent("/sony/avContent", "getContentCount", {
                                    "source": self.channelSource
                                }, "1.0")
                                .then((data) => {

                                    var response = JSON.parse(data);

                                    if ("error" in response) {

                                        self.log("An error occured by getting channel list!");

                                        if (response.error[0] == 7 || response.error[0] == 40005) {
                                            self.log("Please turn on the TV! Trying again...");
                                        } else if (response.error[0] == 3 || response.error[0] == 5) {
                                            self.log("Illegal argument!");
                                        } else {
                                            self.log("ERROR: " + JSON.stringify(response));
                                        }

                                        setTimeout(function() {
                                            fetchChannels(next);
                                        }, 10000)

                                    } else {

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
                                            favchannelname: self.favchannelname,
                                            channelname: self.channelname
                                        }

                                        self.countchannels = channelListConfig.maxChannels;

                                        var channelListAccessory = new CHANNEL_Accessory(self.log, channelListConfig, self.api)
                                        accessoriesArray.push(channelListAccessory);

                                        next();

                                    }

                                })
                                .catch((err) => {
                                    self.log(err);
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

                                if ("error" in response) {

                                    self.log("An error occured by getting inputs!");

                                    if (response.error[0] == 7 || response.error[0] == 40005) {
                                        self.log("Please turn on the TV! Trying again...");
                                    } else if (response.error[0] == 3 || response.error[0] == 5) {
                                        self.log("Illegal argument!");
                                    } else {
                                        self.log("ERROR: " + JSON.stringify(response));
                                    }

                                    setTimeout(function() {
                                        fetchSources(next);
                                    }, 10000)

                                } else {

                                    var result = response.result[0];
                                    self.counthdmi = 0;
                                    self.countcec = 0;
                                    var hdmiArray = []

                                    for (var i = 0; i < result.length; i++) {

                                        var toConfig = {
                                            psk: self.psk,
                                            ipadress: self.ipadress,
                                            interval: self.interval,
                                            homeapp: self.homeapp,
                                            port: self.port
                                        }

                                        if (result[i].icon == "meta:hdmi") {

                                            self.counthdmi += 1;

                                            toConfig["name"] = self.name + " " + result[i].title;
                                            toConfig["title"] = result[i].title;
                                            toConfig["uri"] = result[i].uri;
                                            toConfig["meta"] = result[i].icon;

                                            hdmiArray.push(toConfig);

                                        }

                                    }

                                    next(null, hdmiArray)

                                }

                            })
                            .catch((err) => {
                                self.log("Inputs: " + err + " - Trying again");
                                setTimeout(function() {
                                    fetchSources(next);
                                }, 10000)
                            });

                    }
                    fetchSources(next)
                },

                function(hdmiArray, next) {

                    function fetchCEC(next) {

                        if (self.detectCEC) {

                            self.log("CEC detection is enabled.")

                            self.getContent("/sony/system", "getPowerStatus", "1.0", "1.0")
                                .then((tvdata) => {
                                    var tvresponse = JSON.parse(tvdata);
                                    if ("error" in tvresponse) {
                                        self.log("CEC: An error occured by getting TV state");
                                        if (response.error[0] == 7 || response.error[0] == 40005) {
                                            self.log("Please turn on the TV! Trying again...");
                                        } else if (response.error[0] == 3 || response.error[0] == 5) {
                                            self.log("Illegal argument!");
                                        } else {
                                            self.log("ERROR: " + JSON.stringify(tvresponse));
                                        }
                                    } else {
                                        var status = tvresponse.result[0].status;
                                        if (status == "active") {

                                            self.getContent("/sony/avContent", "getCurrentExternalInputsStatus", "1.0", "1.0")
                                                .then((data) => {

                                                    var response = JSON.parse(data);

                                                    if ("error" in response) {

                                                        self.log("An error occured by getting cec inputs!");

                                                        if (response.error[0] == 7 || response.error[0] == 40005) {
                                                            self.log("Please turn on the TV! Trying again...");
                                                        } else if (response.error[0] == 3 || response.error[0] == 5) {
                                                            self.log("Illegal argument!");
                                                        } else {
                                                            self.log("ERROR: " + JSON.stringify(response));
                                                        }

                                                        setTimeout(function() {
                                                            fetchCEC(next);
                                                        }, 10000)

                                                    } else {

                                                        self.log("TV is ON. Getting CEC devices...");

                                                        var result = response.result[0];

                                                        for (var i = 0; i < result.length; i++) {

                                                            if (result[i].icon == "meta:playbackdevice") {

                                                                self.countcec += 1;

                                                                var uri = result[i].uri;

                                                                if (uri.match("logicalAddr")) {
                                                                    var port = uri.split("port=")[1].split("&logicalAddr=")[0];
                                                                } else {
                                                                    var port = uri.split("port=")[1];
                                                                }

                                                                var newuri = "extInput:hdmi?port=" + port;

                                                                for (var j = 0; j < hdmiArray.length; j++) {

                                                                    if (hdmiArray[j].uri == newuri) {
                                                                        hdmiArray[j].name = self.name + " " + result[i].title;
                                                                        hdmiArray[j].title = result[i].title;
                                                                        hdmiArray[j].uri = result[i].uri;
                                                                        hdmiArray[j].meta = result[i].icon;
                                                                    }

                                                                }

                                                            }

                                                        }
                                                        next(null, hdmiArray)

                                                    }

                                                })
                                                .catch((err) => {
                                                    self.log("CEC: " + err + " - Trying again");
                                                    setTimeout(function() {
                                                        fetchCEC(next);
                                                    }, 10000)
                                                });

                                        } else if (status == "standby") {
                                            self.log("TV seems to be off. TV needs to be turned on for getting CEC devices! Trying again...");
                                            setTimeout(function() {
                                                fetchCEC(next);
                                            }, 10000)
                                        } else {
                                            self.log("CEC: An error occured by getting TV state. Error: " + JSON.stringify(tvresponse));
                                            setTimeout(function() {
                                                fetchCEC(next);
                                            }, 10000)
                                        }
                                    }
                                })
                                .catch((tverr) => {
                                    self.log("CEC TV state: " + tverr + " - Trying again");
                                    setTimeout(function() {
                                        fetchCEC(next);
                                    }, 10000)
                                });

                        } else {
                            self.log("CEC detection is not enabled. Skipping discovery.")
                            next(null, hdmiArray);
                        }

                    }
                    fetchCEC(next)
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

                                    if ("error" in response) {

                                        self.log("An error occured by getting extra inputs!");

                                        if (response.error[0] == 7 || response.error[0] == 40005) {
                                            self.log("Please turn on the TV! Trying again...");
                                        } else if (response.error[0] == 3 || response.error[0] == 5) {
                                            self.log("Illegal argument!");
                                        } else {
                                            self.log("ERROR: " + JSON.stringify(response));
                                        }

                                        setTimeout(function() {
                                            fetchExtras(next);
                                        }, 10000)

                                    } else {

                                        var result = response.result[0];
                                        var extraArray = []

                                        for (var i = 0; i < result.length; i++) {
                                            if (result[i].icon == "meta:scart" || result[i].icon == "meta:composite" || result[i].icon == "meta:wifidisplay") {

                                                self.countextras += 1;

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

                                        next(null, extraArray)

                                    }

                                })
                                .catch((err) => {
                                    self.log(err);
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
                if (err) {
                    callback(err)
                } else {
                    self.log("Found " + self.counthdmi + " HDMI input(s) with " + self.countcec + " CEC device(s), " + self.countextras + " extra input(s), " + self.countapps + " app(s) and " + self.countchannels + " channel(s)");
                    callback(accessoriesArray);
                }
            }

        )

    }
}
