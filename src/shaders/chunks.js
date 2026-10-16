export const fullscreenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export const brightPassFragment = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform float threshold;
  varying vec2 vUv;
  void main() {
    vec3 color = texture2D(tDiffuse, vUv).rgb;
    float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float factor = smoothstep(threshold, threshold + 0.35, lum);
    gl_FragColor = vec4(color * factor, 1.0);
  }
`

export const blurFragment = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform vec2 direction;
  uniform vec2 resolution;
  varying vec2 vUv;
  void main() {
    vec2 texel = direction / resolution;
    vec3 sum = texture2D(tDiffuse, vUv).rgb * 0.227027;
    sum += texture2D(tDiffuse, vUv + texel * 1.384615).rgb * 0.316216;
    sum += texture2D(tDiffuse, vUv - texel * 1.384615).rgb * 0.316216;
    sum += texture2D(tDiffuse, vUv + texel * 3.230769).rgb * 0.070270;
    sum += texture2D(tDiffuse, vUv - texel * 3.230769).rgb * 0.070270;
    gl_FragColor = vec4(sum, 1.0);
  }
`

export const crtCompositeFragment = /* glsl */ `
  uniform sampler2D tScene;
  uniform sampler2D tBloom;
  uniform vec2 resolution;
  uniform float time;
  uniform float vignetteStrength;
  uniform float scanlineStrength;
  uniform float aberration;
  uniform vec3 tint;
  varying vec2 vUv;

  float rand(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;

    // subtle barrel curvature
    vec2 centered = uv * 2.0 - 1.0;
    float r2 = dot(centered, centered);
    centered *= 1.0 + 0.035 * r2;
    uv = centered * 0.5 + 0.5;

    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    float ab = aberration * (0.4 + r2);
    float rC = texture2D(tScene, uv + vec2(ab, 0.0)).r;
    float gC = texture2D(tScene, uv).g;
    float bC = texture2D(tScene, uv - vec2(ab, 0.0)).b;
    vec3 color = vec3(rC, gC, bC);

    vec3 bloom = texture2D(tBloom, uv).rgb;
    color += bloom * 0.62;

    float scan = sin((uv.y * resolution.y) * 1.0 + time * 6.0) * 0.5 + 0.5;
    color -= scan * scanlineStrength;

    float lineMask = mod(gl_FragCoord.y, 2.0) < 1.0 ? 1.0 : 0.0;
    color -= lineMask * 0.07;

    float vig = smoothstep(1.05, 0.2, length(centered));
    color *= mix(1.0 - vignetteStrength, 1.0, vig);

    float grain = (rand(uv * time * 60.0) - 0.5) * 0.05;
    color += grain;

    color = mix(color, color * tint, 0.18);

    gl_FragColor = vec4(color, 1.0);
  }
`
