var rp = require("request-promise");

class HDMI_REQ {

    constructor(psk, ipadress, uri, params, homeapp, cecuri, hdmiuri) {
        this.psk = psk;
        this.ipadress = ipadress;
        this.uri = uri;
        this.params = params;
        this.homeapp = homeapp;
        this.cecuri = cecuri;
        this.hdmiuri = hdmiuri;
    }

    inputs() {

        var self = this;

        this.sony = {

            token: null,

            get: function() {
                return rp({

                    "method": "POST",
                    "uri": "http://" + self.ipadress + "/sony/avContent",
                    "body": {
                        "method": "getCurrentExternalInputsStatus",
                        "params": ["1.0"],
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

        self.sony.token = self.params.token;
        return self.sony.get();

    }

    apps() {

        var self = this;

        this.sony = {

            token: null,

            get: function() {
                return rp({

                    "method": "POST",
                    "uri": "http://" + self.ipadress + "/sony/appControl",
                    "body": {
                        "method": "getApplicationList",
                        "params": ["1.0"],
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

        self.sony.token = self.params.token;
        return self.sony.get();

    }

    powerstate() {

        var self = this;

        this.sony = {

            token: null,

            get: function() {
                return rp({

                    "method": "POST",
                    "uri": "http://" + self.ipadress + "/sony/system",
                    "body": {
                        "method": "getPowerStatus",
                        "params": ["1.0"],
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

        self.sony.token = self.params.token;
        return self.sony.get();

    }

    poweron() {

        var self = this;

        this.sony = {

            token: null,

            get: function() {
                return rp({

                    "method": "POST",
                    "uri": "http://" + self.ipadress + "/sony/system",
                    "body": {
                        "method": "setPowerStatus",
                        "params": [{
                            "status": true
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

        self.sony.token = self.params.token;
        return self.sony.get();

    }

    poweroff() {

        var self = this;

        this.sony = {

            token: null,

            get: function() {
                return rp({

                    "method": "POST",
                    "uri": "http://" + self.ipadress + "/sony/system",
                    "body": {
                        "method": "setPowerStatus",
                        "params": [{
                            "status": false
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

        self.sony.token = self.params.token;
        return self.sony.get();

    }

    contentinfo() {

        var self = this;

        this.sony = {

            token: null,

            get: function() {
                return rp({

                    "method": "POST",
                    "uri": "http://" + self.ipadress + "/sony/avContent",
                    "body": {
                        "method": "getPlayingContentInfo",
                        "params": ["1.0"],
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

        self.sony.token = self.params.token;
        return self.sony.get();

    }

    setcontent() {

        var self = this;

        this.sony = {

            token: null,

            get: function() {
                return rp({

                    "method": "POST",
                    "uri": "http://" + self.ipadress + "/sony/avContent",
                    "body": {
                        "method": "setPlayContent",
                        "params": [{
                            "uri": self.uri
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

        self.sony.token = self.params.token;
        return self.sony.get();

    }

    sethdmi() {

        var self = this;

        this.sony = {

            token: null,

            get: function() {
                return rp({

                    "method": "POST",
                    "uri": "http://" + self.ipadress + "/sony/avContent",
                    "body": {
                        "method": "setPlayContent",
                        "params": [{
                            "uri": self.hdmiuri
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

        self.sony.token = self.params.token;
        return self.sony.get();

    }

    sethomeapp() {

        var self = this;

        this.sony = {

            token: null,

            get: function() {
                return rp({

                    "method": "POST",
                    "uri": "http://" + self.ipadress + "/sony/appControl",
                    "body": {
                        "method": "setActiveApp",
                        "params": [{
                            "uri": self.homeapp
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

        self.sony.token = self.params.token;
        return self.sony.get();

    }

    termapp() {

        var self = this;

        this.sony = {

            token: null,

            get: function() {
                return rp({

                    "method": "POST",
                    "uri": "http://" + self.ipadress + "/sony/appControl",
                    "body": {
                        "method": "terminateApps",
                        "params": ["1.0"],
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

        self.sony.token = self.params.token;
        return self.sony.get();

    }

    volume() {

        var self = this;

        this.sony = {

            token: null,

            get: function() {
                return rp({

                    "method": "POST",
                    "uri": "http://" + self.ipadress + "/sony/audio",
                    "body": {
                        "method": "getVolumeInformation",
                        "params": ["1.0"],
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

        self.sony.token = self.params.token;
        return self.sony.get();

    }

    muteoff() {

        var self = this;

        this.sony = {

            token: null,

            get: function() {
                return rp({

                    "method": "POST",
                    "uri": "http://" + self.ipadress + "/sony/audio",
                    "body": {
                        "method": "setAudioMute",
                        "params": [{
                            "status": true
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

        self.sony.token = self.params.token;
        return self.sony.get();

    }

    muteon() {

        var self = this;

        this.sony = {

            token: null,

            get: function() {
                return rp({

                    "method": "POST",
                    "uri": "http://" + self.ipadress + "/sony/audio",
                    "body": {
                        "method": "setAudioMute",
                        "params": [{
                            "status": false
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

        self.sony.token = self.params.token;
        return self.sony.get();

    }

}

module.exports = HDMI_REQ
