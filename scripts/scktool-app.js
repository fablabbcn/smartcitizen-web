/*!
 * The Smart Citizen Tool v0.6.0 (http://smartcitizen.me)
 * 2013-2015 SmartCitizen
 * Licensed under MIT
 */
var debugLevel = 5; // 0 no messages, 5 all messages

var sckapp = {
    init: function(options, elem) {
        this.options = $.extend({}, this.options, options);
        this.elem = elem;
        this.$elem = $(elem);
        this.debugLevel = debugLevel;
        this._build();
        return this;
    },
    options: {},
    _build: function() {
        var self = this;
        this.isAdvanced = true;
        self.initBlocksUI();
        self.initPluginAuto(function() {
            self._setBoardListAvailable();
            self._startmessage();
            self.initInternalUI();
            self._run();
            self._initEvents();
        });
        self._initEvents();
    },
    _initEvents: function() {
        var self = this;
        window.onbeforeunload = function() {
            self._disconnect();
        };
    },
    _setBoardListAvailable: function() {
        var self = this;
        if (self.isAdvanced) {
            //self.boards = self.boards_dev;
            //self._message("You are in Advanced Mode!");
            self.boards = self.boards_stable;
        } else {
            self.boards = self.boards_stable;
        }
    },
    _startmessage: function(message) {
        message = message || "";
        var msgBlock = $('.start-message');
        msgBlock.addClass('lead');
        msgBlock.empty();
        var msg = $("<p>").html(message);
        msgBlock.append(msg);
    },
    _message: function(message) {
        var msgBlock = $('.messages-block');
        if (msgBlock.children().length >= 3) msgBlock.children().first().remove();
        var msg = $("<span>").html("&#x2713; " + message + "<br>");
        msgBlock.append(msg);
    },
    _messageWidget: function(message) {
        var msgBlock = $('.messages-widget-block');
        msgBlock.empty();
        msgBlock.html(message);
    },
    _messageUpload: function(message) {
        var msgBlock = $('.messages-upload-block');
        msgBlock.empty();
        msgBlock.html(message);
    },
    _debug: function(message, messageLevel) {
        messageLevel = messageLevel || 1;
        if (messageLevel <= this.debugLevel) console.log(message); //This is temporary. Will be implemented as log.proto
    },
    initBlocksUI: function() {
        this.$elem.addClass("scktool");
        this.$elem.append([
            $("<div>").addClass("start-message"),
            $("<div>").addClass("start-block"),
            $("<div>").addClass("messages-block"),
            $("<div>").addClass("board-block"),
            $("<div>").addClass("config-block"),
            $("<div>").addClass("credits-block").html('<p>Powered by <a target="_blank" href="https://github.com/fablabbcn/BabelFish"> BabelFish</a> technology by <a target="_blank" href="http://codebender.cc/">Condebender</a>.</p>')
        ]);
    },
    resetProcess: function(){
        this.$elem.find(".board-block").children().remove();
        this.$elem.find(".config-block").children().remove();
        this.initInternalUI();
    },
    initInternalUI: function() {
        this.updatesUI = this.initUpdatesUI();
        this.netsUI = this.initNetsUI();
        this.uploadUI = this.initUploadUI();
        this.startUI = this.initStartUI();
    },
    initUIBasics: function() {
        var self = this;
        var _UI = {};
        _UI.createInput = function(name, value, type, labelTxt) {
            value = value || "";
            type = type || "text";

            var input = $('<input>').val(value).attr('name', name).attr('placeholder', name).addClass('form-control').prop("type", type);

            if (type == "checkbox") input.prop("checked", value);

            if (labelTxt) {
                var label = $('<label>').text(labelTxt).attr('for', name);
                var input = label.append(input);
            }

            return this.createInputWrapper(type).append(input);

        }

        _UI.createInputWrapper = function(type) {
            type = type || "text";
            var input = $('<div>').addClass('input').addClass(type);
            return input
        }

        _UI.createButton = function(name, value, type, extraClass, needsWrapper) {
            // needsWrapper = needsWrapper || true;
            value = value || "";
            var input = $('<div>').addClass('button').html(value);
            if (extraClass) input.addClass(extraClass);
            if (needsWrapper != false) {
                return this.createInputWrapper('action-button').addClass(extraClass).append(input);
            } else {
                return input;
            }

        }
        _UI.createSelectElement = function(name, dataset, value) {
            value = value || "";
            var selectElement = $('<select>').attr('name', name).addClass('');
            for (var data in dataset) {
                var option = $('<option>').val(data).text(dataset[data].description);
                if (value == data) option.prop('selected', true);
                option.appendTo(selectElement);
            }
            return this.createInputWrapper('select').append(selectElement);
        }
        _UI.createRangeElement = function(name, value, step, min, max, labelTxt) {
            var range = $('<input>').val(value).attr('name', name);
            range.prop("type", "range").prop("step", step).prop("min", min).prop("max", max).css('width', '220px');

            if (labelTxt) {
                var label = $('<label>').text(labelTxt).attr('for', name);
                var range = label.append(range);
            }

            return this.createInputWrapper('range').append(range);

        }
        _UI.remove = function() {
            if (!this.widget) return;
            this.widget.remove();
        }
        return _UI;
    },
    initNetsUI: function() {
        var self = this;
        var _netsUI = this.initConfigWidgets();
        var widget = {};
        _netsUI.getInput = function(name, id) {
            return this.widget.list.children().eq(id).find("input[name='" + name + "']").val();
        }
        _netsUI.getSelectElement = function(name, id) {
                return this.widget.list.children().eq(id).find("select[name=" + name + "] option:selected").val();
            }
            /* Elements */
        _netsUI.createSSIDElement = function(value) {
            value = value || "";
            return this.createInput("ssid", value);
        }
        _netsUI.createPasswordElement = function(value) {
            value = value || "";
            return this.createInput("phrase", value);
        }
        _netsUI.createAuthElement = function(value) {
            value = value || "";
            return this.createSelectElement('auth', self.netSettings.seqModes, value);;
        }
        _netsUI.createVersionSelect = function(value) {
            value = value || "";
            return this.createSelectElement('version', self.boards, value);
        }
        _netsUI.createAntenaElement = function(value) {
            return this.createInput("ext_antenna", value, "checkbox", "External antena");
        }
        _netsUI.createDeleteButton = function() {
            var self = this;
            var deleteButton = this.createButton("remove", "<span class='glyphicon glyphicon-trash' style='color:white; font-size:17px;'></span>", "button", "delete", false);
            deleteButton.click(function() {
                self.deleteGroupElement($(this).parent().index());
            });
            return deleteButton;
        }
        _netsUI.createAddButton = function() {
            var self = this;
            var addButton = this.createButton("remove", "Add +", "button", "add");
            addButton.click(function() {
                self.createGroupElement();
            });
            return addButton;
        }
        _netsUI.getSSIDElement = function(id) {
            return this.getInput("ssid", id);
        }
        _netsUI.getPasswordElement = function(id) {
            return this.getInput("phrase", id);
        }
        _netsUI.getAuthElement = function(id) {
            return this.getSelectElement("auth", id);;
        }
        _netsUI.getAntenaElement = function(id) {
            return this.widget.list.children().eq(id).find("input[name='ext_antenna']").is(":checked");
        }
        _netsUI.createGroupElement = function(id, data) {
            data = data || {
                ssid: "",
                phrase: "",
                auth: "WPA2",
                ext_antenna: false
            };
            id = id || this.widget.list.length;
            var leftElements = [];
            leftElements.push(this.createSSIDElement(data.ssid));
            leftElements.push(this.createPasswordElement(data.phrase));
            var left = $('<div>').addClass('left');
            left.append(leftElements);
            var rightElements = [];
            rightElements.push(this.createAuthElement(data.auth));
            rightElements.push(this.createAntenaElement(data.ext_antenna));
            rightElements.push(this.createDeleteButton());
            var right = $('<div>').addClass('right relative');
            right.append(rightElements);
            var wrapper = $('<div>').addClass('net-item').addClass('formContainer clear');
            left.appendTo(wrapper);
            right.appendTo(wrapper);
            wrapper.appendTo(this.widget.list);
        }
        _netsUI.deleteGroupElement = function(id) {
            this.widget.list.children().eq(id).remove();
        }
        _netsUI.getGroupElement = function(id) {
            // temporary - will be upgraded - key order on the nets objects is important (ssid, auth, phrase, ext_antena)
            var net = {};
            net.ssid = this.getSSIDElement(id);
            net.auth = this.getAuthElement(id);
            net.phrase = this.getPasswordElement(id);
            net.ext_antenna = this.getAntenaElement(id);
            return net;
        }
        _netsUI.getElements = function() {
            var nets = [];
            for (var i = 0; i < this.widget.list.children().length; i++) {
                var net = this.getGroupElement(i);
                if (net.ssid) nets.push(net);
            };
            return nets;
        }
        _netsUI.createElements = function(nets) {
            nets = nets || []
            if (!this.widget.list) {
                this.widget.list = $('<div>').addClass('nets-list');
                this.widget.list.appendTo(this.widget);
            } else {
                this.widget.list.empty();
            }
            var items = (nets.length > 0) ? nets.length : 1;
            for (var i = 0; i < items; i++) {
                this.createGroupElement(i, nets[i]);
            };
        }
        _netsUI.createNetsWidget = function(nets) {
            if (!this.widget) {
                this.widget = this.createWidgetWrapper('nets', 'Wi-Fi Networks', 'Set your Wi-Fi credentials for every network you want your kit to connect.');
                this.createElements(nets);
                this.widget.append(this.createAddButton());
            } else {
                this.createElements(nets);
            }
        }
        return _netsUI;
    },
    initUpdatesUI: function() {
        var self = this;
        var _updatesUI = this.initConfigWidgets();
        var widget = {};
        _updatesUI.createSensorResolution = function(value) {
            var self = this;
            value = value || 60;
            value = value / 60;
            var range = this.createRangeElement("resolution", value, 5, 0, 60, "Reading interval");
            range.find("input").change(function() {
                var resolution = (this.value >= 1) ? this.value * 60 : 60;
                self.updateSensorUpdate({
                    resolution: resolution
                });
            });
            return range;
        }
        _updatesUI.createSensorPosts = function(value) {
            var self = this;
            value = value || 1;
            var range = this.createRangeElement("posts", value, 5, 0, 20, "Number of posts");
            range.find("input").change(function() {
                var posts = (this.value >= 1) ? this.value : 1;
                self.updateSensorUpdate({
                    post: posts
                });
            });
            return range;
        }
        _updatesUI.getRangeElement = function(name) {
                return this.widget.find("input[name='" + name + "']").val();
            },
            _updatesUI.setRangeElement = function(name, value) {
                return this.widget.find("input[name='" + name + "']").val();
            },
            _updatesUI.updateSensorUpdate = function(sensorUpdate) {
                var posts = sensorUpdate.posts || this.getSensorPosts() || 1;
                var resolution = sensorUpdate.resolution || this.getSensorResolution() || 60;
                var pub = posts * resolution;
                pub = this.timeUI(pub);
                resolution = this.timeUI(resolution);
                var explanation = "Your Smart Citizen Sensors will take a reading every " + "<span>" + resolution + "</span><br>" + " and will publish online every " + "<span>" + pub + "</span>" + ".";
                if (!this.explain) {
                    this.createUpdatesExplanation();
                }
                this.explain.html(explanation);
                return this.explain;
            }

        _updatesUI.createUpdatesExplanation = function() {
            explain = $('<p>').addClass('interval-message');
            this.explain = explain;
            return explain;
        }

        _updatesUI.timeUI = function(seconds) {
            if (seconds < 60) return Math.round(seconds) + " " + ((seconds > 1) ? "seconds" : "second");
            else if (seconds < 60 * 60) return Math.round(seconds / 60) + " " + ((seconds > 60) ? "minutes" : "minute");
            else if (seconds < 60 * 60 * 24) return Math.round(seconds / 3600) + " " + ((seconds > 3600) ? "hours" : "hour");
        }
        _updatesUI.getSensorResolution = function() {
            var resolution = this.getRangeElement("resolution");
            resolution = (resolution >= 1) ? resolution * 60 : 60;
            return resolution;
        }
        _updatesUI.getSensorPosts = function() {
            posts = this.getRangeElement("posts");
            posts = (posts >= 1) ? posts : 1;
            return posts;
        }
        _updatesUI.getSensorResolutionAndPosts = function() {
            var update = {};
            update.time = this.getSensorResolution();
            update.updates = this.getSensorPosts();
            return update;
        }
        _updatesUI.createSensorResolutionAndPosts = function(updates) {
            var leftElements = [];
            leftElements.push(this.createSensorResolution(updates.time));
            leftElements.push(this.createSensorPosts(updates.updates));
            var left = $('<div>').addClass('left');
            left.append(leftElements);
            var rightElements = [];
            rightElements.push(this.updateSensorUpdate(updates));
            var right = $('<div>').addClass('right large');
            right.append(rightElements);
            left.appendTo(this.widget);
            right.appendTo(this.widget);
            $('input[type="range"]').rangeslider(); //tmp
        }
        _updatesUI.setSensorResolution = function(value) {
            this.setRangeElement("resolution", value)
        }
        _updatesUI.setSensorPosts = function(value) {
            this.setRangeElement("posts", value)
        }
        _updatesUI.setSensorResolutionAndPosts = function(updates) {
            this.setSensorResolution(updates.time);
            this.setSensorPosts(updates.updates);
            this.updateSensorUpdate(updates);
        }
        _updatesUI.getSensorPosts = function() {
            posts = this.getRangeElement("posts");
            posts = (posts >= 1) ? posts : 1;
            return posts;
        }
        _updatesUI.createUpdatesWidget = function(updates) {
            updates = updates || {
                time: 60,
                updates: 1
            }
            if (!this.widget) {
                this.widget = this.createWidgetWrapper('updates', 'Update interval', 'Set your kit update interval to optimize the battery performance and sensor resolution ratio.');
                this.createSensorResolutionAndPosts(updates);
            } else {
                this.setSensorResolutionAndPosts(updates);
            }
        }
        return _updatesUI;
    },
    initConfigWidgets: function() {
        var self = this;
        var _configUI = this.initUIBasics();
        var widget = {};
        _configUI.parent = $('.config-block');


        _configUI.removeAll = function() {
            var self = this;
            if (!self.widget) return;
            self.widget.fadeOut(500, function() {
                self.widget.parent().remove();
                self.temp_block = false;
                self.widget = false;
            });
        }

        _configUI.createWidgetsWrapper = function() {
            var block = $('<div>').addClass('widget-block').addClass('config');
            var body = $('<div>').addClass('body'); //limit-scroll
            var footer = $('<div>').addClass('footer');
            var msg = $('<p>').addClass('messages-widget-block');
            footer.append(this.createSyncButton());
            footer.append(msg);
            body.appendTo(block);
            footer.appendTo(block);
            block.appendTo(this.parent);
            return body;
        }

        _configUI.createWidgetWrapper = function(name, title, description) {
            if (!self.temp_block) {
                self.temp_block = this.createWidgetsWrapper();
            }
            var section = $('<div>').addClass('section').addClass('relative').addClass(name);
            var title = $('<h4>').text(title);
            var description = $('<p>').text(description);
            title.appendTo(section);
            description.appendTo(section);
            section.appendTo(self.temp_block);
            return section;
        }

        _configUI.createSyncButton = function() {
            var syncButton = this.createButton("remove", "Sync", "submit", "", false);
            syncButton.click(function() {
                self._sync();
            });
            return syncButton;
        }
        return _configUI;
    },
    initUploadUI: function() {
        var self = this;
        var _uploadUI = this.initUploadWidets();
        var widget = {};


        _uploadUI.remove = function() {
            var self = this;
            if (!self.widget) return;
            self.widget.fadeOut(500, function() {
                self.temp_block_upload = false; //tmp
                self.widget.parent().parent().remove();
                self.widget = false;
            });
        }
        _uploadUI.getSelectElement = function(name) {
            return this.widget.find("select[name=" + name + "] option:selected").val();
        }

        _uploadUI.createVersionSelect = function(value) {
            value = value || "";
            return this.createSelectElement('version', self.boards, value);
        }
        _uploadUI.createBoardVersion = function() {
            var value = (self.sck.version.board) || "11"
            var version = this.createVersionSelect(value);
            version.change(function() {
                self.sck.version.board = this.value;
            });
            return version;
        }
        _uploadUI.getVersionSelect = function(id) {
            return this.getSelectElement('version');;
        }
        _uploadUI.createUploadElement = function(trigger, extraTrigger) {
            var uploadElements = [];
            uploadElements.push(this.createBoardVersion());
            this.widget = this.createWidgetWrapper('upload', 'Firmware Updater', 'Select the Smart Citizen Board to update the firmware.', trigger, extraTrigger);
            this.widget.append(uploadElements);

        }
        return _uploadUI;
    },
    initUploadWidets: function() {

        var self = this;
        var _configUI = this.initUIBasics();
        var widget = {};

        _configUI.parent = $('.board-block');




        _configUI.createWidgetsWrapper = function(trigger, extraTrigger) {
            var block = $('<div>').addClass('widget-block');
            var body = $('<div>').addClass('body');
            var footer = $('<div>').addClass('footer');
            var msg = $('<p>').addClass('messages-upload-block');
            footer.append(this.createUploadButton(trigger));
            if (extraTrigger) {
                footer.append(this.createSkipButton(extraTrigger));
            }
            footer.append(msg);
            body.appendTo(block);
            footer.appendTo(block);
            block.appendTo(this.parent);
            return body;
        }

        _configUI.createWidgetWrapper = function(name, title, description, trigger, extraTrigger) {
            self.temp_block_upload = this.createWidgetsWrapper(trigger, extraTrigger);
            var section = $('<div>').addClass('section').addClass(name);
            var title = $('<h4>').text(title);
            var description = $('<p>').text(description);
            title.appendTo(section);
            description.appendTo(section);
            section.appendTo(self.temp_block_upload);
            return section;
        }

        _configUI.createUploadButton = function(trigger) {
            var uploadButton = this.createButton("remove", "Upload firmware", "submit", "", false);
            uploadButton.click(function() {
                trigger();
            });
            return uploadButton;
        }

        _configUI.createSkipButton = function(trigger) {
            var uploadButton = this.createButton("remove", "Skip firmware", "submit", "", false);
            uploadButton.click(function() {
                trigger();
            });
            return uploadButton;
        }

        return _configUI;

    },
    initStartUI: function() {
        var self = this;
        var _startUI = this.initStartWidget();
        var widget = {};
        _startUI.updateSelectElement = function(name, dataset, value) {
            var selectElement = this.widget.find("select[name=" + name + "]");
            selectElement.empty();
            for (var data in dataset) {
                var option = $('<option>').val(data).text(dataset[data].description);
                if (value == data) option.prop('selected', true);
                option.appendTo(selectElement);
            }
        }
        _startUI.getSelectElement = function(name) {
            return this.widget.find("select[name=" + name + "] option:selected").val();
        }
        _startUI.createStartButton = function(trigger) {
            var parent = this;
            var startButton = this.createButton("start", "Start process", "submit");
            startButton.click(function() {
                self.sckPort = parent.getPortSelect(); //temp
                startButton.children().text("Restart process");
                trigger();
            });
            return startButton;
        }
        _startUI.createupdatePortSelect = function(ports, value) {
            var ports = ports || self.portsList;
            var value = value || self.sckPort
            if (this.widget) {
                this.updateSelectElement('port', ports, value);
            } else {
                var portSelector = this.createSelectElement('port', ports, value);
                portSelector.change(function() {
                    self.sckPort = this.value;
                });
                return portSelector;
            }
        }
        _startUI.getPortSelect = function(id) {
            return this.getSelectElement('port');;
        }
        _startUI.createStartElement = function(trigger) {
            var startElements = [];
            startElements.push(this.createupdatePortSelect());
            startElements.push(this.createStartButton(trigger));
            this.widget = this.createWidgetsWrapper('start');
            this.widget.append(startElements);
        }
        return _startUI;
    },
    initStartWidget: function() {
        var self = this;
        var _configUI = this.initUIBasics();
        var widget = {};
        _configUI.parent = $('.start-block');
        _configUI.createWidgetsWrapper = function(name) {
            var block = $('<div>').addClass('formContainer port-select-block').addClass(name);
            block.appendTo(this.parent);
            return block;
        }
        return _configUI;
    },
    _sync: function() {
        var self = this;
        self._message("Syncing with your Smart Citizen Kit...");
        self._messageWidget("Syncing with your Smart Citizen Kit...");
        isOk =
            self._syncNets(function() {
                self._syncUpdates(function() {

                    self._messageWidget("Done, reset your kit in order <br> the changes will take effect.");
                    self._message("Your Smart Citizen Kit is updated. Please, reset or switch off / on your kit in order the changes to take effect!");
                });
            });
    },
    _syncUpdates: function(callback) {
        var self = this;
        self._bakeSCKUpdates(self.updatesUI.getSensorResolutionAndPosts(), function(update) {
            self.updatesUI.setSensorResolutionAndPosts(update);
            if (callback) callback();
        });
    },
    _syncNets: function(callback) {
        var self = this;
        self._bakeSCKNet(self.netsUI.getElements(), function(nets) {
            self.netsUI.createElements(nets);
            if (callback) callback();
        });
    },
    _startGetAll: function() {
        var self = this;
        self._message("Getting Wi-Fi networks saved on the kit...");
        self._startNets(function() {
            self._message("Getting time/updates settings saved on the kit...");
            self._startUpdates();
        });
    },
    _startNets: function(callback) {
        var self = this;
        self._getSCKNets(function(nets) {
            self.netsUI.createNetsWidget(nets);
            if (callback) callback();
        });
    },
    _startUpdates: function(callback) {
        var self = this;
        self._getSCKUpdates(function(updates) {
            self.updatesUI.createUpdatesWidget(updates);
            if (callback) callback();
        });
    },
    _checkVersion: function() {},
    _register: function() {},
    _run: function() {
        var self = this;
        var boardReady = function() {
                self.uploadUI.remove();
                self._registerBoard(function() {
                    self._message("Downloading previous configuration from your kit!");
                    self._startConfigManager(function() {
                        self._message("Thanks for waiting! You can start configuring the kit.");
                        self._message("Add a network, adjust the update interval and click sync....");
                    });
                });
            }
        var boardStarter = function(isBoardOK) {
            self._message("Your kit is a " + self._getBoardDescription());
            if (self.sck.version.firmware < self.latestFirmwareVersion) {
                self._message("Your kit is running " + self._getFirmwareDescription() + ". This is not the latest version.")
                self._message("We recommend you to update the firmware!");
            } else {
                self._message("Your kit is running " + self._getFirmwareDescription() + ". This is the latest version.")
                self._message("You can skip the firmware update!");
            }
            self._updateFirmware(function(state) {
                if (state) boardReady();
            });
        }

        self._userStart(function() {
            if(self.isAlreadyStarted){
                self.resetProcess();

            } else {
                self.isAlreadyStarted = true;
            }
            self._message("Checking your Smart Citizen Kit version. This could take a while, please wait.");
            self._checkVersion(function(isBoardOK) {
                boardStarter(isBoardOK);
            });
        })
    },
    _registerBoard: function(callback) {
        var self = this;
        var macStatus = {
            counter: 1,
            max: 2,
        };
        var getMac = function(callback) {
            self._getSCKMac(function(mac) {
                if (validateMac(mac)) {
                    callback(mac);
                } else if (macStatus.counter <= macStatus.max) {
                    setTimeout(function() {
                        macStatus.counter++;
                        getMac(callback);
                    }, 500);
                } else {
                    callback(false);
                };
            });
        }
        var validateMac = function(mac) {
            var regex = /^(([a-f0-9]{2}:){5}[a-f0-9]{2},?)+$/i;
            return regex.test(mac);
        }
        var platformResponse = function(mac, status) {
            var device = {};
            var t = " (mac: " + mac + ")";
            if (status = 1) {
                self._message("Board registered to the Platform!" + t);
            } else if (status = 2) {
                self._message("Board already registered to the Platform!" + t);
            } else if (status = 0) {
                self._message("Registered to the Platform failed, please check your internet connection!");
            }
        }


        var register = function() {

            getMac(function(mac) {
                if (mac) {
                    self.sck.mac = mac;
                    self._sendUpdateEvent();
                    callback();
                } else {
                    self._message("Failed to get the mac address from the kit. Try again later!");
                    callback();
                }
            });
        }
        register();
    },
    _sendUpdateEvent: function() {
        var self = this;
        self._debug(self.sck);
        self.$elem.trigger('sck_info', [self.sck]);
    },
    _startConfigManager: function(callback) {
        this._startGetAll();
    },
    _userStart: function(callback) {
        var self = this;
        self.startUI.createStartElement(callback); //self._run

        self._windowsDriversWarning();

        self._message("Please, reset your kit by pressing the reset button or switching it off / on.");
        self._message("Once reseted, select your SmartCitizen serial port and click Start process...");
    },
    _windowsDriversWarning: function() {
        if (navigator.platform.toLowerCase().indexOf("win") != -1) {
            this._message("Remember on Windows you need the Arduino drivers to be installed, you can easily follow this <a  target='_blank' href='http://docs.smartcitizen.me/#/start/how-to-install-the-drivers-on-windows'>guide</a>");
        }
    },
    _checkVersion: function(callback) {
        var self = this;
        var validateVersion = function(sckVersion) {
            if (self.isAdvanced) {
                return false;
            }
            if (sckVersion.firmwareVersion == false || sckVersion.firmwareVersion < self.latestFirmwareVersion) {
                return false;
            } else {
                return true;
            }
        }
        var checkVersion = function(callback) {
            // callback(false);
            self._getSCKVersion(function(sckVersion) {
                self.sck.version.firmware = sckVersion.firmwareVersion;
                self.sck.version.board = sckVersion.hardwareVersion;
                callback(validateVersion(sckVersion)); // here retry
            });
        }
        checkVersion(callback);
    },
    _updateFirmware: function(callback) {
        var self = this;
        var updateStatus = {
            counter: 1,
            max: 2,
        };
        var confirmStart = function() {
            if (self.isAdvanced) {
                self.uploadUI.createUploadElement(process, skip);
            } else {
                self.uploadUI.createUploadElement(process);
            }
        }
        var skip = function() {
            callback(true);
        }
        var checkResult = function(status) {
            if (status) {
                checkVersion(function(version) {
                    if (self.isAdvanced || version) {
                        self._messageUpload("Firmware uploaded!");
                        if (!self.isAdvanced) {
                            self._message("Firmware uploaded! Your are runnign the latest firmware.");
                        } else {
                            self._message("Firmware uploaded!");
                        }
                        callback(true);
                    } else {
                        failedUpdate(status);
                    }
                });
            } else {
                failedUpdate(status);
            }
        }
        var failedUpdate = function(status) {
            if (updateStatus.counter <= updateStatus.max) {
                self._message("Firmware update failed!" + " " + self.errors.flashing[status] + " " + "Retrying " + updateStatus.counter + " of " + updateStatus.max + ". ");
                retry();
            } else {
                self._message("Firmware update failed after " + updateStatus.counter + " attempts. " + "Please, reset your kit or try to upload the firmware manually. <a href='http://smartcitizen.me/posts/view/6'>More info</a>");

                self._messageUpload("Firmware update failed! Please, reset your kit.");

                callback(false);
            }
        }
        var validateVersion = function(sckVersion) {
            // self.sck.version.firmware = sckVersion.firmwareVersion; //problem on retry...
            // self.sck.version.board = sckVersion.hardwareVersion;
            if (sckVersion.firmwareVersion == false || sckVersion.firmwareVersion < self.latestFirmwareVersion) {
                //return false;
                return true; // Validation temporary disabled! No firmware
            } else {
                return true;
            }
        }
        var checkVersion = function(callback) {
            setTimeout(function() {
                self._getSCKVersion(function(sckVersion) {
                    callback(validateVersion(sckVersion));
                });
            }, 4000);
        }
        var retry = function() {
            setTimeout(function() {
                self._debug("Recheking...", 2);
                updateStatus.counter++;
                again();
            }, 4000);
        }
        var again = function() {
            self._flash(self.sck.version.board, checkResult);
        }
        var process = function() {
            self._message("Updating your kit to the latest firmware...");
            self._messageUpload("Updating firmware...");
            self.sck.version.board = self.uploadUI.getVersionSelect(); //temp
            updateStatus.counter = 0;
            self._flash(self.sck.version.board, checkResult);
        }
        confirmStart();
    },
    _getBoardDescription: function() {
        var boardDB = this.boards;
        if (this.sck.version.board && boardDB[this.sck.version.board]) {
            return boardDB[this.sck.version.board].description
        } else {
            return "board unknown";
        }
    },
    _getFirmwareDescription: function() {
        var firmwareDB = this.firmware;
        if (this.sck.version.firmware && firmwareDB[this.sck.version.firmware]) {
            return firmwareDB[this.sck.version.firmware].description
        } else {
            return "an older firmware";
        }
    },
    _bakeSCKNet: function(nets, callback) {
        var self = this;
        var nets = nets;
        var validateSet = function(setted, getted) {
            if (getted == false || setted == false) return false;
            var sortBySSID = function(a, b) {
                var a = a.ssid.toLowerCase(),
                    b = b.ssid.toLowerCase()
                if (a < b) return -1
                if (a > b) return 1
                return 0
            }
            setted = setted.sort(sortBySSID);
            getted = getted.sort(sortBySSID);
            return (JSON.stringify(setted) == JSON.stringify(getted));
        }
        var setAndgetSCKNETS = function(callback) {
            self._setSCKNets(nets, function(sentNets) {
                self._getSCKNets(function(receivedNets) {
                    self._debug(sentNets, 2);
                    self._debug(receivedNets, 2);
                    if (validateSet(sentNets, receivedNets)) {
                        callback(nets);
                    } else {
                        callback(false);
                    }
                });
            });
        }
        var retries = 0;
        var retriesMax = 2;
        var process = function() {
            setAndgetSCKNETS(function(status) {
                if (status) {
                    self._message("Wi-Fi settings updated on the Smart Citizen Kit!");
                    callback(nets);
                } else if (retries < retriesMax) {
                    retries++;
                    process();
                } else {
                    self._messageWidget("Failed to update the Wi-Fi! Please, try it again.");
                    self._message("Failed to update the Wi-Fi settings on the Smart Citizen Kit! Please, try it again.");
                    callback(false);
                };
            })
        }
        process();
    },
    _bakeSCKUpdates: function(update, callback) {
        var self = this;
        var validateSet = function(setted, getted) {
            return (JSON.stringify(setted) == JSON.stringify(getted));
        }
        var setAndgetSCKUpdates = function(callback) {
            self._setSCKUpdates(update, function(sentUpdate) {
                self._getSCKUpdates(function(receiveUpdate) {
                    self._debug(sentUpdate, 2);
                    self._debug(receiveUpdate, 2);
                    if (validateSet(sentUpdate, receiveUpdate)) {
                        callback(true);
                    } else {
                        callback(false);
                    }
                });
            });
        }
        var retries = 0;
        var retriesMax = 2;
        var process = function() {
            setAndgetSCKUpdates(function(isOK) {
                if (isOK == true) {
                    self._message("Update interval settings updated on the Smart Citizen Kit!");
                    callback(true);
                } else if (retries < retriesMax) {
                    retries++;
                    process();
                } else {
                    self._messageWidget("Failed to update the update interval! Please, try it again.");
                    self._message("Failed to update the update interval settings on the Smart Citizen Kit! Please, try it again.");
                    callback(false);
                };
            })
        }
        process();
    },
    _getSCKUpdates: function(callback) {
        var self = this;
        var update = {};
        self._enterCmdMode(function() {
            self._sendCMD("get time update", function(data) {
                update.time = (data.response) ? data.response : false;
                self._sendCMD("get number updates", function(data) {
                    update.updates = (data.response) ? data.response : false;
                    self._exitCmdMode();
                    callback(update);
                }, true, 4000);
            }, true, 4000);
        });
    },
    _setSCKUpdates: function(update, callback) {
        var self = this;
        update = self.stringNumberProperties(update);
        self._enterCmdMode(function() {
            self._sendCMD("set time update " + update.time, function(data) {
                self._sendCMD("set number updates " + update.updates, function(data) {
                    self._exitCmdMode();
                    callback(update);
                });
            });
        });
    },
    _setSCKNets: function(nets, callback) {
        var self = this;
        var netManager = {};
        netManager.start = function(nets, index, next) {
            if (index == 0) {
                self._enterCmdMode(function() {
                    self._sendCMD("clear nets", function(data) {
                        next(nets, index);
                    });
                });
            } else {
                next(nets, index, next);
            }
        };
        netManager.set = function(nets, index, next) {
            self._sendCMD("set wlan ssid " + nets[index].ssid, function(data) {
                self._sendCMD("set wlan auth " + self.netSettings.seqModes[nets[index].auth].id, function(data) {
                    self._sendCMD("set wlan phrase " + nets[index].phrase, function(data) {
                        self._sendCMD("set wlan ext_antenna " + self.netSettings.antenaModes[nets[index].ext_antenna].id, function(data) {
                            next(nets, index);
                        });
                    });
                });
            });
        };
        netManager.end = function(nets, index, next, done) {
            if (index < nets.length - 1) {
                next(nets, index);
            } else {
                self._exitCmdMode();
                done();
            }
        };
        netManager.next = function(nets, index) {
            index++;
            netManager.auto(nets, index);
        };
        netManager.auto = function(nets, index) {
            index = index || 0;
            netManager.start(nets, index, function(nets, index) {
                netManager.set(nets, index, function(nets, index) {
                    netManager.end(nets, index, function(nets, index) {
                        netManager.next(nets, index);
                    }, function() {
                        callback(nets);
                    });
                });
            })
        }
        netManager.auto(nets);
    },
    _getSCKNets: function(callback) {
        var self = this;
        var getPropertyById = function(obj, id) {
            for (var property in obj) {
                if (obj.hasOwnProperty(property)) {
                    if (obj[property].id == id) {
                        if (property == "true" || property == "false") property = (property === "true");
                        return property;
                    }
                }
            }
        };
        var getArrayPropertiesById = function(obj, array) {
            var nArray = [];
            for (var i = 0; i < array.length; i++) {
                var id = array[i]
                nArray.push(getPropertyById(obj, id));
            };
            return nArray;
        };
        var filterSpaceSpecialCharacter = function(array) {
            for (var i = 0; i < array.length; i++) {
                if (typeof array[i] === 'string') array[i] = array[i].replace("$", " ");
            };
            return array;
        };
        var splitAndPush = function(data, transform) {
            if (!data.response) return false;
            var cData = $.grep(data.response.split(" "), function(n) {
                return (n)
            });
            if (transform) {
                cData = getArrayPropertiesById(transform, cData);
            }
            return filterSpaceSpecialCharacter(cData);
        }
        var bakeNetsCollection = function(net) {
            var netParams = ["ssid", "auth", "phrase", "ext_antenna"];
            var nets = [];
            for (var i = 0; i < net[netParams[0]].length; i++) {
                var newNet = {};
                for (var j = 0; j < netParams.length; j++) {
                    var param = netParams[j];
                    newNet[param] = net[param][i];
                };
                nets.push(newNet);
            };
            return nets;
        }
        var net = {};
        self._enterCmdMode(function() {
            self._sendCMD("get wlan ssid", function(data) { //
                if (data.response) {
                    net.raw = {};
                    net.raw.ssid = splitAndPush(data);
                    self._sendCMD("get wlan auth", function(data) {
                        net.raw.auth = splitAndPush(data, self.netSettings.seqModes);
                        self._sendCMD("get wlan phrase", function(data) {
                            net.raw.phrase = splitAndPush(data);
                            self._sendCMD("get wlan ext_antenna", function(data) {
                                net.raw.ext_antenna = splitAndPush(data, self.netSettings.antenaModes);
                                net.baked = bakeNetsCollection(net.raw);
                                self._debug(net.baked, 2);
                                self._exitCmdMode();
                                callback(net.baked);
                            }, true);
                        }, true);
                    }, true);
                } else {
                    self._exitCmdMode();
                    callback(false);
                    self._message("No Wi-Fi networks saved yet on the Smart Citizen Kit.");
                }
            }, true, 15000);
        });
    },
    _getSCKVersion: function(callback) {
        var self = this;
        self._enterCmdMode(function() {
            self._sendCMD("get sck info", function(data) {
                self._debug(data, 2);
                var sckVersion = {};
                if (data.response) {
                    var sckVersionString = data.response.trim();
                    var sckVersionArray = sckVersionString.split("-");
                    if (sckVersionArray.length >= 2) {
                        sckVersion.hardwareVersion = Number(sckVersionArray[0].replace(/[^0-9]+/g, ''));
                        sckVersion.firmwareVersion = Number(sckVersionArray[1].replace(/[^0-9]+/g, ''));
                    } else {
                        sckVersion.hardwareVersion = false;
                        sckVersion.firmwareVersion = false;
                    }
                } else {
                    sckVersion.hardwareVersion = false;
                    sckVersion.firmwareVersion = false;
                }
                self._exitCmdMode();
                callback(sckVersion);
            }, false, 25000); //must be 15000
        });
    },
    _getSCKMac: function(callback) {
        var self = this;
        self._enterCmdMode(function() {
            self._sendCMD("get mac", function(data) {
                self._debug(data, 2);
                if (data.response) {
                    var sckMac = data.response.trim();
                } else {
                    var sckMac = null;
                }
                self._exitCmdMode();
                callback(sckMac);
            }, true, 10000);
        });
    },
    _getSCKData: function() {
        var self = this;
        self._enterCmdMode(function() {
            self._sendCMD("#data", function(data) {
                self._debug(data, 2);
                if (data.response) {
                    self._debug(data.response);
                } else {
                    self._debug("FAILED");
                }
                self._exitCmdMode();
            }, true, 10000);
        });
    },
    _enterCmdMode: function(next) {
        var self = this;
        window.setTimeout(function() {
            self._checkPermissions(); // Check if here
            self._serialRead(); // Check if here
            self._serialWrite("###");
            window.setTimeout(function() {
                self._cleanBuffer();
                next();
            }, 1000);
        }, 500);
    },
    _exitCmdMode: function() {
        var self = this;
        window.setTimeout(function() {
            self._checkPermissions(); // Check if here
            self._serialRead(true); // Check if here
            self._serialWriteCr("exit");
            self._disconnect();
        }, 200);
    },
    _serialWrite: function(msg) {
        var self = this;
        self._debugMessage(msg, "send");
        self.sckTool.serialWrite(msg);
    },
    _serialWriteLn: function(msg) {
        msg += '\r';
        msg += '\n';
        this._serialWrite(msg);
    },
    _serialWriteCr: function(msg) {
        var self = this;
        msg += '\r';
        this._serialWrite(msg);
    },
    _debugMessage: function(msg, dd) {
        dd = dd || " ";
        if (dd == "received") self._debug("#Message: " + dd, 5);
        this._debug("line " + dd + ":" + JSON.stringify(msg) + " @ " + msg.length, 3);
    },
    _serialRead: function(prec) {
        var self = this;
        if (prec == true && this.connected == true) {
            self._debug("Already Reading!");
            return;
        }
        self.connected = true;
        var sck = {
            port: this.sckPort,
            speed: 115200
        }
        self._debug("...reading! " + JSON.stringify(sck), 2);
        self.sckTool.serialRead(sck.port, sck.speed, function(from, line) {
            self._debug("  @@ >> " + from + " " + line);
            self._input(line);
        }, function(from, line) {
            self._debug("  !! >> " + from + " " + line);
        });
    },
    _flash: function(boardID, callback) {
        var self = this;
        self.isFlashing = true;
        self._checkPermissions();
        self._disconnect();
        self.connected = true;
        var firmURL = self.firmwaresPath + self.boards[boardID].firmware.firmwareFile;
        $.getJSON(firmURL, function(firm) {
            self._debug(firm, 3);
            var flash = {
                port: self.sckPort,
                binary: firm.bin,
                maximum_size: self.boards[boardID].upload.maximum_size,
                protocol: self.boards[boardID].upload.protocol,
                speed: self.boards[boardID].upload.speed,
                mcu: self.boards[boardID].build.mcu,
                disable_flushing: self.boards[boardID].upload.disable_flushing
            }
            self._debug(flash, 2);
            self.sckTool.flash(flash.port, flash.binary, flash.maximum_size, flash.protocol, flash.disable_flushing, flash.speed, flash.mcu, function(from, progress) {
                self._debug(from, 3);
                self._debug(progress, 3);
                self.isFlashing = false;
                if (progress) {
                    self._debug("FLASH PROGRESS");
                    self._debug(progress);
                    if (progress != 0 && (progress > -1 || progress < -23) && progress != -30 && progress != -55 && progress != -56 && progress != -57) {
                        self.sckTool.sckTool.getFlashResult(function(result) {
                            self._debug("FLASH RESULT");
                            self._debug(result);
                        });
                    }
                    callback(progress);
                } else {
                    self._debug("FLASH OK!!");
                    callback(true);
                }
            });
        });
    },
    _input: function(line) {
        if (line.indexOf("connecting at") != -1) return; //temp fix codebender update
        for (var i = 0; i < line.length; i++) {
            var ch = line.charCodeAt(i);
            if (isNaN(ch)) return; // Prevent plugin log messages channel
            if (ch == "10") return; // For the new plugin ommit '\n' and just use '\r'
            else if (ch == "13") {
                this.lineBuffer.push(ch);
                this._checkAg();
            } else this.lineBuffer.push(ch);
        }
    },
    _bufferToString: function() {
        var stringLine = "";
        for (var i = 0; i < this.lineBuffer.length; i++) {
            var charASCII = String.fromCharCode(this.lineBuffer[i]);
            stringLine += charASCII;
        };
        this.lineBuffer = [];
        stringLine = JSON.stringify(stringLine)
        return stringLine;
    },
    _getLineString: function() {
        return JSON.stringify(this.lineString)
    },
    _cleanBuffer: function() {
        this.lineBuffer = [];
    },
    _checkAg: function() {
        var line = this._bufferToString();
        this._debugMessage(line, "recieved");
        if (this.isCmd) {
            this._debugMessage(this.response, "expected");
            this.isCmd = false;
            if (this.response) {
                if (this.response == line) {
                    this.$elem.trigger("response", [{
                        status: "OK",
                        response: JSON.parse(line).replace(/(\r\n|\n|\r)/gm, ""),
                        debug: "response received and matched expected"
                    }]);
                } else {
                    this.$elem.trigger("response", [{
                        status: "FAIL",
                        response: JSON.parse(line).replace(/(\r\n|\n|\r)/gm, ""),
                        debug: "response received but not matched expected"
                    }]);
                }
            } else {
                this.$elem.trigger("response", [{
                    status: "OK",
                    response: JSON.parse(line).replace(/(\r\n|\n|\r)/gm, ""),
                    debug: "response received no validation necessary"
                }]);
            }
        }
    },
    _sendCMD: function(cmd, done, response, waitTime) {
        var self = this;
        self._debug(self.cmdStatus, 3);
        waitTime = waitTime || 2000;
        retriesMax = 2;
        self.cmdRetries++;
        if (waitTime == false || self.cmdStatus != "WAITING") {
            self._cleanBuffer();
            self.isCmd = true;
            self.cmdStatus = "WAITING";
            self._serialWriteCr(cmd);
            self.response = (response) ? JSON.stringify(response) : false;
            if (self.response) {
                self.cmdPID = window.setTimeout(function() {
                    self.cmdRetries = 0;
                    self.$elem.trigger("response", [{
                        status: "FAIL",
                        response: null,
                        debug: "no response, nothing to validate"
                    }]);
                }, waitTime);
            } else {
                waitTime = (!waitTime) ? 2000 : waitTime;
                self.cmdPID = window.setTimeout(function() {
                    self.cmdRetries = 0;
                    self.$elem.trigger("response", [{
                        status: "OK",
                        response: null,
                        debug: "no response but not necessary to validate"
                    }]);
                }, waitTime);
            }
        } else {
            if (self.cmdRetries < retriesMax) {
                self._sendCMD(cmd, done, response, waitTime);
            } else {
                self.$elem.trigger("response", [{
                    status: "FAIL",
                    response: null,
                    debug: "too many retries, failed"
                }]);
            }
        }
        this.$elem.one("response", function(event, response) { //multiple lines of response on network...????
            window.clearInterval(self.cmdPID);
            self.cmdStatus = response.status;
            self.cmdRetries = 0;
            self._debug(self.cmdStatus, 3);
            if (done) done(response);
        });
    },
    _enableUSB: function() {
        var self = this;
        this.connected = false;
        this.oldPorts = "";
        window.setTimeout(function() {
            self._scan();
        }, 500);
    },
    _scan: function() {
        var self = this;
        self._debug("HASPERM...");
        self.hasPerm = self.sckTool.setCallback(function(from, output) {
            if (output == "disconnect") {
                if (self.isFlashing) {
                    self._debug("Disconnected by plugin request", 1);
                }
            } else {
                output = output.replace(/Leonardo/g, "");
                output = output.replace(/Arduino/g, "Smart Citizen Kit");
                output = output.replace(/manualy/g, "manually");
                self._message(output);
            }
        });
        if (!self.hasPerm) {
            self._message("You need to grant permissions to the Codebender extension.");
        }
        self._debug("PERMISSION:");
        self._getFire();
        setInterval(function() {
            self._getFire();
        }, 2000);
    },
    _setSCKPort: function() {
        var self = this;
        self._debug("SCANNING...", 4);
        self._debug(self.ports);
        var portsAvail = self.ports.split(",");
        var portsDataset = {}
        for (var i = 0; i < portsAvail.length; i++) {
            var port = portsAvail[i];
            if (port != "") {
                portsDataset[port] = {};
                if (portsAvail[i].indexOf("usbmodem") != -1) {
                    self.sckPort = port;
                    portsDataset[port].description = "Smart Citizen" + " (Port: " + port + ")";
                } else {
                    portsDataset[port].description = "Port " + port;
                }
            }
        }
        self.portsList = portsDataset;
        self.startUI.createupdatePortSelect();
    },
    _getFire: function() {
        var self = this;
        self.sckTool.getPorts(function(portsAvailable) {
            if (portsAvailable != self.oldPorts) {

                var jsonPorts = $.parseJSON(portsAvailable);
                self.ports = [];
                $.each(jsonPorts, function(index, elem) {
                    self.ports += elem['port'];
                    if (index != Object.keys(jsonPorts).length - 1) self.ports += ',';
                });
                self._setSCKPort();
                self._debug(self.ports, 2);
                self.oldPorts = portsAvailable;
            }
        });
    },
    _disconnect: function() {
        var self = this;
        self._debug("disconnecting!", 2);
        self.connected = false;
        self.sckTool.serialMonitorSetStatus();

    },
    _checkPermissions: function() {
        var self = this;
        if ((navigator.appVersion.indexOf("X11") != -1) || (navigator.appVersion.indexOf("Linux") != -1)) {
            var message = 'If you have issues connecting with your kit on Linux ensure you have the appropiate permissions to access the serial port. You can quickly solve this by installing the latest Arduino IDE <i>(sudo apt-get install arduino arduino-core)</i> or manually following this <a target=\"_blank\" href=\"http://codebender.uservoice.com/knowledgebase/articles/95620-my-arduino-is-not-recognized-by-codebender-what-s"\">guide</a>.';
            self._message(message);
        }
    },
    initPluginAuto: function(pluginReady) {
        var self = this;
        var validate = function(status) {
            self._debug(status);
            if (status == true) {
                pluginReady();
            } else if (status == "available") {
                self._startmessage('<strong>Preparing the installation...</strong>');
                self._startmessage('<strong>To configure your kit you will need to install the Smart Citizen Kit App for Chrome<button id="install-button">Add to Chrome</button></strong>You can also install it manually from the <a href="' +  self.pluginChromeStoreURL + '" target="_blank">Chrome store</a> and refresh the page.');
                self.$elem.find('#install-button').click(function() {
                    chrome.webstore.install(self.pluginChromeStoreURL, function() {
                        self._startmessage('<strong>Finishing the installation...</strong>');
                        setTimeout(function() {
                            self.initPlugin(validate);
                        }, 2000);
                    }, function() {
                        setTimeout(function() {
                            self.initPlugin(validate);
                        }, 2000);
                    });
                });
            } else {
                self._startmessage("<strong>Sorry, currently we just support Google Chrome for configuring your Smart Citizen Kit. You can download it <a href='https://www.google.com/chrome/browser/desktop/index.html'>here</a></strong>");
            }
        }
        self.initPlugin(validate);
    },
    initPlugin: function(callback) {
        var self = this;
        $('head').append('<link rel="chrome-webstore-item" href="' + self.pluginChromeStoreURL + '">');
        if (window.chrome && !self._isMobile()) {
            self.sckTool = new window.SckToolChromeAppConnector();
            self.sckTool.getVersion(function(version) {
                if (!version.hasOwnProperty("error")) {
                    self.sckTool.init(function() {
                        self._enableUSB();
                        self._debug(version, 1);
                        self._debug("Plugin installed and ready");
                        callback(true);
                    });
                } else {
                    self._debug("Plugin supported but need to be installed");
                    callback("available"); //Check this!
                }
            });
        } else {
            self._debug("Plugin not supported on this browser");
            callback(false);
        }
    },
    _isMobile: function() {
        return navigator.userAgent.match(/Android/i) ? true : false || navigator.userAgent.match(/BlackBerry/i) ? true : false || navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false || navigator.userAgent.match(/IEMobile/i) ? true : false;
    },
    _parseVersionString: function(str) {
        if (typeof(str) != 'string') {
            return false;
        }
        var x = str.split('.');
        // parse from string or default to 0 if can't parse
        var maj = parseInt(x[0]) || 0;
        var min = parseInt(x[1]) || 0;
        var pat = parseInt(x[2]) || 0;
        var bui = parseInt(x[3]) || 0;
        return {
            major: maj,
            minor: min,
            patch: pat,
            build: bui
        }
    },
    _compareExtensionVersions: function(firstVersion, secondVersion) {
        var major = firstVersion.major - secondVersion.major;
        var minor = firstVersion.minor - secondVersion.minor;
        var patch = firstVersion.patch - secondVersion.patch;
        var build = firstVersion.build - secondVersion.build;
        if (major != 0) return major;
        if (minor != 0) return minor;
        if (patch != 0) return patch;
        return build;
    },
    stringNumberProperties: function(obj) {
        for (var property in obj) {
            if (obj.hasOwnProperty(property)) {
                if (!isNaN(obj[property])) obj[property] = obj[property].toString();
            }
        }
        return obj;
    },
    pluginChromeStoreURL: "https://chrome.google.com/webstore/detail/llohmdkdoablhnefekgllopdgmmphpif",
    firmwaresPath: "http://setup.smartcitizen.me/firmwares/json/",
    lineBuffer: [],
    lineString: "",
    cmdStatus: "NO",
    isCmd: false,
    isSetCmd: true,
    cmdRetries: 2,
    setupCounter: 0,
    isFlashing: false,
    latestFirmwareVersion: 90,
    initPluginPID: null,
    isAdvanced: false,
    pluginStableVersion: "1.6.0.8",
    sck: {
        mac: "",
        config: {
            nets: {},
            update: {}
        },
        version: {
            firmware: "",
            board: ""
        }
    },
    errors: {
        flashing: {
            1: "Could not upload sketch to your Smart Citizen Board. Try unplugging your Smart Citizen Kit and connecting it again.",
            256: "Could not open serial port. Make sure you have selected the correct device and serial port.",
            "-1": "Couldn’t find a Smart Citizen Kit on the selected port. Please, check that you have the correct port selected. If it is correct, try pressing the board’s reset button after initiating the upload"
        }
    },
    netSettings: {
        seqModes: {
            "OPEN": {
                id: 0,
                description: "Open Wi-Fi network"
            },
            "WEP": {
                id: 1,
                description: "WEP secured Wi-Fi network"
            },
            "WPA1": {
                id: 2,
                description: "WPA1 secured  Wi-Fi network"
            },
            "WPA2": {
                id: 4,
                description: "WPA2 secured Wi-Fi network"
            },
            "WEP64": {
                id: 8,
                description: "WEP64 secured Wi-Fi network"
            },
        },
        antenaModes: {
            "false": {
                id: 0,
                description: "No external antena added, default."
            },
            "true": {
                id: 1,
                description: "External antena added."
            },
        }
    },
    firmware: {
        "90": {
            description: "Firmware 0.9.0"
        },
        "86": {
            description: "Firmware 0.8.6"
        },
        "85": {
            description: "Firmware 0.8.5"
        },
        "84": {
            description: "Firmware 0.8.4"
        }
    },
    boards_dev: {
        "10": {
            name: 'SCK 1.0',
            version: '1.0',
            description: 'SmartCitizen Ambient Kit 1.0 - "Goteo Board"',
            firmware: {
                firmwareFile: "sck_beta_k.1.0_v.0.8.6.json",
                latestVersion: "0.8.6"
            },
            upload: {
                protocol: 'avr109',
                maximum_size: "28672",
                speed: "57600",
                disable_flushing: 'true'
            },
            bootloader: {
                low_fuses: '0xff',
                high_fuses: '0xd8',
                extended_fuses: '0xcb',
                path: 'caterina',
                file: 'Caterina-Leonardo.hex',
                unlock_bits: '0x3F',
                lock_bits: '0x2F'
            },
            build: {
                vid: '0x2341',
                pid: '0x8036',
                mcu: 'atmega32u4',
                f_cpu: '16000000L',
                core: 'arduino',
                variant: 'leonardo'
            }
        },
        "11": {
            description: 'SmartCitizen Ambient Kit 1.1 - "Kickstarter Board"',
            name: 'SCK 1.1',
            version: '1.1',
            firmware: {
                firmwareFile: "sck_beta_k.1.1_v.0.8.6.json",
                latestVersion: "0.8.6"
            },
            upload: {
                protocol: 'avr109',
                maximum_size: '28672',
                speed: '57600',
                disable_flushing: 'true'
            },
            bootloader: {
                low_fuses: '0xff',
                high_fuses: '0xd8',
                extended_fuses: '0xce',
                path: 'caterina-LilyPadUSB',
                file: 'Caterina-LilyPadUSB.hex',
                unlock_bits: '0x3F',
                lock_bits: '0x2F'
            },
            build: {
                mcu: 'atmega32u4',
                f_cpu: '8000000L',
                vid: '0x1B4F',
                pid: '0x9208',
                core: 'arduino',
                variant: 'leonardo'
            },
        },
        "12": {
            name: 'SCK 1.0',
            version: '1.0',
            description: 'SmartCitizen Ambient Kit 1.0 - BETA 0.9 Firmware- "Goteo Board"',
            firmware: {
                firmwareFile: "sck_beta_k.1.0_v.0.9.0.json",
                latestVersion: "0.9.0"
            },
            upload: {
                protocol: 'avr109',
                maximum_size: "28672",
                speed: "57600",
                disable_flushing: 'true'
            },
            bootloader: {
                low_fuses: '0xff',
                high_fuses: '0xd8',
                extended_fuses: '0xcb',
                path: 'caterina',
                file: 'Caterina-Leonardo.hex',
                unlock_bits: '0x3F',
                lock_bits: '0x2F'
            },
            build: {
                vid: '0x2341',
                pid: '0x8036',
                mcu: 'atmega32u4',
                f_cpu: '16000000L',
                core: 'arduino',
                variant: 'leonardo'
            }
        },
        "13": {
            description: 'SmartCitizen Ambient Kit 1.1 - BETA 0.9 Firmware -  "Kickstarter Board"',
            name: 'SCK 1.1',
            version: '1.1',
            firmware: {
                firmwareFile: "sck_beta_k.1.1_v.0.9.0.json",
                latestVersion: "0.9.0"
            },
            upload: {
                protocol: 'avr109',
                maximum_size: '28672',
                speed: '57600',
                disable_flushing: 'true'
            },
            bootloader: {
                low_fuses: '0xff',
                high_fuses: '0xd8',
                extended_fuses: '0xce',
                path: 'caterina-LilyPadUSB',
                file: 'Caterina-LilyPadUSB.hex',
                unlock_bits: '0x3F',
                lock_bits: '0x2F'
            },
            build: {
                mcu: 'atmega32u4',
                f_cpu: '8000000L',
                vid: '0x1B4F',
                pid: '0x9208',
                core: 'arduino',
                variant: 'leonardo'
            }
        }
    },
    boards_stable: {
        "10": {
            name: 'SCK 1.0',
            version: '1.0',
            description: 'SmartCitizen Ambient Kit 1.0 - "Goteo Board"',
            firmware: {
                firmwareFile: "sck_beta_k.1.0_v.0.9.0.json",
                latestVersion: "0.9.0"
            },
            upload: {
                protocol: 'avr109',
                maximum_size: "28672",
                speed: "57600",
                disable_flushing: 'true'
            },
            bootloader: {
                low_fuses: '0xff',
                high_fuses: '0xd8',
                extended_fuses: '0xcb',
                path: 'caterina',
                file: 'Caterina-Leonardo.hex',
                unlock_bits: '0x3F',
                lock_bits: '0x2F'
            },
            build: {
                vid: '0x2341',
                pid: '0x8036',
                mcu: 'atmega32u4',
                f_cpu: '16000000L',
                core: 'arduino',
                variant: 'leonardo'
            }
        },
        "11": {
            description: 'SmartCitizen Ambient Kit 1.1 - "Kickstarter Board"',
            name: 'SCK 1.1',
            version: '1.1',
            firmware: {
                firmwareFile: "sck_beta_k.1.1_v.0.9.0.json",
                latestVersion: "0.9.0"
            },
            upload: {
                protocol: 'avr109',
                maximum_size: '28672',
                speed: '57600',
                disable_flushing: 'true'
            },
            bootloader: {
                low_fuses: '0xff',
                high_fuses: '0xd8',
                extended_fuses: '0xce',
                path: 'caterina-LilyPadUSB',
                file: 'Caterina-LilyPadUSB.hex',
                unlock_bits: '0x3F',
                lock_bits: '0x2F'
            },
            build: {
                mcu: 'atmega32u4',
                f_cpu: '8000000L',
                vid: '0x1B4F',
                pid: '0x9208',
                core: 'arduino',
                variant: 'leonardo'
            }
        }
    },
};
if (typeof Object.create !== 'function') {
    Object.create = function(o) {
        function F() {} // optionally move this outside the declaration and into a closure if you need more speed.
        F.prototype = o;
        return new F();
    };
}
(function($) {
    // Start a plugin
    $.fn.sckapp = function(options) {
        if (this.length) {
            return this.each(function() {
                var mysckapp = Object.create(sckapp);
                mysckapp.init(options, this); // `this` refers to the element
                $.data(this, 'sckapp', mysckapp);
            });
        }
    };
})(jQuery);
