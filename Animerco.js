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
    // ====== إعدادات عامة ======
    const defaultHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": url,
        "Accept": "*/*"
    };
    const hasFetchV2 = typeof fetchv2 === "function";

    async function httpGet(u, opts = {}) {
        try {
            if (hasFetchV2) {
                return await fetchv2(u, opts.headers || defaultHeaders, opts.method || "GET", opts.body || null);
            } else {
                return await fetch(u, { method: opts.method || "GET", headers: opts.headers || defaultHeaders, body: opts.body || null });
            }
        } catch (err) {
            console.log("httpGet error", err);
            return null;
        }
    }

    // ====== فك eval ======
    function unpackEval(code) {
        try {
            const m = code.match(/eval\(function\(p,a,c,k,e,d\).*?\)\)/s);
            if (m) {
                return eval(m[0]);
            }
        } catch (e) {
            console.log("Unpack failed", e);
        }
        return code;
    }

    // ====== إستخراج MP4 بالقوة ======
    function extractMp4(html) {
        const mp4Match = html.match(/https?:\/\/[^\s"']+\.mp4[^\s"']*/);
        return mp4Match ? mp4Match[0] : null;
    }

    // ====== إستخراج HLS بالقوة ======
    function extractHls(html) {
        const hlsMatch = html.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/);
        return hlsMatch ? hlsMatch[0] : null;
    }

    // ====== Extractor HQQ ======
    async function extractHQQ(embedUrl) {
        const res = await httpGet(embedUrl);
        if (!res) return null;
        let html = await res.text();
        html = unpackEval(html);
        return extractMp4(html) || extractHls(html);
    }

    // ====== Extractor GradeHGPlus ======
    async function extractGradeHGPlus(embedUrl) {
        const res = await httpGet(embedUrl);
        if (!res) return null;
        let html = await res.text();
        html = unpackEval(html);
        return extractMp4(html) || extractHls(html);
    }

    // ====== Extractor Dailymotion ======
    async function extractDailymotion(embedUrl) {
        const res = await httpGet(embedUrl);
        if (!res) return null;
        const html = await res.text();
        return extractHls(html) || extractMp4(html);
    }

    // ====== Extractor Ok.ru ======
    async function extractOkRu(embedUrl) {
        const res = await httpGet(embedUrl);
        if (!res) return null;
        const html = await res.text();
        return extractMp4(html) || extractHls(html);
    }

    // ====== Extractor Videa ======
    async function extractVidea(embedUrl) {
        const res = await httpGet(embedUrl);
        if (!res) return null;
        const html = await res.text();
        return extractHls(html) || extractMp4(html);
    }

    // ====== قراءة صفحة الحلقة ======
    const res = await httpGet(url);
    if (!res) return JSON.stringify([{ title: "Error", url: "" }]);
    const html = await res.text();

    // ====== البحث عن iframes ======
    const iframeMatches = [...html.matchAll(/<iframe[^>]+src=["']([^"']+)["']/g)].map(m => m[1]);
    let streams = [];

    for (let iframeUrl of iframeMatches) {
        let finalUrl = iframeUrl.startsWith("http") ? iframeUrl : new URL(iframeUrl, url).href;

        let videoSrc = null;
        if (/hqq|netu/i.test(finalUrl)) videoSrc = await extractHQQ(finalUrl);
        else if (/gradehgplus/i.test(finalUrl)) videoSrc = await extractGradeHGPlus(finalUrl);
        else if (/dailymotion/i.test(finalUrl)) videoSrc = await extractDailymotion(finalUrl);
        else if (/ok\.ru/i.test(finalUrl)) videoSrc = await extractOkRu(finalUrl);
        else if (/videa/i.test(finalUrl)) videoSrc = await extractVidea(finalUrl);
        else {
            // محاولة عامة
            const res2 = await httpGet(finalUrl);
            if (res2) {
                let innerHtml = await res2.text();
                innerHtml = unpackEval(innerHtml);
                videoSrc = extractHls(innerHtml) || extractMp4(innerHtml);
            }
        }

        if (videoSrc) {
            streams.push({
                title: finalUrl.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/)?.[1] || "Server",
                url: videoSrc
            });
        }
    }

    if (streams.length === 0) {
        return JSON.stringify([{ title: "No stream found", url: "" }]);
    }
    return JSON.stringify(streams);
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
