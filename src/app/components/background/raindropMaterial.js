import * as THREE from "three";
import { MeshStandardNodeMaterial } from "three/webgpu";
import { color, 
    sin, 
    time,
    vec2,
    vec3,
    vec4,
    uv,
    mix,
    max,
    abs,
    mod,
    dot,
    floor,
    smoothstep,
    clamp,
    length,
    normalWorld,
    uniform,
    fract,
    texture,
    screenUV,
} from "three/tsl";
import {hashBlur} from 'three/addons/tsl/display/hashBlur.js';
import { gaussianBlur, premultipliedGaussianBlur } from  'three/addons/tsl/display/GaussianBlurNode.js';

function S(a, b, t) {
    return smoothstep(a, b, t);
}

function N21(p) {
    p = fract(p.mul(vec2(123.34, 345.45)));
    p = p.add(dot(p, p.add(34.345)));
    return fract(p.x.mul(p.y));
}

export default function createWindowMaterial(bgTexture, cubemap) {
    const material = new MeshStandardNodeMaterial({
        envMap: cubemap,
    });
    let t = mod(time.y.mul(1.0), 6000.0);
    let size = 40.0;
    let distortion = -5.0;

    let aspect = vec2(3.0, 0.6);
    let _uv = vec2(uv().mul(size).mul(aspect));
    _uv = vec2(_uv.x, _uv.y.add(t.mul(0.5)));

    const gv = fract(_uv).sub(0.5);
    let id = floor(_uv);

    let c = vec3(0.0, 0.0, 0.0);

    let n = N21(id);
    t = t.add(n.mul(6.2831).mul(2.0));

    // wiggle x
    let w = _uv.y.mul(2.0)
    let x = (n.sub(0.5)).mul(0.45);
    x = x.add(uniform(0.2).sub(abs(x)).mul(sin(w.mul(0.1)).mul(sin(w).pow(2)).mul(0.5)));

    let y = sin(t.add(sin(t.add(sin(t.mul(0.5)))))).negate().mul(0.25);
    y = y.sub((gv.x.sub(x)).mul(gv.x.sub(x)));

    let dropPos = (gv.sub(vec2(x, y))).div(aspect);
    let drop = S(0.04, 0.01, length(dropPos));

    let trailPos = (gv.sub(vec2(x, t.mul(0.25)))).div(aspect);
    trailPos = vec2(trailPos.x, (fract(trailPos.y.mul(8.0)).sub(0.5)).div(max(8.0, 0.0001)));
    let trail = S(0.03, 0.01, length(trailPos));
    let fogTrail = S(-0.05, 0.05, dropPos.y);
    fogTrail = fogTrail.mul(S(0.5, y, gv.y));
    trail = trail.mul(fogTrail);
    fogTrail = fogTrail.mul(S(0.05, 0.01, abs(dropPos.x)));

    c = c.add(fogTrail.mul(0.1)).add(trail).add(drop);
    let alpha = clamp(length(c), 0.0, 1.0);
    alpha = S(0.0, 0.2, alpha);

    let offset = (drop.mul(dropPos)).add(trail.mul(trailPos).mul(0.5)).add(fogTrail.mul(-0.0015));
    let distortedUV = screenUV.add(offset.mul(distortion));

    let blurredbgTexture = hashBlur(bgTexture, 0.02);
    bgTexture.uvNode = distortedUV;

    let finalColor = blurredbgTexture;

    // // contrast and brightness
    // finalColor = finalColor.pow(1.9).mul(1.2);

    // // tint
    // finalColor = vec3(finalColor.r.mul(4.0), finalColor.g.mul(0.9), finalColor.b.mul(1.0));
    
    material.colorNode = finalColor;

    // material.emissiveNode = blurredbgTexture.pow(10).mul(10.0);
    material.emissiveNode = blurredbgTexture.pow(8).mul(2.0);
    // material.emissiveIntensity = 1.0;
    
    material.envMapIntensity = 0.02;
    material.transparent = true;
    material.metalness = 0.5;
    material.roughness = 0.0;


    return material;
}