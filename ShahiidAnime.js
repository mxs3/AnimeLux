function searchResults(html) {
    const results = [];

    // نجيب كل البوسترات
    const itemBlocks = html.match(/<div class="one-poster[\s\S]*?<h2[\s\S]*?<\/h2>/g);
    if (!itemBlocks) return results;

    itemBlocks.forEach(block => {
        const hrefMatch = block.match(/<a\s+href="([^"]+)"/);
        const titleMatch = block.match(/<h2[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/);
        const imgMatch = block.match(/<img[^>]+src="([^"]+)"/);

        if (hrefMatch && titleMatch) {
            let href = hrefMatch[1].trim();
            let rawTitle = decodeHTMLEntities(titleMatch[1].trim());
            let image = imgMatch ? imgMatch[1].trim() : null;

            // روابط نسبية نصححها
            if (href.startsWith('/')) href = 'https://shahiid-anime.net' + href;
            if (image && image.startsWith('/')) image = 'https://shahiid-anime.net' + image;

            // نفضّل العنوان الإنجليزي لو موجود
            let englishTitle = rawTitle.match(/[a-zA-Z0-9:.\-()]+/g)?.join(' ') || rawTitle;

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
