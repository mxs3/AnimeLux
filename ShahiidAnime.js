async function searchResults(keyword) {
    const encodedKeyword = encodeURIComponent(keyword);
    const searchUrl = `https://shahiid-anime.net/?s=${encodedKeyword}`;
    const response = await fetchv2(searchUrl);
    const html = await response.text();

    const results = [];
    const items = html.split('class="one-poster');

    for (const item of items) {
        const url = soraMatch(item, /<a href="([^"]+)"/);
        const title = soraMatch(item, /<h2><a[^>]*>(.*?)<\/a><\/h2>/);
        const poster = soraMatch(item, /<img[^>]+src="([^"]+)"/);

        if (url && title && poster) {
            results.push({
                title: title.trim(),
                url: url,
                poster: poster
            });
        }
    }

    return results;
}

// ✅ فك ترميز HTML
function decodeHTMLEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
