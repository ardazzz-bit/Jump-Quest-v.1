// ==========================================
// JUMP QUEST - WORLD 1 LEVEL SELECTION
// ==========================================

const levels = [
    { id: 1, name: "THE BEGINNING", region: "Grasslands" },
    { id: 2, name: "GREEN HILLS", region: "Grasslands" },
    { id: 3, name: "MUSHROOM PATH", region: "Grasslands" },
    { id: 4, name: "PIPE TROUBLE", region: "Grasslands" },
    { id: 5, name: "THE DEEP VALLEY", region: "Grasslands" },
    { id: 6, name: "GRASSLAND CASTLE", region: "Grasslands", boss: true },

    { id: 7, name: "MUSHROOM FOREST", region: "Whispering Forest" },
    { id: 8, name: "WILD WOODS", region: "Whispering Forest" },
    { id: 9, name: "THE LOST GROVE", region: "Whispering Forest" },
    { id: 10, name: "DANGEROUS ROOTS", region: "Whispering Forest" },
    { id: 11, name: "FOREST NIGHT", region: "Whispering Forest" },
    { id: 12, name: "FOREST FORTRESS", region: "Whispering Forest", boss: true },

    { id: 13, name: "DARK CAVE", region: "Crystal Caverns" },
    { id: 14, name: "CRYSTAL MINES", region: "Crystal Caverns" },
    { id: 15, name: "UNDERGROUND RIVER", region: "Crystal Caverns" },
    { id: 16, name: "ROCKY ROAD", region: "Crystal Caverns" },
    { id: 17, name: "THE DEEP DEPTHS", region: "Crystal Caverns" },
    { id: 18, name: "CAVE FORTRESS", region: "Crystal Caverns", boss: true },

    { id: 19, name: "HOT DESERT", region: "Desert & Ice" },
    { id: 20, name: "SANDSTORM", region: "Desert & Ice" },
    { id: 21, name: "ANCIENT RUINS", region: "Desert & Ice" },
    { id: 22, name: "FROZEN LAND", region: "Desert & Ice" },
    { id: 23, name: "ICE MOUNTAINS", region: "Desert & Ice" },
    { id: 24, name: "FROZEN FORTRESS", region: "Desert & Ice", boss: true },

    { id: 25, name: "SKY KINGDOM", region: "Sky & Castle" },
    { id: 26, name: "CLOUD JUMPER", region: "Sky & Castle" },
    { id: 27, name: "STORMY SKIES", region: "Sky & Castle" },
    { id: 28, name: "LAVA BRIDGE", region: "Sky & Castle" },
    { id: 29, name: "THE DARK CASTLE", region: "Sky & Castle" },
    { id: 30, name: "THE FINAL BATTLE", region: "Sky & Castle", boss: true }
];

const MAX_LEVEL = levels.length;
const container = document.getElementById("levelsContainer");

const regions = [
    { name: "01 — THE GREEN FRONTIER", subtitle: "LEARN THE BASICS AND BEGIN YOUR QUEST", region: "Grasslands", theme: "grass" },
    { name: "02 — THE WHISPERING FOREST", subtitle: "THE WOODS ARE ALIVE WITH DANGER", region: "Whispering Forest", theme: "forest" },
    { name: "03 — THE CRYSTAL CAVERNS", subtitle: "DESCEND INTO THE UNKNOWN", region: "Crystal Caverns", theme: "cave" },
    { name: "04 — DESERT & FROST", subtitle: "SURVIVE TWO EXTREME ENVIRONMENTS", region: "Desert & Ice", theme: "desert" },
    { name: "05 — THE SKY CITADEL", subtitle: "THE FINAL ROAD TO THE VOID KING", region: "Sky & Castle", theme: "sky" }
];

function getUnlockedLevel() {
    const saved = Number(localStorage.getItem("unlockedLevel")) || 1;
    return Math.min(MAX_LEVEL, Math.max(1, saved));
}

function getCompletedLevels() {
    try {
        const saved = JSON.parse(localStorage.getItem("completedLevels") || "[]");
        return Array.isArray(saved) ? saved.map(Number) : [];
    } catch {
        return [];
    }
}

function createLevelCard(level, unlockedLevel, completedLevels) {
    const unlocked = level.id <= unlockedLevel;
    const completed = completedLevels.includes(level.id);
    const current = unlocked && !completed && level.id === unlockedLevel;

    const card = document.createElement("button");
    card.type = "button";
    card.className = "level-card";
    card.dataset.level = level.id;

    if (!unlocked) card.classList.add("locked");
    else if (completed) card.classList.add("completed");
    else if (current) card.classList.add("current");

    const status = !unlocked
        ? "🔒 LOCKED"
        : completed
            ? "★ COMPLETED"
            : level.boss
                ? "⚔ BOSS FIGHT"
                : "▶ PLAY NOW";

    card.innerHTML = `
        <span class="level-number">${String(level.id).padStart(2, "0")}</span>
        <span class="level-name">${level.name}</span>
        ${level.boss ? '<span class="boss-tag">BOSS LEVEL</span>' : ""}
        <span class="level-status">${status}</span>
    `;

    if (unlocked) {
        card.addEventListener("click", () => {
            localStorage.setItem("selectedLevel", String(level.id));
            window.location.href = "game.html";
        });
    }

    return card;
}

function createWorldTwoCard() {
    const section = document.createElement("section");
    section.className = "coming-soon-section";
    section.innerHTML = `
        <div class="coming-soon-icon">✦</div>
        <div class="coming-soon-copy">
            <span class="coming-soon-kicker">THE NEXT ADVENTURE</span>
            <h2>WORLD 2</h2>
            <p>A NEW WORLD IS WAITING BEYOND THE HORIZON.</p>
            <strong>COMING SOON</strong>
        </div>
        <div class="coming-soon-lock">🔒</div>
    `;
    return section;
}

function createLevels() {
    if (!container) {
        console.error("Could not find #levelsContainer");
        return;
    }

    const unlockedLevel = getUnlockedLevel();
    const completedLevels = getCompletedLevels();

    container.innerHTML = "";

    regions.forEach(region => {
        const section = document.createElement("section");
        section.className = `world-section region-${region.theme}`;

        const heading = document.createElement("div");
        heading.className = "world-heading";
        heading.innerHTML = `
            <div>
                <h2>${region.name}</h2>
                <span>${region.subtitle}</span>
            </div>
            <span class="region-range">LEVELS ${levels.findIndex(l => l.region === region.region) + 1}–${levels.filter(l => l.region === region.region).at(-1).id}</span>
        `;

        const grid = document.createElement("div");
        grid.className = "level-grid";

        levels.filter(level => level.region === region.region).forEach(level => {
            grid.appendChild(createLevelCard(level, unlockedLevel, completedLevels));
        });

        section.appendChild(heading);
        section.appendChild(grid);
        container.appendChild(section);
    });

    container.appendChild(createWorldTwoCard());
    updateProgress(completedLevels);
}

function updateProgress(completedLevels) {
    const progressText = document.getElementById("progressText");
    if (progressText) {
        const count = completedLevels.filter(id => id >= 1 && id <= MAX_LEVEL).length;
        progressText.textContent = `${count} / ${MAX_LEVEL}`;
    }
}

function goHome() {
    window.location.href = "index.html";
}

createLevels();