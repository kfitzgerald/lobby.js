
var Lobby = require('../lib/lobby'),
    Room = require('../lib/room');

describe('Lobby', function() {

    it('can simply exist', function() {
        var lobby = new Lobby();

        lobby.should.be.an.Object();
        lobby.id.should.be.a.String();
        lobby.rooms.should.be.an.Array();
        lobby.rooms.should.be.empty();
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


    it('cannot have a terrible name', function(done) {

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

        var name = "Unit Test",
            lobby = new Lobby({name: name});


        lobby.on('error', function(err) {
            // Error expected.
            err.should.be.an.Error();
            lobby.name.should.equal(name);
            done();
        });

        // Try renaming to something bad
        lobby.name = { nope: true };

        lobby.name.should.equal(name);

    });


    it('has immutable rooms', function() {

        var lobby = new Lobby();
        var rooms = lobby.rooms,
            mute = ['lol'];

        rooms.should.be.an.Array();
        rooms.should.be.empty();

        mute.should.be.an.Array();
        mute.should.not.be.empty();


        mute.should.not.equal(rooms);

        // Attempt to obliterate it
        lobby.rooms = mute;

        // Make sure it's still the same ol' rooms
        lobby.rooms.should.not.equal(mute).and.be.empty();

        // Attempt to put our own poop in the pile
        lobby.rooms.push('nope');

        lobby.rooms.should.be.empty();

    });

    it('fires open events when constructed', function(done) {

        var lobby = new Lobby({
                minOpenRooms: 3,
                maxRooms: 10
            }),
            count = 3;

        lobby.on('room_opened', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);
            count--;
            if (count == 0) {
                process.nextTick(done);
            } else if (count < 0) {
                throw new Error('Too many rooms opened');
            }
        });

    });

    it('fires open events when constructed', function(done) {

        var lobby = new Lobby({
                minOpenRooms: 3,
                maxRooms: 10
            }),
            count = 3;

        lobby.on('room_opened', function(room) {
            room.should.not.be.empty().and.instanceOf(Room);
            count--;
            if (count == 0) {
                process.nextTick(done);
            } else if (count < 0) {
                throw new Error('Too many rooms opened');
            }
        });

    });



});