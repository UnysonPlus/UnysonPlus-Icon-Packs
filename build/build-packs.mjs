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
	{
		slug: 'remix',
		title: 'Remix Icon',
		dir: path.join( NM, 'remixicon/icons' ),   // nested by category
		svg_open: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="remixicon">',
	},
	{
		slug: 'mdi',
		title: 'Material Design Icons',
		dir: path.join( NM, '@mdi/svg/svg' ),
		svg_open: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="mdi">',
	},
	{
		slug: 'ionicons',
		title: 'Ionicons',
		dir: path.join( NM, 'ionicons/dist/svg' ),
		// Mixed outline/solid: each icon carries its own fill/stroke (currentColor),
		// which the strip preserves; svg_open only supplies a default fill.
		svg_open: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512" fill="currentColor" class="ionicon">',
	},
	{
		slug: 'iconoir',
		title: 'Iconoir',
		dir: path.join( NM, 'iconoir/icons' ),      // nested (regular/solid); first-wins dedupe
		svg_open: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="iconoir">',
	},
	{
		slug: 'boxicons',
		title: 'Boxicons',
		dir: path.join( NM, 'boxicons/svg' ),        // nested (regular/solid/logos); distinct bx-/bxs-/bxl- prefixes
		svg_open: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="bx">',
	},
	{
		slug: 'octicons',
		title: 'Octicons',
		dir: path.join( NM, '@primer/octicons/build/svg' ),
		// Octicons ship per-size files (name-16 / name-24) with matching viewBoxes;
		// take the 16px set only so the viewBox is uniform, and drop the -16 suffix.
		only: /-16\.svg$/,
		nameTransform: ( n ) => n.replace( /-16$/, '' ),
		svg_open: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16" fill="currentColor" class="octicon">',
	},
	{
		slug: 'simple-icons',
		title: 'Simple Icons (Brands)',
		dir: path.join( NM, 'simple-icons/icons' ),
		svg_open: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="simpleicon">',
	},
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Pull the inner markup out of an <svg>…</svg> and normalise it. */
function innerFromSvg( svg ) {
	const m = svg.match( /<svg[^>]*>([\s\S]*?)<\/svg>/i );
	let inner = m ? m[ 1 ] : svg;

	inner = inner
		// Metadata / identifying noise that some sets embed per icon.
		.replace( /<title>[\s\S]*?<\/title>/gi, '' )
		.replace( /<desc>[\s\S]*?<\/desc>/gi, '' )
		.replace( /\s(id|class|aria-hidden|aria-label|data-[a-z-]+|focusable|role)="[^"]*"/gi, '' )
		// Drop ONLY hardcoded colours (hex / rgb). currentColor, none, inherit and
		// transparent are intentional and must survive — several sets (Ionicons,
		// Iconoir) carry per-path currentColor for their outline strokes.
		.replace( /\s(fill|stroke)="(#[0-9a-fA-F]{3,8}|rgba?\([^"]*\))"/gi, '' )
		// Collapse whitespace between/inside tags to single spaces.
		.replace( /\s*[\r\n]+\s*/g, ' ' )
		.replace( /\s{2,}/g, ' ' )
		.replace( />\s+</g, '> <' )
		.trim();

	return inner;
}

/** Recursively collect every .svg under a directory. */
function walkSvgs( dir ) {
	const out = [];
	for ( const entry of fs.readdirSync( dir, { withFileTypes: true } ) ) {
		const full = path.join( dir, entry.name );
		if ( entry.isDirectory() ) { out.push( ...walkSvgs( full ) ); }
		else if ( entry.name.endsWith( '.svg' ) ) { out.push( full ); }
	}
	return out;
}

// Concepts to sample for the card preview strip, in priority order. Icon packs
// match the early (generic) names; brand sets (Simple Icons) fall through to the
// popular brand names near the end.
const SAMPLE_CONCEPTS = [
	'home', 'house', 'heart', 'star', 'user', 'account', 'person', 'settings',
	'cog', 'gear', 'search', 'magnify', 'bell', 'camera', 'calendar', 'mail',
	'envelope', 'image', 'play', 'music', 'check', 'download', 'trash', 'bookmark',
	'github', 'youtube', 'google', 'figma', 'spotify', 'instagram', 'apple', 'x',
];

/** Pick up to n representative icon names from a pack (concepts first, then pad). */
function pickSamples( icons, n = 5 ) {
	const names = Object.keys( icons );
	const set   = new Set( names );
	const out   = [];

	for ( const concept of SAMPLE_CONCEPTS ) {
		if ( out.length >= n ) { break; }
		let hit;
		if ( set.has( concept ) ) {
			hit = concept; // exact name wins (feather "home", simple-icons "github")
		} else {
			// Whole-token match, shortest name preferred — so "bx-home" matches the
			// "home" concept but "homeadvisor" (a single token) never does.
			const cands = names.filter( ( nm ) => ! out.includes( nm ) && nm.split( /[-_]/ ).includes( concept ) );
			hit = cands.sort( ( a, b ) => a.length - b.length )[ 0 ];
		}
		if ( hit && ! out.includes( hit ) ) { out.push( hit ); }
	}
	// Pad with the first alphabetical names if concepts didn't fill the row.
	for ( const nm of names.slice().sort() ) {
		if ( out.length >= n ) { break; }
		if ( ! out.includes( nm ) ) { out.push( nm ); }
	}
	return out;
}

/** A tiny row-of-samples SVG for a pack card, each glyph in the pack's own style. */
function previewSvg( pack, icons, names ) {
	const size = 22, gap = 9;
	const w = names.length * size + ( names.length - 1 ) * gap;

	const cells = names.map( ( nm, i ) => {
		const open = pack.svg_open
			.replace( /\sclass="[^"]*"/, '' )
			.replace( /\swidth="[^"]*"/, '' )
			.replace( /\sheight="[^"]*"/, '' )
			.replace( /^<svg/, `<svg x="${ i * ( size + gap ) }" y="0" width="${ size }" height="${ size }"` );
		return open + icons[ nm ] + '</svg>';
	} ).join( '' );

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ w } ${ size }" width="${ w }" height="${ size }">${ cells }</svg>`;
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

	let files = walkSvgs( pack.dir );
	if ( pack.only ) { files = files.filter( ( f ) => pack.only.test( path.basename( f ) ) ); }
	files.sort();

	const icons  = {};
	const search = {};
	let dupes    = 0;

	for ( const file of files ) {
		let name = path.basename( file ).replace( /\.svg$/, '' );
		if ( pack.nameTransform ) { name = pack.nameTransform( name ); }
		if ( icons[ name ] !== undefined ) { dupes++; continue; } // first-wins across sub-dirs

		const inner = innerFromSvg( fs.readFileSync( file, 'utf8' ) );
		if ( ! inner ) { continue; }
		icons[ name ]  = inner;
		search[ name ] = keywordsFor( name );
	}

	const count = Object.keys( icons ).length;
	const dest  = path.join( OUT, pack.slug );
	ensureDir( dest );
	fs.writeFileSync( path.join( dest, `${pack.slug}-icons.json` ),  JSON.stringify( icons ) );
	fs.writeFileSync( path.join( dest, `${pack.slug}-search.json` ), JSON.stringify( search ) );

	const samples = pickSamples( icons, 5 );

	catalog.packs[ pack.slug ] = {
		title: pack.title,
		slug: pack.slug,
		svg_open: pack.svg_open,
		count,
		preview: previewSvg( pack, icons, samples ),
	};

	console.log( `OK   ${pack.slug.padEnd( 20 )} ${count} icons${dupes ? ` (${dupes} dupes skipped)` : ''} | preview: ${samples.join( ', ' )}` );
}

fs.writeFileSync( path.join( ROOT, 'catalog.json' ), JSON.stringify( catalog, null, 2 ) );
console.log( `\ncatalog.json written with ${Object.keys( catalog.packs ).length} packs.` );
