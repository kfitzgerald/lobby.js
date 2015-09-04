
var App = require('./lib/app'),
    config = require('./config');

// Basically, the backend has two abstractions
//  * App: the thing that handles the "game" logic
//  * Server: the thing that handles the actual server management

// So, let's create a new app instance
var app = new App(config);

// Then start the app
app.run();