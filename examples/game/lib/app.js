
var Server = require('./server'),
    lob = require('../../../index');

/**
 * Core application logic
 *
 * @param options – App configuration
 * @constructor
 */
function App(options) {

    // Create a new server instance
    var self = this;
    this.server = new Server(options.server, function() {

        // Setup the lobby
        self._initLobby(options || {});
    });
}

App.prototype = {

    /**
     * The server instance
     * @type {Server}
     */
    server: null,

    constructor: App,

    /**
     * Initializes the lobby system for the app
     * @param options – App configuration
     * @private
     */
    _initLobby: function(options) {

        // Create the new lobby manager
        var self = this,
            lobby = this.lobby = new lob.Lobby(options.lobby);

        //
        // Notify clients the lobby has changed
        //

        lobby.on('room_add', function(room) {
            console.log(' > Room added', room.id);
            self.notifyLobbyChange();
        });

        lobby.on('room_open', function(room) {
            console.log(' > Room opened', room.id);
            self.notifyLobbyChange();
        });

        lobby.on('room_close', function(room) {
            console.log(' > Room closed', room.id);
            self.notifyLobbyChange();
        });

        lobby.on('room_end', function(room) {
            console.log(' > Room ended', room.id);
            self.notifyLobbyChange();
        });

        // Start handling client connections
        this.handleConnections();
    },

    /**
     * Starts listening for client socket connections
     */
    handleConnections: function() {

        // Grab the socket.io server instance from the server helper class
        var io = this.server._socketServer,
            self = this;

        // Handle a new client connection
        io.on('connection', function(socket) {

            // The member will persist while the client is connected.
            // When they disconnect, they're outta here
            var member = null;

            // Remove the player from any rooms and clean up when they're gone
            socket.on('disconnect', function() {
                // Remove member from any assigned rooms
                if (member) {
                    var rooms = member.allRooms, i = 0;
                    for(; i < rooms.length; i++) {
                        rooms[i].removeMember(member);
                    }

                    // Notify clients they look different
                    self.notifyLobbyChange();
                }
            });

            // When a client identifies themselves, then we'll actually their member instance
            socket.on('name', function(req) {
                if (!member) {
                    try {
                        // Attempt to create a member with the name they gave
                        member = new lob.Member({ name: req.data });
                        console.log(' > Member created', member.id);

                        // Tell the client who they are
                        self.reply(socket, req, null, self.serializeMember(member));
                    } catch (e) {
                        // Tell the client they're bad and they should feel bad
                        self.reply(socket, req, e.message);
                    }
                }
            });

            // Handle client requests when they ask to join a room
            socket.on('join_room', function(req) {
                if (!member) {
                    self.reply(socket, req, 'You are not a member.');
                } else {
                    var room = self.lobby.rooms[req.data.id];
                    if (!room) {
                        self.reply(socket, req, 'Invalid room.');
                    } else {
                        // Try adding the member to the room
                        var res = room.addMember(member);
                        if (res instanceof Error) {
                            // Nope
                            self.reply(socket, req, res.message);
                        } else {
                            // Successfully added, tell them and the world
                            self.reply(socket, req, null, true);
                            self.notifyLobbyChange();
                        }
                    }
                }
            });

            // Handle client requests when they ask to leave a room
            socket.on('leave_room', function(req) {
                if (!member) {
                    self.reply(socket, req, 'You are not a member.');
                } else {
                    var room = self.lobby.rooms[req.data.id];
                    if (!room) {
                        self.reply(socket, req, 'Invalid room.');
                    } else {
                        // Try removing the member from the room
                        var res = room.removeMember(member);
                        if (res instanceof Error) {
                            // Nope
                            self.reply(socket, req, res.message);
                        } else {
                            // Yup. Tell them of their success and then the world
                            self.reply(socket, req, null, true);
                            self.notifyLobbyChange();
                        }
                    }
                }
            });

            // Upon connection, give the client the current lobby state
            self.notifyLobbyChange(socket);
        })
    },


    /**
     * Helper method to shoot a reply to the client, sorta like how JSONP works
     * @param socket – The socket to receive the reply
     * @param req – The original request data received by the client
     * @param error – The response error to send
     * @param data – The response data to send
     */
    reply: function(socket, req, error, data) {
        socket.emit('reply', this.makeReply(req, error, data));
    },


    /**
     * Helper method to build a response to emit to a client to reply to a request
     * @param req – The original request data received by the client
     * @param error – The response error to send
     * @param data – The response data to send
     * @returns {{error: (object|null), data: (object|null), callback: string}}
     */
    makeReply: function(req, error, data) {
        return { error: error, data: data, callback: req.callback };
    },


    /**
     * Serializes a member object for transmission over the internets
     * @param {Member} member – The member to serialze
     * @returns {{id: string, name: string}}
     */
    serializeMember: function(member) {
        return { id: member.id, name: member.name };
    },


    /**
     * Serializes a lobby object for transmission over the internets
     * @returns {{id: string, name: string, rooms: *}}
     */
    serializeLobby: function() {
        var res = { id: this.lobby.id, name: this.lobby.name, rooms: {} };
        for(var i in this.lobby.rooms) {
            if (this.lobby.rooms.hasOwnProperty(i)) {
                res.rooms[i] = {
                    id: this.lobby.rooms[i].id,
                    name: this.lobby.rooms[i].name,
                    memberIds: [],
                    memberCount: Object.keys(this.lobby.rooms[i].members).length,
                    memberCap: this.lobby.rooms[i].memberCap,
                    isOpen: this.lobby.rooms[i].isOpen
                };

                for(var m in this.lobby.rooms[i].members) {
                    if (this.lobby.rooms[i].members.hasOwnProperty(m)) {
                        res.rooms[i].memberIds.push(m);
                    }
                }
            }
        }
        return res;
    },


    /**
     * Notifies all clients that the lobby changed, and they can update their respective UI's
     * @param [socket] – Optional socket to send if to only one specific client, otherwise broadcast to all clients
     */
    notifyLobbyChange: function(socket) {
        var io = this.server._socketServer;
        (socket || io).emit('lobby_change', this.serializeLobby());
    },


    /**
     * Start listening for connections. Game on!
     */
    run: function() {

        // Start listening and tell the console where to find our shindig
        var server = this.server;
        server.run(function() {
            console.log('Server running at:', server._webServer.info.uri);
        });
    }

};


module.exports = App;