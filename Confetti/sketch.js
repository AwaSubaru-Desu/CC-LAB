let fireflies = [];
let maxFireflies = 100;

function setup() {
  let canvas = createCanvas(800, 500);
  canvas.parent("p5-canvas-container");

  colorMode(HSB, 360, 100, 100, 255);

  for (let i = 0; i < 9; i++) {
    fireflies.push(new FireflyParticle());
  }
}

function draw() {
  background(0);

  for (let i = fireflies.length - 1; i >= 0; i--) {
    fireflies[i].update();
    fireflies[i].display();

    if (!fireflies[i].onScreen()) {
      fireflies.splice(i, 1);
    }
  }

  fill(60, 0, 100); 
  textSize(16);
  text("Fireflies: " + fireflies.length, 20, 30);
}

function mousePressed() {
  if (fireflies.length < maxFireflies) {
    fireflies.push(new FireflyParticle(mouseX, mouseY));
  }
}

class FireflyParticle {
  constructor(x = random(width), y = random(height)) {
    this.x = x;
    this.y = y;
    this.baseSize = random(3, 7);
    this.speedX = random(-0.5, 0.5);
    this.speedY = random(-0.5, 0.5);
    this.flickerOffset = random(2 * PI);
    this.hue = random(40, 70); 
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
  }

  display() {
    noStroke();
    let b = map(sin(frameCount * 0.05 + this.flickerOffset), -1, 1, 30, 100); 
    fill(this.hue, 80, b); // hue, saturation, brightness
    ellipse(this.x, this.y, this.baseSize);
  }

  onScreen() {
    return this.x >= 0 && this.x <= width && this.y >= 0 && this.y <= height;
  }
}
