async function searchResults(keyword) {
  try {
    const searchUrl = `https://web.animeluxe.org/?s=${encodeURIComponent(keyword)}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const htmlText = await res.text();

    // نستخدم DOMParser لتحويل النص لـDocument
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    const results = [];
    const cards = doc.querySelectorAll("div.search-card");
    cards.forEach(card => {
      const a = card.querySelector("a.image.lazyactive");
      const imgSrc = a?.getAttribute("data-src") || a?.getAttribute("src") || "";
      const href = a?.href || "";
      const h3 = card.querySelector("h3");
      const title = h3?.textContent.trim() || "";

      if (href && title) {
        results.push({ title, url: href, image: imgSrc });
      }
    });
    return results;

  } catch (e) {
    console.error("Search error:", e);
    return [];
  }
}
