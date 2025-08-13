async function searchResults(keyword) {
  try {
    const hasFetchV2 = typeof fetchv2 === "function";
    async function httpGet(u) {
      if (hasFetchV2) {
        return await fetchv2(u, { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" });
      } else {
        const res = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } });
        return await res.text();
      }
    }

    const searchUrl = `https://web.animeluxe.org/?s=${encodeURIComponent(keyword)}`;
    const html = await httpGet(searchUrl);
    if (!html) return JSON.stringify([]);

    const results = [];
    // regex مضبوط على شكل الموقع اللي انت بعته
    const cardRegex = /<div class="search-card">[\s\S]*?<a href="([^"]+)" class="image lazyactive"[^>]*data-src="([^"]+)"[^>]*>[\s\S]*?<h3>([^<]+)<\/h3>/g;

    let match;
    while ((match = cardRegex.exec(html)) !== null) {
      results.push({
        title: match[3].trim(),
        image: match[2].trim(),
        href: match[1].trim()
      });
    }

    return JSON.stringify(results);

  } catch (e) {
    console.log("Search error:", e);
    return JSON.stringify([]);
  }
}
