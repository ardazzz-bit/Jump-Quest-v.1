// JUMP QUEST - CLOUD SAVE

const cloudSave = {
    async getProfile(db, userId) {
        const { data, error } = await db
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (error) {
            console.error("Cloud load error:", error);
            return null;
        }

        return data;
    },

    async saveProfile(db, userId, updates) {
        const { error } = await db
            .from("profiles")
            .update(updates)
            .eq("id", userId);

        if (error) {
            console.error("Cloud save error:", error);
            return false;
        }

        return true;
    }
};
// GAME DATABASE CONNECTION

const GAME_SUPABASE_URL = "https://nzqhyjdermwevzqjijyw.supabase.co";
const GAME_SUPABASE_KEY = "sb_publishable_FblA_B4gqvSPhO50TQNJhw_1Bgow9yc";
const gameDb = window.jqSupabaseClient ||
    window.supabase.createClient(
        GAME_SUPABASE_URL,
        GAME_SUPABASE_KEY
    );

window.jqSupabaseClient = gameDb;

async function saveGameProgressToCloud() {
    const { data } = await gameDb.auth.getSession();

    if (!data.session) return;

    const updates = {
        coins: Number(localStorage.getItem("totalCoins")) || 0,

        unlocked_levels:
            Number(localStorage.getItem("unlockedLevel")) || 1,

        completed_levels: JSON.parse(
            localStorage.getItem("completedLevels") || "[]"
        ),

        highest_level_reached:
            Number(localStorage.getItem("highestLevelReached")) || 1
    };

    const { error } = await gameDb
        .from("profiles")
        .update(updates)
        .eq("id", data.session.user.id);

    if (error) {
        console.error("GAME CLOUD SAVE ERROR:", error);
    }
}