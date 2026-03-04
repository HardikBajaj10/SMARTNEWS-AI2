// fetchProfile.js - Global utility for protected pages
// Ensures the user is logged in, fetches their profile, and populates common UI elements without relying on localStorage.

async function loadGlobalProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return null;
    }

    try {
        const res = await fetch('/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            // Token invalid or expired
            localStorage.removeItem('token');
            window.location.href = 'index.html';
            return null;
        }

        const profile = await res.json();
        const user = profile.user; // { name, email, role, preferences }

        // Mute UI population if on onboarding
        if (window.location.pathname.includes('onboarding.html') && user.role === 'admin') {
            window.location.href = 'admin.html';
            return null;
        }

        // --- Populate common sidebar UI if present ---
        const nameDisplay = document.getElementById('userName') || document.getElementById('userNameDisplay');
        const emailDisplay = document.getElementById('userEmailDisplay');
        const initialDisplay = document.getElementById('userInitial');

        if (nameDisplay) nameDisplay.innerText = user.name;
        if (emailDisplay) emailDisplay.innerText = user.email;
        if (initialDisplay) initialDisplay.innerText = user.name.charAt(0).toUpperCase();

        // Populate sidebars based on role (if applicable)
        const sidebarNav = document.getElementById('sidebarNav');
        if (sidebarNav) {
            if (user.role === 'admin') {
                sidebarNav.innerHTML = `
                    <a href="admin.html" class="nav-link ${window.location.pathname.includes('admin') ? 'active' : ''}"><span class="mr-2.5">✍️</span>Write</a>
                    <a href="analytics.html" class="nav-link ${window.location.pathname.includes('analytics') ? 'active' : ''}"><span class="mr-2.5">📊</span>Analytics</a>
                    <a href="profile.html" class="nav-link ${window.location.pathname.includes('profile') ? 'active' : ''}"><span class="mr-2.5">👤</span>Profile</a>`;
            } else {
                sidebarNav.innerHTML = `
                    <a href="dashboard.html" class="nav-link ${window.location.pathname.includes('dashboard') ? 'active' : ''}"><span class="mr-2.5">🗞</span>Feed</a>
                    <a href="bookmarks.html" class="nav-link ${window.location.pathname.includes('bookmarks') ? 'active' : ''}"><span class="mr-2.5">🔖</span>Bookmarks</a>
                    <a href="likes.html" class="nav-link ${window.location.pathname.includes('likes') ? 'active' : ''}"><span class="mr-2.5">❤️</span>Liked</a>
                    <a href="profile.html" class="nav-link ${window.location.pathname.includes('profile') ? 'active' : ''}"><span class="mr-2.5">👤</span>Profile</a>`;
            }
        }

        // Return the profile data so the specific page script can use it
        return profile;
    } catch (err) {
        console.error("Failed to load global profile", err);
        return null;
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}
