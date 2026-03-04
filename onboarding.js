const categories = ["Technology", "Business", "Sports", "Health", "Entertainment", "Science", "Politics", "International"];
const grid = document.getElementById('categoryGrid');

// Auth validation and global profile loaded implicitly
loadGlobalProfile();

categories.forEach(cat => {
    const card = document.createElement('div');
    card.dataset.category = cat;
    card.className = 'category-card cursor-pointer p-4 transition-all slide-up';
    card.style.cssText = 'border:1px solid #d9cbc2; border-radius:4px; background:#fff; user-select:none;';
    card.innerHTML = `
        <p class="font-semibold text-sm" style="color:#121524;">${cat}</p>
        <p class="text-xs mt-0.5" style="color:#9db2bf;">Personalised stories</p>
    `;
    card.addEventListener('click', () => {
        const sel = card.classList.contains('selected-cat');
        if (sel) {
            card.classList.remove('selected-cat');
            card.style.borderColor = '#d9cbc2';
            card.style.background = '#fff';
        } else {
            card.classList.add('selected-cat');
            card.style.borderColor = '#485f88';
            card.style.background = '#dde6ed';
        }
    });
    grid.appendChild(card);
});

document.getElementById('saveBtn').addEventListener('click', async () => {
    const selected = Array.from(grid.children)
        .filter(c => c.classList.contains('selected-cat'))
        .map(c => c.dataset.category);
    if (selected.length === 0) {
        alert('Please select at least one topic.');
        return;
    }
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/user/preferences', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ preferences: selected })
        });
        if (!res.ok) throw new Error('Failed to save preferences');
        // No local cache needed, the dashboard will fetch them directly
        window.location.href = 'dashboard.html';
    } catch (err) {
        console.error(err);
        alert('Could not save preferences. Please try again.');
    }
});
