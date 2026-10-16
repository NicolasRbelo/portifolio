import * as THREE from 'three'
import {
  arcaneSealTexture,
  runeBorderTexture,
  starMapTexture,
  rugTexture,
  loadSurfaceTextures,
  shadowBlobTexture,
  nightSkyTexture,
  lightShaftTexture,
  dustTexture,
  makeGlowSprite,
} from './textures.js'
import { createOrbVision, createMirrorVision, createGrimoireVision } from './screenContent.js'
import { loadModel } from './models.js'

const COLORS = {
  stoneDark: 0x241f1a,
  stoneLight: 0x3a322a,
  floor: 0x3c2a1a,
  iron: 0x4a443a,
  ironDark: 0x2a251f,
  brass: 0xb08d4f,
  desk: 0x4a3420,
  doorWood: 0x4a3420,
  ironBand: 0x3a342c,
  mapFrame: 0x2c2015,
  mapBoard: 0x4a3624,
  paper: 0xe8d9a8,
  grimoireCover: 0x3a2a3a,
  chain: 0x4a463c,
  shelfWood: 0x3a2a1c,
  bedFrame: 0x3a2a1c,
  mattress: 0x5a4a38,
  pillow: 0x9a8a68,
  book1: 0x6b2a2a,
  book2: 0x2a4a3a,
  book3: 0x3a2a6b,
  candleWax: 0xe8d9b0,
  flame: 0xffb84d,
}

function box(w, h, d, color, options = {}) {
  const geo = new THREE.BoxGeometry(w, h, d)
  const mat = new THREE.MeshStandardMaterial({
    color: options.map ? 0xffffff : color,
    map: options.map ?? null,
    normalMap: options.normalMap ?? null,
    roughness: options.roughness ?? 0.8,
    metalness: options.metalness ?? 0.15,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.castShadow = false
  mesh.receiveShadow = false
  return mesh
}

function cylinder(rt, rb, h, radialSegments, color, options = {}) {
  const geo = new THREE.CylinderGeometry(rt, rb, h, radialSegments)
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.7,
    metalness: options.metalness ?? 0.4,
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
    metalness: options.metalness ?? 0.3,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    side: options.side ?? THREE.FrontSide,
  })
  return new THREE.Mesh(geo, mat)
}

function torus(radius, tube, radial, tubular, arc, color, options = {}) {
  const geo = new THREE.TorusGeometry(radius, tube, radial, tubular, arc)
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.6,
    metalness: options.metalness ?? 0.5,
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

const BOOK_COLORS = [COLORS.book1, COLORS.book2, COLORS.book3, 0x8a6a2a, 0x2a3a5a, 0x5a2a4a]

function addBooks(group, x, y, z, ry = 0, count = 3) {
  let cy = y
  for (let i = 0; i < count; i += 1) {
    const c = BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)]
    const h = 0.045 + Math.random() * 0.025
    const w = 0.15 + Math.random() * 0.05
    const book = place(box(w, h, 0.11 + Math.random() * 0.03, c, { roughness: 0.75 }), x, cy + h / 2, z, ry + (Math.random() - 0.5) * 0.12)
    group.add(book)
    cy += h
  }
}

/** Loads a small CC0 prop model (see ASSETS_CREDITS.md) into the room, fire-and-forget
 * since the files are tiny (<60KB) and this only ever runs once at scene build time. */
function addModel(group, file, { x, y = 0, z, ry = 0, scale = 1 } = {}) {
  loadModel(file).then((model) => {
    model.position.set(x, y, z)
    model.rotation.y = ry
    model.scale.setScalar(scale)
    group.add(model)
  })
}

/** A small iron wall sconce holding a lit candle — the room's hanging-chain/pipe
 * read, reskinned as a torch bracket. Returns the flame glow sprite so main.js's
 * flicker loop can animate it with the rest. */
function addSconce(group, x, y, z) {
  const sconceGroup = new THREE.Group()
  sconceGroup.position.set(x, y, z)
  sconceGroup.add(place(box(0.05, 0.05, 0.16, COLORS.ironDark, { metalness: 0.6, roughness: 0.4 }), 0, 0, 0.08))
  sconceGroup.add(place(cylinder(0.035, 0.045, 0.12, 8, COLORS.candleWax, { roughness: 0.6, metalness: 0 }), 0, 0.09, 0.16))
  const flame = place(
    cone(0.025, 0.07, 8, COLORS.flame, { emissive: COLORS.flame, emissiveIntensity: 1.4, roughness: 0.3 }),
    0,
    0.19,
    0.16,
  )
  sconceGroup.add(flame)
  const glowSprite = makeGlowSprite('#ffb84d', 0.3)
  glowSprite.position.set(0, 0.17, 0.16)
  sconceGroup.add(glowSprite)
  group.add(sconceGroup)
  return glowSprite
}

/** Motes of dust drifting through the moonbeam — a handful of additive sprites with
 * gentle per-point drift, updated once per frame from main.js's animation loop. */
function createDustField() {
  const count = 70
  const bounds = { x: [1.8, 4.2], y: [0.4, 2.9], z: [-2.2, 2.2] }
  const positions = new Float32Array(count * 3)
  const speeds = new Float32Array(count)
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = bounds.x[0] + Math.random() * (bounds.x[1] - bounds.x[0])
    positions[i * 3 + 1] = bounds.y[0] + Math.random() * (bounds.y[1] - bounds.y[0])
    positions[i * 3 + 2] = bounds.z[0] + Math.random() * (bounds.z[1] - bounds.z[0])
    speeds[i] = 0.035 + Math.random() * 0.05
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({
    map: dustTexture(),
    size: 0.028,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  })
  const points = new THREE.Points(geometry, material)
  let elapsed = 0

  function update(delta) {
    elapsed += delta
    const pos = geometry.attributes.position
    for (let i = 0; i < count; i += 1) {
      let y = pos.getY(i) + speeds[i] * delta
      if (y > bounds.y[1]) y = bounds.y[0]
      const sway = Math.sin(elapsed * 0.6 + i) * 0.002
      pos.setY(i, y)
      pos.setX(i, pos.getX(i) + sway)
    }
    pos.needsUpdate = true
  }

  return { points, update }
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

/** Builds the arcanist's tower room and returns the group, hotspot anchors, and
 * per-surface canvas-texture tick functions (so main.js can animate the "live"
 * magical surfaces). */
export function buildRoom() {
  const group = new THREE.Group()
  const addContactShadow = makeContactShadowAdder(group)

  // --- Shell: floor, back wall, side walls ---
  const floorTex = loadSurfaceTextures('wood-floor-color.jpg', 'wood-floor-normal.jpg', 6, 5)
  const floor = place(box(9, 0.2, 8, COLORS.floor, { roughness: 0.85, map: floorTex.map, normalMap: floorTex.normalMap }), 0, -0.1, -1)
  group.add(floor)

  // worn rug, the room's warm focal patch over the wood floor
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 3.1), new THREE.MeshStandardMaterial({ map: rugTexture(), roughness: 0.95 }))
  rug.rotation.x = -Math.PI / 2
  rug.position.set(-3.15, 0.002, 1.6)
  group.add(rug)

  const wallTexBack = loadSurfaceTextures('stone-wall-color.jpg', 'stone-wall-normal.jpg', 5, 2)
  const backWall = place(box(9, 3.6, 0.2, COLORS.stoneDark, { map: wallTexBack.map, normalMap: wallTexBack.normalMap }), 0, 1.7, -3.9)
  group.add(backWall)
  const wallTexSide = loadSurfaceTextures('stone-wall-color.jpg', 'stone-wall-normal.jpg', 4, 2)
  const leftWall = place(box(0.2, 3.6, 8, COLORS.stoneDark, { map: wallTexSide.map, normalMap: wallTexSide.normalMap }), -4.4, 1.7, -1, 0)
  group.add(leftWall)
  const rightWall = place(box(0.2, 3.6, 8, COLORS.stoneDark, { map: wallTexSide.map, normalMap: wallTexSide.normalMap }), 4.4, 1.7, -1, 0)
  group.add(rightWall)
  const ceilingTrim = place(box(9, 0.15, 8, COLORS.ironDark), 0, 3.5, -1)
  group.add(ceilingTrim)

  // wall sconces, replacing the old pipe conduits — flickering candlelight along the back wall
  const sconceGlows = [addSconce(group, -1.9, 2.2, -3.75), addSconce(group, 2.4, 2.2, -3.75)]

  // arched window on the right wall — this is the top of the tower, not a cellar:
  // the city of Arton sleeps far below, moonlight and night air pour in
  const windowGroup = new THREE.Group()
  windowGroup.position.set(4.3, 2.05, 0.6)
  windowGroup.add(place(box(0.12, 1.75, 1.35, COLORS.stoneDark, { roughness: 0.9 }), -0.06, 0, 0))
  // brass bezel as a thin border around the opening (not a solid panel), set behind
  // the glass plane so it frames it instead of occluding it from the camera's side
  ;[
    [0.725, 0, 1.1, 0.05],
    [-0.725, 0, 1.1, 0.05],
    [0, 0.525, 0.05, 1.5],
    [0, -0.525, 0.05, 1.5],
  ].forEach(([ly, lz, width, height]) => {
    windowGroup.add(place(box(0.06, height, width, COLORS.brass, { metalness: 0.35, roughness: 0.5 }), -0.07, ly, lz))
  })
  const windowGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.4), new THREE.MeshBasicMaterial({ map: nightSkyTexture() }))
  windowGlass.position.set(-0.14, 0, 0)
  windowGlass.rotation.y = -Math.PI / 2
  windowGroup.add(windowGlass)
  // a thin stone mullion crossing the glass, standard arcane-tower glazing
  windowGroup.add(place(box(0.03, 1.4, 0.03, COLORS.stoneDark), -0.13, 0, 0))
  group.add(windowGroup)

  // moonbeam falling across the floor from the window
  const lightShaft = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 3.2),
    new THREE.MeshBasicMaterial({
      map: lightShaftTexture(),
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  lightShaft.position.set(2.9, 1.5, 0.6)
  lightShaft.rotation.z = THREE.MathUtils.degToRad(12)
  lightShaft.rotation.y = Math.PI / 2
  group.add(lightShaft)

  const dustField = createDustField()
  group.add(dustField.points)

  // arcane seal plaque above the door
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 0.82),
    new THREE.MeshBasicMaterial({ map: arcaneSealTexture('TORRE ARCANA', 'NICOLAS, O ARCANISTA') }),
  )
  plaque.position.set(0.6, 2.85, -3.77)
  group.add(plaque)

  // carved rune border beside the door
  const runes = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.22), new THREE.MeshBasicMaterial({ map: runeBorderTexture() }))
  runes.position.set(-1.35, 1.0, -3.78)
  group.add(runes)

  // map of Arton, left wall
  const map = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.85), new THREE.MeshBasicMaterial({ map: starMapTexture() }))
  map.position.set(-4.28, 2.05, -0.4)
  map.rotation.y = Math.PI / 2
  group.add(map)

  // --- Iron-banded wooden door (decorative backdrop) ---
  const doorFrame = place(box(1.8, 2.9, 0.1, COLORS.stoneDark, { roughness: 0.9 }), 0.6, 1.3, -3.79)
  group.add(doorFrame)
  const doorPanel = place(box(1.5, 2.6, 0.1, COLORS.doorWood, { roughness: 0.75 }), 0.6, 1.25, -3.74)
  group.add(doorPanel)
  ;[0.35, 1.25, 2.15].forEach((y) => {
    group.add(place(box(1.5, 0.12, 0.04, COLORS.ironBand, { metalness: 0.6, roughness: 0.4 }), 0.6, y, -3.68))
    for (let x = -0.6; x <= 0.6; x += 0.3) {
      group.add(place(box(0.05, 0.05, 0.06, COLORS.brass, { metalness: 0.7, roughness: 0.3 }), 0.6 + x, y, -3.655))
    }
  })
  const doorRing = torus(0.14, 0.03, 10, 20, Math.PI * 2, COLORS.brass, { metalness: 0.75, roughness: 0.25 })
  doorRing.position.set(0.6, 1.25, -3.65)
  group.add(doorRing)

  // iron chandelier, hanging from the ceiling
  const chandelierGroup = new THREE.Group()
  chandelierGroup.position.set(-0.4, 0, 0.8)
  chandelierGroup.add(place(cylinder(0.015, 0.015, 0.35, 6, COLORS.chain, { metalness: 0.6 }), 0, 3.33, 0))
  const chandelierRing = torus(0.35, 0.025, 8, 20, Math.PI * 2, COLORS.brass, { metalness: 0.7, roughness: 0.3 })
  chandelierRing.position.set(0, 3.1, 0)
  chandelierRing.rotation.x = Math.PI / 2
  chandelierGroup.add(chandelierRing)
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2
    const cx = Math.cos(angle) * 0.35
    const cz = Math.sin(angle) * 0.35
    chandelierGroup.add(place(cylinder(0.03, 0.035, 0.1, 8, COLORS.candleWax, { roughness: 0.6, metalness: 0 }), cx, 3.15, cz))
    chandelierGroup.add(
      place(cone(0.022, 0.06, 8, COLORS.flame, { emissive: COLORS.flame, emissiveIntensity: 1.4, roughness: 0.3 }), cx, 3.22, cz),
    )
  }
  const chandelierGlow = makeGlowSprite('#ffb84d', 0.6)
  chandelierGlow.position.set(0, 3.12, 0)
  chandelierGroup.add(chandelierGlow)
  group.add(chandelierGroup)
  const fixtureGlow = chandelierGlow

  // crates / barrel / travel chest, tucked into the back-right corner as a storage
  // nook — clear of the map-board camera's sightline and of the lectern beyond
  addModel(group, 'crate.glb', { x: 3.9, y: 0.526, z: -3.3, ry: 0.3 })
  addModel(group, 'barrel.glb', { x: 3.5, y: 0.4, z: -2.3, ry: 1.1 })
  addModel(group, 'chest.glb', { x: 3.3, z: -1.3, ry: -0.6, scale: 0.9 })
  addContactShadow(3.9, -3.3, 0.65, 0.65, 0.4)
  addContactShadow(3.5, -2.3, 0.6, 0.6, 0.4)
  addContactShadow(3.3, -1.3, 0.55, 0.45, 0.35)

  // ============== BOOKSHELF BANK (set dressing, back wall far-left — clear of the door) ==============
  addModel(group, 'bookcase.glb', { x: -3.2, z: -3.68, ry: Math.PI, scale: 1.3 })
  addContactShadow(-3.2, -3.72, 1.8, 0.6, 0.4)
  addBooks(group, -4.0, 0, -3.3, Math.PI / 2 + 0.1, 5)

  // ============== BED (set dressing, left wall) ==============
  const bedGroup = new THREE.Group()
  bedGroup.position.set(-3.55, 0, 1.6)
  bedGroup.rotation.y = Math.PI / 2
  bedGroup.add(place(box(1.7, 0.08, 1.1, COLORS.bedFrame, { roughness: 0.75, metalness: 0.05 }), 0, 0.34, 0))
  ;[
    [-0.78, 0.52],
    [0.78, 0.52],
  ].forEach(([x]) => {
    bedGroup.add(place(box(0.08, 0.4, 1.1, COLORS.bedFrame, { roughness: 0.7, metalness: 0.08 }), x, 0.17, 0))
  })
  bedGroup.add(place(box(1.74, 0.5, 0.08, COLORS.bedFrame, { roughness: 0.68, metalness: 0.1 }), 0, 0.5, -0.53))
  bedGroup.add(place(box(1.56, 0.16, 0.96, COLORS.mattress, { roughness: 0.85 }), 0, 0.46, 0))
  bedGroup.add(place(box(1.5, 0.08, 0.34, 0x6b2a2a, { roughness: 0.9 }), 0, 0.59, 0.25))
  bedGroup.add(place(box(0.42, 0.1, 0.26, COLORS.pillow, { roughness: 0.8 }), -0.5, 0.6, -0.35, 0.1))
  bedGroup.add(place(box(0.42, 0.1, 0.26, COLORS.pillow, { roughness: 0.8 }), 0.1, 0.6, -0.35, -0.08))
  group.add(bedGroup)
  addContactShadow(-3.55, 1.6, 1.4, 2.0, 0.35, 0.0045)

  // boots kicked off by the bed
  ;[-0.1, 0.1].forEach((dz) => {
    const boot = new THREE.Group()
    boot.position.set(-2.95, 0, 2.55 + dz)
    boot.rotation.y = 0.4 + Math.random() * 0.4
    boot.add(place(box(0.09, 0.1, 0.24, 0x3a2a1c, { roughness: 0.75 }), 0, 0.05, 0))
    boot.add(place(box(0.08, 0.14, 0.08, 0x3a2a1c, { roughness: 0.75 }), 0, 0.12, -0.08))
    group.add(boot)
  })
  addContactShadow(-2.95, 2.55, 0.5, 0.4, 0.3, 0.0045)

  // a cloak on a wall hook by the door — last one through it was in a hurry
  const cloakGroup = new THREE.Group()
  cloakGroup.position.set(-2.4, 2.05, -3.77)
  cloakGroup.add(place(cylinder(0.015, 0.015, 0.09, 6, COLORS.ironDark, { metalness: 0.6 }), 0, 0, 0.09))
  const cloak = place(box(0.34, 0.55, 0.03, 0x3a2a6b, { roughness: 0.8 }), 0, -0.3, 0.1)
  cloak.rotation.z = THREE.MathUtils.degToRad(4)
  cloakGroup.add(cloak)
  group.add(cloakGroup)

  // nightstand + candle beside the bed, lit by its own small warm light
  const standGroup = new THREE.Group()
  standGroup.position.set(-3.65, 0, 2.95)
  standGroup.add(place(box(0.4, 0.5, 0.38, COLORS.shelfWood, { roughness: 0.75, metalness: 0.05 }), 0, 0.25, 0))
  standGroup.add(place(box(0.34, 0.015, 0.32, COLORS.ironDark), 0, 0.51, 0))
  const candleHolder = place(cylinder(0.055, 0.065, 0.025, 10, COLORS.brass, { metalness: 0.6 }), 0, 0.53, 0)
  standGroup.add(candleHolder)
  const candleBody = place(cylinder(0.022, 0.022, 0.2, 10, COLORS.candleWax, { roughness: 0.6, metalness: 0 }), 0, 0.64, 0)
  standGroup.add(candleBody)
  const candleFlame = cone(0.018, 0.05, 8, COLORS.flame, { emissive: COLORS.flame, emissiveIntensity: 1.4, roughness: 0.3 })
  candleFlame.position.set(0, 0.76, 0)
  standGroup.add(candleFlame)
  const candleGlowSprite = makeGlowSprite('#ffb84d', 0.4)
  candleGlowSprite.position.set(0, 0.73, 0)
  standGroup.add(candleGlowSprite)
  // a book left face-down beside the candle — someone was just reading
  const nightBook = place(box(0.14, 0.02, 0.1, COLORS.book2, { roughness: 0.75 }), -0.08, 0.525, 0.08, 0.4)
  nightBook.rotation.x = 0.1
  standGroup.add(nightBook)
  group.add(standGroup)
  addContactShadow(-3.65, 2.95, 0.65, 0.6, 0.35, 0.0045)

  // dice and a rolled scroll, dropped on the rug
  ;[
    [-2.55, 2.0, 0x8a2a2a],
    [-2.42, 2.08, 0xe8d9a8],
  ].forEach(([dx, dz, c]) => {
    group.add(place(box(0.055, 0.055, 0.055, c, { roughness: 0.5 }), dx, 0.028, dz, Math.random() * Math.PI))
  })
  const scrollGroup = new THREE.Group()
  scrollGroup.position.set(-2.7, 0.03, 2.4)
  scrollGroup.rotation.y = 0.6
  scrollGroup.add(place(cylinder(0.028, 0.028, 0.26, 10, COLORS.paper, { roughness: 0.8 }), 0, 0, 0, 0))
  scrollGroup.children[0].rotation.z = Math.PI / 2
  scrollGroup.add(place(box(0.03, 0.005, 0.26, 0x6b2a2a, { roughness: 0.6 }), 0, 0.03, 0))
  group.add(scrollGroup)

  const hotspots = {}
  const glowSprites = [candleGlowSprite, chandelierGlow, ...sconceGlows]

  // ============== ARCANIST'S DESK -> PROJETOS (crystal orb) ==============
  const deskGroup = new THREE.Group()
  deskGroup.position.set(-2.3, 0, 0.3)
  deskGroup.add(box(1.7, 0.08, 0.8, COLORS.desk))
  deskGroup.children[0].position.y = 0.78
  const legGeoPositions = [
    [-0.75, 0.39, -0.32],
    [0.75, 0.39, -0.32],
    [-0.75, 0.39, 0.32],
    [0.75, 0.39, 0.32],
  ]
  legGeoPositions.forEach(([x, y, z]) => {
    deskGroup.add(place(box(0.08, 0.78, 0.08, COLORS.ironDark, { metalness: 0.3 }), x, y, z))
  })

  // brass cradle holding a glass crystal orb, standing where the monitor used to sit
  const orbPedestal = place(cylinder(0.08, 0.1, 0.26, 10, COLORS.brass, { metalness: 0.6, roughness: 0.35 }), 0, 0.9, -0.05)
  deskGroup.add(orbPedestal)
  const orbStand = torus(0.1, 0.018, 10, 24, Math.PI * 2, COLORS.brass, { metalness: 0.7, roughness: 0.3 })
  orbStand.position.set(0, 1.025, -0.05)
  orbStand.rotation.x = Math.PI / 2
  deskGroup.add(orbStand)
  const orbCage = torus(0.145, 0.012, 8, 20, Math.PI * 1.3, COLORS.brass, { metalness: 0.7, roughness: 0.3 })
  orbCage.position.set(0, 1.16, -0.05)
  orbCage.rotation.y = Math.PI / 2
  deskGroup.add(orbCage)

  const orbVision = createOrbVision()
  const orbSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.145, 28, 28),
    new THREE.MeshPhysicalMaterial({
      color: 0x3a2a6b,
      roughness: 0.15,
      transmission: 0.65,
      thickness: 0.3,
      ior: 1.4,
      emissive: 0x2a1a4a,
      emissiveIntensity: 0.25,
    }),
  )
  orbSphere.position.set(0, 1.16, -0.05)
  deskGroup.add(orbSphere)
  const orbDisc = new THREE.Mesh(new THREE.CircleGeometry(0.1, 28), orbVision.material)
  orbDisc.position.set(0, 1.16, -0.07)
  deskGroup.add(orbDisc)

  // inkwell + quill + potion bottle + parchment + tomes clutter
  deskGroup.add(place(cylinder(0.05, 0.06, 0.1, 8, 0x1a1410), 0.6, 0.87, 0.3))
  const quill = place(cylinder(0.004, 0.004, 0.22, 6, 0xe8d9b0, { roughness: 0.6 }), 0.57, 0.97, 0.26)
  quill.rotation.z = THREE.MathUtils.degToRad(70)
  quill.rotation.y = 0.3
  deskGroup.add(quill)
  const potionBottle = place(cylinder(0.025, 0.03, 0.08, 10, 0x2a4a3a, { roughness: 0.3, metalness: 0.1 }), -0.75, 0.86, -0.1)
  deskGroup.add(potionBottle)
  deskGroup.add(place(cylinder(0.014, 0.014, 0.03, 8, 0x8a6a2a, { metalness: 0.3 }), -0.75, 0.91, -0.1))
  deskGroup.add(place(box(0.22, 0.01, 0.3, COLORS.paper), -0.6, 0.825, 0.18, 0.15))
  addBooks(deskGroup, 0.68, 0.82, -0.26, 0.2, 4)

  const orbGlowSprite = makeGlowSprite('#9a7bff', 0.26)
  orbGlowSprite.position.set(0, 1.16, 0.0)
  deskGroup.add(orbGlowSprite)
  glowSprites.push(orbGlowSprite)

  group.add(deskGroup)
  addContactShadow(-2.3, 0.3, 1.9, 1.0, 0.4)

  // stool pushed back from the desk, mid-work — offset to the side so it doesn't
  // block the camera's line of sight when the orb hotspot is zoomed into
  addModel(group, 'stool.glb', { x: -2.85, z: 0.85, ry: 0.5 })
  addContactShadow(-2.85, 0.85, 0.5, 0.5, 0.35)

  hotspots.projetos = new THREE.Vector3(-2.3, 1.22, 0.17)
  const projetosHit = place(box(0.7, 0.6, 0.6, 0x000000), -2.3, 1.18, 0.1)
  projetosHit.visible = false
  projetosHit.userData.hotspot = 'projetos'
  group.add(projetosHit)

  // ============== SCRYING MIRROR -> EXPERIÊNCIA (free-standing, clear of the door) ==============
  const mirrorGroup = new THREE.Group()
  mirrorGroup.position.set(0.3, 0, -1.9)
  mirrorGroup.add(place(box(1.0, 0.5, 0.35, COLORS.shelfWood, { roughness: 0.7 }), 0, 0.25, 0))
  mirrorGroup.add(place(box(0.5, 0.64, 0.05, COLORS.brass, { metalness: 0.6, roughness: 0.3 }), 0, 0.64, 0))
  const mirrorFinial = place(box(0.08, 0.08, 0.08, COLORS.brass, { metalness: 0.65, roughness: 0.25 }), 0, 0.98, 0)
  mirrorGroup.add(mirrorFinial)

  const mirrorVision = createMirrorVision()
  const mirrorGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), mirrorVision.material)
  mirrorGlass.position.set(0, 0.64, 0.027)
  mirrorGroup.add(mirrorGlass)

  const mirrorGlowSprite = makeGlowSprite('#7fb0ff', 0.18)
  mirrorGlowSprite.position.set(0, 0.64, 0.08)
  mirrorGroup.add(mirrorGlowSprite)
  glowSprites.push(mirrorGlowSprite)

  group.add(mirrorGroup)
  addContactShadow(0.3, -1.9, 1.2, 0.55, 0.4)
  hotspots.experiencia = new THREE.Vector3(0.3, 1.0, -1.65)
  const expHit = place(box(0.9, 1.6, 0.5, 0x000000), 0.3, 0.9, -1.7)
  expHit.visible = false
  expHit.userData.hotspot = 'experiencia'
  group.add(expHit)

  // ============== ADVENTURE MAP BOARD -> SOBRE MIM ==============
  const mapGroup = new THREE.Group()
  mapGroup.position.set(3.0, 1.8, -3.75)
  mapGroup.add(place(box(1.42, 1.12, 0.06, COLORS.mapFrame, { roughness: 0.85 }), 0, 0, -0.01))
  mapGroup.add(box(1.3, 1.0, 0.04, COLORS.mapBoard, { roughness: 0.9, metalness: 0 }))
  const notes = [
    [-0.35, 0.2, 0xe8d9a8],
    [0.1, 0.28, 0xd8c998],
    [-0.1, -0.2, 0xc9b888],
  ]
  notes.forEach(([x, y, c]) => {
    mapGroup.add(place(box(0.22, 0.16, 0.01, c, { roughness: 0.9, metalness: 0 }), x, y, 0.04, (Math.random() - 0.5) * 0.3))
  })
  const sketchFrame = place(box(0.32, 0.4, 0.016, COLORS.mapFrame, { roughness: 0.6 }), -0.42, -0.1, 0.045, -0.06)
  mapGroup.add(sketchFrame)
  mapGroup.add(place(box(0.27, 0.35, 0.02, 0x6a5a48, { roughness: 0.8 }), -0.42, -0.1, 0.05, -0.06))
  const sealedLetter = place(box(0.2, 0.14, 0.03, COLORS.paper, { roughness: 0.6 }), 0.4, -0.22, 0.05, 0.1)
  mapGroup.add(sealedLetter)
  mapGroup.add(
    place(box(0.1, 0.03, 0.032, COLORS.flame, { emissive: COLORS.flame, emissiveIntensity: 1.1 }), 0.4, -0.2, 0.065, 0.1),
  )
  group.add(mapGroup)
  hotspots.sobre = new THREE.Vector3(3.0, 1.8, -3.7)
  const sobreHit = place(box(1.5, 1.2, 0.4, 0x000000), 3.0, 1.8, -3.65)
  sobreHit.visible = false
  sobreHit.userData.hotspot = 'sobre'
  group.add(sobreHit)

  // ============== GRIMOIRE ON LECTERN -> CONTATO ==============
  const lecternGroup = new THREE.Group()
  lecternGroup.position.set(2.0, 0, 1.3)
  lecternGroup.add(place(box(0.3, 0.9, 0.3, COLORS.shelfWood, { metalness: 0.05, roughness: 0.75 }), 0, 0.45, 0))
  const plinth = place(box(0.1, 0.5, 0.32, COLORS.ironDark, { metalness: 0.4, roughness: 0.5 }), 0, 1.05, 0)
  plinth.rotation.x = THREE.MathUtils.degToRad(18)
  lecternGroup.add(plinth)
  const bookStrap = torus(0.22, 0.02, 8, 20, Math.PI * 0.85, 0x2a2015, { metalness: 0.1, roughness: 0.7 })
  bookStrap.position.set(0, 1.02, 0.02)
  bookStrap.rotation.z = Math.PI / 2
  bookStrap.rotation.y = Math.PI / 2
  lecternGroup.add(bookStrap)
  const grimoireBody = place(box(0.3, 0.24, 0.17, COLORS.grimoireCover, { roughness: 0.6, metalness: 0.1 }), 0, 1.24, 0.08)
  grimoireBody.rotation.x = THREE.MathUtils.degToRad(18)
  lecternGroup.add(grimoireBody)
  const brassClasp = torus(0.1, 0.018, 10, 20, Math.PI * 2, COLORS.brass, { metalness: 0.65, roughness: 0.3 })
  brassClasp.position.set(-0.07, 1.27, 0.17)
  brassClasp.rotation.x = THREE.MathUtils.degToRad(90 - 18)
  lecternGroup.add(brassClasp)

  const grimoireVision = createGrimoireVision()
  const grimoirePage = new THREE.Mesh(new THREE.CircleGeometry(0.085, 20), grimoireVision.material)
  grimoirePage.position.set(-0.07, 1.265, 0.166)
  grimoirePage.rotation.x = -THREE.MathUtils.degToRad(18)
  lecternGroup.add(grimoirePage)

  for (let i = 0; i < 3; i++) {
    lecternGroup.add(place(cylinder(0.018, 0.018, 0.025, 8, COLORS.brass, { metalness: 0.6 }), 0.11, 1.18 + i * 0.045, 0.17))
  }

  const grimoireGlowSprite = makeGlowSprite('#d8ad5a', 0.16)
  grimoireGlowSprite.position.set(-0.07, 1.27, 0.19)
  lecternGroup.add(grimoireGlowSprite)
  glowSprites.push(grimoireGlowSprite)

  group.add(lecternGroup)
  addContactShadow(2.0, 1.3, 0.6, 0.6, 0.4)
  hotspots.contato = new THREE.Vector3(2.0, 1.27, 1.45)
  const contatoHit = place(box(0.55, 0.65, 0.55, 0x000000), 2.0, 1.1, 1.3)
  contatoHit.visible = false
  contatoHit.userData.hotspot = 'contato'
  group.add(contatoHit)

  const hitboxes = [projetosHit, expHit, sobreHit, contatoHit]

  return {
    group,
    hotspots,
    hitboxes,
    glowSprites,
    fixtureGlow,
    dustField,
    screenContent: { projetos: orbVision, experiencia: mirrorVision, contato: grimoireVision },
  }
}
