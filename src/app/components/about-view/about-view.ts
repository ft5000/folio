import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { AppService } from '../../services/app';

@Component({
  selector: 'app-about-view',
  imports: [CommonModule],
  templateUrl: './about-view.html',
  styleUrl: './about-view.scss',
})
export class AboutView implements OnInit, OnDestroy, AfterViewInit {
  private isMobile: boolean = false;
  private useMobileLayout: boolean = false;
  private observer: IntersectionObserver | undefined;
  private animationFrameId: number | null = null;
  private glContext: WebGL2RenderingContext | null = null;
  private scene!: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private threeRenderer!: THREE.WebGLRenderer;
  private mesh: THREE.Object3D | null = null;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private rotX: number = 0;
  private rotY: number = 0;
  private renderTarget!: THREE.WebGLRenderTarget;
  private postScene!: THREE.Scene;
  private postCamera!: THREE.OrthographicCamera;
  private shaderMaterial!: THREE.ShaderMaterial;
  private canvasElement!: HTMLCanvasElement;
  private frameCount: number = 0;
  private lastWidth: number = 0;
  public rendering: boolean = true;

  private animationPositions: Array<{ x: number; y: number }> = 
  [{ x: 0.5, y: -1.0 }, { x: 0.5, y: 1.0 }, { x: -1.0, y: -1.0 }, { x: -1.0, y: 1.0 }];
  private animationIndex: number = 0;
  private transitionProgress: number = 0;
  private transitionDuration: number = 360; // frames

  private subscription: Subscription = new Subscription();

  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef;

  constructor(private renderer: Renderer2, private appService: AppService) {}

  ngOnInit() {
    document.body.style.setProperty('--fg-color', 'white');
    document.body.style.setProperty('--bg-color', 'black');
    
    window.addEventListener('mousemove', this.onMouseMove.bind(this));

    this.subscription.add(this.appService.isMobile$.subscribe(value => {
      this.isMobile = value;
    }));

    this.subscription.add(this.appService.useMobileLayout$.subscribe(value => {
      this.useMobileLayout = value;
    }));
  }

  ngAfterViewInit() {    
    const canvasEl = this.renderer.createElement('canvas');
    this.lastWidth = window.innerWidth;
    canvasEl.style.width = this.lastWidth + 'px';
    canvasEl.style.height = window.innerHeight + 'px';
    this.renderer.setAttribute(canvasEl, 'id', 'about-bg');
    this.renderer.appendChild(this.canvasContainer.nativeElement, canvasEl);
    this.canvasElement = canvasEl;
    
    requestAnimationFrame(() => {
      this.initThreeJS(canvasEl);
    });

    this.observer = new IntersectionObserver(
      (entries) => {
      entries.forEach(entry => {
        if (entry.target.id === 'about-content') {
          const aboutView = document.querySelector('.about-view');

          if (entry.isIntersecting) {
            aboutView?.classList.add('show-bg');
          } else {
            aboutView?.classList.remove('show-bg');
          }
        }
    });
  },
  { threshold: 0.5 });

    const aboutContent = document.getElementById('about-content');
    if (aboutContent) {
      this.observer.observe(aboutContent);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.observer?.disconnect();
    window.removeEventListener('mousemove', this.onMouseMove.bind(this));
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.threeRenderer) {
      this.threeRenderer.dispose();
    }
    if (this.mesh) {
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
  }

  private initThreeJS(canvas: HTMLCanvasElement) {
    this.appService.loading = true;
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    
    const aspect = width / height;
    const frustumSize = aspect < 1 ? 150 / aspect : 150;
    this.camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 100);
    this.camera.lookAt(0, 0, 0);
    const mobileZoom = Math.max(1.8, Math.min(2.6, height * 0.00375));
    this.camera.zoom = this.useMobileLayout ? mobileZoom : 2.0;
    this.camera.updateProjectionMatrix();
    
    this.threeRenderer = new THREE.WebGLRenderer({ 
      canvas: canvas,
      antialias: true,
      alpha: true 
    });
    this.threeRenderer.setSize(width, height);
    this.threeRenderer.setPixelRatio(window.devicePixelRatio);
    
    this.renderTarget = new THREE.WebGLRenderTarget(
      width * window.devicePixelRatio, 
      height * window.devicePixelRatio
    );
    
    this.postScene = new THREE.Scene();
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    Promise.all([
      fetch('/ascii/shader.vert').then(r => r.text()),
      fetch('/ascii/shader.frag').then(r => r.text()),
      new THREE.TextureLoader().loadAsync(`/ascii/ascii_charset_${this.useMobileLayout ? '24x40' : '20x12'}_8_blue.png`)
    ]).then(([vertShader, fragShader, charSetTexture]) => {
      charSetTexture.minFilter = THREE.NearestFilter;
      charSetTexture.magFilter = THREE.NearestFilter;
      
      this.shaderMaterial = new THREE.ShaderMaterial({
          uniforms: {
          tex: { value: this.renderTarget.texture },
          charSet: { value: charSetTexture },
          charSetLength: { value: 8 },
          pixelWidth: { value: this.useMobileLayout ? 24 : 12 },
          pixelHeight: { value: this.useMobileLayout ? 40 : 20 },
          resolution: { value: new THREE.Vector2(width * window.devicePixelRatio, height * window.devicePixelRatio) }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vUv.y = 1.0 - vUv.y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: fragShader.replace('uv.y = 1.0 - uv.y;', '')
      });
      
      const quad = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        this.shaderMaterial
      );
      this.postScene.add(quad);
    });
    
    if (this.useMobileLayout) {
      this.animateMobile();
    } else {
      this.animate();
    }
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
    this.scene.add(ambientLight);
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
    keyLight.position.set(100, 200, 200);
    this.scene.add(keyLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-100, 10, 50);
    this.scene.add(fillLight);
    
    const rimLight1 = new THREE.DirectionalLight(0xffffff, 5.0);
    rimLight1.position.set(-100, 50, -150);
    this.scene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0xffffff, 5.0);
    rimLight2.position.set(100, 50, -150);
    this.scene.add(rimLight2);
    
    const loader = new FBXLoader();
    loader.load(
      '/ascii/skull/source/skull.fbx',
      (object) => {
        let meshCount = 0;
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            meshCount++;
            child.material = new THREE.MeshStandardMaterial({ 
              color: 0xffffff,
              metalness: 0.0,
              roughness: 1.0,
              side: THREE.DoubleSide
            });
          }
        });
        
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleModifier = window.innerHeight < 768 ? 1.2 : 1.0;
        const scale = (100 / maxDim) * scaleModifier;
        
        object.position.sub(center);
        object.scale.setScalar(scale);
        
        object.position.y -= 20;
        
        this.mesh = object;
        this.scene.add(object);

        addEventListener('resize', this.onResize.bind(this));

        this.rendering = false;
        this.appService.loading = false;
      },
      (xhr) => {
        const percent = xhr.lengthComputable ? (xhr.loaded / xhr.total * 100).toFixed(1) : 'unknown';
      },
      (error) => {
        console.error('Error loading skull:', error);
        this.appService.loading = false;
      }
    );
  }

  private onResize(): void {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    if (Math.abs(newWidth - this.lastWidth) < 1) {
      return;
    }
    
    this.lastWidth = newWidth;
    
    this.canvasElement.style.width = newWidth + 'px';
    this.canvasElement.style.height = newHeight + 'px';
    this.threeRenderer.setSize(newWidth, newHeight);
    this.renderTarget.setSize(
      newWidth * window.devicePixelRatio, 
      newHeight * window.devicePixelRatio
    );
    
    const aspect = newWidth / newHeight;
    const frustumSize = aspect < 1 ? 150 / aspect : 150;
    this.camera.left = frustumSize * aspect / -2;
    this.camera.right = frustumSize * aspect / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = frustumSize / -2;
    const mobileZoom = Math.max(1.8, Math.min(3.0, newHeight * 0.00375));
    this.camera.zoom = this.useMobileLayout ? mobileZoom : 2.0;
    this.camera.updateProjectionMatrix();
          
    if (this.shaderMaterial) {
      this.shaderMaterial.uniforms['resolution'].value.set(
        newWidth * window.devicePixelRatio, 
        newHeight * window.devicePixelRatio
      );
    }
  }

  private onMouseMove(event: MouseEvent): void {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  private animateMobile(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animateMobile());
    
    if (this.mesh) {
      this.transitionProgress += 1;
      if (this.transitionProgress >= this.transitionDuration) {
        this.transitionProgress = 0;
        this.animationIndex = (this.animationIndex + 1) % this.animationPositions.length;
      }

      const t = this.transitionProgress / this.transitionDuration;
      const easedT = this.easeInOutCubic(t);

      const currentPos = this.animationPositions[this.animationIndex];
      const nextPos = this.animationPositions[(this.animationIndex + 1) % this.animationPositions.length];

      const interpX = currentPos.x + (nextPos.x - currentPos.x) * easedT;
      const interpY = currentPos.y + (nextPos.y - currentPos.y) * easedT;

      const targetRotX = this.map(interpX, -1, 1, -Math.PI * 0.1, Math.PI * 0.1);
      const targetRotY = this.map(interpY, -1, 1, -Math.PI * 0.2, Math.PI * 0.2);
      
      this.rotX = targetRotX;
      this.rotY = targetRotY;
      this.mesh.position.y = Math.sin(this.frameCount * 0.01) * 2 + 10;
      this.mesh.rotation.y = this.rotY;
      this.mesh.rotation.x = this.rotX;
    }

    const useShader = true;
    
    if (useShader && this.renderTarget && this.shaderMaterial) {
      this.threeRenderer.setRenderTarget(this.renderTarget);
      this.threeRenderer.render(this.scene, this.camera);
      this.threeRenderer.setRenderTarget(null);
      this.threeRenderer.render(this.postScene, this.postCamera);
    } else {
      this.threeRenderer.render(this.scene, this.camera);
    }

    this.frameCount++;
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    
    if (this.mesh) {
      this.mesh.position.y = Math.sin(this.frameCount * 0.01) * 2 + 10;

      const targetRotX = this.map(this.mouseY, 0, window.innerHeight, -Math.PI * 0.1, Math.PI * 0.1);
      const targetRotY = this.map(this.mouseX, 0, window.innerWidth, -Math.PI * 0.2, Math.PI * 0.2);
      this.rotX = THREE.MathUtils.lerp(this.rotX, targetRotX, 0.1);
      this.rotY = THREE.MathUtils.lerp(this.rotY, targetRotY, 0.1);
      this.mesh.rotation.x = this.rotX;
      this.mesh.rotation.y = this.rotY;
    }
    
    const useShader = true;
    
    if (useShader && this.renderTarget && this.shaderMaterial) {
      this.threeRenderer.setRenderTarget(this.renderTarget);
      this.threeRenderer.render(this.scene, this.camera);
      this.threeRenderer.setRenderTarget(null);
      this.threeRenderer.render(this.postScene, this.postCamera);
    } else {
      this.threeRenderer.render(this.scene, this.camera);
    }

    this.frameCount++;
  }

  private map(value: number, start1: number, stop1: number, start2: number, stop2: number): number {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  public getSpacerContent(): string {
    return ' ';
  }

  public get year(): number {
    return new Date().getFullYear();
  }
}
