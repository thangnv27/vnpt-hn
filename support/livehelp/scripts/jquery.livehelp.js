/*
 * $Id: base64.js,v 2.12 2013/05/06 07:54:20 dankogai Exp dankogai $
 *
 *  Licensed under the MIT license.
 *    http://opensource.org/licenses/mit-license
 *
 *  References:
 *    http://en.wikipedia.org/wiki/Base64
 */

(function(global) {
	'use strict';
	// existing version for noConflict()
	var _Base64 = global.Base64;
	var version = "2.1.4";
	// if node.js, we use Buffer
	var buffer;
	if (typeof module !== 'undefined' && module.exports) {
		buffer = require('buffer').Buffer;
	}
	// constants
	var b64chars
		= 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	var b64tab = function(bin) {
		var t = {};
		for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
		return t;
	}(b64chars);
	var fromCharCode = String.fromCharCode;
	// encoder stuff
	var cb_utob = function(c) {
		if (c.length < 2) {
			var cc = c.charCodeAt(0);
			return cc < 0x80 ? c
				: cc < 0x800 ? (fromCharCode(0xc0 | (cc >>> 6))
								+ fromCharCode(0x80 | (cc & 0x3f)))
				: (fromCharCode(0xe0 | ((cc >>> 12) & 0x0f))
				   + fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
				   + fromCharCode(0x80 | ( cc         & 0x3f)));
		} else {
			var cc = 0x10000
				+ (c.charCodeAt(0) - 0xD800) * 0x400
				+ (c.charCodeAt(1) - 0xDC00);
			return (fromCharCode(0xf0 | ((cc >>> 18) & 0x07))
					+ fromCharCode(0x80 | ((cc >>> 12) & 0x3f))
					+ fromCharCode(0x80 | ((cc >>>  6) & 0x3f))
					+ fromCharCode(0x80 | ( cc         & 0x3f)));
		}
	};
	var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
	var utob = function(u) {
		return u.replace(re_utob, cb_utob);
	};
	var cb_encode = function(ccc) {
		var padlen = [0, 2, 1][ccc.length % 3],
		ord = ccc.charCodeAt(0) << 16
			| ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
			| ((ccc.length > 2 ? ccc.charCodeAt(2) : 0)),
		chars = [
			b64chars.charAt( ord >>> 18),
			b64chars.charAt((ord >>> 12) & 63),
			padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
			padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
		];
		return chars.join('');
	};
	var btoa = global.btoa ? function(b) {
		return global.btoa(b);
	} : function(b) {
		return b.replace(/[\s\S]{1,3}/g, cb_encode);
	};
	var _encode = buffer
		? function (u) { return (new buffer(u)).toString('base64') } 
	: function (u) { return btoa(utob(u)) }
	;
	var encode = function(u, urisafe) {
		return !urisafe 
			? _encode(u)
			: _encode(u).replace(/[+\/]/g, function(m0) {
				return m0 == '+' ? '-' : '_';
			}).replace(/=/g, '');
	};
	var encodeURI = function(u) { return encode(u, true) };
	// decoder stuff
	var re_btou = new RegExp([
		'[\xC0-\xDF][\x80-\xBF]',
		'[\xE0-\xEF][\x80-\xBF]{2}',
		'[\xF0-\xF7][\x80-\xBF]{3}'
	].join('|'), 'g');
	var cb_btou = function(cccc) {
		switch(cccc.length) {
		case 4:
			var cp = ((0x07 & cccc.charCodeAt(0)) << 18)
				|    ((0x3f & cccc.charCodeAt(1)) << 12)
				|    ((0x3f & cccc.charCodeAt(2)) <<  6)
				|     (0x3f & cccc.charCodeAt(3)),
			offset = cp - 0x10000;
			return (fromCharCode((offset  >>> 10) + 0xD800)
					+ fromCharCode((offset & 0x3FF) + 0xDC00));
		case 3:
			return fromCharCode(
				((0x0f & cccc.charCodeAt(0)) << 12)
					| ((0x3f & cccc.charCodeAt(1)) << 6)
					|  (0x3f & cccc.charCodeAt(2))
			);
		default:
			return  fromCharCode(
				((0x1f & cccc.charCodeAt(0)) << 6)
					|  (0x3f & cccc.charCodeAt(1))
			);
		}
	};
	var btou = function(b) {
		return b.replace(re_btou, cb_btou);
	};
	var cb_decode = function(cccc) {
		var len = cccc.length,
		padlen = len % 4,
		n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0)
			| (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0)
			| (len > 2 ? b64tab[cccc.charAt(2)] <<  6 : 0)
			| (len > 3 ? b64tab[cccc.charAt(3)]       : 0),
		chars = [
			fromCharCode( n >>> 16),
			fromCharCode((n >>>  8) & 0xff),
			fromCharCode( n         & 0xff)
		];
		chars.length -= [0, 0, 2, 1][padlen];
		return chars.join('');
	};
	var atob = global.atob ? function(a) {
		return global.atob(a);
	} : function(a){
		return a.replace(/[\s\S]{1,4}/g, cb_decode);
	};
	var _decode = buffer
		? function(a) { return (new buffer(a, 'base64')).toString() }
	: function(a) { return btou(atob(a)) };
	var decode = function(a){
		return _decode(
			a.replace(/[-_]/g, function(m0) { return m0 == '-' ? '+' : '/' })
				.replace(/[^A-Za-z0-9\+\/]/g, '')
		);
	};
	var noConflict = function() {
		var Base64 = global.Base64;
		global.Base64 = _Base64;
		return Base64;
	};
	// export Base64
	global.Base64 = {
		VERSION: version,
		atob: atob,
		btoa: btoa,
		fromBase64: decode,
		toBase64: encode,
		utob: utob,
		encode: encode,
		encodeURI: encodeURI,
		btou: btou,
		decode: decode,
		noConflict: noConflict
	};
	// if ES5 is available, make Base64.extendString() available
	if (typeof Object.defineProperty === 'function') {
		var noEnum = function(v){
			return {value:v,enumerable:false,writable:true,configurable:true};
		};
		global.Base64.extendString = function () {
			Object.defineProperty(
				String.prototype, 'fromBase64', noEnum(function () {
					return decode(this)
				}));
			Object.defineProperty(
				String.prototype, 'toBase64', noEnum(function (urisafe) {
					return encode(this, urisafe)
				}));
			Object.defineProperty(
				String.prototype, 'toBase64URI', noEnum(function () {
					return encode(this, true)
				}));
		};
	}
	// that's it!
})(this);
// ----------------------------------------------------------------------------
// Buzz, a Javascript HTML5 Audio library
// Licensed under the MIT license.
// http://buzz.jaysalvat.com/
// ----------------------------------------------------------------------------
// Copyright (C) Jay Salvat
// http://jaysalvat.com/
// ----------------------------------------------------------------------------
/* jshint browser: true, node: true */
/* global define */

(function (context, factory) {
    "use strict";

    /*
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else {
    */
        context.buzz = factory();
    /*
    }
    */
})(this, function () {
    "use strict";

    var AudioContext = window.AudioContext || window.webkitAudioContext;

    var buzz = {
        defaults: {
            autoplay: false,
            duration: 5000,
            formats: [],
            loop: false,
            placeholder: '--',
            preload: 'metadata',
            volume: 80,
            webAudioApi: false,
            document: window.document // iframe support
        },
        types: {
            'mp3': 'audio/mpeg',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'aac': 'audio/aac',
            'm4a': 'audio/x-m4a'
        },
        sounds: [],
        el: document.createElement('audio'),

        getAudioContext: function() {
            if (this.audioCtx === undefined) {
                try {
                    this.audioCtx = AudioContext ? new AudioContext() : null;
                } catch (e) {
                    // There is a limit to how many contexts you can have, so fall back in case of errors constructing it
                    this.audioCtx = null;
                }
            }

            return this.audioCtx;
        },

        sound: function (src, options) {
            options = options || {};

            var doc = options.document || buzz.defaults.document;

            var pid = 0,
                events = [],
                eventsOnce = {},
                supported = buzz.isSupported();

            // publics
            this.load = function () {
                if (!supported) {
                    return this;
                }

                this.sound.load();

                return this;
            };

            this.play = function () {
                if (!supported) {
                    return this;
                }

                this.sound.play();

                return this;
            };

            this.togglePlay = function () {
                if (!supported) {
                    return this;
                }

                if (this.sound.paused) {
                    this.sound.play();
                } else {
                    this.sound.pause();
                }

                return this;
            };

            this.pause = function () {
                if (!supported) {
                    return this;
                }

                this.sound.pause();

                return this;
            };

            this.isPaused = function () {
                if (!supported) {
                    return null;
                }

                return this.sound.paused;
            };

            this.stop = function () {
                if (!supported ) {
                    return this;
                }

                this.setTime(0);
                this.sound.pause();

                return this;
            };

            this.isEnded = function () {
                if (!supported) {
                    return null;
                }

                return this.sound.ended;
            };

            this.loop = function () {
                if (!supported) {
                    return this;
                }

                this.sound.loop = 'loop';
                this.bind('ended.buzzloop', function () {
                    this.currentTime = 0;
                    this.play();
                });

                return this;
            };

            this.unloop = function () {
                if (!supported) {
                    return this;
                }

                this.sound.removeAttribute('loop');
                this.unbind('ended.buzzloop');

                return this;
            };

            this.mute = function () {
                if (!supported) {
                    return this;
                }

                this.sound.muted = true;

                return this;
            };

            this.unmute = function () {
                if (!supported) {
                    return this;
                }

                this.sound.muted = false;

                return this;
            };

            this.toggleMute = function () {
                if (!supported) {
                    return this;
                }

                this.sound.muted = !this.sound.muted;

                return this;
            };

            this.isMuted = function () {
                if (!supported) {
                    return null;
                }

                return this.sound.muted;
            };

            this.setVolume = function (volume) {
                if (!supported) {
                    return this;
                }

                if (volume < 0) {
                    volume = 0;
                }
                if (volume > 100) {
                    volume = 100;
                }

                this.volume = volume;
                this.sound.volume = volume / 100;

                return this;
            };

            this.getVolume = function () {
                if (!supported) {
                    return this;
                }

                return this.volume;
            };

            this.increaseVolume = function (value) {
                return this.setVolume(this.volume + (value || 1));
            };

            this.decreaseVolume = function (value) {
                return this.setVolume(this.volume - (value || 1));
            };

            this.setTime = function (time) {
                if (!supported) {
                    return this;
                }

                var set = true;
                this.whenReady(function () {
                    if (set === true) {
                        set = false;
                        this.sound.currentTime = time;
                    }
                });

                return this;
            };

            this.getTime = function () {
                if (!supported) {
                    return null;
                }

                var time = Math.round(this.sound.currentTime * 100) / 100;

                return isNaN(time) ? buzz.defaults.placeholder : time;
            };

            this.setPercent = function (percent) {
                if (!supported) {
                    return this;
                }

                return this.setTime(buzz.fromPercent(percent, this.sound.duration));
            };

            this.getPercent = function () {
                if (!supported) {
                    return null;
                }

                var percent = Math.round(buzz.toPercent(this.sound.currentTime, this.sound.duration));

                return isNaN(percent) ? buzz.defaults.placeholder : percent;
            };

            this.setSpeed = function (duration) {
                if (!supported) {
                    return this;
                }

                this.sound.playbackRate = duration;

                return this;
            };

            this.getSpeed = function () {
                if (!supported) {
                    return null;
                }

                return this.sound.playbackRate;
            };

            this.getDuration = function () {
                if (!supported) {
                    return null;
                }

                var duration = Math.round(this.sound.duration * 100) / 100;

                return isNaN(duration) ? buzz.defaults.placeholder : duration;
            };

            this.getPlayed = function () {
                if (!supported) {
                    return null;
                }

                return timerangeToArray(this.sound.played);
            };

            this.getBuffered = function () {
                if (!supported) {
                    return null;
                }

                return timerangeToArray(this.sound.buffered);
            };

            this.getSeekable = function () {
                if (!supported) {
                    return null;
                }

                return timerangeToArray(this.sound.seekable);
            };

            this.getErrorCode = function () {
                if (supported && this.sound.error) {
                    return this.sound.error.code;
                }

                return 0;
            };

            this.getErrorMessage = function () {
                if (!supported) {
                    return null;
                }

                switch(this.getErrorCode()) {
                    case 1:
                        return 'MEDIA_ERR_ABORTED';
                    case 2:
                        return 'MEDIA_ERR_NETWORK';
                    case 3:
                        return 'MEDIA_ERR_DECODE';
                    case 4:
                        return 'MEDIA_ERR_SRC_NOT_SUPPORTED';
                    default:
                        return null;
                }
            };

            this.getStateCode = function () {
                if (!supported) {
                    return null;
                }

                return this.sound.readyState;
            };

            this.getStateMessage = function () {
                if (!supported) {
                    return null;
                }

                switch(this.getStateCode()) {
                    case 0:
                        return 'HAVE_NOTHING';
                    case 1:
                        return 'HAVE_METADATA';
                    case 2:
                        return 'HAVE_CURRENT_DATA';
                    case 3:
                        return 'HAVE_FUTURE_DATA';
                    case 4:
                        return 'HAVE_ENOUGH_DATA';
                    default:
                        return null;
                }
            };

            this.getNetworkStateCode = function () {
                if (!supported) {
                    return null;
                }

                return this.sound.networkState;
            };

            this.getNetworkStateMessage = function () {
                if (!supported) {
                    return null;
                }

                switch(this.getNetworkStateCode()) {
                    case 0:
                        return 'NETWORK_EMPTY';
                    case 1:
                        return 'NETWORK_IDLE';
                    case 2:
                        return 'NETWORK_LOADING';
                    case 3:
                        return 'NETWORK_NO_SOURCE';
                    default:
                        return null;
                }
            };

            this.set = function (key, value) {
                if (!supported) {
                    return this;
                }

                this.sound[key] = value;

                return this;
            };

            this.get = function (key) {
                if (!supported) {
                  return null;
                }

                return key ? this.sound[key] : this.sound;
            };

            this.bind = function (types, func) {
                if (!supported) {
                    return this;
                }

                types = types.split(' ');

                var self = this,
                    efunc = function (e) { func.call(self, e); };

                for (var t = 0; t < types.length; t++) {
                    var type = types[t],
                        idx = type;
                        type = idx.split('.')[0];

                        events.push({ idx: idx, func: efunc });
                        this.sound.addEventListener(type, efunc, true);
                }

                return this;
            };

            this.unbind = function (types) {
                if (!supported) {
                    return this;
                }

                types = types.split(' ');

                for (var t = 0; t < types.length; t++) {
                    var idx = types[t],
                        type = idx.split('.')[0];

                    for (var i = 0; i < events.length; i++) {
                        var namespace = events[i].idx.split('.');
                        if (events[i].idx === idx || (namespace[1] && namespace[1] === idx.replace('.', ''))) {
                            this.sound.removeEventListener(type, events[i].func, true);
                            // remove event
                            events.splice(i, 1);
                        }
                    }
                }

                return this;
            };

            this.bindOnce = function (type, func) {
                if (!supported) {
                    return this;
                }

                var self = this;

                eventsOnce[pid++] = false;
                this.bind(type + '.' + pid, function () {
                   if (!eventsOnce[pid]) {
                       eventsOnce[pid] = true;
                       func.call(self);
                   }
                   self.unbind(type + '.' + pid);
                });

                return this;
            };

            this.trigger = function (types, detail) {
                if (!supported) {
                    return this;
                }

                types = types.split(' ');

                for (var t = 0; t < types.length; t++) {
                    var idx = types[t];

                    for (var i = 0; i < events.length; i++) {
                        var eventType = events[i].idx.split('.');

                        if (events[i].idx === idx || (eventType[0] && eventType[0] === idx.replace('.', ''))) {
                            var evt = doc.createEvent('HTMLEvents');

                            evt.initEvent(eventType[0], false, true);

                            evt.originalEvent = detail;

                            this.sound.dispatchEvent(evt);
                        }
                    }
                }

                return this;
            };

            this.fadeTo = function (to, duration, callback) {
                if (!supported) {
                    return this;
                }

                if (duration instanceof Function) {
                    callback = duration;
                    duration = buzz.defaults.duration;
                } else {
                    duration = duration || buzz.defaults.duration;
                }

                var from = this.volume,
                    delay = duration / Math.abs(from - to),
                    self = this;

                this.play();

                function doFade() {
                    setTimeout(function () {
                        if (from < to && self.volume < to) {
                            self.setVolume(self.volume += 1);
                            doFade();
                        } else if (from > to && self.volume > to) {
                            self.setVolume(self.volume -= 1);
                            doFade();
                        } else if (callback instanceof Function) {
                            callback.apply(self);
                        }
                    }, delay);
                }

                this.whenReady(function () {
                    doFade();
                });

                return this;
            };

            this.fadeIn = function (duration, callback) {
                if (!supported) {
                    return this;
                }

                return this.setVolume(0).fadeTo(100, duration, callback);
            };

            this.fadeOut = function (duration, callback) {
                if (!supported) {
                    return this;
                }

                return this.fadeTo(0, duration, callback);
            };

            this.fadeWith = function (sound, duration) {
                if (!supported) {
                    return this;
                }

                this.fadeOut(duration, function () {
                    this.stop();
                });

                sound.play().fadeIn(duration);

                return this;
            };

            this.whenReady = function (func) {
                if (!supported) {
                    return null;
                }

                var self = this;

                if (this.sound.readyState === 0) {
                    this.bind('canplay.buzzwhenready', function () {
                        func.call(self);
                    });
                } else {
                    func.call(self);
                }
            };

            this.addSource = function (src) {
                var self   = this,
                    source = doc.createElement('source');

                source.src = src;

                if (buzz.types[getExt(src)]) {
                    source.type = buzz.types[getExt(src)];
                }

                this.sound.appendChild(source);

                source.addEventListener('error', function (e) {
                    self.trigger('sourceerror', e);
                });

                return source;
            };

            // privates
            function timerangeToArray(timeRange) {
                var array = [],
                    length = timeRange.length - 1;

                for (var i = 0; i <= length; i++) {
                    array.push({
                        start: timeRange.start(i),
                        end: timeRange.end(i)
                    });
                }

                return array;
            }

            function getExt(filename) {
                return filename.split('.').pop();
            }

            // init
            if (supported && src) {

                for (var i in buzz.defaults) {
                    if (buzz.defaults.hasOwnProperty(i)) {
                        if (options[i] === undefined) {
                            options[i] = buzz.defaults[i];
                        }
                    }
                }

                this.sound = doc.createElement('audio');

                // Use web audio if possible to improve performance.
                if (options.webAudioApi) {
                    var audioCtx = buzz.getAudioContext();
                    if (audioCtx) {
                      this.source = audioCtx.createMediaElementSource(this.sound);
                      this.source.connect(audioCtx.destination);
                    }
                }

                if (src instanceof Array) {
                    for (var j in src) {
                        if (src.hasOwnProperty(j)) {
                            this.addSource(src[j]);
                        }
                    }
                } else if (options.formats.length) {
                    for (var k in options.formats) {
                        if (options.formats.hasOwnProperty(k)) {
                            this.addSource(src + '.' + options.formats[k]);
                        }
                    }
                } else {
                    this.addSource(src);
                }

                if (options.loop) {
                    this.loop();
                }

                if (options.autoplay) {
                    this.sound.autoplay = 'autoplay';
                }

                if (options.preload === true) {
                    this.sound.preload = 'auto';
                } else if (options.preload === false) {
                    this.sound.preload = 'none';
                } else {
                    this.sound.preload = options.preload;
                }

                this.setVolume(options.volume);

                buzz.sounds.push(this);
            }
        },

        group: function (sounds) {
            sounds = argsToArray(sounds, arguments);

            // publics
            this.getSounds = function () {
                return sounds;
            };

            this.add = function (soundArray) {
                soundArray = argsToArray(soundArray, arguments);

                for (var a = 0; a < soundArray.length; a++) {
                    sounds.push(soundArray[a]);
                }
            };

            this.remove = function (soundArray) {
                soundArray = argsToArray(soundArray, arguments);

                for (var a = 0; a < soundArray.length; a++) {
                    for (var i = 0; i < sounds.length; i++) {
                        if (sounds[i] === soundArray[a]) {
                            sounds.splice(i, 1);
                            break;
                        }
                    }
                }
            };

            this.load = function () {
                fn('load');

                return this;
            };

            this.play = function () {
                fn('play');

                return this;
            };

            this.togglePlay = function () {
                fn('togglePlay');

                return this;
            };

            this.pause = function (time) {
                fn('pause', time);

                return this;
            };

            this.stop = function () {
                fn('stop');

                return this;
            };

            this.mute = function () {
                fn('mute');

                return this;
            };

            this.unmute = function () {
                fn('unmute');

                return this;
            };

            this.toggleMute = function () {
                fn('toggleMute');

                return this;
            };

            this.setVolume = function (volume) {
                fn('setVolume', volume);

                return this;
            };

            this.increaseVolume = function (value) {
                fn('increaseVolume', value);

                return this;
            };

            this.decreaseVolume = function (value) {
                fn('decreaseVolume', value);

                return this;
            };

            this.loop = function () {
                fn('loop');

                return this;
            };

            this.unloop = function () {
                fn('unloop');

                return this;
            };

            this.setSpeed = function (speed) {
                fn('setSpeed', speed);

                return this;
            };

            this.setTime = function (time) {
                fn('setTime', time);

                return this;
            };

            this.set = function (key, value) {
                fn('set', key, value);

                return this;
            };

            this.bind = function (type, func) {
                fn('bind', type, func);

                return this;
            };

            this.unbind = function (type) {
                fn('unbind', type);

                return this;
            };

            this.bindOnce = function (type, func) {
                fn('bindOnce', type, func);

                return this;
            };

            this.trigger = function (type) {
                fn('trigger', type);

                return this;
            };

            this.fade = function (from, to, duration, callback) {
                fn('fade', from, to, duration, callback);

                return this;
            };

            this.fadeIn = function (duration, callback) {
                fn('fadeIn', duration, callback);

                return this;
            };

            this.fadeOut = function (duration, callback) {
                fn('fadeOut', duration, callback);

                return this;
            };

            // privates
            function fn() {
                var args = argsToArray(null, arguments),
                    func = args.shift();

                for (var i = 0; i < sounds.length; i++) {
                    sounds[i][func].apply(sounds[i], args);
                }
            }

            function argsToArray(array, args) {
                return (array instanceof Array) ? array : Array.prototype.slice.call(args);
            }
        },

        all: function () {
            return new buzz.group(buzz.sounds);
        },

        isSupported: function () {
            return !!buzz.el.canPlayType;
        },

        isOGGSupported: function () {
            return !!buzz.el.canPlayType && buzz.el.canPlayType('audio/ogg; codecs="vorbis"');
        },

        isWAVSupported: function () {
            return !!buzz.el.canPlayType && buzz.el.canPlayType('audio/wav; codecs="1"');
        },

        isMP3Supported: function () {
            return !!buzz.el.canPlayType && buzz.el.canPlayType('audio/mpeg;');
        },

        isAACSupported: function () {
            return !!buzz.el.canPlayType && (buzz.el.canPlayType('audio/x-m4a;') || buzz.el.canPlayType('audio/aac;'));
        },

        toTimer: function (time, withHours) {
            var h, m, s;

            h = Math.floor(time / 3600);
            h = isNaN(h) ? '--' : (h >= 10) ? h : '0' + h;
            m = withHours ? Math.floor(time / 60 % 60) : Math.floor(time / 60);
            m = isNaN(m) ? '--' : (m >= 10) ? m : '0' + m;
            s = Math.floor(time % 60);
            s = isNaN(s) ? '--' : (s >= 10) ? s : '0' + s;

            return withHours ? h + ':' + m + ':' + s : m + ':' + s;
        },

        fromTimer: function (time) {
            var splits = time.toString().split(':');

            if (splits && splits.length === 3) {
                time = (parseInt(splits[0], 10) * 3600) + (parseInt(splits[1], 10) * 60) + parseInt(splits[2], 10);
            }

            if (splits && splits.length === 2) {
                time = (parseInt(splits[0], 10) * 60) + parseInt(splits[1], 10);
            }

            return time;
        },

        toPercent: function (value, total, decimal) {
            var r = Math.pow(10, decimal || 0);

            return Math.round(((value * 100) / total) * r) / r;
        },

        fromPercent: function (percent, total, decimal) {
            var r = Math.pow(10, decimal || 0);

            return  Math.round(((total / 100) * percent) * r) / r;
        }
    };

    return buzz;
});

/*!
* Clamp.js 0.5.1
*
* Copyright 2011-2013, Joseph Schmitt http://joe.sh
* Released under the WTFPL license
* http://sam.zoy.org/wtfpl/
*/

(function(){
    /**
     * Clamps a text node.
     * @param {HTMLElement} element. Element containing the text node to clamp.
     * @param {Object} options. Options to pass to the clamper.
     */
    function clamp(element, options) {
        options = options || {};

        var self = this,
            win = window,
            opt = {
                clamp:              options.clamp || 2,
                useNativeClamp:     typeof(options.useNativeClamp) != 'undefined' ? options.useNativeClamp : true,
                splitOnChars:       options.splitOnChars || ['.', '-', '–', '—', ' '],
                animate:            options.animate || false,
                truncationChar:     options.truncationChar || '…',
                truncationHTML:     options.truncationHTML
            },

            sty = element.style,
            originalText = element.innerHTML,

            supportsNativeClamp = typeof(element.style.webkitLineClamp) != 'undefined',
            clampValue = opt.clamp,
            isCSSValue = clampValue.indexOf && (clampValue.indexOf('px') > -1 || clampValue.indexOf('em') > -1),
            truncationHTMLContainer;

        if (opt.truncationHTML) {
            truncationHTMLContainer = document.createElement('span');
            truncationHTMLContainer.innerHTML = opt.truncationHTML;
        }

        /**
         * Return the current style for an element.
         * @param {HTMLElement} elem The element to compute.
         * @param {string} prop The style property.
         * @returns {number}
         */
        function computeStyle(elem, prop) {
            if (!win.getComputedStyle) {
                win.getComputedStyle = function(el, pseudo) {
                    this.el = el;
                    this.getPropertyValue = function(prop) {
                        var re = /(\-([a-z]){1})/g;
                        if (prop == 'float') prop = 'styleFloat';
                        if (re.test(prop)) {
                            prop = prop.replace(re, function () {
                                return arguments[2].toUpperCase();
                            });
                        }
                        return el.currentStyle && el.currentStyle[prop] ? el.currentStyle[prop] : null;
                    }
                    return this;
                }
            }

            return win.getComputedStyle(elem, null).getPropertyValue(prop);
        }

        /**
         * Returns the maximum number of lines of text that should be rendered based
         * on the current height of the element and the line-height of the text.
         */
        function getMaxLines(height) {
            var availHeight = height || element.clientHeight,
                lineHeight = getLineHeight(element);

            return Math.max(Math.floor(availHeight/lineHeight), 0);
        }

        /**
         * Returns the maximum height a given element should have based on the line-
         * height of the text and the given clamp value.
         */
        function getMaxHeight(clmp) {
            var lineHeight = getLineHeight(element);
            return lineHeight * clmp;
        }

        /**
         * Returns the line-height of an element as an integer.
         */
        function getLineHeight(elem) {
            var lh = computeStyle(elem, 'line-height');
            if (lh == 'normal') {
                lh = parseInt(computeStyle(elem, 'font-size')) * 1.2;
            }
            return parseInt(lh);
        }

        var splitOnChars = opt.splitOnChars.slice(0),
            splitChar = splitOnChars[0],
            chunks,
            lastChunk;

        /**
         * Gets an element's last child. That may be another node or a node's contents.
         */
        function getLastChild(elem) {
            if (elem.lastChild.children && elem.lastChild.children.length > 0) {
                return getLastChild(Array.prototype.slice.call(elem.children).pop());
            }
            else if (!elem.lastChild || !elem.lastChild.nodeValue || elem.lastChild.nodeValue == '' || elem.lastChild.nodeValue == opt.truncationChar) {
                elem.lastChild.parentNode.removeChild(elem.lastChild);
                return getLastChild(element);
            }
            else {
                return elem.lastChild;
            }
        }

        /**
         * Removes one character at a time from the text until its width or
         * height is beneath the passed-in max param.
         */
        function truncate(target, maxHeight) {
            if (!maxHeight) {return;}

            /**
             * Resets global variables.
             */
            function reset() {
                splitOnChars = opt.splitOnChars.slice(0);
                splitChar = splitOnChars[0];
                chunks = null;
                lastChunk = null;
            }

            var nodeValue = target.nodeValue.replace(opt.truncationChar, '');

            if (!chunks) {
                if (splitOnChars.length > 0) {
                    splitChar = splitOnChars.shift();
                }
                else {
                    splitChar = '';
                }

                chunks = nodeValue.split(splitChar);
            }

            if (chunks.length > 1) {
                lastChunk = chunks.pop();
                applyEllipsis(target, chunks.join(splitChar));
            }
            else {
                chunks = null;
            }

            if (truncationHTMLContainer) {
                target.nodeValue = target.nodeValue.replace(opt.truncationChar, '');
                element.innerHTML = target.nodeValue + ' ' + truncationHTMLContainer.innerHTML + opt.truncationChar;
            }

            if (chunks) {
                if (element.clientHeight <= maxHeight) {
                    if (splitOnChars.length >= 0 && splitChar != '') {
                        applyEllipsis(target, chunks.join(splitChar) + splitChar + lastChunk);
                        chunks = null;
                    }
                    else {
                        return element.innerHTML;
                    }
                }
            }

            else {
                if (splitChar == '') {
                    applyEllipsis(target, '');
                    target = getLastChild(element);

                    reset();
                }
            }

            if (opt.animate) {
                setTimeout(function() {
                    truncate(target, maxHeight);
                }, opt.animate === true ? 10 : opt.animate);
            }
            else {
                return truncate(target, maxHeight);
            }
        }

        function applyEllipsis(elem, str) {
            elem.nodeValue = str + opt.truncationChar;
        }

        if (clampValue == 'auto') {
            clampValue = getMaxLines();
        }
        else if (isCSSValue) {
            clampValue = getMaxLines(parseInt(clampValue));
        }

        var clampedText;
        if (supportsNativeClamp && opt.useNativeClamp) {
            sty.overflow = 'hidden';
            sty.textOverflow = 'ellipsis';
            sty.webkitBoxOrient = 'vertical';
            sty.display = '-webkit-box';
            sty.webkitLineClamp = clampValue;

            if (isCSSValue) {
                sty.height = opt.clamp + 'px';
            }
        }
        else {
            var height = getMaxHeight(clampValue);
            if (height <= element.clientHeight) {
                clampedText = truncate(getLastChild(element), height);
            }
        }

        return {
            'original': originalText,
            'clamped': clampedText
        }
    }

    window.$clamp = clamp;
})();

/*
 * bubbletip
 *
 *	Copyright (c) 2009-2010, UhLeeKa.
 *	Version: 1.0.6
 *	Licensed under the GNU Lesser General Public License:
 *		http://www.gnu.org/licenses/lgpl-3.0.html
 *	Author Website: 
 *		http://www.uhleeka.com
 *	Project Hosting on Google Code: 
 *		http://code.google.com/p/bubbletip/
 */

(function ($) {
	var bindIndex = 0;
	$.fn.extend({
		open: function () {
			$(this).trigger('open.bubbletip');
		},
		close: function () {
			$(this).trigger('close.bubbletip');
		},
		bubbletip: function (tip, options) {
			$(this).data('tip', $(tip).get(0).id);
			
			// check to see if the tip is a descendant of 
			// a table.bubbletip element and therefore
			// has already been instantiated as a bubbletip
			if ($('table.bubbletip #' + $(tip).get(0).id).length > 0) {
				return this;
			}
			var _this, _tip, _options, _calc, _timeoutAnimate, _timeoutRefresh, _isActive, _isHiding, _wrapper, _bindIndex;
			// hack for IE6,IE7
			var _windowWidth, _windowHeight;

			_this = $(this);
			_tip = $(tip);
			_bindIndex = bindIndex++;  // for window.resize namespace binding
			_options = {
				id: '',
				position: 'absolute', // absolute | fixed
				fixedHorizontal: 'right', // left | right
				fixedVertical: 'bottom', // top | bottom
				positionAt: 'element', // element | body | mouse
				positionAtElement: _this,
				offsetTop: 0,
				offsetLeft: 0,
				deltaPosition: 30,
				deltaDirection: 'up', // direction: up | down | left | right
				animationDuration: 250,
				animationEasing: 'swing', // linear | swing
				delayShow: 0,
				delayHide: 500,
				calculateOnShow: false
			};
			if (options) {
				_options = $.extend(_options, options);
			}
			// calculated values
			_calc = {
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				delta: 0,
				mouseTop: 0,
				mouseLeft: 0,
				tipHeight: 0
			};
			_timeoutAnimate = null;
			_timeoutRefresh = null;
			_isActive = false;
			_isHiding = false;

			// store the tip id for removeBubbletip
			if (!_this.data('bubbletip_tips')) {
				_this.data('bubbletip_tips', [[_tip.get(0).id, _bindIndex]]);
			} else {
				_this.data('bubbletip_tips', $.merge(_this.data('bubbletip_tips'), [[_tip.get(0).id, _bindIndex]]));
			}


			// validate _options
			if (!_options.fixedVertical.match(/^top|bottom$/i)) {
				_options.positionAt = 'top';
			}
			if (!_options.fixedHorizontal.match(/^left|right$/i)) {
				_options.positionAt = 'left';
			}
			if (!_options.positionAt.match(/^element|body|mouse$/i)) {
				_options.positionAt = 'element';
			}
			if (!_options.deltaDirection.match(/^up|down|left|right$/i)) {
				_options.deltaDirection = 'up';
			}
			if (_options.id.length > 0) {
				_options.id = ' id="' + _options.id + '"';
			}

			// create the wrapper table element
			if (_options.deltaDirection.match(/^up$/i)) {
				_wrapper = $('<table' + _options.id + ' class="bubbletip" cellspacing="0" cellpadding="0"><tbody><tr><td class="bt-topleft"></td><td class="bt-top"></td><td class="bt-topright"></td></tr><tr><td class="bt-left"></td><td class="bt-content"></td><td class="bt-right"></td></tr><tr><td class="bt-bottomleft"></td><td><table class="bt-bottom" cellspacing="0" cellpadding="0"><tr><th></th><td><div></div></td><th></th></tr></table></td><td class="bt-bottomright"></td></tr></tbody></table>');
			} else if (_options.deltaDirection.match(/^down$/i)) {
				_wrapper = $('<table' + _options.id + ' class="bubbletip" cellspacing="0" cellpadding="0"><tbody><tr><td class="bt-topleft"></td><td><table class="bt-top" cellspacing="0" cellpadding="0"><tr><th></th><td><div></div></td><th></th></tr></table></td><td class="bt-topright"></td></tr><tr><td class="bt-left"></td><td class="bt-content"></td><td class="bt-right"></td></tr><tr><td class="bt-bottomleft"></td><td class="bt-bottom"></td><td class="bt-bottomright"></td></tr></tbody></table>');
			} else if (_options.deltaDirection.match(/^left$/i)) {
				_wrapper = $('<table' + _options.id + ' class="bubbletip" cellspacing="0" cellpadding="0"><tbody><tr><td class="bt-topleft"></td><td class="bt-top"></td><td class="bt-topright"></td></tr><tr><td class="bt-left"></td><td class="bt-content"></td><td class="bt-right-tail"><div class="bt-right"></div><div class="bt-right-tail"></div><div class="bt-right"></div></td></tr><tr><td class="bt-bottomleft"></td><td class="bt-bottom"></td><td class="bt-bottomright"></td></tr></tbody></table>');
			} else if (_options.deltaDirection.match(/^right$/i)) {
				_wrapper = $('<table' + _options.id + ' class="bubbletip" cellspacing="0" cellpadding="0"><tbody><tr><td class="bt-topleft"></td><td class="bt-top"></td><td class="bt-topright"></td></tr><tr><td class="bt-left-tail"><div class="bt-left"></div><div class="bt-left-tail"></div><div class="bt-left"></div></td><td class="bt-content"></td><td class="bt-right"></td></tr><tr><td class="bt-bottomleft"></td><td class="bt-bottom"></td><td class="bt-bottomright"></td></tr></tbody></table>');
			}

			// append the wrapper to the document body
			_wrapper.appendTo('body');

			// apply IE filters to _wrapper elements
			if ((/msie/.test(navigator.userAgent.toLowerCase())) && (!/opera/.test(navigator.userAgent.toLowerCase()))) {
				$('*', _wrapper).each(function () {
					var image = $(this).css('background-image');
					if (image.match(/^url\(["']?(.*\.png)["']?\)$/i)) {
						image = RegExp.$1;
						$(this).css({
							'backgroundImage': 'none',
							'filter': 'progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled=true, sizingMethod=' + ($(this).css('backgroundRepeat') == 'no-repeat' ? 'crop' : 'scale') + ', src=\'' + image + '\')'
						}).each(function () {
							var position = $(this).css('position');
							if (position != 'absolute' && position != 'relative')
								$(this).css('position', 'relative');
						});
					}
				});
			}
			// move the tip element into the content section of the wrapper
			$('.bt-content', _wrapper).append(_tip);
			// show the tip (in case it is hidden) so that we can calculate its dimensions
			_tip.show();
			// handle left|right delta
			if (_options.deltaDirection.match(/^left|right$/i)) {
				// tail is 40px, so divide height by two and subtract 20px;
				_calc.tipHeight = parseInt(_tip.height() / 2, 10);
				// handle odd integer height
				if ((_tip.height() % 2) == 1) {
					_calc.tipHeight++;
				}
				_calc.tipHeight = (_calc.tipHeight < 20) ? 1 : _calc.tipHeight - 20;
				if (_options.deltaDirection.match(/^left$/i)) {
					$('div.bt-right', _wrapper).css('height', _calc.tipHeight + 'px');
				} else {
					$('div.bt-left', _wrapper).css('height', _calc.tipHeight + 'px');
				}
			}
			// set the opacity of the wrapper to 0
			_wrapper.css('opacity', 0);
			// hack for FF 3.6
			_wrapper.css({ 'width': _wrapper.width(), 'height': _wrapper.height() });
			// execute initial calculations
			_Calculate();
			_wrapper.hide();

			// handle window.resize
			$(window).bind('resize.bubbletip' + _bindIndex, function () {
				var w = $(window).width();
				var h = $(window).height();

				if (_options.position.match(/^fixed$/i) || ((w === _windowWidth) && (h === _windowHeight))) {
					return;
				}
				_windowWidth = w;
				_windowHeight = h;

				if (_timeoutRefresh) {
					clearTimeout(_timeoutRefresh);
				}
				_timeoutRefresh = setTimeout(function () {
					_Calculate();
				}, 250);
			});
			$([_wrapper.get(0), this.get(0)]).bind('open.bubbletip', function () {
				_isActive = false;
				if (_timeoutAnimate) {
					clearTimeout(_timeoutAnimate);
				}
				if (_options.delayShow === 0) {
					_Show();
				} else {
					_timeoutAnimate = setTimeout(function () {
						_Show();
					}, _options.delayShow);
				}
				return false;
			});
			
			$([_wrapper.get(0), this.get(0)]).bind('close.bubbletip', function () {
				if (_timeoutAnimate) {
					clearTimeout(_timeoutAnimate);
				}
				if (_options.delayHide === 0) {
					_Hide();
				} else {
					_timeoutAnimate = setTimeout(function () {
						_Hide();
					}, _options.delayHide);
				}
				return false;
			});
			
			
			function _Show() {
				var animation;

				if (_isActive) { // the tip is currently showing; do nothing
					return;
				}
				_isActive = true;
				if (_isHiding) { // the tip is currently hiding; interrupt and start showing again
					_wrapper.stop(true, false);
				}

				if (_options.calculateOnShow) {
					_Calculate();
				}
				if (_options.position.match(/^fixed$/i)) {
					animation = {};
					if (_options.deltaDirection.match(/^up|down$/i)) {
						if (_options.fixedVertical.match(/^top$/i)) {
							if (!_isHiding) {
								_wrapper.css('top', parseInt(_calc.top - _calc.delta, 10) + 'px');
							}
							animation.top = parseInt(_calc.top, 10) + 'px';
						} else {
							if (!_isHiding) {
								_wrapper.css('bottom', parseInt(_calc.bottom + _calc.delta, 10) + 'px');
							}
							animation.bottom = parseInt(_calc.bottom, 10) + 'px';
						}
					} else {
						if (_options.fixedHorizontal.match(/^right$/i)) {
							if (!_isHiding) {
								if (_options.fixedVertical.match(/^top$/i)) {
									_wrapper.css({ 'top': parseInt(_calc.top, 10) + 'px', 'right': parseInt(_calc.right - _calc.delta, 10) + 'px' });
								} else {
									_wrapper.css({ 'bottom': parseInt(_calc.bottom, 10) + 'px', 'right': parseInt(_calc.right - _calc.delta, 10) + 'px' });
								}
							}
							animation.right = parseInt(_calc.right, 10) + 'px';
						} else {
							if (!_isHiding) {
								if (_options.fixedVertical.match(/^top$/i)) {
									_wrapper.css({ 'top': parseInt(_calc.top, 10) + 'px', 'left': parseInt(_calc.left + _calc.delta, 10) + 'px' });
								} else {
									_wrapper.css({ 'bottom': parseInt(_calc.bottom, 10) + 'px', 'left': parseInt(_calc.left + _calc.delta, 10) + 'px' });
								}
							}
							animation.left = parseInt(_calc.left, 10) + 'px';
						}
					}
				} else {
					if (_options.positionAt.match(/^element|body$/i)) {
						if (_options.deltaDirection.match(/^up|down$/i)) {
							if (!_isHiding) {
								_wrapper.css('top', parseInt(_calc.top - _calc.delta, 10) + 'px');
							}
							animation = { 'top': _calc.top + 'px' };
						} else {
							if (!_isHiding) {
								_wrapper.css('left', parseInt(_calc.left - _calc.delta, 10) + 'px');
							}
							animation = { 'left': _calc.left + 'px' };
						}
					} else {
						if (_options.deltaDirection.match(/^up|down$/i)) {
							if (!_isHiding) {
								_calc.mouseTop = e.pageY + _calc.top;
								_wrapper.css({ 'top': parseInt(_calc.mouseTop + _calc.delta, 10) + 'px', 'left': parseInt(e.pageX - (_wrapper.width() / 2), 10) + 'px' });
							}
							animation = { 'top': _calc.mouseTop + 'px' };
						} else {
							if (!_isHiding) {
								_calc.mouseLeft = e.pageX + _calc.left;
								_wrapper.css({ 'left': parseInt(_calc.mouseLeft + _calc.delta, 10) + 'px', 'top': parseInt(e.pageY - (_wrapper.height() / 2), 10) + 'px' });
							}
							animation = { 'left': _calc.left + 'px' };
						}
					}
				}
				_isHiding = false;
				_wrapper.show();
				animation = $.extend(animation, { 'opacity': 1 });
				_wrapper.animate(animation, _options.animationDuration, _options.animationEasing, function () {
					if (_options.position.match(/^fixed$/i)) {
						_wrapper.css({
							'opacity': '',
							'position': 'fixed',
							'top': _calc.top,
							'left': _calc.left
						});
					} else {
						_wrapper.css('opacity', '');
					}
					_isActive = true;
				});
			}
			function _Hide() {
				var animation;

				_isActive = false;
				_isHiding = true;
				if (_options.position.match(/^fixed$/i)) {
					animation = {};
					if (_options.deltaDirection.match(/^up|down$/i))  {
						if (_calc.bottom !== '') { animation.bottom = parseInt(_calc.bottom + _calc.delta, 10) + 'px'; }
						if (_calc.top !== '') { animation.top = parseInt(_calc.top - _calc.delta, 10) + 'px'; }
					} else {
						if (_options.fixedHorizontal.match(/^left$/i)) {
							if (_calc.right !== '') { animation.right = parseInt(_calc.right + _calc.delta, 10) + 'px'; }
							if (_calc.left !== '') { animation.left = parseInt(_calc.left + _calc.delta, 10) + 'px'; }
						} else {
							if (_calc.right !== '') { animation.right = parseInt(_calc.right - _calc.delta, 10) + 'px'; }
							if (_calc.left !== '') { animation.left = parseInt(_calc.left - _calc.delta, 10) + 'px'; }
						}
					}
				} else {
					if (_options.positionAt.match(/^element|body$/i)) {
						if (_options.deltaDirection.match(/^up|down$/i)) {
							animation = { 'top': parseInt(_calc.top - _calc.delta, 10) + 'px' };
						} else {
							animation = { 'left': parseInt(_calc.left - _calc.delta, 10) + 'px' };
						}
					} else {
						if (_options.deltaDirection.match(/^up|down$/i)) {
							animation = { 'top': parseInt(_calc.mouseTop - _calc.delta, 10) + 'px' };
						} else {
							animation = { 'left': parseInt(_calc.mouseLeft - _calc.delta, 10) + 'px' };
						}
					}
				}
				animation = $.extend(animation, {
					'opacity': 0
				});
				_wrapper.animate(animation, _options.animationDuration, _options.animationEasing, function () {
					_wrapper.hide();
					_isHiding = false;
				});
			}
			function _Calculate() {
				var offset;
				// calculate values
				if (_options.position.match(/^fixed$/i)) {
					offset = _options.positionAtElement.offset();
					if (_options.fixedHorizontal.match(/^left$/i)) {
						_calc.left = offset.left + (_options.positionAtElement.outerWidth() / 2);
					} else {
						_calc.left = '';
					}
					if (_options.fixedHorizontal.match(/^right$/i)) {
						_calc.right = ($(window).width() - offset.left) - ((_options.positionAtElement.outerWidth() + _wrapper.outerWidth()) / 2);
					} else {
						_calc.right = '';
					}
					if (_options.fixedVertical.match(/^top$/i)) {
						_calc.top = offset.top - $(window).scrollTop() - _wrapper.outerHeight();
					} else {
						_calc.top = '';
					}
					if (_options.fixedVertical.match(/^bottom$/i)) {
						_calc.bottom = $(window).scrollTop() + $(window).height() - offset.top + _options.offsetTop;
					} else {
						_calc.bottom = '';
					}
					if (_options.deltaDirection.match(/^left|right$/i)) {
						if (_options.fixedVertical.match(/^top$/i)) {
							_calc.top = _calc.top + (_wrapper.outerHeight() / 2) + (_options.positionAtElement.outerHeight() / 2);
						} else {
							_calc.bottom = _calc.bottom - (_wrapper.outerHeight() / 2) - (_options.positionAtElement.outerHeight() / 2);
						}
					}
					if (_options.deltaDirection.match(/^left$/i)) {
						if (_options.fixedHorizontal.match(/^left$/i)) {
							_calc.left = _calc.left - _wrapper.outerWidth();
						} else {
							_calc.right = _calc.right + (_wrapper.outerWidth() / 2);
						}
					} else if (_options.deltaDirection.match(/^right$/i)) {
						if (_options.fixedHorizontal.match(/^left$/i)) {
							_calc.left = _calc.left;
						} else {
							_calc.right = _calc.right - (_wrapper.outerWidth() / 2);
						}
					} else if (_options.deltaDirection.match(/^down$/i)) {
						if (_options.fixedVertical.match(/^top$/i)) {
							_calc.top = _calc.top + _wrapper.outerHeight() + _options.positionAtElement.outerHeight();
						} else {
							_calc.bottom = _calc.bottom - _wrapper.outerHeight() - _options.positionAtElement.outerHeight();
						}
						if (_options.fixedHorizontal.match(/^left$/i)) {
							_calc.left = _calc.left - (_wrapper.outerWidth() / 2);
						}
					} else {
						if (_options.fixedHorizontal.match(/^left$/i)) {
							_calc.left = _calc.left - (_wrapper.outerWidth() / 2);
						}
					}
					if (_options.deltaDirection.match(/^up|right$/i) && _options.fixedHorizontal.match(/^left|right$/i)) {
						_calc.delta = _options.deltaPosition;
					} else {
						_calc.delta = -_options.deltaPosition;
					}
				} else if (_options.positionAt.match(/^element$/i)) {
					offset = _options.positionAtElement.offset();
					if (_options.deltaDirection.match(/^up$/i)) {
						_calc.top = offset.top + _options.offsetTop - _wrapper.outerHeight();
						_calc.left = offset.left + _options.offsetLeft + ((_options.positionAtElement.outerWidth() - _wrapper.outerWidth()) / 2);
						_calc.delta = _options.deltaPosition;
					} else if (_options.deltaDirection.match(/^down$/i)) {
						_calc.top = offset.top + _options.positionAtElement.outerHeight() + _options.offsetTop;
						_calc.left = offset.left + _options.offsetLeft + ((_options.positionAtElement.outerWidth() - _wrapper.outerWidth()) / 2);
						_calc.delta = -_options.deltaPosition;
					} else if (_options.deltaDirection.match(/^left$/i)) {
						_calc.top = offset.top + _options.offsetTop + ((_options.positionAtElement.outerHeight() - _wrapper.outerHeight()) / 2);
						_calc.left = offset.left + _options.offsetLeft - _wrapper.outerWidth();
						_calc.delta = _options.deltaPosition;
					} else if (_options.deltaDirection.match(/^right$/i)) {
						_calc.top = offset.top + _options.offsetTop + ((_options.positionAtElement.outerHeight() - _wrapper.outerHeight()) / 2);
						_calc.left = offset.left + _options.positionAtElement.outerWidth() + _options.offsetLeft;
						_calc.delta = -_options.deltaPosition;
					}
				} else if (_options.positionAt.match(/^body$/i)) {
					if (_options.deltaDirection.match(/^up|left$/i)) {
						_calc.top = _options.offsetTop;
						_calc.left = _options.offsetLeft;
						// up or left
						_calc.delta = _options.deltaPosition;
					} else {
						if (_options.deltaDirection.match(/^down$/i)) {
							_calc.top = parseInt(_options.offsetTop + _wrapper.outerHeight(), 10);
							_calc.left = _options.offsetLeft;
						} else {
							_calc.top = _options.offsetTop;
							_calc.left = parseInt(_options.offsetLeft + _wrapper.outerWidth(), 10);
						}
						// down or right
						_calc.delta = -_options.deltaPosition;
					}
				} else if (_options.positionAt.match(/^mouse$/i)) {
					if (_options.deltaDirection.match(/^up|left$/i)) {
						if (_options.deltaDirection.match(/^up$/i)) {
							_calc.top = -(_options.offsetTop + _wrapper.outerHeight());
							_calc.left = _options.offsetLeft;
						} else if (_options.deltaDirection.match(/^left$/i)) {
							_calc.top = _options.offsetTop;
							_calc.left = -(_options.offsetLeft + _wrapper.outerWidth());
						}
						// up or left
						_calc.delta = _options.deltaPosition;
					} else {
						_calc.top = _options.offsetTop;
						_calc.left = _options.offsetLeft;
						// down or right
						_calc.delta = -_options.deltaPosition;
					}
				}

				// handle the wrapper (element|body) positioning
				if (_options.position.match(/^fixed$/i)) {
					if (_options.positionAt.match(/^element|body$/i)) {
						_wrapper.css({
							'position': 'fixed',
							'left': _calc.left,
							'top': _calc.top,
							'right': _calc.right + 'px',
							'bottom': _calc.bottom + 'px'
						});
					}
				} else {
					if (_options.positionAt.match(/^element|body$/i)) {
						_wrapper.css({
							'position': 'absolute',
							'top': _calc.top + 'px',
							'left': _calc.left + 'px'
						});
					}
				}
			}
			return this;
		},
		removeBubbletip: function (tips) {
			var tipsActive;
			var tipsToRemove = [];
			var tipsActiveAdjusted = [];
			var arr, i, ix;
			var elem;

			tipsActive = $.makeArray($(this).data('bubbletip_tips'));

			// convert the parameter array of tip id's or elements to id's
			arr = $.makeArray(tips);
			for (i = 0; i < arr.length; i++) {
				tipsToRemove.push($(arr[i]).get(0).id);
			}

			for (i = 0; i < tipsActive.length; i++) {
				ix = null;
				if ((tipsToRemove.length === 0) || ((ix = $.inArray(tipsActive[i][0], tipsToRemove)) >= 0)) {
					// remove all tips if there are none specified
					// otherwise, remove only specified tips

					// find the surrounding table.bubbletip
					elem = $('#' + tipsActive[i][0]).get(0).parentNode;
					while (elem.tagName.toLowerCase() != 'table') {
						elem = elem.parentNode;
					}
					// attach the tip element to body and hide
					$('#' + tipsActive[i][0]).appendTo('body').hide();
					// remove the surrounding table.bubbletip
					$(elem).remove();

					// unbind show/hide events
					$(this).unbind('.bubbletip' + tipsActive[i][1]);

					// unbind window.resize event
					$(window).unbind('.bubbletip' + tipsActive[i][1]);
				} else {
					// tip is not being removed, so add it to the adjusted array
					tipsActiveAdjusted.push(tipsActive[i]);
				}
			}
			$(this).data('bubbletip_tips', tipsActiveAdjusted);

			return this;
		}
	});
})(jQuery);
/*!
 * JavaScript Cookie v2.0.2
 * https://github.com/js-cookie/js-cookie
 *
 * Copyright 2006, 2015 Klaus Hartl
 * Released under the MIT license
 */
(function (factory) {
	if (typeof define === 'function' && define.amd) {
		define(factory);
	} else if (typeof exports === 'object') {
		module.exports = factory();
	} else {
		var _OldCookies = window.Cookies;
		var api = window.Cookies = factory(window.jQuery);
		api.noConflict = function () {
			window.Cookies = _OldCookies;
			return api;
		};
	}
}(function () {
	function extend () {
		var i = 0;
		var result = {};
		for (; i < arguments.length; i++) {
			var attributes = arguments[ i ];
			for (var key in attributes) {
				result[key] = attributes[key];
			}
		}
		return result;
	}

	function init (converter) {
		function api (key, value, attributes) {
			var result;

			// Write

			if (arguments.length > 1) {
				attributes = extend({
					path: '/'
				}, api.defaults, attributes);

				if (typeof attributes.expires === 'number') {
					var expires = new Date();
					expires.setMilliseconds(expires.getMilliseconds() + attributes.expires * 864e+5);
					attributes.expires = expires;
				}

				try {
					result = JSON.stringify(value);
					if (/^[\{\[]/.test(result)) {
						value = result;
					}
				} catch (e) {}

				value = encodeURIComponent(String(value));
				value = value.replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);

				key = encodeURIComponent(String(key));
				key = key.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent);
				key = key.replace(/[\(\)]/g, escape);

				return (document.cookie = [
					key, '=', value,
					attributes.expires && '; expires=' + attributes.expires.toUTCString(), // use expires attribute, max-age is not supported by IE
					attributes.path    && '; path=' + attributes.path,
					attributes.domain  && '; domain=' + attributes.domain,
					attributes.secure ? '; secure' : ''
				].join(''));
			}

			// Read

			if (!key) {
				result = {};
			}

			// To prevent the for loop in the first place assign an empty array
			// in case there are no cookies at all. Also prevents odd result when
			// calling "get()"
			var cookies = document.cookie ? document.cookie.split('; ') : [];
			var rdecode = /(%[0-9A-Z]{2})+/g;
			var i = 0;

			for (; i < cookies.length; i++) {
				var parts = cookies[i].split('=');
				var name = parts[0].replace(rdecode, decodeURIComponent);
				var cookie = parts.slice(1).join('=');

				if (cookie.charAt(0) === '"') {
					cookie = cookie.slice(1, -1);
				}

				try {
					cookie = converter && converter(cookie, name) || cookie.replace(rdecode, decodeURIComponent);

					if (this.json) {
						try {
							cookie = JSON.parse(cookie);
						} catch (e) {}
					}

					if (key === name) {
						result = cookie;
						break;
					}

					if (!key) {
						result[name] = cookie;
					}
				} catch (e) {}
			}

			return result;
		}

		api.get = api.set = api;
		api.getJSON = function () {
			return api.apply({
				json: true
			}, [].slice.call(arguments));
		};
		api.defaults = {};

		api.remove = function (key, attributes) {
			api(key, '', extend(attributes, {
				expires: -1
			}));
		};

		api.withConverter = init;

		return api;
	}

	return init();
}));

/*!
 * fancyBox - jQuery Plugin
 * version: 2.1.5 (Fri, 14 Jun 2013)
 * @requires jQuery v1.6 or later
 *
 * Examples at http://fancyapps.com/fancybox/
 * License: www.fancyapps.com/fancybox/#license
 *
 * Copyright 2012 Janis Skarnelis - janis@fancyapps.com
 *
 */

(function (window, document, $, undefined) {
	"use strict";

	var H = $("html"),
		W = $(window),
		D = $(document),
		F = $.fancybox = function () {
			F.open.apply( this, arguments );
		},
		IE =  navigator.userAgent.match(/msie/i),
		didUpdate	= null,
		isTouch		= document.createTouch !== undefined,

		isQuery	= function(obj) {
			return obj && obj.hasOwnProperty && obj instanceof $;
		},
		isString = function(str) {
			return str && $.type(str) === "string";
		},
		isPercentage = function(str) {
			return isString(str) && str.indexOf('%') > 0;
		},
		isScrollable = function(el) {
			return (el && !(el.style.overflow && el.style.overflow === 'hidden') && ((el.clientWidth && el.scrollWidth > el.clientWidth) || (el.clientHeight && el.scrollHeight > el.clientHeight)));
		},
		getScalar = function(orig, dim) {
			var value = parseInt(orig, 10) || 0;

			if (dim && isPercentage(orig)) {
				value = F.getViewport()[ dim ] / 100 * value;
			}

			return Math.ceil(value);
		},
		getValue = function(value, dim) {
			return getScalar(value, dim) + 'px';
		};

	$.extend(F, {
		// The current version of fancyBox
		version: '2.1.5',

		defaults: {
			padding : 15,
			margin  : 20,

			width     : 800,
			height    : 600,
			minWidth  : 100,
			minHeight : 100,
			maxWidth  : 9999,
			maxHeight : 9999,
			pixelRatio: 1, // Set to 2 for retina display support

			autoSize   : true,
			autoHeight : false,
			autoWidth  : false,

			autoResize  : true,
			autoCenter  : !isTouch,
			fitToView   : true,
			aspectRatio : false,
			topRatio    : 0.5,
			leftRatio   : 0.5,

			scrolling : 'auto', // 'auto', 'yes' or 'no'
			wrapCSS   : '',

			arrows     : true,
			closeBtn   : true,
			closeClick : false,
			nextClick  : false,
			mouseWheel : true,
			autoPlay   : false,
			playSpeed  : 3000,
			preload    : 3,
			modal      : false,
			loop       : true,

			ajax  : {
				dataType : 'html',
				headers  : { 'X-fancyBox': true }
			},
			iframe : {
				scrolling : 'auto',
				preload   : true
			},
			swf : {
				wmode: 'transparent',
				allowfullscreen   : 'true',
				allowscriptaccess : 'always'
			},

			keys  : {
				next : {
					13 : 'left', // enter
					34 : 'up',   // page down
					39 : 'left', // right arrow
					40 : 'up'    // down arrow
				},
				prev : {
					8  : 'right',  // backspace
					33 : 'down',   // page up
					37 : 'right',  // left arrow
					38 : 'down'    // up arrow
				},
				close  : [27], // escape key
				play   : [32], // space - start/stop slideshow
				toggle : [70]  // letter "f" - toggle fullscreen
			},

			direction : {
				next : 'left',
				prev : 'right'
			},

			scrollOutside  : true,

			// Override some properties
			index   : 0,
			type    : null,
			href    : null,
			content : null,
			title   : null,

			// HTML templates
			tpl: {
				wrap     : '<div class="fancybox-wrap" tabIndex="-1"><div class="fancybox-skin"><div class="fancybox-outer"><div class="fancybox-inner"></div></div></div></div>',
				image    : '<img class="fancybox-image" src="{href}" alt="" />',
				iframe   : '<iframe id="fancybox-frame{rnd}" name="fancybox-frame{rnd}" class="fancybox-iframe" frameborder="0" vspace="0" hspace="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen' + (IE ? ' allowtransparency="true"' : '') + '></iframe>',
				error    : '<p class="fancybox-error">The requested content cannot be loaded.<br/>Please try again later.</p>',
				closeBtn : '<a title="Close" class="fancybox-item fancybox-close" href="javascript:;"></a>',
				next     : '<a title="Next" class="fancybox-nav fancybox-next" href="javascript:;"><span></span></a>',
				prev     : '<a title="Previous" class="fancybox-nav fancybox-prev" href="javascript:;"><span></span></a>'
			},

			// Properties for each animation type
			// Opening fancyBox
			openEffect  : 'fade', // 'elastic', 'fade' or 'none'
			openSpeed   : 250,
			openEasing  : 'swing',
			openOpacity : true,
			openMethod  : 'zoomIn',

			// Closing fancyBox
			closeEffect  : 'fade', // 'elastic', 'fade' or 'none'
			closeSpeed   : 250,
			closeEasing  : 'swing',
			closeOpacity : true,
			closeMethod  : 'zoomOut',

			// Changing next gallery item
			nextEffect : 'elastic', // 'elastic', 'fade' or 'none'
			nextSpeed  : 250,
			nextEasing : 'swing',
			nextMethod : 'changeIn',

			// Changing previous gallery item
			prevEffect : 'elastic', // 'elastic', 'fade' or 'none'
			prevSpeed  : 250,
			prevEasing : 'swing',
			prevMethod : 'changeOut',

			// Enable default helpers
			helpers : {
				overlay : true,
				title   : true
			},

			// Callbacks
			onCancel     : $.noop, // If canceling
			beforeLoad   : $.noop, // Before loading
			afterLoad    : $.noop, // After loading
			beforeShow   : $.noop, // Before changing in current item
			afterShow    : $.noop, // After opening
			beforeChange : $.noop, // Before changing gallery item
			beforeClose  : $.noop, // Before closing
			afterClose   : $.noop  // After closing
		},

		//Current state
		group    : {}, // Selected group
		opts     : {}, // Group options
		previous : null,  // Previous element
		coming   : null,  // Element being loaded
		current  : null,  // Currently loaded element
		isActive : false, // Is activated
		isOpen   : false, // Is currently open
		isOpened : false, // Have been fully opened at least once

		wrap  : null,
		skin  : null,
		outer : null,
		inner : null,

		player : {
			timer    : null,
			isActive : false
		},

		// Loaders
		ajaxLoad   : null,
		imgPreload : null,

		// Some collections
		transitions : {},
		helpers     : {},

		/*
		 *	Static methods
		 */

		open: function (group, opts) {
			if (!group) {
				return;
			}

			if (!$.isPlainObject(opts)) {
				opts = {};
			}

			// Close if already active
			if (false === F.close(true)) {
				return;
			}

			// Normalize group
			if (!$.isArray(group)) {
				group = isQuery(group) ? $(group).get() : [group];
			}

			// Recheck if the type of each element is `object` and set content type (image, ajax, etc)
			$.each(group, function(i, element) {
				var obj = {},
					href,
					title,
					content,
					type,
					rez,
					hrefParts,
					selector;

				if ($.type(element) === "object") {
					// Check if is DOM element
					if (element.nodeType) {
						element = $(element);
					}

					if (isQuery(element)) {
						obj = {
							href    : element.data('fancybox-href') || element.attr('href'),
							title   : element.data('fancybox-title') || element.attr('title'),
							isDom   : true,
							element : element
						};

						if ($.metadata) {
							$.extend(true, obj, element.metadata());
						}

					} else {
						obj = element;
					}
				}

				href  = opts.href  || obj.href || (isString(element) ? element : null);
				title = opts.title !== undefined ? opts.title : obj.title || '';

				content = opts.content || obj.content;
				type    = content ? 'html' : (opts.type  || obj.type);

				if (!type && obj.isDom) {
					type = element.data('fancybox-type');

					if (!type) {
						rez  = element.prop('class').match(/fancybox\.(\w+)/);
						type = rez ? rez[1] : null;
					}
				}

				if (isString(href)) {
					// Try to guess the content type
					if (!type) {
						if (F.isImage(href)) {
							type = 'image';

						} else if (F.isSWF(href)) {
							type = 'swf';

						} else if (href.charAt(0) === '#') {
							type = 'inline';

						} else if (isString(element)) {
							type    = 'html';
							content = element;
						}
					}

					// Split url into two pieces with source url and content selector, e.g,
					// "/mypage.html #my_id" will load "/mypage.html" and display element having id "my_id"
					if (type === 'ajax') {
						hrefParts = href.split(/\s+/, 2);
						href      = hrefParts.shift();
						selector  = hrefParts.shift();
					}
				}

				if (!content) {
					if (type === 'inline') {
						if (href) {
							content = $( isString(href) ? href.replace(/.*(?=#[^\s]+$)/, '') : href ); //strip for ie7

						} else if (obj.isDom) {
							content = element;
						}

					} else if (type === 'html') {
						content = href;

					} else if (!type && !href && obj.isDom) {
						type    = 'inline';
						content = element;
					}
				}

				$.extend(obj, {
					href     : href,
					type     : type,
					content  : content,
					title    : title,
					selector : selector
				});

				group[ i ] = obj;
			});

			// Extend the defaults
			F.opts = $.extend(true, {}, F.defaults, opts);

			// All options are merged recursive except keys
			if (opts.keys !== undefined) {
				F.opts.keys = opts.keys ? $.extend({}, F.defaults.keys, opts.keys) : false;
			}

			F.group = group;

			return F._start(F.opts.index);
		},

		// Cancel image loading or abort ajax request
		cancel: function () {
			var coming = F.coming;

			if (!coming || false === F.trigger('onCancel')) {
				return;
			}

			F.hideLoading();

			if (F.ajaxLoad) {
				F.ajaxLoad.abort();
			}

			F.ajaxLoad = null;

			if (F.imgPreload) {
				F.imgPreload.onload = F.imgPreload.onerror = null;
			}

			if (coming.wrap) {
				coming.wrap.stop(true, true).trigger('onReset').remove();
			}

			F.coming = null;

			// If the first item has been canceled, then clear everything
			if (!F.current) {
				F._afterZoomOut( coming );
			}
		},

		// Start closing animation if is open; remove immediately if opening/closing
		close: function (event) {
			F.cancel();

			if (false === F.trigger('beforeClose')) {
				return;
			}

			F.unbindEvents();

			if (!F.isActive) {
				return;
			}

			if (!F.isOpen || event === true) {
				$('.fancybox-wrap').stop(true).trigger('onReset').remove();

				F._afterZoomOut();

			} else {
				F.isOpen = F.isOpened = false;
				F.isClosing = true;

				$('.fancybox-item, .fancybox-nav').remove();

				F.wrap.stop(true, true).removeClass('fancybox-opened');

				F.transitions[ F.current.closeMethod ]();
			}
		},

		// Manage slideshow:
		//   $.fancybox.play(); - toggle slideshow
		//   $.fancybox.play( true ); - start
		//   $.fancybox.play( false ); - stop
		play: function ( action ) {
			var clear = function () {
					clearTimeout(F.player.timer);
				},
				set = function () {
					clear();

					if (F.current && F.player.isActive) {
						F.player.timer = setTimeout(F.next, F.current.playSpeed);
					}
				},
				stop = function () {
					clear();

					D.unbind('.player');

					F.player.isActive = false;

					F.trigger('onPlayEnd');
				},
				start = function () {
					if (F.current && (F.current.loop || F.current.index < F.group.length - 1)) {
						F.player.isActive = true;

						D.bind({
							'onCancel.player beforeClose.player' : stop,
							'onUpdate.player'   : set,
							'beforeLoad.player' : clear
						});

						set();

						F.trigger('onPlayStart');
					}
				};

			if (action === true || (!F.player.isActive && action !== false)) {
				start();
			} else {
				stop();
			}
		},

		// Navigate to next gallery item
		next: function ( direction ) {
			var current = F.current;

			if (current) {
				if (!isString(direction)) {
					direction = current.direction.next;
				}

				F.jumpto(current.index + 1, direction, 'next');
			}
		},

		// Navigate to previous gallery item
		prev: function ( direction ) {
			var current = F.current;

			if (current) {
				if (!isString(direction)) {
					direction = current.direction.prev;
				}

				F.jumpto(current.index - 1, direction, 'prev');
			}
		},

		// Navigate to gallery item by index
		jumpto: function ( index, direction, router ) {
			var current = F.current;

			if (!current) {
				return;
			}

			index = getScalar(index);

			F.direction = direction || current.direction[ (index >= current.index ? 'next' : 'prev') ];
			F.router    = router || 'jumpto';

			if (current.loop) {
				if (index < 0) {
					index = current.group.length + (index % current.group.length);
				}

				index = index % current.group.length;
			}

			if (current.group[ index ] !== undefined) {
				F.cancel();

				F._start(index);
			}
		},

		// Center inside viewport and toggle position type to fixed or absolute if needed
		reposition: function (e, onlyAbsolute) {
			var current = F.current,
				wrap    = current ? current.wrap : null,
				pos;

			if (wrap) {
				pos = F._getPosition(onlyAbsolute);

				if (e && e.type === 'scroll') {
					delete pos.position;

					wrap.stop(true, true).animate(pos, 200);

				} else {
					wrap.css(pos);

					current.pos = $.extend({}, current.dim, pos);
				}
			}
		},

		update: function (e) {
			var type = (e && e.type),
				anyway = !type || type === 'orientationchange';

			if (anyway) {
				clearTimeout(didUpdate);

				didUpdate = null;
			}

			if (!F.isOpen || didUpdate) {
				return;
			}

			didUpdate = setTimeout(function() {
				var current = F.current;

				if (!current || F.isClosing) {
					return;
				}

				F.wrap.removeClass('fancybox-tmp');

				if (anyway || type === 'load' || (type === 'resize' && current.autoResize)) {
					F._setDimension();
				}

				if (!(type === 'scroll' && current.canShrink)) {
					F.reposition(e);
				}

				F.trigger('onUpdate');

				didUpdate = null;

			}, (anyway && !isTouch ? 0 : 300));
		},

		// Shrink content to fit inside viewport or restore if resized
		toggle: function ( action ) {
			if (F.isOpen) {
				F.current.fitToView = $.type(action) === "boolean" ? action : !F.current.fitToView;

				// Help browser to restore document dimensions
				if (isTouch) {
					F.wrap.removeAttr('style').addClass('fancybox-tmp');

					F.trigger('onUpdate');
				}

				F.update();
			}
		},

		hideLoading: function () {
			D.unbind('.loading');

			$('#fancybox-loading').remove();
		},

		showLoading: function () {
			var el, viewport;

			F.hideLoading();

			el = $('<div id="fancybox-loading"><div></div></div>').click(F.cancel).appendTo('body');

			// If user will press the escape-button, the request will be canceled
			D.bind('keydown.loading', function(e) {
				if ((e.which || e.keyCode) === 27) {
					e.preventDefault();

					F.cancel();
				}
			});

			if (!F.defaults.fixed) {
				viewport = F.getViewport();

				el.css({
					position : 'absolute',
					top  : (viewport.h * 0.5) + viewport.y,
					left : (viewport.w * 0.5) + viewport.x
				});
			}
		},

		getViewport: function () {
			var locked = (F.current && F.current.locked) || false,
				rez    = {
					x: W.scrollLeft(),
					y: W.scrollTop()
				};

			if (locked) {
				rez.w = locked[0].clientWidth;
				rez.h = locked[0].clientHeight;

			} else {
				// See http://bugs.jquery.com/ticket/6724
				rez.w = isTouch && window.innerWidth  ? window.innerWidth  : W.width();
				rez.h = isTouch && window.innerHeight ? window.innerHeight : W.height();
			}

			return rez;
		},

		// Unbind the keyboard / clicking actions
		unbindEvents: function () {
			if (F.wrap && isQuery(F.wrap)) {
				F.wrap.unbind('.fb');
			}

			D.unbind('.fb');
			W.unbind('.fb');
		},

		bindEvents: function () {
			var current = F.current,
				keys;

			if (!current) {
				return;
			}

			// Changing document height on iOS devices triggers a 'resize' event,
			// that can change document height... repeating infinitely
			W.bind('orientationchange.fb' + (isTouch ? '' : ' resize.fb') + (current.autoCenter && !current.locked ? ' scroll.fb' : ''), F.update);

			keys = current.keys;

			if (keys) {
				D.bind('keydown.fb', function (e) {
					var code   = e.which || e.keyCode,
						target = e.target || e.srcElement;

					// Skip esc key if loading, because showLoading will cancel preloading
					if (code === 27 && F.coming) {
						return false;
					}

					// Ignore key combinations and key events within form elements
					if (!e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey && !(target && (target.type || $(target).is('[contenteditable]')))) {
						$.each(keys, function(i, val) {
							if (current.group.length > 1 && val[ code ] !== undefined) {
								F[ i ]( val[ code ] );

								e.preventDefault();
								return false;
							}

							if ($.inArray(code, val) > -1) {
								F[ i ] ();

								e.preventDefault();
								return false;
							}
						});
					}
				});
			}

			if ($.fn.mousewheel && current.mouseWheel) {
				F.wrap.bind('mousewheel.fb', function (e, delta, deltaX, deltaY) {
					var target = e.target || null,
						parent = $(target),
						canScroll = false;

					while (parent.length) {
						if (canScroll || parent.is('.fancybox-skin') || parent.is('.fancybox-wrap')) {
							break;
						}

						canScroll = isScrollable( parent[0] );
						parent    = $(parent).parent();
					}

					if (delta !== 0 && !canScroll) {
						if (F.group.length > 1 && !current.canShrink) {
							if (deltaY > 0 || deltaX > 0) {
								F.prev( deltaY > 0 ? 'down' : 'left' );

							} else if (deltaY < 0 || deltaX < 0) {
								F.next( deltaY < 0 ? 'up' : 'right' );
							}

							e.preventDefault();
						}
					}
				});
			}
		},

		trigger: function (event, o) {
			var ret, obj = o || F.coming || F.current;

			if (!obj) {
				return;
			}

			if ($.isFunction( obj[event] )) {
				ret = obj[event].apply(obj, Array.prototype.slice.call(arguments, 1));
			}

			if (ret === false) {
				return false;
			}

			if (obj.helpers) {
				$.each(obj.helpers, function (helper, opts) {
					if (opts && F.helpers[helper] && $.isFunction(F.helpers[helper][event])) {
						F.helpers[helper][event]($.extend(true, {}, F.helpers[helper].defaults, opts), obj);
					}
				});
			}

			D.trigger(event);
		},

		isImage: function (str) {
			return isString(str) && str.match(/(^data:image\/.*,)|(\.(jp(e|g|eg)|gif|png|bmp|webp|svg)((\?|#).*)?$)/i);
		},

		isSWF: function (str) {
			return isString(str) && str.match(/\.(swf)((\?|#).*)?$/i);
		},

		_start: function (index) {
			var coming = {},
				obj,
				href,
				type,
				margin,
				padding;

			index = getScalar( index );
			obj   = F.group[ index ] || null;

			if (!obj) {
				return false;
			}

			coming = $.extend(true, {}, F.opts, obj);

			// Convert margin and padding properties to array - top, right, bottom, left
			margin  = coming.margin;
			padding = coming.padding;

			if ($.type(margin) === 'number') {
				coming.margin = [margin, margin, margin, margin];
			}

			if ($.type(padding) === 'number') {
				coming.padding = [padding, padding, padding, padding];
			}

			// 'modal' propery is just a shortcut
			if (coming.modal) {
				$.extend(true, coming, {
					closeBtn   : false,
					closeClick : false,
					nextClick  : false,
					arrows     : false,
					mouseWheel : false,
					keys       : null,
					helpers: {
						overlay : {
							closeClick : false
						}
					}
				});
			}

			// 'autoSize' property is a shortcut, too
			if (coming.autoSize) {
				coming.autoWidth = coming.autoHeight = true;
			}

			if (coming.width === 'auto') {
				coming.autoWidth = true;
			}

			if (coming.height === 'auto') {
				coming.autoHeight = true;
			}

			/*
			 * Add reference to the group, so it`s possible to access from callbacks, example:
			 * afterLoad : function() {
			 *     this.title = 'Image ' + (this.index + 1) + ' of ' + this.group.length + (this.title ? ' - ' + this.title : '');
			 * }
			 */

			coming.group  = F.group;
			coming.index  = index;

			// Give a chance for callback or helpers to update coming item (type, title, etc)
			F.coming = coming;

			if (false === F.trigger('beforeLoad')) {
				F.coming = null;

				return;
			}

			type = coming.type;
			href = coming.href;

			if (!type) {
				F.coming = null;

				//If we can not determine content type then drop silently or display next/prev item if looping through gallery
				if (F.current && F.router && F.router !== 'jumpto') {
					F.current.index = index;

					return F[ F.router ]( F.direction );
				}

				return false;
			}

			F.isActive = true;

			if (type === 'image' || type === 'swf') {
				coming.autoHeight = coming.autoWidth = false;
				coming.scrolling  = 'visible';
			}

			if (type === 'image') {
				coming.aspectRatio = true;
			}

			if (type === 'iframe' && isTouch) {
				coming.scrolling = 'scroll';
			}

			// Build the neccessary markup
			coming.wrap = $(coming.tpl.wrap).addClass('fancybox-' + (isTouch ? 'mobile' : 'desktop') + ' fancybox-type-' + type + ' fancybox-tmp ' + coming.wrapCSS).appendTo( coming.parent || 'body' );

			$.extend(coming, {
				skin  : $('.fancybox-skin',  coming.wrap),
				outer : $('.fancybox-outer', coming.wrap),
				inner : $('.fancybox-inner', coming.wrap)
			});

			$.each(["Top", "Right", "Bottom", "Left"], function(i, v) {
				coming.skin.css('padding' + v, getValue(coming.padding[ i ]));
			});

			F.trigger('onReady');

			// Check before try to load; 'inline' and 'html' types need content, others - href
			if (type === 'inline' || type === 'html') {
				if (!coming.content || !coming.content.length) {
					return F._error( 'content' );
				}

			} else if (!href) {
				return F._error( 'href' );
			}

			if (type === 'image') {
				F._loadImage();

			} else if (type === 'ajax') {
				F._loadAjax();

			} else if (type === 'iframe') {
				F._loadIframe();

			} else {
				F._afterLoad();
			}
		},

		_error: function ( type ) {
			$.extend(F.coming, {
				type       : 'html',
				autoWidth  : true,
				autoHeight : true,
				minWidth   : 0,
				minHeight  : 0,
				scrolling  : 'no',
				hasError   : type,
				content    : F.coming.tpl.error
			});

			F._afterLoad();
		},

		_loadImage: function () {
			// Reset preload image so it is later possible to check "complete" property
			var img = F.imgPreload = new Image();

			img.onload = function () {
				this.onload = this.onerror = null;

				F.coming.width  = this.width / F.opts.pixelRatio;
				F.coming.height = this.height / F.opts.pixelRatio;

				F._afterLoad();
			};

			img.onerror = function () {
				this.onload = this.onerror = null;

				F._error( 'image' );
			};

			img.src = F.coming.href;

			if (img.complete !== true) {
				F.showLoading();
			}
		},

		_loadAjax: function () {
			var coming = F.coming;

			F.showLoading();

			F.ajaxLoad = $.ajax($.extend({}, coming.ajax, {
				url: coming.href,
				error: function (jqXHR, textStatus) {
					if (F.coming && textStatus !== 'abort') {
						F._error( 'ajax', jqXHR );

					} else {
						F.hideLoading();
					}
				},
				success: function (data, textStatus) {
					if (textStatus === 'success') {
						coming.content = data;

						F._afterLoad();
					}
				}
			}));
		},

		_loadIframe: function() {
			var coming = F.coming,
				iframe = $(coming.tpl.iframe.replace(/\{rnd\}/g, new Date().getTime()))
					.attr('scrolling', isTouch ? 'auto' : coming.iframe.scrolling)
					.attr('src', coming.href);

			// This helps IE
			$(coming.wrap).bind('onReset', function () {
				try {
					$(this).find('iframe').hide().attr('src', '//about:blank').end().empty();
				} catch (e) {}
			});

			if (coming.iframe.preload) {
				F.showLoading();

				iframe.one('load', function() {
					$(this).data('ready', 1);

					// iOS will lose scrolling if we resize
					if (!isTouch) {
						$(this).bind('load.fb', F.update);
					}

					// Without this trick:
					//   - iframe won't scroll on iOS devices
					//   - IE7 sometimes displays empty iframe
					$(this).parents('.fancybox-wrap').width('100%').removeClass('fancybox-tmp').show();

					F._afterLoad();
				});
			}

			coming.content = iframe.appendTo( coming.inner );

			if (!coming.iframe.preload) {
				F._afterLoad();
			}
		},

		_preloadImages: function() {
			var group   = F.group,
				current = F.current,
				len     = group.length,
				cnt     = current.preload ? Math.min(current.preload, len - 1) : 0,
				item,
				i;

			for (i = 1; i <= cnt; i += 1) {
				item = group[ (current.index + i ) % len ];

				if (item.type === 'image' && item.href) {
					new Image().src = item.href;
				}
			}
		},

		_afterLoad: function () {
			var coming   = F.coming,
				previous = F.current,
				placeholder = 'fancybox-placeholder',
				current,
				content,
				type,
				scrolling,
				href,
				embed;

			F.hideLoading();

			if (!coming || F.isActive === false) {
				return;
			}

			if (false === F.trigger('afterLoad', coming, previous)) {
				coming.wrap.stop(true).trigger('onReset').remove();

				F.coming = null;

				return;
			}

			if (previous) {
				F.trigger('beforeChange', previous);

				previous.wrap.stop(true).removeClass('fancybox-opened')
					.find('.fancybox-item, .fancybox-nav')
					.remove();
			}

			F.unbindEvents();

			current   = coming;
			content   = coming.content;
			type      = coming.type;
			scrolling = coming.scrolling;

			$.extend(F, {
				wrap  : current.wrap,
				skin  : current.skin,
				outer : current.outer,
				inner : current.inner,
				current  : current,
				previous : previous
			});

			href = current.href;

			switch (type) {
				case 'inline':
				case 'ajax':
				case 'html':
					if (current.selector) {
						content = $('<div>').html(content).find(current.selector);

					} else if (isQuery(content)) {
						if (!content.data(placeholder)) {
							content.data(placeholder, $('<div class="' + placeholder + '"></div>').insertAfter( content ).hide() );
						}

						content = content.show().detach();

						current.wrap.bind('onReset', function () {
							if ($(this).find(content).length) {
								content.hide().replaceAll( content.data(placeholder) ).data(placeholder, false);
							}
						});
					}
				break;

				case 'image':
					content = current.tpl.image.replace('{href}', href);
				break;

				case 'swf':
					content = '<object id="fancybox-swf" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="100%" height="100%"><param name="movie" value="' + href + '"></param>';
					embed   = '';

					$.each(current.swf, function(name, val) {
						content += '<param name="' + name + '" value="' + val + '"></param>';
						embed   += ' ' + name + '="' + val + '"';
					});

					content += '<embed src="' + href + '" type="application/x-shockwave-flash" width="100%" height="100%"' + embed + '></embed></object>';
				break;
			}

			if (!(isQuery(content) && content.parent().is(current.inner))) {
				current.inner.append( content );
			}

			// Give a chance for helpers or callbacks to update elements
			F.trigger('beforeShow');

			// Set scrolling before calculating dimensions
			current.inner.css('overflow', scrolling === 'yes' ? 'scroll' : (scrolling === 'no' ? 'hidden' : scrolling));

			// Set initial dimensions and start position
			F._setDimension();

			F.reposition();

			F.isOpen = false;
			F.coming = null;

			F.bindEvents();

			if (!F.isOpened) {
				$('.fancybox-wrap').not( current.wrap ).stop(true).trigger('onReset').remove();

			} else if (previous.prevMethod) {
				F.transitions[ previous.prevMethod ]();
			}

			F.transitions[ F.isOpened ? current.nextMethod : current.openMethod ]();

			F._preloadImages();
		},

		_setDimension: function () {
			var viewport   = F.getViewport(),
				steps      = 0,
				canShrink  = false,
				canExpand  = false,
				wrap       = F.wrap,
				skin       = F.skin,
				inner      = F.inner,
				current    = F.current,
				width      = current.width,
				height     = current.height,
				minWidth   = current.minWidth,
				minHeight  = current.minHeight,
				maxWidth   = current.maxWidth,
				maxHeight  = current.maxHeight,
				scrolling  = current.scrolling,
				scrollOut  = current.scrollOutside ? current.scrollbarWidth : 0,
				margin     = current.margin,
				wMargin    = getScalar(margin[1] + margin[3]),
				hMargin    = getScalar(margin[0] + margin[2]),
				wPadding,
				hPadding,
				wSpace,
				hSpace,
				origWidth,
				origHeight,
				origMaxWidth,
				origMaxHeight,
				ratio,
				width_,
				height_,
				maxWidth_,
				maxHeight_,
				iframe,
				body;

			// Reset dimensions so we could re-check actual size
			wrap.add(skin).add(inner).width('auto').height('auto').removeClass('fancybox-tmp');

			wPadding = getScalar(skin.outerWidth(true)  - skin.width());
			hPadding = getScalar(skin.outerHeight(true) - skin.height());

			// Any space between content and viewport (margin, padding, border, title)
			wSpace = wMargin + wPadding;
			hSpace = hMargin + hPadding;

			origWidth  = isPercentage(width)  ? (viewport.w - wSpace) * getScalar(width)  / 100 : width;
			origHeight = isPercentage(height) ? (viewport.h - hSpace) * getScalar(height) / 100 : height;

			if (current.type === 'iframe') {
				iframe = current.content;

				if (current.autoHeight && iframe.data('ready') === 1) {
					try {
						if (iframe[0].contentWindow.document.location) {
							inner.width( origWidth ).height(9999);

							body = iframe.contents().find('body');

							if (scrollOut) {
								body.css('overflow-x', 'hidden');
							}

							origHeight = body.outerHeight(true);
						}

					} catch (e) {}
				}

			} else if (current.autoWidth || current.autoHeight) {
				inner.addClass( 'fancybox-tmp' );

				// Set width or height in case we need to calculate only one dimension
				if (!current.autoWidth) {
					inner.width( origWidth );
				}

				if (!current.autoHeight) {
					inner.height( origHeight );
				}

				if (current.autoWidth) {
					origWidth = inner.width();
				}

				if (current.autoHeight) {
					origHeight = inner.height();
				}

				inner.removeClass( 'fancybox-tmp' );
			}

			width  = getScalar( origWidth );
			height = getScalar( origHeight );

			ratio  = origWidth / origHeight;

			// Calculations for the content
			minWidth  = getScalar(isPercentage(minWidth) ? getScalar(minWidth, 'w') - wSpace : minWidth);
			maxWidth  = getScalar(isPercentage(maxWidth) ? getScalar(maxWidth, 'w') - wSpace : maxWidth);

			minHeight = getScalar(isPercentage(minHeight) ? getScalar(minHeight, 'h') - hSpace : minHeight);
			maxHeight = getScalar(isPercentage(maxHeight) ? getScalar(maxHeight, 'h') - hSpace : maxHeight);

			// These will be used to determine if wrap can fit in the viewport
			origMaxWidth  = maxWidth;
			origMaxHeight = maxHeight;

			if (current.fitToView) {
				maxWidth  = Math.min(viewport.w - wSpace, maxWidth);
				maxHeight = Math.min(viewport.h - hSpace, maxHeight);
			}

			maxWidth_  = viewport.w - wMargin;
			maxHeight_ = viewport.h - hMargin;

			if (current.aspectRatio) {
				if (width > maxWidth) {
					width  = maxWidth;
					height = getScalar(width / ratio);
				}

				if (height > maxHeight) {
					height = maxHeight;
					width  = getScalar(height * ratio);
				}

				if (width < minWidth) {
					width  = minWidth;
					height = getScalar(width / ratio);
				}

				if (height < minHeight) {
					height = minHeight;
					width  = getScalar(height * ratio);
				}

			} else {
				width = Math.max(minWidth, Math.min(width, maxWidth));

				if (current.autoHeight && current.type !== 'iframe') {
					inner.width( width );

					height = inner.height();
				}

				height = Math.max(minHeight, Math.min(height, maxHeight));
			}

			// Try to fit inside viewport (including the title)
			if (current.fitToView) {
				inner.width( width ).height( height );

				wrap.width( width + wPadding );

				// Real wrap dimensions
				width_  = wrap.width();
				height_ = wrap.height();

				if (current.aspectRatio) {
					while ((width_ > maxWidth_ || height_ > maxHeight_) && width > minWidth && height > minHeight) {
						if (steps++ > 19) {
							break;
						}

						height = Math.max(minHeight, Math.min(maxHeight, height - 10));
						width  = getScalar(height * ratio);

						if (width < minWidth) {
							width  = minWidth;
							height = getScalar(width / ratio);
						}


						if (width > maxWidth) {
							width  = maxWidth;
							height = getScalar(width / ratio);
						}

						inner.width( width ).height( height );

						wrap.width( width + wPadding );

						width_  = wrap.width();
						height_ = wrap.height();
					}

				} else {
					width  = Math.max(minWidth,  Math.min(width,  width  - (width_  - maxWidth_)));
					height = Math.max(minHeight, Math.min(height, height - (height_ - maxHeight_)));
				}
			}

			if (scrollOut && scrolling === 'auto' && height < origHeight && (width + wPadding + scrollOut) < maxWidth_) {
				width += scrollOut;
			}

			inner.width( width ).height( height );

			wrap.width( width + wPadding );

			width_  = wrap.width();
			height_ = wrap.height();

			canShrink = (width_ > maxWidth_ || height_ > maxHeight_) && width > minWidth && height > minHeight;
			canExpand = current.aspectRatio ? (width < origMaxWidth && height < origMaxHeight && width < origWidth && height < origHeight) : ((width < origMaxWidth || height < origMaxHeight) && (width < origWidth || height < origHeight));

			$.extend(current, {
				dim : {
					width	: getValue( width_ ),
					height	: getValue( height_ )
				},
				origWidth  : origWidth,
				origHeight : origHeight,
				canShrink  : canShrink,
				canExpand  : canExpand,
				wPadding   : wPadding,
				hPadding   : hPadding,
				wrapSpace  : height_ - skin.outerHeight(true),
				skinSpace  : skin.height() - height
			});

			if (!iframe && current.autoHeight && height > minHeight && height < maxHeight && !canExpand) {
				inner.height('auto');
			}
		},

		_getPosition: function (onlyAbsolute) {
			var current  = F.current,
				viewport = F.getViewport(),
				margin   = current.margin,
				width    = F.wrap.width()  + margin[1] + margin[3],
				height   = F.wrap.height() + margin[0] + margin[2],
				rez      = {
					position: 'absolute',
					top  : margin[0],
					left : margin[3]
				};

			if (current.autoCenter && current.fixed && !onlyAbsolute && height <= viewport.h && width <= viewport.w) {
				rez.position = 'fixed';

			} else if (!current.locked) {
				rez.top  += viewport.y;
				rez.left += viewport.x;
			}

			rez.top  = getValue(Math.max(rez.top,  rez.top  + ((viewport.h - height) * current.topRatio)));
			rez.left = getValue(Math.max(rez.left, rez.left + ((viewport.w - width)  * current.leftRatio)));

			return rez;
		},

		_afterZoomIn: function () {
			var current = F.current;

			if (!current) {
				return;
			}

			F.isOpen = F.isOpened = true;

			F.wrap.css('overflow', 'visible').addClass('fancybox-opened');

			F.update();

			// Assign a click event
			if ( current.closeClick || (current.nextClick && F.group.length > 1) ) {
				F.inner.css('cursor', 'pointer').bind('click.fb', function(e) {
					if (!$(e.target).is('a') && !$(e.target).parent().is('a')) {
						e.preventDefault();

						F[ current.closeClick ? 'close' : 'next' ]();
					}
				});
			}

			// Create a close button
			if (current.closeBtn) {
				$(current.tpl.closeBtn).appendTo(F.skin).bind('click.fb', function(e) {
					e.preventDefault();

					F.close();
				});
			}

			// Create navigation arrows
			if (current.arrows && F.group.length > 1) {
				if (current.loop || current.index > 0) {
					$(current.tpl.prev).appendTo(F.outer).bind('click.fb', F.prev);
				}

				if (current.loop || current.index < F.group.length - 1) {
					$(current.tpl.next).appendTo(F.outer).bind('click.fb', F.next);
				}
			}

			F.trigger('afterShow');

			// Stop the slideshow if this is the last item
			if (!current.loop && current.index === current.group.length - 1) {
				F.play( false );

			} else if (F.opts.autoPlay && !F.player.isActive) {
				F.opts.autoPlay = false;

				F.play();
			}
		},

		_afterZoomOut: function ( obj ) {
			obj = obj || F.current;

			$('.fancybox-wrap').trigger('onReset').remove();

			$.extend(F, {
				group  : {},
				opts   : {},
				router : false,
				current   : null,
				isActive  : false,
				isOpened  : false,
				isOpen    : false,
				isClosing : false,
				wrap   : null,
				skin   : null,
				outer  : null,
				inner  : null
			});

			F.trigger('afterClose', obj);
		}
	});

	/*
	 *	Default transitions
	 */

	F.transitions = {
		getOrigPosition: function () {
			var current  = F.current,
				element  = current.element,
				orig     = current.orig,
				pos      = {},
				width    = 50,
				height   = 50,
				hPadding = current.hPadding,
				wPadding = current.wPadding,
				viewport = F.getViewport();

			if (!orig && current.isDom && element.is(':visible')) {
				orig = element.find('img:first');

				if (!orig.length) {
					orig = element;
				}
			}

			if (isQuery(orig)) {
				pos = orig.offset();

				if (orig.is('img')) {
					width  = orig.outerWidth();
					height = orig.outerHeight();
				}

			} else {
				pos.top  = viewport.y + (viewport.h - height) * current.topRatio;
				pos.left = viewport.x + (viewport.w - width)  * current.leftRatio;
			}

			if (F.wrap.css('position') === 'fixed' || current.locked) {
				pos.top  -= viewport.y;
				pos.left -= viewport.x;
			}

			pos = {
				top     : getValue(pos.top  - hPadding * current.topRatio),
				left    : getValue(pos.left - wPadding * current.leftRatio),
				width   : getValue(width  + wPadding),
				height  : getValue(height + hPadding)
			};

			return pos;
		},

		step: function (now, fx) {
			var ratio,
				padding,
				value,
				prop       = fx.prop,
				current    = F.current,
				wrapSpace  = current.wrapSpace,
				skinSpace  = current.skinSpace;

			if (prop === 'width' || prop === 'height') {
				ratio = fx.end === fx.start ? 1 : (now - fx.start) / (fx.end - fx.start);

				if (F.isClosing) {
					ratio = 1 - ratio;
				}

				padding = prop === 'width' ? current.wPadding : current.hPadding;
				value   = now - padding;

				F.skin[ prop ](  getScalar( prop === 'width' ?  value : value - (wrapSpace * ratio) ) );
				F.inner[ prop ]( getScalar( prop === 'width' ?  value : value - (wrapSpace * ratio) - (skinSpace * ratio) ) );
			}
		},

		zoomIn: function () {
			var current  = F.current,
				startPos = current.pos,
				effect   = current.openEffect,
				elastic  = effect === 'elastic',
				endPos   = $.extend({opacity : 1}, startPos);

			// Remove "position" property that breaks older IE
			delete endPos.position;

			if (elastic) {
				startPos = this.getOrigPosition();

				if (current.openOpacity) {
					startPos.opacity = 0.1;
				}

			} else if (effect === 'fade') {
				startPos.opacity = 0.1;
			}

			F.wrap.css(startPos).animate(endPos, {
				duration : effect === 'none' ? 0 : current.openSpeed,
				easing   : current.openEasing,
				step     : elastic ? this.step : null,
				complete : F._afterZoomIn
			});
		},

		zoomOut: function () {
			var current  = F.current,
				effect   = current.closeEffect,
				elastic  = effect === 'elastic',
				endPos   = {opacity : 0.1};

			if (elastic) {
				endPos = this.getOrigPosition();

				if (current.closeOpacity) {
					endPos.opacity = 0.1;
				}
			}

			F.wrap.animate(endPos, {
				duration : effect === 'none' ? 0 : current.closeSpeed,
				easing   : current.closeEasing,
				step     : elastic ? this.step : null,
				complete : F._afterZoomOut
			});
		},

		changeIn: function () {
			var current   = F.current,
				effect    = current.nextEffect,
				startPos  = current.pos,
				endPos    = { opacity : 1 },
				direction = F.direction,
				distance  = 200,
				field;

			startPos.opacity = 0.1;

			if (effect === 'elastic') {
				field = direction === 'down' || direction === 'up' ? 'top' : 'left';

				if (direction === 'down' || direction === 'right') {
					startPos[ field ] = getValue(getScalar(startPos[ field ]) - distance);
					endPos[ field ]   = '+=' + distance + 'px';

				} else {
					startPos[ field ] = getValue(getScalar(startPos[ field ]) + distance);
					endPos[ field ]   = '-=' + distance + 'px';
				}
			}

			// Workaround for http://bugs.jquery.com/ticket/12273
			if (effect === 'none') {
				F._afterZoomIn();

			} else {
				F.wrap.css(startPos).animate(endPos, {
					duration : current.nextSpeed,
					easing   : current.nextEasing,
					complete : F._afterZoomIn
				});
			}
		},

		changeOut: function () {
			var previous  = F.previous,
				effect    = previous.prevEffect,
				endPos    = { opacity : 0.1 },
				direction = F.direction,
				distance  = 200;

			if (effect === 'elastic') {
				endPos[ direction === 'down' || direction === 'up' ? 'top' : 'left' ] = ( direction === 'up' || direction === 'left' ? '-' : '+' ) + '=' + distance + 'px';
			}

			previous.wrap.animate(endPos, {
				duration : effect === 'none' ? 0 : previous.prevSpeed,
				easing   : previous.prevEasing,
				complete : function () {
					$(this).trigger('onReset').remove();
				}
			});
		}
	};

	/*
	 *	Overlay helper
	 */

	F.helpers.overlay = {
		defaults : {
			closeClick : true,      // if true, fancyBox will be closed when user clicks on the overlay
			speedOut   : 200,       // duration of fadeOut animation
			showEarly  : true,      // indicates if should be opened immediately or wait until the content is ready
			css        : {},        // custom CSS properties
			locked     : !isTouch,  // if true, the content will be locked into overlay
			fixed      : true       // if false, the overlay CSS position property will not be set to "fixed"
		},

		overlay : null,      // current handle
		fixed   : false,     // indicates if the overlay has position "fixed"
		el      : $('html'), // element that contains "the lock"

		// Public methods
		create : function(opts) {
			opts = $.extend({}, this.defaults, opts);

			if (this.overlay) {
				this.close();
			}

			this.overlay = $('<div class="fancybox-overlay"></div>').appendTo( F.coming ? F.coming.parent : opts.parent );
			this.fixed   = false;

			if (opts.fixed && F.defaults.fixed) {
				this.overlay.addClass('fancybox-overlay-fixed');

				this.fixed = true;
			}
		},

		open : function(opts) {
			var that = this;

			opts = $.extend({}, this.defaults, opts);

			if (this.overlay) {
				this.overlay.unbind('.overlay').width('auto').height('auto');

			} else {
				this.create(opts);
			}

			if (!this.fixed) {
				W.bind('resize.overlay', $.proxy( this.update, this) );

				this.update();
			}

			if (opts.closeClick) {
				this.overlay.bind('click.overlay', function(e) {
					if ($(e.target).hasClass('fancybox-overlay')) {
						if (F.isActive) {
							F.close();
						} else {
							that.close();
						}

						return false;
					}
				});
			}

			this.overlay.css( opts.css ).show();
		},

		close : function() {
			var scrollV, scrollH;

			W.unbind('resize.overlay');

			if (this.el.hasClass('fancybox-lock')) {
				$('.fancybox-margin').removeClass('fancybox-margin');

				scrollV = W.scrollTop();
				scrollH = W.scrollLeft();

				this.el.removeClass('fancybox-lock');

				W.scrollTop( scrollV ).scrollLeft( scrollH );
			}

			$('.fancybox-overlay').remove().hide();

			$.extend(this, {
				overlay : null,
				fixed   : false
			});
		},

		// Private, callbacks

		update : function () {
			var width = '100%', offsetWidth;

			// Reset width/height so it will not mess
			this.overlay.width(width).height('100%');

			// jQuery does not return reliable result for IE
			if (IE) {
				offsetWidth = Math.max(document.documentElement.offsetWidth, document.body.offsetWidth);

				if (D.width() > offsetWidth) {
					width = D.width();
				}

			} else if (D.width() > W.width()) {
				width = D.width();
			}

			this.overlay.width(width).height(D.height());
		},

		// This is where we can manipulate DOM, because later it would cause iframes to reload
		onReady : function (opts, obj) {
			var overlay = this.overlay;

			$('.fancybox-overlay').stop(true, true);

			if (!overlay) {
				this.create(opts);
			}

			if (opts.locked && this.fixed && obj.fixed) {
				if (!overlay) {
					this.margin = D.height() > W.height() ? $('html').css('margin-right').replace("px", "") : false;
				}

				obj.locked = this.overlay.append( obj.wrap );
				obj.fixed  = false;
			}

			if (opts.showEarly === true) {
				this.beforeShow.apply(this, arguments);
			}
		},

		beforeShow : function(opts, obj) {
			var scrollV, scrollH;

			if (obj.locked) {
				if (this.margin !== false) {
					$('*').filter(function(){
						return ($(this).css('position') === 'fixed' && !$(this).hasClass("fancybox-overlay") && !$(this).hasClass("fancybox-wrap") );
					}).addClass('fancybox-margin');

					this.el.addClass('fancybox-margin');
				}

				scrollV = W.scrollTop();
				scrollH = W.scrollLeft();

				this.el.addClass('fancybox-lock');

				W.scrollTop( scrollV ).scrollLeft( scrollH );
			}

			this.open(opts);
		},

		onUpdate : function() {
			if (!this.fixed) {
				this.update();
			}
		},

		afterClose: function (opts) {
			// Remove overlay if exists and fancyBox is not opening
			// (e.g., it is not being open using afterClose callback)
			//if (this.overlay && !F.isActive) {
			if (this.overlay && !F.coming) {
				this.overlay.fadeOut(opts.speedOut, $.proxy( this.close, this ));
			}
		}
	};

	/*
	 *	Title helper
	 */

	F.helpers.title = {
		defaults : {
			type     : 'float', // 'float', 'inside', 'outside' or 'over',
			position : 'bottom' // 'top' or 'bottom'
		},

		beforeShow: function (opts) {
			var current = F.current,
				text    = current.title,
				type    = opts.type,
				title,
				target;

			if ($.isFunction(text)) {
				text = text.call(current.element, current);
			}

			if (!isString(text) || $.trim(text) === '') {
				return;
			}

			title = $('<div class="fancybox-title fancybox-title-' + type + '-wrap">' + text + '</div>');

			switch (type) {
				case 'inside':
					target = F.skin;
				break;

				case 'outside':
					target = F.wrap;
				break;

				case 'over':
					target = F.inner;
				break;

				default: // 'float'
					target = F.skin;

					title.appendTo('body');

					if (IE) {
						title.width( title.width() );
					}

					title.wrapInner('<span class="child"></span>');

					//Increase bottom margin so this title will also fit into viewport
					F.current.margin[2] += Math.abs( getScalar(title.css('margin-bottom')) );
				break;
			}

			title[ (opts.position === 'top' ? 'prependTo'  : 'appendTo') ](target);
		}
	};

	// jQuery plugin initialization
	$.fn.fancybox = function (options) {
		var index,
			that     = $(this),
			selector = this.selector || '',
			run      = function(e) {
				var what = $(this).blur(), idx = index, relType, relVal;

				if (!(e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) && !what.is('.fancybox-wrap')) {
					relType = options.groupAttr || 'data-fancybox-group';
					relVal  = what.attr(relType);

					if (!relVal) {
						relType = 'rel';
						relVal  = what.get(0)[ relType ];
					}

					if (relVal && relVal !== '' && relVal !== 'nofollow') {
						what = selector.length ? $(selector) : that;
						what = what.filter('[' + relType + '="' + relVal + '"]');
						idx  = what.index(this);
					}

					options.index = idx;

					// Stop an event from bubbling if everything is fine
					if (F.open(what, options) !== false) {
						e.preventDefault();
					}
				}
			};

		options = options || {};
		index   = options.index || 0;

		if (!selector || options.live === false) {
			that.unbind('click.fb-start').bind('click.fb-start', run);

		} else {
			D.undelegate(selector, 'click.fb-start').delegate(selector + ":not('.fancybox-item, .fancybox-nav')", 'click.fb-start', run);
		}

		this.filter('[data-fancybox-start=1]').trigger('click');

		return this;
	};

	// Tests that need a body at doc ready
	D.ready(function() {
		var w1, w2;

		if ( $.scrollbarWidth === undefined ) {
			// http://benalman.com/projects/jquery-misc-plugins/#scrollbarwidth
			$.scrollbarWidth = function() {
				var parent = $('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo('body'),
					child  = parent.children(),
					width  = child.innerWidth() - child.height( 99 ).innerWidth();

				parent.remove();

				return width;
			};
		}

		if ( $.support.fixedPosition === undefined ) {
			$.support.fixedPosition = (function() {
				var elem  = $('<div style="position:fixed;top:20px;"></div>').appendTo('body'),
					fixed = ( elem[0].offsetTop === 20 || elem[0].offsetTop === 15 );

				elem.remove();

				return fixed;
			}());
		}

		$.extend(F.defaults, {
			scrollbarWidth : $.scrollbarWidth(),
			fixed  : $.support.fixedPosition,
			parent : $('body')
		});

		//Get real width of page scroll-bar
		w1 = $(window).width();

		H.addClass('fancybox-lock-test');

		w2 = $(window).width();

		H.removeClass('fancybox-lock-test');

		$("<style type='text/css'>.fancybox-margin{margin-right:" + (w2 - w1) + "px;}</style>").appendTo("head");
	});

}(window, document, jQuery));
/**
 * jQuery JSON plugin v2.5.1
 * https://github.com/Krinkle/jquery-json
 *
 * @author Brantley Harris, 2009-2011
 * @author Timo Tijhof, 2011-2014
 * @source This plugin is heavily influenced by MochiKit's serializeJSON, which is
 *         copyrighted 2005 by Bob Ippolito.
 * @source Brantley Harris wrote this plugin. It is based somewhat on the JSON.org
 *         website's http://www.json.org/json2.js, which proclaims:
 *         "NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.", a sentiment that
 *         I uphold.
 * @license MIT License <http://opensource.org/licenses/MIT>
 */
(function ($) {
	'use strict';

	var escape = /["\\\x00-\x1f\x7f-\x9f]/g,
		meta = {
			'\b': '\\b',
			'\t': '\\t',
			'\n': '\\n',
			'\f': '\\f',
			'\r': '\\r',
			'"': '\\"',
			'\\': '\\\\'
		},
		hasOwn = Object.prototype.hasOwnProperty;

	/**
	 * jQuery.toJSON
	 * Converts the given argument into a JSON representation.
	 *
	 * @param o {Mixed} The json-serializable *thing* to be converted
	 *
	 * If an object has a toJSON prototype, that will be used to get the representation.
	 * Non-integer/string keys are skipped in the object, as are keys that point to a
	 * function.
	 *
	 */
	$.toJSON = typeof JSON === 'object' && JSON.stringify ? JSON.stringify : function (o) {
		if (o === null) {
			return 'null';
		}

		var pairs, k, name, val,
			type = $.type(o);

		if (type === 'undefined') {
			return undefined;
		}

		// Also covers instantiated Number and Boolean objects,
		// which are typeof 'object' but thanks to $.type, we
		// catch them here. I don't know whether it is right
		// or wrong that instantiated primitives are not
		// exported to JSON as an {"object":..}.
		// We choose this path because that's what the browsers did.
		if (type === 'number' || type === 'boolean') {
			return String(o);
		}
		if (type === 'string') {
			return $.quoteString(o);
		}
		if (typeof o.toJSON === 'function') {
			return $.toJSON(o.toJSON());
		}
		if (type === 'date') {
			var month = o.getUTCMonth() + 1,
				day = o.getUTCDate(),
				year = o.getUTCFullYear(),
				hours = o.getUTCHours(),
				minutes = o.getUTCMinutes(),
				seconds = o.getUTCSeconds(),
				milli = o.getUTCMilliseconds();

			if (month < 10) {
				month = '0' + month;
			}
			if (day < 10) {
				day = '0' + day;
			}
			if (hours < 10) {
				hours = '0' + hours;
			}
			if (minutes < 10) {
				minutes = '0' + minutes;
			}
			if (seconds < 10) {
				seconds = '0' + seconds;
			}
			if (milli < 100) {
				milli = '0' + milli;
			}
			if (milli < 10) {
				milli = '0' + milli;
			}
			return '"' + year + '-' + month + '-' + day + 'T' +
				hours + ':' + minutes + ':' + seconds +
				'.' + milli + 'Z"';
		}

		pairs = [];

		if ($.isArray(o)) {
			for (k = 0; k < o.length; k++) {
				pairs.push($.toJSON(o[k]) || 'null');
			}
			return '[' + pairs.join(',') + ']';
		}

		// Any other object (plain object, RegExp, ..)
		// Need to do typeof instead of $.type, because we also
		// want to catch non-plain objects.
		if (typeof o === 'object') {
			for (k in o) {
				// Only include own properties,
				// Filter out inherited prototypes
				if (hasOwn.call(o, k)) {
					// Keys must be numerical or string. Skip others
					type = typeof k;
					if (type === 'number') {
						name = '"' + k + '"';
					} else if (type === 'string') {
						name = $.quoteString(k);
					} else {
						continue;
					}
					type = typeof o[k];

					// Invalid values like these return undefined
					// from toJSON, however those object members
					// shouldn't be included in the JSON string at all.
					if (type !== 'function' && type !== 'undefined') {
						val = $.toJSON(o[k]);
						pairs.push(name + ':' + val);
					}
				}
			}
			return '{' + pairs.join(',') + '}';
		}
	};

	/**
	 * jQuery.evalJSON
	 * Evaluates a given json string.
	 *
	 * @param str {String}
	 */
	$.evalJSON = typeof JSON === 'object' && JSON.parse ? JSON.parse : function (str) {
		/*jshint evil: true */
		return eval('(' + str + ')');
	};

	/**
	 * jQuery.secureEvalJSON
	 * Evals JSON in a way that is *more* secure.
	 *
	 * @param str {String}
	 */
	$.secureEvalJSON = typeof JSON === 'object' && JSON.parse ? JSON.parse : function (str) {
		var filtered =
			str
			.replace(/\\["\\\/bfnrtu]/g, '@')
			.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
			.replace(/(?:^|:|,)(?:\s*\[)+/g, '');

		if (/^[\],:{}\s]*$/.test(filtered)) {
			/*jshint evil: true */
			return eval('(' + str + ')');
		}
		throw new SyntaxError('Error parsing JSON, source is not valid.');
	};

	/**
	 * jQuery.quoteString
	 * Returns a string-repr of a string, escaping quotes intelligently.
	 * Mostly a support function for toJSON.
	 * Examples:
	 * >>> jQuery.quoteString('apple')
	 * "apple"
	 *
	 * >>> jQuery.quoteString('"Where are we going?", she asked.')
	 * "\"Where are we going?\", she asked."
	 */
	$.quoteString = function (str) {
		if (str.match(escape)) {
			return '"' + str.replace(escape, function (a) {
				var c = meta[a];
				if (typeof c === 'string') {
					return c;
				}
				c = a.charCodeAt();
				return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
			}) + '"';
		}
		return '"' + str + '"';
	};

}(jQuery));
/*
 * jQuery JSONP Core Plugin 2.4.0 (2012-08-21)
 *
 * https://github.com/jaubourg/jquery-jsonp
 *
 * Copyright (c) 2012 Julian Aubourg
 *
 * This document is licensed as free software under the terms of the
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 */
( function( $ ) {

	// ###################### UTILITIES ##

	// Noop
	function noop() {
	}

	// Generic callback
	function genericCallback( data ) {
		lastValue = [ data ];
	}

	// Call if defined
	function callIfDefined( method , object , parameters ) {
		return method && method.apply( object.context || object , parameters );
	}

	// Give joining character given url
	function qMarkOrAmp( url ) {
		return /\?/ .test( url ) ? "&" : "?";
	}

	var // String constants (for better minification)
		STR_ASYNC = "async",
		STR_CHARSET = "charset",
		STR_EMPTY = "",
		STR_ERROR = "error",
		STR_INSERT_BEFORE = "insertBefore",
		STR_JQUERY_JSONP = "_jqjsp",
		STR_ON = "on",
		STR_ON_CLICK = STR_ON + "click",
		STR_ON_ERROR = STR_ON + STR_ERROR,
		STR_ON_LOAD = STR_ON + "load",
		STR_ON_READY_STATE_CHANGE = STR_ON + "readystatechange",
		STR_READY_STATE = "readyState",
		STR_REMOVE_CHILD = "removeChild",
		STR_SCRIPT_TAG = "<script>",
		STR_SUCCESS = "success",
		STR_TIMEOUT = "timeout",

		// Window
		win = window,
		// Deferred
		Deferred = $.Deferred,
		// Head element
		head = $( "head" )[ 0 ] || document.documentElement,
		// Page cache
		pageCache = {},
		// Counter
		count = 0,
		// Last returned value
		lastValue,

		// ###################### DEFAULT OPTIONS ##
		xOptionsDefaults = {
			//beforeSend: undefined,
			//cache: false,
			callback: STR_JQUERY_JSONP,
			//callbackParameter: undefined,
			//charset: undefined,
			//complete: undefined,
			//context: undefined,
			//data: "",
			//dataFilter: undefined,
			//error: undefined,
			//pageCache: false,
			//success: undefined,
			//timeout: 0,
			//traditional: false,
			url: location.href
		},

		// opera demands sniffing :/
		opera = win.opera,

		// IE < 10
		oldIE = !!$( "<div>" ).html( "<!--[if IE]><i><![endif]-->" ).find("i").length;

	// ###################### MAIN FUNCTION ##
	function jsonp( xOptions ) {

		// Build data with default
		xOptions = $.extend( {} , xOptionsDefaults , xOptions );

		// References to xOptions members (for better minification)
		var successCallback = xOptions.success,
			errorCallback = xOptions.error,
			completeCallback = xOptions.complete,
			dataFilter = xOptions.dataFilter,
			callbackParameter = xOptions.callbackParameter,
			successCallbackName = xOptions.callback,
			cacheFlag = xOptions.cache,
			pageCacheFlag = xOptions.pageCache,
			charset = xOptions.charset,
			url = xOptions.url,
			data = xOptions.data,
			timeout = xOptions.timeout,
			pageCached,

			// Abort/done flag
			done = 0,

			// Life-cycle functions
			cleanUp = noop,

			// Support vars
			supportOnload,
			supportOnreadystatechange,

			// Request execution vars
			firstChild,
			script,
			scriptAfter,
			timeoutTimer;

		// If we have Deferreds:
		// - substitute callbacks
		// - promote xOptions to a promise
		Deferred && Deferred(function( defer ) {
			defer.done( successCallback ).fail( errorCallback );
			successCallback = defer.resolve;
			errorCallback = defer.reject;
		}).promise( xOptions );

		// Create the abort method
		xOptions.abort = function() {
			!( done++ ) && cleanUp();
		};

		// Call beforeSend if provided (early abort if false returned)
		if ( callIfDefined( xOptions.beforeSend , xOptions , [ xOptions ] ) === !1 || done ) {
			return xOptions;
		}

		// Control entries
		url = url || STR_EMPTY;
		data = data ? ( (typeof data) == "string" ? data : $.param( data , xOptions.traditional ) ) : STR_EMPTY;

		// Build final url
		url += data ? ( qMarkOrAmp( url ) + data ) : STR_EMPTY;

		// Add callback parameter if provided as option
		callbackParameter && ( url += qMarkOrAmp( url ) + encodeURIComponent( callbackParameter ) + "=?" );

		// Add anticache parameter if needed
		!cacheFlag && !pageCacheFlag && ( url += qMarkOrAmp( url ) + "_" + ( new Date() ).getTime() + "=" );

		// Replace last ? by callback parameter
		url = url.replace( /=\?(&|$)/ , "=" + successCallbackName + "$1" );

		// Success notifier
		function notifySuccess( json ) {

			if ( !( done++ ) ) {

				cleanUp();
				// Pagecache if needed
				pageCacheFlag && ( pageCache [ url ] = { s: [ json ] } );
				// Apply the data filter if provided
				dataFilter && ( json = dataFilter.apply( xOptions , [ json ] ) );
				// Call success then complete
				callIfDefined( successCallback , xOptions , [ json , STR_SUCCESS, xOptions ] );
				callIfDefined( completeCallback , xOptions , [ xOptions , STR_SUCCESS ] );

			}
		}

		// Error notifier
		function notifyError( type ) {

			if ( !( done++ ) ) {

				// Clean up
				cleanUp();
				// If pure error (not timeout), cache if needed
				pageCacheFlag && type != STR_TIMEOUT && ( pageCache[ url ] = type );
				// Call error then complete
				callIfDefined( errorCallback , xOptions , [ xOptions , type ] );
				callIfDefined( completeCallback , xOptions , [ xOptions , type ] );

			}
		}

		// Check page cache
		if ( pageCacheFlag && ( pageCached = pageCache[ url ] ) ) {

			pageCached.s ? notifySuccess( pageCached.s[ 0 ] ) : notifyError( pageCached );

		} else {

			// Install the generic callback
			// (BEWARE: global namespace pollution ahoy)
			win[ successCallbackName ] = genericCallback;

			// Create the script tag
			script = $( STR_SCRIPT_TAG )[ 0 ];
			script.id = STR_JQUERY_JSONP + count++;

			// Set charset if provided
			if ( charset ) {
				script[ STR_CHARSET ] = charset;
			}

			opera && opera.version() < 11.60 ?
				// onerror is not supported: do not set as async and assume in-order execution.
				// Add a trailing script to emulate the event
				( ( scriptAfter = $( STR_SCRIPT_TAG )[ 0 ] ).text = "document.getElementById('" + script.id + "')." + STR_ON_ERROR + "()" )
			:
				// onerror is supported: set the script as async to avoid requests blocking each others
				( script[ STR_ASYNC ] = STR_ASYNC )

			;

			// Internet Explorer: event/htmlFor trick
			if ( oldIE ) {
				script.htmlFor = script.id;
				script.event = STR_ON_CLICK;
			}

			// Attached event handlers
			script[ STR_ON_LOAD ] = script[ STR_ON_ERROR ] = script[ STR_ON_READY_STATE_CHANGE ] = function ( result ) {

				// Test readyState if it exists
				if ( !script[ STR_READY_STATE ] || !/i/.test( script[ STR_READY_STATE ] ) ) {

					try {

						script[ STR_ON_CLICK ] && script[ STR_ON_CLICK ]();

					} catch( _ ) {}

					result = lastValue;
					lastValue = 0;
					result ? notifySuccess( result[ 0 ] ) : notifyError( STR_ERROR );

				}
			};

			// Set source
			script.src = url;

			// Re-declare cleanUp function
			cleanUp = function( i ) {
				timeoutTimer && clearTimeout( timeoutTimer );
				script[ STR_ON_READY_STATE_CHANGE ] = script[ STR_ON_LOAD ] = script[ STR_ON_ERROR ] = null;
				head[ STR_REMOVE_CHILD ]( script );
				scriptAfter && head[ STR_REMOVE_CHILD ]( scriptAfter );
			};

			// Append main script
			head[ STR_INSERT_BEFORE ]( script , ( firstChild = head.firstChild ) );

			// Append trailing script if needed
			scriptAfter && head[ STR_INSERT_BEFORE ]( scriptAfter , firstChild );

			// If a timeout is needed, install it
			timeoutTimer = timeout > 0 && setTimeout( function() {
				notifyError( STR_TIMEOUT );
			} , timeout );

		}

		return xOptions;
	}

	// ###################### SETUP FUNCTION ##
	jsonp.setup = function( xOptions ) {
		$.extend( xOptionsDefaults , xOptions );
	};

	// ###################### INSTALL in jQuery ##
	$.jsonp = jsonp;

} )( jQuery );
/*
 * ----------------------------- JSTORAGE -------------------------------------
 * Simple local storage wrapper to save data on the browser side, supporting
 * all major browsers - IE6+, Firefox2+, Safari4+, Chrome4+ and Opera 10.5+
 *
 * Author: Andris Reinman, andris.reinman@gmail.com
 * Project homepage: www.jstorage.info
 *
 * Licensed under Unlicense:
 *
 * This is free and unencumbered software released into the public domain.
 * 
 * Anyone is free to copy, modify, publish, use, compile, sell, or
 * distribute this software, either in source code form or as a compiled
 * binary, for any purpose, commercial or non-commercial, and by any
 * means.
 * 
 * In jurisdictions that recognize copyright laws, the author or authors
 * of this software dedicate any and all copyright interest in the
 * software to the public domain. We make this dedication for the benefit
 * of the public at large and to the detriment of our heirs and
 * successors. We intend this dedication to be an overt act of
 * relinquishment in perpetuity of all present and future rights to this
 * software under copyright law.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
 * OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 * 
 * For more information, please refer to <http://unlicense.org/>
 */

 (function($){
    var
        /* jStorage version */
        JSTORAGE_VERSION = "0.4.8",

        /* detect a dollar object or create one if not found */
        //$ = window.jQuery || window.$ || (window.$ = {}),

        /* check for a JSON handling support */
        JSON = {
            parse:
                window.JSON && (window.JSON.parse || window.JSON.decode) ||
                String.prototype.evalJSON && function(str){return String(str).evalJSON();} ||
                $.parseJSON ||
                $.evalJSON,
            stringify:
                Object.toJSON ||
                window.JSON && (window.JSON.stringify || window.JSON.encode) ||
                $.toJSON
        };

    // Break if no JSON support was found
    if(!("parse" in JSON) || !("stringify" in JSON)){
        throw new Error("JSON Library Required");
    }

    var
        /* This is the object, that holds the cached values */
        _storage = {__jstorage_meta:{CRC32:{}}},

        /* Actual browser storage (localStorage or globalStorage["domain"]) */
        _storage_service = {jStorage:"{}"},

        /* DOM element for older IE versions, holds userData behavior */
        _storage_elm = null,

        /* How much space does the storage take */
        _storage_size = 0,

        /* which backend is currently used */
        _backend = false,

        /* onchange observers */
        _observers = {},

        /* timeout to wait after onchange event */
        _observer_timeout = false,

        /* last update time */
        _observer_update = 0,

        /* pubsub observers */
        _pubsub_observers = {},

        /* skip published items older than current timestamp */
        _pubsub_last = +new Date(),

        /* Next check for TTL */
        _ttl_timeout,

        /**
         * XML encoding and decoding as XML nodes can't be JSON'ized
         * XML nodes are encoded and decoded if the node is the value to be saved
         * but not if it's as a property of another object
         * Eg. -
         *   $.jStorage.set("key", xmlNode);        // IS OK
         *   $.jStorage.set("key", {xml: xmlNode}); // NOT OK
         */
        _XMLService = {

            /**
             * Validates a XML node to be XML
             * based on jQuery.isXML function
             */
            isXML: function(elm){
                var documentElement = (elm ? elm.ownerDocument || elm : 0).documentElement;
                return documentElement ? documentElement.nodeName !== "HTML" : false;
            },

            /**
             * Encodes a XML node to string
             * based on http://www.mercurytide.co.uk/news/article/issues-when-working-ajax/
             */
            encode: function(xmlNode) {
                if(!this.isXML(xmlNode)){
                    return false;
                }
                try{ // Mozilla, Webkit, Opera
                    return new XMLSerializer().serializeToString(xmlNode);
                }catch(E1) {
                    try {  // IE
                        return xmlNode.xml;
                    }catch(E2){}
                }
                return false;
            },

            /**
             * Decodes a XML node from string
             * loosely based on http://outwestmedia.com/jquery-plugins/xmldom/
             */
            decode: function(xmlString){
                var dom_parser = ("DOMParser" in window && (new DOMParser()).parseFromString) ||
                        (window.ActiveXObject && function(_xmlString) {
                    var xml_doc = new ActiveXObject("Microsoft.XMLDOM");
                    xml_doc.async = "false";
                    xml_doc.loadXML(_xmlString);
                    return xml_doc;
                }),
                resultXML;
                if(!dom_parser){
                    return false;
                }
                resultXML = dom_parser.call("DOMParser" in window && (new DOMParser()) || window, xmlString, "text/xml");
                return this.isXML(resultXML)?resultXML:false;
            }
        };


    ////////////////////////// PRIVATE METHODS ////////////////////////

    /**
     * Initialization function. Detects if the browser supports DOM Storage
     * or userData behavior and behaves accordingly.
     */
    function _init(){
        /* Check if browser supports localStorage */
        var localStorageReallyWorks = false;
        if("localStorage" in window){
            try {
                window.localStorage.setItem("_tmptest", "tmpval");
                localStorageReallyWorks = true;
                window.localStorage.removeItem("_tmptest");
            } catch(BogusQuotaExceededErrorOnIos5) {
                // Thanks be to iOS5 Private Browsing mode which throws
                // QUOTA_EXCEEDED_ERRROR DOM Exception 22.
            }
        }

        if(localStorageReallyWorks){
            try {
                if(window.localStorage) {
                    _storage_service = window.localStorage;
                    _backend = "localStorage";
                    _observer_update = _storage_service.jStorage_update;
                }
            } catch(E3) {/* Firefox fails when touching localStorage and cookies are disabled */}
        }
        /* Check if browser supports globalStorage */
        else if("globalStorage" in window){
            try {
                if(window.globalStorage) {
                    if(window.location.hostname == "localhost"){
                        _storage_service = window.globalStorage["localhost.localdomain"];
                    }
                    else{
                        _storage_service = window.globalStorage[window.location.hostname];
                    }
                    _backend = "globalStorage";
                    _observer_update = _storage_service.jStorage_update;
                }
            } catch(E4) {/* Firefox fails when touching localStorage and cookies are disabled */}
        }
        /* Check if browser supports userData behavior */
        else {
            _storage_elm = document.createElement("link");
            if(_storage_elm.addBehavior){

                /* Use a DOM element to act as userData storage */
                _storage_elm.style.behavior = "url(#default#userData)";

                /* userData element needs to be inserted into the DOM! */
                document.getElementsByTagName("head")[0].appendChild(_storage_elm);

                try{
                    _storage_elm.load("jStorage");
                }catch(E){
                    // try to reset cache
                    _storage_elm.setAttribute("jStorage", "{}");
                    _storage_elm.save("jStorage");
                    _storage_elm.load("jStorage");
                }

                var data = "{}";
                try{
                    data = _storage_elm.getAttribute("jStorage");
                }catch(E5){}

                try{
                    _observer_update = _storage_elm.getAttribute("jStorage_update");
                }catch(E6){}

                _storage_service.jStorage = data;
                _backend = "userDataBehavior";
            }else{
                _storage_elm = null;
                return;
            }
        }

        // Load data from storage
        _load_storage();

        // remove dead keys
        _handleTTL();

        // start listening for changes
        _setupObserver();

        // initialize publish-subscribe service
        _handlePubSub();

        // handle cached navigation
        if("addEventListener" in window){
            window.addEventListener("pageshow", function(event){
                if(event.persisted){
                    _storageObserver();
                }
            }, false);
        }
    }

    /**
     * Reload data from storage when needed
     */
    function _reloadData(){
        var data = "{}";

        if(_backend == "userDataBehavior"){
            _storage_elm.load("jStorage");

            try{
                data = _storage_elm.getAttribute("jStorage");
            }catch(E5){}

            try{
                _observer_update = _storage_elm.getAttribute("jStorage_update");
            }catch(E6){}

            _storage_service.jStorage = data;
        }

        _load_storage();

        // remove dead keys
        _handleTTL();

        _handlePubSub();
    }

    /**
     * Sets up a storage change observer
     */
    function _setupObserver(){
        if(_backend == "localStorage" || _backend == "globalStorage"){
            if("addEventListener" in window){
                window.addEventListener("storage", _storageObserver, false);
            }else{
                document.attachEvent("onstorage", _storageObserver);
            }
        }else if(_backend == "userDataBehavior"){
            setInterval(_storageObserver, 1000);
        }
    }

    /**
     * Fired on any kind of data change, needs to check if anything has
     * really been changed
     */
    function _storageObserver(){
        var updateTime;
        // cumulate change notifications with timeout
        clearTimeout(_observer_timeout);
        _observer_timeout = setTimeout(function(){

            if(_backend == "localStorage" || _backend == "globalStorage"){
                updateTime = _storage_service.jStorage_update;
            }else if(_backend == "userDataBehavior"){
                _storage_elm.load("jStorage");
                try{
                    updateTime = _storage_elm.getAttribute("jStorage_update");
                }catch(E5){}
            }

            if(updateTime && updateTime != _observer_update){
                _observer_update = updateTime;
                _checkUpdatedKeys();
            }

        }, 25);
    }

    /**
     * Reloads the data and checks if any keys are changed
     */
    function _checkUpdatedKeys(){
        var oldCrc32List = JSON.parse(JSON.stringify(_storage.__jstorage_meta.CRC32)),
            newCrc32List;

        _reloadData();
        newCrc32List = JSON.parse(JSON.stringify(_storage.__jstorage_meta.CRC32));

        var key,
            updated = [],
            removed = [];

        for(key in oldCrc32List){
            if(oldCrc32List.hasOwnProperty(key)){
                if(!newCrc32List[key]){
                    removed.push(key);
                    continue;
                }
                if(oldCrc32List[key] != newCrc32List[key] && String(oldCrc32List[key]).substr(0,2) == "2."){
                    updated.push(key);
                }
            }
        }

        for(key in newCrc32List){
            if(newCrc32List.hasOwnProperty(key)){
                if(!oldCrc32List[key]){
                    updated.push(key);
                }
            }
        }

        _fireObservers(updated, "updated");
        _fireObservers(removed, "deleted");
    }

    /**
     * Fires observers for updated keys
     *
     * @param {Array|String} keys Array of key names or a key
     * @param {String} action What happened with the value (updated, deleted, flushed)
     */
    function _fireObservers(keys, action){
        keys = [].concat(keys || []);
        if(action == "flushed"){
            keys = [];
            for(var key in _observers){
                if(_observers.hasOwnProperty(key)){
                    keys.push(key);
                }
            }
            action = "deleted";
        }
        for(var i=0, len = keys.length; i<len; i++){
            if(_observers[keys[i]]){
                for(var j=0, jlen = _observers[keys[i]].length; j<jlen; j++){
                    _observers[keys[i]][j](keys[i], action);
                }
            }
            if(_observers["*"]){
                for(var j=0, jlen = _observers["*"].length; j<jlen; j++){
                    _observers["*"][j](keys[i], action);
                }
            }
        }
    }

    /**
     * Publishes key change to listeners
     */
    function _publishChange(){
        var updateTime = (+new Date()).toString();

        if(_backend == "localStorage" || _backend == "globalStorage"){
            try {
                _storage_service.jStorage_update = updateTime;
            } catch (E8) {
                // safari private mode has been enabled after the jStorage initialization
                _backend = false;
            }
        }else if(_backend == "userDataBehavior"){
            _storage_elm.setAttribute("jStorage_update", updateTime);
            _storage_elm.save("jStorage");
        }

        _storageObserver();
    }

    /**
     * Loads the data from the storage based on the supported mechanism
     */
    function _load_storage(){
        /* if jStorage string is retrieved, then decode it */
        if(_storage_service.jStorage){
            try{
                _storage = JSON.parse(String(_storage_service.jStorage));
            }catch(E6){_storage_service.jStorage = "{}";}
        }else{
            _storage_service.jStorage = "{}";
        }
        _storage_size = _storage_service.jStorage?String(_storage_service.jStorage).length:0;

        if(!_storage.__jstorage_meta){
            _storage.__jstorage_meta = {};
        }
        if(!_storage.__jstorage_meta.CRC32){
            _storage.__jstorage_meta.CRC32 = {};
        }
    }

    /**
     * This functions provides the "save" mechanism to store the jStorage object
     */
    function _save(){
        _dropOldEvents(); // remove expired events
        try{
            _storage_service.jStorage = JSON.stringify(_storage);
            // If userData is used as the storage engine, additional
            if(_storage_elm) {
                _storage_elm.setAttribute("jStorage",_storage_service.jStorage);
                _storage_elm.save("jStorage");
            }
            _storage_size = _storage_service.jStorage?String(_storage_service.jStorage).length:0;
        }catch(E7){/* probably cache is full, nothing is saved this way*/}
    }

    /**
     * Function checks if a key is set and is string or numberic
     *
     * @param {String} key Key name
     */
    function _checkKey(key){
        if(typeof key != "string" && typeof key != "number"){
            throw new TypeError("Key name must be string or numeric");
        }
        if(key == "__jstorage_meta"){
            throw new TypeError("Reserved key name");
        }
        return true;
    }

    /**
     * Removes expired keys
     */
    function _handleTTL(){
        var curtime, i, TTL, CRC32, nextExpire = Infinity, changed = false, deleted = [];

        clearTimeout(_ttl_timeout);

        if(!_storage.__jstorage_meta || typeof _storage.__jstorage_meta.TTL != "object"){
            // nothing to do here
            return;
        }

        curtime = +new Date();
        TTL = _storage.__jstorage_meta.TTL;

        CRC32 = _storage.__jstorage_meta.CRC32;
        for(i in TTL){
            if(TTL.hasOwnProperty(i)){
                if(TTL[i] <= curtime){
                    delete TTL[i];
                    delete CRC32[i];
                    delete _storage[i];
                    changed = true;
                    deleted.push(i);
                }else if(TTL[i] < nextExpire){
                    nextExpire = TTL[i];
                }
            }
        }

        // set next check
        if(nextExpire != Infinity){
            _ttl_timeout = setTimeout(Math.min(_handleTTL, nextExpire - curtime, 0x7FFFFFFF));
        }

        // save changes
        if(changed){
            _save();
            _publishChange();
            _fireObservers(deleted, "deleted");
        }
    }

    /**
     * Checks if there's any events on hold to be fired to listeners
     */
    function _handlePubSub(){
        var i, len;
        if(!_storage.__jstorage_meta.PubSub){
            return;
        }
        var pubelm,
            _pubsubCurrent = _pubsub_last;

        for(i=len=_storage.__jstorage_meta.PubSub.length-1; i>=0; i--){
            pubelm = _storage.__jstorage_meta.PubSub[i];
            if(pubelm[0] > _pubsub_last){
                _pubsubCurrent = pubelm[0];
                _fireSubscribers(pubelm[1], pubelm[2]);
            }
        }

        _pubsub_last = _pubsubCurrent;
    }

    /**
     * Fires all subscriber listeners for a pubsub channel
     *
     * @param {String} channel Channel name
     * @param {Mixed} payload Payload data to deliver
     */
    function _fireSubscribers(channel, payload){
        if(_pubsub_observers[channel]){
            for(var i=0, len = _pubsub_observers[channel].length; i<len; i++){
                // send immutable data that can't be modified by listeners
                try{
                    _pubsub_observers[channel][i](channel, JSON.parse(JSON.stringify(payload)));
                }catch(E){};
            }
        }
    }

    /**
     * Remove old events from the publish stream (at least 2sec old)
     */
    function _dropOldEvents(){
        if(!_storage.__jstorage_meta.PubSub){
            return;
        }

        var retire = +new Date() - 2000;

        for(var i=0, len = _storage.__jstorage_meta.PubSub.length; i<len; i++){
            if(_storage.__jstorage_meta.PubSub[i][0] <= retire){
                // deleteCount is needed for IE6
                _storage.__jstorage_meta.PubSub.splice(i, _storage.__jstorage_meta.PubSub.length - i);
                break;
            }
        }

        if(!_storage.__jstorage_meta.PubSub.length){
            delete _storage.__jstorage_meta.PubSub;
        }

    }

    /**
     * Publish payload to a channel
     *
     * @param {String} channel Channel name
     * @param {Mixed} payload Payload to send to the subscribers
     */
    function _publish(channel, payload){
        if(!_storage.__jstorage_meta){
            _storage.__jstorage_meta = {};
        }
        if(!_storage.__jstorage_meta.PubSub){
            _storage.__jstorage_meta.PubSub = [];
        }

        _storage.__jstorage_meta.PubSub.unshift([+new Date, channel, payload]);

        _save();
        _publishChange();
    }


    /**
     * JS Implementation of MurmurHash2
     *
     *  SOURCE: https://github.com/garycourt/murmurhash-js (MIT licensed)
     *
     * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
     * @see http://github.com/garycourt/murmurhash-js
     * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
     * @see http://sites.google.com/site/murmurhash/
     *
     * @param {string} str ASCII only
     * @param {number} seed Positive integer only
     * @return {number} 32-bit positive integer hash
     */

    function murmurhash2_32_gc(str, seed) {
        var
            l = str.length,
            h = seed ^ l,
            i = 0,
            k;

        while (l >= 4) {
            k =
                ((str.charCodeAt(i) & 0xff)) |
                ((str.charCodeAt(++i) & 0xff) << 8) |
                ((str.charCodeAt(++i) & 0xff) << 16) |
                ((str.charCodeAt(++i) & 0xff) << 24);

            k = (((k & 0xffff) * 0x5bd1e995) + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16));
            k ^= k >>> 24;
            k = (((k & 0xffff) * 0x5bd1e995) + ((((k >>> 16) * 0x5bd1e995) & 0xffff) << 16));

            h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16)) ^ k;

            l -= 4;
            ++i;
        }

        switch (l) {
            case 3: h ^= (str.charCodeAt(i + 2) & 0xff) << 16;
            case 2: h ^= (str.charCodeAt(i + 1) & 0xff) << 8;
            case 1: h ^= (str.charCodeAt(i) & 0xff);
                h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16));
        }

        h ^= h >>> 13;
        h = (((h & 0xffff) * 0x5bd1e995) + ((((h >>> 16) * 0x5bd1e995) & 0xffff) << 16));
        h ^= h >>> 15;

        return h >>> 0;
    }

    ////////////////////////// PUBLIC INTERFACE /////////////////////////

    $.jStorage = {
        /* Version number */
        version: JSTORAGE_VERSION,

        /**
         * Sets a key's value.
         *
         * @param {String} key Key to set. If this value is not set or not
         *              a string an exception is raised.
         * @param {Mixed} value Value to set. This can be any value that is JSON
         *              compatible (Numbers, Strings, Objects etc.).
         * @param {Object} [options] - possible options to use
         * @param {Number} [options.TTL] - optional TTL value
         * @return {Mixed} the used value
         */
        set: function(key, value, options){
            _checkKey(key);

            options = options || {};

            // undefined values are deleted automatically
            if(typeof value == "undefined"){
                this.deleteKey(key);
                return value;
            }

            if(_XMLService.isXML(value)){
                value = {_is_xml:true,xml:_XMLService.encode(value)};
            }else if(typeof value == "function"){
                return undefined; // functions can't be saved!
            }else if(value && typeof value == "object"){
                // clone the object before saving to _storage tree
                value = JSON.parse(JSON.stringify(value));
            }

            _storage[key] = value;

            _storage.__jstorage_meta.CRC32[key] = "2." + murmurhash2_32_gc(JSON.stringify(value), 0x9747b28c);

            this.setTTL(key, options.TTL || 0); // also handles saving and _publishChange

            _fireObservers(key, "updated");
            return value;
        },

        /**
         * Looks up a key in cache
         *
         * @param {String} key - Key to look up.
         * @param {mixed} def - Default value to return, if key didn't exist.
         * @return {Mixed} the key value, default value or null
         */
        get: function(key, def){
            _checkKey(key);
            if(key in _storage){
                if(_storage[key] && typeof _storage[key] == "object" && _storage[key]._is_xml) {
                    return _XMLService.decode(_storage[key].xml);
                }else{
                    return _storage[key];
                }
            }
            return typeof(def) == "undefined" ? null : def;
        },

        /**
         * Deletes a key from cache.
         *
         * @param {String} key - Key to delete.
         * @return {Boolean} true if key existed or false if it didn't
         */
        deleteKey: function(key){
            _checkKey(key);
            if(key in _storage){
                delete _storage[key];
                // remove from TTL list
                if(typeof _storage.__jstorage_meta.TTL == "object" &&
                  key in _storage.__jstorage_meta.TTL){
                    delete _storage.__jstorage_meta.TTL[key];
                }

                delete _storage.__jstorage_meta.CRC32[key];

                _save();
                _publishChange();
                _fireObservers(key, "deleted");
                return true;
            }
            return false;
        },

        /**
         * Sets a TTL for a key, or remove it if ttl value is 0 or below
         *
         * @param {String} key - key to set the TTL for
         * @param {Number} ttl - TTL timeout in milliseconds
         * @return {Boolean} true if key existed or false if it didn't
         */
        setTTL: function(key, ttl){
            var curtime = +new Date();
            _checkKey(key);
            ttl = Number(ttl) || 0;
            if(key in _storage){

                if(!_storage.__jstorage_meta.TTL){
                    _storage.__jstorage_meta.TTL = {};
                }

                // Set TTL value for the key
                if(ttl>0){
                    _storage.__jstorage_meta.TTL[key] = curtime + ttl;
                }else{
                    delete _storage.__jstorage_meta.TTL[key];
                }

                _save();

                _handleTTL();

                _publishChange();
                return true;
            }
            return false;
        },

        /**
         * Gets remaining TTL (in milliseconds) for a key or 0 when no TTL has been set
         *
         * @param {String} key Key to check
         * @return {Number} Remaining TTL in milliseconds
         */
        getTTL: function(key){
            var curtime = +new Date(), ttl;
            _checkKey(key);
            if(key in _storage && _storage.__jstorage_meta.TTL && _storage.__jstorage_meta.TTL[key]){
                ttl = _storage.__jstorage_meta.TTL[key] - curtime;
                return ttl || 0;
            }
            return 0;
        },

        /**
         * Deletes everything in cache.
         *
         * @return {Boolean} Always true
         */
        flush: function(){
            _storage = {__jstorage_meta:{CRC32:{}}};
            _save();
            _publishChange();
            _fireObservers(null, "flushed");
            return true;
        },

        /**
         * Returns a read-only copy of _storage
         *
         * @return {Object} Read-only copy of _storage
        */
        storageObj: function(){
            function F() {}
            F.prototype = _storage;
            return new F();
        },

        /**
         * Returns an index of all used keys as an array
         * ["key1", "key2",.."keyN"]
         *
         * @return {Array} Used keys
        */
        index: function(){
            var index = [], i;
            for(i in _storage){
                if(_storage.hasOwnProperty(i) && i != "__jstorage_meta"){
                    index.push(i);
                }
            }
            return index;
        },

        /**
         * How much space in bytes does the storage take?
         *
         * @return {Number} Storage size in chars (not the same as in bytes,
         *                  since some chars may take several bytes)
         */
        storageSize: function(){
            return _storage_size;
        },

        /**
         * Which backend is currently in use?
         *
         * @return {String} Backend name
         */
        currentBackend: function(){
            return _backend;
        },

        /**
         * Test if storage is available
         *
         * @return {Boolean} True if storage can be used
         */
        storageAvailable: function(){
            return !!_backend;
        },

        /**
         * Register change listeners
         *
         * @param {String} key Key name
         * @param {Function} callback Function to run when the key changes
         */
        listenKeyChange: function(key, callback){
            _checkKey(key);
            if(!_observers[key]){
                _observers[key] = [];
            }
            _observers[key].push(callback);
        },

        /**
         * Remove change listeners
         *
         * @param {String} key Key name to unregister listeners against
         * @param {Function} [callback] If set, unregister the callback, if not - unregister all
         */
        stopListening: function(key, callback){
            _checkKey(key);

            if(!_observers[key]){
                return;
            }

            if(!callback){
                delete _observers[key];
                return;
            }

            for(var i = _observers[key].length - 1; i>=0; i--){
                if(_observers[key][i] == callback){
                    _observers[key].splice(i,1);
                }
            }
        },

        /**
         * Subscribe to a Publish/Subscribe event stream
         *
         * @param {String} channel Channel name
         * @param {Function} callback Function to run when the something is published to the channel
         */
        subscribe: function(channel, callback){
            channel = (channel || "").toString();
            if(!channel){
                throw new TypeError("Channel not defined");
            }
            if(!_pubsub_observers[channel]){
                _pubsub_observers[channel] = [];
            }
            _pubsub_observers[channel].push(callback);
        },

        /**
         * Publish data to an event stream
         *
         * @param {String} channel Channel name
         * @param {Mixed} payload Payload to deliver
         */
        publish: function(channel, payload){
            channel = (channel || "").toString();
            if(!channel){
                throw new TypeError("Channel not defined");
            }

            _publish(channel, payload);
        },

        /**
         * Reloads the data from browser storage
         */
        reInit: function(){
            _reloadData();
        },

        /**
         * Removes reference from global objects and saves it as jStorage
         *
         * @param {Boolean} option if needed to save object as simple "jStorage" in windows context
         */
         noConflict: function( saveInGlobal ) {
            delete window.$.jStorage

            if ( saveInGlobal ) {
                window.jStorage = this;
            }

            return this;
         }
    };

    // Initialize jStorage
    _init();

})(jQuery);
/*
 * jQuery.ScrollTo
 * Copyright (c) 2007-2008 Ariel Flesler - aflesler(at)gmail(dot)com | http://flesler.blogspot.com
 * Dual licensed under MIT and GPL.
 * Date: 9/11/2008
 *
 * @projectDescription Easy element scrolling using jQuery.
 * http://flesler.blogspot.com/2007/10/jqueryscrollto.html
 * Tested with jQuery 1.2.6. On FF 2/3, IE 6/7, Opera 9.2/5 and Safari 3. on Windows.
 *
 * @author Ariel Flesler
 * @version 1.4
 *
 * @id jQuery.scrollTo
 * @id jQuery.fn.scrollTo
 * @param {String, Number, DOMElement, jQuery, Object} target Where to scroll the matched elements.
 *	  The different options for target are:
 *		- A number position (will be applied to all axes).
 *		- A string position ('44', '100px', '+=90', etc ) will be applied to all axes
 *		- A jQuery/DOM element ( logically, child of the element to scroll )
 *		- A string selector, that will be relative to the element to scroll ( 'li:eq(2)', etc )
 *		- A hash { top:x, left:y }, x and y can be any kind of number/string like above.
 * @param {Number} duration The OVERALL length of the animation, this argument can be the settings object instead.
 * @param {Object,Function} settings Optional set of settings or the onAfter callback.
 *	 @option {String} axis Which axis must be scrolled, use 'x', 'y', 'xy' or 'yx'.
 *	 @option {Number} duration The OVERALL length of the animation.
 *	 @option {String} easing The easing method for the animation.
 *	 @option {Boolean} margin If true, the margin of the target element will be deducted from the final position.
 *	 @option {Object, Number} offset Add/deduct from the end position. One number for both axes or { top:x, left:y }.
 *	 @option {Object, Number} over Add/deduct the height/width multiplied by 'over', can be { top:x, left:y } when using both axes.
 *	 @option {Boolean} queue If true, and both axis are given, the 2nd axis will only be animated after the first one ends.
 *	 @option {Function} onAfter Function to be called after the scrolling ends. 
 *	 @option {Function} onAfterFirst If queuing is activated, this function will be called after the first scrolling ends.
 * @return {jQuery} Returns the same jQuery object, for chaining.
 *
 * @desc Scroll to a fixed position
 * @example $('div').scrollTo( 340 );
 *
 * @desc Scroll relatively to the actual position
 * @example $('div').scrollTo( '+=340px', { axis:'y' } );
 *
 * @dec Scroll using a selector (relative to the scrolled element)
 * @example $('div').scrollTo( 'p.paragraph:eq(2)', 500, { easing:'swing', queue:true, axis:'xy' } );
 *
 * @ Scroll to a DOM element (same for jQuery object)
 * @example var second_child = document.getElementById('container').firstChild.nextSibling;
 *			$('#container').scrollTo( second_child, { duration:500, axis:'x', onAfter:function(){
 *				alert('scrolled!!');																   
 *			}});
 *
 * @desc Scroll on both axes, to different values
 * @example $('div').scrollTo( { top: 300, left:'+=200' }, { axis:'xy', offset:-20 } );
 */
;(function( $ ){
	
	var $scrollTo = $.scrollTo = function( target, duration, settings ){
		$(window).scrollTo( target, duration, settings );
	};

	$scrollTo.defaults = {
		axis:'y',
		duration:1
	};

	// Returns the element that needs to be animated to scroll the window.
	// Kept for backwards compatibility (specially for localScroll & serialScroll)
	$scrollTo.window = function( scope ){
		return $(window).scrollable();
	};

	// Hack, hack, hack... stay away!
	// Returns the real elements to scroll (supports window/iframes, documents and regular nodes)
	$.fn.scrollable = function(){
		return this.map(function(){
			// Just store it, we might need it
			var win = this.parentWindow || this.defaultView,
				// If it's a document, get its iframe or the window if it's THE document
				elem = this.nodeName == '#document' ? win.frameElement || win : this,
				// Get the corresponding document
				doc = elem.contentDocument || (elem.contentWindow || elem).document,
				isWin = elem.setInterval;

			return elem.nodeName == 'IFRAME' || isWin && $.browser.safari ? doc.body
				: isWin ? doc.documentElement
				: this;
		});
	};

	$.fn.scrollTo = function( target, duration, settings ){
		if( typeof duration == 'object' ){
			settings = duration;
			duration = 0;
		}
		if( typeof settings == 'function' )
			settings = { onAfter:settings };
			
		settings = $.extend( {}, $scrollTo.defaults, settings );
		// Speed is still recognized for backwards compatibility
		duration = duration || settings.speed || settings.duration;
		// Make sure the settings are given right
		settings.queue = settings.queue && settings.axis.length > 1;
		
		if( settings.queue )
			// Let's keep the overall duration
			duration /= 2;
		settings.offset = both( settings.offset );
		settings.over = both( settings.over );

		return this.scrollable().each(function(){
			var elem = this,
				$elem = $(elem),
				targ = target, toff, attr = {},
				win = $elem.is('html,body');

			switch( typeof targ ){
				// A number will pass the regex
				case 'number':
				case 'string':
					if( /^([+-]=)?\d+(px)?$/.test(targ) ){
						targ = both( targ );
						// We are done
						break;
					}
					// Relative selector, no break!
					targ = $(targ,this);
				case 'object':
					// DOMElement / jQuery
					if( targ.is || targ.style )
						// Get the real position of the target 
						toff = (targ = $(targ)).offset();
			}
			$.each( settings.axis.split(''), function( i, axis ){
				var Pos	= axis == 'x' ? 'Left' : 'Top',
					pos = Pos.toLowerCase(),
					key = 'scroll' + Pos,
					old = elem[key],
					Dim = axis == 'x' ? 'Width' : 'Height',
					dim = Dim.toLowerCase();

				if( toff ){// jQuery / DOMElement
					attr[key] = toff[pos] + ( win ? 0 : old - $elem.offset()[pos] );

					// If it's a dom element, reduce the margin
					if( settings.margin ){
						attr[key] -= parseInt(targ.css('margin'+Pos)) || 0;
						attr[key] -= parseInt(targ.css('border'+Pos+'Width')) || 0;
					}
					
					attr[key] += settings.offset[pos] || 0;
					
					if( settings.over[pos] )
						// Scroll to a fraction of its width/height
						attr[key] += targ[dim]() * settings.over[pos];
				}else
					attr[key] = targ[pos];

				// Number or 'number'
				if( /^\d+$/.test(attr[key]) )
					// Check the limits
					attr[key] = attr[key] <= 0 ? 0 : Math.min( attr[key], max(Dim) );

				// Queueing axes
				if( !i && settings.queue ){
					// Don't waste time animating, if there's no need.
					if( old != attr[key] )
						// Intermediate animation
						animate( settings.onAfterFirst );
					// Don't animate this axis again in the next iteration.
					delete attr[key];
				}
			});			
			animate( settings.onAfter );			

			function animate( callback ){
				$elem.animate( attr, duration, settings.easing, callback && function(){
					callback.call(this, target, settings);
				});
			};
			function max( Dim ){
				var attr ='scroll'+Dim,
					doc = elem.ownerDocument;
				
				return win
						? Math.max( doc.documentElement[attr], doc.body[attr]  )
						: elem[attr];
			};
		}).end();
	};

	function both( val ){
		return typeof val == 'object' ? val : { top:val, left:val };
	};

})( jQuery );
/*! http://mths.be/placeholder v2.1.0 by @mathias */
(function($) {

	// Opera Mini v7 doesn't support placeholder although its DOM seems to indicate so
	var isOperaMini = Object.prototype.toString.call(window.operamini) == '[object OperaMini]';
	var isInputSupported = 'placeholder' in document.createElement('input') && !isOperaMini;
	var isTextareaSupported = 'placeholder' in document.createElement('textarea') && !isOperaMini;
	var valHooks = $.valHooks;
	var propHooks = $.propHooks;
	var hooks;
	var placeholder;

	if (isInputSupported && isTextareaSupported) {

		placeholder = $.fn.placeholder = function() {
			return this;
		};

		placeholder.input = placeholder.textarea = true;

	} else {

		var settings = {};

		placeholder = $.fn.placeholder = function(options) {

			var defaults = {customClass: 'placeholder'};
			settings = $.extend({}, defaults, options);

			var $this = this;
			$this
				.filter((isInputSupported ? 'textarea' : ':input') + '[placeholder]')
				.not('.'+settings.customClass)
				.bind({
					'focus.placeholder': clearPlaceholder,
					'blur.placeholder': setPlaceholder
				})
				.data('placeholder-enabled', true)
				.trigger('blur.placeholder');
			return $this;
		};

		placeholder.input = isInputSupported;
		placeholder.textarea = isTextareaSupported;

		hooks = {
			'get': function(element) {
				var $element = $(element);

				var $passwordInput = $element.data('placeholder-password');
				if ($passwordInput) {
					return $passwordInput[0].value;
				}

				return $element.data('placeholder-enabled') && $element.hasClass(settings.customClass) ? '' : element.value;
			},
			'set': function(element, value) {
				var $element = $(element);

				var $passwordInput = $element.data('placeholder-password');
				if ($passwordInput) {
					return $passwordInput[0].value = value;
				}

				if (!$element.data('placeholder-enabled')) {
					return element.value = value;
				}
				if (value === '') {
					element.value = value;
					// Issue #56: Setting the placeholder causes problems if the element continues to have focus.
					if (element != safeActiveElement()) {
						// We can't use `triggerHandler` here because of dummy text/password inputs :(
						setPlaceholder.call(element);
					}
				} else if ($element.hasClass(settings.customClass)) {
					clearPlaceholder.call(element, true, value) || (element.value = value);
				} else {
					element.value = value;
				}
				// `set` can not return `undefined`; see http://jsapi.info/jquery/1.7.1/val#L2363
				return $element;
			}
		};

		if (!isInputSupported) {
			valHooks.input = hooks;
			propHooks.value = hooks;
		}
		if (!isTextareaSupported) {
			valHooks.textarea = hooks;
			propHooks.value = hooks;
		}

		$(function() {
			// Look for forms
			$(document).delegate('form', 'submit.placeholder', function() {
				// Clear the placeholder values so they don't get submitted
				var $inputs = $('.'+settings.customClass, this).each(clearPlaceholder);
				setTimeout(function() {
					$inputs.each(setPlaceholder);
				}, 10);
			});
		});

		// Clear placeholder values upon page reload
		$(window).bind('beforeunload.placeholder', function() {
			$('.'+settings.customClass).each(function() {
				this.value = '';
			});
		});

	}

	function args(elem) {
		// Return an object of element attributes
		var newAttrs = {};
		var rinlinejQuery = /^jQuery\d+$/;
		$.each(elem.attributes, function(i, attr) {
			if (attr.specified && !rinlinejQuery.test(attr.name)) {
				newAttrs[attr.name] = attr.value;
			}
		});
		return newAttrs;
	}

	function clearPlaceholder(event, value) {
		var input = this;
		var $input = $(input);
		if (input.value == $input.attr('placeholder') && $input.hasClass(settings.customClass)) {
			if ($input.data('placeholder-password')) {
				$input = $input.hide().nextAll('input[type="password"]:first').show().attr('id', $input.removeAttr('id').data('placeholder-id'));
				// If `clearPlaceholder` was called from `$.valHooks.input.set`
				if (event === true) {
					return $input[0].value = value;
				}
				$input.focus();
			} else {
				input.value = '';
				$input.removeClass(settings.customClass);
				input == safeActiveElement() && input.select();
			}
		}
	}

	function setPlaceholder() {
		var $replacement;
		var input = this;
		var $input = $(input);
		var id = this.id;
		if (input.value === '') {
			if (input.type === 'password') {
				if (!$input.data('placeholder-textinput')) {
					try {
						$replacement = $input.clone().attr({ 'type': 'text' });
					} catch(e) {
						$replacement = $('<input>').attr($.extend(args(this), { 'type': 'text' }));
					}
					$replacement
						.removeAttr('name')
						.data({
							'placeholder-password': $input,
							'placeholder-id': id
						})
						.bind('focus.placeholder', clearPlaceholder);
					$input
						.data({
							'placeholder-textinput': $replacement,
							'placeholder-id': id
						})
						.before($replacement);
				}
				$input = $input.removeAttr('id').hide().prevAll('input[type="text"]:first').attr('id', id).show();
				// Note: `$input[0] != input` now!
			}
			$input.addClass(settings.customClass);
			$input[0].value = $input.attr('placeholder');
		} else {
			$input.removeClass(settings.customClass);
		}
	}

	function safeActiveElement() {
		// Avoid IE9 `document.activeElement` of death
		// https://github.com/mathiasbynens/jquery-placeholder/pull/99
		try {
			return document.activeElement;
		} catch (exception) {}
	}

})(jQuery);

/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS=CryptoJS||function(e,m){var p={},j=p.lib={},l=function(){},f=j.Base={extend:function(a){l.prototype=this;var c=new l;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
n=j.WordArray=f.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=m?c:4*a.length},toString:function(a){return(a||h).stringify(this)},concat:function(a){var c=this.words,q=a.words,d=this.sigBytes;a=a.sigBytes;this.clamp();if(d%4)for(var b=0;b<a;b++)c[d+b>>>2]|=(q[b>>>2]>>>24-8*(b%4)&255)<<24-8*((d+b)%4);else if(65535<q.length)for(b=0;b<a;b+=4)c[d+b>>>2]=q[b>>>2];else c.push.apply(c,q);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
32-8*(c%4);a.length=e.ceil(c/4)},clone:function(){var a=f.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],b=0;b<a;b+=4)c.push(4294967296*e.random()|0);return new n.init(c,a)}}),b=p.enc={},h=b.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++){var f=c[d>>>2]>>>24-8*(d%4)&255;b.push((f>>>4).toString(16));b.push((f&15).toString(16))}return b.join("")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d+=2)b[d>>>3]|=parseInt(a.substr(d,
2),16)<<24-4*(d%8);return new n.init(b,c/2)}},g=b.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++)b.push(String.fromCharCode(c[d>>>2]>>>24-8*(d%4)&255));return b.join("")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d++)b[d>>>2]|=(a.charCodeAt(d)&255)<<24-8*(d%4);return new n.init(b,c)}},r=b.Utf8={stringify:function(a){try{return decodeURIComponent(escape(g.stringify(a)))}catch(c){throw Error("Malformed UTF-8 data");}},parse:function(a){return g.parse(unescape(encodeURIComponent(a)))}},
k=j.BufferedBlockAlgorithm=f.extend({reset:function(){this._data=new n.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=r.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,b=c.words,d=c.sigBytes,f=this.blockSize,h=d/(4*f),h=a?e.ceil(h):e.max((h|0)-this._minBufferSize,0);a=h*f;d=e.min(4*a,d);if(a){for(var g=0;g<a;g+=f)this._doProcessBlock(b,g);g=b.splice(0,a);c.sigBytes-=d}return new n.init(g,d)},clone:function(){var a=f.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});j.Hasher=k.extend({cfg:f.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){k.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(c,b){return(new a.init(b)).finalize(c)}},_createHmacHelper:function(a){return function(b,f){return(new s.HMAC.init(a,
f)).finalize(b)}}});var s=p.algo={};return p}(Math);
(function(){var e=CryptoJS,m=e.lib,p=m.WordArray,j=m.Hasher,l=[],m=e.algo.SHA1=j.extend({_doReset:function(){this._hash=new p.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(f,n){for(var b=this._hash.words,h=b[0],g=b[1],e=b[2],k=b[3],j=b[4],a=0;80>a;a++){if(16>a)l[a]=f[n+a]|0;else{var c=l[a-3]^l[a-8]^l[a-14]^l[a-16];l[a]=c<<1|c>>>31}c=(h<<5|h>>>27)+j+l[a];c=20>a?c+((g&e|~g&k)+1518500249):40>a?c+((g^e^k)+1859775393):60>a?c+((g&e|g&k|e&k)-1894007588):c+((g^e^
k)-899497514);j=k;k=e;e=g<<30|g>>>2;g=h;h=c}b[0]=b[0]+h|0;b[1]=b[1]+g|0;b[2]=b[2]+e|0;b[3]=b[3]+k|0;b[4]=b[4]+j|0},_doFinalize:function(){var f=this._data,e=f.words,b=8*this._nDataBytes,h=8*f.sigBytes;e[h>>>5]|=128<<24-h%32;e[(h+64>>>9<<4)+14]=Math.floor(b/4294967296);e[(h+64>>>9<<4)+15]=b;f.sigBytes=4*e.length;this._process();return this._hash},clone:function(){var e=j.clone.call(this);e._hash=this._hash.clone();return e}});e.SHA1=j._createHelper(m);e.HmacSHA1=j._createHmacHelper(m)})();

/*! intercom.js | https://github.com/diy/intercom.js | Apache License (v2) */
/*! Removed Socket.io binding for intercom.js */

var Intercom = (function() {	
	
	// --- lib/events.js ---
	
	var EventEmitter = function() {};
	
	EventEmitter.createInterface = function(space) {
		var methods = {};
		
		methods.on = function(name, fn) {
			if (typeof this[space] === 'undefined') {
				this[space] = {};
			}
			if (!this[space].hasOwnProperty(name)) {
				this[space][name] = [];
			}
			this[space][name].push(fn);
		};
		
		methods.off = function(name, fn) {
			if (typeof this[space] === 'undefined') return;
			if (this[space].hasOwnProperty(name)) {
				util.removeItem(fn, this[space][name]);
			}
		};
		
		methods.trigger = function(name) {
			if (typeof this[space] !== 'undefined' && this[space].hasOwnProperty(name)) {
				var args = Array.prototype.slice.call(arguments, 1);
				for (var i = 0; i < this[space][name].length; i++) {
					this[space][name][i].apply(this[space][name][i], args);
				}
			}
		};
		
		return methods;
	};
	
	var pvt = EventEmitter.createInterface('_handlers');
	EventEmitter.prototype._on = pvt.on;
	EventEmitter.prototype._off = pvt.off;
	EventEmitter.prototype._trigger = pvt.trigger;
	
	var pub = EventEmitter.createInterface('handlers');
	EventEmitter.prototype.on = function() {
		pub.on.apply(this, arguments);
		Array.prototype.unshift.call(arguments, 'on');
		this._trigger.apply(this, arguments);
	};
	EventEmitter.prototype.off = pub.off;
	EventEmitter.prototype.trigger = pub.trigger;
	
	// --- lib/localstorage.js ---
	
	var localStorage = window.localStorage;
	if (typeof localStorage === 'undefined') {
		localStorage = {
			getItem    : function() {},
			setItem    : function() {},
			removeItem : function() {}
		};
	}
	
	// --- lib/util.js ---
	
	var util = {};
	
	util.guid = (function() {
		var S4 = function() {
			return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
		};
		return function() {
			return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
		};
	})();
	
	util.throttle = function(delay, fn) {
		var last = 0;
		return function() {
			var now = (new Date()).getTime();
			if (now - last > delay) {
				last = now;
				fn.apply(this, arguments);
			}
		};
	};
	
	util.extend = function(a, b) {
		if (typeof a === 'undefined' || !a) { a = {}; }
		if (typeof b === 'object') {
			for (var key in b) {
				if (b.hasOwnProperty(key)) {
					a[key] = b[key];
				}
			}
		}
		return a;
	};
	
	util.removeItem = function(item, array) {
		for (var i = array.length - 1; i >= 0; i--) {
			if (array[i] === item) {
				array.splice(i, 1);
			}
		}
		return array;
	};
	
	// --- lib/intercom.js ---
	
	/**
	* A cross-window broadcast service built on top
	* of the HTML5 localStorage API. The interface
	* mimic socket.io in design.
	*
	* @author Brian Reavis <brian@thirdroute.com>
	* @constructor
	*/
	
	var Intercom = function() {
		var self = this;
		var now = (new Date()).getTime();
	
		this.origin         = util.guid();
		this.lastMessage    = now;
		this.bindings       = [];
		this.receivedIDs    = {};
		this.previousValues = {};
	
		var storageHandler = function() { self._onStorageEvent.apply(self, arguments); };
		if (window.attachEvent) { document.attachEvent('onstorage', storageHandler); }
		else { window.addEventListener('storage', storageHandler, false); };
	};
	
	Intercom.prototype._transaction = function(fn) {
		var TIMEOUT   = 1000;
		var WAIT      = 20;
	
		var self      = this;
		var executed  = false;
		var listening = false;
		var waitTimer = null;
	
		var lock = function() {
			if (executed) return;
	
			var now = (new Date()).getTime();
			var activeLock = parseInt(localStorage.getItem(INDEX_LOCK) || 0);
			if (activeLock && now - activeLock < TIMEOUT) {
				if (!listening) {
					self._on('storage', lock);
					listening = true;
				}
				waitTimer = window.setTimeout(lock, WAIT);
				return;
			}
			executed = true;
			localStorage.setItem(INDEX_LOCK, now);
	
			fn();
			unlock();
		};
	
		var unlock = function() {
			if (listening) { self._off('storage', lock); }
			if (waitTimer) { window.clearTimeout(waitTimer); }
			localStorage.removeItem(INDEX_LOCK);
		};
	
		lock();
	};
	
	Intercom.prototype._cleanup_emit = util.throttle(100, function() {
		var self = this;
	
		this._transaction(function() {
			var now = (new Date()).getTime();
			var threshold = now - THRESHOLD_TTL_EMIT;
			var changed = 0;
	
			var messages = JSON.parse(localStorage.getItem(INDEX_EMIT) || '[]');
			for (var i = messages.length - 1; i >= 0; i--) {
				if (messages[i].timestamp < threshold) {
					messages.splice(i, 1);
					changed++;
				}
			}
			if (changed > 0) {
				localStorage.setItem(INDEX_EMIT, JSON.stringify(messages));
			}
		});
	});
	
	Intercom.prototype._cleanup_once = util.throttle(100, function() {
		var self = this;
	
		this._transaction(function() {
			var timestamp, ttl, key;
			var table   = JSON.parse(localStorage.getItem(INDEX_ONCE) || '{}');
			var now     = (new Date()).getTime();
			var changed = 0;
	
			for (key in table) {
				if (self._once_expired(key, table)) {
					delete table[key];
					changed++;
				}
			}
	
			if (changed > 0) {
				localStorage.setItem(INDEX_ONCE, JSON.stringify(table));
			}
		});
	});
	
	Intercom.prototype._once_expired = function(key, table) {
		if (!table) return true;
		if (!table.hasOwnProperty(key)) return true;
		if (typeof table[key] !== 'object') return true;
		var ttl = table[key].ttl || THRESHOLD_TTL_ONCE;
		var now = (new Date()).getTime();
		var timestamp = table[key].timestamp;
		return timestamp < now - ttl;
	};
	
	Intercom.prototype._localStorageChanged = function(event, field) {
		if (event && event.key) {
			return event.key === field;
		}
	
		var currentValue = localStorage.getItem(field);
		if (currentValue === this.previousValues[field]) {
			return false;
		}
		this.previousValues[field] = currentValue;
		return true;
	};
	
	Intercom.prototype._onStorageEvent = function(event) {
		event = event || window.event;
		var self = this;
	
		if (this._localStorageChanged(event, INDEX_EMIT)) {
			this._transaction(function() {
				var now = (new Date()).getTime();
				var data = localStorage.getItem(INDEX_EMIT);
				var messages = JSON.parse(data || '[]');
				for (var i = 0; i < messages.length; i++) {
					if (messages[i].origin === self.origin) continue;
					if (messages[i].timestamp < self.lastMessage) continue;
					if (messages[i].id) {
						if (self.receivedIDs.hasOwnProperty(messages[i].id)) continue;
						self.receivedIDs[messages[i].id] = true;
					}
					self.trigger(messages[i].name, messages[i].payload);
				}
				self.lastMessage = now;
			});
		}
	
		this._trigger('storage', event);
	};
	
	Intercom.prototype._emit = function(name, message, id) {
		id = (typeof id === 'string' || typeof id === 'number') ? String(id) : null;
		if (id && id.length) {
			if (this.receivedIDs.hasOwnProperty(id)) return;
			this.receivedIDs[id] = true;
		}
	
		var packet = {
			id        : id,
			name      : name,
			origin    : this.origin,
			timestamp : (new Date()).getTime(),
			payload   : message
		};
	
		var self = this;
		this._transaction(function() {
			var data = localStorage.getItem(INDEX_EMIT) || '[]';
			var delimiter = (data === '[]') ? '' : ',';
			data = [data.substring(0, data.length - 1), delimiter, JSON.stringify(packet), ']'].join('');
			localStorage.setItem(INDEX_EMIT, data);
			self.trigger(name, message);
	
			window.setTimeout(function() { self._cleanup_emit(); }, 50);
		});
	};
	
	Intercom.prototype.bind = function(object, options) {
		for (var i = 0; i < Intercom.bindings.length; i++) {
			var binding = Intercom.bindings[i].factory(object, options || null, this);
			if (binding) { this.bindings.push(binding); }
		}
	};
	
	Intercom.prototype.emit = function(name, message) {
		this._emit.apply(this, arguments);
		this._trigger('emit', name, message);
	};
	
	Intercom.prototype.once = function(key, fn, ttl) {
		if (!Intercom.supported) return;
	
		var self = this;
		this._transaction(function() {
			var data = JSON.parse(localStorage.getItem(INDEX_ONCE) || '{}');
			if (!self._once_expired(key, data)) return;
	
			data[key] = {};
			data[key].timestamp = (new Date()).getTime();
			if (typeof ttl === 'number') {
				data[key].ttl = ttl * 1000;
			}
	
			localStorage.setItem(INDEX_ONCE, JSON.stringify(data));
			fn();
	
			window.setTimeout(function() { self._cleanup_once(); }, 50);
		});
	};
	
	util.extend(Intercom.prototype, EventEmitter.prototype);
	
	Intercom.bindings = [];
	Intercom.supported = (typeof localStorage !== 'undefined');
	
	var INDEX_EMIT = 'intercom';
	var INDEX_ONCE = 'intercom_once';
	var INDEX_LOCK = 'intercom_lock';
	
	var THRESHOLD_TTL_EMIT = 50000;
	var THRESHOLD_TTL_ONCE = 1000 * 3600;
	
	Intercom.destroy = function() {
		localStorage.removeItem(INDEX_LOCK);
		localStorage.removeItem(INDEX_EMIT);
		localStorage.removeItem(INDEX_ONCE);
	};
	
	Intercom.getInstance = (function() {
		var intercom = null;
		return function() {
			if (!intercom) {
				intercom = new Intercom();
			}
			return intercom;
		};
	})();
	
	return Intercom;
})();
//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    any(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
      return !predicate.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(value, index, list) {
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed > lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    var result = Infinity, lastComputed = Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed < lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisherâ€“Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return value;
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    iterator = lookupIterator(iterator);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iterator, context) {
      var result = {};
      iterator = lookupIterator(iterator);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(array, predicate, context) {
    predicate = lookupIterator(predicate);
    var pass = [], fail = [];
    each(array, function(elem) {
      (predicate.call(context, elem) ? pass : fail).push(elem);
    });
    return [pass, fail];
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.contains(other, item);
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, 'length').concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;
      if (last < wait) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function () {
      return value;
    };
  };

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    return function(obj) {
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() { return new Date().getTime(); };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}).call(this);
LiveHelpSettings._ = _.noConflict();
LiveHelpSettings.cookies = Cookies.noConflict();

// stardevelop.com Live Help International Copyright 2003-2014
(function (window, document, prefix, config, _, $, undefined) {
	'use strict';
	/*global LiveHelpSettings:true, currentUser:true, buzz:true, CryptoJS:true */

	var protocol = ('https:' === document.location.protocol ? 'https://' : 'http://'),
		directoryPath = '/livehelp/',
		apiPath = '/livehelp/',
		apiEndpoint = {
			home: 'index.php',
			settings: 'include/settings.php',
			visitor: 'include/visitor.php',
			offline: 'offline.php',
			security: 'security.php',
			image: 'image.php',
			chat: 'chat.php',
			call: 'call.php',
			signout: 'logout.php',
			messages: 'messages.php',
			send: 'send.php',
			email: 'email.php'
		},
		server = (typeof config !== 'undefined') ? config.server : document.location.host + document.location.pathname.substring(0, document.location.pathname.indexOf(directoryPath)),
		selector = '#' + prefix,
		opts = {
			protocol: protocol,
			server: protocol + server + directoryPath,
			domain: document.location.host.replace('www.', ''),
			department: '',
			template: 'default',
			sprite: true,
			locale: 'en',
			embedded: false,
			initiate: true,
			initiateDelay: 0,
			css: true,
			fonts: true,
			session: '',
			security: '',
			popup: false,
			visitorTracking: null,
			plugin: '',
			name: '',
			custom: '',
			email: '',
			connected: false,
			hideOffline: true,
			chatBubbles: false,
			messageBubbles: true,
			personalised: false,
			offline: false,
			accepted: false,
			promptPrechatDelay: 250,
			theme: 'green'
		},
		message = 0,
		messageSound,
		newMessages = 0,
		currentlyTyping = 0,
		title = '',
		titleTimer,
		operator = '',
		popup,
		popupPosition = {left: 0, top: 0},
		size = '',
		initiateTimer,
		initiateStatus = '',
		initiateMargin = {left: 10, top: 10},
		initiateSize = {width: 323, height: 229},
		targetX,
		targetY,
		browserSize = {width: 0, height: 0},
		visitorTimer,
		visitorTimeout = false,
		visitorInitialised = 0,
		visitorRefresh = 15 * 1000,
		loadTime = $.now(),
		pageTime,
		exists = (config.account !== undefined && config.account.length === 36),
		cookie = {name: (exists ? 'LiveHelp-' + config.account : prefix + 'Session')},
		cookies = {session: LiveHelpSettings.cookies.get(cookie.name)},
		settings = {user: 'Guest', departments: [], visitorTracking: true, locale: 'en', language: {copyright: 'Copyright &copy; ' +  new Date().getFullYear(), online: 'Online', offline: 'Offline', brb: 'Be Right Back', away: 'Away', contactus: 'Contact Us'}},
		storage = {tabOpen: false, operatorDetailsOpen: true, soundEnabled: true, notificationEnabled: true, chatEnded: false, department: '', messages: 0, lastMessage: 0},
		callTimer = '',
		callConnectedTimer,
		callStatus,
		plugins = {},
		websockets = false,
		tabs = [],
		master = true,
		signup = false;

	// Date.now Shim
	if (!Date.now) {
		Date.now = function () { return new Date().getTime(); };
	}

	// Button Events
	$(document).on('click', '.' + prefix + 'Button', function () {
		openLiveHelp($(this));
		return false;
	});

	$(document).on('click', '.' + prefix + 'CallButton', function () {
		openLiveHelp($(this), '', apiEndpoint.call);
		return false;
	});

	$(document).on('click', '.' + prefix + 'OfflineButton', function () {
		openEmbeddedOffline();
		return false;
	});

	$.preloadImages = function () {
		for (var i = 0; i < arguments.length; i++) {
			$('<img>').attr('src', arguments[i]);
		}
	};

	function overrideSettings() {
		// Update Settings
		if (typeof config !== 'undefined') {
			opts = $.extend(opts, config);
		}

		if (opts.account !== undefined && opts.account.length === 36) {
			$.each(apiEndpoint, function (key, value) {
				if (value.indexOf(opts.account) < 0) {
					if (value.indexOf('api/') > -1) {
						apiEndpoint[key] = value.replace('api/', 'api/' + opts.account + '/');
					} else {
						apiEndpoint[key] = opts.account + '/' + value;
					}
				}
			});
		}

		// Override Server
		if (opts.server.indexOf('http://') === -1 && opts.server.indexOf('https://') === -1) {
			opts.server = opts.protocol + opts.server;
		} else {
			opts.server = opts.protocol + server;
		}
	}

	// Override Settings
	overrideSettings();

	// Intercom Events
	var intercom = Intercom.getInstance(),
		unique = {origin: intercom.origin, timer: false, master: true, time: new Date().getTime()},
		index = _.sortedIndex(tabs, unique, 'time');

	function close(event) {
		intercom.emit('close', {origin: intercom.origin, master: master});
		opts.visitorTracking = false;
		return void 0;
	}

	if (typeof window !== 'undefined' && window !== null) {
		if (window.addEventListener) {
			window.addEventListener('beforeunload', close);
		} else if (window.attachEvent) {
			window.attachEvent('onbeforeunload', close);
		}
	}

	intercom.on('ready', function (data) {
		if (data.origin !== intercom.origin) {
			opts.visitorTracking = false;
			master = false;

			var tab = _.findWhere(tabs, {origin: data.origin});
			if (tab === undefined) {
				_.each(tabs, function (element, index, list) { element.master = false; });

				var element = {origin: data.origin, timer: false, master: true, time: data.time},
					index = _.sortedIndex(tabs, element, 'time');

				tabs.splice(index, 0, element);
			} else {
				if (tab.timer !== false) {
					window.clearTimeout(tab.timer);
					tab.timer = false;
				}
				tab.master = true;
			}
		}
	});

	function updateTab(data) {
		var tab = _.findWhere(tabs, {origin: data.origin});
		if (tab === undefined) {
			var element = {origin: data.origin, timer: false, master: data.master, time: data.time},
				index = _.sortedIndex(tabs, element, 'time');

			tabs.splice(index, 0, element);
		} else {
			if (tab.timer !== false) {
				window.clearTimeout(tab.timer);
				tab.timer = false;
			}
			tab.master = data.master;
			tab.time = data.time;
		}
	}

	intercom.on('ping', function (data) {
		if (data.origin !== intercom.origin) {
			updateTab(data);
			intercom.emit('pong', {origin: intercom.origin, master: master, time: unique.time});
		}
	});

	intercom.on('pong', function (data) {
		if (data.origin !== intercom.origin) {
			updateTab(data);
		}
	});

	intercom.on('master', function (data) {
		if (data.origin === intercom.origin) {
			var tab = _.findWhere(tabs, {origin: data.origin});
			if (tab !== undefined) {
				tab.master = true;
			}
			opts.visitorTracking = true;
			master = true;
		}
	});

	intercom.on('close', function (data) {
		if (data.origin !== intercom.origin) {
			tabs = _.reject(tabs, function (value) { return value.origin === data.origin; });

			if (tabs.length > 0) {
				if (data.master) {
					var available = _.where(tabs, {master: false}),
						tab = available[available.length - 1];

					if (tab !== undefined) {
						intercom.emit('master', {origin: tab.origin});
					}
				}
			}
		}
	});

	var ping = _.throttle(function () {

		// Ping
		if (master) {
			intercom.emit('ping', {origin: intercom.origin, master: master});
		}

		// Ping Timeouts
		$.each(tabs, function (key, data) {
			var tab = _.findWhere(tabs, {origin: data.origin});
			if (tab.timer === false && data.origin !== intercom.origin) {
				tab.timer = window.setTimeout(function () {
					tabs = _.reject(tabs, function (value) { return value.origin === data.origin; });
					tab.timer = false;
				}, 15000);
			}
		});

	}, 7500);

	tabs.splice(index, 0, unique);
	intercom.emit('ready', unique);

	(function send() {
		if (master) {
			ping();
		}

		var last = tabs[tabs.length - 1];
		if (unique.time < last.time && master === true) {
			opts.visitorTracking = false;
			master = false;
		}

		if (tabs.length === 1 && last.origin === unique.origin && !master) {
			opts.visitorTracking = true;
			master = true;
		}

		window.setTimeout(send, 7500);
	})();

	var updateSettingsSession = _.once(function (session) {
		cookies.session = session;
		LiveHelpSettings.cookies.set(cookie.name, session, { domain: opts.domain });
	});

	// Setup Placeholder

	function updateSettings(success) {
		var data = { JSON: '' };

		// Cookies
		if (cookies.session !== undefined && cookies.session.length > 0) {
			data.SESSION = cookies.session;
		}

		// Override Language
		if (config !== undefined && config.locale !== undefined) {
			data.LANGUAGE = config.locale;
		}

		// Override Template
		if (config !== undefined && config.template !== undefined) {
			data.TEMPLATE = config.template;
		}

		// Department
		if (opts.department !== undefined && opts.department.length > 0) {
			data.DEPARTMENT = opts.department;
		}

		$.ajax({
			url: opts.server + apiPath + apiEndpoint.settings,
			data: $.param(data),
			success: function (data, textStatus, jqXHR) {

				if (data.error && opts.embedded !== false) {
					if (data.embedded) {
						settings.embedded = data.embedded;
					}
					setupChat(true);

					var embed = $(selector + 'Embedded');
					embed.addClass('signup-collapsed');
					setOffline('Offline');

					if (initSetup) {
						initSetup(embed, data);
					}

				} else {

					// Update Server Settings
					settings = data;

					// Update Session
					var session = false;
					if (opts.popup && opts.session.length > 0) {
						session = opts.session;
					} else if (settings.session.length > 0) {
						session = settings.session;
					}
					updateSettingsSession(session);

					// Override Language
					if (opts.language !== undefined && !$.isEmptyObject(opts.language)) {
						settings.language = $.extend(settings.language, opts.language);
					}

					// Override Visitor Tracking
					opts.visitorTracking = (opts.visitorTracking != null && opts.visitorTracking === false) ? false : settings.visitorTracking;

					// Visitor Tracking
					if (plugins.websockets === undefined) {
						trackVisit();
					}

					// Override Sprite
					opts.sprite = (opts.template === 'default' && opts.sprite === false) ? true : opts.sprite;

					// Offline Email Redirection
					if (settings.offlineRedirect !== '') {
						if (/^(?:^[\-!#$%&'*+\\.\/0-9=?A-Z\^_`a-z{|}~]+@[\-!#$%&'*+\\\/0-9=?A-Z\^_`a-z{|}~]+\.[\-!#$%&'*+\\.\/0-9=?A-Z\^_`a-z{|}~]+$)$/i.test(settings.offlineRedirect)) {
							settings.offlineRedirect = 'mailto:' + settings.offlineRedirect;
						}
						settings.offlineEmail = 0;
					}

					if (opts.personalised) {
						var op = settings.embeddedinitiate;
						if (op.id > 0) {
							// Operator Details
							showOperatorDetails(op.id, op.name, op.department, op.avatar);
						}
					}

					if (!opts.introduction) {
						opts.introduction = settings.introduction;
					}

					// Initiate Chat
					if (settings.initiate && !settings.autoload) {
						displayInitiateChat();
					}

					// Settings Updated
					$(document).trigger(prefix + '.SettingsUpdated', settings);

					// Smilies
					if (settings.smilies) {
						$(selector + 'SmiliesButton').show();
					} else {
						$(selector + 'SmiliesButton').hide();
					}

					// Update Window Size
					updateChatWindowSize();

					// Departments
					updateDepartments(settings.departments);

					// Callback
					if (success) {
						success();
					}

					// Login Details
					if (settings.user.length > 0) {
						$(selector + 'NameInput').val(settings.user);
					}
					if (settings.email !== false && settings.email.length > 0) {
						$(selector + 'EmailInput').val(settings.email);
					}
					if (settings.department.length > 0) {
						$(selector + 'DepartmentInput').val(settings.department);
					}
				}

			},
			dataType: 'jsonp',
			cache: false,
			xhrFields: { withCredentials: true }
		});
	}

	function updateDepartments(departments) {
		var field = 'DepartmentInput',
			options = '',
			department = $(selector + field);

		if (departments === undefined && settings.departments !== undefined) {
			departments = settings.departments;
		}

		if (departments.length > 0) {
			// Remove Departments
			var existing = department.find('option');
			$.each(existing, function (key, value) {
				value = $(this).val();
				if (value.length > 0 && $.inArray(value, departments) < 0) {
					$(selector + field + ' option[value="' + value + '"]').remove();
				}
			});

			// Add Departments
			var total = 0;
			$.each(departments, function (index, value) {
				if (opts.departments === undefined || (opts.departments !== undefined && opts.departments.length > 0 && $.inArray(value, opts.departments) > -1)) {
					if (!department.find('option[value="' + value + '"]').length) {
						options += '<option value="' + value + '">' + value + '</option>';
					}
					total = total + 1;
				}
			});

			if (total > 0) {
				if (options.length > 0) {
					if (!department.find('option[value=""]').length) {
						options = '<option value=""></option>' + options;
					}
					department.append(options);
				}

				if (opts.department.length === 0) {
					$(selector + 'DepartmentLabel').show();
				}
			} else {
				$(selector + 'DepartmentLabel').hide();
			}

		} else {
			$(selector + 'DepartmentLabel').hide();
		}
	}

	/*
	function ignoreDrag(e) {
		if (e.preventDefault) {
			e.preventDefault();
		}
		if (e.stopPropagation) {
			e.stopPropagation();
		}
		if (e.dataTransfer !== undefined) {
			e.dataTransfer.dropEffect = 'copy';
		}
		return false;
	}

	function acceptDrop(e) {
		ignoreDrag(e.originalEvent);
		var dt = e.originalEvent.dataTransfer,
			files = dt.files;

		if (dt.files.length > 0) {
			var file = dt.files[0];
		}
	}
	*/

	// Update Window Size
	function updateChatWindowSize() {
		popupPosition.left = (window.screen.width - settings.popupSize.width) / 2;
		popupPosition.top = (window.screen.height - settings.popupSize.height) / 2;
		size = 'height=' + settings.popupSize.height + ',width=' + settings.popupSize.width + ',top=' + popupPosition.top + ',left=' + popupPosition.left + ',resizable=1,toolbar=0,menubar=0';
	}

	function showNotification() {
		if (storage.notificationEnabled) {
			if (newMessages > 0) {
				var text = (newMessages > 99) ? '...' : newMessages;
				$(selector + 'Notification span').text(text);
			}
			if (messageSound !== undefined && storage.soundEnabled && storage.notificationEnabled) {
				messageSound.play();
			}
		}
	}

	function updateStorage() {
		$.jStorage.set(prefix, storage);
	}

	function hideNotification() {
		if (newMessages > 0) {
			newMessages = 0;
		}
		updateStorage();
		$(selector + 'Notification').fadeOut(250);
	}

	function loadSprite() {
		$('<img />').load(function () {
			// Add CSS
			$('<link href="' + opts.server + directoryPath + 'templates/' + opts.template + '/styles/sprite.min.css" rel="stylesheet" type="text/css"/>').appendTo('head');
		}).attr('src', opts.server + directoryPath + 'images/Sprite.png');
	}

	var opening = false;

	function openTab(callback, override) {

		// Check Blocked Chat
		if (settings.blocked !== undefined && settings.blocked !== 0) {
			blockChat();
		}

		var embed = $(selector + 'Embedded');
		if (embed.is('.closed') && opts.embedded === true) {

			// Load Sprites
			if (opts.sprite === true) {
				loadSprite();
			}

			// Setup Sounds
			if (messageSound === undefined) {
				messageSound = new buzz.sound(opts.server + directoryPath + 'sounds/Pending Chat', {
					formats: ['ogg', 'mp3', 'wav'],
					volume: 100
				});
			}

			newMessages = 0;
			hideNotification();
			initDepartments();

			// Guest Details
			if (settings.loginDetails === 0 && !override) {
				if (settings.initiate && opts.connected === false) {
					initEmbeddedInitiateChat();
				} else {
					openInitiateChatTab();
					return;
				}
			} else {
				embed.removeClass('closed').addClass('opened');
				resizeChatTab();

				$('.' + prefix + 'MobileButton').addClass('show');
				$('body').addClass(prefix + 'Opened');

				storage.tabOpen = true;
				updateStorage();
			}

			$(selector + 'CloseButton').removeClass('expand').addClass('collapse');

			if (callback) {
				callback();
			}
		}
	}

	function closeTab(complete) {
		var embed = $(selector + 'Embedded'),
			height = embed.height() - 35;

		if (embed.is('.signup')) {
			return;
		}

		$(selector + 'SmiliesButton').close();
		if (embed.is('.opened')) {
			resizeChatTab();

			embed.css('bottom', '-415').removeClass('opened').addClass('closed');
			$('body').removeClass(prefix + 'Opened');
			storage.tabOpen = false;

			updateStorage();
		}

		if (settings.status === 'Online') {
			if (!opts.connected && !settings.initiate) {
				$('.' + prefix + 'Icon').fadeIn();
			}
		}
		if (complete) {
			complete.call();
		}

		$('.' + prefix + 'MobileButton').addClass('show');
		$(selector + 'CloseButton').removeClass('collapse').addClass('expand');

		// Embedded Initiate Chat
		if (embed.attr('data-opened')) {
			updateInitiateStatus('Declined');
		}
	}

	function hideOperatorDetails() {
		var body = $(selector + 'Body'),
			top = parseInt(body.css('top'), 10);

		if (top === 86) {
			var height = $(selector + 'Scroll').height();
			body.animate({ top: 36 }, 500, 'swing', function () {
				$(selector + 'CollapseButton').removeClass('Collapse').addClass('Expand').attr('title', settings.language.expand);
			});
			$(selector + 'Scroll').animate({ height: height + 50 }, 500);
		}
	}

	var addBubbleStyles = _.once(function() {
		var bubblestyles = "";
		if (bubblestyles.length > 0) {
			var styles = '<style type="text/css">' + bubblestyles + '</style>';
			$(styles).appendTo(document.head);
		}
	});

	function showOperatorDetails(id, name, depmnt, avatar) {

		if (depmnt !== undefined && depmnt.length > 0) {
			var departments = depmnt.split(';');
			$.each(departments, function (key, value) {
				if ($.trim(value) === $.trim(opts.department)) {
					depmnt = $.trim(value);
					return;
				}
			});
		}

		var scroll = $(selector + 'Scroll'),
			department = (depmnt !== undefined) ? depmnt : storage.department;

		if (id !== undefined && name !== undefined) {
			var url = opts.server + apiPath + apiEndpoint.image,
				size = 50,
				query = {SIZE: size},
				image = url + '?' + $.param({id: id, size: size, round: ''});

			if (opts.connected) {
				$(selector + 'Toolbar').show();
				$(selector + 'Typing span, ' + selector + 'TypingPopup span').text(name + ' ' + settings.language.istyping);
			}

			if (opts.account !== undefined) {
				image = url + '/round/';
				if (id > 0) {
					image += id + '/' + size + 'px/';
				} else {
					image += 'default/' + size + 'px/';
				}
			}

			if (avatar.length > 0) {
				var defaultimage = image;
				image = 'https://secure.gravatar.com/avatar/' + avatar + '?s=' + size + '&r=g&d=' + defaultimage;
			}

			if (opts.chatBubbles) {

				$('.' + prefix + 'Operator').show();
				$(selector + 'StatusText').css('left', '70px');

				addBubbleStyles();

				$('.' + prefix + 'Icon').hide();
				$('.' + prefix + 'Operator .OperatorImage').css('background', 'url("' + image + '") no-repeat');
				//updateStatusText(name.substring(0, name.indexOf(' ')));
				$(selector + 'CollapseButton').hide();

				//$('.' + prefix + 'Operator, .' + prefix + 'Operator .OperatorImage').fadeIn();
				if (opts.colors !== undefined) {
					if (opts.chatBubbles !== false && opts.colors.image !== undefined && opts.colors.image.border !== undefined) {
						$(selector + 'Embedded').css('border', opts.colors.image.border);
					}
				}
			} else {
				$(selector + 'OperatorImage').css('background', 'url("' + image + '") no-repeat');
				$(selector + 'OperatorName').text(name);
				$(selector + 'OperatorDepartment').text(department);
			}

		}

		if (storage.operatorDetailsOpen && $(selector + 'OperatorName').text().length > 0) {
			var top = parseInt($(selector + 'Body').css('top'), 10);
			if (top === 36) {
				var height = scroll.height();
				$(selector + 'Body').animate({ top: 86 }, 500, 'swing', function () {
					$(selector + 'CollapseButton').removeClass('Expand').addClass('Collapse').attr('title', settings.language.collapse);
				});
				scroll.animate({height: height - 50}, 500);
			}
		}

	}

	function autoCollapseOperatorDetails() {
		var scroll = $(selector + 'Scroll'),
			body = $(selector + 'Body'),
			top = parseInt(body.css('top'), 10);

		if (top === 86) {
			if (scroll.get(0).scrollHeight > scroll.height()) {
				$(selector + 'CollapseButton').click();
			}
		}
	}

	function toggleSound() {
		var css = (storage.soundEnabled) ? 'SoundOn' : 'SoundOff',
			button = $(selector + 'SoundToolbarButton');

		if (button.length > 0) {
			button.removeClass('SoundOn SoundOff').addClass(css);
		}
	}

	var initialiseTab = _.once(function() {
		var embed = $(selector + 'Embedded');
		if (embed.is('.signup')) {
			openTab(false, false);
			return;
		}

		if (storage !== undefined && storage.tabOpen !== undefined && storage.tabOpen === true && (settings.status === 'Online' || settings.autoload !== 0)) {
			openTab(false, false);
		} else {
			closeTab();
		}
	});

	function loadStorage() {
		var store = $.jStorage.get(prefix),
			embedded = $(selector + 'Embedded'),
			initiate = $(selector + 'InitiateChatBubble').is(':visible');

		if (store !== null) {
			storage = store;
			if (embedded.length > 0 && !initiate && settings.autoload) {
				initialiseTab();
			}
			if (storage.soundEnabled !== undefined) {
				toggleSound();
			} else {
				storage.soundEnabled = true;
			}
			if (!settings.autoload) {
				if (storage.operatorDetailsOpen !== undefined && storage.operatorDetailsOpen) {
					showOperatorDetails();
				} else {
					hideOperatorDetails();
				}
			}
		} else {
			if (embedded.length > 0) {
				initialiseTab();
			}
		}
	}

	var clickImage = function (id) {
		return function (eventObject) {
			$('.message[data-id=' + id + '] .fancybox').click();
		};
	};

	function scrollBottom() {
		var scroll = $(selector + 'Scroll');
		if (scroll) {
			scroll.scrollTo($(selector + 'MessagesEnd'));
		}
	}

	var displayImage = function (id) {
		return function (eventObject) {
			var output = '',
				width = $(selector + 'Messages').width(),
				displayWidth = width - 50,
				margin = [25, 25, 25, 25];

			if (this.width > displayWidth) {
				var aspect = displayWidth / this.width,
					displayHeight = this.height * aspect;
				output = '<div class="' + prefix + 'Image" style="position:relative; max-width:' + this.width + 'px; max-height:' + this.height + 'px; height:' + displayHeight + 'px; margin:5px"><div class="' + prefix + 'ImageZoom" style="position:absolute; opacity:0.5; top:0px; z-index:150; background:url(' + opts.server + directoryPath + 'images/Magnify.png) center center no-repeat; max-width:' + this.width + 'px; max-height:' + this.height + 'px; width:' + displayWidth + 'px; height:' + displayHeight + 'px"></div><div class="' + prefix + 'ImageHover" style="position:absolute; top:0px; z-index:100; background:#fff; opacity:0.25; max-width:' + this.width + 'px; max-height:' + this.height + 'px; width:' + displayWidth + 'px; height:' + displayHeight + 'px"></div><div style="position:absolute; top:0px;"><a href="' + this.src + '" class="fancybox"><img src="' + this.src + '" alt="Received Image" style="width:' + displayWidth + 'px; max-width:' + this.width + 'px; max-height:' + this.height + 'px"></a></div>';
			} else {
				output = '<img src="' + this.src + '" alt="Received Image" style="max-width:' + this.width + 'px; margin:5px">';
			}
			$('.message[data-id=' + id + ']').append(output);
			output = '';
			scrollBottom();
			if (!opts.popup) {
				margin = [25, 405, 25, 25];
			}
			$('.message[data-id=' + id + '] .fancybox').fancybox({ openEffect: 'elastic', openEasing: 'swing', closeEffect: 'elastic', closeEasing: 'swing', margin: margin });
			$('.' + prefix + 'ImageZoom').hover(function () {
				$('.' + prefix + 'ImageHover').fadeTo(250, 0);
				$(this).fadeTo(250, 1.0);
			}, function () {
				$('.' + prefix + 'ImageHover').fadeTo(250, 0.25);
				$(this).fadeTo(250, 0.75);
			});
			$('.message[data-id=' + id + '] .' + prefix + 'ImageZoom').click(clickImage(id));
			if (messageSound !== undefined && storage.soundEnabled && storage.notificationEnabled) {
				messageSound.play();
			}
			window.focus();
		};
	};

	function htmlSmilies(message) {
		if (settings.smilies) {
			var smilies = [
					{ regex: /^:D$|^:D | :D | :D$/g, css: 'Laugh' },
					{ regex: /^:\)$|^:\) | :\) | :\)$/g, css: 'Smile' },
					{ regex: /^:\($|^:\( | :\( | :\($/g, css: 'Sad' },
					{ regex: /^\$\)$|^\$\) | \$\) | \$\)$/g, css: 'Money' },
					{ regex: /^&gt;:O$|^&gt;:O |^>:O | &gt;:O | >:O | &gt;:O$| >:O$/g, css: 'Angry' },
					{ regex: /^:P$|^:P | :P | :P$/g, css: 'Impish' },
					{ regex: /^:\\$|^:\\ | :\\ | :\\$/g, css: 'Sweat' },
					{ regex: /^8\)$|^8\) | 8\) | 8\)$/g, css: 'Cool' },
					{ regex: /^&gt;:L$|^&gt;:L |^>:L | &gt;:L | >:L | &gt;:L$| >:L$/g, css: 'Frown' },
					{ regex: /^;\)$|^;\) | ;\) | ;\)$/g, css: 'Wink' },
					{ regex: /^:O$|^:O | :O | :O$/g, css: 'Surprise' },
					{ regex: /^8-\)$|^8-\) | 8-\) | 8-\)$/g, css: 'Woo' },
					{ regex: /^8-O$|^8-O | 8-O | 8-O$/g, css: 'Shock' },
					{ regex: /^xD$|^xD | xD | xD$/g, css: 'Hysterical' },
					{ regex: /^:-\*$|^:-\* | :-\* | :-\*$/g, css: 'Kissed' },
					{ regex: /^:S$|^:S | :S | :S$/g, css: 'Dizzy' },
					{ regex: /^\+O\)$|^\+O\) | \+O\) | \+O\)$/g, css: 'Celebrate' },
					{ regex: /^&lt;3$|^<3$|^&lt;3|^<3 | &lt;3|<3 | &lt;3$| <3$/g, css: 'Adore' },
					{ regex: /^zzZ$|^zzZ | zzZ | zzZ$/g, css: 'Sleep' },
					{ regex: /^:X$|^:X | :X | :X$/g, css: 'Stop' },
					{ regex: /^X-\($|^X-\( | X-\( | X-\($/g, css: 'Tired' }
				];

			for (var i = 0; i < smilies.length; i++) {
				var smilie = smilies[i];
				message = message.replace(smilie.regex, ' <span title="' + smilie.css + '" class="sprite ' + smilie.css + ' Small Smilie"></span> ');
			}
		}
		return $.trim(message);
	}

	function openPUSH(message) {
		var parent = window.opener;
		if (parent) {
			parent.location.href = message;
			parent.focus();
		}
	}

	function display(id, datetime, username, message, align, status) {
		var output = '',
			messages = $(selector + 'Messages'),
			exists = false;

		if (!isNaN(parseInt(id, 10)) && $('.message[data-id=' + id + ']').length > 0) {
			exists = true;
		} else {
			$(document).trigger(prefix + '.MessageRead', {message: id});
		}

		if (messages && message !== null && !storage.chatEnded && !exists) {
			var alignment = 'left',
				color = '#000',
				rtl = '';

			if (id === -2) {
				$(selector + 'Waiting, ' + selector + 'Connecting').fadeOut(250);
				if (storage.operatorDetailsOpen !== undefined && storage.operatorDetailsOpen) {
					$(selector + 'CollapseButton').click();
				}
				if (queued !== undefined && queued.length > 0 && settings.loginDetails !== 0) {
					sendMessage(queued[0]);
					queued = [];
				}
			}

			if (align === 2) {
				alignment = 'center';
			} else if (align === 3) {
				alignment = 'right';
			}
			if (status === 0) {
				color = '#666';
			}
			if ($(selector + 'Toolbar').is(':hidden') && !storage.chatEnded && !opts.chatBubbles) {
				$(selector + 'Toolbar, ' + selector + 'CollapseButton').fadeIn(250);
			}

			if (settings.rtl === true) {
				rtl = '; text-align: right';
			}

			if (datetime === undefined) {
				datetime = id;
			}

			var style = 'message',
				margin = 15;

			if (opts.messageBubbles && id > 0) {
				style = 'message bubble ';
				margin = 0;
				color = '#000';
				if (status === 1 || status === 2 || status === 7) {
					style += 'left';
				} else {
					style += 'right';
				}
			}

			output += '<div class="' + style + '" data-id="' + id + '" data-datetime="' + datetime + '" style="color:' + color + rtl + '">';
			if (status === 0 || status === 1 || status === 2 || status === 7) { // Operator, Link, Mobile Device Messages
				if (username !== undefined && typeof username === 'string' && username.length > 0) {
					if (!opts.messageBubbles) {
						output += username + ' ' + settings.language.says + ':<br/>';
					}

					if (status > 0) {
						operator = username;
					}
				}

				// Check RTL Language
				if (alignment === 'left' && settings.rtl === true) {
					alignment = 'right';
				}

				message = message.replace(/([a-z0-9][a-z0-9_\.\-]{0,}[a-z0-9]@[a-z0-9][a-z0-9_\.\-]{0,}[a-z0-9][\.][a-z0-9]{2,4})/g, '<span style="margin-top:5px"><a href="mailto:$1" class="message-email">$1</a></span>');
				var regEx = /^.*((youtu.be\/)|(v\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/i,
					match = regEx.exec(message),
					width = messages.width();
				if (match !== null && match.length > 6) {
					var videoid = match[6];
					alignment = 'left';
					if (status === 2) {
						var size = {width: 260, height: 195},
							css = 'message-video fancybox.iframe',
							path = 'embed/',
							target = 'self';
						if (opts.popup) {
							size = {width: 480, height: 360};
							css = 'message-video-popup';
							path = 'watch?v=';
							target = 'blank';
						}
						message = '<a href="http://www.youtube.com/' + path + videoid + '" target="_' + target + '" class="' + css + '"><div style="position:relative; height:' + size.height + 'px; margin:5px; color: ' + color + '"><div class="' + prefix + 'VideoZoom noresize" style="position:absolute; opacity:0.5; top:0px; z-index:150; background:url(' + opts.server + directoryPath + 'images/Play.png) center center no-repeat; max-width:' + size.width + 'px; width:' + size.width + 'px; height:' + size.height + 'px"></div><div class="' + prefix + 'VideoHover noresize" style="position:absolute; top:0px; z-index:100; background:#fff; opacity:0.25; max-width:' + size.width + 'px; width:' + size.width + 'px; height:' + size.height + 'px"></div><div style="position:absolute; top:0px;"><img src="http://img.youtube.com/vi/' + videoid + '/0.jpg" alt="YouTube Video" class="noresize" style="width:' + size.width + 'px; max-width:' + width + 'px"></div></div></a>';
					} else {
						message = message.replace(/((?:(?:http(?:s?))|(?:ftp)):\/\/[^\s|<|>|'|\"]*)/g, '<a href="$1" target="_blank" class="message-link fancybox.iframe">$1</a>');
						message = htmlSmilies(message);
						message = '<div style="text-align: ' + alignment + '; margin-left: ' + margin + 'px; color: ' + color + '">' + message + '</div>';
					}
					output += message;
				} else {
					message = message.replace(/((?:(?:http(?:s?))|(?:ftp)):\/\/[^\s|<|>|'|\"]*)/g, '<a href="$1" target="_blank" class="message-link">$1</a>');
					message = htmlSmilies(message);
					output += '<div style="text-align: ' + alignment + '; margin-left: ' + margin + 'px; color: ' + color + '">' + message + '</div>';
				}
			} else if (status === 3) { // Image
				message = message.replace(/((?:(?:http(?:s?))):\/\/[^\s|<|>|'|\"]*)/g, '<img src="$1" alt="Received Image">');
				var result = message.match(/((?:(?:http(?:s?))):\/\/[^\s|<|>|'|"]*)/g);
				if (result !== null) {
					if (username !== '') {
						output += username + ' ' + settings.language.says + ':<br/>';
					}
					$('<img />').load(displayImage(id)).attr('src', result);
				} else {
					output += message;
				}
			} else if (status === 4) { // PUSH
				openPUSH(message);
				output += '<div style="margin-top:5px">' + settings.language.pushedurl + ', <a href="' + message + '" target="_blank" class="message">' + message + '</a> ' + settings.language.opennewwindow + '</div>';
			} else if (status === 5) { // JavaScript
				/*jshint -W054 */
				(new Function(message))();
			} else if (status === 6) { // File Transfer
				output += settings.language.sentfile + ' <a href="' + message + '" target="' + prefix + 'FileDownload">' + settings.language.startdownloading + '</a> ' + settings.language.rightclicksave;
			}
			output += '</div>';

			$(selector + 'Waiting, ' + selector + 'Connecting').fadeOut(250);
			/* TODO Continue Waiting Timer
			if (settings.offlineEmail && $(selector + 'Continue').length > 0) {
				$(selector + 'Continue').fadeOut(250);
				clearTimeout(continueTimer);
			}
			*/
		}
		return output;
	}

	function showTitleNotification() {
		var state = false;

		function updateTitle() {
			var newTitle = state ? title : operator + ' messaged you';
			$(document).attr('title', newTitle);
			state = !state;
		}

		if (titleTimer === null) {
			titleTimer = window.setInterval(updateTitle, 2000);
		}
	}

	function hideTitleNotification() {
		window.clearInterval(titleTimer);
		titleTimer = null;
		if (title.length > 0) {
			$(document).attr('title', title);
		}
	}

	function updateTypingStatus(data) {
		var typing = (data.typing !== undefined) ? data.typing : false,
			obj = $(selector + 'Typing, ' + selector + 'TypingPopup');
		if (typing) {
			obj.show();
		} else {
			obj.hide();
		}
	}

	var messagesInitalised = false;

	function outputMessages(messages) {

		// Output Messages
		var html = '',
			lastID = false,
			margin = [25, 25, 25, 25];

		$.each(messages, function (index, msg) {
			var name = msg.username;
			if (msg.firstname !== undefined && msg.firstname.length > 0) {
				name = msg.firstname;
			}
			html += display(msg.id, msg.datetime, name, msg.content, msg.align, msg.status);
			lastID = msg.id;
			if (msg.status > 0) {
				newMessages++;
			}
		});

		if (html.length > 0) {
			if (!storage.chatEnded && !opts.chatBubbles) {
				$(selector + 'CollapseButton').fadeIn(250);
			}
			$(selector + 'Messages').append(html);

			// Auto Initiate Chat Question
			if (settings.loginDetails !== 0) {
				$(selector + 'Messages .InitiateChat').hide();
			}

			// Sort Messages
			$(selector + 'Messages .message:not(.link), ' + selector + 'Messages ' + selector + 'Continue').sort(function (a, b) {
				a = parseInt($(a).data('datetime'), 10);
				b = parseInt($(b).data('datetime'), 10);
				return (a < b) ? -1 : (a > b) ? 1 : 0;
			}).appendTo(selector + 'Messages');

			autoCollapseOperatorDetails();

			if (!opts.popup) {
				margin = [25, 405, 25, 25];
			}

			$('.message-link, .message-video').fancybox({ openEffect: 'elastic', openEasing: 'swing', closeEffect: 'elastic', closeEasing: 'swing', margin: margin });
			$('.' + prefix + 'VideoZoom').hover(function () {
				$('.' + prefix + 'VideoHover').fadeTo(250, 0);
				$(this).fadeTo(250, 1.0);
			}, function () {
				$('.' + prefix + 'VideoHover').fadeTo(250, 0.25);
				$(this).fadeTo(250, 0.75);
			});

			scrollBottom();

			if (!window.isActive && message > 0) {
				showTitleNotification();
			}

			if (lastID > storage.lastMessage) {
				if (!storage.chatEnded && $(selector + 'Embedded').is('.closed')) {
					if (newMessages > 0) {
						showNotification();
					}
				} else {
					newMessages = 0;
					if (messageSound !== undefined && !storage.chatEnded && storage.soundEnabled && (opts.popup || storage.notificationEnabled)) {
						messageSound.play();
					}
				}
			}
		}

		if (lastID !== false) {
			if (lastID > 0) {
				message = lastID;
			}

			// Store Last Message
			if (lastID > storage.lastMessage) {
				storage.lastMessage = lastID;
				updateStorage();
			}
		}
	}

	function updateMessages() {

		if (storage.chatEnded) {
			window.setTimeout(updateMessages, 1500);
			return;
		}

		if (opts.connected && settings.language !== undefined) {
			var data = { TIME: $.now(), LANGUAGE: settings.locale, MESSAGE: message };

			if (currentlyTyping === 1) {
				data.TYPING = currentlyTyping;
			}

			// Cookies
			if (cookies.session !== undefined && cookies.session.length > 0) {
				data = $.extend(data, { SESSION: cookies.session });

				if (messagesInitalised === false) {
					$(document).trigger(prefix + '.UpdatingMessages', settings);
				}

			}

			$.jsonp({url: opts.server + apiPath + apiEndpoint.messages + '?callback=?',
				data: $.param(data),
				success: function (data) {
					messagesInitalised = true;
					if (data !== null && data !== '') {
						if (data.messages !== undefined && data.messages.length > 0) {
							outputMessages(data.messages);
						}
						updateTypingStatus(data);
					} else {
						updateTypingStatus(false);
					}

					if (websockets === false) {
						window.setTimeout(updateMessages, 1500);
					}
				},
				error: function () {
					if (websockets === false) {
						window.setTimeout(updateMessages, 1500);
					}
				}
			});

			if (promptEmail) {
				promptEmail();
			}

		} else {
			if (messagesInitalised === false && websockets === false) {
				window.setTimeout(updateMessages, 1500);
			}
		}
	}

	// Update Messages
	updateMessages();

	function showSignedIn() {
		var embed = $(selector + 'Embedded');

		$(selector + 'SignIn').hide();
		$(selector + 'SignedIn').show();
		if (!$(selector + 'Messages .message[data-id=-2]').length) {
			$(selector + 'Waiting').show();
		}
		$(selector + 'Body, ' + selector + 'Background').css('background-color', '#fff');
		$(selector + 'Input').animate({ bottom: 0 }, 500);

		if (embed.is(':hidden')) {
			$(selector + 'Waiting, ' + selector + 'Connecting').hide();
			embed.fadeIn(50, function () {
				if (!opts.connected && !settings.initiate) {
					$('.' + prefix + 'Icon').fadeIn();
				}
			});
			loadStorage();
		}
	}

	function showChat() {
		if (!storage.chatEnded) {
			// Connecting
			if ($(selector + 'SignIn').is(':visible')) {

				// Connecting
				showConnecting();

				// Load Sprites
				if (opts.sprite === true) {
					$('<img />').load(function () {
						// Add CSS
						$('<link href="' + opts.server + directoryPath + 'templates/' + opts.template + '/styles/sprite.min.css" rel="stylesheet" type="text/css"/>').appendTo('head');

						// Connecting
						showSignedIn();

					}).attr('src', opts.server + directoryPath + 'images/Sprite.png');
				} else {
					showSignedIn();
				}
			} else {
				var embedded = $(selector + 'Embedded'),
					opened = storage.tabOpen,
					newState = (opened) ? 'opened' : 'closed',
					oldState = (opened) ? 'closed' : 'opened';

				embedded.removeClass(oldState).addClass(newState).css('bottom', '').attr('data-opened', ((opened) ? true : false));
				storage.tabOpen = ((opened) ? true : false);
				updateStorage();
			}
		}
	}

	function showRating() {
		var id = 'Rating',
			element = '#' + prefix + id;

		if ($(element).length === 0) {
			/*jshint multistr: true */
			var ratingHtml = '<div id="' + prefix + 'Feedback' + id + '">' + settings.language.rateyourexperience + ':<br/> \
		<div id="' + prefix + id + '"> \
			<div class="' + id + ' VeryPoor" title="Very Poor"></div> \
			<div class="' + id + ' Poor" title="Poor"></div> \
			<div class="' + id + ' Good" title="Good"></div> \
			<div class="' + id + ' VeryGood" title="Very Good"></div> \
			<div class="' + id + ' Excellent" title="Excellent"></div> \
		</div> \
	</div>';

			$(selector + 'MessagesEnd').prepend(ratingHtml);

			// Rating Events
			var rating = $(element);
			rating.find('.' + id).hover(function () {
				var i = $(this).index();
				rating.find(':lt(' + i + 1 + ')').css('background-position', '0 -32px').parent().find(':gt(' + i + ')').css('background-position', '0 0');
			}, function () {
				var i = $(this).index() + 1;
				rating.find(':lt(' + i + ')').css('background-position', '0 0');
				rating.find('div').each(function () {
					if ($.data(this, 'selected')) {
						$(this).css('background-position', '0 -16px');
					}
				});
			}).click(function () {
				var i = $(this).index(),
					data = { RATING: i + 1 };

				if (cookies.session !== undefined && cookies.session.length > 0) {
					data = $.extend(data, { SESSION: cookies.session });
				}
				rating.find(':lt(' + i + 1 + ')').data('selected', true).css('background-position', '0 -16px');
				rating.find(':gt(' + i + ')').data('selected', false).css('background-position', '0 0');
				$.ajax({ url: opts.server + apiPath + apiEndpoint.signout, data: $.param(data), dataType: 'jsonp', cache: false, xhrFields: { withCredentials: true } });
			});

			scrollBottom();
		} else {
			var ratingElem = $(selector + 'FeedbackRating');
			if (ratingElem.is(':visible')) {
				ratingElem.hide();
			} else {
				ratingElem.show();
				$(selector + 'Scroll').scrollTo(ratingElem);
			}
		}
	}

	function updateImageTitle() {
		$('.' + prefix + 'Status').each(function () {

			// Title / Alt Attributes
			var status = settings.status;
			if (status === 'BRB') {
				status = 'Be Right Back';
			}
			$(this).attr('title', 'Live Chat - ' + status).attr('alt', 'Live Chat - ' + status);
		});
	}

	function resizeChatTab() {
		// Adjust Styles
		var embed = $(selector + 'Embedded'),
			text = $(selector + 'StatusText'),
			close = $(selector + 'CloseButton'),
			tab = $(selector + 'Tab'),
			width = text.position().left + text.width() + close.width() + 30;

		if (embed.is('.closed') && text.width() > 0) {
			tab.css('width', width + 2 + 'px');
			embed.css('width', width + 'px');
		} else {
			tab.css('width', '100%');
		}
	}

	function updateStatusText(status, embed) {
		var indicator = $('.' + prefix + 'StatusIndicator');
		if (embed === undefined) {
			embed = $(selector + 'Embedded');
		}

		status = localeStatusMode(status);
		embed.find(selector + 'StatusText').text(status);
		if (embed.is('.closed')) {
			resizeChatTab();
		}

		if (status === settings.language.online && opts.personalised) {
			var op = settings.embeddedinitiate;
			if (op.id > 0) {
				showOperatorDetails(op.id, op.name, op.department, op.avatar);

				//status = settings.language.chatwith + ' ' + op.name.substring(0, op.name.indexOf(' '));
				//embed.find(selector + 'StatusText').text(status);
				// Disable Status Indicator
				//indicator.show();
				return;
			}
		} else if (status === settings.language.offline || status === settings.language.contactus) {
			indicator.hide();
		}
	}

	function localeStatusMode(status) {
		switch (status) {
			case 'Offline':
				return settings.language.contactus;
			case 'Online':
				return settings.language.online;
			case 'BRB':
				return settings.language.brb;
			case 'Away':
				return settings.language.away;
		}
	}

	function setOffline(status) {
		var embed = $(selector + 'Embedded');

		updateStatusText(status, embed);
		if (settings.loginDetails !== 0) {
			embed.find('.' + prefix + 'Operator .OperatorImage').hide();
		}
		embed.find('.' + prefix + 'Icon').addClass('offline').fadeIn();
		embed.find('.CloseButton').fadeOut(250);
		embed.fadeIn(50).css('z-index', '5000');

		// Close Tab
		closeTab();
	}

	// Change Status Image
	var settingsRefreshed = false;
	function changeStatus(status, departments) {
		var embed = $(selector + 'Embedded'),
			invite = $('.' + prefix + 'Invite'),
			bubble = $(selector + 'InitiateChatBubble'),
			initiate = bubble.is(':visible');

		function updateEmbeddedStatus() {
			invite.show();
			if (opts.embedded === true && embed.length > 0) {
				if (!opts.connected) {
					updateStatusText('Online', embed);
				}
				embed.find('.' + prefix + 'Icon').removeClass('offline');
				embed.find('.CloseButton').fadeIn(250);
				if (!initiate) {
					embed.fadeIn(50, function () {
						if (settings.autoload !== 0) {
							showChat();
							opts.connected = true;
						}
						if (!opts.connected && !settings.initiate) {
							$('.' + prefix + 'Icon').fadeIn();
						}
					});
				}
			}
		}

		// Update Departments
		updateDepartments(departments);

		if (opts.offline || (departments !== false && opts.embedded && !$(selector + 'DepartmentInput option').length) || (departments !== false && settings.departments.length > 0 && opts.department.length > 0 && $.inArray(opts.department, settings.departments) < 0)) {
			status = 'Offline';
		}

		$('.LiveHelpTextStatus').each(function (index, value) {
			var text = localeStatusMode(status);
			$(this).text(text).attr('title', text);
		});

		$('.LiveHelpButton').each(function (index, value) {
			var text = localeStatusMode(status);
			$(this).attr('title', text);
		});

		if (status === 'Online') {
			if (!settingsRefreshed && departments === undefined && settings.status !== '' && settings.status !== status) {
				updateSettings(function (data, textStatus, jqXHR) {
						updateEmbeddedStatus();
					}
				);
				settingsRefreshed = true;

				$('.' + prefix + 'MobileButton').removeClass('hide').addClass('show');

			} else {
				updateEmbeddedStatus();
			}
		} else {
			settingsRefreshed = false;
			if (settings.autoload !== 0) {
				invite.hide();
			}

			// Initiate Bubble
			bubble.css('bottom', -bubble.outerHeight()).hide();

			if (embed.length > 0) {
				if (opts.connected) {
					updateEmbeddedStatus();
				} else {
					if (opts.hideOffline === true) {
						embed.fadeOut(50).css('z-index', '10000000');
					}
				}
			}

			if (status !== 'Online' && opts.hideOffline !== true && opts.connected === false && settings.offlineEmail) {
				setOffline(status);
			}

			$('.' + prefix + 'MobileButton').removeClass('show').addClass('hide');

			// Initiate Chat
			if (status !== 'Online' && $(selector + 'InitiateChat').is(':visible')) {
				$(selector + 'InitiateChat').fadeOut();
			}
		}

		if (settings.status !== '' && settings.status !== status) {

			// jQuery Status Mode Trigger
			$(document).trigger(prefix + '.StatusModeChanged', [status]);

			// Update Status
			settings.status = status;

			$('.' + prefix + 'Status').each(function () {
				// Update Status Image
				var image = settings.images[status.toLowerCase()];
				if (image !== undefined) {
					$(this).attr('src', image);
				} else {
					$(this).attr('src', settings.images.offline);
				}

				// Title / Alt Attributes
				updateImageTitle();
			});

		}
	}

	function getTimezone() {
		var datetime = new Date();
		if (datetime) {
			return datetime.getTimezoneOffset();
		} else {
			return '';
		}
	}

	function updateInitiateStatus(status) {
		// Update Initiate Chat Status
		if (initiateStatus !== status) {
			initiateStatus = status;
			if (visitorInitialised > 0) {
				visitorTimeout = false;
				if (status === 'Accepted' || status === 'Declined') {
					$(selector + 'InitiateChat').fadeOut(250);
				}
				trackVisit(true);
			}
		}
	}

	function toggleInitiateInputs() {
		if ($(selector + 'Embedded').length) {
			$(selector + 'SignIn').hide();
			$(selector + 'SignedIn').show();
			$(selector + 'Body, ' + selector + 'Background').css('background-color', '#fff');
			$(selector + 'Input').animate({ bottom: 0 }, 500);

			if ($(selector + 'Scroll .InitiateChat').length === 0) {

				/*jshint multistr: true */
				var html = '<div class="InitiateChat"> \
	<div class="' + ((opts.messageBubbles) ? 'message bubble left' : 'message') + '" data-id="-1"> \
		<div style="color: #000">' + opts.introduction + '</div> \
	</div>';
				$(html).appendTo(selector + 'Messages');
			}

			$(selector + 'Waiting').hide();

			storage.operatorDetailsOpen = true;
			var op = settings.embeddedinitiate;
			if (op.id > 0) {
				showOperatorDetails(op.id, op.name, op.department, op.avatar);
			}

		}
	}

	function openInitiateChatTab() {
		var embedded = $(selector + 'Embedded'),
			textarea = embedded.find(selector + 'MessageTextarea');

		toggleInitiateInputs();
		embedded.removeClass('opened').addClass('closed').css('bottom', '');
		$('body').removeClass(prefix + 'Opened');

		openTab(function () {
			setTimeout(function () {
				textarea.focus();
			}, 500);
		}, true);

		updateInitiateStatus('Opened');
		$.data(embedded, 'initiate', true);
		embedded.attr('data-opened', true);
	}

	function initEmbeddedInitiateChat() {

		toggleInitiateInputs();

		if ($(selector + 'InitiateChatBubble').length === 0) {

			var operator = settings.embeddedinitiate,
				image = '';

			if (operator.id > 0) {
				image = 'https://secure.gravatar.com/avatar/' + operator.avatar + '?s=50&r=g&d=' + opts.server + apiPath + apiEndpoint.image + '?override=true&size=50&round=true';
			}

			/*jshint multistr: true */
			var html = '<div id="' + prefix + 'InitiateChatBubble"> \
<div class="message bubble right"><div>' + opts.introduction + '</div></div> \
<div class="operator photo" style="background-image: url(\'' + image + '\')"></div> \
<div class="operator badge">1</div> \
</div>';

			var initiate = $(html).appendTo('body');

			$(document).trigger(prefix + '.InitiateChatLoaded');

			// Preload Gravatar
			$('<img />').load(function () {

				// Setup Initiate Chat and Animate
				initiate.on('click', function () {
					if (opts.embedded) {
						$(this).fadeOut(150, function () {
							openInitiateChatTab();
						});
					} else {
						$(this).fadeOut(150);
						openLiveHelp();
						updateInitiateStatus('Opened');
					}
				});
				initiate.css('height', $(selector + 'InitiateChatBubble .bubble').outerHeight() + 25 + 'px');
				initiate.animate({bottom: 0});

			}).attr('src', image);

			$(selector + 'Embedded').removeClass('opened').addClass('closed').css('bottom', '-450px');
			$('body').removeClass(prefix + 'Opened');
		}

	}

	function displayInitiateChat() {

		function showInitiateChat() {

			if (opts.initiate && settings.status !== undefined && settings.status === 'Online') {
				var initiate = false;
				if (settings.embeddedinitiate !== undefined && settings.embeddedinitiate != null) {
					// Embedded Initiate Chat
					initiate = $(selector + 'Embedded');
					if (opts.visitorTracking && !$.data(initiate, 'initiate') && initiateStatus === '') {
						initEmbeddedInitiateChat();
					}
				}
			}
		}

		if (opts.initiateDelay > 0) {
			setTimeout(showInitiateChat, opts.initiateDelay);
		} else {
			showInitiateChat();
		}
	}

	var updateVisitorTrackingSession = _.once(function (session) {
		cookies.session = session;
		LiveHelpSettings.cookies.set(cookie.name, session, { domain: opts.domain });
	});

	function trackVisit(override) {

		clearTimeout(visitorTimer);

		if (visitorInitialised > 0 && override === undefined && ((websockets === false && master === false) || (plugins.websockets !== undefined && websockets === true))) {
			visitorTimeout = true;
		} else {
			visitorTimeout = false;
		}

		if (opts.visitorTracking && !visitorTimeout) {
			var title = $(document).attr('title').substring(0, 150),
				timezone = getTimezone(),
				site = document.location.protocol + '//' + document.location.host,
				referrer,
				url = opts.server + apiPath + apiEndpoint.visitor + '?callback=?',
				data = { INITIATE: initiateStatus };

			if (document.referrer.substring(0, site.length) === site.location) {
				referrer = '';
			} else {
				referrer = document.referrer;
			}

			if (opts.department !== undefined && opts.department.length > 0) {
				data = $.extend(data, { DEPARTMENT: opts.department });
			}

			// Track Visitor
			if (visitorInitialised === 0) {
				data = $.extend(data, { TITLE: title, URL: document.location.href, REFERRER: referrer, WIDTH: window.screen.width, HEIGHT: window.screen.height, TIME: + $.now() });

				// Plugin / Integration
				var plugin = opts.plugin;
				if (plugin.length > 0) {
					var id = opts.custom,
						name = opts.name;

					switch (plugin) {
					case 'Zendesk':
						if (typeof currentUser !== 'undefined' && currentUser.isEndUser === true && currentUser.id !== null) {
							id = currentUser.id;
							name = currentUser.name;
						}
						break;
					case 'WHMCS':
						if (id === undefined || id.length === 0) {
							id = LiveHelpSettings.cookies.get('WHMCSUID');
						}
						break;
					}

					if (id !== undefined && id.length > 0) {
						data = $.extend(data, { PLUGIN: plugin, CUSTOM: id });
					}
					if (name !== undefined && name.length > 0) {
						data = $.extend(data, { NAME: name });
					}
				}

				visitorInitialised = 1;
			}

			// Web Sockets
			if (plugins.websockets !== undefined && plugins.websockets.state !== undefined && plugins.websockets.state.length > 0) {
				data = $.extend(data, { WEBSOCKETS: plugins.websockets.state });
			}

			// Cookies
			if (cookies.session !== undefined) {
				data = $.extend(data, { SESSION: cookies.session });
			}
			data = $.toJSON(data);
			data = Base64.encode(data);

			// Visitor Tracking
			$.jsonp({
				url: url,
				data: {'DATA': data}, //$.param(data),
				success: function (data) {
					if (data !== null && data !== '') {
						if (data.session !== undefined && data.session.length > 0) {
							// Update Session
							updateVisitorTrackingSession(data.session);

							$(document).trigger(prefix + '.VisitorLoaded', data);
						}
						if (data.status !== undefined && data.status.length > 0) {
							changeStatus(data.status, data.departments);
						}
						if (data.initiate !== undefined && data.initiate && !settings.autoload) {
							displayInitiateChat();
						}
						if (data.chat !== undefined && data.chat > 0) {
							$(document).trigger(prefix + '.Connecting', data).trigger(prefix + '.Connected', data);
						}
					}
					if (visitorInitialised === 0) {
						visitorInitialised = 1;
					}

					pageTime = $.now() - loadTime;
					if (pageTime < 90 * 60 * 1000) {
						visitorTimer = window.setTimeout(trackVisit, visitorRefresh);
					} else {
						visitorTimeout = true;
					}
				},
				error: function () {
					visitorTimer = window.setTimeout(trackVisit, visitorRefresh);
				}
			});

		} else {
			visitorTimer = window.setTimeout(trackVisit, visitorRefresh);
		}

	}

	var throttledTrackVisit = _.throttle(trackVisit, visitorRefresh),
		trackVisitInitalise = _.once(trackVisit);

	// Get URL Parameter
	function getParameterByName(url, name) {
		name = name.replace(/(\[|\])/g, '\\$1');
		var ex = '[\\?&]' + name + '=([^&#]*)',
			regex = new RegExp(ex),
			results = regex.exec(url);

		if (results === null) {
			return '';
		} else {
			return decodeURIComponent(results[1].replace(/\+/g, ' '));
		}
	}

	function offlineComplete() {
		var id = 'Offline';
		$('.' + prefix + id + 'Form').fadeOut(250, function () {
			$('.' + prefix + id + 'Sent').fadeIn(250);
		});
		if (opts.embedded) {
			$('.' + prefix + id + 'PoweredBy').css('right', '150px');
		}
		$(selector + id + 'Heading').html(settings.language.thankyoumessagesent).fadeIn(250);
		$(document).trigger('LiveHelp.ContactComplete');
	}

	function offlineSend() {
		var id = 'Offline',
			offline = '#' + prefix + id,
			form = $('#' + id + 'MessageForm'),
			data = form.serialize();

		if (opts.security.length > 0) {
			data += '&SECURITY=' + encodeURIComponent(opts.security);
		}
		if (cookies.session !== undefined && cookies.session.length > 0) {
			data += '&SESSION=' + encodeURIComponent(cookies.session);
		}
		if (opts.template !== undefined && opts.template.length > 0) {
			data += '&TEMPLATE=' + encodeURIComponent(opts.template);
		}
		data += '&JSON';

		$.ajax({url: opts.server + apiPath + apiEndpoint.offline,
			data: data,
			success: function (data) {
				// Enable Offline Button
				$(offline + 'Button').removeAttr('disabled');

				// Process JSON Errors / Result
				if (data.result !== undefined && data.result === true) {
					offlineComplete();
				} else {
					if (data.type !== undefined) {
						if (data.type === 'EMAIL') {
							$('#EmailError').removeClass('TickSmall').addClass('CrossSmall').fadeIn(250);
						}
						if (data.type === 'CAPTCHA') {
							$('#SecurityError').removeClass('TickSmall').addClass('CrossSmall').fadeIn(250);
						}
					}
					if (data.error !== undefined && data.error.length > 0) {
						$(offline + 'Description').hide();
						$(offline + 'Error span').html('Error: ' + data.error).parent().fadeIn(250);
					} else {
						$(offline + 'Error').fadeIn(250);
						$(offline + 'Heading').text(settings.language.offlineerrortitle);
						$(offline + 'Description').hide();
					}
				}
			},
			dataType: 'jsonp',
			cache: false,
			xhrFields: { withCredentials: true }
		});
	}

	function validateResult(id, result) {
		if (result) {
			$(id).removeClass('CrossSmall').addClass('TickSmall').fadeIn(250);
			return true;
		} else {
			$(id).removeClass('TickSmall').addClass('CrossSmall').fadeIn(250);
			return false;
		}
	}

	function validateField(obj, id) {
		var value = (obj instanceof $) ? obj.val() : $(obj).val(),
			result = ($.trim(value) === '');

		return validateResult(id, !result);
	}

	function validateTelephone(obj, id) {
		var value = (obj instanceof $) ? obj.val() : $(obj).val(),
			result = ($.trim(value).length > 0 && /^[\d| |-|.]{3,}$/.test(value));

		return validateResult(id, result);
	}

	function validateEmail(obj, id) {
		var elem = (obj instanceof $) ? obj : $(obj),
			value = elem.val(),
			verify = elem.attr('data-verify'),
			result = (/^[\-!#$%&'*+\\.\/0-9=?A-Z\^_`a-z{|}~]+@[\-!#$%&'*+\\\/0-9=?A-Z\^_`a-z{|}~]+\.[\-!#$%&'*+\\.\/0-9=?A-Z\^_`a-z{|}~]+$/i.test(value)) && ((verify !== undefined && verify.length > 0 && verify === CryptoJS.SHA1(value).toString()) || !value.length || verify === undefined);

		return validateResult(id, result);
	}

	function validatePassword(obj, id) {
		var value = (obj instanceof $) ? obj.val() : $(obj).val(),
			result = (value.length < 8);

		return validateResult(id, !result);
	}

	function validateSecurity(obj, id, complete) {
		var field = (obj instanceof $) ? obj : $(obj),
		errorClass = 'CrossSmall',
		successClass = 'TickSmall',
		value = field.val(),
		data = { SECURITY: opts.security, CODE: value, JSON: '', EMBED: '' },
		validate = opts.security.substring(16, 56);

		function ajaxValidation() {
			$.ajax({ url: opts.server + apiPath + apiEndpoint.security,
				data: $.param(data),
				success: function (data) {
					var error = '';
					if (data.result !== undefined) {
						// Process JSON Errors / Result
						if (data.result === true) {
							$(id).removeClass(errorClass).addClass(successClass).fadeIn(250);
							if (complete) {
								complete();
							}
						} else {
							error = 'CAPTCHA';
						}

					} else {
						error = 'CAPTCHA';
					}

					// Error Handling
					if (error.length > 0) {
						$(id).removeClass(successClass).addClass(errorClass).fadeIn(250);
						if (complete) {
							var field = $('#OfflineMessageForm').find(':input[id=' + error + '], textarea[id=' + error + ']');

						}
					}
				},
				dataType: 'jsonp',
				cache: false,
				xhrFields: { withCredentials: true }
			});
		}

		if (field.length > 0) {
			if (value.length !== 5) {
				if (value.length > 5) {
					field.val(value.substring(0, 5));
				}
				$(id).removeClass(successClass).addClass(errorClass).fadeIn(250);
				return false;
			} else {

				if (validate.length === 40) {
					// Validate Security Code
					if (validate === CryptoJS.SHA1(value.toUpperCase()).toString()) {
						$(id).removeClass(errorClass).addClass(successClass).fadeIn(250);
						if (complete) {
							complete();
						}
						return true;
					} else {
						return false;
					}
				} else {
					ajaxValidation(complete);
				}
			}
		} else {
			if (complete) {
				complete();
			}
			return true;
		}
	}

	function validateForm(form, callback) {
		var country = form.find('select[id=COUNTRY]'),
			telephone = form.find(':input[id=TELEPHONE]');

		if (!validateField(form.find(':input[id=NAME]'), '#NameError')) {
			return;
		} else if (!validateEmail(form.find(':input[id=EMAIL]'), '#EmailError')) {
			return;
		} else if (!validateField(form.find('textarea[id=MESSAGE]'), '#MessageError')) {
			return;
		}
		if (telephone.length > 0 && !validateField(telephone, '#TelephoneError')) {
			return;
		}
		validateSecurity(form.find(':input[id=CAPTCHA]'), '#SecurityError', function () {
			callback.call();
		});
	}

	function validateOfflineForm() {
		var form = $('#OfflineMessageForm');
		validateForm(form, offlineSend);
	}

	var updateSecuritySession = _.once(function (session) {
		LiveHelpSettings.cookies.set(cookie.name, session, { domain: opts.domain });
	});

	function resetSecurityCode(selector, form) {
		if (cookies.session !== null) {
			updateSecuritySession(cookies.session);
		}
		form.find(':input[id=CAPTCHA]').val('');

		$.ajax({ url: opts.server + apiPath + apiEndpoint.security,
			data: { RESET: '', JSON: '' },
			success: function (json) {
				if (json.captcha !== undefined) {
					opts.security = json.captcha;
					var data = '';
					if (opts.security.length > 0) {
						data = '&' + $.param($.extend(data, { SECURITY: encodeURIComponent(opts.security), RESET: '', EMBED: '' }));
					}
					$(selector + 'Security').attr('src', opts.server + apiPath + apiEndpoint.security + '?' + $.now() + data);
				}
			},
			dataType: 'jsonp',
			cache: false,
			xhrFields: { withCredentials: true }
		});
		$('#SecurityError').fadeOut(250);
	}

	function initInputEvents(id, selector, form) {

		$(selector + 'Button, ' + selector + 'CloseButton').hover(function () {
			$(this).toggleClass(id + 'Button ' + id + 'ButtonHover');
		}, function () {
			$(this).toggleClass(id + 'Button ' + id + 'ButtonHover');
		});



		$(selector + 'SecurityRefresh').click(function () {
			resetSecurityCode(selector, form);
		});

		$(selector + 'Button').click(function () {
			validateOfflineForm();
			$(this).attr('disabled', 'disabled');
		});

		$(selector + 'CloseButton').click(function () {
			if (settings.status === 'Online') {
				if ($(this).is('.expand')) {
					openTab(false, false);
				} else {
					closeTab();
				}
			} else {
				openLiveHelp();
			}
		});

		$(selector + 'CloseBlockedButton').click(function () {
			if (opts.embedded) {
				closeTab();
			} else if (opts.popup) {
				window.close();
			}
		});

		form.find(':input[id=NAME]').bind('keydown blur', function () {
			validateField(this, '#NameError');
		});

		form.find(':input[id=EMAIL]').bind('keydown blur', function () {
			validateEmail(this, '#EmailError');
		});

		form.find('textarea[id=MESSAGE]').bind('keydown blur', function () {
			validateField(this, '#MessageError');
		});

		form.find('select[id=COUNTRY]').bind('keydown blur', function () {
			validateField(this, '#CountryError');
		});

		form.find(':input[id=TELEPHONE]').bind('keydown blur', function () {
			validateTelephone(this, '#TelephoneError');
		});

		form.find(':input[id=CAPTCHA]').bind('keydown', function () {
			if ($(this).val().length > 5) {
				$(this).val($(this).val().substring(0, 5));
			}
		}).bind('keyup', function () {
			validateSecurity(this, '#SecurityError');
		});

		var speech = form.find('#MESSAGESPEECH'),
			obj = speech[0];

		if (obj !== undefined) {
			obj.onfocus = obj.blur;
			obj.onwebkitspeechchange = function(e) {
				form.find('#MESSAGE').val(speech.val());
				speech.val('');
			};
		}
	}

	function initOfflineEvents() {
		var id = 'Offline',
			selector = '#' + prefix + id,
			form = $('#' + id + 'MessageForm');

		initInputEvents(id, selector, form);
		if (opts.sprite === true) {
			$('<link href="' + opts.server + directoryPath + 'templates/' + opts.template + '/styles/sprite.min.css" rel="stylesheet" type="text/css"/>').appendTo('head');
		}
	}

	(function checkCallStatus() {

		if (callTimer.length > 0) {
			var data = { SESSION: callTimer },
				timeout = 2000;
			$.ajax({
				url: opts.server + apiPath + apiEndpoint.call + '?JSON',
				data: $.param(data),
				success: function (data, textStatus, jqXHR) {
					var status = -1;
					if (data.status !== undefined) {
						status = parseInt(data.status, 10);
					}
					updateCallStatus(status);
					if (status > 3) {
						timeout = 15000;
					}
					window.setTimeout(checkCallStatus, timeout);
				},
				error: function () {
					updateCallStatus(-1);
					window.setTimeout(checkCallStatus, 2000);
				},
				cache: false,
				xhrFields: { withCredentials: true }
			});
		} else {
			window.setTimeout(checkCallStatus, 2000);
		}

	})();

	function pad(number, length) {
		var str = '' + number;
		while (str.length < length) {
			str = '0' + str;
		}
		return str;
	}

	function startCallConnectedTimer() {
		resetCallConnectedTimer();
		var i = 0;
		var target = $('#CallStatusHeading');
		var timer = function updateTime() {
			i++;
			var minutes = (i > 59) ? parseInt(i / 60) : 0;
			var seconds = (i > 59) ? i % 60 : i;
			var output = pad(minutes, 2) + ':' + pad(seconds, 2);
			target.text('Connected - ' + output + 's');
		};
		callConnectedTimer = setInterval(timer, 1000);
	}
	
	function resetCallConnectedTimer() {
		clearInterval(callConnectedTimer);
	}

	function updateCallStatus(status) {
		var id = '#Call',
			selector = id + 'Status',
			heading = '',
			description = '',
			form = id + 'MessageForm ',
			country = $(form + 'select[id=COUNTRY]').val(),
			prefix = country.substring(country.indexOf('+')),
			telephone = prefix + ' ' + $(form + ':input[id=TELEPHONE]').val(),
			button = settings.language.cancel;
			
		switch(status) {
			case 0:
				heading = settings.language.pleasewait;
				description = settings.language.telephonecallshortly + '<br/>' + settings.language.telephonethankyoupatience;
				break;
			case 1:
				heading = 'Initalising';
				description = settings.language.telephonecallshortly + '<br/>' + settings.language.telephonethankyoupatience;
				break;
			case 2:
				heading = 'Initalised';
				description = settings.language.telephonecallshortly + '<br/>' + settings.language.telephonethankyoupatience;
				break;
			case 3:
				heading = 'Incoming Call';
				description = 'We are now calling you on ' + telephone + '.<br/>Please answer your telephone to chat with us.';
				break;
			case 4:
				heading = 'Connected';
				description = 'Call connected to ' + telephone + '.<br/>' + settings.language.telephonethankyoupatience;
				break;
			case 5:
				heading = 'Thank you';
				description = 'Your call has completed.<br/>Thank you for contacting us.';
				button = 'Close';
				break;
			case 6:
				heading = 'Line Busy';
				description = 'Service is temporarily busy.<br/>Please try again later.';
				break;
			default:
				heading = 'Unavailable';
				description = 'Service is temporarily unavailable.<br/>Please try again later.';
				break;
		}
		
		$(selector + 'Heading').text(heading);
		$(selector + 'Description').html(description);
		$(id + 'CancelButton div').text(button);
		
		if (status !== callStatus) {
			if (status === 4) {
				startCallConnectedTimer();
			} else {
				resetCallConnectedTimer();
			}
			callStatus = status;
		}
		
	}

	function startCall() {
		var selector = '#CallMessageForm ',
			name = $(selector + ':input[id=NAME]').val(),
			email = $(selector + ':input[id=EMAIL]').val(),
			country = $(selector + 'select[id=COUNTRY]').val(),
			timezone = getTimezone(),
			prefix = country.substring(country.indexOf('+')),
			telephone = $(selector + ':input[id=TELEPHONE]').val(),
			message = $(selector + ':input[id=MESSAGE]').val(),
			captcha = $(selector + ':input[id=CAPTCHA]').val(),
			data = { NAME: name, EMAIL: email, COUNTRY: country, TIMEZONE: timezone, DIAL: prefix, TELEPHONE: telephone, MESSAGE: message, CAPTCHA: captcha, SECURITY: opts.security };
		
		$.fancybox.showLoading();
		$.ajax({
			url: opts.server + apiPath + apiEndpoint.call,
			data: $.param(data),
			dataType: 'jsonp',
			success: function (data, textStatus, jqXHR) {
				if (data !== undefined && data.session !== undefined && data.session.length > 0) {
					$.fancybox({ href: '#CallDialog', type: 'inline', closeClick: false, nextClick: false, arrows: false, mouseWheel: false, keys: null, helpers: { overlay: { closeClick: false }, title: null } });
					callTimer = data.session;
				}
			},
			error: function () {
				updateStatus(-1);
			},
			cache: false,
			xhrFields: { withCredentials: true }
		});
	}

	function validateCallForm() {
		var form = $('#CallMessageForm');
		validateForm(form, startCall);
	}

	function initCallEvents() {
		var id = 'Call',
			selector = '#' + prefix + id,
			form = $('#' + id + 'MessageForm');
	
		initInputEvents(id, selector, form);
		
		$(selector + 'Button').click(function () {
			validateCallForm();
		});
		
		// Button Hover Events
		$('#' + id + 'CancelButton').hover(function () {
			var css = $(this).attr('id').replace('#' + id, '');
			$(this).toggleClass('#' + css + ' #' + css + 'Hover');
		}, function () {
			var css = $(this).attr('id').replace('#' + id, '');
			$(this).toggleClass('#' + css + ' #' + css + 'Hover');
		}).click(function () {
			// Cancel or Close Call
			if (callStatus === 5) {
				window.close();
			} else {
				// Cancel AJAX and Close Window
				var data = { SESSION: callTimer, STATUS: 5 };
				$.ajax({
					url: opts.server + apiPath + apiEndpoint.call + '?JSON',
					data: $.param(data),
					success: function (data, textStatus, jqXHR) {
						window.close();
					},
					cache: false,
					xhrFields: { withCredentials: true }
				});
			}
		});
		
	}

	function openEmbeddedOffline(data) {

		if (cookies.session !== undefined && cookies.session.length > 0) {
			data = $.extend(data, { SESSION: cookies.session });
		} else {
			if (!signup) {
				return;
			}
		}

		// Language
		data = $.extend(data, { LANGUAGE: settings.locale });

		$.fancybox.showLoading();

		data = $.extend(data, { SERVER: opts.server + directoryPath, JSON: '', RESET: '', EMBED: '', TEMPLATE: opts.template });
		$.jsonp({url: opts.server + apiPath + apiEndpoint.offline + '?callback=?&' + $.param(data),
			data: $.param(data),
			success: function (data) {
				if (data.captcha !== undefined) {
					opts.security = data.captcha;
				}
				if (data.html !== undefined) {
					$.fancybox.open({content: data.html, type: 'html', fitToView: true, closeClick: false, nextClick: false, arrows: false, mouseWheel: false, keys: null, helpers: { overlay: { css: { cursor: 'auto' }, closeClick: false }, title: null }, padding: 0, minWidth: 300, width:840,height:551, beforeShow: updateSettings, afterShow: initOfflineEvents});
				}
			}
		});
	}

	// Live Help Popup Window
	function openLiveHelp(obj, department, location, data) {
		var template = '',
			callback = false,
			status = settings.status;

		if (cookies.session !== undefined && cookies.session.length > 0) {
			data = $.extend(data, { SESSION: cookies.session });
		} else {
			if ($(selector + 'Embedded.signup-collapsed').length) {
				signup = true;
				data = $.extend(data, { LANGUAGE: 'en', TIME: $.now() });
				openEmbeddedOffline(data);
			}
			return;
		}

		if (obj !== undefined && settings.templates.length > 0) {
			var css = obj.attr('class');
			if (css !== undefined) {
				template = css.split(' ')[1];
				if (template === undefined || $.inArray(template, settings.templates) < 0) {
					template = '';
				}
			}

			var src = obj.children('img.' + prefix + 'Status').attr('src');
			department = getParameterByName(src, 'DEPARTMENT');
		}


		// Override Template
		if (opts.template !== undefined && opts.template.length > 0) {
			template = opts.template;
		}

		// Language
		data = $.extend(data, { LANGUAGE: settings.locale, TIME: $.now() });

		// Callback
		if (obj !== undefined && obj.attr('class') !== undefined && obj.attr('class').indexOf('LiveHelpCallButton') !== -1) {
			callback = true;
		}

		if (opts.embedded && !callback) {

			// Department
			if (opts.department.length > 0) {
				department = opts.department;
			}

			if (status === 'Online' || opts.connected) {
				var embed = $(selector + 'Embedded');
				if (embed.is('.closed')) {
					openTab(false, false);
				}
			} else {

				if (settings.offlineEmail === 0) {
					if (settings.offlineRedirect !== '') {
						document.location = settings.offlineRedirect;
					}
				} else {
					openEmbeddedOffline(data);
				}

			}
			return false;
		}

		// Department / Template
		if (department !== undefined && department !== '') {
			if ($.inArray(department, settings.departments) === -1) {
				status = 'Offline';
			}
			data = $.extend(data, { DEPARTMENT: department });
		}
		if (template !== undefined && template !== '') {
			data = $.extend(data, { TEMPLATE: template });
		}

		// Location
		if (location === undefined || location === '') {
			location = apiEndpoint.home;
		}

		if (status === 'Online') {

			// Name
			if (opts.name !== '') {
				data = $.extend(data, { NAME: opts.name });
			}
			// Email
			if (opts.email !== '') {
				data = $.extend(data, { EMAIL: opts.email });
			}

			// Open Popup Window
			popup = window.open(opts.server + apiPath + location + '?' + $.param(data), prefix, size);

			if (popup) {
				try {
					popup.opener = window;
				} catch (e) {
					// console.log(e);
				}
			}

		} else {

			if (settings.offlineEmail === 0) {
				if (settings.offlineRedirect !== '') {
					document.location = settings.offlineRedirect;
				}
			} else {
				popup = window.open(opts.server + apiPath + apiEndpoint.offline + '?' + $.param(data), prefix, size);
			}
			return false;
		}

	}

	// Connecting
	function showConnecting() {
		// Hide Sign In / Input Fields
		$(selector + 'SignInDetails, ' + selector + 'Login #Inputs').hide();

		// Add and Show Connecting
		var connecting = $(selector + 'Connecting'),
			progress = connecting.find('.connecting-container'),
			messages = $(selector + 'Messages .message').length;

		if (progress.length > 0) {
			if (progress.find('img').length === 0) {
				progress.prepend('<img src="' + opts.server + directoryPath + 'images/ProgressRing.gif" style="opacity: 0.5"/>');
			}
		}
		if (settings.loginDetails !== 0 && !messages) {
			connecting.show();
		}
	}

	function startChat(validate) {
		var form = selector + 'LoginForm',
			name = $(selector + 'NameInput, ' + form + ' :input[id=NAME]'),
			department = $(selector + 'DepartmentInput, ' + form + ' select[id=DEPARTMENT], ' + form + ' input[id=DEPARTMENT]'),
			email = $(selector + 'EmailInput, ' + form + ' :input[id=EMAIL]'),
			question = $(selector + 'QuestionInput, ' + form + ' textarea[id=QUESTION]'),
			other = $(selector + 'OtherInput, ' + form + ' :input[id=OTHER]'),
			inputs = $(selector + 'Login #Inputs'),
			connecting = $(selector + 'Connecting');

		var overrideValidation = (validate !== undefined && validate === false) ? true : false;

		// Signup Placeholder

		// Connecting
		showConnecting();

		// Department
		if (opts.department.length > 0) {
			department.val(opts.department);
		}
		if (department.length > 0 && department.val() !== null) {
			storage.department = department.val();
			updateStorage();
		}

		if (settings.requireGuestDetails && !overrideValidation) {
			var errors = {name: true, email: true, department: true};

			errors.name = validateField(name, selector + 'NameError');
			if (settings.loginEmail) {
				errors.email = validateEmail(email, selector + 'EmailError');
			}

			if (settings.departments.length > 0) {
				var collapsed = department.data('collapsed');

				errors.department = validateField(department, selector + 'DepartmentError');
				if (!collapsed) {
					department.data('collapsed', true);
					department.animate({ width: department.width() - 35 }, 250);
				}
			}

			if (!errors.name || !errors.email || !errors.department) {
				connecting.hide();
				inputs.show();
				return;
			}
		}

		// Name
		if (name.val().length > 0) {
			settings.user = name.val();
		}

		// Input
		name = (name.length > 0) ? name.val() : '';
		department = (department.length > 0 && department.val() !== null) ? department.val() : '';
		email = (email.length > 0) ? email.val() : '';
		other = (other.length > 0) ? other.val() : '';
		question = (question.length > 0) ? question.val() : '';

		var data = { NAME: name, EMAIL: email, DEPARTMENT: department, QUESTION: question, OTHER: other, SERVER: document.location.host, JSON: '' };
		if (cookies.session !== null) {
			data = $.extend(data, { SESSION: cookies.session });
		}

		$.ajax({ url: opts.server + apiPath + apiEndpoint.chat,
			data: $.param(data),
			success: function (data) {
				// Process JSON Errors / Chat ID
				if (data.error === undefined) {
					if (data.session !== undefined && data.session.length > 0) {

						$(document).trigger(prefix + '.Connecting', data);

						// Auto Initiate Chat Question
						if (settings.loginDetails !== 0) {
							$(selector + 'Messages .InitiateChat').hide();
						}

						$(selector + 'MessageTextarea').removeAttr('disabled');
						storage.chatEnded = false;
						updateStorage();

						settings.email = data.email;

						if (settings.user.length > 0) {
							settings.user = data.user;
						}
						if (cookies.session !== null) {
							cookies.session = data.session;
							LiveHelpSettings.cookies.set(cookie.name, cookies.session, { domain: opts.domain });
						}

						if (queued.length > 0 && settings.loginDetails === 0) {
							sendMessage(queued[0], function () {
								promptPrechatEmail();
								showChat();
							});
							queued = [];
						} else {
							promptPrechatEmail();
							showChat();
						}

						if (opts.popup) {
							$(selector + 'Login').hide();
							$(selector + 'Chat').fadeIn(250);
							resizePopup();
						}
						opts.connected = true;
					}

					if (data.status !== undefined && data.status === 'Offline') {
						closeTab();
						var embed = $(selector + 'Embedded');

						if (opts.hideOffline === true) {
							embed.fadeOut(250).css('z-index', '10000000');
						} else {
							embed.fadeIn(250).css('z-index', '5000');
							embed.find('.' + prefix + 'Icon').addClass('offline').fadeIn();
							updateStatusText('Offline', embed);
						}
						embed.find('.CloseButton').fadeOut(250);
					}

					promptEmail();

				} else {
					opts.connected = false;
				}
			},
			dataType: 'jsonp',
			cache: false,
			xhrFields: { withCredentials: true }
		});

	}

	function disconnectChat() {
		var type = 'jsonp';
		opts.connected = false;
		storage.chatEnded = true;
		storage.department = '';
		storage.lastMessage = 0;
		updateStorage();
		message = 0;

		$(document).trigger(prefix + '.DisconnectChat');

		closeTab(function () {
			hideOperatorDetails();
			if (opts.chatBubbles) {
				$('.' + prefix + 'Operator .OperatorImage').hide();
				updateStatusText(settings.status, embed);
				$('.' + prefix + 'Icon').fadeIn();
			}
			$(selector + 'Messages').html('');
			$(selector + 'SignedIn, ' + selector + 'Toolbar, ' + selector + 'CollapseButton').hide();
			$(selector + 'Body, ' + selector + 'Background').css('background-color', '#f9f6f6');
			$(selector + 'Input').animate({ bottom: -100 }, 500);
			$(selector + 'SignIn, ' + selector + 'Waiting').show();
			$(selector + 'Login #Inputs').show();
			$(selector + 'Connecting').hide();
		});

		if (opts.popup) {
			type = 'json';
		}

		$.ajax({ url: opts.server + apiPath + apiEndpoint.signout,
			data: { SESSION: encodeURIComponent(cookies.session) },
			dataType: type,
			cache: false,
			xhrFields: { withCredentials: true },
			success: function (data) {
				if (opts.popup) {
					window.close();
				}
			},
			error: function (jqXHR, textStatus, errorThrown) {
				console.log(textStatus);
			}
		});
		$.fancybox.close();
	}

	function updateTyping(status) {
		if (status === true) {
			status = 1;
		} else {
			status = 0;
		}
		if (status !== currentlyTyping) {
			currentlyTyping = status;
			$(document).trigger(prefix + '.UpdateTyping', {typing: currentlyTyping});
		}
	}

	function escapeHtml(text) {
		var map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		};

		return text.replace(/[&<>"']/g, function(m) { return map[m]; });
	}

	function removeHTML(text) {
		text = escapeHtml(text);
		text = text.replace(/\r\n|\r|\n/g, '<br />');
		return text;
	}

	var displaySentMessage = function (msg, callback) {
		return function (data, textStatus, XMLHttpRequest) {
			if (data !== null && data !== '') {
				if (data.id !== undefined && $('.message[data-id=' + data.id + ']').length === 0) {

					var css = 'message',
						margin = 15,
						color = '#666';

					if (opts.messageBubbles) {
						css += ' bubble right';
						margin = 0;
						color = '#000';
					}

					if (!data.datetime) {
						data.datetime = (Date.now() / 1000 | 0);
					}

					var html = '<div class="' + css + '" data-id="' + data.id + '" data-datetime="' + data.datetime + '" align="left" style="color:#666">',
						username = (settings.user.length > 0) ? settings.user : 'Guest';

					if (!opts.messageBubbles) {
						html += removeHTML(username) + ' ' + settings.language.says + ':<br/>';
					}

					var message = removeHTML(msg);
					message = message.replace(/([a-z0-9][a-z0-9_\.\-]{0,}[a-z0-9]@[a-z0-9][a-z0-9_\.\-]{0,}[a-z0-9][\.][a-z0-9]{2,4})/g, '<a href="mailto:$1" class="message-email">$1</a>');
					message = message.replace(/((?:(?:http(?:s?))|(?:ftp)):\/\/[^\s|<|>|'|\"]*)/g, '<a href="$1" target="_blank" class="message-link">$1</a>');
					if (settings.smilies) {
						message = htmlSmilies(message);
					}
					html += '<div style="margin: 0 0 0 ' + margin + 'px; color: ' + color + '">' + message + '</div></div>';
					$(selector + 'Messages').append(html);
					autoCollapseOperatorDetails();
					scrollBottom();

					if (callback) {
						callback();
					}

				}
			}
		};
	};

	function sendMessage(message, callback) {
		var data = { MESSAGE: message },
			url = opts.server + apiPath + apiEndpoint.send,
			id = 'MessageTextarea',
			obj = $(selector + id);

		if (cookies.session !== undefined && cookies.session.length > 0) {
			data = $.extend(data, { SESSION: cookies.session});
			if (message === 0) {
				$.ajax({ url: url, data: $.param(data), dataType: 'jsonp', cache: false, xhrFields: { withCredentials: true } });
			} else {
				data.JSON = '';
				$.ajax({ url: url, data: $.param(data), success: displaySentMessage(message, callback), dataType: 'jsonp', cache: false, xhrFields: { withCredentials: true } });
				updateTyping(false);
			}
			obj.val('');
			$.jStorage.set(prefix + '.MessageTextarea', '');
		}
	}

	var queued = [];
	function processForm() {
		var id = 'MessageTextarea',
			obj = $(selector + id),
			message = obj.val();

		if (!opts.connected) {
			startChat(false);
			if (queued.length === 0 && message !== '') {
				queued.push(message);
				obj.val('');
				$.jStorage.set(prefix + '.MessageTextarea', '');
			}
			return;
		}

		if (message !== '') {
			sendMessage(message);
		}
		return false;
	}

	// Embedded Events
	function initEmbeddedEvents() {
		var embed = $(selector + 'Embedded');
		if (embed.length > 0) {

			$(selector + 'Tab, ' + selector + 'StatusText, .' + prefix + 'Icon, .OperatorImage, .' + prefix + 'Operator, .' + prefix + 'MobileButton').click(function () {
				opts.embedded = true;
				if (settings.status === 'Online' || opts.connected) {
					if (embed.is('.closed')) {
						if (!storage.notificationEnabled) {
							storage.notificationEnabled = true;
						}
						openTab(false, false);
					} else {
						closeTab();
					}
					updateStorage();
				} else {
					openLiveHelp();
				}
			});

			$(selector + 'StatusText, .' + prefix + 'StatusIndicator, .' + prefix + 'Operator, .OperatorImage, .' + prefix + 'CloseButton').hover(function () {
				$(this).parent().find(selector + 'Tab').addClass('hover');
				$('.' + prefix + 'StatusIndicator').addClass('hover');
			}, function () {
				$(this).parent().find(selector + 'Tab').removeClass('hover');
				$('.' + prefix + 'StatusIndicator').removeClass('hover');
			});

			$(selector + 'CloseButton').click(function () {
				if (settings.status === 'Online') {
					if ($(this).is('.expand')) {
						openTab(false, false);
					} else {
						closeTab();
					}
				} else {
					openLiveHelp();
				}
			});

			$(selector + 'CloseBlockedButton').click(function () {
				closeTab();
			});

			$(selector + 'CollapseButton').click(function () {
				var top = parseInt($(selector + 'Body').css('top'), 10);
				if (top === 86) {
					storage.operatorDetailsOpen = false;
					hideOperatorDetails();
				} else {
					storage.operatorDetailsOpen = true;
					showOperatorDetails();
				}
				updateStorage();
			});

			// Email Prompt
			$(selector + 'ContinueEmailInput').on({
				'keypress': function (event) {
					var characterCode,
						email = $(this).val();

					if (event.keyCode === 13 || event.charCode === 13) {
						var valid = validateEmail(this, selector + 'ContinueEmailError');
						if (email.length > 0 && valid) {
							var data = { SESSION: cookies.session, EMAIL: email };
							settings.email = data.email;
							$.ajax({
								url: opts.server + apiPath + apiEndpoint.email,
								data: $.param(data),
								success: function (data, textStatus, jqXHR) {
									$(selector + 'Continue .' + prefix + 'Input, .' + prefix.toLowerCase() + '-continue-text').hide();
									$(selector + 'Continue .status').text('Thanks!  We will contact you at ' + data.email).show();
									scrollBottom();
									$(document).trigger('LiveHelp.EmailComplete');
								},
								dataType: 'jsonp',
								cache: false,
								xhrFields: { withCredentials: true }
							});
						}
						return false;
					} else {
						return true;
					}
				}
			});

		}
	}

	function blockChat() {
		// Block Chat
		opts.connected = false;
		storage.chatEnded = true;
		storage.department = '';
		storage.lastMessage = 0;
		updateStorage();
		message = 0;

		$(selector + 'SignedIn, ' + selector + 'Login #Inputs, ' + selector + 'CollapseButton, ' + selector + 'Toolbar, ' + selector + 'SignInDetails, ' + selector + 'Connecting').fadeOut();
		$(selector + 'SignIn, ' + selector + 'BlockedChatDetails').fadeIn();
		$(selector + 'MessageTextarea').attr('disabled', 'disabled');
		$(selector + 'ClosedChatMessage').show();

		var blocked = $(selector + 'Login #BlockedChat');
		blocked.fadeIn();
		if (blocked.find('img').length === 0) {
			blocked.prepend('<img src="' + opts.server + directoryPath + 'images/Block.png"/>');
		}
	}

	function initChatEvents() {
		var maxWidth = 800;

		// Connected / Disconnect
		$(document).bind(prefix + '.Connected', function (event, id, name, department, avatar) {
			showOperatorDetails(id, name, department, avatar);
			opts.accepted = true;
		}).bind(prefix + '.Disconnect', function () {
			opts.connected = false;
			storage.chatEnded = true;
			storage.department = '';
			storage.lastMessage = 0;
			updateStorage();
			$(selector + 'Input').find('textarea, ' + selector + 'SmiliesButton, ' + selector + 'Typing').hide();
			$(selector + 'Input *').filter(':not(' + selector + 'PoweredByParent, ' + selector + 'PoweredByParent a, ' + selector + 'PoweredBy)').hide();
			$(selector + 'Input').height('35px');
			$(selector + 'Embedded ' + selector + 'Scroll').height('370px');
			$(selector + 'ClosedChatMessage').show();
			$(selector + 'MessageTextarea').attr('disabled', 'disabled');
			if ($(selector + 'SignedIn').is(':visible') || opts.popup) {
				showRating();
			}
			$.ajax({ url: opts.server + apiPath + apiEndpoint.signout,
				data: { SESSION: encodeURIComponent(cookies.session) },
				dataType: 'jsonp',
				cache: false,
				xhrFields: { withCredentials: true }
			});
		}).bind(prefix + '.BlockChat', function () {
			blockChat();
		});

		$(document).on('click', selector + 'ClosedChatMessage a', function () {
			var input = $(selector + 'Input');
			if (settings.loginDetails === 0) {
				$(selector + 'Body, ' + selector + 'Background').css('background-color', '#fff');
				$(selector + 'Scroll').height('330px');

				input.find('textarea').removeAttr('disabled').show();
				input.animate({ bottom: 0, height: '100px' }, 500);
			} else {
				$(selector + 'Connecting').hide();
				$(selector + 'Body, ' + selector + 'Background').css('background-color', '#f9f6f6');
				$(selector + 'SignIn, ' + selector + 'Login #Inputs').show();
				$(selector + 'Scroll').height('310px');
				$(selector + 'SignedIn').hide();

				input.find('textarea, ' + selector + 'SmiliesButton, ' + selector + 'Typing').show();
				input.css({bottom: '-100px', height: '100px' });
			}

			$(selector + 'FeedbackRating, ' + selector + 'ClosedChatMessage').hide();
		});

		// Toolbar
		$(selector + 'Toolbar div').hover(function () {
			$(this).fadeTo(200, 1.0);
		}, function () {
			$(this).fadeTo(200, 0.5);
		});

		// Sound Button
		$(selector + 'SoundToolbarButton').click(function () {
			if (storage.soundEnabled) {
				storage.soundEnabled = false;
			} else {
				storage.soundEnabled = true;
			}
			updateStorage();
			toggleSound();
		});

		if (opts.popup) {
			maxWidth = 675;
		}

		// Disconnect Button
		$(selector + 'DisconnectToolbarButton').fancybox({ href: selector + 'Disconnect', maxWidth: maxWidth, helpers: { overlay: { css: { cursor: 'auto' } }, title: null }, openEffect: 'elastic', openEasing: 'swing', closeEffect: 'elastic', closeEasing: 'swing', beforeShow: function () {
			$(selector + 'Embedded').css('z-index', 900);
			$('.bubbletip').css('z-index', 950);
		}, afterClose: function () {
			$(selector + 'Embedded').css('z-index', 10000000);
			$('.bubbletip').css('z-index', 90000000);
		} });

		// Feedback Button
		$(selector + 'FeedbackToolbarButton').click(function () {
			showRating();
		});

		// Connect Button
		$(selector + 'ConnectButton').click(function () {
			startChat();
		});

		// Button Hover Events
		$(selector + 'DisconnectButton, ' + selector + 'CancelButton, ' + selector + 'ConnectButton').hover(function () {
			var id = $(this).attr('id').replace(prefix, '');
			$(this).toggleClass(id + ' ' + id + 'Hover');
		}, function () {
			var id = $(this).attr('id').replace(prefix, '');
			$(this).toggleClass(id + ' ' + id + 'Hover');
		});
		$(selector + 'CancelButton').click(function () {
			$.fancybox.close();
		});
		$(selector + 'DisconnectButton').click(function () {
			disconnectChat();
		});

		$(selector + 'SmiliesButton').click(function (e) {
			$(this).bubbletip($('#SmiliesTooltip'), { calculateOnShow: true }).open();
			if (e.stopPropagation) {
				e.stopPropagation();
			}
		});

		var textarea = selector + 'MessageTextarea';
		$(textarea).keypress(function (event) {
			var characterCode;
			if ($(textarea).val() === '') {
				updateTyping(false);
			} else {
				updateTyping(true);
			}
			if (event.keyCode === 13 || event.charCode === 13) {
				processForm();
				return false;
			} else {
				return true;
			}
		}).blur(function () {
			updateTyping(false);
		}).focus(function () {
			$(selector + 'SmiliesButton').close();
			hideNotification();
			hideTitleNotification();
		});

		$(selector + 'Embedded').click(function () {
			$(selector + 'SmiliesButton').close();
		});

		$(textarea).keyup(function (event) {
			var text = $(textarea).val();
			$.jStorage.set(prefix + '.MessageTextarea', text);
		});
		$(textarea).val($.jStorage.get(prefix + '.MessageTextarea', ''));

		$('#SmiliesTooltip span').click(function () {
			var smilie = $(this).attr('class').replace('sprite ', ''),
				val = $(textarea).val(),
				text = '';

			switch (smilie) {
			case 'Laugh':
				text = ':D';
				break;
			case 'Smile':
				text = ':)';
				break;
			case 'Sad':
				text = ':(';
				break;
			case 'Money':
				text = '$)';
				break;
			case 'Impish':
				text = ':P';
				break;
			case 'Sweat':
				text = ':\\';
				break;
			case 'Cool':
				text = '8)';
				break;
			case 'Frown':
				text = '>:L';
				break;
			case 'Wink':
				text = ';)';
				break;
			case 'Surprise':
				text = ':O';
				break;
			case 'Woo':
				text = '8-)';
				break;
			case 'Tired':
				text = 'X-(';
				break;
			case 'Shock':
				text = '8-O';
				break;
			case 'Hysterical':
				text = 'xD';
				break;
			case 'Kissed':
				text = ':-*';
				break;
			case 'Dizzy':
				text = ':S';
				break;
			case 'Celebrate':
				text = '+O)';
				break;
			case 'Angry':
				text = '>:O';
				break;
			case 'Adore':
				text = '<3';
				break;
			case 'Sleep':
				text = 'zzZ';
				break;
			case 'Stop':
				text = ':X';
				break;
			}
			$(selector + 'MessageTextarea').val(val + text);
		});

		var speech = $(selector + 'MessageSpeech'),
			obj = speech[0];

		if (obj !== undefined) {
			obj.onfocus = obj.blur;
			obj.onwebkitspeechchange = function(e) {
				$(selector + 'MessageTextarea').val(speech.val());
				speech.val('');
			};
		}
	}

	function initDepartments() {
		$(selector + 'DepartmentInput, ' + selector + 'LoginForm select[id=DEPARTMENT]').each(function () {
			var attribute = 'collapsed';
			if ($(this).data(attribute) === undefined) {
				$(this).data(attribute, false);
			}
		});
	}

	function initSignInEvents() {
		var form = selector + 'LoginForm';

		// Sign In Events
		if (settings.requireGuestDetails) {

			$(selector + 'NameInput, ' + form + ' input[id=NAME]').bind('keydown blur', function () {
				validateField(this, selector + 'NameError');
			});

			if (settings.loginEmail) {
				$(selector + 'EmailInput, ' + form + ' input[id=EMAIL]').bind('keydown blur', function () {
					validateEmail(this, selector + 'EmailError');
				});
			}

			if (settings.departments.length > 0) {
				$(selector + 'DepartmentInput, ' + form + ' select[id=DEPARTMENT]').bind('keydown keyup blur change', function () {
					var obj = $(this),
						collapsed = obj.data('collapsed');

					validateField(obj, selector + 'DepartmentError');
					if (!collapsed) {
						obj.animate({ width: obj.width() - 35 }, 250);
						obj.data('collapsed', true);
					}
				});
			}
		}

		if (!settings.loginEmail) {
			$(selector + 'EmailInput, ' + form + ' input[id=EMAIL]').hide();
			$('.' + prefix + 'Login .EmailLabel').hide();
		}

		if (!settings.loginQuestion) {
			$(selector + 'QuestionInput, ' + form + ' input[id=QUESTION]').hide();
			$('.' + prefix + 'Login .QuestionLabel').hide();
		}

	}

	function resizePopup() {
		var height = $(window).height(),
			width = $(window).width(),
			campaign = ($(selector + 'Campaign').length > 0 && !$(selector + 'Campaign').is(':hidden')) ? $(selector + 'Campaign').width() : 0,
			scrollBorder = $(selector + 'ScrollBorder'),
			scroll = $(selector + 'ScrollBorder'),
			messages = $(selector + 'Messages'),
			textarea = $(selector + 'MessageTextarea');

		if (scrollBorder.length > 0 && scroll.length > 0) {
			if (scrollBorder.css('width').indexOf('%') === -1) {
				$(selector + 'Scroll, ' + selector + 'ScrollBorder').css('width', 'auto');
				scroll.css('width', width - campaign - 40 + 'px');
				messages.css('width', width - campaign - 48 + 'px');
				scrollBorder.css('width', width - campaign - 20 + 'px');
			}

			// TODO Test Resizing with WHMCS Template
			$(selector + 'Scroll, ' + selector + 'ScrollBorder').css('height', 'auto').css('height', height - 175 - 10 + 'px');
			$('.body').css({'width': width + 'px', 'min-width': '625px'});

			if (textarea.css('width').indexOf('%') === -1) {
				textarea.css('width', width - 165 + 'px');
			}

			width = scrollBorder.css('width');
			var displayWidth = parseInt(width, 10);
			var unitMeasurement = width.slice(-2);
			$(selector + 'Messages img, .' + prefix + 'Image, .' + prefix + 'VideoZoom, .' + prefix + 'VideoHover, .' + prefix + 'ImageZoom, .' + prefix + 'ImageHover').not('.noresize').each(function () {
				var maxWidth = parseInt($(this).css('max-width'), 10),
					maxHeight = parseInt($(this).css('max-height'), 10),
					newWidth = displayWidth - 50,
					aspect = maxHeight / maxWidth,
					newHeight = newWidth * aspect;

				if (newWidth <= maxWidth) {
					$(this).css('width', newWidth + unitMeasurement);
				}
				if (newHeight <= maxHeight || $(this).is('.' + prefix + 'Image')) {
					$(this).css('height', newHeight + unitMeasurement);
				}
			});
			scrollBottom();
		}
	}

	function initPopupEvents() {
		$(window).resize(function () {
			resizePopup();
		});

		$(document).ready(function () {
			initDepartments();
			if (opts.connected) {
				$(selector + 'Login').hide();
				$(selector + 'Chat').fadeIn(250);
				resizePopup();
				startChat();
			}
		});

		initSignInEvents();
		initOfflineEvents();

		if (initCallEvents) {
			initCallEvents();
		}

		// Setup Sounds
		if (messageSound === undefined) {
			messageSound = new buzz.sound(opts.server + directoryPath + 'sounds/Pending Chat', {
				formats: ['ogg', 'mp3', 'wav'],
				volume: 100
			});
		}

		var id = (document.location.pathname.indexOf(directoryPath + apiEndpoint.call) > -1) ? 'Call' : 'Offline',
			selector = '#' + prefix + id,
			form = $('#' + id + 'MessageForm');

		resetSecurityCode(selector, form);
	}

	// Title Notification Events
	window.isActive = true;

	$(window).focus(function () {
		this.isActive = true;
		hideTitleNotification();
	});

	$(window).blur(function () {
		this.isActive = false;
	});

	// Update Settings
	updateSettings();

	function setupChat(disconnected) {

		// Default Disconnected
		disconnected = typeof disconnected !== 'undefined' ? disconnected : false;

		// Image Title
		updateImageTitle();

		// Popup Events
		if (opts.popup) {
			initChatEvents();
			initPopupEvents();
		}

		// jQuery Status Mode Trigger
		$(document).trigger(prefix + '.StatusModeChanged', settings.status);

		// Embedded Chat
		if ($(selector + 'Embedded').length === 0 && opts.embedded === true) {
			var style = (settings.language.copyright.length > 0) ? 'block' : 'none',
				dir = (settings.rtl === true) ? 'dir="rtl"' : '',
				rtl = (settings.rtl === true) ? 'style="text-align:right"' : '';

			var embeddedstyles = "";
			if (embeddedstyles.length > 0) {
				var styles = '<style type="text/css">' + embeddedstyles + '</style>';
				$(styles).appendTo(document.head);
			}

			if (settings.embedded.length > 0) {
				$(settings.embedded).appendTo(document.body);
			}

			// Placeholders
			$(selector + 'Embedded input, ' + selector + 'Embedded textarea').placeholder();

			var themes = {
				'default': {tab: '#dddedf', theme: 'dark'},
				'green': {tab: '#26c281', theme: 'light'},
				'turquoise': {tab: '#31cbbb', theme: 'light'},
				'blue': {tab: '#3498db', theme: 'light'},
				'purple': {tab: '#8e44ad', theme: 'light'},
				'pink': {tab: '#db0a5b', theme: 'light'},
				'orange': {tab: '#f5ab35', theme: 'light'}
			};

			// Set Theme Options
			if (opts.theme !== 'light' && opts.theme !== 'dark' && themes[opts.theme] !== undefined) {
				var themeoptions = themes[opts.theme];
				$(selector + 'Tab').css('background-color', themeoptions.tab);
				opts.theme = themeoptions.theme;
			}

			// Set Light / Dark Theme
			if (opts.theme !== undefined && opts.theme === 'light') {
				$(selector + 'CloseButton, ' + selector + 'StatusText').addClass('light');
			}

			if (opts.colors !== undefined) {
				if (opts.colors.tab !== undefined && opts.colors.tab.normal !== undefined) {
					$(selector + 'Tab').css('background-color', opts.colors.tab.normal);
					if (opts.colors.tab.hover !== undefined) {
						$(selector + 'Tab').hover(function () {
							$(this).css('background-color', opts.colors.tab.hover);
						}, function () {
							$(this).css('background-color', opts.colors.tab.normal);
						});
					}
				}
			}

			// Language
			$.each(settings.language, function (key, value) {
				var element = $(selector + 'Embedded [data-lang-key="' + key + '"]');
				if (element.length > 0) {
					element.text(value);
				}
			});

			// Events
			initEmbeddedEvents();
			initSignInEvents();
			initChatEvents();

			var image = opts.server + apiPath + apiEndpoint.image + '?override=true&size=50&round=true';
			if (opts.account !== undefined) {
				image = opts.server + apiPath + apiEndpoint.image + '/round/default/50px/';
			}

			var op = settings.embeddedinitiate;
			if (op !== undefined && op.id > 0 && op.photo) {
				opts.chatBubbles = true;
			}

			if (opts.chatBubbles) {

				if (op.id > 0) {
					showOperatorDetails(op.id, op.name, op.department, op.avatar);
				}

				var operator = $(selector + 'Embedded .' + prefix + 'Operator');
				$(selector + 'StatusText').css('left', '70px');
				operator.find('.OperatorImage').show();
				operator.show();
			}

			// TODO File Transfer Button
			/*
			$(selector + 'SendFileButton').fancybox({ href: selector + 'FileTransfer', closeClick: false, nextClick: false, arrows: false, mouseWheel: false, keys: null, helpers: { overlay: { css: { cursor: 'auto' }, closeClick: false }, title: null }, openEffect: 'elastic', openEasing: 'swing', closeEffect: 'elastic', closeEasing: 'swing', margin: [25, 405, 25, 25] });

			// Hover File Transfer
			$(selector + 'FileTransfer').hover(function () {
				$('#FileTransferText').fadeIn(250);
			}, function () {
				$('#FileTransferText').fadeOut(250);
			});
			*/

			// Popup Windows Button
			$(selector + 'SwitchPopupToolbarButton').click(function () {
				opts.embedded = false;
				closeTab(function () {
					storage.notificationEnabled = false;
					updateStorage();
				});
				openLiveHelp($(this));
			});

			// TODO HTML5 Drag Drop Events
			/*
			$('.FileTransferDropTarget').bind('dragover', function (event) {
				ignoreDrag(event);
			}).bind('dragleave', function (event) {
				var element = $(this);
				element.css('border-color', '#7c7b7b');
				element.css('background-color', '#fff');
				element.stop();
				$('#FileTransferText').fadeOut(250);
				ignoreDrag(event);
			}).bind('dragenter', function (event) {
				var element = $(this);
				element.css('border-color', '#a2d7e5');
				element.css('background-color', '#d3f3fa');
				element.pulse({backgroundColor: ['#d3f3fa', '#e9f9fc']}, 500, 5);
				$('#FileTransferText').fadeIn(250);
				ignoreDrag(event);
			}).bind('drop', acceptDrop);
			*/

			// Load Storage
			loadStorage();

			// Departments
			updateDepartments(settings.departments);

			// Online
			if (cookies.session !== undefined && cookies.session.length > 0) {
				if (settings.status === 'Online') {
					if (settings.autoload !== 0) {
						if (storage.openTab) {
							openTab(false, false);
						}
					} else {
						var embed = $(selector + 'Embedded'),
							initiate = $(selector + 'InitiateChatBubble').is(':visible');

						if (embed.is(':hidden')) {
							$(selector + 'Waiting').hide();
							if (!initiate) {
								embed.fadeIn(50, function () {
									if (!opts.connected && !settings.initiate) {
										$('.' + prefix + 'Icon').fadeIn();
									}
								});
								$('.' + prefix + 'MobileButton').addClass('show');
							}
							loadStorage();
						}
					}
				} else {
					if (settings.autoload !== 0) {
						openTab(false, false);
					}
				}
			}

			// Login Details
			var form = selector + 'LoginForm',
				name = $(selector + 'NameInput, ' + form + ' :input[id=NAME]'),
				email = $(selector + 'EmailInput, ' + form + ' :input[id=EMAIL]'),
				inputs = $(selector + 'SignIn').find('input, textarea');
			if (opts.name !== undefined && opts.name.length > 0) {
				name.val(opts.name);
				if (settings.requireGuestDetails) {
					validateField(name, selector + 'NameError');
				}
			}
			if (opts.email !== undefined && opts.email.length > 0) {
				email.val(opts.email);
				if (settings.requireGuestDetails) {
					validateEmail(email, selector + 'EmailError');
				}
			}
			if (!settings.requireGuestDetails) {
				inputs.css('width', '100%');
			}

			// Auto Load / Connected
			if (settings.autoload !== 0) {
				showChat();

				if (!disconnected) {
					opts.connected = true;
				}
			}

			// Update Status
			if (settings.status !== undefined && settings.status.length > 0) {
				changeStatus(settings.status, settings.departments);
			}

			if (!opts.connected && !settings.initiate) {
				$('.' + prefix + 'Icon').fadeIn();
			}

			// Update Settings
			overrideSettings();

		}
	}

	$(document).bind(prefix + '.SettingsUpdated', function () {
		setupChat();
	});

	$(document).bind(prefix + '.StatusModeUpdated', function (event, data) {
		var message = data.data;
		settings.departments = message.departments;
		changeStatus(message.status, settings.departments);
	});

	$(document).bind(prefix + '.WebSocketStateChanged', function (event, data) {
		websockets = data.connected;
		if (plugins.websockets !== undefined && plugins.websockets.enabled === true) {
			if ((plugins.websockets.state !== 'established' && data.state === 'established') || (plugins.websockets.state !== 'error' && data.state === 'error')) {
				plugins.websockets.state = data.state;
				trackVisitInitalise();
			}
		} else {
			throttledTrackVisit();
		}
	});

	$(document).bind(prefix + '.UpdateMessages', function (event, data) {
		if (data !== undefined) {
			if (data.status === undefined) {
				data.status = 0;
			} else if (data.status > 0) {
				promptEmail();
			}
		}
		opts.accepted = true;
		updateMessages();
	});

	function showEmailPrompt(text) {
		var elem = $(selector + 'Continue'),
			messages = $(selector + 'Messages');

		if (settings.email === false) {
			if (text !== false) {
				elem.find('.' + prefix.toLowerCase() + '-continue-text').text(text);
			}
		} else {
			elem.find('.' + prefix.toLowerCase() + '-continue-text').text('Hmm looks like there was no response.  We will reply via email shortly.');
			elem.find('.' + prefix + 'Input').hide();
			if (settings.email !== undefined) {
				elem.find('.status').text('We will contact you at ' + settings.email).show();
			}
		}

		if (!messages.find(selector + 'Continue').length) {
			$(elem).appendTo(messages).show().attr('data-datetime', (Date.now() / 1000 | 0));
			scrollBottom();
		}
	}

	var promptEmail = _.debounce(function () {
		showEmailPrompt(false);
	}, 90000);

	var promptPrechatEmail = _.debounce(function () {
		if (!opts.accepted) {
			showEmailPrompt(false);
		}
	}, opts.promptPrechatDelay);

	$(document).bind(prefix + '.MessageReceived', function (event, data) {
		// Default Alignment and Status
		if (data.align === undefined) {
			data.align = 1;
		}
		if (data.status === undefined) {
			data.status = 0;
		}

		if (data.status > 0) {
			promptEmail();
		}
		outputMessages([data]);
	});

	// Document Ready
	$(document).ready(function () {

		// Document Ready Placeholder

		// Title
		title = $(document).attr('title');

		// Insert CSS / Web Fonts
		var css = '';
		if (opts.fonts === true) {
			css = '<link href="' + opts.protocol + 'fonts.googleapis.com/css?family=Open+Sans:300,400,700" rel="stylesheet" type="text/css"/>';
		}
		if (opts.css === true) {
			css += '<link href="' + opts.server + directoryPath + 'templates/' + opts.template + '/styles/styles.css" rel="stylesheet" type="text/css"/>';
		}
		if (css.length > 0) {
			$(css).appendTo('head');
		}

		// Title Notification Event
		$(this).click(function () {
			hideTitleNotification();
		});

		if (settings !== undefined && settings.status !== undefined) {
			setupChat();
		}

		// Override Settings
		overrideSettings();

		// Resize Popup
		if (opts.popup) {
			resizePopup();
		}

		// Setup Initiate Chat / Animation
		if (typeof resetPosition !== 'undefined') {
			$(window).bind('resize', resetPosition);
		}

		// Embedded Chat / Local Storage
		$(window).bind('storage', function (e) {
			loadStorage();
		});

	});

})(this, document, 'LiveHelp', LiveHelpSettings, LiveHelpSettings._, jQuery);
