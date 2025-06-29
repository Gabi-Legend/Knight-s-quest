const startBtn = document.getElementById("startBtn");
const settingsBtn = document.getElementById("settingsBtn");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const menu = document.getElementById("menu");
const gameCanvas = document.getElementById("gameCanvas");
const settingsMenu = document.getElementById("settingsMenu");
const loadingScreen = document.getElementById("loadingScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const retryBtn = document.getElementById("retryBtn");
const upgradesBtn = document.getElementById("upgradesBtn");
const upgradesMenu = document.getElementById("upgradesMenu");
const closeUpgradesBtn = document.getElementById("closeUpgradesBtn");

let isPaused = false;

// Muzica
const bgMusic = new Audio("sounds/background.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.5;
let musicOn = true;

const volumeSlider = document.getElementById("volumeSlider");
volumeSlider.addEventListener("input", () => {
  bgMusic.volume = volumeSlider.value / 100;
});

// Fix upgrades button positioning - hide it initially
upgradesBtn.style.display = "none";
upgradesBtn.style.position = "fixed";
upgradesBtn.style.left = "20px";
upgradesBtn.style.top = "50%";
upgradesBtn.style.transform = "translateY(-50%)";
upgradesBtn.style.zIndex = "100";

const musicToggleBtn = document.getElementById("musicToggleBtn");
musicToggleBtn.addEventListener("click", () => {
  musicOn = !musicOn;
  if (musicOn) {
    bgMusic.play();
    musicToggleBtn.textContent = "Music: ON";
  } else {
    bgMusic.pause();
    musicToggleBtn.textContent = "Music: OFF";
  }
});
settingsBtn.addEventListener("click", () => {
  settingsMenu.classList.remove("hidden");
});

closeSettingsBtn.addEventListener("click", () => {
  settingsMenu.classList.add("hidden");
});

upgradesBtn.addEventListener("click", () => {
  if (!isGameOver) {
    isPaused = true;
    upgradesMenu.classList.remove("hidden");
    updateUpgradeUI();
  }
});

closeUpgradesBtn.addEventListener("click", () => {
  isPaused = false;
  upgradesMenu.classList.add("hidden");
});

startBtn.addEventListener("click", () => {
  menu.style.display = "none";
  gameCanvas.style.display = "block";
  loadingScreen.style.display = "flex";
  // Am eliminat linia upgradesBtn.style.display = "block" de aici

  setTimeout(() => {
    loadingScreen.style.display = "none";
    if (musicOn) {
      bgMusic.play();
    }
    startGame();
    // Mutăm setarea upgradesBtn aici, după ce loading screen dispare
    upgradesBtn.style.display = "block";
  }, 3000);
});

// Game variables
let knightX,
  knightY,
  currentState,
  lastTime,
  facingRight,
  isAttacking,
  attackStartTime,
  attackCooldown,
  isGameOver;
let gameOverAnimationStartTime;
let knightHealth, maxKnightHealth;
let score, level;
let werewolves;
let spawnedWerewolves, killedWerewolves;
let lastWerewolfSpawnTime, lastWhiteWerewolfSpawnTime;
let werewolfSpawnInterval, whiteWerewolfSpawnInterval;
let knightDamage;
let gameLoopId;
let credits = 0;

// Upgrade variables
let damageUpgradeLevel = 0;
let healthUpgradeLevel = 0;
let attackSpeedUpgradeLevel = 0;
const upgradeCosts = {
  damage: [100, 200, 400, 800, 1600],
  health: [100, 200, 400, 800, 1600],
  attackSpeed: [150, 300, 600, 1200, 2400],
};

// Upgrade buttons
const damageUpgradeBtn = document.getElementById("damageUpgradeBtn");
const healthUpgradeBtn = document.getElementById("healthUpgradeBtn");
const attackSpeedUpgradeBtn = document.getElementById("attackSpeedUpgradeBtn");

damageUpgradeBtn.addEventListener("click", () => {
  const cost = upgradeCosts.damage[damageUpgradeLevel];
  if (credits >= cost && damageUpgradeLevel < 5) {
    credits -= cost;
    damageUpgradeLevel++;
    knightDamage += 5;
    updateUpgradeUI();
  }
});

healthUpgradeBtn.addEventListener("click", () => {
  const cost = upgradeCosts.health[healthUpgradeLevel];
  if (credits >= cost && healthUpgradeLevel < 5) {
    credits -= cost;
    healthUpgradeLevel++;
    maxKnightHealth += 20;
    knightHealth = maxKnightHealth;
    updateUpgradeUI();
  }
});

attackSpeedUpgradeBtn.addEventListener("click", () => {
  const cost = upgradeCosts.attackSpeed[attackSpeedUpgradeLevel];
  if (credits >= cost && attackSpeedUpgradeLevel < 5) {
    credits -= cost;
    attackSpeedUpgradeLevel++;
    updateUpgradeUI();
  }
});

function updateUpgradeUI() {
  document.getElementById("currentDamage").textContent = damageUpgradeLevel * 5;
  document.getElementById("damageCost").textContent =
    damageUpgradeLevel < 5 ? upgradeCosts.damage[damageUpgradeLevel] : "MAX";
  damageUpgradeBtn.disabled =
    damageUpgradeLevel >= 5 ||
    credits < upgradeCosts.damage[damageUpgradeLevel];

  document.getElementById("currentHealth").textContent =
    healthUpgradeLevel * 20;
  document.getElementById("healthCost").textContent =
    healthUpgradeLevel < 5 ? upgradeCosts.health[healthUpgradeLevel] : "MAX";
  healthUpgradeBtn.disabled =
    healthUpgradeLevel >= 5 ||
    credits < upgradeCosts.health[healthUpgradeLevel];

  document.getElementById("currentAttackSpeed").textContent =
    attackSpeedUpgradeLevel * 15;
  document.getElementById("attackSpeedCost").textContent =
    attackSpeedUpgradeLevel < 5
      ? upgradeCosts.attackSpeed[attackSpeedUpgradeLevel]
      : "MAX";
  attackSpeedUpgradeBtn.disabled =
    attackSpeedUpgradeLevel >= 5 ||
    credits < upgradeCosts.attackSpeed[attackSpeedUpgradeLevel];

  document.getElementById("creditsDisplay").textContent = `Credits: ${credits}`;
}

function startGame() {
  const ctx = gameCanvas.getContext("2d");

  gameCanvas.width = window.innerWidth;
  gameCanvas.height = window.innerHeight;

  const knightWidth = 128;
  const knightHeight = 128;
  const borderPadding = 5;

  // Knight animations
  const knightAnimations = {
    idle: {
      frames: [],
      currentFrame: 0,
      frameCount: 4,
      src: "images/Knight_1/Idle.png",
      width: 128,
      height: 128,
      speed: 200,
    },
    run: {
      frames: [],
      currentFrame: 0,
      frameCount: 7,
      src: "images/Knight_1/Run.png",
      width: 128,
      height: 128,
      speed: 100,
    },
    attack: {
      frames: [],
      currentFrame: 0,
      frameCount: 5,
      src: "images/Knight_1/Attack 1.png",
      width: 128,
      height: 128,
      speed: 100 - attackSpeedUpgradeLevel * 15, // Faster attack with upgrades
    },
    dead: {
      frames: [],
      currentFrame: 0,
      frameCount: 6,
      src: "images/Knight_1/Dead.png",
      width: 128,
      height: 128,
      speed: 200,
    },
  };

  // Black Werewolf animations
  const blackWerewolfAnimations = {
    idle: {
      frames: [],
      currentFrame: 0,
      frameCount: 8,
      src: "images/Black_werewolf/Idle.png",
      width: 128,
      height: 128,
      speed: 150,
    },
    run: {
      frames: [],
      currentFrame: 0,
      frameCount: 9,
      src: "images/Black_werewolf/Run.png",
      width: 128,
      height: 128,
      speed: 100,
    },
    attack: {
      frames: [],
      currentFrame: 0,
      frameCount: 6,
      src: "images/Black_werewolf/Attack_1.png",
      width: 128,
      height: 128,
      speed: 100,
    },
    dead: {
      frames: [],
      currentFrame: 0,
      frameCount: 2,
      src: "images/Black_werewolf/Dead.png",
      width: 128,
      height: 128,
      speed: 200,
    },
    runAttack: {
      frames: [],
      currentFrame: 0,
      frameCount: 7,
      src: "images/Black_werewolf/Run+Attack.png",
      width: 128,
      height: 128,
      speed: 100,
    },
  };

  // White Werewolf animations
  const whiteWerewolfAnimations = {
    idle: {
      frames: [],
      currentFrame: 0,
      frameCount: 8,
      src: "images/White_Werewolf/Idle.png",
      width: 128,
      height: 128,
      speed: 150,
    },
    run: {
      frames: [],
      currentFrame: 0,
      frameCount: 9,
      src: "images/White_Werewolf/Run.png",
      width: 128,
      height: 128,
      speed: 100,
    },
    attack: {
      frames: [],
      currentFrame: 0,
      frameCount: 6,
      src: "images/White_Werewolf/Attack_1.png",
      width: 128,
      height: 128,
      speed: 100,
    },
    dead: {
      frames: [],
      currentFrame: 0,
      frameCount: 2,
      src: "images/White_Werewolf/Dead.png",
      width: 128,
      height: 128,
      speed: 200,
    },
    runAttack: {
      frames: [],
      currentFrame: 0,
      frameCount: 7,
      src: "images/White_Werewolf/Run+Attack.png",
      width: 128,
      height: 128,
      speed: 100,
    },
  };

  // Wizard animations
  const wizardAnimations = {
    walk: {
      frames: [],
      currentFrame: 0,
      frameCount: 7,
      src: "images/Wizard/Wanderer Magican/Walk.png",
      width: 128,
      height: 128,
      speed: 150,
    },
    attack: {
      frames: [],
      currentFrame: 0,
      frameCount: 7,
      src: "images/Wizard/Wanderer Magican/Attack_1.png",
      width: 128,
      height: 128,
      speed: 120,
    },
    dead: {
      frames: [],
      currentFrame: 0,
      frameCount: 4,
      src: "images/Wizard/Wanderer Magican/Dead.png",
      width: 128,
      height: 128,
      speed: 200,
    },
  };
  const orcAnimations = {
    idle: {
      frames: [],
      currentFrame: 0,
      frameCount: 4, // Folosim animația de atac pentru idle
      src: "images/Craftpix_Orc/Orc_Warrior/Attack_1.png",
      width: 96,
      height: 96,
      speed: 150,
    },
    run: {
      frames: [],
      currentFrame: 0,
      frameCount: 6,
      src: "images/Craftpix_Orc/Orc_Warrior/Run.png",
      width: 96,
      height: 96,
      speed: 100,
    },
    attack: {
      frames: [],
      currentFrame: 0,
      frameCount: 4,
      src: "images/Craftpix_Orc/Orc_Warrior/Attack_1.png",
      width: 96,
      height: 96,
      speed: 100,
    },
    dead: {
      frames: [],
      currentFrame: 0,
      frameCount: 4,
      src: "images/Craftpix_Orc/Orc_Warrior/Dead.png",
      width: 96,
      height: 96,
      speed: 200,
    },
    runAttack: {
      frames: [],
      currentFrame: 0,
      frameCount: 4,
      src: "images/Craftpix_Orc/Orc_Warrior/Run+Attack.png",
      width: 96,
      height: 96,
      speed: 100,
    },
  };

  // Initialize game variables
  knightX = (gameCanvas.width - knightWidth) / 2;
  knightY = (gameCanvas.height - knightHeight) / 2;
  currentState = "idle";
  lastTime = 0;
  facingRight = true;
  isAttacking = false;
  attackStartTime = 0;
  attackCooldown = false;
  isGameOver = false;
  gameOverAnimationStartTime = 0;
  maxKnightHealth = 100 + healthUpgradeLevel * 20;
  knightHealth = maxKnightHealth;
  score = 0;
  level = 1;
  credits = 0;

  werewolves = [];

  // Base stats for werewolves
  const werewolfStats = {
    black: {
      healthBase: 25,
      healthIncreaseRate: 10,
      damageBase: 5, // 5 damage per atac
      damageIncreaseRate: 1,
      attackCooldown: 1500,
      spawnInterval: 7000,
    },
    white: {
      healthBase: 60,
      healthIncreaseRate: 20,
      damageBase: 10, // 10 damage per atac
      damageIncreaseRate: 2,
      attackCooldown: 2000,
      spawnInterval: 20000,
    },
    wizard: {
      healthBase: 40,
      healthIncreaseRate: 15,
      damageBase: 15,
      damageIncreaseRate: 3,
      attackCooldown: 3000,
      spawnInterval: 15000,
      projectileSpeed: 4,
      attackRange: 300, // Magicianul atacă de la distanță
    },
    orc: {
      healthBase: 50,
      healthIncreaseRate: 15,
      damageBase: 12,
      damageIncreaseRate: 2,
      attackCooldown: 1800,
      spawnInterval: 12000,
    },
  };

  spawnedWerewolves = 0;
  killedWerewolves = 0;
  knightDamage = 25 + damageUpgradeLevel * 5;
  lastWerewolfSpawnTime = 0;
  lastWhiteWerewolfSpawnTime = 0;
  werewolfSpawnInterval = werewolfStats.black.spawnInterval;
  whiteWerewolfSpawnInterval = werewolfStats.white.spawnInterval;
  let lastWizardSpawnTime = 0;
  let wizardSpawnInterval = werewolfStats.wizard.spawnInterval;
  let wizardProjectiles = [];
  let lastOrcSpawnTime = 0;
  let orcSpawnInterval = werewolfStats.orc.spawnInterval;

  // Sound effects
  const swordSwingSound = new Audio("sounds/sword_swing.mp3");
  const werewolfHitSound = new Audio("sounds/werewolf_hit.mp3");
  const knightHitSound = new Audio("sounds/knight_hit.mp3");
  const gameOverSound = new Audio("sounds/game_over.mp3");
  const levelUpSound = new Audio("sounds/level_up.mp3");

  swordSwingSound.volume = bgMusic.volume;
  werewolfHitSound.volume = bgMusic.volume;
  knightHitSound.volume = bgMusic.volume;
  gameOverSound.volume = bgMusic.volume;
  levelUpSound.volume = bgMusic.volume;

  const keys = {
    KeyW: false,
    KeyS: false,
    KeyA: false,
    KeyD: false,
    Space: false,
  };

  function loadAnimationFrames() {
    // Knight animations
    Object.keys(knightAnimations).forEach((animation) => {
      const anim = knightAnimations[animation];
      const img = new Image();
      img.src = anim.src;

      img.onload = () => {
        for (let i = 0; i < anim.frameCount; i++) {
          const canvas = document.createElement("canvas");
          canvas.width = anim.width;
          canvas.height = anim.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(
            img,
            i * anim.width,
            0,
            anim.width,
            anim.height,
            0,
            0,
            anim.width,
            anim.height
          );
          anim.frames.push(canvas);
        }
      };
    });

    // Black Werewolf animations
    Object.keys(blackWerewolfAnimations).forEach((animation) => {
      const anim = blackWerewolfAnimations[animation];
      const img = new Image();
      img.src = anim.src;

      img.onload = () => {
        for (let i = 0; i < anim.frameCount; i++) {
          const canvas = document.createElement("canvas");
          canvas.width = anim.width;
          canvas.height = anim.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(
            img,
            i * anim.width,
            0,
            anim.width,
            anim.height,
            0,
            0,
            anim.width,
            anim.height
          );
          anim.frames.push(canvas);
        }
      };
    });

    // White Werewolf animations
    Object.keys(whiteWerewolfAnimations).forEach((animation) => {
      const anim = whiteWerewolfAnimations[animation];
      const img = new Image();
      img.src = anim.src;

      img.onload = () => {
        for (let i = 0; i < anim.frameCount; i++) {
          const canvas = document.createElement("canvas");
          canvas.width = anim.width;
          canvas.height = anim.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(
            img,
            i * anim.width,
            0,
            anim.width,
            anim.height,
            0,
            0,
            anim.width,
            anim.height
          );
          anim.frames.push(canvas);
        }
      };
    });
    // Wizard animations
    Object.keys(wizardAnimations).forEach((animation) => {
      const anim = wizardAnimations[animation];
      const img = new Image();
      img.src = anim.src;

      img.onload = () => {
        for (let i = 0; i < anim.frameCount; i++) {
          const canvas = document.createElement("canvas");
          canvas.width = anim.width;
          canvas.height = anim.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(
            img,
            i * anim.width,
            0,
            anim.width,
            anim.height,
            0,
            0,
            anim.width,
            anim.height
          );
          anim.frames.push(canvas);
        }
      };
    });
    // Orc animations
    Object.keys(orcAnimations).forEach((animation) => {
      const anim = orcAnimations[animation];
      const img = new Image();
      img.src = anim.src;

      img.onload = () => {
        for (let i = 0; i < anim.frameCount; i++) {
          const canvas = document.createElement("canvas");
          canvas.width = anim.width;
          canvas.height = anim.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(
            img,
            i * anim.width,
            0,
            anim.width,
            anim.height,
            0,
            0,
            anim.width,
            anim.height
          );
          anim.frames.push(canvas);
        }
      };
    });
  }

  function handleKeyDown(e) {
    if (isGameOver || isPaused) return;

    if (e.code in keys) {
      keys[e.code] = true;

      if (e.code === "Space" && !isAttacking && !attackCooldown) {
        isAttacking = true;
        attackStartTime = performance.now();
        currentState = "attack";
        knightAnimations.attack.currentFrame = 0;

        if (musicOn) {
          swordSwingSound.currentTime = 0;
          swordSwingSound.play();
        }
      }
    }
  }

  function handleKeyUp(e) {
    if (e.code in keys) {
      keys[e.code] = false;
    }
  }

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);

  function spawnWerewolf(type = "black") {
    const side = Math.random() > 0.5 ? "left" : "right";
    spawnedWerewolves++;

    const stats = werewolfStats[type];
    const damage =
      stats.damageBase +
      Math.floor(spawnedWerewolves / 3) * stats.damageIncreaseRate;

    // Make sure health scales properly with levels but maintains the desired hit count
    let health;
    if (type === "black") {
      health =
        stats.healthBase + stats.healthIncreaseRate * Math.floor(level / 2);
    } else {
      // White werewolf - dies in 2 hits
      health = Math.max(
        knightDamage + 1,
        stats.healthBase + stats.healthIncreaseRate * Math.floor(level / 2)
      );
      if (health <= knightDamage) {
        health = knightDamage + 1; // Ensure white werewolf always requires at least 2 hits
      }
    }

    const werewolf = {
      x: side === "left" ? -128 : gameCanvas.width,
      y: Math.floor(Math.random() * (gameCanvas.height - 128)),
      state: "run",
      lastTime: 0,
      facingRight: side === "left",
      health: health,
      lastAttackTime: 0,
      deathTime: null,
      damage: damage,
      type: type,
      attackCooldown: stats.attackCooldown,
      damageDealt: false, // Adaugă această proprietate
    };

    console.log(
      `Spawned ${type} werewolf with health: ${health}, damage: ${damage}`
    );
    werewolves.push(werewolf);
  }
  function spawnWizard() {
    const side = Math.random() > 0.5 ? "left" : "right";
    spawnedWerewolves++; // Folosim același contor pentru toți monștrii

    const stats = werewolfStats.wizard;
    const damage =
      stats.damageBase +
      Math.floor(spawnedWerewolves / 3) * stats.damageIncreaseRate;
    const health =
      stats.healthBase + stats.healthIncreaseRate * Math.floor(level / 2);

    const wizard = {
      x: side === "left" ? -128 : gameCanvas.width,
      y: Math.floor(Math.random() * (gameCanvas.height - 128)),
      state: "walk",
      lastTime: 0,
      facingRight: side === "left",
      health: health,
      lastAttackTime: 0,
      deathTime: null,
      damage: damage,
      type: "wizard",
      attackCooldown: stats.attackCooldown,
      damageDealt: false,
      isRanged: true, // Magicianul are atac la distanță
      attackRange: stats.attackRange, // Raza de atac mai mare
    };

    console.log(`Spawned wizard with health: ${health}, damage: ${damage}`);
    werewolves.push(wizard); // Adăugăm magicianul în același array cu lupii
  }
  function spawnOrc() {
    const side = Math.random() > 0.5 ? "left" : "right";
    spawnedWerewolves++; // Folosim același contor pentru toți monștrii

    const stats = werewolfStats.orc;
    const damage =
      stats.damageBase +
      Math.floor(spawnedWerewolves / 3) * stats.damageIncreaseRate;
    const health =
      stats.healthBase + stats.healthIncreaseRate * Math.floor(level / 2);

    const orc = {
      x: side === "left" ? -96 : gameCanvas.width,
      y: Math.floor(Math.random() * (gameCanvas.height - 96)),
      state: "run",
      lastTime: 0,
      facingRight: side === "left",
      health: health,
      lastAttackTime: 0,
      deathTime: null,
      damage: damage,
      type: "orc",
      attackCooldown: stats.attackCooldown,
      damageDealt: false,
    };

    console.log(`Spawned orc with health: ${health}, damage: ${damage}`);
    werewolves.push(orc); // Adăugăm orcul în același array cu ceilalți monștri
  }
  function moveWerewolves() {
    const now = performance.now();

    werewolves.forEach((werewolf) => {
      if (werewolf.state === "dead") return;

      const isWizard = werewolf.type === "wizard";
      const speed =
        werewolf.type === "white"
          ? 2.5 + level * 0.15
          : isWizard
          ? 1.5 + level * 0.08
          : werewolf.type === "orc"
          ? 1.8 + level * 0.12
          : 2 + level * 0.1;
      const directionX = knightX - werewolf.x;
      const directionY = knightY - werewolf.y;

      werewolf.facingRight = directionX > 0;

      // Calculează distanța până la cavaler
      const distance = Math.sqrt(
        directionX * directionX + directionY * directionY
      );

      // Verifică dacă monstrul e în raza de atac
      const attackRange = werewolf.attackRange || 50;
      const inAttackRange = distance < attackRange;

      if (inAttackRange) {
        // Dacă poate ataca (cooldown terminat)
        if (
          werewolf.state !== "attack" &&
          now - werewolf.lastAttackTime > werewolf.attackCooldown
        ) {
          // Începe un nou atac
          werewolf.state = "attack";
          werewolf.lastAttackTime = now;
          werewolf.damageDealt = false;

          // Pentru magician, creează un nou proiectil
          if (isWizard) {
            const angle = Math.atan2(directionY, directionX);
            const projectile = {
              x: werewolf.x + 64, // Centrul magicianului
              y: werewolf.y + 64,
              speedX: Math.cos(angle) * werewolfStats.wizard.projectileSpeed,
              speedY: Math.sin(angle) * werewolfStats.wizard.projectileSpeed,
              damage: werewolf.damage,
              creationTime: now,
            };
            wizardProjectiles.push(projectile);
          }

          console.log(`${werewolf.type} starts attacking!`);
        }
      } else {
        // Dacă nu e în raza de atac
        // Verifică dacă monstrul este în stare de atac dar ținta nu mai este în rază
        if (
          werewolf.state === "attack" &&
          now - werewolf.lastAttackTime > werewolf.attackCooldown
        ) {
          // Resetează starea la "run" sau "walk" pentru magician
          werewolf.state = isWizard ? "walk" : "run";
          werewolf.damageDealt = false;
        }

        if (werewolf.state !== "attack") {
          // Pentru magician, menține o distanță de siguranță
          if (isWizard && distance < 200) {
            // Se îndepărtează de cavaler
            const angle = Math.atan2(directionY, directionX);
            const moveX = -Math.cos(angle) * speed;
            const moveY = -Math.sin(angle) * speed;

            werewolf.x += moveX;
            werewolf.y += moveY;
          } else {
            // Calculează direcția de mișcare
            const angle = Math.atan2(directionY, directionX);
            const moveX = Math.cos(angle) * speed;
            const moveY = Math.sin(angle) * speed;

            // Mișcă monstrul spre jucător
            werewolf.x += moveX;
            werewolf.y += moveY;
          }

          // Magicianul folosește animația de mers, nu de alergat
          werewolf.state = isWizard ? "walk" : "run";
        }
      }

      // Verifică dacă atacul s-a terminat
      if (werewolf.state === "attack") {
        let attackAnimDuration;

        if (werewolf.type === "white") {
          attackAnimDuration =
            whiteWerewolfAnimations.attack.speed *
            whiteWerewolfAnimations.attack.frameCount;
        } else if (werewolf.type === "black") {
          attackAnimDuration =
            blackWerewolfAnimations.attack.speed *
            blackWerewolfAnimations.attack.frameCount;
        } else if (werewolf.type === "wizard") {
          attackAnimDuration =
            wizardAnimations.attack.speed * wizardAnimations.attack.frameCount;
        } else if (werewolf.type === "orc") {
          attackAnimDuration =
            orcAnimations.attack.speed * orcAnimations.attack.frameCount;
        }

        if (now - werewolf.lastAttackTime > attackAnimDuration) {
          werewolf.state = isWizard ? "walk" : "run";
        }
      }
    });
  }
  function updateWizardProjectiles() {
    const now = performance.now();

    // Actualizează poziția proiectilelor
    for (let i = wizardProjectiles.length - 1; i >= 0; i--) {
      const projectile = wizardProjectiles[i];

      // Mișcă proiectilul
      projectile.x += projectile.speedX;
      projectile.y += projectile.speedY;

      // Verifică coliziunea cu cavalerul
      const hitDistance = 30; // Raza de coliziune
      if (
        Math.abs(projectile.x - knightX - 64) < hitDistance &&
        Math.abs(projectile.y - knightY - 64) < hitDistance
      ) {
        // Lovitură directă
        knightHealth -= projectile.damage;

        if (musicOn) {
          knightHitSound.currentTime = 0;
          knightHitSound.play();
        }

        // Elimină proiectilul
        wizardProjectiles.splice(i, 1);
        continue;
      }

      // Elimină proiectilele ieșite din ecran sau prea vechi
      if (
        projectile.x < -50 ||
        projectile.x > gameCanvas.width + 50 ||
        projectile.y < -50 ||
        projectile.y > gameCanvas.height + 50 ||
        now - projectile.creationTime > 5000
      ) {
        wizardProjectiles.splice(i, 1);
      }
    }
  }
  function checkKnightAttack() {
    if (!isAttacking) return;

    const currentAnim = knightAnimations.attack;
    const attackProgress = performance.now() - attackStartTime;

    // Only apply damage on frame 2 of the attack animation
    // This ensures we only apply damage once per attack
    if (currentAnim.currentFrame === 2) {
      werewolves.forEach((werewolf) => {
        if (werewolf.state === "dead" || werewolf.hitByCurrentAttack) return;

        const attackRange = 80;
        if (
          Math.abs(werewolf.x - knightX) < attackRange &&
          Math.abs(werewolf.y - knightY) < attackRange
        ) {
          // Mark this werewolf as already hit by this attack
          werewolf.hitByCurrentAttack = true;

          // Apply damage to werewolf
          werewolf.health -= knightDamage;

          // Visual and audio feedback
          if (musicOn) {
            werewolfHitSound.currentTime = 0;
            werewolfHitSound.play();
          }

          // Log for debugging
          console.log(
            `${werewolf.type} werewolf hit! Health: ${werewolf.health}`
          );

          if (werewolf.health <= 0) {
            werewolf.state = "dead";
            werewolf.deathTime = performance.now();
            werewolf.attacking = false;
            werewolf.canAttack = false;
            killedWerewolves++;

            // White werewolves give more points
            const points = werewolf.type === "white" ? 25 * level : 10 * level;
            score += points;
            credits += points;

            if (killedWerewolves % 5 === 0) {
              level++;
              knightDamage += 5;
              knightHealth = Math.min(maxKnightHealth, knightHealth + 20);

              if (musicOn) {
                levelUpSound.currentTime = 0;
                levelUpSound.play();
              }
            }
          }
        }
      });
    }

    if (attackProgress > currentAnim.speed * currentAnim.frameCount) {
      isAttacking = false;
      attackCooldown = true;

      // Reset the hit flag for all werewolves when attack is finished
      werewolves.forEach((werewolf) => {
        werewolf.hitByCurrentAttack = false;
      });

      setTimeout(() => {
        attackCooldown = false;
      }, 300 - attackSpeedUpgradeLevel * 30); // Reduced cooldown with attack speed upgrades
      currentState = "idle";
    }
  }

  function checkWerewolfAttack() {
    werewolves.forEach((werewolf) => {
      // Skip dacă lupul e mort
      if (werewolf.state === "dead") return;

      // Verifica dacă lupul este în stare de atac
      if (werewolf.state === "attack") {
        const now = performance.now();

        // Calculăm a treia parte din animația de atac - momentul când ar trebui să dea damage
        const attackAnimDuration =
          werewolf.type === "white"
            ? whiteWerewolfAnimations.attack.speed *
              whiteWerewolfAnimations.attack.frameCount
            : werewolf.type === "orc"
            ? orcAnimations.attack.speed * orcAnimations.attack.frameCount
            : blackWerewolfAnimations.attack.speed *
              blackWerewolfAnimations.attack.frameCount;

        const attackMoment = werewolf.lastAttackTime + attackAnimDuration / 2;

        // Dă damage doar dacă suntem în jurul momentului de atac și nu am dat deja damage
        if (
          !werewolf.damageDealt &&
          now >= attackMoment &&
          now <= attackMoment + 100
        ) {
          // Verifică raza de atac
          const attackRange = 60; // Rază ceva mai mare pentru a fi sigur
          if (
            Math.abs(werewolf.x - knightX) < attackRange &&
            Math.abs(werewolf.y - knightY) < attackRange
          ) {
            // Aplică damage
            knightHealth -= werewolf.damage;
            werewolf.damageDealt = true;

            console.log(
              `${werewolf.type} werewolf hit knight for ${werewolf.damage} damage! (Health: ${knightHealth})`
            );

            if (musicOn) {
              knightHitSound.currentTime = 0;
              knightHitSound.play();
            }
          }
        }
      } else {
        // Resetează flag-ul când nu e în stare de atac
        werewolf.damageDealt = false;
      }
    });
  }

  function cleanDeadWerewolves() {
    const now = performance.now();
    werewolves = werewolves.filter((werewolf) => {
      if (werewolf.state === "dead") {
        if (now - werewolf.deathTime >= 1000) {
          return false;
        }
        return true;
      }
      return true;
    });
  }

  function displayHUD() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(10, 10, 300, 100);

    ctx.fillStyle = "red";
    ctx.fillRect(20, 30, 200, 20);
    ctx.fillStyle = "green";
    ctx.fillRect(20, 30, (knightHealth / maxKnightHealth) * 200, 20);

    ctx.fillStyle = "white";
    ctx.font = "bold 18px Arial";
    ctx.fillText("Health:", 20, 25);
    ctx.fillText(
      `${Math.max(0, Math.floor(knightHealth))}/${maxKnightHealth}`,
      230,
      45
    );

    ctx.fillStyle = "white";
    ctx.fillText(`Score: ${score}`, 20, 70);
    ctx.fillText(`Level: ${level}`, 20, 95);
    ctx.fillText(`Credits: ${credits}`, 150, 70);
  }

  function checkGameOver() {
    if (knightHealth <= 0 && !isGameOver) {
      isGameOver = true;
      currentState = "dead";
      gameOverAnimationStartTime = performance.now();
      upgradesBtn.style.display = "none";

      if (musicOn) {
        bgMusic.pause();
        gameOverSound.play();
      }

      return true;
    }
    return false;
  }

  function showGameOverScreen() {
    gameOverScreen.style.display = "flex";
    gameOverScreen.style.flexDirection = "column";
    gameOverScreen.style.alignItems = "center";
    gameOverScreen.style.justifyContent = "center";

    const oldScoreElement = gameOverScreen.querySelector("p");
    if (oldScoreElement) {
      gameOverScreen.removeChild(oldScoreElement);
    }

    const scoreElement = document.createElement("p");
    scoreElement.textContent = `Final Score: ${score}`;
    scoreElement.style.fontSize = "36px";
    scoreElement.style.color = "white";
    scoreElement.style.textAlign = "center";
    gameOverScreen.insertBefore(scoreElement, retryBtn);

    retryBtn.textContent = "Retry";
    retryBtn.style.display = "block";
  }

  function gameLoop(timestamp) {
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    // Verificăm dacă jocul este în pauză
    if (isPaused) {
      // Desenăm tot, dar nu actualizăm logica jocului
      // Desenăm doar cavalerului în starea idle
      const currentKnightAnim = knightAnimations["idle"];

      if (currentKnightAnim.frames.length > 0) {
        if (!facingRight) {
          ctx.save();
          ctx.translate(knightX + knightWidth, knightY);
          ctx.scale(-1, 1);
          ctx.drawImage(
            currentKnightAnim.frames[currentKnightAnim.currentFrame],
            0,
            0,
            currentKnightAnim.width,
            currentKnightAnim.height,
            0,
            0,
            knightWidth,
            knightHeight
          );
          ctx.restore();
        } else {
          ctx.drawImage(
            currentKnightAnim.frames[currentKnightAnim.currentFrame],
            knightX,
            knightY,
            knightWidth,
            knightHeight
          );
        }
      }

      // Desenează monștrii în pozițiile lor actuale
      werewolves.forEach((werewolf) => {
        let animations;
        if (werewolf.type === "white") {
          animations = whiteWerewolfAnimations;
        } else if (werewolf.type === "black") {
          animations = blackWerewolfAnimations;
        } else if (werewolf.type === "wizard") {
          animations = wizardAnimations;
        } else if (werewolf.type === "orc") {
          animations = orcAnimations;
        }
        const currentWerewolfAnim = animations[werewolf.state];

        if (currentWerewolfAnim.frames.length > 0) {
          if (!werewolf.facingRight) {
            ctx.save();
            ctx.translate(
              werewolf.x + (werewolf.type === "orc" ? 96 : 128),
              werewolf.y
            );
            ctx.scale(-1, 1);
            ctx.drawImage(
              currentWerewolfAnim.frames[currentWerewolfAnim.currentFrame],
              0,
              0,
              werewolf.type === "orc" ? 96 : 128,
              werewolf.type === "orc" ? 96 : 128
            );
            ctx.restore();
          } else {
            ctx.drawImage(
              currentWerewolfAnim.frames[currentWerewolfAnim.currentFrame],
              werewolf.x,
              werewolf.y,
              werewolf.type === "orc" ? 96 : 128,
              werewolf.type === "orc" ? 96 : 128
            );
          }
        }
      });

      drawWizardProjectiles(ctx);
      displayHUD();

      gameLoopId = requestAnimationFrame(gameLoop);
      return;
    }

    if (!isAttacking && !checkGameOver()) {
      if (keys.KeyA && knightX - 5 >= borderPadding) {
        knightX -= 5;
        facingRight = false;
      }
      if (
        keys.KeyD &&
        knightX + 5 + knightWidth <= gameCanvas.width - borderPadding
      ) {
        knightX += 5;
        facingRight = true;
      }
      if (keys.KeyW && knightY - 5 >= borderPadding) {
        knightY -= 5;
      }
      if (
        keys.KeyS &&
        knightY + 5 + knightHeight <= gameCanvas.height - borderPadding
      ) {
        knightY += 5;
      }

      currentState =
        keys.KeyA || keys.KeyD || keys.KeyW || keys.KeyS ? "run" : "idle";
    }

    const currentKnightAnim = knightAnimations[currentState];
    if (timestamp - lastTime > currentKnightAnim.speed) {
      currentKnightAnim.currentFrame =
        (currentKnightAnim.currentFrame + 1) % currentKnightAnim.frameCount;
      lastTime = timestamp;
    }

    if (currentKnightAnim.frames.length > 0) {
      if (!facingRight) {
        ctx.save();
        ctx.translate(knightX + knightWidth, knightY);
        ctx.scale(-1, 1);
        ctx.drawImage(
          currentKnightAnim.frames[currentKnightAnim.currentFrame],
          0,
          0,
          currentKnightAnim.width,
          currentKnightAnim.height,
          0,
          0,
          knightWidth,
          knightHeight
        );
        ctx.restore();
      } else {
        ctx.drawImage(
          currentKnightAnim.frames[currentKnightAnim.currentFrame],
          knightX,
          knightY,
          knightWidth,
          knightHeight
        );
      }
    }

    moveWerewolves();

    werewolves.forEach((werewolf) => {
      let animations;
      if (werewolf.type === "white") {
        animations = whiteWerewolfAnimations;
      } else if (werewolf.type === "black") {
        animations = blackWerewolfAnimations;
      } else if (werewolf.type === "wizard") {
        animations = wizardAnimations;
      } else if (werewolf.type === "orc") {
        animations = orcAnimations;
      }
      const currentWerewolfAnim = animations[werewolf.state];

      if (timestamp - werewolf.lastTime > currentWerewolfAnim.speed) {
        currentWerewolfAnim.currentFrame =
          (currentWerewolfAnim.currentFrame + 1) %
          currentWerewolfAnim.frameCount;
        werewolf.lastTime = timestamp;
      }

      if (currentWerewolfAnim.frames.length > 0) {
        if (!werewolf.facingRight) {
          ctx.save();
          ctx.translate(
            werewolf.x + (werewolf.type === "orc" ? 96 : 128),
            werewolf.y
          );
          ctx.scale(-1, 1);
          ctx.drawImage(
            currentWerewolfAnim.frames[currentWerewolfAnim.currentFrame],
            0,
            0,
            werewolf.type === "orc" ? 96 : 128,
            werewolf.type === "orc" ? 96 : 128
          );
          ctx.restore();
        } else {
          ctx.drawImage(
            currentWerewolfAnim.frames[currentWerewolfAnim.currentFrame],
            werewolf.x,
            werewolf.y,
            werewolf.type === "orc" ? 96 : 128,
            werewolf.type === "orc" ? 96 : 128
          );
        }
      }
    });

    updateWizardProjectiles();
    drawWizardProjectiles(ctx);
    checkKnightAttack();
    checkWerewolfAttack();
    cleanDeadWerewolves();
    displayHUD();

    const currentTime = performance.now();

    // Black werewolf spawn logic
    const adjustedSpawnInterval = Math.max(
      2000,
      werewolfStats.black.spawnInterval - (level - 1) * 500
    );
    if (currentTime - lastWerewolfSpawnTime > adjustedSpawnInterval) {
      spawnWerewolf("black");
      lastWerewolfSpawnTime = currentTime;
      werewolfSpawnInterval = adjustedSpawnInterval + Math.random() * 1000;
    }

    // White werewolf spawn logic - rarer but stronger
    const adjustedWhiteSpawnInterval = Math.max(
      10000,
      werewolfStats.white.spawnInterval - (level - 1) * 1000
    );
    if (currentTime - lastWhiteWerewolfSpawnTime > adjustedWhiteSpawnInterval) {
      spawnWerewolf("white");
      lastWhiteWerewolfSpawnTime = currentTime;
      whiteWerewolfSpawnInterval =
        adjustedWhiteSpawnInterval + Math.random() * 2000;
    }
    // Wizard spawn logic
    const adjustedWizardSpawnInterval = Math.max(
      5000,
      werewolfStats.wizard.spawnInterval - (level - 1) * 800
    );
    if (currentTime - lastWizardSpawnTime > adjustedWizardSpawnInterval) {
      spawnWizard();
      lastWizardSpawnTime = currentTime;
      wizardSpawnInterval = adjustedWizardSpawnInterval + Math.random() * 1500;
    }
    // Orc spawn logic
    const adjustedOrcSpawnInterval = Math.max(
      6000,
      werewolfStats.orc.spawnInterval - (level - 1) * 700
    );
    if (currentTime - lastOrcSpawnTime > adjustedOrcSpawnInterval) {
      spawnOrc();
      lastOrcSpawnTime = currentTime;
      orcSpawnInterval = adjustedOrcSpawnInterval + Math.random() * 1200;
    }
    gameLoopId = requestAnimationFrame(gameLoop);
  }

  loadAnimationFrames();
  gameLoopId = requestAnimationFrame(gameLoop);

  function resetGame() {
    if (gameLoopId) {
      cancelAnimationFrame(gameLoopId);
    }

    // Reset game state
    knightHealth = 100 + healthUpgradeLevel * 20;
    maxKnightHealth = 100 + healthUpgradeLevel * 20;
    werewolves = [];
    spawnedWerewolves = 0;
    killedWerewolves = 0;
    score = 0;
    level = 1;
    isGameOver = false;

    gameOverScreen.style.display = "none";
    upgradesBtn.style.display = "block";

    if (musicOn) {
      bgMusic.currentTime = 0;
      bgMusic.play();
    }

    startGame();
  }
  //Puta madre
  retryBtn.addEventListener("click", resetGame);
  function drawWizardProjectiles(ctx) {
    wizardProjectiles.forEach((projectile) => {
      ctx.fillStyle = "purple";
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 12, 0, Math.PI * 2);
      ctx.stroke();
    });
  }
}
