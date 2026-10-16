---
name: Nicolas Rabelo de Melo — Vault Overseer Terminal
description: A fixed-camera 3D vault-bunker portfolio read through a hand-rolled CRT terminal overlay.
colors:
  phosphor: "#39ff14"
  phosphor-dim: "#1a8f0c"
  phosphor-bright: "#9dffb0"
  amber: "#ffb000"
  amber-dim: "#8c5f00"
  bg: "#05070a"
  bg-panel: "#0a100c"
  ink: "#e9ffe4"
  rust: "#6b4a2b"
typography:
  display:
    fontFamily: "VT323, monospace"
    fontSize: "clamp(1.8rem, 9vw, 5.5rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.02em"
  body:
    fontFamily: "Share Tech Mono, monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Share Tech Mono, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.1em"
rounded:
  none: "0px"
  pin: "50%"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "26px"
  xl: "56px"
components:
  button-primary:
    backgroundColor: "transparent"
    textColor: "{colors.phosphor-bright}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "9px 14px"
  button-primary-hover:
    backgroundColor: "transparent"
    textColor: "{colors.amber}"
    rounded: "{rounded.none}"
    padding: "9px 14px"
  panel-dossier:
    backgroundColor: "{colors.bg-panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "26px 28px 30px"
  chip-tag:
    backgroundColor: "transparent"
    textColor: "{colors.phosphor-bright}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "3px 8px"
---

# Design System: Nicolas Rabelo de Melo — Vault Overseer Terminal

## Overview

**Creative North Star: "The Vault Overseer Terminal"**

The build is a fixed-camera Three.js bunker room — floor stripes, rust-metal pipe conduits, a Vault-Tec stencil plaque, a vault door backdrop — rendered through a hand-rolled CRT composer (bright-pass + two-pass Gaussian blur bloom, scanline, chromatic aberration, vignette, phosphor tint) built from render targets, with no `three/examples/jsm` addons. The DOM overlay (boot screen, hotspot labels, dossier panels, corner chrome, and a plain-HTML résumé fallback below the stage) never pretends to be print or glass; it reads as terminal firmware laid over the 3D viewport. Phosphor green is the committed interaction color, delivered as glow/emissive/text-shadow rather than flat color fills — the room's geometry carries color and material (roughness/metalness), the UI layer carries light.

This is a code-led, no-image-generation build: every token below is read from `src/style.css`'s `:root` custom properties and from the Three.js material/shader source, not from a visual comp.

**Key Characteristics:**
- Phosphor-green glow as the dominant interactive signal; amber as a secondary warning/CTA accent
- CRT post-process (scanline, chromatic aberration, vignette, bloom) layered over every frame, DOM included
- Flat, zero-radius rectangular UI chrome; the 3D room supplies the only curved forms (dials, bezels, rivets)
- Terminal mono/pixel-mono type pairing (VT323 display, Share Tech Mono body/label) with no serif, no gradient fills, no glassmorphism

## Colors

A near-black CRT base lit almost entirely by two glow colors; no neutral grays, no flat color blocks for the accent hues.

### Primary
- **Phosphor Green** (`#39ff14`): the dominant interactive/active color — terminal screen emissive, hotspot pin + glow sprites, boot title with a dual text-shadow bloom, panel border accents. Always delivered as glow/emissive, never as a solid fill.
- **Phosphor Dim** (`#1a8f0c`): borders and dividers (panel borders, hotspot tag borders, scrollbar thumb) — the resting, unlit state of the phosphor hue.
- **Phosphor Bright** (`#9dffb0`): link color, dossier entry titles, hotspot tag text, button text — the readable "lit paper" tone of the same hue family.

### Secondary
- **Amber** (`#ffb000`): secondary accent reserved for hover/focus state and standalone warning-style call-to-actions (CV download links, hover border/text on buttons and hotspot tags, radio-console screen emissive, panel body `h3` labels).
- **Amber Dim** (`#8c5f00`): muted amber for low-emphasis underlines (boot-screen footer links, dotted link borders).

### Neutral
- **Near-Black Bunker** (`#05070a`): page/stage background.
- **Panel Dark** (`#0a100c`): résumé fallback section background.
- **Phosphor Ink** (`#e9ffe4`): default body text color (not pure white — tinted toward the phosphor family).
- **Rust** (`#6b4a2b`): the one warm neutral — résumé `h3` rule border and the rust-metal material color reused across pipe/crate geometry in the 3D room.

### Named Rules
**The Glow-Not-Fill Rule.** Phosphor green never appears as a flat background or solid button fill. It is always carried by emissive material, box-shadow glow, or text-shadow bloom — light, not paint.

## Typography

**Display Font:** VT323 (with monospace fallback)
**Body/Label Font:** Share Tech Mono (with monospace fallback)

**Character:** A rounded, slightly glitchy pixel-terminal display face paired with a crisp technical mono for everything load-bearing — the pairing reads as "firmware," never as an editorial or marketing voice.

### Hierarchy
- **Display** (400, `clamp(1.8rem, 9vw, 5.5rem)` down to a fixed 44px/30px for `h1`/`h2`, line-height 1): boot title, panel/dossier titles, résumé section headers. Always phosphor green with a glow text-shadow on the boot title.
- **Body** (400, 16px, line-height 1.6): dossier panel paragraphs and résumé body copy, capped at `68ch` in the résumé section.
- **Label** (400, 11–13px, letter-spacing 0.08–0.25em, uppercase): terminal-style micro-labels — scene-chrome corner readouts, dossier/résumé section sub-headers (`h3`), tag chips, hotspot tags, button text. This is the terminal-readout convention the whole UI runs on, not a decorative device.

### Named Rules
**The All-Mono Rule.** No serif and no system UI sans anywhere in the build; every text node routes through VT323 or Share Tech Mono.

## Layout

The experience stage (`#stage`) is a fixed-camera, full-viewport (`100svh`, min-height 560px) 3D canvas with the CRT composer rendered over it; all DOM chrome is absolutely positioned on top (`z-index` 10–50) rather than flowing in normal layout. Corner chrome anchors to the four stage corners; hotspot labels are projected from 3D world coordinates onto 2D screen space every frame and re-positioned absolutely. Dossier panels open as a centered modal (`min(760px, 92vw)`, max-height `min(78vh, 720px)`, internal scroll) over a dimming backdrop. Below the 3D stage, a single-column plain-HTML résumé section (`max-width: 760px`) provides a non-3D fast path for accessibility, SEO, and recruiters in a hurry — a durable product constraint (PRODUCT.md "the 3D experience cannot be the only way to get essential information"), not a decorative section.

## Elevation & Depth

This system does not use a conventional card-shadow elevation ladder. Depth is conveyed almost entirely by glow: emissive materials and sprite-based glow halos in the 3D scene, a dual text-shadow bloom on the boot title, and a bright-pass + two-pass-blur bloom composited in the CRT shader itself. The one exception is the dossier panel modal, which carries a literal `box-shadow` (`0 0 0 1px rgba(57,255,20,0.08), 0 24px 60px rgba(0,0,0,0.6)`) to lift it off the dimmed backdrop — a conventional drop-shadow, reserved for that single modal surface.

### Shadow Vocabulary
- **Panel lift** (`box-shadow: 0 0 0 1px rgba(57,255,20,0.08), 0 24px 60px rgba(0,0,0,0.6)`): the dossier modal only.
- **Phosphor glow** (`box-shadow: 0 0 8px 2px rgba(57,255,20,0.8)` / `text-shadow: 0 0 6px rgba(57,255,20,0.65), 0 0 22px rgba(57,255,20,0.35)`): hotspot pins and the boot title — light-as-depth, not a drop shadow.

### Named Rules
**The Glow-Is-Elevation Rule.** Outside the single dossier-panel modal, depth comes from phosphor/amber glow (box-shadow halos, text-shadow bloom, shader bloom), never from a generic drop-shadow card system.

## Shapes

Zero border-radius across the DOM UI — panels, buttons, chips, inputs, and the boot screen are all flat rectangles. The one circular DOM element is the hotspot-label "pin" dot (`border-radius: 50%`), which doubles as a glow source. In the 3D room, box geometry dominates (walls, desks, consoles, crates); circular/toroidal forms (the vault-door wheel and rivet ring, Pip-Boy dial bezel and retention strap, radio tuning dials) appear only where the real-world hardware they represent is round. Flat rectangles are the UI's default register; round forms are reserved for hardware silhouettes in the 3D scene.

## Components

### Buttons
- **Shape:** flat rectangle, 0 radius, 1px solid `phosphor-dim` border.
- **Primary (`.btn`, `.panel-close`):** transparent background, `phosphor-bright` text, `9px 14px` padding (panel-close: `6px 12px`), Share Tech Mono label sizing (13px).
- **Hover / Focus:** border and text shift to `amber`; focus-visible also gets a 3px solid amber outline with 2px offset (`--focus-ring`).

### Chips (`.tag-chip`)
- **Style:** transparent background, 1px `phosphor-dim` border, `phosphor-bright` text, 11px uppercase-weight label sizing, no selected/unselected state — used to list certifications and skill items inline.

### Cards / Containers (`.panel`, dossier `.entry`)
- **Corner Style:** 0 radius.
- **Background:** `.panel` uses a dark green-black gradient (`linear-gradient(180deg, #081209, #04080a)`); `.entry` has no background, only a 1px `phosphor-dim` left border as a log-entry rule.
- **Shadow Strategy:** see Elevation & Depth — the modal panel lift only.
- **Border:** 1px `phosphor-dim` throughout.
- **Internal Padding:** panel `26px 28px 30px` (18–20px on ≤640px); entries `14px` left padding.

### Navigation (hotspot labels)
- **Style:** a glowing pin dot plus an uppercase mono tag (13px, 0.08em tracking) in a semi-transparent dark pill with a `phosphor-dim` border; screen-projected from 3D world anchors every frame, fades in via opacity/transform transition.
- **Hover/Focus:** tag border and text shift to amber, matching the button convention.

### Boot Screen (signature component)
Full-viewport overlay that gates the 3D scene: a tiny uppercase label line, a large glowing VT323 title, an amber subtitle, a blinking `[ PRESSIONE QUALQUER TEKLA ]`-style prompt, and a footer row pairing a SPECIAL-stat Easter egg with the CV download link. Fades out via opacity transition once dismissed.

## Do's and Don'ts

### Do:
- **Do** carry phosphor green as glow/emissive (text-shadow, box-shadow, material emissive), never as a flat fill — **The Glow-Not-Fill Rule**.
- **Do** reserve amber strictly for hover/focus state and secondary CTA/warning emphasis; it is not a co-equal second primary.
- **Do** keep all DOM chrome flat and zero-radius; round forms belong to hardware silhouettes in the 3D room only.
- **Do** route every text node through VT323 (display) or Share Tech Mono (body/label) — **The All-Mono Rule**.

### Don't:
- **Don't** add a generic drop-shadow card-elevation system; depth outside the dossier modal comes from glow only.
- **Don't** introduce new kicker/eyebrow micro-labels beyond the two inherited instances (`.boot-kicker`, `.panel-kicker`). They are a carried build detail, not a system pattern to extend onto new surfaces.
- **Don't** add border-radius to DOM UI chrome beyond the existing circular hotspot pin.
- **Don't** reach for the unused `--danger` (`#ff3b30`) token to invent an error/alert pattern; it is declared but not wired into any shipped component.
