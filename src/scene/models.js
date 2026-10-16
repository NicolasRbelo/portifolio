import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

/** Loads a handful of small CC0 glTF props (see ASSETS_CREDITS.md) to sit alongside
 * the room's procedural geometry. Loading is async and fire-and-forget: each model
 * pops into the already-rendering scene once its (tiny, <60KB) file arrives. */

const loader = new GLTFLoader()
const base = import.meta.env.BASE_URL

export function loadModel(file) {
  return loader.loadAsync(`${base}models/${file}`).then((gltf) => gltf.scene)
}
