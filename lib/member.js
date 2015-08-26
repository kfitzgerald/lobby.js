
var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Joi = require('joi'),
    shortid = require('shortid'),
    Room = require('./room');

function Member(options) {
    EventEmitter.call(this);

    this._init(options || {});

    // Container for the room(s) this member is in
    this.id = shortid.generate();

    // Internals
    var _rooms = {};

    // Construct the properties
    Object.defineProperties(this, {
        rooms: {
            enumerable: true,
            get: function () {
                var out = [];
                Object.keys(_rooms).forEach(function (id) {
                    out.push(_rooms[id]);
                });
                return out;
            }
        }
    });
}

util.inherits(Member, EventEmitter);


Member.schema = {
    options: {
        name: Joi.string().min(1).max(255).default('Player').optional()
    }
};

var proto = Member.prototype;

proto._init = function(options) {

    var self = this;

    Joi.validate(options, Member.schema.options, { allowUnknown: true, stripUnknown: false }, function(err, options) {

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

proto.join = function(room, callback) {

    if (!(room instanceof Room)) {
        callback && callback(new Error("Member cannot join: Room "));
    } else {
        // TODO - JOIN ROOM
        this.emit('room_join', room)
    }
};

module.exports = Member;