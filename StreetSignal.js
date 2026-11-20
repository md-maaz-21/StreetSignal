 
const authForm = document.getElementById("auth-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const togglePassword = document.getElementById("toggle-password");
const switchMode = document.getElementById("switch-mode");
const submitButton = document.getElementById("submit-btn");

const heading = document.getElementById("form-heading");
const subtitle = document.getElementById("form-subtitle");
const switchText = document.getElementById("switch-text");
const message = document.getElementById("message");

let isRegistering = false;

// PASSWORD VISIBILITY

togglePassword.addEventListener("click", function () {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePassword.textContent = "🙈";
    } else {
        passwordInput.type = "password";
        togglePassword.textContent = "👁";
    }
});

// LOGIN / REGISTER SWITCH

switchMode.addEventListener("click", function () {
    isRegistering = !isRegistering;

    if (isRegistering) {
        heading.textContent = "Create Account";
        subtitle.textContent = "Join your community today.";
        submitButton.innerHTML = "Create Account →";
        switchText.textContent = "Already have an account?";
        switchMode.textContent = "Login";
    } else {
        heading.textContent = "Welcome Back!";
        subtitle.textContent = "Sign in to continue to StreetSignal";
        submitButton.innerHTML = "Login →";
        switchText.textContent = "Don't have an account?";
        switchMode.textContent = "Create Account";
    }

    message.textContent = "";
});

// LOGIN AND REDIRECT TO DASHBOARD

authForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (email === "" || password === "") {
        message.textContent = "Please fill in all fields.";
        return;
    }

    localStorage.setItem("streetSignalEmail", email);

    window.location.href = "Dashboard.html";
});

// GOOGLE LOGIN

document.getElementById("google-login").addEventListener("click", function () {
    alert("Google authentication will be integrated using Firebase.");
});

// FORGOT PASSWORD

document.getElementById("forgot-password").addEventListener("click", function (event) {
    event.preventDefault();
    alert("Password reset will be available after Firebase integration.");
});

// DEMO VISITOR COUNTER

let visitors = Number(localStorage.getItem("streetSignalVisitors") || 0);

if (!sessionStorage.getItem("streetSignalVisited")) {
    visitors++;
    localStorage.setItem("streetSignalVisitors", visitors);
    sessionStorage.setItem("streetSignalVisited", "true");
}

document.getElementById("visitor-count").textContent =
    visitors.toLocaleString("en-IN");
