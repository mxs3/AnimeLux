async function searchResults(keyword) {
  try {
    const hasFetchV2 = typeof fetchv2 === "function";
    async function httpGet(u) {
      if (hasFetchV2) {
        return await fetchv2(u, { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" });
      } else {
        return await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } });
      }
    }

    const searchUrl = `https://web.animeluxe.org/?s=${encodeURIComponent(keyword)}`;
    const res = await httpGet(searchUrl);
    if (!res) return [];
    const html = typeof res.text === "function" ? await res.text() : res;

    const results = [];
    // regex يلتقط كل media-block
    const cardRegex = /<div class="search-card">[\s\S]*?<a href="([^"]+)" class="image lazyactive"[^>]*data-src="([^"]+)"[^>]*>[\s\S]*?<h3>([^<]+)<\/h3>/g;

    let match;
    while ((match = cardRegex.exec(html)) !== null) {
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
