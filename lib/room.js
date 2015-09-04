
var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    Joi = require('joi'),
    shortid = require('shortid'),
    Member = require('./member');

/**
 * @event Room#open
 * @type {null}
 */

/**
 * @event Room#close
 * @type {null}
 */

/**
 * @event Room#end
 * @type {null}
 */

/**
 * @event Room#soft_full
 * @type {null}
 */

/**
 * @event Room#full
 * @type {null}
 */

/**
 * @event Room#member_add
 * @type {Member}
 */

/**
 * @event Room#member_remove
 * @type {Member}
 */


/**
 * Room
 * @extends {EventEmitter}
 *
 * @param {{options: {name: string, softMemberCap: number, memberCap: number, isOpen: boolean, closeOnFull: boolean, endOnCloseAndEmpty: boolean, openWhenNotFull: boolean}}} [options] – Configuration options
 *
 * @fires Room#open
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
     * When a member joins the room, this is the threshold that will trigger a soft_full event. Set to `0` to disable.
     * @type {Number}
     */
    this.softMemberCap = null;


    /**
     * The threshold number of members to trigger a close
     * @type {Number}
     */
    this.memberCap = null;


    /**
     * Whether the room is open for new members to join
     * @type {boolean}
     */
    this.isOpen = true;


    /**
     * Automatically close the room when the member cap is reached
     * @type {boolean}
     */
    this.closeOnFull = true;


    /**
     * Automatically end the room when the room is cosed and the last member is removed
     * @type {boolean}
     */
    this.endOnCloseAndEmpty = true;


    /**
     * Automatically re-open the room when no longer full
     * @type {boolean}
     */
    this.openWhenNotFull = false;


    /**
     * Whether the room has ended and should be abandoned / GC'd
     * @type {boolean}
     * @private
     */
    this._hasEnded = false;


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

    // Force-fire an open event if we're initializing as an open room
    if (this.isOpen) {
        this.isOpen = false;
        this.open()
    }

    // Note: Just assume that rooms start closed, so there is no need to fire a
    //       closed event, since it should just start that way.
}

util.inherits(Room, EventEmitter);


/**
 * Incremented when rooms are initialized.
 * @type {number}
 */
Room.counter = 0;


//noinspection JSUnresolvedFunction
/**
 * Room validation schemas
 * @type {{options: {id: *, members: *, allMembers: *, name: *, softMemberCap: *, memberCap: *, isOpen: *, closeOnFull: *, endOnCloseAndEmpty: *, openWhenNotFull: *}}}
 */
Room.schema = {
    options: {

        id: Joi.any().strip(),
        members: Joi.any().strip(),
        allMembers: Joi.any().strip(),

        name: Joi.string().min(1).max(255).allow(null).default(null).optional(), // the name of the room
        softMemberCap: Joi.number().min(0).max(10).default(0).optional(), // the number of members to trigger a soft full event, 0 to disable
        memberCap: Joi.number().min(0).max(50).default(10), // the maximum number of members that may join a room
        isOpen: Joi.boolean().default(true), // whether the room should be opened when initialized
        closeOnFull: Joi.boolean().default(true), // whether to automatically close the room when the member cap is reached
        endOnCloseAndEmpty: Joi.boolean().default(true), // whether to automatically end the room when closed and there are no more members
        openWhenNotFull: Joi.boolean().default(false) // whether to automatically open the room when closed and a member leaves
    }
};


/**
 * Initialize the Room
 * @param {{options: {id: *, members: *, allMembers: *, name: *, softMemberCap: *, memberCap: *, isOpen: *, closeOnFull: *, endOnCloseAndEmpty: *, openWhenNotFull: *}}} options – Configuration properties
 * @protected
 */
Room.prototype._init = function(options) {


    // Validate the options provided
    var result = Joi.validate(options || {}, Room.schema.options, { allowUnknown: true, stripUnknown: false });

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
        this.name = 'Room ' + (Room.counter++);
    }
};


/**
 * Opens the room, allowing members to join
 *
 * @fires Room#open
 *
 * @returns {Room}
 */
Room.prototype.open = function() {
    if (!this._hasEnded && !this.isOpen) {
        this.isOpen = true;
        process.nextTick(this.emit.bind(this, 'open'));
    }
    return this;
};


/**
 * Closes the room, preventing members from joining
 *
 * @fires Room#close
 *
 * @returns {Room}
 */
Room.prototype.close = function() {
    if (!this._hasEnded && this.isOpen) {
        this.isOpen = false;
        process.nextTick(this.emit.bind(this, 'close'));
    }
    return this;
};


/**
 * Ends the room, which is basically killing it
 *
 *
 * @fires Room#member_remove
 * @fires Room#end
 *
 * @returns {Room}
 */
Room.prototype.end = function() {
    if (!this._hasEnded) {
        this._hasEnded = true;

        // Remove any members still present prior to ending the room
        var members = this.allMembers, i = 0;
        for( ; i < members.length; i++) {
            this.removeMember(members[i]);
        }

        process.nextTick(this.emit.bind(this, 'end'));
    }
    return this;
};


/**
 * Adds a member to the room, if possible.
 * @param {Member} member – The member instance to add to the room
 *
 * @fires Room#member_add
 * @fires Room#soft_full
 * @fires Room#full
 *
 * @returns {Error|null} – Returns an Error object if the member could not be added, or null if the member was added.
 */
Room.prototype.addMember = function(member) {

    // Verify that we have a member object
    if (member instanceof Member) {

        // Verify the member is not already in the room
        if (!this.members.hasOwnProperty(member.id)) {

            // Verify the room is able to accept new members
            if (this.isOpen) {

                // Verify the room is not full
                if (this.memberCap == 0 || (this.allMembers.length + 1) <= this.memberCap) {

                    // Add the member to the pool
                    this.members[member.id] = member;

                    // Add the room to the member
                    member.rooms[this.id] = this;

                    // Notify watchers of the new member
                    process.nextTick(this.emit.bind(this, 'member_add', member));

                    // Notify watchers on the member
                    process.nextTick(member.emit.bind(member, 'room_join', this));

                    // Notify if the soft cap was met
                    if (this.softMemberCap > 0 && (this.allMembers.length) == this.softMemberCap) {
                        process.nextTick(this.emit.bind(this, 'soft_full'));
                    }

                    // Notify if the cap was met
                    if (this.memberCap > 0 && (this.allMembers.length) == this.memberCap) {

                        // Notify that the room is now full
                        process.nextTick(this.emit.bind(this, 'full'));

                        // Check if the room should close when the member cap is reached
                        if (this.closeOnFull) {
                            this.close();
                        }
                    }

                    // Done
                    return null;

                } else {
                    return new Error('Room is full.');
                }
            } else {
                return new Error('Room is closed.');
            }
        } else {
            return new Error('Member is already present in this room instance.');
        }
    } else {
        return new Error('Member parameter must be an instance of Member.');
    }

};


/**
 * Removes a member from the room
 * @param {(Member|string)} member – The member or string ID of the member to remove from the room
 *
 * @fires Room#member_remove
 * @fires Room#open
 * @fires Room#end
 *
 * @returns {Error|null} – Returns an Error object if the member was unable to be removed, or null if it was removed
 */
Room.prototype.removeMember = function(member) {

    // Verify that we have a member object
    if (member instanceof Member || typeof member === "string") {

        // Get the ID of the member we need to remove
        var id = (member instanceof Member) ? member.id : member;

        // Verify the member is in the room
        if (this.members.hasOwnProperty(id)) {

            // Remove the member from the pool
            member = this.members[id];
            delete this.members[id];

            // Remove the room from the member
            if (member.rooms.hasOwnProperty(this.id)) {
                delete member.rooms[this.id];
            }

            // Notify watchers of the new member
            process.nextTick(this.emit.bind(this, 'member_remove', member));

            // Notify watchers on the member
            process.nextTick(member.emit.bind(member, 'room_leave', this));

            // Check if room should reopen automatically
            if (!this.isOpen && this.openWhenNotFull && (this.allMembers.length) < this.memberCap) {
                this.open();
            }

            // Check if room should end when closed and empty
            if (this.endOnCloseAndEmpty && !this.isOpen && this.allMembers.length === 0) {
                this.end();
            }

            // Done
            return null;

        } else {
            return new Error('Member is not present in this room instance.');
        }
    } else {
        return new Error('Member parameter must be an instance of Member or String (id).');
    }

};


module.exports = Room;