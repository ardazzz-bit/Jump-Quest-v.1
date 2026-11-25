const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const coinDisplay = document.getElementById("coinCount");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const MAX_LEVEL = 30;

const selectedLevel = Math.min(
    MAX_LEVEL,
    Math.max(1, Number(localStorage.getItem("selectedLevel")) || 1)
);

const GROUND_Y = 440;

const BOSS_LEVELS = [6, 12, 18, 24, 30];

const WORLD_WIDTH = BOSS_LEVELS.includes(selectedLevel)
    ? 1900
    : 3000 + selectedLevel * 65;

const GRAVITY = 0.58;
const MOVE_SPEED = 4.5;
const JUMP_POWER = -12.5;

let cameraX = 0;
let coinsCollected = 0;

// ==========================================
// EQUIPPED ABILITIES
// ==========================================

const equippedAbilities = JSON.parse(
    localStorage.getItem("equippedAbilities") || "[]"
);

function hasAbility(id) {
    return equippedAbilities.includes(id);
}

let lives = hasAbility("extra_life") ? 4 : 3;

let jumpsUsed = 0;
let shieldAvailable = hasAbility("shield");
let phoenixAvailable = hasAbility("phoenix");

let timeFreezeTimer = 0;

let gameWon = false;
let gameOver = false;
let gameRunning = true;
let levelCompleted = false;

let previousBottom = 0;
let previousTop = 0;
let checkpointX = 55;
let invulnerableTimer = 0;

const keys = Object.create(null);

const player = {
    x: 55,
    y: 300,
    width: 30,
    height: 40,
    vx: 0,
    vy: 0,
    grounded: false,
    facing: 1,
    animation: 0
};

// ==========================================
// CHARACTER DESIGNS
// ==========================================

const characterDesigns = {
    classic:       { body: "#1769c6", head: "#ffc18b", outfit: "#ed3d35", boots: "#71371e", detail: "#ffffff" },
    shadow:        { body: "#29213f", head: "#42315e", outfit: "#171526", boots: "#171526", detail: "#a855f7" },
    street_x:      { body: "#292929", head: "#e6b98c", outfit: "#ef4444", boots: "#111111", detail: "#facc15" },
    golden:        { body: "#d99b24", head: "#ffdc67", outfit: "#a96b13", boots: "#51320c", detail: "#fff1a8" },
    desert:        { body: "#b77932", head: "#e9b982", outfit: "#75421f", boots: "#49301c", detail: "#f5d27a" },
    ice:           { body: "#67e8f9", head: "#e0faff", outfit: "#0891b2", boots: "#164e63", detail: "#ffffff" },
    crystal:       { body: "#a78bfa", head: "#ddd6fe", outfit: "#6d28d9", boots: "#312e81", detail: "#67e8f9" },
    cyber_punk:    { body: "#312e81", head: "#f0abfc", outfit: "#db2777", boots: "#171526", detail: "#22d3ee" },
    silver_royal:  { body: "#94a3b8", head: "#e2e8f0", outfit: "#475569", boots: "#1e293b", detail: "#ffffff" },
    magma:         { body: "#991b1b", head: "#fb923c", outfit: "#451a03", boots: "#292524", detail: "#facc15" },
    dragon_knight: { body: "#166534", head: "#86efac", outfit: "#14532d", boots: "#292524", detail: "#facc15" },
    emperor:       { body: "#7e22ce", head: "#fcd34d", outfit: "#581c87", boots: "#3b0764", detail: "#facc15" },
    pharaoh_x:     { body: "#d6a62e", head: "#eab676", outfit: "#164e63", boots: "#78350f", detail: "#22d3ee" },
    divinity:      { body: "#fef3c7", head: "#ffffff", outfit: "#facc15", boots: "#92400e", detail: "#ffffff" },
    void_emperor:  { body: "#312e81", head: "#c4b5fd", outfit: "#111827", boots: "#030712", detail: "#c084fc" },
    glitch_404:    { body: "#0f172a", head: "#f0abfc", outfit: "#db2777", boots: "#111827", detail: "#22d3ee" },
    chaos_king:    { body: "#7f1d1d", head: "#fca5a5", outfit: "#450a0a", boots: "#1c1917", detail: "#f97316" },
    royal:         { body: "#7041a6", head: "#ffc98f", outfit: "#d6a62e", boots: "#38204f", detail: "#facc15" },
    mega_one:      { body: "#111827", head: "#e0f2fe", outfit: "#7c3aed", boots: "#020617", detail: "#22d3ee" }
};

// ==========================================
// WORLD THEMES
// ==========================================

const worlds = [
    {
        name: "GRASS WORLD",
        skyTop: "#53b9ff",
        skyBottom: "#b6efff",
        grass: "#43c746",
        dirt: "#a9572b",
        hill: "#279e43",
        accent: "#fff08a"
    },
    {
        name: "FOREST WORLD",
        skyTop: "#246c91",
        skyBottom: "#a4d9a4",
        grass: "#318c3c",
        dirt: "#704326",
        hill: "#155b32",
        accent: "#d4ff85"
    },
    {
        name: "CAVE WORLD",
        skyTop: "#292b55",
        skyBottom: "#6d6b91",
        grass: "#777b83",
        dirt: "#514052",
        hill: "#383653",
        accent: "#9cdbff"
    },
    {
        name: "DESERT / ICE",
        skyTop: "#ed9c49",
        skyBottom: "#ffe3a0",
        grass: "#d6a344",
        dirt: "#a66c36",
        hill: "#d18b3f",
        accent: "#fff1a1"
    },
    {
        name: "SKY / CASTLE",
        skyTop: "#393d85",
        skyBottom: "#b1a9e8",
        grass: "#7773a7",
        dirt: "#59466f",
        hill: "#55518d",
        accent: "#ffda65"
    }
];

const worldIndex = Math.floor((selectedLevel - 1) / 6);
const theme = worlds[worldIndex];

// ==========================================
// LEVEL OBJECTS
// ==========================================

const platforms = [];
const blocks = [];
const pipes = [];
const coins = [];
const enemies = [];
const spikes = [];
const movingPlatforms = [];
const checkpoints = [];
const bossProjectiles = [];
const bossHazards = [];
let bossWarning = "";
let bossWarningTimer = 0;
const victoryParticles = [];

let boss = null;
let bossDefeated = false;
let finishX = WORLD_WIDTH - 110;


function isBossLevel() {
    return BOSS_LEVELS.includes(selectedLevel);
}

function getBossName() {
    return ({
        6: "THE FOREST GUARDIAN",
        12: "THE ANCIENT BEAST",
        18: "THE CAVE TITAN",
        24: "THE FROST EMPEROR",
        30: "THE DARK KING"
    })[selectedLevel] || "WORLD BOSS";
}

// ==========================================
// LEVEL GENERATOR
// ==========================================
// ==========================================
// UNIQUE LEVEL GENERATOR + BOSS ARENAS
// ==========================================

const levelLayouts = [
    // Level 1
    { gap: 0, platformCount: 2, spikes: 0, moving: 0, enemies: 1 },
    // Level 2
    { gap: 1, platformCount: 3, spikes: 0, moving: 0, enemies: 2 },
    // Level 3
    { gap: 1, platformCount: 3, spikes: 1, moving: 0, enemies: 2 },
    // Level 4
    { gap: 2, platformCount: 4, spikes: 1, moving: 0, enemies: 3 },
    // Level 5
    { gap: 2, platformCount: 4, spikes: 2, moving: 1, enemies: 3 },

    // Level 7
    { gap: 1, platformCount: 4, spikes: 1, moving: 1, enemies: 3 },
    // Level 8
    { gap: 2, platformCount: 5, spikes: 2, moving: 1, enemies: 3 },
    // Level 9
    { gap: 2, platformCount: 5, spikes: 2, moving: 2, enemies: 4 },
    // Level 10
    { gap: 3, platformCount: 5, spikes: 3, moving: 2, enemies: 4 },
    // Level 11
    { gap: 3, platformCount: 6, spikes: 3, moving: 2, enemies: 5 },

    // Level 13
    { gap: 2, platformCount: 5, spikes: 2, moving: 2, enemies: 4 },
    // Level 14
    { gap: 3, platformCount: 6, spikes: 3, moving: 2, enemies: 4 },
    // Level 15
    { gap: 3, platformCount: 6, spikes: 4, moving: 2, enemies: 5 },
    // Level 16
    { gap: 4, platformCount: 7, spikes: 4, moving: 3, enemies: 5 },
    // Level 17
    { gap: 4, platformCount: 7, spikes: 5, moving: 3, enemies: 6 },

    // Level 19
    { gap: 3, platformCount: 6, spikes: 3, moving: 2, enemies: 5 },
    // Level 20
    { gap: 4, platformCount: 7, spikes: 4, moving: 3, enemies: 5 },
    // Level 21
    { gap: 4, platformCount: 7, spikes: 5, moving: 3, enemies: 6 },
    // Level 22
    { gap: 5, platformCount: 8, spikes: 5, moving: 3, enemies: 6 },
    // Level 23
    { gap: 5, platformCount: 8, spikes: 6, moving: 4, enemies: 7 },

    // Level 25
    { gap: 4, platformCount: 7, spikes: 5, moving: 3, enemies: 6 },
    // Level 26
    { gap: 5, platformCount: 8, spikes: 6, moving: 3, enemies: 6 },
    // Level 27
    { gap: 5, platformCount: 8, spikes: 6, moving: 4, enemies: 7 },
    // Level 28
    { gap: 6, platformCount: 9, spikes: 7, moving: 4, enemies: 7 },
    // Level 29
    { gap: 6, platformCount: 9, spikes: 8, moving: 5, enemies: 8 }
];

function createGroundSegment(x, width) {
    platforms.push({
        x,
        y: GROUND_Y,
        width,
        height: 60,
        type: "ground"
    });
}

function createFloatingPlatform(x, y, width = 110) {
    platforms.push({
        x,
        y,
        width,
        height: 18,
        type: "platform"
    });
}

function createBossArena() {
    const arenaGround = {
        x: 0,
        y: GROUND_Y,
        width: WORLD_WIDTH,
        height: 60,
        type: "ground"
    };

    platforms.push(arenaGround);

    // Arena decorations / raised platforms.
    createFloatingPlatform(300, 345, 150);
    createFloatingPlatform(720, 315, 150);
    createFloatingPlatform(1150, 345, 150);
    createFloatingPlatform(1500, 315, 150);

    // Boss-specific arena identity.
    const bossConfigs = {
        6: {
            name: "THE FOREST GUARDIAN",
            width: 88,
            height: 80,
            health: 4,
            speed: 1.5,
            color: "#4c9b45"
        },
        12: {
            name: "THE ANCIENT BEAST",
            width: 100,
            height: 90,
            health: 5,
            speed: 1.8,
            color: "#a64b55"
        },
        18: {
            name: "THE CAVE TITAN",
            width: 112,
            height: 105,
            health: 6,
            speed: 2,
            color: "#8170a8"
        },
        24: {
            name: "THE FROST EMPEROR",
            width: 100,
            height: 95,
            health: 7,
            speed: 2.2,
            color: "#61c8ed"
        },
        30: {
            name: "THE DARK KING",
            width: 125,
            height: 115,
            health: 10,
            speed: 2.5,
            color: "#9b42bb"
        }
    };

    const config = bossConfigs[selectedLevel];

    boss = {
        ...config,
        x: WORLD_WIDTH - 420,
        y: GROUND_Y - config.height,
        startX: WORLD_WIDTH - 420,
        direction: -1,
        attackTimer: 100,
        hurtTimer: 0,
        deathTimer: 0,
        animation: 0,
        alive: true,
        maxHealth: config.health,
        phase: 1,
        warningTimer: 0,
        attackType: "idle"
    };

    finishX = WORLD_WIDTH - 100;

    // No ordinary enemies or normal finish on boss stages.
  
}

function generateNormalLevel() {
    const layoutIndex = selectedLevel < 6
        ? selectedLevel - 1
        : selectedLevel < 12
            ? selectedLevel - 2
            : selectedLevel < 18
                ? selectedLevel - 3
                : selectedLevel < 24
                    ? selectedLevel - 4
                    : selectedLevel - 5;

    const layout = levelLayouts[layoutIndex];

    const segmentWidth = 520;
    const segmentCount = Math.ceil(WORLD_WIDTH / segmentWidth);

    for (let i = 0; i < segmentCount; i++) {
        const x = i * segmentWidth;

        // Ground sections and gaps.
        const hasGap = i > 0 && i < segmentCount - 1 &&
            i % Math.max(2, 7 - layout.gap) === 0;

        if (!hasGap) {
            createGroundSegment(
                x,
                Math.min(segmentWidth - 30, WORLD_WIDTH - x)
            );
        }

        // Unique platform positions.
        for (let p = 0; p < layout.platformCount; p++) {
            const px = x + 55 + ((p * 137 + selectedLevel * 29) % 390);
            const py = 355 - ((p * 47 + selectedLevel * 13) % 125);

            createFloatingPlatform(
                px,
                py,
                85 + ((p * 19) % 55)
            );

            if (p % 2 === 0) {
                coins.push({
                    x: px + 35,
                    y: py - 35,
                    collected: false,
                    value: 100,
                    type: "normal"
                });
            }
        }

        // Coins on the ground.
        coins.push({
            x: x + 150,
            y: 385,
            collected: false,
            value: 100,
            type: "normal"
        });

        // Enemies.
        if (i > 0 && i < segmentCount - 1 && i <= layout.enemies) {
            enemies.push(
                createEnemy(
                    x + 300,
                    GROUND_Y - 30,
                    i % 3 === 0 ? "turtle" : "walker"
                )
            );
        }

        // Spikes.
        if (i > 0 && i <= layout.spikes) {
            spikes.push({
                x: x + 220,
                y: GROUND_Y - 22,
                width: 55 + (i % 3) * 15,
                height: 22
            });
        }

        // Moving platforms.
        if (i > 1 && i <= layout.moving) {
            movingPlatforms.push({
                x: x + 190,
                y: 315 - (i % 2) * 35,
                startX: x + 150,
                endX: x + 370,
                width: 100,
                height: 16,
                speed: 1.1 + selectedLevel * 0.035,
                direction: 1
            });
        }

        // Question blocks.
        if (i > 0) {
            blocks.push({
                x: x + 400,
                y: 255 - (i % 2) * 25,
                size: 40,
                type: "question",
                used: false
            });
        }

        // Checkpoints.
        if (i > 1 && i % 3 === 0) {
            checkpoints.push({
                x: x + 45,
                y: GROUND_Y,
                activated: false
            });
        }
    }

    finishX = WORLD_WIDTH - 100;

    // Finish approach.
    createFloatingPlatform(WORLD_WIDTH - 430, 350, 130);
    createFloatingPlatform(WORLD_WIDTH - 240, 300, 130);

    // Rare coin.
    coins.push({
        x: WORLD_WIDTH - 550,
        y: 220,
        collected: false,
        value: 500,
        type: "rare"
    });
}

function generateLevel() {
    if (isBossLevel()) {
        createBossArena();
    } else {
        generateNormalLevel();
    }

    // Turn blocks and pipes into solid platforms.
    for (const block of blocks) {
        platforms.push({
            x: block.x,
            y: block.y,
            width: block.size,
            height: block.size,
            type: "block"
        });
    }

    for (const pipe of pipes) {
        platforms.push({
            x: pipe.x,
            y: pipe.y,
            width: pipe.width,
            height: pipe.height,
            type: "pipe"
        });
    }
}

// ==========================================
// ENEMY CREATION
// ==========================================

function createEnemy(x, y, type) {
    return {
        x,
        y,
        startX: x,
        startY: y,
        width: type === "turtle" ? 34 : 32,
        height: type === "flyer" ? 27 : 30,
        type,
        speed: type === "flyer"
            ? 1.5
            : 1 + Math.floor((selectedLevel - 1) / 10) * 0.3,
        direction: Math.random() > 0.5 ? 1 : -1,
        alive: true,
        animation: 0
    };
}

generateLevel();

// ==========================================
// KEYBOARD CONTROLS
// ==========================================

document.addEventListener("keydown", event => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) {
        event.preventDefault();
    }

    if (event.repeat) return;

    keys[event.code] = true;

    // TIME FREEZE
    if (
        event.code === "KeyQ" &&
        hasAbility("time_freeze") &&
        !gameWon &&
        !gameOver &&
        timeFreezeTimer <= 0
    ) {
        timeFreezeTimer = 180;
    }

    // JUMP AND DOUBLE JUMP
    const jumpPressed = [
        "Space",
        "ArrowUp",
        "KeyW"
    ].includes(event.code);

    if (jumpPressed && !gameWon && !gameOver) {

        const jumpPower = hasAbility("high_jump")
            ? JUMP_POWER * 1.3
            : JUMP_POWER;

        if (player.grounded) {
            player.vy = jumpPower;
            player.grounded = false;
            jumpsUsed = 1;
        }

        else if (
            hasAbility("double_jump") &&
            jumpsUsed < 2
        ) {
            player.vy = jumpPower;
            jumpsUsed = 2;
        }
    }

    if (event.code === "KeyR" && gameOver) restartGame();
    if (event.code === "KeyN" && gameWon) nextLevel();
});
document.addEventListener("keyup", event => {
    keys[event.code] = false;
});

// ==========================================
// PLAYER UPDATE
// ==========================================

function updatePlayer() {
    if (gameWon || gameOver) return;

    previousBottom = player.y + player.height;
    previousTop = player.y;

    if (invulnerableTimer > 0) {
        invulnerableTimer--;
    }

    if (timeFreezeTimer > 0) {
        timeFreezeTimer--;
    }

    if (keys.ArrowRight || keys.KeyD) {
        player.vx = MOVE_SPEED;
        player.facing = 1;
    } else if (keys.ArrowLeft || keys.KeyA) {
        player.vx = -MOVE_SPEED;
        player.facing = -1;
    } else {
        player.vx *= 0.75;
    }

    player.x += player.vx;

    if (player.x < 0) {
        player.x = 0;
    }

    // Keep the player from passing the boss while it is alive.
    if (boss && boss.alive && player.x + player.width > finishX - 115) {
        player.x = finishX - 115 - player.width;
    }

    player.vy += GRAVITY;
    player.y += player.vy;
    player.grounded = false;

    // PLATFORM COLLISION
    for (const platform of [...platforms, ...movingPlatforms]) {
        const horizontalOverlap =
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.width;

        const crossedPlatform =
            previousBottom <= platform.y &&
            player.y + player.height >= platform.y;

        if (
            horizontalOverlap &&
            crossedPlatform &&
            player.vy >= 0
        ) {
            player.y = platform.y - player.height;
            player.vy = 0;
            player.grounded = true;
            jumpsUsed = 0;
        }

        const hitFromBelow =
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.width &&
            previousTop >= platform.y + platform.height &&
            player.y <= platform.y + platform.height &&
            player.vy < 0;

        if (hitFromBelow) {
            player.y = platform.y + platform.height;
            player.vy = 0;
        }
    }

    // MOVING PLATFORMS
    for (const platform of movingPlatforms) {
        platform.x += platform.speed * platform.direction;

        if (platform.x >= platform.endX || platform.x <= platform.startX) {
            platform.direction *= -1;
        }
    }

    // PIPE COLLISION
    for (const pipe of pipes) {
        const touching =
            player.x + player.width > pipe.x &&
            player.x < pipe.x + pipe.width &&
            player.y + player.height > pipe.y &&
            player.y + player.height < pipe.y + 18 &&
            player.vy >= 0;

        if (touching) {
            player.y = pipe.y - player.height;
            player.vy = 0;
            player.grounded = true;
            jumpsUsed = 0;
        }
    }

    // BLOCK COLLISION
    for (const block of blocks) {
        if (block.used) continue;

        const touching =
            player.x + player.width > block.x &&
            player.x < block.x + block.size &&
            player.y < block.y + block.size &&
            player.y + player.height > block.y;

        if (touching && player.vy < 0 && previousTop >= block.y + block.size - 8) {
            player.y = block.y + block.size;
            player.vy = 0;

            if (block.type === "question") {
                block.used = true;
                coinsCollected += 100;
                updateCoinDisplay();
                createParticles(block.x + 20, block.y, "#ffd700", 12);
            }
        }
    }

    // SPIKE COLLISION
    for (const spike of spikes) {
        if (
            player.x + player.width > spike.x &&
            player.x < spike.x + spike.width &&
            player.y + player.height > spike.y &&
            player.y < spike.y + spike.height
        ) {
            damagePlayer();
        }
    }

    // CHECKPOINTS
    for (const checkpoint of checkpoints) {
        if (
            !checkpoint.activated &&
            player.x + player.width > checkpoint.x &&
            player.x < checkpoint.x + 45
        ) {
            checkpoint.activated = true;
            checkpointX = checkpoint.x;
            coinsCollected += 300;
            updateCoinDisplay();
            createParticles(checkpoint.x, GROUND_Y - 60, "#42e85b", 18);
            showMessage("CHECKPOINT ACTIVATED! +300 COINS");
        }
    }

    // FALLING
    if (player.y > HEIGHT + 100) {
        damagePlayer();
    }

    // CAMERA
    cameraX = Math.max(
        0,
        Math.min(
            player.x - WIDTH * 0.38,
            WORLD_WIDTH - WIDTH
        )
    );

    player.animation += Math.abs(player.vx) * 0.12;
}

// ==========================================
// DAMAGE AND LIVES
// ==========================================

function damagePlayer() {
    if (invulnerableTimer > 0 || gameOver || gameWon) return;

    if (shieldAvailable) {
        shieldAvailable = false;
        invulnerableTimer = 100;
        player.vy = -7;
        createParticles(player.x, player.y, "#62d9ff", 20);
        showMessage("SHIELD ACTIVATED!");
        return;
    }

    if (phoenixAvailable) {
        phoenixAvailable = false;
        lives = Math.max(lives, 1);
        invulnerableTimer = 150;
        player.y = GROUND_Y - player.height;
        player.x = checkpointX;
        player.vy = -8;
        createParticles(player.x, player.y, "#ff8b35", 25);
        showMessage("PHOENIX REVIVED!");
        return;
    }

    lives--;
    updateLivesDisplay();

    if (lives <= 0) {
        gameOver = true;
        return;
    }

    player.x = checkpointX;
    player.y = GROUND_Y - player.height;
    player.vx = 0;
    player.vy = -5;
    invulnerableTimer = 120;
}

// ==========================================
// COINS
// ==========================================

function updateCoins() {
    if (gameOver || gameWon) return;

    for (const coin of coins) {
        if (coin.collected) continue;

        const dx = player.x + player.width / 2 - coin.x;
        const dy = player.y + player.height / 2 - coin.y;

        if (Math.abs(dx) < 30 && Math.abs(dy) < 35) {
            coin.collected = true;
            coinsCollected += coin.value;

            updateCoinDisplay();

            const color = coin.type === "hidden"
                ? "#ff4de1"
                : coin.type === "rare"
                    ? "#55eaff"
                    : "#ffd700";

            createParticles(coin.x, coin.y, color, 10);
        }

        // Hidden coins become visible when the player approaches.
        if (coin.type === "hidden") {
            coin.visible = Math.abs(dx) < 105;
        } else {
            coin.visible = true;
        }
    }
}

// ==========================================
// ENEMIES
// ==========================================

function updateEnemies() {
    if (timeFreezeTimer > 0) return;

    for (const enemy of enemies) {
        if (!enemy.alive) continue;

        enemy.animation += 0.1;

        enemy.x += enemy.speed * enemy.direction;

        if (Math.abs(enemy.x - enemy.startX) > 90) {
            enemy.direction *= -1;
        }

        if (enemy.type === "flyer") {
            enemy.y = enemy.startY + Math.sin(enemy.animation * 2) * 25;
        }

        const touching =
            player.x + player.width > enemy.x &&
            player.x < enemy.x + enemy.width &&
            player.y + player.height > enemy.y &&
            player.y < enemy.y + enemy.height;

        if (!touching) continue;

        const stomping =
            previousBottom <= enemy.y + 12 &&
            player.vy > 0;

        if (stomping) {
            enemy.alive = false;
            player.vy = -8;
            coinsCollected += enemy.type === "turtle" ? 300 : 200;
            updateCoinDisplay();
            createParticles(enemy.x, enemy.y, "#ffcf57", 12);
        } else {
            damagePlayer();
        }
    }
}

// ==========================================
// BOSS UPDATE
// ==========================================

function updateBoss() {
    if (!boss || !boss.alive || gameOver || gameWon) return;
    if (timeFreezeTimer > 0) return;

    boss.animation += 0.08;

    if (boss.hurtTimer > 0) {
        boss.hurtTimer--;
    }

    if (boss.warningTimer > 0) {
        boss.warningTimer--;
    }

    // Boss movement.
    const movementRange = selectedLevel === 30 ? 220 : 150;

    boss.x += boss.speed * boss.direction;

    if (
        boss.x < boss.startX - movementRange ||
        boss.x > boss.startX + 35
    ) {
        boss.direction *= -1;
    }

    const playerCenter = player.x + player.width / 2;
    const bossCenter = boss.x + boss.width / 2;

    // Player attacks by jumping on the boss.
    const horizontalOverlap =
        player.x + player.width > boss.x &&
        player.x < boss.x + boss.width;

    const landingOnBoss =
        horizontalOverlap &&
        previousBottom <= boss.y + 22 &&
        player.y + player.height >= boss.y &&
        player.vy > 0;

    if (landingOnBoss && boss.hurtTimer <= 0) {
        boss.health--;
        boss.hurtTimer = 55;

        player.y = boss.y - player.height;
        player.vy = -10;
        player.grounded = false;

        createParticles(
            bossCenter,
            boss.y,
            "#ffcf57",
            20
        );

        showMessage(
            `BOSS HIT! ${boss.health} HP LEFT`
        );

        // Final boss changes phases.
        if (selectedLevel === 30) {
            const healthPercent = boss.health / boss.maxHealth;

            if (healthPercent <= 0.65 && boss.phase === 1) {
                boss.phase = 2;
                boss.speed *= 1.25;
                boss.attackTimer = 65;
                showMessage("DARK KING: PHASE 2!");
            }

            if (healthPercent <= 0.3 && boss.phase === 2) {
                boss.phase = 3;
                boss.speed *= 1.3;
                boss.attackTimer = 45;
                showMessage("DARK KING: FINAL PHASE!");
            }
        }

        if (boss.health <= 0) {
            defeatBoss();
        }

        return;
    }

    // Touching the boss hurts the player.
    const touching =
        player.x + player.width > boss.x &&
        player.x < boss.x + boss.width &&
        player.y + player.height > boss.y &&
        player.y < boss.y + boss.height;

    if (touching && !landingOnBoss) {
        damagePlayer();
    }

    // Attack timing.
    boss.attackTimer--;

    if (boss.attackTimer <= 0) {
        launchBossAttack(playerCenter, bossCenter);
    }
}

// ==========================================
// BOSS ATTACK CREATION
// ==========================================

function launchBossAttack(playerCenter, bossCenter) {
    if (!boss || !boss.alive) return;

    const phase = boss.phase || 1;

    const attackDelay = selectedLevel === 30
        ? Math.max(45, 105 - phase * 20)
        : Math.max(75, 145 - selectedLevel * 1.5);

    boss.attackTimer = attackDelay;

    // FOREST GUARDIAN — ground shockwaves.
    if (selectedLevel === 6) {
        bossWarning = "JUMP! SHOCKWAVE!";
        bossWarningTimer = 65;

        bossProjectiles.push({
            kind: "wave",
            x: boss.x + (boss.direction < 0 ? 0 : boss.width),
            y: GROUND_Y - 12,
            vx: boss.direction * 4,
            vy: 0,
            radius: 17,
            alive: true
        });

        return;
    }

    // ANCIENT BEAST — falling rocks.
    if (selectedLevel === 12) {
        bossWarning = "WATCH OUT! FALLING ROCK!";
        bossWarningTimer = 75;

        bossProjectiles.push({
            kind: "rock",
            x: playerCenter,
            y: -35,
            vx: 0,
            vy: 3,
            radius: 18,
            alive: true
        });

        return;
    }

    // CAVE TITAN — powerful ground attack.
    if (selectedLevel === 18) {
        bossWarning = "TITAN SLAM!";
        bossWarningTimer = 65;

        for (const direction of [-1, 1]) {
            bossProjectiles.push({
                kind: "wave",
                x: bossCenter,
                y: GROUND_Y - 12,
                vx: direction * 4.5,
                vy: 0,
                radius: 20,
                alive: true
            });
        }

        return;
    }

    // FROST EMPEROR — three ice shards.
    if (selectedLevel === 24) {
        bossWarning = "ICE BLAST!";
        bossWarningTimer = 65;

        for (const offset of [-1, 0, 1]) {
            bossProjectiles.push({
                kind: "ice",
                x: bossCenter,
                y: boss.y + 30,
                vx: -4 + offset * 2,
                vy: offset * 1.5,
                radius: 11,
                alive: true
            });
        }

        return;
    }

    // DARK KING — three phases.
    if (selectedLevel === 30) {
        if (phase === 1) {
            bossWarning = "DARK ORBS!";
            bossWarningTimer = 60;

            for (const offset of [-1, 0, 1]) {
                bossProjectiles.push({
                    kind: "orb",
                    x: bossCenter,
                    y: boss.y + 35,
                    vx: -4 + offset * 2.5,
                    vy: offset * 1.2,
                    radius: 13,
                    alive: true
                });
            }
        }

        else if (phase === 2) {
            bossWarning = "DARK SHOCKWAVE!";
            bossWarningTimer = 65;

            for (const direction of [-1, 1]) {
                bossProjectiles.push({
                    kind: "wave",
                    x: bossCenter,
                    y: GROUND_Y - 12,
                    vx: direction * 5,
                    vy: 0,
                    radius: 20,
                    alive: true
                });
            }
        }

        else {
            bossWarning = "FINAL ATTACK!";
            bossWarningTimer = 75;

            for (const offset of [-2, -1, 0, 1, 2]) {
                bossProjectiles.push({
                    kind: "orb",
                    x: bossCenter,
                    y: boss.y + 35,
                    vx: -5 + offset * 2,
                    vy: offset * 1.3,
                    radius: 12,
                    alive: true
                });
            }

            // A second shockwave follows the orbs.
            bossProjectiles.push({
                kind: "wave",
                x: bossCenter,
                y: GROUND_Y - 12,
                vx: boss.direction * 5,
                vy: 0,
                radius: 20,
                alive: true
            });
        }
    }
}

// ==========================================
// BOSS PROJECTILE UPDATE
// ==========================================

function updateBossProjectiles() {
    for (const projectile of bossProjectiles) {
        if (!projectile.alive) continue;

        projectile.x += projectile.vx;
        projectile.y += projectile.vy;

        if (projectile.kind === "rock") {
            projectile.vy += 0.18;
        }

        const touching =
            player.x + player.width > projectile.x - projectile.radius &&
            player.x < projectile.x + projectile.radius &&
            player.y + player.height > projectile.y - projectile.radius &&
            player.y < projectile.y + projectile.radius;

        if (touching) {
            projectile.alive = false;
            damagePlayer();
        }

        // Remove rocks when they hit the ground.
        if (
            projectile.kind === "rock" &&
            projectile.y >= GROUND_Y - projectile.radius
        ) {
            projectile.alive = false;

            createParticles(
                projectile.x,
                GROUND_Y - 10,
                "#a99b86",
                10
            );
        }

        // Remove projectiles outside the arena.
        if (
            projectile.x < -100 ||
            projectile.x > WORLD_WIDTH + 100 ||
            projectile.y > HEIGHT + 100
        ) {
            projectile.alive = false;
        }
    }

    for (let i = bossProjectiles.length - 1; i >= 0; i--) {
        if (!bossProjectiles[i].alive) {
            bossProjectiles.splice(i, 1);
        }
    }
}
// ==========================================
// BOSS DEFEAT
// ==========================================

function awardLevelBonus(rewardId, amount) {
    const claimedRewards = JSON.parse(
        localStorage.getItem("claimedGameRewards") || "[]"
    );

    if (claimedRewards.includes(rewardId)) return false;

    claimedRewards.push(rewardId);

    localStorage.setItem(
        "claimedGameRewards",
        JSON.stringify(claimedRewards)
    );

    coinsCollected += amount;
    updateCoinDisplay();

    return true;
}

function defeatBoss() {
    if (!boss || bossDefeated) return;

    bossDefeated = true;
    boss.alive = false;
    boss.deathTimer = 100;

    const reward = selectedLevel === 30 ? 0 : 7500;

    awardLevelBonus(`boss_${selectedLevel}`, reward);

    showMessage("BOSS DEFEATED!");

    createParticles(
        boss.x + boss.width / 2,
        boss.y + boss.height / 2,
        "#ffcf57",
        55
    );

    if (selectedLevel === 30) {
        createParticles(
            boss.x,
            boss.y,
            "#ffffff",
            65
        );
    }
}
// ==========================================
// PARTICLE EFFECTS
// ==========================================

function createParticles(x, y, color, amount = 10) {
    for (let i = 0; i < amount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;

        victoryParticles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            size: 3 + Math.random() * 5,
            color,
            life: 35 + Math.random() * 30
        });
    }
}

function updateParticles() {
    for (const particle of victoryParticles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.12;
        particle.life--;
    }

    for (let i = victoryParticles.length - 1; i >= 0; i--) {
        if (victoryParticles[i].life <= 0) {
            victoryParticles.splice(i, 1);
        }
    }
}

function drawParticles() {
    for (const particle of victoryParticles) {
        ctx.globalAlpha = Math.max(0, particle.life / 60);
        ctx.fillStyle = particle.color;
        ctx.fillRect(
            particle.x - cameraX,
            particle.y,
            particle.size,
            particle.size
        );
    }

    ctx.globalAlpha = 1;
}

// ==========================================
// COIN DISPLAY
// ==========================================

function updateCoinDisplay() {
    const totalCoins = Number(localStorage.getItem("totalCoins")) || 0;

    if (coinDisplay) {
        coinDisplay.textContent = (
            totalCoins + coinsCollected
        ).toLocaleString();
    }
}

function updateLivesDisplay() {
    const livesDisplay = document.getElementById("livesCount");

    if (livesDisplay) {
        livesDisplay.textContent = lives;
    }
}

// ==========================================
// MESSAGE DISPLAY
// ==========================================

let messageText = "";
let messageTimer = 0;

function showMessage(message) {
    messageText = message;
    messageTimer = 110;
}

function drawMessage() {
    if (messageTimer <= 0) return;

    messageTimer--;

    ctx.save();

    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";

    const width = ctx.measureText(messageText).width + 40;

    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(
        WIDTH / 2 - width / 2,
        75,
        width,
        42
    );

    ctx.fillStyle = "#ffffff";
    ctx.fillText(messageText, WIDTH / 2, 102);

    ctx.restore();
}

// ==========================================
// COIN DRAWING
// ==========================================

function drawCoins(time) {
    for (const coin of coins) {
        if (coin.collected || !coin.visible) continue;

        const x = coin.x - cameraX;
        const y = coin.y;

        if (x < -50 || x > WIDTH + 50) continue;

        const bob = Math.sin(time * 0.004 + coin.x) * 4;

        ctx.save();

        if (coin.type === "hidden") {
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#ff4de1";
            ctx.fillStyle = "#ff4de1";
        } else if (coin.type === "rare") {
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#55eaff";
            ctx.fillStyle = "#55eaff";
        } else {
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#ffcf33";
            ctx.fillStyle = "#ffd700";
        }

        ctx.beginPath();
        ctx.ellipse(
            x,
            y + bob,
            coin.type === "normal" ? 9 : 12,
            coin.type === "normal" ? 12 : 15,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#a66b16";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#fff5b0";
        ctx.fillRect(x - 2, y - 7 + bob, 4, 13);

        ctx.restore();
    }
}

// ==========================================
// PLAYER DRAWING
// ==========================================

function drawPlayer() {
    const selectedCharacter =
        localStorage.getItem("selectedCharacter") || "classic";

    const design =
        characterDesigns[selectedCharacter] || characterDesigns.classic;

    const x = player.x - cameraX;
    const y = player.y;

    if (invulnerableTimer > 0 && Math.floor(invulnerableTimer / 6) % 2 === 0) {
        return;
    }

    ctx.save();

    // Facing direction
    ctx.translate(x + player.width / 2, y);
    ctx.scale(player.facing, 1);

    // Boots
    ctx.fillStyle = design.boots;
    ctx.fillRect(-13, 32, 12, 8);
    ctx.fillRect(2, 32, 12, 8);

    // Body
    ctx.fillStyle = design.body;
    ctx.fillRect(-12, 13, 24, 21);

    // Outfit
    ctx.fillStyle = design.outfit;
    ctx.fillRect(-12, 21, 24, 13);

    // Head
    ctx.fillStyle = design.head;
    ctx.fillRect(-11, 0, 22, 17);

    // Eyes
    ctx.fillStyle = "#171717";
    ctx.fillRect(3, 6, 3, 4);

    // Character detail
    ctx.fillStyle = design.detail;
    ctx.fillRect(-11, 15, 22, 3);

    // Arms
    ctx.fillStyle = design.body;
    ctx.fillRect(-17, 17, 6, 13);
    ctx.fillRect(11, 17, 6, 13);

    ctx.restore();
}

// ==========================================
// ENEMY DRAWING
// ==========================================

function drawEnemies() {
    for (const enemy of enemies) {
        if (!enemy.alive) continue;

        const x = enemy.x - cameraX;
        const y = enemy.y;

        if (x < -60 || x > WIDTH + 60) continue;

        ctx.save();

        if (enemy.type === "turtle") {
            ctx.fillStyle = "#318b45";
            ctx.fillRect(x + 4, y + 8, 27, 20);

            ctx.fillStyle = "#17652f";
            ctx.fillRect(x + 7, y + 2, 21, 16);

            ctx.fillStyle = "#f4d58a";
            ctx.fillRect(x + 24, y + 10, 9, 9);

            ctx.fillStyle = "#111";
            ctx.fillRect(x + 27, y + 12, 3, 3);

            ctx.fillStyle = "#3c542b";
            ctx.fillRect(x + 6, y + 26, 8, 4);
            ctx.fillRect(x + 23, y + 26, 8, 4);
        }

        else if (enemy.type === "flyer") {
            ctx.fillStyle = "#8b4fd1";
            ctx.fillRect(x + 5, y + 7, 23, 15);

            ctx.fillStyle = "#c69aff";
            ctx.fillRect(x - 4, y + 2, 13, 7);
            ctx.fillRect(x + 24, y + 2, 13, 7);

            ctx.fillStyle = "#fff";
            ctx.fillRect(x + 20, y + 10, 5, 5);

            ctx.fillStyle = "#111";
            ctx.fillRect(x + 22, y + 11, 2, 3);
        }

        else {
            ctx.fillStyle = "#a94a31";
            ctx.fillRect(x + 3, y + 5, 27, 24);

            ctx.fillStyle = "#d68a4d";
            ctx.fillRect(x + 6, y, 21, 12);

            ctx.fillStyle = "#fff";
            ctx.fillRect(x + 19, y + 6, 5, 5);

            ctx.fillStyle = "#111";
            ctx.fillRect(x + 21, y + 7, 2, 3);
        }

        ctx.restore();
    }
}

// ==========================================
// BOSS DRAWING
// ==========================================

function drawBoss() {
    if (!boss) return;

    const x = boss.x - cameraX;
    const y = boss.y;

    if (x < -150 || x > WIDTH + 150) return;

    ctx.save();

    if (
        boss.hurtTimer > 0 &&
        Math.floor(boss.hurtTimer / 5) % 2 === 0
    ) {
        ctx.globalAlpha = 0.45;
    }

    if (boss.alive) {
        const bounce = Math.sin(boss.animation) * 3;

        const colors = {
            6: ["#315e31", "#75a94c", "#244525"],
            12: ["#7c3548", "#c65b65", "#4b1f36"],
            18: ["#49415f", "#9c8ab9", "#27243d"],
            24: ["#397eac", "#9beaff", "#164c78"],
            30: ["#281b46", "#9b42bb", "#100b20"]
        };

        const palette = colors[selectedLevel] || colors[30];

        // Body
        ctx.fillStyle = palette[0];
        ctx.fillRect(
            x + 5,
            y + 20 + bounce,
            boss.width - 10,
            boss.height - 20
        );

        // Head
        ctx.fillStyle = palette[1];
        ctx.fillRect(
            x + 8,
            y + bounce,
            boss.width - 16,
            30
        );

        // Horns
        ctx.fillStyle = palette[2];

        ctx.beginPath();
        ctx.moveTo(x + 13, y + 5 + bounce);
        ctx.lineTo(x + 3, y - 13 + bounce);
        ctx.lineTo(x + 23, y + 5 + bounce);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x + boss.width - 13, y + 5 + bounce);
        ctx.lineTo(x + boss.width - 3, y - 13 + bounce);
        ctx.lineTo(x + boss.width - 23, y + 5 + bounce);
        ctx.fill();

        // Eyes
        ctx.fillStyle = "#ff3b3b";
        ctx.fillRect(x + 18, y + 12 + bounce, 8, 7);
        ctx.fillRect(
            x + boss.width - 27,
            y + 12 + bounce,
            8,
            7
        );

        // Feet
        ctx.fillStyle = palette[2];
        ctx.fillRect(
            x + 7,
            y + boss.height - 7 + bounce,
            20,
            9
        );
        ctx.fillRect(
            x + boss.width - 27,
            y + boss.height - 7 + bounce,
            20,
            9
        );
    }

    ctx.restore();

    // Boss name and health bar
    if (boss.alive) {
        const barWidth = 130;
        const barX = x + boss.width / 2 - barWidth / 2;
        const barY = y - 32;

        ctx.save();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";

        ctx.fillText(
            boss.name,
            barX + barWidth / 2,
            barY - 8
        );

        ctx.fillStyle = "#222";
        ctx.fillRect(
            barX - 2,
            barY - 2,
            barWidth + 4,
            13
        );

        ctx.fillStyle = "#c62828";
        ctx.fillRect(barX, barY, barWidth, 9);

        ctx.fillStyle = "#53e36b";
        ctx.fillRect(
            barX,
            barY,
            barWidth * Math.max(0, boss.health / boss.maxHealth),
            9
        );

        ctx.restore();
    }
}

// ==========================================
// BOSS ATTACK WARNING
// ==========================================

function drawBossWarning() {
    if (bossWarningTimer <= 0 || !bossWarning) return;

    ctx.save();

    const pulse = 0.75 + Math.sin(Date.now() * 0.012) * 0.2;

    ctx.globalAlpha = pulse;
    ctx.textAlign = "center";
    ctx.font = "bold 21px Arial";

    const textWidth = ctx.measureText(bossWarning).width + 45;

    ctx.fillStyle = "rgba(120, 0, 0, 0.88)";
    ctx.fillRect(
        WIDTH / 2 - textWidth / 2,
        125,
        textWidth,
        48
    );

    ctx.strokeStyle = "#ff7777";
    ctx.lineWidth = 2;
    ctx.strokeRect(
        WIDTH / 2 - textWidth / 2,
        125,
        textWidth,
        48
    );

    ctx.fillStyle = "#ffffff";
    ctx.fillText(
        bossWarning,
        WIDTH / 2,
        156
    );

    ctx.restore();

    bossWarningTimer--;
}

// ==========================================
// BOSS PROJECTILE DRAWING
// ==========================================

function drawBossProjectiles() {
    for (const projectile of bossProjectiles) {
        const x = projectile.x - cameraX;
        const y = projectile.y;

        ctx.save();

        if (projectile.kind === "wave") {
            ctx.shadowBlur = 14;
            ctx.shadowColor = "#ff5733";
            ctx.fillStyle = "#ff5733";

            ctx.beginPath();
            ctx.ellipse(
                x,
                y,
                projectile.radius + 7,
                projectile.radius * 0.55,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        else if (projectile.kind === "rock") {
            ctx.fillStyle = "#887765";
            ctx.beginPath();
            ctx.arc(x, y, projectile.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#b5a28b";
            ctx.fillRect(x - 5, y - 8, 8, 7);
        }

        else if (projectile.kind === "ice") {
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#70eaff";
            ctx.fillStyle = "#a9f4ff";

            ctx.beginPath();
            ctx.moveTo(x, y - 15);
            ctx.lineTo(x + 11, y);
            ctx.lineTo(x, y + 15);
            ctx.lineTo(x - 11, y);
            ctx.closePath();
            ctx.fill();
        }

        else {
            ctx.shadowBlur = 18;
            ctx.shadowColor = "#c04cff";
            ctx.fillStyle = "#a52bdf";

            ctx.beginPath();
            ctx.arc(x, y, projectile.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#f3caff";
            ctx.beginPath();
            ctx.arc(x - 4, y - 4, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

// ==========================================
// SPIKE DRAWING
// ==========================================

function drawSpikes() {
    for (const spike of spikes) {
        const x = spike.x - cameraX;

        ctx.fillStyle = "#b7c1cc";

        const count = Math.floor(spike.width / 16);

        for (let i = 0; i < count; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * 16, spike.y + spike.height);
            ctx.lineTo(x + i * 16 + 8, spike.y);
            ctx.lineTo(x + i * 16 + 16, spike.y + spike.height);
            ctx.closePath();
            ctx.fill();
        }

        ctx.strokeStyle = "#59616c";
        ctx.strokeRect(x, spike.y, spike.width, spike.height);
    }
}
// ==========================================
// PLATFORM DRAWING
// ==========================================

function drawPlatforms() {
    for (const platform of platforms) {
        const x = platform.x - cameraX;

        if (x + platform.width < 0 || x > WIDTH) continue;

        ctx.fillStyle = platform.color || "#39834a";
        ctx.fillRect(
            x,
            platform.y,
            platform.width,
            platform.height
        );

        ctx.fillStyle = "#70c85d";
        ctx.fillRect(
            x,
            platform.y,
            platform.width,
            7
        );

        ctx.fillStyle = "rgba(0,0,0,0.12)";

        for (let i = 8; i < platform.width - 5; i += 24) {
            ctx.fillRect(
                x + i,
                platform.y + 12,
                10,
                4
            );
        }
    }
}

// ==========================================
// CHECKPOINT DRAWING
// ==========================================

function drawCheckpoints() {
    for (const checkpoint of checkpoints) {
        const x = checkpoint.x - cameraX;

        ctx.fillStyle = "#777";
        ctx.fillRect(x + 20, checkpoint.y - 65, 5, 65);

        ctx.fillStyle = checkpoint.activated ? "#42e85b" : "#e8e8e8";
        ctx.fillRect(x + 6, checkpoint.y - 65, 35, 23);

        ctx.fillStyle = checkpoint.activated ? "#168e37" : "#e33b3b";
        ctx.fillRect(x + 6, checkpoint.y - 53, 35, 11);
    }
}

// ==========================================
// BACKGROUND
// ==========================================

function drawBackground(time) {
    const currentTheme = worlds[
        Math.min(4, Math.floor((selectedLevel - 1) / 6))
    ];

    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);

    gradient.addColorStop(0, currentTheme.skyTop);
    gradient.addColorStop(1, currentTheme.skyBottom);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Sun
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.beginPath();
    ctx.arc(WIDTH - 100, 90, 35, 0, Math.PI * 2);
    ctx.fill();

    // Clouds
    ctx.fillStyle = "rgba(15, 14, 14, 0.45)";

    for (let i = 0; i < 6; i++) {
        const cloudX =
            ((i * 190 - cameraX * 0.25) % (WIDTH + 200) + WIDTH + 200)
            % (WIDTH + 200) - 100;

        const cloudY = 65 + (i % 3) * 55;

        ctx.beginPath();
        ctx.arc(cloudX, cloudY, 20, 0, Math.PI * 2);
        ctx.arc(cloudX + 25, cloudY - 10, 25, 0, Math.PI * 2);
        ctx.arc(cloudX + 50, cloudY, 20, 0, Math.PI * 2);
        ctx.fill();
    }

    // Distant hills
    ctx.fillStyle = currentTheme.hillColor || "rgba(30,100,65,0.35)";

    for (let i = 0; i < 5; i++) {
        const hillX = i * 230 - (cameraX * 0.12) % 230;

        ctx.beginPath();
        ctx.arc(hillX, HEIGHT - 35, 125, Math.PI, 0);
        ctx.fill();
    }

    // Ground
    ctx.fillStyle = currentTheme.groundColor || "#347d43";
    ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);

    ctx.fillStyle = currentTheme.groundTop || "#69bd54";
    ctx.fillRect(0, GROUND_Y, WIDTH, 9);
}

// ==========================================
// LEVEL COMPLETION
// ==========================================

function completeLevel() {
    if (levelCompleted) return;

    levelCompleted = true;
    gameRunning = false;

    const completedLevels = JSON.parse(
        localStorage.getItem("completedLevels") || "[]"
    );

    const alreadyCompleted = completedLevels.includes(selectedLevel);

    if (!alreadyCompleted) {
        completedLevels.push(selectedLevel);

        localStorage.setItem(
            "completedLevels",
            JSON.stringify(completedLevels)
        );

        const completionReward =
            selectedLevel % 6 === 0 ? 3500 : 2000;

        coinsCollected += completionReward;

        localStorage.setItem(
            "totalCoins",
            String(
                (Number(localStorage.getItem("totalCoins")) || 0)
                + coinsCollected
            )
        );

        showMessage(
            `LEVEL COMPLETE! +${completionReward.toLocaleString()} COINS`
        );
    } else {
        localStorage.setItem(
            "totalCoins",
            String(
                (Number(localStorage.getItem("totalCoins")) || 0)
                + coinsCollected
            )
        );
    }

    const nextUnlocked = Math.min(MAX_LEVEL, selectedLevel + 1);

    const oldUnlocked =
        Number(localStorage.getItem("unlockedLevel")) || 1;

    localStorage.setItem(
        "unlockedLevel",
        String(Math.max(oldUnlocked, nextUnlocked))
    );

    localStorage.setItem(
        "highestLevelReached",
        String(
            Math.max(
                Number(localStorage.getItem("highestLevelReached")) || 1,
                selectedLevel
            )
        )
    );

    if (selectedLevel === MAX_LEVEL) {
        startWorldEnding();
        return;
    }

    saveGameProgressToCloud();

    setTimeout(() => {
        window.location.href = "levels.html";
    }, 1800);
}

// ==========================================
// WORLD 1 ENDING
// ==========================================

let endingStarted = false;
let endingTimer = 0;
let endingAlpha = 0;

function startWorldEnding() {
    if (endingStarted) return;

    endingStarted = true;
    gameWon = true;
    gameRunning = false;
    endingTimer = 0;
    endingAlpha = 0;

    // Final boss defeat particles
    if (boss) {
        createParticles(
            boss.x + boss.width / 2,
            boss.y + boss.height / 2,
            "#c77dff",
            70
        );
    }

    // Final reward
    const finalReward = 25000;

    const alreadyClaimed =
        localStorage.getItem("world1RewardClaimed") === "true";

    if (!alreadyClaimed) {
        const currentCoins =
            Number(localStorage.getItem("totalCoins")) || 0;

        localStorage.setItem(
            "totalCoins",
            String(currentCoins + finalReward)
        );

        localStorage.setItem("world1RewardClaimed", "true");
    }

    saveGameProgressToCloud();
}

// ==========================================
// ENDING ANIMATION
// ==========================================

function updateEnding() {
    if (!endingStarted) return;

    endingTimer++;

    if (endingAlpha < 1) {
        endingAlpha = Math.min(1, endingAlpha + 0.015);
    }

    updateParticles();

    if (endingTimer % 8 === 0) {
        createParticles(
            Math.random() * WIDTH + cameraX,
            Math.random() * (HEIGHT - 100),
            ["#ffe66d", "#ffffff", "#8df5a6", "#c77dff"][
                Math.floor(Math.random() * 4)
            ],
            4
        );
    }
}

function drawEnding() {
    if (!endingStarted) return;

    ctx.save();

    // Bright restored kingdom
    ctx.fillStyle = `rgba(255,255,255,${endingAlpha * 0.35})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    drawParticles();

    // Cinematic overlay
    ctx.fillStyle = `rgba(5,10,20,${endingAlpha * 0.82})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.globalAlpha = endingAlpha;

    ctx.textAlign = "center";

    ctx.fillStyle = "#ffe66d";
    ctx.font = "bold 38px Arial";
    ctx.fillText(
        "YOU SAVED THE WORLD!",
        WIDTH / 2,
        HEIGHT / 2 - 65
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.fillText(
        "The darkness has finally disappeared.",
        WIDTH / 2,
        HEIGHT / 2 - 15
    );

    ctx.fillText(
        "The kingdom is safe again, thanks to you.",
        WIDTH / 2,
        HEIGHT / 2 + 18
    );

    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 20px Arial";
    ctx.fillText(
        "WORLD 1 COMPLETED",
        WIDTH / 2,
        HEIGHT / 2 + 75
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = "15px Arial";
    ctx.fillText(
        "WORLD 2 — COMING SOON",
        WIDTH / 2,
        HEIGHT / 2 + 115
    );

    ctx.restore();

    if (endingTimer > 240) {
        ctx.save();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";

        ctx.fillText(
            "Press ENTER to return to the menu",
            WIDTH / 2,
            HEIGHT - 35
        );

        ctx.restore();
    }
}

// ==========================================
// CAMERA
// ==========================================

function updateCamera() {
    const target = player.x - WIDTH * 0.35;

    cameraX += (target - cameraX) * 0.08;

    cameraX = Math.max(
        0,
        Math.min(cameraX, WORLD_WIDTH - WIDTH)
    );
}

// ==========================================
// GAME UPDATE
// ==========================================

function updateGame(time) {
    if (!gameRunning || gameOver || gameWon) return;

    updatePlayer();
    updateCoins();
    updateEnemies();
    updateBoss();
    updateBossProjectiles();
    updateParticles();
    updateCamera();

    if (player.y > HEIGHT + 100) {
        damagePlayer();
    }

   if (player.x >= WORLD_WIDTH - 100 && !boss) {
        completeLevel();
    }

    if (boss && !boss.alive && selectedLevel % 6 === 0) {
        completeLevel();
    }

    updateCoinDisplay();
    updateLivesDisplay();
}

// ==========================================
// GAME DRAW
// ==========================================

function drawGame(time) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    drawBackground(time);
    drawPlatforms();
    drawSpikes();
    drawCheckpoints();
    drawCoins(time);
    drawEnemies();
    drawBoss();
    drawBossProjectiles();
    drawBossWarning();
    drawPlayer();
    drawParticles();
    drawMessage();

    if (endingStarted) {
        drawEnding();
    }
}

// ==========================================
// GAME LOOP
// ==========================================

function gameLoop(time) {
    if (endingStarted) {
        updateEnding();
        drawGame(time);
        requestAnimationFrame(gameLoop);
        return;
    }

    updateGame(time);
    drawGame(time);

    requestAnimationFrame(gameLoop);
}

// ==========================================
// BUTTON CONTROLS
// ==========================================

function restartGame() {
    window.location.reload();
}

function goToLevels() {
    window.location.href = "levels.html";
}

function goToMenu() {
    window.location.href = "index.html";
}

function nextLevel() {
    if (selectedLevel >= MAX_LEVEL) {
        goToLevels();
        return;
    }

    localStorage.setItem(
        "selectedLevel",
        String(selectedLevel + 1)
    );

    window.location.reload();
}

// ==========================================
// ENDING KEYBOARD CONTROL
// ==========================================

document.addEventListener("keydown", function(event) {
    if (endingStarted && endingTimer > 240 && event.code === "Enter") {
        goToMenu();
    }
});

// ==========================================
// START GAME
// ==========================================

updateCoinDisplay();
updateLivesDisplay();

if (isBossLevel()) {
    showMessage("BOSS ARENA: " + getBossName());
}

requestAnimationFrame(gameLoop);



