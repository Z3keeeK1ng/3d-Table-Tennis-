# Table Tennis 3D

A browser-based 3D table tennis game with single-player (vs CPU) and two-player modes. It's a single HTML file with no install needed.

**Play it:** https://claude.ai/artifact/PV6NJwXDpCdyYFY2kmt8r2

## Features

- **Single player** against a CPU with four levels: Easy, Medium, Hard, and Champion. Higher levels react faster and make fewer mistakes.
- **Two-player mode** on one keyboard.
- **3D graphics** with real-time shadows, a lit room with ceiling lamps, a textured table, and framed pictures on the walls.
- **Realistic-ish physics:** topspin makes the ball dip, air slows it down slightly, and the table absorbs some sideways speed on bounces. Faster racket swings hit the ball harder.
- **Sound effects** for hits, bounces, net contact, points, and game over. They are generated in the browser, so no audio files are needed.
- **Sound on/off** toggle, and a pause menu.

## How to Play

Hit the ball so it lands on the other side of the table. Rackets hit the ball automatically when it is within reach, so timing is about positioning.

**You lose a point if you:**
- hit the ball into the net,
- let the ball bounce twice on your side,
- hit the ball so it lands on your own side,
- or let the ball go off the table.

**Scoring:** First to 11 points, and you must win by 2.

The player who loses a point serves next. Serves are automatic.

## Controls

**Single player**
- **Mouse:** Move the mouse over the game. Your racket follows the cursor on the table.
- **Keyboard:** W/A/S/D also moves your racket. W/S moves it up and down, and A/D moves it left and right.

**Two players**
- **Player 1 (red racket, left side):** W/A/S/D
- **Player 2 (black/blue racket, right side):** Arrow keys

**Anytime**
- **P** or **Esc:** Pause or resume
- **Pause button** (top right): Pauses the game
- **Sound button** (top left): Turns sound on or off

## Running the Game

1. Open the link above, or open `table-tennis-3d.html` in a modern browser.
2. Choose **Single Player** (and a CPU level) or **Multiplayer** from the main menu.

**Requirements**
- A modern browser with WebGL support (Chrome, Edge, Firefox, or Safari).
- An internet connection the first time you load the page. The game loads the Three.js 3D library from cdnjs.cloudflare.com.
- Sound starts after your first click or key press, because browsers block audio until you interact with the page.

## Known Limitations

- Mobile and touch support is limited. Touch can move the racket in single-player mode, but two-player mode needs a keyboard.
- The graphics are built from simple shapes and generated textures, so they are stylized rather than photorealistic.
- Ball spin is shown with a visual marker and rolling motion rather than a full physics simulation.
- The CPU and racket physics are tuned by hand, so some shots may feel faster or slower than expected.

## Credits

- 3D rendering: [Three.js](https://threejs.org/) (r128), loaded from cdnjs.
- Game design, code, and sound effects were built with Claude.
