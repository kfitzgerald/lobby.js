
var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Joi = require('joi'),
    shortid = require('shortid'),
    Room = require('./room'),
    Member = require('./member');



/**
 * Lobby Constructor
 * @extends {EventEmitter}
 *
 * @property {String} name - The name of the lobby
 * @property {Number} minOpenRooms – The number of rooms to keep open
 * @property {Number} maxRooms – The total number of rooms that may exist at any given time, open or closed
 * @property {Number} roomSoftMemberCap – The threshold to trigger a room-soft-full event
 * @property {Number} roomMemberCap – The threshold to trigger a room-full event
 *
 * @property {[Room]} rooms – The active rooms that are open
 * @property {[Room]} openRooms – The active rooms that are open
 * @property {[Room]} closedRooms – The active rooms that are open
 *
 * @param {{name: String, minOpenRooms: Number, maxRooms: Number, roomSoftMemberCap: Number, roomMemberCap: Number}} [options] – Configuration properties
 * @constructor
 */
function Lobby(options) {
    EventEmitter.call(this);

    // Initialize configuration
    this._init(options);

    // Container holding all the active rooms, keyed on id
    var self = this,
        _id = shortid.generate(),
        _rooms = {},
        _props = {},
        _propNames = Object.keys(Lobby.schema.options);

    //
    // Wrap properties with forced validation
    //
    for(var i = 0; i < _propNames.length; i++) {
        (function(name) {
            // Create a container for the original value
            _props[name] = self[name];

            // Wrap a property validator around the property
            //noinspection JSUnusedGlobalSymbols
            Object.defineProperty(self, name, {
                enumerable: true,
                get: function() { return _props[name]; },
                set: function(v) {
                    self._validatePropertyChange(v, Lobby.schema.options[name], function(err, val) {
                        if (!err) {
                            _props[name] = val;
                        }
                    })
                }
            })

        })(_propNames[i]);
    }


    // Construct the other properties
    Object.defineProperties(this, {

        id: {
            enumerable: true,
            value: _id
        },

        rooms: {
            enumerable: true,
            get: function() {
                var out = [];
                Object.keys(_rooms).forEach(function(id) {
                    out.push(_rooms[id]);
                });
                return out;
            }
        },

        openRooms: {
            enumerable: true,
            get: function() {
                var out = [];
                Object.keys(_rooms).forEach(function(id) {
                    if (_rooms[id].isOpen) { out.push(_rooms[id]); }
                });
                return out;
            }
        },

        closedRooms: {
            enumerable: true,
            get: function() {
                var out = [];
                Object.keys(_rooms).forEach(function(id) {
                    if (!_rooms[id].isOpen) { out.push(_rooms[id]); }
                });
                return out;
            }
        }
    });


    // Open up the default set of rooms based on config
    process.nextTick(function(){
        self._ensureOpenRooms();
    });
}

util.inherits(Lobby, EventEmitter);

//noinspection JSUnresolvedFunction
/**
 * Lobby validation schemas
 * @type {{options: {name: *, minOpenRooms: *, maxRooms: *, roomSoftMemberCap: *, roomMemberCap: *}}}
 */
Lobby.schema = {
    options: {
        name: Joi.string().min(1).max(255).default('Lobby').optional(), // the name of the lobby
        minOpenRooms: Joi.number().min(0).max(255).default(3).optional(), // how many slots to always keep open
        maxRooms: Joi.number().min(0).max(255).default(10).optional(), // the maximum number of slots that can exist at any given time, 0 to disable
        roomSoftMemberCap: Joi.number().min(0).max(10).default(0).optional(), // the number of members to trigger a soft full event, 0 to disable
        roomMemberCap: Joi.number().min(0).max(50).default(10) // the maximum number of members that may join a room
    }
};

/**
 * Initialize the Lobby
 * @param {*} options – Configuration properties
 * @protected
 */
Lobby.prototype._init = function(options) {
    var self = this;

    // Validate the options provided
    Joi.validate(options, Lobby.schema.options, { allowUnknown: true, stripUnknown: false }, function(err, options) {

        // If we got bad data, then bail
        if (err) { throw err; }

        // Copy properties to self
        for (var i in options) {
            if (options.hasOwnProperty(i)) {
                self[i] = options[i];
            }
        }
    });
};

/**
 * 
 * @param value
 * @param schema
 * @param callback
 * @protected
 */
Lobby.prototype._validatePropertyChange = function(value, schema, callback) {
    var self = this;
    Joi.validate(value, schema, function(err, val) {
        if (err) {
            self.emit('error', err);
        }
        callback(err, val);
    });
};

/**
 * Make sure the rooms
 * @protected
 */
Lobby.prototype._ensureOpenRooms = function() {
    // Check our current open count vs the keep open amount
    // If too low, then create more open rooms, if the max count won't be exceeded

    var openCount = this.openRooms.length;

    if (this.minOpenRooms > 0 && this.minOpenRooms > openCount) {

        var newCount = this.minOpenRooms - openCount;
        if (this.maxRooms > 0 && newCount > this.maxRooms) {
            // Cannot create all the rooms we want to, so reduce the spawn count to fit in the cap
            newCount = this.maxRooms - newCount;
        }

        // Spawn the open rooms
        for(var i = 0; i < newCount; i++) {
            this.createRoom();
        }
    }
};


Lobby.prototype.createRoom = function(options) {

    // Prioritize options given over the default lobby options
    var roomOptions = options || {};
    if (this.roomSoftMemberCap) { roomOptions.softMemberCap = roomOptions.softMemberCap || this.roomSoftMemberCap; }
    if (this.roomMemberCap) { roomOptions.memberCap = roomOptions.memberCap || this.roomMemberCap; }

    // Create the room
    var room = new Room(roomOptions);
    this.rooms.push(room);

    // Tell the watchers the a room was provisioned
    this.emit('room_opened', room);
};

module.exports = Lobby;