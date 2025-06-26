let dancer;
let fireflies = [];

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("p5-canvas-container");
  colorMode(HSB, 360, 100, 100);
  dancer = new HHWDancer(width / 2, height / 2);
}

function draw() {
  background(0, 0, 0, 0.2);

  for (let i = fireflies.length - 1; i >= 0; i--) {
    fireflies[i].update();
    fireflies[i].display();
    if (!fireflies[i].onScreen()) {
      fireflies.splice(i, 1);
    }
  }

  dancer.update();
  dancer.display();
  drawFloor();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (key === 'a' || key === 'A') {
    dancer.armAngleSpeed = 0.02;
  }
  if (key === 'd' || key === 'D') {
    dancer.reverseSpin();
  }
  if (key === 's' || key === 'S') {
    let num = int(random(1, 10));
    for (let i = 0; i < num; i++) {
      fireflies.push(new FireflyParticle());
    }
  }
  if (key === ' ') {
    dancer.jump();
  }
}

function keyReleased() {
  if (key === 'a' || key === 'A') {
    dancer.armAngleSpeed = 0;
  }
}

// Firefly
class FireflyParticle {
  constructor(x = random(width), y = random(height)) {
    this.x = x;
    this.y = y;
    this.baseSize = random(2, 8);
    this.speedX = random(-0.5, 0.5);
    this.speedY = random(-0.3, 0.3);
    this.hue = random(360);
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.hue = (this.hue + 0.5) % 360;
  }

  display() {
    noStroke();
    fill(this.hue, 80, 100);
    ellipse(this.x, this.y, this.baseSize);
  }

  onScreen() {
    return this.x >= 0 && this.x <= width && this.y >= 0 && this.y <= height;
  }
}

// Dancer
class HHWDancer {
  constructor(x, y) {
    this.x = x;
    this.baseY = y;

    this.angle = 0;
    this.rotationSpeed = 0.02;
    this.spiralDir = 1;

    this.armLength = 50;
    this.glowStickLength = 80;
    this.armSwingScale = 1;
    this.armAngleBase = PI / 4;
    this.armAngleSpeed = 0;

    this.step = 0;

    this.vy = 0;
    this.gravity = 0.6;
    this.jumpStrength = -12;
    this.isJumping = false;
    this.jumpCount = 0;
    this.maxJumps = 2;

    this.eyeSwapped = false;

    this.pauseTimer = 0;
  }

  update() {
    this.step += 0.02;
    this.angle += this.rotationSpeed;
    this.armAngleBase += this.armAngleSpeed;

    this.vy += this.gravity;
    this.baseY += this.vy;

    if (this.baseY >= height / 2) {
      this.baseY = height / 2;
      this.vy = 0;
      this.isJumping = false;
      this.jumpCount = 0;
    }
  }

  jump() {
    if (this.jumpCount < this.maxJumps) {
      this.vy = this.jumpStrength;
      this.isJumping = true;
      this.jumpCount++;
      this.eyeSwapped = !this.eyeSwapped;
    }
  }

  reverseSpin() {
    this.spiralDir *= -1;
    this.rotationSpeed = 0.02 * this.spiralDir;
  }

  display() {
    push();
    translate(this.x, this.baseY);
    rotate(this.angle);

    // head
    push();
    noStroke();
    fill(255, 150);
    ellipse(0, -50, 40, 40);
    fill(0);
    if (!this.eyeSwapped) {
      ellipse(-5, -53, 6, 6);
      ellipse(5, -53, 3, 3);
    } else {
      ellipse(-5, -53, 3, 3);
      ellipse(5, -53, 6, 6);
    }
    pop();

    // spiral
    stroke(255);
    strokeWeight(1.5);
    noFill();
    for (let a = 0; a < 2 * PI; a += PI / 3) {
      beginShape();
      for (let r = 5; r < 60; r += 2) {
        let offset = this.spiralDir * (r * 0.05 + this.step * 2);
        let x = r * cos(a + offset);
        let y = r * sin(a + offset);
        vertex(x, y);
      }
      endShape();
    }

    // body
    stroke(255, 100);
    fill(30);
    ellipse(0, 0, 80, 80);

    noFill();
    stroke(255, 40);
    for (let i = 1; i <= 2; i++) {
      ellipse(0, 0, i * 40 + sin(this.step * i) * 10);
    }

    // arms + glowsticks
    for (let side of [-1, 1]) {
      let armAngle = side * this.armAngleBase;
      let armX = this.armLength * cos(armAngle);
      let armY = this.armLength * sin(armAngle);

      stroke(200);
      strokeWeight(4);
      line(0, 0, armX, armY);

      let swing = sin(this.step * 5) * PI / 6 * this.armSwingScale;
      let glowAngle = armAngle + swing;
      let glowX = armX + this.glowStickLength * cos(glowAngle);
      let glowY = armY + this.glowStickLength * sin(glowAngle);

      stroke(180, 100, 100, 200);
      strokeWeight(6);
      line(armX, armY, glowX, glowY);

      noStroke();
      fill(180, 100, 100, 150);
      ellipse(glowX, glowY, 12, 12);
    }

    pop();
  }
}

function drawFloor() {
  push();

  let perspY = height * 0.3;
  let tileW = width / 30;
  for (let x = -150; x <= width + 150; x += tileW) {
    stroke(45);
    line(width / 2, perspY, x, height);
  }

  let dy = 5;
  let y = height * 0.6;
  while (y <= height) {
    line(0, y, width, y);
    dy *= 1.05;
    y += dy;
  }
