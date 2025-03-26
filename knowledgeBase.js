const axios = require("axios");

// Fetch a URL with headers to mimic a real browser
async function fetchUrl(url) {
    try {
        console.log(`Fetching: ${url}`);
        const response = await axios.get(url, {
            timeout: 3000, // 3s timeout
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${url}: ${error.message}`);
        return null;
    }
}

// Build knowledge base, skipping failed fetches
async function buildKnowledgeBase(sources) {
    const knowledgeBase = [];
    for (const url of sources) {
        const data = await fetchUrl(url);
        if (data) {
            knowledgeBase.push(data);
        }
    }
    return knowledgeBase.join("\n\n");
}

module.exports = { buildKnowledgeBase };
