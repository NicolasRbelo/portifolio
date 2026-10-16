import * as THREE from 'three'

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ReinhardToneMapping
  renderer.toneMappingExposure = 2.7
  return renderer
}

const BASE_VERTICAL_FOV = 46
const MIN_HORIZONTAL_FOV = 82
const MAX_VERTICAL_FOV = 88

/** Keeps the room's horizontal extent visible even on tall/narrow viewports by
 * widening the vertical FOV until the implied horizontal FOV clears the floor. */
export function fovForAspect(aspect) {
  const baseRad = THREE.MathUtils.degToRad(BASE_VERTICAL_FOV)
  const horizontalRad = 2 * Math.atan(Math.tan(baseRad / 2) * aspect)
  const horizontalDeg = THREE.MathUtils.radToDeg(horizontalRad)
  if (horizontalDeg >= MIN_HORIZONTAL_FOV) return BASE_VERTICAL_FOV
  const neededHorizontalRad = THREE.MathUtils.degToRad(MIN_HORIZONTAL_FOV)
  const neededVerticalRad = 2 * Math.atan(Math.tan(neededHorizontalRad / 2) / aspect)
  return Math.min(THREE.MathUtils.radToDeg(neededVerticalRad), MAX_VERTICAL_FOV)
}

export const CAMERA_WIDE = {
  position: new THREE.Vector3(0.1, 2.15, 7.0),
  target: new THREE.Vector3(0, 1.45, -1.2),
}

// one close anchor per hotspot, framing that object's own screen/board
export const CAMERA_CLOSE_MAP = {
  projetos: {
    position: new THREE.Vector3(-2.3, 1.27, 1.45),
    target: new THREE.Vector3(-2.3, 1.2, 0.54),
  },
  experiencia: {
    position: new THREE.Vector3(0.3, 0.8, -1.55),
    target: new THREE.Vector3(0.3, 0.68, -2.78),
  },
  sobre: {
    position: new THREE.Vector3(2.55, 1.82, -2.1),
    target: new THREE.Vector3(2.95, 1.78, -3.6),
  },
  contato: {
    position: new THREE.Vector3(1.78, 1.5, 2.35),
    target: new THREE.Vector3(1.93, 1.28, 1.5),
  },
}

// the intro dolly-out starts here, close on the terminal screen
export const CAMERA_CLOSE = CAMERA_CLOSE_MAP.projetos

export const CLOSE_FOV = 26
export const ZOOM_FOV = 32

export function createCamera(aspect) {
  const camera = new THREE.PerspectiveCamera(CLOSE_FOV, aspect, 0.1, 50)
  camera.position.copy(CAMERA_CLOSE.position)
  camera.lookAt(CAMERA_CLOSE.target)
  camera.userData.wideFov = fovForAspect(aspect)
  return camera
}

export function createLights(scene) {
  const ambient = new THREE.AmbientLight(0x6a5a4c, 4.3)
  scene.add(ambient)

  const fill = new THREE.HemisphereLight(0x8d6c5c, 0x1a1414, 2.8)
  scene.add(fill)

  // chandelier candlelight, warm and slightly flickering in feel via a high color temp
  const overhead = new THREE.PointLight(0xffd9a0, 58, 11, 2)
  overhead.position.set(-0.4, 2.85, 0.8)
  scene.add(overhead)

  // crystal orb glow — the room's one cool, arcane light source
  const orbGlow = new THREE.PointLight(0x9a7bff, 38, 6.5, 2)
  orbGlow.position.set(-2.3, 1.6, 0.55)
  scene.add(orbGlow)

  const mirrorGlow = new THREE.PointLight(0x7fb0ff, 14, 4.2, 2)
  mirrorGlow.position.set(0.3, 1.3, -2.75)
  scene.add(mirrorGlow)

  // lights the grimoire-on-lectern prop (position matches the prop's x=2.0)
  const grimoireGlow = new THREE.PointLight(0xd8ad5a, 24, 5, 2)
  grimoireGlow.position.set(2.0, 1.3, 1.5)
  scene.add(grimoireGlow)

  // dedicated fill for the adventure map, which otherwise gets only ambient/rim light
  const mapLight = new THREE.PointLight(0xe8d9b8, 3.2, 3.6, 1.6)
  mapLight.position.set(2.85, 1.75, -3.35)
  scene.add(mapLight)

  const rim = new THREE.SpotLight(0xb89868, 55, 13, Math.PI / 4.2, 0.5, 1.4)
  rim.position.set(2.5, 3.2, 3.5)
  rim.target.position.set(0, 1, -1)
  scene.add(rim, rim.target)

  // the bed / nightstand corner sits far from every other light, so it needs its own
  const bedLight = new THREE.PointLight(0xe8d4b8, 20, 6.5, 2)
  bedLight.position.set(-3.2, 2.2, 1.8)
  scene.add(bedLight)

  const candleLight = new THREE.PointLight(0xffb84d, 9, 2.6, 2)
  candleLight.position.set(-3.6, 0.95, 2.9)
  scene.add(candleLight)

  // cool moonlight pouring through the window — the one cold light against all
  // the warm candle glow, what actually sells "high up, night air, not a cellar"
  const moonlight = new THREE.PointLight(0xb4c8ff, 7, 8, 2)
  moonlight.position.set(2.4, 2.0, 0.6)
  scene.add(moonlight)

  return { overhead }
}
