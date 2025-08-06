async function searchResults(keyword) {
    const encodedKeyword = encodeURIComponent(keyword);
    const url = `https://shahiid-anime.net/?s=${encodedKeyword}`;

    const response = await fetchv2(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            "Referer": "https://shahiid-anime.net/"
        }
    });

    const html = await response.text();
    const results = [];

    // التقاط كل بلوك نتيجة بحث
    const items = html.match(/<div class="one-poster[\s\S]*?<\/h2>/g);
    if (!items) return results;

    for (const item of items) {
        const urlMatch = item.match(/<a href="([^"]+)"/);
        const imgMatch = item.match(/<img[^>]+src="([^"]+)"/);
        const titleMatch = item.match(/<h2>\s*<a[^>]*>(.*?)<\/a>\s*<\/h2>/);

        if (urlMatch && imgMatch && titleMatch) {
            const href = urlMatch[1].trim();
            const rawTitle = decodeHTMLEntities(titleMatch[1].trim());
            const image = imgMatch[1].trim();
            const englishTitle = rawTitle.match(/[a-zA-Z0-9:.\-()]+/g)?.join(' ') || rawTitle;

            results.push({
                title: englishTitle.trim(),
                url: href,
                image
            });
        }
    }

    return results;
}

function decodeHTMLEntities(text) {
    return text
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}
