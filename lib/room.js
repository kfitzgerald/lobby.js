

var EventEmitter = require('events').EventEmitter,
    util = require('util');

//noinspection JSUnusedLocalSymbols
function Room(options) {
    EventEmitter.call(this);

    // Room internals
    var _members = {},
        _isOpen = true;

    Object.defineProperties(this, {
        members: {
            enumerable: true,
            get: function () {
                var out = [];
                Object.keys(_members).forEach(function (id) {
                    out.push(_members[id]);
                });
                return out;
            }
        },

        isOpen: {
            enumerable: true,
            get: function () {
                return _isOpen;
            }
        }
    });

}

util.inherits(Room, EventEmitter);


var proto = Room.prototype;

proto._init = function(options) {

};


proto.addMember = function(member, callback) {
    // Validate
    //
};


proto.close = function(callback) {

};


module.exports = Room;