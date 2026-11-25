
// =====================================
// JUMP QUEST - ABILITY SHOP
// =====================================

const SUPABASE_URL = "https://nzqhyjdermwevzqjijyw.supabase.co";

const SUPABASE_KEY = "sb_publishable_FblA_B4gqvSPhO50TQNJhw_1Bgow9yc";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// =====================================
// ABILITIES
// =====================================

const abilities = [
    {
        id: "double_jump",
        name: "DOUBLE JUMP",
        icon: "🪽",
        description: "Jump one extra time while in the air.",
        price: 500,
        rarity: "RARE"
    },
    {
        id: "speed_boost",
        name: "SPEED BOOST",
        icon: "⚡",
        description: "Temporarily increase your movement speed.",
        price: 1000,
        rarity: "EPIC"
    },
    {
        id: "shield",
        name: "SHIELD",
        icon: "🛡️",
        description: "Protect yourself from one hit.",
        price: 1500,
        rarity: "EPIC"
    },
    {
        id: "coin_magnet",
        name: "COIN MAGNET",
        icon: "🧲",
        description: "Attract nearby coins towards you.",
        price: 2000,
        rarity: "LEGENDARY"
    },
    {
        id: "high_jump",
        name: "HIGH JUMP",
        icon: "🚀",
        description: "Increase your jumping power.",
        price: 2500,
        rarity: "LEGENDARY"
    },
    {
        id: "extra_life",
        name: "EXTRA LIFE",
        icon: "💚",
        description: "Get an additional chance during a level.",
        price: 4000,
        rarity: "MYTHICAL"
    },
    {
        id: "time_freeze",
        name: "TIME FREEZE",
        icon: "⏳",
        description: "Temporarily slow down the game.",
        price: 6000,
        rarity: "DIVINE"
    },
    {
        id: "phoenix",
        name: "PHOENIX",
        icon: "🔥",
        description: "A mysterious power waiting to be unlocked.",
        price: 10000,
        rarity: "SECRET"
    }
];

// =====================================
// PLAYER DATA
// =====================================

let coins = Number(localStorage.getItem("totalCoins")) || 0;

let ownedAbilities = JSON.parse(
    localStorage.getItem("ownedAbilities") || "[]"
);

let equippedAbilities = JSON.parse(
    localStorage.getItem("equippedAbilities") || "[]"
);

let currentUser = null;

// =====================================
// SAVE LOCAL DATA
// =====================================

function saveLocalData() {
    localStorage.setItem("totalCoins", coins);

    localStorage.setItem(
        "ownedAbilities",
        JSON.stringify(ownedAbilities)
    );

    localStorage.setItem(
        "equippedAbilities",
        JSON.stringify(equippedAbilities)
    );

    updateBalance();
}

// =====================================
// UPDATE BALANCE DISPLAY
// =====================================

function updateBalance() {
    const balance = document.getElementById("coinBalance");

    if (balance) {
        balance.textContent = coins.toLocaleString();
    }

    const menuCoins = document.getElementById("menuCoins");

    if (menuCoins) {
        menuCoins.textContent = coins.toLocaleString();
    }
}

// =====================================
// LOAD ACCOUNT DATA
// =====================================

async function loadAccountData() {
    const { data: { session }, error } =
        await db.auth.getSession();

    if (error) {
        console.error("Session error:", error);
        return;
    }

    if (!session) {
        currentUser = null;
        renderAbilities();
        return;
    }

    currentUser = session.user;

    const { data, error: profileError } = await db
        .from("profiles")
        .select("coins, owned_abilities, equipped_abilities")
        .eq("id", currentUser.id)
        .single();

    if (profileError) {
        console.error("Profile loading error:", profileError);
        renderAbilities();
        return;
    }

    if (data) {
        coins = Number(data.coins) || 0;

        ownedAbilities = data.owned_abilities || [];

        equippedAbilities = data.equipped_abilities || [];

        saveLocalData();
    }

    renderAbilities();
}

// =====================================
// SAVE TO SUPABASE
// =====================================

async function saveCloudData() {
    if (!currentUser) return;

    const { error } = await db
        .from("profiles")
        .update({
            coins: coins,
            owned_abilities: ownedAbilities,
            equipped_abilities: equippedAbilities
        })
        .eq("id", currentUser.id);

    if (error) {
        console.error("Cloud save error:", error);
        alert("Cloud save failed: " + error.message);
    }
}

// =====================================
// RENDER ABILITY CARDS
// =====================================

function renderAbilities() {
    const grid = document.getElementById("abilityGrid");

    if (!grid) return;

    grid.innerHTML = "";

    abilities.forEach(ability => {
        const isOwned = ownedAbilities.includes(ability.id);

        const isEquipped = equippedAbilities.includes(ability.id);

        const card = document.createElement("div");

        card.className =
            "ability-card rarity-" + ability.rarity.toLowerCase();

        let buttonText = "BUY - " + ability.price.toLocaleString();

        let buttonClass = "";

        let disabled = false;

        if (isEquipped) {
            buttonText = "UNEQUIP";
            buttonClass = "equipped";
        } else if (isOwned) {
            buttonText = "EQUIP";
            buttonClass = "owned";

            if (equippedAbilities.length >= 2) {
                disabled = true;
            }
        } else if (coins < ability.price) {
            buttonText = "NOT ENOUGH COINS";
            disabled = true;
        }

        card.innerHTML = `
            <div class="ability-rarity">
                ${ability.rarity}
            </div>

            <div class="ability-icon">
                ${ability.icon}
            </div>

            <h3 class="ability-name">
                ${ability.name}
            </h3>

            <p class="ability-description">
                ${ability.description}
            </p>

            <div class="ability-price">
                ${isOwned ? "OWNED" : "🪙 " + ability.price.toLocaleString()}
            </div>

            <button
                class="ability-action ${buttonClass}"
                ${disabled ? "disabled" : ""}
                onclick="handleAbility('${ability.id}')"
            >
                ${buttonText}
            </button>
        `;

        grid.appendChild(card);
    });

    updateBalance();
    updateEquippedCounter();
}

// =====================================
// BUY / EQUIP / UNEQUIP
// =====================================

async function handleAbility(id) {
    const ability = abilities.find(item => item.id === id);

    if (!ability) return;

    const isOwned = ownedAbilities.includes(id);

    const isEquipped = equippedAbilities.includes(id);

    // UNEQUIP

    if (isEquipped) {
        equippedAbilities = equippedAbilities.filter(
            item => item !== id
        );

        saveLocalData();

        await saveCloudData();

        renderAbilities();

        return;
    }

    // EQUIP

    if (isOwned) {
        if (equippedAbilities.length >= 2) {
            alert("You can only equip 2 abilities!");

            return;
        }

        equippedAbilities.push(id);

        saveLocalData();

        await saveCloudData();

        renderAbilities();

        return;
    }

    // BUY

    if (coins < ability.price) {
        alert("You don't have enough coins!");

        return;
    }

    const confirmed = confirm(
        `Buy ${ability.name} for ${ability.price.toLocaleString()} coins?`
    );

    if (!confirmed) return;

    coins -= ability.price;

    ownedAbilities.push(id);

    saveLocalData();

    await saveCloudData();

    renderAbilities();
}

// =====================================
// EQUIPPED COUNTER
// =====================================

function updateEquippedCounter() {
    const counter = document.getElementById("equippedCount");

    if (counter) {
        counter.textContent = equippedAbilities.length;
    }
}

// =====================================
// INITIALIZE
// =====================================

async function initializeAbilityShop() {
    updateBalance();

    await loadAccountData();

    renderAbilities();
}

initializeAbilityShop();
