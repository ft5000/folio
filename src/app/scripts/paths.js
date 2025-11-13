let w;
let h;
let ts;

function setup() {
    w = window.innerWidth;
    h = window.innerHeight;
    ts = w * 0.05;
    createCanvas(w, h);
    textFont('Consolas');
    textSize(9);
}

function draw() {
  background(0);
  let lines = 0;
  
  translate(ts / 2, ts / 2)
  
  // Draw grid
  for (let x = 0; x < width; x += ts) {
    for (let y = 0; y < height; y += ts) {
      let d = dist(x, y, mouseX, mouseY);
      let s = map(d, width * 0.5, 0, 0, 4);
      let n = noise(x * 0.125, y * 0.125);
      if (d < ts * 5 && n < 0.25) {
        fill(255);
        noStroke();
        circle(x, y, 4);
        
        stroke(255);
        line(x, y, mouseX, mouseY);
        
        noStroke();
        text(`x: ${x}, y: ${x}, d: ${d}`, x, y)
        lines++;
      }
      else {
        fill(152)
        circle(x, y, 2);
      }
    }
  }
  
  fill(255)
  circle(mouseX, mouseY, 10);
}
