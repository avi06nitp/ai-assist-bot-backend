const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { extractTextFromUrl, extractTextFromPdf, buildKnowledgeBase } = require("./knowledgeBase");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

let knowledgeBase = "";
const sources = ["https://www.investopedia.com/",'https://share.market/support/home/manage-your-funds/', 'https://share.market/support/home/manage-your-funds/adding-funds/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/', 'https://share.market/support/home/manage-your-funds/other-questions-on-funds/', 'https://share.market/support/home/manage-your-funds/adding-funds/why-did-i-receive-a-upi-fund-transfer-request-that-i-had-not-raised/', 'https://share.market/support/home/manage-your-funds/adding-funds/why-am-i-unable-to-see-the-netbanking-option-under-available-payment-modes/', 'https://share.market/support/home/manage-your-funds/other-questions-on-funds/why-am-i-being-asked-to-add-additional-funds-than-required/', 'https://share.market/support/home/manage-your-funds/other-questions-on-funds/how-do-i-modify-or-cancel-my-withdrawal-request/', 'https://share.market/support/home/manage-your-funds/other-questions-on-funds/what-is-auto-settlement-can-i-choose-when-i-receive-it/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/how-do-i-withdraw-funds/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/all-you-need-to-know-about-withdrawing-funds/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/when-can-i-withdraw-funds-for-the-shares-that-i-have-sold-today/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/trouble-withdrawing-funds/why-am-i-unable-to-place-a-fund-withdrawal-request/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/trouble-withdrawing-funds/why-did-my-withdrawal-request-fail-or-get-rejected/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/trouble-withdrawing-funds/why-have-i-received-a-lesser-amount-than-requested/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/when-will-i-get-the-withdrawal-money/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/how-many-withdrawal-requests-can-i-place-in-a-day/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/trouble-withdrawing-funds/why-is-my-withdrawable-balance-less-than-the-available-funds/', 'https://share.market/support/home/manage-your-funds/withdrawing-funds/trouble-withdrawing-funds/why-are-my-available-funds-negative-or-zero/', 'https://share.market/support/home/manage-your-funds/adding-funds/how-do-i-add-funds/', 'https://share.market/support/home/manage-your-funds/adding-funds/what-should-i-know-before-adding-funds-2/', 'https://share.market/support/home/manage-your-funds/adding-funds/trouble-adding-funds/why-are-the-funds-i-added-not-reflecting-in-my-trading-account/', 'https://share.market/support/home/manage-your-funds/adding-funds/trouble-adding-funds/why-am-i-unable-to-add-funds/', 'https://share.market/support/home/manage-your-funds/adding-funds/trouble-adding-funds/why-is-my-fund-transfer-pending/', 'https://share.market/support/home/manage-your-funds/adding-funds/when-will-the-funds-added-reflect-in-my-trading-account/', 'https://share.market/support/home/manage-your-funds/adding-funds/what-is-the-breakdown-of-funds-in-my-trading-account/'];
;

(async () => {
    try {
        knowledgeBase = await buildKnowledgeBase(sources);
        console.log("Knowledge base built successfully");
    } catch (error) {
        console.error("Error building knowledge base:", error);
    }
})();

app.post("/ask", async (req, res) => {
    const { question } = req.body;

    // Validate request body
    if (!question) {
        return res.status(400).json({ error: "Bad Request: 'question' field is required." });
    }

    const prompt = `Context:\n${knowledgeBase}\n\nQuestion: ${question}`;

    try {
        const result = await model.generateContent({
            contents: [{ parts: [{ text: prompt }] }]
        });

        console.log("Raw API Response:", JSON.stringify(result, null, 2));

        // ✅ Corrected structure check
        if (!result || !result.response || !result.response.candidates || result.response.candidates.length === 0) {
            throw new Error("Invalid response from AI model");
        }

        // ✅ Extracting response correctly
        const answer = result.response.candidates[0]?.content?.parts?.map(part => part.text).join("\n") || "No response received.";

        console.log("Answer:", answer);
        res.json({ answer });
    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "Internal Server Error: Unable to process request." });
    }
});


app.listen(5000, () => console.log("Server running on port 5000"));