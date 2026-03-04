async function loadProfilePage() {
    const profileData = await loadGlobalProfile();
    if (!profileData) return; // Unauthenticated or error

    const user = profileData.user;

    // Populate identity section
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const avatarInitial = document.getElementById('avatarInitial');

    if (profileName) profileName.innerText = user.name;
    if (profileEmail) profileEmail.innerText = user.email;
    if (avatarInitial) avatarInitial.innerText = user.name.charAt(0).toUpperCase();

    // UI References
    const readerStats = document.getElementById('readerStats');
    const publisherStats = document.getElementById('publisherStats');
    const preferencesBox = document.getElementById('preferencesBox');

    // Badge Reference
    const badgeEl = document.getElementById('badge');

    if (user.role === 'admin') {
        // --- PUBLISHER VIEW ---
        publisherStats.classList.remove('hidden');
        preferencesBox.classList.add('hidden'); // Publishers don't use topics

        try {
            const token = localStorage.getItem('token');
            const [artRes, statsRes, pubRes] = await Promise.all([
                fetch('/api/articles/all', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/readsessions/publisher-stats', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/publishers/me', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const articles = artRes.ok ? await artRes.json() : [];
            const statsData = statsRes.ok ? await statsRes.json() : { totals: { totalReadTime: 0, uniqueReaderCount: 0 } };
            const pubProfile = pubRes.ok ? await pubRes.json() : null;

            const totals = statsData.totals || {};

            document.getElementById('pubArticles').innerText = articles.length;

            // Use Publisher collection data if available (more reliable/hardened)
            if (pubProfile) {
                const secs = Math.floor((pubProfile.totalReadTime || 0) / 1000);
                const mins = Math.floor(secs / 60);
                const remSecs = secs % 60;
                document.getElementById('pubReads').innerText = `${mins}m ${remSecs}s`;
                document.getElementById('pubUnique').innerText = pubProfile.uniqueReaders?.length || 0;
            } else {
                // Fallback to aggregate stats
                const secs = Math.floor((totals.totalReadTime || 0) / 1000);
                const mins = Math.floor(secs / 60);
                const remSecs = secs % 60;
                document.getElementById('pubReads').innerText = `${mins}m ${remSecs}s`;
                document.getElementById('pubUnique').innerText = totals.uniqueReaderCount || 0;
            }

            if (badgeEl) {
                badgeEl.innerText = 'Verified Publisher';
                badgeEl.style.background = '#485f88';
                badgeEl.style.color = '#fff';
            }

        } catch (err) {
            console.error("Failed to load publisher stats", err);
        }

    } else {
        // --- READER VIEW ---
        readerStats.classList.remove('hidden');
        preferencesBox.classList.remove('hidden');

        const stats = profileData.stats || { reads: 0, bookmarks: 0, likes: 0 };
        document.getElementById('reads').innerText = stats.reads;
        document.getElementById('bookmarks').innerText = stats.bookmarks;
        document.getElementById('likes').innerText = stats.likes;

        // Render preferences tags
        const prefContainer = document.getElementById('prefTags');
        const prefs = user.preferences || [];
        if (prefContainer && prefs.length > 0) {
            prefContainer.innerHTML = prefs.map(p =>
                `<span class="badge" style="background:#dde6ed; color:#485f88;">${p}</span>`
            ).join('');
        }

        // Reader Tier Badge logic
        if (badgeEl) {
            const score = stats.reads + (stats.bookmarks * 2) + (stats.likes * 3);
            if (score > 50) {
                badgeEl.innerText = 'Premium Reader';
                badgeEl.style.background = '#485f88';
                badgeEl.style.color = '#fff';
            } else if (score > 15) {
                badgeEl.innerText = 'Regular Reader';
                badgeEl.style.background = '#dde6ed';
                badgeEl.style.color = '#485f88';
            } else {
                badgeEl.innerText = 'New Reader';
                badgeEl.style.background = '#f0ecdd';
                badgeEl.style.color = '#9db2bf';
            }
        }
    }
}

loadProfilePage();