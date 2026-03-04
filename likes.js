let likedArticles = [];
const token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

function createArticleCard(article) {
    if (!article) return '';
    const dateStr = new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const preview = article.content ? article.content.substring(0, 110) + '…' : '';

    return `
        <div onclick="openArticle('${article._id}')"
             class="cursor-pointer slide-up"
             style="padding:18px 0; border-bottom:1px solid #d9cbc2; transition:background 0.15s;"
             onmouseover="this.style.background='#f5fde9'; this.style.padding='18px 12px'; this.style.margin='0 -12px';"
             onmouseout="this.style.background='transparent'; this.style.padding='18px 0'; this.style.margin='0';">
            <div class="flex justify-between items-center mb-2">
                <span class="badge" style="color:#485f88; background:#dde6ed;">${article.category}</span>
                <span style="color:#9db2bf; font-size:11px;">${dateStr}</span>
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

async function loadLiked() {
    try {
        await loadGlobalProfile();

        const res = await fetch('/api/likes/my', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch likes');

        const data = await res.json();
        likedArticles = data.articles || [];

        renderLiked();
    } catch (err) {
        console.error("Error loading liked articles:", err);
        document.getElementById("likedSection").innerHTML = `<p style="color:#c0392b;">Error loading liked articles.</p>`;
    }
}

function renderLiked() {
    const section = document.getElementById("likedSection");
    if (likedArticles.length === 0) {
        section.innerHTML = `<p style="color:#9db2bf; font-size:14px; font-style:italic;">You haven't liked any articles yet.</p>`;
        return;
    }

    section.innerHTML = likedArticles.map(createArticleCard).join("");
}

function openArticle(id) {
    localStorage.setItem("currentArticleId", id);
    window.location.href = "articleView.html";
}

loadLiked();
