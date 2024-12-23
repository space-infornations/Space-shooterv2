const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

const playerWidth = 50;
const playerHeight = 30;
const bulletWidth = 5;
const bulletHeight = 15;
const enemyWidth = 50;
const enemyHeight = 30;

let player = {
  x: canvas.width / 2 - playerWidth / 2,
  y: canvas.height - playerHeight - 10,
  width: playerWidth,
  height: playerHeight,
  speed: 5,
  dx: 0,
  health: 125, // Player health starts at 125
};

let bullets = [];
let enemies = [];
let score = 0;

// Cooldown variables
let lastShotTime = 0; // Time when the last bullet was shot
const cooldownPeriod = 300; // Cooldown period for shooting in milliseconds (300ms)
let lastBatteryCooldownTime = 0; // Time when the last battery consumption was triggered
const batteryCooldownPeriod = 700; // Cooldown period for battery consumption in milliseconds (700ms)

// Battery system variables
let battery = 100; // Current battery level (out of 100)
const batteryMax = 100; // Maximum battery level
const batteryConsumption = 1.0; // Battery consumption per bullet is now 32
const batteryRechargeRate = 0.5; // Slightly slower recharge rate

// Bullet damage
const bulletDamage = 0.9;

document.addEventListener("keydown", movePlayer);
document.addEventListener("keyup", stopPlayer);
document.addEventListener("keydown", shootBullet);

// Bomb-specific variables
// Bomb-specific variables
let lastBombTime = 0; // Time when the last bomb was deployed
const bombCooldown = 700; // Cooldown period for bombs (700ms)
const bombBatteryConsumption = 1.8; // Battery consumption for bombs
const bombEffectRadius = 100; // Radius of bomb explosion
let bombEffectStartTime = 0; // Time when bomb effect started
let isBombDeployed = false; // Flag to check if bomb is deployed

document.addEventListener("keydown", deployBomb);

function deployBomb(e) {
  const currentTime = Date.now();

  // Check if enough time has passed, and if there is enough battery to deploy a bomb
  if (
    e.key === "b" && // Press "B" to deploy a bomb
    currentTime - lastBombTime >= bombCooldown &&
    battery >= bombBatteryConsumption
  ) {
    // Apply bomb effect to enemies
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const distance = Math.sqrt(
        Math.pow(player.x + player.width / 2 - (enemy.x + enemy.width / 2), 2) +
          Math.pow(
            player.y + player.height / 2 - (enemy.y + enemy.height / 2),
            2
          )
      );

      if (distance <= bombEffectRadius) {
        // Destroy enemy within the bomb radius
        enemies.splice(i, 1);
        score += 10; // Increment score
        coins += 1; // Increment coins
        i--; // Adjust index after removal
      }
    }

    // Deduct battery and update last bomb time
    battery -= bombBatteryConsumption;
    lastBombTime = currentTime;
    bombEffectStartTime = currentTime; // Track the start time for the effect
    isBombDeployed = true; // Mark the bomb as deployed

    // Ensure bomb cooldown resets
    setTimeout(() => {
      isBombDeployed = false;
    }, bombCooldown); // Reset the bomb effect after cooldown
  }
}
function drawBombEffect() {
  if (isBombDeployed) {
    const effectDuration = 1000; // Duration of the explosion effect in milliseconds
    const fadeOutDuration = 200; // Fade-out duration
    const timeElapsed = Date.now() - bombEffectStartTime;

    // Calculate scaling of radius
    const scaleFactor = Math.min(timeElapsed / effectDuration, 1);
    const radius = bombEffectRadius * scaleFactor;

    // Calculate opacity for smooth fade-in and fade-out
    let opacity;
    if (timeElapsed < effectDuration - fadeOutDuration) {
      // Smooth fade-in with ease-out curve
      opacity = 1 - Math.pow(1 - scaleFactor, 3);
    } else {
      // Smooth fade-out
      const fadeOutScale =
        (timeElapsed - (effectDuration - fadeOutDuration)) / fadeOutDuration;
      opacity = Math.max(0, Math.pow(1 - fadeOutScale, 3));
    }

    // Create a radial gradient for enhanced visual effect
    const gradient = ctx.createRadialGradient(
      player.x + player.width / 2, // Center of the explosion
      player.y + player.height / 2,
      0, // Inner radius
      player.x + player.width / 2,
      player.y + player.height / 2,
      radius // Outer radius
    );
    gradient.addColorStop(0, `rgba(255, 255, 0, ${opacity})`); // Bright yellow at the center
    gradient.addColorStop(0.5, `rgba(255, 165, 0, ${opacity * 0.8})`); // Orange mid-point
    gradient.addColorStop(1, `rgba(255, 69, 0, ${opacity * 0.4})`); // Red at the edges

    // Draw explosion effect with gradient
    ctx.save(); // Save the canvas state
    ctx.globalCompositeOperation = "lighter"; // Create a glowing effect by blending
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(
      player.x + player.width / 2,
      player.y + player.height / 2,
      radius,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Add additional transparent glow
    ctx.globalAlpha = opacity * 0.5; // Slight transparency for extra layers
    ctx.beginPath();
    ctx.arc(
      player.x + player.width / 2,
      player.y + player.height / 2,
      radius * 1.5, // Slightly larger radius for outer glow
      0,
      Math.PI * 2
    );
    ctx.fillStyle = `rgba(255, 200, 50, ${opacity * 0.3})`; // Softer glow color
    ctx.fill();
    ctx.restore(); // Restore the canvas state

    // Reset after the effect duration ends
    if (timeElapsed >= effectDuration) {
      isBombDeployed = false;
    }
  }
}

function movePlayer(e) {
  if (e.key === "ArrowLeft") {
    player.dx = -player.speed;
  } else if (e.key === "ArrowRight") {
    player.dx = player.speed;
  }
}
function stopPlayer(e) {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    player.dx = 0; // Stop horizontal movement
  }
}

const bulletSound = new Audio("bulletsoundcanon1.mp3"); // Load the bullet sound file
let isShooting = false; // To track whether the spacebar is being held down
const rateOfFire = 10; // Number of shots per second
const shootInterval = 1000 / rateOfFire; // Interval between shots in milliseconds

function shootBullet(e) {
  const currentTime = Date.now();

  // Check if the spacebar is pressed and other conditions (cooldown, battery, etc.)
  if (
    e.key === " " &&
    currentTime - lastShotTime >= cooldownPeriod && // Cooldown check for shooting
    battery >= batteryConsumption && // Check if enough battery is available
    currentTime - lastBatteryCooldownTime >= batteryCooldownPeriod
  ) {
    // Battery cooldown check

    // Start shooting if the spacebar is pressed and not already shooting
    if (!isShooting) {
      isShooting = true;
      shootIntervalID = setInterval(() => {
        // Shoot continuously at the defined interval
        const currentShotTime = Date.now();
        if (
          currentShotTime - lastShotTime >= cooldownPeriod &&
          battery >= batteryConsumption &&
          currentShotTime - lastBatteryCooldownTime >= batteryCooldownPeriod
        ) {
          // Calculate if the shot is accurate or inaccurate
          const isAccurate = Math.random() <= 0.3; // 30% chance to be accurate
          const shotXDeviation = isAccurate ? 0 : (Math.random() - 0.5) * 20; // Deviation

          // Create the bullet with potential X deviation if inaccurate
          bullets.push({
            x: player.x + player.width / 2 - bulletWidth / 2 + shotXDeviation, // Apply deviation
            y: player.y,
            width: bulletWidth,
            height: bulletHeight,
            speed: 7,
            damage: bulletDamage, // Bullet damage
          });

          lastShotTime = currentShotTime; // Update last shot time
          battery -= batteryConsumption; // Reduce battery
          lastBatteryCooldownTime = currentShotTime; // Update last battery consumption time

          bulletSound.play(); // Play the bullet sound effect per shot
        }
      }, shootInterval); // Shoot every `shootInterval` milliseconds
    }
  }
}

// Stop shooting when the spacebar is released
function stopShooting(e) {
  if (e.key === " ") {
    isShooting = false;
    clearInterval(shootIntervalID); // Stop shooting
  }
}

// Event listeners for the spacebar press and release
window.addEventListener("keydown", shootBullet);
window.addEventListener("keyup", stopShooting);

function updatePlayer() {
  player.x += player.dx;
  // Prevent the player from moving off the screen
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width)
    player.x = canvas.width - player.width;
}

function updateBullets() {
  for (let i = 0; i < bullets.length; i++) {
    bullets[i].y -= bullets[i].speed;

    // Remove bullets when they go off screen
    if (bullets[i].y < 0) {
      bullets.splice(i, 1);
      i--;
    }
  }
}
function generateEnemies() {
  if (Math.random() < 0.02) {
    const hasShield = Math.random() < 0.25; // 25% chance to have a shield
    enemies.push({
      x: Math.random() * (canvas.width - enemyWidth),
      y: -enemyHeight,
      width: enemyWidth,
      height: enemyHeight,
      speed: hasShield ? 2 + Math.random() * 1 : 2 + Math.random() * 2, // Slower if shielded
      health: hasShield ? 1 : 2, // Health is 1 if shielded, otherwise 2
      shield: hasShield ? 1 : 0, // Shield strength of 1 if shielded, otherwise 0
    });
  }
}

function updateEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    enemies[i].y += enemies[i].speed;

    // Remove enemies that go off the screen
    if (enemies[i].y > canvas.height) {
      enemies.splice(i, 1);
      i--;
    }
  }
}

let coins = 0; // Add a variable to track coins collected

function detectCollisions() {
  // Check if bullets hit enemies
  for (let i = 0; i < bullets.length; i++) {
    for (let j = 0; j < enemies.length; j++) {
      if (
        bullets[i].x < enemies[j].x + enemies[j].width &&
        bullets[i].x + bullets[i].width > enemies[j].x &&
        bullets[i].y < enemies[j].y + enemies[j].height &&
        bullets[i].y + bullets[i].height > enemies[j].y
      ) {
        // Apply bullet damage to the enemy
        enemies[j].health -= bullets[i].damage;

        // If the enemy's health is less than or equal to 0, remove it
        if (enemies[j].health <= 0) {
          enemies.splice(j, 1);
          score += 10; // Increment the score
          coins += 1; // Increment coins by 1 for each enemy destroyed
          j--; // Adjust index after removal
        }

        // Remove the bullet after collision
        bullets.splice(i, 1);
        i--; // Adjust index after removal
        break;
      }
    }
  }

  // Check if enemies hit the player
  for (let i = 0; i < enemies.length; i++) {
    if (
      player.x < enemies[i].x + enemies[i].width &&
      player.x + player.width > enemies[i].x &&
      player.y < enemies[i].y + enemies[i].height &&
      player.y + player.height > enemies[i].y
    ) {
      // Reduce player health when hit by enemy
      player.health -= 2;

      // Remove enemy when it hits the player
      enemies.splice(i, 1);
      i--; // Adjust index after removal
    }
  }

  // Check if bomb explosion hits enemies
  const currentTime = Date.now();
  if (currentTime - lastBombTime < 200) {
    // Check if the bomb is still "active"
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const distance = Math.sqrt(
        Math.pow(player.x + player.width / 2 - (enemy.x + enemy.width / 2), 2) +
          Math.pow(
            player.y + player.height / 2 - (enemy.y + enemy.height / 2),
            2
          )
      );

      if (distance <= bombEffectRadius) {
        // Apply bomb damage to the enemy
        enemy.health -= 7;

        // If the enemy's health is less than or equal to 0, remove it
        if (enemy.health <= 0) {
          enemies.splice(i, 1);
          score += 10; // Increment the score
          coins += 1; // Increment coins
          i--; // Adjust index after removal
        }
      }
    }
  }
}

function drawCoins() {
  // Enable anti-aliasing for smoother rendering
  ctx.imageSmoothingEnabled = true;

  // Set font and style for text
  ctx.fillStyle = "yellow";
  ctx.font = "20px Arial";

  // Add shadow for better text visibility
  ctx.shadowColor = "black";
  ctx.shadowBlur = 4;

  // Draw the coins text
  ctx.fillText(`${coins}`, 40, 60); // Adjusted position for space for the coin icon

  // Draw a simple coin icon (circle) next to the text
  ctx.beginPath();
  ctx.arc(20, 50, 10, 0, Math.PI * 2); // Draw a circle for the coin icon
  ctx.fillStyle = "gold"; // Set coin color to gold
  ctx.fill(); // Fill the coin
  ctx.strokeStyle = "black"; // Outline the coin with black
  ctx.lineWidth = 2;
  ctx.stroke(); // Draw the outline

  // Reset shadow to avoid affecting other drawings
  ctx.shadowBlur = 0;
}

function drawPlayer() {
  // Set the color for the spaceship
  ctx.fillStyle = "white";

  // Draw the main body of the spaceship (a triangle for a classic look)
  ctx.beginPath();
  ctx.moveTo(player.x + player.width / 2, player.y); // Tip of the spaceship
  ctx.lineTo(player.x, player.y + player.height); // Bottom-left corner
  ctx.lineTo(player.x + player.width, player.y + player.height); // Bottom-right corner
  ctx.closePath();
  ctx.fill();

  // Draw the cockpit (a small circle near the tip)
  ctx.fillStyle = "blue";
  ctx.beginPath();
  ctx.arc(
    player.x + player.width / 2,
    player.y + player.height / 3,
    player.width / 6,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Draw the engines (two small rectangles at the bottom corners)
  ctx.fillStyle = "gray";
  ctx.fillRect(
    player.x + player.width / 6,
    player.y + player.height,
    player.width / 6,
    player.height / 4
  );
  ctx.fillRect(
    player.x + (player.width * 2) / 3,
    player.y + player.height,
    player.width / 6,
    player.height / 4
  );
}

function checkGameOver() {
  if (player.health <= 0) {
    return true;
  }
  return false;
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; // Semi-transparent background
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "40px Arial";
  ctx.fillText("GAME OVER", canvas.width / 2 - 100, canvas.height / 2 - 40);
  ctx.font = "20px Arial";
  ctx.fillText(
    `Final Score: ${score}`,
    canvas.width / 2 - 60,
    canvas.height / 2 + 20
  );
  ctx.fillText(
    "Press 'R' to Restart",
    canvas.width / 2 - 80,
    canvas.height / 2 + 60
  );
}

document.addEventListener("keydown", restartGame);

function restartGame(e) {
  if (e.key === "r" || e.key === "R") {
    // Reset game variables
    player.health = 125;
    player.x = canvas.width / 2 - playerWidth / 2;
    player.y = canvas.height - playerHeight - 10;
    player.dx = 0;

    bullets = [];
    enemies = [];
    score = 0;
    coins = 0;
    battery = 100;

    // Reset the cooldown timers
    lastShotTime = 0;
    lastBatteryCooldownTime = 0;
    lastBombTime = 0;
    lastBatteryRegenTime = 0;
    bombEffectStartTime = 0;

    // Restart the game loop
    gameLoop();
  }
}

function drawBullets() {
  ctx.fillStyle = "yellow";
  for (let i = 0; i < bullets.length; i++) {
    ctx.fillRect(
      bullets[i].x,
      bullets[i].y,
      bullets[i].width,
      bullets[i].height
    );
  }
}

function drawEnemies() {
  ctx.fillStyle = "red";

  for (let i = 0; i < enemies.length; i++) {
    // Draw the main body of the enemy spaceship (a diamond shape)
    ctx.beginPath();
    ctx.moveTo(enemies[i].x + enemies[i].width / 2, enemies[i].y); // Top point
    ctx.lineTo(enemies[i].x, enemies[i].y + enemies[i].height / 2); // Left point
    ctx.lineTo(
      enemies[i].x + enemies[i].width / 2,
      enemies[i].y + enemies[i].height
    ); // Bottom point
    ctx.lineTo(
      enemies[i].x + enemies[i].width,
      enemies[i].y + enemies[i].height / 2
    ); // Right point
    ctx.closePath();
    ctx.fill();

    // Draw the cockpit (a small circle in the center of the enemy spaceship)
    ctx.fillStyle = "purple";
    ctx.beginPath();
    ctx.arc(
      enemies[i].x + enemies[i].width / 2,
      enemies[i].y + enemies[i].height / 2,
      enemies[i].width / 6,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Reset the color for the next enemy
    ctx.fillStyle = "red";
  }
}
// Initialize variables for score and high score
// Initialize variables for score and high score

let highScore = 0;
const marginTop = 50; // Set the margin at the top

function drawScore() {
  // Enable anti-aliasing for smoother text
  ctx.imageSmoothingEnabled = true;

  // Set font and style
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";

  // Add a shadow for better text visibility
  ctx.shadowColor = "black";
  ctx.shadowBlur = 4;

  // Draw the score text with margin
  ctx.fillText(`Score: ${score}`, 10, marginTop + 30);

  // Draw the high score text with margin
  ctx.fillText(`Highscore: ${highScore}`, 10, marginTop + 60);

  // Reset shadow to avoid affecting other drawings
  ctx.shadowBlur = 0;
}

// Call this function whenever the score is updated to update the high score as well
function updateScore() {
  if (score > highScore) {
    highScore = score; // Update high score if the current score is higher
  }
}

// Call this function whenever the score is updated to update the high score as well

function drawPlayerHealthBar() {
  const barWidth = 20; // Width of the health bar
  const barHeight = 125; // Height of the health bar
  const canvasWidth = ctx.canvas.width; // Width of the canvas
  const xPosition = canvasWidth - barWidth - 50; // Position the bar 50px from the right edge
  const yPosition = 10; // Top position of the bar

  // Ensure player health is within the valid range
  const validHealth = Math.max(0, Math.min(player.health, barHeight));

  ctx.fillStyle = "gray";
  ctx.fillRect(xPosition, yPosition, barWidth, barHeight); // Draw the background of the health bar

  ctx.fillStyle = "red";
  ctx.fillRect(
    xPosition,
    yPosition + (barHeight - validHealth), // Adjust the position based on the player's health
    barWidth,
    validHealth // Ensure the health doesn't exceed the bar's height
  ); // Draw the foreground of the health bar
}

// Function to recharge the battery over time
// Time tracking for battery regeneration (1 unit per second)
let lastBatteryRegenTime = 0; // Last time the battery was regenerated

function rechargeBattery() {
  const currentTime = Date.now();

  // Check if at least 1 second has passed since the last regeneration
  if (battery < batteryMax && currentTime - lastBatteryRegenTime >= 1000) {
    battery += 0.6; // Recharge 0.6 unit of battery
    lastBatteryRegenTime = currentTime; // Update the last regeneration time
  }
}

// Drawing the battery bar
function drawBatteryBar() {
  const barWidth = 20; // Width of the battery bar
  const barHeight = batteryMax * 2; // Maximum height of the battery bar
  const xPosition = 10; // Position from the left side of the canvas
  const yPosition = canvas.height - barHeight - 10; // Position from the bottom, accounting for padding

  // Draw the background of the battery bar
  ctx.fillStyle = "gray";
  ctx.fillRect(xPosition, yPosition, barWidth, barHeight);

  // Draw the foreground of the battery bar (green area)
  ctx.fillStyle = "green";
  ctx.fillRect(
    xPosition,
    yPosition + (barHeight - battery * 2), // Adjust Y position for the current battery level
    barWidth,
    battery * 2 // Foreground height proportional to battery level
  );
}

function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

let paused = false; // Track if the game is paused

document.addEventListener("keydown", togglePause);

function togglePause(e) {
  if (e.key === "Escape") {
    // Press 'Escape' to pause/resume
    paused = !paused; // Toggle the paused state
    if (!paused) {
      gameLoop(); // Resume the game loop if unpaused
    }
  }
}

let pauseTime = 0; // Tracks the elapsed time (no longer needed for text movement)

function drawPauseScreen() {
  // Draw semi-transparent overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; // Semi-transparent overlay
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw floating particles for a realistic effect
  for (let i = 0; i < 60; i++) {
    // Increased number of particles for a richer effect
    const x = Math.random() * canvas.width;
    const y = (Math.random() * canvas.height + pauseTime * 15) % canvas.height; // Adjusted to make particles move smoothly
    const size = Math.random() * 3 + 1; // Increased size range for a more visible effect

    // Slightly adjust the opacity and speed for smoother particles
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.1})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw "PAUSED" as static text (no floating effect)
  ctx.fillStyle = "white";
  ctx.font = "40px Arial";
  ctx.textAlign = "center"; // Center the text horizontally
  ctx.textBaseline = "middle"; // Center the text vertically
  ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2 - 30);

  // Draw "Press 'Esc' to Resume" as static text (no floating effect)
  ctx.font = "20px Arial";
  ctx.fillText(
    "Press 'Esc' to Resume",
    canvas.width / 2,
    canvas.height / 2 + 30
  );
}
// Create a new Audio object for background music
const bgMusic = new Audio("spacebg1.mp3");

// Set the audio to loop indefinitely
bgMusic.loop = true;

// Set the audio volume (optional) and ensure it's within a safe range
bgMusic.volume = Math.min(0.2, 1.0); // Volume between 0.0 and 1.0, adjust as needed

// Play the background music when the game starts
bgMusic.play();

// Ensure audio works well on different devices
bgMusic.addEventListener("canplaythrough", () => {
  console.log("Background music is ready to play");
});

// Dynamically adjust volume based on device
function adjustVolumeForDevice() {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
    // iOS devices may have specific audio behavior
    bgMusic.volume = 0.3; // Slightly higher volume for iOS
  } else if (userAgent.includes("android")) {
    // Android devices might need a lower volume
    bgMusic.volume = 0.2; // Lower volume for Android
  } else if (userAgent.includes("windows") || userAgent.includes("macintosh")) {
    // Desktop devices (Windows/Mac)
    bgMusic.volume = 0.25; // Default volume for desktops
  } else if (userAgent.includes("tablet")) {
    // Tablets (more generic check)
    bgMusic.volume = 0.25; // Lower volume for tablets compared to phones
  } else {
    // Default volume for other devices
    bgMusic.volume = 0.2;
  }
}

// Call this function when the page is loaded to balance the sound
adjustVolumeForDevice();

function gameLoop() {
  if (checkGameOver()) {
    drawGameOver();
    return; // Stop the game loop
  }
  if (paused) {
    drawPauseScreen(); // Display pause screen if paused
    return; // Stop updating and rendering while paused
  }
  clear();
  updatePlayer();
  updateBullets();
  generateEnemies();
  updateEnemies();
  detectCollisions();
  rechargeBattery(); // Recharge battery over time
  drawPlayer();
  drawBullets();
  adjustVolumeForDevice();
  drawCoins();
  drawEnemies();
  drawScore();
  drawBatteryBar(); // Draw the battery bar
  drawBombEffect(); // Draw bomb explosion effect if applicable
  drawPlayerHealthBar(); // Draw the player's health bar
  requestAnimationFrame(gameLoop);
  updateScore();
}

gameLoop(); // Start the game loop
