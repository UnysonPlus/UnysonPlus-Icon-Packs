/**
 * UnysonPlus icon-pack generator.
 *
 * Turns upstream icon sets (installed as npm deps in ./node_modules) into the
 * compact two-file format the UnysonPlus SVG engine consumes:
 *   ../packs/<slug>/<slug>-icons.json    { name => inner-svg markup }
 *   ../packs/<slug>/<slug>-search.json   { name => space-joined keywords }
 * and (re)writes ../catalog.json with { title, slug, svg_open, count } per pack.
 *
 * The engine wraps a picked icon's inner markup in the pack's `svg_open` … `</svg>`,
 * so every svg_open below forces `currentColor` — icons recolour with the element.
 * Inner markup is stripped of the source's own outer <svg>, its class/aria noise,
 * and any hardcoded fill/stroke colours (so nothing overrides currentColor).
 *
 * Run:  node build-packs.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const NM   = path.join( __dirname, 'node_modules' );
const OUT  = path.resolve( __dirname, '..', 'packs' );
const ROOT = path.resolve( __dirname, '..' );

const BASE_URL = 'https://raw.githubusercontent.com/UnysonPlus/UnysonPlus-Icon-Packs/master/';

/* -------------------------------------------------------------------------- */
/* Pack definitions                                                            */
/* -------------------------------------------------------------------------- */

const PACKS = [
	{
		slug: 'feather',
		title: 'Feather',
		dir: path.join( NM, 'feather-icons/dist/icons' ),
		svg_open: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather">',
	},
	{
		slug: 'heroicons-outline',
		title: 'Heroicons (Outline)',
		dir: path.join( NM, 'heroicons/24/outline' ),
		svg_open: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="heroicon">',
	},
	{
		slug: 'heroicons-solid',
		title: 'Heroicons (Solid)',
		dir: path.join( NM, 'heroicons/24/solid' ),
		svg_open: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="heroicon">',
	},
	{
		slug: 'bootstrap',
		title: 'Bootstrap Icons',
		dir: path.join( NM, 'bootstrap-icons/icons' ),
		svg_open: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16" fill="currentColor" class="bi">',
	},
	{
		slug: 'phosphor',
		title: 'Phosphor',
		dir: path.join( NM, '@phosphor-icons/core/assets/regular' ),
		svg_open: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256" fill="currentColor" class="ph">',
	},
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Pull the inner markup out of an <svg>…</svg> and normalise it. */
function innerFromSvg( svg ) {
	const m = svg.match( /<svg[^>]*>([\s\S]*?)<\/svg>/i );
	let inner = m ? m[ 1 ] : svg;

	// Drop hardcoded colours so the icon inherits currentColor from svg_open.
	// (Keep fill="none" — it's structural, not a colour.)
	inner = inner
		.replace( /\s(fill|stroke)="(?!none")(#[0-9a-fA-F]{3,8}|rgb[^"]*|currentColor|[a-zA-Z]+)"/g, '' )
		// Phosphor ships a transparent framing <rect …/> in some icons — harmless, keep.
		.replace( /\s(aria-hidden|data-slot|focusable|role)="[^"]*"/g, '' )
		// Collapse whitespace between/inside tags to single spaces.
		.replace( /\s*[\r\n]+\s*/g, ' ' )
		.replace( /\s{2,}/g, ' ' )
		.replace( />\s+</g, '> <' )
		.trim();

	return inner;
}

/** Search keywords for an icon name: the name plus its hyphen tokens, deduped. */
function keywordsFor( name ) {
	const tokens = name.split( /[-_]/ ).filter( Boolean );
	const set = [];
	[ name, ...tokens ].forEach( ( t ) => { if ( set.indexOf( t ) === -1 ) { set.push( t ); } } );
	return set.join( ' ' );
}

function ensureDir( d ) { fs.mkdirSync( d, { recursive: true } ); }

/* -------------------------------------------------------------------------- */
/* Build                                                                       */
/* -------------------------------------------------------------------------- */

const catalog = { version: 1, base_url: BASE_URL, packs: {} };

for ( const pack of PACKS ) {
	if ( ! fs.existsSync( pack.dir ) ) {
		console.error( `SKIP ${pack.slug}: source dir missing (${pack.dir})` );
		continue;
	}

	const files = fs.readdirSync( pack.dir ).filter( ( f ) => f.endsWith( '.svg' ) ).sort();
	const icons = {};
	const search = {};

	for ( const file of files ) {
		const name  = file.replace( /\.svg$/, '' );
		const svg   = fs.readFileSync( path.join( pack.dir, file ), 'utf8' );
		const inner = innerFromSvg( svg );
		if ( ! inner ) { continue; }
		icons[ name ]  = inner;
		search[ name ] = keywordsFor( name );
	}

	const count = Object.keys( icons ).length;
	const dest  = path.join( OUT, pack.slug );
	ensureDir( dest );
	fs.writeFileSync( path.join( dest, `${pack.slug}-icons.json` ),  JSON.stringify( icons ) );
	fs.writeFileSync( path.join( dest, `${pack.slug}-search.json` ), JSON.stringify( search ) );

	catalog.packs[ pack.slug ] = {
		title: pack.title,
		slug: pack.slug,
		svg_open: pack.svg_open,
		count,
	};

	console.log( `OK   ${pack.slug.padEnd( 20 )} ${count} icons` );
}

fs.writeFileSync( path.join( ROOT, 'catalog.json' ), JSON.stringify( catalog, null, 2 ) );
console.log( `\ncatalog.json written with ${Object.keys( catalog.packs ).length} packs.` );
