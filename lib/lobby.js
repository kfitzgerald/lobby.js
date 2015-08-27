
var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Joi = require('joi'),
    shortid = require('shortid'),
    Room = require('./room'),
    Member = require('./member');

/**
 * @event Lobby#room_open
 * @type {Room}
 */

/**
 * Lobby Constructor
 * @extends {EventEmitter}
 *
 * @param {{name: String, minOpenRooms: Number, maxRooms: Number, roomSoftMemberCap: Number, roomMemberCap: Number}} [options] – Configuration properties
 * @constructor
 *
 * @fires Lobby#room_open
 */
function Lobby(options) {

    // Inherit from EventEmitter so we can emit events
    EventEmitter.call(this);

    //
    // Basic properties
    //

    /**
     * Name of the lobby
     * @type {String}
     */
    this.name = null;

    /**
     * Number of rooms to keep open at any given time (self-scale). Set to `0` to disable.
     * @type {Number}
     */
    this.minOpenRooms = null;

    /**
     * Total number of rooms that may exist at any given time. Set to `0` to disable.
     * @type {Number}
     */
    this.maxRooms = null;

    /**
     * When a member joins a room, this is the threshold that will trigger a soft-full event. Set to `0` to disable.
     * @type {Number}
     */
    this.roomSoftMemberCap = null;

    /**
     * The total number of members that may join a room. Set to `0` to disable.
     * @type {Number}
     */
    this.roomMemberCap = null;

    //
    // Initialize configuration
    //

    var self = this;
    this._init(options, function() {

        // Open up the default set of rooms based on config
        process.nextTick(function(){
            self._ensureOpenRooms();
        });

    });

    /**
     * The unique id of this lobby instance
     * @type {String}
     */
    this.id = shortid.generate();

    /**
     * The collection of active rooms (open and closed), keyed on id
     * @type {{}}
     */
    this.rooms = {};


    //
    // Construct the other properties
    //

    Object.defineProperties(this,
        /** @lends Lobby.prototype */
        {

            /**
             * List of all active rooms
             * @name Lobby#allRooms
             * @property {[Room]}
             */
            allRooms: {
                enumerable: true,
                get: function() {
                    var out = [];
                    Object.keys(self.rooms).forEach(function(id) {
                        out.push(self.rooms[id]);
                    });
                    return out;
                }
            },

            /**
             * List of all open rooms
             * @name Lobby#openRooms
             * @property {[Room]}
             */
            openRooms: {
                enumerable: true,
                get: function() {
                    var out = [];
                    Object.keys(self.rooms).forEach(function(id) {
                        if (self.rooms[id].isOpen) { out.push(self.rooms[id]); }
                    });
                    return out;
                }
            },

            /**
             * List of all closed rooms
             * @name Lobby#openRooms
             * @property {[Room]}
             */
            closedRooms: {
                enumerable: true,
                get: function() {
                    var out = [];
                    Object.keys(self.rooms).forEach(function(id) {
                        if (!self.rooms[id].isOpen) { out.push(self.rooms[id]); }
                    });
                    return out;
                }
            }
        }
    );
}

util.inherits(Lobby, EventEmitter);

//noinspection JSUnresolvedFunction
/**
 * Lobby validation schemas
 * @type {{options: {name: *, minOpenRooms: *, maxRooms: *, roomSoftMemberCap: *, roomMemberCap: *}}}
 */
Lobby.schema = {
    options: {

        id: Joi.any().strip(),
        rooms: Joi.any().strip(),
        allRooms: Joi.any().strip(),
        openRooms: Joi.any().strip(),
        closedRooms: Joi.any().strip(),

        name: Joi.string().min(1).max(255).default('Lobby').optional(), // the name of the lobby
        minOpenRooms: Joi.number().min(0).max(255).default(3).optional(), // how many slots to always keep open
        maxRooms: Joi.number().min(0).max(255).default(10).optional(), // the maximum number of slots that can exist at any given time, 0 to disable
        roomSoftMemberCap: Room.schema.options.softMemberCap,
        roomMemberCap: Room.schema.options.memberCap // the maximum number of members that may join a room
    }
};

/**
 * Initialize the Lobby
 * @param {{}} options – Configuration properties
 * @param {Function} [callback] – Optional callback when done initializing
 * @protected
 */
Lobby.prototype._init = function(options, callback) {
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

        callback && callback();
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
            newCount += this.maxRooms - newCount;
        }

        // Spawn the open rooms
        for(var i = 0; i < newCount; i++) {
            this.createRoom();
        }
    }
};


/**
 * Creates a new room with the given options
 * @param {{name: *, softMemberCap: *, memberCap: *}} [roomOptions] Room options
 * @fires Lobby#room_open
 */
Lobby.prototype.createRoom = function(roomOptions) {

    // Prioritize options given over the default lobby options
    roomOptions = roomOptions || {};
    if (this.roomSoftMemberCap) { roomOptions.softMemberCap = roomOptions.softMemberCap || this.roomSoftMemberCap; }
    if (this.roomMemberCap) { roomOptions.memberCap = roomOptions.memberCap || this.roomMemberCap; }

    // Create the room
    var room = new Room(roomOptions);
    this.rooms[room.id] = room;

    // Tell the watchers the a room was provisioned
    this.emit('room_open', room);
};

module.exports = Lobby;