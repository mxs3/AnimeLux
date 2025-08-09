async function searchResults(keyword) {
    // تكوين رابط البحث
    const url = `https://shahiid-anime.net/?s=${encodeURIComponent(keyword)}`;

    // جلب الصفحة بهيدر يشبه المتصفح
    const res = await Sora.fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"
        }
    });

    // تحويل الرد إلى نص HTML
    const html = await res.text();

    const results = [];

    // البحث عن كروت الأنمي في الصفحة
    const itemBlocks = html.match(/<div class="one-poster[\s\S]*?<\/h2>/g);
    if (!itemBlocks) return results;

    // استخراج البيانات من كل بلوك
    itemBlocks.forEach(block => {
        const hrefMatch = block.match(/<a href="([^"]+)"/);
        const titleMatch = block.match(/<h2><a[^>]*>(.*?)<\/a><\/h2>/);
        const imgMatch = block.match(/<img[^>]+src="([^"]+)"/);

        if (hrefMatch && titleMatch && imgMatch) {
            const href = hrefMatch[1].trim();
            const rawTitle = decodeHTMLEntities(titleMatch[1].trim());
            const image = imgMatch[1].trim();

            const englishTitle = rawTitle.match(/[a-zA-Z0-9:.\-()]+/g)?.join(' ') || rawTitle;

            results.push({
                title: englishTitle.trim(),
                image,
                url: href
            });
        }
    });

    return results;
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
