# HauntHouse

Find the items. Outsmart the ghost. Escape before midnight.

A one-floor horror escape game for the Amazon Fire TV track of the Build, Ship, Shape hackathon. The player searches a mansion with a remote, hides when the ghost comes, and uses three items to unlock the front door.

The official submission deadline is **October 23, 2026, 12:00 PM Pacific**. This prototype is scoped so a solo developer can finish a device demo before a personal target of October 20.

## Play

```bash
npm start
```

Open http://127.0.0.1:5173

```bash
npm test
```

The tests simulate a full escape and the fail states (walking into the ghost, hiding in front of it, midnight, a wrong code).

Add `?debug=1` to the URL to show the ghost's state while tuning.

## Controls

These match a Fire TV remote. A keyboard and a standard gamepad work the same way.

| Input | Action |
| --- | --- |
| D-pad up / down | Move the highlight |
| D-pad left / right | Switch pace between Sneak and Walk |
| Select (Enter) | Confirm the highlighted action |
| Back (Escape) | Pause, or cancel the keypad |
| Stick / gamepad | Same as the D-pad. A confirms, B goes back |

On the keypad, up and down change the selected digit. Left and right move between digits.

Sneak is quiet and burns two minutes. Walk is faster, louder, and calls the ghost. The line under the scene names the room the ghost is in. Do not walk into that room. Loud searches call it toward you. Hide before it enters, then stay still until it leaves. If it sees you step into a hiding place, it catches you.

## Win

1. Hall, then Storage. Pry the crate for the rusty key. Hide in the wardrobe until the ghost leaves.
2. When it is in the Bedroom, go to the Kitchen and search the cabinet for the fuse. Hide under the table.
3. Wait in the Foyer while it occupies the Bedroom. When you hear it in the Kitchen, search the Bedroom nightstand. The code is **1913**. Hide under the bed.
4. Unlock the basement while it is still in the Kitchen, install the fuse, and go straight back to the Foyer.
5. Use the front door and enter the code before midnight. Power must be on or the keypad stays dead.

The coat closet in the Foyer only hides you while the lights are off.

## Project map

| File | Role |
| --- | --- |
| `js/data.js` | Rooms, patrol route, item copy, and difficulty numbers |
| `js/logic.js` | Inventory, clock, and the ghost: patrol, investigate, search, chase |
| `js/ui.js` | 10-foot layout |
| `js/input.js` | Remote key codes, keyboard, and gamepad |
| `js/audio.js` | Small synthesized stings. No audio files, so the game stays offline |
| `js/main.js` | Boots the page |

Essential gameplay does not use a network. The dev server is only there so the browser can load ES modules.

To add a room, put it in `ROOMS` and `GRAPH` in `js/data.js`, then teach `useObject` in `js/logic.js` about anything the player can take or unlock.

## Fire TV

The hackathon allows any framework, including web, as long as the demo video shows the app running on a Fire TV device or the Fire TV / Vega simulator. Vega OS runs React Native and WebView apps. Fire OS can host the same page in an Android TV WebView. A Unity player is not a Vega runtime, so this prototype is a remote-first web game instead of a 3D engine project.

Ship path for the demo:

1. Keep playing it here with the keyboard standing in for the remote.
2. Wrap `index.html` and the `css` and `js` folders in a Vega WebView, or in a Fire OS / Android TV WebView that loads the bundled files.
3. Record that build on the emulator. Arrow keys in this browser build are the same actions as the D-pad.

Voice hints, extra floors, and an online clue service are left out on purpose. The loop that has to work is: search, hide, restore power, enter the code, escape.

## License

MIT. The art is CSS. There are no third-party assets.
