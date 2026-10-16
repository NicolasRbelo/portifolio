---
name: Nicolas Rabelo de Melo — Torre Arcana
description: A fixed-camera 3D arcanist's-tower portfolio, read through a warm candlelight atmosphere instead of a screen.
colors:
  bg: "#0b0914"
  bg-panel: "#140f1d"
  arcane: "#9a7bff"
  arcane-dim: "#4a3a8a"
  arcane-bright: "#cab8ff"
  gold: "#d8ad5a"
  gold-dim: "#8a6a2a"
  ink: "#ecdfc6"
  mirror-accent: "#7fb0ff"
  mirror-border: "#4a7a9a"
  parchment: "#e8d9a8"
typography:
  display:
    fontFamily: "MedievalSharp, cursive"
    fontSize: "clamp(1.8rem, 2.3vw, 2.4rem)"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.02em"
  body:
    fontFamily: "IM Fell English, serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Share Tech Mono, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.08em"
rounded:
  none: "0px"
  pin: "50%"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "26px"
  xl: "56px"
components:
  button-primary:
    backgroundColor: "transparent"
    textColor: "{colors.arcane-bright}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "9px 14px"
  button-primary-hover:
    backgroundColor: "transparent"
    textColor: "{colors.gold}"
    rounded: "{rounded.none}"
    padding: "9px 14px"
  panel-dossier:
    backgroundColor: "{colors.bg-panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "26px 28px 30px"
  chip-tag:
    backgroundColor: "transparent"
    textColor: "{colors.arcane-bright}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "3px 8px"
---

# Design System: Nicolas Rabelo de Melo — Torre Arcana

## Overview

**Creative North Star: "The Arcanist's Night Study"**

The build is a fixed-camera Three.js room at the top of a stone tower — real photographed stone and wood PBR surfaces, a hand-built four-poster bed, a brass-caged crystal orb, a scrying mirror, a grimoire on a lectern — rendered through a hand-rolled post-process composer (bright-pass + two-pass Gaussian blur bloom, warm vignette, gentle candle-flicker, film grain) built from render targets, with no `three/examples/jsm` loaders in the shader path (the few CC0 prop models route through `GLTFLoader` instead). The DOM overlay (recognition boot screen, hotspot labels, dossier panels, corner chrome) never pretends to be a physical object; it reads as handwriting and candlelight laid over the 3D viewport. Arcane purple is the committed interaction color, carried as glow/emissive/text-shadow rather than flat fills; warm gold stands in for candlelight and secondary emphasis. The room's geometry and real-world textures carry color and material; the UI layer carries light and ink.

This is a code-led, near-zero external-asset build: procedural canvas textures and Three.js materials for everything except a handful of CC0 stone/wood photographs and five tiny CC0 prop models (see `ASSETS_CREDITS.md`) — not a visual comp.

**Key Characteristics:**
- Arcane purple glow as the dominant interactive signal; warm gold as the secondary candlelight/CTA accent
- A warm, flicker-and-grain atmosphere composite (no scanlines, no chromatic aberration — this is candlelight, not a CRT) layered over every frame, DOM included
- Flat, zero-radius rectangular UI chrome as the default register, with two confirmed exceptions: the circular hotspot pin and the fully-pill `contato` panel's buttons
- A display/body/label type trio (MedievalSharp display, IM Fell English body, Share Tech Mono label) that reads as "a scholar's hand plus a terminal's precision," never generic system sans
- Each of the four dossier panels is skinned to the object that opened it — the content panel is an extension of the 3D prop, not a reused template

## Colors

A near-black indigo base lit by one cool glow (arcane purple) and one warm one (candle gold); real material color comes from the 3D scene's stone/wood/brass, not from DOM fills.

### Primary
- **Arcane Purple** (`#9a7bff`): the dominant interactive/active color — hotspot pin + glow, link color, boot-log text and its dual-layer glow, panel borders and titles by default (the `projetos` panel keeps this as its own accent). Always delivered as glow/emissive/text-shadow, never as a solid fill.
- **Arcane Dim** (`#4a3a8a`): resting borders and dividers (panel borders, hotspot tag borders, scrollbar thumb, entry rules).
- **Arcane Bright** (`#cab8ff`): readable "lit ink" tone — dossier entry titles, hotspot tag text, button text, link color.

### Secondary
- **Candle Gold** (`#d8ad5a`): secondary accent reserved for hover/focus state and the `contato` panel's own accent (its buttons are gold pills, not purple rectangles) — CV download link, panel `h3` labels, hover border/text on buttons and hotspot tags.
- **Gold Dim** (`#8a6a2a`): muted gold for low-emphasis underlines and the `sobre` panel's own border/kicker color.

### Neutral
- **Near-Black Indigo** (`#0b0914`): page/stage background — night, not a bunker.
- **Panel Indigo** (`#140f1d`): base panel background before the per-hotspot gradient takes over.
- **Parchment Ink** (`#ecdfc6`): default body text color — warm paper, not cool phosphor.

### Named Rules
**The Glow-Not-Fill Rule.** Arcane purple never appears as a flat background or solid button fill. It is always carried by emissive material, box-shadow glow, or text-shadow bloom — light, not paint.

**The Panel-Matches-the-Prop Rule.** A dossier panel's accent color is not always arcane purple: `experiencia` (the scrying mirror) runs cool blue (`#4a7a9a` / `#7fb0ff` / `#bcdcff`), `sobre` (the pinned map) runs warm parchment gold (`#8a6a2a` / `#e8c888`) with its chips rendered as rotated sticky notes, and `contato` (the grimoire) keeps gold but turns its buttons into pills. Only `projetos` (the orb) keeps the default arcane-purple panel treatment. A new panel must pick its accent from the object that opens it, not default to purple by habit.

## Typography

**Display Font:** MedievalSharp (with cursive fallback)
**Body Font:** IM Fell English (with serif fallback)
**Label/Mono Font:** Share Tech Mono (with monospace fallback)

**Character:** A hand-lettered display face for titles and the boot-log ritual text, a legible old-style serif for everything a visitor actually reads, and a crisp technical mono reserved for system chrome (kickers, tags, corner readouts, buttons) — the pairing reads as "a scholar's study with one precise instrument on the desk," not as either pure fantasy-manuscript or pure terminal.

### Hierarchy
- **Display** (400, `clamp(1.8rem, 2.3vw, 2.4rem)` down to a fixed 44px/30px for `h1`/`h2`, line-height ~1.2): boot-log ritual text, panel/dossier titles. Arcane purple by default, gold or blue when the panel's own accent overrides it.
- **Body** (400, 16px, line-height 1.6): dossier panel paragraphs, set in parchment ink.
- **Label** (400, 11–13px, letter-spacing 0.04–0.25em, uppercase where used): terminal-style micro-chrome — scene-chrome corner readouts, panel kickers, tag chips, hotspot tags, button text. Reserved for system/UI text; body copy never runs through it.

### Named Rules
**The Hand-Plus-Instrument Rule.** No system UI sans anywhere in the build. Reading copy always routes through IM Fell English; system chrome always routes through Share Tech Mono; only titles and the boot ritual use MedievalSharp.

## Layout

The experience stage (`#stage`) is a fixed-camera, full-viewport (`100svh`, min-height 560px) 3D canvas with the post-process composite rendered over it; all DOM chrome is absolutely positioned on top (`z-index` 10–50) rather than flowing in normal layout. Corner chrome anchors to the four stage corners; hotspot labels are projected from 3D world coordinates onto 2D screen space every frame and re-positioned absolutely. Dossier panels open as a centered modal (`min(760px, 92vw)`, max-height `min(78vh, 720px)`, internal scroll) over a dimming backdrop. There is no below-the-fold page: every piece of content lives inside a dossier opened from a 3D object, and the CV PDF download is the one fast path out of the 3D experience (corner chrome, always visible) — a durable product decision (PRODUCT.md), not an oversight.

## Elevation & Depth

Depth comes from two sources that don't normally coexist: literal scene lighting (real emissive materials, contact-shadow decals under furniture, bloom) in the 3D layer, and glow-as-elevation in the DOM layer. The one DOM exception is the dossier panel modal, which carries a real `box-shadow` (`0 0 0 1px rgba(154,123,255,0.1), 0 24px 60px rgba(0,0,0,0.6)`) to lift it off the dimmed backdrop.

### Shadow Vocabulary
- **Panel lift** (`box-shadow: 0 0 0 1px rgba(154,123,255,0.1), 0 24px 60px rgba(0,0,0,0.6)`): the dossier modal only.
- **Arcane glow** (`box-shadow: 0 0 8px 2px rgba(154,123,255,0.8)` / `text-shadow: 0 0 8px rgba(154,123,255,0.55)`): hotspot pins and the boot-log text — light-as-depth, not a drop shadow.

### Named Rules
**The Glow-Is-Elevation Rule.** Outside the single dossier-panel modal, DOM depth comes from arcane/gold glow only, never from a generic drop-shadow card system.

## Shapes

Zero border-radius is the DOM default — panels, buttons, chips, and the boot screen are flat rectangles. Two confirmed exceptions: the hotspot-label pin (`border-radius: 50%`, doubles as a glow source) and the `contato` panel's buttons (`border-radius: 999px`, a deliberate pill treatment tied to that one panel's wax-seal character — not a system-wide button shape). In the 3D room, box geometry dominates (walls, desk, lectern, bed frame); circular/toroidal brass forms (the orb's cage and stand, the door ring, the mirror's finial) appear only where the object they represent is actually round.

## Components

### Buttons
- **Shape:** flat rectangle, 0 radius, 1px solid `arcane-dim` border — except inside the `contato` panel, where the same button becomes a `999px`-radius gold pill.
- **Primary (`.btn`, `.panel-close`):** transparent background, `arcane-bright` text, `9px 14px` padding (panel-close: `6px 12px`), Share Tech Mono label sizing (13px).
- **Hover / Focus:** border and text shift to `gold` (the one hover color shared by every panel skin); focus-visible also gets a 3px solid gold outline with 2px offset (`--focus-ring`).

### Chips (`.tag-chip`)
- **Default style:** transparent background, 1px `arcane-dim` border, `arcane-bright` text, 11px label sizing.
- **`sobre` panel override:** no border; instead a solid parchment-toned background (cycling through 6 warm hex values), serif body font, a soft drop shadow, and a small per-chip rotation (`nth-child` cycling ±1–2deg) — the chip becomes a physical sticky note pinned to the map, not a UI tag.

### Cards / Containers (`.panel`, dossier `.entry`)
- **Corner Style:** 0 radius.
- **Background:** base `.panel` uses `linear-gradient(180deg, #1a1322, #0e0a16)`; each panel's `data-theme` attribute overrides this — `projetos` gets a radial purple glow from the top, `experiencia` a cool blue-black gradient, `sobre` a warm brown-black gradient, `contato` a purple-to-indigo gradient. `.entry` has no background, only a 1px left border (accent color follows the panel's own theme) as a log-entry rule.
- **Shadow Strategy:** see Elevation & Depth — the modal panel lift only.
- **Internal Padding:** panel `26px 28px 30px` (18–20px on ≤640px); entries `14px` left padding.

### Navigation (hotspot labels)
- **Style:** a glowing arcane pin dot plus an uppercase mono tag (13px, 0.08em tracking) in a semi-transparent dark pill with an `arcane-dim` border; screen-projected from 3D world anchors every frame, fades in via opacity/transform transition once the intro reveal completes.
- **Hover/Focus:** tag border and text shift to gold, matching the button convention.

### Boot / Recognition Screen (signature component)
Full-viewport overlay that gates the 3D scene: a MedievalSharp ritual log ("GRIMÓRIO DE NICOLAS — RITO DE ABERTURA" … "O SELO SE ABRE" … "SEJA BEM-VINDO À TORRE, VIAJANTE") typed out via `requestAnimationFrame`, with a blinking cursor and a click/key-to-skip hint. On completion the overlay fades and the camera — which opened looking at the tower's closed door — holds a beat, then the door swings open on its hinge in step with the camera's reveal dolly, ending at the wide idle framing with hotspot labels fading in. This recognition beat (not a simple cut or dolly) is the build's one authored motion moment; it is not repeated elsewhere.

## Do's and Don'ts

### Do:
- **Do** carry arcane purple as glow/emissive (text-shadow, box-shadow, material emissive), never as a flat fill — **The Glow-Not-Fill Rule**.
- **Do** let each dossier panel's accent color follow the 3D object that opens it, per **The Panel-Matches-the-Prop Rule** — don't default every new panel to purple.
- **Do** keep all DOM chrome flat and zero-radius, with only the two confirmed exceptions (hotspot pin, `contato` pill buttons) — round forms otherwise belong to brass/hardware silhouettes in the 3D room.
- **Do** route body copy through IM Fell English and system chrome through Share Tech Mono — **The Hand-Plus-Instrument Rule**. Reserve MedievalSharp for titles and the boot ritual only.
- **Do** keep new 3D props and external assets CC0/credited (see `ASSETS_CREDITS.md`) and small — the whole model budget so far is under 300KB.

### Don't:
- **Don't** add a generic drop-shadow card-elevation system; DOM depth outside the dossier modal comes from glow only.
- **Don't** add scanline, chromatic-aberration, or CRT-style post-processing — the atmosphere is candlelight (warm vignette, flicker, grain), not a screen. That identity was explicitly retired when the theme moved from a vault terminal to this tower.
- **Don't** add border-radius to DOM UI chrome beyond the two confirmed exceptions.
- **Don't** introduce new kicker/eyebrow micro-labels beyond the panel kicker already in use; it is a carried build detail, not a pattern to extend.
