# Breaking Bad — Albuquerque Explorer

A Three.js open-world fan game. Walk and drive through the iconic places of
the series, rebuilt procedurally (no external assets — every texture is
generated at runtime on canvas).

## Locations

- **308 Negra Arroyo Lane** — the White residence: cream stucco, maroon trim,
  the garage jutting toward the street, river-rock front yard, backyard pool
  with the pink teddy bear floating in it... and the pizza on the garage roof.
- **Negra Arroyo Lane** — a full suburban street with neighbor houses, lawns,
  driveways, shade trees and street signs. Jesse's two-story place sits at the
  west end of the lane.
- **Central Avenue** — the commercial strip: **Los Pollos Hermanos** (logo
  pole sign included), **Saul Goodman & Associates** (inflatable Statue of
  Liberty wobbling on the roof, "BETTER CALL SAUL!" banner), the **A1A Car
  Wash** and the **Lavandería Brillante** industrial laundry.
- **Tohajiilee Desert** — leave town on the dirt track to find the RV cook
  site: the 1986 Fleetwood Bounder, camp chairs, the methylamine barrel and a
  fire ring, surrounded by dunes, saguaros and distant mesas.

## Driving

Walt's Pontiac Aztek and Skyler's wood-panelled Wagoneer are parked on the
driveway; the RV waits at the cook site. Walk up to a door and press **E**.

## Controls

| Input | Action |
| --- | --- |
| `W A S D` / arrows | move / drive & steer |
| Mouse | look around |
| `Shift` | run |
| `Space` | jump |
| `E` | enter / exit vehicles |
| `Esc` | pause (release mouse) |

## Running

```bash
npm install
npm run dev        # development server
npm run build      # production build into dist/
npm run preview    # serve the production build
```

## Performance

Tuned for 60 fps: instanced desert vegetation, merged geometries, a capped
pixel ratio, a tight shadow frustum that follows the player, fog-limited draw
distance and procedural canvas textures generated once at startup. An FPS
meter sits in the top-right corner.

## Dev scripts

```bash
node scripts/screenshot.mjs   # headless screenshots of key locations (needs `npm run preview` running)
node scripts/drive-test.mjs   # automated walk/enter/drive smoke test
```

Both need Playwright's Chromium (`npx playwright install chromium`).
