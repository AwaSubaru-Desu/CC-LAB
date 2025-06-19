let dancer;

function setup() {
  createCanvas(windowWidth, windowHeight);
  dancer = new HHWDancer(width / 2, height / 2);
}

function draw() {
  background(0);
  dancer.update();
  dancer.display();

  if (keyIsPressed) {
    dancer.trigger(key);
  }
}

class HHWDancer {
  constructor(x, y) {
    this.baseX = x;
    this.baseY = y;
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.rotationSpeed = 0.02;
    this.step = 0;
    this.moveRadius = 80;
    this.armLength = 50;
    this.glowStickLength = 80;

    this.vy = 0;
    this.gravity = 0.6;
    this.jumpStrength = -12;
    this.isJumping = false;
    this.jumpCount = 0;
    this.maxJumps = 2;

    this.eyeSwapped = false;

    this.spiralDir = 1;
    this.lastX = this.x;
  }

  update() {
    this.step += 0.02;
    let newX = this.baseX + sin(this.step) * this.moveRadius;
    let deltaX = newX - this.x;
    this.lastX = this.x;
    this.x = newX;

    let direction = deltaX > 0 ? 1 : -1;
    this.spiralDir = lerp(this.spiralDir, direction, 0.05);

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

  trigger(k) {
    if (k === ' ') {
      this.jump();
    }
  }

  display() {
    this.drawFloor();

    push();
    translate(this.x, this.baseY);

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

    // body
    rotate(this.angle);
    stroke(255);
    strokeWeight(1.5);
    noFill();

    // spiral
    for (let a = 0; a < 2*PI; a += PI / 3) {
      beginShape();
      for (let r = 5; r < 60; r += 2) {
        let offset = this.spiralDir * (r * 0.05 + this.step * 2);
        let x = r * cos(a + offset);
        let y = r * sin(a + offset);
        vertex(x, y);
      }
      endShape();
    }

    // body circle
    stroke(255, 100);
    fill(30);
    ellipse(0, 0, 80, 80);

    // rings
    noFill();
    stroke(255, 40);
    for (let i = 1; i <= 2; i++) {
      ellipse(0, 0, i * 40 + sin(this.step * i) * 10);
    }

    // arms + glowsticks
    for (let side of [-1, 1]) {
      let armAngle = side * PI / 4;
      let armX = this.armLength * cos(armAngle);
      let armY = this.armLength * sin(armAngle);

      stroke(200);
      strokeWeight(4);
      line(0, 0, armX, armY);

      let swing = sin(this.step * 5) * PI / 6;
      let glowAngle = armAngle + swing;
      let glowX = armX + this.glowStickLength * cos(glowAngle);
      let glowY = armY + this.glowStickLength * sin(glowAngle);

      stroke(0, 255, 255, 200);
      strokeWeight(6);
      line(armX, armY, glowX, glowY);

      noStroke();
      fill(0, 255, 255, 150);
      ellipse(glowX, glowY, 12, 12);
    }

    pop();
  }

  drawFloor() {
    stroke(180);
    strokeWeight(1);
    let spacing = 40;
    for (let y = height / 2 + 80; y < height; y += spacing) {
      line(0, y, width, y);
    }
    for (let x = 0; x < width; x += spacing) {
      line(x, height / 2 + 80, x, height);
    }
  }
}

