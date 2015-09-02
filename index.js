/**
 *
 * @type {{Lobby: Lobby, Member: Member, Room: Room}}
 */
module.exports = {
    /**
     * @type {Lobby}
     */
    Lobby: require('./lib/lobby'),

    /**
     * @type {Member}
     */
    Member: require('./lib/member'),

    /**
     * @type {Room}
     */
    Room: require('./lib/room')
};