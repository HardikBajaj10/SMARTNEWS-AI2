let preferredArticles = [];
let recommendedArticles = [];

const token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

function createArticleCard(article) {
    const isBreaking = article.isToday;
    const preview = article.content ? article.content.substring(0, 110) + '…' : '';
    const dateStr = new Date(article.timestamp || article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return `
        <div onclick="openArticle('${article._id || article.id}')"
             class="cursor-pointer slide-up"
             style="padding:18px 0; border-bottom:1px solid #d9cbc2; transition:background 0.15s;"
             onmouseover="this.style.background='#f5fde9'; this.style.padding='18px 12px'; this.style.margin='0 -12px';"
             onmouseout="this.style.background='transparent'; this.style.padding='18px 0'; this.style.margin='0';">
            <div class="flex justify-between items-center mb-2">
                <span class="badge" style="color:#485f88; background:#dde6ed;">${article.category}</span>
                ${isBreaking ? '<span style="color:#c0392b; font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">● Breaking</span>' : `<span style="color:#9db2bf; font-size:11px;">${dateStr}</span>`}
            </div>
            <h3 style="font-family:'Merriweather',Georgia,serif; font-size:1rem; font-weight:700; color:#121524; line-height:1.35; margin-bottom:6px;">
                ${article.title}
            </h3>
            <p style="font-size:13px; color:#9db2bf; line-height:1.6; margin-bottom:10px;">${preview}</p>
            <div style="font-size:11px; color:#c9ccc3; font-weight:600; letter-spacing:0.06em; text-transform:uppercase;">
                ${article.author}  ·  ${article.location}
            </div>
        </div>
    `;
}

function createBreakingCard(article) {
    const preview = article.content ? article.content.substring(0, 90) + '…' : '';
    return `
        <div onclick="openArticle('${article._id || article.id}')"
             class="cursor-pointer slide-up"
             style="padding:20px; border:1px solid #d9cbc2; border-radius:4px; background:#fff; transition:border-color 0.15s;"
             onmouseover="this.style.borderColor='#485f88';"
             onmouseout="this.style.borderColor='#d9cbc2';">
            <span class="badge" style="background:#dde6ed; color:#485f88; margin-bottom:10px; display:inline-block;">${article.category}</span>
            <h3 style="font-family:'Merriweather',Georgia,serif; font-size:0.95rem; font-weight:700; color:#121524; line-height:1.35; margin-bottom:8px;">
                ${article.title}
            </h3>
            <p style="font-size:12px; color:#9db2bf; line-height:1.5;">${preview}</p>
            <div style="margin-top:12px; font-size:11px; color:#c9ccc3; font-weight:600; letter-spacing:0.06em; text-transform:uppercase;">
                ${article.author}
            </div>
        </div>
    `;
}

function renderFeed() {
    const todaySection = document.getElementById("todaySection");
    const recommendedSection = document.getElementById("recommendedSection");

    if (!todaySection || !recommendedSection) return;

    const breaking = preferredArticles.filter(a => a.isToday);
    todaySection.innerHTML = breaking.length > 0
        ? breaking.slice(0, 3).map(createBreakingCard).join("")
        : `<p style="color:#9db2bf; font-size:13px; font-style:italic;">No breaking news in your topics right now.</p>`;

    const mainFeed = preferredArticles.filter(a => !a.isToday);
    let feedHTML = mainFeed.map(createArticleCard).join("");

    if (recommendedArticles.length > 0) {
        feedHTML += `
            <div style="margin: 32px 0 20px; display:flex; align-items:center; gap:12px;">
                <div style="height:1px; flex:1; background:#d9cbc2;"></div>
                <span style="font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#9db2bf;">Explore new topics</span>
                <div style="height:1px; flex:1; background:#d9cbc2;"></div>
            </div>
        `;
        feedHTML += recommendedArticles.map(createArticleCard).join("");
    }

    recommendedSection.innerHTML = feedHTML || `<p style="color:#9db2bf; font-size:13px; font-style:italic;">Read articles to unlock personalised recommendations.</p>`;
}

async function loadFeed() {
    const dateLabel = document.getElementById('dateLabel');
    if (dateLabel) {
        dateLabel.innerText = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    try {
        // Authenticate and load structural UI
        const profileResponse = await loadGlobalProfile();
        if (!profileResponse) return;

        // Render sidebar preference links dynamically from backend data
        const catContainer = document.getElementById('sidebarCategories');
        if (catContainer) {
            catContainer.innerHTML = '';
            const prefs = profileResponse.user.preferences || [];
            prefs.forEach(p => {
                const el = document.createElement('a');
                el.href = '#';
                el.className = 'nav-link';
                el.style.fontSize = '12px';
                el.innerText = p;
                catContainer.appendChild(el);
            });
        }

        // Load articles
        const [prefRes, recRes] = await Promise.all([
            fetch('/api/articles', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/articles/recommended', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (prefRes.ok) preferredArticles = await prefRes.json();
        if (recRes.ok) recommendedArticles = await recRes.json();

    } catch (err) {
        console.error("Failed to load feed from API", err);
    } finally {
        renderFeed();
    }
}

function openArticle(id) {
    localStorage.setItem("currentArticleId", id);
    window.location.href = "articleView.html";
}

loadFeed();