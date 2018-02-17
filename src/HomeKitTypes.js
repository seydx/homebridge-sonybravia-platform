var inherits = require("util").inherits;

module.exports = {
    registerWith: function(homebridge) {

        var Service = homebridge.hap.Service;
        var Characteristic = homebridge.hap.Characteristic;

        //Apps
        Service.AppService = function(displayName, subtype) {
            Service.call(this, displayName, "1d837d23-84f7-424a-91b9-0b1fe288e1d2", subtype);
        };
        inherits(Service.AppService, Service);

        Characteristic.TargetApp = function() {
            Characteristic.call(this, "Target App Nr", "613f5692-4713-4743-85ca-627e8f17d3bf");
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
        inherits(Characteristic.TargetApp, Characteristic);

        Characteristic.TargetName = function() {
            Characteristic.call(this, "Target App Name", "e2454387-a3e9-44a9-82f2-852f9628ecbc");
            this.setProps({
                format: Characteristic.Formats.STRING,
                perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
            });
            this.value = this.getDefaultValue();
        };
        inherits(Characteristic.TargetName, Characteristic);

    }
}
