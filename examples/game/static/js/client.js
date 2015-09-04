/**
 * Browser-side client for our lobby test game!
 * @constructor
 */
function Client() {

    /**
     * Container for holding our handlebars templates
     * @type {*}
     */
    this.templates = {};

    /**
     * Nonce counter to make sure each request we fire over the socket is unique (for callbacks)
     * @type {number}
     * @private
     */
    this._emitCounter = 0;

    // Initialize the client
    this._init();
}

//noinspection JSUnusedGlobalSymbols
Client.prototype = {

    /**
     * Container for holding our handlebars templates
     * @type {*}
     */
    templates: null,

    constructor: Client,


    /**
     * Initializes _all the things_
     * @private
     */
    _init: function() {
        // Grab all the jQuery elements on the page we'll need to interact with regularly
        this._bindElements();

        // Compile handlebars templates
        this._bindTemplates();

        // Listen for page events
        this._bindPageEvents();

        // Connect to the socket server!
        //noinspection JSUnresolvedVariable
        this.socket = io.connect();

        // Start handling socket events
        this._bindSocketEvents();
    },


    /**
     * Builds the common jQuery selector instances for reuse
     * @private
     */
    _bindElements: function() {
        this.$lobbyPanel = $('#lobby-panel');
        this.$namePanel = $('#name-panel');
        this.$namePanelAlert = $('.alert', this.$namePanel);
        this.$lobby = $('tbody', this.$lobbyPanel);
        this.$lobbyPanelAlert = $('.alert', this.$lobbyPanel);
        this.$memberStatus = $('.member-status', this.$lobbyPanel)
    },


    /**
     * Handle page-user interactions
     * @private
     */
    _bindPageEvents: function() {

        // Handle name submission
        var self = this;
        $('form', this.$namePanel).submit(function(e) {
            e.preventDefault();
            self.$namePanelAlert.hide();

            // Assign the name and attempt to register
            self.name = $('input.member-name', self.$namePanel).val();
            self.register();
        });
    },


    /**
     * Compile the handlebars templates for various UI components
     * @private
     */
    _bindTemplates: function() {
        // Template to handle lobby UI
        this.templates.lobby = Handlebars.compile($("#lobby-template").html());

        // Template to handle member whoami UI
        this.templates.member_status = Handlebars.compile($("#member-status-template").html());
    },


    /**
     * Handle socket events
     * @private
     */
    _bindSocketEvents: function() {
        var socket = this.socket,
            self = this;

        // When we disconnect because the server goes down, or the internet, or whatever
        // Re-register ourselves, if possible.
        socket.on('reconnect', function() {
            if (self.name) {
                self.register();
            }
        });

        // Handles a JSON-P like response, but over sockets, like a boss
        socket.on('reply', function(data) {
            // If the response contains a clalback, then try to fire it
            if (data.callback && typeof self[data.callback] === "function") {
                self[data.callback].call(self, data.error, data.data);
                delete self[data.callback];
            } else {
                // Something is terribly out of sync
                console.error('Unknown reply', data);
            }
        });

        // Handle notifications from the server that the lobby UI needs to be updated
        socket.on('lobby_change', function(data) {
            self.lobby = data;
            self.lobby.allRooms = [];
            for(var i in data.rooms) {
                if (data.rooms.hasOwnProperty(i)) {
                    data.rooms[i].isInRoom = (self.member && data.rooms[i].memberIds.indexOf(self.member.id) >= 0) ? true : false;
                    self.lobby.allRooms.push(data.rooms[i]);
                }
            }
            console.log('lobby', data);
            self.updateLobbyUi();
        });

        // Handles random weird errors that never occur, amirite?
        socket.on('error', function(err) {
            console.error('socket error', err);
        });

    },


    /**
     * Helper to render a template to the element of your choosing.
     * @param $element – The jQuery selector to jam the output into
     * @param template – The handlebar template to run
     * @param data – The data to stick into the template
     */
    render: function($element, template, data) {
        $element.html(template(data));
    },


    /**
     * Updates the lobby UI based on the current lobby data stored
     */
    updateLobbyUi: function() {
        this.render(this.$lobby, this.templates.lobby, this.lobby);
    },


    /**
     * Sends a request to the socket server, and callsback on response
     * @param {string} event – The event name to fire
     * @param {*} data – The event data to pass along
     * @param {function(err:null|string, res:*)} callback – The function to call when complete
     */
    emit: function(event, data, callback) {
        // If we should callback
        if (callback) {
            // Generate a callback name, store it, and send it
            var cbName = '__cb_' + (new Date()).getTime() + "_" + (this._emitCounter++);
            this[cbName] = callback;
            this.socket.emit(event, {data: data, callback: cbName })
        } else {
            // Just send it as-is, no callback
            this.socket.emit(event, data);
        }
    },


    /**
     * Registers the player with the server to enter the lobby
     */
    register: function() {
        var self = this;
        // Register our name to build our member instance with the server
        self.emit('name', self.name, function(err, res) {
            if (err) {
                // Derp
                $('p', self.$namePanelAlert).html(err);
                self.$namePanelAlert.show();
            } else {
                // Success! Update our membership ui and show the lobby
                self.member = res;
                console.log('registered', res);
                self.render(self.$memberStatus, self.templates.member_status, res);
                self.$lobbyPanel.show();
                self.$namePanel.hide();
            }
        })
    },


    /**
     * Attempts to join the given room
     * @param {string} id – The room id to jin
     */
    joinRoom: function(id) {
        var self = this;
        this.emit('join_room', { id: id }, function(err, res) {
            if (err) {
                // Derp
                $('p', self.$lobbyPanelAlert).html(err);
                self.$lobbyPanelAlert.show();
            }
            console.log('join room', err, res);
        });
    },


    /**
     * Attempts to leave the given room
     * @param id
     */
    leaveRoom: function(id) {
        var self = this;
        this.emit('leave_room', { id: id }, function(err, res) {
            if (err) {
                // Derp
                $('p', self.$lobbyPanelAlert).html(err);
                self.$lobbyPanelAlert.show();
            }
            console.log('leave room', err, res);
        });
    }

};