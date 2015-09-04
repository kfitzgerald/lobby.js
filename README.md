# Lobby.js

Event-driven lobby framework. Very useful for games or anything that allows things to join other things!

# Installing

Install with NPM like so:

```sh
npm install lobby.js
```

# How it works

Lobby.js consists of three objects: Lobby, Room, and Member. From an onwership perspective, looks kinda like this:

```
+---------+             +-------+             +---------+
| Lobbies |  --have-->  | Rooms |  --have-->  | Members |
+---------+             +-------+             +---------+
```

Your application will create a new lobby instance, and hook into its events. 

```js
// Include the lobby framework
var lob = require('lobby.js');

// Make a new lobby, configured to the needs of your app
var lobby = new lob.Lobby({ /* your options here */ });

//
// Hook into events
//

lobby.on('room_add', function(room) {
    // What your app should do when a new room is created
    
    // Maybe you would want to tie into the room's events too
    room.on('member_add', function(member) {
        // When your app should do when an member joins the room
    });
    
    room.on('member_remove', function(member) {
        // When your app should do when an member leaves the room
    });
    
    room.on('soft_full', function() {
        // What your app should do when the room is almost full
    });
    
    room.on('full', function() {
        // What your app should do when the room is at max capacity
    });
    
    // You could also tie into the room's `open`, `close`, and `end` events here, too
});

lobby.on('room_open', function(room) {
    // What your app should do when a room opens, allowing members to join
});

lobby.on('room_close', function(room) {
   // What your app should do when a closes, preventing members from joining 
});

lobby.on('room_end', function(room) {
   // What your app should do when a room ends and should be cleaned up
});

```


# Objects

## `Lobby(options)`

The lobby manages the state of all the rooms. You can let the lobby automatically manage rooms by keeping 
 a certian amount open at any given time, or manage them entirely yourself.
  
When the lobby creates a new room, it will use the `roomOptions` property to configure the new room. You should
customize these based on your application. See `Room(options)` below for details.
 
The lobby object extends [EventEmitter](https://nodejs.org/docs/latest/api/events.html), so it will emit events.

```js
var lob = require('lobby.js'),
    lobby = new lob.Lobby(options);
```

 * `options` – Properties and settings to give the lobby. All properties are optional.
  * `name` – The name of the lobby. Must be a string 1-255 characters long. Defaults to `Lobby <Number>`.
  * `minOpenRooms` – Number of rooms to keep open at any given time (self-scale). Set to `0` to disable. Defaults to `3`.
  * `maxRooms` – Total number of rooms that may exist at any given time. Set to `0` to disable. Defaults to `10`.
  * `roomOptions` – The default options to give to an automatically created room. See `Room(options)`.
  * `*` – Any other unlisted property given will be set on the Lobby object, useful for integration with your app.

### Properties

 * `id` – The unique identifier of the lobby instance. 
 * `name` - See `Lobby(options)` for description.
 * `minOpenRooms` - See `Lobby(options)` for description.
 * `maxRooms` - See `Lobby(options)` for description.
 * `roomOptions` - See `Room(options)` for description.
 * `rooms` – Live object that contains the room instances. Keyed by room `id`. 
 * `allRooms` – Getter that returns an array of all active rooms, opened and closed.
 * `openRooms` – Getter that returns an array of all open rooms.
 * `closedRooms` – Getter that returns an array of all closed rooms.
 
### Static Properties
 
 * `counter` – Incremented every time a lobby instance is created.
 * `schema` – Validation configuration schemas, using [Joi](https://github.com/hapijs/joi).
  * `options` – The `options` validation schema, used in the Lobby constructor.
  
### Methods

 * `createRoom(roomOptions) => Room` – Creates a new room with the given room options. Returns the new `Room` instance. 
  * `roomOptions` – The configuration to send to the `Room` constructor. The `roomSoftMemberCap` and `roomSoftMemberCap` are used by default unless changed by `roomOptions`.
    * See the `Room(options)` section for properties.

### Events

 * `room_add` – Emitted when a room is created by the lobby. Event data is: `Room`.  
 * `room_open` – Emitted when a room opens in the lobby. Event data is: `Room`.  
 * `room_close` – Emitted when a room closes in the lobby. Event data is: `Room`.  
 * `room_end` – Emitted when a room ends and is removed from the lobby. Event data is: `Room`.  

---

## `Room(options)`

The room contains members and can change state when members are added and removed. You can configure a room to automatically
 close or reopen, using the `closeOnFull` and `openWhenNotFull` properties. You can also configure the room to end when 
 no members are left in the room using `endOnCloseAndEmpty`, useful for last-man-standing situations.

Members can only be added to a room if the room state is open.

When a room ends, consider it dead. Clean up references to the room and let it be purged.

The lobby object can automatically create rooms for your application based on your configuration, or you can bypass the
lobby entirely and make your own room, if that's your jam.
 
The Room object extends [EventEmitter](https://nodejs.org/docs/latest/api/events.html), so it will emit events.

```js
var lob = require('lobby.js'),
    lobby = new lob.Lobby(options);
    
lobby.on('room_add', function(room) {
    // room is now present in the lobby!
    
    // Hook into your app. Maybe even add a member!
    var george = new Member({ name: "George" });
    room.addMember(george);
});
```

Or, if you don't want to let the lobby manage your rooms:

```js
var lob = require('lobby.js'),
    room = new lob.Room(options);
```

 * `options`
  * `name` – The name of the room. Must be a string 1-255 characters long. Defaults to `Room <Number>`.
  * `softMemberCap` – When a member joins a room, this is the threshold that will trigger a soft-full event. Set to `0` to disable. Defaults to `0`.
  * `memberCap` – The total number of members that may join a room. Set to `0` to disable. Defaults to `10`.
  * `isOpen` – Whether to open the room when initialized (`true`) or be closed (`false`). Defautls to `true`. 
  * `closeOnFull` – Whether to close the room automatically when the member cap is reached. Defaults to `true`. 
  * `endOnCloseAndEmpty` – Whether to end the room when the room is closed and no members are present. Defaults to `true`.  
  * `openWhenNotFull` – Whether to re-open the room when a member is removed and the room was previously closed and full. Defaults to `false`.
  * `*` – Any other unlisted property given will be set on the Room object, useful for integration with your app.

### Properties
 
 * `id` – The unique identifier of the lobby instance. 
 * `name` - See `Room(options)` for description.
 * `softMemberCap` – See `Room(options)` for description.
 * `memberCap` – See `Room(options)` for description.
 * `isOpen` – Whether the room is open to new members (`true`) or not (`false`). 
 * `closeOnFull` – See `Room(options)` for description.
 * `endOnCloseAndEmpty` – See `Room(options)` for description.  
 * `openWhenNotFull` – See `Room(options)` for description.
 * `members` – Live object that contains the member instances. Keyed by member `id`.
 * `allMembers` –  Getter that returns an array of all members present in the room.
 
### Static Properties

 * `counter` – Incremented every time a room instance is created.
 * `schema` – Validation configuration schemas, using [Joi](https://github.com/hapijs/joi).
  * `options` – The `options` validation schema, used in the Room constructor.
  
### Methods

 * `open() => room` – Opens the room, if currently closed.
 * `close() => room` – Closes the room, if currently open.
 * `end() => room` – Ends the room, kicking all members still present in the room.
 * `addMember(member) => Error|null` – Adds a member to the room. Returns an `Error` if the member was not added.
  * `member` – The `Member` instance to add to the room.
 * `removeMember(member) => Error|null` – Removes a member from the room. Returns an `Error` if the member was not removed.
  * `member` – The `Member` instance or string member `id` to remove from the room.

### Events

 * `open` – Fired when the room changes state from closed to open.
 * `close` – Fired when the room changes state from open to closed.
 * `end` – Fired when the room has ended and should be purged.
 * `soft_full` – Fired when the number of members present meets the `softMemberCap` threshold.
 * `full` – Fired when the number of members present meets the `memberCap` threshold.
 * `member_add` – Fired when a member joins the room. Event data is: `Member`.
 * `member_remove` – Fired when a member leaves the room. Event data is: `Member`.
 
---

## `Member(options)`

Members are simply a stub object that you can use to represent a user or thing in your application. All it holds is an 
id and a name. Members will emit events when joining and leaving rooms. They also hold a list of rooms they are joined to.

The Member object extends [EventEmitter](https://nodejs.org/docs/latest/api/events.html), so it could emit events, if you
make it do so.

```js
var lob = require('lobby.js'),
    member = new lob.Member(options);
```

 * `options` – Properties and settings to give the member. All properties are optional.
  * `name` – The name of the member. Must be a string 1-255 characters long. Defaults to `Member <Number>`.
  * `*` – Any other unlisted property given will be set on the Member object, useful for integration with your app.

### Properties
 
 * `id` – The unique identifier of the lobby instance. 
 * `name` - See `Room(options)` for description.
 * `rooms` – Live object that contains the room instances the member has been added to. Keyed by room `id`.
 * `allRooms` –  Getter that returns an array of all rooms present in the room.
 
### Static Properties

 * `counter` – Incremented every time a member instance is created.
 * `schema` – Validation configuration schemas, using [Joi](https://github.com/hapijs/joi).
  * `options` – The `options` validation schema, used in the Member constructor.
  
  
### Events

 * `room_join` – Fired when the member joins a room. Event data is: `Room`.
 * `room_leave` – Fired when the member joins a room. Event data is: `Room`.

# Examples

Check out the game example in [/examples/game](https://github.com/kfitzgerald/lobby.js/tree/master/examples/game).

To run it, you'll need to fork or clone the repository, install the dependencies, and run the example server.

The best way to do this is in a terminal window, like a pro.

```sh
# clone the repo
git clone https://github.com/kfitzgerald/lobby.js.git

# get into the repo and install all the dependencies
cd lobby.js
npm install

# get into the game example directory, and run the example
cd examples/game
node .
```

Once running, point your browser to [http://localhost:3000/](http://localhost:3000/)

What you'll see, is a simple UI to give your name and view the lobby UI. You'll be able to join a room and 
view the realtime updates to the lobby.

Now, you can have lots more fun with it by having two browser windows open at the same time. When doing this, youll be
able to join both clients to the same room to fill it up. When both players leave, the room ends and goes away.

This example illustrates how the lobby attempts to keep a certian amount of rooms open at any given time, and creates
new rooms when other rooms end.

The best metaphore to describe this is that a room represents the game instance, and when the game is over 
(say last man standing) the room/game ends and a new open room jumps in to take its place.

Enjoy and good luck!