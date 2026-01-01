import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild, viewChild } from '@angular/core';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

@Component({
  selector: 'app-about-view',
  imports: [CommonModule],
  templateUrl: './about-view.html',
  styleUrl: './about-view.scss',
})
export class AboutView implements OnInit, OnDestroy, AfterViewInit {
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

  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef;

  constructor(private renderer: Renderer2, private elementRef: ElementRef) {}

  ngOnInit() {
    document.body.style.setProperty('--fg-color', 'white');
    document.body.style.setProperty('--bg-color', 'black');
    
    // Track mouse movement
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
  }

  ngAfterViewInit() {
    const canvasEl = this.renderer.createElement('canvas');
    canvasEl.style.width = window.innerWidth + 'px';
    canvasEl.style.height = window.innerHeight + 'px';
    this.renderer.setAttribute(canvasEl, 'id', 'about-bg');
    this.renderer.appendChild(this.canvasContainer.nativeElement, canvasEl);
    this.canvasElement = canvasEl;
    
    // Wait for next frame to ensure canvas is in DOM with proper size
    requestAnimationFrame(() => {
      this.initThreeJS(canvasEl);
    });
    // this.renderer.appendChild(this.canvasContainer.nativeElement, el);

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

    // Observe ONLY the about-content element
    const aboutContent = document.getElementById('about-content');
    if (aboutContent) {
      this.observer.observe(aboutContent);
    }
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    window.removeEventListener('mousemove', this.onMouseMove.bind(this));
    
    // Clean up Three.js resources
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.threeRenderer) {
      this.threeRenderer.dispose();
    }
    if (this.mesh) {
      // Traverse the object and dispose of geometries and materials
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
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    
    this.scene = new THREE.Scene();
    
    const aspect = width / height;
    const frustumSize = 150;
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
    this.camera.zoom = 1.5;
    this.camera.updateProjectionMatrix();
    
    // Create renderer
    this.threeRenderer = new THREE.WebGLRenderer({ 
      canvas: canvas,
      antialias: true,
      alpha: true 
    });
    this.threeRenderer.setSize(width, height);
    this.threeRenderer.setPixelRatio(window.devicePixelRatio);
    
    // Create render target for post-processing
    this.renderTarget = new THREE.WebGLRenderTarget(width, height);
    
    // Setup post-processing scene
    this.postScene = new THREE.Scene();
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    // Load shaders and character set
    Promise.all([
      fetch('/ascii/shader.vert').then(r => r.text()),
      fetch('/ascii/shader.frag').then(r => r.text()),
      new THREE.TextureLoader().loadAsync('/ascii/ascii_charset_20x12_8_blue.png')
    ]).then(([vertShader, fragShader, charSetTexture]) => {
      charSetTexture.minFilter = THREE.NearestFilter;
      charSetTexture.magFilter = THREE.NearestFilter;
      
      // Create shader material
      this.shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
          tex: { value: this.renderTarget.texture },
          charSet: { value: charSetTexture },
          charSetLength: { value: 8 },
          pixelWidth: { value: 12 },
          pixelHeight: { value: 20 },
          resolution: { value: new THREE.Vector2(width, height) }
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
      
      // Create fullscreen quad
      const quad = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        this.shaderMaterial
      );
      this.postScene.add(quad);
    });
    
    // Start rendering loop immediately
    this.animate();
    
    // Add dramatic lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
    this.scene.add(ambientLight);
    
    // Key light - very strong from top-front-right
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
    keyLight.position.set(100, 200, 200);
    this.scene.add(keyLight);
    
    // Fill light - minimal from left
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-100, 10, 50);
    this.scene.add(fillLight);
    
    // Rim light - strong from behind for edge definition
    const rimLight1 = new THREE.DirectionalLight(0xffffff, 5.0);
    rimLight1.position.set(-100, 50, -150);
    this.scene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0xffffff, 5.0);
    rimLight2.position.set(100, 50, -150);
    this.scene.add(rimLight2);
    
    // Load skull model
    const loader = new OBJLoader();
    loader.load(
      '/ascii/skull/source/skull.obj',
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
        const scale = 150 / maxDim;
        
        // First center the object at origin before scaling
        object.position.sub(center);
        object.scale.setScalar(scale);
        
        // Move down slightly
        object.position.y -= 10;
        
        this.mesh = object;
        this.scene.add(object);

        addEventListener('resize', () => {
          const newWidth = this.canvasElement.clientWidth || window.innerWidth;
          const newHeight = this.canvasElement.clientHeight || window.innerHeight;
          this.canvasElement.style.width = newWidth + 'px';
          this.canvasElement.style.height = newHeight + 'px';
          this.threeRenderer.setSize(newWidth, newHeight);
          this.renderTarget.setSize(newWidth, newHeight);
          const aspect = newWidth / newHeight;
          const frustumSize = 150;
          this.camera.left = frustumSize * aspect / -2;
          this.camera.right = frustumSize * aspect / 2;
          this.camera.top = frustumSize / 2;
          this.camera.bottom = frustumSize / -2;
          this.camera.updateProjectionMatrix();
                
                // if (this.shaderMaterial) {
                // this.shaderMaterial.uniforms['resolution'].value.set(newWidth, newHeight);
                // }
        });
      },
      (xhr) => {
        // Progress callback - suppress console logging
        const percent = xhr.lengthComputable ? (xhr.loaded / xhr.total * 100).toFixed(1) : 'unknown';
        // Optionally show loading progress in UI instead of console
      },
      (error) => {
        console.error('Error loading skull:', error);
      }
    );
  }

  private onMouseMove(event: MouseEvent): void {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    
    if (this.mesh) {
      // Map mouse position to rotation angles
      const targetRotX = this.map(this.mouseY, 0, window.innerHeight, -Math.PI * 0.2, Math.PI * 0.2);
      const targetRotY = this.map(this.mouseX, 0, window.innerWidth, -Math.PI * 0.3, Math.PI * 0.3);
      
      // Smooth interpolation
      this.rotX = THREE.MathUtils.lerp(this.rotX, targetRotX, 0.1);
      this.rotY = THREE.MathUtils.lerp(this.rotY, targetRotY, 0.1);
      
      // Apply rotations
      this.mesh.rotation.x = this.rotX;
      this.mesh.rotation.y = this.rotY;
    }
    
    // Toggle shader: set to false to disable post-processing
    const useShader = true;
    
    if (useShader && this.renderTarget && this.shaderMaterial) {
      // Render scene to render target
      this.threeRenderer.setRenderTarget(this.renderTarget);
      this.threeRenderer.render(this.scene, this.camera);
      
      // Render post-processing pass
      this.threeRenderer.setRenderTarget(null);
      this.threeRenderer.render(this.postScene, this.postCamera);
    } else {
      // Direct rendering without shader
      this.threeRenderer.render(this.scene, this.camera);
    }
  }

  private map(value: number, start1: number, stop1: number, start2: number, stop2: number): number {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
  }

  public getSpacerContent(): string {
    return ' ';
  }

  public get year(): number {
    return new Date().getFullYear();
  }
}
