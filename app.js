/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
ctx.font = "50px Impact";

/** @type {HTMLCanvasElement} */
const collisionCanvas = document.getElementById("collisionCanvas");
const collisionCanvasCtx = collisionCanvas.getContext("2d");
collisionCanvas.width = window.innerWidth;
collisionCanvas.height = window.innerHeight;

let timeToNextRaven = 0;
let ravenInterval = 1000;
let lastTime = 0;
let score = 0;
let gameOver = false;
const gameOverSound = new Audio();
gameOverSound.src = "./assets/game_over.wav";

let ravens = [];
let explosions = [];
let particles = [];

class Raven {
  constructor() {
    this.spriteWidth = 271;
    this.spriteHeight = 194;
    this.sizeModifier = Math.random() * 0.6 + 0.4;
    this.width = this.spriteWidth * this.sizeModifier;
    this.height = this.spriteHeight * this.sizeModifier;
    this.x = canvas.width;
    this.y = Math.random() * (canvas.height - this.height);
    this.directionX = Math.random() * 4 + 3;
    this.directionY = Math.random() * 4 - 2.5;
    this.markedForDeletion = false;

    this.image = new Image();
    this.image.src = "./assets/raven.png";

    this.frame = 0;
    this.maxFrame = 4;

    this.timeSinceFlap = 0;
    this.flapInterval = Math.random() * 50 + 50;

    this.randomColors = [
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
    ];
    this.color = `rgb(${this.randomColors[0]},${this.randomColors[1]},${this.randomColors[2]})`;

    this.hasTrail = Math.random() > 0.5;
  }
  update(deltaTime) {
    this.x -= this.directionX;

    if (this.y < 0 || this.y > canvas.height - this.height) {
      this.directionY *= -1; // if ravens are going out of canvas vertically navigate them to opposite direction
    }
    this.y -= this.directionY;

    if (this.x < 0 - this.width) {
      this.markedForDeletion = true; // mark the ravens to be deleted when they have gone outside canvas
    }

    this.timeSinceFlap += deltaTime;
    if (this.timeSinceFlap > this.flapInterval) {
      if (this.frame > this.maxFrame) this.frame = 0;
      else this.frame++;
      this.timeSinceFlap = 0;

      if (this.hasTrail) {
        for (let i = 0; i < 5; i++) {
          particles.push(new Particles(this.x, this.y, this.width, this.color));
        }
      }
    }

    if (this.x < 0 - this.width) {
      gameOver = true;
      gameOverSound.play();
    }
  }
  draw() {
    collisionCanvasCtx.fillStyle = this.color;
    collisionCanvasCtx.fillRect(this.x, this.y, this.width, this.height);
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

class Explosion {
  constructor(x, y, size) {
    this.image = new Image();
    this.image.src = "./assets/boom.png";
    this.spriteWidth = 200;
    this.spriteHeight = 179;
    this.size = size;
    this.x = x;
    this.y = y;
    this.frame = 0;
    this.sound = new Audio();
    this.sound.src = "./assets/boom.wav";
    this.timeSinceFrame = 0;
    this.frameInterval = 200;
    this.markedForDeletion = false;
  }

  update(deltaTime) {
    if (this.frame === 0) this.sound.play();

    this.timeSinceFrame += deltaTime;
    if (this.timeSinceFrame > this.frameInterval) {
      if (this.frame > this.maxFrame) this.frame = 0;
      else this.frame++;
      this.timeSinceFrame = 0;

      if (this.frame > 5) {
        this.markedForDeletion = true;
      }
    }
  }
  draw() {
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x - this.size / 4,
      this.y - this.size / 4,
      this.size,
      this.size
    );
  }
}

class Particles {
  constructor(x, y, size, color) {
    this.size = size;
    this.x = x + this.size * 0.33 + Math.random() * 50 - 25;
    this.y = y + this.size * 0.33 + Math.random() * 50 - 25;
    this.color = color;
    this.radius = Math.random() * (this.size * 0.1);
    this.maxRadius = Math.random() * 20 + 35;
    this.markedForDeletion = false;
    this.speedX = Math.random() * 1 + 0.5;
  }
  update() {
    this.x += this.speedX;
    this.radius += 0.3;
    if (this.radius > this.maxRadius - 5) this.markedForDeletion = true;
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = 1 - this.radius / this.maxRadius;
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawScore() {
  ctx.fillStyle = "black";
  ctx.fillText(`Score: ${score}`, 50, 70);
  ctx.fillStyle = "white";
  ctx.fillText(`Score: ${score}`, 52, 72);
}

function drawGameOver() {
  ctx.textAlign = "center";
  ctx.fillStyle = "black";
  ctx.fillText(`Game Over 💀: ${score}`, canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = "white";
  ctx.fillText(
    `Game Over 💀: ${score}`,
    canvas.width / 2 - 2,
    canvas.height / 2 - 2
  );
}

function animate(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  collisionCanvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  let deltaTime = timestamp - lastTime; // calc much time has passed from last frame time
  lastTime = timestamp; // update last frame time with current frame time
  timeToNextRaven += deltaTime; // increment time to next raven with delta time

  if (timeToNextRaven > ravenInterval) {
    // when time to next raven has passed the interval time for next raven, create a new raven
    ravens.push(new Raven());
    // and reset time to next raven to 0 so that it adds the next raven after the certain interval
    timeToNextRaven = 0;

    // sort ravens array bigger ones are at front and small ones are behind
    ravens.sort((r1, r2) => {
      return r1.width - r2.width;
    });
  }

  drawScore();

  [...particles, ...ravens, ...explosions].forEach((raven) =>
    raven.update(deltaTime)
  );
  [...particles, ...ravens, ...explosions].forEach((raven) => raven.draw());
  ravens = ravens.filter((raven) => !raven.markedForDeletion);
  explosions = explosions.filter((explosion) => !explosion.markedForDeletion);
  particles = particles.filter((particle) => !particle.markedForDeletion);

  if (!gameOver) requestAnimationFrame(animate);
  else drawGameOver();
}

window.addEventListener("click", (e) => {
  const colors = collisionCanvasCtx.getImageData(e.x, e.y, 1, 1);

  ravens.forEach((raven) => {
    if (
      raven.randomColors[0] === colors.data[0] &&
      raven.randomColors[1] === colors.data[1] &&
      raven.randomColors[2] === colors.data[2]
    ) {
      raven.markedForDeletion = true;
      explosions.push(new Explosion(raven.x, raven.y, raven.width));
      score++;
    }
  });
});

animate(0);
