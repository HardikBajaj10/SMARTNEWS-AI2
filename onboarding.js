// onboarding.js – renders category cards and saves user preferences
const categories = [
    "Technology",
    "Business",
    "Sports",
    "Health",
    "Entertainment",
    "Science",
    "Politics",
    "International"
];

const grid = document.getElementById('categoryGrid');

categories.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'glass-card hover-lift p-4 text-center cursor-pointer transition';
    card.innerText = cat;
    card.dataset.category = cat;
    card.addEventListener('click', () => {
        card.classList.toggle('border');
        card.classList.toggle('border-blue-500');
    });
    grid.appendChild(card);
});

document.getElementById('saveBtn').addEventListener('click', () => {
    const selected = Array.from(grid.children)
        .filter(c => c.classList.contains('border-blue-500'))
        .map(c => c.dataset.category);
    if (selected.length === 0) {
        alert('Please select at least one category.');
        return;
    }
    localStorage.setItem('userPreferences', JSON.stringify(selected));
    // initialize empty activity log for the user
    localStorage.setItem('userActivity', JSON.stringify({}));
    window.location.href = 'dashboard.html';
});
