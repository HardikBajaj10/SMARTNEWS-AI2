let articles = [];

async function addArticle() {
        const title = document.getElementById("title").value.trim();
        const category = document.getElementById("category").value;
        const location = document.getElementById("location").value.trim();
        const content = document.getElementById("content").value.trim();
        const isToday = document.getElementById("isToday").checked;

        if (!title || !location || !content) {
                alert("Please complete the headline, location, and content fields.");
                return;
        }

        try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/articles', {
                        method: 'POST',
                        headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ title, category, location, content, isToday })
                });

                if (!res.ok) throw new Error('Failed to publish article');

                document.getElementById("title").value = "";
                document.getElementById("location").value = "";
                document.getElementById("content").value = "";
                document.getElementById("isToday").checked = false;

                loadArticlesFromAPI();
        } catch (err) {
                console.error(err);
                alert("Server error. Could not publish.");
        }
}

async function loadArticlesFromAPI() {
        const profile = await loadGlobalProfile();
        if (!profile || profile.user.role !== 'admin') return; // Enforce admin-only access

        try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/articles/all', {
                        headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                        articles = await res.json();
                        renderArticles();
                }
        } catch (err) {
                console.error("Failed to load articles", err);
        }
}

function renderArticles() {
        const list = document.getElementById("articleList");
        if (!list) return;

        if (articles.length === 0) {
                list.innerHTML = `<p style="color:#9db2bf; font-size:13px; font-style:italic;">No articles published yet.</p>`;
                return;
        }

        list.innerHTML = articles.map(a => `
        <div style="padding:14px 0; border-bottom:1px solid #d9cbc2; cursor:default;"
             onmouseover="this.style.background='#f5fde9'; this.style.padding='14px 10px'; this.style.margin='0 -10px';"
             onmouseout="this.style.background='transparent'; this.style.padding='14px 0'; this.style.margin='0';">
            <p style="font-family:'Merriweather',Georgia,serif; font-size:0.85rem; font-weight:700; color:#121524; line-height:1.3; margin-bottom:5px;">${a.title}</p>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="badge" style="background:#dde6ed; color:#485f88;">${a.category}</span>
                <span style="font-size:11px; color:#c9ccc3;">${new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
        </div>
    `).join("");
}

// Initial API payload run
loadArticlesFromAPI();