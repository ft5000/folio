import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { WebGPURenderer, PostProcessing } from 'three/webgpu';
import { pass, texture, screenUV } from 'three/tsl';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import createWindowMaterial from './raindropMaterial.js';

const bloomParams = {
    strength: 10.0,
    radius: 0.5,
    threshold: 0.0
};

@Component({
  selector: 'background',
  imports: [],
  templateUrl: './background.html',
  styleUrls: ['./background.scss'],
})
export class Background implements OnInit, AfterViewInit {
  @ViewChild('backgroundOutlet', { static: true }) backgroundOutlet: ElementRef | undefined;
  private textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
  private backdropTexture: THREE.Texture = this.textureLoader.load('background/bg2.jpg');
  private renderer!: WebGPURenderer;
  private cubemapTexture: THREE.CubeTexture = new THREE.CubeTextureLoader().load([
    'background/cubemap/posx.jpg',
    'background/cubemap/negx.jpg',
    'background/cubemap/posy.jpg',
    'background/cubemap/negy.jpg',
    'background/cubemap/posz.jpg',
    'background/cubemap/negz.jpg',
  ]);

  ngOnInit() {
    
  }


  ngAfterViewInit(): void {
    this.renderer = new WebGPURenderer({ antialias: true });
    this.renderer.init().then(() => {
      this.initBackground();
    });
  }

  private async initBackground() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.classList.add('background-canvas');
    this.backgroundOutlet?.nativeElement.appendChild(this.renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 120;
    scene.add(camera);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    const sceneBG = new THREE.Scene();
    sceneBG.background = new THREE.Color(0x000000);
    sceneBG.add(camera);
    sceneBG.add(new THREE.AmbientLight(0xffffff, 0.1));

    
    const backdropMaterial = new MeshBasicNodeMaterial();
    backdropMaterial.colorNode = texture(this.backdropTexture);
    const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(120*25, 100*25), backdropMaterial);
    backdrop.position.z = -500;
    sceneBG.add(backdrop);
    
    const bgRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

    let dl = new THREE.DirectionalLight(0x0000ff, 1);
    dl.position.y = 50;
    dl.position.z = 100;
    dl.position.x = -1000;
    scene.add(dl);

    let dl2 = new THREE.DirectionalLight(0x00aaff, 2);
    dl2.position.y = 50;
    dl2.position.z = 100;
    dl2.position.x = 500;
    scene.add(dl2);


    const bgTextureNode = texture(bgRenderTarget.texture);
    bgTextureNode.uvNode = screenUV;
    const material = createWindowMaterial(bgTextureNode, this.cubemapTexture);

    const windowMesh = new THREE.Mesh(new THREE.PlaneGeometry(160*4, 100*4), material);
    scene.add(windowMesh);

    const postProcessing = new PostProcessing(this.renderer);
    const scenePass = pass(scene, camera);
    const scenePassColor = scenePass.getTextureNode('output');
    const bloomPass = bloom(scenePassColor, bloomParams.strength, bloomParams.radius, bloomParams.threshold);
    postProcessing.outputNode = scenePassColor.add(bloomPass);
    postProcessing.outputNode = scenePass;

    function lerp(a: number, b: number, t: number) {
        return a * (1 - t) + b * t;
    }

    function addControls () {
        let targetRotationY = camera.rotation.y;
        let targetRotationX = camera.rotation.x;
        let targetPositionX = camera.position.x;
        let targetPositionY = camera.position.y;
        addEventListener('mousemove', (event) => {
            const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
            targetRotationY = mouseX * 0.1;
            targetRotationX = -mouseY * 0.1;
            targetPositionX = -mouseX * 10;
            targetPositionY = mouseY * 10;
        });
        function smoothCameraMotion() {
            camera.rotation.y = lerp(camera.rotation.y, targetRotationY, 0.08);
            camera.rotation.x = lerp(camera.rotation.x, targetRotationX, 0.08);
            camera.position.x = lerp(camera.position.x, targetPositionX, 0.08);
            camera.position.y = lerp(camera.position.y, targetPositionY, 0.08);
            requestAnimationFrame(smoothCameraMotion);
        }
        smoothCameraMotion();
    }

    addControls();

    function animate(renderer: WebGPURenderer) {
        requestAnimationFrame(() => animate(renderer));
        
        renderer.setRenderTarget(bgRenderTarget);
        renderer.render(sceneBG, camera);
        renderer.setRenderTarget(null);
    
        postProcessing.render();
    }

    animate(this.renderer);
  }

}
