// Simple Platformer - Leap to Love
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);
const meta = document.createElement('meta');
meta.name = 'viewport';
meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
document.head.appendChild(meta);
document.addEventListener('gesturestart', e => e.preventDefault());
canvas.addEventListener('dblclick', e => e.preventDefault());
canvas.style.display = 'block';
document.body.style.margin = '0';
let groundY;
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  groundY = canvas.height - 16;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const GameState = { Playing: 'Playing', Won: 'Won' };
let gameState = GameState.Playing;
let gameStarted = false;
let countdown = 3;
let countdownStarted = false;
let countdownTimer = null;

const gravity = 0.5;

const playerImg = new Image();
playerImg.src = 'player.png';
const brideImg = new Image();
brideImg.src = 'bride.png';
const enemyImages = [];
const enemyCount = 7;
for (let i = 1; i <= enemyCount; i++) {
  const img = new Image();
  img.src = `enemy${i}.png`;
  enemyImages.push(img);
}
const bgImg = new Image();
bgImg.src = 'background.png';

const player = {
  x: 50,
  y: groundY - 60,
  width: 48,
  height: 48,
  vx: 0,
  vy: 0,
  speed: 4,
  jumpPower: -10,
  grounded: true
};
const enemies = Array.from({ length: Math.floor(Math.random() * 4) + 7 }, (_, i) => {
  const spacing = 200;
  const startX = 300 + spacing * i;
  const imgIndex = Math.floor(Math.random() * enemyImages.length);
  return {
    x: startX,
    y: groundY - 40,
    width: 40,
    height: 40,
    vx: Math.random() < 0.5 ? 1 : -1,
    alive: true,
    img: enemyImages[imgIndex]
  };
});
const bride = {
  x: 3000,
  y: groundY - 48,
  width: 48,
  height: 48
};

let keys = {};
let touchX = null;
let cameraX = 0;

function update() {
  if (!gameStarted) return;
  cameraX = player.x - canvas.width / 2;
  if (cameraX < 0) cameraX = 0;
  if (gameState !== GameState.Playing) return;

  if (keys['ArrowLeft'] || (touchX !== null && touchX < canvas.width / 2)) {
    player.vx = -player.speed * 0.7;
  } else if (keys['ArrowRight'] || (touchX !== null && touchX >= canvas.width / 2)) {
    player.vx = player.speed * 0.7;
  }
  player.vy += gravity;

  if ((keys['Space'] || keys['ArrowUp']) && player.grounded) {
    player.vy = player.jumpPower;
    player.grounded = false;
  }
  if (touchX !== null && player.grounded) {
    player.vy = player.jumpPower;
    player.grounded = false;
  }

  player.x += player.vx;
  if (player.x < 0) player.x = 0;
  player.y += player.vy;
  if (player.y + player.height >= groundY) {
    player.y = groundY - player.height;
    player.vy = 0;
    player.grounded = true;
  }

  enemies.forEach(enemy => {
    if (!enemy.alive) return;
    if (Math.random() < 0.01) {
      enemy.vx = (Math.random() < 0.5 ? -1 : 1) * (Math.random() * 2 + 0.5);
    }
    enemy.x += enemy.vx;
    if (enemy.x <= 200 || enemy.x + enemy.width >= 3000) {
      enemy.vx *= -1;
    }
    if (
      player.x < enemy.x + enemy.width &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y
    ) {
      if (player.vy > 0 && player.y + player.height - player.vy <= enemy.y + 5) {
        enemy.alive = false;
        player.vy = player.jumpPower / 2;
      } else {
        resetGame();
      }
    }
  });
  if (
    player.x < bride.x + bride.width &&
    player.x + player.width > bride.x &&
    player.y < bride.y + bride.height &&
    player.y + player.height > bride.y
  ) {
    gameState = GameState.Won;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const offset = cameraX % bgImg.width;
  for (let i = -1; i <= Math.ceil(canvas.width / bgImg.width); i++) {
    ctx.drawImage(bgImg, i * bgImg.width - offset, 0, bgImg.width, canvas.height);
  }
  ctx.save();
  if (player.vx < 0) {
    ctx.translate(player.x - cameraX + player.width, player.y);
    ctx.scale(-1, 1);
    ctx.drawImage(playerImg, 0, 0, player.width, player.height);
  } else {
    ctx.drawImage(playerImg, player.x - cameraX, player.y, player.width, player.height);
  }
  ctx.restore();

  enemies.forEach(enemy => {
    if (enemy.alive) {
      ctx.save();
      if (enemy.vx < 0) {
        ctx.translate(enemy.x - cameraX + enemy.width, enemy.y);
        ctx.scale(-1, 1);
        ctx.drawImage(enemy.img, 0, 0, enemy.width, enemy.height);
      } else {
        ctx.drawImage(enemy.img, enemy.x - cameraX, enemy.y, enemy.width, enemy.height);
      }
      ctx.restore();
    }
  });

  ctx.drawImage(brideImg, bride.x - cameraX, bride.y, bride.width, bride.height);
  if (gameState === GameState.Won) {
    ctx.fillStyle = 'green';
    ctx.font = '36px sans-serif';
    ctx.fillText('You Reached the Bride! 💍', canvas.width / 2 - 150, 100);
  }
  if (!gameStarted && countdownStarted) {
    ctx.fillStyle = '#000';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(countdown > 0 ? countdown : 'Go!', canvas.width / 2, canvas.height / 2);
  }
}

function resetGame() {
  player.x = 50;
  player.y = groundY - 60;
  player.vx = 0;
  player.vy = 0;
  player.grounded = true;
  gameState = GameState.Playing;
}

function loop() {
  requestAnimationFrame(loop);
  if (window.innerWidth < window.innerHeight) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Please rotate to landscape', canvas.width / 2, canvas.height / 2);
    return;
  }
  update();
  draw();
}

window.addEventListener('keydown', e => {
  if (!gameStarted && !countdownStarted) {
    countdownStarted = true;
    countdownTimer = setInterval(() => {
      countdown--;
      if (countdown < 0) {
        clearInterval(countdownTimer);
        gameStarted = true;
      }
    }, 1000);
  }
  keys[e.key] = true;
});
window.addEventListener('keyup', e => { keys[e.key] = false; });
canvas.addEventListener('touchstart', e => {
  if (!gameStarted && !countdownStarted) {
    countdownStarted = true;
    countdownTimer = setInterval(() => {
      countdown--;
      if (countdown < 0) {
        clearInterval(countdownTimer);
        gameStarted = true;
      }
    }, 1000);
  }
  touchX = e.touches[0].clientX;
});
canvas.addEventListener('touchend', () => { touchX = null; });
canvas.addEventListener('touchstart', e => {
  if (player.grounded) {
    player.vy = player.jumpPower;
    player.grounded = false;
  }
}, { passive: true });

let imagesLoaded = 0;
const allImages = [playerImg, brideImg, bgImg, ...enemyImages];
allImages.forEach(img => {
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === allImages.length) loop();
  };
});
