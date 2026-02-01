// content.js - UPDATED VERSION WITH IMPROVED FLIPKART SELECTORS
console.log("✅ Consia content script loaded on:", window.location.href);

function cleanText(t) {
  return (t || "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFlipkartReviewPage() {
  console.log("🛒 Extracting from Flipkart REVIEW page");
  
  const title =
    document.querySelector("h1 span")?.innerText?.trim() ||
    document.querySelector("h1")?.innerText?.trim() ||
    document.title;

  const price = 0;

  // ✅ UPDATED: Better Flipkart review selectors (most common ones)
  const reviewSelectors = [
    "div._6K-7Co",      // Main review text
    "div.t-ZTKy",       // Review description
    "div._27M-vq",      // Review content wrapper
    "div.ZmyHeo",       // Another review wrapper
    "div._11JPr",       // Yet another wrapper
    "div[class*='review']",  // Any class with review
    "div[data-id*='review']", // Data attribute
    ".qwjRop div",      // Common Flipkart class
    ".row .col-12"      // Grid layout
  ];

  let allReviews = [];
  
  // Try each selector
  for (const selector of reviewSelectors) {
    const elements = document.querySelectorAll(selector);
    console.log(`🔍 Selector "${selector}": Found ${elements.length} elements`);
    
    if (elements.length > 0) {
      elements.forEach((el, index) => {
        const text = cleanText(el.innerText);
        if (text && text.length > 30 && 
            !text.toLowerCase().includes("read more") &&
            !text.toLowerCase().includes("helpful") &&
            !text.includes("★")) {
          console.log(`📝 Review ${index}: ${text.substring(0, 80)}...`);
          allReviews.push(text);
        }
      });
      
      if (allReviews.length >= 10) break; // Got enough reviews
    }
  }
  
  // ✅ Remove duplicates and limit
  let reviews = [...new Set(allReviews)].slice(0, 30);
  
  console.log(`✅ Extracted ${reviews.length} reviews from Flipkart review page`);
  
  return { title, price, reviews };
}

function extractFlipkartProductPage() {
  console.log("🛒 Extracting from Flipkart PRODUCT page");
  
  const title = document.querySelector("span.B_NuCI")?.innerText?.trim() || "";
  const priceText = document.querySelector("div._30jeq3")?.innerText || "";
  const price = Number(priceText.replace(/[^0-9.]/g, "")) || 0;

  // ✅ UPDATED: Better selectors for product page reviews
  const reviewElements = document.querySelectorAll("div.t-ZTKy, div.ZmyHeo, div._6K-7Co");
  
  console.log(`🔍 Found ${reviewElements.length} review elements`);
  
  const reviews = Array.from(reviewElements)
    .map((el) => cleanText(el.innerText))
    .filter((t) => t.length > 30 && !t.toLowerCase().includes("read more"));

  console.log(`✅ Extracted ${reviews.length} reviews from Flipkart product page`);
  
  return { title, price, reviews };
}

function extractAmazon() {
  const title = document.querySelector("#productTitle")?.innerText?.trim() || "";
  const priceText =
    document.querySelector(".a-price .a-offscreen")?.innerText ||
    document.querySelector("#priceblock_ourprice")?.innerText ||
    "";

  const price = Number(priceText.replace(/[^0-9.]/g, "")) || 0;

  const reviews = Array.from(
    document.querySelectorAll("span[data-hook='review-body'] span")
  )
    .map((el) => cleanText(el.innerText))
    .filter((t) => t.length > 30);

  return { title, price, reviews };
}

function extractGeneric() {
  const metaTitle = document.querySelector('meta[property="og:title"]')?.content;
  const h1 = document.querySelector("h1")?.innerText;
  const title = (metaTitle || h1 || document.title || "").trim();

  const priceCandidates = Array.from(document.querySelectorAll("span, div"))
    .map((el) => el.innerText)
    .filter((t) => t && t.includes("₹"));

  const raw = priceCandidates[0] || "";
  const price = Number(raw.replace(/[^0-9.]/g, "")) || 0;

  const reviews = Array.from(document.querySelectorAll("p, span, div"))
    .map((el) => cleanText(el.innerText))
    .filter((t) => t.length > 40)
    .slice(0, 40);

  return { title, price, reviews };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "extract") {
    const url = window.location.href;
    console.log("🚀 Consia received extract command for:", url);

    let payload;

    if (url.includes("flipkart.com") && url.includes("/product-reviews/")) {
      payload = extractFlipkartReviewPage();
    } else if (url.includes("flipkart.com")) {
      payload = extractFlipkartProductPage();
    } else if (url.includes("amazon")) {
      payload = extractAmazon();
    } else {
      payload = extractGeneric();
    }

    console.log("✅ Consia extracted payload:", {
      title: payload.title,
      price: payload.price,
      reviewCount: payload.reviews.length
    });
    
    if (payload.reviews.length === 0) {
      console.warn("⚠️ No reviews extracted! Debugging page structure...");
      
      // Debug: Log all div elements with classes
      const allDivs = document.querySelectorAll('div[class]');
      console.log(`📊 Total div elements with classes: ${allDivs.length}`);
      
      // Show sample of div classes
      Array.from(allDivs).slice(0, 20).forEach((div, i) => {
        console.log(`Div ${i}: class="${div.className.substring(0, 50)}"`);
      });
    }

    sendResponse(payload);
    return true; // Keep message channel open
  }
});

console.log("✅ Consia ready to extract data");