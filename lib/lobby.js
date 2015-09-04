
var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Joi = require('joi'),
    shortid = require('shortid'),
    Room = require('./room'),
    Member = require('./member');

/**
 * @event Lobby#room_add
 * @type {Room}
 */

/**
 * @event Lobby#room_open
 * @type {Room}
 */

/**
 * @event Lobby#room_close
 * @type {Room}
 */

/**
 * @event Lobby#room_end
 * @type {Room}
 */

/**
 * Lobby Constructor
 * @extends {EventEmitter}
 *
 * @param {{options: {name: string, minOpenRooms: number, maxRooms: number, roomOptions: {name: string, softMemberCap: number, memberCap: number, isOpen: boolean, closeOnFull: boolean, endOnCloseAndEmpty: boolean, openWhenNotFull: boolean}}}} [options] – Configuration properties
 *
 * @class
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
     * Default options to give rooms when created automatically.
     * @type {Object}
     */
    this.roomOptions = null;

    //
    // Initialize configuration
    //

    var self = this;
    this._init(options);

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

    // Open up the default set of rooms based on config
    process.nextTick(this._ensureOpenRooms.bind(this));
}

util.inherits(Lobby, EventEmitter);


/**
 * Incremented when lobbies are initialized.
 * @type {number}
 */
Lobby.counter = 0;


//noinspection JSUnresolvedFunction
/**
 * Lobby validation schemas
 * @type {{options: {id: *, rooms: *, allRooms: *, openRooms: *, closedRooms: *, name: *, minOpenRooms: *, maxRooms: *, roomOptions: *}}}
 */
Lobby.schema = {
    options: {

        id: Joi.any().strip(),
        rooms: Joi.any().strip(),
        allRooms: Joi.any().strip(),
        openRooms: Joi.any().strip(),
        closedRooms: Joi.any().strip(),

        name: Joi.string().min(1).max(255).allow(null).default(null).optional(), // the name of the lobby
        minOpenRooms: Joi.number().min(0).max(255).default(3).optional(), // how many slots to always keep open
        maxRooms: Joi.number().min(0).max(255).default(10).optional(), // the maximum number of slots that can exist at any given time, 0 to disable
        roomOptions: Joi.object().keys(Room.schema.options).default({}).optional() // the default options to give rooms
    }
};


/**
 * Initialize the Lobby
 * @param {{}} options – Configuration properties
 * @protected
 */
Lobby.prototype._init = function(options) {

    // Validate the options provided
    var result = Joi.validate(options || {}, Lobby.schema.options, { allowUnknown: true, stripUnknown: false });

    // If we got bad data, then bail
    if (result.error) { throw result.error; }

    // Copy properties to self
    if (result.value) {
        for (var i in result.value) {
            if (result.value.hasOwnProperty(i)) {
                this[i] = result.value[i];
            }
        }
    }

    // Generate a name if none given
    if (!this.name) {
        this.name = 'Lobby ' + (Lobby.counter++);
    }
};


/**
 * Opens enough rooms to fill the configured minimum demand
 * @fires Lobby#room_open
 * @protected
 */
Lobby.prototype._ensureOpenRooms = function() {

    // Check our current open count vs the keep open amount
    // If too low, then create more open rooms, as long as the max count won't be exceeded

    var roomCount = this.allRooms.length,
        openCount = this.openRooms.length;

    if (this.minOpenRooms > 0 && this.minOpenRooms > openCount) {

        // Determine the number of rooms to fill the gap
        var newCount = this.minOpenRooms - openCount;

        // Verify the new batch of rooms will fit under the cap, if applicable
        if (this.maxRooms > 0 && (roomCount + newCount) > this.maxRooms) {
            // Cannot create all the rooms we want to, so reduce the spawn count to fit in the cap
            newCount = newCount + (this.maxRooms - (roomCount + newCount));
        }

        // Spawn the open rooms
        for(var i = 0; i < newCount; i++) {
            this.createRoom();
        }
    }
};


/**
 * Handles emitting events when a room closes
 * @param {Room} room – The room that closed
 * @fires Lobby#room_close
 * @protected
 */
Lobby.prototype._handleRoomClose = function(room) {
    process.nextTick(this.emit.bind(this, 'room_close', room));
    this._ensureOpenRooms();
};


/**
 * Handles emitting events when a room is created by the lobby
 * @param {Room} room – The room that was created
 * @fires Lobby#room_add
 * @protected
 */
Lobby.prototype._handleRoomAdd = function(room) {
    process.nextTick(this.emit.bind(this, 'room_add', room));
};


/**
 * Handles emitting events when a room opens
 * @param {Room} room – The room that opened
 * @fires Lobby#room_open
 * @protected
 */
Lobby.prototype._handleRoomOpen = function(room) {
    process.nextTick(this.emit.bind(this, 'room_open', room));
};


/**
 * Handles emitting events when a room and ended
 * @param {Room} room – The room that ended
 * @fires Lobby#room_end
 * @protected
 */
Lobby.prototype._handleRoomEnd = function(room) {
    process.nextTick(this.emit.bind(this, 'room_end', room));

    // Stop tracking that room, it's dead to me
    delete this.rooms[room.id];

    // Open more rooms if this one is gone
    this._ensureOpenRooms();
};


/**
 * Creates a new room with the given options
 * @param {object} [roomOptions] Room options
 * @fires Lobby#room_open
 * @returns {Room}
 */
Lobby.prototype.createRoom = function(roomOptions) {

    // Prioritize options given over the default lobby options
    var options = {};

    // Copy local template options to the room config
    Object.keys(this.roomOptions).forEach(function(key) {
        options[key] = this.roomOptions[key];
    }, this);

    // Override and copy given room options to the room config
    Object.keys(roomOptions || {}).forEach(function(key) {
        options[key] = roomOptions[key];
    }, this);

    // Create the room
    var room = new Room(options);

    // Track the room in the collection
    this.rooms[room.id] = room;

    // Handle room events when they occur
    room.on('close', this._handleRoomClose.bind(this, room));
    room.on('open', this._handleRoomOpen.bind(this, room));
    room.once('end', this._handleRoomEnd.bind(this, room));

    // Tell the watchers the a room was provisioned
    this._handleRoomAdd(room);
    return room;
};


module.exports = Lobby;