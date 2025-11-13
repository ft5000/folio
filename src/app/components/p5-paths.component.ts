import { Component, OnInit, OnDestroy, ElementRef, AfterViewInit } from '@angular/core';

@Component({
    selector: 'cursor',
    standalone: true,
    template: '<div class="p5-container"></div>',
    styles: [`
        :host, .p5-container {
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100vh;
            z-index: 1000; /* Changed from -1 to 1000 to bring to foreground */
            pointer-events: none;
            overflow: hidden;
            display: block;
            mix-blend-mode: difference;
        }
    `],
})
export class P5PathsComponent implements OnInit, OnDestroy, AfterViewInit {
    private p5Instance: any = null;

    constructor(private elementRef: ElementRef) {}

    ngOnInit() {
        window.addEventListener('resize', () => {
            if (this.p5Instance) {
                this.p5Instance.remove();
                this.createSketch();
            }
        });
    }

    ngAfterViewInit() {
        this.createSketch();
    }

    ngOnDestroy() {
        if (this.p5Instance) {
            this.p5Instance.remove();
        }
    }

    private createSketch() {
        import('p5').then((module) => {
            const p5 = module.default;

            const sketch = (p: any) => {
                let w: number;
                let h: number;
                let ts: number;

                p.setup = () => {
                    w = window.innerWidth;
                    h = window.innerHeight;
                    ts = w * 0.05;
                    const canvas = p.createCanvas(w, h);
                    canvas.parent(this.elementRef.nativeElement.querySelector('.p5-container'));
                    p.textFont('Consolas');
                    p.textSize(9);
                };

                p.draw = () => {
                    p.clear();
                    
                    
                    for (let x = 0; x < p.width; x += ts) {
                        for (let y = 0; y < p.height; y += ts) {
                            const d = p.dist(x, y, p.mouseX, p.mouseY);
                            const n = p.noise(x * 0.125, y * 0.125);

                            if (d < ts * 5 && n < 0.25 && !this.isEdge(x, y)) {
                                p.fill(255);
                                p.noStroke();
                                p.circle(x, y, 4);
                                p.stroke(255);
                                p.line(x, y, p.mouseX, p.mouseY);
                                p.noStroke();
                                p.text('x:' + x + ', y:' + y + ', d:' + d.toFixed(2), x, y);
                            }
                        }
                    }

                    p.fill(255);
                    p.noStroke();
                    p.circle(p.mouseX, p.mouseY, 10);
                };
            };

            this.p5Instance = new p5(sketch);
        }).catch((err) => {
            console.error('Failed to load p5:', err);
        });
    }

    private isEdge(x: number, y: number): boolean {
        return x === 0 || y === 0 || x === window.innerWidth - 1 || y === window.innerHeight - 1;
    }
}
