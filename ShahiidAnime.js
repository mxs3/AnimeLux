async function searchResults(keyword) {
    const searchUrl = `https://shahiid-anime.net/?s=${encodeURIComponent(keyword)}`;
    const res = await fetchv2(searchUrl);
    const html = await res.text();

    const results = [];
    const items = html.split('<article');

    for (let item of items) {
        const url = soraMatch(item, /<a[^>]+href="([^"]+)"[^>]*>/);
        const title = soraMatch(item, /<h2[^>]*class="[^"]*title[^"]*"[^>]*>(.*?)<\/h2>/i);
        const image = soraMatch(item, /<img[^>]+src="([^"]+)"[^>]*>/i);

        if (url && title) {
            results.push({
                title: decodeHTMLEntities(title),
                url,
                image
            });
        }
    }

    return results;
}

// helper to decode HTML entities
function decodeHTMLEntities(text) {
    return text.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
               .replace(/&quot;/g, '"')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&#039;/g, "'");
}
