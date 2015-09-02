
var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Joi = require('joi'),
    shortid = require('shortid'),
    Room = require('./room');

/**
 * Member
 * @extends {EventEmitter}
 *
 * @param {{options: {name: string}}} [options] – Optional member configuration
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

    Member.counter++;
    this._init(options);


    /**
     * The unique id of this room instance
     * @type {String}
     */
    this.id = shortid.generate();

}

util.inherits(Member, EventEmitter);


/**
 * Incremented when members are initialized.
 * @type {number}
 */
Member.counter = 0;


//noinspection JSUnresolvedFunction
/**
 * Member validation schemas
 * @type {{options: {id: *, name: *}}}
 */
Member.schema = {
    options: {

        id: Joi.any().strip(),

        name: Joi.string().min(1).max(255).default(function(){ return 'Member ' + Member.counter; }, "generated member name").optional()
    }
};


/**
 * Initialize the Member
 * @param {{options: {id: *, name: *}}} options – Configuration properties
 * @private
 */
Member.prototype._init = function(options) {
    // Validate the options provided
    var result = Joi.validate(options || {}, Member.schema.options, { allowUnknown: true, stripUnknown: false });

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
};

exports = module.exports = Member;