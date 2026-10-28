---
name: Nicolas Rabelo de Melo — Quarto do Dev
description: A fixed-camera 3D developer's bedroom-office, inspired directly by tadao.dev's room and lit by a neon desk-setup glow.
colors:
  bg: "#0a0b14"
  bg-panel: "#10121e"
  neon: "#ff3ec9"
  neon-dim: "#7a2060"
  neon-bright: "#ff8fe0"
  cyan: "#4ad9ff"
  cyan-dim: "#1f6a85"
  amber: "#ffb347"
  amber-dim: "#8a5a1f"
  green: "#4ade80"
  green-dim: "#1f6a42"
  ink: "#e8e6f0"
typography:
  display:
    fontFamily: "JetBrains Mono, monospace"
    fontWeight: 700
    fontSize: "clamp(1.6rem, 4vw, 2.1rem)"
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.04em"
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
    textColor: "{colors.neon-bright}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "9px 14px"
  button-primary-hover:
    backgroundColor: "transparent"
    textColor: "{colors.cyan}"
    rounded: "{rounded.none}"
    padding: "9px 14px"
  panel-dossier:
    backgroundColor: "{colors.bg-panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "26px 28px 30px"
  chip-tag:
    backgroundColor: "transparent"
    textColor: "{colors.neon-bright}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "3px 8px"
---

# Design System: Nicolas Rabelo de Melo — Quarto do Dev

## Overview

**Creative North Star: "The Setup, After Hours"**

The build is a fixed-camera Three.js bedroom-office — a desk tucked into the back-left corner with a modern monitor, PC tower and an articulated desk lamp; a wall-mounted TV over a floating console shelf; a city window; a corkboard thick with real sticky notes under its own clip lamp on the right wall; a phone charging on the nightstand beside the bed; a rug-and-beanbag gaming spot, bookshelf, dresser, guitar and everyday clutter so no part of the frame reads as empty — rendered through a hand-rolled post-process composer (bright-pass + two-pass Gaussian blur bloom, cool vignette, gentle screen-glow flicker, film grain). The DOM overlay (terminal-style boot log, hotspot labels, dossier panels, corner chrome) reads as an extension of the room's own screens, not a costume. Hot-pink neon is the committed interaction color, sourced directly from the room's own LED strip rather than invented for the UI; cyan stands in for monitor/TV glow, warm amber for sticky notes and practical lamp light, green for the phone's messaging glow. This is a direct, studied homage to tadao.dev's "Dev Room" — same point-and-click mechanic, same category of objects (desk/TV/corkboard), re-populated with Nicolas's own real content and his own room's layout.

This is a code-led, near-zero external-asset build: procedural canvas textures and Three.js primitives for every prop (office chair, skateboard, cardboard boxes, plant, Rubik's-cube-style desk clutter) except one CC0 wood-floor photograph (see `ASSETS_CREDITS.md`) — not a visual comp.

**Key Characteristics:**
- Neon pink glow as the dominant interactive signal, sourced from the room's own LED strip — never an invented UI color
- Each dossier panel's accent color matches the screen that opened it: pink for the monitor (Projetos), cyan for the TV (Experiência), warm sticky-note tones for the corkboard (Sobre mim), green for the phone (Contato)
- Flat, zero-radius rectangular UI chrome as the default register, with the contato panel's pill buttons as the one confirmed exception (a messaging-app visual cue)
- A terminal/code type pairing (JetBrains Mono for titles and system chrome, Inter for anything a visitor actually reads) — the pairing reads as "a working dev's portfolio," not a gimmick
- The intro is one authored moment: the visitor stands in the hallway facing the closed door ("NICOLAS — bata antes"), holds a beat, the door swings into the room, and the camera walks through the doorway, turns toward the room and backs out to the wide framing
- The room keeps São Paulo's real clock: at night the LED strip and lamps are on and the window shows the lit city under a moon; by day the lamps are off, the sun crosses the window and throws a patch of light on the floor; dawn and dusk go golden with the lamps half on. The wall clock and the `SÃO PAULO-SP · hh:mm` corner show the same time (`?hora=14` pins any hour for previews)
- The hotspots are spread over three walls (Contato on the left, Projetos in the back-left corner, Experiência on the back wall, Sobre mim on the right), and the visitor can look around: dragging orbits the room from its open side (sideways turns are capped so a side wall never swings in front of the lens), dragging up rises to an overhead view with the ceiling hidden, arrow keys do the same, and a `VISÃO DE CIMA` / `VISÃO FRONTAL` button toggles between the two. Closing a panel returns to wherever the visitor was looking
- Portrait screens (phones, tablets upright) get their own calmer framing instead of the whole room squeezed into a thin strip: a steeper ¾ view from above with a 58° field of view that rests on the desk-and-TV corner; swiping pans across the room one wall at a time (bed and phone ← → corkboard). Labels whose object is off-screen shrink to small, dimmed edge arrows that stack instead of overlapping, so only what's in view gets a full label

## Colors

A near-black indigo-navy base lit by one cool magenta glow (the LED strip) and several smaller practical/screen glows; no neutral grays as a design choice — every light source in the room has a real-world reason to be the color it is.

### Primary
- **Neon Pink** (`#ff3ec9`): the dominant interactive/active color — hotspot pin + glow, boot-log text, the `projetos` panel's own accent, link color. Sourced from the room's LED strip, chandelier-glow, and monitor-adjacent PC RGB accent — always delivered as glow/emissive, never as a flat fill.
- **Neon Dim** (`#7a2060`): resting borders and dividers.
- **Neon Bright** (`#ff8fe0`): readable "lit" text tone — entry titles, hotspot tag text, button text.

### Secondary
- **Cyan** (`#4ad9ff`): the monitor/TV screen-glow color — `experiencia` panel's own accent, hover state, secondary emphasis.
- **Amber** (`#ffb347`): the desk lamp's warm practical light and the `sobre` panel's sticky-note accent.
- **Green** (`#4ade80`): the phone's messaging-app glow and the `contato` panel's own accent, including its pill-shaped buttons.

### Neutral
- **Near-Black Indigo** (`#0a0b14`): page/stage background — a room at night, lit only by its own fixtures and screens.
- **Panel Indigo** (`#10121e`): base panel background before the per-hotspot gradient takes over.
- **Soft White Ink** (`#e8e6f0`): default body text color.

### Named Rules
**The Glow-Not-Fill Rule.** Neon pink never appears as a flat background or solid button fill. It is always carried by emissive material, box-shadow glow, or text-shadow bloom — light, not paint.

**The Panel-Matches-the-Screen Rule.** A dossier panel's accent color is the color of the screen that opened it: monitor=pink, TV=cyan, corkboard=warm sticky-note tones, phone=green. A new panel picks its accent from its object's own light, never defaults to pink by habit.

## Typography

**Display Font:** JetBrains Mono (bold, with monospace fallback)
**Body Font:** Inter (with sans-serif fallback)
**Label/Mono Font:** JetBrains Mono (with monospace fallback — same family as Display)

**Character:** The same programming font doing double duty as both headline voice and system chrome (titles, kickers, tags, buttons all in JetBrains Mono) paired with a clean, highly legible sans for anything a recruiter actually has to read (Inter). The pairing is deliberately "this person's actual tools," not a themed costume.

### Hierarchy
- **Display** (700, `clamp(1.6rem, 4vw, 2.1rem)`, line-height ~1.2): boot-log text, panel/dossier titles. Neon pink by default, overridden by the panel's own accent.
- **Body** (400, 16px, line-height 1.6): dossier panel paragraphs, set in soft white ink.
- **Label** (400, 11–13px, letter-spacing 0.02–0.2em, uppercase where used): terminal-style system chrome — corner readouts, panel kickers, tag chips, hotspot tags, button text.

### Named Rules
**The One-Font-Two-Jobs Rule.** JetBrains Mono is both the Display and Label font — there is no separate "fantasy" or "decorative" face anywhere in the build. Inter is the only other font, reserved strictly for reading copy.

## Layout

The experience stage (`#stage`) is a fixed-camera, full-viewport (`100svh`, min-height 560px) 3D canvas with the post-process composite rendered over it; all DOM chrome is absolutely positioned on top (`z-index` 10–50). Hotspot labels are projected from 3D world coordinates onto 2D screen space every frame; their world anchors are deliberately spaced apart (not just their physical props) so labels never visually collide even on narrower viewports — a layout constraint discovered and fixed during build, not a coincidence. Dossier panels open as a centered modal (`min(760px, 92vw)`, max-height `min(78vh, 720px)`, internal scroll) over a dimming backdrop.

## Elevation & Depth

Depth comes from real scene lighting (emissive materials, contact-shadow decals under every piece of furniture, bloom) in the 3D layer, and glow-as-elevation in the DOM layer. The one DOM exception is the dossier panel modal, which carries a real `box-shadow` (`0 0 0 1px rgba(255,62,201,0.1), 0 24px 60px rgba(0,0,0,0.6)`) to lift it off the dimmed backdrop.

### Shadow Vocabulary
- **Panel lift** (`box-shadow: 0 0 0 1px rgba(255,62,201,0.1), 0 24px 60px rgba(0,0,0,0.6)`): the dossier modal only.
- **Neon glow** (`box-shadow: 0 0 8px 2px rgba(255,62,201,0.8)` / `text-shadow: 0 0 8px rgba(255,62,201,0.45)`): hotspot pins and the boot-log text.

### Named Rules
**The Glow-Is-Elevation Rule.** Outside the single dossier-panel modal, DOM depth comes from neon/cyan/amber/green glow only, never from a generic drop-shadow card system.

## Shapes

Zero border-radius is the DOM default. One confirmed exception: the `contato` panel's buttons (`border-radius: 999px`) and its message form's fields (`border-radius: 14px`, like chat bubbles), deliberate shapes tied to its messaging-app character — not a system-wide button or input shape. In the 3D room, box geometry dominates (desk, TV shelf, bookshelf, bed, nightstand, dresser); round forms (wheels, the clock face, the lamp's cylindrical joints, the office chair's star base) appear only where the real object they represent is actually round.

## Components

### Buttons
- **Shape:** flat rectangle, 0 radius, 1px solid `neon-dim` border — except inside the `contato` panel, where it becomes a `999px`-radius green pill.
- **Primary (`.btn`, `.panel-close`):** transparent background, `neon-bright` text, `9px 14px` padding (panel-close: `6px 12px`).
- **Hover / Focus:** border and text shift to `cyan`; focus-visible gets a 3px solid neon outline with 2px offset.

### Chips (`.tag-chip`)
- **Default style:** transparent background, 1px `neon-dim` border, `neon-bright` text.
- **`sobre` panel override:** solid Post-it-colored background (yellow/orange/mint/pink/blue, cycling), dark text, a soft drop shadow, and a small per-chip rotation — a real sticky note, not a UI tag.

### Cards / Containers (`.panel`, dossier `.entry`)
- **Corner Style:** 0 radius.
- **Background:** base `.panel` uses `linear-gradient(180deg, #16111f, #0c0a14)`; each panel's `data-theme` attribute overrides this to match its screen (pink radial glow for `projetos`, cyan-black for `experiencia`, warm brown-black for `sobre`, green-black for `contato`).
- **Shadow Strategy:** see Elevation & Depth.
- **Internal Padding:** panel `26px 28px 30px` (18–20px on ≤640px); entries `14px` left padding.

### Navigation (hotspot labels)
- **Style:** a glowing neon pin dot plus an uppercase mono tag in a semi-transparent dark pill with a `neon-dim` border; screen-projected every frame, fades in once the door-opening reveal completes. On narrow (portrait) screens a label whose object falls outside the frame is pinned to the nearest edge with a `←`/`→` arrow, so every hotspot stays reachable.
- **Hover/Focus:** tag border and text shift to cyan.

### Boot / Recognition Screen (signature component)
Full-viewport overlay that gates the 3D scene: a JetBrains Mono terminal log (`nicolas@portfolio ~ % ./entrar.sh` … `ACESSO LIBERADO` … `BEM-VINDO, A PORTA JÁ ESTÁ ABRINDO`) typed out via `requestAnimationFrame`. One log line reflects the hour (`Acendendo as luzes` at night, `Abrindo as cortinas` by day). On completion the overlay fades onto the hallway, the camera holds a beat on the closed door, the door swings into the room, and the camera walks in along a curved path, ending at the wide idle framing with hotspot labels fading in. With `prefers-reduced-motion`, the walk is skipped and the room opens directly on the wide framing.

## Do's and Don'ts

### Do:
- **Do** carry neon pink as glow/emissive, never as a flat fill — **The Glow-Not-Fill Rule**.
- **Do** let each dossier panel's accent follow the screen that opens it, per **The Panel-Matches-the-Screen Rule**.
- **Do** keep all DOM chrome flat and zero-radius, with only the `contato` pill-button exception.
- **Do** route titles/chrome through JetBrains Mono and reading copy through Inter — **The One-Font-Two-Jobs Rule**.
- **Do** ground every new 3D prop with its own contact-shadow decal and check its hotspot label's screen position doesn't collide with a neighbor's, especially on narrower/taller viewports.

### Don't:
- **Don't** add a generic drop-shadow card-elevation system; DOM depth outside the dossier modal comes from glow only.
- **Don't** reintroduce fantasy, CRT-scanline, or candlelight imagery — this build's whole identity is "a real room, lit by its own real fixtures."
- **Don't** add border-radius to DOM UI chrome beyond the one confirmed `contato` exception.
- **Don't** fabricate resume content to fill a prop (e.g. the corkboard's notes and the TV's "level" framing use only real skills/experience already in `content/data.js`).
