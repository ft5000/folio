import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

@Component({
  selector: 'app-logo',
  imports: [],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
})
export class LogoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('sceneContainer', { static: true }) sceneContainer!: ElementRef<HTMLDivElement>;

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
    this.renderer?.dispose();
  }

  private initScene(): void {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = null; // Transparent background

    // Camera
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

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0);
    this.sceneContainer.nativeElement.appendChild(this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(-5, 5, -5);
    this.scene.add(pointLight);

    // Mouse rotation
    this.mouseMoveHandler = (event: MouseEvent) => {
      const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
      this.targetRotationY = mouseX * 0.6;
      this.targetRotationX = mouseY * 0.3;
    };
    window.addEventListener('mousemove', this.mouseMoveHandler);

    // Touch rotation
    this.touchMoveHandler = (event: TouchEvent) => {
      if (event.touches.length === 0) return;
      const touch = event.touches[0];
      const touchX = (touch.clientX / window.innerWidth) * 2 - 1;
      const touchY = -(touch.clientY / window.innerHeight) * 2 + 1;
      this.targetRotationY = touchX * 1.2;
      this.targetRotationX = touchY * 0.6;
    };
    window.addEventListener('touchmove', this.touchMoveHandler, { passive: true });

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private loadFBX(): void {
    const loader = new FBXLoader();
    const fbxPath = 'models/onl_1.fbx';
    
    console.log('Attempting to load FBX from:', fbxPath);
    
    loader.load(
      fbxPath,
      (fbx) => {
        console.log('FBX loaded successfully:', fbx);
        this.fbxModel = fbx;

        // Compute original bounds
        const box = new THREE.Box3().setFromObject(fbx);
        const size = box.getSize(new THREE.Vector3());

        // Scale first
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 5 / maxDim : 1;
        fbx.scale.setScalar(scale);

        // Recompute center after scale, then offset to origin
        const scaledBox = new THREE.Box3().setFromObject(fbx);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
        fbx.position.sub(scaledCenter);

        console.log('Applied scale:', scale);

        // Traverse and set materials to white
        fbx.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            materials.forEach((mat) => {
              if (mat instanceof THREE.MeshPhongMaterial || mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshLambertMaterial) {
                (mat as any).color.setRGB(1, 1, 1);
              }
            });
          }
        });

        this.scene.add(fbx);
        console.log('FBX added to scene');
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
          console.log(`Loading FBX: ${percentComplete.toFixed(2)}%`);
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

    if (this.fbxModel) {
      this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 0.2;
      this.currentRotationX += (this.targetRotationX - this.currentRotationX) * 0.2;
      this.fbxModel.rotation.y = this.currentRotationY;
      this.fbxModel.rotation.x = this.currentRotationX;
    }

    this.renderer.render(this.scene, this.camera);
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
  }
}
