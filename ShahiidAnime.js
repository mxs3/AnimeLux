async function searchResults(keyword) {
    const searchUrl = `https://shahiid-anime.net/?s=${encodeURIComponent(keyword)}`;
    const res = await fetchv2(searchUrl, {
        method: "GET",
        redirect: "follow",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            "Referer": "https://shahiid-anime.net/"
        }
    });

    let html = await res.text();
    if (/%3C/.test(html)) html = decodeURIComponent(html);

    const results = [...html.matchAll(
        /<div class="one-poster[\s\S]*?<img[^>]+src="([^"]+)"[^>]*>[\s\S]*?<h2>\s*<a href="([^"]+)">([^<]+)<\/a>/g
    )].map(m => ({
        title: m[3].trim(),
        url: m[2].trim(),
        image: m[1].trim()
    }));

    // سورا لازم ياخد الـ array مباشرة
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
