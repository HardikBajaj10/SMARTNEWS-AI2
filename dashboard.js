// dashboard.js – Renders the feed and handles recommendations

// Ensure articles are loaded
let articlesData = JSON.parse(localStorage.getItem("articles")) || [];

// Fallback to mock data if empty (merged)
if (typeof articles !== 'undefined' && articlesData.length === 0) {
    articlesData = articles;
}

const preferences = JSON.parse(localStorage.getItem("userPreferences")) || [];
const activity = JSON.parse(localStorage.getItem("userActivity")) || {};

function calculateScore(article) {
    let score = 0;
    const cat = article.category;

    // User preference weight
    if (preferences.includes(cat)) score += 50;

    // Interaction weights
    if (activity[cat]) {
        score += (activity[cat].readTime || 0) / 1000; // 1 point per second
        score += (activity[cat].likes || 0) * 10;
        score += (activity[cat].bookmarks || 0) * 15;
    }

    return score;
}

function createArticleCard(article, type = "normal") {
    const isBreaking = article.isToday;
    const accentClass = isBreaking ? "border-blue-500/30" : "border-white/5";

    return `
        <div class="glass-card article-card p-6 flex flex-col h-full border ${accentClass} hover:border-blue-500/50" 
             onclick="openArticle(${article.id}, '${article.category}')">
            <div class="flex justify-between items-start mb-4">
                <span class="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                    ${article.category}
                </span>
                ${isBreaking ? '<span class="text-blue-500 text-xs text-xs animate-pulse">●</span>' : ''}
            </div>
            
            <h3 class="text-lg font-bold text-white mb-3 line-clamp-2 leading-snug">
                ${article.title}
            </h3>
            
            <p class="text-gray-400 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                ${article.content ? article.content.substring(0, 100) + '...' : 'No description available for this publication.'}
            </p>
            
            <div class="flex items-center justify-between pt-4 border-t border-gray-800">
                <div class="flex items-center space-x-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    <span>${article.author}</span>
                </div>
                <div class="text-[10px] text-gray-500 font-bold uppercase px-2 py-1 rounded bg-gray-800">
                    ${article.location}
                </div>
            </div>
        </div>
    `;
}

function renderFeed() {
    const todaySection = document.getElementById("todaySection");
    const recommendedSection = document.getElementById("recommendedSection");

    if (!todaySection || !recommendedSection) return;

    // 1. Render Breaking (isToday)
    const breaking = articlesData.filter(a => a.isToday);
    todaySection.innerHTML = breaking.length > 0
        ? breaking.slice(0, 3).map(a => createArticleCard(a, "breaking")).join("")
        : `<p class="text-gray-500 text-sm italic col-span-3">No breaking news at the moment.</p>`;

    // 2. Render Recommended (Sorted by score)
    const recommended = articlesData
        .map(a => ({ ...a, score: calculateScore(a) }))
        .sort((a, b) => b.score - a.score);

    recommendedSection.innerHTML = recommended.length > 0
        ? recommended.slice(0, 6).map(a => createArticleCard(a)).join("")
        : `<p class="text-gray-500 text-sm italic col-span-3">Start reading to get personalized recommendations.</p>`;
}

function openArticle(id, category) {
    localStorage.setItem("currentArticleId", id);
    localStorage.setItem("currentCategory", category);
    window.location.href = "articleView.html";
}

// Initial render
renderFeed();