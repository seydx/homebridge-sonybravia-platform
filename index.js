var http = require("http"),
    async = require("async");

var TV_Accessory = require('./accessories/TV.js'),
    VOLUME_Accessory = require('./accessories/Volume.js'),
    APP_Accessory = require('./accessories/Apps.js'),
    SOURCE_Accessory = require('./accessories/Inputs.js'),
    EXTRAS_Accessory = require('./accessories/Extras.js'),
    HOME_Accessory = require('./accessories/Home.js');

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
    this.name = config["name"] || "Sony";
    this.psk = config["psk"];
    if (!this.psk) throw new Error("PSK is required!");
    this.ipadress = config["ipadress"];
    if (!this.ipadress) throw new Error("IP Adress is required!");
    this.interval = (config['interval'] * 1000) || 10000;
    if (this.interval < 5) {
        platform.log("Interval to low! Setting interval to 5 seconds");
        this.interval = 5;
    }
    this.homeapp = config["homeapp"];
    if (this.homeapp == undefined || this.homeapp == "" || this.homeapp == null) {
        platform.log("No Home App defined, setting Home App to YouTube!");
        this.homeapp = "com.sony.dtv.com.google.android.youtube.tv.com.google.android.apps.youtube.tv.cobalt.activity.ShellActivity";
    }
    this.maxVolume = config["maxVolume"] || 30;
    this.extraInputs = config["extraInputs"] || false;
    this.cecs = config["cecs"] || [];

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

SonyBraviaPlatform.prototype = {

    accessories: function(callback) {

        var self = this;
        var accessoriesArray = []

        async.waterfall([

                // set TV Switch
                function(next) {
                    var tvConfig = {
                        uri: self.uri,
                        name: self.name,
                        psk: self.psk,
                        ipadress: self.ipadress,
                        mac: self.mac,
                        polling: self.polling,
                        interval: self.interval,
                        homeapp: self.homeapp
                    }
                    var tvAccessory = new TV_Accessory(self.log, tvConfig, self.api)
                    accessoriesArray.push(tvAccessory);
                    next();
                },

                // set APP Service
                function(next) {

                    self.getContent("/sony/appControl", "getApplicationList", "1.0", "1.0")
                        .then((data) => {

                            var response = JSON.parse(data);
                            var AppList = response.result[0].length;

                            var appListConfig = {
                                name: self.name,
                                psk: self.psk,
                                ipadress: self.ipadress,
                                mac: self.mac,
                                polling: self.polling,
                                interval: self.interval,
                                maxApps: AppList
                            }

                            var appListAccessory = new APP_Accessory(self.log, appListConfig, self.api)
                            accessoriesArray.push(appListAccessory);

                        })
                        .catch((err) => {
                            self.log(self.name + ": " + err + " - Trying again");
                        });

                    next();

                },

                //Push HDMI/CEC
                function(next) {

                    function fetchSources(next) {

                        self.getContent("/sony/avContent", "getCurrentExternalInputsStatus", "1.0", "1.0")
                            .then((data) => {

                                var response = JSON.parse(data);
                                var result = response.result[0];

                                var hdmiArray = []
                                var objArray = []

                                for (var i = 0; i < result.length; i++) {
                                    if (result[i].title.match("HDMI")) {
                                        objArray.push(result[i]);
                                    }
                                }

                                objArray.forEach(function(element, index, array) {

                                    var toConfig = {
                                        uri: element.uri,
                                        hdminame: element.title,
                                        hdmiuri: element.uri,
                                        name: self.name,
                                        psk: self.psk,
                                        ipadress: self.ipadress,
                                        mac: self.mac,
                                        polling: self.polling,
                                        interval: self.interval,
                                        homeapp: self.homeapp
                                    }

                                    if (self.config.cecs) {
                                        self.config.cecs.forEach(function(cecswitch, index, array) {

                                            if (element.uri.match(cecswitch.port)) {
                                                toConfig["cecname"] = cecswitch.label;
                                                toConfig["cecuri"] = "extInput:cec?type=player&port=" + cecswitch.port + "&logicalAddr=" + cecswitch.logaddr;
                                                toConfig["cecport"] = cecswitch.port;
                                                toConfig["ceclogaddr"] = cecswitch.logaddr;
                                            } else {
                                                return
                                            }

                                        })
                                    }

                                    hdmiArray.push(toConfig);

                                })

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

                // Create HDMI/CEC Accessories  
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


                //Push Extra Inputs
                function(next) {
                    function fetchExtras(next) {

                        self.getContent("/sony/avContent", "getCurrentExternalInputsStatus", "1.0", "1.0")
                            .then((data) => {

                                var response = JSON.parse(data);
                                var result = response.result[0];

                                var extraArray = []
                                var exobjArray = []

                                for (var i = 0; i < result.length; i++) {
                                    if (result[i].title.match("AV") || result[i].icon.match("composite") || result[i].icon.match("wifidisplay")) {
                                        exobjArray.push(result[i]);
                                    }
                                }

                                exobjArray.forEach(function(element, index, array) {

                                    var extraConfig = {
                                        uri: element.uri,
                                        extraname: element.title,
                                        name: self.name,
                                        psk: self.psk,
                                        ipadress: self.ipadress,
                                        mac: self.mac,
                                        polling: self.polling,
                                        interval: self.interval,
                                        homeapp: self.homeapp
                                    }

                                    extraArray.push(extraConfig);

                                })
                                next(null, extraArray)

                            })
                            .catch((err) => {
                                self.log(self.name + ": " + err + " - Trying again");
                                setTimeout(function() {
                                    fetchExtras(next);
                                }, 10000)
                            });

                    }
                    fetchExtras(next)
                },

                // Create Extra Accessories 
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

                // set Home App Switch
                function(next) {
                    var homeConfig = {
                        uri: self.uri,
                        name: self.name,
                        psk: self.psk,
                        ipadress: self.ipadress,
                        mac: self.mac,
                        polling: self.polling,
                        interval: self.interval,
                        homeapp: self.homeapp
                    }
                    var homeAccessory = new HOME_Accessory(self.log, homeConfig, self.api)
                    accessoriesArray.push(homeAccessory);
                    next();
                },

                // set Volume Control
                function(next) {
                    var volConfig = {
                        uri: self.uri,
                        name: self.name,
                        psk: self.psk,
                        ipadress: self.ipadress,
                        mac: self.mac,
                        polling: self.polling,
                        interval: self.interval,
                        maxVolume: self.maxVolume
                    }
                    var volAccessory = new VOLUME_Accessory(self.log, volConfig, self.api)
                    accessoriesArray.push(volAccessory);
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
