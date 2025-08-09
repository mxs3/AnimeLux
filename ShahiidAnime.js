async function searchResults(keyword) {
    const searchUrl = `https://shahiid-anime.net/?s=${encodeURIComponent(keyword)}`;
    
    const res = await fetchv2(searchUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            "Referer": "https://shahiid-anime.net/"
        }
    });

    // لازم نقرأه كـ نص مش JSON
    const html = await res.text();
    const results = [];

    const itemBlocks = html.match(/<div class="one-poster[\s\S]*?<h2>[\s\S]*?<\/h2>/g);
    if (!itemBlocks) return results;

    itemBlocks.forEach(block => {
        const hrefMatch = block.match(/<h2><a href="([^"]+)"/);
        const titleMatch = block.match(/<h2><a[^>]*>(.*?)<\/a><\/h2>/);
        const imgMatch = block.match(/<img[^>]+src="([^"]+)"/);

        if (hrefMatch && titleMatch && imgMatch) {
            const href = hrefMatch[1].trim();
            const rawTitle = decodeHTMLEntities(titleMatch[1].trim());
            const image = imgMatch[1].trim();

            const englishTitle = rawTitle.match(/[a-zA-Z0-9:.\-()]+/g)?.join(' ') || rawTitle;

            results.push({ title: englishTitle.trim(), image, href });
        }
    });

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
