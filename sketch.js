//agario replication attempt 
let dots = [];
let viruses = [];
let spewedDots = [];
let collectedDotsPlayer1 = 0;
let collectedDotsPlayer2 = 0;
let circleSizePlayer1 = 50;
let circleSizePlayer2 = 50;
let growthRate = 2; // How much the circle grows per dot
let speed = 5;
let x1 = 200; // Player 1's x position
let y1 = 200; // Player 1's y position
let x2 = 300; // Player 2's x position
let y2 = 300; // Player 2's y position

let worldWidth = 10000; // Width of the world
let worldHeight = 10000; // Height of the world
let cameraX = 0; // Camera's x offset
let cameraY = 0; // Camera's y offset

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Generate a much higher number of dots to fill the screen
  generateWorld();
}

function draw() {
  background(30);

  // Move Player 1 with arrow keys
  if (keyIsDown(LEFT_ARROW)) x1 -= speed;
  if (keyIsDown(RIGHT_ARROW)) x1 += speed;
  if (keyIsDown(UP_ARROW)) y1 -= speed;
  if (keyIsDown(DOWN_ARROW)) y1 += speed;

  // Move Player 2 using AI logic
  movePlayer2();

  // Keep both circles within the world boundaries
  x1 = constrain(x1, 0, worldWidth);
  y1 = constrain(y1, 0, worldHeight);
  x2 = constrain(x2, 0, worldWidth);
  y2 = constrain(y2, 0, worldHeight);

  // Update the camera to center on Player 1
  cameraX = x1 - width / 2;
  cameraY = y1 - height / 2;

  // Constrain the camera within world boundaries
  cameraX = constrain(cameraX, 0, worldWidth - width);
  cameraY = constrain(cameraY, 0, worldHeight - height);

  // Translate the canvas for the camera view
  push();
  translate(-cameraX, -cameraY);

  // Draw the world boundaries
  stroke(100);
  noFill();
  rect(0, 0, worldWidth, worldHeight);

  // Draw and update all dots
  for (let i = dots.length - 1; i >= 0; i--) {
    dots[i].show();

    // Check if Player 1 eats a dot
    if (dist(x1, y1, dots[i].x, dots[i].y) < circleSizePlayer1 / 2) {
      dots.splice(i, 1);
      collectedDotsPlayer1++;
      circleSizePlayer1 += growthRate;
    }

    // Check if Player 2 eats a dot
    if (dist(x2, y2, dots[i].x, dots[i].y) < circleSizePlayer2 / 2) {
      dots.splice(i, 1);
      collectedDotsPlayer2++;
      circleSizePlayer2 += growthRate;
    }
  }

  // Animate and finalize spewed dots
  for (let i = spewedDots.length - 1; i >= 0; i--) {
    spewedDots[i].update();
    spewedDots[i].show();

    // If the spew animation is complete, convert to a regular dot
    if (spewedDots[i].isDone()) {
      dots.push(new Dot(spewedDots[i].x, spewedDots[i].y));
      spewedDots.splice(i, 1);
    }
  }

  // Draw and update viruses
  for (let i = viruses.length - 1; i >= 0; i--) {
    viruses[i].show();

    // Check if Player 1 fully covers a virus
    if (circleSizePlayer1 / 2 > dist(x1, y1, viruses[i].x, viruses[i].y) + viruses[i].size / 2) {
      // Spew out all collected dots
      spewDots(x1, y1, collectedDotsPlayer1);
      collectedDotsPlayer1 = 0;
      circleSizePlayer1 = 50;
    }

    // Check if Player 2 fully covers a virus
    if (circleSizePlayer2 / 2 > dist(x2, y2, viruses[i].x, viruses[i].y) + viruses[i].size / 2) {
      // Spew out all collected dots
      spewDots(x2, y2, collectedDotsPlayer2);
      collectedDotsPlayer2 = 0;
      circleSizePlayer2 = 50;
    }
  }

  // Draw Player 1's circle (Blue)
  fill(100, 150, 255, 200);
  noStroke();
  ellipse(x1, y1, circleSizePlayer1);

  // Draw Player 2's circle (Red)
  fill(255, 100, 100, 200);
  noStroke();
  ellipse(x2, y2, circleSizePlayer2);

  pop(); // Restore the original coordinate system

  // Display collected dots count
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  text(`Player 1: Dots collected: ${collectedDotsPlayer1}`, 10, 10);
  text(`Player 2: Dots collected: ${collectedDotsPlayer2}`, 10, 30);

  // Check for winner
  if (collectedDotsPlayer1 >= 70) {
    textSize(32);
    textAlign(CENTER, CENTER);
    fill(0, 255, 0);
    text("Player 1 wins!", width / 2, height / 2);
    noLoop(); // Stop the game
  } else if (collectedDotsPlayer2 >= 70) {
    textSize(32);
    textAlign(CENTER, CENTER);
    fill(255, 0, 0);
    text("Player 2 wins!", width / 2, height / 2);
    noLoop(); // Stop the game
  }
}

// Function to move Player 2 (AI)
function movePlayer2() {
  let closestDot = getClosestDot(x2, y2);
  let moveToX = closestDot.x;
  let moveToY = closestDot.y;

  // Move Player 2 towards the closest dot
  let angle = atan2(moveToY - y2, moveToX - x2);
  x2 += cos(angle) * speed;
  y2 += sin(angle) * speed;

  // Avoid viruses
  let closestVirus = getClosestVirus(x2, y2);
  if (dist(x2, y2, closestVirus.x, closestVirus.y) < 100) {
    let avoidAngle = atan2(y2 - closestVirus.y, x2 - closestVirus.x);
    x2 += cos(avoidAngle) * speed * 1.5; // Move faster away from virus
    y2 += sin(avoidAngle) * speed * 1.5;
  }
}

// Get the closest dot to a player
function getClosestDot(x, y) {
  let closestDot = null;
  let minDist = Infinity;
  for (let dot of dots) {
    let d = dist(x, y, dot.x, dot.y);
    if (d < minDist) {
      minDist = d;
      closestDot = dot;
    }
  }
  return closestDot;
}

// Get the closest virus to a player
function getClosestVirus(x, y) {
  let closestVirus = null;
  let minDist = Infinity;
  for (let virus of viruses) {
    let d = dist(x, y, virus.x, virus.y);
    if (d < minDist) {
      minDist = d;
      closestVirus = virus;
    }
  }
  return closestVirus;
}

function keyPressed() {
  if (key === ' ') {
    // Spew one dot at a time for Player 1
    if (collectedDotsPlayer1 > 0) {
      let angle = random(TWO_PI);
      let distance = random(circleSizePlayer1 / 2 + 10, circleSizePlayer1 * 3);
      let targetX = x1 + cos(angle) * distance;
      let targetY = y1 + sin(angle) * distance;
      spewedDots.push(new SpewedDot(x1 + cos(angle) * circleSizePlayer1 / 2, y1 + sin(angle) * circleSizePlayer1 / 2, targetX, targetY));
      collectedDotsPlayer1--;
      circleSizePlayer1 -= growthRate;
    }
  }

  if (key === 'Enter') {
    // Spew one dot at a time for Player 2
    if (collectedDotsPlayer2 > 0) {
      let angle = random(TWO_PI);
      let distance = random(circleSizePlayer2 / 2 + 10, circleSizePlayer2 * 3);
      let targetX = x2 + cos(angle) * distance;
      let targetY = y2 + sin(angle) * distance;
      spewedDots.push(new SpewedDot(x2 + cos(angle) * circleSizePlayer2 / 2, y2 + sin(angle) * circleSizePlayer2 / 2, targetX, targetY));
      collectedDotsPlayer2--;
      circleSizePlayer2 -= growthRate;
    }
  }

  if (key === 'r') {
    resetGame();
  }
}

function spewDots(x, y, collectedDots) {
  for (let i = 0; i < collectedDots; i++) {
    let angle = random(TWO_PI);
    let distance = random(circleSizePlayer1 / 2 + 10, circleSizePlayer1 * 3);
    let targetX = x + cos(angle) * distance;
    let targetY = y + sin(angle) * distance;
    spewedDots.push(new SpewedDot(x + cos(angle) * circleSizePlayer1 / 2, y + sin(angle) * circleSizePlayer1 / 2, targetX, targetY));
  }
}

// Dot class
class Dot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 10;
    this.color = color(255, 100, 100);
  }

  show() {
    fill(this.color);
    noStroke();
    ellipse(this.x, this.y, this.size);
  }
}

// Virus class
class Virus {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 30;
  }

  show() {
    fill(100, 255, 100);
    noStroke();
    push();
    translate(this.x, this.y);
    for (let i = 0; i < 8; i++) {
      rotate(PI / 4);
      ellipse(this.size, 0, this.size / 4, this.size / 4);
    }
    pop();
    ellipse(this.x, this.y, this.size); // Draw the center of the virus
  }
}

// SpewedDot class for animated dots
class SpewedDot {
  constructor(startX, startY, targetX, targetY) {
    this.x = startX;
    this.y = startY;
    this.targetX = targetX;
    this.targetY = targetY;
    this.size = 10;
    this.speed = random(2, 5);
    this.step = 0;
    this.totalSteps = int(dist(startX, startY, targetX, targetY) / this.speed);
  }

  update() {
    if (this.step < this.totalSteps) {
      this.step++;
      this.x = lerp(this.x, this.targetX, 0.1);
      this.y = lerp(this.y, this.targetY, 0.1);
    }
  }

  show() {
    fill(255, 100, 100);
    noStroke();
    ellipse(this.x, this.y, this.size);
  }

  isDone() {
    return this.step >= this.totalSteps;
  }
}

// Adjust canvas size when window is resized
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Function to reset the game
function resetGame() {
  x1 = 200;
  y1 = 200;
  x2 = 300;
  y2 = 300;
  collectedDotsPlayer1 = 0;
  collectedDotsPlayer2 = 0;
  circleSizePlayer1 = 50;
  circleSizePlayer2 = 50;
  spewedDots = [];
  generateWorld(); // Regenerate the world
  loop(); // Restart the game loop
}

// Function to generate the world (dots and viruses)
function generateWorld() {
  dots = [];
  viruses = [];

  for (let i = 0; i < 1000; i++) {
    dots.push(new Dot(random(worldWidth), random(worldHeight)));
  }

  for (let i = 0; i < 10; i++) {
    viruses.push(new Virus(random(worldWidth), random(worldHeight)));
  }
}
