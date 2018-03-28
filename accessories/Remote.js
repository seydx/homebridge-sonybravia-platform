var http = require("http"),
    inherits = require("util").inherits;

var Accessory,
    Service,
    Characteristic;

class REMOTE {

    constructor(log, config, api) {

        Accessory = api.platformAccessory;
        Service = api.hap.Service;
        Characteristic = api.hap.Characteristic;

        /// START ///

        ////////////////////////////////////////////////////////////////////////////
        // TVPower Characteristic
        ////////////////////////////////////////////////////////////////////////////       
        Characteristic.TVPower = function() {
            Characteristic.call(this, "TV Power", "8b1230bb-9747-43b8-bd5f-3fd8fcdc36f4");
            this.setProps({
                format: Characteristic.Formats.BOOL,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.TVPower, Characteristic);
        Characteristic.TVPower.UUID = "8b1230bb-9747-43b8-bd5f-3fd8fcdc36f4";

        ////////////////////////////////////////////////////////////////////////////
        // Mute Characteristic
        ////////////////////////////////////////////////////////////////////////////       
        Characteristic.Mute = function() {
            Characteristic.call(this, "Volume Mute", "8fbd30e5-f7c9-4563-b014-779dcfd2d359");
            this.setProps({
                format: Characteristic.Formats.BOOL,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.Mute, Characteristic);
        Characteristic.Mute.UUID = "8fbd30e5-f7c9-4563-b014-779dcfd2d359";

        ////////////////////////////////////////////////////////////////////////////
        // VolumeUp Characteristic
        ////////////////////////////////////////////////////////////////////////////   
        Characteristic.VolumeUp = function() {
            Characteristic.call(this, "Volume Up", "5ce7fc1a-d8f7-4072-ad04-16eaf4d48d04");
            this.setProps({
                format: Characteristic.Formats.BOOL,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.VolumeUp, Characteristic);
        Characteristic.VolumeUp.UUID = "5ce7fc1a-d8f7-4072-ad04-16eaf4d48d04";

        ////////////////////////////////////////////////////////////////////////////
        // VolumeDown Characteristic
        ////////////////////////////////////////////////////////////////////////////   
        Characteristic.VolumeDown = function() {
            Characteristic.call(this, "Volume Down", "542a906c-b003-444f-b26e-85711d80b188");
            this.setProps({
                format: Characteristic.Formats.BOOL,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.VolumeDown, Characteristic);
        Characteristic.VolumeDown.UUID = "542a906c-b003-444f-b26e-85711d80b188";

        ////////////////////////////////////////////////////////////////////////////
        // Enter Characteristic
        ////////////////////////////////////////////////////////////////////////////       
        Characteristic.Enter = function() {
            Characteristic.call(this, "TV Enter", "b2121f16-4270-4ac2-9660-4bdd1a44c617");
            this.setProps({
                format: Characteristic.Formats.BOOL,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.Enter, Characteristic);
        Characteristic.Enter.UUID = "b2121f16-4270-4ac2-9660-4bdd1a44c617";

        ////////////////////////////////////////////////////////////////////////////
        // Return Characteristic
        ////////////////////////////////////////////////////////////////////////////       
        Characteristic.Return = function() {
            Characteristic.call(this, "TV Return", "5b9909e4-9d0f-44d4-ae6c-1e8b1f21a9cf");
            this.setProps({
                format: Characteristic.Formats.BOOL,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.Return, Characteristic);
        Characteristic.Return.UUID = "5b9909e4-9d0f-44d4-ae6c-1e8b1f21a9cf";

        ////////////////////////////////////////////////////////////////////////////
        // Exit Characteristic
        ////////////////////////////////////////////////////////////////////////////       
        Characteristic.Exit = function() {
            Characteristic.call(this, "TV Exit", "0f5b8eb2-ac7f-43d6-9246-559294d467c0");
            this.setProps({
                format: Characteristic.Formats.BOOL,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.Exit, Characteristic);
        Characteristic.Exit.UUID = "0f5b8eb2-ac7f-43d6-9246-559294d467c0";

        ////////////////////////////////////////////////////////////////////////////
        // Home Characteristic
        ////////////////////////////////////////////////////////////////////////////       
        Characteristic.Home = function() {
            Characteristic.call(this, "TV Home", "e91cac16-c611-47a9-baef-cdea58b013ca");
            this.setProps({
                format: Characteristic.Formats.BOOL,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.Home, Characteristic);
        Characteristic.Home.UUID = "e91cac16-c611-47a9-baef-cdea58b013ca";

        ////////////////////////////////////////////////////////////////////////////
        // Confirm Characteristic
        ////////////////////////////////////////////////////////////////////////////       
        Characteristic.Confirm = function() {
            Characteristic.call(this, "TV Confirm", "42b6d517-86c8-4d7a-9dad-4c62c4f59ae4");
            this.setProps({
                format: Characteristic.Formats.BOOL,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.Confirm, Characteristic);
        Characteristic.Confirm.UUID = "42b6d517-86c8-4d7a-9dad-4c62c4f59ae4";

        ////////////////////////////////////////////////////////////////////////////
        // ChannelUp Characteristic
        ////////////////////////////////////////////////////////////////////////////       
        Characteristic.ChannelUp = function() {
            Characteristic.call(this, "Channel Up", "22cf3a48-4a2f-4a52-b929-1a6f88fa6b7b");
            this.setProps({
                format: Characteristic.Formats.BOOL,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.ChannelUp, Characteristic);
        Characteristic.ChannelUp.UUID = "22cf3a48-4a2f-4a52-b929-1a6f88fa6b7b";

        ////////////////////////////////////////////////////////////////////////////
        // ChannelDown Characteristic
        ////////////////////////////////////////////////////////////////////////////       
        Characteristic.ChannelDown = function() {
            Characteristic.call(this, "Channel Down", "4e1ff6f4-afd6-4aa2-87ef-79dc3f4b41d6");
            this.setProps({
                format: Characteristic.Formats.BOOL,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.ChannelDown, Characteristic);
        Characteristic.ChannelDown.UUID = "4e1ff6f4-afd6-4aa2-87ef-79dc3f4b41d6";

        ////////////////////////////////////////////////////////////////////////////
        // ControlUp Characteristic
        ////////////////////////////////////////////////////////////////////////////       
        Characteristic.ControlUp = function() {
            Characteristic.call(this, "TV Up", "f4b86abe-d0d2-45ad-bfe1-617d628b951f");
            this.setProps({
                format: Characteristic.Formats.BOOL,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.ControlUp, Characteristic);
        Characteristic.ControlUp.UUID = "f4b86abe-d0d2-45ad-bfe1-617d628b951f";

        ////////////////////////////////////////////////////////////////////////////
        // NetflixButton Characteristic
        ////////////////////////////////////////////////////////////////////////////       
        Characteristic.NetflixButton = function() {
            Characteristic.call(this, "Netflix Button", "a5d64dfb-0bcb-4dde-97f5-4ec76f320ad3");
            this.setProps({
                format: Characteristic.Formats.BOOL,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.NetflixButton, Characteristic);
        Characteristic.NetflixButton.UUID = "a5d64dfb-0bcb-4dde-97f5-4ec76f320ad3";

        ////////////////////////////////////////////////////////////////////////////
        // ControlDown Characteristic
        ////////////////////////////////////////////////////////////////////////////       
        Characteristic.ControlDown = function() {
            Characteristic.call(this, "TV Down", "73ef568d-6770-4bc1-8225-9426b6826497");
            this.setProps({
                format: Characteristic.Formats.BOOL,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.ControlDown, Characteristic);
        Characteristic.ControlDown.UUID = "73ef568d-6770-4bc1-8225-9426b6826497";

        ////////////////////////////////////////////////////////////////////////////
        // RemoteControl Service
        ////////////////////////////////////////////////////////////////////////////   
        Service.RemoteControl = function(displayName, subtype) {
            Service.call(this, displayName, "ac1a97c8-0271-4089-9a74-d330c0d48c14", subtype);

            // Required Characteristics
            this.addCharacteristic(Characteristic.TVPower);
            this.addCharacteristic(Characteristic.Mute);
            this.addCharacteristic(Characteristic.VolumeUp);
            this.addCharacteristic(Characteristic.VolumeDown);

            // Optional Characteristics
            this.addOptionalCharacteristic(Characteristic.ChannelUp);
            this.addOptionalCharacteristic(Characteristic.ChannelDown);
            this.addOptionalCharacteristic(Characteristic.ControlUp);
            this.addOptionalCharacteristic(Characteristic.ControlDown);
            this.addOptionalCharacteristic(Characteristic.Enter);
            this.addOptionalCharacteristic(Characteristic.Return);
            this.addOptionalCharacteristic(Characteristic.Home);
            this.addOptionalCharacteristic(Characteristic.Exit);
            this.addOptionalCharacteristic(Characteristic.Confirm);
            this.addOptionalCharacteristic(Characteristic.NetflixButton);

        };
        inherits(Service.RemoteControl, Service);
        Service.RemoteControl.UUID = "ac1a97c8-0271-4089-9a74-d330c0d48c14";

        /// END ///      

        var platform = this;
        this.api = api;
        this.log = log;
        this.name = config.name + " Remote Control";
        this.psk = config.psk;
        this.ipadress = config.ipadress;
        this.port = config.port;
        this.controlMode = config.controlMode;

        this.getContent = function(setIRCC) {

            return new Promise((resolve, reject) => {

                var post_data = '<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1"><IRCCCode>' + setIRCC + '</IRCCCode></u:X_SendIRCC></s:Body></s:Envelope>';

                var options = {
                    host: platform.ipadress,
                    path: "/sony/IRCC",
                    port: platform.port,
                    method: "POST",
                    headers: {
                        'X-Auth-PSK': platform.psk,
                        'SOAPACTION': '"urn:schemas-sony-com:service:IRCC:1#X_SendIRCC"',
                        'Cookie': "cookie",
                        'Content-Type': 'text/xml',
                        'Content-Length': Buffer.byteLength(post_data)
                    }
                }

                var buffer = "";

                var req = http.request(options, function(res) {

                    var buffer = "";

                    if (res.statusCode < 200 || res.statusCode > 299) {
                        reject(new Error('Failed to load data, status code: ' + res.statusCode));
                    }

                    const body = []
                    res.on('data', (chunk) => {
                        buffer = buffer + chunk;
                        body.push(buffer)
                    });
                    res.on('end', () => resolve(body.join(buffer)));

                });

                req.on('error', (err) => reject(err))

                req.write(post_data);
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
            .setCharacteristic(Characteristic.Model, 'Remote Control')
            .setCharacteristic(Characteristic.SerialNumber, "Sony-Remote")
            .setCharacteristic(Characteristic.FirmwareRevision, require('../package.json').version);

        this.Control = new Service.RemoteControl(this.name);

        this.Control.getCharacteristic(Characteristic.TVPower)
            .updateValue(false)
            .on('set', this.setTVPower.bind(this));

        this.Control.getCharacteristic(Characteristic.Mute)
            .updateValue(false)
            .on('set', this.setMute.bind(this));

        this.Control.getCharacteristic(Characteristic.VolumeUp)
            .updateValue(false)
            .on('set', this.setVolumeUp.bind(this));

        this.Control.getCharacteristic(Characteristic.VolumeDown)
            .updateValue(false)
            .on('set', this.setVolumeDown.bind(this));

        this.Control.getCharacteristic(Characteristic.ChannelUp)
            .updateValue(false)
            .on('set', this.setChannelUp.bind(this));

        this.Control.getCharacteristic(Characteristic.ChannelDown)
            .updateValue(false)
            .on('set', this.setChannelDown.bind(this));

        if (this.controlMode == "ADVANCED" || this.controlMode != "BASIC") {

            this.Control.getCharacteristic(Characteristic.Enter)
                .updateValue(false)
                .on('set', this.setEnter.bind(this));

            this.Control.getCharacteristic(Characteristic.Confirm)
                .updateValue(false)
                .on('set', this.setConfirm.bind(this));

            this.Control.getCharacteristic(Characteristic.Return)
                .updateValue(false)
                .on('set', this.setReturn.bind(this));

            this.Control.getCharacteristic(Characteristic.Exit)
                .updateValue(false)
                .on('set', this.setExit.bind(this));

            this.Control.getCharacteristic(Characteristic.Home)
                .updateValue(false)
                .on('set', this.setHome.bind(this));

            this.Control.getCharacteristic(Characteristic.ControlUp)
                .updateValue(false)
                .on('set', this.setControlUp.bind(this));

            this.Control.getCharacteristic(Characteristic.ControlDown)
                .updateValue(false)
                .on('set', this.setControlDown.bind(this));

            this.Control.getCharacteristic(Characteristic.NetflixButton)
                .updateValue(false)
                .on('set', this.setNetflixButton.bind(this));

        }

        return [this.informationService, this.Control];
    }

    setTVPower(state, callback) {

        var self = this;

        if (state) {
            self.getContent('AAAAAQAAAAEAAAAVAw==')
                .then((data) => {
                    self.log("Successfully send POWER command.");
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.TVPower).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
                .catch((err) => {
                    self.log(self.name + ": Error: " + err);
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.TVPower).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
        } else {
            callback()
        }

    }

    setMute(state, callback) {

        var self = this;

        if (state) {
            self.getContent('AAAAAQAAAAEAAAAUAw==')
                .then((data) => {
                    self.log("Successfully send MUTE command.");
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.Mute).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
                .catch((err) => {
                    self.log(self.name + ": Error: " + err);
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.Mute).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
        } else {
            callback()
        }

    }

    setVolumeUp(state, callback) {

        var self = this;
        var counterror = 0;
        var error = "";

        if (state) {
            for (var i = 0; i < 5; i++) {
                self.getContent('AAAAAQAAAAEAAAASAw==')
                    .then((data) => {})
                    .catch((err) => {
                        error = err;
                        counterror += 1;
                    })
            }
            if (counterror != 0) {
                self.log("Volume Up Error: " + error);
            } else {
                self.log("Succesfully send VOLUME UP command.");
            }
            setTimeout(function() {
                self.Control.getCharacteristic(Characteristic.VolumeUp).updateValue(false);
            }, 500);
            callback()
        } else {
            callback()
        }

    }

    setVolumeDown(state, callback) {

        var self = this;
        var counterror = 0;
        var error = "";

        if (state) {
            for (var i = 0; i < 5; i++) {
                self.getContent('AAAAAQAAAAEAAAATAw==')
                    .then((data) => {})
                    .catch((err) => {
                        error = err;
                        counterror += 1;
                    })
            }
            if (counterror != 0) {
                self.log("Volume Down Error: " + error);
            } else {
                self.log("Succesfully send VOLUME DOWN command.");
            }
            setTimeout(function() {
                self.Control.getCharacteristic(Characteristic.VolumeDown).updateValue(false);
            }, 500);
            callback()
        } else {
            callback()
        }

    }

    setEnter(state, callback) {

        var self = this;

        if (state) {
            self.getContent('AAAAAQAAAAEAAAALAw==')
                .then((data) => {
                    self.log("Successfully send ENTER command.");
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.Enter).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
                .catch((err) => {
                    self.log(self.name + ": Error: " + err);
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.Enter).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
        } else {
            callback()
        }

    }

    setReturn(state, callback) {

        var self = this;

        if (state) {
            self.getContent('AAAAAgAAAJcAAAAjAw==')
                .then((data) => {
                    self.log("Successfully send RETURN command.");
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.Return).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
                .catch((err) => {
                    self.log(self.name + ": Error: " + err);
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.Return).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
        } else {
            callback()
        }

    }

    setHome(state, callback) {

        var self = this;

        if (state) {
            self.getContent('AAAAAQAAAAEAAABgAw==')
                .then((data) => {
                    self.log("Successfully send HOME command.");
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.Home).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
                .catch((err) => {
                    self.log(self.name + ": Error: " + err);
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.Home).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
        } else {
            callback()
        }

    }

    setExit(state, callback) {

        var self = this;

        if (state) {
            self.getContent('AAAAAQAAAAEAAABjAw==')
                .then((data) => {
                    self.log("Successfully send EXIT command.");
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.Exit).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
                .catch((err) => {
                    self.log(self.name + ": Error: " + err);
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.Exit).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
        } else {
            callback()
        }

    }

    setConfirm(state, callback) {

        var self = this;

        if (state) {
            self.getContent('AAAAAQAAAAEAAABlAw==')
                .then((data) => {
                    self.log("Successfully send CONFIRM command.");
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.Confirm).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
                .catch((err) => {
                    self.log(self.name + ": Error: " + err);
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.Confirm).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
        } else {
            callback()
        }

    }

    setChannelUp(state, callback) {

        var self = this;

        if (state) {
            self.getContent('AAAAAQAAAAEAAAAQAw==')
                .then((data) => {
                    self.log("Successfully send CHANNEL UP command.");
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.ChannelUp).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
                .catch((err) => {
                    self.log(self.name + ": Error: " + err);
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.ChannelUp).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
        } else {
            callback()
        }

    }

    setChannelDown(state, callback) {

        var self = this;

        if (state) {
            self.getContent('AAAAAQAAAAEAAAARAw==')
                .then((data) => {
                    self.log("Successfully send CHANNEL DOWN command.");
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.ChannelDown).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
                .catch((err) => {
                    self.log(self.name + ": Error: " + err);
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.ChannelDown).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
        } else {
            callback()
        }

    }

    setControlUp(state, callback) {

        var self = this;

        if (state) {
            self.getContent('AAAAAQAAAAEAAAB0Aw==')
                .then((data) => {
                    self.log("Successfully send CONTROL UP command.");
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.ControlUp).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
                .catch((err) => {
                    self.log(self.name + ": Error: " + err);
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.ControlUp).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
        } else {
            callback()
        }

    }

    setControlDown(state, callback) {

        var self = this;

        if (state) {
            self.getContent('AAAAAQAAAAEAAAB1Aw==')
                .then((data) => {
                    self.log("Successfully send CONTROL DOWN command.");
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.ControlDown).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
                .catch((err) => {
                    self.log(self.name + ": Error: " + err);
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.ControlDown).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
        } else {
            callback()
        }

    }

    setNetflixButton(state, callback) {

        var self = this;

        if (state) {
            self.getContent('AAAAAgAAABoAAAB8Aw==')
                .then((data) => {
                    self.log("Successfully send NETFLIX BUTTON command.");
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.NetflixButton).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
                .catch((err) => {
                    self.log(self.name + ": Error: " + err);
                    setTimeout(function() {
                        self.Control.getCharacteristic(Characteristic.NetflixButton).updateValue(false);
                    }, 500);
                    callback(null, false)
                })
        } else {
            callback()
        }

    }


}

module.exports = REMOTE
