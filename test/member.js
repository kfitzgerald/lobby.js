
var Member = require('../lib/member');

describe('Member', function() {

    it('can simply exist', function() {

        var member = new Member();

        member.should.be.an.Object();
        member.id.should.be.a.String();
        member.rooms.should.be.an.Array();
        member.rooms.should.be.empty();
    });


    it('is unique', function() {

        var member1 = new Member(),
            member2 = new Member();

        member1.id.should.not.equal(member2.id);
    });


    it('can take a proper name', function() {

        var name = 'Unit Test',
            member = new Member({
                name: name
            });

        member.name.should.equal(name);
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
            member = new Member(opts);

        member.should.have.ownProperty('obj').and.be.an.Object().and.ownProperty('unit').is.equal(opts.obj.unit);
        member.should.have.ownProperty('num').and.be.a.Number().and.is.equal(opts.num);
        member.should.have.ownProperty('str').and.be.a.String().and.is.equal(opts.str);
        member.should.have.ownProperty('array').and.be.an.Array().and.is.deepEqual(opts.array);
        member.should.have.ownProperty('undef').and.be.undefined();
        member.should.have.ownProperty('nope').and.be.null();
        member.should.have.ownProperty('deep').and.be.an.Object().and.is.deepEqual(opts.deep);
        member.should.have.ownProperty('func').and.be.a.Function();
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
                new Member({ name: badThings[i] });
            } catch (e) {
                e.should.be.an.Error();
            }
        }

    });


});