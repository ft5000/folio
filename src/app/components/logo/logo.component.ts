import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const POST_SHADER = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0.0 }, uInertia: { value: 0.0 }, uIsMobile: { value: 0 } },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uInertia;
    uniform float uIsMobile;
    varying vec2 vUv;

    vec2 hash2(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    float gnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
            dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
        mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
            dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    void main() {
      // Three fixed band sizes
      float ps1 = uIsMobile > 0.5 ? 0.0001  : 0.004;
      float ps2 = uIsMobile > 0.5 ? 0.005   : 0.008;
      float ps3 = uIsMobile > 0.5 ? 0.05    : 0.016;

      float n1 = pow(gnoise(vec2(floor(vUv.x / ps1) * ps1, vUv.y + uTime * 0.3) * 4.0) * 0.5 + 0.5, 2.0);
      float n2 = pow(gnoise(vec2(floor(vUv.x / ps2) * ps2, vUv.y + uTime * 0.2) * 4.0) * 0.5 + 0.5, 2.0);
      float n3 = pow(gnoise(vec2(floor(vUv.x / ps3) * ps3, vUv.y + uTime * 0.1) * 4.0) * 0.5 + 0.5, 2.0);
      float nFinal = (n1 + n2 + n3) / 3.0;

      // Coarse region gate — drifts slowly over time
      float region = pow(gnoise(floor(vUv * 6.0) / 6.0 * 3.0 + uTime * 0.08) * 0.5 + 0.5, 3.0);
      float mask = step(0.1, nFinal) * step(0.1, region);

      // Pick band size based on which noise layer is dominant
      float ps = n1 > n2 ? (n1 > n3 ? ps1 : ps3) : (n2 > n3 ? ps2 : ps3);
      float bandX  = floor(vUv.x / ps) * ps;
      float bandId = floor(vUv.x / ps);
      float offset = (fract(sin(bandId * 127.1) * 43758.5453) * 2.0 - 1.0) * uInertia * ps;

      vec4 sceneColor  = texture2D(tDiffuse, vUv);
      float inertiaFactor = smoothstep(0.0, 0.02, uInertia);
      vec2 sampleUv    = vec2(mix(vUv.x, bandX + ps * 0.5, inertiaFactor), clamp(vUv.y + offset, 0.0, 1.0));
      vec4 distorted   = mix(sceneColor, texture2D(tDiffuse, sampleUv), mask);

      // Chromatic aberration scaled by inertia * band size
      float ca = uInertia * ps * 2.0;
      float r = texture2D(tDiffuse, sampleUv + vec2( ca, 0.0)).r;
      float g = distorted.g;
      float b = texture2D(tDiffuse, sampleUv - vec2( ca, 0.0)).b;

      gl_FragColor = vec4(mix(distorted.rgb, vec3(r, g, b), mask * inertiaFactor), distorted.a);
    }
  `,
};

@Component({
  selector: 'app-logo',
  imports: [],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
})
export class LogoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('sceneContainer', { static: true }) sceneContainer!: ElementRef<HTMLDivElement>;

  @Input() public isMobile: boolean = false;

  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private renderer!: THREE.WebGLRenderer;
  private animationFrameId?: number;
  private fbxModel?: THREE.Group;
  private targetRotationX = 0;
  private targetRotationY = 0;
  private currentRotationX = 0;
  private currentRotationY = 0;
  private mouseMoveHandler!: (e: MouseEvent) => void;
  private touchMoveHandler!: (e: TouchEvent) => void;
  private touchActive = false;
  private composer!: EffectComposer;
  private shaderPass!: ShaderPass;
  private clock = new THREE.Clock();
  private prevRotationX = 0;
  private prevRotationY = 0;
  private inertia = 0;

  ngAfterViewInit(): void {
    this.initScene();
    this.loadFBX();
    this.animate();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('mousemove', this.mouseMoveHandler);
    window.removeEventListener('touchmove', this.touchMoveHandler);
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.composer?.dispose();
    this.renderer?.dispose();
  }

  private initScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = null;

    const width = this.sceneContainer.nativeElement.clientWidth;
    const height = this.sceneContainer.nativeElement.clientHeight;
    const aspect = width / height;
    const frustum = 5;
    this.camera = new THREE.OrthographicCamera(
      -frustum * aspect, frustum * aspect,
      frustum, -frustum,
      0.1, 1000
    );
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0);
    this.sceneContainer.nativeElement.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
    directionalLight.position.set(5, 0, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-4, 2, 3);
    this.scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffffff, 1.5);
    rimLight.position.set(-3, -4, -6);
    this.scene.add(rimLight);

    this.mouseMoveHandler = (event: MouseEvent) => {
      const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
      this.targetRotationY = mouseX * 0.6;
      this.targetRotationX = mouseY * 0.3;
    };
    window.addEventListener('mousemove', this.mouseMoveHandler);

    this.touchMoveHandler = (event: TouchEvent) => {
      if (event.touches.length === 0) return;
      const touch = event.touches[0];
      const touchX = (touch.clientX / window.innerWidth) * 2 - 1;
      const touchY = -(touch.clientY / window.innerHeight) * 2 + 1;
      this.targetRotationY = touchX * 1.2;
      this.targetRotationX = touchY * 0.6;
      this.touchActive = true;
    };
    window.addEventListener('touchmove', this.touchMoveHandler, { passive: true });
    window.addEventListener('touchend', () => { this.touchActive = false; });
    window.addEventListener('touchcancel', () => { this.touchActive = false; });

    window.addEventListener('resize', this.onWindowResize.bind(this));

    const dpr = window.devicePixelRatio;
    const rt = new THREE.WebGLRenderTarget(
      width * dpr, height * dpr,
      { format: THREE.RGBAFormat, samples: 8 }
    );
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.shaderPass = new ShaderPass(POST_SHADER);
    this.composer.addPass(this.shaderPass);
  }

  private loadFBX(): void {
    const loader = new FBXLoader();
    const fbxPath = 'models/onl_1.fbx';
    
    loader.load(
      fbxPath,
      (fbx) => {
        this.fbxModel = fbx;

        const box = new THREE.Box3().setFromObject(fbx);
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 5 / maxDim : 1;
        fbx.scale.setScalar(scale);

        const scaledBox = new THREE.Box3().setFromObject(fbx);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
        fbx.position.sub(scaledCenter);

        this.scene.add(fbx);
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
        }
      },
      (error) => {
        console.error('Error loading FBX:', error);
        console.error('Failed to load from path:', fbxPath);
        console.error('Full error details:', error);
      }
    );
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    const elapsed = this.clock.getElapsedTime();
    this.shaderPass.uniforms['uTime'].value = elapsed;
    this.shaderPass.uniforms['uIsMobile'].value = this.isMobile ? 1 : 0;

    if (this.fbxModel) {
      if (this.isMobile && !this.touchActive) {
        this.targetRotationX += (0 - this.targetRotationX) * 0.05;
        this.targetRotationY += (0 - this.targetRotationY) * 0.05;
      }
      const dY = this.targetRotationY - this.currentRotationY;
      const dX = this.targetRotationX - this.currentRotationX;
      this.currentRotationY += Math.abs(dY) > 0.0001 ? dY * 0.2 : dY;
      this.currentRotationX += Math.abs(dX) > 0.0001 ? dX * 0.2 : dX;
      this.fbxModel.rotation.y = this.currentRotationY;
      this.fbxModel.rotation.x = this.currentRotationX;

      const velX = Math.abs(this.currentRotationX - this.prevRotationX);
      const velY = Math.abs(this.currentRotationY - this.prevRotationY);
      const speed = velX + velY;
      this.inertia += (speed * 0.5 - this.inertia) * 0.1;
      if (this.inertia < 0.000001) this.inertia = 0;
      this.shaderPass.uniforms['uInertia'].value = this.inertia;

      this.prevRotationX = this.currentRotationX;
      this.prevRotationY = this.currentRotationY;
    }

    this.composer.render();
  }

  private onWindowResize(): void {
    const width = this.sceneContainer.nativeElement.clientWidth;
    const height = this.sceneContainer.nativeElement.clientHeight;

    const aspect = width / height;
    const frustum = 5;
    (this.camera as THREE.OrthographicCamera).left   = -frustum * aspect;
    (this.camera as THREE.OrthographicCamera).right  =  frustum * aspect;
    (this.camera as THREE.OrthographicCamera).top    =  frustum;
    (this.camera as THREE.OrthographicCamera).bottom = -frustum;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width * window.devicePixelRatio, height * window.devicePixelRatio);
  }
}
