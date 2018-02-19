var rp = require("request-promise"),
    async = require("async");

var HK_TYPES = require("./src/HomeKitTypes.js");
var HK_REQS = require('./src/Requests.js');
var TV_Accessory = require('./accessories/tvswitch.js');
var VOLUME_Accessory = require('./accessories/volumeaccesory.js');
var APP_Accessory = require('./accessories/appservice.js');
var SOURCE_Accessory = require('./accessories/sourceswitches.js');
var EXTRAS_Accessory = require('./accessories/extraswitches.js');
var HOME_Accessory = require('./accessories/homeappswitches.js');

var Accessory, Service, Characteristic;

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
    this.ipadress = config["ipadress"];
    this.mac = config["mac"] || "";
    this.polling = config["polling"] === true;
    this.interval = (config['interval'] * 1000) || 5000;
    this.homeapp = config["homeapp"];
    if (this.polling == undefined || this.polling == "" || this.polling == null) {
        platform.log("No Home App defined, setting Home App to YouTube!");
        this.homeapp = "com.sony.dtv.com.google.android.youtube.tv.com.google.android.apps.youtube.tv.cobalt.activity.ShellActivity";
    }
    this.maxVolume = config["maxVolume"] || 30;
    this.extraInputs = config["extraInputs"] === true;
    this.cecs = config["cecs"] || [""];
    this.maxApps = "";

    HK_TYPES.registerWith(api);

    this.get = new HK_REQS(platform.psk, platform.ipadress, platform.uri, {
        "token": process.argv[2]
    });
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

                    self.get.apps()
                        .then(response => {

                            self.maxApps = response.result[0].length;

                            var appListConfig = {
                                name: self.name,
                                psk: self.psk,
                                ipadress: self.ipadress,
                                mac: self.mac,
                                polling: self.polling,
                                interval: self.interval,
                                maxApps: self.maxApps
                            }

                            var appListAccessory = new APP_Accessory(self.log, appListConfig, self.api)
                            accessoriesArray.push(appListAccessory);

                        })
                        .catch(err => {
                            self.log("Could not retrieve apps:" + err);
                        });

                    next();
                },

                //Push HDMI/CEC
                function(next) {

                    function fetchSources(next) {

                        self.get.inputs()
                            .then(response => {

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
                            .catch(err => {
                                self.log("Could not retrieve Source Inputs: " + err);
                                self.log("Fetching Source Input failed - Trying again...");
                                setTimeout(function() {
                                    fetchSources(next)
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

                        self.get.inputs()
                            .then(response => {

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
                            .catch(err => {
                                self.log("Could not retrieve Extra Source Inputs: " + err);
                                self.log("Fetching Extra Source Input failed - Trying again...");
                                setTimeout(function() {
                                    fetchExtras(next)
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
