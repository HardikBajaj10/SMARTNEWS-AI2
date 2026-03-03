function login() {
    const emailInput = document.getElementById("email").value.trim().toLowerCase();
    const passwordInput = document.getElementById("password").value.trim();

    if (!emailInput || !passwordInput) {
        alert("Enter Identity and Security Key");
        return;
    }

    // Get registered users
    const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];

    // Check if user exists and password matches
    const user = users.find(u => u.email === emailInput && u.password === passwordInput);

    if (user) {
        // Authenticated
        localStorage.setItem("loggedUser", user.email);
        localStorage.setItem("userName", user.name);
        localStorage.setItem("role", user.role);

        // Redirect based on role
        if (user.role === "admin") {
            window.location.href = "admin.html";
        } else {
            // Check for preferences if first time user
            if (!localStorage.getItem("userPreferences")) {
                window.location.href = "onboarding.html";
            } else {
                window.location.href = "dashboard.html";
            }
        }
    } else {
        // Fallback for hardcoded admin if not registered (for backwards compatibility during testing)
        if (emailInput === "admin@gmail.com" && passwordInput === "admin") {
            localStorage.setItem("loggedUser", "admin@gmail.com");
            localStorage.setItem("userName", "Super Admin");
            localStorage.setItem("role", "admin");
            window.location.href = "admin.html";
            return;
        }
        alert("Invalid credentials. Please register or check your identity.");
    }
}