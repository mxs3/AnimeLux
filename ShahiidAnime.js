function searchResults(html) {
    const results = [];

    // نبحث عن البلوكات اللي فيها الأنمي
    const itemBlocks = html.match(/<div class="one-poster[\s\S]*?<\/h2>/g);

    if (!itemBlocks) return results;

    itemBlocks.forEach(block => {
        const hrefMatch = block.match(/<a href="([^"]+)"/);
        const titleMatch = block.match(/<h2><a[^>]*>(.*?)<\/a><\/h2>/);
        const imgMatch = block.match(/<img[^>]+src="([^"]+)"/);

        if (hrefMatch && titleMatch && imgMatch) {
            const href = hrefMatch[1].trim();
            const rawTitle = decodeHTMLEntities(titleMatch[1].trim());
            const image = imgMatch[1].trim();

            // نحتفظ بالاسم الإنجليزي لو موجود
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
