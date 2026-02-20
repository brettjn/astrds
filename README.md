# astrds

A clone of the classic arcade video game **Asteroids**, built with vanilla JavaScript and HTML5 Canvas.

## Controls

| Action        | Keys                     |
|---------------|--------------------------|
| Rotate left   | ← Arrow / A              |
| Rotate right  | → Arrow / D              |
| Thrust        | ↑ Arrow / W              |
| Fire          | Space / X                |
| Start / Retry | Space                    |

## Gameplay

- Shoot asteroids to break them into smaller pieces and score points.
- Large → Medium → Small; small asteroids are destroyed on hit.
- Clearing all asteroids advances to the next level (more asteroids spawn).
- You start with **3 lives**; colliding with an asteroid costs one life.
- High score is saved in `localStorage`.

## Development

```bash
npm install
npm run dev      # start local dev server (hot-reload)
npm run build    # production build → dist/
npm run preview  # preview the production build locally
```
