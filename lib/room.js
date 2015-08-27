

var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Joi = require('joi'),
    shortid = require('shortid'),
    Member = require('./member');

//noinspection JSUnusedLocalSymbols
/**
 * Room
 * @extends {EventEmitter}
 *
 * @param [options]
 * @constructor
 */
function Room(options) {

    // Inherit from EventEmitter so we can emit events
    EventEmitter.call(this);


    //
    // Basic properties
    //

    /**
     * Name of the room
     * @type {String}
     */
    this.name = null;

    /**
     * Whether the room is open for new members to join
     * @type {boolean}
     */
    this.isOpen = true;

    //
    // Initialize configuration
    //

    var self = this;
    this._init(options);

    /**
     * The unique id of this room instance
     * @type {String}
     */
    this.id = shortid.generate();

    /**
     * The collection of active members, keyed on id
     * @type {{}}
     */
    this.members = {};

    //
    // Construct the other properties
    //

    //noinspection JSUnusedGlobalSymbols
    Object.defineProperties(this,
        /** @lends Room.prototype */
        {

            /**
             * List of all room members
             * @name Room#allMembers
             * @property {[Member]}
             */
            allMembers: {
                enumerable: true,
                get: function () {
                    var out = [];
                    Object.keys(self.members).forEach(function (id) {
                        out.push(self.members[id]);
                    });
                    return out;
                }
            }
        }
    );

}

util.inherits(Room, EventEmitter);

//noinspection JSUnresolvedFunction
/**
 * Room validation schemas
 * @type {{options: {name: *, softMemberCap: *, memberCap: *}}}
 */
Room.schema = {
    options: {

        id: Joi.any().strip(),
        members: Joi.any().strip(),
        allMembers: Joi.any().strip(),

        name: Joi.string().min(1).max(255).default('Lobby').optional(), // the name of the room
        softMemberCap: Joi.number().min(0).max(10).default(0).optional(), // the number of members to trigger a soft full event, 0 to disable
        memberCap: Joi.number().min(0).max(50).default(10) // the maximum number of members that may join a room
    }
};


/**
 * Initialize the Room
 * @param {{}} options – Configuration properties
 * @param {Function} [callback] – Optional callback when done initializing
 * @protected
 */
Room.prototype._init = function(options, callback) {
    var self = this;

    // Validate the options provided
    Joi.validate(options, Room.schema.options, { allowUnknown: true, stripUnknown: false }, function(err, options) {

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


//Room.prototype.addMember = function(member, callback) {
//    // TODO
//};
//
//
//Room.prototype.open = function() {
//    if (!this.isOpen) {
//        this.isOpen = true;
//        this.emit('open');
//    }
//    return this;
//};
//
//Room.prototype.close = function() {
//    if (this.isOpen) {
//        this.isOpen = false;
//        this.emit('close');
//    }
//    return this;
//};


module.exports = Room;