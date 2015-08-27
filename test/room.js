
var Room = require('../lib/room');

describe('Room', function() {

    it('can simply exist', function() {

        var room = new Room();

        room.should.be.an.Object();
        room.id.should.be.a.String();
    });


    it('is unique', function() {

        var room1 = new Room(),
            room2 = new Room();

        room1.id.should.not.equal(room2.id);
    });


    it('can take a proper name', function() {

        var name = 'Unit Test',
            room = new Room({
                name: name
            });

        room.name.should.equal(name);
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
            room = new Room(opts);

        room.should.have.ownProperty('obj').and.be.an.Object().and.ownProperty('unit').is.equal(opts.obj.unit);
        room.should.have.ownProperty('num').and.be.a.Number().and.is.equal(opts.num);
        room.should.have.ownProperty('str').and.be.a.String().and.is.equal(opts.str);
        room.should.have.ownProperty('array').and.be.an.Array().and.is.deepEqual(opts.array);
        room.should.have.ownProperty('undef').and.be.undefined();
        room.should.have.ownProperty('nope').and.be.null();
        room.should.have.ownProperty('deep').and.be.an.Object().and.is.deepEqual(opts.deep);
        room.should.have.ownProperty('func').and.be.a.Function();
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
                new Room({ name: badThings[i] });
            } catch (e) {
                e.should.be.an.Error();
            }
        }

    });


});