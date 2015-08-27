
var Lobby = require('../lib/lobby'),
    Room = require('../lib/room');

describe('Lobby', function() {

    it('can simply exist', function() {
        var lobby = new Lobby();

        lobby.should.be.an.Object();
        lobby.id.should.be.a.String();
        lobby.rooms.should.be.an.Object();
        lobby.allRooms.should.be.an.Array();
        lobby.allRooms.should.be.empty();
    });


    it('is unique', function() {

        var lobby1 = new Lobby(),
            lobby2 = new Lobby();

        lobby1.id.should.not.equal(lobby2.id);
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


    it('no rooms opened when there min rooms is disabled', function(done) {

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



});