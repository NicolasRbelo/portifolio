import * as THREE from 'three'
import {
  loadSurfaceTextures,
  shadowBlobTexture,
  createWindowView,
  sunPatchTexture,
  lightShaftTexture,
  rugTexture,
  makeGlowSprite,
  posterTexture,
} from './textures.js'
import { createCodeScreen, createGameScreen, createPhoneScreen } from './screenContent.js'

const COLORS = {
  wall: 0x12141f,
  floor: 0x3c2a1a,
  ironDark: 0x1c1c22,
  desk: 0x5a4028,
  deskLeg: 0x2a2015,
  monitor: 0x18181c,
  tower: 0x15151a,
  lamp: 0x1c1c1c,
  bookshelf: 0x3a2a1c,
  shelfTrim: 0x2a2015,
  corkboardFrame: 0x4a3624,
  corkboardSurface: 0xa8865a,
  bedFrame: 0x2a2520,
  headboard: 0x4a4550,
  mattress: 0x3a3a42,
  pillow: 0xa8a8b6,
  blanket: 0x3a4a5a,
  nightstand: 0x3a2a1c,
  phoneBody: 0x1a1a1e,
  windowFrame: 0x242428,
  curtain: 0x2a2440,
  door: 0x8a8478,
  doorKnob: 0x1a1a1a,
  cardboard: 0x8a6a42,
  cardboardTape: 0x6a4e2e,
  book1: 0x7a2a2a,
  book2: 0x2a5a4a,
  book3: 0x2a3a7a,
  neon: 0xff3ec9,
  cyan: 0x4ad9ff,
}

// room shell, so every piece of furniture is placed against a real wall face
const BACK = -3.8
const LEFT = -4.3
const RIGHT = 4.3

function box(w, h, d, color, options = {}) {
  const geo = new THREE.BoxGeometry(w, h, d)
  const mat = new THREE.MeshStandardMaterial({
    color: options.map ? 0xffffff : color,
    map: options.map ?? null,
    normalMap: options.normalMap ?? null,
    roughness: options.roughness ?? 0.8,
    metalness: options.metalness ?? 0.1,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
  })
  return new THREE.Mesh(geo, mat)
}

function cylinder(rt, rb, h, radialSegments, color, options = {}) {
  const geo = new THREE.CylinderGeometry(rt, rb, h, radialSegments)
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.7,
    metalness: options.metalness ?? 0.2,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
  })
  return new THREE.Mesh(geo, mat)
}

function cone(r, h, radialSegments, color, options = {}) {
  const geo = new THREE.ConeGeometry(r, h, radialSegments)
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.6,
    metalness: options.metalness ?? 0.1,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
  })
  return new THREE.Mesh(geo, mat)
}

function place(mesh, x, y, z, ry = 0) {
  mesh.position.set(x, y, z)
  mesh.rotation.y = ry
  return mesh
}

const BOOK_COLORS = [COLORS.book1, COLORS.book2, COLORS.book3, 0x6a5a2a, 0x2a5a6a, 0x5a2a5a]

/** A flat stack of books lying on a surface. */
function addBooks(parent, x, y, z, ry = 0, count = 3) {
  let cy = y
  for (let i = 0; i < count; i += 1) {
    const c = BOOK_COLORS[(i * 5 + count) % BOOK_COLORS.length]
    const h = 0.045 + ((i * 3) % 4) * 0.008
    const w = 0.15 + ((i * 7) % 3) * 0.025
    parent.add(place(box(w, h, 0.13, c, { roughness: 0.75 }), x, cy + h / 2, z, ry + ((i % 3) - 1) * 0.06))
    cy += h
  }
}

/** A row of upright books along +x — deterministic, so the shelves look the
 * same on every visit. */
function addUprightBooks(parent, x0, y, z, span, seed = 0) {
  let x = x0
  let i = seed
  while (x < x0 + span) {
    const w = 0.028 + (i % 5) * 0.006
    const h = 0.2 + ((i * 3) % 7) * 0.012
    parent.add(place(box(w, h, 0.2, BOOK_COLORS[(i * 7) % BOOK_COLORS.length], { roughness: 0.75 }), x + w / 2, y + h / 2, z))
    x += w + 0.004
    i += 1
  }
}

/** An open bookshelf (front faces local +z): back panel, sides, divider and
 * four levels of books, instead of a solid block. */
function buildBookshelf() {
  const g = new THREE.Group()
  const W = 1.2
  const H = 1.8
  const D = 0.34
  g.add(place(box(W, H, 0.02, COLORS.shelfTrim), 0, H / 2, -D / 2 + 0.01))
  ;[-W / 2 + 0.015, 0, W / 2 - 0.015].forEach((x) => g.add(place(box(0.03, H, D, COLORS.bookshelf), x, H / 2, 0)))
  const levels = [0.04, 0.47, 0.9, 1.33, H - 0.015]
  levels.forEach((y) => g.add(place(box(W, 0.03, D, COLORS.bookshelf), 0, y, 0)))
  ;[0, 1, 2, 3].forEach((lvl) => {
    const y = levels[lvl] + 0.015
    addUprightBooks(g, -W / 2 + 0.04, y, 0.01, 0.4 - (lvl % 2) * 0.14, lvl * 3)
    addUprightBooks(g, 0.03, y, 0.01, 0.28 + (lvl % 2) * 0.16, lvl * 5 + 2)
  })
  addBooks(g, 0.42, levels[0] + 0.015, 0.02, 0.1, 3)
  addBooks(g, -0.12, levels[2] + 0.015, 0.02, -0.1, 2)
  // a small figurine and a plant on top
  g.add(place(cylinder(0.035, 0.04, 0.12, 10, COLORS.neon, { roughness: 0.5 }), -0.35, H + 0.06, 0))
  g.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), new THREE.MeshStandardMaterial({ color: 0xe8d9b8, roughness: 0.6 })), -0.35, H + 0.16, 0))
  g.add(place(cylinder(0.06, 0.05, 0.1, 10, 0xb5651d, { roughness: 0.8 }), 0.35, H + 0.05, 0))
  g.add(place(cone(0.09, 0.22, 8, 0x2a7a3a, { roughness: 0.7 }), 0.35, H + 0.2, 0))
  return g
}

/** A framed print hung on a wall; ry turns its face toward the room. */
function addPoster(parent, { x, y, z, ry = 0, w, h, texture }) {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  g.rotation.y = ry
  g.add(box(w + 0.05, h + 0.05, 0.02, 0x141418, { roughness: 0.5 }))
  const art = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.75 }))
  art.position.z = 0.0115
  g.add(art)
  parent.add(g)
  return g
}

/** A wall shelf: a board on two brackets, front facing +z. */
function addWallShelf(parent, x, y, z, width) {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  g.add(box(width, 0.035, 0.2, COLORS.bookshelf, { roughness: 0.8 }))
  ;[-width / 2 + 0.1, width / 2 - 0.1].forEach((bx) => g.add(place(box(0.03, 0.1, 0.16, COLORS.ironDark, { metalness: 0.4 }), bx, -0.065, -0.01)))
  parent.add(g)
  return g
}

/** A simple wheeled office chair — seat, tilted backrest, five-point star base.
 * The backrest sits on the local +z side, so at ry=0 the chair faces -z. */
function addOfficeChair(parent, x, z, ry = 0) {
  const chair = new THREE.Group()
  chair.position.set(x, 0, z)
  chair.rotation.y = ry
  chair.add(place(cylinder(0.02, 0.02, 0.42, 8, COLORS.ironDark, { metalness: 0.5 }), 0, 0.21, 0))
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2
    const leg = place(box(0.22, 0.03, 0.04, COLORS.ironDark, { metalness: 0.5 }), Math.cos(a) * 0.11, 0.02, Math.sin(a) * 0.11)
    leg.rotation.y = a
    chair.add(leg)
    chair.add(place(cylinder(0.022, 0.022, 0.022, 8, 0x0c0c0e), Math.cos(a) * 0.2, 0.011, Math.sin(a) * 0.2))
  }
  chair.add(place(box(0.42, 0.06, 0.42, 0x44444e, { roughness: 0.65 }), 0, 0.44, 0))
  const back = place(box(0.4, 0.5, 0.05, 0x4a4a56, { roughness: 0.55 }), 0, 0.72, 0.19)
  back.rotation.x = THREE.MathUtils.degToRad(8)
  chair.add(back)
  chair.add(place(box(0.4, 0.03, 0.012, COLORS.cyan, { emissive: COLORS.cyan, emissiveIntensity: 0.9 }), 0, 0.95, 0.215))
  parent.add(chair)
}

/** Marks a glow sprite as a lamp (switched off by day) or a screen (always on,
 * just less dominant in daylight), for the day/night system. */
function tagGlow(sprite, kind, glowSprites) {
  sprite.userData.kind = kind
  glowSprites.push(sprite)
  return sprite
}

/** A flat additive quad whose four corners the day/night system moves to
 * follow the sun — used for the shafts of light from the window. */
function makeLightShaft() {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: lightShaftTexture(),
      color: 0xfff0d0,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  )
  mesh.frustumCulled = false
  return mesh
}

/** A soft dark ellipse decal on the floor beneath a piece of furniture — a cheap
 * stand-in for real shadow mapping that grounds every object in the scene. */
function makeContactShadowAdder(group) {
  const texture = shadowBlobTexture()
  return (x, z, w, d, opacity = 0.45, y = 0.0015) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.MultiplyBlending,
        premultipliedAlpha: true,
      }),
    )
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(x, y, z)
    group.add(mesh)
  }
}

/** A simple cardboard moving box — someone who hasn't fully unpacked yet. */
function addCardboardBox(group, x, z, size, ry = 0, y = 0) {
  const b = place(box(size, size, size, COLORS.cardboard, { roughness: 0.95 }), x, y + size / 2, z, ry)
  group.add(b)
  group.add(place(box(size * 0.18, 0.012, size * 1.02, COLORS.cardboardTape, { roughness: 0.6 }), x, y + size + 0.007, z, ry))
  return b
}

/** Builds the developer's room and returns the group, hotspot anchors, and
 * per-surface canvas-texture tick functions (so main.js can animate the
 * "live" screens).
 *
 * Layout, as seen from the wide camera:
 *  back wall  — desk in the left corner, wall-mounted TV, city window, corkboard
 *  left wall  — bookshelf, nightstand with the phone, bed
 *  right wall — dresser, coat hook, the door you came in through
 *  floor      — rug + beanbag in front of the TV, the usual clutter */
export function buildRoom() {
  const group = new THREE.Group()
  const addContactShadow = makeContactShadowAdder(group)
  const hotspots = {}
  const glowSprites = []

  // --- Shell: floor, walls, ceiling ---
  const floorTex = loadSurfaceTextures('wood-floor-color.jpg', 'wood-floor-normal.jpg', 6, 5)
  group.add(place(box(9, 0.2, 8, COLORS.floor, { roughness: 0.85, map: floorTex.map, normalMap: floorTex.normalMap }), 0, -0.1, -1))
  group.add(place(box(9, 3.6, 0.2, COLORS.wall, { roughness: 0.95 }), 0, 1.7, BACK - 0.1))
  group.add(place(box(0.2, 3.6, 8, COLORS.wall, { roughness: 0.95 }), LEFT - 0.1, 1.7, -1))
  // right wall in three pieces around a real doorway (z 0.12..1.68, up to 2.62)
  group.add(place(box(0.2, 3.6, 5.12, COLORS.wall, { roughness: 0.95 }), RIGHT + 0.1, 1.7, -2.44))
  group.add(place(box(0.2, 3.6, 1.32, COLORS.wall, { roughness: 0.95 }), RIGHT + 0.1, 1.7, 2.34))
  group.add(place(box(0.2, 0.88, 1.56, COLORS.wall, { roughness: 0.95 }), RIGHT + 0.1, 3.06, 0.9))
  group.add(place(box(9, 0.15, 8, COLORS.ironDark), 0, 3.5, -1))

  // lamps' emissive materials, dimmed by the day/night system with their lights
  const lampMaterials = []

  // neon LED strip along the top of the back and left walls — the room's
  // signature light, wrapping the corner the desk sits in
  const ledBack = place(box(8.6, 0.04, 0.04, COLORS.neon, { emissive: COLORS.neon, emissiveIntensity: 1.8, roughness: 0.3 }), 0, 3.4, BACK + 0.04)
  const ledLeft = place(box(0.04, 0.04, 6.6, COLORS.neon, { emissive: COLORS.neon, emissiveIntensity: 1.8, roughness: 0.3 }), LEFT + 0.04, 3.4, -0.5)
  group.add(ledBack, ledLeft)
  // switched off, the strip is just a dull plastic channel, not pink
  const ledOff = { base: 1.8, onColor: COLORS.neon, offColor: 0x3a3040 }
  lampMaterials.push({ material: ledBack.material, ...ledOff }, { material: ledLeft.material, ...ledOff })
  const ledGlow = makeGlowSprite('#ff3ec9', 1.1)
  ledGlow.position.set(0, 3.38, BACK + 0.2)
  group.add(ledGlow)
  tagGlow(ledGlow, 'lamp', glowSprites)

  // ============== BACK WALL, LEFT CORNER: DESK + MONITOR + PC -> PROJETOS ==============
  const deskGroup = new THREE.Group()
  deskGroup.position.set(-3.4, 0, BACK + 0.44)
  deskGroup.add(place(box(1.7, 0.08, 0.8, COLORS.desk), 0, 0.78, 0))
  ;[
    [-0.79, -0.34],
    [0.79, -0.34],
    [-0.79, 0.34],
    [0.79, 0.34],
  ].forEach(([x, z]) => deskGroup.add(place(box(0.06, 0.78, 0.06, COLORS.deskLeg, { metalness: 0.3 }), x, 0.39, z)))

  // desktop surface is at y=0.82; everything below sits on it, not in it
  deskGroup.add(place(box(0.1, 0.16, 0.1, COLORS.monitor, { metalness: 0.4, roughness: 0.5 }), 0, 0.9, -0.15))
  deskGroup.add(place(box(0.3, 0.02, 0.2, COLORS.monitor, { metalness: 0.4, roughness: 0.5 }), 0, 0.83, -0.15))
  deskGroup.add(place(box(0.56, 0.36, 0.025, COLORS.monitor, { metalness: 0.3, roughness: 0.4 }), 0, 1.08, -0.18))
  const codeScreen = createCodeScreen()
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), codeScreen.material)
  screen.position.set(0, 1.08, -0.166)
  deskGroup.add(screen)
  const monitorGlowSprite = makeGlowSprite('#4ad9ff', 0.3)
  monitorGlowSprite.position.set(0, 1.08, -0.1)
  deskGroup.add(monitorGlowSprite)
  tagGlow(monitorGlowSprite, 'screen', glowSprites)

  // PC tower on the desk's right end, a thin RGB edge light on its front panel
  deskGroup.add(place(box(0.18, 0.44, 0.42, COLORS.tower, { metalness: 0.3, roughness: 0.4 }), 0.68, 1.04, -0.12))
  deskGroup.add(place(box(0.006, 0.4, 0.01, COLORS.cyan, { emissive: COLORS.cyan, emissiveIntensity: 1.6 }), 0.6, 1.04, 0.095))

  // articulated desk lamp in the back-left corner of the desk
  deskGroup.add(place(cylinder(0.05, 0.06, 0.02, 12, COLORS.lamp, { metalness: 0.5 }), -0.7, 0.83, -0.24))
  const lampArm1 = place(cylinder(0.012, 0.012, 0.26, 6, COLORS.lamp, { metalness: 0.6 }), -0.7, 0.94, -0.24)
  lampArm1.rotation.z = THREE.MathUtils.degToRad(18)
  deskGroup.add(lampArm1)
  const lampArm2 = place(cylinder(0.012, 0.012, 0.22, 6, COLORS.lamp, { metalness: 0.6 }), -0.63, 1.12, -0.18)
  lampArm2.rotation.z = THREE.MathUtils.degToRad(-55)
  deskGroup.add(lampArm2)
  const lampHead = place(cylinder(0.05, 0.07, 0.1, 10, COLORS.lamp, { metalness: 0.5 }), -0.53, 1.04, -0.13)
  lampHead.rotation.x = THREE.MathUtils.degToRad(70)
  deskGroup.add(lampHead)
  const lampGlowSprite = makeGlowSprite('#ffd9a0', 0.32)
  lampGlowSprite.position.set(-0.5, 1.0, -0.1)
  deskGroup.add(lampGlowSprite)
  tagGlow(lampGlowSprite, 'lamp', glowSprites)

  // keyboard, mouse, mug, a small plant and a book stack
  deskGroup.add(place(box(0.44, 0.018, 0.16, 0x1c1c1e, { roughness: 0.6 }), 0, 0.829, 0.2))
  for (let row = 0; row < 3; row += 1) {
    for (let kx = -0.18; kx <= 0.181; kx += 0.04) {
      deskGroup.add(place(box(0.032, 0.01, 0.032, 0x2a2a30, { roughness: 0.5 }), kx, 0.843, 0.155 + row * 0.042))
    }
  }
  deskGroup.add(place(box(0.3, 0.004, 0.24, 0x14141a, { roughness: 0.9 }), 0.36, 0.822, 0.2))
  deskGroup.add(place(box(0.05, 0.016, 0.08, 0x1c1c1e, { roughness: 0.6 }), 0.33, 0.832, 0.22))
  deskGroup.add(place(cylinder(0.035, 0.04, 0.09, 10, 0x2a2a2e), 0.62, 0.865, 0.26))
  deskGroup.add(place(cylinder(0.04, 0.035, 0.06, 10, 0xb5651d, { roughness: 0.8 }), 0.36, 0.85, -0.27))
  deskGroup.add(place(cone(0.055, 0.14, 8, 0x2a7a3a, { roughness: 0.7 }), 0.36, 0.95, -0.27))
  addBooks(deskGroup, -0.38, 0.82, -0.26, 0.15, 3)
  group.add(deskGroup)
  addContactShadow(-3.4, BACK + 0.44, 1.9, 1.0, 0.4)

  // office chair, pulled out at an angle — someone just got up
  addOfficeChair(group, -2.85, -2.35, 0.55)
  addContactShadow(-2.85, -2.35, 0.55, 0.55, 0.35)

  // wall shelf above the desk + a print on the side wall: the corner reads as
  // a real workspace instead of a desk floating in front of an empty wall
  const deskShelf = addWallShelf(group, -3.45, 1.95, BACK + 0.11, 1.1)
  addUprightBooks(deskShelf, -0.48, 0.0175, 0, 0.36, 4)
  deskShelf.add(place(box(0.14, 0.18, 0.1, 0x1c1c22, { roughness: 0.5 }), 0.1, 0.1075, 0))
  deskShelf.add(place(cylinder(0.035, 0.035, 0.012, 16, 0x3a3a44, { metalness: 0.4 }), 0.1, 0.13, 0.051))
  deskShelf.add(place(cylinder(0.04, 0.035, 0.06, 10, 0xb5651d, { roughness: 0.8 }), 0.38, 0.0475, 0))
  deskShelf.add(place(cone(0.06, 0.16, 8, 0x2a7a3a, { roughness: 0.7 }), 0.38, 0.16, 0))
  addPoster(group, {
    x: LEFT + 0.02,
    y: 1.72,
    z: -3.2,
    ry: Math.PI / 2,
    w: 0.48,
    h: 0.66,
    texture: posterTexture({ bg: '#1a0a16', accent: '#ff3ec9', title: 'DEPLOY', subtitle: 'nunca na sexta' }),
  })

  hotspots.projetos = new THREE.Vector3(-3.4, 1.32, BACK + 0.28)
  const projetosHit = place(box(0.8, 0.7, 0.6, 0x000000), -3.4, 1.1, BACK + 0.4)
  projetosHit.visible = false
  projetosHit.userData.hotspot = 'projetos'
  group.add(projetosHit)

  // ============== BACK WALL: WALL-MOUNTED TV + CONSOLE -> EXPERIÊNCIA ==============
  const tvGroup = new THREE.Group()
  tvGroup.position.set(-1.3, 0, BACK + 0.02)
  tvGroup.add(place(box(0.1, 0.34, 0.05, COLORS.ironDark, { metalness: 0.4, roughness: 0.5 }), 0, 1.32, 0.03))
  tvGroup.add(place(box(1.0, 0.6, 0.035, COLORS.monitor, { metalness: 0.3, roughness: 0.4 }), 0, 1.32, 0.07))
  const gameScreen = createGameScreen()
  const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.52), gameScreen.material)
  tvScreen.position.set(0, 1.32, 0.089)
  tvGroup.add(tvScreen)
  const tvGlowSprite = makeGlowSprite('#ff3ec9', 0.3)
  tvGlowSprite.position.set(0, 1.32, 0.14)
  tvGroup.add(tvGlowSprite)
  tagGlow(tvGlowSprite, 'screen', glowSprites)

  // floating shelf under the TV: console, controller, a few game cases
  tvGroup.add(place(box(0.92, 0.04, 0.22, COLORS.bookshelf, { roughness: 0.8 }), 0, 0.78, 0.11))
  ;[-0.4, 0.4].forEach((x) => tvGroup.add(place(box(0.03, 0.08, 0.03, COLORS.shelfTrim), x, 0.73, 0.13)))
  tvGroup.add(place(box(0.2, 0.04, 0.14, 0x1c1c1e, { roughness: 0.5 }), -0.26, 0.82, 0.12))
  tvGroup.add(place(box(0.005, 0.01, 0.06, COLORS.cyan, { emissive: COLORS.cyan, emissiveIntensity: 1.2 }), -0.16, 0.82, 0.12))
  tvGroup.add(place(box(0.12, 0.025, 0.07, 0x2a2a2e, { roughness: 0.5 }), 0.02, 0.8125, 0.14))
  ;[0.2, 0.235, 0.27, 0.305].forEach((x, i) => tvGroup.add(place(box(0.025, 0.17, 0.12, BOOK_COLORS[i + 1], { roughness: 0.75 }), x, 0.885, 0.11)))

  // a small shelf above the TV with a trophy and a couple of figures
  const tvShelf = addWallShelf(tvGroup, 0, 2.15, 0.09, 0.8)
  tvShelf.add(place(cylinder(0.03, 0.05, 0.05, 10, 0xd8b04a, { metalness: 0.6, roughness: 0.35 }), -0.25, 0.0425, 0))
  tvShelf.add(place(cylinder(0.05, 0.02, 0.1, 10, 0xd8b04a, { metalness: 0.6, roughness: 0.35 }), -0.25, 0.1175, 0))
  addUprightBooks(tvShelf, -0.05, 0.0175, 0, 0.16, 9)
  tvShelf.add(place(box(0.08, 0.12, 0.08, COLORS.cyan, { roughness: 0.5 }), 0.25, 0.0775, 0))
  tvShelf.add(place(box(0.06, 0.06, 0.06, 0xe8d9b8, { roughness: 0.6 }), 0.25, 0.1675, 0))
  group.add(tvGroup)

  addPoster(group, {
    x: -2.12,
    y: 1.42,
    z: BACK + 0.01,
    w: 0.34,
    h: 0.47,
    texture: posterTexture({ bg: '#07161c', accent: '#4ad9ff', title: 'LVL UP', subtitle: '+1 XP' }),
  })

  hotspots.experiencia = new THREE.Vector3(-1.3, 1.74, BACK + 0.15)
  const expHit = place(box(1.0, 0.95, 0.4, 0x000000), -1.3, 1.3, BACK + 0.12)
  expHit.visible = false
  expHit.userData.hotspot = 'experiencia'
  group.add(expHit)

  // standing lamp between the TV and the window
  const floorLampGroup = new THREE.Group()
  floorLampGroup.position.set(-0.42, 0, BACK + 0.35)
  floorLampGroup.add(place(cylinder(0.12, 0.14, 0.03, 16, COLORS.ironDark, { metalness: 0.4 }), 0, 0.015, 0))
  floorLampGroup.add(place(cylinder(0.014, 0.014, 1.5, 8, COLORS.ironDark, { metalness: 0.5 }), 0, 0.77, 0))
  floorLampGroup.add(place(cylinder(0.1, 0.16, 0.22, 16, 0xbfb197, { roughness: 0.8 }), 0, 1.58, 0))
  const floorLampGlow = makeGlowSprite('#ffd9a0', 0.34)
  floorLampGlow.position.set(0, 1.55, 0)
  floorLampGroup.add(floorLampGlow)
  tagGlow(floorLampGlow, 'lamp', glowSprites)
  group.add(floorLampGroup)
  addContactShadow(-0.42, BACK + 0.35, 0.6, 0.6, 0.35)

  // ============== BACK WALL CENTER: WINDOW onto the city ==============
  const windowGroup = new THREE.Group()
  windowGroup.position.set(0.8, 1.85, BACK + 0.01)
  windowGroup.add(place(box(1.4, 1.6, 0.06, COLORS.windowFrame, { roughness: 0.6, metalness: 0.3 }), 0, 0, 0.02))
  const windowView = createWindowView()
  const windowGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.26, 1.46), new THREE.MeshBasicMaterial({ map: windowView.texture }))
  windowGlass.position.set(0, 0, 0.055)
  windowGroup.add(windowGlass)
  windowGroup.add(place(box(0.03, 1.46, 0.03, COLORS.windowFrame, { metalness: 0.3, roughness: 0.5 }), 0, 0, 0.07))
  windowGroup.add(place(box(1.26, 0.03, 0.03, COLORS.windowFrame, { metalness: 0.3, roughness: 0.5 }), 0, 0.15, 0.07))
  // sill with a cactus and a can on it
  windowGroup.add(place(box(1.5, 0.04, 0.18, 0x3a3440, { roughness: 0.7 }), 0, -0.82, 0.09))
  windowGroup.add(place(cylinder(0.045, 0.04, 0.07, 10, 0xb5651d, { roughness: 0.8 }), -0.45, -0.765, 0.1))
  windowGroup.add(place(cylinder(0.025, 0.03, 0.12, 8, 0x3a8a4a, { roughness: 0.7 }), -0.45, -0.67, 0.1))
  windowGroup.add(place(cylinder(0.03, 0.03, 0.11, 10, 0xd03a3a, { metalness: 0.5, roughness: 0.4 }), 0.42, -0.745, 0.1))
  // curtain rod + two drawn-back curtains
  windowGroup.add(place(cylinder(0.012, 0.012, 2.0, 8, COLORS.ironDark, { metalness: 0.5 }), 0, 0.92, 0.12))
  windowGroup.children[windowGroup.children.length - 1].rotation.z = Math.PI / 2
  ;[-0.86, 0.86].forEach((cx) => windowGroup.add(place(box(0.3, 2.1, 0.06, COLORS.curtain, { roughness: 0.95 }), cx, -0.15, 0.13)))
  group.add(windowGroup)

  // daytime only: the patch of sun the window throws on the floor, and two faint
  // shafts of light joining them (positioned per sun angle by the ambience system)
  const sunPatch = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: sunPatchTexture(),
      color: 0xffe6b8,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  sunPatch.rotation.x = -Math.PI / 2
  group.add(sunPatch)
  const sunShafts = [makeLightShaft(), makeLightShaft()]
  sunShafts.forEach((shaft) => group.add(shaft))

  // tall plant on the other side of the window
  const tallPlantGroup = new THREE.Group()
  tallPlantGroup.position.set(2.0, 0, BACK + 0.35)
  tallPlantGroup.add(place(cylinder(0.14, 0.12, 0.32, 12, 0xb5651d, { roughness: 0.85 }), 0, 0.16, 0))
  ;[0, 1, 2, 3, 4].forEach((i) => {
    const leaf = place(cone(0.16, 0.5, 8, i % 2 === 0 ? 0x2a7a3a : 0x1f5c2c, { roughness: 0.75 }), 0, 0.55 + i * 0.16, 0)
    leaf.rotation.z = ((i % 3) - 1) * 0.2
    leaf.rotation.x = (((i + 1) % 3) - 1) * 0.2
    tallPlantGroup.add(leaf)
  })
  group.add(tallPlantGroup)
  addContactShadow(2.0, BACK + 0.35, 0.6, 0.6, 0.35)

  // ============== BACK WALL, RIGHT: CORKBOARD -> SOBRE MIM ==============
  const corkGroup = new THREE.Group()
  corkGroup.position.set(3.0, 1.8, BACK + 0.05)
  corkGroup.add(place(box(1.42, 1.12, 0.04, COLORS.corkboardFrame, { roughness: 0.85 }), 0, 0, -0.01))
  // the cork sits proud of the frame so their faces never share a plane
  corkGroup.add(place(box(1.3, 1.0, 0.04, COLORS.corkboardSurface, { roughness: 0.95, metalness: 0 }), 0, 0, 0.012))
  const noteColors = [0xffd866, 0xff9e6d, 0x8fe0c9, 0xffb3d6, 0xa8d4ff, 0xffd866, 0xff9e6d]
  ;[
    [-0.45, 0.28, 0.08],
    [-0.12, 0.31, -0.1],
    [0.22, 0.25, 0.06],
    [-0.47, -0.08, -0.05],
    [-0.15, -0.2, 0.12],
    [0.5, 0.3, -0.06],
    [0.12, -0.02, 0.04],
  ].forEach(([x, y, r], i) => {
    const note = place(box(0.2, 0.15, 0.008, noteColors[i], { roughness: 0.9, metalness: 0 }), x, y, 0.038)
    note.rotation.z = r
    corkGroup.add(note)
    corkGroup.add(place(cylinder(0.012, 0.012, 0.012, 8, i % 2 ? COLORS.neon : COLORS.cyan), x, y + 0.06, 0.046))
    corkGroup.children[corkGroup.children.length - 1].rotation.x = Math.PI / 2
  })
  corkGroup.add(place(box(0.3, 0.22, 0.014, 0x1c1c1e, { roughness: 0.5 }), 0.42, -0.24, 0.04, -0.08))
  corkGroup.add(place(box(0.25, 0.17, 0.02, 0x6a7a8a, { roughness: 0.8 }), 0.42, -0.24, 0.045, -0.08))
  // a printed sheet pinned at the bottom — the board is where the papers live
  corkGroup.add(place(box(0.22, 0.3, 0.006, 0xe8e6f0, { roughness: 0.95 }), -0.38, -0.32, 0.036))
  // wall clock above the board — its hands show the real São Paulo time
  const clock = new THREE.Group()
  clock.position.set(0, 0.76, 0.01)
  clock.add(new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), new THREE.MeshStandardMaterial({ color: 0xff3ec9, roughness: 0.6 })))
  const hourHand = new THREE.Group()
  hourHand.position.z = 0.006
  hourHand.add(place(box(0.009, 0.05, 0.004, 0x0c0c0e), 0, 0.022, 0))
  const minuteHand = new THREE.Group()
  minuteHand.position.z = 0.011
  minuteHand.add(place(box(0.006, 0.075, 0.004, 0x0c0c0e), 0, 0.034, 0))
  clock.add(hourHand, minuteHand)
  clock.add(place(cylinder(0.008, 0.008, 0.01, 10, 0x0c0c0e), 0, 0, 0.012))
  clock.children[clock.children.length - 1].rotation.x = Math.PI / 2
  corkGroup.add(clock)
  // small clip lamp clamped to the frame top, angled down at the notes
  const clipLamp = new THREE.Group()
  clipLamp.position.set(-0.5, 0.56, 0.04)
  clipLamp.add(place(cylinder(0.014, 0.014, 0.2, 8, COLORS.lamp, { metalness: 0.5 }), 0, 0.1, 0))
  const clipHead = place(cylinder(0.03, 0.05, 0.07, 10, COLORS.lamp, { metalness: 0.5 }), 0.03, 0.19, 0.06)
  clipHead.rotation.x = Math.PI / 2.4
  clipLamp.add(clipHead)
  corkGroup.add(clipLamp)
  const corkLampGlow = makeGlowSprite('#ffe0b0', 0.22)
  corkLampGlow.position.set(-0.47, 0.7, 0.12)
  corkGroup.add(corkLampGlow)
  tagGlow(corkLampGlow, 'lamp', glowSprites)
  group.add(corkGroup)

  hotspots.sobre = new THREE.Vector3(3.0, 2.28, BACK + 0.1)
  const sobreHit = place(box(1.5, 1.4, 0.4, 0x000000), 3.0, 1.8, BACK + 0.15)
  sobreHit.visible = false
  sobreHit.userData.hotspot = 'sobre'
  group.add(sobreHit)

  // low bench under the corkboard
  const benchGroup = new THREE.Group()
  benchGroup.position.set(3.0, 0, BACK + 0.17)
  benchGroup.add(place(box(1.3, 0.06, 0.32, COLORS.bookshelf, { roughness: 0.8 }), 0, 0.42, 0))
  ;[-0.6, 0.6].forEach((x) => benchGroup.add(place(box(0.06, 0.42, 0.3, COLORS.shelfTrim), x, 0.21, 0)))
  addBooks(benchGroup, -0.35, 0.45, 0.02, 0.2, 4)
  benchGroup.add(place(box(0.22, 0.12, 0.14, 0x1c1c22, { roughness: 0.5 }), 0.05, 0.51, 0))
  benchGroup.add(place(cylinder(0.05, 0.045, 0.07, 10, 0xb5651d, { roughness: 0.8 }), 0.42, 0.485, 0))
  benchGroup.add(place(cone(0.06, 0.16, 8, 0x2a7a3a, { roughness: 0.7 }), 0.42, 0.6, 0))
  group.add(benchGroup)
  addContactShadow(3.0, BACK + 0.17, 1.4, 0.5, 0.35)

  // still-not-unpacked boxes in the back-right corner
  addCardboardBox(group, 3.98, BACK + 0.32, 0.5, 0.2)
  addCardboardBox(group, 3.98, -2.75, 0.4, -0.3)
  addCardboardBox(group, 3.98, -2.75, 0.3, 0.25, 0.4)
  addContactShadow(3.98, BACK + 0.32, 0.65, 0.65, 0.4)
  addContactShadow(3.98, -2.75, 0.6, 0.6, 0.4)

  // ============== LEFT WALL: BOOKSHELF, between the desk corner and the bed ==============
  const shelfGroup = buildBookshelf()
  shelfGroup.position.set(LEFT + 0.18, 0, -2.18)
  shelfGroup.rotation.y = Math.PI / 2
  group.add(shelfGroup)
  addContactShadow(LEFT + 0.2, -2.18, 0.5, 1.4, 0.4)

  // ============== LEFT WALL: NIGHTSTAND + PHONE -> CONTATO ==============
  const standGroup = new THREE.Group()
  standGroup.position.set(LEFT + 0.32, 0, -1.3)
  standGroup.rotation.y = Math.PI / 2
  standGroup.add(place(box(0.4, 0.5, 0.38, COLORS.nightstand, { roughness: 0.75, metalness: 0.05 }), 0, 0.25, 0))
  standGroup.add(place(box(0.34, 0.015, 0.32, COLORS.shelfTrim), 0, 0.51, 0))
  standGroup.add(place(box(0.3, 0.012, 0.01, COLORS.shelfTrim), 0, 0.3, 0.195))

  const phoneGroup = new THREE.Group()
  phoneGroup.position.set(0.02, 0.53, 0.04)
  phoneGroup.rotation.x = THREE.MathUtils.degToRad(-55)
  phoneGroup.rotation.z = THREE.MathUtils.degToRad(-8)
  phoneGroup.add(place(box(0.1, 0.2, 0.012, COLORS.phoneBody, { metalness: 0.3, roughness: 0.4 }), 0, 0.1, 0))
  const phoneScreenContent = createPhoneScreen()
  const phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.086, 0.18), phoneScreenContent.material)
  phoneScreen.position.set(0, 0.1, 0.007)
  phoneGroup.add(phoneScreen)
  standGroup.add(phoneGroup)
  // charging cable running off the back edge
  standGroup.add(place(box(0.006, 0.006, 0.18, 0xe8e6f0), 0.02, 0.522, -0.08))

  const phoneGlowSprite = makeGlowSprite('#4ade80', 0.22)
  phoneGlowSprite.position.set(0, 0.64, 0.08)
  standGroup.add(phoneGlowSprite)
  tagGlow(phoneGlowSprite, 'screen', glowSprites)

  const nightBook = place(box(0.14, 0.02, 0.1, COLORS.book2, { roughness: 0.75 }), -0.11, 0.525, -0.06, 0.4)
  standGroup.add(nightBook)
  group.add(standGroup)
  addContactShadow(LEFT + 0.32, -1.3, 0.6, 0.6, 0.35)

  hotspots.contato = new THREE.Vector3(LEFT + 0.4, 0.88, -1.3)
  const contatoHit = place(box(0.6, 0.9, 0.6, 0x000000), LEFT + 0.32, 0.6, -1.3)
  contatoHit.visible = false
  contatoHit.userData.hotspot = 'contato'
  group.add(contatoHit)

  // ============== LEFT WALL: BED — headboard against the wall, the long axis
  // running out into the room (built along local z, head at local -z) ==============
  const BED_L = 2.0
  const BED_W = 1.25
  const bedGroup = new THREE.Group()
  bedGroup.position.set(LEFT + BED_L / 2, 0, -0.42)
  bedGroup.rotation.y = Math.PI / 2
  bedGroup.add(place(box(BED_W, 0.22, BED_L, COLORS.bedFrame, { roughness: 0.6, metalness: 0.1 }), 0, 0.15, 0))
  bedGroup.add(place(box(BED_W + 0.06, 0.9, 0.08, COLORS.headboard, { roughness: 0.9 }), 0, 0.45, -BED_L / 2 + 0.04))
  bedGroup.add(place(box(BED_W - 0.06, 0.18, BED_L - 0.12, COLORS.mattress, { roughness: 0.85 }), 0, 0.35, 0.03))
  // duvet pulled up over the lower two-thirds, a bit rumpled
  bedGroup.add(place(box(BED_W - 0.02, 0.07, BED_L * 0.62, COLORS.blanket, { roughness: 0.85 }), 0, 0.47, 0.32))
  const fold = place(box(BED_W - 0.04, 0.05, 0.22, 0x4a5c70, { roughness: 0.85 }), 0, 0.5, -0.02)
  fold.rotation.x = 0.12
  bedGroup.add(fold)
  bedGroup.add(place(box(0.48, 0.11, 0.3, COLORS.pillow, { roughness: 0.8 }), -0.28, 0.5, -0.74, 0.06))
  bedGroup.add(place(box(0.48, 0.11, 0.3, COLORS.pillow, { roughness: 0.8 }), 0.28, 0.5, -0.76, -0.05))
  // a laptop, closed, left on the duvet
  bedGroup.add(place(box(0.34, 0.025, 0.24, 0x8a8a94, { roughness: 0.35, metalness: 0.6 }), 0.15, 0.52, 0.45, 0.4))
  group.add(bedGroup)
  addContactShadow(LEFT + BED_L / 2, -0.42, 2.2, 1.45, 0.38)

  addPoster(group, {
    x: LEFT + 0.02,
    y: 1.45,
    z: -0.75,
    ry: Math.PI / 2,
    w: 0.38,
    h: 0.52,
    texture: posterTexture({ bg: '#1c1306', accent: '#ffb347', title: 'CAFÉ', subtitle: '→ código' }),
  })
  addPoster(group, {
    x: LEFT + 0.02,
    y: 1.45,
    z: -0.1,
    ry: Math.PI / 2,
    w: 0.38,
    h: 0.52,
    texture: posterTexture({ bg: '#061a10', accent: '#4ade80', title: '404', subtitle: 'sono not found' }),
  })

  // laundry basket in the front-left corner
  group.add(place(cylinder(0.22, 0.19, 0.48, 14, 0x6a6a74, { roughness: 0.85 }), LEFT + 0.35, 0.24, 0.85))
  group.add(place(cylinder(0.2, 0.2, 0.06, 14, 0x3a4a5a, { roughness: 0.9 }), LEFT + 0.35, 0.5, 0.85))
  addContactShadow(LEFT + 0.35, 0.85, 0.6, 0.6, 0.35)

  // ============== RIGHT WALL: DRESSER, COAT HOOK, DOOR ==============
  const dresser = new THREE.Group()
  dresser.position.set(RIGHT - 0.25, 0, -1.45)
  dresser.rotation.y = -Math.PI / 2
  dresser.add(place(box(1.1, 0.85, 0.48, COLORS.bookshelf, { roughness: 0.75 }), 0, 0.425, 0))
  ;[0.18, 0.45, 0.72].forEach((y) => {
    dresser.add(place(box(1.0, 0.22, 0.015, 0x4a3624, { roughness: 0.7 }), 0, y, 0.245))
    dresser.add(place(box(0.14, 0.02, 0.025, COLORS.ironDark, { metalness: 0.5 }), 0, y, 0.26))
  })
  dresser.add(place(box(0.2, 0.12, 0.1, 0x1c1c22, { roughness: 0.5 }), -0.36, 0.91, 0))
  dresser.add(place(box(0.006, 0.08, 0.006, COLORS.neon, { emissive: COLORS.neon, emissiveIntensity: 1.2 }), -0.36, 0.91, 0.052))
  // table lamp — the right wall's own warm light source
  dresser.add(place(cylinder(0.06, 0.08, 0.04, 14, COLORS.ironDark, { metalness: 0.4 }), 0.02, 0.87, 0))
  dresser.add(place(cylinder(0.012, 0.012, 0.3, 8, COLORS.ironDark, { metalness: 0.5 }), 0.02, 1.04, 0))
  const dresserShade = place(cylinder(0.1, 0.15, 0.17, 16, 0xbfb197, { roughness: 0.8, emissive: 0xffd9a0, emissiveIntensity: 0.35 }), 0.02, 1.25, 0)
  dresser.add(dresserShade)
  lampMaterials.push({ material: dresserShade.material, base: 0.35 })
  const dresserLampGlow = makeGlowSprite('#ffd9a0', 0.18)
  dresserLampGlow.position.set(0.02, 1.22, 0.02)
  dresser.add(dresserLampGlow)
  tagGlow(dresserLampGlow, 'lamp', glowSprites)
  dresser.add(place(cylinder(0.05, 0.045, 0.08, 10, 0xb5651d, { roughness: 0.8 }), 0.38, 0.89, 0))
  dresser.add(place(cone(0.07, 0.18, 8, 0x2a7a3a, { roughness: 0.7 }), 0.38, 1.02, 0))
  group.add(dresser)

  // acoustic guitar on a floor stand, out in the open stretch by the dresser
  const guitar = new THREE.Group()
  guitar.position.set(3.1, 0, -0.75)
  guitar.rotation.y = -0.55
  const stand = place(box(0.36, 0.03, 0.22, COLORS.ironDark, { metalness: 0.5 }), 0, 0.015, -0.04)
  guitar.add(stand)
  ;[-0.12, 0.12].forEach((x) => {
    const leg = place(cylinder(0.01, 0.01, 0.55, 6, COLORS.ironDark, { metalness: 0.5 }), x, 0.27, -0.1)
    leg.rotation.x = 0.25
    guitar.add(leg)
  })
  const body = new THREE.Group()
  body.position.set(0, 0.08, 0)
  body.rotation.x = -0.2
  const wood = 0xb8733a
  const lowerBout = place(cylinder(0.19, 0.19, 0.09, 20, wood, { roughness: 0.45, metalness: 0.05 }), 0, 0.3, 0)
  lowerBout.rotation.x = Math.PI / 2
  body.add(lowerBout)
  const upperBout = place(cylinder(0.145, 0.145, 0.09, 20, wood, { roughness: 0.45, metalness: 0.05 }), 0, 0.56, 0)
  upperBout.rotation.x = Math.PI / 2
  body.add(upperBout)
  const hole = place(cylinder(0.05, 0.05, 0.004, 16, 0x140c06), 0, 0.5, 0.046)
  hole.rotation.x = Math.PI / 2
  body.add(hole)
  body.add(place(box(0.05, 0.52, 0.03, 0x3a2414, { roughness: 0.6 }), 0, 0.95, 0))
  body.add(place(box(0.085, 0.15, 0.03, 0x1c120a, { roughness: 0.6 }), 0, 1.28, -0.005))
  body.add(place(box(0.03, 0.9, 0.003, 0xd8d0c0, { metalness: 0.6, roughness: 0.3 }), 0, 0.78, 0.047))
  guitar.add(body)
  group.add(guitar)
  addContactShadow(3.1, -0.75, 0.55, 0.45, 0.35)
  addContactShadow(RIGHT - 0.25, -1.45, 0.65, 1.3, 0.38)
  addPoster(group, {
    x: RIGHT - 0.02,
    y: 1.72,
    z: -1.45,
    ry: -Math.PI / 2,
    w: 0.44,
    h: 0.6,
    texture: posterTexture({ bg: '#140a1c', accent: '#ff8fe0', title: '</>', subtitle: 'nicolas.dev' }),
  })

  // hoodie on a hook by the door, sneakers kicked off underneath
  const hoodieGroup = new THREE.Group()
  hoodieGroup.position.set(RIGHT - 0.03, 2.0, -0.42)
  hoodieGroup.rotation.y = -Math.PI / 2
  hoodieGroup.add(place(cylinder(0.014, 0.014, 0.08, 6, COLORS.ironDark, { metalness: 0.5 }), 0, 0, 0.04))
  hoodieGroup.children[0].rotation.x = Math.PI / 2
  const hoodie = place(box(0.34, 0.5, 0.05, 0x3a4a5a, { roughness: 0.85 }), 0, -0.28, 0.07)
  hoodie.rotation.z = THREE.MathUtils.degToRad(3)
  hoodieGroup.add(hoodie)
  group.add(hoodieGroup)
  ;[-0.1, 0.1].forEach((dz, i) => {
    const shoe = new THREE.Group()
    shoe.position.set(RIGHT - 0.35 - i * 0.08, 0, -0.42 + dz)
    shoe.rotation.y = 0.3 + i * 0.5
    shoe.add(place(box(0.09, 0.08, 0.26, 0xe8e2d8, { roughness: 0.6 }), 0, 0.04, 0))
    shoe.add(place(box(0.085, 0.09, 0.1, COLORS.neon, { roughness: 0.6 }), 0, 0.09, -0.07))
    group.add(shoe)
  })
  addContactShadow(RIGHT - 0.38, -0.42, 0.5, 0.45, 0.3)

  // ============== THE DOOR + HALLWAY: the intro starts out here, in front of the
  // closed door; it swings into the room and the camera walks in ==============
  const casing = 0x3a3430
  ;[0.095, 1.705].forEach((z) => group.add(place(box(0.26, 2.66, 0.05, casing, { roughness: 0.7 }), RIGHT + 0.1, 1.33, z)))
  group.add(place(box(0.26, 0.06, 1.66, casing, { roughness: 0.7 }), RIGHT + 0.1, 2.65, 0.9))

  // hinged on its front edge; opens inward, ending flat against the front wall
  // segment, out of the wide shot
  const doorHinge = new THREE.Group()
  doorHinge.position.set(RIGHT + 0.1, 0, 1.655)
  doorHinge.add(place(box(0.045, 2.6, 1.52, COLORS.door, { roughness: 0.6 }), 0, 1.3, -0.76))
  ;[-0.05, 0.05].forEach((dx) => {
    const knob = place(cylinder(0.025, 0.025, 0.06, 10, COLORS.doorKnob, { metalness: 0.6, roughness: 0.3 }), dx, 1.05, -1.36)
    knob.rotation.z = Math.PI / 2
    doorHinge.add(knob)
  })
  // the sign on the hallway side — what the visitor reads before knocking
  const doorSign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.3, 0.41),
    new THREE.MeshStandardMaterial({
      map: posterTexture({ bg: '#140a1c', accent: '#ff3ec9', title: 'NICOLAS', subtitle: 'bata antes' }),
      roughness: 0.7,
    }),
  )
  doorSign.position.set(0.024, 1.55, -0.76)
  doorSign.rotation.y = Math.PI / 2
  doorHinge.add(doorSign)
  group.add(doorHinge)

  const HALL_X = RIGHT + 0.2
  const hallWall = 0x1c1e2a
  group.add(place(box(3.0, 0.2, 3.6, 0x2a2420, { roughness: 0.8 }), HALL_X + 1.5, -0.1, 0.9))
  group.add(place(box(3.0, 0.1, 3.6, 0x16161c), HALL_X + 1.5, 2.9, 0.9))
  group.add(place(box(0.2, 3.2, 3.6, hallWall, { roughness: 0.95 }), HALL_X + 3.1, 1.45, 0.9))
  ;[-1.0, 2.8].forEach((z) => group.add(place(box(3.0, 3.2, 0.2, hallWall, { roughness: 0.95 }), HALL_X + 1.5, 1.45, z)))
  group.add(place(box(0.5, 0.012, 0.9, 0x3a2a22, { roughness: 0.95 }), HALL_X + 0.55, 0.006, 0.9))
  group.add(place(box(0.012, 0.11, 0.07, 0xd8d4cc, { roughness: 0.6 }), HALL_X + 0.006, 1.15, -0.08))
  // ceiling lamp behind where the visitor stands, lighting the door face-on
  group.add(place(cylinder(0.14, 0.14, 0.04, 16, 0xfff0d8, { emissive: 0xffe0b0, emissiveIntensity: 0.6 }), HALL_X + 2.4, 2.83, 0.9))
  const hallGlow = makeGlowSprite('#ffe0b0', 0.3)
  hallGlow.position.set(HALL_X + 2.4, 2.76, 0.9)
  group.add(hallGlow)
  tagGlow(hallGlow, 'hall', glowSprites)

  // at night the room's neon leaks under the door onto the hallway floor
  const doorLeak = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 0.5),
    new THREE.MeshBasicMaterial({
      map: lightShaftTexture(),
      color: COLORS.neon,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  doorLeak.rotation.set(-Math.PI / 2, 0, Math.PI / 2)
  doorLeak.position.set(HALL_X + 0.25, 0.004, 0.9)
  group.add(doorLeak)

  // ============== FLOOR: the gaming spot sits out in the open part of the room
  // (a comfortable distance from the TV), so the foreground isn't bare floor ==============
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2), new THREE.MeshStandardMaterial({ map: rugTexture(), roughness: 0.95 }))
  rug.rotation.set(-Math.PI / 2, 0, Math.PI / 2)
  rug.position.set(-0.55, 0.002, -1.1)
  group.add(rug)

  const beanbag = new THREE.Group()
  beanbag.position.set(-0.95, 0, -1.15)
  const beanbagBody = place(cylinder(0.4, 0.46, 0.4, 16, 0x2a3a5a, { roughness: 0.9 }), 0, 0.18, 0)
  beanbagBody.scale.y = 0.9
  beanbag.add(beanbagBody)
  beanbag.add(place(cylinder(0.3, 0.42, 0.14, 16, 0x24324e, { roughness: 0.9 }), 0, 0.4, 0.04))
  group.add(beanbag)
  addContactShadow(-0.95, -1.15, 1.1, 1.1, 0.4)

  const cushion = place(cylinder(0.28, 0.3, 0.1, 20, 0x5a3a52, { roughness: 0.9 }), -1.8, 0.05, -0.4)
  group.add(cushion)
  addContactShadow(-1.8, -0.4, 0.8, 0.8, 0.3)

  // a wooden crate as a side table: controller, mug, headphones
  group.add(place(box(0.5, 0.34, 0.5, COLORS.cardboard, { roughness: 0.85 }), 0.3, 0.17, -1.45, 0.15))
  group.add(place(box(0.14, 0.03, 0.08, 0x1c1c1e, { roughness: 0.5 }), 0.22, 0.355, -1.4, 0.3))
  group.add(place(cylinder(0.035, 0.04, 0.09, 10, 0xe8e6f0, { roughness: 0.5 }), 0.43, 0.385, -1.53))
  const headphones = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.015, 8, 20, Math.PI), new THREE.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.5 }))
  headphones.position.set(0.35, 0.36, -1.3)
  headphones.rotation.x = -Math.PI / 2
  group.add(headphones)
  addContactShadow(0.3, -1.45, 0.75, 0.75, 0.35)

  // a second controller dropped on the rug, a pizza box, a hoodie on the floor
  group.add(place(box(0.14, 0.03, 0.08, 0x2a2a2e, { roughness: 0.5 }), -0.3, 0.017, -0.45, -0.6))
  const pizza = new THREE.Group()
  pizza.position.set(1.3, 0, -0.2)
  pizza.rotation.y = 0.35
  pizza.add(place(box(0.42, 0.045, 0.42, 0xc8a878, { roughness: 0.9 }), 0, 0.0225, 0))
  pizza.add(place(cylinder(0.12, 0.12, 0.004, 20, 0xc8402a, { roughness: 0.8 }), 0, 0.047, 0))
  group.add(pizza)
  addContactShadow(1.3, -0.2, 0.6, 0.6, 0.3)
  const floorHoodie = place(box(0.46, 0.06, 0.34, 0x4a4a58, { roughness: 0.95 }), -1.5, 0.03, 0.75, 0.5)
  group.add(floorHoodie)
  group.add(place(box(0.16, 0.05, 0.3, 0x4a4a58, { roughness: 0.95 }), -1.24, 0.025, 0.95, 1.2))

  // small bedside rug, where your feet land getting out of bed
  const bedsideRug = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.5), new THREE.MeshStandardMaterial({ color: 0x3a3048, roughness: 0.95 }))
  bedsideRug.rotation.set(-Math.PI / 2, 0, Math.PI / 2)
  bedsideRug.position.set(-3.3, 0.003, 0.75)
  group.add(bedsideRug)

  // backpack dropped by the door, a pair of dumbbells
  const backpack = new THREE.Group()
  backpack.position.set(2.6, 0, 0.95)
  backpack.rotation.y = -0.6
  const bagBody = place(box(0.34, 0.44, 0.2, 0x24324e, { roughness: 0.85 }), 0, 0.22, 0)
  bagBody.rotation.x = -0.12
  backpack.add(bagBody)
  backpack.add(place(box(0.26, 0.18, 0.06, 0x2a3a5a, { roughness: 0.85 }), 0, 0.15, 0.12))
  backpack.add(place(box(0.2, 0.02, 0.005, COLORS.cyan, { emissive: COLORS.cyan, emissiveIntensity: 0.6 }), 0, 0.25, 0.152))
  group.add(backpack)
  addContactShadow(2.6, 0.95, 0.6, 0.5, 0.35)
  ;[0, 0.32].forEach((dz) => {
    const bell = new THREE.Group()
    bell.position.set(2.35, 0, 1.25 + dz)
    bell.rotation.y = 0.25
    const bar = place(cylinder(0.015, 0.015, 0.3, 8, 0x8a8a94, { metalness: 0.7, roughness: 0.3 }), 0, 0.06, 0)
    bar.rotation.z = Math.PI / 2
    bell.add(bar)
    ;[-0.11, 0.11].forEach((x) => {
      const plate = place(cylinder(0.06, 0.06, 0.05, 12, 0x1c1c22, { metalness: 0.4, roughness: 0.5 }), x, 0.06, 0)
      plate.rotation.z = Math.PI / 2
      bell.add(plate)
    })
    group.add(bell)
  })
  addContactShadow(2.35, 1.41, 0.55, 0.7, 0.3)

  const boardGroup = new THREE.Group()
  boardGroup.position.set(1.7, 0, 0.75)
  boardGroup.rotation.y = 1.1
  boardGroup.add(place(box(0.2, 0.025, 0.8, 0xe8584a, { roughness: 0.6 }), 0, 0.075, 0))
  ;[-0.28, 0.28].forEach((dz) => {
    ;[-0.08, 0.08].forEach((dx) => {
      const wheel = place(cylinder(0.035, 0.035, 0.03, 10, 0xe8e2d8, { roughness: 0.4 }), dx, 0.035, dz)
      wheel.rotation.z = Math.PI / 2
      boardGroup.add(wheel)
    })
  })
  group.add(boardGroup)
  addContactShadow(1.7, 0.75, 0.5, 0.9, 0.3)

  const hitboxes = [projetosHit, expHit, sobreHit, contatoHit]

  return {
    group,
    hotspots,
    hitboxes,
    glowSprites,
    doorHinge,
    screenContent: { projetos: codeScreen, experiencia: gameScreen, contato: phoneScreenContent },
    ambience: { windowView, sunPatch, sunShafts, lampMaterials, doorLeak, clock: { hourHand, minuteHand } },
  }
}
