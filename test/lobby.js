
var Lobby = require('../lib/lobby'),
    Room = require('../lib/room');

describe('Lobby', function() {

    it('can simply exist', function() {
        var lobby = new Lobby();

        lobby.should.be.an.Object();
        lobby.id.should.be.a.String();
        lobby.name.should.be.a.String();
        lobby.rooms.should.be.an.Object();
        lobby.allRooms.should.be.an.Array();
        lobby.allRooms.should.be.empty();
    });


    it('is unique', function() {

        var lobby1 = new Lobby(),
            lobby2 = new Lobby();

        lobby1.id.should.not.equal(lobby2.id);
        lobby1.name.should.not.equal(lobby2.name);
    });


    it('can take a proper name', function() {

        var name = 'Unit Test',
            lobby = new Lobby({
                name: name
            });

        lobby.name.should.equal(name);

        // Try renaming
        name = 'Unit Test Rename';
        lobby.name = name;
        lobby.name.should.equal(name);
    });

    it('can take arbitrary options', function() {

        var opts = {
                obj: { unit: 'test'},
                num: 42,
                str: "rosalia",
                array: ['n','o','m'],
                undef: undefined,
                nope: null,
                deep: {
                    stuff: {
                        $in: {
                            things: true
                        }
                    }
                },
                func: function() {
                    return "hello world";
                }
            },
            lobby = new Lobby(opts);

        lobby.should.have.ownProperty('obj').and.be.an.Object().and.ownProperty('unit').is.equal(opts.obj.unit);
        lobby.should.have.ownProperty('num').and.be.a.Number().and.is.equal(opts.num);
        lobby.should.have.ownProperty('str').and.be.a.String().and.is.equal(opts.str);
        lobby.should.have.ownProperty('array').and.be.an.Array().and.is.deepEqual(opts.array);
        lobby.should.have.ownProperty('undef').and.be.undefined();
        lobby.should.have.ownProperty('nope').and.be.null();
        lobby.should.have.ownProperty('deep').and.be.an.Object().and.is.deepEqual(opts.deep);
        lobby.should.have.ownProperty('func').and.be.a.Function();
    });


    it('cannot have a terrible name', function() {

        var badThings = [
                { cannot: 'be an object'},
                42,
                null,
                undefined,
                "",
                [],
                function() {},
                false
            ],
            i = 0;

        for( ; i < badThings.length; i++) {
            try {
                new Lobby({ name: badThings[i] });
            } catch (e) {
                e.should.be.an.Error();
            }
        }

    });

    it('cannot clobber internals', function() {
        var lobby = new Lobby({
            id: 42,
            rooms: "nope",
            allRooms: "nope",
            openRooms: "nope",
            closedRooms: "nope"
        });

        lobby.id.should.be.a.String();
        lobby.rooms.should.not.be.a.String();
        lobby.allRooms.should.not.be.a.String();
        lobby.openRooms.should.not.be.a.String();
        lobby.closedRooms.should.not.be.a.String();
    });

    it('fires open events when constructed', function(done) {

        var lobby = new Lobby({
                minOpenRooms: 3,
                maxRooms: 10
            }),
            count = 3;

        lobby.on('room_open', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);
            count--;
            if (count == 0) {
                process.nextTick(done);
            } else if (count < 0) {
                throw new Error('Too many rooms opened');
            }
        });

    });

    it('fires open events when max rooms is smaller than min open', function(done) {

        var lobby = new Lobby({
                minOpenRooms: 3,
                maxRooms: 2
            }),
            count = 2;

        lobby.on('room_open', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);
            count--;
            if (count == 0) {
                process.nextTick(done);
            } else if (count < 0) {
                throw new Error('Too many rooms opened');
            }
        });

    });


    it('fires open events when max rooms is equal to min open', function(done) {

        var lobby = new Lobby({
                minOpenRooms: 2,
                maxRooms: 2
            }),
            count = 2;

        lobby.on('room_open', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);
            count--;
            if (count == 0) {
                process.nextTick(done);
            } else if (count < 0) {
                throw new Error('Too many rooms opened');
            }
        });

    });


    it('fires open events when there is no max', function(done) {

        var lobby = new Lobby({
                minOpenRooms: 20,
                maxRooms: 0
            }),
            count = 20;

        lobby.on('room_open', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);
            count--;
            if (count == 0) {
                process.nextTick(done);
            } else if (count < 0) {
                throw new Error('Too many rooms opened');
            }
        });

    });


    it('no rooms opened when min rooms is disabled', function(done) {

        var lobby = new Lobby({
            minOpenRooms: 0,
            maxRooms: 0
        });

        lobby.on('room_open', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);
            throw new Error('Too many rooms opened');
        });

        setTimeout(done, 10);

    });


    it('can manually over-allocate rooms', function(done) {

        var lobby = new Lobby({
                minOpenRooms: 3,
                maxRooms: 3
            }),
            target = 3,
            count = 0;

        lobby.on('room_open', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);
            count++;
            if (count == target) {
                var room2 = lobby.createRoom();
                room2.should.not.be.empty().and.instanceOf(Room);
            } else if (count == (target + 1)) {
                process.nextTick(done);
            } else if (count > (target + 1)) {
                throw new Error('Too many rooms opened');
            }
        });

    });


    it('will auto-fill when rooms close', function(done) {

        var lobby = new Lobby({
                minOpenRooms: 1,
                maxRooms: 10
            }),
            target = 10,
            count = 0;

        lobby.on('room_open', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);
            count++;

            // Close the newly opened room manually
            room.close();

            if (count == target) {
                process.nextTick(done);
            } else if (count > target) {
                throw new Error('Too many rooms opened');
            }

        });

    });

    it('will emit room open and close events properly', function(done) {

        var lobby = new Lobby({
                minOpenRooms: 1,
                maxRooms: 3
            }),
            count = 0,
            closeCount = 0;

        //                              (open,closed) / max
        // It will auto fill a room     (1,0) / 3
        // Close it, will get new room  (1,1) / 3
        // Open it again                (2,0) / 3
        // Close both rooms, get new    (1,3) / 3

        lobby.on('room_open', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);
            count++;

            if (count == 1) {
                // Auto-fill, close that room
                lobby.allRooms.length.should.equal(1);
                room.close();
            } else if (count == 2) {
                lobby.allRooms.length.should.equal(2);
                lobby.openRooms.length.should.equal(1);
                lobby.closedRooms.length.should.equal(1);
                // Open the closed room
                lobby.closedRooms[0].open();
            } else if (count == 3) {
                lobby.allRooms.length.should.equal(2);
                lobby.openRooms.length.should.equal(2);
                lobby.closedRooms.length.should.equal(0);
                // Close both
                var rooms = lobby.openRooms; // Since this is a live list, snapshot it instead of iterating directly
                rooms[0].close();
                rooms[1].close();
            } else if (count == 4) {
                // Done!
                lobby.allRooms.length.should.equal(3);
                lobby.openRooms.length.should.equal(1);
                lobby.closedRooms.length.should.equal(2);

                // To avoid concurrency issues, wait a tick and check the count
                process.nextTick(function() {
                    if (closeCount == 3) {
                        done();
                    } else {
                        throw new Error('room_close was not emitted enough times');
                    }
                });

            } else {
                throw new Error('Too many rooms opened');
            }
        });

        lobby.on('room_close', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);
            closeCount++;
        });

    });

    it('will handle room end events', function(done) {

        var lobby = new Lobby({ minOpenRooms: 0, maxRooms: 0 }),
            hasOpened = false,
            hasClosed = false,
            hasEnded = false;

        lobby.on('room_open', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);

            hasOpened.should.equal(false);
            hasClosed.should.equal(false);
            hasEnded.should.equal(false);

            hasOpened = true;

            lobby.allRooms.length.should.equal(1);
            lobby.openRooms.length.should.equal(1);
            lobby.closedRooms.length.should.equal(0);

            // Close it
            room.close().should.not.be.empty().and.instanceOf(Room);
        });

        lobby.on('room_close', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);

            hasOpened.should.equal(true);
            hasClosed.should.equal(false);
            hasEnded.should.equal(false);

            hasClosed = true;

            lobby.allRooms.length.should.equal(1);
            lobby.openRooms.length.should.equal(0);
            lobby.closedRooms.length.should.equal(1);

            // End it
            room.end().should.not.be.empty().and.instanceOf(Room);
        });

        lobby.on('room_end', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);

            hasOpened.should.equal(true);
            hasClosed.should.equal(true);
            hasEnded.should.equal(false);

            hasEnded = true;

            lobby.allRooms.length.should.equal(0);
            lobby.openRooms.length.should.equal(0);
            lobby.closedRooms.length.should.equal(0);

            process.nextTick(done);
        });

        // Open a room
        lobby.createRoom();

    });

    it('will pass room options correctly', function(done) {

        var lobby = new Lobby({
            minOpenRooms: 1,
            maxRooms: 1,
            roomOptions: {
                name: "Unit Test Room Name",
                softMemberCap: 1,
                memberCap: 2,
                isOpen: false,
                closeOnFull: false,
                endOnCloseAndEmpty: false,
                openWhenNotFull: true
            }
        });

        lobby.on('room_open', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);
            throw new Error('Room should not have opened');
        });

        lobby.on('room_close', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);
            throw new Error('Room should not have closed');
        });

        lobby.on('room_end', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);
            throw new Error('Room should not have ended');
        });

        lobby.on('room_add', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);

            room.name.should.equal(lobby.roomOptions.name);
            room.softMemberCap.should.equal(lobby.roomOptions.softMemberCap);
            room.memberCap.should.equal(lobby.roomOptions.memberCap);
            room.isOpen.should.equal(lobby.roomOptions.isOpen);
            room.closeOnFull.should.equal(lobby.roomOptions.closeOnFull);
            room.endOnCloseAndEmpty.should.equal(lobby.roomOptions.endOnCloseAndEmpty);
            room.openWhenNotFull.should.equal(lobby.roomOptions.openWhenNotFull);

            process.nextTick(done);
        });

    });

    it('will pass room options with overrides correctly', function(done) {

        var lobby = new Lobby({
                minOpenRooms: 0,
                maxRooms: 1,
                roomOptions: {
                    name: "Unit Test Room Name",
                    softMemberCap: 1,
                    memberCap: 2,
                    isOpen: false,
                    closeOnFull: false,
                    endOnCloseAndEmpty: false,
                    openWhenNotFull: true
                }
            }),
            addedCount = 0,
            openedCount = 0;

        lobby.on('room_open', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);
            openedCount++;

            addedCount.should.equal(1);
            openedCount.should.equal(1);

            process.nextTick(done);
        });

        lobby.on('room_close', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);
            throw new Error('Room should not have closed');
        });

        lobby.on('room_end', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);
            throw new Error('Room should not have ended');
        });

        lobby.on('room_add', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);
            addedCount++;

            addedCount.should.equal(1);
            openedCount.should.equal(0);

            room.name.should.equal(overrideOptions.name);
            room.softMemberCap.should.equal(overrideOptions.softMemberCap);
            room.memberCap.should.equal(overrideOptions.memberCap);
            room.isOpen.should.equal(overrideOptions.isOpen);
            room.closeOnFull.should.equal(overrideOptions.closeOnFull);
            room.endOnCloseAndEmpty.should.equal(overrideOptions.endOnCloseAndEmpty);
            room.openWhenNotFull.should.equal(overrideOptions.openWhenNotFull);

        });

        var overrideOptions = {
            name: "Unit Test Room Name Override",
            softMemberCap: 2,
            memberCap: 3,
            isOpen: true,
            closeOnFull: true,
            endOnCloseAndEmpty: true,
            openWhenNotFull: false
        };

        lobby.createRoom(overrideOptions);

    });


});