

function extractTitle() {
const metaTitle = document.querySelector('meta[property="og:title"]')?.content;
const h1 = document.querySelector('h1')?.innerText;
return (metaTitle || h1 || document.title || "").trim();
}


function extractPrice() {
// Try common price patterns
const textCandidates = Array.from(document.querySelectorAll("span, div"))
.map(el => el.innerText)
.filter(t => t && t.includes("₹"));


if (textCandidates.length === 0) return 0;


// pick first and parse
const raw = textCandidates[0];
const num = raw.replace(/[^0-9.]/g, "");
return Number(num) || 0;
}


function extractReviews() {
// Grab paragraphs that look like reviews (simple heuristic)
const possible = Array.from(document.querySelectorAll("p, span"))
.map(el => el.innerText)
.filter(t => t && t.length > 20 && t.length < 300);


// Limit to first 30 to avoid huge payload
return possible.slice(0, 30);
}


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
if (msg.action === "extract") {
const payload = {
title: extractTitle(),
price: extractPrice(),
reviews: extractReviews()
};
sendResponse(payload);
}
});