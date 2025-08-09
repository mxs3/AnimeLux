async function searchShahiidAnime(keyword) {
    const searchUrl = `https://shahiid-anime.net/?s=${encodeURIComponent(keyword)}`;
    
    // جلب الصفحة
    const res = await fetch(searchUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
    });

    const html = await res.text();

    // استخراج النتائج بالـ Regex
    const results = [];
    const regex = /<div class="one-poster[\s\S]*?<a href="([^"]+)">[\s\S]*?<img[^>]+src="([^"]+)"[^>]*>[\s\S]*?<h2><a[^>]*>([^<]+)<\/a>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        results.push({
            title: match[3].trim(),
            url: match[1],
            image: match[2]
        });
    }

    return results;
}

// مثال تجربة
searchShahiidAnime("Gachiakuta").then(console.log);

function decodeHTMLEntities(text) {
    return text
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}
