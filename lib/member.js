
var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Joi = require('joi'),
    shortid = require('shortid'),
    Room = require('./room');

//noinspection JSUnusedLocalSymbols
/**
 * Member
 * @extends {EventEmitter}
 *
 * @param [options]
 * @constructor
 */
function Member(options) {

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

    //
    // Initialize configuration
    //

    this._init(options);


    /**
     * The unique id of this room instance
     * @type {String}
     */
    this.id = shortid.generate();

}

util.inherits(Member, EventEmitter);

//noinspection JSUnresolvedFunction
/**
 * Member validation schemas
 * @type {{options: {name: *}}}
 */
Member.schema = {
    options: {

        id: Joi.any().strip(),

        name: Joi.string().min(1).max(255).default('Player').optional()
    }
};


/**
 * Initialize the Member
 * @param {{}} options – Configuration properties
 * @param {Function} [callback] – Optional callback when done initializing
 * @private
 */
Member.prototype._init = function(options, callback) {
    var self = this;

    // Validate the options provided
    Joi.validate(options, Member.schema.options, { allowUnknown: true, stripUnknown: false }, function(err, options) {

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


//Member.prototype.joinRoom = function(room, callback) {
//
//    if (!(room instanceof Room)) {
//        callback && callback(new Error("Member cannot join: Room "));
//    } else {
//        // TODO - JOIN ROOM
//        this.emit('join_room', room)
//    }
//};

module.exports = Member;