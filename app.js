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
let ravenInterval = 500;
let lastTime = 0;
let score = 0;

let ravens = [];

class Raven {
  constructor() {
    this.spriteWidth = 271;
    this.spriteHeight = 194;
    this.sizeModifier = Math.random() * 0.6 + 0.4;
    this.width = this.spriteWidth * this.sizeModifier;
    this.height = this.spriteHeight * this.sizeModifier;
    this.x = canvas.width;
    this.y = Math.random() * (canvas.height - this.height);
    this.directionX = Math.random() * 5 + 3;
    this.directionY = Math.random() * 5 - 2.5;
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

function drawScore() {
  ctx.fillStyle = "black";
  ctx.fillText(`Score: ${score}`, 50, 70);
  ctx.fillStyle = "white";
  ctx.fillText(`Score: ${score}`, 52, 72);
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

  [...ravens].forEach((raven) => raven.update(deltaTime));
  [...ravens].forEach((raven) => raven.draw());
  ravens = ravens.filter((raven) => !raven.markedForDeletion);

  requestAnimationFrame(animate);
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
      score++;
    }
  });
});

animate(0);
