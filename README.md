# UnysonPlus Icon Packs

The on-demand SVG icon-pack catalog for the **UnysonPlus** plugin's icon picker
(icon-v3). The plugin bundles only Lucide + Tabler and downloads any other pack
from here on demand into `wp-content/uploads/unysonplus-icon-packs/`, so a site
carries only the icon sets it uses and the plugin stays small.

## Layout

```
catalog.json                       # list of installable packs (title, slug, svg_open, count)
packs/<slug>/<slug>-icons.json     # { name => inner-svg markup }
packs/<slug>/<slug>-search.json    # { name => space-joined keywords }
build/build-packs.mjs              # regenerates packs/ + catalog.json from upstream sets
```

The plugin fetches `catalog.json` from the repo root (raw GitHub), then per pack
pulls `packs/<slug>/<slug>-icons.json` + `-search.json`. Every `svg_open` uses
`currentColor`, so icons recolour with the element.

## Current packs

| Slug | Title | Icons | License |
|---|---|---|---|
| feather | Feather | 287 | MIT |
| heroicons-outline | Heroicons (Outline) | 324 | MIT |
| heroicons-solid | Heroicons (Solid) | 324 | MIT |
| bootstrap | Bootstrap Icons | 2,078 | MIT |
| phosphor | Phosphor | 1,512 | MIT |
| remix | Remix Icon | 3,229 | Apache-2.0 |
| mdi | Material Design Icons | 7,447 | Apache-2.0 |
| ionicons | Ionicons | 1,357 | MIT |
| iconoir | Iconoir | 1,383 | MIT |
| boxicons | Boxicons | 1,634 | MIT / CC-BY-4.0 |
| octicons | Octicons | 379 | MIT |
| simple-icons | Simple Icons (Brands) | 3,447 | CC0-1.0 |

~23,000 icons across 12 packs. Each set retains its upstream license (above).

## Regenerate

```
cd build
npm install
node build-packs.mjs   # rewrites ../packs/** and ../catalog.json
```

Add a pack by installing its npm source and appending an entry to the `PACKS`
array in `build/build-packs.mjs` (source dir + a `currentColor` `svg_open`).

## License

Each icon set keeps its upstream license (see the table above). The generator and
catalog wrapper are part of UnysonPlus; the icon artwork belongs to its respective
project.
