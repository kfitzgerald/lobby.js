
var Hapi = require('hapi'),
    path = require('path');

/**
 * Handles the HTTP / socket configuration overhead, so the app can worry about app logic
 * @param options – Server configuration
 * @param callback – Callback when the server is done initializing
 * @constructor
 */
function Server(options, callback) {
    options = options || {};

    // What HTTP port should we listen on
    this.port = options.port || 3000;

    // Should we cache handlebars templates? (e.g. dev vs prod, but why would you use this in prod anyway?)
    this.cacheTemplates = (options.cacheTemplates !== undefined) ? options.cacheTemplates : false;

    // Start initializing the server bits
    this._init(callback);
}

Server.prototype = {

    /**
     * The port to listen on
     */
    port: null,

    /**
     * The web server instance (hapi)
     */
    _webServer: null,

    /**
     * The socket server instance (socket.io)
     */
    _socketServer: null,

    constructor: Server,


    /**
     * Initialize the web and socket servers
     * @param [callback] – The function to call when done setting up all the parts
     * @private
     */
    _init: function(callback) {

        // Make the Hapi server instance
        var server = this._webServer = new Hapi.Server();
        server.connection({ port: this.port });

        // Make the Socket.io instance, bound to our open port
        var io = this._socketServer = require('socket.io')(server.listener);

        // Register the view and static content handler
        this._registerViews(this._registerStatic.bind(this, callback));
    },


    /**
     * Register static asset routes, so we don't have to use a CDN or copy files around like a derp
     * @param callback – The function to fire when done registering bits to hapi
     * @private
     */
    _registerStatic: function(callback) {
        var server = this._webServer;

        // Register the inert hapi module for static asset handling
        server.register(require('inert'), function(err) {
            if (err) throw err;


            // Expose everything in the static directory
            server.route({
                method: 'GET',
                path: '/{param*}',
                config: {
                    files: {
                        relativeTo: __dirname
                    }
                },
                handler: {
                    directory: {
                        path: '../static',
                        listing: true
                    }
                }
            });

            // Expose our sub modules, too
            (['handlebars','jquery','bootstrap']).forEach(function(component) {
                // Expose everything in the handlebars directory
                server.route({
                    method: 'GET',
                    path: '/vendor/'+component+'/{param*}',
                    config: {
                        files: {
                            relativeTo: __dirname
                        }
                    },
                    handler: {
                        directory: {
                            path: path.join(__dirname, '..', '..', '..', 'node_modules', component, 'dist'),
                            listing: true
                        }
                    }
                });
            });

            // Done
            if (callback) {
                process.nextTick(callback);
            }
        });
    },


    /**
     * Register hapi view handler
     *
     * Right now, this example doesn't actually need to do any MVC stuff, but
     * it's here anyway, in case you want to spice things up and use this as a starting point
     * for your own project. Be creative!
     *
     * @param callback – The function to fire when done registering
     * @private
     */
    _registerViews: function(callback) {
        var server = this._webServer,
            self = this;

        // Register the hapi vision module, with handlebars. Sounds legit, right?
        server.register(require('vision'), function(err) {
            if (err) throw err;

            //noinspection JSUnresolvedFunction
            server.views({
                engines: {
                    html: require('handlebars')
                },
                isCached: self.cacheTemplates,
                relativeTo: __dirname,
                path: '../views'
                //layoutPath: '../views/layout',
                //helpersPath: '../views/helpers'
            });

            // Done
            if (callback) {
                process.nextTick(callback);
            }
        })
    },


    /**
     * Start listening for connections!
     * @param callback – The function to fire when hapi is ready to rock and roll
     */
    run: function(callback) {
        this._webServer.start(callback);
    }
};

module.exports = Server;