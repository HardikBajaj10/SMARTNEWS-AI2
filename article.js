// article.js – Handles detailed article view and engagement tracking

(function () {
    const id = parseInt(localStorage.getItem("currentArticleId"));
    const category = localStorage.getItem("currentCategory");

    // Fetch articles from localStorage or mock data
    let localArticles = JSON.parse(localStorage.getItem("articles")) || [];
    if (typeof articles !== 'undefined' && localArticles.length === 0) {
        localArticles = articles;
    }

    const article = localArticles.find(a => a.id === id);

    if (!article) {
        document.getElementById("title").innerText = "Publication Not Found";
        document.getElementById("content").innerHTML = "<p>The requested intelligence report is no longer available in our active index.</p>";
    } else {
        document.getElementById("title").innerText = article.title;
        document.getElementById("meta").innerText = `Broadcast by ${article.author} | Origin: ${article.location}`;

        // Convert plain text to paragraphs if needed
        const contentHtml = article.content
            ? article.content.split('\n').map(p => `<p>${p}</p>`).join('')
            : "<p>Analytical data is currently being synthesized. Please check back shortly.</p>";

        document.getElementById("content").innerHTML = contentHtml;
    }

    // Engagement Tracking
    let startTime = Date.now();

    window.like = function () {
        updateActivity(category, 'likes', 1);
        alert("Engagement recorded: Recommendation profile updated.");
    };

    window.bookmark = function () {
        updateActivity(category, 'bookmarks', 1);
        alert("Reference saved: Content added to your secure archive.");
    };

    window.finishReading = function () {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        updateActivity(category, 'readTime', duration * 1000); // Store in ms
        window.location.href = "dashboard.html";
    };

    function updateActivity(cat, type, value) {
        let activity = JSON.parse(localStorage.getItem("userActivity")) || {};
        if (!activity[cat]) {
            activity[cat] = { readTime: 0, likes: 0, bookmarks: 0, rating: 0 };
        }

        if (type === 'readTime') {
            activity[cat].readTime += value;
        } else {
            activity[cat][type] += value;
        }

        localStorage.setItem("userActivity", JSON.stringify(activity));
    }
})();