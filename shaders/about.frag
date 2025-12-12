#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_tex;

in vec2 vTexCoord;
out vec4 fragColor;

vec4 permute(vec4 x) {
    return mod(((x*34.0)+1.0)*x, 289.0);
}

vec2 fade(vec2 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

float cnoise(vec2 P){
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 * 
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

void main() {
    // Time that never decreases (good for movement speed)
    float time = u_time + 100.0;

    // *** LOOPING NOISE TIME (key fix!) ***
    // Keeps noise coords small & prevents runaway distortion
    float ntime = sin(u_time * 0.001) * 100.0;

    // Coordinates
    vec2 movedCoord = vTexCoord;
    movedCoord = movedCoord * 0.75 + 0.1;
    movedCoord.y = 1.0 - movedCoord.y;

    float brightness = texture(u_tex, movedCoord).r;
    float mappedBrightness = mix(0.01, 1.0, brightness);

    // Distortion intensity oscillates mildly
    float distortionAmount = mix(
        0.05,
        0.1,
        0.5 + 0.5 * sin(u_time * 0.5)
    );

    // ----------------------------
    // Vertical distortion (stable)
    // ----------------------------
    float noiseY = cnoise(vec2(0.0, movedCoord.y * 8.0 + ntime));

    movedCoord.y = sin(
        movedCoord.y -
        time * 0.05 * mappedBrightness * noiseY
    ) * distortionAmount + movedCoord.y;

    // Edge fade and clamp
    float edgeFade = smoothstep(0.001, 0.01, min(movedCoord.y, 1.0 - movedCoord.y));
    movedCoord.y = clamp(movedCoord.y, 0.0, 1.0);

    // ----------------------------
    // Horizontal distortion (stable)
    // ----------------------------
    float noiseX = cnoise(vec2(movedCoord.y * 10.0 + ntime, ntime));
    movedCoord.x += noiseX * 0.001;

    // Final color
    vec4 texColor = texture(u_tex, movedCoord);
    fragColor = vec4(texColor.rgb * edgeFade, 1.0);
}