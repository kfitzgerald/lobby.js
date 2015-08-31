# Lobby.js

Event-driven lobby framework. Very useful for games or anything that allows things to join other things!

## How it works

TODO

# Objects

## `Lobby(options)`

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





## `Room(options)`

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
 * `member_add` – Fired when a member joins the room.
 * `member_remove` – Fired when a member leaves the room.
 
 
 
 
 
 

## `Member(options)`

 * `options` – Properties and settings to give the member. All properties are optional.
  * `name` – The name of the member. Must be a string 1-255 characters long. Defaults to `Member`.

Any key that does not match the following will be attached to the Member instance.

```js

var Member = require('lobbyjs').Member;

// Say someone just joined the app
// Create a new member to represent the joiner 
var joiner = new Member({ name: "george", anythingYouLike: 42 });

// You can send in whatever properties are useful to your application.
// In this case, it anythingYouLike can be accessed like so
console.log(joiner.anythingYouLike);

```

## Events


## Methods


### Examples

