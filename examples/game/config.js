module.exports = {
    /**
     * HTTP Server config
     */
    server: {
        port: 3000,
        cacheTemplates: false
    },

    /**
     * Lobby configuration (read the docs: README.md)
     */
    lobby: {
        name: "Game Server Lobby Example",
        minOpenRooms: 2,
        maxRooms: 6,
        roomOptions: {
            softMemberCap: 1,
            memberCap: 2,
            isOpen: true,
            closeOnFull: true,
            endOnCloseAndEmpty: true,
            openWhenNotFull: false
        }
    }
};