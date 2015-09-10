/*!
 * The Smart Citizen Tool v0.8.0 (http://smartcitizen.me)
 * scktool-connector.js is proudly based in BabelFish by Codebender.cc
 * 2013-2015 SmartCitizen
 * Licensed under MIT
 */
function debugConnector(message) {
    if (debugLevel > 1) console.log(message); //This is temporary. Will be implemented as log.proto
}
debugConnector("BETA version. You are in developer mode!");
var extensionSet;
window.codebenderChromeDeveloperMode = true;
(function e(t, n, r) {
    function s(o, u) {
        if (!n[o]) {
            if (!t[o]) {
                var a = typeof require == "function" && require;
                if (!u && a) return a(o, !0);
                if (i) return i(o, !0);
                var f = new Error("Cannot find module '" + o + "'");
                throw f.code = "MODULE_NOT_FOUND", f
            }
            var l = n[o] = {
                exports: {}
            };
            t[o][0].call(l.exports, function(e) {
                var n = t[o][1][e];
                return s(n ? n : e)
            }, l, l.exports, e, t, n, r)
        }
        return n[o].exports
    }
    var i = typeof require == "function" && require;
    for (var o = 0; o < r.length; o++) s(r[o]);
    return s
})
({
    1: [function(require, module, exports) {
        if (!window.chrome) {
            throw Error("This doesn't seem to be chrome. No chorme obj.");
        }
        (function() {
            var config = require('./../common/config'),
                util = require('./../../tools/client-util'),
                rargs = require('./../common/rpc-args'),
                str = util.str,
                argsEncode = rargs.argsEncode,
                argsDecode = rargs.argsDecode;
            if (!window._rpcSender) window._rpcSender = (new Date).getTime();

            function err(msg) {
                throw new Error("[Client:error] " + msg);
            }
            var methodType = {
                    METHOD: false,
                    CLEANER: true,
                    LISTENER: true
                },
                bus;

            function ClientBus(config) {
                this.config = config;
                if (!chrome.runtime) {
                    throw err('No extention to provide permissions');
                }
                this.runtime_ = window.runtime_ || chrome.runtime;
                window.runtime_ = this.runtime_;
                this.ports = {};
                debugConnector("Contacting host on id:", this.config.extensionId);
            }
            ClientBus.prototype = {
                clientMessage: function(persist, msg, callbackWrap) {
                    callbackWrap = callbackWrap;
                    if (persist) {
                        dbg("Connecting to channel", msg.object);
                        var port = this.runtime_.connect(this.config.extensionId, {
                            name: msg.object
                        });
                        debugConnector(port);
                        port.postMessage(msg);
                        if (callbackWrap)
                            port.onMessage.addListener(callbackWrap);
                        else
                            dbg("Sent cleaner msg", msg);
                    } else {
                        dbg("Sending:", msg);
                        this.runtime_.sendMessage(this.config.extensionId, msg, {}, (function _removeMeFromStack(rsp) {
                            dbg("BUS received: ", rsp);
                            callbackWrap(rsp);
                        }).bind(this));
                    }
                },
                busCommand: function(cmd, var_args) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    this.clientMessage(false, {
                        listener: 'bus',
                        method: cmd,
                        args: args
                    });
                }
            };

            function RPCClient(config, obj_name) {
                console.assert(typeof(config.extensionId) == 'string', "Extension id should be a string");
                console.assert(typeof(obj_name) == 'string', "object name should be a string, not " + typeof(obj_name));
                if (chrome[obj_name]) {
                    var props = Object.getOwnPropertyNames(chrome[obj_name]);
                    props.forEach(function(p) {
                        var prop = chrome[obj_name][p];
                        if (prop instanceof Function) {
                            this[p] = prop.bind(chrome[obj_name]);
                        } else {
                            this[p] = prop;
                        }
                    }.bind(this));
                }
                if (!window.bus) window.bus = new ClientBus(config);
                this.obj_name = obj_name;
                if (!config.methods[obj_name])
                    err('Tried to connect to unconfigured object: chrome.' + obj_name);
                this.setup_methods(config.methods[obj_name]);
                this.bus = window.bus;
            }
            RPCClient.prototype = {
                setup_methods: function(config) {
                    this.availableListeners = [];
                    this.availableCleaners = {};
                    (config.methods || []).forEach(this.registerMethod.bind(this, methodType.METHOD));
                    (config.listeners || []).forEach(this.registerMethod.bind(this, methodType.LISTENER));
                    (Object.getOwnPropertyNames(this.availableCleaners) || []).forEach(this.registerMethod.bind(this, methodType.CLEANER));
                    this._setup = true;
                },
                registerMethod: function(isListener, entry) {
                    var name = entry.starter || entry,
                        names = name.split('.'),
                        method = names.pop(),
                        obj = names.reduce(function(ob, m) {
                            ob[m] = ob[m] || {};
                            return ob[m];
                        }, this) || this;
                    if (entry.cleaner)
                        this.availableCleaners[entry.cleaner] = entry.starter;
                    if (isListener)
                        this.availableListeners.push(name);
                    dbg("Registering method", method);
                    obj[method] = this._rpc.bind(this, name);
                },
                errorHandler: function(message, callback) {
                    if (callback.rpcErrorHandler)
                        callback.rpcErrorHandler(message);
                    throw err(message);
                },
                msgCallbackFactory: function(callback) {
                    if (!callback)
                        return callback;
                    callback.rpcErrorHandler = this.customErrorHandler;
                    var self = this,
                        stackList = [new Error("Stack tracing error").stack],
                        stackItem = this.msgCallbackFactory,
                        maxStack = 10,
                        ret = function(resp) {
                            try {
                                if (!resp)
                                    return true;
                                if (resp.error) {
                                    self.errorHandler("RPC call failed:" + resp.error, callback);
                                    chrome.runtime.lastError = resp.error;
                                    callback();
                                } else {
                                    if (callback) {
                                        return callback.apply(null, argsDecode(resp.args));
                                    }
                                }
                                return true;
                            } catch (e) {
                                debugConnector("REAL STACK:");
                                [e.stack].concat(ret.stackList).forEach(function(s) {
                                    s.split("\n").filter(function(l) {
                                        return l.indexOf("extensions::") == -1 && l.indexOf("RPCClient") == -1 && l.indexOf("_removeMeFromStack") == -1 && l.indexOf("Stack tracing error") == -1;
                                    }).forEach(function(l) {
                                        debugConnector(l);
                                    });
                                });
                                throw e;
                            }
                        };
                    while (stackItem && --maxStack) {
                        if (stackItem.stackList) {
                            stackList = stackList.concat(stackItem.stackList);
                            break;
                        }
                        stackItem = stackItem.caller;
                    }
                    ret.stackList = stackList;
                    ret.callbackId = callback.callbackId;
                    return ret;
                },
                callbackIdFactory: function(cb) {
                    if (typeof cb === 'function') {
                        var id = cb.callbackId || (new Date).getTime();
                        cb.callbackId = id;
                        return id;
                    } else {
                        return null;
                    }
                },
                _rpc: function(fnname, var_args) {
                    var args = Array.prototype.slice.call(arguments, 1),
                        rich_args = argsEncode(args),
                        msg = {
                            timestamp: (new Date).getTime(),
                            object: this.obj_name,
                            method: fnname,
                            args: rich_args,
                            error: null,
                            callbackId: this.callbackIdFactory(rich_args.callbackRaw),
                            sender: window._rpcSender
                        },
                        clientCallback = !(this.availableCleaners[fnname]) && rich_args.callbackRaw;
                    dbg("Calling chrome." + this.obj_name + '.' + fnname + "(", args, ")");
                    this._message(msg, clientCallback);
                },
                _message: function(msg, callbackRaw) {
                    if (!callbackRaw || typeof callbackRaw !== "function") {
                        debugConnector("Callback function missing or not defined!");
                        var callbackRaw = function() {};
                    }
                    var isListener = (this.availableListeners.indexOf(msg.method) != -1),
                        callbackWrap = this.msgCallbackFactory(callbackRaw);
                    this.bus.clientMessage(isListener && msg.object + '.' + msg.method, msg, callbackWrap);
                }
            };
            window.extentionAvailable = true;
            try {
                Object.getOwnPropertyNames(config.methods).forEach(function(m) {
                    debugConnector("Registering client for chrome.", m);
                    chrome[m] = new RPCClient(config, m);
                });
            } catch (err) {
                console.error(err.message);
                window.extentionAvailable = false;
            }
            if (window) {
                window.ClientBus = ClientBus;
                window.RPCClient = RPCClient;
            }
            module.exports.extentionAvailable = window.extentionAvailable;
        })();
    }, {
        "./../../tools/client-util": 22,
        "./../common/config": 2,
        "./../common/rpc-args": 3
    }],
    2: [function(require, module, exports) {
        var config = {
            extensionId: "llohmdkdoablhnefekgllopdgmmphpif",
            methods: {
                serial: {
                    methods: ['getDevices', 'send', 'connect', 'disconnect', 'setControlSignals', 'getControlSignals', 'getConnections', 'flush', 'onReceiveError.forceDispatch'],
                    listeners: [{
                        starter: 'onReceiveError.addListener',
                        cleaner: 'onReceiveError.removeListener'
                    }, {
                        starter: 'onReceive.addListener',
                        cleaner: 'onReceive.removeListener'
                    }]
                },
                usb: {
                    methods: ['getDevices', 'openDevice', 'findDevices', 'closeDevice', 'resetDevice', 'requestAccess', 'controlTransfer', 'setConfiguration']
                },
                storage: {
                    methods: ['local.get', 'local.set'],
                    listeners: [{
                        starter: 'onChanged.addListener',
                        cleaner: 'onChanged.removeListener'
                    }]
                },
                runtime: {
                    methods: ['getManifestAsync', 'getPlatformInfo']
                }
            }
        };
        if (window.chrome && window.chrome.runtime && window.chrome.runtime.id)
            config.extensionId = chrome.runtime.id;
        if (window.codebenderChromeDeveloperMode)
            try {
                module.exports = config;
                if (window)
                    window.config = config;
            } catch (e) {;
            }
    }, {}],
    3: [function(require, module, exports) {
        function binToHex(bin) {
            var bufferView = new Uint8Array(bin);
            var hexes = [];
            for (var i = 0; i < bufferView.length; ++i) {
                hexes.push(bufferView[i]);
            }
            return hexes;
        }

        function argsEncode(args) {
            var ret = {
                callbackRaw: null
            };
            ret.args = args.map(function(arg) {
                if (arg) {
                    if (arg instanceof Function) {
                        ret.callbackRaw = arg;
                    } else if (arg instanceof ArrayBuffer) {
                        return {
                            type: 'arraybuffer',
                            val: binToHex(arg)
                        };
                    }
                    if (arg.data && arg.data instanceof ArrayBuffer) {
                        arg.data = binToHex(arg.data);
                        return {
                            type: 'data-arraybuffer',
                            val: arg
                        };
                    }
                }
                return {
                    type: typeof(arg),
                    val: arg
                };
            });
            return ret;
        }

        function hexToBin(hex) {
            var buffer = new ArrayBuffer(hex.length);
            var bufferView = new Uint8Array(buffer);
            for (var i = 0; i < hex.length; i++) {
                bufferView[i] = hex[i];
            }
            return buffer;
        }

        function argsDecode(args, cbHandler) {
            return (args.args || []).map(function(arg) {
                switch (arg.type) {
                    case 'function':
                        return cbHandler;
                        break;
                    case 'arraybuffer':
                        return hexToBin(arg.val);
                    case 'data-arraybuffer':
                        arg.val.data = hexToBin(arg.val.data);
                    default:
                        return arg.val;
                        break;
                }
            });
        }
        try {
            module.exports = {
                argsDecode: argsDecode,
                argsEncode: argsEncode
            };
            window.hexToBin = hexToBin;
            window.binToHex = binToHex;
        } catch (e) {;
        }
    }, {}],
    4: [function(require, module, exports) {
        var parts = require('./parts.min'),
            _conf = null;

        function getMCUConf(mcu) {
            if (!_conf) {
                _conf = {};
                Object.getOwnPropertyNames(parts).forEach(function(pn) {
                    _conf[parts[pn].AVRPart.toLowerCase()] = parts[pn];
                });
            }
            return _conf[mcu];
        }
        module.exports.getMCUConf = getMCUConf;
    }, {
        "./parts.min": 9
    }],
    5: [function(require, module, exports) {
        var arraify = require('./util').arraify,
            Log = require('./logging').Log,
            log = new Log('Buffer');
        log.log = function() {};

        function storeAsTwoBytes(n) {
            var lo = (n & 0xff);
            var hi = (n >> 8) & 0xff;
            return [hi, lo];
        }

        function storeAsFourBytes(n) {
            return [(n & 0xff), (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff];
        }

        function hexRep(intArray) {
            if (intArray === undefined)
                return "<undefined>";
            var buf = "[";
            var sep = "";
            for (var i = 0; i < intArray.length; ++i) {
                var hex = intArray[i].toString(16);
                hex = hex.length < 2 ? "0" + hex : hex;
                buf += (" " + hex);;
            }
            buf += "]";
            return buf;
        }

        function binToBuf(hex) {
            if (hex instanceof ArrayBuffer)
                return hex;
            var buffer = new ArrayBuffer(hex.length);
            var bufferView = new Uint8Array(buffer);
            for (var i = 0; i < hex.length; i++) {
                bufferView[i] = hex[i];
            }
            return buffer;
        }

        function bufToBin(buf) {
            if (!buf instanceof ArrayBuffer)
                return buf;
            var bufferView = new Uint8Array(buf);
            var hexes = [];
            for (var i = 0; i < bufferView.length; ++i) {
                hexes.push(bufferView[i]);
            }
            return hexes;
        }

        function BufferReader(config) {
            var self = this;
            Object.keys(config || {}).forEach(function(k) {
                self[k] = config[k];
            });
            this.modifyDatabuffer = this.modifyDatabuffer.bind(this);
        }
        BufferReader.prototype = {
            register: function(buffer) {
                var self = this;
                this.buffer = buffer;
                buffer.appendReader(this);
                if (this.ttl) {
                    this.timeout_ = setTimeout(function() {
                        log.log("Reader timed out", self);
                        buffer.removeReader(self);
                        if (self.timeoutCb) {
                            self.timeoutCb();
                        } else {
                            throw Error("Unhandled async buffer read timeout.");
                        }
                    }, this.ttl);
                }
            },
            destroy: function() {
                log.log("Destroying reader from buffer", this.buffer);
                this.buffer.removeReader(this);
                if (this.timeout_)
                    clearTimeout(this.timeout_);
            },
            modifyDatabuffer: function() {
                if (Number.isInteger(this.expectedBytes) && this.buffer.databuffer.length >= this.expectedBytes) {
                    setTimeout(this.callback.bind(this, this.buffer.databuffer.slice(0, this.expectedBytes)), 0);
                    this.buffer.databuffer = this.buffer.databuffer.slice(this.expectedBytes);
                    return true;
                } else {
                    return false;
                }
            }
        };

        function Buffer(readerClass) {
            this.databuffer = [];
            this.readers = [];
            this.readerClass = readerClass;
            this.maxBufferSize = 1000;
        }
        Buffer.prototype = {
            removeReader: function(reader) {
                log.log("Removing reader:", reader);
                var len = this.readers.length;
                this.readers = this.readers.filter(function(r) {
                    return (r !== reader);
                });
            },
            appendReader: function(reader) {
                this.readers.push(reader);
            },
            runAsyncReaders: function() {
                var self = this;
                log.log("Running readers:", this.readers, ":", this.databuffer);
                this.readers.slice().some(function(r) {
                    return r && r.modifyDatabuffer(self) && (r.destroy() || true);
                });
            },
            readAsync: function(maxBytesOrConfig, cb, ttl, timeoutCb) {
                var reader;
                if (Number.isInteger(maxBytesOrConfig)) {
                    reader = new BufferReader({
                        expectedBytes: maxBytesOrConfig,
                        callback: cb,
                        ttl: ttl || 2000,
                        timeoutCb: timeoutCb
                    });
                } else {
                    reader = new BufferReader(maxBytesOrConfig);
                }
                reader.register(this);
                setTimeout(this.runAsyncReaders.bind(this), 0);
            },
            read: function(maxBytes, callback) {
                var len = this.databuffer.length,
                    accum = this.databuffer.splice(0, maxBytes);
                log.log("Reading from byffer [", maxBytes, "/", len, "]", hexRep(accum));
                setTimeout(function() {
                    callback({
                        bytesRead: accum.length,
                        data: accum
                    });
                }, 0);
            },
            write: function(readArg, errorCb) {
                var hexData = bufToBin(readArg.data);
                log.log("Dev said:", hexRep(hexData));
                this.databuffer = this.databuffer.concat(hexData);
                if (this.databuffer.length > this.maxBufferSize) {
                    if (errorCb)
                        errorCb("Receive buffer larger than " + this.maxBufferSize);
                    else
                        throw Error("Receive buffer larger than " + this.maxBufferSize);
                }
                if (this.readers.length > 0)
                    this.runAsyncReaders();
            },
            drain: function(callback) {
                var ret = this.databuffer,
                    self = this;
                log.log("Draining bytes: ", hexRep(this.databuffer));
                this.readers.slice().forEach(function(r) {
                    self.removeReader(r);
                    setTimeout(r.timeoutCb, 0);
                });
                this.databuffer = [];
                callback({
                    bytesRead: ret.length,
                    data: ret
                });
            },
            cleanup: function(callback) {
                log.log("Cleaning everything of buffer.", hexRep(this.databuffer));
                this.readers.slice().forEach(this.removeReader.bind(this));
                for (var i = 0; i < this.readers.length; i++) {
                    if (!this.readers[i]) {
                        delete this.readers[i];
                    } else {
                        throw Error("Buffer reader survived the cleanup" + this.readers[i]);
                    }
                }
                this.databuffer = [];
                if (callback) callback();
            }
        };
        module.exports.Buffer = Buffer;
        module.exports.hexRep = hexRep;
        module.exports.bufToBin = bufToBin;
        module.exports.storeAsTwoBytes = storeAsTwoBytes;
        module.exports.storeAsFourBytes = storeAsFourBytes;
        module.exports.binToBuf = binToBuf;
    }, {
        "./logging": 8,
        "./util": 19
    }],
    6: [function(require, module, exports) {
        module.exports = {
            LEONARDO_MAGIC_CONNECT_FAIL: -1,
            LEONARDO_MAGIC_DISCONNECT_FAIL: -1,
            LEONARDO_RECONNECT_TIMEOUT: -1,
            RESOURCE_BUSY: -22,
            UNKNOWN_MONITOR_ERROR: -22,
            CONNECTION_FAIL: 36000,
            DTR_RTS_FAIL: 1001,
            READER_TIMEOUT: 20000,
            IDLE_HOST: 20001,
            ZOMBIE_TRANSACTION: 20002,
            CONNECTION_LOST: 20003,
            FLUSH_FAIL: 20004,
            BUFFER_WRITE_FAIL: 20005,
            FORCE_DISCONNECT_FAIL: 20006,
            COMMAND_SIZE_FAIL: 20007,
            SIGN_ON_FAIL: 20008,
            BAD_RESPONSE: 20009,
            SPAMMING_DEVICE: 20010
        };
    }, {}],
    7: [function(require, module, exports) {
        var util = require("./util");

        function mergeChunks(blob, chunk) {
            if (blob && blob.data.length == 0)
                blob = null;
            if (chunk && chunk.data.length == 0)
                chunk = null;
            if (chunk === null || blob === null)
                return blob || chunk || {
                    addr: 0,
                    data: []
                };
            var minStart = Math.min(chunk.addr, blob.addr),
                maxEnd = Math.max(chunk.addr + chunk.data.length, blob.addr + blob.data.length),
                data = util.makeArrayOf(0, blob.addr - minStart).concat(blob.data).concat(util.makeArrayOf(0, maxEnd - (blob.data.length + blob.addr)));
            chunk.data.forEach(function(byte, byteRelAddr) {
                data[byteRelAddr + (chunk.addr - minStart)] = byte;
            });
            return {
                addr: minStart,
                data: data
            };
        }

        function hexToBytes(strData) {
            var tmp;
            return util.arraify(strData).reduce(function(arr, c, i) {
                if (i % 2) {
                    return arr.concat([Number.parseInt(tmp + c, 16)]);
                } else {
                    tmp = c;
                    return arr;
                }
            }, []);
        }

        function ParseHexFile(hexString) {
            var offsetLin = 0;

            function lineToChunk(line) {
                if (line.length == 0)
                    return null;
                var index = 0,
                    DATA = 0,
                    EOF = 1,
                    EXTENDED_SEG_ADDR = 2,
                    START_SEG_ADDR = 3,
                    EXTENDED_LIN_ADDR = 4,
                    START_LIN_ADDR = 5;

                function rng(length) {
                    var start = index,
                        end = index + length;
                    index = end;
                    return line.substring(start, end);
                }
                var start = rng(1),
                    length = Number.parseInt(rng(2), 16),
                    addr = Number.parseInt(rng(4), 16),
                    type = Number.parseInt(rng(2), 16),
                    strData = rng(length * 2),
                    actualCheck = hexToBytes(line.substring(1, index)).reduce(function(a, b) {
                        return a + b;
                    }, 0) & 0xff,
                    checksum = Number.parseInt(rng(2), 16),
                    byteData = hexToBytes(strData);
                util.assert(start == ':', "Hex file line did not start with ':': " + line);
                util.assert(checksum == ((-actualCheck) & 0xff), "Checksum failed for line: " + line);
                switch (type) {
                    case DATA:
                        return {
                            addr: addr + offsetLin,
                            data: byteData
                        };
                        break;
                    case EXTENDED_LIN_ADDR:
                        offsetLin = Number.parseInt(strData) << 16;
                    default:
                        return null;
                }
            }
            return hexString.split("\n").map(lineToChunk).reduce(mergeChunks, null) || {
                addr: 0,
                data: []
            };
        }

        function _ParseHexFile(input) {
            var kStartcodeBytes = 1;
            var kSizeBytes = 2;
            var kAddressBytes = 4;
            var kRecordTypeBytes = 2;
            var kChecksumBytes = 2;
            var inputLines = input.split("\n");
            var out = [];
            var nextAddress = 0;
            for (var i = 0; i < inputLines.length; ++i) {
                var line = inputLines[i];
                if (line[0] != ":") {
                    debugConnector("Bad line [" + i + "]. Missing startcode: " + line);
                    return "FAIL";
                }
                var ptr = kStartcodeBytes;
                if (line.length < kStartcodeBytes + kSizeBytes) {
                    debugConnector("Bad line [" + i + "]. Missing length bytes: " + line);
                    return "FAIL";
                }
                var dataSizeHex = line.substring(ptr, ptr + kSizeBytes);
                ptr += kSizeBytes;
                var dataSize = hexToDecimal(dataSizeHex);
                if (line.length < ptr + kAddressBytes) {
                    debugConnector("Bad line [" + i + "]. Missing address bytes: " + line);
                    return "FAIL";
                }
                var addressHex = line.substring(ptr, ptr + kAddressBytes);
                ptr += kAddressBytes;
                var address = hexToDecimal(addressHex);
                if (line.length < ptr + kRecordTypeBytes) {
                    debugConnector("Bad line [" + i + "]. Missing record type bytes: " + line);
                    return "FAIL";
                }
                var recordTypeHex = line.substring(ptr, ptr + kRecordTypeBytes);
                ptr += kRecordTypeBytes;
                var dataChars = 2 * dataSize;
                if (line.length < (ptr + dataChars)) {
                    debugConnector("Bad line [" + i + "]. Too short for data: " + line);
                    return "FAIL";
                }
                var dataHex = line.substring(ptr, ptr + dataChars);
                ptr += dataChars;
                if (line.length < (ptr + kChecksumBytes)) {
                    debugConnector("Bad line [" + i + "]. Missing checksum: " + line);
                    return "FAIL";
                }
                var checksumHex = line.substring(ptr, ptr + kChecksumBytes);
                if (line.length > ptr + kChecksumBytes + 1) {
                    var leftover = line.substring(ptr, line.length);
                    if (!leftover.match("$\w+^")) {
                        debugConnector("Bad line [" + i + "]. leftover data: " + line);
                        return "FAIL";
                    }
                }
                var kDataRecord = "00";
                var kEndOfFileRecord = "01";
                if (recordTypeHex == kEndOfFileRecord) {
                    return out;
                } else if (recordTypeHex == kDataRecord) {
                    if (address != nextAddress) {
                        debugConnector("I need contiguous addresses");
                        debugConnector(input);
                        return "FAIL";
                    }
                    nextAddress = address + dataSize;
                    var bytes = hexCharsToByteArray(dataHex);
                    if (bytes == -1) {
                        debugConnector("Couldn't parse hex data: " + dataHex);
                        return "FAIL";
                    }
                    out = out.concat(bytes);
                } else {
                    debugConnector("I can't handle records of type: " + recordTypeHex);
                    return "FAIL";
                }
            }
            debugConnector("Never found EOF!");
            return "FAIL";
        }

        function hexToDecimal(h) {
            if (!h.match("^[0-9A-Fa-f]*$")) {
                debugConnector("Invalid hex chars: " + h);
                return -1;
            }
            return parseInt(h, 16);
        }

        function hexCharsToByteArray(hc) {
            if (hc.length % 2 != 0) {
                debugConnector("Need 2-char hex bytes");
                return -1;
            }
            var bytes = [];
            for (var i = 0; i < hc.length / 2; ++i) {
                var hexChars = hc.substring(i * 2, (i * 2) + 2);
                var byte = hexToDecimal(hexChars);
                if (byte == -1) {
                    return -1;
                }
                bytes.push(byte);
            }
            return bytes;
        }
        var Base64Binary = {
            _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
            decodeArrayBuffer: function(input) {
                var bytes = (input.length / 4) * 3;
                var ab = new ArrayBuffer(bytes);
                this.decode(input, ab);
                return ab;
            },
            decode: function(input, arrayBuffer) {
                var lkey1 = this._keyStr.indexOf(input.charAt(input.length - 1));
                var lkey2 = this._keyStr.indexOf(input.charAt(input.length - 2));
                var bytes = (input.length / 4) * 3;
                if (lkey1 == 64) bytes--;
                if (lkey2 == 64) bytes--;
                var uarray;
                var chr1, chr2, chr3;
                var enc1, enc2, enc3, enc4;
                var i = 0;
                var j = 0;
                if (arrayBuffer)
                    uarray = new Uint8Array(arrayBuffer);
                else
                    uarray = new Uint8Array(bytes);
                input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
                for (i = 0; i < bytes; i += 3) {
                    enc1 = this._keyStr.indexOf(input.charAt(j++));
                    enc2 = this._keyStr.indexOf(input.charAt(j++));
                    enc3 = this._keyStr.indexOf(input.charAt(j++));
                    enc4 = this._keyStr.indexOf(input.charAt(j++));
                    chr1 = (enc1 << 2) | (enc2 >> 4);
                    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                    chr3 = ((enc3 & 3) << 6) | enc4;
                    uarray[i] = chr1;
                    if (enc3 != 64) uarray[i + 1] = chr2;
                    if (enc4 != 64) uarray[i + 2] = chr3;
                }
                return uarray;
            }
        }
        window.ParseHexFile = ParseHexFile;
        window.Base64Binary = Base64Binary;
        module.exports.ParseHexFile = ParseHexFile;
        module.exports.Base64Binary = Base64Binary;
    }, {
        "./util": 19
    }],
    8: [function(require, module, exports) {
        var arraify = require('./util').arraify,
            timeOffset = new Date();

        function zeroFill(number, width) {
            width -= number.toString().length;
            if (width > 0) {
                return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number;
            }
            return number + "";
        }

        function Log(name, verbosity) {
            this.verbosity = verbosity || 1;
            this.name = name;
            this.resetTimeOffset();
        }
        Log.prototype = {
            timestampString: function() {
                var now = new Date(new Date() - timeOffset +
                    timeOffset.getTimezoneOffset() * 60000);
                var pad = function(n) {
                    if (n < 10) {
                        return "0" + n;
                    }
                    return n;
                };
                return pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds()) + "." + zeroFill(now.getMilliseconds(), 3);
            },
            resetTimeOffset: function() {
                timeOffset = new Date();
            },
            prefix: function() {
                return "[" + this.timestampString() + " : " + this.name + "]";
            },
            console_: function(type, args) {
                return console[type].apply(console, args);
            },
            error: function(var_args) {
                if (this.verbosity > 0 || window.debugBabelfish)
                    this.console_('error', arraify(arguments, 0, this.prefix()));
            },
            warn: function(var_args) {
                if (this.verbosity > 1 || window.debugBabelfish)
                    this.console_('warn', arraify(arguments, 0, this.prefix()));
            },
            info: function(var_args) {
                if (this.verbosity > 2 || window.debugBabelfish)
                    this.console_('log', arraify(arguments, 0, this.prefix()));
            },
            log: function(var_args) {
                if (this.verbosity > 2 || window.debugBabelfish)
                    this.console_('log', arraify(arguments, 0, this.prefix()));
            }
        };
        module.exports.Log = Log;
    }, {
        "./util": 19
    }],
    9: [function(require, module, exports) {
        var obj1455 = {};
        var obj1454 = {};
        var obj1453 = [0xff, 0xff];
        var obj1452 = [0x7f, 0x7f];
        var obj1451 = [0x00, 0x00];
        var obj1450 = [0x80, 0x7f];
        var obj1449 = [0x00, 0xff];
        var obj1448 = [0xff, 0x00];
        var obj1447 = {
            paged: false,
            readback: obj1451,
            memops: obj1454
        };
        var obj1446 = {
            paged: false,
            size: 1,
            readback: obj1451,
            memops: obj1454
        };
        var obj1445 = {
            paged: false,
            size: 3,
            readback: obj1451,
            memops: obj1454
        };
        var obj1444 = {
            op: "CHIP_ERASE",
            instBit: 18,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1443 = {
            op: "CHIP_ERASE",
            instBit: 2,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1442 = {
            op: "CHIP_ERASE",
            instBit: 25,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1441 = {
            op: "CHIP_ERASE",
            instBit: 27,
            bitType: "VALUE",
            bitNo: 3,
            value: 1
        };
        var obj1440 = {
            op: "PGM_ENABLE",
            instBit: 24,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj1439 = {
            op: "CHIP_ERASE",
            instBit: 22,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1438 = {
            op: "PGM_ENABLE",
            instBit: 1,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1437 = {
            op: "PGM_ENABLE",
            instBit: 19,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj1436 = {
            op: "PGM_ENABLE",
            instBit: 3,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj1435 = {
            op: "PGM_ENABLE",
            instBit: 2,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1434 = {
            op: "CHIP_ERASE",
            instBit: 15,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1433 = {
            op: "CHIP_ERASE",
            instBit: 1,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1432 = {
            op: "CHIP_ERASE",
            instBit: 10,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1431 = {
            op: "PGM_ENABLE",
            instBit: 17,
            bitType: "VALUE",
            bitNo: 1,
            value: 1
        };
        var obj1430 = {
            op: "PGM_ENABLE",
            instBit: 13,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj1429 = {
            op: "CHIP_ERASE",
            instBit: 7,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1428 = {
            op: "PGM_ENABLE",
            instBit: 7,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1427 = {
            op: "PGM_ENABLE",
            instBit: 10,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1426 = {
            op: "CHIP_ERASE",
            instBit: 19,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj1425 = {
            op: "PGM_ENABLE",
            instBit: 9,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1424 = {
            op: "CHIP_ERASE",
            instBit: 29,
            bitType: "VALUE",
            bitNo: 5,
            value: 1
        };
        var obj1423 = {
            op: "PGM_ENABLE",
            instBit: 27,
            bitType: "VALUE",
            bitNo: 3,
            value: 1
        };
        var obj1422 = {
            op: "CHIP_ERASE",
            instBit: 11,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj1421 = {
            op: "PGM_ENABLE",
            instBit: 26,
            bitType: "VALUE",
            bitNo: 2,
            value: 1
        };
        var obj1420 = {
            op: "CHIP_ERASE",
            instBit: 21,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj1419 = {
            op: "PGM_ENABLE",
            instBit: 21,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj1418 = {
            op: "CHIP_ERASE",
            instBit: 20,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1417 = {
            op: "PGM_ENABLE",
            instBit: 29,
            bitType: "VALUE",
            bitNo: 5,
            value: 1
        };
        var obj1416 = {
            op: "CHIP_ERASE",
            instBit: 3,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj1415 = {
            op: "PGM_ENABLE",
            instBit: 5,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj1414 = {
            op: "CHIP_ERASE",
            instBit: 28,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1413 = {
            op: "PGM_ENABLE",
            instBit: 18,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1412 = {
            op: "PGM_ENABLE",
            instBit: 15,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1411 = {
            op: "CHIP_ERASE",
            instBit: 13,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj1410 = {
            op: "CHIP_ERASE",
            instBit: 30,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1409 = {
            op: "CHIP_ERASE",
            instBit: 0,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj1408 = {
            op: "PGM_ENABLE",
            instBit: 12,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1407 = {
            op: "CHIP_ERASE",
            instBit: 14,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1406 = {
            op: "CHIP_ERASE",
            instBit: 12,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1405 = {
            op: "PGM_ENABLE",
            instBit: 23,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1404 = {
            op: "PGM_ENABLE",
            instBit: 16,
            bitType: "VALUE",
            bitNo: 0,
            value: 1
        };
        var obj1403 = {
            op: "CHIP_ERASE",
            instBit: 4,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1402 = {
            op: "CHIP_ERASE",
            instBit: 31,
            bitType: "VALUE",
            bitNo: 7,
            value: 1
        };
        var obj1401 = {
            op: "CHIP_ERASE",
            instBit: 5,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj1400 = {
            op: "PGM_ENABLE",
            instBit: 0,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj1399 = {
            op: "PGM_ENABLE",
            instBit: 22,
            bitType: "VALUE",
            bitNo: 6,
            value: 1
        };
        var obj1398 = {
            op: "PGM_ENABLE",
            instBit: 11,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj1397 = {
            op: "PGM_ENABLE",
            instBit: 28,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1396 = {
            op: "PGM_ENABLE",
            instBit: 20,
            bitType: "VALUE",
            bitNo: 4,
            value: 1
        };
        var obj1395 = {
            op: "CHIP_ERASE",
            instBit: 6,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1394 = {
            op: "CHIP_ERASE",
            instBit: 26,
            bitType: "VALUE",
            bitNo: 2,
            value: 1
        };
        var obj1393 = {
            op: "CHIP_ERASE",
            instBit: 23,
            bitType: "VALUE",
            bitNo: 7,
            value: 1
        };
        var obj1392 = {
            op: "CHIP_ERASE",
            instBit: 8,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj1391 = {
            op: "PGM_ENABLE",
            instBit: 31,
            bitType: "VALUE",
            bitNo: 7,
            value: 1
        };
        var obj1390 = {
            op: "PGM_ENABLE",
            instBit: 8,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj1389 = {
            op: "CHIP_ERASE",
            instBit: 24,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj1388 = {
            op: "CHIP_ERASE",
            instBit: 9,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1387 = {
            op: "PGM_ENABLE",
            instBit: 6,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1386 = {
            op: "PGM_ENABLE",
            instBit: 4,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1385 = {
            op: "CHIP_ERASE",
            instBit: 17,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1384 = {
            op: "PGM_ENABLE",
            instBit: 30,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1383 = {
            op: "PGM_ENABLE",
            instBit: 14,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1382 = {
            op: "PGM_ENABLE",
            instBit: 25,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1381 = {
            op: "CHIP_ERASE",
            instBit: 16,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj1380 = {
            op: "PGM_ENABLE",
            instBit: 11,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj1379 = {
            op: "PGM_ENABLE",
            instBit: 1,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj1378 = {
            op: "CHIP_ERASE",
            instBit: 4,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj1377 = {
            op: "CHIP_ERASE",
            instBit: 17,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj1376 = {
            op: "PGM_ENABLE",
            instBit: 10,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj1375 = {
            op: "PGM_ENABLE",
            instBit: 7,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj1374 = {
            op: "CHIP_ERASE",
            instBit: 14,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj1373 = {
            op: "CHIP_ERASE",
            instBit: 19,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj1372 = {
            op: "PGM_ENABLE",
            instBit: 15,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj1371 = {
            op: "CHIP_ERASE",
            instBit: 13,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj1370 = {
            op: "PGM_ENABLE",
            instBit: 14,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj1369 = {
            op: "CHIP_ERASE",
            instBit: 3,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj1368 = {
            op: "PGM_ENABLE",
            instBit: 9,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj1367 = {
            op: "CHIP_ERASE",
            instBit: 9,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj1366 = {
            op: "PGM_ENABLE",
            instBit: 4,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj1365 = {
            op: "CHIP_ERASE",
            instBit: 16,
            bitType: "IGNORE",
            bitNo: 0,
            value: 0
        };
        var obj1364 = {
            op: "PGM_ENABLE",
            instBit: 0,
            bitType: "IGNORE",
            bitNo: 0,
            value: 0
        };
        var obj1363 = {
            op: "CHIP_ERASE",
            instBit: 8,
            bitType: "IGNORE",
            bitNo: 0,
            value: 0
        };
        var obj1362 = {
            op: "CHIP_ERASE",
            instBit: 7,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj1361 = {
            op: "PGM_ENABLE",
            instBit: 2,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj1360 = {
            op: "CHIP_ERASE",
            instBit: 6,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj1359 = {
            op: "PGM_ENABLE",
            instBit: 5,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj1358 = {
            op: "CHIP_ERASE",
            instBit: 11,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj1357 = {
            op: "CHIP_ERASE",
            instBit: 2,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj1356 = {
            op: "PGM_ENABLE",
            instBit: 12,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj1355 = {
            op: "CHIP_ERASE",
            instBit: 0,
            bitType: "IGNORE",
            bitNo: 0,
            value: 0
        };
        var obj1354 = {
            op: "CHIP_ERASE",
            instBit: 15,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj1353 = {
            op: "PGM_ENABLE",
            instBit: 3,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj1352 = {
            op: "CHIP_ERASE",
            instBit: 18,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj1351 = {
            op: "PGM_ENABLE",
            instBit: 13,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj1350 = {
            op: "CHIP_ERASE",
            instBit: 20,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj1349 = {
            op: "CHIP_ERASE",
            instBit: 12,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj1348 = {
            op: "PGM_ENABLE",
            instBit: 6,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj1347 = {
            op: "CHIP_ERASE",
            instBit: 10,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj1346 = {
            op: "CHIP_ERASE",
            instBit: 1,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj1345 = {
            op: "CHIP_ERASE",
            instBit: 5,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj1344 = {
            op: "PGM_ENABLE",
            instBit: 8,
            bitType: "IGNORE",
            bitNo: 0,
            value: 0
        };
        var obj1343 = {
            op: "READ",
            instBit: 8,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj1342 = {
            op: "READ",
            instBit: 9,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1341 = {
            op: "READ",
            instBit: 18,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1340 = {
            op: "READ",
            instBit: 23,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1339 = {
            op: "READ",
            instBit: 28,
            bitType: "VALUE",
            bitNo: 4,
            value: 1
        };
        var obj1338 = {
            op: "READ",
            instBit: 2,
            bitType: "VALUE",
            bitNo: 2,
            value: 1
        };
        var obj1337 = {
            op: "READ",
            instBit: 19,
            bitType: "VALUE",
            bitNo: 3,
            value: 1
        };
        var obj1336 = {
            op: "READ",
            instBit: 25,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1335 = {
            op: "READ",
            instBit: 30,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1334 = {
            op: "READ",
            instBit: 11,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj1333 = {
            op: "READ",
            instBit: 17,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1332 = {
            op: "READ",
            instBit: 16,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj1331 = {
            op: "READ",
            instBit: 10,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1330 = {
            op: "READ",
            instBit: 31,
            bitType: "VALUE",
            bitNo: 7,
            value: 1
        };
        var obj1329 = {
            op: "READ",
            instBit: 3,
            bitType: "VALUE",
            bitNo: 3,
            value: 1
        };
        var obj1328 = {
            op: "READ",
            instBit: 19,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj1327 = {
            op: "READ",
            instBit: 27,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj1326 = {
            op: "READ",
            instBit: 22,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1325 = {
            op: "READ",
            instBit: 12,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1324 = {
            op: "READ",
            instBit: 30,
            bitType: "VALUE",
            bitNo: 6,
            value: 1
        };
        var obj1323 = {
            op: "READ",
            instBit: 31,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1322 = {
            op: "READ",
            instBit: 15,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1321 = {
            op: "READ",
            instBit: 26,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1320 = {
            op: "READ",
            instBit: 13,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj1319 = {
            op: "READ",
            instBit: 24,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj1318 = {
            op: "READ",
            instBit: 29,
            bitType: "VALUE",
            bitNo: 5,
            value: 1
        };
        var obj1317 = {
            op: "READ",
            instBit: 20,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1316 = {
            op: "READ",
            instBit: 28,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1315 = {
            op: "READ",
            instBit: 21,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj1314 = {
            op: "READ",
            instBit: 14,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1313 = {
            op: "READ",
            instBit: 29,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj1312 = {
            op: "READ",
            instBit: 27,
            bitType: "VALUE",
            bitNo: 3,
            value: 1
        };
        var obj1311 = {
            op: "READ",
            instBit: 2,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj1310 = {
            op: "WRITE",
            instBit: 10,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1309 = {
            op: "WRITE",
            instBit: 17,
            bitType: "INPUT",
            bitNo: 1,
            value: 0
        };
        var obj1308 = {
            op: "READ",
            instBit: 9,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj1307 = {
            op: "WRITE",
            instBit: 3,
            bitType: "VALUE",
            bitNo: 3,
            value: 1
        };
        var obj1306 = {
            op: "WRITE",
            instBit: 4,
            bitType: "VALUE",
            bitNo: 4,
            value: 1
        };
        var obj1305 = {
            op: "WRITE",
            instBit: 8,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj1304 = {
            op: "READ",
            instBit: 21,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj1303 = {
            op: "WRITE",
            instBit: 5,
            bitType: "INPUT",
            bitNo: 5,
            value: 0
        };
        var obj1302 = {
            op: "WRITE",
            instBit: 12,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1301 = {
            op: "WRITE",
            instBit: 14,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1300 = {
            op: "READ",
            instBit: 14,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj1299 = {
            op: "WRITE",
            instBit: 20,
            bitType: "VALUE",
            bitNo: 4,
            value: 1
        };
        var obj1298 = {
            op: "WRITE",
            instBit: 23,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1297 = {
            op: "WRITE",
            instBit: 17,
            bitType: "VALUE",
            bitNo: 1,
            value: 1
        };
        var obj1296 = {
            op: "READ",
            instBit: 20,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj1295 = {
            op: "READ",
            instBit: 1,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj1294 = {
            op: "READ",
            instBit: 10,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj1293 = {
            op: "WRITE",
            instBit: 19,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj1292 = {
            op: "READ",
            instBit: 0,
            bitType: "IGNORE",
            bitNo: 0,
            value: 0
        };
        var obj1291 = {
            op: "READ",
            instBit: 0,
            bitType: "OUTPUT",
            bitNo: 0,
            value: 0
        };
        var obj1290 = {
            op: "READ",
            instBit: 6,
            bitType: "OUTPUT",
            bitNo: 6,
            value: 0
        };
        var obj1289 = {
            op: "WRITE",
            instBit: 16,
            bitType: "VALUE",
            bitNo: 0,
            value: 1
        };
        var obj1288 = {
            op: "WRITE",
            instBit: 24,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj1287 = {
            op: "WRITE",
            instBit: 30,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1286 = {
            op: "WRITE",
            instBit: 29,
            bitType: "VALUE",
            bitNo: 5,
            value: 1
        };
        var obj1285 = {
            op: "WRITE",
            instBit: 18,
            bitType: "INPUT",
            bitNo: 2,
            value: 0
        };
        var obj1284 = {
            op: "WRITE",
            instBit: 2,
            bitType: "INPUT",
            bitNo: 2,
            value: 0
        };
        var obj1283 = {
            op: "READ",
            instBit: 19,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj1282 = {
            op: "WRITE",
            instBit: 18,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1281 = {
            op: "WRITE",
            instBit: 15,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1280 = {
            op: "WRITE",
            instBit: 2,
            bitType: "VALUE",
            bitNo: 2,
            value: 1
        };
        var obj1279 = {
            op: "READ",
            instBit: 11,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj1278 = {
            op: "WRITE",
            instBit: 23,
            bitType: "VALUE",
            bitNo: 7,
            value: 1
        };
        var obj1277 = {
            op: "READ",
            instBit: 5,
            bitType: "OUTPUT",
            bitNo: 5,
            value: 0
        };
        var obj1276 = {
            op: "WRITE",
            instBit: 22,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1275 = {
            op: "WRITE",
            instBit: 19,
            bitType: "INPUT",
            bitNo: 3,
            value: 0
        };
        var obj1274 = {
            op: "READ",
            instBit: 23,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj1273 = {
            op: "WRITE",
            instBit: 21,
            bitType: "VALUE",
            bitNo: 5,
            value: 1
        };
        var obj1272 = {
            op: "WRITE",
            instBit: 27,
            bitType: "VALUE",
            bitNo: 3,
            value: 1
        };
        var obj1271 = {
            op: "WRITE",
            instBit: 17,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1270 = {
            op: "WRITE",
            instBit: 6,
            bitType: "INPUT",
            bitNo: 6,
            value: 0
        };
        var obj1269 = {
            op: "WRITE",
            instBit: 26,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1268 = {
            op: "WRITE",
            instBit: 6,
            bitType: "VALUE",
            bitNo: 6,
            value: 1
        };
        var obj1267 = {
            op: "READ",
            instBit: 7,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj1266 = {
            op: "WRITE",
            instBit: 30,
            bitType: "VALUE",
            bitNo: 6,
            value: 1
        };
        var obj1265 = {
            op: "READ",
            instBit: 8,
            bitType: "IGNORE",
            bitNo: 0,
            value: 0
        };
        var obj1264 = {
            op: "READ",
            instBit: 3,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj1263 = {
            op: "READ",
            instBit: 4,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj1262 = {
            op: "READ",
            instBit: 12,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj1261 = {
            op: "READ",
            instBit: 2,
            bitType: "OUTPUT",
            bitNo: 2,
            value: 0
        };
        var obj1260 = {
            op: "READ",
            instBit: 13,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj1259 = {
            op: "READ",
            instBit: 15,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj1258 = {
            op: "READ",
            instBit: 4,
            bitType: "OUTPUT",
            bitNo: 4,
            value: 0
        };
        var obj1257 = {
            op: "WRITE",
            instBit: 20,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1256 = {
            op: "WRITE",
            instBit: 7,
            bitType: "INPUT",
            bitNo: 7,
            value: 0
        };
        var obj1255 = {
            op: "READ",
            instBit: 18,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj1254 = {
            op: "WRITE",
            instBit: 4,
            bitType: "INPUT",
            bitNo: 4,
            value: 0
        };
        var obj1253 = {
            op: "WRITE",
            instBit: 21,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj1252 = {
            op: "WRITE",
            instBit: 11,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj1251 = {
            op: "WRITE",
            instBit: 26,
            bitType: "VALUE",
            bitNo: 2,
            value: 1
        };
        var obj1250 = {
            op: "READ",
            instBit: 5,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj1249 = {
            op: "WRITE",
            instBit: 7,
            bitType: "VALUE",
            bitNo: 7,
            value: 1
        };
        var obj1248 = {
            op: "WRITE",
            instBit: 22,
            bitType: "VALUE",
            bitNo: 6,
            value: 1
        };
        var obj1247 = {
            op: "READ",
            instBit: 8,
            bitType: "OUTPUT",
            bitNo: 0,
            value: 0
        };
        var obj1246 = {
            op: "WRITE",
            instBit: 18,
            bitType: "VALUE",
            bitNo: 2,
            value: 1
        };
        var obj1245 = {
            op: "WRITE",
            instBit: 25,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1244 = {
            op: "WRITE",
            instBit: 31,
            bitType: "VALUE",
            bitNo: 7,
            value: 1
        };
        var obj1243 = {
            op: "WRITE",
            instBit: 16,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj1242 = {
            op: "WRITE",
            instBit: 5,
            bitType: "VALUE",
            bitNo: 5,
            value: 1
        };
        var obj1241 = {
            op: "WRITE",
            instBit: 20,
            bitType: "INPUT",
            bitNo: 4,
            value: 0
        };
        var obj1240 = {
            op: "WRITE",
            instBit: 0,
            bitType: "INPUT",
            bitNo: 0,
            value: 0
        };
        var obj1239 = {
            op: "READ",
            instBit: 6,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj1238 = {
            op: "WRITE",
            instBit: 1,
            bitType: "INPUT",
            bitNo: 1,
            value: 0
        };
        var obj1237 = {
            op: "WRITE",
            instBit: 16,
            bitType: "INPUT",
            bitNo: 0,
            value: 0
        };
        var obj1236 = {
            op: "READ",
            instBit: 1,
            bitType: "OUTPUT",
            bitNo: 1,
            value: 0
        };
        var obj1235 = {
            op: "WRITE",
            instBit: 19,
            bitType: "VALUE",
            bitNo: 3,
            value: 1
        };
        var obj1234 = {
            op: "WRITE",
            instBit: 29,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj1233 = {
            op: "READ",
            instBit: 17,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj1232 = {
            op: "READ",
            instBit: 16,
            bitType: "IGNORE",
            bitNo: 0,
            value: 0
        };
        var obj1231 = {
            op: "READ",
            instBit: 7,
            bitType: "OUTPUT",
            bitNo: 7,
            value: 0
        };
        var obj1230 = {
            op: "WRITE",
            instBit: 28,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1229 = {
            op: "READ",
            instBit: 22,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj1228 = {
            op: "WRITE",
            instBit: 9,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1227 = {
            op: "READ",
            instBit: 3,
            bitType: "OUTPUT",
            bitNo: 3,
            value: 0
        };
        var obj1226 = {
            op: "WRITE",
            instBit: 13,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj1225 = {
            op: "WRITE",
            instBit: 3,
            bitType: "INPUT",
            bitNo: 3,
            value: 0
        };
        var obj1224 = {
            op: "WRITE",
            instBit: 27,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj1223 = {
            op: "WRITE",
            instBit: 21,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj1222 = {
            op: "READ",
            instBit: 11,
            bitType: "ADDRESS",
            bitNo: 3,
            value: 0
        };
        var obj1221 = {
            op: "WRITE",
            instBit: 20,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj1220 = {
            op: "READ",
            instBit: 20,
            bitType: "ADDRESS",
            bitNo: 12,
            value: 0
        };
        var obj1219 = {
            op: "WRITE",
            instBit: 23,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj1218 = {
            op: "READ",
            instBit: 10,
            bitType: "ADDRESS",
            bitNo: 1,
            value: 0
        };
        var obj1217 = {
            op: "WRITE",
            instBit: 15,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj1216 = {
            op: "WRITE",
            instBit: 7,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj1215 = {
            op: "WRITE",
            instBit: 14,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj1214 = {
            op: "WRITE",
            instBit: 3,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj1213 = {
            op: "WRITE",
            instBit: 4,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj1212 = {
            op: "WRITE",
            instBit: 18,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj1211 = {
            op: "WRITE",
            instBit: 9,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj1210 = {
            op: "READ",
            instBit: 9,
            bitType: "ADDRESS",
            bitNo: 1,
            value: 0
        };
        var obj1209 = {
            op: "READ",
            instBit: 17,
            bitType: "ADDRESS",
            bitNo: 9,
            value: 0
        };
        var obj1208 = {
            op: "READ",
            instBit: 11,
            bitType: "ADDRESS",
            bitNo: 2,
            value: 0
        };
        var obj1207 = {
            op: "READ",
            instBit: 15,
            bitType: "ADDRESS",
            bitNo: 7,
            value: 0
        };
        var obj1206 = {
            op: "WRITE",
            instBit: 6,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj1205 = {
            op: "WRITE",
            instBit: 8,
            bitType: "IGNORE",
            bitNo: 0,
            value: 0
        };
        var obj1204 = {
            op: "READ",
            instBit: 19,
            bitType: "ADDRESS",
            bitNo: 11,
            value: 0
        };
        var obj1203 = {
            op: "READ",
            instBit: 9,
            bitType: "ADDRESS",
            bitNo: 0,
            value: 0
        };
        var obj1202 = {
            op: "WRITE",
            instBit: 12,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj1201 = {
            op: "READ",
            instBit: 14,
            bitType: "ADDRESS",
            bitNo: 6,
            value: 0
        };
        var obj1200 = {
            op: "WRITE",
            instBit: 11,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj1199 = {
            op: "READ",
            instBit: 12,
            bitType: "ADDRESS",
            bitNo: 3,
            value: 0
        };
        var obj1198 = {
            op: "READ",
            instBit: 18,
            bitType: "ADDRESS",
            bitNo: 10,
            value: 0
        };
        var obj1197 = {
            op: "READ",
            instBit: 12,
            bitType: "ADDRESS",
            bitNo: 4,
            value: 0
        };
        var obj1196 = {
            op: "READ",
            instBit: 10,
            bitType: "ADDRESS",
            bitNo: 2,
            value: 0
        };
        var obj1195 = {
            op: "WRITE",
            instBit: 16,
            bitType: "IGNORE",
            bitNo: 0,
            value: 0
        };
        var obj1194 = {
            op: "READ",
            instBit: 13,
            bitType: "ADDRESS",
            bitNo: 5,
            value: 0
        };
        var obj1193 = {
            op: "READ",
            instBit: 8,
            bitType: "ADDRESS",
            bitNo: 0,
            value: 0
        };
        var obj1192 = {
            op: "WRITE",
            instBit: 10,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj1191 = {
            op: "WRITE",
            instBit: 22,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj1190 = {
            op: "READ",
            instBit: 13,
            bitType: "ADDRESS",
            bitNo: 4,
            value: 0
        };
        var obj1189 = {
            op: "READ",
            instBit: 16,
            bitType: "ADDRESS",
            bitNo: 8,
            value: 0
        };
        var obj1188 = {
            op: "WRITE",
            instBit: 5,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj1187 = {
            op: "WRITE",
            instBit: 17,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj1186 = {
            op: "WRITE",
            instBit: 1,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj1185 = {
            op: "WRITE",
            instBit: 13,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj1184 = {
            op: "WRITE",
            instBit: 2,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj1183 = {
            op: "WRITE",
            instBit: 19,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj1182 = {
            op: "WRITE",
            instBit: 0,
            bitType: "IGNORE",
            bitNo: 0,
            value: 0
        };
        var obj1181 = {
            op: "READ_LO",
            instBit: 24,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj1180 = {
            op: "READ_LO",
            instBit: 19,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj1179 = {
            op: "READ_LO",
            instBit: 18,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1178 = {
            op: "WRITE",
            instBit: 10,
            bitType: "ADDRESS",
            bitNo: 2,
            value: 0
        };
        var obj1177 = {
            op: "READ_LO",
            instBit: 17,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1176 = {
            op: "READ_LO",
            instBit: 22,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1175 = {
            op: "READ_HI",
            instBit: 17,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1174 = {
            op: "WRITE",
            instBit: 16,
            bitType: "ADDRESS",
            bitNo: 8,
            value: 0
        };
        var obj1173 = {
            op: "READ_LO",
            instBit: 23,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1172 = {
            op: "READ_HI",
            instBit: 21,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj1171 = {
            op: "READ_HI",
            instBit: 26,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1170 = {
            op: "READ_HI",
            instBit: 23,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1169 = {
            op: "WRITE",
            instBit: 18,
            bitType: "ADDRESS",
            bitNo: 10,
            value: 0
        };
        var obj1168 = {
            op: "READ_LO",
            instBit: 31,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1167 = {
            op: "READ_HI",
            instBit: 31,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1166 = {
            op: "READ_HI",
            instBit: 30,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1165 = {
            op: "READ_HI",
            instBit: 28,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1164 = {
            op: "READ_LO",
            instBit: 28,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1163 = {
            op: "READ_HI",
            instBit: 25,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1162 = {
            op: "READ_HI",
            instBit: 22,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1161 = {
            op: "READ_HI",
            instBit: 18,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1160 = {
            op: "WRITE",
            instBit: 15,
            bitType: "ADDRESS",
            bitNo: 7,
            value: 0
        };
        var obj1159 = {
            op: "READ_LO",
            instBit: 20,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1158 = {
            op: "WRITE",
            instBit: 8,
            bitType: "ADDRESS",
            bitNo: 0,
            value: 0
        };
        var obj1157 = {
            op: "WRITE",
            instBit: 17,
            bitType: "ADDRESS",
            bitNo: 9,
            value: 0
        };
        var obj1156 = {
            op: "READ_HI",
            instBit: 20,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1155 = {
            op: "READ_LO",
            instBit: 27,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj1154 = {
            op: "WRITE",
            instBit: 19,
            bitType: "ADDRESS",
            bitNo: 11,
            value: 0
        };
        var obj1153 = {
            op: "READ_HI",
            instBit: 29,
            bitType: "VALUE",
            bitNo: 5,
            value: 1
        };
        var obj1152 = {
            op: "WRITE",
            instBit: 14,
            bitType: "ADDRESS",
            bitNo: 6,
            value: 0
        };
        var obj1151 = {
            op: "READ_HI",
            instBit: 24,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj1150 = {
            op: "READ_LO",
            instBit: 30,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1149 = {
            op: "READ_HI",
            instBit: 27,
            bitType: "VALUE",
            bitNo: 3,
            value: 1
        };
        var obj1148 = {
            op: "WRITE",
            instBit: 9,
            bitType: "ADDRESS",
            bitNo: 1,
            value: 0
        };
        var obj1147 = {
            op: "READ_HI",
            instBit: 19,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj1146 = {
            op: "WRITE",
            instBit: 12,
            bitType: "ADDRESS",
            bitNo: 4,
            value: 0
        };
        var obj1145 = {
            op: "READ_LO",
            instBit: 21,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj1144 = {
            op: "WRITE",
            instBit: 11,
            bitType: "ADDRESS",
            bitNo: 3,
            value: 0
        };
        var obj1143 = {
            op: "READ_LO",
            instBit: 29,
            bitType: "VALUE",
            bitNo: 5,
            value: 1
        };
        var obj1142 = {
            op: "READ_LO",
            instBit: 26,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1141 = {
            op: "WRITE",
            instBit: 13,
            bitType: "ADDRESS",
            bitNo: 5,
            value: 0
        };
        var obj1140 = {
            op: "READ_LO",
            instBit: 25,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1139 = {
            op: "WRITE",
            instBit: 20,
            bitType: "ADDRESS",
            bitNo: 12,
            value: 0
        };
        var obj1138 = {
            op: "WRITE_HI",
            instBit: 7,
            bitType: "INPUT",
            bitNo: 7,
            value: 0
        };
        var obj1137 = {
            op: "READ_HI",
            instBit: 22,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj1136 = {
            op: "READ_HI",
            instBit: 23,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj1135 = {
            op: "WRITE_LO",
            instBit: 29,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj1134 = {
            op: "READ_HI",
            instBit: 21,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj1133 = {
            op: "WRITE_HI",
            instBit: 30,
            bitType: "VALUE",
            bitNo: 6,
            value: 1
        };
        var obj1132 = {
            op: "WRITE_LO",
            instBit: 3,
            bitType: "INPUT",
            bitNo: 3,
            value: 0
        };
        var obj1131 = {
            op: "READ_HI",
            instBit: 17,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj1130 = {
            op: "READ_HI",
            instBit: 2,
            bitType: "OUTPUT",
            bitNo: 2,
            value: 0
        };
        var obj1129 = {
            op: "READ_LO",
            instBit: 1,
            bitType: "OUTPUT",
            bitNo: 1,
            value: 0
        };
        var obj1128 = {
            op: "WRITE_HI",
            instBit: 27,
            bitType: "VALUE",
            bitNo: 3,
            value: 1
        };
        var obj1127 = {
            op: "WRITE_LO",
            instBit: 5,
            bitType: "INPUT",
            bitNo: 5,
            value: 0
        };
        var obj1126 = {
            op: "WRITE_LO",
            instBit: 25,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1125 = {
            op: "READ_LO",
            instBit: 21,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj1124 = {
            op: "WRITE_HI",
            instBit: 26,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1123 = {
            op: "READ_LO",
            instBit: 3,
            bitType: "OUTPUT",
            bitNo: 3,
            value: 0
        };
        var obj1122 = {
            op: "WRITE_LO",
            instBit: 6,
            bitType: "INPUT",
            bitNo: 6,
            value: 0
        };
        var obj1121 = {
            op: "READ_LO",
            instBit: 20,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj1120 = {
            op: "WRITE_LO",
            instBit: 7,
            bitType: "INPUT",
            bitNo: 7,
            value: 0
        };
        var obj1119 = {
            op: "READ_LO",
            instBit: 4,
            bitType: "OUTPUT",
            bitNo: 4,
            value: 0
        };
        var obj1118 = {
            op: "WRITE_LO",
            instBit: 1,
            bitType: "INPUT",
            bitNo: 1,
            value: 0
        };
        var obj1117 = {
            op: "WRITE_HI",
            instBit: 28,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1116 = {
            op: "WRITE_HI",
            instBit: 31,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1115 = {
            op: "READ_LO",
            instBit: 19,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj1114 = {
            op: "WRITE_LO",
            instBit: 4,
            bitType: "INPUT",
            bitNo: 4,
            value: 0
        };
        var obj1113 = {
            op: "READ_LO",
            instBit: 18,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj1112 = {
            op: "READ_HI",
            instBit: 3,
            bitType: "OUTPUT",
            bitNo: 3,
            value: 0
        };
        var obj1111 = {
            op: "WRITE_LO",
            instBit: 24,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj1110 = {
            op: "READ_LO",
            instBit: 7,
            bitType: "OUTPUT",
            bitNo: 7,
            value: 0
        };
        var obj1109 = {
            op: "WRITE_HI",
            instBit: 3,
            bitType: "INPUT",
            bitNo: 3,
            value: 0
        };
        var obj1108 = {
            op: "WRITE_LO",
            instBit: 27,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj1107 = {
            op: "READ_HI",
            instBit: 18,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj1106 = {
            op: "READ_HI",
            instBit: 6,
            bitType: "OUTPUT",
            bitNo: 6,
            value: 0
        };
        var obj1105 = {
            op: "WRITE_HI",
            instBit: 1,
            bitType: "INPUT",
            bitNo: 1,
            value: 0
        };
        var obj1104 = {
            op: "READ_HI",
            instBit: 5,
            bitType: "OUTPUT",
            bitNo: 5,
            value: 0
        };
        var obj1103 = {
            op: "READ_HI",
            instBit: 19,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj1102 = {
            op: "WRITE_LO",
            instBit: 30,
            bitType: "VALUE",
            bitNo: 6,
            value: 1
        };
        var obj1101 = {
            op: "READ_HI",
            instBit: 0,
            bitType: "OUTPUT",
            bitNo: 0,
            value: 0
        };
        var obj1100 = {
            op: "WRITE_HI",
            instBit: 24,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj1099 = {
            op: "WRITE_HI",
            instBit: 4,
            bitType: "INPUT",
            bitNo: 4,
            value: 0
        };
        var obj1098 = {
            op: "READ_HI",
            instBit: 4,
            bitType: "OUTPUT",
            bitNo: 4,
            value: 0
        };
        var obj1097 = {
            op: "WRITE_LO",
            instBit: 2,
            bitType: "INPUT",
            bitNo: 2,
            value: 0
        };
        var obj1096 = {
            op: "WRITE_LO",
            instBit: 26,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1095 = {
            op: "READ_LO",
            instBit: 6,
            bitType: "OUTPUT",
            bitNo: 6,
            value: 0
        };
        var obj1094 = {
            op: "READ_HI",
            instBit: 20,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj1093 = {
            op: "WRITE_LO",
            instBit: 28,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1092 = {
            op: "WRITE_HI",
            instBit: 2,
            bitType: "INPUT",
            bitNo: 2,
            value: 0
        };
        var obj1091 = {
            op: "READ_LO",
            instBit: 2,
            bitType: "OUTPUT",
            bitNo: 2,
            value: 0
        };
        var obj1090 = {
            op: "READ_HI",
            instBit: 1,
            bitType: "OUTPUT",
            bitNo: 1,
            value: 0
        };
        var obj1089 = {
            op: "READ_LO",
            instBit: 0,
            bitType: "OUTPUT",
            bitNo: 0,
            value: 0
        };
        var obj1088 = {
            op: "WRITE_HI",
            instBit: 0,
            bitType: "INPUT",
            bitNo: 0,
            value: 0
        };
        var obj1087 = {
            op: "WRITE_HI",
            instBit: 5,
            bitType: "INPUT",
            bitNo: 5,
            value: 0
        };
        var obj1086 = {
            op: "WRITE_HI",
            instBit: 6,
            bitType: "INPUT",
            bitNo: 6,
            value: 0
        };
        var obj1085 = {
            op: "WRITE_HI",
            instBit: 29,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj1084 = {
            op: "WRITE_HI",
            instBit: 25,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1083 = {
            op: "READ_LO",
            instBit: 23,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj1082 = {
            op: "WRITE_LO",
            instBit: 31,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1081 = {
            op: "READ_HI",
            instBit: 7,
            bitType: "OUTPUT",
            bitNo: 7,
            value: 0
        };
        var obj1080 = {
            op: "READ_LO",
            instBit: 22,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj1079 = {
            op: "READ_LO",
            instBit: 17,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj1078 = {
            op: "WRITE_LO",
            instBit: 0,
            bitType: "INPUT",
            bitNo: 0,
            value: 0
        };
        var obj1077 = {
            op: "READ_LO",
            instBit: 5,
            bitType: "OUTPUT",
            bitNo: 5,
            value: 0
        };
        var obj1076 = {
            op: "WRITEPAGE",
            instBit: 26,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1075 = {
            op: "WRITEPAGE",
            instBit: 20,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1074 = {
            paged: false,
            size: 131072,
            page_size: 512,
            readback: obj1451,
            memops: obj1454
        };
        var obj1073 = {
            op: "READ_HI",
            instBit: 16,
            bitType: "ADDRESS",
            bitNo: 8,
            value: 0
        };
        var obj1072 = {
            op: "WRITEPAGE",
            instBit: 6,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1071 = {
            paged: false,
            size: 262144,
            page_size: 512,
            readback: obj1451,
            memops: obj1454
        };
        var obj1070 = {
            op: "READ_LO",
            instBit: 21,
            bitType: "ADDRESS",
            bitNo: 13,
            value: 0
        };
        var obj1069 = {
            op: "WRITEPAGE",
            instBit: 25,
            bitType: "VALUE",
            bitNo: 1,
            value: 1
        };
        var obj1068 = {
            op: "WRITEPAGE",
            instBit: 31,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1067 = {
            paged: false,
            size: 270336,
            page_size: 512,
            readback: obj1451,
            memops: obj1454
        };
        var obj1066 = {
            op: "READ_HI",
            instBit: 14,
            bitType: "ADDRESS",
            bitNo: 6,
            value: 0
        };
        var obj1065 = {
            op: "WRITEPAGE",
            instBit: 27,
            bitType: "VALUE",
            bitNo: 3,
            value: 1
        };
        var obj1064 = {
            op: "READ_HI",
            instBit: 13,
            bitType: "ADDRESS",
            bitNo: 5,
            value: 0
        };
        var obj1063 = {
            op: "READ_HI",
            instBit: 12,
            bitType: "ADDRESS",
            bitNo: 4,
            value: 0
        };
        var obj1062 = {
            paged: false,
            size: 139264,
            page_size: 256,
            readback: obj1451,
            memops: obj1454
        };
        var obj1061 = {
            op: "WRITEPAGE",
            instBit: 23,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1060 = {
            op: "WRITEPAGE",
            instBit: 5,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj1059 = {
            op: "WRITEPAGE",
            instBit: 3,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj1058 = {
            op: "READ_LO",
            instBit: 20,
            bitType: "ADDRESS",
            bitNo: 12,
            value: 0
        };
        var obj1057 = {
            op: "READ_LO",
            instBit: 17,
            bitType: "ADDRESS",
            bitNo: 9,
            value: 0
        };
        var obj1056 = {
            op: "WRITE_LO",
            instBit: 23,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj1055 = {
            paged: false,
            size: 69632,
            page_size: 256,
            readback: obj1451,
            memops: obj1454
        };
        var obj1054 = {
            paged: false,
            size: 2048,
            page_size: 32,
            readback: obj1451,
            memops: obj1454
        };
        var obj1053 = {
            op: "WRITEPAGE",
            instBit: 31,
            bitType: "VALUE",
            bitNo: 7,
            value: 1
        };
        var obj1052 = {
            op: "READ_LO",
            instBit: 23,
            bitType: "ADDRESS",
            bitNo: 15,
            value: 0
        };
        var obj1051 = {
            op: "WRITE_LO",
            instBit: 21,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj1050 = {
            op: "WRITE_HI",
            instBit: 19,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj1049 = {
            op: "WRITEPAGE",
            instBit: 14,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1048 = {
            op: "READ_HI",
            instBit: 23,
            bitType: "ADDRESS",
            bitNo: 15,
            value: 0
        };
        var obj1047 = {
            paged: false,
            size: 20480,
            page_size: 128,
            readback: obj1451,
            memops: obj1454
        };
        var obj1046 = {
            paged: false,
            size: 32768,
            page_size: 256,
            readback: obj1451,
            memops: obj1454
        };
        var obj1045 = {
            op: "WRITEPAGE",
            instBit: 28,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj1044 = {
            paged: false,
            size: 16384,
            page_size: 256,
            readback: obj1451,
            memops: obj1454
        };
        var obj1043 = {
            paged: false,
            size: 4096,
            page_size: 128,
            readback: obj1451,
            memops: obj1454
        };
        var obj1042 = {
            op: "READ_HI",
            instBit: 19,
            bitType: "ADDRESS",
            bitNo: 11,
            value: 0
        };
        var obj1041 = {
            paged: false,
            size: 36864,
            page_size: 256,
            readback: obj1451,
            memops: obj1454
        };
        var obj1040 = {
            op: "WRITEPAGE",
            instBit: 7,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1039 = {
            op: "WRITE_LO",
            instBit: 18,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj1038 = {
            op: "WRITE_LO",
            instBit: 20,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj1037 = {
            paged: false,
            size: 10240,
            page_size: 128,
            readback: obj1451,
            memops: obj1454
        };
        var obj1036 = {
            op: "WRITE_HI",
            instBit: 22,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj1035 = {
            paged: false,
            size: 204800,
            page_size: 512,
            readback: obj1451,
            memops: obj1454
        };
        var obj1034 = {
            op: "WRITEPAGE",
            instBit: 17,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1033 = {
            paged: false,
            size: 4096,
            page_size: 32,
            readback: obj1451,
            memops: obj1454
        };
        var obj1032 = {
            op: "READ_LO",
            instBit: 18,
            bitType: "ADDRESS",
            bitNo: 10,
            value: 0
        };
        var obj1031 = {
            op: "WRITE_HI",
            instBit: 18,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj1030 = {
            op: "READ_HI",
            instBit: 11,
            bitType: "ADDRESS",
            bitNo: 3,
            value: 0
        };
        var obj1029 = {
            paged: false,
            size: 256,
            page_size: 256,
            readback: obj1451,
            memops: obj1454
        };
        var obj1028 = {
            op: "WRITEPAGE",
            instBit: 25,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj1027 = {
            paged: false,
            size: 1,
            page_size: 16,
            readback: obj1451,
            memops: obj1454
        };
        var obj1026 = {
            paged: false,
            size: 2048,
            page_size: 128,
            readback: obj1451,
            memops: obj1454
        };
        var obj1025 = {
            op: "READ_HI",
            instBit: 18,
            bitType: "ADDRESS",
            bitNo: 10,
            value: 0
        };
        var obj1024 = {
            op: "WRITEPAGE",
            instBit: 2,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1023 = {
            op: "READ_HI",
            instBit: 10,
            bitType: "ADDRESS",
            bitNo: 2,
            value: 0
        };
        var obj1022 = {
            paged: false,
            size: 8192,
            page_size: 512,
            readback: obj1451,
            memops: obj1454
        };
        var obj1021 = {
            op: "READ_LO",
            instBit: 8,
            bitType: "ADDRESS",
            bitNo: 0,
            value: 0
        };
        var obj1020 = {
            op: "WRITEPAGE",
            instBit: 22,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj1019 = {
            op: "READ_LO",
            instBit: 14,
            bitType: "ADDRESS",
            bitNo: 6,
            value: 0
        };
        var obj1018 = {
            paged: false,
            size: 196608,
            page_size: 512,
            readback: obj1451,
            memops: obj1454
        };
        var obj1017 = {
            op: "WRITEPAGE",
            instBit: 15,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj1016 = {
            op: "WRITE_HI",
            instBit: 23,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj1015 = {
            op: "WRITEPAGE",
            instBit: 10,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj1014 = {
            paged: false,
            size: 3,
            page_size: 16,
            readback: obj1451,
            memops: obj1454
        };
        var obj1013 = {
            paged: false,
            size: 36864,
            page_size: 128,
            readback: obj1451,
            memops: obj1454
        };
        var obj1012 = {
            op: "WRITEPAGE",
            instBit: 27,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj1011 = {
            op: "WRITEPAGE",
            instBit: 29,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj1010 = {
            op: "READ_LO",
            instBit: 15,
            bitType: "ADDRESS",
            bitNo: 7,
            value: 0
        };
        var obj1009 = {
            op: "WRITE_LO",
            instBit: 17,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj1008 = {
            paged: false,
            size: 16384,
            page_size: 128,
            readback: obj1451,
            memops: obj1454
        };
        var obj1007 = {
            op: "WRITEPAGE",
            instBit: 26,
            bitType: "VALUE",
            bitNo: 2,
            value: 1
        };
        var obj1006 = {
            op: "WRITEPAGE",
            instBit: 0,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj1005 = {
            op: "READ_HI",
            instBit: 21,
            bitType: "ADDRESS",
            bitNo: 13,
            value: 0
        };
        var obj1004 = {
            paged: false,
            size: 4096,
            page_size: 512,
            readback: obj1451,
            memops: obj1454
        };
        var obj1003 = {
            op: "READ_LO",
            instBit: 16,
            bitType: "ADDRESS",
            bitNo: 8,
            value: 0
        };
        var obj1002 = {
            paged: false,
            size: 512,
            page_size: 512,
            readback: obj1451,
            memops: obj1454
        };
        var obj1001 = {
            op: "READ_HI",
            instBit: 20,
            bitType: "ADDRESS",
            bitNo: 12,
            value: 0
        };
        var obj1000 = {
            paged: false,
            size: 401408,
            page_size: 512,
            readback: obj1451,
            memops: obj1454
        };
        var obj999 = {
            op: "WRITEPAGE",
            instBit: 30,
            bitType: "VALUE",
            bitNo: 6,
            value: 1
        };
        var obj998 = {
            paged: false,
            size: 8192,
            page_size: 256,
            readback: obj1451,
            memops: obj1454
        };
        var obj997 = {
            op: "WRITE_LO",
            instBit: 22,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj996 = {
            op: "READ_LO",
            instBit: 9,
            bitType: "ADDRESS",
            bitNo: 1,
            value: 0
        };
        var obj995 = {
            paged: false,
            size: 65536,
            page_size: 256,
            readback: obj1451,
            memops: obj1454
        };
        var obj994 = {
            paged: false,
            size: 8192,
            page_size: 128,
            readback: obj1451,
            memops: obj1454
        };
        var obj993 = {
            op: "READ_LO",
            instBit: 10,
            bitType: "ADDRESS",
            bitNo: 2,
            value: 0
        };
        var obj992 = {
            op: "READ_HI",
            instBit: 17,
            bitType: "ADDRESS",
            bitNo: 9,
            value: 0
        };
        var obj991 = {
            paged: false,
            size: 128,
            page_size: 128,
            readback: obj1451,
            memops: obj1454
        };
        var obj990 = {
            paged: false,
            size: 393216,
            page_size: 512,
            readback: obj1451,
            memops: obj1454
        };
        var obj989 = {
            op: "WRITE_HI",
            instBit: 17,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj988 = {
            op: "WRITEPAGE",
            instBit: 24,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj987 = {
            paged: false,
            size: 1024,
            page_size: 32,
            readback: obj1451,
            memops: obj1454
        };
        var obj986 = {
            op: "WRITEPAGE",
            instBit: 19,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj985 = {
            op: "WRITE_HI",
            instBit: 20,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj984 = {
            paged: false,
            size: 131072,
            page_size: 256,
            readback: obj1451,
            memops: obj1454
        };
        var obj983 = {
            op: "WRITEPAGE",
            instBit: 4,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj982 = {
            op: "READ_LO",
            instBit: 12,
            bitType: "ADDRESS",
            bitNo: 4,
            value: 0
        };
        var obj981 = {
            paged: false,
            size: 139264,
            page_size: 512,
            readback: obj1451,
            memops: obj1454
        };
        var obj980 = {
            op: "READ_HI",
            instBit: 15,
            bitType: "ADDRESS",
            bitNo: 7,
            value: 0
        };
        var obj979 = {
            op: "READ_LO",
            instBit: 11,
            bitType: "ADDRESS",
            bitNo: 3,
            value: 0
        };
        var obj978 = {
            op: "WRITEPAGE",
            instBit: 1,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj977 = {
            op: "WRITEPAGE",
            instBit: 21,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj976 = {
            op: "READ_LO",
            instBit: 19,
            bitType: "ADDRESS",
            bitNo: 11,
            value: 0
        };
        var obj975 = {
            paged: false,
            size: 50,
            page_size: 50,
            readback: obj1451,
            memops: obj1454
        };
        var obj974 = {
            op: "WRITE_HI",
            instBit: 21,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj973 = {
            op: "WRITEPAGE",
            instBit: 8,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj972 = {
            paged: false,
            size: 20480,
            page_size: 256,
            readback: obj1451,
            memops: obj1454
        };
        var obj971 = {
            op: "READ_HI",
            instBit: 22,
            bitType: "ADDRESS",
            bitNo: 14,
            value: 0
        };
        var obj970 = {
            op: "WRITEPAGE",
            instBit: 9,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj969 = {
            paged: false,
            size: 4096,
            page_size: 256,
            readback: obj1451,
            memops: obj1454
        };
        var obj968 = {
            paged: false,
            size: 32768,
            page_size: 128,
            readback: obj1451,
            memops: obj1454
        };
        var obj967 = {
            op: "READ_LO",
            instBit: 22,
            bitType: "ADDRESS",
            bitNo: 14,
            value: 0
        };
        var obj966 = {
            op: "READ_HI",
            instBit: 8,
            bitType: "ADDRESS",
            bitNo: 0,
            value: 0
        };
        var obj965 = {
            paged: false,
            size: 512,
            page_size: 32,
            readback: obj1451,
            memops: obj1454
        };
        var obj964 = {
            op: "READ_LO",
            instBit: 13,
            bitType: "ADDRESS",
            bitNo: 5,
            value: 0
        };
        var obj963 = {
            op: "WRITE_LO",
            instBit: 19,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj962 = {
            op: "WRITEPAGE",
            instBit: 18,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj961 = {
            op: "READ_HI",
            instBit: 9,
            bitType: "ADDRESS",
            bitNo: 1,
            value: 0
        };
        var obj960 = {
            op: "WRITE_HI",
            instBit: 14,
            bitType: "ADDRESS",
            bitNo: 6,
            value: 0
        };
        var obj959 = {
            op: "WRITE_HI",
            instBit: 13,
            bitType: "ADDRESS",
            bitNo: 5,
            value: 0
        };
        var obj958 = {
            op: "WRITEPAGE",
            instBit: 11,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj957 = {
            op: "WRITEPAGE",
            instBit: 9,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj956 = {
            op: "WRITEPAGE",
            instBit: 2,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj955 = {
            op: "WRITEPAGE",
            instBit: 5,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj954 = {
            op: "WRITEPAGE",
            instBit: 18,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj953 = {
            op: "WRITEPAGE",
            instBit: 22,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj952 = {
            op: "WRITE_LO",
            instBit: 16,
            bitType: "ADDRESS",
            bitNo: 8,
            value: 0
        };
        var obj951 = {
            op: "WRITEPAGE",
            instBit: 12,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj950 = {
            op: "WRITEPAGE",
            instBit: 15,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj949 = {
            op: "WRITE_LO",
            instBit: 18,
            bitType: "ADDRESS",
            bitNo: 10,
            value: 0
        };
        var obj948 = {
            op: "WRITE_LO",
            instBit: 13,
            bitType: "ADDRESS",
            bitNo: 5,
            value: 0
        };
        var obj947 = {
            op: "WRITE_LO",
            instBit: 14,
            bitType: "ADDRESS",
            bitNo: 6,
            value: 0
        };
        var obj946 = {
            op: "WRITEPAGE",
            instBit: 8,
            bitType: "IGNORE",
            bitNo: 0,
            value: 0
        };
        var obj945 = {
            op: "WRITE_LO",
            instBit: 12,
            bitType: "ADDRESS",
            bitNo: 4,
            value: 0
        };
        var obj944 = {
            op: "WRITEPAGE",
            instBit: 14,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj943 = {
            op: "WRITE_HI",
            instBit: 11,
            bitType: "ADDRESS",
            bitNo: 3,
            value: 0
        };
        var obj942 = {
            op: "WRITEPAGE",
            instBit: 6,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj941 = {
            op: "WRITE_LO",
            instBit: 10,
            bitType: "ADDRESS",
            bitNo: 2,
            value: 0
        };
        var obj940 = {
            op: "WRITE_HI",
            instBit: 18,
            bitType: "ADDRESS",
            bitNo: 10,
            value: 0
        };
        var obj939 = {
            op: "WRITEPAGE",
            instBit: 4,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj938 = {
            op: "WRITEPAGE",
            instBit: 21,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj937 = {
            op: "WRITE_HI",
            instBit: 17,
            bitType: "ADDRESS",
            bitNo: 9,
            value: 0
        };
        var obj936 = {
            op: "WRITEPAGE",
            instBit: 1,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj935 = {
            op: "WRITE_HI",
            instBit: 8,
            bitType: "ADDRESS",
            bitNo: 0,
            value: 0
        };
        var obj934 = {
            op: "WRITEPAGE",
            instBit: 19,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj933 = {
            op: "WRITEPAGE",
            instBit: 20,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj932 = {
            op: "WRITEPAGE",
            instBit: 3,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj931 = {
            op: "WRITE_LO",
            instBit: 11,
            bitType: "ADDRESS",
            bitNo: 3,
            value: 0
        };
        var obj930 = {
            op: "WRITEPAGE",
            instBit: 16,
            bitType: "IGNORE",
            bitNo: 0,
            value: 0
        };
        var obj929 = {
            op: "WRITE_HI",
            instBit: 10,
            bitType: "ADDRESS",
            bitNo: 2,
            value: 0
        };
        var obj928 = {
            op: "WRITE_HI",
            instBit: 12,
            bitType: "ADDRESS",
            bitNo: 4,
            value: 0
        };
        var obj927 = {
            op: "WRITE_HI",
            instBit: 9,
            bitType: "ADDRESS",
            bitNo: 1,
            value: 0
        };
        var obj926 = {
            op: "WRITE_LO",
            instBit: 8,
            bitType: "ADDRESS",
            bitNo: 0,
            value: 0
        };
        var obj925 = {
            op: "WRITEPAGE",
            instBit: 23,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj924 = {
            op: "WRITE_LO",
            instBit: 17,
            bitType: "ADDRESS",
            bitNo: 9,
            value: 0
        };
        var obj923 = {
            op: "WRITE_LO",
            instBit: 9,
            bitType: "ADDRESS",
            bitNo: 1,
            value: 0
        };
        var obj922 = {
            op: "WRITEPAGE",
            instBit: 17,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj921 = {
            op: "WRITE_LO",
            instBit: 15,
            bitType: "ADDRESS",
            bitNo: 7,
            value: 0
        };
        var obj920 = {
            op: "WRITEPAGE",
            instBit: 10,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj919 = {
            op: "WRITE_HI",
            instBit: 19,
            bitType: "ADDRESS",
            bitNo: 11,
            value: 0
        };
        var obj918 = {
            op: "WRITEPAGE",
            instBit: 0,
            bitType: "IGNORE",
            bitNo: 0,
            value: 0
        };
        var obj917 = {
            op: "WRITE_LO",
            instBit: 19,
            bitType: "ADDRESS",
            bitNo: 11,
            value: 0
        };
        var obj916 = {
            op: "WRITE_HI",
            instBit: 16,
            bitType: "ADDRESS",
            bitNo: 8,
            value: 0
        };
        var obj915 = {
            op: "WRITE_HI",
            instBit: 15,
            bitType: "ADDRESS",
            bitNo: 7,
            value: 0
        };
        var obj914 = {
            op: "WRITEPAGE",
            instBit: 13,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj913 = {
            op: "WRITEPAGE",
            instBit: 7,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj912 = {
            op: "WRITEPAGE",
            instBit: 9,
            bitType: "ADDRESS",
            bitNo: 1,
            value: 0
        };
        var obj911 = {
            op: "LOADPAGE_HI",
            instBit: 2,
            bitType: "INPUT",
            bitNo: 2,
            value: 0
        };
        var obj910 = {
            op: "LOADPAGE_LO",
            instBit: 15,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj909 = {
            op: "LOADPAGE_LO",
            instBit: 18,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj908 = {
            op: "LOADPAGE_LO",
            instBit: 2,
            bitType: "INPUT",
            bitNo: 2,
            value: 0
        };
        var obj907 = {
            op: "LOADPAGE_LO",
            instBit: 1,
            bitType: "INPUT",
            bitNo: 1,
            value: 0
        };
        var obj906 = {
            op: "WRITEPAGE",
            instBit: 19,
            bitType: "ADDRESS",
            bitNo: 11,
            value: 0
        };
        var obj905 = {
            op: "WRITEPAGE",
            instBit: 23,
            bitType: "ADDRESS",
            bitNo: 15,
            value: 0
        };
        var obj904 = {
            op: "LOADPAGE_LO",
            instBit: 14,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj903 = {
            op: "LOADPAGE_LO",
            instBit: 21,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj902 = {
            op: "LOADPAGE_LO",
            instBit: 22,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj901 = {
            op: "WRITEPAGE",
            instBit: 21,
            bitType: "ADDRESS",
            bitNo: 13,
            value: 0
        };
        var obj900 = {
            op: "LOADPAGE_LO",
            instBit: 27,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj899 = {
            op: "LOADPAGE_LO",
            instBit: 5,
            bitType: "INPUT",
            bitNo: 5,
            value: 0
        };
        var obj898 = {
            op: "LOADPAGE_HI",
            instBit: 19,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj897 = {
            op: "LOADPAGE_LO",
            instBit: 31,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj896 = {
            op: "LOADPAGE_HI",
            instBit: 5,
            bitType: "INPUT",
            bitNo: 5,
            value: 0
        };
        var obj895 = {
            op: "WRITEPAGE",
            instBit: 12,
            bitType: "ADDRESS",
            bitNo: 4,
            value: 0
        };
        var obj894 = {
            op: "LOADPAGE_LO",
            instBit: 29,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj893 = {
            op: "WRITEPAGE",
            instBit: 16,
            bitType: "ADDRESS",
            bitNo: 8,
            value: 0
        };
        var obj892 = {
            op: "LOADPAGE_LO",
            instBit: 24,
            bitType: "VALUE",
            bitNo: 0,
            value: 1
        };
        var obj891 = {
            op: "LOADPAGE_LO",
            instBit: 24,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj890 = {
            op: "LOADPAGE_LO",
            instBit: 28,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj889 = {
            op: "WRITEPAGE",
            instBit: 18,
            bitType: "ADDRESS",
            bitNo: 10,
            value: 0
        };
        var obj888 = {
            op: "LOADPAGE_LO",
            instBit: 7,
            bitType: "INPUT",
            bitNo: 7,
            value: 0
        };
        var obj887 = {
            op: "LOADPAGE_LO",
            instBit: 13,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj886 = {
            op: "LOADPAGE_HI",
            instBit: 16,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj885 = {
            op: "LOADPAGE_HI",
            instBit: 0,
            bitType: "INPUT",
            bitNo: 0,
            value: 0
        };
        var obj884 = {
            op: "LOADPAGE_LO",
            instBit: 20,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj883 = {
            op: "LOADPAGE_HI",
            instBit: 21,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj882 = {
            op: "LOADPAGE_LO",
            instBit: 25,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj881 = {
            op: "WRITEPAGE",
            instBit: 17,
            bitType: "ADDRESS",
            bitNo: 9,
            value: 0
        };
        var obj880 = {
            op: "WRITEPAGE",
            instBit: 8,
            bitType: "ADDRESS",
            bitNo: 0,
            value: 0
        };
        var obj879 = {
            op: "LOADPAGE_LO",
            instBit: 16,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj878 = {
            op: "WRITEPAGE",
            instBit: 22,
            bitType: "ADDRESS",
            bitNo: 14,
            value: 0
        };
        var obj877 = {
            op: "LOADPAGE_HI",
            instBit: 29,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj876 = {
            op: "LOADPAGE_HI",
            instBit: 6,
            bitType: "INPUT",
            bitNo: 6,
            value: 0
        };
        var obj875 = {
            op: "LOADPAGE_HI",
            instBit: 31,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj874 = {
            op: "LOADPAGE_LO",
            instBit: 3,
            bitType: "INPUT",
            bitNo: 3,
            value: 0
        };
        var obj873 = {
            op: "LOADPAGE_HI",
            instBit: 27,
            bitType: "VALUE",
            bitNo: 3,
            value: 1
        };
        var obj872 = {
            op: "LOADPAGE_LO",
            instBit: 23,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj871 = {
            op: "LOADPAGE_HI",
            instBit: 23,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj870 = {
            op: "LOADPAGE_HI",
            instBit: 30,
            bitType: "VALUE",
            bitNo: 6,
            value: 1
        };
        var obj869 = {
            op: "LOADPAGE_HI",
            instBit: 22,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj868 = {
            op: "LOADPAGE_LO",
            instBit: 31,
            bitType: "VALUE",
            bitNo: 7,
            value: 1
        };
        var obj867 = {
            op: "WRITEPAGE",
            instBit: 11,
            bitType: "ADDRESS",
            bitNo: 3,
            value: 0
        };
        var obj866 = {
            op: "LOADPAGE_HI",
            instBit: 4,
            bitType: "INPUT",
            bitNo: 4,
            value: 0
        };
        var obj865 = {
            op: "LOADPAGE_HI",
            instBit: 17,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj864 = {
            op: "LOADPAGE_LO",
            instBit: 17,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj863 = {
            op: "LOADPAGE_LO",
            instBit: 11,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj862 = {
            op: "LOADPAGE_LO",
            instBit: 6,
            bitType: "INPUT",
            bitNo: 6,
            value: 0
        };
        var obj861 = {
            op: "WRITEPAGE",
            instBit: 13,
            bitType: "ADDRESS",
            bitNo: 5,
            value: 0
        };
        var obj860 = {
            op: "LOADPAGE_HI",
            instBit: 28,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj859 = {
            op: "LOADPAGE_LO",
            instBit: 30,
            bitType: "VALUE",
            bitNo: 6,
            value: 1
        };
        var obj858 = {
            op: "LOADPAGE_LO",
            instBit: 26,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj857 = {
            op: "LOADPAGE_HI",
            instBit: 26,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj856 = {
            op: "LOADPAGE_HI",
            instBit: 3,
            bitType: "INPUT",
            bitNo: 3,
            value: 0
        };
        var obj855 = {
            op: "LOADPAGE_LO",
            instBit: 12,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj854 = {
            op: "LOADPAGE_LO",
            instBit: 10,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj853 = {
            op: "WRITEPAGE",
            instBit: 14,
            bitType: "ADDRESS",
            bitNo: 6,
            value: 0
        };
        var obj852 = {
            op: "LOADPAGE_HI",
            instBit: 7,
            bitType: "INPUT",
            bitNo: 7,
            value: 0
        };
        var obj851 = {
            op: "LOADPAGE_HI",
            instBit: 20,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj850 = {
            op: "LOADPAGE_LO",
            instBit: 0,
            bitType: "INPUT",
            bitNo: 0,
            value: 0
        };
        var obj849 = {
            op: "WRITEPAGE",
            instBit: 20,
            bitType: "ADDRESS",
            bitNo: 12,
            value: 0
        };
        var obj848 = {
            op: "LOADPAGE_HI",
            instBit: 1,
            bitType: "INPUT",
            bitNo: 1,
            value: 0
        };
        var obj847 = {
            op: "WRITEPAGE",
            instBit: 15,
            bitType: "ADDRESS",
            bitNo: 7,
            value: 0
        };
        var obj846 = {
            op: "LOADPAGE_HI",
            instBit: 18,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj845 = {
            op: "LOADPAGE_HI",
            instBit: 24,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj844 = {
            op: "WRITEPAGE",
            instBit: 10,
            bitType: "ADDRESS",
            bitNo: 2,
            value: 0
        };
        var obj843 = {
            op: "LOADPAGE_LO",
            instBit: 4,
            bitType: "INPUT",
            bitNo: 4,
            value: 0
        };
        var obj842 = {
            op: "LOADPAGE_HI",
            instBit: 25,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj841 = {
            op: "LOADPAGE_LO",
            instBit: 19,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj840 = {
            op: "LOADPAGE_LO",
            instBit: 12,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj839 = {
            op: "LOADPAGE_LO",
            instBit: 13,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj838 = {
            op: "LOADPAGE_HI",
            instBit: 15,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj837 = {
            op: "LOADPAGE_LO",
            instBit: 17,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj836 = {
            op: "LOADPAGE_HI",
            instBit: 23,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj835 = {
            op: "LOADPAGE_HI",
            instBit: 21,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj834 = {
            op: "LOADPAGE_HI",
            instBit: 13,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj833 = {
            op: "LOADPAGE_HI",
            instBit: 19,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj832 = {
            op: "LOADPAGE_LO",
            instBit: 23,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj831 = {
            op: "LOADPAGE_LO",
            instBit: 16,
            bitType: "IGNORE",
            bitNo: 0,
            value: 0
        };
        var obj830 = {
            op: "LOADPAGE_LO",
            instBit: 22,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj829 = {
            op: "LOADPAGE_HI",
            instBit: 18,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj828 = {
            op: "LOADPAGE_HI",
            instBit: 20,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj827 = {
            op: "LOADPAGE_HI",
            instBit: 14,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj826 = {
            op: "LOADPAGE_HI",
            instBit: 16,
            bitType: "IGNORE",
            bitNo: 0,
            value: 0
        };
        var obj825 = {
            op: "LOADPAGE_LO",
            instBit: 20,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj824 = {
            op: "LOADPAGE_LO",
            instBit: 14,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj823 = {
            op: "LOADPAGE_LO",
            instBit: 21,
            bitType: "IGNORE",
            bitNo: 5,
            value: 0
        };
        var obj822 = {
            op: "LOADPAGE_HI",
            instBit: 17,
            bitType: "IGNORE",
            bitNo: 1,
            value: 0
        };
        var obj821 = {
            op: "LOADPAGE_HI",
            instBit: 22,
            bitType: "IGNORE",
            bitNo: 6,
            value: 0
        };
        var obj820 = {
            op: "LOADPAGE_HI",
            instBit: 12,
            bitType: "IGNORE",
            bitNo: 4,
            value: 0
        };
        var obj819 = {
            op: "LOADPAGE_LO",
            instBit: 18,
            bitType: "IGNORE",
            bitNo: 2,
            value: 0
        };
        var obj818 = {
            op: "LOADPAGE_LO",
            instBit: 15,
            bitType: "IGNORE",
            bitNo: 7,
            value: 0
        };
        var obj817 = {
            op: "LOADPAGE_LO",
            instBit: 19,
            bitType: "IGNORE",
            bitNo: 3,
            value: 0
        };
        var obj816 = {
            op: "LOAD_EXT_ADDR",
            instBit: 18,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj815 = {
            op: "LOADPAGE_LO",
            instBit: 9,
            bitType: "ADDRESS",
            bitNo: 1,
            value: 0
        };
        var obj814 = {
            op: "LOADPAGE_HI",
            instBit: 13,
            bitType: "ADDRESS",
            bitNo: 5,
            value: 0
        };
        var obj813 = {
            op: "LOAD_EXT_ADDR",
            instBit: 13,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj812 = {
            op: "LOAD_EXT_ADDR",
            instBit: 5,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj811 = {
            op: "LOADPAGE_HI",
            instBit: 11,
            bitType: "ADDRESS",
            bitNo: 3,
            value: 0
        };
        var obj810 = {
            op: "LOAD_EXT_ADDR",
            instBit: 24,
            bitType: "VALUE",
            bitNo: 0,
            value: 1
        };
        var obj809 = {
            op: "LOAD_EXT_ADDR",
            instBit: 31,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj808 = {
            op: "LOAD_EXT_ADDR",
            instBit: 11,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj807 = {
            op: "LOAD_EXT_ADDR",
            instBit: 26,
            bitType: "VALUE",
            bitNo: 2,
            value: 1
        };
        var obj806 = {
            op: "LOADPAGE_HI",
            instBit: 10,
            bitType: "ADDRESS",
            bitNo: 2,
            value: 0
        };
        var obj805 = {
            op: "LOAD_EXT_ADDR",
            instBit: 17,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj804 = {
            op: "LOADPAGE_LO",
            instBit: 8,
            bitType: "ADDRESS",
            bitNo: 0,
            value: 0
        };
        var obj803 = {
            op: "LOAD_EXT_ADDR",
            instBit: 0,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj802 = {
            op: "LOAD_EXT_ADDR",
            instBit: 12,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj801 = {
            op: "LOAD_EXT_ADDR",
            instBit: 9,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj800 = {
            op: "LOAD_EXT_ADDR",
            instBit: 27,
            bitType: "VALUE",
            bitNo: 3,
            value: 1
        };
        var obj799 = {
            op: "LOAD_EXT_ADDR",
            instBit: 29,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj798 = {
            op: "LOADPAGE_LO",
            instBit: 10,
            bitType: "ADDRESS",
            bitNo: 2,
            value: 0
        };
        var obj797 = {
            op: "LOADPAGE_LO",
            instBit: 15,
            bitType: "ADDRESS",
            bitNo: 7,
            value: 0
        };
        var obj796 = {
            op: "LOAD_EXT_ADDR",
            instBit: 16,
            bitType: "VALUE",
            bitNo: 0,
            value: 0
        };
        var obj795 = {
            op: "LOADPAGE_LO",
            instBit: 11,
            bitType: "ADDRESS",
            bitNo: 3,
            value: 0
        };
        var obj794 = {
            op: "LOADPAGE_HI",
            instBit: 9,
            bitType: "ADDRESS",
            bitNo: 1,
            value: 0
        };
        var obj793 = {
            op: "LOADPAGE_LO",
            instBit: 12,
            bitType: "ADDRESS",
            bitNo: 4,
            value: 0
        };
        var obj792 = {
            op: "LOAD_EXT_ADDR",
            instBit: 15,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj791 = {
            op: "LOAD_EXT_ADDR",
            instBit: 10,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj790 = {
            op: "LOADPAGE_HI",
            instBit: 8,
            bitType: "ADDRESS",
            bitNo: 0,
            value: 0
        };
        var obj789 = {
            op: "LOAD_EXT_ADDR",
            instBit: 19,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj788 = {
            op: "LOAD_EXT_ADDR",
            instBit: 14,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj787 = {
            op: "LOAD_EXT_ADDR",
            instBit: 20,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj786 = {
            op: "LOAD_EXT_ADDR",
            instBit: 3,
            bitType: "VALUE",
            bitNo: 3,
            value: 0
        };
        var obj785 = {
            op: "LOADPAGE_LO",
            instBit: 14,
            bitType: "ADDRESS",
            bitNo: 6,
            value: 0
        };
        var obj784 = {
            op: "LOADPAGE_HI",
            instBit: 12,
            bitType: "ADDRESS",
            bitNo: 4,
            value: 0
        };
        var obj783 = {
            op: "LOAD_EXT_ADDR",
            instBit: 23,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj782 = {
            op: "LOADPAGE_HI",
            instBit: 14,
            bitType: "ADDRESS",
            bitNo: 6,
            value: 0
        };
        var obj781 = {
            op: "LOAD_EXT_ADDR",
            instBit: 28,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj780 = {
            op: "LOAD_EXT_ADDR",
            instBit: 2,
            bitType: "VALUE",
            bitNo: 2,
            value: 0
        };
        var obj779 = {
            op: "LOAD_EXT_ADDR",
            instBit: 4,
            bitType: "VALUE",
            bitNo: 4,
            value: 0
        };
        var obj778 = {
            op: "LOAD_EXT_ADDR",
            instBit: 25,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj777 = {
            op: "LOAD_EXT_ADDR",
            instBit: 6,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj776 = {
            op: "LOAD_EXT_ADDR",
            instBit: 21,
            bitType: "VALUE",
            bitNo: 5,
            value: 0
        };
        var obj775 = {
            op: "LOADPAGE_LO",
            instBit: 13,
            bitType: "ADDRESS",
            bitNo: 5,
            value: 0
        };
        var obj774 = {
            op: "LOAD_EXT_ADDR",
            instBit: 7,
            bitType: "VALUE",
            bitNo: 7,
            value: 0
        };
        var obj773 = {
            op: "LOAD_EXT_ADDR",
            instBit: 30,
            bitType: "VALUE",
            bitNo: 6,
            value: 1
        };
        var obj772 = {
            op: "LOADPAGE_HI",
            instBit: 15,
            bitType: "ADDRESS",
            bitNo: 7,
            value: 0
        };
        var obj771 = {
            op: "LOAD_EXT_ADDR",
            instBit: 1,
            bitType: "VALUE",
            bitNo: 1,
            value: 0
        };
        var obj770 = {
            op: "LOAD_EXT_ADDR",
            instBit: 22,
            bitType: "VALUE",
            bitNo: 6,
            value: 0
        };
        var obj769 = {
            op: "LOAD_EXT_ADDR",
            instBit: 8,
            bitType: "ADDRESS",
            bitNo: 16,
            value: 0
        };
        var obj768 = {
            delay: 3,
            blocksize: 128,
            paged: false,
            size: 1024,
            readback: obj1451,
            memops: obj1454
        };
        var obj767 = {
            delay: 5,
            blocksize: 64,
            paged: false,
            size: 64,
            readback: obj1451,
            memops: obj1454
        };
        var obj766 = {
            blocksize: 128,
            paged: false,
            size: 1024,
            page_size: 16,
            readback: obj1451,
            memops: obj1454
        };
        var obj765 = {
            blocksize: 128,
            paged: false,
            size: 4096,
            page_size: 64,
            readback: obj1451,
            memops: obj1454
        };
        var obj764 = {
            blocksize: 128,
            paged: false,
            size: 2048,
            page_size: 16,
            readback: obj1451,
            memops: obj1454
        };
        var obj763 = {
            blocksize: 4,
            paged: false,
            size: 1,
            page_size: 16,
            readback: obj1451,
            memops: obj1454
        };
        var obj762 = {
            blocksize: 128,
            paged: false,
            size: 512,
            page_size: 16,
            readback: obj1451,
            memops: obj1454
        };
        var obj761 = {
            paged: true,
            size: 524288,
            page_size: 512,
            num_pages: 1024,
            readback: obj1451,
            memops: obj1454
        };
        var obj760 = {
            flash: obj761,
        };
        var obj759 = {
            blocksize: 128,
            paged: true,
            size: 40960,
            page_size: 128,
            num_pages: 320,
            readback: obj1451,
            memops: obj1454
        };
        var obj758 = {
            blocksize: 4,
            paged: false,
            size: 512,
            page_size: 4,
            num_pages: 128,
            readback: obj1451,
            memops: obj1454
        };
        var obj757 = {
            AVRPart: "AT32UC3A0512",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj760
        };
        var obj756 = {
            AVRPart: "deprecated, use 'uc3a0512'",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj760
        };
        var obj755 = {
            signature: obj1014,
            fuse: obj763,
            calibration: obj1027,
            lockbits: obj1027,
            flash: obj766,
        };
        var obj754 = {
            signature: obj1014,
            fuse: obj763,
            calibration: obj1027,
            lockbits: obj1027,
            flash: obj762,
        };
        var obj753 = {
            signature: obj1014,
            fuse: obj763,
            calibration: obj1027,
            lockbits: obj1027,
            flash: obj765,
        };
        var obj752 = {
            signature: obj1014,
            fuse: obj763,
            calibration: obj1027,
            lockbits: obj1027,
            flash: obj764,
        };
        var obj751 = {
            eeprom: obj767,
            flash: obj768,
            signature: obj1445,
            lock: obj1446,
            calibration: obj1446,
            fuse: obj1446,
        };
        var obj750 = {
            eeprom: obj758,
            flash: obj759,
            hfuse: obj1446,
            lfuse: obj1446,
            lockbits: obj1446,
            signature: obj1445,
        };
        var obj749 = {
            AVRPart: "ATtiny5",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj754
        };
        var obj748 = {
            AVRPart: "ATtiny4",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj754
        };
        var obj747 = {
            AVRPart: "ATtiny9",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj755
        };
        var obj746 = {
            AVRPart: "ATtiny20",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj752
        };
        var obj745 = {
            AVRPart: "ATtiny40",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj753
        };
        var obj744 = {
            AVRPart: "ATtiny10",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj755
        };
        var obj743 = {
            AVRPart: "ATtiny11",
            chipEraseDelay: 20000,
            stk500_devcode: 0x11,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            ops: obj1455,
            memory: obj751
        };
        var obj742 = {
            AVRPart: "ATMEGA406",
            stk500_devcode: 0x00,
            pagel: 0xa7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: false,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj750
        };
        var obj741 = {
            signature: obj1445,
            prodsig: obj975,
            fuse1: obj1446,
            fuse2: obj1446,
            fuse4: obj1446,
            fuse5: obj1446,
            lock: obj1446,
            data: obj1447,
            eeprom: obj1033,
            application: obj990,
            apptable: obj1022,
            boot: obj1022,
            flash: obj1000,
            usersig: obj1002,
        };
        var obj740 = {
            signature: obj1445,
            prodsig: obj975,
            fuse1: obj1446,
            fuse2: obj1446,
            fuse4: obj1446,
            fuse5: obj1446,
            lock: obj1446,
            data: obj1447,
            eeprom: obj987,
            application: obj1044,
            apptable: obj969,
            boot: obj969,
            flash: obj972,
            usersig: obj1029,
        };
        var obj739 = {
            signature: obj1445,
            prodsig: obj975,
            fuse1: obj1446,
            fuse2: obj1446,
            fuse4: obj1446,
            fuse5: obj1446,
            lock: obj1446,
            data: obj1447,
            eeprom: obj965,
            application: obj994,
            apptable: obj1026,
            boot: obj1026,
            flash: obj1037,
            usersig: obj991,
        };
        var obj738 = {
            signature: obj1445,
            prodsig: obj975,
            fuse1: obj1446,
            fuse2: obj1446,
            fuse4: obj1446,
            fuse5: obj1446,
            lock: obj1446,
            data: obj1447,
            eeprom: obj965,
            application: obj1008,
            apptable: obj1043,
            boot: obj1043,
            flash: obj1047,
            usersig: obj991,
        };
        var obj737 = {
            signature: obj1445,
            prodsig: obj975,
            fuse1: obj1446,
            fuse2: obj1446,
            fuse4: obj1446,
            fuse5: obj1446,
            lock: obj1446,
            data: obj1447,
            eeprom: obj1054,
            application: obj1074,
            apptable: obj1022,
            boot: obj1022,
            flash: obj981,
            usersig: obj1002,
        };
        var obj736 = {
            signature: obj1445,
            prodsig: obj975,
            fuse1: obj1446,
            fuse2: obj1446,
            fuse4: obj1446,
            fuse5: obj1446,
            lock: obj1446,
            data: obj1447,
            eeprom: obj987,
            application: obj968,
            apptable: obj1043,
            boot: obj1043,
            flash: obj1013,
            usersig: obj991,
        };
        var obj735 = {
            signature: obj1445,
            prodsig: obj975,
            fuse1: obj1446,
            fuse2: obj1446,
            fuse4: obj1446,
            fuse5: obj1446,
            lock: obj1446,
            data: obj1447,
            eeprom: obj987,
            application: obj1046,
            apptable: obj969,
            boot: obj969,
            flash: obj1041,
            usersig: obj1029,
        };
        var obj734 = {
            signature: obj1445,
            prodsig: obj975,
            fuse1: obj1446,
            fuse2: obj1446,
            fuse4: obj1446,
            fuse5: obj1446,
            lock: obj1446,
            data: obj1447,
            eeprom: obj1054,
            application: obj984,
            apptable: obj969,
            boot: obj998,
            flash: obj1062,
            usersig: obj1029,
        };
        var obj733 = {
            signature: obj1445,
            prodsig: obj975,
            fuse1: obj1446,
            fuse2: obj1446,
            fuse4: obj1446,
            fuse5: obj1446,
            lock: obj1446,
            data: obj1447,
            eeprom: obj1054,
            application: obj995,
            apptable: obj969,
            boot: obj969,
            flash: obj1055,
            usersig: obj1029,
        };
        var obj732 = {
            signature: obj1445,
            prodsig: obj975,
            fuse1: obj1446,
            fuse2: obj1446,
            fuse4: obj1446,
            fuse5: obj1446,
            lock: obj1446,
            data: obj1447,
            eeprom: obj1033,
            application: obj1071,
            apptable: obj1022,
            boot: obj1022,
            flash: obj1067,
            usersig: obj1002,
        };
        var obj731 = {
            signature: obj1445,
            prodsig: obj975,
            fuse1: obj1446,
            fuse2: obj1446,
            fuse4: obj1446,
            fuse5: obj1446,
            lock: obj1446,
            data: obj1447,
            eeprom: obj1054,
            application: obj1018,
            apptable: obj1022,
            boot: obj1022,
            flash: obj1035,
            usersig: obj1002,
        };
        var obj730 = {
            signature: obj1445,
            prodsig: obj975,
            fuse1: obj1446,
            fuse2: obj1446,
            fuse4: obj1446,
            fuse5: obj1446,
            lock: obj1446,
            data: obj1447,
            eeprom: obj1033,
            application: obj1071,
            apptable: obj1022,
            boot: obj1022,
            flash: obj1067,
            usersig: obj1002,
            fuse0: obj1446,
        };
        var obj729 = {
            signature: obj1445,
            prodsig: obj975,
            fuse1: obj1446,
            fuse2: obj1446,
            fuse4: obj1446,
            fuse5: obj1446,
            lock: obj1446,
            data: obj1447,
            eeprom: obj1054,
            application: obj1074,
            apptable: obj1004,
            boot: obj1022,
            flash: obj981,
            usersig: obj1002,
            fuse0: obj1446,
        };
        var obj728 = {
            signature: obj1445,
            prodsig: obj975,
            fuse1: obj1446,
            fuse2: obj1446,
            fuse4: obj1446,
            fuse5: obj1446,
            lock: obj1446,
            data: obj1447,
            eeprom: obj987,
            application: obj1044,
            apptable: obj969,
            boot: obj969,
            flash: obj972,
            usersig: obj1029,
            fuse0: obj1446,
        };
        var obj727 = {
            signature: obj1445,
            prodsig: obj975,
            fuse1: obj1446,
            fuse2: obj1446,
            fuse4: obj1446,
            fuse5: obj1446,
            lock: obj1446,
            data: obj1447,
            eeprom: obj1054,
            application: obj995,
            apptable: obj969,
            boot: obj969,
            flash: obj1055,
            usersig: obj1029,
            fuse0: obj1446,
        };
        var obj726 = {
            signature: obj1445,
            prodsig: obj975,
            fuse1: obj1446,
            fuse2: obj1446,
            fuse4: obj1446,
            fuse5: obj1446,
            lock: obj1446,
            data: obj1447,
            eeprom: obj1054,
            application: obj1018,
            apptable: obj1022,
            boot: obj1022,
            flash: obj1035,
            usersig: obj1002,
            fuse0: obj1446,
        };
        var obj725 = {
            signature: obj1445,
            prodsig: obj975,
            fuse1: obj1446,
            fuse2: obj1446,
            fuse4: obj1446,
            fuse5: obj1446,
            lock: obj1446,
            data: obj1447,
            eeprom: obj1054,
            application: obj984,
            apptable: obj998,
            boot: obj998,
            flash: obj1062,
            usersig: obj1029,
            fuse0: obj1446,
        };
        var obj724 = {
            signature: obj1445,
            prodsig: obj975,
            fuse1: obj1446,
            fuse2: obj1446,
            fuse4: obj1446,
            fuse5: obj1446,
            lock: obj1446,
            data: obj1447,
            eeprom: obj987,
            application: obj1046,
            apptable: obj969,
            boot: obj969,
            flash: obj1041,
            usersig: obj1029,
            fuse0: obj1446,
        };
        var obj723 = {
            signature: obj1445,
            prodsig: obj975,
            fuse1: obj1446,
            fuse2: obj1446,
            fuse4: obj1446,
            fuse5: obj1446,
            lock: obj1446,
            data: obj1447,
            eeprom: obj1054,
            application: obj1074,
            apptable: obj1022,
            boot: obj1022,
            flash: obj981,
            usersig: obj1002,
            fuse0: obj1446,
        };
        var obj722 = {
            AVRPart: "ATxmega8E5",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj739
        };
        var obj721 = {
            AVRPart: "ATxmega32C4",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj735
        };
        var obj720 = {
            AVRPart: "ATxmega32E5",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj736
        };
        var obj719 = {
            AVRPart: "ATxmega32D4",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj735
        };
        var obj718 = {
            AVRPart: "ATxmega64D3",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj733
        };
        var obj717 = {
            AVRPart: "ATxmega64D4",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj733
        };
        var obj716 = {
            AVRPart: "ATxmega16D4",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj740
        };
        var obj715 = {
            AVRPart: "ATxmega64C3",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj733
        };
        var obj714 = {
            AVRPart: "ATxmega16C4",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj740
        };
        var obj713 = {
            AVRPart: "ATxmega16E5",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj738
        };
        var obj712 = {
            AVRPart: "ATxmega384D3",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj741
        };
        var obj711 = {
            AVRPart: "ATxmega192C3",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj731
        };
        var obj710 = {
            AVRPart: "ATxmega128C3",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj737
        };
        var obj709 = {
            AVRPart: "ATxmega384C3",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj741
        };
        var obj708 = {
            AVRPart: "ATxmega128D4",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj737
        };
        var obj707 = {
            AVRPart: "ATxmega32A4U",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj735
        };
        var obj706 = {
            AVRPart: "ATxmega128D3",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj737
        };
        var obj705 = {
            AVRPart: "ATxmega256D3",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj732
        };
        var obj704 = {
            AVRPart: "ATxmega192D3",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj731
        };
        var obj703 = {
            AVRPart: "ATxmega64A4U",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj733
        };
        var obj702 = {
            AVRPart: "ATxmega256C3",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj732
        };
        var obj701 = {
            AVRPart: "ATxmega16A4U",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj740
        };
        var obj700 = {
            AVRPart: "ATxmega128A4U",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj734
        };
        var obj699 = {
            AVRPart: "ATxmega16A4",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj728
        };
        var obj698 = {
            AVRPart: "ATxmega32A4",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj724
        };
        var obj697 = {
            AVRPart: "ATxmega64B1",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj727
        };
        var obj696 = {
            AVRPart: "ATxmega64A3",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj727
        };
        var obj695 = {
            AVRPart: "ATxmega64A4",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj727
        };
        var obj694 = {
            AVRPart: "ATxmega64A1",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj727
        };
        var obj693 = {
            AVRPart: "ATxmega64B3",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj727
        };
        var obj692 = {
            AVRPart: "ATxmega128A4",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj729
        };
        var obj691 = {
            AVRPart: "ATxmega64A1U",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj727
        };
        var obj690 = {
            AVRPart: "ATxmega64A3U",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj727
        };
        var obj689 = {
            AVRPart: "ATxmega128B3",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj725
        };
        var obj688 = {
            AVRPart: "ATxmega192A3",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj726
        };
        var obj687 = {
            AVRPart: "ATxmega128A1",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj723
        };
        var obj686 = {
            AVRPart: "ATxmega256A3",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj730
        };
        var obj685 = {
            AVRPart: "ATxmega128A3",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj723
        };
        var obj684 = {
            AVRPart: "ATxmega256A1",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj730
        };
        var obj683 = {
            AVRPart: "ATxmega128B1",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj725
        };
        var obj682 = {
            AVRPart: "ATxmega192A1",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj726
        };
        var obj681 = {
            AVRPart: "ATxmega128A3U",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj723
        };
        var obj680 = {
            AVRPart: "ATxmega192A3U",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj726
        };
        var obj679 = {
            AVRPart: "ATxmega256A3B",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj730
        };
        var obj678 = {
            AVRPart: "ATxmega128A1U",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj723
        };
        var obj677 = {
            AVRPart: "ATxmega256A3U",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj730
        };
        var obj676 = {
            AVRPart: "ATxmega256A3BU",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj730
        };
        var obj675 = {
            AVRPart: "ATxmega128A1revD",
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj1455,
            memory: obj723
        };
        var obj674 = [obj1391, obj1384, obj1417, obj1397, obj1423, obj1421, obj1382, obj1440, obj1405, obj1399, obj1419, obj1396, obj1437, obj1413, obj1431, obj1404, obj1412, obj1383, obj1430, obj1408, obj1398, obj1427, obj1425, obj1390, obj1428, obj1387, obj1415, obj1386, obj1436, obj1435, obj1438, obj1400, ];
        var obj673 = [obj1402, obj1410, obj1424, obj1414, obj1441, obj1394, obj1442, obj1389, obj1393, obj1439, obj1420, obj1418, obj1426, obj1444, obj1385, obj1381, obj1434, obj1407, obj1411, obj1406, obj1422, obj1432, obj1388, obj1392, obj1429, obj1395, obj1401, obj1403, obj1416, obj1443, obj1433, obj1409, ];
        var obj672 = [obj1402, obj1410, obj1424, obj1414, obj1441, obj1394, obj1442, obj1389, obj1393, obj1439, obj1420, obj1418, obj1426, obj1444, obj1385, obj1381, obj1354, obj1374, obj1371, obj1349, obj1358, obj1347, obj1367, obj1363, obj1362, obj1360, obj1345, obj1378, obj1369, obj1357, obj1346, obj1355, ];
        var obj671 = [obj1391, obj1384, obj1417, obj1397, obj1423, obj1421, obj1382, obj1440, obj1405, obj1399, obj1419, obj1396, obj1437, obj1413, obj1431, obj1404, obj1372, obj1370, obj1351, obj1356, obj1380, obj1376, obj1368, obj1344, obj1375, obj1348, obj1359, obj1366, obj1353, obj1361, obj1379, obj1364, ];
        var obj670 = [obj1402, obj1410, obj1424, obj1414, obj1441, obj1394, obj1442, obj1389, obj1393, obj1439, obj1420, obj1350, obj1373, obj1352, obj1377, obj1365, obj1354, obj1374, obj1371, obj1349, obj1358, obj1347, obj1367, obj1363, obj1362, obj1360, obj1345, obj1378, obj1369, obj1357, obj1346, obj1355, ];
        var obj669 = [obj1323, obj1324, obj1313, obj1339, obj1312, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1328, obj1341, obj1333, obj1332, obj1322, obj1314, obj1320, obj1325, obj1334, obj1331, obj1342, obj1343, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj668 = [obj1323, obj1324, obj1313, obj1339, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1328, obj1341, obj1333, obj1332, obj1322, obj1314, obj1320, obj1325, obj1334, obj1331, obj1342, obj1343, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj667 = [obj1323, obj1324, obj1313, obj1339, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1337, obj1341, obj1333, obj1332, obj1322, obj1314, obj1320, obj1325, obj1334, obj1331, obj1342, obj1343, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj666 = [obj1323, obj1335, obj1318, obj1339, obj1312, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1328, obj1341, obj1333, obj1332, obj1322, obj1314, obj1320, obj1325, obj1334, obj1331, obj1342, obj1343, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj665 = [obj1323, obj1324, obj1313, obj1339, obj1312, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1337, obj1341, obj1333, obj1332, obj1322, obj1314, obj1320, obj1325, obj1334, obj1331, obj1342, obj1343, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj664 = [obj1323, obj1335, obj1318, obj1339, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1328, obj1341, obj1333, obj1332, obj1322, obj1314, obj1320, obj1325, obj1334, obj1331, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj663 = [obj1323, obj1335, obj1318, obj1339, obj1312, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1296, obj1283, obj1255, obj1233, obj1232, obj1322, obj1314, obj1320, obj1325, obj1334, obj1331, obj1342, obj1343, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj662 = [obj1323, obj1335, obj1318, obj1339, obj1312, obj1321, obj1336, obj1319, obj1340, obj1326, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1322, obj1314, obj1320, obj1325, obj1334, obj1331, obj1342, obj1343, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj661 = [obj1323, obj1324, obj1313, obj1339, obj1312, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1337, obj1341, obj1333, obj1332, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1267, obj1239, obj1250, obj1263, obj1329, obj1261, obj1236, obj1291, ];
        var obj660 = [obj1323, obj1324, obj1313, obj1339, obj1312, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1328, obj1341, obj1333, obj1332, obj1259, obj1300, obj1260, obj1262, obj1334, obj1294, obj1308, obj1265, obj1267, obj1239, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj659 = [obj1323, obj1335, obj1318, obj1339, obj1312, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1296, obj1283, obj1255, obj1233, obj1232, obj1322, obj1314, obj1320, obj1325, obj1334, obj1331, obj1342, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj658 = [obj1323, obj1324, obj1313, obj1339, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1337, obj1341, obj1333, obj1332, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1267, obj1239, obj1250, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj657 = [obj1323, obj1324, obj1313, obj1339, obj1312, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1328, obj1341, obj1333, obj1332, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1267, obj1239, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj656 = [obj1323, obj1324, obj1313, obj1339, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1337, obj1341, obj1333, obj1332, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1267, obj1239, obj1250, obj1263, obj1264, obj1311, obj1295, obj1291, ];
        var obj655 = [obj1323, obj1324, obj1313, obj1339, obj1312, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1337, obj1341, obj1333, obj1332, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1267, obj1239, obj1250, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj654 = [obj1323, obj1324, obj1313, obj1339, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1328, obj1341, obj1333, obj1332, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1231, obj1290, obj1250, obj1263, obj1227, obj1261, obj1236, obj1291, ];
        var obj653 = [obj1323, obj1324, obj1313, obj1339, obj1312, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1337, obj1341, obj1333, obj1332, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj652 = [obj1323, obj1324, obj1313, obj1339, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1337, obj1341, obj1333, obj1332, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1267, obj1239, obj1250, obj1263, obj1264, obj1261, obj1236, obj1291, ];
        var obj651 = [obj1323, obj1324, obj1313, obj1339, obj1312, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1328, obj1341, obj1333, obj1332, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1267, obj1239, obj1250, obj1263, obj1264, obj1311, obj1236, obj1291, ];
        var obj650 = [obj1323, obj1324, obj1313, obj1339, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1337, obj1341, obj1333, obj1332, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj649 = [obj1323, obj1335, obj1318, obj1339, obj1312, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1322, obj1314, obj1320, obj1325, obj1334, obj1331, obj1342, obj1343, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj648 = [obj1323, obj1324, obj1313, obj1339, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1328, obj1341, obj1333, obj1332, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj647 = [obj1323, obj1335, obj1318, obj1339, obj1312, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1296, obj1283, obj1255, obj1233, obj1232, obj1322, obj1314, obj1320, obj1325, obj1334, obj1331, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj646 = [obj1323, obj1335, obj1318, obj1339, obj1312, obj1321, obj1336, obj1319, obj1340, obj1326, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1322, obj1314, obj1320, obj1325, obj1334, obj1331, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj645 = [obj1323, obj1335, obj1318, obj1339, obj1312, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1322, obj1314, obj1320, obj1325, obj1334, obj1331, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj644 = [obj1323, obj1335, obj1318, obj1339, obj1327, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1322, obj1314, obj1320, obj1325, obj1334, obj1331, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj643 = [obj1323, obj1335, obj1318, obj1339, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1296, obj1283, obj1255, obj1233, obj1232, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj642 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1328, obj1341, obj1333, obj1332, obj1259, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj641 = [obj1323, obj1324, obj1313, obj1339, obj1327, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1267, obj1239, obj1277, obj1263, obj1227, obj1338, obj1236, obj1291, ];
        var obj640 = [obj1323, obj1324, obj1313, obj1339, obj1312, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1267, obj1239, obj1250, obj1263, obj1264, obj1311, obj1236, obj1291, ];
        var obj639 = [obj1323, obj1324, obj1313, obj1339, obj1312, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1267, obj1239, obj1250, obj1263, obj1264, obj1261, obj1236, obj1292, ];
        var obj638 = [obj1323, obj1324, obj1313, obj1339, obj1312, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1267, obj1239, obj1250, obj1263, obj1264, obj1311, obj1295, obj1291, ];
        var obj637 = [obj1323, obj1324, obj1313, obj1339, obj1327, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1267, obj1239, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj636 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1296, obj1283, obj1255, obj1233, obj1232, obj1322, obj1314, obj1190, obj1199, obj1208, obj1218, obj1203, obj1247, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1292, ];
        var obj635 = [obj1323, obj1335, obj1318, obj1339, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj634 = [obj1323, obj1324, obj1313, obj1339, obj1327, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj633 = [obj1323, obj1324, obj1313, obj1339, obj1327, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1231, obj1290, obj1277, obj1258, obj1264, obj1311, obj1236, obj1291, ];
        var obj632 = [obj1323, obj1324, obj1313, obj1339, obj1312, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1231, obj1290, obj1277, obj1263, obj1264, obj1311, obj1295, obj1291, ];
        var obj631 = [obj1323, obj1324, obj1313, obj1339, obj1327, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1267, obj1290, obj1250, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj630 = [obj1323, obj1324, obj1313, obj1339, obj1312, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1308, obj1265, obj1231, obj1290, obj1250, obj1263, obj1264, obj1311, obj1295, obj1292, ];
        var obj629 = {
            READ: obj666,
        };
        var obj628 = [obj1323, obj1335, obj1318, obj1339, obj1327, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1259, obj1300, obj1260, obj1262, obj1279, obj1294, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj627 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1296, obj1283, obj1255, obj1233, obj1232, obj1259, obj1300, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj626 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1296, obj1283, obj1255, obj1233, obj1232, obj1259, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj625 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1328, obj1341, obj1209, obj1189, obj1207, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj624 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1296, obj1283, obj1255, obj1233, obj1232, obj1207, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj623 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1328, obj1198, obj1209, obj1189, obj1207, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj622 = {
            READ: obj664,
        };
        var obj621 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1296, obj1283, obj1255, obj1233, obj1189, obj1207, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj620 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1259, obj1300, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj619 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1304, obj1296, obj1283, obj1255, obj1233, obj1189, obj1207, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj618 = {
            READ: obj663,
        };
        var obj617 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1296, obj1283, obj1255, obj1209, obj1189, obj1207, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj616 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1259, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj615 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1257, obj1293, obj1246, obj1271, obj1243, obj1281, obj1301, obj1226, obj1302, obj1252, obj1310, obj1228, obj1305, obj1249, obj1268, obj1242, obj1306, obj1307, obj1284, obj1238, obj1240, ];
        var obj614 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1257, obj1293, obj1282, obj1271, obj1243, obj1281, obj1301, obj1226, obj1302, obj1252, obj1310, obj1228, obj1305, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj613 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1296, obj1283, obj1198, obj1209, obj1189, obj1207, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj612 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1257, obj1235, obj1282, obj1271, obj1243, obj1281, obj1301, obj1226, obj1302, obj1252, obj1310, obj1228, obj1305, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj611 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1317, obj1204, obj1198, obj1209, obj1189, obj1207, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj610 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1255, obj1233, obj1232, obj1207, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj609 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1304, obj1296, obj1283, obj1255, obj1209, obj1189, obj1207, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj608 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1248, obj1273, obj1257, obj1293, obj1282, obj1271, obj1243, obj1281, obj1301, obj1226, obj1302, obj1252, obj1310, obj1228, obj1305, obj1249, obj1268, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj607 = {
            READ: obj662,
        };
        var obj606 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1304, obj1296, obj1283, obj1198, obj1209, obj1189, obj1207, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj605 = {
            READ: obj659,
        };
        var obj604 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1255, obj1233, obj1189, obj1207, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj603 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1315, obj1296, obj1204, obj1198, obj1209, obj1189, obj1207, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj602 = {
            READ: obj649,
        };
        var obj601 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1255, obj1209, obj1189, obj1207, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj600 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1340, obj1326, obj1304, obj1296, obj1204, obj1198, obj1209, obj1189, obj1207, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj599 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1283, obj1198, obj1209, obj1189, obj1207, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj598 = {
            READ: obj647,
        };
        var obj597 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1296, obj1204, obj1198, obj1209, obj1189, obj1207, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj596 = {
            READ: obj646,
        };
        var obj595 = [obj1330, obj1335, obj1318, obj1316, obj1327, obj1321, obj1336, obj1319, obj1274, obj1229, obj1304, obj1220, obj1204, obj1198, obj1209, obj1189, obj1207, obj1201, obj1194, obj1197, obj1222, obj1196, obj1210, obj1193, obj1231, obj1290, obj1277, obj1258, obj1227, obj1261, obj1236, obj1291, ];
        var obj594 = {
            READ: obj644,
        };
        var obj593 = {
            READ: obj645,
        };
        var obj592 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1257, obj1293, obj1246, obj1271, obj1243, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj591 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1257, obj1293, obj1282, obj1271, obj1243, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1256, obj1270, obj1242, obj1306, obj1225, obj1284, obj1238, obj1240, ];
        var obj590 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1257, obj1235, obj1282, obj1271, obj1243, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1249, obj1268, obj1242, obj1306, obj1307, obj1284, obj1238, obj1240, ];
        var obj589 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1257, obj1293, obj1282, obj1271, obj1243, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj588 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1257, obj1235, obj1282, obj1271, obj1243, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj587 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1257, obj1293, obj1246, obj1271, obj1243, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1249, obj1268, obj1242, obj1306, obj1307, obj1284, obj1238, obj1240, ];
        var obj586 = {
            READ: obj643,
        };
        var obj585 = {
            READ: obj635,
        };
        var obj584 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1257, obj1235, obj1282, obj1271, obj1243, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1216, obj1206, obj1188, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj583 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1257, obj1293, obj1246, obj1271, obj1243, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1216, obj1206, obj1188, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj582 = {
            READ: obj628,
        };
        var obj581 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1257, obj1293, obj1246, obj1271, obj1243, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1216, obj1206, obj1188, obj1213, obj1225, obj1284, obj1238, obj1240, ];
        var obj580 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1248, obj1273, obj1221, obj1183, obj1212, obj1187, obj1195, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1249, obj1268, obj1242, obj1306, obj1307, obj1280, obj1238, obj1240, ];
        var obj579 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1257, obj1293, obj1246, obj1271, obj1243, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1216, obj1206, obj1188, obj1213, obj1214, obj1284, obj1238, obj1240, ];
        var obj578 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1221, obj1183, obj1212, obj1187, obj1195, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1249, obj1270, obj1242, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj577 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1248, obj1273, obj1221, obj1183, obj1212, obj1187, obj1195, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1249, obj1268, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj576 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1221, obj1183, obj1212, obj1187, obj1195, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj575 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1221, obj1183, obj1212, obj1187, obj1195, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1256, obj1270, obj1303, obj1254, obj1307, obj1280, obj1238, obj1240, ];
        var obj574 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1257, obj1293, obj1246, obj1271, obj1243, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1216, obj1206, obj1188, obj1213, obj1214, obj1184, obj1238, obj1240, ];
        var obj573 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1257, obj1293, obj1246, obj1271, obj1243, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1216, obj1206, obj1188, obj1213, obj1214, obj1184, obj1186, obj1240, ];
        var obj572 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1298, obj1276, obj1253, obj1257, obj1293, obj1282, obj1271, obj1243, obj1217, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj571 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1241, obj1275, obj1285, obj1309, obj1237, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1216, obj1206, obj1188, obj1213, obj1214, obj1184, obj1186, obj1182, ];
        var obj570 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1248, obj1273, obj1299, obj1235, obj1285, obj1309, obj1289, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1216, obj1206, obj1188, obj1213, obj1214, obj1184, obj1186, obj1182, ];
        var obj569 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1299, obj1275, obj1246, obj1309, obj1237, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1216, obj1206, obj1188, obj1213, obj1214, obj1184, obj1186, obj1182, ];
        var obj568 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1248, obj1273, obj1299, obj1235, obj1246, obj1309, obj1237, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1216, obj1206, obj1188, obj1213, obj1214, obj1184, obj1186, obj1182, ];
        var obj567 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1276, obj1273, obj1299, obj1235, obj1246, obj1297, obj1237, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1216, obj1206, obj1188, obj1213, obj1214, obj1184, obj1186, obj1182, ];
        var obj566 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1298, obj1276, obj1253, obj1221, obj1183, obj1212, obj1187, obj1195, obj1281, obj1301, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj565 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1298, obj1276, obj1253, obj1221, obj1183, obj1212, obj1187, obj1195, obj1217, obj1215, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj564 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1248, obj1273, obj1221, obj1183, obj1285, obj1309, obj1195, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1216, obj1206, obj1188, obj1213, obj1214, obj1184, obj1186, obj1182, ];
        var obj563 = [obj1244, obj1287, obj1286, obj1230, obj1272, obj1251, obj1245, obj1288, obj1278, obj1248, obj1273, obj1221, obj1183, obj1212, obj1187, obj1195, obj1217, obj1215, obj1185, obj1202, obj1200, obj1192, obj1211, obj1205, obj1216, obj1206, obj1188, obj1213, obj1214, obj1184, obj1238, obj1240, ];
        var obj562 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1298, obj1276, obj1253, obj1257, obj1293, obj1282, obj1157, obj1174, obj1160, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj561 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1298, obj1276, obj1253, obj1221, obj1183, obj1212, obj1187, obj1195, obj1217, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj560 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1298, obj1276, obj1253, obj1221, obj1183, obj1212, obj1187, obj1195, obj1160, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj559 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1298, obj1276, obj1253, obj1257, obj1293, obj1169, obj1157, obj1174, obj1160, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj558 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1298, obj1276, obj1253, obj1221, obj1183, obj1212, obj1187, obj1174, obj1160, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj557 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1219, obj1191, obj1223, obj1221, obj1183, obj1212, obj1187, obj1195, obj1217, obj1215, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj556 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1219, obj1191, obj1223, obj1221, obj1183, obj1212, obj1187, obj1195, obj1217, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj555 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1298, obj1276, obj1223, obj1221, obj1183, obj1212, obj1187, obj1174, obj1160, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj554 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1298, obj1276, obj1253, obj1221, obj1183, obj1212, obj1157, obj1174, obj1160, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj553 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1298, obj1276, obj1253, obj1221, obj1183, obj1169, obj1157, obj1174, obj1160, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj552 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1298, obj1276, obj1253, obj1257, obj1154, obj1169, obj1157, obj1174, obj1160, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj551 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1219, obj1191, obj1223, obj1221, obj1183, obj1212, obj1187, obj1195, obj1160, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj550 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1298, obj1276, obj1223, obj1221, obj1183, obj1212, obj1157, obj1174, obj1160, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj549 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1219, obj1191, obj1223, obj1221, obj1183, obj1212, obj1187, obj1174, obj1160, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj548 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1298, obj1276, obj1253, obj1221, obj1154, obj1169, obj1157, obj1174, obj1160, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj547 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1298, obj1276, obj1223, obj1221, obj1183, obj1169, obj1157, obj1174, obj1160, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj546 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1298, obj1276, obj1223, obj1221, obj1154, obj1169, obj1157, obj1174, obj1160, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj545 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1219, obj1191, obj1223, obj1221, obj1183, obj1212, obj1157, obj1174, obj1160, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj544 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1219, obj1191, obj1223, obj1221, obj1183, obj1169, obj1157, obj1174, obj1160, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj543 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1219, obj1191, obj1223, obj1221, obj1154, obj1169, obj1157, obj1174, obj1160, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj542 = [obj1244, obj1266, obj1234, obj1230, obj1224, obj1269, obj1245, obj1288, obj1219, obj1191, obj1223, obj1139, obj1154, obj1169, obj1157, obj1174, obj1160, obj1152, obj1141, obj1146, obj1144, obj1178, obj1148, obj1158, obj1256, obj1270, obj1303, obj1254, obj1225, obj1284, obj1238, obj1240, ];
        var obj541 = {
            WRITE: obj577,
        };
        var obj540 = {
            WRITE: obj570,
        };
        var obj539 = {
            WRITE: obj564,
        };
        var obj538 = {
            paged: false,
            size: 1,
            readback: obj1451,
            memops: obj629
        };
        var obj537 = {
            paged: false,
            size: 3,
            readback: obj1451,
            memops: obj622
        };
        var obj536 = {
            paged: false,
            size: 1,
            readback: obj1451,
            memops: obj618
        };
        var obj535 = {
            paged: false,
            size: 1,
            readback: obj1451,
            memops: obj607
        };
        var obj534 = {
            paged: false,
            size: 2,
            readback: obj1451,
            memops: obj605
        };
        var obj533 = {
            paged: false,
            size: 1,
            readback: obj1451,
            memops: obj605
        };
        var obj532 = {
            paged: false,
            size: 1,
            readback: obj1451,
            memops: obj602
        };
        var obj531 = {
            paged: false,
            size: 4,
            readback: obj1451,
            memops: obj598
        };
        var obj530 = {
            paged: false,
            size: 4,
            readback: obj1451,
            memops: obj596
        };
        var obj529 = [obj1167, obj1166, obj1153, obj1165, obj1149, obj1171, obj1163, obj1151, obj1170, obj1162, obj1172, obj1156, obj1147, obj1161, obj1175, obj1073, obj980, obj1066, obj1064, obj1063, obj1030, obj1023, obj961, obj966, obj1081, obj1106, obj1104, obj1098, obj1112, obj1130, obj1090, obj1101, ];
        var obj528 = [obj1168, obj1150, obj1143, obj1164, obj1155, obj1142, obj1140, obj1181, obj1173, obj1176, obj1145, obj1159, obj1180, obj1179, obj1177, obj1003, obj1010, obj1019, obj964, obj982, obj979, obj993, obj996, obj1021, obj1110, obj1095, obj1077, obj1119, obj1123, obj1091, obj1129, obj1089, ];
        var obj527 = {
            paged: false,
            size: 3,
            readback: obj1451,
            memops: obj594
        };
        var obj526 = {
            paged: false,
            size: 4,
            readback: obj1451,
            memops: obj593
        };
        var obj525 = [obj1168, obj1150, obj1143, obj1164, obj1155, obj1142, obj1140, obj1181, obj1173, obj1176, obj1145, obj1159, obj1180, obj1179, obj1057, obj1003, obj1010, obj1019, obj964, obj982, obj979, obj993, obj996, obj1021, obj1110, obj1095, obj1077, obj1119, obj1123, obj1091, obj1129, obj1089, ];
        var obj524 = [obj1167, obj1166, obj1153, obj1165, obj1149, obj1171, obj1163, obj1151, obj1170, obj1162, obj1172, obj1156, obj1147, obj1161, obj992, obj1073, obj980, obj1066, obj1064, obj1063, obj1030, obj1023, obj961, obj966, obj1081, obj1106, obj1104, obj1098, obj1112, obj1130, obj1090, obj1101, ];
        var obj523 = {
            paged: false,
            size: 3,
            readback: obj1451,
            memops: obj586
        };
        var obj522 = [obj1168, obj1150, obj1143, obj1164, obj1155, obj1142, obj1140, obj1181, obj1173, obj1176, obj1145, obj1159, obj1180, obj1032, obj1057, obj1003, obj1010, obj1019, obj964, obj982, obj979, obj993, obj996, obj1021, obj1110, obj1095, obj1077, obj1119, obj1123, obj1091, obj1129, obj1089, ];
        var obj521 = [obj1167, obj1166, obj1153, obj1165, obj1149, obj1171, obj1163, obj1151, obj1170, obj1162, obj1172, obj1156, obj1147, obj1025, obj992, obj1073, obj980, obj1066, obj1064, obj1063, obj1030, obj1023, obj961, obj966, obj1081, obj1106, obj1104, obj1098, obj1112, obj1130, obj1090, obj1101, ];
        var obj520 = {
            paged: false,
            size: 3,
            readback: obj1451,
            memops: obj585
        };
        var obj519 = [obj1168, obj1150, obj1143, obj1164, obj1155, obj1142, obj1140, obj1181, obj1173, obj1176, obj1145, obj1159, obj976, obj1032, obj1057, obj1003, obj1010, obj1019, obj964, obj982, obj979, obj993, obj996, obj1021, obj1110, obj1095, obj1077, obj1119, obj1123, obj1091, obj1129, obj1089, ];
        var obj518 = [obj1167, obj1166, obj1153, obj1165, obj1149, obj1171, obj1163, obj1151, obj1170, obj1162, obj1172, obj1156, obj1042, obj1025, obj992, obj1073, obj980, obj1066, obj1064, obj1063, obj1030, obj1023, obj961, obj966, obj1081, obj1106, obj1104, obj1098, obj1112, obj1130, obj1090, obj1101, ];
        var obj517 = [obj1168, obj1150, obj1143, obj1164, obj1155, obj1142, obj1140, obj1181, obj1083, obj1080, obj1125, obj1121, obj1115, obj1113, obj1079, obj1003, obj1010, obj1019, obj964, obj982, obj979, obj993, obj996, obj1021, obj1110, obj1095, obj1077, obj1119, obj1123, obj1091, obj1129, obj1089, ];
        var obj516 = [obj1167, obj1166, obj1153, obj1165, obj1149, obj1171, obj1163, obj1151, obj1136, obj1137, obj1134, obj1094, obj1103, obj1107, obj1131, obj1073, obj980, obj1066, obj1064, obj1063, obj1030, obj1023, obj961, obj966, obj1081, obj1106, obj1104, obj1098, obj1112, obj1130, obj1090, obj1101, ];
        var obj515 = {
            paged: false,
            size: 3,
            readback: obj1451,
            memops: obj582
        };
        var obj514 = [obj1168, obj1150, obj1143, obj1164, obj1155, obj1142, obj1140, obj1181, obj1083, obj1080, obj1125, obj1121, obj1115, obj1113, obj1057, obj1003, obj1010, obj1019, obj964, obj982, obj979, obj993, obj996, obj1021, obj1110, obj1095, obj1077, obj1119, obj1123, obj1091, obj1129, obj1089, ];
        var obj513 = [obj1167, obj1166, obj1153, obj1165, obj1149, obj1171, obj1163, obj1151, obj1170, obj1162, obj1172, obj1001, obj1042, obj1025, obj992, obj1073, obj980, obj1066, obj1064, obj1063, obj1030, obj1023, obj961, obj966, obj1081, obj1106, obj1104, obj1098, obj1112, obj1130, obj1090, obj1101, ];
        var obj512 = [obj1167, obj1166, obj1153, obj1165, obj1149, obj1171, obj1163, obj1151, obj1136, obj1137, obj1134, obj1094, obj1103, obj1107, obj992, obj1073, obj980, obj1066, obj1064, obj1063, obj1030, obj1023, obj961, obj966, obj1081, obj1106, obj1104, obj1098, obj1112, obj1130, obj1090, obj1101, ];
        var obj511 = [obj1168, obj1150, obj1143, obj1164, obj1155, obj1142, obj1140, obj1181, obj1173, obj1176, obj1145, obj1058, obj976, obj1032, obj1057, obj1003, obj1010, obj1019, obj964, obj982, obj979, obj993, obj996, obj1021, obj1110, obj1095, obj1077, obj1119, obj1123, obj1091, obj1129, obj1089, ];
        var obj510 = [obj1168, obj1150, obj1143, obj1164, obj1155, obj1142, obj1140, obj1181, obj1083, obj1080, obj1125, obj1121, obj1115, obj1032, obj1057, obj1003, obj1010, obj1019, obj964, obj982, obj979, obj993, obj996, obj1021, obj1110, obj1095, obj1077, obj1119, obj1123, obj1091, obj1129, obj1089, ];
        var obj509 = [obj1167, obj1166, obj1153, obj1165, obj1149, obj1171, obj1163, obj1151, obj1136, obj1137, obj1134, obj1094, obj1103, obj1025, obj992, obj1073, obj980, obj1066, obj1064, obj1063, obj1030, obj1023, obj961, obj966, obj1081, obj1106, obj1104, obj1098, obj1112, obj1130, obj1090, obj1101, ];
        var obj508 = [obj1167, obj1166, obj1153, obj1165, obj1149, obj1171, obj1163, obj1151, obj1170, obj1162, obj1005, obj1001, obj1042, obj1025, obj992, obj1073, obj980, obj1066, obj1064, obj1063, obj1030, obj1023, obj961, obj966, obj1081, obj1106, obj1104, obj1098, obj1112, obj1130, obj1090, obj1101, ];
        var obj507 = [obj1168, obj1150, obj1143, obj1164, obj1155, obj1142, obj1140, obj1181, obj1173, obj1176, obj1070, obj1058, obj976, obj1032, obj1057, obj1003, obj1010, obj1019, obj964, obj982, obj979, obj993, obj996, obj1021, obj1110, obj1095, obj1077, obj1119, obj1123, obj1091, obj1129, obj1089, ];
        var obj506 = [obj1168, obj1150, obj1143, obj1164, obj1155, obj1142, obj1140, obj1181, obj1083, obj1080, obj1125, obj1121, obj976, obj1032, obj1057, obj1003, obj1010, obj1019, obj964, obj982, obj979, obj993, obj996, obj1021, obj1110, obj1095, obj1077, obj1119, obj1123, obj1091, obj1129, obj1089, ];
        var obj505 = [obj1167, obj1166, obj1153, obj1165, obj1149, obj1171, obj1163, obj1151, obj1136, obj1137, obj1134, obj1094, obj1042, obj1025, obj992, obj1073, obj980, obj1066, obj1064, obj1063, obj1030, obj1023, obj961, obj966, obj1081, obj1106, obj1104, obj1098, obj1112, obj1130, obj1090, obj1101, ];
        var obj504 = [obj1167, obj1166, obj1153, obj1165, obj1149, obj1171, obj1163, obj1151, obj1136, obj1137, obj1134, obj1001, obj1042, obj1025, obj992, obj1073, obj980, obj1066, obj1064, obj1063, obj1030, obj1023, obj961, obj966, obj1081, obj1106, obj1104, obj1098, obj1112, obj1130, obj1090, obj1101, ];
        var obj503 = [obj1168, obj1150, obj1143, obj1164, obj1155, obj1142, obj1140, obj1181, obj1083, obj1080, obj1125, obj1058, obj976, obj1032, obj1057, obj1003, obj1010, obj1019, obj964, obj982, obj979, obj993, obj996, obj1021, obj1110, obj1095, obj1077, obj1119, obj1123, obj1091, obj1129, obj1089, ];
        var obj502 = [obj1167, obj1166, obj1153, obj1165, obj1149, obj1171, obj1163, obj1151, obj1170, obj971, obj1005, obj1001, obj1042, obj1025, obj992, obj1073, obj980, obj1066, obj1064, obj1063, obj1030, obj1023, obj961, obj966, obj1081, obj1106, obj1104, obj1098, obj1112, obj1130, obj1090, obj1101, ];
        var obj501 = [obj1168, obj1150, obj1143, obj1164, obj1155, obj1142, obj1140, obj1181, obj1173, obj967, obj1070, obj1058, obj976, obj1032, obj1057, obj1003, obj1010, obj1019, obj964, obj982, obj979, obj993, obj996, obj1021, obj1110, obj1095, obj1077, obj1119, obj1123, obj1091, obj1129, obj1089, ];
        var obj500 = [obj1168, obj1150, obj1143, obj1164, obj1155, obj1142, obj1140, obj1181, obj1083, obj967, obj1070, obj1058, obj976, obj1032, obj1057, obj1003, obj1010, obj1019, obj964, obj982, obj979, obj993, obj996, obj1021, obj1110, obj1095, obj1077, obj1119, obj1123, obj1091, obj1129, obj1089, ];
        var obj499 = [obj1167, obj1166, obj1153, obj1165, obj1149, obj1171, obj1163, obj1151, obj1136, obj971, obj1005, obj1001, obj1042, obj1025, obj992, obj1073, obj980, obj1066, obj1064, obj1063, obj1030, obj1023, obj961, obj966, obj1081, obj1106, obj1104, obj1098, obj1112, obj1130, obj1090, obj1101, ];
        var obj498 = [obj1168, obj1150, obj1143, obj1164, obj1155, obj1142, obj1140, obj1181, obj1052, obj967, obj1070, obj1058, obj976, obj1032, obj1057, obj1003, obj1010, obj1019, obj964, obj982, obj979, obj993, obj996, obj1021, obj1110, obj1095, obj1077, obj1119, obj1123, obj1091, obj1129, obj1089, ];
        var obj497 = [obj1167, obj1166, obj1153, obj1165, obj1149, obj1171, obj1163, obj1151, obj1048, obj971, obj1005, obj1001, obj1042, obj1025, obj992, obj1073, obj980, obj1066, obj1064, obj1063, obj1030, obj1023, obj961, obj966, obj1081, obj1106, obj1104, obj1098, obj1112, obj1130, obj1090, obj1101, ];
        var obj496 = [obj1116, obj1133, obj1085, obj1117, obj1128, obj1124, obj1084, obj1100, obj1016, obj1036, obj974, obj985, obj1050, obj1031, obj989, obj916, obj915, obj960, obj959, obj928, obj943, obj929, obj927, obj935, obj1138, obj1086, obj1087, obj1099, obj1109, obj1092, obj1105, obj1088, ];
        var obj495 = [obj1082, obj1102, obj1135, obj1093, obj1108, obj1096, obj1126, obj1111, obj1056, obj997, obj1051, obj1038, obj963, obj1039, obj1009, obj952, obj921, obj947, obj948, obj945, obj931, obj941, obj923, obj926, obj1120, obj1122, obj1127, obj1114, obj1132, obj1097, obj1118, obj1078, ];
        var obj494 = [obj1082, obj1102, obj1135, obj1093, obj1108, obj1096, obj1126, obj1111, obj1056, obj997, obj1051, obj1038, obj963, obj1039, obj924, obj952, obj921, obj947, obj948, obj945, obj931, obj941, obj923, obj926, obj1120, obj1122, obj1127, obj1114, obj1132, obj1097, obj1118, obj1078, ];
        var obj493 = [obj1116, obj1133, obj1085, obj1117, obj1128, obj1124, obj1084, obj1100, obj1016, obj1036, obj974, obj985, obj1050, obj1031, obj937, obj916, obj915, obj960, obj959, obj928, obj943, obj929, obj927, obj935, obj1138, obj1086, obj1087, obj1099, obj1109, obj1092, obj1105, obj1088, ];
        var obj492 = [obj1082, obj1102, obj1135, obj1093, obj1108, obj1096, obj1126, obj1111, obj1056, obj997, obj1051, obj1038, obj963, obj949, obj924, obj952, obj921, obj947, obj948, obj945, obj931, obj941, obj923, obj926, obj1120, obj1122, obj1127, obj1114, obj1132, obj1097, obj1118, obj1078, ];
        var obj491 = [obj1116, obj1133, obj1085, obj1117, obj1128, obj1124, obj1084, obj1100, obj1016, obj1036, obj974, obj985, obj1050, obj940, obj937, obj916, obj915, obj960, obj959, obj928, obj943, obj929, obj927, obj935, obj1138, obj1086, obj1087, obj1099, obj1109, obj1092, obj1105, obj1088, ];
        var obj490 = [obj1082, obj1102, obj1135, obj1093, obj1108, obj1096, obj1126, obj1111, obj1056, obj997, obj1051, obj1038, obj917, obj949, obj924, obj952, obj921, obj947, obj948, obj945, obj931, obj941, obj923, obj926, obj1120, obj1122, obj1127, obj1114, obj1132, obj1097, obj1118, obj1078, ];
        var obj489 = [obj1116, obj1133, obj1085, obj1117, obj1128, obj1124, obj1084, obj1100, obj1016, obj1036, obj974, obj985, obj919, obj940, obj937, obj916, obj915, obj960, obj959, obj928, obj943, obj929, obj927, obj935, obj1138, obj1086, obj1087, obj1099, obj1109, obj1092, obj1105, obj1088, ];
        var obj488 = [obj1053, obj999, obj1011, obj1045, obj1012, obj1076, obj1069, obj988, obj1061, obj1020, obj938, obj933, obj934, obj954, obj922, obj930, obj1017, obj1049, obj861, obj895, obj867, obj844, obj970, obj973, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj487 = [obj1068, obj999, obj1011, obj1045, obj1065, obj1007, obj1028, obj988, obj1061, obj1020, obj977, obj1075, obj986, obj962, obj1034, obj893, obj847, obj853, obj861, obj895, obj958, obj920, obj957, obj946, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj486 = [obj1053, obj999, obj1011, obj1045, obj1012, obj1076, obj1069, obj988, obj1061, obj1020, obj977, obj1075, obj986, obj889, obj881, obj893, obj847, obj853, obj861, obj895, obj867, obj1015, obj970, obj973, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj485 = [obj1053, obj999, obj1011, obj1045, obj1012, obj1076, obj1069, obj988, obj1061, obj1020, obj938, obj933, obj934, obj954, obj922, obj930, obj950, obj944, obj861, obj895, obj867, obj844, obj970, obj973, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj484 = [obj1068, obj999, obj1011, obj1045, obj1065, obj1007, obj1028, obj988, obj1061, obj1020, obj977, obj1075, obj986, obj962, obj881, obj893, obj847, obj853, obj861, obj895, obj958, obj920, obj957, obj946, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj483 = [obj1053, obj999, obj1011, obj1045, obj1012, obj1076, obj1069, obj988, obj1061, obj1020, obj977, obj1075, obj986, obj962, obj881, obj893, obj847, obj853, obj861, obj895, obj867, obj844, obj970, obj973, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj482 = [obj1053, obj999, obj1011, obj1045, obj1012, obj1076, obj1069, obj988, obj1061, obj1020, obj938, obj933, obj934, obj954, obj922, obj930, obj950, obj853, obj861, obj895, obj867, obj844, obj970, obj973, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj481 = [obj1068, obj999, obj1011, obj1045, obj1065, obj1007, obj1028, obj988, obj1061, obj1020, obj977, obj1075, obj986, obj889, obj881, obj893, obj847, obj853, obj861, obj951, obj958, obj920, obj957, obj946, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj480 = [obj1053, obj999, obj1011, obj1045, obj1012, obj1076, obj1069, obj988, obj1061, obj1020, obj938, obj933, obj934, obj954, obj922, obj930, obj847, obj853, obj861, obj895, obj867, obj844, obj970, obj973, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj479 = [obj1053, obj999, obj1011, obj1045, obj1012, obj1076, obj1069, obj988, obj1061, obj1020, obj938, obj933, obj934, obj954, obj881, obj893, obj847, obj853, obj861, obj895, obj867, obj1015, obj970, obj973, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj478 = [obj1053, obj999, obj1011, obj1045, obj1012, obj1076, obj1069, obj988, obj1061, obj1020, obj938, obj933, obj934, obj889, obj881, obj893, obj847, obj853, obj861, obj895, obj867, obj1015, obj970, obj973, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj477 = [obj1053, obj999, obj1011, obj1045, obj1012, obj1076, obj1069, obj988, obj1061, obj1020, obj938, obj933, obj934, obj954, obj922, obj893, obj847, obj853, obj861, obj895, obj867, obj844, obj970, obj973, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj476 = [obj1068, obj999, obj1011, obj1045, obj1065, obj1007, obj1028, obj988, obj1061, obj1020, obj977, obj1075, obj906, obj889, obj881, obj893, obj847, obj853, obj861, obj951, obj958, obj920, obj957, obj946, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj475 = [obj1053, obj999, obj1011, obj1045, obj1012, obj1076, obj1069, obj988, obj1061, obj1020, obj977, obj1075, obj906, obj889, obj881, obj893, obj847, obj853, obj861, obj895, obj867, obj844, obj970, obj973, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj474 = [obj1053, obj999, obj1011, obj1045, obj1012, obj1076, obj1069, obj988, obj1061, obj1020, obj938, obj933, obj906, obj889, obj881, obj893, obj847, obj853, obj861, obj895, obj867, obj1015, obj970, obj973, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj473 = [obj1053, obj999, obj1011, obj1045, obj1012, obj1076, obj1069, obj988, obj1061, obj1020, obj938, obj933, obj934, obj954, obj881, obj893, obj847, obj853, obj861, obj895, obj867, obj844, obj970, obj973, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj472 = [obj1068, obj999, obj1011, obj1045, obj1065, obj1007, obj1028, obj988, obj1061, obj1020, obj977, obj849, obj906, obj889, obj881, obj893, obj847, obj853, obj914, obj951, obj958, obj920, obj957, obj946, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj471 = [obj1053, obj999, obj1011, obj1045, obj1012, obj1076, obj1069, obj988, obj1061, obj1020, obj938, obj849, obj906, obj889, obj881, obj893, obj847, obj853, obj861, obj895, obj867, obj1015, obj970, obj973, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj470 = [obj1053, obj999, obj1011, obj1045, obj1012, obj1076, obj1069, obj988, obj1061, obj1020, obj938, obj933, obj934, obj889, obj881, obj893, obj847, obj853, obj861, obj895, obj867, obj844, obj970, obj973, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj469 = [obj1068, obj999, obj1011, obj1045, obj1065, obj1007, obj1028, obj988, obj1061, obj1020, obj901, obj849, obj906, obj889, obj881, obj893, obj847, obj853, obj914, obj951, obj958, obj920, obj957, obj946, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj468 = [obj1068, obj999, obj1011, obj1045, obj1065, obj1007, obj1028, obj988, obj925, obj953, obj938, obj933, obj934, obj889, obj881, obj893, obj847, obj853, obj861, obj951, obj958, obj920, obj957, obj946, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj467 = [obj1068, obj999, obj1011, obj1045, obj1065, obj1007, obj1028, obj988, obj925, obj953, obj938, obj849, obj906, obj889, obj881, obj893, obj847, obj944, obj914, obj951, obj958, obj920, obj957, obj946, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj466 = [obj1068, obj999, obj1011, obj1045, obj1065, obj1007, obj1028, obj988, obj925, obj953, obj938, obj933, obj934, obj954, obj881, obj893, obj847, obj853, obj861, obj895, obj958, obj920, obj957, obj946, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj465 = [obj1068, obj999, obj1011, obj1045, obj1065, obj1007, obj1028, obj988, obj925, obj953, obj938, obj849, obj906, obj889, obj881, obj893, obj847, obj853, obj914, obj951, obj958, obj920, obj957, obj946, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj464 = [obj1068, obj999, obj1011, obj1045, obj1065, obj1007, obj1028, obj988, obj1061, obj878, obj901, obj849, obj906, obj889, obj881, obj893, obj847, obj944, obj914, obj951, obj958, obj920, obj957, obj946, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj463 = [obj1068, obj999, obj1011, obj1045, obj1065, obj1007, obj1028, obj988, obj925, obj953, obj938, obj933, obj906, obj889, obj881, obj893, obj847, obj853, obj861, obj951, obj958, obj920, obj957, obj946, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj462 = [obj1068, obj999, obj1011, obj1045, obj1065, obj1007, obj1028, obj988, obj905, obj878, obj901, obj849, obj906, obj889, obj881, obj893, obj847, obj853, obj861, obj895, obj867, obj844, obj912, obj880, obj1040, obj1072, obj1060, obj983, obj1059, obj1024, obj978, obj1006, ];
        var obj461 = [obj1068, obj999, obj1011, obj1045, obj1065, obj1007, obj1028, obj988, obj1061, obj878, obj901, obj849, obj906, obj889, obj881, obj893, obj847, obj853, obj914, obj951, obj958, obj920, obj957, obj946, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj460 = [obj1068, obj999, obj1011, obj1045, obj1065, obj1007, obj1028, obj988, obj925, obj878, obj901, obj849, obj906, obj889, obj881, obj893, obj847, obj944, obj914, obj951, obj958, obj920, obj957, obj946, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj459 = [obj1068, obj999, obj1011, obj1045, obj1065, obj1007, obj1028, obj988, obj905, obj878, obj901, obj849, obj906, obj889, obj881, obj893, obj847, obj944, obj914, obj951, obj958, obj920, obj957, obj946, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj458 = [obj1068, obj999, obj1011, obj1045, obj1065, obj1007, obj1028, obj988, obj905, obj878, obj901, obj849, obj906, obj889, obj881, obj893, obj847, obj853, obj914, obj951, obj958, obj920, obj957, obj946, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj457 = [obj1068, obj999, obj1011, obj1045, obj1065, obj1007, obj1028, obj988, obj1061, obj878, obj901, obj849, obj906, obj889, obj881, obj893, obj847, obj853, obj861, obj895, obj867, obj844, obj912, obj880, obj913, obj942, obj955, obj939, obj932, obj956, obj936, obj918, ];
        var obj456 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj541
        };
        var obj455 = {
            paged: false,
            size: 1,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj541
        };
        var obj454 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 20000,
            readback: obj1451,
            memops: obj540
        };
        var obj453 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj540
        };
        var obj452 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj539
        };
        var obj451 = [obj868, obj859, obj894, obj890, obj900, obj858, obj882, obj892, obj872, obj902, obj903, obj884, obj841, obj909, obj864, obj879, obj910, obj904, obj887, obj855, obj863, obj854, obj815, obj804, obj888, obj862, obj899, obj843, obj874, obj908, obj907, obj850, ];
        var obj450 = [obj868, obj859, obj894, obj890, obj900, obj858, obj882, obj892, obj872, obj902, obj903, obj884, obj841, obj909, obj864, obj879, obj910, obj904, obj887, obj855, obj863, obj798, obj815, obj804, obj888, obj862, obj899, obj843, obj874, obj908, obj907, obj850, ];
        var obj449 = [obj875, obj870, obj877, obj860, obj873, obj857, obj842, obj845, obj871, obj869, obj883, obj851, obj898, obj846, obj865, obj886, obj772, obj782, obj814, obj784, obj811, obj806, obj794, obj790, obj852, obj876, obj896, obj866, obj856, obj911, obj848, obj885, ];
        var obj448 = [obj897, obj859, obj894, obj890, obj900, obj858, obj882, obj891, obj872, obj902, obj903, obj884, obj841, obj909, obj864, obj879, obj797, obj785, obj775, obj793, obj795, obj798, obj815, obj804, obj888, obj862, obj899, obj843, obj874, obj908, obj907, obj850, ];
        var obj447 = [obj897, obj859, obj894, obj890, obj900, obj858, obj882, obj891, obj872, obj902, obj903, obj884, obj817, obj819, obj837, obj831, obj818, obj824, obj839, obj793, obj795, obj798, obj815, obj804, obj888, obj862, obj899, obj843, obj874, obj908, obj907, obj850, ];
        var obj446 = [obj875, obj870, obj877, obj860, obj873, obj857, obj842, obj845, obj871, obj869, obj883, obj851, obj833, obj829, obj822, obj826, obj838, obj827, obj834, obj784, obj811, obj806, obj794, obj790, obj852, obj876, obj896, obj866, obj856, obj911, obj848, obj885, ];
        var obj445 = [obj897, obj859, obj894, obj890, obj900, obj858, obj882, obj891, obj872, obj902, obj903, obj825, obj817, obj819, obj837, obj831, obj818, obj824, obj839, obj840, obj795, obj798, obj815, obj804, obj888, obj862, obj899, obj843, obj874, obj908, obj907, obj850, ];
        var obj444 = [obj875, obj870, obj877, obj860, obj873, obj857, obj842, obj845, obj871, obj869, obj883, obj828, obj833, obj829, obj822, obj826, obj838, obj827, obj834, obj820, obj811, obj806, obj794, obj790, obj852, obj876, obj896, obj866, obj856, obj911, obj848, obj885, ];
        var obj443 = [obj897, obj859, obj894, obj890, obj900, obj858, obj882, obj891, obj872, obj902, obj903, obj825, obj817, obj819, obj837, obj831, obj818, obj824, obj839, obj793, obj795, obj798, obj815, obj804, obj888, obj862, obj899, obj843, obj874, obj908, obj907, obj850, ];
        var obj442 = [obj875, obj870, obj877, obj860, obj873, obj857, obj842, obj845, obj871, obj869, obj883, obj828, obj833, obj829, obj822, obj826, obj838, obj827, obj834, obj784, obj811, obj806, obj794, obj790, obj852, obj876, obj896, obj866, obj856, obj911, obj848, obj885, ];
        var obj441 = [obj875, obj870, obj877, obj860, obj873, obj857, obj842, obj845, obj871, obj869, obj883, obj828, obj833, obj829, obj822, obj826, obj838, obj827, obj814, obj784, obj811, obj806, obj794, obj790, obj852, obj876, obj896, obj866, obj856, obj911, obj848, obj885, ];
        var obj440 = [obj897, obj859, obj894, obj890, obj900, obj858, obj882, obj891, obj872, obj902, obj903, obj825, obj817, obj819, obj837, obj831, obj818, obj824, obj775, obj793, obj795, obj798, obj815, obj804, obj888, obj862, obj899, obj843, obj874, obj908, obj907, obj850, ];
        var obj439 = [obj897, obj859, obj894, obj890, obj900, obj858, obj882, obj891, obj832, obj830, obj823, obj825, obj817, obj819, obj837, obj831, obj818, obj824, obj839, obj840, obj795, obj798, obj815, obj804, obj888, obj862, obj899, obj843, obj874, obj908, obj907, obj850, ];
        var obj438 = [obj897, obj859, obj894, obj890, obj900, obj858, obj882, obj891, obj872, obj902, obj903, obj825, obj817, obj819, obj837, obj831, obj818, obj785, obj775, obj793, obj795, obj798, obj815, obj804, obj888, obj862, obj899, obj843, obj874, obj908, obj907, obj850, ];
        var obj437 = [obj897, obj859, obj894, obj890, obj900, obj858, obj882, obj891, obj872, obj902, obj823, obj825, obj817, obj819, obj837, obj831, obj818, obj824, obj775, obj793, obj795, obj798, obj815, obj804, obj888, obj862, obj899, obj843, obj874, obj908, obj907, obj850, ];
        var obj436 = [obj875, obj870, obj877, obj860, obj873, obj857, obj842, obj845, obj871, obj869, obj883, obj828, obj833, obj829, obj822, obj826, obj838, obj782, obj814, obj784, obj811, obj806, obj794, obj790, obj852, obj876, obj896, obj866, obj856, obj911, obj848, obj885, ];
        var obj435 = [obj875, obj870, obj877, obj860, obj873, obj857, obj842, obj845, obj836, obj821, obj835, obj828, obj833, obj829, obj822, obj826, obj838, obj827, obj834, obj820, obj811, obj806, obj794, obj790, obj852, obj876, obj896, obj866, obj856, obj911, obj848, obj885, ];
        var obj434 = [obj875, obj870, obj877, obj860, obj873, obj857, obj842, obj845, obj871, obj869, obj835, obj828, obj833, obj829, obj822, obj826, obj838, obj827, obj814, obj784, obj811, obj806, obj794, obj790, obj852, obj876, obj896, obj866, obj856, obj911, obj848, obj885, ];
        var obj433 = [obj897, obj859, obj894, obj890, obj900, obj858, obj882, obj891, obj832, obj830, obj823, obj825, obj817, obj819, obj837, obj831, obj818, obj824, obj839, obj793, obj795, obj798, obj815, obj804, obj888, obj862, obj899, obj843, obj874, obj908, obj907, obj850, ];
        var obj432 = [obj875, obj870, obj877, obj860, obj873, obj857, obj842, obj845, obj836, obj821, obj835, obj828, obj833, obj829, obj822, obj826, obj838, obj827, obj834, obj784, obj811, obj806, obj794, obj790, obj852, obj876, obj896, obj866, obj856, obj911, obj848, obj885, ];
        var obj431 = [obj897, obj859, obj894, obj890, obj900, obj858, obj882, obj891, obj872, obj902, obj823, obj825, obj817, obj819, obj837, obj831, obj818, obj785, obj775, obj793, obj795, obj798, obj815, obj804, obj888, obj862, obj899, obj843, obj874, obj908, obj907, obj850, ];
        var obj430 = [obj875, obj870, obj877, obj860, obj873, obj857, obj842, obj845, obj871, obj869, obj835, obj828, obj833, obj829, obj822, obj826, obj838, obj782, obj814, obj784, obj811, obj806, obj794, obj790, obj852, obj876, obj896, obj866, obj856, obj911, obj848, obj885, ];
        var obj429 = [obj897, obj859, obj894, obj890, obj900, obj858, obj882, obj891, obj832, obj830, obj823, obj825, obj817, obj819, obj837, obj831, obj818, obj824, obj775, obj793, obj795, obj798, obj815, obj804, obj888, obj862, obj899, obj843, obj874, obj908, obj907, obj850, ];
        var obj428 = [obj875, obj870, obj877, obj860, obj873, obj857, obj842, obj845, obj836, obj821, obj835, obj828, obj833, obj829, obj822, obj826, obj838, obj827, obj814, obj784, obj811, obj806, obj794, obj790, obj852, obj876, obj896, obj866, obj856, obj911, obj848, obj885, ];
        var obj427 = [obj875, obj870, obj877, obj860, obj873, obj857, obj842, obj845, obj836, obj821, obj835, obj828, obj833, obj829, obj822, obj826, obj838, obj782, obj814, obj784, obj811, obj806, obj794, obj790, obj852, obj876, obj896, obj866, obj856, obj911, obj848, obj885, ];
        var obj426 = [obj897, obj859, obj894, obj890, obj900, obj858, obj882, obj891, obj832, obj830, obj823, obj825, obj817, obj819, obj837, obj831, obj818, obj785, obj775, obj793, obj795, obj798, obj815, obj804, obj888, obj862, obj899, obj843, obj874, obj908, obj907, obj850, ];
        var obj425 = [obj809, obj773, obj799, obj781, obj800, obj807, obj778, obj810, obj783, obj770, obj776, obj787, obj789, obj816, obj805, obj796, obj792, obj788, obj813, obj802, obj808, obj791, obj801, obj769, obj774, obj777, obj812, obj779, obj786, obj780, obj771, obj803, ];
        var obj424 = {
            CHIP_ERASE: obj673,
            PGM_ENABLE: obj674,
        };
        var obj423 = {
            CHIP_ERASE: obj672,
            PGM_ENABLE: obj671,
        };
        var obj422 = {
            CHIP_ERASE: obj670,
            PGM_ENABLE: obj671,
        };
        var obj421 = {
            READ: obj665,
            WRITE: obj612,
        };
        var obj420 = {
            READ: obj667,
            WRITE: obj615,
        };
        var obj419 = {
            READ: obj668,
            WRITE: obj614,
        };
        var obj418 = {
            READ: obj657,
            WRITE: obj608,
        };
        var obj417 = {
            READ: obj661,
            WRITE: obj590,
        };
        var obj416 = {
            READ: obj653,
            WRITE: obj588,
        };
        var obj415 = {
            READ: obj650,
            WRITE: obj587,
        };
        var obj414 = {
            READ: obj654,
            WRITE: obj591,
        };
        var obj413 = {
            READ: obj648,
            WRITE: obj589,
        };
        var obj412 = {
            READ: obj650,
            WRITE: obj592,
        };
        var obj411 = {
            READ: obj658,
            WRITE: obj583,
        };
        var obj410 = {
            READ: obj655,
            WRITE: obj584,
        };
        var obj409 = {
            READ: obj669,
            WRITE: obj563,
        };
        var obj408 = {
            READ: obj650,
            WRITE: obj581,
        };
        var obj407 = {
            READ: obj660,
            WRITE: obj577,
        };
        var obj406 = {
            READ: obj650,
            WRITE: obj579,
        };
        var obj405 = {
            READ: obj652,
            WRITE: obj579,
        };
        var obj404 = {
            READ: obj651,
            WRITE: obj580,
        };
        var obj403 = {
            READ: obj657,
            WRITE: obj577,
        };
        var obj402 = {
            READ: obj650,
            WRITE: obj574,
        };
        var obj401 = {
            READ: obj656,
            WRITE: obj573,
        };
        var obj400 = {
            READ: obj650,
            WRITE: obj573,
        };
        var obj399 = {
            READ: obj652,
            WRITE: obj573,
        };
        var obj398 = {
            READ: obj631,
            WRITE: obj578,
        };
        var obj397 = {
            READ: obj633,
            WRITE: obj575,
        };
        var obj396 = {
            READ: obj634,
            WRITE: obj576,
        };
        var obj395 = {
            READ: obj642,
            WRITE: obj572,
        };
        var obj394 = {
            READ: obj641,
            WRITE: obj569,
        };
        var obj393 = {
            READ: obj630,
            WRITE: obj570,
        };
        var obj392 = {
            READ: obj640,
            WRITE: obj568,
        };
        var obj391 = {
            READ: obj632,
            WRITE: obj570,
        };
        var obj390 = {
            READ: obj632,
            WRITE: obj567,
        };
        var obj389 = {
            READ: obj639,
            WRITE: obj570,
        };
        var obj388 = {
            READ: obj638,
            WRITE: obj567,
        };
        var obj387 = {
            READ: obj637,
            WRITE: obj571,
        };
        var obj386 = {
            READ: obj620,
            WRITE: obj557,
        };
        var obj385 = {
            READ: obj619,
            WRITE: obj555,
        };
        var obj384 = {
            READ: obj616,
            WRITE: obj556,
        };
        var obj383 = {
            READ: obj610,
            WRITE: obj551,
        };
        var obj382 = {
            READ: obj604,
            WRITE: obj549,
        };
        var obj381 = {
            READ: obj597,
            WRITE: obj543,
        };
        var obj380 = {
            paged: false,
            size: 1,
            readback: obj1451,
            memops: obj408
        };
        var obj379 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj419
        };
        var obj378 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj420
        };
        var obj377 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj421
        };
        var obj376 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj418
        };
        var obj375 = {
            paged: false,
            size: 1,
            min_write_delay: 2000,
            max_write_delay: 2000,
            readback: obj1451,
            memops: obj417
        };
        var obj374 = {
            paged: false,
            size: 1,
            min_write_delay: 16000,
            max_write_delay: 16000,
            readback: obj1451,
            memops: obj416
        };
        var obj373 = {
            paged: false,
            size: 1,
            min_write_delay: 2000,
            max_write_delay: 2000,
            readback: obj1451,
            memops: obj414
        };
        var obj372 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj416
        };
        var obj371 = {
            paged: false,
            size: 1,
            min_write_delay: 16000,
            max_write_delay: 16000,
            readback: obj1451,
            memops: obj415
        };
        var obj370 = {
            paged: false,
            size: 1,
            min_write_delay: 2000,
            max_write_delay: 2000,
            readback: obj1451,
            memops: obj413
        };
        var obj369 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj412
        };
        var obj368 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj415
        };
        var obj367 = {
            paged: false,
            size: 1,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj416
        };
        var obj366 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj413
        };
        var obj365 = {
            paged: false,
            size: 1,
            min_write_delay: 2000,
            max_write_delay: 2000,
            readback: obj1451,
            memops: obj416
        };
        var obj364 = {
            paged: false,
            size: 1,
            min_write_delay: 16000,
            max_write_delay: 16000,
            readback: obj1451,
            memops: obj413
        };
        var obj363 = {
            paged: false,
            size: 1,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj413
        };
        var obj362 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj409
        };
        var obj361 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj410
        };
        var obj360 = {
            paged: false,
            size: 1,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj411
        };
        var obj359 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj408
        };
        var obj358 = {
            paged: false,
            size: 1,
            min_write_delay: 2000,
            max_write_delay: 2000,
            readback: obj1451,
            memops: obj407
        };
        var obj357 = {
            paged: false,
            size: 1,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj404
        };
        var obj356 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj406
        };
        var obj355 = {
            paged: false,
            size: 1,
            min_write_delay: 2000,
            max_write_delay: 2000,
            readback: obj1451,
            memops: obj403
        };
        var obj354 = {
            paged: false,
            size: 1,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj406
        };
        var obj353 = {
            paged: false,
            size: 1,
            min_write_delay: 16000,
            max_write_delay: 16000,
            readback: obj1451,
            memops: obj403
        };
        var obj352 = {
            paged: false,
            size: 1,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj405
        };
        var obj351 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj403
        };
        var obj350 = {
            paged: false,
            size: 1,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj403
        };
        var obj349 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj402
        };
        var obj348 = {
            paged: false,
            size: 1,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj400
        };
        var obj347 = {
            paged: false,
            size: 1,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj401
        };
        var obj346 = {
            paged: false,
            size: 1,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj399
        };
        var obj345 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj400
        };
        var obj344 = {
            paged: false,
            size: 1,
            min_write_delay: 2000,
            max_write_delay: 2000,
            readback: obj1451,
            memops: obj398
        };
        var obj343 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj397
        };
        var obj342 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj396
        };
        var obj341 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj394
        };
        var obj340 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 20000,
            readback: obj1451,
            memops: obj387
        };
        var obj339 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 20000,
            readback: obj1451,
            memops: obj389
        };
        var obj338 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 20000,
            readback: obj1451,
            memops: obj391
        };
        var obj337 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj389
        };
        var obj336 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj388
        };
        var obj335 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj393
        };
        var obj334 = {
            paged: false,
            size: 1,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj392
        };
        var obj333 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj392
        };
        var obj332 = {
            paged: false,
            size: 1,
            min_write_delay: 9000,
            max_write_delay: 20000,
            readback: obj1451,
            memops: obj390
        };
        var obj331 = {
            paged: false,
            size: 256,
            min_write_delay: 9000,
            max_write_delay: 20000,
            readback: obj1449,
            memops: obj383
        };
        var obj330 = {
            mode: 4,
            delay: 12,
            blocksize: 64,
            paged: false,
            size: 128,
            min_write_delay: 9000,
            max_write_delay: 20000,
            readback: obj1449,
            memops: obj395
        };
        var obj329 = {
            mode: 4,
            delay: 20,
            blocksize: 32,
            paged: false,
            size: 64,
            min_write_delay: 4000,
            max_write_delay: 9000,
            readback: obj1449,
            memops: obj386
        };
        var obj328 = {
            mode: 4,
            delay: 8,
            blocksize: 64,
            paged: false,
            size: 64,
            min_write_delay: 9000,
            max_write_delay: 20000,
            readback: obj1453,
            memops: obj386
        };
        var obj327 = {
            mode: 4,
            delay: 10,
            blocksize: 64,
            paged: false,
            size: 64,
            min_write_delay: 8200,
            max_write_delay: 8200,
            readback: obj1453,
            memops: obj386
        };
        var obj326 = {
            mode: 4,
            delay: 10,
            blocksize: 64,
            paged: false,
            size: 128,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj384
        };
        var obj325 = {
            mode: 4,
            delay: 12,
            blocksize: 64,
            paged: false,
            size: 128,
            min_write_delay: 4000,
            max_write_delay: 9000,
            readback: obj1450,
            memops: obj384
        };
        var obj324 = {
            mode: 4,
            delay: 12,
            blocksize: 128,
            paged: false,
            size: 128,
            min_write_delay: 9000,
            max_write_delay: 20000,
            readback: obj1449,
            memops: obj384
        };
        var obj323 = {
            mode: 4,
            delay: 20,
            blocksize: 128,
            paged: false,
            size: 512,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj385
        };
        var obj322 = {
            mode: 4,
            delay: 12,
            blocksize: 128,
            paged: false,
            size: 256,
            min_write_delay: 9000,
            max_write_delay: 20000,
            readback: obj1449,
            memops: obj383
        };
        var obj321 = {
            mode: 4,
            delay: 12,
            blocksize: 64,
            paged: false,
            size: 256,
            min_write_delay: 9000,
            max_write_delay: 20000,
            readback: obj1450,
            memops: obj382
        };
        var obj320 = {
            mode: 65,
            delay: 20,
            blocksize: 4,
            paged: false,
            size: 512,
            min_write_delay: 4000,
            max_write_delay: 4000,
            readback: obj1453,
            memops: obj382
        };
        var obj319 = {
            mode: 4,
            delay: 5,
            blocksize: 128,
            paged: false,
            size: 512,
            min_write_delay: 3400,
            max_write_delay: 3400,
            readback: obj1453,
            memops: obj382
        };
        var obj318 = {
            mode: 4,
            delay: 12,
            blocksize: 128,
            paged: false,
            size: 512,
            min_write_delay: 4000,
            max_write_delay: 9000,
            readback: obj1450,
            memops: obj382
        };
        var obj317 = {
            mode: 4,
            delay: 12,
            blocksize: 128,
            paged: false,
            size: 512,
            min_write_delay: 9000,
            max_write_delay: 20000,
            readback: obj1449,
            memops: obj382
        };
        var obj316 = {
            mode: 4,
            delay: 12,
            blocksize: 64,
            paged: false,
            size: 4096,
            min_write_delay: 4000,
            max_write_delay: 9000,
            readback: obj1450,
            memops: obj381
        };
        var obj315 = {
            mode: 4,
            delay: 20,
            blocksize: 128,
            paged: false,
            size: 512,
            page_size: 4,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj385
        };
        var obj314 = {
            mode: 4,
            delay: 12,
            blocksize: 64,
            paged: false,
            size: 4096,
            page_size: 8,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj381
        };
        var obj313 = {
            mode: 4,
            delay: 20,
            blocksize: 64,
            paged: false,
            size: 2048,
            page_size: 8,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj381
        };
        var obj312 = {
            READ: obj636,
            WRITE: obj566,
            LOADPAGE_LO: obj451,
            WRITEPAGE: obj488,
        };
        var obj311 = {
            READ: obj627,
            WRITE: obj565,
            LOADPAGE_LO: obj451,
            WRITEPAGE: obj485,
        };
        var obj310 = {
            READ: obj625,
            WRITE: obj562,
            LOADPAGE_LO: obj451,
            WRITEPAGE: obj483,
        };
        var obj309 = {
            READ: obj626,
            WRITE: obj561,
            LOADPAGE_LO: obj451,
            WRITEPAGE: obj482,
        };
        var obj308 = {
            READ: obj624,
            WRITE: obj560,
            LOADPAGE_LO: obj451,
            WRITEPAGE: obj482,
        };
        var obj307 = {
            READ: obj624,
            WRITE: obj560,
            LOADPAGE_LO: obj451,
            WRITEPAGE: obj480,
        };
        var obj306 = {
            READ: obj621,
            WRITE: obj558,
            LOADPAGE_LO: obj451,
            WRITEPAGE: obj482,
        };
        var obj305 = {
            READ: obj621,
            WRITE: obj558,
            LOADPAGE_LO: obj451,
            WRITEPAGE: obj480,
        };
        var obj304 = {
            READ: obj623,
            WRITE: obj559,
            LOADPAGE_LO: obj450,
            WRITEPAGE: obj486,
        };
        var obj303 = {
            READ: obj621,
            WRITE: obj558,
            LOADPAGE_LO: obj451,
            WRITEPAGE: obj477,
        };
        var obj302 = {
            READ: obj616,
            WRITE: obj556,
            LOADPAGE_LO: obj451,
            WRITEPAGE: obj482,
        };
        var obj301 = {
            READ: obj610,
            WRITE: obj551,
            LOADPAGE_LO: obj451,
            WRITEPAGE: obj480,
        };
        var obj300 = {
            READ: obj617,
            WRITE: obj554,
            LOADPAGE_LO: obj450,
            WRITEPAGE: obj479,
        };
        var obj299 = {
            READ: obj617,
            WRITE: obj554,
            LOADPAGE_LO: obj451,
            WRITEPAGE: obj473,
        };
        var obj298 = {
            READ: obj609,
            WRITE: obj550,
            LOADPAGE_LO: obj451,
            WRITEPAGE: obj473,
        };
        var obj297 = {
            READ: obj611,
            WRITE: obj552,
            LOADPAGE_LO: obj451,
            WRITEPAGE: obj475,
        };
        var obj296 = {
            READ: obj604,
            WRITE: obj549,
            LOADPAGE_LO: obj451,
            WRITEPAGE: obj477,
        };
        var obj295 = {
            READ: obj613,
            WRITE: obj553,
            LOADPAGE_LO: obj450,
            WRITEPAGE: obj478,
        };
        var obj294 = {
            READ: obj606,
            WRITE: obj547,
            LOADPAGE_LO: obj451,
            WRITEPAGE: obj470,
        };
        var obj293 = {
            READ: obj603,
            WRITE: obj548,
            LOADPAGE_LO: obj450,
            WRITEPAGE: obj474,
        };
        var obj292 = {
            READ: obj601,
            WRITE: obj545,
            LOADPAGE_LO: obj451,
            WRITEPAGE: obj473,
        };
        var obj291 = {
            READ: obj600,
            WRITE: obj546,
            LOADPAGE_LO: obj450,
            WRITEPAGE: obj474,
        };
        var obj290 = {
            READ: obj599,
            WRITE: obj544,
            LOADPAGE_LO: obj450,
            WRITEPAGE: obj478,
        };
        var obj289 = {
            READ: obj597,
            WRITE: obj543,
            LOADPAGE_LO: obj450,
            WRITEPAGE: obj478,
        };
        var obj288 = {
            READ: obj597,
            WRITE: obj543,
            LOADPAGE_LO: obj450,
            WRITEPAGE: obj474,
        };
        var obj287 = {
            READ: obj595,
            WRITE: obj542,
            LOADPAGE_LO: obj450,
            WRITEPAGE: obj471,
        };
        var obj286 = {
            READ_LO: obj517,
            READ_HI: obj516,
            WRITE_LO: obj495,
            WRITE_HI: obj496,
        };
        var obj285 = {
            READ_LO: obj514,
            READ_HI: obj512,
            WRITE_LO: obj494,
            WRITE_HI: obj493,
        };
        var obj284 = {
            READ_LO: obj510,
            READ_HI: obj509,
            WRITE_LO: obj492,
            WRITE_HI: obj491,
        };
        var obj283 = {
            READ_LO: obj506,
            READ_HI: obj505,
            WRITE_LO: obj490,
            WRITE_HI: obj489,
        };
        var obj282 = {
            mode: 65,
            delay: 5,
            blocksize: 4,
            paged: false,
            size: 64,
            page_size: 4,
            min_write_delay: 4000,
            max_write_delay: 4000,
            readback: obj1453,
            memops: obj311
        };
        var obj281 = {
            mode: 65,
            delay: 10,
            blocksize: 4,
            paged: false,
            size: 1024,
            page_size: 4,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj310
        };
        var obj280 = {
            mode: 65,
            delay: 20,
            blocksize: 4,
            paged: false,
            size: 64,
            page_size: 4,
            min_write_delay: 3600,
            max_write_delay: 3600,
            readback: obj1453,
            memops: obj309
        };
        var obj279 = {
            mode: 65,
            delay: 6,
            blocksize: 4,
            paged: false,
            size: 128,
            page_size: 4,
            min_write_delay: 4000,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj309
        };
        var obj278 = {
            mode: 65,
            delay: 6,
            blocksize: 4,
            paged: false,
            size: 256,
            page_size: 4,
            min_write_delay: 4000,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj308
        };
        var obj277 = {
            mode: 65,
            delay: 6,
            blocksize: 4,
            paged: false,
            size: 256,
            page_size: 4,
            min_write_delay: 4000,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj307
        };
        var obj276 = {
            mode: 65,
            delay: 20,
            blocksize: 4,
            paged: false,
            size: 256,
            page_size: 4,
            min_write_delay: 3600,
            max_write_delay: 3600,
            readback: obj1453,
            memops: obj307
        };
        var obj275 = {
            paged: false,
            size: 4096,
            min_write_delay: 9000,
            max_write_delay: 20000,
            readback: obj1453,
            memops: obj284
        };
        var obj274 = {
            mode: 65,
            delay: 6,
            blocksize: 4,
            paged: false,
            size: 512,
            page_size: 4,
            min_write_delay: 4000,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj306
        };
        var obj273 = {
            mode: 65,
            delay: 6,
            blocksize: 4,
            paged: false,
            size: 512,
            page_size: 4,
            min_write_delay: 4000,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj305
        };
        var obj272 = {
            mode: 65,
            delay: 10,
            blocksize: 8,
            paged: false,
            size: 2048,
            page_size: 8,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj304
        };
        var obj271 = {
            mode: 65,
            delay: 20,
            blocksize: 4,
            paged: false,
            size: 512,
            page_size: 4,
            min_write_delay: 3600,
            max_write_delay: 3600,
            readback: obj1453,
            memops: obj303
        };
        var obj270 = {
            mode: 65,
            delay: 6,
            blocksize: 4,
            paged: false,
            size: 512,
            page_size: 4,
            min_write_delay: 4000,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj303
        };
        var obj269 = {
            mode: 65,
            delay: 5,
            blocksize: 4,
            paged: false,
            size: 256,
            page_size: 4,
            min_write_delay: 3600,
            max_write_delay: 3600,
            readback: obj1453,
            memops: obj303
        };
        var obj268 = {
            mode: 65,
            delay: 20,
            blocksize: 4,
            paged: false,
            size: 1024,
            page_size: 4,
            min_write_delay: 3600,
            max_write_delay: 3600,
            readback: obj1453,
            memops: obj299
        };
        var obj267 = {
            mode: 65,
            delay: 20,
            blocksize: 8,
            paged: false,
            size: 1024,
            page_size: 8,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj300
        };
        var obj266 = {
            mode: 65,
            delay: 20,
            blocksize: 4,
            paged: false,
            size: 512,
            page_size: 4,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj298
        };
        var obj265 = {
            mode: 4,
            delay: 10,
            blocksize: 128,
            paged: false,
            size: 512,
            page_size: 4,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj298
        };
        var obj264 = {
            mode: 4,
            delay: 10,
            blocksize: 64,
            paged: false,
            size: 1024,
            page_size: 4,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj298
        };
        var obj263 = {
            mode: 65,
            delay: 20,
            blocksize: 8,
            paged: false,
            size: 2048,
            page_size: 8,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj295
        };
        var obj262 = {
            mode: 65,
            delay: 20,
            blocksize: 4,
            paged: false,
            size: 512,
            page_size: 4,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj296
        };
        var obj261 = {
            mode: 65,
            delay: 5,
            blocksize: 4,
            paged: true,
            size: 64,
            page_size: 4,
            num_pages: 16,
            min_write_delay: 4000,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj312
        };
        var obj260 = {
            mode: 65,
            delay: 10,
            blocksize: 128,
            paged: false,
            size: 1024,
            page_size: 4,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj294
        };
        var obj259 = {
            mode: 65,
            delay: 20,
            blocksize: 8,
            paged: false,
            size: 4096,
            page_size: 8,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj293
        };
        var obj258 = {
            mode: 65,
            delay: 20,
            blocksize: 8,
            paged: false,
            size: 1024,
            page_size: 4,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj292
        };
        var obj257 = {
            mode: 65,
            delay: 10,
            blocksize: 128,
            paged: false,
            size: 2048,
            page_size: 8,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj291
        };
        var obj256 = {
            mode: 65,
            delay: 10,
            blocksize: 128,
            paged: false,
            size: 4096,
            page_size: 8,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj291
        };
        var obj255 = {
            mode: 65,
            delay: 10,
            blocksize: 8,
            paged: false,
            size: 2048,
            page_size: 8,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj290
        };
        var obj254 = {
            mode: 65,
            delay: 20,
            blocksize: 4,
            paged: false,
            size: 1024,
            page_size: 4,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj290
        };
        var obj253 = {
            mode: 65,
            delay: 10,
            blocksize: 8,
            paged: false,
            size: 2048,
            page_size: 8,
            min_write_delay: 13000,
            max_write_delay: 13000,
            readback: obj1451,
            memops: obj290
        };
        var obj252 = {
            mode: 65,
            delay: 20,
            blocksize: 8,
            paged: false,
            size: 2048,
            page_size: 8,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj290
        };
        var obj251 = {
            mode: 65,
            delay: 10,
            blocksize: 8,
            paged: false,
            size: 4096,
            page_size: 8,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj289
        };
        var obj250 = {
            mode: 65,
            delay: 10,
            blocksize: 8,
            paged: false,
            size: 4096,
            page_size: 8,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj288
        };
        var obj249 = {
            mode: 65,
            delay: 10,
            blocksize: 8,
            paged: false,
            size: 8192,
            page_size: 8,
            min_write_delay: 13000,
            max_write_delay: 13000,
            readback: obj1451,
            memops: obj287
        };
        var obj248 = {
            mode: 65,
            delay: 10,
            blocksize: 4,
            paged: false,
            size: 128,
            page_size: 4,
            num_pages: 32,
            min_write_delay: 4000,
            max_write_delay: 4000,
            readback: obj1453,
            memops: obj302
        };
        var obj247 = {
            mode: 65,
            delay: 10,
            blocksize: 4,
            paged: false,
            size: 256,
            page_size: 4,
            num_pages: 64,
            min_write_delay: 4000,
            max_write_delay: 4000,
            readback: obj1453,
            memops: obj301
        };
        var obj246 = {
            mode: 65,
            delay: 20,
            blocksize: 4,
            paged: false,
            size: 512,
            page_size: 4,
            num_pages: 128,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj297
        };
        var obj245 = {
            mode: 65,
            delay: 20,
            blocksize: 4,
            paged: false,
            size: 1024,
            page_size: 4,
            num_pages: 256,
            min_write_delay: 9000,
            max_write_delay: 9000,
            readback: obj1451,
            memops: obj297
        };
        var obj244 = {
            mode: 65,
            delay: 10,
            blocksize: 4,
            paged: false,
            size: 512,
            page_size: 4,
            num_pages: 128,
            min_write_delay: 4000,
            max_write_delay: 4000,
            readback: obj1453,
            memops: obj296
        };
        var obj243 = {
            mode: 2,
            delay: 15,
            blocksize: 128,
            paged: false,
            size: 1024,
            min_write_delay: 4000,
            max_write_delay: 9000,
            readback: obj1453,
            memops: obj286
        };
        var obj242 = {
            mode: 4,
            delay: 5,
            blocksize: 128,
            paged: false,
            size: 1024,
            min_write_delay: 4500,
            max_write_delay: 20000,
            readback: obj1453,
            memops: obj286
        };
        var obj241 = {
            mode: 4,
            delay: 5,
            blocksize: 128,
            paged: false,
            size: 1024,
            min_write_delay: 4100,
            max_write_delay: 4100,
            readback: obj1453,
            memops: obj286
        };
        var obj240 = {
            mode: 4,
            delay: 12,
            blocksize: 128,
            paged: false,
            size: 2048,
            min_write_delay: 9000,
            max_write_delay: 20000,
            readback: obj1453,
            memops: obj285
        };
        var obj239 = {
            mode: 4,
            delay: 12,
            blocksize: 128,
            paged: false,
            size: 2048,
            min_write_delay: 4000,
            max_write_delay: 9000,
            readback: obj1452,
            memops: obj285
        };
        var obj238 = {
            mode: 4,
            delay: 12,
            blocksize: 128,
            paged: false,
            size: 4096,
            min_write_delay: 9000,
            max_write_delay: 20000,
            readback: obj1453,
            memops: obj284
        };
        var obj237 = {
            mode: 4,
            delay: 12,
            blocksize: 64,
            paged: false,
            size: 4096,
            min_write_delay: 9000,
            max_write_delay: 20000,
            readback: obj1452,
            memops: obj283
        };
        var obj236 = {
            mode: 4,
            delay: 12,
            blocksize: 128,
            paged: false,
            size: 8192,
            min_write_delay: 9000,
            max_write_delay: 20000,
            readback: obj1453,
            memops: obj283
        };
        var obj235 = {
            mode: 4,
            delay: 12,
            blocksize: 128,
            paged: false,
            size: 8192,
            min_write_delay: 4000,
            max_write_delay: 9000,
            readback: obj1452,
            memops: obj283
        };
        var obj234 = {
            READ_LO: obj528,
            READ_HI: obj529,
            LOADPAGE_LO: obj445,
            LOADPAGE_HI: obj444,
            WRITEPAGE: obj487,
        };
        var obj233 = {
            READ_LO: obj525,
            READ_HI: obj524,
            LOADPAGE_LO: obj445,
            LOADPAGE_HI: obj444,
            WRITEPAGE: obj484,
        };
        var obj232 = {
            READ_LO: obj522,
            READ_HI: obj521,
            LOADPAGE_LO: obj443,
            LOADPAGE_HI: obj442,
            WRITEPAGE: obj481,
        };
        var obj231 = {
            READ_LO: obj519,
            READ_HI: obj518,
            LOADPAGE_LO: obj447,
            LOADPAGE_HI: obj446,
            WRITEPAGE: obj476,
        };
        var obj230 = {
            READ_LO: obj519,
            READ_HI: obj518,
            LOADPAGE_LO: obj443,
            LOADPAGE_HI: obj442,
            WRITEPAGE: obj476,
        };
        var obj229 = {
            READ_LO: obj511,
            READ_HI: obj513,
            LOADPAGE_LO: obj440,
            LOADPAGE_HI: obj441,
            WRITEPAGE: obj472,
        };
        var obj228 = {
            READ_LO: obj514,
            READ_HI: obj512,
            LOADPAGE_LO: obj439,
            LOADPAGE_HI: obj435,
            WRITEPAGE: obj466,
        };
        var obj227 = {
            READ_LO: obj507,
            READ_HI: obj508,
            LOADPAGE_LO: obj440,
            LOADPAGE_HI: obj441,
            WRITEPAGE: obj469,
        };
        var obj226 = {
            READ_LO: obj507,
            READ_HI: obj508,
            LOADPAGE_LO: obj437,
            LOADPAGE_HI: obj434,
            WRITEPAGE: obj469,
        };
        var obj225 = {
            READ_LO: obj510,
            READ_HI: obj509,
            LOADPAGE_LO: obj433,
            LOADPAGE_HI: obj432,
            WRITEPAGE: obj468,
        };
        var obj224 = {
            READ_LO: obj498,
            READ_HI: obj497,
            LOADPAGE_LO: obj448,
            LOADPAGE_HI: obj449,
            WRITEPAGE: obj462,
        };
        var obj223 = {
            READ_LO: obj506,
            READ_HI: obj505,
            LOADPAGE_LO: obj433,
            LOADPAGE_HI: obj432,
            WRITEPAGE: obj463,
        };
        var obj222 = {
            READ_LO: obj501,
            READ_HI: obj502,
            LOADPAGE_LO: obj448,
            LOADPAGE_HI: obj449,
            WRITEPAGE: obj457,
        };
        var obj221 = {
            READ_LO: obj501,
            READ_HI: obj502,
            LOADPAGE_LO: obj437,
            LOADPAGE_HI: obj434,
            WRITEPAGE: obj461,
        };
        var obj220 = {
            READ_LO: obj503,
            READ_HI: obj504,
            LOADPAGE_LO: obj429,
            LOADPAGE_HI: obj428,
            WRITEPAGE: obj465,
        };
        var obj219 = {
            READ_LO: obj498,
            READ_HI: obj497,
            LOADPAGE_LO: obj438,
            LOADPAGE_HI: obj436,
            WRITEPAGE: obj459,
        };
        var obj218 = {
            READ_LO: obj500,
            READ_HI: obj499,
            LOADPAGE_LO: obj429,
            LOADPAGE_HI: obj428,
            WRITEPAGE: obj465,
        };
        var obj217 = {
            READ_LO: obj501,
            READ_HI: obj502,
            LOADPAGE_LO: obj426,
            LOADPAGE_HI: obj427,
            WRITEPAGE: obj464,
        };
        var obj216 = {
            READ_LO: obj501,
            READ_HI: obj502,
            LOADPAGE_LO: obj429,
            LOADPAGE_HI: obj428,
            WRITEPAGE: obj458,
        };
        var obj215 = {
            READ_LO: obj498,
            READ_HI: obj497,
            LOADPAGE_LO: obj431,
            LOADPAGE_HI: obj430,
            WRITEPAGE: obj459,
        };
        var obj214 = {
            READ_LO: obj500,
            READ_HI: obj499,
            LOADPAGE_LO: obj426,
            LOADPAGE_HI: obj427,
            WRITEPAGE: obj460,
        };
        var obj213 = {
            READ_LO: obj498,
            READ_HI: obj497,
            LOADPAGE_LO: obj426,
            LOADPAGE_HI: obj427,
            WRITEPAGE: obj467,
        };
        var obj212 = {
            READ_LO: obj498,
            READ_HI: obj497,
            LOADPAGE_LO: obj429,
            LOADPAGE_HI: obj428,
            WRITEPAGE: obj458,
        };
        var obj211 = {
            READ_LO: obj498,
            READ_HI: obj497,
            LOADPAGE_LO: obj426,
            LOADPAGE_HI: obj427,
            WRITEPAGE: obj459,
        };
        var obj210 = {
            mode: 65,
            delay: 6,
            blocksize: 32,
            paged: true,
            size: 1024,
            page_size: 32,
            num_pages: 32,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj234
        };
        var obj209 = {
            mode: 65,
            delay: 6,
            blocksize: 32,
            paged: true,
            size: 2048,
            page_size: 32,
            num_pages: 64,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj233
        };
        var obj208 = {
            mode: 65,
            delay: 10,
            blocksize: 64,
            paged: true,
            size: 4096,
            page_size: 64,
            num_pages: 64,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj232
        };
        var obj207 = {
            mode: 65,
            delay: 6,
            blocksize: 64,
            paged: true,
            size: 4096,
            page_size: 64,
            num_pages: 64,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj232
        };
        var obj206 = {
            mode: 65,
            delay: 6,
            blocksize: 32,
            paged: true,
            size: 4096,
            page_size: 64,
            num_pages: 64,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj232
        };
        var obj205 = {
            mode: 33,
            delay: 10,
            blocksize: 64,
            paged: true,
            size: 8192,
            page_size: 64,
            num_pages: 128,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1448,
            memops: obj231
        };
        var obj204 = {
            mode: 33,
            delay: 6,
            blocksize: 64,
            paged: true,
            size: 8192,
            page_size: 64,
            num_pages: 128,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj231
        };
        var obj203 = {
            mode: 65,
            delay: 6,
            blocksize: 32,
            paged: true,
            size: 8192,
            page_size: 64,
            num_pages: 128,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj230
        };
        var obj202 = {
            mode: 65,
            delay: 6,
            blocksize: 64,
            paged: true,
            size: 8192,
            page_size: 64,
            num_pages: 128,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj230
        };
        var obj201 = {
            mode: 65,
            delay: 6,
            blocksize: 128,
            paged: true,
            size: 16384,
            page_size: 128,
            num_pages: 128,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj229
        };
        var obj200 = {
            mode: 65,
            delay: 6,
            blocksize: 128,
            paged: true,
            size: 16384,
            page_size: 32,
            num_pages: 512,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj229
        };
        var obj199 = {
            mode: 33,
            delay: 6,
            blocksize: 16,
            paged: true,
            size: 2048,
            page_size: 32,
            num_pages: 64,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj228
        };
        var obj198 = {
            mode: 65,
            delay: 6,
            blocksize: 32,
            paged: true,
            size: 2048,
            page_size: 32,
            num_pages: 64,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj228
        };
        var obj197 = {
            mode: 65,
            delay: 6,
            blocksize: 128,
            paged: true,
            size: 32768,
            page_size: 128,
            num_pages: 256,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj227
        };
        var obj196 = {
            mode: 33,
            delay: 6,
            blocksize: 128,
            paged: true,
            size: 16384,
            page_size: 128,
            num_pages: 128,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj226
        };
        var obj195 = {
            mode: 65,
            delay: 10,
            blocksize: 128,
            paged: true,
            size: 16384,
            page_size: 128,
            num_pages: 128,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj226
        };
        var obj194 = {
            mode: 65,
            delay: 6,
            blocksize: 64,
            paged: true,
            size: 4096,
            page_size: 64,
            num_pages: 64,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj225
        };
        var obj193 = {
            mode: 33,
            delay: 6,
            blocksize: 64,
            paged: true,
            size: 32768,
            page_size: 128,
            num_pages: 256,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj226
        };
        var obj192 = {
            mode: 65,
            delay: 10,
            blocksize: 128,
            paged: true,
            size: 65536,
            page_size: 256,
            num_pages: 256,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj224
        };
        var obj191 = {
            mode: 65,
            delay: 6,
            blocksize: 64,
            paged: true,
            size: 8192,
            page_size: 64,
            num_pages: 128,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj223
        };
        var obj190 = {
            mode: 65,
            delay: 10,
            blocksize: 128,
            paged: true,
            size: 32768,
            page_size: 128,
            num_pages: 256,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj222
        };
        var obj189 = {
            mode: 33,
            delay: 6,
            blocksize: 256,
            paged: true,
            size: 32768,
            page_size: 128,
            num_pages: 256,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj221
        };
        var obj188 = {
            mode: 65,
            delay: 6,
            blocksize: 128,
            paged: true,
            size: 16384,
            page_size: 128,
            num_pages: 128,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj220
        };
        var obj187 = {
            mode: 17,
            delay: 20,
            blocksize: 128,
            paged: true,
            size: 16384,
            page_size: 128,
            num_pages: 128,
            min_write_delay: 16000,
            max_write_delay: 16000,
            readback: obj1453,
            memops: obj220
        };
        var obj186 = {
            mode: 33,
            delay: 16,
            blocksize: 128,
            paged: true,
            size: 16384,
            page_size: 128,
            num_pages: 128,
            min_write_delay: 14000,
            max_write_delay: 14000,
            readback: obj1453,
            memops: obj220
        };
        var obj185 = {
            mode: 65,
            delay: 6,
            blocksize: 256,
            paged: true,
            size: 32768,
            page_size: 128,
            num_pages: 256,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj218
        };
        var obj184 = {
            mode: 65,
            delay: 10,
            blocksize: 256,
            paged: true,
            size: 65536,
            page_size: 256,
            num_pages: 256,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj217
        };
        var obj183 = {
            mode: 65,
            delay: 6,
            blocksize: 256,
            paged: true,
            size: 32768,
            page_size: 256,
            num_pages: 128,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj219
        };
        var obj182 = {
            mode: 65,
            delay: 6,
            blocksize: 256,
            paged: true,
            size: 65536,
            page_size: 256,
            num_pages: 256,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj217
        };
        var obj181 = {
            mode: 65,
            delay: 6,
            blocksize: 256,
            paged: true,
            size: 131072,
            page_size: 256,
            num_pages: 512,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj219
        };
        var obj180 = {
            mode: 65,
            delay: 6,
            blocksize: 256,
            paged: true,
            size: 65536,
            page_size: 256,
            num_pages: 256,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj219
        };
        var obj179 = {
            mode: 65,
            delay: 20,
            blocksize: 256,
            paged: true,
            size: 65536,
            page_size: 256,
            num_pages: 256,
            min_write_delay: 50000,
            max_write_delay: 50000,
            readback: obj1451,
            memops: obj217
        };
        var obj178 = {
            mode: 65,
            delay: 6,
            blocksize: 128,
            paged: true,
            size: 32768,
            page_size: 128,
            num_pages: 256,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj216
        };
        var obj177 = {
            mode: 65,
            delay: 10,
            blocksize: 256,
            paged: true,
            size: 131072,
            page_size: 256,
            num_pages: 512,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj215
        };
        var obj176 = {
            mode: 33,
            delay: 6,
            blocksize: 256,
            paged: true,
            size: 65536,
            page_size: 256,
            num_pages: 256,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj215
        };
        var obj175 = {
            mode: 33,
            delay: 6,
            blocksize: 128,
            paged: true,
            size: 65536,
            page_size: 256,
            num_pages: 256,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj214
        };
        var obj174 = {
            mode: 65,
            delay: 6,
            blocksize: 256,
            paged: true,
            size: 65536,
            page_size: 256,
            num_pages: 256,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj213
        };
        var obj173 = {
            mode: 65,
            delay: 6,
            blocksize: 128,
            paged: true,
            size: 32768,
            page_size: 128,
            num_pages: 256,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj212
        };
        var obj172 = {
            mode: 65,
            delay: 6,
            blocksize: 128,
            paged: true,
            size: 16384,
            page_size: 128,
            num_pages: 128,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj212
        };
        var obj171 = {
            mode: 65,
            delay: 6,
            blocksize: 128,
            paged: true,
            size: 8192,
            page_size: 128,
            num_pages: 64,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj212
        };
        var obj170 = {
            mode: 65,
            delay: 6,
            blocksize: 64,
            paged: true,
            size: 8192,
            page_size: 64,
            num_pages: 128,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj212
        };
        var obj169 = {
            mode: 65,
            delay: 10,
            blocksize: 256,
            paged: true,
            size: 131072,
            page_size: 256,
            num_pages: 512,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj211
        };
        var obj168 = {
            mode: 65,
            delay: 6,
            blocksize: 256,
            paged: true,
            size: 131072,
            page_size: 256,
            num_pages: 512,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj211
        };
        var obj167 = {
            mode: 65,
            delay: 20,
            blocksize: 256,
            paged: true,
            size: 131072,
            page_size: 256,
            num_pages: 512,
            min_write_delay: 50000,
            max_write_delay: 50000,
            readback: obj1451,
            memops: obj211
        };
        var obj166 = {
            mode: 17,
            delay: 70,
            blocksize: 256,
            paged: true,
            size: 131072,
            page_size: 256,
            num_pages: 512,
            min_write_delay: 22000,
            max_write_delay: 56000,
            readback: obj1453,
            memops: obj211
        };
        var obj165 = {
            mode: 33,
            delay: 6,
            blocksize: 128,
            paged: true,
            size: 131072,
            page_size: 256,
            num_pages: 512,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1453,
            memops: obj211
        };
        var obj164 = {
            READ_LO: obj498,
            READ_HI: obj497,
            LOADPAGE_LO: obj426,
            LOADPAGE_HI: obj427,
            LOAD_EXT_ADDR: obj425,
            WRITEPAGE: obj459,
        };
        var obj163 = {
            mode: 65,
            delay: 10,
            blocksize: 256,
            paged: true,
            size: 262144,
            page_size: 256,
            num_pages: 1024,
            min_write_delay: 4500,
            max_write_delay: 4500,
            readback: obj1451,
            memops: obj164
        };
        var obj162 = {
            eeprom: obj329,
            flash: obj243,
            signature: obj515,
            fuse: obj1446,
            lock: obj454,
        };
        var obj161 = {
            eeprom: obj325,
            flash: obj239,
            signature: obj515,
            fuse: obj1446,
            lock: obj452,
        };
        var obj160 = {
            eeprom: obj318,
            flash: obj235,
            signature: obj515,
            fuse: obj1446,
            lock: obj453,
        };
        var obj159 = {
            eeprom: obj321,
            flash: obj237,
            signature: obj515,
            fuse: obj1446,
            lock: obj453,
        };
        var obj158 = {
            AVRPart: "AT90S2313",
            chipEraseDelay: 20000,
            stk500_devcode: 0x40,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj161
        };
        var obj157 = {
            AVRPart: "AT90S1200",
            chipEraseDelay: 20000,
            stk500_devcode: 0x33,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 1,
            pollValue: 0xff,
            ops: obj423,
            memory: obj162
        };
        var obj156 = {
            AVRPart: "AT90S4414",
            chipEraseDelay: 20000,
            stk500_devcode: 0x50,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj159
        };
        var obj155 = {
            AVRPart: "AT90S8515",
            chipEraseDelay: 20000,
            stk500_devcode: 0x60,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj160
        };
        var obj154 = {
            eeprom: obj331,
            flash: obj275,
            signature: obj515,
            fuse: obj340,
            lock: obj339,
        };
        var obj153 = {
            eeprom: obj330,
            flash: obj240,
            signature: obj515,
            fuse: obj332,
            lock: obj338,
        };
        var obj152 = {
            eeprom: obj324,
            flash: obj240,
            signature: obj515,
            fuse: obj340,
            lock: obj339,
        };
        var obj151 = {
            eeprom: obj322,
            flash: obj238,
            signature: obj515,
            fuse: obj340,
            lock: obj339,
        };
        var obj150 = {
            eeprom: obj317,
            flash: obj236,
            signature: obj515,
            fuse: obj336,
            lock: obj335,
        };
        var obj149 = {
            eeprom: obj328,
            flash: obj242,
            signature: obj527,
            lock: obj337,
            calibration: obj532,
            fuse: obj342,
        };
        var obj148 = {
            eeprom: obj327,
            flash: obj241,
            signature: obj527,
            lock: obj337,
            calibration: obj532,
            fuse: obj343,
        };
        var obj147 = {
            eeprom: obj319,
            flash: obj186,
            fuse: obj344,
            lock: obj355,
            signature: obj515,
        };
        var obj146 = {
            eeprom: obj316,
            flash: obj166,
            fuse: obj341,
            lock: obj337,
            signature: obj515,
        };
        var obj145 = {
            AVRPart: "AT90S4434",
            chipEraseDelay: 20000,
            stk500_devcode: 0x52,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            ops: obj423,
            memory: obj154
        };
        var obj144 = {
            AVRPart: "AT90S2343",
            chipEraseDelay: 18000,
            stk500_devcode: 0x43,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj153
        };
        var obj143 = {
            AVRPart: "AT90S2333",
            chipEraseDelay: 20000,
            stk500_devcode: 0x42,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj152
        };
        var obj142 = {
            AVRPart: "AT90S4433",
            chipEraseDelay: 20000,
            stk500_devcode: 0x51,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj151
        };
        var obj141 = {
            AVRPart: "AT90S8535",
            chipEraseDelay: 20000,
            stk500_devcode: 0x61,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj150
        };
        var obj140 = {
            AVRPart: "ATtiny15",
            chipEraseDelay: 8200,
            stk500_devcode: 0x13,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj148
        };
        var obj139 = {
            AVRPart: "ATtiny12",
            chipEraseDelay: 20000,
            stk500_devcode: 0x12,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj149
        };
        var obj138 = {
            AVRPart: "ATmega161",
            chipEraseDelay: 28000,
            stk500_devcode: 0x80,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj147
        };
        var obj137 = {
            AVRPart: "ATmega103",
            chipEraseDelay: 112000,
            stk500_devcode: 0xb1,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj146
        };
        var obj136 = {
            eeprom: obj323,
            flash: obj204,
            lfuse: obj370,
            hfuse: obj365,
            lock: obj355,
            calibration: obj530,
            signature: obj515,
        };
        var obj135 = {
            eeprom: obj323,
            flash: obj204,
            lfuse: obj363,
            hfuse: obj367,
            lock: obj350,
            calibration: obj530,
            signature: obj515,
        };
        var obj134 = {
            eeprom: obj315,
            flash: obj205,
            lfuse: obj370,
            hfuse: obj365,
            lock: obj355,
            calibration: obj530,
            signature: obj515,
        };
        var obj133 = {
            eeprom: obj326,
            flash: obj199,
            signature: obj527,
            lock: obj333,
            lfuse: obj366,
            hfuse: obj361,
            calibration: obj526,
        };
        var obj132 = {
            eeprom: obj320,
            flash: obj187,
            lfuse: obj373,
            hfuse: obj375,
            lock: obj358,
            signature: obj515,
            calibration: obj532,
        };
        var obj131 = {
            AVRPart: "ATmega8515",
            chipEraseDelay: 9000,
            stk500_devcode: 0x63,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj135
        };
        var obj130 = {
            AVRPart: "ATmega8535",
            chipEraseDelay: 9000,
            stk500_devcode: 0x64,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj136
        };
        var obj129 = {
            AVRPart: "ATmega163",
            chipEraseDelay: 32000,
            stk500_devcode: 0x81,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj132
        };
        var obj128 = {
            AVRPart: "ATmega8",
            chipEraseDelay: 10000,
            stk500_devcode: 0x70,
            pagel: 0xd7,
            bs2: 0xc2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj134
        };
        var obj127 = {
            AVRPart: "ATtiny26",
            chipEraseDelay: 9000,
            stk500_devcode: 0x21,
            pagel: 0xb3,
            bs2: 0xb2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj133
        };
        var obj126 = {
            eeprom: obj313,
            flash: obj175,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj349,
            lock: obj351,
            calibration: obj526,
            signature: obj515,
        };
        var obj125 = {
            eeprom: obj314,
            flash: obj165,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj349,
            lock: obj351,
            calibration: obj526,
            signature: obj515,
        };
        var obj124 = {
            eeprom: obj282,
            flash: obj210,
            signature: obj523,
            lock: obj350,
            calibration: obj534,
            lfuse: obj363,
            hfuse: obj367,
        };
        var obj123 = {
            eeprom: obj265,
            flash: obj196,
            lock: obj351,
            lfuse: obj366,
            hfuse: obj372,
            signature: obj515,
            calibration: obj531,
        };
        var obj122 = {
            eeprom: obj264,
            flash: obj193,
            lfuse: obj370,
            hfuse: obj365,
            lock: obj355,
            signature: obj515,
            calibration: obj530,
        };
        var obj121 = {
            eeprom: obj279,
            flash: obj209,
            signature: obj523,
            lock: obj456,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj345,
            calibration: obj534,
        };
        var obj120 = {
            eeprom: obj277,
            flash: obj206,
            signature: obj523,
            lock: obj456,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj345,
            calibration: obj534,
        };
        var obj119 = {
            eeprom: obj270,
            flash: obj203,
            signature: obj523,
            lock: obj456,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj345,
            calibration: obj534,
        };
        var obj118 = {
            eeprom: obj261,
            flash: obj208,
            signature: obj523,
            lock: obj455,
            lfuse: obj363,
            hfuse: obj367,
            efuse: obj348,
            calibration: obj534,
        };
        var obj117 = {
            AVRPart: "ATmega64",
            chipEraseDelay: 9000,
            stk500_devcode: 0xa0,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj126
        };
        var obj116 = {
            AVRPart: "ATmega128",
            chipEraseDelay: 9000,
            stk500_devcode: 0xb2,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj125
        };
        var obj115 = {
            AVRPart: "ATtiny13",
            chipEraseDelay: 4000,
            stk500_devcode: 0x14,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj124
        };
        var obj114 = {
            AVRPart: "ATmega32",
            chipEraseDelay: 9000,
            stk500_devcode: 0x91,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj122
        };
        var obj113 = {
            AVRPart: "ATmega16",
            chipEraseDelay: 9000,
            stk500_devcode: 0x82,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj123
        };
        var obj112 = {
            AVRPart: "ATmega164P",
            chipEraseDelay: 55000,
            stk500_devcode: 0x82,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj123
        };
        var obj111 = {
            eeprom: obj281,
            flash: obj190,
            lock: obj376,
            lfuse: obj379,
            hfuse: obj377,
            efuse: obj378,
            signature: obj537,
            calibration: obj538,
        };
        var obj110 = {
            eeprom: obj272,
            flash: obj192,
            lock: obj376,
            lfuse: obj379,
            hfuse: obj377,
            efuse: obj378,
            signature: obj537,
            calibration: obj538,
        };
        var obj109 = {
            eeprom: obj262,
            flash: obj188,
            lfuse: obj370,
            hfuse: obj365,
            efuse: obj380,
            lock: obj355,
            signature: obj523,
            calibration: obj536,
        };
        var obj108 = {
            eeprom: obj279,
            flash: obj209,
            signature: obj523,
            lock: obj362,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj345,
            calibration: obj533,
        };
        var obj107 = {
            eeprom: obj279,
            flash: obj209,
            signature: obj523,
            lock: obj351,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj345,
            calibration: obj534,
        };
        var obj106 = {
            eeprom: obj278,
            flash: obj206,
            signature: obj523,
            lock: obj362,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj345,
            calibration: obj533,
        };
        var obj105 = {
            eeprom: obj276,
            flash: obj207,
            lfuse: obj363,
            hfuse: obj367,
            efuse: obj347,
            lock: obj350,
            calibration: obj536,
            signature: obj523,
        };
        var obj104 = {
            eeprom: obj277,
            flash: obj206,
            signature: obj523,
            lock: obj351,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj345,
            calibration: obj534,
        };
        var obj103 = {
            eeprom: obj273,
            flash: obj202,
            signature: obj520,
            lock: obj351,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj369,
            calibration: obj536,
        };
        var obj102 = {
            eeprom: obj280,
            flash: obj202,
            lfuse: obj363,
            hfuse: obj367,
            efuse: obj346,
            lock: obj350,
            calibration: obj536,
            signature: obj523,
        };
        var obj101 = {
            eeprom: obj274,
            flash: obj203,
            signature: obj523,
            lock: obj362,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj345,
            calibration: obj533,
        };
        var obj100 = {
            eeprom: obj271,
            flash: obj202,
            lfuse: obj363,
            hfuse: obj367,
            efuse: obj352,
            lock: obj350,
            calibration: obj536,
            signature: obj523,
        };
        var obj99 = {
            eeprom: obj269,
            flash: obj200,
            lfuse: obj363,
            hfuse: obj367,
            efuse: obj360,
            lock: obj357,
            calibration: obj536,
            signature: obj523,
        };
        var obj98 = {
            eeprom: obj271,
            flash: obj201,
            lfuse: obj363,
            hfuse: obj367,
            efuse: obj352,
            lock: obj350,
            calibration: obj536,
            signature: obj523,
        };
        var obj97 = {
            eeprom: obj273,
            signature: obj520,
            lock: obj351,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj369,
            calibration: obj536,
            flash: obj196,
        };
        var obj96 = {
            eeprom: obj268,
            flash: obj197,
            lfuse: obj363,
            hfuse: obj367,
            efuse: obj352,
            lock: obj350,
            calibration: obj536,
            signature: obj523,
        };
        var obj95 = {
            flash: obj195,
            eeprom: obj266,
            lfuse: obj364,
            hfuse: obj374,
            efuse: obj371,
            lock: obj353,
            signature: obj520,
            calibration: obj535,
        };
        var obj94 = {
            eeprom: obj260,
            flash: obj189,
            lock: obj351,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj368,
            signature: obj515,
            calibration: obj536,
        };
        var obj93 = {
            eeprom: obj267,
            flash: obj183,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj359,
            lock: obj351,
            calibration: obj536,
            signature: obj515,
        };
        var obj92 = {
            eeprom: obj263,
            flash: obj180,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj359,
            lock: obj351,
            calibration: obj536,
            signature: obj515,
        };
        var obj91 = {
            eeprom: obj258,
            flash: obj185,
            lfuse: obj363,
            hfuse: obj367,
            efuse: obj354,
            lock: obj350,
            signature: obj523,
            calibration: obj536,
        };
        var obj90 = {
            eeprom: obj259,
            flash: obj181,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj359,
            lock: obj351,
            calibration: obj536,
            signature: obj515,
        };
        var obj89 = {
            eeprom: obj256,
            flash: obj177,
            lock: obj351,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj368,
            signature: obj515,
            calibration: obj536,
        };
        var obj88 = {
            eeprom: obj257,
            flash: obj176,
            lock: obj351,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj368,
            signature: obj515,
            calibration: obj536,
        };
        var obj87 = {
            eeprom: obj252,
            flash: obj174,
            lfuse: obj363,
            hfuse: obj367,
            efuse: obj354,
            lock: obj350,
            signature: obj523,
            calibration: obj536,
        };
        var obj86 = {
            eeprom: obj255,
            flash: obj182,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj359,
            lock: obj351,
            calibration: obj532,
            signature: obj515,
        };
        var obj85 = {
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj356,
            lock: obj351,
            calibration: obj532,
            signature: obj515,
            flash: obj179,
            eeprom: obj253,
        };
        var obj84 = {
            eeprom: obj254,
            flash: obj178,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj359,
            lock: obj351,
            calibration: obj532,
            signature: obj515,
        };
        var obj83 = {
            eeprom: obj250,
            flash: obj184,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj356,
            lock: obj351,
            calibration: obj532,
            signature: obj515,
        };
        var obj82 = {
            eeprom: obj248,
            flash: obj198,
            signature: obj527,
            lock: obj334,
            lfuse: obj363,
            hfuse: obj367,
            efuse: obj347,
            calibration: obj532,
        };
        var obj81 = {
            eeprom: obj251,
            flash: obj168,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj359,
            lock: obj351,
            calibration: obj532,
            signature: obj515,
        };
        var obj80 = {
            eeprom: obj250,
            flash: obj169,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj356,
            lock: obj351,
            calibration: obj532,
            signature: obj515,
        };
        var obj79 = {
            eeprom: obj250,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj356,
            lock: obj351,
            calibration: obj532,
            signature: obj515,
            flash: obj167,
        };
        var obj78 = {
            eeprom: obj245,
            flash: obj173,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj369,
            lock: obj351,
            calibration: obj536,
            signature: obj523,
        };
        var obj77 = {
            eeprom: obj246,
            flash: obj170,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj369,
            lock: obj351,
            calibration: obj536,
            signature: obj523,
        };
        var obj76 = {
            eeprom: obj246,
            flash: obj171,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj369,
            lock: obj351,
            calibration: obj536,
            signature: obj523,
        };
        var obj75 = {
            eeprom: obj246,
            flash: obj172,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj369,
            lock: obj351,
            calibration: obj536,
            signature: obj523,
        };
        var obj74 = {
            eeprom: obj247,
            flash: obj194,
            signature: obj527,
            lock: obj334,
            lfuse: obj363,
            hfuse: obj367,
            efuse: obj347,
            calibration: obj532,
        };
        var obj73 = {
            eeprom: obj244,
            flash: obj191,
            signature: obj527,
            lock: obj334,
            lfuse: obj363,
            hfuse: obj367,
            efuse: obj347,
            calibration: obj532,
        };
        var obj72 = {
            AVRPart: "ATtiny25",
            chipEraseDelay: 4500,
            stk500_devcode: 0x14,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj121
        };
        var obj71 = {
            AVRPart: "ATtiny45",
            chipEraseDelay: 4500,
            stk500_devcode: 0x14,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj120
        };
        var obj70 = {
            AVRPart: "ATtiny85",
            chipEraseDelay: 4500,
            stk500_devcode: 0x14,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj119
        };
        var obj69 = {
            AVRPart: "ATtiny43u",
            chipEraseDelay: 1000,
            stk500_devcode: 0x14,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj118
        };
        var obj68 = {
            eeprom: obj250,
            flash: obj163,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj356,
            lock: obj351,
            calibration: obj532,
            signature: obj515,
        };
        var obj67 = {
            flash: obj163,
            lfuse: obj366,
            hfuse: obj372,
            efuse: obj356,
            lock: obj351,
            calibration: obj532,
            signature: obj515,
            eeprom: obj249,
        };
        var obj66 = {
            AVRPart: "ATmega325",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj424,
            memory: obj111
        };
        var obj65 = {
            AVRPart: "ATmega3250",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj424,
            memory: obj111
        };
        var obj64 = {
            AVRPart: "ATmega645",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj424,
            memory: obj110
        };
        var obj63 = {
            AVRPart: "ATmega6450",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj424,
            memory: obj110
        };
        var obj62 = {
            AVRPart: "ATmega169",
            chipEraseDelay: 9000,
            stk500_devcode: 0x85,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj109
        };
        var obj61 = {
            AVRPart: "ATtiny24",
            chipEraseDelay: 4500,
            stk500_devcode: 0x14,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj108
        };
        var obj60 = {
            AVRPart: "ATtiny44",
            chipEraseDelay: 4500,
            stk500_devcode: 0x14,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj106
        };
        var obj59 = {
            AVRPart: "ATtiny84",
            chipEraseDelay: 4500,
            stk500_devcode: 0x14,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj101
        };
        var obj58 = {
            AVRPart: "ATtiny2313",
            chipEraseDelay: 9000,
            stk500_devcode: 0x23,
            pagel: 0xd4,
            bs2: 0xd6,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj107
        };
        var obj57 = {
            AVRPart: "ATmega48",
            chipEraseDelay: 45000,
            stk500_devcode: 0x59,
            pagel: 0xd7,
            bs2: 0xc2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj105
        };
        var obj56 = {
            AVRPart: "ATmega48P",
            chipEraseDelay: 45000,
            stk500_devcode: 0x59,
            pagel: 0xd7,
            bs2: 0xc2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj105
        };
        var obj55 = {
            AVRPart: "ATtiny88",
            chipEraseDelay: 9000,
            stk500_devcode: 0x73,
            pagel: 0xd7,
            bs2: 0xc2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj102
        };
        var obj54 = {
            AVRPart: "AT90PWM2",
            chipEraseDelay: 9000,
            stk500_devcode: 0x65,
            pagel: 0xd8,
            bs2: 0xe2,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj103
        };
        var obj53 = {
            AVRPart: "AT90PWM3",
            chipEraseDelay: 9000,
            stk500_devcode: 0x65,
            pagel: 0xd8,
            bs2: 0xe2,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj103
        };
        var obj52 = {
            AVRPart: "AT90PWM3B",
            chipEraseDelay: 9000,
            stk500_devcode: 0x65,
            pagel: 0xd8,
            bs2: 0xe2,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj103
        };
        var obj51 = {
            AVRPart: "AT90PWM2B",
            chipEraseDelay: 9000,
            stk500_devcode: 0x65,
            pagel: 0xd8,
            bs2: 0xe2,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj103
        };
        var obj50 = {
            AVRPart: "ATtiny4313",
            chipEraseDelay: 9000,
            stk500_devcode: 0x23,
            pagel: 0xd4,
            bs2: 0xd6,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj104
        };
        var obj49 = {
            AVRPart: "ATmega88",
            chipEraseDelay: 9000,
            stk500_devcode: 0x73,
            pagel: 0xd7,
            bs2: 0xc2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj100
        };
        var obj48 = {
            AVRPart: "ATmega88P",
            chipEraseDelay: 9000,
            stk500_devcode: 0x73,
            pagel: 0xd7,
            bs2: 0xc2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj100
        };
        var obj47 = {
            AVRPart: "ATmega329",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj91
        };
        var obj46 = {
            AVRPart: "ATmega3290",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj91
        };
        var obj45 = {
            AVRPart: "ATmega329P",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj91
        };
        var obj44 = {
            AVRPart: "ATmega3290P",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj91
        };
        var obj43 = {
            AVRPart: "ATmega649",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj87
        };
        var obj42 = {
            AVRPart: "ATmega6490",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj87
        };
        var obj41 = {
            AVRPart: "ATmega168",
            chipEraseDelay: 9000,
            stk500_devcode: 0x86,
            pagel: 0xd7,
            bs2: 0xc2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj98
        };
        var obj40 = {
            AVRPart: "ATmega168P",
            chipEraseDelay: 9000,
            stk500_devcode: 0x86,
            pagel: 0xd7,
            bs2: 0xc2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj98
        };
        var obj39 = {
            AVRPart: "ATtiny1634",
            chipEraseDelay: 9000,
            stk500_devcode: 0x86,
            pagel: 0xb3,
            bs2: 0xb1,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj99
        };
        var obj38 = {
            AVRPart: "AT90PWM316",
            chipEraseDelay: 9000,
            stk500_devcode: 0x65,
            pagel: 0xd8,
            bs2: 0xe2,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj97
        };
        var obj37 = {
            AVRPart: "ATmega328",
            chipEraseDelay: 9000,
            stk500_devcode: 0x86,
            pagel: 0xd7,
            bs2: 0xc2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj96
        };
        var obj36 = {
            AVRPart: "ATmega162",
            chipEraseDelay: 9000,
            stk500_devcode: 0x83,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj95
        };
        var obj35 = {
            AVRPart: "ATmega328P",
            chipEraseDelay: 9000,
            stk500_devcode: 0x86,
            pagel: 0xd7,
            bs2: 0xc2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj96
        };
        var obj34 = {
            AVRPart: "ATmega324P",
            chipEraseDelay: 55000,
            stk500_devcode: 0x82,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj94
        };
        var obj33 = {
            AVRPart: "ATmega324PA",
            chipEraseDelay: 55000,
            stk500_devcode: 0x82,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj94
        };
        var obj32 = {
            AVRPart: "AT90CAN32",
            chipEraseDelay: 9000,
            stk500_devcode: 0xb3,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj93
        };
        var obj31 = {
            AVRPart: "AT90CAN64",
            chipEraseDelay: 9000,
            stk500_devcode: 0xb3,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj92
        };
        var obj30 = {
            AVRPart: "ATmega644",
            chipEraseDelay: 55000,
            stk500_devcode: 0x82,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj88
        };
        var obj29 = {
            AVRPart: "AT90CAN128",
            chipEraseDelay: 9000,
            stk500_devcode: 0xb3,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj90
        };
        var obj28 = {
            AVRPart: "ATmega644P",
            chipEraseDelay: 55000,
            stk500_devcode: 0x82,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj88
        };
        var obj27 = {
            AVRPart: "AT90USB646",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj86
        };
        var obj26 = {
            AVRPart: "AT90USB647",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj86
        };
        var obj25 = {
            AVRPart: "ATmega1284",
            chipEraseDelay: 55000,
            stk500_devcode: 0x82,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj89
        };
        var obj24 = {
            AVRPart: "ATmega32U4",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj84
        };
        var obj23 = {
            AVRPart: "ATmega1284P",
            chipEraseDelay: 55000,
            stk500_devcode: 0x82,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj89
        };
        var obj22 = {
            AVRPart: "ATmega640",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj83
        };
        var obj21 = {
            AVRPart: "ATmega64RFR2",
            chipEraseDelay: 55000,
            stk500_devcode: 0xb2,
            pagel: 0xd7,
            bs2: 0xe2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj85
        };
        var obj20 = {
            AVRPart: "ATmega644RFR2",
            chipEraseDelay: 55000,
            stk500_devcode: 0xb2,
            pagel: 0xd7,
            bs2: 0xe2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj85
        };
        var obj19 = {
            AVRPart: "ATtiny261",
            chipEraseDelay: 4000,
            stk500_devcode: 0x00,
            pagel: 0xb3,
            bs2: 0xb2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj82
        };
        var obj18 = {
            AVRPart: "AT90USB1287",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj81
        };
        var obj17 = {
            AVRPart: "AT90USB1286",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj81
        };
        var obj16 = {
            AVRPart: "ATmega1280",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj80
        };
        var obj15 = {
            AVRPart: "ATmega1281",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj80
        };
        var obj14 = {
            AVRPart: "ATmega128RFR2",
            chipEraseDelay: 55000,
            stk500_devcode: 0xb2,
            pagel: 0xd7,
            bs2: 0xe2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj79
        };
        var obj13 = {
            AVRPart: "ATmega128RFA1",
            chipEraseDelay: 55000,
            stk500_devcode: 0xb2,
            pagel: 0xd7,
            bs2: 0xe2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj79
        };
        var obj12 = {
            AVRPart: "ATmega1284RFR2",
            chipEraseDelay: 55000,
            stk500_devcode: 0xb2,
            pagel: 0xd7,
            bs2: 0xe2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj79
        };
        var obj11 = {
            AVRPart: "ATtiny461",
            chipEraseDelay: 4000,
            stk500_devcode: 0x00,
            pagel: 0xb3,
            bs2: 0xb2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj74
        };
        var obj10 = {
            AVRPart: "AT90USB82",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            pagel: 0xd7,
            bs2: 0xc6,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj76
        };
        var obj9 = {
            AVRPart: "ATmega8U2",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            pagel: 0xd7,
            bs2: 0xc6,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj77
        };
        var obj8 = {
            AVRPart: "AT90USB162",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            pagel: 0xd7,
            bs2: 0xc6,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj75
        };
        var obj7 = {
            AVRPart: "ATmega32U2",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            pagel: 0xd7,
            bs2: 0xc6,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj78
        };
        var obj6 = {
            AVRPart: "ATmega16U2",
            chipEraseDelay: 9000,
            stk500_devcode: 0x00,
            pagel: 0xd7,
            bs2: 0xc6,
            resetDisposition: "possible i/o",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj75
        };
        var obj5 = {
            AVRPart: "ATtiny861",
            chipEraseDelay: 4000,
            stk500_devcode: 0x00,
            pagel: 0xb3,
            bs2: 0xb2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj422,
            memory: obj73
        };
        var obj4 = {
            AVRPart: "ATmega2560",
            chipEraseDelay: 9000,
            stk500_devcode: 0xb2,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj68
        };
        var obj3 = {
            AVRPart: "ATmega2561",
            chipEraseDelay: 9000,
            stk500_devcode: 0xb2,
            pagel: 0xd7,
            bs2: 0xa0,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj68
        };
        var obj2 = {
            AVRPart: "ATmega256RFR2",
            chipEraseDelay: 18500,
            stk500_devcode: 0xb2,
            pagel: 0xd7,
            bs2: 0xe2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj67
        };
        var obj1 = {
            AVRPart: "ATmega2564RFR2",
            chipEraseDelay: 18500,
            stk500_devcode: 0xb2,
            pagel: 0xd7,
            bs2: 0xe2,
            resetDisposition: "dedicated",
            retryPulse: "SCK",
            serialProgramMode: true,
            parallelProgramMode: true,
            pseudoparallelProgramMode: false,
            timeout: 200,
            stabDelay: 100,
            cmdExeDelay: 25,
            syncLoops: 32,
            pollIndex: 3,
            pollValue: 0x53,
            ops: obj423,
            memory: obj67
        };
        var obj0 = {
            uc3a0512: obj757,
            c128: obj29,
            c32: obj32,
            c64: obj31,
            pwm2: obj54,
            pwm2b: obj51,
            pwm3: obj53,
            pwm316: obj38,
            pwm3b: obj52,
            1200: obj157,
            2313: obj158,
            2333: obj143,
            2343: obj144,
            4414: obj156,
            4433: obj142,
            4434: obj145,
            8515: obj155,
            8535: obj141,
            usb1286: obj17,
            usb1287: obj18,
            usb162: obj8,
            usb646: obj27,
            usb647: obj26,
            usb82: obj10,
            m103: obj137,
            m128: obj116,
            m1280: obj16,
            m1281: obj15,
            m1284: obj25,
            m1284p: obj23,
            m1284rfr2: obj12,
            m128rfa1: obj13,
            m128rfr2: obj14,
            m16: obj113,
            m161: obj138,
            m162: obj36,
            m163: obj129,
            m164p: obj112,
            m168: obj41,
            m168p: obj40,
            m169: obj62,
            m16u2: obj6,
            m2560: obj4,
            m2561: obj3,
            m2564rfr2: obj1,
            m256rfr2: obj2,
            m32: obj114,
            m324p: obj34,
            m324pa: obj33,
            m325: obj66,
            m3250: obj65,
            m328: obj37,
            m328p: obj35,
            m329: obj47,
            m3290: obj46,
            m3290p: obj44,
            m329p: obj45,
            m32u2: obj7,
            m32u4: obj24,
            m406: obj742,
            m48: obj57,
            m48p: obj56,
            m64: obj117,
            m640: obj22,
            m644: obj30,
            m644p: obj28,
            m644rfr2: obj20,
            m645: obj64,
            m6450: obj63,
            m649: obj43,
            m6490: obj42,
            m64rfr2: obj21,
            m8: obj128,
            m8515: obj131,
            m8535: obj130,
            m88: obj49,
            m88p: obj48,
            m8u2: obj9,
            t10: obj744,
            t11: obj743,
            t12: obj139,
            t13: obj115,
            t15: obj140,
            t1634: obj39,
            t20: obj746,
            t2313: obj58,
            t24: obj61,
            t25: obj72,
            t26: obj127,
            t261: obj19,
            t4: obj748,
            t40: obj745,
            t4313: obj50,
            t43u: obj69,
            t44: obj60,
            t45: obj71,
            t461: obj11,
            t5: obj749,
            t84: obj59,
            t85: obj70,
            t861: obj5,
            t88: obj55,
            t9: obj747,
            x128a1: obj687,
            x128a1d: obj675,
            x128a1u: obj678,
            x128a3: obj685,
            x128a3u: obj681,
            x128a4: obj692,
            x128a4u: obj700,
            x128b1: obj683,
            x128b3: obj689,
            x128c3: obj710,
            x128d3: obj706,
            x128d4: obj708,
            x16a4: obj699,
            x16a4u: obj701,
            x16c4: obj714,
            x16d4: obj716,
            x16e5: obj713,
            x192a1: obj682,
            x192a3: obj688,
            x192a3u: obj680,
            x192c3: obj711,
            x192d3: obj704,
            x256a1: obj684,
            x256a3: obj686,
            x256a3b: obj679,
            x256a3bu: obj676,
            x256a3u: obj677,
            x256c3: obj702,
            x256d3: obj705,
            x32a4: obj698,
            x32a4u: obj707,
            x32c4: obj721,
            x32d4: obj719,
            x32e5: obj720,
            x384c3: obj709,
            x384d3: obj712,
            x64a1: obj694,
            x64a1u: obj691,
            x64a3: obj696,
            x64a3u: obj690,
            x64a4: obj695,
            x64a4u: obj703,
            x64b1: obj697,
            x64b3: obj693,
            x64c3: obj715,
            x64d3: obj718,
            x64d4: obj717,
            x8e5: obj722,
            ucr2: obj756,
        };
        // BEGIN PARTS
        module.exports = obj0


    }, {}],
    10: [function(require, module, exports) {
        var Stk500 = require('./protocols/stk500').STK500Transaction;
        var Stk500v2 = require('./protocols/stk500v2').STK500v2Transaction;
        var Avr109 = require('./protocols/butterfly').AVR109Transaction;
        var USBTiny = require('./protocols/usbtiny').USBTinyTransaction;
        var USBAsp = require('./protocols/usbtiny').USBAsp;

        module.exports.protocols = {
            stk500v2: Stk500v2,
            wiring: Stk500v2,
            stk500: Stk500v2,
            arduino: Stk500,
            stk500v1: Stk500,
            avr109: Avr109,
            usbtiny: USBTiny,
            usbasp: USBAsp
        };

    }, {
        "./protocols/butterfly": 11,
        "./protocols/stk500": 14,
        "./protocols/stk500v2": 15,
        "./protocols/usbtiny": 16
    }],
    11: [function(require, module, exports) {
        var SerialTransaction = require('./serialtransaction'),
            Log = require('./../logging').Log,
            log = new Log('avr109'),
            arraify = require('./../util').arraify,
            poll = require('./../util').poll,
            buffer = require("./../buffer"),
            errno = require("./../errno");

        function AVR109Transaction() {
            SerialTransaction.apply(this, arraify(arguments));

            this.AVR = {
                SOFTWARE_VERSION: 0x56,
                ENTER_PROGRAM_MODE: 0x50,
                LEAVE_PROGRAM_MODE: 0x4c,
                SET_ADDRESS: 0x41,
                WRITE: 0x42, // TODO: WRITE_PAGE
                TYPE_FLASH: 0x46,
                EXIT_BOOTLOADER: 0x45,
                CR: 0x0D,
                READ_PAGE: 0x67
            };

            this.timeouts = {
                magicBaudConnected: 2000,
                disconnectPollCount: 30,
                disconnectPoll: 100,
                pollingForDev: 500,
                finishWait: 2000,
                finishTimeout: 2000,
                finishPollForDev: 100,
                magicRetries: 3,
                magicRetryTimeout: 1000
            };
            this.initialDev = null;
            this.log = log;
            this.magicRetries = 0;

            var oldErrCb = this.errCb,
                self = this;

            this.errCb = function(varArgs) {
                // A desperate attempt not to block the device
                if (self.connectionId) {
                    log.log("Emergency exiting program mode.");
                    self.serial.send(self.connectionId, [self.AVR.LEAVE_PROGRAM_MODE, self.AVR.EXIT_BOOTLOADER],
                        function() {});
                } else {
                    log.log("No connectionid, cannot emergency exit program mode.");
                }
                oldErrCb.apply(self, arraify(arguments));
            };
        }

        AVR109Transaction.prototype = new SerialTransaction();

        AVR109Transaction.prototype.writeThenRead = function(data, rcvSize, cb) {
            this.writeThenRead_({
                outgoingMsg: data,
                expectedBytes: rcvSize,
                ttl: 500,
                callback: cb,
                timeoutCb: this.errCb.bind(this,
                    errno.READER_TIMEOUT,
                    "AVR109 reader failed timeout")
            });
        };

        // Retry connecting with the magic baudrate that kicks off the
        // bootloader and then reconnecting when the device reappears.
        AVR109Transaction.prototype.magicRetry = function(devName, hexData) {
            var self = this;
            log.log("Device", devName, "did not disappear, trying again in",
                this.timeouts.magicRetryTimeout, "ms(" +
                self.magicRetries + "/" + self.timeouts.magicRetries + ")");

            if (++self.magicRetries < self.timeouts.magicRetries)
                setTimeout(
                    self.transitionCb('magicBaudReset', devName, hexData),
                    this.timeouts.magicRetryTimeout);
        };


        AVR109Transaction.prototype.checkDisappearance = function(devName, connectInfo, iniDevices, next) {
            var self = this;
            this.serial.getDevices(function(disDevices) {
                log.log("To proceed looking for", devName, "not in",
                    disDevices.map(function(d) {
                        return d.path;
                    }));

                if (disDevices.some(function(d) {
                        return d.path == devName;
                    })) {
                    log.log("Leonardo did not disappear after reset. Will poll for it");
                    next();
                    return;
                }

                self.transition(
                    'waitForDeviceAndConnectSensible',
                    connectInfo,
                    iniDevices,
                    disDevices, (new Date().getTime()) + 5000, (new Date().getTime()) + 10000,
                    self.transitionCb('connectDone'));
            });
        }


        AVR109Transaction.prototype.magicBaudReset = function(devName, hexData) {
            var kMagicBaudRate = 1200,
                oldDevices = [],
                self = this;

            self.hexData = hexData;
            self.serial.getDevices(function(iniDevices) {
                self.refreshTimeout();

                // Magic connect
                self.serial.connect(devName, {
                    bitrate: kMagicBaudRate,
                    name: devName
                }, function(connectInfo) {
                    log.log("Made sentinel connection: (baud: 1200)", connectInfo,
                        "waiting", self.timeouts.magicBaudConnected, "ms");
                    if (!connectInfo) {
                        self.errCb(errno.LEONARDO_MAGIC_CONNECT_FAIL,
                            "Failed to connect with magic baud 1200");
                        return;
                    }

                    self.initialDev = devName;
                    setTimeout(function() {
                        log.log("Disconnecting from " + devName);
                        self.serial.disconnect(connectInfo.connectionId, function(ok) {
                            if (!ok) {
                                self.errCb(errno.LEONARDO_MAGIC_DISCONNECT_FAIL, "Failed to disconnect from " + devName);
                                return;
                            }

                            log.log("Disconnected from", devName);

                            // Poll for the device to reappear
                            poll(self.timeouts.disconnectPollCount,
                                self.timeouts.disconnectPoll,
                                self.transitionCb("checkDisappearance",
                                    devName, connectInfo, iniDevices),
                                self.transitionCb('magicRetry', devName, hexData));

                        });
                    }, self.timeouts.magicBaudConnected);
                });
            });
        };

        AVR109Transaction.prototype.flash = function(devName, hexData) {
            this.refreshTimeout();
            this.sketchData = hexData;
            this.destroyOtherConnections(
                devName,
                this.transitionCb('magicBaudReset', devName, hexData));
        };

        // Poll for the device to reconnect.
        AVR109Transaction.prototype.waitForDeviceAndConnectSensible =
            function(dev, iniDevices, disDevices, earlyDeadline, finalDeadline, cb) {
                var found = false,
                    self = this;


                if ((new Date().getTime()) > finalDeadline) {
                    log.error("Waited too long for something like", dev.name);
                    return;
                }


                self.serial.getDevices(function(newDevices) {
                    var newNames = newDevices.map(function(d) {
                            return d.path;
                        }).sort(),
                        oldNames = disDevices.map(function(d) {
                            return d.path;
                        }).sort(),
                        iniNames = iniDevices.map(function(d) {
                            return d.path;
                        }).sort();

                    // Wait for anything you have never seen before which on well
                    // functioning systems (not Windows) comes from disDevices
                    log.log("Waiting for reapearance");
                    log.log("New devs:", newNames);
                    log.log("After disconnect:", oldNames);
                    log.log("Initial:", iniNames);

                    function newName(ar1, ar2) {
                        for (var i = 0; i < ar1.length; i++) {
                            if (ar2.indexOf(ar1[i]) == -1) {
                                return ar1[i];
                            }
                        }
                        return null;
                    };

                    var newDev = newName(newNames, oldNames) || newName(newNames, iniNames);
                    if (newDev) {
                        log.log("Aha! new device", newDev, "connecting (baud 57600)");
                        self.refreshTimeout();
                        self.serial.connect(newDev, {
                            bitrate: self.config.speed,
                            name: newDev
                        }, cb);
                        return;
                    }

                    setTimeout(function() {
                        self.transition("waitForDeviceAndConnectSensible",
                            dev, iniDevices, disDevices,
                            earlyDeadline, finalDeadline, cb);
                    }, self.timeouts.pollingForDev);
                });
            };

        // Poll for the device to reconnect.
        AVR109Transaction.prototype.waitForDeviceAndConnectArduinoIDE =
            function(dev, iniDevices, disDevices, earlyDeadline, finalDeadline, cb) {
                if (new Date().getTime() > finalDeadline) {
                    log.error("Waited too long for for a port to appear");
                    return;
                }

                var found = false,
                    self = this,
                    success = function(dev) {
                        self.refreshTimeout();
                        self.serial.connect(dev, {
                            bitrate: self.config.speed,
                            name: dev
                        }, cb);
                    };
                self.serial.getDevices(function(newDevices) {
                    var newNames = newDevices.map(function(d) {
                            return dev.name;
                        }).sort(),
                        oldNames = disDevices.map(function(d) {
                            return dev.name;
                        }).sort();
                    log.log("Waiting for new device:", oldNames, newNames);
                    // XXX: arduino ide actually does it like this but it really
                    // makes absolutely no sense:
                    // oldNames = iniDevices.map(function (d) {return dev.name;}).sort();

                    // Python style zip
                    function zip(arrays) {
                        return arrays[0].map(function(_, i) {
                            return arrays.map(function(array) {
                                return array[i];
                            });
                        });
                    }

                    var newDev = zip([newNames, oldNames]).filter(function(pair) {
                        return pair[0] != pair[1];
                    })[0];

                    if (newDev) {
                        log.log("Aha! new device", newDev[0], "connecting (baud 57600)");
                        success(newDev[0]);
                        return;
                    }

                    if ((new Date().getTime()) > earlyDeadline &&
                        newNames.indexOf(dev.name) != -1) {
                        log.log("Early deadline success: found original device");
                        success(dev.name);
                        return;
                    }

                    setTimeout(function() {
                        self.transition("waitForDeviceAndConnectArduinoIDE",
                            dev, iniDevices, disDevices,
                            earlyDeadline, finalDeadline, cb);
                    }, self.timeouts.pollingForDev);
                });
            };


        AVR109Transaction.prototype.connectDone = function(connectArg) {
            if (typeof(connectArg) == "undefined" ||
                typeof(connectArg.connectionId) == "undefined" ||
                connectArg.connectionId == -1) {
                log.error("(AVR) Bad connectionId / Couldn't connect to board");
                return;
            }

            log.log("Connected to board. ID: " + connectArg.connectionId);
            this.connectionId = connectArg.connectionId;
            this.buffer.drain(this.transitionCb('drainBytes'));
        };

        AVR109Transaction.prototype.programmingDone = function() {
            var self = this;
            this.writeThenRead([this.AVR.LEAVE_PROGRAM_MODE], 1, function(payload) {
                self.writeThenRead([self.AVR.EXIT_BOOTLOADER], 1, function(payload) {
                    self.cleanup(function() {
                        setTimeout(function() {
                            self.pollForInitialDevice(
                                (new Date().getTime()) +
                                self.timeouts.finishTimeout,
                                function() {
                                    self.initialDev = null;
                                    self.finishCallback("Done programming");
                                });
                        }, self.timeouts.finishWait);
                    });
                });
            });
        };

        AVR109Transaction.prototype.pollForInitialDevice = function(deadline, cb) {
            var self = this;
            if ((new Date().getTime()) > deadline) {
                self.errCb(errno.LEONARDO_RECONNECT_TIMEOUT,
                    "Waited too long for device ", self.initialDev, " after flashing");
                return;
            }

            self.serial.getDevices(function(devs) {
                if (!devs.some(function(d) {
                        return d.path == self.initialDev;
                    })) {
                    log.log(self.initialDev, " not in ", devs.map(function(d) {
                        return d.path;
                    }));
                    setTimeout(self.pollForInitialDevice.bind(self, deadline, cb),
                        self.timeouts.finishPollForDev);
                } else
                    cb();
            });
        };

        AVR109Transaction.prototype.drainBytes = function(readArg) {
            var self = this;
            this.buffer.drain(function() {
                // Start the protocol
                self.writeThenRead([self.AVR.SOFTWARE_VERSION], 2, self.transitionCb('prepareToProgramFlash'));
            });
        };

        // Program to byte 0;
        AVR109Transaction.prototype.prepareToProgramFlash = function() {
            var self = this,
                addressBytes = buffer.storeAsTwoBytes(self.config.offset || 0),
                loadAddressMessage = [
                    this.AVR.SET_ADDRESS, addressBytes[1], addressBytes[0]
                ];

            this.writeThenRead(loadAddressMessage, 1, function(response) {
                self.transition('programFlash', 0,
                    self.config.avrdude.memory.flash.page_size);
            });
        };

        AVR109Transaction.prototype.programFlash = function(offset, length) {

            // Butterfly does not send addresses, just the chuncs in sequence.
            var data = this.sketchData.data || this.sketchData,
                self = this;
            log.log("program flash: data.length: " + data.length + ", offset: " + offset + ", length: " + length);

            if (offset >= data.length) {
                this.transition('programmingDone');
                return;
            }

            var payload = this.padOrSlice(data, offset, length),
                sizeBytes = buffer.storeAsTwoBytes(length),
                programMessage = [
                    this.AVR.WRITE, sizeBytes[0], sizeBytes[1], this.AVR.TYPE_FLASH
                ]
                .concat(payload);

            this.writeThenRead(programMessage, 1,
                // XXX: check respeonse.
                self.transitionCb('programFlash', offset + length, length)
            );
        };

        module.exports.AVR109Transaction = AVR109Transaction;

    }, {
        "./../buffer": 5,
        "./../errno": 6,
        "./../logging": 8,
        "./../util": 19,
        "./serialtransaction": 13
    }],
    12: [function(require, module, exports) {
        var util = require('./../util');

        // A op to an array of bytes. Optional parameter param is an object
        // with keys corresponding to avrdude.conf's bitTypes. Some of them
        //
        // - ADDRESS
        //
        function opToBin(op, param) {
            var ret = [];
            param = param || {};
            for (var i = 0; i < Math.ceil(op.length / 8); i++)
                ret.push(0x0);

            op.forEach(function(bitStruct, index) {
                var bit = bitStruct.instBit % 8,
                    byte = Math.floor(bitStruct.instBit / 8);
                if (bitStruct.bitType == "VALUE") {
                    ret[byte] |= bitStruct.value << bit;
                } else {
                    var val = (param[bitStruct.bitType] >> bitStruct.bitNo & 0x01);
                    ret[byte] |= val << bit;
                }
            });

            return ret.reverse();
        }

        function intToByteArray(intData, bitNum) {
            return util.makeArrayOf(0, Math.ceil(bitNum / 8))
                .map(function(_, index) {
                    return (intData >> index * 8) & 0xff;
                });
        }

        function extractOpData(type, op, bin) {
            var retBits = 0,
                intData = op.reduce(function(ret, bitStruct, index) {
                    var bit = bitStruct.instBit % 8,
                        byte = Math.floor(bitStruct.instBit / 8),
                        byteMask = 1 << bit;

                    retBits = Math.max(retBits, bitStruct.bitNo + 1);

                    if (bitStruct.bitType == type) {
                        return ret | (((bin[byte] & byteMask) >> bit) << bitStruct.bitNo);
                    }

                    return ret;
                }, 0);

            return intToByteArray(intData, retBits);
        }

        module.exports.extractOpData = extractOpData;
        module.exports.opToBin = opToBin;

    }, {
        "./../util": 19
    }],
    13: [function(require, module, exports) {
        var _create_chrome_client = require('./../../../chrome-extension/client/rpc-client'),
            Transaction = require('./../transaction').Transaction,
            arraify = require('./../util').arraify,
            forEachWithCallback = require('./../util').forEachWithCallback,
            MemoryOperations = require('./memops'),
            buffer = require("./../buffer"),
            errno = require("./../errno");

        function SerialTransaction(config, finishCallback, errorCallback) {
            Transaction.apply(this, arraify(arguments));
            this.init();
        }

        SerialTransaction.prototype = new Transaction();

        SerialTransaction.prototype.init = function() {
            if (Transaction.prototype.init)
                Transaction.prototype.init.apply(this, arraify(arguments, 2));

            this.buffer = new buffer.Buffer();
            this.serial = chrome.serial;

            this.serial.customErrorHandler = this.errCb.bind(this, 1);
            this.block = false;
        };

        // Called by the transaction cleanup
        SerialTransaction.prototype.localCleanup = function(callback) {
            var self = this;

            self.serial.customErrorHandler = null;
            if (this.listenerHandler) {
                this.serial.onReceive.removeListener(this.listenerHandler);
            }

            this.listenerHandler = null;
            if (this.connectionId) {
                this.serial.disconnect(this.connectionId, function(ok) {
                    if (!ok) {
                        self.log.warn("Failed to disconnect (id:", self.connectionId,
                            ") during cleanup");
                    }

                    self.log.log("Disconnected ", self.connectionId);
                    self.conenctionId = null;
                    self.buffer.cleanup(callback);
                });
                return;
            }

            callback();
        };

        // Info is:
        // - outgoingMsg: byte array
        // - besides this passed as a reader config
        // callback is what to do with the data
        SerialTransaction.prototype.writeThenRead_ = function(info) {
            if (this.previousErrors.length > 0) {
                this.errCb(errno.ZOMBIE_TRANSACTION,
                    "Transaction was stopped with errors but continues to run");
                return;
            }

            var self = this;

            self.refreshTimeout();
            if (!self.registeredBufferListener) {
                // Redirect all device output to the buffer.
                self.registeredBufferListener = true;
                this.listenerHandler = this.readToBuffer.bind(this);
                this.serial.onReceive.addListener(this.listenerHandler);
                this.log.log("Listening on buffer...");
            }

            this.justWrite(info.outgoingMsg, function() {
                self.buffer.readAsync(info);
            });
        };


        SerialTransaction.prototype.justWrite = function(data, cb) {
            this.log.log("Writing: " + buffer.hexRep(data));
            var dataBuf = buffer.binToBuf(data),
                self = this;

            this.serial.send(this.connectionId, dataBuf, function(writeArg) {
                if (!writeArg) self.errCb(errno.CONNECTION_LOST, "Connection lost");

                // XXX: turns out flush means tcflush not fflush, ie discard the
                // buffers, not write any pending writes. This is probably never
                // what we mean.
                if (0 && !self.config.disableFlushing)
                    self.serial.flush(self.connectionId, function(ok) {
                        if (!ok) {
                            self.errCb(errno.FLUSH_FAIL, 'Failed to flush');
                            return;
                        }

                        cb();
                    });
                else
                    cb();
            });
        };

        SerialTransaction.prototype.readToBuffer = function(readArg) {
            if (this.connectionId != readArg.connectionId) {
                return true;
            }

            this.log.log("Read:", buffer.hexRep(buffer.bufToBin(readArg.data)));
            this.buffer.write(readArg, this.errCb.bind(this, errno.BUFFER_WRITE_FAIL));

            // Note that in BabelFish this does not ensure that the listener
            // stops.
            return false;
        };

        SerialTransaction.prototype.destroyOtherConnections = function(name, cb) {
            var self = this;
            this.serial.getConnections(function(cnx) {
                if (cnx.length == 0) {
                    cb();
                } else {
                    forEachWithCallback(cnx, function(c, next) {
                        if (c.name != name)
                            next();
                        else {
                            self.log.log("Closing connection ", c.connectionId);
                            self.serial.flush(c.connectionId, function() {
                                self.serial.disconnect(c.connectionId, function(ok) {
                                    if (!ok) {
                                        self.errCb(errno.FORCE_DISCONNECT_FAIL, "Failed to close connection ", c.connectionId);
                                    } else {
                                        self.log.log('Destroying connection:', c.connectionId);
                                        self.serial.onReceiveError.forceDispatch({
                                            connectionId: c.connectionId,
                                            error: "device_lost"
                                        });
                                        next();
                                    }
                                });
                            });
                        }
                    }, cb);
                }
            });
        };

        // Retries were introduced because in some boards if signals are set
        // too soon after connection, the callback is just not called.
        SerialTransaction.prototype.setDtr = function(timeout, val, cb, _retries) {
            var self = this;


            setTimeout(function() {
                var waitTooLong = setTimeout(function() {
                    if (_retries) {
                        self.setDtr(timeout, val, cb, _retries - 1);
                        return;
                    }

                    self.errCb(1, "Waited too long to set DTR.");
                }, 50);

                self.log.log("Setting DTR/DTS to", val);
                self.serial.setControlSignals(
                    self.connectionId, {
                        dtr: val,
                        rts: val
                    },
                    function(ok) {
                        clearTimeout(waitTooLong);

                        if (!ok) {
                            self.errCb(errno.DTR_RTS_FAIL, "Failed to set flags");
                            return;
                        }
                        self.log.log("DTR/RTS set to", val);
                        cb();
                    });
            }, timeout);
        };

        SerialTransaction.prototype.twiggleDtrMaybe = function(cb, _cbArgs) {
            var args = arraify(arguments, 1),
                self = this,
                before = false, //AVRDUDE always disables the line
                after = !before;

            if (this.config.avoidTwiggleDTR) {
                setTimeout(cb);
                return;
            }

            self.serial.getControlSignals(self.connectionId, function(signals) {
                self.log.log("Signals are:", signals);
                self.setDtr(250, before, function() {
                    self.setDtr(500, after, cb);
                });
            });
        };

        SerialTransaction.prototype.cmdChain = function(chain, cb) {
            if (chain.length == 0) {
                cb();
                return;
            }
            this.cmd(chain.shift(), this.cmdChain.bind(this, chain, cb));
        };

        module.exports = SerialTransaction;

    }, {
        "./../../../chrome-extension/client/rpc-client": 1,
        "./../buffer": 5,
        "./../errno": 6,
        "./../transaction": 18,
        "./../util": 19,
        "./memops": 12
    }],
    14: [function(require, module, exports) {
        var SerialTransaction = require('./serialtransaction'),
            Log = require('./../logging').Log,
            log = new Log('STK500'),
            arraify = require('./../util').arraify,
            buffer = require("./../buffer.js"),
            errno = require("./../errno");

        function STK500Transaction() {
            this.log = log;
            SerialTransaction.apply(this, arraify(arguments));

            this.STK = {
                OK: 0x10,
                INSYNC: 0x14,
                CRC_EOP: 0x20,
                GET_SYNC: 0x30,
                GET_PARAMETER: 0x41,
                ENTER_PROGMODE: 0x50,
                LEAVE_PROGMODE: 0x51,
                LOAD_ADDRESS: 0x55,
                UNIVERSAL: 0x56,
                PROG_PAGE: 0x64,
                READ_PAGE: 0x74,
                READ_SIGN: 0x75,
                HW_VER: 0x80,
                SW_VER_MINOR: 0x82,
                SW_VER_MAJOR: 0x81,
                SET_DEVICE: 0x42,
                SET_DEVICE_EXT: 0x45
            };
            this.maxMessageRetries = 4;
        }

        STK500Transaction.prototype = new SerialTransaction;


        // Keywrod arguments are
        //
        // - retryCount: the number of retries allowed.
        //
        // - minPureData: the minimum amount of data we expect. This is useful
        //   becaus we may get a character that by chance was the delimiter but
        //   the message was not finished.
        //
        // - retryCb: the callback to be called when retrying. Default to
        //   writeThenRead with the same arguments as before (except for
        //   minPureData that is decremented). This callback accepts a single
        //   argument that is the number of remaining retries.
        STK500Transaction.prototype.writeThenRead = function(data, cb, kwargs) {
            kwargs = kwargs || {};

            var self = this,
                minPureData = kwargs.minPureData || 0,
                retryCount = typeof kwargs.retryCount !== 'undefined' ?
                kwargs.retryCount : this.maxMessageRetries,
                defaultRetryCb = function(retryCount) {
                    kwargs.retryCount = retryCount;
                    self.writeThenRead(data, cb, kwargs);
                },
                retryCb = (kwargs.retryCb || defaultRetryCb).bind(null, retryCount - 1);

            // ATTENTION: This is passed as the reader of this function
            function modifyDatabuffer() {
                log.log("Minimum data length for reader:", minPureData + 2,
                    "(current buffer:", this.buffer.databuffer.length, ")");

                // The weird binding of the reader.
                var reader = this,
                    start = reader.buffer.databuffer
                    .indexOf(self.STK.INSYNC);

                // XXX: In some rare cases we dont get the 2nd byte for some
                // reason. This is definintely a bug but I can't figure out from
                // where. This happens for larger sketches. Patches welcome.
                if (reader.buffer.databuffer.length == 1 && reader.buffer[0] == self.STK.OK) {
                    log.warn("Bad message. I can handle it but this is a bug.");
                    reader.buffer.databuffer = [];
                    cb();
                    return true;
                }

                if (start < 0) {
                    reader.buffer.databuffer = [];
                    return false;
                };

                // Everything before start is garbadge
                reader.buffer.databuffer = reader.buffer.databuffer.slice(start);
                // Skip the data that is minimally essential
                var end = reader.buffer.databuffer.slice(minPureData + 1).indexOf(self.STK.OK);

                if (end < 0) return false;

                // We skipped the minimally essential data so take it back as well
                // as the final byte.
                end += minPureData + 2;

                // Don't include the packet head and tail
                var db = reader.buffer.databuffer;
                reader.buffer.databuffer = reader.buffer.databuffer.slice(end);
                setTimeout(function() {
                    cb(db.slice(1, end - 1));
                });

                return true;
            }

            function retryThenErrcb() {
                // When we fail retry
                if (retryCount == 0) {
                    self.errCb(errno.READER_TIMEOUT, "STK read timed out");
                    return;
                }
                self.buffer.drain(retryCb);
            }

            this.writeThenRead_({
                outgoingMsg: data,
                modifyDatabuffer: modifyDatabuffer,
                callback: cb,
                ttl: 1000,
                willRetry: true,
                timeoutCb: retryThenErrcb
            });
        };

        STK500Transaction.prototype.initializationMsg = function(maj, min) {
            log.log("Dev major:", maj, "minor:", min);
            var defmem = {
                    readback: [0xff, 0xff],
                    pageSize: 0,
                    size: 0
                },
                flashmem = this.config.avrdude.memory.flash || defmem,
                eepromem = this.config.avrdude.memory.eeprom || defmem,
                extparams = {
                    pagel: this.config.avrdude.pagel || 0xd7,
                    bs2: this.config.avrdude.bs2 || 0xa0,
                    len: ((maj > 1) || ((maj == 1) && (min > 10))) ? 4 : 3
                },
                initMessage = [
                    // 0: SET_DEVICE
                    this.STK.SET_DEVICE,
                    // 1: config->devcode
                    this.config.avrdude.stk500_devcode || 0,
                    // 2: 0 // device revision
                    0,
                    // 3: !(parallel && serial programming)
                    (this.config.avrdude.serialProgramMode &&
                        this.config.avrdude.parallelProgramMode) ? 0 : 1,
                    // 4: !(parallel && pseudoparallel)
                    //   n_extparams -> 0 if pseudoparallel
                    (this.config.avrdude.pseudoparallelProgramMode &&
                        this.config.avrdude.parallelProgramMode) ? 0 : 1,
                    // 5: 1
                    1,
                    // 6: 1
                    1,
                    // 7: lock.size || 0
                    this.config.avrdude.memory.lock ?
                    this.config.avrdude.memory.lock.size : 0,
                    // 8: sum(fuse.size)
                    [
                        this.config.avrdude.memory.fuse,
                        this.config.avrdude.memory.hfuse,
                        this.config.avrdude.memory.lfuse,
                        this.config.avrdude.memory.efuse
                    ].reduce(function(res, b) {
                        return (res + (b ? b.size : 0));
                    }, 0),
                    // 9: readback[0] if flash or 0xff
                    flashmem.readback[0],
                    // 10: readback[1] if flash or 0xff
                    flashmem.readback[1],
                    // 11: eeprom readback
                    eepromem.readback[0],
                    // 12: eeprom readback
                    eepromem.readback[1],
                    // 13: (pageSize >> 8) &0xff
                    (flashmem.page_size >> 8) & 0xff,
                    // 14: pageSize & 0xff
                    flashmem.page_size & 0xff,
                    // 15: eeprom equiv
                    (eepromem.size >> 8) & 0xff,
                    // 16: eeprom equiv
                    eepromem.size & 0xff,
                    // 17: size >> 24
                    (flashmem.size >> 24) & 0xff,
                    // 18: size >> 16
                    (flashmem.size >> 16) & 0xff,
                    // 19: size >> 8
                    (flashmem.size >> 8) & 0xff,
                    // 20: size
                    flashmem.size & 0xff,
                    // 21: EOP
                    this.STK.CRC_EOP
                ],
                extparamArray = [
                    this.STK.SET_DEVICE_EXT,
                    extparams.len + 1,
                    this.config.avrdude.memory.eeprom ?
                    this.config.avrdude.memory.eeprom.page_size : 0,
                    extparams.pagel,
                    extparams.bs2,
                    this.config.avrdude.resetDisposition == "dedicated" ? 0 : 1,
                ].slice(0, extparams.len + 2)
                .concat(this.STK.CRC_EOP);

            return [initMessage, extparamArray];
        };

        // Cb should have the 'state' format, ie function (data)
        STK500Transaction.prototype.cmd = function(cmd, cb) {
            // Always get a 4byte answer
            log.log("Running command:", cmd);
            this.writeThenRead([this.STK.UNIVERSAL]
                .concat(cmd)
                .concat([this.STK.CRC_EOP]), cb);
        };

        STK500Transaction.prototype.flash = function(deviceName, sketchData) {
            this.refreshTimeout();
            this.sketchData = {
                data: sketchData.data || sketchData,
                addr: sketchData.addr || this.config.offset || 0
            };
            log.log("Flashing. Config is:", this.config, "data:", this.sketchData);
            var self = this,
                connectCb = function(connArg) {
                    log.log("Connected to device");
                    // Make sure the API's response is good.
                    if (typeof(connArg) == "undefined" ||
                        typeof(connArg.connectionId) == "undefined" ||
                        connArg.connectionId == -1) {
                        self.errCb(errno.CONNECTION_FAIL,
                            "Bad connectionId / Couldn't connect to board");
                        return;
                    }

                    self.connectionId = connArg.connectionId;
                    self.transition('connectDone', connArg);
                };

            self.serial.connect(deviceName, {
                    bitrate: self.config.speed,
                    name: deviceName
                },
                connectCb);
        };

        STK500Transaction.prototype.connectDone = function(connectArg) {
            var self = this;
            log.log("Connected to board:", connectArg);
            if (connectArg.connectionId)
            // Mega hack
                this.justWrite([this.STK.GET_SYNC, this.STK.CRC_EOP], function() {
                self.buffer.drain(function() {
                    self.twiggleDtrMaybe(function() {
                        self.writeThenRead([self.STK.GET_SYNC, self.STK.CRC_EOP],
                            self.transitionCb('inSyncWithBoard'));
                    });
                });
            });
        };
        STK500Transaction.prototype.inSyncWithBoard = function(data) {
            this.inSync_ = true;
            this.writeThenRead([this.STK.GET_PARAMETER, this.STK.HW_VER, this.STK.CRC_EOP],
                this.transitionCb('readHardwareVersion'));
        };

        STK500Transaction.prototype.readHardwareVersion = function(data) {
            this.writeThenRead([this.STK.GET_PARAMETER,
                    this.STK.HW_VER,
                    this.STK.CRC_EOP
                ],
                this.transitionCb('maybeReadSoftwareVersion'));
        };


        STK500Transaction.prototype.maybeReadSoftwareVersion = function(data) {
            var self = this;
            if (!this.config.readSwVersion) {
                self.transition('enterProgmode');
                return;
            }

            this.writeThenRead(
                [this.STK.GET_PARAMETER,
                    this.STK.SW_VER_MAJOR,
                    this.STK.CRC_EOP
                ],
                function(major) {

                    self.writeThenRead(
                        [self.STK.GET_PARAMETER,
                            self.STK.SW_VER_MINOR,
                            self.STK.CRC_EOP
                        ],
                        function(minor) {
                            var initMsgs = self.initializationMsg(major[0], minor[0]);
                            self.writeThenRead(
                                initMsgs[0],
                                function(data) {
                                    self.writeThenRead(initMsgs[1], self.transitionCb('enterProgmode'));
                                });
                        });
                });
        };

        STK500Transaction.prototype.enterProgmode = function(data) {
            var self = this,
                enterProgmodeLocal = function(cb) {
                    self.writeThenRead([self.STK.ENTER_PROGMODE, self.STK.CRC_EOP], cb);
                },
                cont = this.transitionCb('programFlash',
                    this.config.avrdude.memory.flash.page_size,
                    null);

            enterProgmodeLocal(this.config.chipErase ?
                this.chipErase.bind(this, enterProgmodeLocal.bind(null, cont)) :
                cont);
        };

        // confirmPages is an array of functions that each checks the pages
        // already written.
        STK500Transaction.prototype.programFlash = function(pgSize, dataOffset,
            confirmPages) {
            var self = this,
                data = this.sketchData.data,
                memOffset = this.sketchData.addr;
            if (dataOffset === null)
                dataOffset = 0;

            confirmPages = confirmPages || [];

            log.log("program flash: data.length: ", data.length,
                ", data offset: ", dataOffset,
                ", memory offset: ", memOffset + dataOffset,
                ", page size: ", pgSize);

            if (dataOffset >= data.length) {
                log.log("Done programming flash: ", dataOffset, " vs. " + data.length);
                if (this.config.confirmPages) {
                    // XXX: this drains, doesnt run readers, we really want sync.
                    self.writeThenRead([self.STK.GET_SYNC, self.STK.CRC_EOP],
                        this.transitionCb('confirmPages', confirmPages));
                } else {
                    this.transition('doneProgramming');
                }
                return;
            }

            var payload = data.slice(dataOffset, dataOffset + pgSize),
                addressBytes = buffer.storeAsTwoBytes((memOffset + dataOffset) / 2),
                sizeBytes = buffer.storeAsTwoBytes(payload.length),
                kFlashMemoryType = 0x46; // ord('F')

            var loadAddressMessage = [
                    this.STK.LOAD_ADDRESS, addressBytes[1], addressBytes[0], this.STK.CRC_EOP
                ],
                programMessage = [
                    this.STK.PROG_PAGE, sizeBytes[0], sizeBytes[1], kFlashMemoryType
                ]
                .concat(payload).concat([this.STK.CRC_EOP]),
                readPage = [this.STK.READ_PAGE, sizeBytes[0], sizeBytes[1],
                    kFlashMemoryType, this.STK.CRC_EOP
                ];

            // Check the current page and call cb if it is fine.
            function checkPage(cb, retryCount) {
                var badByte = -1,
                    isBadByte = function(b, i) {
                        if (b != payload[i]) {
                            badByte = i;
                            return true;
                        } else {
                            return false;
                        }
                    };

                self.writeThenRead(loadAddressMessage, function() {
                    self.writeThenRead(readPage, function(chkData) {

                        log.log("Checking page [", dataOffset / pgSize, "/",
                            Math.ceil(data.length / pgSize), "]:", buffer.hexRep(chkData));
                        if (chkData.some(isBadByte)) {
                            if (chkData.length == payload.length)
                                self.errCb(1, "Page confirmation failed. Page:",
                                    dataOffset / pgSize, "byte:", badByte,
                                    "(", chkData[badByte], "!=", payload[badByte], ")");
                            else
                                self.errCb(1, "Page confirmation failed. Expected len:",
                                    payload.length, "but got:", chkData.length);

                            return;
                        } else {
                            cb();
                        }
                    }, {
                        minPureData: payload.length,
                        retryCount: retryCount,
                        retryCb: function(retryCount) {
                            setTimeout(function() {
                                self.writeThenRead([self.STK.GET_SYNC, self.STK.CRC_EOP], function() {
                                    checkPage(cb, retryCount);
                                }, 1000);
                            });
                        }
                    });
                });
            }


            function writePage(retryCount) {
                log.log("Writing page [", dataOffset / pgSize, "/",
                    Math.ceil(data.length / pgSize), "]:", buffer.hexRep(payload));

                self.writeThenRead(loadAddressMessage, function() {
                    self.writeThenRead(programMessage, function() {
                        setTimeout(function() {
                            self.transition('programFlash', pgSize, dataOffset + pgSize,
                                confirmPages.concat([checkPage]));
                        }, Math.ceil(self.config.avrdude.memory.flash.max_write_delay / 1000));
                    }, {
                        retryCount: retryCount,
                        retryCb: function(retryCount) {
                            setTimeout(function() {
                                self.writeThenRead([self.STK.GET_SYNC, self.STK.CRC_EOP], function() {
                                    writePage(retryCount);
                                }, 1000);
                            });
                        }
                    });
                });
            }

            writePage();
        };

        // confirmPagesCbs an array of functions accepting a callback that
        // each checks a written page.
        STK500Transaction.prototype.confirmPages = function(confirmPagesCbs) {
            var self = this,
                ccb = confirmPagesCbs[0];
            if (ccb) {
                ccb(this.transitionCb('confirmPages', confirmPagesCbs.slice(1)));
            } else {
                this.transition('doneProgramming');
            }
        };

        STK500Transaction.prototype.doneProgramming = function() {
            this.sketchData = null;
            var self = this;
            this.setupSpecialBits(this.config.cleanControlBits, function() {
                self.writeThenRead([self.STK.LEAVE_PROGMODE, self.STK.CRC_EOP],
                    self.transitionCb('leftProgmode'));
            });
        };

        STK500Transaction.prototype.leftProgmode = function(data) {
            var self = this;
            this.cleanup(this.finishCallback);
        };

        // Ignore the intermediate values of the chain and call cb at the
        // end. defaultArg is the default data to be passed to the cb.
        STK500Transaction.prototype.chainWrites = function(chain, cb, defaultArg) {
            var self = this;
            if (chain.length == 0) {
                cb(defaultArg);
                return;
            };

            this.writeThenRead(chain[0], function(data) {
                self.chainWrites(chain.slice(1), cb, data);
            });
        };

        module.exports.STK500Transaction = STK500Transaction;

    }, {
        "./../buffer.js": 5,
        "./../errno": 6,
        "./../logging": 8,
        "./../util": 19,
        "./serialtransaction": 13
    }],
    15: [function(require, module, exports) {
        // http://www.atmel.com/Images/doc2591.pdf

        var SerialTransaction = require('./serialtransaction'),
            Log = require('./../logging').Log,
            log = new Log('STK500v2'),
            arraify = require('./../util').arraify,
            zip = require('./../util').zip,
            buffer = require("./../buffer"),
            errno = require("./../errno");


        // The workflow is such (see pinocc.io for details):
        //
        // - close all connections
        // - connect 115200 [serialopen, drain, set/unset getsync: (CMD_SIGN_ON ->, CMD_SIGN_ON CMD_OK chipname[30]), drain]
        // - set/unset control signals with 250ms interval
        // - enter progmode and configure device
        // - write binary data [send address, send byte series]
        // - exit bootloader with 0x11, 0x01 0x01 [CMD_LEAVE_PROGMODE_ISP, predelay, postdelay]
        // - close connections
        //

        // And then there is chip erase
        // Writing does checksums first
        // Reading is also done in packets
        function STK500v2Transaction() {
            SerialTransaction.apply(this, arraify(arguments));

            this.STK2 = {
                CMD_SIGN_ON: 0x01,
                CMD_SET_PARAMETER: 0x02,
                CMD_GET_PARAMETER: 0x03,
                CMD_SET_DEVICE_PARAMETERS: 0x04,
                CMD_OSCCAL: 0x05,
                CMD_LOAD_ADDRESS: 0x06,
                CMD_FIRMWARE_UPGRADE: 0x07,
                CMD_CHECK_TARGET_CONNECTION: 0x0D,
                CMD_LOAD_RC_ID_TABLE: 0x0E,
                CMD_LOAD_EC_ID_TABLE: 0x0F,

                CMD_ENTER_PROGMODE_ISP: 0x10,
                CMD_LEAVE_PROGMODE_ISP: 0x11,
                CMD_CHIP_ERASE_ISP: 0x12,
                CMD_PROGRAM_FLASH_ISP: 0x13,
                CMD_READ_FLASH_ISP: 0x14,
                CMD_PROGRAM_EEPROM_ISP: 0x15,
                CMD_READ_EEPROM_ISP: 0x16,
                CMD_PROGRAM_FUSE_ISP: 0x17,
                CMD_READ_FUSE_ISP: 0x18,
                CMD_PROGRAM_LOCK_ISP: 0x19,
                CMD_READ_LOCK_ISP: 0x1A,
                CMD_READ_SIGNATURE_ISP: 0x1B,
                CMD_READ_OSCCAL_ISP: 0x1C,
                CMD_SPI_MULTI: 0x1D,

                CMD_XPROG: 0x50,
                CMD_XPROG_SETMODE: 0x51,

                // Success
                STATUS_CMD_OK: 0x00,

                // Warnings
                STATUS_CMD_TOUT: 0x80,
                STATUS_RDY_BSY_TOUT: 0x81,
                STATUS_SET_PARAM_MISSING: 0x82,

                // Errors
                STATUS_CMD_FAILED: 0xC0,
                STATUS_CKSUM_ERROR: 0xC1,
                STATUS_CMD_UNKNOWN: 0xC9,

                MESSAGE_START: 0x1B,
                TOKEN: 0x0E
            };

            this.log = log;
            this.cmdSeq = 1;
        }

        STK500v2Transaction.prototype = new SerialTransaction();

        // Consume message:
        // To retrieve the message first calculate the checksum
        // - [MESSAGE_START cmd_seq size1 size2 TOKEN data1 ... datan checksum===0]
        // Where checksum=msgBytes.reduce(xor)

        // Message may be
        // - CMD_XPROG_SETMODE XPROXPRG_ERR_{OK,FAILED,COLLISION,TIMEOUT}
        // - CMD_XPROG XPRG_CMD_* XPROXPRG_ERR_{OK,FAILED,COLLISION,TIMEOUT}
        //
        STK500v2Transaction.prototype.writeThenRead = function(data, cb, retries) {
            var self = this,
                size = buffer.storeAsTwoBytes(data.length),
                message = [self.STK2.MESSAGE_START,
                    self.cmdSeq,
                    size[0], size[1],
                    self.STK2.TOKEN,
                ].concat(data);
            message.push(message.reduce(function(a, b) {
                return a ^ b;
            }));

            if (retries === undefined) retries = 3;

            function modifyDatabuffer() {
                // The weird binding of the reader.
                var reader = this,
                    start = reader.buffer.databuffer
                    .indexOf(self.STK2.MESSAGE_START),
                    token = reader.buffer.databuffer
                    .indexOf(self.STK2.TOKEN);

                if (start < 0) {
                    log.log("Didn't find start. Clearing databuffer.");
                    reader.buffer.databuffer = [];
                    return false;
                }

                var db = reader.buffer.databuffer.slice(start);
                if (db.length < 6) {
                    log.log("Not enough bytes even for an emty message (len < 6). Stand by.");
                    return false;
                }

                // Doesnt look like a valid message
                if (db[4] != self.STK2.TOKEN) {
                    log.log("Expected token but got", db[4]);
                    reader.buffer.databuffer = reader.buffer.databuffer.slice(start + 1);
                    return false;
                }


                db.shift(); // Throw the start
                if (db.shift() != self.cmdSeq) {
                    log.log("Reader out of sync");
                    // The header is definitely bad.
                    reader.buffer.databuffer =
                        reader.buffer.databuffer.slice(token + 1);
                    return false;
                }

                // Get the message length
                var msgLen = (db.shift() << 8) | db.shift();
                db.shift(); // Throw token

                // Get the message
                var msg = db.slice(0, msgLen);
                db = db.slice(msgLen);

                // Check that we got the whole message.
                if (msg.length != msgLen) {
                    log.log("Waiting for ", msgLen - msg.length + 1, "more bytes");
                    return false;
                }

                // There should be a checksum left in there
                if (db.length == 0) {
                    log.log("Waiting for checksum byte");
                    return false;
                }
                // From the top to get the checksum
                var csum = reader.buffer.databuffer
                    .slice(start, msgLen + 6)
                    .reduce(function(a, b) {
                        return a ^ b;
                    });

                // If the checksum failed the whole message was bad. Hope we have
                // retries..
                if (csum != 0) {
                    log.warn("Message checksum failed, the message is garbage.");
                    reader.buffer.databuffer =
                        reader.buffer.databuffer.slice(start + msgLen + 6);
                    return false;
                }

                reader.buffer.databuffer =
                    reader.buffer.databuffer.slice(start + msgLen + 6);

                // Now we are good to continue our messaging
                self.cmdSeq = (self.cmdSeq + 1) & 0xff;
                log.log("Reader success. Databuffer:",
                    buffer.hexRep(reader.buffer.databuffer)); // Now msg is good.
                // Don't include the packet head and tail
                setTimeout(reader.callback.bind(null, msg), 0);

                return true;
            }

            log.log("Sending:", buffer.hexRep(message));
            this.writeThenRead_({
                outgoingMsg: message,
                modifyDatabuffer: modifyDatabuffer,
                callback: cb,
                ttl: 500,
                timeoutCb: function() {
                    if (retries > 0)
                        self.writeThenRead(data, cb, retries - 1);
                    else
                        self.errCb(errno.READER_TIMEOUT, "STKv2 reader timed out");
                }
            });
        };


        // Cb should have the 'state' format, ie function (ok, data)
        STK500v2Transaction.prototype.cmd = function(cmd, cb) {
            // Always get a 4byte answer
            if (cmd.length != 4) {
                this.errCb(errno.COMMAND_SIZE_FAIL, "Tried to send command with bad size (", cmd.length, "!= 4)");
                return;
            }

            var buf = [this.STK2.CMD_SPI_MULTI, 0x4, 0x4, 0x0]
                .concat(cmd);
            this.writeThenRead(buf, cb);
        };

        STK500v2Transaction.prototype.flash = function(deviceName, sketchData) {
            this.sketchData = {
                data: sketchData.data || sketchData,
                addr: sketchData.addr || this.config.offset || 0
            };

            log.log("Will be sending sketch:", buffer.hexRep(sketchData.data));
            var self = this;
            self.destroyOtherConnections(
                deviceName,
                function() {
                    self.serial.connect(deviceName, {
                            bitrate: self.config.speed,
                            name: deviceName
                        },
                        self.transitionCb('connectDone'));
                });
        };

        STK500v2Transaction.prototype.connectDone = function(connectArg) {
            if (typeof(connectArg) == "undefined" ||
                typeof(connectArg.connectionId) == "undefined" ||
                connectArg.connectionId == -1) {
                this.errCb(errno.CONNECTION_FAIL, "Bad connectionId / Couldn't connect to board");
                return;
            }

            var self = this;
            this.connectionId = connectArg.connectionId;
            log.log("Connected to board. ID: " + connectArg.connectionId);
            this.buffer.drain(function() {
                self.twiggleDtrMaybe(self.transitionCb('signOn'));
            });
        };

        STK500v2Transaction.prototype.signOn = function() {
            var self = this;
            self.writeThenRead([self.STK2.CMD_SIGN_ON],
                self.transitionCb('signedOn'));
        };

        STK500v2Transaction.prototype.signedOn = function(data) {
            var expectedData = [
                    this.STK2.CMD_SIGN_ON,
                    this.STK2.STATUS_CMD_OK,
                    // The following 8 bytes are the signature
                    8
                ],
                self = this;
            if (zip(expectedData, data.slice(0, 3)).some(function(d) {
                    return d[0] != d[1];
                })) {
                this.errCb(errno.SIGN_ON_FAIL, "Error signing on to device:" + data.slice(0, 3) + "!=" + expectedData);
                return;
            }

            // Found in avrdude.conf
            var timeout = 200,
                stabDelay = 0x64,
                cmdExecDelay = 25,
                syncHLoops = 32,
                byteDelay = 0,
                pollValue = 0x53,
                pollIndex = 3,
                pgmEnable = [0xac, 0x53, 0x00, 0x00],
                nextStep = self.transitionCb("programFlash", 0,
                    this.config.avrdude.memory.flash.page_size);
            // nextStep = self.transitionCb("preProgramHack");



            self.writeThenRead([self.STK2.CMD_ENTER_PROGMODE_ISP,
                    timeout,
                    stabDelay, //Check
                    cmdExecDelay,
                    syncHLoops,
                    byteDelay,
                    pollValue,
                    pollIndex
                ].concat(pgmEnable),
                nextStep);
        };

        // Note: This is some commands that avrdude sends to the device. Found
        // them out by sniffing the transaction, couldn't find which code
        // sends them. They dont seem to be necessary but keep them around.
        STK500v2Transaction.prototype.preProgramHack = function() {
            this.cmdChain([
                [0x30, 0x00, 0x00, 0x00],
                [0x30, 0x00, 0x01, 0x00],
                [0x30, 0x00, 0x02, 0x00],
                [0xa0, 0x0f, 0xfc, 0x00],
                [0xa0, 0x0f, 0xfd, 0x00],
                [0xa0, 0x0f, 0xfe, 0x00],
                [0xa0, 0x0f, 0xff, 0x00]
            ], this.transitionCb("programFlash", 0, 256));
        };

        STK500v2Transaction.prototype.programFlash = function(dataOffset, pgSize) {
            var data = this.sketchData.data,
                memOffset = this.sketchData.addr;
            log.log("program flash: data.length: ", data.length,
                ", dataOffset: ", dataOffset, ", page size: ", pgSize);

            if (dataOffset >= data.length) {
                log.log("Done programming flash: ", dataOffset, " vs. " + data.length);
                this.transition('doneProgramming', this.connectionId);
                return;
            }

            var self = this,
                payload = this.padOrSlice(data, dataOffset, pgSize),
                addressBytes = buffer.storeAsFourBytes((memOffset + dataOffset) / 2),
                sizeBytes = buffer.storeAsTwoBytes(pgSize),
                memMode = 0xc1,
                delay = 10,
                loadpageLoCmd = 0x40,
                writepageCmd = 0x4c,
                avrOpReadLo = 0x20;

            addressBytes[0] |= 0x80; // We use high addresses only

            // The load address message is optional, the device can increment
            // and assume correct positions but just to be sure.
            var loadAddressMessage = [this.STK2.CMD_LOAD_ADDRESS]
                .concat(addressBytes),
                programMessage = [
                    this.STK2.CMD_PROGRAM_FLASH_ISP,
                    sizeBytes[0],
                    sizeBytes[1],
                    memMode,
                    delay,
                    loadpageLoCmd,
                    writepageCmd,
                    avrOpReadLo,
                    0x00, 0x00, // Readback
                ].concat(payload);

            self.writeThenRead(loadAddressMessage, function(reponse) {
                self.writeThenRead(programMessage, function(response) {
                    // Program the next section
                    if (response[0] != 0x13 || response[1] != 0) {
                        self.errCb(errno.BAD_RESPONSE, "Error in response while programming");
                        return;
                    }
                    self.transition('programFlash', dataOffset + pgSize, pgSize);
                });
            });
        };

        STK500v2Transaction.prototype.doneProgramming = function(cid) {
            var self = this;

            self.writeThenRead([0x11, 0x01, 0x01], function(data) {
                setTimeout(function() {
                    self.cleanup(self.finishCallback);
                }, 1000);
            });
        };

        module.exports.STK500v2Transaction = STK500v2Transaction;

    }, {
        "./../buffer": 5,
        "./../errno": 6,
        "./../logging": 8,
        "./../util": 19,
        "./serialtransaction": 13
    }],
    16: [function(require, module, exports) {
        // Corresponding avrdude commands for leonardo:

        // # generate some data
        // $ for i in {0..511}; do echo $(($i % 256)); done | (while read i; do printf "\\x$(printf '%02x' $i)"; done) > /tmp/file.bin
        // # Throw it in with avrdude
        // $ avrdude -Cavrdude.conf -vvvv -patmega32u4 -cusbtiny -Uflash:w:"/tmp/file.bin":r
        //
        // The arduino wont do anything after this obviously but the pages
        // should be.

        // For bootloader:
        //
        // $ avrdude -Cavrdude.conf -vvvv -patmega32u4 -cusbtiny -e -Ulock:w:0x3F:m -Uefuse:w:0xcb:m -Uhfuse:w:0xd8:m -Ulfuse:w:0xff:m
        //
        // That means perform chip erase (Although I couldn't get it to work
        // without it anyway)
        //

        var _create_chrome_client = require('./../../../chrome-extension/client/rpc-client'),
            USBTransaction = require('./usbtransaction').USBTransaction,
            util = require('./../util'),
            arraify = util.arraify,
            ops = require("./memops"),
            buffer = require("./../buffer"),
            Log = require('./../logging').Log,
            log = new Log('USBTiny');

        function USBTinyTransaction(config, finishCallback, errorCallback) {
            USBTransaction.apply(this, arraify(arguments));
            this.UT = {
                // Generic requests to the USBtiny
                ECHO: 0, // echo test
                READ: 1, // read byte (wIndex:address)
                WRITE: 2, // write byte (wIndex:address, wValue:value)
                CLR: 3, // clear bit (wIndex:address, wValue:bitno)
                SET: 4, // set bit (wIndex:address, wValue:bitno)

                // Programming requests
                POWERUP: 5, // apply power (wValue:SCK-period, wIndex:RESET)
                POWERDOWN: 6, // remove power from chip
                SPI: 7, // issue SPI command (wValue:c1c0, wIndex:c3c2)
                POLL_BYTES: 8, // set poll bytes for write (wValue:p1p2)
                FLASH_READ: 9, // read flash (wIndex:address)
                FLASH_WRITE: 10, // write flash (wIndex:address, wValue:timeout)
                EEPROM_READ: 11, // read eeprom (wIndex:address)
                EEPROM_WRITE: 12, // write eeprom (wIndex:address, wValue:timeout)

                RESET_LOW: 0,
                RESET_HIGH: 1
            };

            // Default product and vendor IDs
            this.entryState = 'powerUp';
            this.cmdFunction = this.UT.SPI;
            this.device = {
                productId: 0xc9f,
                vendorId: 0x1781
            };
            this.log = log;
            this.log.resetTimeOffset();
        }

        USBTinyTransaction.prototype = new USBTransaction();


        // === Initial superstate ===
        // flash -> [programEnable -> chipErase ->]
        //           programEnable -> <program>

        USBTinyTransaction.prototype.programEnable = function() {
            var cb, self = this;

            // If we are instructed to erse and haven't done so yet.
            if (this.config.chipErase && this.stateHistory.indexOf('chipErase') == -1)
                cb = this.transitionCb('chipErase', self.transitionCb('programEnable'));
            else
                cb = this.transitionCb('programPage', 0);

            this.control(this.UT.POWERUP, this.sck, this.UT.RESET_LOW, function() {
                log.log("Powered up. Enabling...");
                self.operation("PGM_ENABLE", cb);
            });
        };

        // === Programming superstate ===
        USBTinyTransaction.prototype.programPage = function(offset, resp, pageCheckers) {
            var self = this,
                page = this.config.avrdude.memory.flash.page_size,
                end = offset + page,
                pageBin = this.hexData.slice(offset, end),
                info = this.transferOut(this.UT.FLASH_WRITE, 0,
                    offset, pageBin);

            function checkPage(cb, _retries) {
                var info = self.transferIn(self.UT.FLASH_READ, 0,
                    offset, pageBin.length);

                _retries = typeof _retries === 'undefined' ? 3 : _retries;
                self.write(info, function(data) {
                    log.log("Checking page [attempt:", 3 - _retries, "/", 3, "]:");
                    if (!util.arrEqual(data.data, pageBin)) {
                        if (_retries > 0) {
                            checkPage(cb, _retries - 1);
                            return;
                        } else {
                            // Should we try to rewrite it?
                            self.errCb(1, "Page check at", offset, "failed");
                            return;
                        }
                    }

                    cb();
                });
            }

            this.writeMaybe(info, this.transitionCb('flushPage', offset, end, (pageCheckers || []).concat([checkPage])));
        };

        USBTinyTransaction.prototype.flushPage = function(offset, end, pageCheckers,
            ctrlArg) {
            var writePageArr = this.config.avrdude.memory.flash.memops.WRITEPAGE,
                cmd = ops.opToBin(writePageArr, {
                    ADDRESS: offset / 2
                }),
                self = this;

            this.cmd(cmd, function(res) {
                if (end > self.hexData.length) {
                    self.transition('checkPages', pageCheckers, self.transitionCb("powerDown"));
                    return;
                }

                log.log("Progress:", end, "/", self.hexData.length);
                self.transition('programPage', end, res, pageCheckers);
            });
        };

        // === Final superstate

        USBTinyTransaction.prototype.powerDown = function() {
            var self = this;

            this.setupSpecialBits(self.config.cleanControlBits, function() {
                self.control(self.UT.POWERDOWN, 0, 0,
                    self.transitionCb('endTransaction'));
            });
        };

        USBTinyTransaction.prototype.endTransaction = function(ctrlArg) {
            var self = this;
            this.cleanup(this.finishCallback);
        };

        module.exports.USBTinyTransaction = USBTinyTransaction;

    }, {
        "./../../../chrome-extension/client/rpc-client": 1,
        "./../buffer": 5,
        "./../logging": 8,
        "./../util": 19,
        "./memops": 12,
        "./usbtransaction": 17
    }],
    17: [function(require, module, exports) {
        var _create_chrome_client = require('./../../../chrome-extension/client/rpc-client'),
            Transaction = require('./../transaction').Transaction,
            arraify = require('./../util').arraify,
            chain = require('./../util').chain,
            forEachWithCallback = require('./../util').forEachWithCallback,
            MemoryOperations = require('./memops'),
            buffer = require("./../buffer"),
            ops = require("./memops"),
            Log = require('./../logging').Log,
            log = new Log('USBTransaction');

        function USBTransaction(config, finishCallback, errorCallback) {
            Transaction.apply(this, arraify(arguments));

            this.log = log;
            this.usb = chrome.usb;
            this.sck = 10;

            this.log.resetTimeOffset();
        }

        USBTransaction.prototype = new Transaction();

        USBTransaction.prototype.smartOpenDevice = function(device, cb) {
            var self = this;
            self.usb.getDevices(device, function(devs) {
                if (devs.length == 0) {
                    self.errCb(1, "No devices found");
                    return;
                }

                var dev = devs.pop();

                // Config 0 is invalid generally but due to the strangenes that is
                // windows and mac we need to default somewhere.
                self.usb.openDevice(dev, function(hndl) {
                    var _callback = cb.bind(null, hndl);
                    chrome.runtime.getPlatformInfo(function(platform) {
                        if (typeof self.config.configureDevice === 'undefined') {
                            self.config.configureDevice = (platform.os == "mac") + 0;
                        }

                        if (self.config.configureDevice) {
                            return self.usb.setConfiguration(hndl, self.config.deviceConfiguratiuon,
                                _callback);
                        }

                        return _callback();
                    });
                });
            });
        };

        USBTransaction.prototype.transferOut = function(op, value, index, data) {
            return {
                recipient: "device",
                direction: "out",
                requestType: "vendor",
                request: op,
                value: value,
                index: index,
                timeout: 5000,
                data: buffer.binToBuf(data || []),
                length: data ? data.length : 0
            };
        };

        USBTransaction.prototype.transferIn = function(op, value, index, length) {
            return {
                recipient: "device",
                direction: "in",
                requestType: "vendor",
                request: op,
                index: index,
                value: value,
                timeout: 5000,
                length: length || 0
            };
        };

        // Full fledged write with control
        USBTransaction.prototype.write = function(info, cb) {
            var self = this;

            log.log("Performing control transfer", info.direction,
                buffer.hexRep([info.request, info.value, info.index]),
                "len:", info.length);
            if (info.direction == "out") {
                log.log("Data:", buffer.hexRep(buffer.bufToBin(info.data)));
            }

            this.refreshTimeout();

            setTimeout(function() {
                self.usb.controlTransfer(
                    self.handler,
                    info,
                    function(arg) {
                        if (arg.resultCode != 0) {
                            self.errCb(1, "Bad resultCode from libusb:", arg.resultCode);
                            return;
                        }

                        arg.data = buffer.bufToBin(arg.data);

                        log.log('Response was:', arg);
                        cb(arg);
                    });
            });
        };


        USBTransaction.prototype.writeMaybe = function(info, callback) {
            var self = this;
            if (this.config.dryRun) {
                callback({
                    data: [0xde, 0xad, 0xbe, 0xef]
                });
                return;
            }

            self.write(info, callback);
        };

        USBTransaction.prototype.cmd = function(cmd, cb) {

            if (typeof this.cmd_function === 'undefined') {
                this.errCb(1, "Command function (cmd_function) not implemented.");
                return;
            }

            var info = this.transferIn(this.cmd_function, (cmd[1] << 8) | cmd[0], (cmd[3] << 8) | cmd[2],
                4);

            this.writeMaybe(info, function(resp) {
                log.log("CMD:", buffer.hexRep(cmd), buffer.hexRep(resp.data));
                cb(resp);
            });
        };

        // A simple in control message with 2 values (index, value that is)
        USBTransaction.prototype.control = function(op, v1, v2, cb) {
            this.write(this.transferIn(op, v1, v2), cb);
        };

        USBTransaction.prototype.localCleanup = function(callback) {

            if (this.handler) {
                this.usb.closeDevice(this.handler, callback);
                this.handler = null;
                return;
            }

            callback();
        };

        USBTransaction.prototype.flash = function(_, hexData) {
            var self = this;
            this.hexData = hexData.data || hexData;

            self.smartOpenDevice(self.device, function(hndl) {
                self.handler = hndl;
                self.transition(self.entryState);
            });
        };

        // Just chain the checkers. As a thought experiment we could have them
        // run in parallel and have a barrier function as a callback to call
        // the checkPages. This way we could be comparing
        USBTransaction.prototype.checkPages = function(checkers, cb) {
            if (checkers.length == 0) {
                cb();
                return;
            }

            var car = checkers[0],
                cdr = checkers.slice(1),
                self = this;

            car(function() {
                self.transition("checkPages", cdr, cb);
            });

        };

        module.exports.USBTransaction = USBTransaction;

    }, {
        "./../../../chrome-extension/client/rpc-client": 1,
        "./../buffer": 5,
        "./../logging": 8,
        "./../transaction": 18,
        "./../util": 19,
        "./memops": 12
    }],
    18: [function(require, module, exports) {

        var utilModule = require("./util"),
            arraify = utilModule.arraify,
            deepCopy = utilModule.deepCopy,
            chain = utilModule.chain,
            ops = require("./protocols/memops"),
            buffer = require("./buffer"),
            Log = require("./logging").Log,
            log = new Log("Generic Transaction"),
            errno = require("./errno");

        function Transaction(config, finishCallback, errorCallback) {
            this.hooks_ = {};
            this.state = null;
            this.stateHistory = [];
            this.block = false;
            this.context = {};

            this.config = config;
            this.finishCallback = function() {
                debugConnector("Calling finish callback...");
                finishCallback.apply(null, arraify(arguments));
            };
            this.errorCallback = function() {
                debugConnector("Calling error callback...");
                errorCallback.apply(null, arraify(arguments));
            };
            this.previousErrors = [];

            this.log = log;
            this.log.resetTimeOffset();
        }

        Transaction.prototype = {
            refreshTimeout: function() {
                var self = this;

                if (this.timeout) {
                    this.log.log("Clearing old timeout");
                    clearTimeout(this.timeout);
                    this.timeout = null;
                } else {
                    this.timeoutSecs = 20;
                }

                this.timeout = setTimeout(function() {
                    self.errCb(errno.IDLE_HOST, "No communication with device for over ",
                        self.timeoutSecs, "s");
                }, this.timeoutSecs * 1000);
            },

            errCb: function(id, var_message) {
                var self = this;

                this.log.error.apply(this.log, arraify(arguments, 1, "[FINAL ERROR]"));
                this.block = true;
                if (this.previousErrors.length > 0)
                    this.log.warn("Previous errors", this.previousErrors);

                var logargs = arraify(arguments, 1, "state: ", this.state, " - ");
                this.previousErrors.push(logargs);
                this.cleanup(function() {
                    self.log.error.apply(self.log, logargs);
                    if (self.errorCallback)
                        self.errorCallback(id, logargs.join(''));
                });
            },

            cleanup: function(callback) {
                var emergencyCleanupTimeout;

                callback = callback || this.finishCallback.bind(this);
                if (this.timeout) {
                    this.log.log("Stopping timeout");
                    clearTimeout(this.timeout);
                }
                this.timeout = null;

                function doCleanup() {
                    // In case it is called normally clear the timeout
                    clearTimeout(emergencyCleanupTimeout);
                    callback();
                }

                // Cleanup even if closeDevice fails (eg if it was never opened).
                emergencyCleanupTimeout = setTimeout(doCleanup, 2000);

                if (this.localCleanup) {
                    this.localCleanup(doCleanup);
                    return;
                }
            },

            getHook: function(hookIdArray) {
                var key = hookIdArray.sort().join('_');
                return this.hooks_[key];
            },

            triggerHook: function(hookIdArray, varArgs) {
                var key = hookIdArray.sort().join('_'),
                    args = arraify(arguments, 1);
                if (this.hooks_.hasOwnProperty(key))
                    this.hooks_[key].forEach(function(fn) {
                        fn.apply(null, args);
                    });
            },

            transition: function(state, varArgs) {
                var oldState = this.state,
                    args = arraify(arguments, 1);

                // this.triggerHook(['leave', oldState], this.context);
                this.state = state;
                // this.triggerHook(['enter', this.state], this.context);
                this.stateHistory.push(state);

                if (this.block) {
                    debugConnector("Jumping to state\'", state, "' arguments:", args, "BLOCKED");
                    return;
                }

                debugConnector("Jumping to state\'", state, "' arguments:", args);
                this[state].apply(this, args);
            },

            transitionCb: function(state, varArgs) {
                var self = this,
                    allArgs = arraify(arguments);

                return function() {
                    var newArgs = arraify(arguments);
                    self.transition.apply(self, allArgs.concat(newArgs));
                };
            },

            padOrSlice: function(data, offset, length) {
                var payload;

                if (offset + length > data.length) {
                    payload = data.slice(offset, data.length);
                    var padSize = length - payload.length;
                    for (var i = 0; i < padSize; ++i) {
                        payload.push(0);
                    }
                } else {
                    payload = data.slice(offset, offset + length);
                }

                return payload;
            },

            assert: function(bool, varMsg) {
                var args = arraify(arguments, 1, 2, 'AssertionError');

                if (!bool) {
                    this.cbErr.apply(this, args);
                }
            },

            // mem is the memory type. It can be 'lfuse' or 'lock' or 'flash' etc
            // (see avrdude.conf)
            writeMemory: function(mem, addr, val, cb) {
                var writeByteArr = this.config.avrdude.memory[mem].memops.WRITE,
                    cmd = ops.opToBin(writeByteArr, {
                        ADDRESS: addr,
                        INPUT: val
                    });
                this.log.log("Writing ", buffer.hexRep([val]),
                    "->", mem, "(", writeByteArr, "=>", buffer.hexRep(cmd), ")");
                this.cmd(cmd, cb);
            },

            // mem is the memory type. It can be 'lfuse' or 'lock' or 'flash' etc
            // (see avrdude.conf). Cb receives a byte array.
            readMemory: function(mem, addr, cb) {
                var readByteArr = this.config.avrdude.memory[mem].memops.READ,
                    cmd = ops.opToBin(readByteArr, {
                        ADDRESS: addr
                    });

                this.cmd(cmd, function(resp) {
                    cb(ops.extractOpData('OUTPUT', readByteArr, resp.data || resp));
                });
            },

            // Setup the special bits that configuration has values for.
            setupSpecialBits: function(controlBits, cb) {
                var self = this,
                    knownBits = Object.getOwnPropertyNames(controlBits || {});

                this.log.log("Will write control bits:", controlBits);
                chain(knownBits.map(function(memName) {
                    var addr = 0;

                    return function(nextCallback) {
                        if (controlBits[memName] !== null) {
                            function verifyMem(cb) {
                                self.readMemory(memName, addr, function(resp) {
                                    debugConnector("Read memory", memName, ":", buffer.hexRep(resp));
                                    if (resp[0] == controlBits[memName]) {
                                        nextCallback();
                                    } else {
                                        self.errCb(1, "Memory verification after write failed for",
                                            memName);
                                        return;
                                    }
                                });
                            }
                            self.writeMemory(memName, addr, controlBits[memName],
                                verifyMem);
                        } else {
                            nextCallback();
                        }
                    };
                }), cb);
            },

            // Memory operation based on an array of operation bits
            operation: function(op, cb) {
                this.log.log("Running operation:", op);
                return this.cmd(ops.opToBin(this.config.avrdude.ops[op]), cb);
            },

            // Chip erase destroys the flash, the lock bits and maybe the eeprom
            // (depending on the value of the fuses). The fuses themselves are
            // untouched.
            chipErase: function(cb) {
                var self = this;
                setTimeout(function() {
                    self.operation("CHIP_ERASE", function() {
                        self.setupSpecialBits(self.config.controlBits, cb);
                    });
                }, self.config.avrdude.chipEraseDelay / 1000);
            }

        };

        module.exports.Transaction = Transaction;

    }, {
        "./buffer": 5,
        "./errno": 6,
        "./logging": 8,
        "./protocols/memops": 12,
        "./util": 19
    }],
    19: [function(require, module, exports) {
        function arraify(arrayLike, offset, prefixVarArgs) {
            var ret = Array.prototype.slice.call(arrayLike, offset),
                prefix = Array.prototype.slice.call(arguments, 2);

            return prefix.concat(ret);
        }

        function deepCopy(obj) {
            switch (typeof obj) {
                case 'array':
                    return obj.map(deepCopy);
                    break;
                case 'object':
                    var ret = {};
                    Object.ownPropertyNames(obj).forEach(function(k) {
                        ret[k] = deepCopy(obj[k]);
                    });
                    return ret;
                    break;
                default:
                    return obj;
            }
        }

        // Callback gets the next iteration as first
        function infinitePoll(timeout, cb) {
            var finished = false;

            function stopPoll() {
                finished = true;
            }
            if (finished) {
                return;
            }
            cb(function() {
                setTimeout(function() {
                    infinitePoll(timeout, cb);
                }, timeout);
            });
            return stopPoll;
        }

        function dbg(varargs) {
            var args = arraify(arguments, 0, '[plugin frontent]');
            return debugConnector.apply(console, args);
        }

        function forEachWithCallback(array, iterationCb, finishCb) {
            var arr = array.slice();

            function nextCb() {
                if (arr.length != 0) {
                    var item = arr.shift();
                    // Iteration with item
                    iterationCb(item, nextCb);
                } else {
                    finishCb();
                }
            }
            nextCb();
        }

        function poll(maxRetries, timeout, cb, errCb) {
            if (maxRetries < 0) {
                if (errCb)
                    errCb();
                else
                    throw Error("Retry limit exceeded");

                return;
            }
            cb(function() {
                setTimeout(function() {
                    poll(maxRetries - 1, timeout, cb, errCb);
                }, timeout);
            });
        }

        // Python style zip
        function zip(varArgs) {
            var arrays = arraify(arguments);

            return arrays[0].map(function(_, i) {
                return arrays.map(function(array) {
                    return array[i];
                });
            });
        }

        // Python style zip
        function arrEqual(varArgs) {
            var arrays = arraify(arguments);

            if (arrays.length == 0) {
                return true;
            }

            if (arrays.some(function(a) {
                    a.length != arrays[0].length
                }))
                return false;

            // Is there an element for which there is an element that is not
            // equal to it?
            return !arrays[0].some(function(ele, i) {
                return arrays.some(function(array) {
                    return array[i] != ele;
                });
            });
        }

        function pyzip() {
            var args = [].slice.call(arguments);
            var shortest = args.length == 0 ? [] : args.reduce(function(a, b) {
                return a.length < b.length ? a : b;
            });

            return shortest.map(function(_, i) {
                return args.map(function(array) {
                    return array[i];
                });
            });
        }

        // Chain functiona arrays. Each function in the array receives as a
        // first arg a callback whose arguments are the 2nd, 3rd... arg of
        // the next call. Eg.
        //
        // chain([function (next) {next(1,2,3);},
        //        function (next, a, b, c) {debugConnector(a, b, c)}]);
        //
        // Will print "1 2 3"
        function chain(functionArray, final) {
            if (functionArray.length == 0) {
                if (final)
                    final();
                return;
            }

            var args = [chain.bind(null, functionArray.slice(1), final)]
                .concat(arraify(arguments, 2));
            functionArray[0].apply(null, args);
        }

        function makeArrayOf(value, length) {
            assert(length < 100000 && length >= 0,
                "Length of array too large or too small");

            var arr = [],
                i = length;
            while (i--) {
                arr[i] = value;
            }
            return arr;
        }

        function assert(val, msg) {
            if (!val)
                throw Error("AssertionError: " + msg);
        }

        // Non destructive. Makes a copy of each object. object o2 overrides
        // o1.
        function merge(o1, o2) {
            var ret = {};
            Object.getOwnPropertyNames(o1).forEach(function(k) {
                ret[k] = o1[k];
            });

            Object.getOwnPropertyNames(o2).forEach(function(k) {
                ret[k] = o2[k];
            });

            return ret;
        }

        module.exports.makeArrayOf = makeArrayOf;
        module.exports.merge = merge;
        module.exports.arraify = arraify;
        module.exports.assert = assert;
        module.exports.chain = chain;
        module.exports.zip = zip;
        module.exports.deepCopy = deepCopy;
        module.exports.infinitePoll = infinitePoll;
        module.exports.poll = poll;
        module.exports.dbg = dbg;
        module.exports.forEachWithCallback = forEachWithCallback;
        module.exports.arrEqual = arrEqual;

    }, {}],
    20: [function(require, module, exports) {
        // file: chrome-loader.js
        var _create_chrome_client = require('./../chrome-extension/client/rpc-client');
        if (_create_chrome_client.extentionAvailable) {
            window.Scktoolapp = require('./chrome-plugin');
        }

        if (!window.Scktoolapp) {
            debugConnector("No chrome app.");
        }

    }, {
        "./../chrome-extension/client/rpc-client": 1,
        "./chrome-plugin": 21
    }],
    21: [function(require, module, exports) {
        // file: chrome-plugin.js

        var protocols = require('./backend/protocols').protocols,
            util = require('./backend/util'),
            hexutil = require('./backend/hexparser'),
            avrdudeconf = require('./backend/avrdudeconf'),
            errno = require('./backend/errno');

        var dbg = util.dbg;

        dbg("Looks like we are on chrome.");

        // A plugin object implementing the plugin interface.
        function Plugin() {
            dbg("Initializing plugin.");
            window.debugBabelfish = true;
            this.serial = chrome.serial;
            var self = this;

            // Inclusive range of return values that are logged as wanrings.
            this.warningReturnValueRange = [20500, 21000];
            this.version = null;
            // this.instance_id = window.plugins_initialized++;

            this.bufferSize = 100;

            this.serial.errorHandler = function(message) {

            };
            this.readingInfo = null;

            // Change to false to provide byte arrays for flashing.
            this.binaryMode = true;

            this._rcvError = function(info) {
                debugConnector('Receive error:', info);
                if (info.connectionId == self.readingInfo.connectionId) {
                    self.disconnect();
                }

                if (self.transaction &&
                    self.transaction.connectionId &&
                    info.connectionId == self.transaction.connectionId) {
                    self.transaction.errCb(1, "An unknown error occured");
                }
            };
        }

        Plugin.prototype = {
            errorCallback: function(from, msg, status) {
                console.error("[" + from + "] ", msg, "(status: " + status + ")");
            },

            readingHandlerFactory: function(connectionId, cb, returnCb) {
                var self = this;

                dbg("Reading Info:", this.readingInfo);
                if (cb !== this.readingInfo.callbackUsedInHandler) {
                    this.readingInfo.callbackUsedInHandler = cb;

                    // This will fail if:
                    // - More than 3 of this are running simultaneously
                    // - More than 10 sonsecutive buffer overflows occur
                    this.readingInfo.handler = function(readArg) {
                        if (!self.readingInfo) {
                            debugConnector("Recovering from a spamming device.");
                            return;
                        }

                        if (!readArg) {
                            debugConnector("Bad readArg from serial monitor.");
                            return;
                        }

                        if (readArg.connectionId != connectionId)
                            return;

                        var bufferView = new Uint8Array(readArg.data),
                            chars = [];

                        for (var i = 0; i < bufferView.length; ++i)
                            chars.push(bufferView[i]);

                        if (!self.readingInfo.buffer_)
                            self.readingInfo.buffer_ = [];

                        if (self.spamGuard(returnCb))
                            return;

                        // FIXME: if the last line does not end in a newline it should
                        // be buffered
                        var msgs = String.fromCharCode.apply(null, chars).split("\n");
                        // return cb("chrome-serial", rcv);
                        // There are three possible issues (solutions):
                        // - Output not readable if it is not delimited by new lines (new line split)
                        // - Large lines creates large buffers (timeout/buffersize)
                        // - Large lines are buffered for ever (timeout)

                        // self.readingInfo.buffer_ = self.readingInfo.buffer_.concat(msgs);
                        var buffer_head = self.readingInfo.buffer_;
                        var buffer_tail = self.readingInfo.buffer_.pop() || '';
                        var msgs_head = msgs.shift() || '';
                        var tail_msgs = msgs;
                        self.readingInfo.buffer_ = buffer_head.concat([buffer_tail + msgs_head])
                            .concat(tail_msgs);

                        function __flushBuffer() {
                            var ret = self.readingInfo.buffer_.join("\n");
                            self.readingInfo.buffer_ = [];
                            cb("chrome-serial", ret);
                        }

                        if (self._getBufferSize(self.readingInfo.buffer_) > self.bufferSize) {
                            debugConnector("Buffer overflow, info:", self.readingInfo);
                            __flushBuffer();
                            return;
                        }

                        setTimeout(function() {
                            if (self.readingInfo && self.readingInfo.buffer_.length > 0) {
                                self.readingInfo.overflowCount = 0;
                                __flushBuffer();
                            }
                        }, 50);
                    }.bind(this);
                }

                return this.readingInfo.handler;
            },

            spamGuard: function(returnCb) {
                if (!Number.isInteger(this.readingInfo.samultaneousRequests))
                    this.readingInfo.samultaneousRequests = 0;

                if (++this.readingInfo.samultaneousRequests > 50) {
                    debugConnector("Too many requests, reading info:", this.readingInfo);
                    // The speed of your device is too high for this serial,
                    // may I suggest minicom or something. This happens if we
                    // have more than 3 x 10 rps
                    this.disconnect();
                    returnCb(errno.SPAMMING_DEVICE);
                    return true;
                }

                var self = this;
                setTimeout(function() {
                    if (self.readingInfo)
                        self.readingInfo.samultaneousRequests--;
                }, 1000);

                return false;
            },

            _getBufferSize: function(buffer_) {
                return buffer_.reduce(function(a, b) {
                    return a.length + b.length;
                });
            },

            // Async methods
            serialRead: function(port, baudrate, cb, retCb) {
                dbg("SerialRead connecting to port:", port);
                var self = this,
                    closed = false;
                if (typeof baudrate !== "number") baudrate = Number(baudrate);

                function returnCb(val) {
                    // Explicitly set that for this transaction we handled the
                    // closing of the device.
                    closed = true;

                    dbg("Serial monitor return value:", val);
                    retCb("monitor", String(val));

                    self.disconnect();
                }

                setTimeout(function() {
                    // Close the monitor if we couldn't open it and didn't close it
                    if (!self.readingInfo && !closed) {
                        returnCb(errno.UNKNOWN_MONITOR_ERROR);
                    }
                }, 2000);

                this.serial.getConnections(function(cnxs) {
                    if (cnxs.some(function(c) {
                            return c.name == port;
                        })) {
                        console.error("Serial monitor connection already open.");
                        returnCb(errno.RESOURCE_BUSY);
                        return;
                    }

                    self.serial.connect(port, {
                        bitrate: baudrate,
                        name: port
                    }, function(info) {
                        if (!info) {
                            console.error("Failed to connect serial:", {
                                bitrate: baudrate,
                                name: port
                            });
                            returnCb(errno.RESOURCE_BUSY);
                            return;
                        }

                        dbg("Serial connected to: ", info);
                        self.readingInfo = info;
                        self.serial.onReceive.addListener(
                            self.readingHandlerFactory(self.readingInfo.connectionId, cb, returnCb)
                        );
                        self.serial.onReceiveError.addListener(self._rcvError);
                    });
                });
            },


            flashBootloader: function(device, protocol, communication, speed, force,
                delay, high_fuses, low_fuses,
                extended_fuses, unlock_bits, lock_bits, mcu,
                cb, _extraConfig) {
                // Validate the data
                // Async run doFlashWithProgrammer

                function toint(hex) {
                    return hex ? Number.parseInt(hex.substring(2), 16) : null;
                }

                // controlBits are the state of the control bits during th
                // bootloader flashing and the clearControlBits are the state of
                // the control bits after the flash.
                var _ = null, //Dont care values
                    controlBits = {
                        lfuse: toint(low_fuses),
                        efuse: toint(extended_fuses),
                        lock: toint(unlock_bits),
                        hfuse: toint(high_fuses)
                    },
                    extraConfig = util.merge(_extraConfig || {}, {
                        controlBits: controlBits,
                        cleanControlBits: {
                            lock: toint(lock_bits)
                        },
                        chipErase: true,
                        offset: this.savedBlob.addr
                    });

                this.flashWithProgrammer(device, this.savedBlob.data, _, protocol,
                    communication, speed, force, delay, mcu,
                    cb, extraConfig);
            },


            flashWithProgrammer: function(device, code, maxsize, protocol,
                communication, speed, force, delay,
                mcu, cb, _extraConfig) {
                var extraConfig = util.merge(_extraConfig || {}, {
                    avoidTwiggleDTR: true,
                    confirmPages: true,
                    readSwVersion: true,
                    chipErase: true,
                    dryRun: window.dryRun
                });

                // XXX: maybe fail if this is not a programmer.
                this.flash(device, code, maxsize, protocol, false, speed, mcu, cb,
                    extraConfig);
            },

            // General purpose flashing. User facing for serial flash. The
            // _extraConfig property is for internal use
            flash: function(device, code, maxsize, protocol, disable_flushing,
                speed, mcu, cb, _extraConfig) {



                var from = null,
                    self = this,
                    config = {
                        maxsize: Number(maxsize),
                        protocol: protocol,
                        disableFlushing: disable_flushing && disable_flushing != "false",
                        speed: Number(speed),
                        mcu: mcu,
                        avrdude: avrdudeconf.getMCUConf(mcu)
                    },
                    finishCallback = function() {
                        var pluginReturnValue = 0;
                        cb(from, pluginReturnValue);
                        self.transaction = null;
                    },

                    errorCallback = function(id, msg) {
                        setTimeout(function() {
                            self.transaction = null;
                            // Error callback accepts (from, message, status (0->error, 1->warning))
                            // Make this always be an error
                            var warnOrError = (id >= self.warningReturnValueRange[0] &&
                                id <= self.warningReturnValueRange[1]) ? 1 : 0;

                            self.errorCallback("extension-client", msg, warnOrError);
                        });
                        cb(from, id);
                        self.transaction = null;
                    };

                // Override or add properties.
                Object.getOwnPropertyNames(_extraConfig || {}).forEach(function(key) {
                    config[key] = _extraConfig[key];
                });
                config.confirmPages = true;

                // XXX: Wait for it to finish?
                if (self.transaction)
                    self.transaction.cleanup();

                self.transaction = new protocols[protocol](config, finishCallback,
                    errorCallback);

                self.transaction.destroyOtherConnections(
                    device,
                    function() {
                        dbg("Code length", code.length || code.data.length, typeof code,
                            "Protocol:", protocols,
                            "Device:", device);

                        // Binary string to byte array if it is actually base64
                        if (self.binaryMode && typeof code === 'string') {
                            var _code = Base64Binary.decode(code);

                            // If maxsize is not provided god with us.
                            if (maxsize && _code.length > maxsize) {
                                cb(1, "Program too large (" + _code.length + ">" + maxsize + ")");
                                return;
                            }


                            code = {
                                data: Array.prototype.slice.call(_code),
                                addr: 0
                            };

                        }

                        self.transaction.flash(device, code);
                    });
            },


            // Return a string of the port list
            // XXX: this is abused by compilerflasher
            cachingGetDevices: function(cb) {
                var self = this;
                // ULTRAHACK: If we are spammed with requests for ports
                // provide a cached version of reality updating every
                // second. This is temporaray code.
                if (!self._cachedPorts) {
                    this.serial.getDevices(function(devs) {
                        var devUniquify = {};

                        devs.forEach(function(d) {
                            // On macs we have duplicate devs with s/cu/tty/.
                            var trueDevName = d.path.replace("/dev/tty.", "/dev/cu.");
                            if (!devUniquify[trueDevName] ||
                                d.path == trueDevName)
                                devUniquify[trueDevName] = d;
                        });

                        self._cachedPorts = Object
                            .getOwnPropertyNames(devUniquify)
                            .map(function(k) {
                                return devUniquify[k];
                            });
                        cb(self._cachedPorts);

                        // Clean cache in a sec
                        setTimeout(function() {
                            self._cachedPorts = null;
                        }, 1000);
                    });

                    return;
                }

                cb(self._cachedPorts);
            },

            availablePorts: function(cb) {
                this.cachingGetDevices(function(devs) {
                    cb(this.pluginDevsFormat_(devs)
                        .map(function(d) {
                            return d.port;
                        }).join(','));
                }.bind(this));
            },

            // Return json files with the prots
            getPorts: function(cb) {
                this.cachingGetDevices(function(devs) {
                    cb(JSON.stringify(this.pluginDevsFormat_(devs)));
                }.bind(this));
            },

            pluginDevsFormat_: function(devs) {
                var set_ = {};
                devs.forEach(function(d) {
                    set_[d.path] = true;
                });

                return Object.getOwnPropertyNames(set_).map(function(dev) {
                    return {
                        port: dev
                    };
                });
            },

            probeUSB: function(cb) {
                this.availablePorts(cb);
            },

            getFlashResult: function(cb) {
                // XXX: Change: this.flashResult with actual flashResult
                this.flashResult = '';
                cb(this.flashResult);
            },

            // Inherently sync or void methods. Force is if we don't know we
            // will still be there to hear the callback.
            disconnect: function() {
                var self = this;

                if (self.readingInfo) {
                    self.serial.onReceive.removeListener(self.readingInfo.handler);
                    self.serial.onReceiveError.removeListener(self._rcvError);

                    var connectionId = self.readingInfo.connectionId;

                    // This HAS to be synchronous. There may be no tab when this
                    // ends to run the callbacks.
                    self.serial.disconnect(connectionId, function(ok) {
                        // Probably wont reach here anyway.
                        if (!ok) {
                            debugConnector("Failed to disconnect: ", connectionId);
                            // XXX: Maybe try again
                        } else {
                            dbg("Disconnected ok:", connectionId);
                        }
                    });

                    // Cleanup syncrhronously
                    dbg('Clearing readingInfo:', self.readingInfo.connectionId);
                    self.readingInfo = null;
                }
                self.disconnectCallback(null, 'disconnect');
            },

            getVersion: function(cb) {
                var self = this;
                var watchdog = setTimeout(function() {
                    cb({error:'app_connection_failed'});
                }, 1000);
                chrome.runtime.getManifestAsync(function(manifest) {
                    self.version = manifest.version;
                    clearTimeout(watchdog);
                    cb(self.version);
                });
            },

            init: function(cb) {
                cb();
            },

            saveToHex: function(strData) {
                console.error("Not implemented");
            },

            serialWrite: function(strData, cb) {
                var self = this;

                if (this.readingInfo) {
                    var data = new ArrayBuffer(strData.length);
                    var bufferView = new Uint8Array(data);
                    for (var i = 0; i < strData.length; i++) {
                        bufferView[i] = strData.charCodeAt(i);
                    }

                    dbg("Sending data:", bufferView, "from string:", strData);
                    this.serial.send(self.readingInfo.connectionId, data, function(sendInfo) {
                        if (!sendInfo) {
                            console.error("No connection to serial monitor");
                        } else if (sendInfo.error) {
                            console.error("Failed to send through",
                                self.readingInfo, ":", sendInfo.error);
                        }

                        dbg("Sent bytes:", sendInfo.bytesSent, "connid: ");
                        if (cb) cb(sendInfo.bytesSent);
                    });
                }
            },

            setCallback: function(cb) {
                // Compilerflasher uses this callback to disconnect from serial monitor
                this.disconnectCallback = cb;
                return true;
            },

            setErrorCallback: function(cb) {
                this.errorCallback = cb;
                return true;
            },

            // Dummies for plugin garbage collection.
            deleteMap: function() {
                this.closeTab();
            },

            closeTab: function() {
                // Tab may close before the callback so do it unsafe.
                this.disconnect();

                if (self.transaction)
                    self.transaction.cleanup();
            },

            // Internals
            serialMonitorSetStatus: function() {
                this.disconnect();
            },

            saveToHex: function(hexString) {
                // Parse hex into a byte array and flash should be smart enough to
                // recognize a byte array.
                this.savedBlob = hexutil.ParseHexFile(hexString);
            }
        };

        Scktoolapp = Plugin;

        module.exports = Scktoolapp;

    }, {
        "./backend/avrdudeconf": 4,
        "./backend/errno": 6,
        "./backend/hexparser": 7,
        "./backend/protocols": 10,
        "./backend/util": 19
    }],
    22: [function(require, module, exports) {
        // File: /tools/client-util.js

        // Log in a list called id
        function log(id, msg) {
            var ele = document.getElementById(id);
            if (!ele) {
                var he = document.createElement('h3');
                he.innerHTML = id;
                ele = document.createElement('ul');
                ele.id = id;
                ele.className = "loglist";
                document.body.appendChild(he);
                document.body.appendChild(ele);
            }

            debugConnector("[" + id + "] " + msg);
            ele.innerHTML += '<li>' + msg + '</li>';
        }

        function str(obj) {
            return JSON.stringify(obj);
        }

        try {
            module.exports = {
                str: str,
                log: log
            };
        } catch (e) {;
        }

        window.log = log;
        window.str = str;

        var dbg = (function() {
            var DEBUG = false;
            if (DEBUG) {
                return function(var_args) {
                    debugConnector.apply(console, ["[Client] "].concat(Array.prototype.slice.call(arguments)));
                };
            } else {
                return function(msg) {};
            }
        })();
        window.dbg = dbg;

    }, {}]
}, {}, [5, 8, 18, 19, 11, 13, 14, 1, 2, 3, 21, 20]);