import * as THREE from 'three'
import { fullscreenVertex, brightPassFragment, blurFragment, crtCompositeFragment } from './chunks.js'

function makeQuad(material) {
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const geo = new THREE.PlaneGeometry(2, 2)
  const mesh = new THREE.Mesh(geo, material)
  scene.add(mesh)
  return { scene, camera }
}

export class CRTComposer {
  constructor(renderer, width, height) {
    this.renderer = renderer
    this.size = new THREE.Vector2(width, height)
    this.time = 0

    const rtOptions = { type: THREE.HalfFloatType, colorSpace: THREE.SRGBColorSpace }
    this.sceneRT = new THREE.WebGLRenderTarget(width, height, rtOptions)

    const bw = Math.max(1, Math.floor(width / 2))
    const bh = Math.max(1, Math.floor(height / 2))
    this.brightRT = new THREE.WebGLRenderTarget(bw, bh, rtOptions)
    this.blurRT1 = new THREE.WebGLRenderTarget(bw, bh, rtOptions)
    this.blurRT2 = new THREE.WebGLRenderTarget(bw, bh, rtOptions)

    this.brightMat = new THREE.ShaderMaterial({
      vertexShader: fullscreenVertex,
      fragmentShader: brightPassFragment,
      uniforms: { tDiffuse: { value: null }, threshold: { value: 0.8 } },
    })
    this.blurMat = new THREE.ShaderMaterial({
      vertexShader: fullscreenVertex,
      fragmentShader: blurFragment,
      uniforms: {
        tDiffuse: { value: null },
        direction: { value: new THREE.Vector2(1, 0) },
        resolution: { value: new THREE.Vector2(bw, bh) },
      },
    })
    this.compositeMat = new THREE.ShaderMaterial({
      vertexShader: fullscreenVertex,
      fragmentShader: crtCompositeFragment,
      uniforms: {
        tScene: { value: null },
        tBloom: { value: null },
        resolution: { value: new THREE.Vector2(width, height) },
        time: { value: 0 },
        vignetteStrength: { value: 0.32 },
        scanlineStrength: { value: 0.07 },
        aberration: { value: 0.0022 },
        tint: { value: new THREE.Color(0.85, 1.0, 0.88) },
      },
    })

    this.brightQuad = makeQuad(this.brightMat)
    this.blurQuad = makeQuad(this.blurMat)
    this.compositeQuad = makeQuad(this.compositeMat)
  }

  setSize(width, height) {
    this.size.set(width, height)
    this.sceneRT.setSize(width, height)
    const bw = Math.max(1, Math.floor(width / 2))
    const bh = Math.max(1, Math.floor(height / 2))
    this.brightRT.setSize(bw, bh)
    this.blurRT1.setSize(bw, bh)
    this.blurRT2.setSize(bw, bh)
    this.blurMat.uniforms.resolution.value.set(bw, bh)
    this.compositeMat.uniforms.resolution.value.set(width, height)
  }

  render(scene, camera, delta) {
    this.time += delta
    const { renderer } = this

    renderer.setRenderTarget(this.sceneRT)
    renderer.render(scene, camera)

    this.brightMat.uniforms.tDiffuse.value = this.sceneRT.texture
    renderer.setRenderTarget(this.brightRT)
    renderer.render(this.brightQuad.scene, this.brightQuad.camera)

    this.blurMat.uniforms.tDiffuse.value = this.brightRT.texture
    this.blurMat.uniforms.direction.value.set(1, 0)
    renderer.setRenderTarget(this.blurRT1)
    renderer.render(this.blurQuad.scene, this.blurQuad.camera)

    this.blurMat.uniforms.tDiffuse.value = this.blurRT1.texture
    this.blurMat.uniforms.direction.value.set(0, 1)
    renderer.setRenderTarget(this.blurRT2)
    renderer.render(this.blurQuad.scene, this.blurQuad.camera)

    this.compositeMat.uniforms.tScene.value = this.sceneRT.texture
    this.compositeMat.uniforms.tBloom.value = this.blurRT2.texture
    this.compositeMat.uniforms.time.value = this.time
    renderer.setRenderTarget(null)
    renderer.setViewport(0, 0, this.size.x, this.size.y)
    renderer.render(this.compositeQuad.scene, this.compositeQuad.camera)
  }
}
