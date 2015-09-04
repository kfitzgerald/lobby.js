var Room = require('../lib/room'),
    Member = require('../lib/member'),
    util = require('util'),
    should = require('should');

/** @typedef {should} Object.should */
/** @typedef {should.have} Object.have */
/** @typedef {should.ownProperty} Object.ownProperty */
/** @typedef {should.an} Object.an */
/** @typedef {should.be} Object.be */

describe('Room', function() {

    it('can simply exist', function() {

        var room = new Room();

        room.should.be.an.Object();
        room.id.should.be.a.String();
        room.name.should.be.a.String();
    });


    it('is unique', function() {

        var room1 = new Room(),
            room2 = new Room();

        room1.id.should.not.equal(room2.id);
        room1.name.should.not.equal(room2.name);
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

    it('can add members', function(done) {

        var room = new Room(),
            opened = false,
            joined = false,
            maybeDone = function() {
                if (opened && joined) {
                    process.nextTick(done);
                }
            };

        room.on('open', function() {
            room.isOpen.should.be.equal(true);
            opened.should.be.equal(false);

            room.members.should.not.be.empty();
            room.allMembers.length.should.be.equal(1);

            opened = true;
            maybeDone();
        });

        // Add the member
        var member = new Member();
        room.addMember(member);

        room.members.should.not.be.empty();
        room.allMembers.length.should.be.equal(1);

        room.on('member_add', function(joiner) {
            joiner.should.not.be.empty().and.instanceOf(Member);
            joiner.should.be.equal(member);
            joined.should.be.equal(false);

            opened.should.be.equal(true);
            room.members.should.not.be.empty();
            room.allMembers.length.should.be.equal(1);

            joined = true;
            maybeDone();
        });

    });

    it('rejects imposters', function() {

        var room = new Room();

        var err = room.addMember({});
        err.should.be.Error();

    });

    it('accepts extended members', function() {

        // Make an extended class on top of Member
        function Player(options) { Member.call(this, options); }
        util.inherits(Player, Member);


        var room = new Room(),
            player = new Player();

        var err = room.addMember(player);
        should(err).be.empty().and.not.be.Error();

        room.members[player.id].should.be.instanceOf(Member);
        room.members[player.id].should.be.instanceOf(Player);

    });

    // test properties: softMemberCap / memberCap / closeOnFull
    // test events: open / soft_full / full / member_add / close
    it('handles adding members until full properly', function(done) {

        var room = new Room({ softMemberCap: 2, memberCap: 4, closeOnFull: true }),
            opened = false,
            soft_capped = false,
            capped = false,
            closed = false,
            memberCount = 0,
            member1 = new Member(),
            member2 = new Member(),
            member3 = new Member(),
            member4 = new Member();

        room.on('open', function(){
            arguments.length.should.be.equal(0);
            room.isOpen.should.be.equal(true);
            opened.should.be.equal(false);
            closed.should.be.equal(false);
            capped.should.be.equal(false);
            soft_capped.should.be.equal(false);

            opened = true;

            // This should trigger the soft full event
            should(room.addMember(member1)).be.empty().and.not.Error();
            should(room.addMember(member2)).be.empty().and.not.Error();

            memberCount.should.be.equal(0); // delayed event hasn't updated this yet
            room.allMembers.length.should.be.equal(2);

        });

        room.on('soft_full', function() {
            arguments.length.should.be.equal(0);
            room.isOpen.should.be.equal(true);
            opened.should.be.equal(true);
            closed.should.be.equal(false);
            capped.should.be.equal(false);
            soft_capped.should.be.equal(false);

            soft_capped = true;

            memberCount.should.be.equal(2).and.be.equal(room.allMembers.length);


            // This should trigger the full event and subsequent close event
            should(room.addMember(member3)).be.empty().and.not.Error();
            should(room.addMember(member4)).be.empty().and.not.Error();

            memberCount.should.be.equal(2); // delayed event hasn't updated this yet
            room.allMembers.length.should.be.equal(4);

            // Should have immediately closed, but event hasn't fired yet
            closed.should.be.equal(false);
            room.isOpen.should.be.equal(false);
        });

        room.on('member_add', function(joiner) {
            joiner.should.not.be.empty().and.instanceOf(Member);
            arguments.length.should.be.equal(1);
            memberCount++;
            memberCount.should.be.lessThan(5);
        });

        room.on('full', function() {
            arguments.length.should.be.equal(0);

            opened.should.be.equal(true);
            closed.should.be.equal(false);
            capped.should.be.equal(false);
            soft_capped.should.be.equal(true);

            capped = true;

            room.allMembers.length.should.equal(4);
        });

        room.on('close', function() {
            arguments.length.should.be.equal(0);

            opened.should.be.equal(true);
            closed.should.be.equal(false);
            capped.should.be.equal(true);
            soft_capped.should.be.equal(true);

            closed = true;

            room.allMembers.length.should.equal(4);

            process.nextTick(done);
        });

    });

    // test property: endOnCloseAndEmpty
    // test events: soft_full / full / close / member_add / member_remove / end
    it('should handle endOnCloseAndEmpty properly', function(done) {
        var room = new Room({ softMemberCap: 2, memberCap: 4, closeOnFull: true, endOnCloseAndEmpty: true }),
            opened = false,
            soft_capped = false,
            capped = false,
            closed = false,
            ended = false,
            memberCount = 0,
            removedMemberCount = 0;

        /** @type {Member} */
        var member1 = new Member();

        /** @type {Member} */
        var member2 = new Member();

        /** @type {Member} */
        var member3 = new Member();

        /** @type {Member} */
        var member4 = new Member();

        room.on('open', function(){
            arguments.length.should.be.equal(0);
            room.isOpen.should.be.equal(true);
            opened.should.be.equal(false);
            closed.should.be.equal(false);
            capped.should.be.equal(false);
            soft_capped.should.be.equal(false);

            opened = true;

            // This should trigger the soft full event
            should(room.addMember(member1)).be.empty().and.not.Error();
            should(room.addMember(member2)).be.empty().and.not.Error();

            memberCount.should.be.equal(0); // delayed event hasn't updated this yet
            room.allMembers.length.should.be.equal(2);

        });

        room.on('soft_full', function() {
            arguments.length.should.be.equal(0);
            room.isOpen.should.be.equal(true);
            opened.should.be.equal(true);
            closed.should.be.equal(false);
            capped.should.be.equal(false);
            soft_capped.should.be.equal(false);

            soft_capped = true;

            memberCount.should.be.equal(2).and.be.equal(room.allMembers.length);


            // This should trigger the full event and subsequent close event
            should(room.addMember(member3)).be.empty().and.not.Error();
            should(room.addMember(member4)).be.empty().and.not.Error();

            memberCount.should.be.equal(2); // delayed event hasn't updated this yet
            room.allMembers.length.should.be.equal(4);

            // Should have immediately closed, but event hasn't fired yet
            closed.should.be.equal(false);
            room.isOpen.should.be.equal(false);
        });

        room.on('member_add', function(joiner) {
            joiner.should.not.be.empty().and.instanceOf(Member);
            arguments.length.should.be.equal(1);
            memberCount++;
            memberCount.should.be.lessThan(5);
        });

        room.on('full', function() {
            arguments.length.should.be.equal(0);

            opened.should.be.equal(true);
            closed.should.be.equal(false);
            capped.should.be.equal(false);
            soft_capped.should.be.equal(true);

            capped = true;

            room.allMembers.length.should.equal(4);
        });

        room.on('close', function() {
            arguments.length.should.be.equal(0);

            opened.should.be.equal(true);
            closed.should.be.equal(false);
            capped.should.be.equal(true);
            soft_capped.should.be.equal(true);
            ended.should.be.equal(false);

            closed = true;

            room.allMembers.length.should.equal(4);

            // Remove members pseudo-randomly
            room.removeMember(member1);
            room.removeMember(member2.id);

            process.nextTick(function() {

                room.removeMember(member3);

                process.nextTick(function() {
                    room.removeMember(member4);
                })
            })
        });

        room.on('member_remove', function(joiner) {
            joiner.should.not.be.empty().and.instanceOf(Member);
            arguments.length.should.be.equal(1);
            removedMemberCount++;
            removedMemberCount.should.be.lessThan(5);
        });

        room.on('end', function() {
            arguments.length.should.be.equal(0);

            opened.should.be.equal(true);
            closed.should.be.equal(true);
            capped.should.be.equal(true);
            soft_capped.should.be.equal(true);
            ended.should.be.equal(false);

            ended = true;
            removedMemberCount.should.be.equal(4);
            room.allMembers.length.should.be.equal(0);
            room.members.should.be.empty();

            process.nextTick(done);
        })
    });

    // test property: openWhenNotFull=true, softMemberCap=0
    // test events: soft_full / full / close / open / member_add / member_remove
    it('should reopen when not full', function(done) {
        var room = new Room({
                openWhenNotFull: true,
                closeOnFull: true,
                endOnCloseAndEmpty: false,
                softMemberCap: 0,
                memberCap: 2
            }),
            opened = false,
            softCapped = false,
            capped = false,
            closed = false,
            reopened = false,
            reclosed = false,
            openedCount = 0,
            closecCount = 0,
            fullCount = 0,
            addedMembers = 0,
            removedMembers = 0;

        /** @type {Member} */
        var member1 = new Member();

        /** @type {Member} */
        var member2 = new Member();

        room.on('open', function() {
            arguments.length.should.be.equal(0);
            openedCount++;

            if (openedCount == 1) {

                // First open
                opened.should.be.equal(false);
                softCapped.should.be.equal(false);
                capped.should.be.equal(false);
                closed.should.be.equal(false);
                reopened.should.be.equal(false);
                reclosed.should.be.equal(false);

                opened = true;

                room.allMembers.length.should.be.equal(0);

                // This should trigger the full event
                room.addMember(member1);
                room.addMember(member2);

            } else if (openedCount == 2) {
                // Reopen

                opened.should.be.equal(true);
                softCapped.should.be.equal(false);
                capped.should.be.equal(true);
                closed.should.be.equal(true);
                reopened.should.be.equal(false);
                reclosed.should.be.equal(false);

                reopened = true;

                room.allMembers.length.should.be.equal(1);

                // Rejoin member1
                room.addMember(member1);

            } else {
                throw new Error('Unexpected open event');
            }


        });

        room.on('soft_full', function() {
            throw new Error('Room should not have fired a soft full event');
        });

        room.on('full', function() {
            arguments.length.should.be.equal(0);
            fullCount++;

            if (fullCount == 1) {
                opened.should.be.equal(true);
                softCapped.should.be.equal(false);
                capped.should.be.equal(false);
                closed.should.be.equal(false);
                reopened.should.be.equal(false);
                reclosed.should.be.equal(false);

                capped = true;
            } else if (fullCount == 2) {
                opened.should.be.equal(true);
                softCapped.should.be.equal(false);
                capped.should.be.equal(true);
                closed.should.be.equal(true);
                reopened.should.be.equal(true);
                reclosed.should.be.equal(false);
                // (re)Close will fire next
            } else {
                throw new Error('Full event misfired');
            }

            room.allMembers.length.should.equal(2);
        });

        room.on('member_add', function(member) {
            member.should.be.instanceOf(Member);
            addedMembers++;

            if (!reopened) {
                addedMembers.should.be.lessThan(3).and.greaterThan(0);
            } else {
                addedMembers.should.be.equal(3);
            }

        });

        room.on('member_remove', function(member) {
            member.should.be.instanceOf(Member);
            removedMembers++;

            if (!reopened) {
                removedMembers.should.be.equal(1);
            } else {
                throw new Error('Nobody should have left after the test is over');
            }
        });

        room.on('close', function() {
            arguments.length.should.be.equal(0);
            closecCount++;

            if (closecCount == 1) {
                // Closed the first time

                opened.should.be.equal(true);
                softCapped.should.be.equal(false);
                capped.should.be.equal(true);
                closed.should.be.equal(false);
                reopened.should.be.equal(false);
                reclosed.should.be.equal(false);

                closed = true;

                room.allMembers.length.should.equal(2);

                // Remove one, to reopen
                room.removeMember(member1);
                room.members.should.not.have.ownProperty(member1.id);
                room.allMembers.length.should.equal(1);

            } else if (closecCount == 2) {
                // Reclosed

                opened.should.be.equal(true);
                softCapped.should.be.equal(false);
                capped.should.be.equal(true);
                closed.should.be.equal(true);
                reopened.should.be.equal(true);
                reclosed.should.be.equal(false);

                reclosed = true;

                room.allMembers.length.should.equal(2);

                process.nextTick(done);

            } else {
                throw new Error('Room should not have closed a third time');
            }
        });

        room.on('end', function() {
            throw new Error('Room should not have ended');
        });


    });


    it('should disallow members when full', function(done) {

        var room = new Room({ softMemberCap: 0, memberCap: 2 }),
            member1 = new Member(),
            member2 = new Member(),
            member3 = new Member(),
            opened = false,
            closed = false,
            memberCount = 0;

        room.on('open', function() {
            arguments.length.should.be.equal(0);

            opened.should.be.equal(false);
            closed.should.be.equal(false);

            opened = true;

            var res = room.addMember(member1);
            should(res).be.empty();

            res = room.addMember(member2);
            should(res).be.empty();

            room.allMembers.length.should.be.equal(2);

            // close

            res = room.addMember(member3);
            should(res).be.Error(); // Error('Room is full.');

            room.allMembers.length.should.be.equal(2);

            // Close event should fire after we're through here
            closed.should.be.equal(false);

        });

        room.on('close', function() {
            opened.should.be.equal(true);
            closed.should.be.equal(false);

            closed = true;

            room.allMembers.length.should.be.equal(2);

            process.nextTick(done);

        });

        room.on('member_add', function(member) {
            arguments.length.should.be.equal(1);
            member.should.be.instanceOf(Member);
            memberCount++;

            opened.should.be.equal(true);
            closed.should.be.equal(false);

            memberCount.should.be.lessThan(3);
        });

    });


    it('should disallow members when closed', function(done) {

        var room = new Room({ softMemberCap: 0, memberCap: 2 }),
            member1 = new Member(),
            member2 = new Member(),
            opened = false,
            closed = false,
            memberCount = 0;

        room.on('open', function() {
            arguments.length.should.be.equal(0);

            opened.should.be.equal(false);
            closed.should.be.equal(false);

            opened = true;

            var res = room.addMember(member1);
            should(res).be.empty();

            room.allMembers.length.should.be.equal(1);

            // close
            room.close();

            // Close event should fire after we're through here
            closed.should.be.equal(false);

        });

        room.on('close', function() {
            opened.should.be.equal(true);
            closed.should.be.equal(false);

            closed = true;

            room.allMembers.length.should.be.equal(1);

            // Now try adding a member, when closed, should fail

            var res = room.addMember(member2);
            should(res).be.Error(); // Error('Room is closed.');

            room.allMembers.length.should.be.equal(1);

            process.nextTick(done);

        });

        room.on('member_add', function(member) {
            arguments.length.should.be.equal(1);
            member.should.be.instanceOf(Member);
            memberCount++;

            opened.should.be.equal(true);
            closed.should.be.equal(false);

            memberCount.should.be.lessThan(2);
        });

    });


    it('should disallow duplicate members', function(done) {

        var room = new Room({ softMemberCap: 0, memberCap: 2 }),
            member1 = new Member(),
            opened = false,
            closed = false,
            memberCount = 0;

        room.on('open', function() {
            arguments.length.should.be.equal(0);

            opened.should.be.equal(false);
            closed.should.be.equal(false);

            opened = true;

            var res = room.addMember(member1);
            should(res).be.empty();

            room.allMembers.length.should.be.equal(1);

            // Add duplicate member
            res = room.addMember(member1);
            should(res).be.Error(); // Error('Member is already present in this room instance.');

            room.allMembers.length.should.be.equal(1);

            process.nextTick(done);

        });

        room.on('member_add', function(member) {
            arguments.length.should.be.equal(1);
            member.should.be.instanceOf(Member);
            memberCount++;

            opened.should.be.equal(true);
            closed.should.be.equal(false);

            memberCount.should.be.lessThan(2);
        });
    });

    it('should disallow removing non-member', function(done) {

        var room = new Room({ softMemberCap: 0, memberCap: 2 }),
            member1 = new Member(),
            member2 = new Member(),
            opened = false,
            closed = false,
            memberCount = 0;

        room.on('open', function() {
            arguments.length.should.be.equal(0);

            opened.should.be.equal(false);
            closed.should.be.equal(false);

            opened = true;

            var res = room.addMember(member1);
            should(res).be.empty();

            room.allMembers.length.should.be.equal(1);

            // Add duplicate member
            res = room.removeMember(member2);
            should(res).be.Error(); // Error('Member is not present in this room instance.');

            room.allMembers.length.should.be.equal(1);

            process.nextTick(done);

        });

        room.on('member_add', function(member) {
            arguments.length.should.be.equal(1);
            member.should.be.instanceOf(Member);
            memberCount++;

            opened.should.be.equal(true);
            closed.should.be.equal(false);

            memberCount.should.be.lessThan(2);
        });

        room.on('member_remove', function() {
            throw new Error('No member should have been removed')
        });
    });

    it('should only be able to remove a member by object or id', function(done){
        //return new Error('Member parameter must be an instance of Member or String (id).');

        var room = new Room({ softMemberCap: 0, memberCap: 2 }),
            member1 = new Member(),
            member2 = new Member(),
            opened = false,
            closed = false,
            memberCount = 0,
            removedCount = 0;

        room.on('open', function() {
            arguments.length.should.be.equal(0);

            opened.should.be.equal(false);
            closed.should.be.equal(false);

            opened = true;

            var res = room.addMember(member1);
            should(res).be.empty();

            member1.rooms.should.hasOwnProperty(room.id);
            room.allMembers.length.should.be.equal(1);

            res = room.addMember(member2);
            should(res).be.empty();

            member2.rooms.should.hasOwnProperty(room.id);
            room.allMembers.length.should.be.equal(2);

            // Add duplicate member
            // Error('Member parameter must be an instance of Member or String (id).');
            res = room.removeMember({}); should(res).be.Error();
            res = room.removeMember(null); should(res).be.Error();
            res = room.removeMember(undefined); should(res).be.Error();
            res = room.removeMember(false); should(res).be.Error();
            res = room.removeMember(true); should(res).be.Error();
            res = room.removeMember([]); should(res).be.Error();
            res = room.removeMember(42); should(res).be.Error();
            res = room.removeMember(function(){}); should(res).be.Error();

            room.allMembers.length.should.be.equal(2);


            // These should work
            res = room.removeMember(member1); should(res).be.empty();
            member1.rooms.should.not.hasOwnProperty(room.id);
            room.allMembers.length.should.be.equal(1);

            res = room.removeMember(member2.id); should(res).be.empty();
            member2.rooms.should.not.hasOwnProperty(room.id);
            room.allMembers.length.should.be.equal(0);

            process.nextTick(done);

        });

        room.on('member_add', function(member) {
            arguments.length.should.be.equal(1);
            member.should.be.instanceOf(Member);
            memberCount++;

            opened.should.be.equal(true);
            closed.should.be.equal(false);

            memberCount.should.be.lessThan(3);
        });

        room.on('member_remove', function(member) {
            arguments.length.should.be.equal(1);
            member.should.be.instanceOf(Member);
            removedCount++;

            removedCount.should.be.lessThan(3);
        });

    });

});