async function searchResults(keyword) {
    try {
        const baseUrl = "https://shahiid-anime.net"; // الموقع مباشرة
        const encodedKeyword = encodeURIComponent(keyword);
        const searchUrl = `${baseUrl}/?s=${encodedKeyword}`;

        // جلب الصفحة بهيدرز تشبه المتصفح
        const response = await soraFetch(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            }
        });

        if (!response || !response.ok) {
            throw new Error(`Request failed: ${response?.status || 'No response'}`);
        }

        const responseText = await response.text();
        const results = [];

        // Regex لاستخراج النتائج من كروت الموقع
        const itemRegex = /<div class="one-poster[\s\S]*?<a href="([^"]+)".*?<img[^>]+src="([^"]+)"[^>]*>[\s\S]*?<h2><a[^>]*>(.*?)<\/a><\/h2>/g;
        let match;

        while ((match = itemRegex.exec(responseText)) !== null) {
            results.push({
                title: decodeHTMLEntities(match[3].trim()),
                href: match[1].trim(),
                image: match[2].trim()
            });
        }

        return JSON.stringify(results);
    } catch (error) {
        console.log('Fetch error in searchResults:', error.message);
        return JSON.stringify([{ title: 'Error', image: '', href: '' }]);
    }
}

// دالة لفك ترميز HTML entities
function decodeHTMLEntities(text) {
    return text
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}
