/*!
 * The Smart Citizen Tool v0.6.0 (http://smartcitizen.me)
 * 2013-2015 SmartCitizen
 * Licensed under MIT
 */
var debugLevel = 2; // 0 no messages, 5 all messages

var sckapp = {
    init: function(options, elem) {
        this.options = $.extend({}, this.options, options);
        this.elem = elem;
        this.$elem = $(elem);
        this.debugLevel = debugLevel;
        this._build();
        this.monitorMode = false;
        this.flashedOK = false;
        this.isSyncing = false;
        return this;
    },
    options: {},
    _build: function() {
        var self = this;
        this.isAdvanced = true;
        self.initBlocksUI();
        self.initPluginAuto(function() {
            // self._setBoardListAvailable();
            // self._startmessage();
            self.initInternalUI();
            self._run(true);
            self._initEvents();
        });
        self._initEvents();
    },
    _initEvents: function() {
        var self = this;
        window.onbeforeunload = function() {
            self._monitorMode(false);
            self._disconnect();
        };
    },
    _startmessage: function(message) {
        message = message || "";
        var msgBlock = $('.start-message');
        msgBlock.addClass('lead');
        msgBlock.empty();
        // var msg = $("<p>").html(message);
        msgBlock.append(message);
    },
    _updateBlock: function(wichBlock, message, animate) {
        animate = animate || false;
        message = message || "";
        var msgBlock = $(wichBlock);
        msgBlock.empty();
        if (animate){
            msgBlock.slideUp(1);
            msgBlock.append(message);
            msgBlock.slideDown(150);
        } else {
            msgBlock.append(message);
        }
    },
    _message: function(message, red = false, green = false) {
        var msgBlock = $('.messages-block');
        if (msgBlock.children().length >= 25) msgBlock.children().first().remove();
        if (red) {
            var msg = $("<span style='color:#BC6060'>").html("&#x2713; " + message + "</span><br>");
        } else if (green){
            var msg = $("<span style='color:#16ad55'>").html("&#x2713; " + message + "</span><br>");
        } else {
            var msg = $("<span>").html("&#x2713; " + message + "</span><br>");
        }
        msgBlock.append(msg);
        msgBlock.scrollTop(msgBlock.prop("scrollHeight"));
    },
    _debug: function(message, messageLevel) {
        messageLevel = messageLevel || 1;
        if (messageLevel <= this.debugLevel) console.log(message); //This is temporary. Will be implemented as log.proto
    },
    initBlocksUI: function() {
        this.$elem.addClass("scktool");
        this.$elem.attr("layout", "row");

        this.$elem.append($("<div>").addClass("consoleArea"));
        $(".consoleArea").append([
            $("<div>").addClass("messages-block"),
            $("<div>").addClass("credits-block").html('<p>Powered by <a target="_blank" href="https://github.com/fablabbcn/BabelFish"> BabelFish</a> technology by <a target="_blank" href="http://codebender.cc/">Codebender</a>.</p>')
        ]);
        $(".messages-block").attr("flex");

        this.$elem.append($("<div>").addClass("configArea"));
        $(".configArea").attr("flex");
        $(".configArea").append([
            $("<div>").addClass("start-message"),
            $("<div>").addClass("start-block"),
            $("<div>").addClass("board-description"),
            $("<div>").addClass("firmware"),
            $("<div>").addClass("mac"),
            $("<div>").addClass("networks"),
            $("<div>").addClass("netList"),
            $("<div>").addClass("updateTitle"),
            $("<div>").addClass("calculation"),
            $("<div>").addClass("updateList"),
            $("<div>").addClass("config-block")
        ]);
    },
    resetProcess: function(){
        var msgBlock = $('.messages-block');
        msgBlock.children().remove();
        this.$elem.find(".board-description").children().fadeOut(200, function() { $(this).remove(); });
        this.$elem.find(".firmware").children().fadeOut(200, function() { $(this).remove(); });
        this.$elem.find(".mac").children().fadeOut(200, function() { $(this).remove(); });
        this.$elem.find(".networks").children().fadeOut(200, function() { $(this).remove(); });
        this.$elem.find(".netList").children().fadeOut(200, function() { $(this).remove(); });
        this.$elem.find(".updateTitle").children().fadeOut(200, function() { $(this).remove(); });
        this.$elem.find(".calculation").children().fadeOut(200, function() { $(this).remove(); });
        this.$elem.find(".updateList").children().fadeOut(200, function() { $(this).remove(); });
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

            if (name == "ssid" || name == "password") {   //max length
                input.attr("maxlength", "19");
                input.keypress( function(key) {
                    if (key.charCode == 36) {
                        return false;
                    }
                });
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
            return this.createInput("password", value);
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
            return this.createInput("ext_antenna", value, "checkbox", "External antenna");
        }
        _netsUI.createDeleteButton = function() {
            var pasThis = this;
            var deleteButton = this.createButton("remove", "<span><img src='./assets/images/close_icon_blue.svg'</span>", "button", "close-net", false);
            deleteButton.click(function() {
                if ($(".nets-list").children().length > 1) {
                    pasThis.deleteGroupElement($(this).parent().parent().index());
                }
            });
            return deleteButton;
        }
        _netsUI.createAddButton = function() {
            var pasThis = this;
            var addButton = this.createButton("remove", "Add +", "button", "", false);
            addButton.click(function() {
                pasThis.createGroupElement();
            });
            return addButton;
        }
        _netsUI.getSSIDElement = function(id) {
            return this.getInput("ssid", id);
        }
        _netsUI.getPasswordElement = function(id) {
            return this.getInput("password", id);
        }
        _netsUI.getAuthElement = function(id) {
            return this.getSelectElement("auth", id);;
        }
        _netsUI.getAntenaElement = function(id) {
            return this.widget.list.children().eq(id).find("input[name='ext_antenna']").is(":checked");
        }
        _netsUI.createGroupElement = function(id, data) {
            if (this.widget.list.children().length < 5) {
                data = data || {
                    ssid: "",
                    password: "",
                    auth: "WPA2",
                    ext_antenna: false
                };
                id = id || this.widget.list.length;
                var leftElements = [];
                leftElements.push(this.createSSIDElement(data.ssid));
                leftElements.push(this.createPasswordElement(data.password));
                var left = $('<div>').addClass('left');
                left.append(leftElements);
                var rightElements = [];
                if (this.widget.list.children().length >= Number(self.sck.config.hardcodedNets)){
                    rightElements.push(this.createAntenaElement(data.ext_antenna));
                    rightElements.push(this.createDeleteButton());
                } else {
                    var hardCodedLabel = $('<div>').addClass('hardCodedNetwork');
                    hardCodedLabel.html("Config hardcoded in firmware");
                    rightElements.push(hardCodedLabel);
                    rightElements.push(this.createAntenaElement(data.ext_antenna));
                }
                rightElements.push(this.createAuthElement(data.auth));
                var right = $('<div>').addClass('right relative');
                right.append(rightElements);
                var wrapper = $('<div>').addClass('net-item').addClass('formContainer clear');
                left.appendTo(wrapper);
                right.appendTo(wrapper);
                wrapper.appendTo(this.widget.list);
            } else {
                var tempText = $(".netmessage").html();
                if (tempText.indexOf("maximum") == -1) {
                    self._message("Maximum 5 wifi networks, sorry");
                    $(".netmessage").html("<div style='margin-left:15px;'><span style='font-size:.92em; color:red'> 5 wifi networks maximum, please</span></div>");
                    setTimeout(function(){
                        $(".netmessage").html(tempText);
                    }, 3000);
                }
            }
        }
        _netsUI.deleteGroupElement = function(id) {
            this.widget.list.children().eq(id).remove();
        }
        _netsUI.getGroupElement = function(id) {
            // temporary - will be upgraded - key order on the nets objects is important (ssid, auth, password, ext_antena)
            var net = {};
            net.ssid = this.getSSIDElement(id);
            net.auth = this.getAuthElement(id);
            net.password = this.getPasswordElement(id);
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
                this.widget = this.createWidgetWrapper('nets', '', '');
                // $(".networks").append(this.createAddButton());
                $(".networks").append($('<div>').addClass('netmessage'));
                this.createElements(nets);
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
            range.find("input").on("input", function() {
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
            range.find("input").on("input", function() {
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
                var postUnit = posts + ((posts > 1) ? " posts" : " post")
                var updatedText = "<desc>Sensor reading every " + this.timeUI(resolution) + "<br/>Publishing " + postUnit + " every " + this.timeUI(posts*resolution) + "</desc>";
                self._updateBlock('.calculation', updatedText);
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
            this.widget.append(this.createSensorResolution(updates.resolution));
            this.widget.append(this.createSensorPosts(updates.posts));

            $('input[type="range"]').rangeslider(); //tmp
        }
        _updatesUI.setSensorResolution = function(value) {
            this.setRangeElement("resolution", value)
        }
        _updatesUI.setSensorPosts = function(value) {
            this.setRangeElement("posts", value)
        }
        _updatesUI.setSensorResolutionAndPosts = function(updates) {
            this.setSensorResolution(updates.resolution);
            this.setSensorPosts(updates.posts);
            this.updateSensorUpdate(updates);
        }
        _updatesUI.getSensorPosts = function() {
            posts = this.getRangeElement("posts");
            posts = (posts >= 1) ? posts : 1;
            return posts;
        }
        _updatesUI.createUpdatesWidget = function(updates) {
            updates = updates || {
                resolution: 60,
                posts: 1
            }
            if (!this.widget) {
                this.widget = this.createWidgetWrapper('updates', '', '');
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

        _configUI.createWidgetsWrapper = function(name) {
            name = name || false
            var block = $('<div>').addClass('widget-block').addClass('config');
            var body = $('<div>').addClass('body'); //limit-scroll
            var footer = $('<div>').addClass('footer');
            // var msg = $('<p>').addClass('messages-widget-block');
            // footer.append(msg);
            body.appendTo(block);
            // footer.appendTo(block);
            if (name == "nets"){
                block.appendTo($('.netList'));
            } else if (name == "updates") {
                // footer.append(msg);
                footer.appendTo(block);
                block.appendTo($('.updateList'));
                footer.append(this.createSyncButton());
            } else {
                block.appendTo(this.parent);
            }
            return body;
        }

        _configUI.createWidgetWrapper = function(name, title, description) {
            // if (!self.temp_block) {
            //     self.temp_block = this.createWidgetsWrapper(name);
            // }
            self.temp_block = this.createWidgetsWrapper(name);
            var section = $('<div>').addClass('section').addClass('relative').addClass(name);
            var title = $('<h4>').text(title);
            var description = $('<p>').text(description);
            if (name != "nets" && name != "updates") {
                title.appendTo(section);
                description.appendTo(section);
            }
            section.appendTo(self.temp_block);
            return section;
        }

        _configUI.createSyncButton = function() {
            var syncButton = this.createButton("remove", "Sync settings", "submit", "", false);
            syncButton.click(function() {
                if (!self.isFlashing && !self.isSyncing) {
                    syncButton.html('Syncing settings');
                    syncButton.anim = setInterval(function(){
                        if (syncButton.html() == 'Syncing settings') {
                            syncButton.html('Syncing settings.');
                        } else if (syncButton.html() == 'Syncing settings.') {
                            syncButton.html('Syncing settings..');
                        } else if (syncButton.html() == 'Syncing settings..') {
                            syncButton.html('Syncing settings...');
                        } else if (syncButton.html() == 'Syncing settings...'){
                            syncButton.html('Syncing settings');
                        }
                    }, 500);
                    self._sync();
                } else if (self.isFlashing) {
                    self._message("Flashing your kit, be patient!");
                } else if (self.isSyncing) {
                    self._message("Syncing your kit, be patient!");
                }
            });
            _configUI.parent.on("sync-done", function() { //temp
                clearInterval(syncButton.anim);
                syncButton.html('Settings Synced');
                window.setTimeout(function() {
                    $('.config-block').trigger( "sync-ready" );
                }, 3000);
            });
            _configUI.parent.on("sync-ready", function() { //temp
                syncButton.html('Sync settings');
            });
            _configUI.parent.on("already-synced", function() {
                syncButton.html('Nothing To Sync');
                window.setTimeout(function() {
                    $('.config-block').trigger( "sync-ready" );
                }, 3000);
            });
            _configUI.parent.on("sync-fail", function() { //temp
                clearInterval(syncButton.anim);
                syncButton.html('Sync Failed');
                window.setTimeout(function() {
                    $('.config-block').trigger( "sync-ready" );
                }, 3000);
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
            var value = (self.sck.version.board) || "11";
            var version = this.createVersionSelect(value);
            version.change(function() {
                self.sck.version.board = this.value;
            });
            return version;
        }
        _uploadUI.getVersionSelect = function(id) {
            return this.getSelectElement('version');;
        }
        _uploadUI.createUploadElement = function(trigger, whatVersion) {
            if (whatVersion == -1){
                var uploadElements = [];
                uploadElements.push(this.createBoardVersion());
                this.widget = this.createWidgetWrapper('upload', '', '', trigger, 'Install Firmware');
                this.widget.append(uploadElements);
                this.widget.parent
            } else {
                if (whatVersion == 0) {
                    this.widget = this.createWidgetWrapper('upload', '', '', trigger, 'Update Firmware');
                } else {
                    this.widget = this.createWidgetWrapper('upload', '', '', trigger, 'Reinstall Firmware');
                }
            }
        }
        return _uploadUI;
    },
    initUploadWidets: function() {

        var self = this;
        var _configUI = this.initUIBasics();
        var widget = {};

        _configUI.parent = $('.firmware');

        _configUI.createWidgetsWrapper = function(trigger, label) {
            var block = $('<div>').addClass('widget-block');
            var body = $('<div>').addClass('body');
            block.append(this.createUploadButton(trigger, label));
            block.appendTo(this.parent);
            return body;
        }

        _configUI.createWidgetWrapper = function(name, title, description, trigger, label) {
            self.temp_block_upload = this.createWidgetsWrapper(trigger, label);
            var section = $('<div>').addClass('section').addClass(name);
            return section;
        }

        _configUI.createUploadButton = function(trigger, label) {
            label = label || "Upload firmware"
            var uploadButton = this.createButton("remove", label, "submit", "", false);
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
            selectElement.append('<option value="" selected="selected"></option>');
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
            startButton.children().click(function() {
                if (!self.isFlashing){
                    self.sckPort = parent.getPortSelect(); //temp
                    this.flashedOK = false;
                    if (self.sckPort) {
                        self.errors["printed"] = false;
                        startButton.children().text("Restart process");
                        trigger();
                    } else {
                        self._message(self.errors.serial["found"]);
                        self.startUI.createupdatePortSelect();
                    }
                } else {
                    self._message("Flashing your kit, be patient!");
                }
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
            return this.getSelectElement('port');
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
        self.isSyncing = true;
        var netsToSave = self.netsUI.getElements().slice(self.sck.config.hardcodedNets, self.netsUI.getElements().length);
        var localNets = self.sck.config.nets.slice(self.sck.config.hardcodedNets, self.sck.config.nets.length);
        var updatesToSave = self.updatesUI.getSensorResolutionAndPosts();
        var savedSomething = false;
        runSync("nets");
        function runSync(who){
            if (who == "nets"){
                if (!verifyNets(netsToSave, localNets)) {
                    self._message("Saving wi-fy network settings...")
                    savedSomething = true;
                    self._monitorMode(false);
                    window.setTimeout(function(){
                        self._setSCKNets(netsToSave, function(nets){
                            runSync("updates");
                        })
                    }, 1200);
                } else {
                    self._message("Wi-fy networks haven't changed!")
                    runSync("updates");
                }
            } else if (who == "updates"){
                if (!verifyUpdates(updatesToSave)) {
                    var extraTime = 0;
                    self._message("Saving update interval settings...")
                    if (!savedSomething) {
                        self._monitorMode(false);
                        extraTime = 1200;
                        savedSomething = true;
                    }
                    window.setTimeout(function(){
                        self._setSCKUpdates(updatesToSave, function(updates){
                            checkSync(netsToSave, updatesToSave);
                        })
                    }, extraTime);
                } else {
                    self._message("Update interval haven't change!")
                    checkSync(netsToSave, updatesToSave);
                }
            }
        }
        function verifyNets(nets, localNets){
            if (nets.length != localNets.length) {
                return false;
            }
            for (var i=0; i < nets.length; i++) {
                if (!self._compareNets(nets[i], localNets[i])) {
                    return false;
                }
            }
            return true ;
        }
        function verifyUpdates(updates){
            if (self.sck.config.update.resolution == updates.time && self.sck.config.update.posts == updates.updates) {
                return true ;
            } else {
                return false ;
            }
        }
        function checkSync(netsToSave, updates){
            if (savedSomething) {
                self._getInfo(function(ver){
                    var newlocalNets = self.sck.config.nets.slice(self.sck.config.hardcodedNets, self.sck.config.nets.length);
                    if(verifyNets(netsToSave, newlocalNets) && verifyUpdates(updates)){
                        self._message("<b>Settings synced!</b>");
                        self.isSyncing = false;
                        self._monitorMode(true);
                        $('.config-block').trigger( "sync-done" );
                        self._sendDoneEvent();
                        self._message("<b>For your kit to work properly</b>");
                        self._message("<b>Please push the RESET button or simply turn your kit ON/OFF</b>", false, true);
                    } else {
                        self._message("Sync failed... please try again", true)
                        $('.config-block').trigger( "sync-fail" );
                        self.isSyncing = false;
                    }
                })
            } else {
                $('.config-block').trigger( "already-synced" );
                self._message("Nothing to sync!!", true);
                self.isSyncing = false;
            }
        }
    },
    _postData() {
        self._message("Asking your kit to post data...")
        self._enterCmdMode(function() {
            self._sendCMD("post data", function(data) {
                self._debug(data, 2);
                self._exitCmdMode();
            }, false, 500);
        });
    },
    _monitorMode(on){
        var self = this;
        if(on) {
            if (!self.monitorMode) {
                self.monitorMode = true
                self._debug("Turning ON monitor mode (listening serial port)");
                self.monitorModePID = window.setInterval(function(){
                    self._serialRead();
                    self._disconnect();
                }, 1000);
            } else {
                self._debug("Monitor mode is already ON");
            }
        } else {
            self._debug("Turning OFF monitor mode");
            if (self.monitorMode) {
                window.clearInterval(self.monitorModePID);
                self.monitorMode = false
                window.setTimeout(function(){
                    self._disconnect();
                }, 1000);
            }
        }
    },
    _compareNets(netA, netB){
        if (netA.ssid != netB.ssid) {
            return false;
        } else if (netA.password != netB.password) {
            return false;
        } else if (netA.ext_antenna != netB.ext_antenna) {
            return false ;
        } else if (netA.auth != netB.auth) {
            return false;
        } else {
            return true;
        }
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
        self._message("Getting saved Wi-Fi networks...");
        self._startNets(function() {
            self._message("Getting saved time/updates settings...");
            self._startUpdates();
        });
    },
    _startUpdates: function(callback) {
        var self = this;
        self._getSCKUpdates(function(updates) {
            self.updatesUI.createUpdatesWidget(updates);
            if (callback) callback();
        });
    },
    _run: function(isFirst) {
        var self = this;
        isFirst = isFirst || false;
        var boardReady = function() {
            self._message("Thanks for waiting!");
            self._message("You can start configuring the kit.");
            self._message("Add a network, adjust the update interval,");
            self._message("And when you are finished click sync....")
        }
        var boardStarter = function(whatVersion) {
            //board unknown (is there another test to check if it is an arduino?)
            if (whatVersion != -2) {    //if we have access to serial port
                if (whatVersion == -1) {
                    self._message("<b>Unrecognized board!</b>");
                    self._message("Make sure you have selected the right port!");
                    self._message("If you are sure, click Install Firmware");
                    self._updateBlock('.board-description', '<desc><strong>Unrecognized board</strong>', true);
                    self._updateBlock('.firmware', "<desc>Make sure you have selected the right port!<br/>If you are sure, click Install Firmware</desc>", true);
                } else if (whatVersion == 1 || whatVersion == 0) {
                    //Board description update
                    var msg = "<desc><img style='margin-right:5px' src=./assets/images/kit_details_icon_normal_setup.svg> <strong>" + self._getBoardDescription().split(" - ")[0] + "</strong> - " + self._getBoardDescription().split(" - ")[1] + "</desc>";
                    self._updateBlock('.board-description', msg, true);
                    self._message("Your kit is a:");
                    self._message(self._getBoardDescription());

                    if (self.sck.version.firmware < self.latestFirmwareVersion) {
                        self._message("Your kit is running " + self._getFirmwareDescription() + "firmware.");
                        self._message("This is not the latest version.");
                        self._message("You need to update the firmware to continue!");
                        var firmMsg = "<font color = 'red'>version " + self._getFirmwareDescription() +  " (update recommended)</font>";
                    } else {
                        self._message("Your kit is running " + self._getFirmwareDescription() + " firmware.");
                        self._message("This is the latest version.");
                        self._message("You can skip the firmware update!");
                        var firmMsg = "<font color='green'>" + self._getFirmwareDescription() +  " (latest)</font>";
                    }
                    self._updateBlock('.firmware', "<desc>Firmware version " + firmMsg + "</desc>", true);

                    //only for suported firmware (version >= 93)
                    if (whatVersion == 1){

                        //mac address
                        self._updateBlock('.mac', "<desc><img style='margin-right:5px' src=./assets/images/mac_address_icon_setup.svg>  <strong>Mac Address:</strong> " + self.sck.mac + "</desc>");

                        //nets
                        self._updateBlock('.networks', "<desc><strong><img style='margin-right:5px' src=./assets/images/networks_icon_setup.svg>  Wi-Fi Networks</strong></desc>", true);
                        $(".networks").append(self.netsUI.createAddButton());
                        self.netsUI.createNetsWidget(self.sck.config.nets);

                        //updates
                        self._updateBlock('.updateTitle', "<desc><strong><img style='margin-right:5px' src=./assets/images/update_icon_setup.svg>  Update interval</strong>", true);
                        self.updatesUI.updateSensorUpdate(self.sck.config.update);
                        self.updatesUI.createUpdatesWidget(self.sck.config.update);
                    }
                }
                self._updateFirmware(function(state) {
                    if (state) boardReady();
                }, whatVersion);
                self._monitorMode(true);
            }
        }
        if (isFirst) {
            self._userStart(function() {
                if (self.isAlreadyStarted) {
                    self.resetProcess();
                } else {
                    self.isAlreadyStarted = true;
                }
                //scroll animation
                var duration = 300;
                $('html, body').stop().animate({
                    scrollTop: $(".messages-block").offset().top - 115
                }, duration*2);
                $(".messages-block").animate({
                    height: '575px'
                }, duration);

                self._getInfo(function(whatVersion) {
                    boardStarter(whatVersion);
                });

                self._sendStartEvent();    
            })
        } else {
            boardStarter(1);
        }
    },
    _SCKoutput: function(message){
        var self = this;
        var msgBlock = $('.messages-block');
        if (msgBlock.children().length >= 15) msgBlock.children().first().remove();


        if (message.indexOf("SCK Connected to Wi-Fi!!") > -1) {
            self._message("Your kit is connected to WI-Fi!")
        }

        if (message.indexOf("RTC Updated!!") > -1) {
            self._message("Your kit has updated his clock!")
        }

        if (message.indexOf("Posted to Server!") > -1) {
            self._message("Your kit has posted!!!")
            self._message("<b>Congratulations!!!</b>")
        }

        if (self.monitorMode) {
            message = message.replace(/(\r\n|\n|\r)/gm, "<br/>&#x2713; SCK >> ");
            if (message.substr(message.length - 7) == 'SCK >> ') {
                message = message.substr(0, message.length - 16);
            }
            var msg = $("<span style='color:#17A3D9'>").html("&#x2713; SCK >> " + message + "</span>");
            msgBlock.append(msg);
            msgBlock.scrollTop(msgBlock.prop("scrollHeight"));
        }
    },
    _getInfo: function(callback) {
      /*
      This function returns to callback: 1 = latest firmware version, 0 = recognized SCk with old firmware, -1 = unrecognized board
      arduino sends (| as separator):
        |version|MAC|ssid1 ssid2,pass1 pass2,auth1 auth2,ant1 ant2|hardcodedNets|timeUpdate|numPosts|
            *board, firmware and mac
            *ssid's, passwd's, antenna configurations and auth types.
            *reading interval, and number of posts
      */
      var self = this;

      //get all (only for firmware >= 93)
      var getAll = function(callback) {
        self._enterCmdMode(function() {
            self._sendCMD("get all", function(data) {
                 self._debug(data, 2);
                 self._exitCmdMode();
                 var validateMac = function(mac) {
                     var regex = /^(([a-f0-9]{2}:){5}[a-f0-9]{2},?)+$/i;
                     return regex.test(mac);
                 }
                 if (data.response == null){
                    if (self.errors["printed"]){ //we allready print serial port error
                        callback(-1);
                    } else { //if we DO have access to serial port but get a null response
                        callback(0)
                    }
                 } else if (data.response && ((data.response.match(/[|]/g) || []).length) == 7) {
                    var allData = data.response.split('|');

                    if (allData[1].indexOf('-') != -1) {
                        //board version
                        self.sck.version.board = Number(allData[1].split('-')[0].replace(/[^0-9]+/g, ''));
                        //firmware version
                        self.sck.version.firmware = Number(allData[1].split('-')[1].replace(/[^0-9]+/g, ''));
                    } else {
                        self.sck.version.board = 11;
                        self.sck.version.firmware = -1;
                    }

                    //mac address
                    if (validateMac(allData[2])) {
                        self.sck.mac = allData[2];
                    }
                    //networks
                    self.sck.config.nets = []
                    if (allData[3]) {
                        // var allNets = allData[3].split(',');
                        var allProps = allData[3].split(',');
                        if (allProps[0] == '') allProps = ['ssid', 'password', '0', '4'];
                        var allSsid = allProps[0].split(' ');
                        var allPhrase = allProps[1].split(' ');
                        var allAntenna = allProps[2].split(' ');
                        var allAuth = allProps[3].split(' ');
                        for (var i = 0; i < allSsid.length; i++) {
                            myNet = {};
                            myNet.ssid = allSsid[i].replace(/\$/g, " ");
                            myNet.password = allPhrase[i].replace(/\$/g, " ");
                            myNet.ext_antenna = (allAntenna[i] == 1) ? true : false;
                            for (var prop in self.netSettings.seqModes) {
                                if (self.netSettings.seqModes[prop].id == allAuth[i]) {
                                    myNet.auth = prop
                                }
                            }
                            self.sck.config.nets.push(myNet)
                        }
                    }
                    //updates
                    self.sck.config.hardcodedNets = parseInt(allData[4]);
                    self.sck.config.update.resolution = parseInt(allData[5]);
                    self.sck.config.update.posts = parseInt(allData[6]);
                    self._sendUpdateEvent(); //register mac device on platform
                    self._debug(self.sck);
                    if (self.sck.version.firmware >= 93) {
                        callback(1);
                    } else {
                        callback(0);
                    }
                 } else {
                    callback(0);
                 }
            }, true, 2000);
        });
      }

      var askBoard = function(callback) {
        getAll(function(isLatestVersion) {
          if (isLatestVersion == 1) {
            //latest version
            callback(1);
          } else if (isLatestVersion == -1) {
            //null response form serial port (error message should be already printed)
            callback(-2);
          } else if (isLatestVersion == 0) {
            self._message("Still working, looking for older firmware...");
            //fallbackMode
            self._getSCKVersion(function(sckVersion) {
                if (sckVersion.hardwareVersion) {
                    self.sck.version.firmware = sckVersion.firmwareVersion;
                    self.sck.version.board = sckVersion.hardwareVersion;
                    //older version
                    callback(0);
                } else {
                    //unrecognized board
                    callback(-1);
                }
            });
          }
        })

      }
      askBoard(callback);
    },
    _registerBoard: function(callback) {
        var self = this;

        var register = function() {

            getMac(function(mac) {
                if (mac) {
                    self.sck.mac = mac;
                    // self._sendUpdateEvent();
                    callback();
                } else {
                    self._message("Failed to get the mac address from the kit.", true);
                    self._message("Try again later!");
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
    _sendDoneEvent: function() {
        var self = this;
        self.$elem.trigger('sck_done', [self.sck]);
    },
    _sendStartEvent: function() {
        var self = this;
        self.$elem.trigger('sck_start', [self.sck]);
    },
    _startConfigManager: function(callback) {
        this._startGetAll();
    },
    _userStart: function(callback) {
        var self = this;
        self.startUI.createStartElement(callback); //self._run

        self._windowsDriversWarning();

        self._message("Please reset your kit", false, true);
        self._message("Press the reset button or switch it off-on.", false, true);
        self._message("Select your kit Serial Port");
        self._message("And click Start process...");
    },
    _windowsDriversWarning: function() {
        if (navigator.platform.toLowerCase().indexOf("win") != -1) {
            this._message("Remember on Windows you need the Arduino drivers to be installed, you can easily follow this <a  target='_blank' href='http://docs.smartcitizen.me/#/start/how-to-install-the-drivers-on-windows'>guide</a>");
        }
    },
    _checkVersion: function(callback) {
        var self = this;
        var validateVersion = function(sckVersion) {
            if (sckVersion.firmwareVersion == false || sckVersion.firmwareVersion < self.latestFirmwareVersion) {
                return false;
            } else {
                return true;
            }
        }
        var checkVersion = function(callback) {
            self._getSCKVersion(function(sckVersion) {
                self.sck.version.firmware = sckVersion.firmwareVersion;
                self.sck.version.board = sckVersion.hardwareVersion;
                callback(validateVersion(sckVersion)); // here retry
            });
        }
        checkVersion(callback);
    },
    _updateFirmware: function(callback, whatVersion) {
        var self = this;
        var updateStatus = {
            counter: 1,
            max: 2,
        };
        var checkResult = function(status) {
            self.isFlashing = false;
            if (status != 20000 && status != 20001) {
                self._getInfo( function(whatVersion) {
                    if(whatVersion == 1) {
                        self._run(false);
                    } else {
                        failedUpdate(status);
                    }
                })
            } else {
                failedUpdate(status);
            }
        }
        var failedUpdate = function(status) {
            self._message("<b>Firmware update failed!</b>", true);
            if (self.errors.flashing[status]) {
              self._message(self.errors.flashing[status]);
            } else {
              self._message("Unrecognized error: " + status);
              self._message("Please contact Smart Citizen support")
            }
            callback(false);
        }
        var process = function() {
            if (!self.isFlashing) {
                self._monitorMode(false);
                self._message("Starting the flashing process...");
                self._message("Waiting for the kit to respond...")
                self.doubleTap = window.setTimeout(function(){
                    self._message("This is taking to long!!!<br/>&#x2713; If you haven't yet, <br/>&#x2713;<b> Try double tapping your kit reset button.</b>");
                }, 15000)
                window.setTimeout(function(){
                    self.sck.version.board = self.sck.version.board || self.uploadUI.getVersionSelect();
                    self._flash(self.sck.version.board, checkResult);
                }, 1200)
            } else {
                self._message("Flashing your kit, be patient!");
            }
        }
        self.uploadUI.createUploadElement(process, whatVersion);
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
            return "older or unknown";
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
                    self._message("Wi-Fi settings updated on your kit!");
                    callback(nets);
                } else if (retries < retriesMax) {
                    retries++;
                    process();
                } else {
                    self._message("Failed to update Wi-Fi settings on your kit!", true);
                    self._message("Please, try it again.")
                    $('.config-block').trigger( "sync-ready" ); //global scope event must change
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
                    self._message("Update interval settings updated on your kit!");
                    callback(true);
                } else if (retries < retriesMax) {
                    retries++;
                    process();
                } else {
                    self._message("Failed to update the update interval settings on the Smart Citizen Kit!", true);
                    self._message("Please, try it again.")
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
        updateStr = self.stringNumberProperties(update);
        self._enterCmdMode(function() {
            self._sendCMD("set time update " + updateStr.time, function(data) {
                self._sendCMD("set number updates " + updateStr.updates, function(data) {
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
                    self._sendCMD("set wlan phrase " + nets[index].password, function(data) {
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
        if(nets.length <= 0) {
            self._enterCmdMode(function() {
                self._sendCMD("clear nets", function(data) {
                    self._exitCmdMode();
                    callback(false);
                });
            });
        } else {
            netManager.auto(nets);
        }
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
            var netParams = ["ssid", "auth", "password", "ext_antenna"];
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
                            net.raw.password = splitAndPush(data);
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
                    self._message("No Wi-Fi networks saved yet on your kit.");
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
            }, false, 5000); //must be 15000
        });
    },
    _clearMemory: function(callback) {
        var self = this;
        self._enterCmdMode(function() {
            self._sendCMD("clear memory", function(data) {
                 self._debug(data, 2);
                 self._exitCmdMode();
                 callback(true);
            }, false, 10000); //this command takes a lot of time!! (erasing and rewritting eeprom)
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
            self._serialRead(true); // Check if here
            self._serialWriteCr("exit");
            self._disconnect();
        }, 200);
    },
    _serialWrite: function(msg) {
        var self = this;
        self._debugMessage(msg, "send");
        self.sckTool.serialWrite(msg);
        // self._debug(self.sckTool.readingInfo);
        if (self.sckTool.readingInfo == null && (msg.indexOf("\r") > -1 || msg.indexOf("\n") > -1) && !self.errors["printed"]) {
	        self._message(self.errors.serial["open"]);
            self._debug("connection error...", true);
            self._checkPermissions();
            self._disconnect(); //Dev. This must be checked!
            self._message(self.errors.serial["reset"]);
            self.errors["printed"] = true;
		}
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
            self._SCKoutput(line);
            self._input(line);
        }, function(from, line) {
            self._debug("  !! >> " + from + " " + line);
        });
    },
    _flash: function(boardID, callback) {
        var self = this;
        self.isFlashing = true;
        self._disconnect();
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
                window.clearInterval(self.doubleTap);
                if (progress) {
                    self.isFlashing = false;
                    self._debug("FLASH PROGRESS: " + progress);
                    if (progress == 20000){
                      self._debug("connection ERROR!!!");
                    } else if (progress == 20001){
                      self._debug("flashing TIMEOUT!!!");
                    }
                    callback(progress);
                } else {
                    self.flashedOK = true;
                    self._debug("FLASH OK!!");
                    self._message("<b>Firmware uploaded!</b>");
                    self._message("Clearing eeprom memory");
                    self._message("Please wait a moment...")
                    self._clearMemory(function(status) {
                        self.isFlashing = false;
                        callback(status);
                    });
                };
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
    		if (self.ports.indexOf(",") != -1) {
    			var portsAvail = self.ports.split(",");
    		} else if (self.ports != "") {
    			var portsAvail = [self.ports];
    		} else {
    			var portsAvail = "";
    		}
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
                if (i == 0) {
					if (!self.isFlashing) {
                        if (self.isAlreadyStarted) {
                            self._monitorMode(true);
                        }
					}
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

                if (self.monitorMode) {
                    self._monitorMode(false);
                }

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
        self.sckTool.serialMonitorSetStatus(); // This must be checked!
    },
    _checkPermissions: function() {
        var self = this;
        if ((navigator.appVersion.indexOf("X11") != -1) || (navigator.appVersion.indexOf("Linux") != -1)) {
            var message = 'If you are on Linux, check your serial port permissions. Here is a <a target=\"_blank\" href=\"http://codebender.uservoice.com/knowledgebase/articles/95620-my-arduino-is-not-recognized-by-codebender-what-s"\">guide</a>.';
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
                self._startmessage('<strong>To configure your kit you will need to install the Smart Citizen Kit App for Chrome<button id="install-button">Add to Chrome</button></strong>You can also install it manually from the <a href="' +  self.pluginChromeStoreURL + '" target="_blank">Chrome store</a> and refresh the page.');
                $('#install-button').click(function() {
                    self._startmessage('<strong>Preparing the installation...</strong>');
                    chrome.webstore.install(self.pluginChromeStoreURL, function() {
                        self._startmessage('<strong>Finishing the installation...</strong>');
                        setTimeout(function() {
                            self.initPlugin(validate);
                        }, 2000);
                    }, function() {
                        self._startmessage("<strong>We are sorry, something went wrong. Install it manually from the <a style='color: #06c2f0;' href='" +  self.pluginChromeStoreURL + "' target='_blank'>Chrome store</a> and refresh the page.</strong>");
                        setTimeout(function() {
                            self.initPlugin(validate);
                        }, 10000);
                    });
                });
            } else {
                self._startmessage("<strong>Sorry, currently we just support Google Chrome for configuring your Smart Citizen Kit. You can download it <a href='https://www.google.com/chrome/browser/desktop/index.html'>here</a></strong>");
            }
        }
        setTimeout(function() {
            self.initPlugin(validate);
        }, 500);
    },
    initPlugin: function(callback) {
        var self = this;
        $('head').append('<link rel="chrome-webstore-item" href="' + self.pluginChromeStoreURL + '">');
        var chrome = window.chrome || {};
        if (chrome.app && chrome.webstore && !self._isMobile()) {
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
    firmwaresPath: "https://setup.smartcitizen.me/firmwares/json/",
    lineBuffer: [],
    lineString: "",
    cmdStatus: "NO",
    isCmd: false,
    isSetCmd: true,
    cmdRetries: 2,
    setupCounter: 0,
    isFlashing: false,
    latestFirmwareVersion: 94,
    initPluginPID: null,
    isAdvanced: false,
    pluginStableVersion: "1.6.0.8",
    sck: {
        mac: "",
        config: {
            nets: [],
            update: {
              resolution: "",
              posts: ""
            },
            hardcodedNets: ""
        },
        version: {
            firmware: "",
            board: ""
        }
    },
    errors: {
        flashing: {
          20000: "<b>Comunication error.</b><br>&#x2713; Please reset your kit and reload this page<br>&#x2713; Or try upgrading manually with this <a target=\"_blank\" href=\"http://docs.smartcitizen.me/#/start/firmware-update-problem\">guide</a>.",
          // 20001: "Timeout comunication error. Please reset your kit and reload this page or try upgrading manually with this <a target=\"_blank\" href=\"http://docs.smartcitizen.me/#/start/firmware-update-problem\">guide</a>."
          20001: "<b>Timeout comunication error.</b><br/>&#x2713; Please try again<br/>&#x2713; But after clicking install firmware button<br>&#x2713;<b> Double tap your kit reset button.</b>"
        },
        serial: {
          open: "<b>We can't open the serial port!!!</b><br>&#x2713; Make sure no application is using the serial port (ex. Arduino IDE)",
          reset: "Please try <b>reloading</b> this page<br>&#x2713; And <b>resetting</b> your kit.",
          printed: false,
          found: "No serial port found!!!<br>&#x2713; Make sure cable is fully inserted."
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
                description: "No external antenna added, default."
            },
            "true": {
                id: 1,
                description: "External antenna added."
            },
        }
    },
    firmware: {
        "94": {
            description: "0.9.4"
        },
        "93": {
            description: "0.9.3"
        },
        "90": {
            description: "0.9.0"
        },
        "86": {
            description: "0.8.6"
        },
        "85": {
            description: "0.8.5"
        },
        "84": {
            description: "0.8.4"
        }
    },
    boards: {
        "10": {
            name: 'SCK 1.0',
            version: '1.0',
            description: 'SmartCitizen Ambient Kit 1.0 - "Goteo Board"',
            firmware: {
                firmwareFile: "sck_beta_k.1.1_v.0.9.4.json",
                latestVersion: "0.9.3"
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
                firmwareFile: "sck_beta_k.1.1_v.0.9.4.json",
                latestVersion: "0.9.3"
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
