async function searchResults(keyword) {
    try {
        const encodedKeyword = encodeURIComponent(keyword);
        const searchUrl = `https://vip.animerco.org/?s=${encodedKeyword}`;
        const response = await fetchv2(searchUrl);
        const responseText = await response.text();

        const results = [];

        const itemRegex = /<div id="post-\d+" class="col-12[\s\S]*?<a href="([^"]+)" class="image[^"]*"[^>]*?data-src="([^"]+)"[^>]*?title="([^"]+)"[\s\S]*?<div class="info">/g;
        let match;

        while ((match = itemRegex.exec(responseText)) !== null) {
            const href = match[1].trim();
            const image = match[2].trim();
            const title = decodeHTMLEntities(match[3].trim());
            results.push({ title, href, image });
        }

        console.log(results);
        return JSON.stringify(results);
    } catch (error) {
        console.log('Fetch error in searchResults:', error);
        return JSON.stringify([{ title: 'Error', image: '', href: '' }]);
    }
}
    
async function extractDetails(url) {
    try {
        const response = await fetchv2(url);
        const responseText = await response.text();

        const details = [];

        if (url.includes('movies')) {
            const descriptionMatch = responseText.match(/<div class="content">\s*<p>(.*?)<\/p>\s*<\/div>/s);
            let description = descriptionMatch 
                ? decodeHTMLEntities(descriptionMatch[1].trim()) 
                : 'N/A';

            const airdateMatch = responseText.match(/<li>\s*بداية العرض:\s*<span>\s*<a [^>]*rel="tag"[^>]*>([^<]+)<\/a>/);
            let airdate = airdateMatch ? airdateMatch[1].trim() : 'Unknown';

            const genres = [];
            const aliasesMatch = responseText.match(/<div\s+class="genres">([\s\S]*?)<\/div>/);
            const inner = aliasesMatch ? aliasesMatch[1] : '';

            const anchorRe = /<a[^>]*>([^<]+)<\/a>/g;
            let m;
            while ((m = anchorRe.exec(inner)) !== null) {
                genres.push(decodeHTMLEntities(m[1].trim()));
            }

            details.push({
                description: description,
                aliases: genres.join(', '),
                airdate: `Released: ${airdate}`
            });

        } else if (url.includes('animes')) {
            const descriptionMatch = responseText.match(/<div class="content">\s*<p>(.*?)<\/p>\s*<\/div>/s);
            let description = descriptionMatch 
                ? decodeHTMLEntities(descriptionMatch[1].trim()) 
                : 'N/A';

            const airdateMatch = responseText.match(/<li>\s*بداية العرض:\s*<a [^>]*rel="tag"[^>]*>([^<]+)<\/a>/);
            let airdate = airdateMatch ? airdateMatch[1].trim() : 'Unknown';

            const genres = [];
            const aliasesMatch = responseText.match(/<div\s+class="genres">([\s\S]*?)<\/div>/);
            const inner = aliasesMatch ? aliasesMatch[1] : '';

            const anchorRe = /<a[^>]*>([^<]+)<\/a>/g;
            let m;
            while ((m = anchorRe.exec(inner)) !== null) {
                genres.push(decodeHTMLEntities(m[1].trim()));
            }

            details.push({
                description: description,
                aliases: genres.join(', '),
                airdate: `Aired: ${airdate}`
            });

        } else {
            throw new Error("URL does not match known anime or movie paths.");
        }

        return JSON.stringify(details);

    } catch (error) {
        console.log('Details error:', error);
        return JSON.stringify([{
            description: 'Error loading description',
            aliases: 'Aliases: Unknown',
            airdate: 'Aired: Unknown'
        }]);
    }
}

async function extractEpisodes(url) {
    try {
        const pageResponse = await fetchv2(url);
        const html = typeof pageResponse === 'object' ? await pageResponse.text() : await pageResponse;

        const episodes = [];

        if (url.includes('movies')) {
            episodes.push({ number: 1, href: url });
            return JSON.stringify(episodes);
        }

        const seasonUrlRegex = /<li\s+data-number='[^']*'>\s*<a\s+href='([^']+)'/g;
        const seasonUrls = [...html.matchAll(seasonUrlRegex)].map(match => match[1]);

        for (const seasonUrl of seasonUrls) {
            const seasonResponse = await fetchv2(seasonUrl);
            const seasonHtml = typeof seasonResponse === 'object' ? await seasonResponse.text() : await seasonResponse;

            const episodeRegex = /data-number='(\d+)'[\s\S]*?href='([^']+)'/g;
            for (const match of seasonHtml.matchAll(episodeRegex)) {
                episodes.push({
                    number: parseInt(match[1]),
                    href: match[2]
                });
            }
        }

        return JSON.stringify(episodes);
    } catch (error) {
        console.error("extractEpisodes failed:", error);
        return JSON.stringify([]);
    }
}

async function extractStreamUrl(url) {
    // ==== Unified Headers ====
    const defaultHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": url,
        "Accept": "*/*"
    };

    // ==== Helpers ====
    async function httpGet(u, referer) {
        try {
            const headers = { ...defaultHeaders, Referer: referer || u };
            if (typeof fetchv2 === "function") {
                return await fetchv2(u, headers, "GET");
            } else {
                return await fetch(u, { headers });
            }
        } catch (err) {
            console.log("HTTP GET Error:", err);
            return null;
        }
    }

    function soraMatch(regex, text) {
        const m = text.match(regex);
        return m ? m[1] : null;
    }

    function soraExtractMediaFromHtml(html) {
        const videoMatch = html.match(/<video[^>]+src=["']([^"']+)["']/i);
        return videoMatch ? videoMatch[1] : null;
    }

    // Unpack eval(function(p,a,c,k,e,d)...
    function unpackEval(str) {
        try {
            if (str.includes("eval(function(p,a,c,k,e,d)")) {
                return eval(str.replace(/^eval/, ""));
            }
        } catch (e) {
            console.log("Unpack error:", e);
        }
        return str;
    }

    // ===== Server Extractors =====
    async function extractVidea(embedUrl) {
        const res = await httpGet(embedUrl, embedUrl);
        const html = await res.text();
        const unpacked = unpackEval(html);
        const file = soraMatch(/file\s*:\s*["']([^"']+)["']/, unpacked) || soraExtractMediaFromHtml(unpacked);
        return file || null;
    }

    async function extractDailymotion(embedUrl) {
        const res = await httpGet(embedUrl, embedUrl);
        const html = await res.text();
        const match = soraMatch(/"url":"(https:[^"]+mp4[^"]*)"/, html.replace(/\\u002F/g, "/"));
        return match || null;
    }

    async function extractStreamwish(embedUrl) {
        const res = await httpGet(embedUrl, embedUrl);
        const html = await res.text();
        const unpacked = unpackEval(html);
        const match = soraMatch(/sources\s*:\s*\[\s*\{\s*file\s*:\s*["']([^"']+)["']/, unpacked);
        return match || null;
    }

    async function extractMP4Upload(embedUrl) {
        const res = await httpGet(embedUrl, embedUrl);
        const html = await res.text();
        const unpacked = unpackEval(html);
        const match = soraMatch(/player\.src\(\{\s*file\s*:\s*["']([^"']+)["']/, unpacked);
        return match || null;
    }

    async function extractUqload(embedUrl) {
        const res = await httpGet(embedUrl, embedUrl);
        const html = await res.text();
        const unpacked = unpackEval(html);
        const match = soraMatch(/sources\s*:\s*\[\s*\{\s*file\s*:\s*["']([^"']+)["']/, unpacked);
        return match || null;
    }

    // ===== Main Process =====
    const mainRes = await httpGet(url);
    if (!mainRes) return JSON.stringify([{ title: "Error", image: "", href: "" }]);

    const mainHtml = await mainRes.text();
    const iframeMatches = [...mainHtml.matchAll(/<iframe[^>]+src=["']([^"']+)["']/g)].map(m => m[1]);

    const servers = [];
    for (const iframeUrl of iframeMatches) {
        let finalUrl = iframeUrl.startsWith("http") ? iframeUrl : new URL(iframeUrl, url).href;
        let videoLink = null;

        if (/videa\./i.test(finalUrl)) videoLink = await extractVidea(finalUrl);
        else if (/dailymotion\./i.test(finalUrl)) videoLink = await extractDailymotion(finalUrl);
        else if (/streamwish/i.test(finalUrl)) videoLink = await extractStreamwish(finalUrl);
        else if (/mp4upload\.com/i.test(finalUrl)) videoLink = await extractMP4Upload(finalUrl);
        else if (/uqload\.com/i.test(finalUrl)) videoLink = await extractUqload(finalUrl);

        if (videoLink) {
            servers.push({ server: finalUrl, url: videoLink });
        }
    }

    if (servers.length === 0) {
        return JSON.stringify([{ title: "No Stream Found", image: "", href: "" }]);
    }

    // Ask user to choose server
    const chosen = servers.length === 1 ? servers[0] : await soraPrompt("Choose a server", servers.map(s => s.server));
    const selected = servers.length === 1 ? servers[0] : servers[chosen];

    return JSON.stringify([{ title: "Stream", image: "", href: selected.url }]);
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
