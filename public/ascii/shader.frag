#ifdef GL_ES
precision mediump float;
#endif

uniform float pixelWidth;
uniform float pixelHeight;
uniform sampler2D tex;
uniform vec2 resolution;

uniform sampler2D charSet;
uniform float charSetLength;

vec4 getCharColor(vec2 uv, float b) {
    vec2 localUV = fract(uv * resolution.xy / vec2(pixelWidth, pixelHeight));
    float count = charSetLength;
    float contrast = 1.1;
    float adjustedB = (b - 0.5) * contrast + 0.5;
    float idx = clamp(floor((1.0 - adjustedB) * count), 0.0, count - 1.0);
    vec2 charSetUV = vec2((idx + localUV.x) / count, localUV.y);
    return texture2D(charSet, charSetUV);
}

vec4 blur(sampler2D image, vec2 uv) {
    vec4 sum = vec4(0.0);
    float count = 0.0;
    vec2 pixelSize = vec2(pixelWidth, pixelHeight) / resolution.xy;
    
    for (float x = -1.0; x <= 1.0; x += 1.0) {
        for (float y = -1.0; y <= 1.0; y += 1.0) {
            vec2 offset = vec2(x, y) * pixelSize * 0.2;
            sum += texture2D(image, uv + offset);
            count += 1.0;
        }
    }
    return sum / count;
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    uv.y = 1.0 - uv.y;
    vec2 pixelatedUV = floor(uv * resolution.xy / vec2(pixelWidth, pixelHeight)) * vec2(pixelWidth, pixelHeight) / resolution.xy;
    vec4 color = blur(tex, pixelatedUV);
    float b = (color.r + color.g + color.b) / 3.0;
    vec4 charColor = getCharColor(uv, b);
    gl_FragColor = charColor;
}