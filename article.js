const articleId = localStorage.getItem("currentArticleId");
const token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

let readStartTime = Date.now();
let currentCat = "Unknown";
let commentPage = 0;
let totalComments = 0;

const titleEl = document.getElementById("title");
const contentEl = document.getElementById("content");
const metaEl = document.getElementById("meta");
const badgeEl = document.getElementById("categoryBadge");

// ── Load article ─────────────────────────────────────────────────────────────
async function loadArticle() {
    await loadGlobalProfile();

    if (!articleId) {
        titleEl.innerText = "Article Not Found";
        contentEl.innerHTML = "<p>Please return to the dashboard.</p>";
        return;
    }

    try {
        const res = await fetch(`/api/articles/${articleId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch article');

        const article = await res.json();
        currentCat = article.category;

        if (badgeEl) badgeEl.innerText = article.category;
        titleEl.innerText = article.title;
        metaEl.innerText = `By ${article.author} · ${article.location} · ${article.views} view${article.views !== 1 ? 's' : ''}`;
        contentEl.innerHTML = `<p>${article.content.replace(/\n/g, '</p><p>')}</p>`;

        // Load comments after article renders
        await loadComments();

        // Check if this article is already bookmarked
        const bkRes = await fetch(`/api/bookmarks/check/${articleId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (bkRes.ok) {
            const { bookmarked } = await bkRes.json();
            const bkBtn = document.querySelector('button[onclick="bookmark()"]');
            if (bkBtn && bookmarked) {
                updateButtonState(bkBtn, '🔖 Saved', true);
            }
        }

        // Check if this article is already liked
        const likeRes = await fetch(`/api/likes/check/${articleId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (likeRes.ok) {
            const { liked } = await likeRes.json();
            const likeBtns = document.querySelectorAll('button[onclick="like()"]');
            likeBtns.forEach(btn => {
                if (liked) updateButtonState(btn, '❤️ Recommended', true);
            });
        }

    } catch (err) {
        console.error("Failed to load article details", err);
        titleEl.innerText = "Error loading article";
        contentEl.innerHTML = "<p>Please try again later.</p>";
    }
}

// ── Comments ──────────────────────────────────────────────────────────────────
async function loadComments(loadMore = false) {
    if (!loadMore) commentPage = 0;

    try {
        const res = await fetch(`/api/comments/${articleId}?page=${commentPage}&limit=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;

        const data = await res.json();
        totalComments = data.total;

        const countEl = document.getElementById('commentCount');
        if (countEl) countEl.innerText = `${totalComments} comment${totalComments !== 1 ? 's' : ''}`;

        const list = document.getElementById('commentList');
        if (!list) return;

        if (commentPage === 0) list.innerHTML = '';

        if (data.comments.length === 0 && commentPage === 0) {
            list.innerHTML = `<p style="color:#9db2bf; font-size:13px; font-style:italic; padding:12px 0;">Be the first to comment.</p>`;
        } else {
            data.comments.forEach(c => {
                const el = document.createElement('div');
                el.style.cssText = 'padding:14px 0; border-bottom:1px solid #f0ecdd;';
                el.innerHTML = `
                    <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                        <span style="font-weight:600; font-size:13px; color:#485f88;">${c.user?.name || 'Reader'}</span>
                        <span style="font-size:11px; color:#c9ccc3;">${new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <p style="font-size:14px; color:#2c2c2c; line-height:1.6; margin:0;">${c.text}</p>
                `;
                list.appendChild(el);
            });
        }

        const loadMoreBtn = document.getElementById('loadMoreComments');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = data.hasMore ? 'block' : 'none';
            if (data.hasMore) commentPage++;
        }
    } catch (err) {
        console.error("Failed to load comments", err);
    }
}

async function postComment() {
    const input = document.getElementById('commentInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    try {
        const res = await fetch(`/api/comments/${articleId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ text })
        });

        if (!res.ok) {
            const err = await res.json();
            alert(err.message || 'Could not post comment');
            return;
        }
        input.value = '';
        commentPage = 0;
        await loadComments();
    } catch (err) {
        console.error("Failed to post comment", err);
    }
}

// ── User actions ──────────────────────────────────────────────────────────────
async function like() {
    try {
        // Sync with user activity (analytics)
        await fetch('/api/user/activity', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ category: currentCat, type: 'like' })
        });

        // Persist specific article like
        const res = await fetch(`/api/likes/${articleId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            const { liked } = await res.json();
            const likeBtns = document.querySelectorAll('button[onclick="like()"]');
            likeBtns.forEach(btn => {
                if (liked) {
                    updateButtonState(btn, '❤️ Recommended', true);
                } else {
                    updateButtonState(btn, '👍 Recommend', false);
                }
            });
        }
    } catch (err) {
        console.error("Failed to sync like", err);
    }
}

async function bookmark() {
    try {
        const res = await fetch(`/api/bookmarks/${articleId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const bkBtn = document.querySelector('button[onclick="bookmark()"]');
            if (bkBtn) updateButtonState(bkBtn, '🔖 Saved', true);
        }
    } catch (err) {
        console.error("Failed to bookmark", err);
    }
}

function updateButtonState(btn, text, isActive) {
    btn.innerText = text;
    if (isActive) {
        btn.style.color = '#485f88';
        btn.style.fontWeight = '700';
        btn.style.borderColor = '#485f88';
    } else {
        btn.style.color = '';
        btn.style.fontWeight = '';
        btn.style.borderColor = '';
    }
}

async function finishReading() {
    const readTime = Date.now() - readStartTime;
    try {
        await fetch('/api/readsessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ articleId, readTime })
        });
    } catch (err) {
        console.error("Failed to save read session", err);
    }
    window.location.href = "dashboard.html";
}

loadArticle();