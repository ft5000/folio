import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild, viewChild } from '@angular/core';

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
  private startTime: number = 0;

  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef;

  constructor(private renderer: Renderer2, private elementRef: ElementRef) {}

  ngOnInit() {
    document.body.style.setProperty('--fg-color', 'white');
    document.body.style.setProperty('--bg-color', 'black');
    this.startTime = 0;
  }

  ngAfterViewInit() {
    const el = this.renderer.createElement('canvas');
    this.renderer.setAttribute(el, 'id', 'about-bg');
    this.renderer.appendChild(this.canvasContainer.nativeElement, el);

    this.initWebGL();

    this.observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.target.id === 'about-content') {
        const aboutView = document.querySelector('.about-view');
        const aboutBg = document.getElementById('about-bg');

        if (entry.isIntersecting) {
          aboutView?.classList.add('show-bg');
          aboutBg?.classList.add('blur');
        } else {
          aboutView?.classList.remove('show-bg');
          aboutBg?.classList.remove('blur');
        }
      }
    });
  },
  { threshold: 0.5 }
);

// Observe ONLY the about-content element
const aboutContent = document.getElementById('about-content');
if (aboutContent) {
  this.observer.observe(aboutContent);
}
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    
    // Cancel animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Clean up WebGL context
    if (this.glContext) {
      const loseContext = this.glContext.getExtension('WEBGL_lose_context');
      if (loseContext) {
        loseContext.loseContext();
      }
      this.glContext = null;
    }
  }

  public getSpacerContent(): string {
    return ' ';
  }

  private async initWebGL() {
    // Cancel any existing animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Reset start time
    this.startTime = 0;
    
    // Clean up existing WebGL context
    if (this.glContext) {
      const loseContext = this.glContext.getExtension('WEBGL_lose_context');
      if (loseContext) {
        loseContext.loseContext();
      }
      this.glContext = null;
    }
    
    // Remove existing canvas and create a new one
    const existingCanvas = document.getElementById('about-bg');
    if (existingCanvas) {
      existingCanvas.remove();
    }
    
    const canvas = this.renderer.createElement('canvas');
    this.renderer.setAttribute(canvas, 'id', 'about-bg');
    this.renderer.appendChild(this.canvasContainer.nativeElement, canvas);
    
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const aspectRatio = 2660 / 1440;

    // canvas.style.position = 'fixed';
    // canvas.style.zIndex = '0';
  
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    const gl = canvas.getContext('webgl2');
    
    if (!gl) {
      console.error('WebGL 2 not supported');
      return;
    }
    
    // Store the context
    this.glContext = gl;
    
    // Load shader files (using relative path to work with base href)
    const vertResponse = await fetch('shaders/about.vert');
    const fragResponse = await fetch('shaders/about.frag');
    const vertSource = await vertResponse.text();
    const fragSource = await fragResponse.text();
    
    // Create and compile shaders
    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertShader) return;
    gl.shaderSource(vertShader, vertSource);
    gl.compileShader(vertShader);
    
    if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
      return;
    }
    
    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragShader) return;
    gl.shaderSource(fragShader, fragSource);
    gl.compileShader(fragShader);
    
    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
      return;
    }
    
    // Create program
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return;
    }

    gl.useProgram(program);
    
    const vertices = new Float32Array([
      -1, -1, 0,  0, 0,  // bottom-left
       1, -1, 0,  1, 0,  // bottom-right
      -1,  1, 0,  0, 1,  // top-left
       1,  1, 0,  1, 1   // top-right
    ]);

    const uTex = gl.getUniformLocation(program, 'u_tex');
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const image = new Image();
    image.src = 'images/header_3.jpg';
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uTex, 0);
    };
    
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    const stride = 5 * Float32Array.BYTES_PER_ELEMENT; // 5 floats per vertex (x,y,z,u,v)
    
    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, stride, 0);
    
    const aTexCoord = gl.getAttribLocation(program, 'aTexCoord');
    gl.enableVertexAttribArray(aTexCoord);
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);
    
    // Get uniform locations
    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uModelViewMatrix = gl.getUniformLocation(program, 'uModelViewMatrix');
    const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
    
    // Set identity matrices
    const identityMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
    gl.uniformMatrix4fv(uModelViewMatrix, false, identityMatrix);
    gl.uniformMatrix4fv(uProjectionMatrix, false, identityMatrix);
    
    // Animation loop
    const render = (time: number) => {
      // Set start time on first frame
      if (this.startTime === 0) {
        this.startTime = time;
      }
      
      const elapsedTime = (time - this.startTime) * 0.001;
      
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsedTime);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      this.animationFrameId = requestAnimationFrame(render);
    };
    
    this.animationFrameId = requestAnimationFrame(render);
  }

}
