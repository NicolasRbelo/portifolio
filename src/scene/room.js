import * as THREE from 'three'
import { vaultPlaqueTexture, hazardStripeTexture, radiationPosterTexture, rugTexture, makeGlowSprite } from './textures.js'
import { createCodeScreen, createGameScreen, createHudScreen } from './screenContent.js'

const COLORS = {
  wallDark: 0x1a2117,
  wallPanel: 0x222b1e,
  floor: 0x141a12,
  floorStripe: 0x7a5a12,
  metal: 0x2a2f27,
  metalDark: 0x1c211a,
  rust: 0x6b4a2b,
  desk: 0x23281f,
  console: 0x262c21,
  screenOff: 0x0a140a,
  vaultDoor: 0x3a4036,
  vaultRivet: 0x4e5648,
  corkboard: 0x4a3a28,
  corkFrame: 0x2c2317,
  paper: 0xd8cfa8,
  crate: 0x3c3426,
  pipboyBody: 0x3a4030,
  pipe: 0x454f44,
  locker: 0x323a2d,
  lockerDoor: 0x2a3225,
  bedFrame: 0x394535,
  mattress: 0x2f3a2c,
  pillow: 0x8d9a85,
  book1: 0x6b3a2a,
  book2: 0x2a4a3a,
  book3: 0x4a3a6b,
}

function box(w, h, d, color, options = {}) {
  const geo = new THREE.BoxGeometry(w, h, d)
  const mat = new THREE.MeshStandardMaterial({
    color,
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

function addWallRidges(group, { length, height, color, position, axis }) {
  const ridgeGeo = new THREE.BoxGeometry(axis === 'x' ? length : 0.035, height, 0.035)
  const ridgeGeoZ = new THREE.BoxGeometry(0.035, height, axis === 'z' ? length : 0.035)
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.4 })
  const spacing = 0.46
  const count = Math.floor(length / spacing)
  for (let i = 0; i <= count; i += 1) {
    const offset = -length / 2 + i * spacing
    const mesh = new THREE.Mesh(axis === 'x' ? ridgeGeo.clone() : ridgeGeoZ.clone(), mat)
    if (axis === 'x') {
      mesh.scale.set(0.02, 1, 1)
      mesh.position.set(position.x + offset, position.y, position.z)
    } else {
      mesh.scale.set(1, 1, 0.02)
      mesh.position.set(position.x, position.y, position.z + offset)
    }
    group.add(mesh)
  }
}

function addBooks(group, x, y, z, ry = 0) {
  const colors = [COLORS.book1, COLORS.book2, COLORS.book3]
  let cy = y
  colors.forEach((c, i) => {
    const h = 0.05 + (i % 2) * 0.015
    const book = place(box(0.18, h, 0.13, c, { roughness: 0.75 }), x, cy + h / 2, z, ry + (Math.random() - 0.5) * 0.08)
    group.add(book)
    cy += h
  })
}

/** Builds the vault bedroom and returns the group, hotspot anchors, and per-screen
 * canvas-texture tick functions (so main.js can animate "live" screen content). */
export function buildRoom() {
  const group = new THREE.Group()

  // --- Shell: floor, back wall, side walls ---
  const floor = place(box(9, 0.2, 8, COLORS.floor, { roughness: 0.95 }), 0, -0.1, -1)
  group.add(floor)

  for (let i = -3; i <= 3; i += 1.2) {
    const stripe = place(box(0.14, 0.021, 7.6, COLORS.floorStripe, { roughness: 0.92, metalness: 0.04 }), i, 0.001, -1)
    group.add(stripe)
  }

  // worn rug, the bedroom's warm focal patch on an otherwise cold metal floor
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 3.1), new THREE.MeshStandardMaterial({ map: rugTexture(), roughness: 0.95 }))
  rug.rotation.x = -Math.PI / 2
  rug.position.set(-3.15, 0.002, 1.6)
  group.add(rug)

  const backWall = place(box(9, 3.6, 0.2, COLORS.wallDark), 0, 1.7, -3.9)
  group.add(backWall)
  const leftWall = place(box(0.2, 3.6, 8, COLORS.wallPanel), -4.4, 1.7, -1, 0)
  group.add(leftWall)
  const rightWall = place(box(0.2, 3.6, 8, COLORS.wallPanel), 4.4, 1.7, -1, 0)
  group.add(rightWall)
  const ceilingTrim = place(box(9, 0.15, 8, COLORS.metalDark), 0, 3.5, -1)
  group.add(ceilingTrim)

  // dense ribbed-panel ridges — the Vault-Tec corrugated-metal read
  addWallRidges(group, { length: 8.8, height: 3.3, color: COLORS.metal, position: { x: 0, y: 1.7, z: -3.78 }, axis: 'x' })
  addWallRidges(group, { length: 7.6, height: 3.3, color: COLORS.metal, position: { x: -4.29, y: 1.7, z: -1 }, axis: 'z' })
  addWallRidges(group, { length: 7.6, height: 3.3, color: COLORS.metal, position: { x: 4.29, y: 1.7, z: -1 }, axis: 'z' })
  // horizontal belt rails break up the vertical ridges, another corrugated-panel cue
  ;[0.75, 2.65].forEach((y) => {
    group.add(place(box(8.6, 0.05, 0.05, COLORS.metalDark, { metalness: 0.55 }), 0, y, -3.78))
  })

  // pipe conduits running along the back wall near the ceiling
  const pipeY = 3.1
  const pipeMain = place(cylinder(0.055, 0.055, 8.6, 8, COLORS.pipe, { metalness: 0.75, roughness: 0.35 }), 0, pipeY, -3.72)
  pipeMain.rotation.z = Math.PI / 2
  group.add(pipeMain)
  const pipeSecondary = place(cylinder(0.035, 0.035, 8.6, 8, COLORS.pipe, { metalness: 0.75, roughness: 0.35 }), 0, pipeY - 0.22, -3.74)
  pipeSecondary.rotation.z = Math.PI / 2
  group.add(pipeSecondary)
  for (let x = -3.8; x <= 3.8; x += 1.9) {
    group.add(place(box(0.1, 0.22, 0.12, COLORS.metalDark, { metalness: 0.6 }), x, pipeY, -3.68))
  }

  // Vault-Tec stencil plaque above the door
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 0.82),
    new THREE.MeshBasicMaterial({ map: vaultPlaqueTexture('VAULT 76', 'OVERSEER TERMINAL') }),
  )
  plaque.position.set(0.6, 2.85, -3.77)
  group.add(plaque)

  // hazard stripe warning plate beside the vault door
  const hazard = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.22), new THREE.MeshBasicMaterial({ map: hazardStripeTexture() }))
  hazard.position.set(-1.35, 1.0, -3.78)
  group.add(hazard)

  // radiation warning poster, left wall
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.85), new THREE.MeshBasicMaterial({ map: radiationPosterTexture() }))
  poster.position.set(-4.28, 2.05, -0.4)
  poster.rotation.y = Math.PI / 2
  group.add(poster)

  // --- Vault door (decorative backdrop) ---
  const doorFrame = place(cylinder(1.35, 1.35, 0.25, 8, COLORS.vaultDoor, { metalness: 0.6, roughness: 0.5 }), 0.6, 1.9, -3.78, Math.PI / 2)
  doorFrame.rotation.z = Math.PI / 2
  doorFrame.rotation.y = 0
  doorFrame.rotation.x = Math.PI / 2
  group.add(doorFrame)
  const doorWheel = place(cylinder(0.75, 0.75, 0.16, 6, COLORS.vaultRivet, { metalness: 0.7, roughness: 0.4 }), 0.6, 1.9, -3.64)
  doorWheel.rotation.x = Math.PI / 2
  group.add(doorWheel)
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2
    const rivet = place(
      box(0.08, 0.08, 0.1, COLORS.vaultRivet, { metalness: 0.7, roughness: 0.3 }),
      0.6 + Math.cos(angle) * 1.1,
      1.9 + Math.sin(angle) * 1.1,
      -3.66,
    )
    group.add(rivet)
  }
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2
    group.add(
      place(
        box(0.06, 0.06, 0.08, COLORS.vaultRivet, { metalness: 0.75, roughness: 0.25 }),
        0.6 + Math.cos(angle) * 1.33,
        1.9 + Math.sin(angle) * 1.33,
        -3.72,
      ),
    )
  }

  // overhead light fixture
  const fixture = place(box(1.4, 0.1, 0.3, COLORS.metal, { metalness: 0.6 }), -0.4, 3.35, 0.8)
  group.add(fixture)
  const fixtureGlow = place(
    box(1.1, 0.03, 0.12, 0xeaffe0, { emissive: 0xeaffe0, emissiveIntensity: 0.9, roughness: 0.3 }),
    -0.4,
    3.28,
    0.8,
  )
  group.add(fixtureGlow)

  // crates / set dressing
  group.add(place(box(0.5, 0.5, 0.5, COLORS.crate), 3.5, 0.45, -1.2))
  group.add(place(box(0.4, 0.4, 0.4, COLORS.crate), 3.75, 0.2, -0.5, 0.3))

  // ============== LOCKER BANK (set dressing, back wall) ==============
  const lockerGroup = new THREE.Group()
  lockerGroup.position.set(1.65, 0, -3.72)
  const lockerCount = 3
  for (let i = 0; i < lockerCount; i += 1) {
    const lx = (i - (lockerCount - 1) / 2) * 0.46
    lockerGroup.add(place(box(0.42, 1.9, 0.42, COLORS.locker, { metalness: 0.4, roughness: 0.55 }), lx, 0.95, 0))
    lockerGroup.add(place(box(0.36, 1.78, 0.02, COLORS.lockerDoor, { metalness: 0.35, roughness: 0.5 }), lx, 0.96, 0.21))
    lockerGroup.add(place(cylinder(0.018, 0.018, 0.08, 8, 0x8a8f7e, { metalness: 0.7 }), lx + 0.13, 0.95, 0.22, Math.PI / 2))
    for (let v = 0; v < 5; v += 1) {
      lockerGroup.add(place(box(0.36, 0.01, 0.022, 0x14180f), lx, 0.3 + v * 0.35, 0.22))
    }
  }
  group.add(lockerGroup)
  addBooks(group, 2.5, 0, -3.3, Math.PI / 2 + 0.1)

  // ============== BED (set dressing, left wall) ==============
  const bedGroup = new THREE.Group()
  bedGroup.position.set(-3.55, 0, 1.6)
  bedGroup.rotation.y = Math.PI / 2
  bedGroup.add(place(box(1.7, 0.08, 1.1, COLORS.bedFrame, { roughness: 0.6, metalness: 0.2 }), 0, 0.34, 0))
  ;[
    [-0.78, 0.52],
    [0.78, 0.52],
  ].forEach(([x]) => {
    bedGroup.add(place(box(0.08, 0.4, 1.1, COLORS.bedFrame, { roughness: 0.6, metalness: 0.25 }), x, 0.17, 0))
  })
  bedGroup.add(place(box(1.74, 0.5, 0.08, COLORS.bedFrame, { roughness: 0.55, metalness: 0.3 }), 0, 0.5, -0.53))
  bedGroup.add(place(box(1.56, 0.16, 0.96, COLORS.mattress, { roughness: 0.85 }), 0, 0.46, 0))
  bedGroup.add(place(box(1.5, 0.08, 0.34, 0x6b4a2b, { roughness: 0.9 }), 0, 0.59, 0.25))
  bedGroup.add(place(box(0.42, 0.1, 0.26, COLORS.pillow, { roughness: 0.8 }), -0.5, 0.6, -0.35, 0.1))
  bedGroup.add(place(box(0.42, 0.1, 0.26, COLORS.pillow, { roughness: 0.8 }), 0.1, 0.6, -0.35, -0.08))
  group.add(bedGroup)

  // nightstand + desk lamp beside the bed, lit by its own small warm light
  const standGroup = new THREE.Group()
  standGroup.position.set(-3.65, 0, 2.95)
  standGroup.add(place(box(0.4, 0.5, 0.38, COLORS.locker, { roughness: 0.6, metalness: 0.3 }), 0, 0.25, 0))
  standGroup.add(place(box(0.34, 0.015, 0.32, COLORS.metalDark), 0, 0.51, 0))
  const lampBase = place(cylinder(0.05, 0.06, 0.03, 10, COLORS.metalDark, { metalness: 0.5 }), 0, 0.54, 0)
  standGroup.add(lampBase)
  const lampArm = place(cylinder(0.012, 0.012, 0.3, 6, COLORS.metalDark, { metalness: 0.6 }), 0, 0.68, -0.02)
  lampArm.rotation.z = THREE.MathUtils.degToRad(12)
  standGroup.add(lampArm)
  const lampShade = cone(0.09, 0.14, 12, 0xd8cfa8, { roughness: 0.6, emissive: 0xffdf9b, emissiveIntensity: 0.6 })
  lampShade.position.set(0.05, 0.84, -0.02)
  lampShade.rotation.x = Math.PI
  standGroup.add(lampShade)
  const lampGlowSprite = makeGlowSprite('#ffdf9b', 0.5)
  lampGlowSprite.position.set(0.05, 0.8, -0.02)
  standGroup.add(lampGlowSprite)
  group.add(standGroup)

  const hotspots = {}
  const glowSprites = [lampGlowSprite]

  // ============== TERMINAL DESK -> PROJETOS ==============
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
    deskGroup.add(place(box(0.08, 0.78, 0.08, COLORS.metalDark, { metalness: 0.4 }), x, y, z))
  })

  // CRT monitor: bulging bezel + recessed screen reads as an actual terminal
  const monitorBody = place(box(0.64, 0.54, 0.52, COLORS.console, { roughness: 0.6 }), 0, 1.16, -0.05)
  deskGroup.add(monitorBody)
  const monitorBezel = place(box(0.5, 0.38, 0.06, 0x070f07, { roughness: 0.4 }), 0, 1.2, 0.2)
  deskGroup.add(monitorBezel)

  const codeScreen = createCodeScreen()
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), codeScreen.material)
  screen.position.set(0, 1.2, 0.236)
  deskGroup.add(screen)

  const monitorStand = place(box(0.14, 0.24, 0.14, COLORS.metalDark), 0, 0.9, -0.05)
  deskGroup.add(monitorStand)
  const keyboard = place(box(0.5, 0.04, 0.2, COLORS.metal), 0, 0.82, 0.32)
  deskGroup.add(keyboard)
  for (let kx = -0.18; kx <= 0.18; kx += 0.06) {
    deskGroup.add(place(box(0.045, 0.012, 0.045, 0x14180f), kx, 0.845, 0.32))
  }
  // mug + papers + books clutter
  deskGroup.add(place(cylinder(0.06, 0.06, 0.1, 8, 0x8c5f00), 0.6, 0.87, 0.3))
  deskGroup.add(place(box(0.22, 0.01, 0.3, COLORS.paper), -0.6, 0.825, 0.18, 0.15))
  addBooks(deskGroup, 0.68, 0.82, -0.26, 0.2)

  const terminalGlowSprite = makeGlowSprite('#39ff14', 0.26)
  terminalGlowSprite.position.set(0, 1.2, 0.3)
  deskGroup.add(terminalGlowSprite)
  glowSprites.push(terminalGlowSprite)

  group.add(deskGroup)
  hotspots.projetos = new THREE.Vector3(-2.3, 1.22, 0.17)
  const projetosHit = place(box(0.7, 0.6, 0.6, 0x000000), -2.3, 1.18, 0.1)
  projetosHit.visible = false
  projetosHit.userData.hotspot = 'projetos'
  group.add(projetosHit)

  // ============== RADIO CONSOLE -> EXPERIÊNCIA ==============
  const radioGroup = new THREE.Group()
  radioGroup.position.set(0.3, 0, -3.1)
  radioGroup.add(place(box(1.1, 1.0, 0.5, COLORS.console, { roughness: 0.6 }), 0, 0.5, 0))
  radioGroup.add(place(box(0.8, 0.5, 0.46, COLORS.console, { roughness: 0.55 }), 0, 1.25, 0))
  for (let gx = -0.24; gx <= 0.24; gx += 0.12) {
    for (let gy = -0.1; gy <= 0.1; gy += 0.1) {
      radioGroup.add(place(cylinder(0.025, 0.025, 0.03, 8, 0x0c100b), gx, 1.3 + gy, 0.24, Math.PI / 2))
    }
  }

  const gameScreen = createGameScreen()
  const radioScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.22), gameScreen.material)
  radioScreen.position.set(0, 0.62, 0.271)
  radioGroup.add(radioScreen)

  const dialL = place(cylinder(0.09, 0.09, 0.06, 16, 0x8a8f7e, { metalness: 0.65, roughness: 0.35 }), -0.35, 0.55, 0.28, Math.PI / 2)
  radioGroup.add(dialL)
  radioGroup.add(place(box(0.014, 0.08, 0.012, 0x1a1008), -0.35, 0.58, 0.32))
  const dialR = place(cylinder(0.07, 0.07, 0.06, 16, 0x8a8f7e, { metalness: 0.65, roughness: 0.35 }), 0.35, 0.55, 0.28, Math.PI / 2)
  radioGroup.add(dialR)
  radioGroup.add(place(box(0.014, 0.06, 0.012, 0x1a1008), 0.35, 0.57, 0.32))
  const antenna = place(cylinder(0.012, 0.018, 1.3, 6, COLORS.metal, { metalness: 0.7 }), 0.32, 2.15, 0)
  radioGroup.add(antenna)
  radioGroup.add(place(cylinder(0.04, 0.04, 0.04, 8, 0xffb000, { emissive: 0xffb000, emissiveIntensity: 0.8 }), 0.32, 2.82, 0))

  const radioGlowSprite = makeGlowSprite('#ffb000', 0.14)
  radioGlowSprite.position.set(0, 0.62, 0.32)
  radioGroup.add(radioGlowSprite)
  glowSprites.push(radioGlowSprite)

  group.add(radioGroup)
  hotspots.experiencia = new THREE.Vector3(0.3, 1.0, -2.85)
  const expHit = place(box(0.9, 1.6, 0.5, 0x000000), 0.3, 0.9, -2.9)
  expHit.visible = false
  expHit.userData.hotspot = 'experiencia'
  group.add(expHit)

  // ============== CORKBOARD -> SOBRE MIM ==============
  const corkGroup = new THREE.Group()
  corkGroup.position.set(3.0, 1.8, -3.75)
  corkGroup.add(place(box(1.42, 1.12, 0.06, COLORS.corkFrame, { roughness: 0.85 }), 0, 0, -0.01))
  corkGroup.add(box(1.3, 1.0, 0.04, COLORS.corkboard, { roughness: 0.95, metalness: 0 }))
  const notes = [
    [-0.35, 0.2, 0xd8cfa8],
    [0.1, 0.28, 0xe3dcb8],
    [-0.1, -0.2, 0xc9e8cf],
  ]
  notes.forEach(([x, y, c]) => {
    corkGroup.add(place(box(0.22, 0.16, 0.01, c, { roughness: 0.9, metalness: 0 }), x, y, 0.04, (Math.random() - 0.5) * 0.3))
  })
  const photoFrame = place(box(0.32, 0.4, 0.016, 0x0c0f0a, { roughness: 0.6 }), -0.42, -0.1, 0.045, -0.06)
  corkGroup.add(photoFrame)
  corkGroup.add(place(box(0.27, 0.35, 0.02, 0x4a5a44, { roughness: 0.8 }), -0.42, -0.1, 0.05, -0.06))
  const holotape = place(box(0.2, 0.14, 0.03, 0x1c231a, { roughness: 0.4, metalness: 0.3 }), 0.4, -0.22, 0.05, 0.1)
  corkGroup.add(holotape)
  corkGroup.add(
    place(box(0.1, 0.03, 0.032, 0xffb000, { emissive: 0xffb000, emissiveIntensity: 1.1 }), 0.4, -0.2, 0.065, 0.1),
  )
  group.add(corkGroup)
  hotspots.sobre = new THREE.Vector3(3.0, 1.8, -3.7)
  const sobreHit = place(box(1.5, 1.2, 0.4, 0x000000), 3.0, 1.8, -3.65)
  sobreHit.visible = false
  sobreHit.userData.hotspot = 'sobre'
  group.add(sobreHit)

  // ============== PIP-BOY STAND -> CONTATO ==============
  const pipGroup = new THREE.Group()
  pipGroup.position.set(2.0, 0, 1.3)
  pipGroup.add(place(box(0.3, 0.9, 0.3, COLORS.metalDark, { metalness: 0.4 }), 0, 0.45, 0))
  const plinth = place(box(0.1, 0.5, 0.32, COLORS.metal, { metalness: 0.5, roughness: 0.5 }), 0, 1.05, 0)
  plinth.rotation.x = THREE.MathUtils.degToRad(18)
  pipGroup.add(plinth)
  const strap = torus(0.22, 0.025, 8, 20, Math.PI * 0.85, 0x1c1f17, { metalness: 0.3, roughness: 0.6 })
  strap.position.set(0, 1.02, 0.02)
  strap.rotation.z = Math.PI / 2
  strap.rotation.y = Math.PI / 2
  pipGroup.add(strap)
  const pipBody = place(box(0.3, 0.24, 0.17, COLORS.pipboyBody, { roughness: 0.5, metalness: 0.3 }), 0, 1.24, 0.08)
  pipBody.rotation.x = THREE.MathUtils.degToRad(18)
  pipGroup.add(pipBody)
  const dialBezel = torus(0.1, 0.018, 10, 20, Math.PI * 2, 0x14180f, { metalness: 0.5 })
  dialBezel.position.set(-0.07, 1.27, 0.17)
  dialBezel.rotation.x = THREE.MathUtils.degToRad(90 - 18)
  pipGroup.add(dialBezel)

  const hudScreen = createHudScreen()
  const pipScreen = new THREE.Mesh(new THREE.CircleGeometry(0.085, 20), hudScreen.material)
  pipScreen.position.set(-0.07, 1.265, 0.166)
  pipScreen.rotation.x = -THREE.MathUtils.degToRad(18)
  pipGroup.add(pipScreen)

  for (let i = 0; i < 3; i++) {
    pipGroup.add(place(cylinder(0.018, 0.018, 0.025, 8, 0xb0582a), 0.11, 1.18 + i * 0.045, 0.17))
  }

  const pipGlowSprite = makeGlowSprite('#39ff14', 0.16)
  pipGlowSprite.position.set(-0.07, 1.27, 0.19)
  pipGroup.add(pipGlowSprite)
  glowSprites.push(pipGlowSprite)

  group.add(pipGroup)
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
    screenContent: { projetos: codeScreen, experiencia: gameScreen, contato: hudScreen },
  }
}
