# HauntHouse

Find the items. Outsmart the ghost. Escape before midnight.

A one-floor horror escape game for the Amazon Fire TV track of the Build, Ship, Shape hackathon. The player searches a mansion with a remote, hides when the ghost comes, and uses three items to unlock the front door.

The official submission deadline is **October 23, 2026, 12:00 PM Pacific**. This prototype is scoped so a solo developer can finish a device demo before a personal target of October 20.

## Play

```bash
npm install
npm start
```

Open http://127.0.0.1:5173

```bash
npm test
```

The tests cover walking, the locked basement, picking up the key, getting caught, hiding, and escaping.

Add `?debug=1` to the URL to show the ghost's state while tuning.

## Controls

You walk a 3D house. These match a Fire TV remote. A keyboard and a gamepad do the same thing.

| Input | Action |
| --- | --- |
| Up | Walk forward |
| Down | Step backward |
| Left / Right | Turn |
| OK (Enter) | Use what you are facing |
| Back (Escape) | Pause, or cancel the keypad |

A prompt at the bottom names the OK action when you are close to something: a crate, a door, a bed. On the keypad, up and down change the selected digit and left and right move between digits.

Walking makes a little noise. Opening drawers and cabinets calls the ghost. The line at the bottom names the room it is in. Hide before it reaches you, then stay still until it leaves. If it sees you hide, it pulls you out.

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
| `js/data.js` | Floor plan, furniture, item spots, and difficulty numbers |
| `js/sim.js` | Movement, inventory, clock, and the ghost |
| `js/house.js` | 3D rooms, flashlight, and ghost mesh |
| `js/input.js` | Remote key codes, keyboard, and gamepad |
| `js/audio.js` | Small synthesized stings. No audio files, so the game stays offline |
| `js/main.js` | Render loop and HUD |

Essential gameplay does not use a network after `npm install`. The dev server only loads the page.

To add a room, put it in `ROOMS`, `CENTERS`, `LINKS`, and `GAPS` in `js/data.js`, then add a spot if the player can use something there.

## Fire TV

The hackathon allows any framework, including web, as long as the demo video shows the app running on a Fire TV device or the Fire TV / Vega simulator. This build is a Three.js house aimed with the remote: arrows move, OK uses the thing in front of you. Vega OS can show it in a WebView. Fire OS can show it in an Android TV WebView.

Ship path for the demo:

1. Keep playing it here with the keyboard standing in for the remote.
2. Wrap `index.html` and the `css` and `js` folders in a Vega WebView, or in a Fire OS / Android TV WebView that loads the bundled files.
3. Record that build on the emulator. Arrow keys in this browser build are the same actions as the D-pad.

Voice hints, extra floors, and an online clue service are left out on purpose. The loop that has to work is: search, hide, restore power, enter the code, escape.

## License

MIT. The house is built from simple 3D shapes. The only dependency is Three.js.
