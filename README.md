# Lobby.js

Event-driven lobby framework. Very useful for games or anything that allows things to join other things!

## How it works

TODO

# Objects

## `Lobby(options)`

TODO

## `Room(options)`

TODO

## `Member(options)`

 * `options` – Properties and settings to give the member.
  * `name` – Optional. The name of the member. Must be a string and at least one character long. Defaults to `Player`.

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

