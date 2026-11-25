
// JUMP QUEST - Supabase connection

const SUPABASE_URL = "https://nzqhyjdermwevzqjijyw.supabase.co";

const SUPABASE_KEY =  "sb_publishable_FblA_B4gqvSPhO50TQNJhw_1Bgow9yc";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let pendingEmail = "";
let pendingUsername = "";
let resendCountdown = 60;
let resendInterval = null;

function showMessage(message) {
    document.getElementById("message").textContent = message;
}

function showSection(sectionId) {
    ["loginSection", "registerSection", "otpSection"].forEach(id => {
        document.getElementById(id).classList.add("hidden");
    });

    document.getElementById(sectionId).classList.remove("hidden");
    showMessage("");
}

function showLogin() {
    showSection("loginSection");
}

function showRegister() {
    showSection("registerSection");
}
function startResendCountdown() {
    const button = document.getElementById("resendOtpButton");
    const timer = document.getElementById("resendTimer");

    clearInterval(resendInterval);

    resendCountdown = 60;
    button.disabled = true;

    resendInterval = setInterval(() => {
        resendCountdown--;

        timer.textContent = `RESEND AVAILABLE IN ${resendCountdown} SECONDS`;

        if (resendCountdown <= 0) {
            clearInterval(resendInterval);
            button.disabled = false;
            timer.textContent = "YOU CAN RESEND YOUR CODE NOW!";
        }
    }, 1000);
}

function continueAsGuest() {
    localStorage.setItem("playerMode", "guest");
    localStorage.setItem("playerName", "Guest");
    window.location.href = "index.html";
}


// REGISTRATION
document.getElementById("registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const registerButton = document.querySelector(".register-button");

    const username = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    if (username.length < 3) {
        showMessage("PLAYER NAME MUST BE AT LEAST 3 CHARACTERS.");
        return;
    }

    registerButton.disabled = true;
    registerButton.textContent = "CREATING ACCOUNT...";

    showMessage("CONTACTING SUPABASE...");

    try {
        const signupPromise = db.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username
                }
            }
        });

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("REQUEST TIMED OUT. CHECK YOUR CONNECTION AND TRY AGAIN.")), 20000);
        });

        const { data, error } = await Promise.race([
            signupPromise,
            timeoutPromise
        ]);

        if (error) {
            showMessage(error.message);
            return;
        }

        pendingEmail = email;
        pendingUsername = username;

        showSection("otpSection");
        startResendCountdown();

        showMessage("CHECK YOUR EMAIL FOR YOUR VERIFICATION CODE!");

    } catch (err) {
        console.error("SIGNUP ERROR:", err);
        showMessage(err.message || "SOMETHING WENT WRONG.");

    } finally {
        registerButton.disabled = false;
        registerButton.textContent = "CREATE ACCOUNT";
    }
});


// VERIFY OTP
document.getElementById("otpForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = document.getElementById("otpCode").value.trim();

    showMessage("VERIFYING YOUR ACCOUNT...");

    const { error } = await db.auth.verifyOtp({
        email: pendingEmail,
        token: token,
        type: "signup"
    });

    if (error) {
        showMessage(error.message);
        return;
    }

    localStorage.setItem("playerMode", "registered");
    localStorage.setItem("playerName", pendingUsername);

    window.location.href = "index.html";
});

// LOGIN
document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    showMessage("LOGGING IN...");

    const { data, error } = await db.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        showMessage(error.message);
        return;
    }

    const username = data.user.user_metadata.username || "Player";

    localStorage.setItem("playerMode", "registered");
    localStorage.setItem("playerName", username);

    window.location.href = "index.html";
});
// RESEND OTP
document.getElementById("resendOtpButton").addEventListener("click", async () => {
    const button = document.getElementById("resendOtpButton");

    button.disabled = true;
    showMessage("SENDING NEW CODE...");

    const { error } = await db.auth.resend({
        type: "signup",
        email: pendingEmail
    });

    if (error) {
        showMessage(error.message);
        button.disabled = false;
        return;
    }

    showMessage("NEW VERIFICATION CODE SENT!");
    startResendCountdown();
});
