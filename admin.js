let articles = JSON.parse(localStorage.getItem("articles")) || [];

function addArticle() {
        const title = document.getElementById("title").value.trim();
        const category = document.getElementById("category").value;
        const location = document.getElementById("location").value.trim();
        const content = document.getElementById("content").value.trim();
        const isToday = document.getElementById("isToday").checked;
        const author = localStorage.getItem("userName") || "Super Admin";

        if (!title || !location || !content) {
                alert("Publication requires a headline, location, and full content.");
                return;
        }

        const newArticle = {
                id: Date.now(),
                title,
                category,
                author,
                location,
                content,
                isToday,
                timestamp: new Date().toISOString()
        };

        articles.unshift(newArticle); // Newest first
        localStorage.setItem("articles", JSON.stringify(articles));

        alert("Article published successfully.");

        // Clear form
        document.getElementById("title").value = "";
        document.getElementById("location").value = "";
        document.getElementById("content").value = "";
        document.getElementById("isToday").checked = false;

        renderArticles();
}

function renderArticles() {
        const list = document.getElementById("articleList");
        if (!list) return;

        if (articles.length === 0) {
                list.innerHTML = `<p class="text-gray-500 text-sm italic">No articles published yet.</p>`;
                return;
        }

        list.innerHTML = articles.map(a => `
        <div class="p-4 rounded-xl bg-gray-800 bg-opacity-30 border border-gray-700 hover:border-blue-500 transition-all">
            <h3 class="font-bold text-sm text-white mb-1 truncate">${a.title}</h3>
            <div class="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <span>${a.category}</span>
                <span>${new Date(a.timestamp || a.id).toLocaleDateString()}</span>
            </div>
        </div>
    `).join("");
}

// Initial render
renderArticles();