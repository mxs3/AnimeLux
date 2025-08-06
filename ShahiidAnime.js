async function searchResults(keyword) {
    const res = await fetchv2(`https://shahiid-anime.net/?s=${encodeURIComponent(keyword)}`, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            "Referer": "https://shahiid-anime.net/"
        }
    });

    let html = await res.text();
    // لو فيه ترميز URL (%3C...) نحوله لنص عادي
    if (/%3C/.test(html)) html = decodeURIComponent(html);

    return [...html.matchAll(/<div class="one-poster[\s\S]*?<img[^>]+src="([^"]+)"[^>]*>[\s\S]*?<h2><a href="([^"]+)">([^<]+)<\/a>/g)]
        .map(m => ({
            image: m[1].trim(),
            url: m[2].trim(),
            title: m[3].trim()
        }));
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
