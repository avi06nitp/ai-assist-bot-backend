const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { buildKnowledgeBase } = require("./knowledgeBase");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 4000;

// ✅ Fully Manual CORS Handling
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://ai-assist-bot.vercel.app");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    
    next();
});

// ✅ Explicit OPTIONS Route for Preflight Requests
app.options("*", (req, res) => {
    res.header("Access-Control-Allow-Origin", "https://ai-assist-bot.vercel.app");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.sendStatus(204);
});

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

let knowledgeBase = "";
const sources = ["https://www.investopedia.com/",'https://share.market/support/home/manage-your-funds/', 'https://share.market/support/home/manage-your-funds/adding-funds/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/', 'https://share.market/support/home/manage-your-funds/other-questions-on-funds/', 'https://share.market/support/home/manage-your-funds/adding-funds/why-did-i-receive-a-upi-fund-transfer-request-that-i-had-not-raised/', 'https://share.market/support/home/manage-your-funds/adding-funds/why-am-i-unable-to-see-the-netbanking-option-under-available-payment-modes/', 'https://share.market/support/home/manage-your-funds/other-questions-on-funds/why-am-i-being-asked-to-add-additional-funds-than-required/', 'https://share.market/support/home/manage-your-funds/other-questions-on-funds/how-do-i-modify-or-cancel-my-withdrawal-request/', 'https://share.market/support/home/manage-your-funds/other-questions-on-funds/what-is-auto-settlement-can-i-choose-when-i-receive-it/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/how-do-i-withdraw-funds/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/all-you-need-to-know-about-withdrawing-funds/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/when-can-i-withdraw-funds-for-the-shares-that-i-have-sold-today/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/trouble-withdrawing-funds/why-am-i-unable-to-place-a-fund-withdrawal-request/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/trouble-withdrawing-funds/why-did-my-withdrawal-request-fail-or-get-rejected/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/trouble-withdrawing-funds/why-have-i-received-a-lesser-amount-than-requested/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/when-will-i-get-the-withdrawal-money/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/how-many-withdrawal-requests-can-i-place-in-a-day/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/trouble-withdrawing-funds/why-is-my-withdrawable-balance-less-than-the-available-funds/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/trouble-withdrawing-funds/why-are-my-available-funds-negative-or-zero/', 'https://share.market/support/home/manage-your-funds/adding-funds/how-do-i-add-funds/', 'https://share.market/support/home/manage-your-funds/adding-funds/what-should-i-know-before-adding-funds-2/', 'https://share.market/support/home/manage-your-funds/adding-funds/trouble-adding-funds/why-are-the-funds-i-added-not-reflecting-in-my-trading-account/', 'https://share.market/support/home/manage-your-funds/adding-funds/trouble-adding-funds/why-am-i-unable-to-add-funds/', 'https://share.market/support/home/manage-your-funds/adding-funds/trouble-adding-funds/why-is-my-fund-transfer-pending/', 'https://share.market/support/home/manage-your-funds/adding-funds/when-will-the-funds-added-reflect-in-my-trading-account/', 'https://share.market/support/home/manage-your-funds/adding-funds/what-is-the-breakdown-of-funds-in-my-trading-account/'];
;
// ✅ Load Knowledge Base on Startup
(async () => {
    try {
        knowledgeBase = await buildKnowledgeBase(sources);
        console.log("✅ Knowledge base loaded.");
    } catch (error) {
        console.error("❌ Error loading knowledge base:", error);
    }
})();

// ✅ Main Route with Explicit CORS Headers
app.post("/ask", async (req, res) => {
    res.header("Access-Control-Allow-Origin", "https://ai-assist-bot.vercel.app");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: "Bad Request: 'question' field is required." });
    }

    const prompt = `Context:\n${knowledgeBase}\n\nQuestion: ${question}`;

    try {
        const result = await model.generateContent({
            contents: [{ parts: [{ text: prompt }] }]
        });

        const answer = result.response?.candidates?.[0]?.content?.parts?.map(part => part.text).join("\n") || "No response received.";

        res.json({ answer });
    } catch (error) {
        console.error("❌ Error processing request:", error);
        res.status(500).json({ error: "Internal Server Error." });
    }
});

// ✅ Test Route
app.get("/", (req, res) => {
    res.send("🚀 Server is up and running!");
});

// ✅ Start Server
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
