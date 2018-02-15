var rp = require("request-promise"),
    async = require("async");
    
var HK_TYPES = require("./src/HomeKitTypes.js");

var Accessory, Service, Characteristic;

module.exports = function(homebridge) { 

    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerPlatform("homebridge-sonybravia-platform", "SonyBravia", SonyBraviaPlatform);    

}

function SonyBraviaPlatform(log, config, api){
    var platform = this; 
	
    //BASE
    this.config = config;
    this.log = log;
    this.name = config["name"];
    this.psk = config["psk"];
    this.ipadress = config["ipadress"];
    this.polling = config["polling"] === true;
    this.interval = (config['interval']*1000) || 2000;
    this.homeapp = config["homeapp"] || "";   
    this.uri = "";
    this.hdminame = "";
    this.maxVolume = config["maxVolume"] || 30;
    
    //CECs
    this.cecname = "";
    this.cecuri = "";
    this.cecport = "";
    this.ceclogaddr = "";
    this.cecs = config["cecs"] || [""];
    
    //APS
    this.appsEnabled = config["appsEnabled"] === true;
    this.apps = config["apps"] || [""];
    this.maxApps = "";
    
    HK_TYPES.registerWith(api);
}

SonyBraviaPlatform.prototype = {
	
    accessories: function(callback){ 
	    
	    var self = this;
	    var accessoriesArray = []
	    
	  	var hdmiSources = {
		  	
		  	token: null,
		  	
		  	getHDMI: function() {
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
				    "json":true
				  	
				});  	
			}	  	
		}
		
		function reqHDMI(params) {
		  hdmiSources.token = params.token;
		  return hdmiSources.getHDMI();
		}
		
	  	var appList = {
		  	
		  	token: null,
		  	
		  	getApps: function() {
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
				    "json":true
				  	
				});  	
			}	  	
		}
		
		function reqApps(params) {
		  appList.token = params.token;
		  return appList.getApps();
		}

	    //######################################## START ####################################################
	    
	    async.waterfall([
    
	        // set TV Switch
	        function (next){
	                var tvConfig = {
	                    uri: self.uri,
	                    name: self.name,
	               	    psk: self.psk,
	                    ipadress: self.ipadress,
	                    polling: self.polling,
	                    interval: self.interval,
	                    homeapp: self.homeapp
	                }
	                var tvAccessory = new TVSwitchAccessory(self.log, tvConfig)
	                accessoriesArray.push(tvAccessory);
	            next();
	        },
	        
	        // set APP Service
	  		function(next){
		  		
					reqApps({"token": process.argv[2]})
					.then(response => {
						
						self.maxApps = response.result[0].length;
						
		                var appListConfig = {
                                    name: self.name,
		               	    psk: self.psk,
		                    ipadress: self.ipadress,
		                    polling: self.polling,
		                    interval: self.interval,
		                    maxApps: self.maxApps
		                }
		                
		                var appListAccessory = new AppAccessory(self.log, appListConfig)
		                accessoriesArray.push(appListAccessory);
	
					})
				    .catch(err => {
						self.log("Could not retrieve Apps, error:" + err);
				    });
				    
				next();
			},
		    
		    //Push HDMI/CEC
	  		function(next){
		  		
		  		function fetchSources(next){
					
					reqHDMI({"token": process.argv[2]})
						.then(response => {
							
							var result = response.result[0];
							
							var hdmiArray = []
							var objArray = []
							
							for(var i = 0; i < result.length; i++){
								if(result[i].title.match("HDMI")){
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
	                                    polling: self.polling,
	                                    interval: self.interval,
	                                    homeapp: self.homeapp
	                                }
									
									if(self.config.cecs){
								        self.config.cecs.forEach(function(cecswitch, index, array){
							                   
							                if(element.uri.match(cecswitch.port)){
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
							self.log("Could not retrieve Source Inputs, error:" + err);
							self.log("Fetching Source Input failed - Trying again...");
							setTimeout(function(){
								fetchSources(next)
	                     	}, 10000)
					    });	  	
				
				}		  	
				fetchSources(next)
			},
			
	        // Create HDMI/CEC Accessories  
	        function(hdmiArray, next){
		          
		        async.forEachOf(hdmiArray, function (zone, key, step) {
			          
			        function pushMyAccessories(step){
				        
				        if(zone.cecname){
				        	self.log("Found Source: " + zone.cecname);
				        } else {
					        self.log("Found Source: " + zone.name);
				        }
					        
						var hdmiAccessory = new SonySourceAccessory(self.log, zone)
						accessoriesArray.push(hdmiAccessory);
						step()
				
					} pushMyAccessories(step)
				},	function(err){
					if (err) next(err)
					else next()
				})
	
			},
			
	        // set Home App Switch
	        function (next){
                var homeConfig = {
                    uri: self.uri,
                    name: self.name,
               	    psk: self.psk,
                    ipadress: self.ipadress,
                    polling: self.polling,
                    interval: self.interval,
                    homeapp: self.homeapp
                }
                var homeAccessory = new HomeAppAccessory(self.log, homeConfig)
                accessoriesArray.push(homeAccessory);
            next();
	        },
	        
	        // set Volume Control
	        function (next){
	                var volConfig = {
	                    uri: self.uri,
	                    name: self.name,
	               	    psk: self.psk,
	                    ipadress: self.ipadress,
	                    polling: self.polling,
	                    interval: self.interval,
	                    maxVolume: self.maxVolume
	                }
	                var volAccessory = new VolumeAccessory(self.log, volConfig)
	                accessoriesArray.push(volAccessory);
				next();
	        }
			
			], 
			
			function(err, result){
				if(err) callback(err)
				else callback(accessoriesArray);
          	}
          	
       )
       
    }//END accesories
}

/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/
/*******************************************************************      Sony Bravia      **************************************************************/
/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/

function SonySourceAccessory(log, config){
	
    var accessory = this;

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

    this.informationService = new Service.AccessoryInformation()
        .setCharacteristic(Characteristic.Manufacturer, 'Sony')
        .setCharacteristic(Characteristic.Model, 'Sony Bravia Source Control')
        .setCharacteristic(Characteristic.SerialNumber, 'Bravia Serial Number');
    
    if(this.cecname){
	    this.uri = this.cecuri;
	    this.name = config.name + " " + this.cecname;
    }
    
	this.SourceSwitch = new Service.Switch(this.name);

    this.SourceSwitch.getCharacteristic(Characteristic.On)
        .on('get', this.getSourceSwitch.bind(this))
        .on('set', this.setSourceSwitch.bind(this));

	//SIMPLE POLLING
	
	if(this.polling){
		(function poll(){
			setTimeout(function(){
				accessory.SourceSwitch.getCharacteristic(Characteristic.On).getValue();
				poll()
			}, accessory.interval)
		})();
	}

	//REQUEST PROMISE LIST
 
  	this.PowerStatus = {
	  	
	  	token: null,
	  	
	  	getPower: function() {
		  	return rp({
			  	
			    "method": "POST",
			    "uri": "http://" + accessory.ipadress + "/sony/system",
			    "body": {
				  "method": "getPowerStatus",
				  "params": ["1.0"],
				  "id": 1,
				  "version": "1.0"
			    },
			    "headers": {
				    "X-Auth-PSK": accessory.psk
			    },
			    "json":true
			  	
			});  	
		}	  	
	}
	
	this.reqPower = function(params) {
	  accessory.PowerStatus.token = params.token;
	  return accessory.PowerStatus.getPower();
	}
	
  	this.PowerON = {
	  	
	  	token: null,
	  	
	  	setPowerOn: function() {
		  	return rp({
			  	
			    "method": "POST",
			    "uri": "http://" + accessory.ipadress + "/sony/system",
			    "body": {
				  "method": "setPowerStatus",
				  "params": [{"status": true}],
				  "id": 1,
				  "version": "1.0"
			    },
			    "headers": {
				    "X-Auth-PSK": accessory.psk
			    },
			    "json":true
			  	
			});  	
		}	  	
	}
	
	this.reqPowerON = function(params) {
	  accessory.PowerON.token = params.token;
	  return accessory.PowerON.setPowerOn();
	}
	
  	this.SourceStatus = {
	  	
	  	token: null,
	  	
	  	getSourceStatus: function() {
		  	return rp({
			  	
			    "method": "POST",
			    "uri": "http://" + accessory.ipadress + "/sony/avContent",
			    "body": {
				  "method": "getPlayingContentInfo",
				  "params": ["1.0"],
				  "id": 1,
				  "version": "1.0"
			    },
			    "headers": {
				    "X-Auth-PSK": accessory.psk
			    },
			    "json":true
			  	
			});  	
		}	  	
	}
	
	this.reqSource = function(params) {	
	  accessory.SourceStatus.token = params.token;
	  return accessory.SourceStatus.getSourceStatus();
	}
	
  	this.TargetSource = {
	  	
	  	token: null,
	  	
	  	setTargetSource: function() {
		  	return rp({
			  	
			    "method": "POST",
			    "uri": "http://" + accessory.ipadress + "/sony/avContent",
			    "body": {
				  "method": "setPlayContent",
				  "params": [{"uri": accessory.uri}],
				  "id": 1,
				  "version": "1.0"
			    },
			    "headers": {
				    "X-Auth-PSK": accessory.psk
			    },
			    "json":true
			  	
			});  	
		}	  	
	}
	
	this.reqTargetSource = function(params) {	
	  accessory.TargetSource.token = params.token;
	  return accessory.TargetSource.setTargetSource();
	}
	
  	this.HomeAPP = {
	  	
	  	token: null,
	  	
	  	setHomeAPP: function() {
		  	return rp({
			  	
			    "method": "POST",
			    "uri": "http://" + accessory.ipadress + "/sony/appControl",
			    "body": {
				  "method": "setActiveApp",
				  "params": [{"uri": accessory.homeapp}],
				  "id": 1,
				  "version": "1.0"
			    },
			    "headers": {
				    "X-Auth-PSK": accessory.psk
			    },
			    "json":true
			  	
			});  	
		}	  	
	}
	
	this.reqHomeAPP = function(params) {
	  accessory.HomeAPP.token = params.token;
	  return accessory.HomeAPP.setHomeAPP();
	}
 
}

/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/
/*******************************************************************      GET      **********************************************************************/
/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/

SonySourceAccessory.prototype.getServices = function(){
   return [this.informationService, this.SourceSwitch];
}

SonySourceAccessory.prototype._getCurrentState = function(callback){
	
	var self = this;
	
    self.reqSource({"token": process.argv[2]})
	.then(response => {
		
		var state = JSON.stringify(response);
        callback(null, state);
		
	})
    .catch(err => {
    	self.log("Could not retrieve status from " + self.name + "; error: " + err);
		callback(err)
    });	
	
}

SonySourceAccessory.prototype.getSourceSwitch = function(callback){
	
    var self = this;
	
    self._getCurrentState(function(err, state) {
	        
        if (err) callback (err)
        else {
	        
	        self.reqPower({"token": process.argv[2]})
			.then(response => {
				
				var currentPower = response.result[0].status;
			  	var formatName = self.name.split("/")[0]
			  	
			  	var newName = self.name;
			  	
			  	if(self.cecname){
				  	self.name = self.cecname;
				  	newName = "HDMI " + self.cecport;
				  	formatName = newName.split("/")[0]
			  	} else {
				  	self.name = self.hdminame;
			  	}
			  	
				if(currentPower == "active"){
					
					self.log("STATE: " + state);
					self.log("NAME: " + self.name);
					self.log("newName: " + newName);
					self.log("formatName: " + formatName);
					
					if(state.match(self.name)||state.match(formatName)||state.match(newName)){
						callback(null, true)
					} else {
						callback(null, false)
					}
					
				}else if(currentPower == "standby"){
					callback(null, false)
				} else {
					self.log("Could not determine TV Status!")
					callback(null, false)
				}	
				
				
			})
		    .catch(err => {
				self.log("Could not retrieve Source Status, error:" + err);
				callback(err)
		    });	 
				      	
        }
    })
	
}

/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/
/*******************************************************************      SET      **********************************************************************/
/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/

SonySourceAccessory.prototype.setSourceSwitch = function(state, callback){
	
	var self = this;
		
		if(state){
			
	        self.reqPower({"token": process.argv[2]})
			.then(response => {
				
				var currentPower = response.result[0].status;	
				
				if (currentPower == "active"){
					
					//TV ON - ACTIVATE SOURCE
					self.reqTargetSource({"token": process.argv[2]})
					.then(response => {
						
			            self.log("Activate " + self.name);
			            callback(null, true)
					})
				    .catch(err => {
		                self.log("Cant set Source On (status code %s): %s", response.statusCode, err);
		                callback(err)
				    });
					    
				} else {
					
					// TV IS OFF - TURN ON
					self.reqPowerON({"token": process.argv[2]})
					.then(response => {
						
			            self.log("Turning on the TV");
			            
					})
				    .catch(err => {
		                self.log("Cant set TV On (status code %s): %s", response.statusCode, err);
		                callback(err)
				    });
				  	
				  	self._getCurrentState(function(err, state) {
					  	
					  	var newName = self.name;
					  	var formatName = self.name.split("/")[0]
					  	
					  	if(self.cecname){
						  	var newName = "HDMI " + self.port;
						  	var formatName = newName.split("/")[0]
					  	}
					  	
						if(state.match(self.name)||state.match(formatName)||state.match(newName)){
							self.log(self.name + " already on");
							
							callback(null, true)
							
						} else {
							self.log("Turn ON: " + self.name);
							
							// TV ON NOW - ACTIVATE SOURCE
							self.reqTargetSource({"token": process.argv[2]})
							.then(response => {
								
					            self.log("Activate " + self.name);
					            callback(null, true)
							})
						    .catch(err => {
				                self.log("Cant set Source On (status code %s): %s", response.statusCode, err);
				                callback(err)
						    });
							
						}
					  	
					})
					
				}
			})	
		    .catch(err => {
                self.log("Cant get TV status (status code %s): %s", response.statusCode, err);
                callback(err)
		    });	
		    
		} else {
			
			//TURN TO HOMEAPP
			self.reqHomeAPP({"token": process.argv[2]})
			.then(response => {
				
	            self.log("Turn OFF: " + self.name);
	            callback(null, false)
	            
			})
		    .catch(err => {
                self.log("Cant set HOMEAPP On (status code %s): %s", response.statusCode, err);
                callback(err)
		    });
		    
		}
  	
}

/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/
/**************************************************************      TV Switch      ******************************************************************/
/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/

function TVSwitchAccessory(log, config){
	
    var accessory = this;

    this.log = log;
    this.name = config.name + " Power";
    this.psk = config.psk;
    this.ipadress = config.ipadress;
    this.polling = config.polling;
    this.interval = config.interval;
    this.uri = config.uri;
    this.homeapp = config.homeapp;

    this.informationService = new Service.AccessoryInformation()
        .setCharacteristic(Characteristic.Manufacturer, 'Sony')
        .setCharacteristic(Characteristic.Model, 'Sony Bravia TV')
        .setCharacteristic(Characteristic.SerialNumber, 'Bravia Serial Number');
        
    this.TVSwitch = new Service.Switch(this.name);

    this.TVSwitch.getCharacteristic(Characteristic.On)
        .on('get', this.getTVSwitch.bind(this))
        .on('set', this.setTVSwitch.bind(this));
 
	if(this.polling){
		(function poll(){
			setTimeout(function(){
				accessory.TVSwitch.getCharacteristic(Characteristic.On).getValue();
				poll()
			}, accessory.interval)
		})();
	}
      
    //REQUEST PROMISE LIST
    
  	this.PowerStatus = {
	  	
	  	token: null,
	  	
	  	getPower: function() {
		  	return rp({
			  	
			    "method": "POST",
			    "uri": "http://" + accessory.ipadress + "/sony/system",
			    "body": {
				  "method": "getPowerStatus",
				  "params": ["1.0"],
				  "id": 1,
				  "version": "1.0"
			    },
			    "headers": {
				    "X-Auth-PSK": accessory.psk
			    },
			    "json":true
			  	
			});  	
		}	  	
	}
	
	this.reqPower = function(params) {
	  accessory.PowerStatus.token = params.token;
	  return accessory.PowerStatus.getPower();
	}
	
  	this.PowerON = {
	  	
	  	token: null,
	  	
	  	setPowerOn: function() {
		  	return rp({
			  	
			    "method": "POST",
			    "uri": "http://" + accessory.ipadress + "/sony/system",
			    "body": {
				  "method": "setPowerStatus",
				  "params": [{"status": true}],
				  "id": 1,
				  "version": "1.0"
			    },
			    "headers": {
				    "X-Auth-PSK": accessory.psk
			    },
			    "json":true
			  	
			});  	
		}	  	
	}
	
	this.reqPowerON = function(params) {
	  accessory.PowerON.token = params.token;
	  return accessory.PowerON.setPowerOn();
	}
	
  	this.PowerOFF = {
	  	
	  	token: null,
	  	
	  	setPowerOff: function() {
		  	return rp({
			  	
			    "method": "POST",
			    "uri": "http://" + accessory.ipadress + "/sony/system",
			    "body": {
				  "method": "setPowerStatus",
				  "params": [{"status": false}],
				  "id": 1,
				  "version": "1.0"
			    },
			    "headers": {
				    "X-Auth-PSK": accessory.psk
			    },
			    "json":true
			  	
			});  	
		}	  	
	}
	
	this.reqPowerOFF = function(params) {
	  accessory.PowerOFF.token = params.token;
	  return accessory.PowerOFF.setPowerOff();
	}
}

/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/
/*******************************************************************      GET      **********************************************************************/
/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/

TVSwitchAccessory.prototype.getServices = function(){
   return [this.informationService, this.TVSwitch];
}

TVSwitchAccessory.prototype.getTVSwitch = function(callback){
	
	var self = this;
	
	self.reqPower({"token": process.argv[2]})
	.then(response => {
		
		var currentPower = response.result[0].status;
	  	
		if(currentPower == "active"){
			callback(null, true)
		}else if(currentPower == "standby"){
			callback(null, false)
		} else {
			self.log("Could not determine TV Status!")
			callback(null, false)
		}	
		
	})
    .catch(err => {
		self.log("Could not retrieve TV Status, error:" + err);
		callback(err)
    });	 
    
}

/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/
/*******************************************************************      SET      **********************************************************************/
/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/

TVSwitchAccessory.prototype.setTVSwitch = function(state, callback){
	
	var self = this;
	
	if(state){
		// TURN ON
		self.reqPowerON({"token": process.argv[2]})
		.then(response => {
			
	        self.log("Turning on the TV");
	        callback(null, true)
	        
		})
	    .catch(err => {
	        self.log("Cant set TV On (status code %s): %s", response.statusCode, err);
	        callback(err)
	    });
	} else {
		// TURN OFF
		self.reqPowerOFF({"token": process.argv[2]})
		.then(response => {
			
	        self.log("Turning off the TV");
	        callback(null, false)
	        
		})
	    .catch(err => {
	        self.log("Cant set TV Off (status code %s): %s", response.statusCode, err);
	        callback(err)
	    });
	}
	
}

/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/
/*******************************************************************      Sony Bravia HOME     **********************************************************/
/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/

function HomeAppAccessory(log, config){
	
    var accessory = this;

    this.log = log;
    this.name = config.name + " Home";
    this.psk = config.psk;
    this.ipadress = config.ipadress;
    this.polling = config.polling;
    this.interval = config.interval;
    this.uri = config.uri;
    this.homeapp = config.homeapp;

    this.informationService = new Service.AccessoryInformation()
        .setCharacteristic(Characteristic.Manufacturer, 'Sony')
        .setCharacteristic(Characteristic.Model, 'Sony Bravia Home App')
        .setCharacteristic(Characteristic.SerialNumber, 'Bravia Serial Number');
    
	this.HomeSwitch = new Service.Switch(this.name);

    this.HomeSwitch.getCharacteristic(Characteristic.On)
        .on('get', this.getHomeSwitch.bind(this))
        .on('set', this.setHomeSwitch.bind(this));

	//SIMPLE POLLING
	
	if(this.polling){
		(function poll(){
			setTimeout(function(){
				accessory.HomeSwitch.getCharacteristic(Characteristic.On).getValue();
				poll()
			}, accessory.interval)
		})();
	}
	

	//REQUEST PROMISE LIST
	
  	this.PowerStatus = {
	  	
	  	token: null,
	  	
	  	getPower: function() {
		  	return rp({
			  	
			    "method": "POST",
			    "uri": "http://" + accessory.ipadress + "/sony/system",
			    "body": {
				  "method": "getPowerStatus",
				  "params": ["1.0"],
				  "id": 1,
				  "version": "1.0"
			    },
			    "headers": {
				    "X-Auth-PSK": accessory.psk
			    },
			    "json":true
			  	
			});  	
		}	  	
	}
	
	this.reqPower = function(params) {
	  accessory.PowerStatus.token = params.token;
	  return accessory.PowerStatus.getPower();
	}
	
	
  	this.SourceStatus = {
	  	
	  	token: null,
	  	
	  	getSourceStatus: function() {
		  	return rp({
			  	
			    "method": "POST",
			    "uri": "http://" + accessory.ipadress + "/sony/avContent",
			    "body": {
				  "method": "getPlayingContentInfo",
				  "params": ["1.0"],
				  "id": 1,
				  "version": "1.0"
			    },
			    "headers": {
				    "X-Auth-PSK": accessory.psk
			    },
			    "json":true
			  	
			});  	
		}	  	
	}
	
	
	this.reqSource = function(params) {	
	  accessory.SourceStatus.token = params.token;
	  return accessory.SourceStatus.getSourceStatus();
	}
	
  	this.PowerON = {
	  	
	  	token: null,
	  	
	  	setPowerOn: function() {
		  	return rp({
			  	
			    "method": "POST",
			    "uri": "http://" + accessory.ipadress + "/sony/system",
			    "body": {
				  "method": "setPowerStatus",
				  "params": [{"status": true}],
				  "id": 1,
				  "version": "1.0"
			    },
			    "headers": {
				    "X-Auth-PSK": accessory.psk
			    },
			    "json":true
			  	
			});  	
		}	  	
	}
	
	this.reqPowerON = function(params) {
	  accessory.PowerON.token = params.token;
	  return accessory.PowerON.setPowerOn();
	}
	
  	this.HomeAPP = {
	  	
	  	token: null,
	  	
	  	setHomeAPP: function() {
		  	return rp({
			  	
			    "method": "POST",
			    "uri": "http://" + accessory.ipadress + "/sony/appControl",
			    "body": {
				  "method": "setActiveApp",
				  "params": [{"uri": accessory.homeapp}],
				  "id": 1,
				  "version": "1.0"
			    },
			    "headers": {
				    "X-Auth-PSK": accessory.psk
			    },
			    "json":true
			  	
			});  	
		}	  	
	}
	
	this.reqHomeAPP = function(params) {
	  accessory.HomeAPP.token = params.token;
	  return accessory.HomeAPP.setHomeAPP();
	}
	
  	this.TermApp = {
	  	
	  	token: null,
	  	
	  	delApp: function() {
		  	return rp({
			  	
			    "method": "POST",
			    "uri": "http://" + accessory.ipadress + "/sony/appControl",
			    "body": {
				  "method": "terminateApps",
				  "params": ["1.0"],
				  "id": 1,
				  "version": "1.0"
			    },
			    "headers": {
				    "X-Auth-PSK": accessory.psk
			    },
			    "json":true
			  	
			});  	
		}	  	
	}
	
	this.reqDelApp = function(params) {
	  accessory.TermApp.token = params.token;
	  return accessory.TermApp.delApp();
	}
 
}

/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/
/*******************************************************************      GET      **********************************************************************/
/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/

HomeAppAccessory.prototype.getServices = function(){
   return [this.informationService, this.HomeSwitch];
}

HomeAppAccessory.prototype._getCurrentState = function(callback){
	
	var self = this;
	
    self.reqSource({"token": process.argv[2]})
	.then(response => {
		
		var state = JSON.stringify(response);
        callback(null, state);
		
	})
    .catch(err => {
    	self.log("Could not retrieve status from " + self.name + "; error: " + err);
		callback(err)
    });	
	
}

HomeAppAccessory.prototype.getHomeSwitch = function(callback){
	
    var self = this;
	
    self._getCurrentState(function(err, state) {
	        
        if (err) callback (err)
        else {
	        
	        self.reqPower({"token": process.argv[2]})
			.then(response => {
				
				var currentPower = response.result[0].status;
			  	
				if(currentPower == "active"){
					if(state.match("Illegal State")){
						callback(null, true)
					} else {
						callback(null, false)
					}
					
				}else if(currentPower == "standby"){
					callback(null, false)
				} else {
					self.log("Could not determine TV Status!")
					callback(null, false)
				}	
				
				
			})
		    .catch(err => {
				self.log("Could not retrieve TV Status, error: " + err);
				callback(err)
		    });	 
				      	
        }
    })
	
}

/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/
/*******************************************************************      SET      **********************************************************************/
/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/

HomeAppAccessory.prototype.setHomeSwitch = function(state, callback){
	
	var self = this;
	
		if(state){
			
	        self.reqPower({"token": process.argv[2]})
			.then(response => {
				
				var currentPower = response.result[0].status;	
				
				if (currentPower == "active"){
					
					//TV ON - ACTIVATE APP
					self.reqHomeAPP({"token": process.argv[2]})
					.then(response => {
						
			            self.log("Turn ON: " + self.name);
			            callback(null, true)
			            
					})
				    .catch(err => {
		                self.log("Cant set " + self.name + " On: " + err);
		                callback(err)
				    });
					    
				} else {
					
					// TV IS OFF - TURN ON
					self.reqPowerON({"token": process.argv[2]})
					.then(response => {
						
			            self.log("Turning on the TV");
			            
					})
				    .catch(err => {
		                self.log("Cant set TV On: " + err);
		                callback(err)
				    });
				  	
					//TV ON - ACTIVATE APP
					self.reqHomeAPP({"token": process.argv[2]})
					.then(response => {
						
			            self.log("Turn ON: " + self.name);
			            callback(null, true)
			            
					})
				    .catch(err => {
		                self.log("Cant set " + self.name + " On: " + err);
		                callback(err)
				    });
					
				}
			})	
		    .catch(err => {
                self.log("Cant get TV status: " + err);
                callback(err)
		    });	
		    
		} else {
			
			//TURN OFF
			self.reqDelApp({"token": process.argv[2]})
			.then(response => {
				
	            self.log("Turn OFF: " + self.name);
	            
	            callback(null, false)
	            
			})
		    .catch(err => {
                self.log("Cant turn off " + self.name + " On: " + err);
                callback(err)
		    });
		    
		}
}

/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/
/*******************************************************************      Sony Bravia Apps     **********************************************************/
/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/

function AppAccessory(log, config) {
	
	var accessory = this;
	
	this.log = log;
	this.name = config.name + " Apps";
	this.psk = config.psk;
	this.ipadress = config.ipadress;
	this.polling = config.polling;
	this.interval = config.interval;
	this.maxApps = config.maxApps;

	this.informationService = new Service.AccessoryInformation();
	this.informationService.setCharacteristic(Characteristic.Manufacturer, "Sony Bravia Apps");
	this.informationService.setCharacteristic(Characteristic.Model, "Sony Bravia Model");

	this.AppService = new Service.AppService(this.name);

	this.AppService.addCharacteristic(Characteristic.TargetApp);
	this.AppService.getCharacteristic(Characteristic.TargetApp)
			.setProps({
				maxValue: accessory.maxApps,
				minValue: 0,
				minStep: 1
			})
            .on("get", this.getTargetApp.bind(this))
            .on("set", this.setTargetApp.bind(this));
            
	(function poll(){
		setTimeout(function(){
			accessory.AppService.getCharacteristic(Characteristic.TargetApp).getValue();
			poll()
		}, 15000)
	})();    

	this.AppService.addCharacteristic(Characteristic.TargetName);
	this.AppService.getCharacteristic(Characteristic.TargetName)
            .on("get", this.getTargetAppName.bind(this));
            
	(function poll(){
		setTimeout(function(){
			accessory.AppService.getCharacteristic(Characteristic.TargetName).getValue();
			poll()
		}, accessory.interval)
	})();

  	this.appList = {
	  	
	  	token: null,
	  	
	  	getApps: function() {
		  	return rp({
			  	
			    "method": "POST",
			    "uri": "http://" + accessory.ipadress + "/sony/appControl",
			    "body": {
				  "method": "getApplicationList",
				  "params": ["1.0"],
				  "id": 1,
				  "version": "1.0"
			    },
			    "headers": {
				    "X-Auth-PSK": accessory.psk
			    },
			    "json":true
			  	
			});  	
		}	  	
	}
	
	this.reqApps = function(params) {
	  accessory.appList.token = params.token;
	  return accessory.appList.getApps();
	}
	
	accessory.reqApps({"token": process.argv[2]})
	.then(response => {
		
		var name = response.result[0];
		var apps = response.result[0].length;
			
			
		console.log("Following, a list of all installed Apps on the TV to create awesome scenes! Have fun.");
	    for (var i = 0; i < apps; i++){
	        console.log("App: " + name[i].title + " - Number: " + i);
	    }		

	})
	.catch(err => {
        console.log(err)
    });

}

/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/
/*******************************************************************      GET      **********************************************************************/
/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/

AppAccessory.prototype.getServices = function(){
   return [this.informationService, this.AppService];
}

AppAccessory.prototype.getTargetApp = function(callback){
	
	var self = this;
	var tarValue = self.AppService.getCharacteristic(Characteristic.TargetApp).value;
	
	if(tarValue != null || tarValue != undefined || tarValue != ""){
		callback(false, tarValue)
	}else {
		callback(false, 0)
	}
}

AppAccessory.prototype.getTargetAppName = function(callback){

	var self = this;
	var tarValue = self.AppService.getCharacteristic(Characteristic.TargetApp).value;
	
	self.appName = "";
	
	self.reqApps({"token": process.argv[2]})
	.then(response => {
	
		var name = response.result[0];
		var apps = response.result[0].length;
		
		for (var i = 0; i <= apps; i++){
		 
			switch (i)                        
			{
			    case tarValue:                        
		        	self.appName = name[i].title
					break;   
			}
			 
		}		
		callback(false, self.appName)
		
	})
	.catch(err => {
		console.log(err)
		callback(false, "ERROR")
	});

}

/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/
/*******************************************************************      SET      **********************************************************************/
/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/

AppAccessory.prototype.setTargetApp = function(value, callback){

	var self = this;
	
	self.appName = "";
	self.appUri = "";

	self.reqApps({"token": process.argv[2]})
	.then(response => {
	
		var name = response.result[0];
		var apps = response.result[0].length;

		for (var i = 0; i <= apps; i++){
	 
			switch (i)                        
			{
			    case value:
			    	self.appName = name[i].title
		        	self.appUri = name[i].uri
					break;
			}
		
		}
		
	  	HomeAPP = {
		  	
		  	token: null,
		  	
		  	setHomeAPP: function() {
			  	return rp({
				  	
				    "method": "POST",
				    "uri": "http://" + self.ipadress + "/sony/appControl",
				    "body": {
					  "method": "setActiveApp",
					  "params": [{"uri": self.appUri}],
					  "id": 1,
					  "version": "1.0"
				    },
				    "headers": {
					    "X-Auth-PSK": self.psk
				    },
				    "json":true
				  	
				});  	
			}	  	
		}
		
		reqHomeAPP = function(params) {
		  HomeAPP.token = params.token;
		  return HomeAPP.setHomeAPP();
		}	
		
		reqHomeAPP({"token": process.argv[2]})
		.then(response => {
		
			self.log("Activate: " + self.appName);
            callback()
					
		})
		.catch(err => {
			console.log(err)
            callback()
		});
		
		
	})
	.catch(err => {
		console.log(err)
		callback()
	});

}

/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/
/*******************************************************************      Sony Bravia Volume     ********************************************************/
/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/

function VolumeAccessory(log, config) {
	
	var accessory = this;
	
	this.log = log;
	this.name = config.name + " Volume";
	this.psk = config.psk;
	this.ipadress = config.ipadress;
	this.polling = config.polling;
	this.interval = config.interval;
	this.maxVolume = config.maxVolume;

	this.informationService = new Service.AccessoryInformation();
	this.informationService.setCharacteristic(Characteristic.Manufacturer, "Sony Bravia Volume Control");
	this.informationService.setCharacteristic(Characteristic.Model, "Sony Bravia Model");

	this.VolumeBulb = new Service.Lightbulb(this.name);
	
	this.VolumeBulb.getCharacteristic(Characteristic.On)
		.on('get', this.getMuteState.bind(this))
        .on('set', this.setMuteState.bind(this));
        
	if(this.polling){
		(function poll(){
			setTimeout(function(){
				accessory.VolumeBulb.getCharacteristic(Characteristic.On).getValue();
				poll()
			}, accessory.interval)
		})();
	}  
        
    this.VolumeBulb.addCharacteristic(new Characteristic.Brightness())
	    .setProps({
		    maxValue: 30,
		    minValue: 0,
		    minStep: 1
	  	})
        .on('get', this.getVolume.bind(this))
        .on('set', this.setVolume.bind(this));
        
    //SIMPLE POLLING
    
	if(this.polling){
		(function poll(){
			setTimeout(function(){
				accessory.VolumeBulb.getCharacteristic(Characteristic.Brightness).getValue();
				poll()
			}, accessory.interval)
		})();
	}
        
    //REQUEST PROMISE LIST 
        
  	this.PowerStatus = {
	  	
	  	token: null,
	  	
	  	getPower: function() {
		  	return rp({
			  	
			    "method": "POST",
			    "uri": "http://" + accessory.ipadress + "/sony/system",
			    "body": {
				  "method": "getPowerStatus",
				  "params": ["1.0"],
				  "id": 1,
				  "version": "1.0"
			    },
			    "headers": {
				    "X-Auth-PSK": accessory.psk
			    },
			    "json":true
			  	
			});  	
		}	  	
	}
	
	this.reqPower = function(params) {
	  accessory.PowerStatus.token = params.token;
	  return accessory.PowerStatus.getPower();
	}
        
	this.volume = {
		
		token: null,
		
		getVolume: function() {
			
			return rp({
					
			    "method": "POST",
			    "uri": "http://" + accessory.ipadress + "/sony/audio",
			    "body": {
				  "method": "getVolumeInformation",
				  "params": ["1.0"],
				  "id": 1,
				  "version": "1.0"
			    },
			    "headers": {
				    "X-Auth-PSK": accessory.psk
			    },
			    "json":true
			    
			});
			
		}
		
	}
	
	this.reqVolume = function(params) {
	  accessory.volume.token = params.token;
	  return accessory.volume.getVolume();
	}
	
	this.muteOff = {
		
		token: null,
		
		setMuteOff: function() {
			
			return rp({
					
			    "method": "POST",
			    "uri": "http://" + accessory.ipadress + "/sony/audio",
			    "body": {
				  "method": "setAudioMute",
				  "params": [{"status":true}],
				  "id": 1,
				  "version": "1.0"
			    },
			    "headers": {
				    "X-Auth-PSK": accessory.psk
			    },
			    "json":true
			    
			});
			
		}
		
	}
	
	this.reqMuteOff = function(params) {
	  accessory.muteOff.token = params.token;
	  return accessory.muteOff.setMuteOff();
	}
	
	this.muteOn = {
		
		token: null,
		
		setMuteOn: function() {
			
			return rp({
					
			    "method": "POST",
			    "uri": "http://" + accessory.ipadress + "/sony/audio",
			    "body": {
				  "method": "setAudioMute",
				  "params": [{"status":false}],
				  "id": 1,
				  "version": "1.0"
			    },
			    "headers": {
				    "X-Auth-PSK": accessory.psk
			    },
			    "json":true
			    
			});
			
		}
		
	}
	
	this.reqMuteOn = function(params) {
	  accessory.muteOn.token = params.token;
	  return accessory.muteOn.setMuteOn();
	}

}

/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/
/*******************************************************************      GET      **********************************************************************/
/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/

VolumeAccessory.prototype.getServices = function(){
   return [this.informationService, this.VolumeBulb];
}

VolumeAccessory.prototype.getMuteState = function(callback){
	
	var self = this;
	
	self.mute = false;
	
	self.reqPower({"token": process.argv[2]})
	.then(response => {
		
		var currentPower = response.result[0].status;	
		
		if (currentPower == "active"){
			
			self.reqVolume({"token": process.argv[2]})
			.then(response => {
				
				var name = response.result[0];
				
				for(var i = 0; i < name.length; i++){
					
					if(name[i].target.match("speaker")){
						
						self.mute = name[i].mute == false;
						
					}
						
				}
				
				callback(false, self.mute)
			
			})
			.catch(err => {
		        console.log(err)
		        callback(false, false)
		    });
			
		} else {
			
			callback(false, false)
			
		}   
		  
	})
    .catch(err => {
        self.log("Cant get TV State: " + err);
        callback(false, 0)
    });
	
}

VolumeAccessory.prototype.getVolume = function(callback){

	var self = this;
	
	self.currentVolume = false;
	
	self.reqPower({"token": process.argv[2]})
	.then(response => {
		
		var currentPower = response.result[0].status;	
		
		if (currentPower == "active"){
			
			self.reqVolume({"token": process.argv[2]})
			.then(response => {
				
				var name = response.result[0];
				
				for(var i = 0; i < name.length; i++){
					
					if(name[i].target.match("speaker")){
						
						self.currentVolume = name[i].volume;
						
					}
						
				}
				
				callback(false, self.currentVolume)
			
			})
			.catch(err => {
		        console.log(err)
		        callback(false, 0)
		    });
			
		} else {
			
			callback(false, 0)
			
		}   
		  
	})
    .catch(err => {
        self.log("Cant get TV State: " + err);
        callback(false, 0)
    });
}

/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/
/*******************************************************************      SET      **********************************************************************/
/********************************************************************************************************************************************************/
/********************************************************************************************************************************************************/

VolumeAccessory.prototype.setMuteState = function(state, callback){

	var self = this;
	
	if(state){
		
		
		self.reqPower({"token": process.argv[2]})
		.then(response => {
			
			var currentPower = response.result[0].status;	
			
			if (currentPower == "active"){
			
				self.reqMuteOn({"token": process.argv[2]})
				.then(response => {
					self.log("Activate: " + self.name);
					
					
					self.VolumeBulb.setVolume(self.volumeBeforeMute, this.volume)
					this.volume = self.volumeBeforeMute
					
					
		            callback(false, true)
		        })
			    .catch(err => {
			        self.log("Cant get Mute State: " + err);
			        callback(false, false)
			    });  
			    
			}else{
				
				self.log("Can't set mute state, TV is OFF");
		        callback(false, false)
				
			}
            
        })
	    .catch(err => {
	        self.log("Cant get TV State: " + err);
	        callback(false, false)
	    });  
	    
	}else{
		
		self.reqMuteOff({"token": process.argv[2]})
		.then(response => {
		
			self.log("Deactivate: " + self.name);
            callback(false, false)
					
		})
		.catch(err => {
			self.log("Cant disable Volume: " + err);
            callback()
		});
		
	}
	
}

VolumeAccessory.prototype.setVolume = function(value, callback){

	var self = this;
	
    var newValue = value.toString();
	
	self.reqPower({"token": process.argv[2]})
	.then(response => {
		
		var currentPower = response.result[0].status;	
		
		if (currentPower == "active"){
			
			var tarVolume = {
				
				token: null,
				
				setTarVolume: function() {
					
					return rp({
							
					    "method": "POST",
					    "uri": "http://" + self.ipadress + "/sony/audio",
					    "body": {
						  "method": "setAudioVolume",
						  "params": [{"target":"speaker","volume":newValue}],
						  "id": 1,
						  "version": "1.0"
					    },
					    "headers": {
						    "X-Auth-PSK": self.psk
					    },
					    "json":true
					    
					});
					
				}
				
			}
			
			reqTarVolume = function(params) {
			  tarVolume.token = params.token;
			  return tarVolume.setTarVolume();
			}
			
			reqTarVolume({"token": process.argv[2]})
			.then(response => {
				
				self.log("Setting Volume to: " + value);
				callback();
			
			})
			.catch(err => {
		        console.log("Can't set target volume! " + err)
		        callback()
		    });
			
		} else {
			
			callback()
			
		}   
		  
	})
    .catch(err => {
        self.log("Cant get TV State: " + err);
        callback()
    });
}
