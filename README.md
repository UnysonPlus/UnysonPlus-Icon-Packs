# UnysonPlus Icon Packs

> ## ⚠️ MOVED / DEPRECATED
> This content now lives in the consolidated content repo
> **[UnysonPlus-Library](https://github.com/UnysonPlus/UnysonPlus-Library)**, under
> **`icon-packs/`** (alongside `templates/` and `presets/`). From plugin **v2.15.65**
> the icon picker fetches from
> `https://raw.githubusercontent.com/UnysonPlus/UnysonPlus-Library/master/icon-packs/catalog.json`.
>
> This repo is kept read-only for reference. **Do not add packs here** — add them to
> `UnysonPlus-Library/icon-packs/`. (Older plugin builds that still point here keep
> working as long as this repo exists.)

---

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
| material-symbols | Material Symbols | 7,784 | Apache-2.0 |
| material-outlined | Material Icons (Outlined) | 2,122 | Apache-2.0 |
| material-filled | Material Icons (Filled) | 2,122 | Apache-2.0 |
| carbon | Carbon | 2,706 | Apache-2.0 |
| eva-fill | Eva Icons (Fill) | 246 | MIT |
| eva-outline | Eva Icons (Outline) | 244 | MIT |
| majesticons-line | Majesticons (Line) | 380 | MIT |
| majesticons-solid | Majesticons (Solid) | 380 | MIT |
| teenyicons-outline | Teenyicons (Outline) | 600 | MIT |
| teenyicons-solid | Teenyicons (Solid) | 600 | MIT |
| pixelarticons | Pixelart Icons | 877 | MIT |
| humbleicons | Humbleicons | 268 | MIT |
| jam | Jam Icons | 896 | MIT |
| mynaui-outline | MynaUI (Outline) | 1,290 | MIT |
| mynaui-solid | MynaUI (Solid) | 1,290 | MIT |
| antdesign-outlined | Ant Design (Outlined) | 447 | MIT |
| antdesign-filled | Ant Design (Filled) | 249 | MIT |
| element-plus | Element Plus | 293 | MIT |
| codicons | VS Code Codicons | 542 | CC-BY-4.0 |
| zondicons | Zondicons | 297 | CC-BY-4.0 |
| bytesize | Bytesize Icons | 101 | MIT |
| open-iconic | Open Iconic | 223 | MIT / OFL-1.1 |
| simple-line | Simple Line Icons | 189 | MIT |

~47,500 icons across 35 packs. Each set retains its upstream license (above).
CC-BY sets (Codicons, Zondicons) need a single site-wide credit; all others are attribution-free.

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
