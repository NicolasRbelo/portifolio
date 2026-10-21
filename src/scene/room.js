import * as THREE from 'three'
import { loadSurfaceTextures, shadowBlobTexture, cityNightTexture, rugTexture, makeGlowSprite } from './textures.js'
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
  corkboardSurface: 0xc9a66b,
  bedFrame: 0x2a2520,
  headboard: 0x4a4550,
  mattress: 0x3a3a42,
  pillow: 0xd8d8de,
  blanket: 0x3a4a5a,
  nightstand: 0x3a2a1c,
  phoneBody: 0x1a1a1e,
  windowFrame: 0x242428,
  door: 0xcfcac0,
  doorKnob: 0x1a1a1a,
  cardboard: 0x8a6a42,
  cardboardTape: 0x6a4e2e,
  book1: 0x7a2a2a,
  book2: 0x2a5a4a,
  book3: 0x2a3a7a,
  neon: 0xff3ec9,
  cyan: 0x4ad9ff,
}

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

/** A simple wheeled office chair — seat, tilted backrest, five-point star base. */
function addOfficeChair(group, x, z, ry = 0) {
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
  chair.add(place(box(0.42, 0.06, 0.42, 0x242424, { roughness: 0.7 }), 0, 0.44, 0))
  const back = place(box(0.4, 0.5, 0.05, 0x2a2a30, { roughness: 0.6 }), 0, 0.72, -0.19)
  back.rotation.x = THREE.MathUtils.degToRad(-8)
  chair.add(back)
  group.add(chair)
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
function addCardboardBox(group, x, z, size, ry = 0) {
  const b = place(box(size, size, size, COLORS.cardboard, { roughness: 0.95 }), x, size / 2, z, ry)
  group.add(b)
  group.add(place(box(size * 0.18, 0.012, size * 1.02, COLORS.cardboardTape, { roughness: 0.6 }), x, size + 0.007, z, ry))
  return b
}

/** Builds the arcanist's... no — the developer's room, and returns the group,
 * hotspot anchors, and per-surface canvas-texture tick functions (so main.js can
 * animate the "live" screens). */
export function buildRoom() {
  const group = new THREE.Group()
  const addContactShadow = makeContactShadowAdder(group)

  // --- Shell: floor, walls ---
  const floorTex = loadSurfaceTextures('wood-floor-color.jpg', 'wood-floor-normal.jpg', 6, 5)
  const floor = place(box(9, 0.2, 8, COLORS.floor, { roughness: 0.85, map: floorTex.map, normalMap: floorTex.normalMap }), 0, -0.1, -1)
  group.add(floor)

  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2), new THREE.MeshStandardMaterial({ map: rugTexture(), roughness: 0.95 }))
  rug.rotation.x = -Math.PI / 2
  rug.position.set(-0.3, 0.002, -0.8)
  group.add(rug)

  const backWall = place(box(9, 3.6, 0.2, COLORS.wall, { roughness: 0.95 }), 0, 1.7, -3.9)
  group.add(backWall)
  const leftWall = place(box(0.2, 3.6, 8, COLORS.wall, { roughness: 0.95 }), -4.4, 1.7, -1, 0)
  group.add(leftWall)
  const rightWall = place(box(0.2, 3.6, 8, COLORS.wall, { roughness: 0.95 }), 4.4, 1.7, -1, 0)
  group.add(rightWall)
  const ceilingTrim = place(box(9, 0.15, 8, COLORS.ironDark), 0, 3.5, -1)
  group.add(ceilingTrim)

  // a neon LED strip along the top of the back wall — the one signature "this
  // person's room has RGB in it" touch, the main ambient light source
  const ledStrip = place(box(8.6, 0.04, 0.04, COLORS.neon, { emissive: COLORS.neon, emissiveIntensity: 1.8, roughness: 0.3 }), 0, 3.42, -3.76)
  group.add(ledStrip)
  const ledGlow = makeGlowSprite('#ff3ec9', 1.4)
  ledGlow.position.set(0, 3.42, -3.6)
  group.add(ledGlow)

  // window on the right wall — a real city skyline a few floors down, not a view
  // of anywhere imaginary
  const windowGroup = new THREE.Group()
  windowGroup.position.set(4.3, 2.0, 0.6)
  windowGroup.add(place(box(0.1, 1.7, 1.3, COLORS.windowFrame, { roughness: 0.6, metalness: 0.3 }), -0.06, 0, 0))
  const windowGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.4), new THREE.MeshBasicMaterial({ map: cityNightTexture() }))
  windowGlass.position.set(-0.12, 0, 0)
  windowGlass.rotation.y = -Math.PI / 2
  windowGroup.add(windowGlass)
  windowGroup.add(place(box(0.02, 1.4, 0.02, COLORS.windowFrame, { metalness: 0.3, roughness: 0.5 }), -0.11, 0, 0))
  windowGroup.add(place(box(0.02, 0.02, 1.0, COLORS.windowFrame, { metalness: 0.3, roughness: 0.5 }), -0.11, 0, 0))
  group.add(windowGroup)

  // --- Door, hinged so the intro can swing it open ---
  const doorFrame = place(box(1.8, 2.9, 0.1, COLORS.ironDark, { roughness: 0.85 }), 0.6, 1.3, -3.79)
  group.add(doorFrame)
  const doorHinge = new THREE.Group()
  doorHinge.position.set(-0.15, 0, -3.74)
  doorHinge.add(place(box(1.5, 2.6, 0.08, COLORS.door, { roughness: 0.6 }), 0.75, 1.25, 0))
  const doorKnob = place(cylinder(0.025, 0.025, 0.08, 10, COLORS.doorKnob, { metalness: 0.6, roughness: 0.3 }), 1.3, 1.1, 0.07)
  doorKnob.rotation.x = Math.PI / 2
  doorHinge.add(doorKnob)
  group.add(doorHinge)

  // a hoodie on a wall hook beside the door
  const hoodieGroup = new THREE.Group()
  hoodieGroup.position.set(-1.9, 2.0, -3.77)
  hoodieGroup.add(place(cylinder(0.014, 0.014, 0.08, 6, COLORS.ironDark, { metalness: 0.5 }), 0, 0, 0.08))
  const hoodie = place(box(0.34, 0.5, 0.03, 0x3a4a5a, { roughness: 0.85 }), 0, -0.28, 0.1)
  hoodie.rotation.z = THREE.MathUtils.degToRad(3)
  hoodieGroup.add(hoodie)
  group.add(hoodieGroup)

  // cardboard boxes stacked in the back-right corner — still not fully unpacked
  addCardboardBox(group, 3.9, -3.3, 0.5, 0.3)
  addCardboardBox(group, 3.55, -2.5, 0.38, -0.4)
  addCardboardBox(group, 3.6, -2.5, 0.38, 0.6).position.y += 0.4
  addContactShadow(3.9, -3.3, 0.65, 0.65, 0.4)
  addContactShadow(3.55, -2.5, 0.75, 0.75, 0.4)

  // ============== BOOKSHELF (set dressing, beside the TV corner) ==============
  const shelfGroup = new THREE.Group()
  shelfGroup.position.set(-3.2, 0, -3.68)
  const shelfCount = 3
  for (let i = 0; i < shelfCount; i += 1) {
    const lx = (i - (shelfCount - 1) / 2) * 0.46
    shelfGroup.add(place(box(0.42, 1.7, 0.36, COLORS.bookshelf, { metalness: 0.05, roughness: 0.8 }), lx, 0.85, 0))
    for (let v = 0; v < 4; v += 1) {
      shelfGroup.add(place(box(0.38, 0.012, 0.32, COLORS.shelfTrim), lx, 0.28 + v * 0.38, 0.02))
    }
  }
  group.add(shelfGroup)
  addContactShadow(-3.2, -3.72, 1.6, 0.55, 0.4)
  addBooks(group, -3.4, 0.3, -3.6, 0.1, 5)
  addBooks(group, -3.0, 0.68, -3.6, 0.15, 4)
  addBooks(group, -3.4, 1.06, -3.6, -0.1, 5)

  // ============== BED (set dressing, left side) ==============
  const bedGroup = new THREE.Group()
  bedGroup.position.set(-3.55, 0, 1.6)
  bedGroup.rotation.y = Math.PI / 2
  bedGroup.add(place(box(1.7, 0.08, 1.1, COLORS.bedFrame, { roughness: 0.6, metalness: 0.1 }), 0, 0.3, 0))
  ;[
    [-0.78, 0.46],
    [0.78, 0.46],
  ].forEach(([x]) => {
    bedGroup.add(place(box(0.08, 0.32, 1.1, COLORS.bedFrame, { roughness: 0.6, metalness: 0.15 }), x, 0.13, 0))
  })
  bedGroup.add(place(box(1.74, 0.56, 0.1, COLORS.headboard, { roughness: 0.9 }), 0, 0.56, -0.54))
  bedGroup.add(place(box(1.56, 0.16, 0.96, COLORS.mattress, { roughness: 0.85 }), 0, 0.42, 0))
  bedGroup.add(place(box(1.5, 0.08, 0.5, COLORS.blanket, { roughness: 0.85 }), 0, 0.55, 0.18))
  bedGroup.add(place(box(0.42, 0.1, 0.26, COLORS.pillow, { roughness: 0.8 }), -0.5, 0.56, -0.32, 0.1))
  bedGroup.add(place(box(0.42, 0.1, 0.26, COLORS.pillow, { roughness: 0.8 }), 0.1, 0.56, -0.32, -0.08))
  // a laptop sleeve, half-unzipped, left on the foot of the bed
  const sleeve = place(box(0.4, 0.04, 0.3, 0x2a2a30, { roughness: 0.8 }), 0.45, 0.5, 0.35, 0.3)
  bedGroup.add(sleeve)
  group.add(bedGroup)
  addContactShadow(-3.55, 1.6, 1.4, 2.0, 0.35)

  // sneakers kicked off by the bed
  ;[-0.1, 0.1].forEach((dz) => {
    const shoe = new THREE.Group()
    shoe.position.set(-2.95, 0, 2.55 + dz)
    shoe.rotation.y = 0.4 + Math.random() * 0.4
    shoe.add(place(box(0.09, 0.08, 0.26, 0xe8e2d8, { roughness: 0.6 }), 0, 0.04, 0))
    shoe.add(place(box(0.085, 0.09, 0.1, COLORS.neon, { roughness: 0.6 }), 0, 0.09, -0.07))
    group.add(shoe)
  })
  addContactShadow(-2.95, 2.55, 0.5, 0.4, 0.3)

  // a skateboard dropped on the rug's edge
  const boardGroup = new THREE.Group()
  boardGroup.position.set(-1.7, 0, 1.2)
  boardGroup.rotation.y = 0.5
  boardGroup.add(place(box(0.2, 0.025, 0.8, 0xe8584a, { roughness: 0.6 }), 0, 0.045, 0))
  ;[-0.28, 0.28].forEach((dz) => {
    ;[-0.08, 0.08].forEach((dx) => {
      const wheel = place(cylinder(0.035, 0.035, 0.03, 10, 0xe8e2d8, { roughness: 0.4 }), dx, 0.035, dz)
      wheel.rotation.z = Math.PI / 2
      boardGroup.add(wheel)
    })
  })
  group.add(boardGroup)
  addContactShadow(-1.7, 1.2, 0.5, 0.9, 0.3)

  // a floor cushion in the middle of the rug — without it that whole area read
  // as dead space
  const cushion = place(cylinder(0.3, 0.32, 0.1, 20, 0x5a3a52, { roughness: 0.9 }), 0.5, 0.05, -1.3)
  group.add(cushion)
  addContactShadow(0.5, -1.3, 0.9, 0.9, 0.35)

  // a low wooden crate doubling as a coffee table, with a controller + mug
  const crateTable = place(box(0.5, 0.32, 0.5, COLORS.cardboard, { roughness: 0.85 }), -0.6, 0.16, -1.9)
  group.add(crateTable)
  group.add(place(box(0.14, 0.03, 0.08, 0x1c1c1e, { roughness: 0.5 }), -0.68, 0.335, -1.85))
  group.add(place(cylinder(0.03, 0.035, 0.07, 10, 0x2a2a2e), -0.48, 0.35, -1.95))
  addContactShadow(-0.6, -1.9, 0.75, 0.75, 0.35)

  const hotspots = {}
  const glowSprites = [ledGlow]

  // ============== DESK + MONITOR + PC -> PROJETOS ==============
  const deskGroup = new THREE.Group()
  deskGroup.position.set(-2.9, 0, 0.3)
  deskGroup.add(box(1.7, 0.08, 0.8, COLORS.desk))
  deskGroup.children[0].position.y = 0.78
  const legGeoPositions = [
    [-0.75, 0.39, -0.32],
    [0.75, 0.39, -0.32],
    [-0.75, 0.39, 0.32],
    [0.75, 0.39, 0.32],
  ]
  legGeoPositions.forEach(([x, y, z]) => {
    deskGroup.add(place(box(0.06, 0.78, 0.06, COLORS.deskLeg, { metalness: 0.3 }), x, y, z))
  })

  // slim modern monitor on a stand
  const monitorStand = place(box(0.1, 0.16, 0.1, COLORS.monitor, { metalness: 0.4, roughness: 0.5 }), 0, 0.86, -0.15)
  deskGroup.add(monitorStand)
  const monitorBase = place(box(0.3, 0.02, 0.2, COLORS.monitor, { metalness: 0.4, roughness: 0.5 }), 0, 0.795, -0.15)
  deskGroup.add(monitorBase)
  const monitorBezel = place(box(0.56, 0.36, 0.025, COLORS.monitor, { metalness: 0.3, roughness: 0.4 }), 0, 1.08, -0.18)
  deskGroup.add(monitorBezel)

  const codeScreen = createCodeScreen()
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), codeScreen.material)
  screen.position.set(0, 1.08, -0.166)
  deskGroup.add(screen)

  // PC tower beside the monitor, a thin RGB edge light on its front panel
  const tower = place(box(0.16, 0.42, 0.42, COLORS.tower, { metalness: 0.3, roughness: 0.4 }), 0.68, 0.99, -0.1)
  deskGroup.add(tower)
  deskGroup.add(place(box(0.004, 0.38, 0.01, COLORS.cyan, { emissive: COLORS.cyan, emissiveIntensity: 1.6 }), 0.76, 0.99, -0.28))

  // articulated desk lamp, keyboard, mouse, mug, headphones, plant
  const lampBase = place(cylinder(0.05, 0.06, 0.02, 12, COLORS.lamp, { metalness: 0.5 }), -0.72, 0.79, 0.26)
  deskGroup.add(lampBase)
  const lampArm1 = place(cylinder(0.012, 0.012, 0.26, 6, COLORS.lamp, { metalness: 0.6 }), -0.72, 0.9, 0.26)
  lampArm1.rotation.z = THREE.MathUtils.degToRad(18)
  deskGroup.add(lampArm1)
  const lampArm2 = place(cylinder(0.012, 0.012, 0.22, 6, COLORS.lamp, { metalness: 0.6 }), -0.65, 1.08, 0.2)
  lampArm2.rotation.z = THREE.MathUtils.degToRad(-55)
  deskGroup.add(lampArm2)
  const lampHead = place(cylinder(0.05, 0.07, 0.1, 10, COLORS.lamp, { metalness: 0.5 }), -0.55, 1.0, 0.15)
  lampHead.rotation.x = THREE.MathUtils.degToRad(70)
  deskGroup.add(lampHead)
  const lampGlowSprite = makeGlowSprite('#ffd9a0', 0.32)
  lampGlowSprite.position.set(-0.52, 0.96, 0.12)
  deskGroup.add(lampGlowSprite)

  deskGroup.add(place(box(0.42, 0.015, 0.16, 0x1c1c1e, { roughness: 0.6 }), 0, 0.8, 0.26))
  for (let kx = -0.18; kx <= 0.18; kx += 0.055) {
    deskGroup.add(place(box(0.04, 0.012, 0.04, 0x0c0c0e), kx, 0.815, 0.26))
  }
  deskGroup.add(place(box(0.05, 0.012, 0.08, 0x1c1c1e, { roughness: 0.6 }), 0.28, 0.8, 0.3))
  deskGroup.add(place(cylinder(0.035, 0.04, 0.09, 10, 0x2a2a2e), 0.6, 0.835, 0.28))
  const plantPot = place(cylinder(0.04, 0.035, 0.06, 10, 0xb5651d, { roughness: 0.8 }), -0.72, 0.81, -0.1)
  deskGroup.add(plantPot)
  const plantLeaves = place(cone(0.055, 0.14, 8, 0x2a7a3a, { roughness: 0.7 }), -0.72, 0.9, -0.1)
  deskGroup.add(plantLeaves)
  addBooks(deskGroup, 0.62, 0.82, -0.26, 0.2, 3)

  const monitorGlowSprite = makeGlowSprite('#4ad9ff', 0.3)
  monitorGlowSprite.position.set(0, 1.08, -0.1)
  deskGroup.add(monitorGlowSprite)
  glowSprites.push(monitorGlowSprite)

  group.add(deskGroup)
  addContactShadow(-2.9, 0.3, 1.9, 1.0, 0.4)

  // office chair, pulled out at an angle — someone just got up
  addOfficeChair(group, -2.6, 0.85, -0.5)
  addContactShadow(-2.6, 0.85, 0.5, 0.5, 0.35)

  // a couple of framed prints on the wall above the desk, tucking it into its
  // own corner instead of leaving the corner bare
  ;[-0.1, 0.7].forEach((z, i) => {
    const frame = place(box(0.32, 0.24, 0.02, 0x1c1c1e, { roughness: 0.5 }), -4.26, 2.1, z, Math.PI / 2)
    group.add(frame)
    group.add(place(box(0.26, 0.18, 0.012, [0xff8fe0, 0x4ad9ff][i], { roughness: 0.6 }), -4.25, 2.1, z, Math.PI / 2))
  })

  hotspots.projetos = new THREE.Vector3(-2.9, 1.22, 0.17)
  const projetosHit = place(box(0.7, 0.6, 0.6, 0x000000), -2.9, 1.18, 0.1)
  projetosHit.visible = false
  projetosHit.userData.hotspot = 'projetos'
  group.add(projetosHit)

  // ============== TV + RETRO CONSOLE -> EXPERIÊNCIA (wall-mounted, bigger —
  // the room's main feature wall, like a real living-room/bedroom setup) ==============
  const tvGroup = new THREE.Group()
  tvGroup.position.set(-1.35, 0, -3.78)

  // slim wall-mount bracket behind the panel
  tvGroup.add(place(box(0.1, 0.34, 0.05, COLORS.ironDark, { metalness: 0.4, roughness: 0.5 }), 0, 1.32, 0.05))
  // big flat bezel, flush to the wall
  tvGroup.add(place(box(1.0, 0.6, 0.035, COLORS.monitor, { metalness: 0.3, roughness: 0.4 }), 0, 1.32, 0.09))

  const gameScreen = createGameScreen()
  const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.52), gameScreen.material)
  tvScreen.position.set(0, 1.32, 0.109)
  tvGroup.add(tvScreen)

  // a framed poster beside it — the "LEVEL UP" print every setup like this has
  tvGroup.add(place(box(0.34, 0.46, 0.02, 0x1c1c1e, { roughness: 0.5 }), 0.84, 1.3, 0.05))
  tvGroup.add(place(box(0.28, 0.4, 0.012, 0x7a3a5c, { roughness: 0.8 }), 0.84, 1.3, 0.062))

  // a floating shelf below the TV for the console + a couple of game cases
  tvGroup.add(place(box(0.92, 0.04, 0.22, COLORS.bookshelf, { roughness: 0.8 }), 0, 0.78, 0.13))
  ;[-0.4, 0.4].forEach((x) => tvGroup.add(place(box(0.03, 0.08, 0.03, COLORS.shelfTrim), x, 0.73, 0.15)))
  tvGroup.add(place(box(0.16, 0.03, 0.12, 0x1c1c1e, { roughness: 0.5 }), -0.3, 0.815, 0.15))
  tvGroup.add(place(box(0.1, 0.02, 0.06, 0x2a2a2e, { roughness: 0.5 }), -0.12, 0.81, 0.17))
  ;[0.1, 0.17, 0.24].forEach((x, i) => tvGroup.add(place(box(0.02, 0.14, 0.1, BOOK_COLORS[i], { roughness: 0.75 }), x, 0.85, 0.15)))

  const tvGlowSprite = makeGlowSprite('#ff3ec9', 0.3)
  tvGlowSprite.position.set(0, 1.32, 0.16)
  tvGroup.add(tvGlowSprite)
  glowSprites.push(tvGlowSprite)

  group.add(tvGroup)
  hotspots.experiencia = new THREE.Vector3(-1.35, 1.32, -3.65)
  const expHit = place(box(1.0, 0.95, 0.4, 0x000000), -1.35, 1.3, -3.68)
  expHit.visible = false
  expHit.userData.hotspot = 'experiencia'
  group.add(expHit)

  // ============== CORKBOARD -> SOBRE MIM ==============
  const corkGroup = new THREE.Group()
  corkGroup.position.set(3.0, 1.8, -3.75)
  corkGroup.add(place(box(1.42, 1.12, 0.06, COLORS.corkboardFrame, { roughness: 0.85 }), 0, 0, -0.01))
  corkGroup.add(box(1.3, 1.0, 0.04, COLORS.corkboardSurface, { roughness: 0.95, metalness: 0 }))
  const noteColors = [0xffd866, 0xff9e6d, 0x8fe0c9, 0xffb3d6, 0xa8d4ff, 0xffd866]
  const notes = [
    [-0.42, 0.25],
    [-0.08, 0.3],
    [0.3, 0.22],
    [-0.42, -0.18],
    [-0.05, -0.22],
    [0.3, -0.15],
  ]
  notes.forEach(([x, y], i) => {
    corkGroup.add(place(box(0.22, 0.16, 0.01, noteColors[i], { roughness: 0.9, metalness: 0 }), x, y, 0.04, (Math.random() - 0.5) * 0.3))
  })
  const photoFrame = place(box(0.3, 0.22, 0.014, 0x1c1c1e, { roughness: 0.5 }), 0.42, -0.2, 0.045, -0.08)
  corkGroup.add(photoFrame)
  corkGroup.add(place(box(0.25, 0.17, 0.02, 0x6a7a8a, { roughness: 0.8 }), 0.42, -0.2, 0.05, -0.08))
  // a small clock above the board
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), new THREE.MeshStandardMaterial({ color: 0xff3ec9, roughness: 0.6 }))
  clockFace.position.set(0, 0.74, 0.03)
  corkGroup.add(clockFace)
  corkGroup.add(place(box(0.006, 0.06, 0.006, 0x0c0c0e), 0.02, 0.76, 0.045))
  corkGroup.add(place(box(0.05, 0.006, 0.006, 0x0c0c0e), -0.01, 0.72, 0.045))

  // a small clip lamp clamped to the top of the frame, angled down at the
  // notes — its own dedicated little light instead of relying on the room glow
  const clipLamp = new THREE.Group()
  clipLamp.position.set(-0.55, 0.58, 0.05)
  clipLamp.add(place(cylinder(0.018, 0.018, 0.22, 8, COLORS.lamp, { metalness: 0.5 }), 0, 0.1, 0))
  const clipHead = place(cylinder(0.035, 0.05, 0.07, 10, COLORS.lamp, { metalness: 0.5 }), 0.02, 0.2, 0.05)
  clipHead.rotation.x = Math.PI / 2.4
  clipLamp.add(clipHead)
  corkGroup.add(clipLamp)
  const corkLampGlow = makeGlowSprite('#ffe0b0', 0.3)
  corkLampGlow.position.set(-0.3, 0.1, 0.1)
  corkGroup.add(corkLampGlow)
  glowSprites.push(corkLampGlow)

  group.add(corkGroup)
  hotspots.sobre = new THREE.Vector3(3.0, 1.8, -3.7)
  const sobreHit = place(box(1.5, 1.4, 0.4, 0x000000), 3.0, 1.8, -3.65)
  sobreHit.visible = false
  sobreHit.userData.hotspot = 'sobre'
  group.add(sobreHit)

  // a low bench under the corkboard with books + a small plant
  const benchGroup = new THREE.Group()
  benchGroup.position.set(3.0, 0, -3.65)
  benchGroup.add(place(box(1.3, 0.08, 0.3, COLORS.bookshelf, { roughness: 0.8 }), 0, 0.4, 0))
  ;[-0.6, 0.6].forEach((x) => benchGroup.add(place(box(0.06, 0.4, 0.06, COLORS.shelfTrim), x, 0.2, 0.1)))
  addBooks(benchGroup, -0.3, 0.44, 0.02, 0.2, 4)
  const benchPot = place(cylinder(0.05, 0.045, 0.07, 10, 0xb5651d, { roughness: 0.8 }), 0.4, 0.46, 0)
  benchGroup.add(benchPot)
  benchGroup.add(place(cone(0.06, 0.16, 8, 0x2a7a3a, { roughness: 0.7 }), 0.4, 0.56, 0))
  group.add(benchGroup)
  addContactShadow(3.0, -3.65, 1.4, 0.5, 0.35)

  // ============== NIGHTSTAND + PHONE -> CONTATO (by the headboard, pulled a bit
  // toward the room's center so it stays in frame on narrower viewports) ==============
  const standGroup = new THREE.Group()
  standGroup.position.set(-2.8, 0, 1.0)
  standGroup.add(place(box(0.4, 0.5, 0.38, COLORS.nightstand, { roughness: 0.75, metalness: 0.05 }), 0, 0.25, 0))
  standGroup.add(place(box(0.34, 0.015, 0.32, COLORS.shelfTrim), 0, 0.51, 0))

  const phoneGroup = new THREE.Group()
  phoneGroup.position.set(0, 0.53, 0.02)
  phoneGroup.rotation.x = THREE.MathUtils.degToRad(-55)
  phoneGroup.rotation.z = THREE.MathUtils.degToRad(-8)
  phoneGroup.add(place(box(0.1, 0.2, 0.012, COLORS.phoneBody, { metalness: 0.3, roughness: 0.4 }), 0, 0.1, 0))
  const phoneScreenContent = createPhoneScreen()
  const phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.086, 0.18), phoneScreenContent.material)
  phoneScreen.position.set(0, 0.1, 0.007)
  phoneGroup.add(phoneScreen)
  standGroup.add(phoneGroup)

  const phoneGlowSprite = makeGlowSprite('#4ade80', 0.22)
  phoneGlowSprite.position.set(0, 0.62, 0.05)
  standGroup.add(phoneGlowSprite)
  glowSprites.push(phoneGlowSprite)

  // a book left face-down beside the phone
  const nightBook = place(box(0.14, 0.02, 0.1, COLORS.book2, { roughness: 0.75 }), -0.1, 0.525, 0.08, 0.4)
  nightBook.rotation.x = 0.1
  standGroup.add(nightBook)
  group.add(standGroup)
  addContactShadow(-2.8, 1.0, 0.65, 0.6, 0.35)

  // the label anchor is pulled further up and left than the phone itself so it
  // doesn't visually collide with the "Projetos" label right next to it
  hotspots.contato = new THREE.Vector3(-3.3, 1.6, 1.0)
  const contatoHit = place(box(0.55, 0.9, 0.55, 0x000000), -2.8, 0.6, 1.0)
  contatoHit.visible = false
  contatoHit.userData.hotspot = 'contato'
  group.add(contatoHit)

  const hitboxes = [projetosHit, expHit, sobreHit, contatoHit]

  return {
    group,
    hotspots,
    hitboxes,
    glowSprites,
    doorHinge,
    screenContent: { projetos: codeScreen, experiencia: gameScreen, contato: phoneScreenContent },
  }
}
