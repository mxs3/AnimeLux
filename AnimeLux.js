async function searchResults(keyword) {
  try {
    const searchUrl = `https://web.animeluxe.org/?s=${encodeURIComponent(keyword)}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });
    const html = await res.text();

    const results = [];
    const regex = /<div class="search-card">[\s\S]*?<a href="([^"]+)" class="image lazyactive" data-src="([^"]+)"[^>]*>[\s\S]*?<\/a>[\s\S]*?<h3>([^<]+)<\/h3>/g;

    let match;
    while ((match = regex.exec(html)) !== null) {
      results.push({
        title: match[3].trim(),
        url: match[1].trim(),
        image: match[2].trim()
      });
    }

    return results;
  } catch (e) {
    console.error("Search error:", e);
    return [];
  }
}
