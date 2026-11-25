
// =====================================
// JUMP QUEST - MAIN MENU
// =====================================

// SUPABASE CONNECTION

const SUPABASE_URL = "https://nzqhyjdermwevzqjijyw.supabase.co";
const SUPABASE_KEY = "sb_publishable_FblA_B4gqvSPhO50TQNJhw_1Bgow9yc";

const db = window.jqSupabaseClient ||
    window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.jqSupabaseClient = db;

let currentUser = null;
let playerProfile = null;

// =====================================
// CHARACTER COLLECTION
// =====================================

const characters = [
    { id: "classic", name: "CLASSIC HERO", emoji: "🧑🏻‍🚀", price: 0, rarity: "COMMON", description: "The original JUMP QUEST adventurer." },
    { id: "shadow", name: "SHADOW NINJA", emoji: "🥷", price: 1000, rarity: "COMMON", description: "A mysterious warrior of the shadows." },
    { id: "street_x", name: "STREET X", emoji: "🕶️", price: 2500, rarity: "COMMON", description: "The coolest runner in town." },
    { id: "golden", name: "GOLDEN KNIGHT", emoji: "🛡️", price: 4000, rarity: "RARE", description: "A knight covered in golden armor." },
    { id: "desert", name: "DESERT NOMAD", emoji: "🏜️", price: 6000, rarity: "RARE", description: "A mysterious traveler from the dunes." },
    { id: "ice", name: "ICE WARRIOR", emoji: "❄️", price: 8000, rarity: "RARE", description: "A warrior from the frozen lands." },
    { id: "crystal", name: "CRYSTAL", emoji: "💎", price: 10000, rarity: "RARE", description: "A warrior forged from crystal." },
    { id: "cyber_punk", name: "CYBER PUNK", emoji: "🤖", price: 15000, rarity: "EPIC", description: "A futuristic cyber warrior." },
    { id: "silver_royal", name: "SILVER ROYAL", emoji: "⚔️", price: 20000, rarity: "EPIC", description: "A champion of the silver kingdom." },
    { id: "magma", name: "MAGMA", emoji: "🌋", price: 25000, rarity: "LEGENDARY", description: "Born in the heart of a volcano." },
    { id: "dragon_knight", name: "DRAGON KNIGHT", emoji: "🐉", price: 35000, rarity: "LEGENDARY", description: "An ancient dragon warrior." },
    { id: "emperor", name: "EMPEROR", emoji: "👑", price: 45000, rarity: "MYTHICAL", description: "The ruler of an ancient empire." },
    { id: "pharaoh_x", name: "PHARAOH X", emoji: "𓂀", price: 55000, rarity: "MYTHICAL", description: "The legendary ruler of the desert." },
    { id: "divinity", name: "DIVINITY", emoji: "✨", price: 70000, rarity: "DIVINE", description: "A celestial champion." },
    { id: "void_emperor", name: "VOID EMPEROR", emoji: "🌌", price: 85000, rarity: "DIVINE", description: "The master of the endless void." },
    { id: "glitch_404", name: "GLITCH 404", emoji: "👾", price: 100000, rarity: "SECRET", description: "A mysterious character from another dimension." },
    { id: "chaos_king", name: "CHAOS KING", emoji: "😈", price: 125000, rarity: "SECRET", description: "The ruler of chaos." },
    { id: "royal", name: "ROYAL CHAMPION", emoji: "👑", price: 0, rarity: "EXCLUSIVE", description: "An exclusive outfit for registered players.", exclusive: true },
    { id: "mega_one", name: "MEGA ONE", emoji: "🌠", price: 150000, rarity: "MEGA ULTRA", description: "The ultimate character. Beyond every rarity.", mega: true }
];

// =====================================
// STORAGE KEYS
// =====================================

const COINS_KEY = "totalCoins";
const SELECTED_KEY = "selectedCharacter";
const OWNED_KEY = "ownedCharacters";

const OWNED_ABILITIES_KEY = "ownedAbilities";
const EQUIPPED_ABILITIES_KEY = "equippedAbilities";

// =====================================
// LOCAL PLAYER DATA
// =====================================

function resetLocalPlayerData() {
    const keysToReset = [
        "totalCoins",
        "selectedCharacter",
        "ownedCharacters",
        "ownedAbilities",
        "equippedAbilities",
        "unlockedLevel",
        "completedLevels",
        "highestLevelReached",
        "world1RewardClaimed",
        "claimedGameRewards"
    ];

    keysToReset.forEach(key => localStorage.removeItem(key));

    // Fresh guest defaults
    localStorage.setItem(COINS_KEY, "0");
    localStorage.setItem(SELECTED_KEY, "classic");
    localStorage.setItem(OWNED_KEY, JSON.stringify(["classic"]));
    localStorage.setItem(OWNED_ABILITIES_KEY, "[]");
    localStorage.setItem(EQUIPPED_ABILITIES_KEY, "[]");

    localStorage.setItem("unlockedLevel", "1");
    localStorage.setItem("completedLevels", "[]");
    localStorage.setItem("highestLevelReached", "1");

    localStorage.setItem("world1RewardClaimed", "false");
    localStorage.setItem("claimedGameRewards", "[]");
}

// =====================================
// LOCAL SAVE DATA
// =====================================

function getCoins() {
    return Number(localStorage.getItem(COINS_KEY)) || 0;
}

function getOwnedCharacters() {
    try {
        const saved = JSON.parse(localStorage.getItem(OWNED_KEY));
        if (Array.isArray(saved)) return saved;
    } catch (error) {
        console.warn("Could not load owned characters.");
    }

    return ["classic"];
}

function getSelectedCharacter() {
    return localStorage.getItem(SELECTED_KEY) || "classic";
}

function saveOwnedCharacters(owned) {
    localStorage.setItem(OWNED_KEY, JSON.stringify(owned));
}

function getOwnedAbilities() {
    try {
        const saved = JSON.parse(localStorage.getItem(OWNED_ABILITIES_KEY));
        if (Array.isArray(saved)) return saved;
    } catch (error) {
        console.warn("Could not load owned abilities.");
    }

    return [];
}

function getEquippedAbilities() {
    try {
        const saved = JSON.parse(localStorage.getItem(EQUIPPED_ABILITIES_KEY));
        if (Array.isArray(saved)) return saved.slice(0, 2);
    } catch (error) {
        console.warn("Could not load equipped abilities.");
    }

    return [];
}

// =====================================
// CLOUD SAVE
// =====================================

async function saveProgressToCloud() {
    if (!currentUser) return;

    let completedLevels = [];

    try {
        completedLevels = JSON.parse(
            localStorage.getItem("completedLevels") || "[]"
        );

        if (!Array.isArray(completedLevels)) {
            completedLevels = [];
        }
    } catch (error) {
        completedLevels = [];
    }

    const updates = {
        coins: getCoins(),
        owned_characters: getOwnedCharacters(),
        selected_character: getSelectedCharacter(),
        owned_abilities: getOwnedAbilities(),
        equipped_abilities: getEquippedAbilities(),

        unlocked_levels: Number(localStorage.getItem("unlockedLevel")) || 1,
        completed_levels: completedLevels,
        highest_level_reached: Number(localStorage.getItem("highestLevelReached")) || 1
    };

    const success = await cloudSave.saveProfile(db, currentUser.id, updates);

    if (!success) {
        console.error("CLOUD SAVE FAILED");
    }
}

// =====================================
// LOAD PLAYER ACCOUNT
// =====================================

async function loadPlayerAccount() {
    const { data: sessionData, error: sessionError } =
        await db.auth.getSession();

    if (sessionError) {
        console.error(sessionError);
        return;
    }

    const session = sessionData.session;

    // NO ACCOUNT = FRESH GUEST DATA

    if (!session) {
        currentUser = null;
        playerProfile = null;

        resetLocalPlayerData();

        localStorage.setItem("playerMode", "guest");
        localStorage.setItem("playerName", "Guest");

        updateAccountUI();
        updateCoinDisplay();
        renderShop();

        return;
    }

    // REGISTERED ACCOUNT

    currentUser = session.user;

    const profile = await cloudSave.getProfile(db, currentUser.id);

    if (!profile) {
        console.error("Could not load player profile.");
        return;
    }

    playerProfile = profile;

    localStorage.setItem("playerMode", "registered");
    localStorage.setItem("playerName", profile.username || "Player");

    localStorage.setItem(COINS_KEY, String(profile.coins ?? 0));

    localStorage.setItem(
        OWNED_KEY,
        JSON.stringify(profile.owned_characters || ["classic"])
    );

    localStorage.setItem(
        SELECTED_KEY,
        profile.selected_character || "classic"
    );

    localStorage.setItem(
        OWNED_ABILITIES_KEY,
        JSON.stringify(profile.owned_abilities || [])
    );

    localStorage.setItem(
        EQUIPPED_ABILITIES_KEY,
        JSON.stringify((profile.equipped_abilities || []).slice(0, 2))
    );

    localStorage.setItem("unlockedLevel", String(profile.unlocked_levels || 1));

    localStorage.setItem(
        "completedLevels",
        JSON.stringify(profile.completed_levels || [])
    );

    localStorage.setItem(
        "highestLevelReached",
        String(profile.highest_level_reached || 1)
    );

    updateAccountUI();
    updateCoinDisplay();
    renderShop();
}

// =====================================
// ACCOUNT UI
// =====================================

function updateAccountUI() {
    const accountButton = document.getElementById("accountButton");
    const accountStatus = document.getElementById("accountStatus");

    const description = document.getElementById("accountDescription");
    const note = document.getElementById("accountNote");

    const signInButton = document.getElementById("signInButton");
    const createAccountButton = document.getElementById("createAccountButton");
    const guestButton = document.getElementById("guestButton");
    const signOutButton = document.getElementById("signOutButton");

    if (!accountButton) return;

    if (currentUser) {
        const username = localStorage.getItem("playerName") || "Player";

        accountButton.textContent = username;
        accountStatus.textContent = username.toUpperCase();

        description.textContent = "Your registered JUMP QUEST account.";
        note.textContent = "Your adventure progress is connected to your account.";

        signInButton.style.display = "none";
        createAccountButton.style.display = "none";
        guestButton.style.display = "none";
        signOutButton.style.display = "block";

    } else {
        accountButton.textContent = "GUEST";
        accountStatus.textContent = "GUEST PLAYER";

        description.textContent = "You're currently playing without an account.";
        note.textContent = "Register to unlock the exclusive Royal Champion outfit!";

        signInButton.style.display = "block";
        createAccountButton.style.display = "block";
        guestButton.style.display = "block";
        signOutButton.style.display = "none";
    }
}

// =====================================
// MENU NAVIGATION
// =====================================

function startGame() {
    window.location.href = "levels.html";
}

function showSettings() {
    alert("Settings coming soon!");
}

function showCredits() {
    alert(
        "JUMP QUEST\n" +
        "Created by Dev ANAS\n\n" +
        "For contact: ardaz_dgaf on Discord"
    );
}

// =====================================
// POPUP SYSTEM
// =====================================

function closePopups() {
    document.querySelectorAll(".popup").forEach(popup => {
        popup.classList.remove("active");
    });
}

function showShop() {
    closePopups();
    renderShop();
    document.getElementById("shopPopup").classList.add("active");
}

function showAccount() {
    closePopups();
    updateAccountUI();
    document.getElementById("accountPopup").classList.add("active");
}

document.querySelectorAll(".popup").forEach(popup => {
    popup.addEventListener("click", event => {
        if (event.target === popup) {
            closePopups();
        }
    });
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closePopups();
    }
});

// =====================================
// COIN DISPLAY
// =====================================

function updateCoinDisplay() {
    const coins = getCoins();

    const menuCoins = document.getElementById("menuCoins");
    if (menuCoins) {
        menuCoins.textContent = coins.toLocaleString();
    }

    const shopCoins = document.getElementById("shopCoins");
    if (shopCoins) {
        shopCoins.textContent = coins.toLocaleString();
    }
}

// =====================================
// CHARACTER SHOP
// =====================================

let activeShopFilter = "ALL";

function renderShop() {
    const grid = document.getElementById("characterGrid");

    if (!grid) return;

    const coins = getCoins();
    const owned = getOwnedCharacters();
    const selected = getSelectedCharacter();

    updateCoinDisplay();

    let toolbar = document.getElementById("shopToolbar");

    if (!toolbar) {
        toolbar = document.createElement("div");
        toolbar.id = "shopToolbar";
        toolbar.className = "shop-toolbar";
        grid.before(toolbar);
    }

    const filters = [
        "ALL", "COMMON", "RARE", "EPIC", "LEGENDARY",
        "MYTHICAL", "DIVINE", "SECRET", "EXCLUSIVE", "MEGA ULTRA"
    ];

    toolbar.innerHTML = filters.map(filter => `
        <button
            class="shop-filter ${activeShopFilter === filter ? "active" : ""}"
            data-filter="${filter}">
            ${filter}
        </button>
    `).join("");

    toolbar.querySelectorAll(".shop-filter").forEach(button => {
        button.addEventListener("click", () => {
            activeShopFilter = button.dataset.filter;
            renderShop();
        });
    });

    const visibleCharacters = activeShopFilter === "ALL"
        ? characters
        : characters.filter(character => character.rarity === activeShopFilter);

    grid.innerHTML = "";

    visibleCharacters.forEach((character, index) => {
        const isOwned = owned.includes(character.id);
        const isSelected = selected === character.id;

        const card = document.createElement("div");

        const rarityClass = character.rarity.toLowerCase().replace(/\s+/g, "-");

        card.className = `character-card rarity-${rarityClass}`;

        if (character.exclusive) card.classList.add("exclusive");
        if (character.mega) card.classList.add("mega-character");
        if (isSelected) card.classList.add("equipped-card");
        if (isOwned) card.classList.add("owned-card");

        let buttonText = "BUY";
        let buttonClass = "buy-character";
        let disabled = false;

        if (isSelected) {
            buttonText = "✓ EQUIPPED";
            buttonClass = "equipped-button";
            disabled = true;
        } else if (isOwned) {
            buttonText = "EQUIP";
            buttonClass = "equip-character";
        } else if (character.exclusive && !currentUser) {
            buttonText = "REGISTER REQUIRED";
            buttonClass = "locked-button";
            disabled = true;
        } else if (coins < character.price) {
            buttonText = "NOT ENOUGH COINS";
            buttonClass = "locked-button";
            disabled = true;
        }

        const priceText = character.exclusive
            ? "REGISTERED PLAYERS ONLY"
            : character.price === 0
                ? "FREE"
                : `🪙 ${character.price.toLocaleString()}`;

        const statusText = isSelected
            ? "CURRENTLY EQUIPPED"
            : isOwned
                ? "UNLOCKED"
                : character.exclusive && !currentUser
                    ? "ACCOUNT EXCLUSIVE"
                    : "LOCKED";

        card.innerHTML = `
            <div class="character-card-top">
                <span class="character-rarity">${character.rarity}</span>
                <span class="character-status">${statusText}</span>
            </div>

            <div class="character-preview">
                <div class="preview-glow"></div>
                <span class="character-emoji">${character.emoji}</span>
                <div class="preview-platform"></div>
                <div class="preview-sparkle sparkle-a">✦</div>
                <div class="preview-sparkle sparkle-b">✧</div>
            </div>

            <div class="character-information">
                <h3>${character.name}</h3>

                <p class="character-description">
                    ${character.description}
                </p>

                <div class="character-price">${priceText}</div>

                ${character.mega ? `
                    <div class="mega-exclusive">
                        ✨ THE ULTIMATE CHARACTER
                    </div>
                ` : ""}

                <button
                    class="character-action ${buttonClass}"
                    ${disabled ? "disabled" : ""}>
                    ${buttonText}
                </button>
            </div>
        `;

        card.querySelector(".character-action").addEventListener("click", () => {
            handleCharacterAction(character);
        });

        card.style.animationDelay = `${Math.min(index * 35, 350)}ms`;

        grid.appendChild(card);
    });

    if (visibleCharacters.length === 0) {
        grid.innerHTML = `<p class="empty-shop">NO CHARACTERS FOUND</p>`;
    }
}

// =====================================
// BUY / EQUIP CHARACTER
// =====================================

async function handleCharacterAction(character) {
    let owned = getOwnedCharacters();

    if (owned.includes(character.id)) {
        await equipCharacter(character.id);
        return;
    }

    if (character.exclusive && !currentUser) {
        alert("This outfit is exclusive to registered players.");
        return;
    }

    const coins = getCoins();

    if (coins < character.price) {
        alert("You don't have enough coins!");
        return;
    }

    const confirmed = confirm(
        `Buy ${character.name} for ${character.price.toLocaleString()} coins?`
    );

    if (!confirmed) return;

    localStorage.setItem(COINS_KEY, String(coins - character.price));

    owned.push(character.id);
    saveOwnedCharacters(owned);

    localStorage.setItem(SELECTED_KEY, character.id);

    await saveProgressToCloud();

    renderShop();

    alert(`${character.name} unlocked and equipped!`);
}

async function equipCharacter(characterId) {
    const owned = getOwnedCharacters();

    if (!owned.includes(characterId)) return;

    localStorage.setItem(SELECTED_KEY, characterId);

    await saveProgressToCloud();

    renderShop();

    alert("Character equipped!");
}

// =====================================
// ACCOUNT BUTTONS
// =====================================

function showLoginInfo() {
    window.location.href = "login.html";
}

function showRegisterInfo() {
    window.location.href = "login.html";
}

async function continueAsGuest() {
    if (currentUser) {
        const { error } = await db.auth.signOut();

        if (error) {
            alert("Could not switch to guest: " + error.message);
            return;
        }
    }

    currentUser = null;
    playerProfile = null;

    resetLocalPlayerData();

    localStorage.setItem("playerMode", "guest");
    localStorage.setItem("playerName", "Guest");

    updateAccountUI();
    updateCoinDisplay();
    renderShop();
    closePopups();
}

async function signOutPlayer() {
    // Save the current account before signing out.
    await saveProgressToCloud();

    const { error } = await db.auth.signOut();

    if (error) {
        alert("Could not sign out: " + error.message);
        return;
    }

    currentUser = null;
    playerProfile = null;

    // Remove the previous account's local progress.
    resetLocalPlayerData();

    localStorage.setItem("playerMode", "guest");
    localStorage.setItem("playerName", "Guest");

    updateAccountUI();
    updateCoinDisplay();
    renderShop();
    closePopups();

    alert("You have signed out. Guest progress has been reset.");
}

// =====================================
// INITIALIZE
// =====================================

async function initializeMenu() {
    await loadPlayerAccount();
}

initializeMenu();
