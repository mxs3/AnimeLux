async function searchResults(keyword) {
    try {
        // 1. ترميز الكلمة المفتاحية
        const encodedKeyword = encodeURIComponent(keyword);

        // 2. تكوين رابط البحث من الدومين الأساسي
        const searchUrl = `${DECODE_SI()}/?s=${encodedKeyword}`;

        // 3. جلب الصفحة باستخدام soraFetch
        const response = await soraFetch(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            }
        });

        const responseText = await response.text();

        const results = [];

        // 4. Regex مطابق لهيكلة موقع shahiid-anime
        const itemRegex = /<div class="one-poster[\s\S]*?<a href="([^"]+)".*?<img[^>]+src="([^"]+)"[^>]*>[\s\S]*?<h2><a[^>]*>(.*?)<\/a><\/h2>/g;
        let match;

        // 5. استخراج النتائج
        while ((match = itemRegex.exec(responseText)) !== null) {
            const href = match[1].trim();
            const image = match[2].trim();
            const title = decodeHTMLEntities(match[3].trim());
            results.push({ title, href, image });
        }

        // 6. إرجاع النتائج بصيغة JSON
        return JSON.stringify(results);

    } catch (error) {
        console.log('Fetch error in searchResults:', error);
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
