console.log("✅ Consia content script loaded on:", window.location.href);

function extractFlipkartReviewPage() {
  // Title on reviews page
  const title =
    document.querySelector("h1 span")?.innerText?.trim() ||
    document.querySelector("h1")?.innerText?.trim() ||
    document.title;

  // Price may not exist on review page → keep 0
  const price = 0;

  // Review texts on review listing page
  const reviews = Array.from(document.querySelectorAll("div.ZmyHeo div"))
    .map((el) => el.innerText.trim())
    .filter((t) => t.length > 10);

  return { title, price, reviews };
}

function extractFlipkartProductPage() {
  const title = document.querySelector("span.B_NuCI")?.innerText?.trim() || "";
  const priceText = document.querySelector("div._30jeq3")?.innerText || "";
  const price = Number(priceText.replace(/[^0-9.]/g, "")) || 0;

  const reviews = Array.from(document.querySelectorAll("div.t-ZTKy div div"))
    .map((el) => el.innerText.trim())
    .filter((t) => t.length > 10);

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
    .map((el) => el.innerText.trim())
    .filter((t) => t.length > 10);

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

  const reviews = Array.from(document.querySelectorAll("p, span"))
    .map((el) => el.innerText)
    .filter((t) => t && t.length > 20 && t.length < 300)
    .slice(0, 30);

  return { title, price, reviews };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "extract") {
    const url = window.location.href;

    let payload;

    // ✅ Flipkart Review Page
    if (url.includes("flipkart.com") && url.includes("/product-reviews/")) {
      payload = extractFlipkartReviewPage();
    }
    // ✅ Flipkart Product Page
    else if (url.includes("flipkart.com")) {
      payload = extractFlipkartProductPage();
    }
    // ✅ Amazon
    else if (url.includes("amazon")) {
      payload = extractAmazon();
    }
    // ✅ Others
    else {
      payload = extractGeneric();
    }

    console.log("✅ Consia extracted payload:", payload);
    sendResponse(payload);
  }
});
