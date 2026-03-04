async function login() {
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value.trim();

    if (!email || !password) {
        alert("Please enter both email and password.");
        return;
    }

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) {
            alert(data.message || 'Login failed');
            return;
        }

        // Only store the secure token. All other user state is fetched from the backend on page load.
        localStorage.setItem('token', data.token);

        // Redirect based on backend response data without caching it locally
        if (data.role === 'admin') {
            window.location.href = "admin.html";
        } else {
            // Check preferences length directly from the login payload
            if (data.preferences && data.preferences.length > 0) {
                window.location.href = "dashboard.html";
            } else {
                window.location.href = "onboarding.html";
            }
        }
    } catch (err) {
        console.error(err);
        alert("An error occurred during login.");
    }
}