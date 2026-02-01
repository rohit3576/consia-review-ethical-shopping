// content.js - FIXED VERSION FOR FLIPKART REVIEW PAGE
console.log("✅ Consia content script loaded on:", window.location.href);

function cleanText(t) {
  return (t || "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/READ MORE/g, "")
    .trim();
}

// Click all "Read More" buttons to expand reviews
function expandAllReadMore() {
  const readMoreSelectors = [
    "span._1BWGvX",
    "span[class*='read-more']",
    "button[class*='read']",
    "div._3Uc6Vt",
    ".T9pNhm" // "Read full review" button
  ];
  
  let clicked = 0;
  readMoreSelectors.forEach(selector => {
    const buttons = document.querySelectorAll(selector);
    buttons.forEach(button => {
      try {
        button.click();
        clicked++;
      } catch(e) {
        // Ignore errors
      }
    });
  });
  
  if (clicked > 0) {
    console.log(`✅ Clicked ${clicked} "Read More" buttons`);
  }
  
  return clicked;
}

function extractFlipkartReviewPage() {
  console.log("🛒 Extracting from Flipkart REVIEW page");
  
  // Step 1: Expand all reviews first
  expandAllReadMore();
  
  // Wait a bit for expansion
  setTimeout(() => {
    // This will be called after timeout
  }, 500);
  
  const title = document.querySelector("h1")?.innerText?.trim() || 
                document.querySelector("span.B_NuCI")?.innerText?.trim() ||
                document.title;

  const price = 0;

  // ✅ MAIN FIX: Target the review BODY text specifically
  // Flipkart stores actual review text in nested spans/divs
  const reviewContainers = document.querySelectorAll("div._27M-vq, div.row, div._1PBCrt");
  
  console.log(`🔍 Found ${reviewContainers.length} review containers`);
  
  let allReviews = [];
  
  reviewContainers.forEach((container, index) => {
    // Look for the review text inside each container
    const reviewTextElements = container.querySelectorAll("div.t-ZTKy, div._6K-7Co, div.ZmyHeo, span[class*='review']");
    
    reviewTextElements.forEach(el => {
      const text = cleanText(el.innerText || el.textContent);
      
      // Filter criteria for real reviews
      if (text && 
          text.length > 20 && 
          text.length < 1000 &&
          !text.toLowerCase().includes("helpful") &&
          !text.includes("★") &&
          !text.includes("Verified Purchase") &&
          !text.includes("READ LESS") &&
          !text.match(/^\d+\s*(year|month|day)s? ago$/i)) {
        
        console.log(`📝 Review ${allReviews.length + 1}: ${text.substring(0, 80)}...`);
        allReviews.push(text);
      }
    });
    
    // Also try to get text directly from paragraphs in the container
    if (reviewTextElements.length === 0) {
      const paragraphs = container.querySelectorAll("p, div");
      paragraphs.forEach(p => {
        const text = cleanText(p.innerText);
        if (text && text.length > 30 && text.length < 500) {
          // Check if it looks like a review
          const words = text.split(' ');
          if (words.length > 5 && !text.includes("₹")) {
            allReviews.push(text);
          }
        }
      });
    }
  });
  
  // ✅ ALTERNATIVE METHOD: Try getting ALL text that looks like reviews
  if (allReviews.length === 0) {
    console.log("🔄 Trying alternative extraction method...");
    
    // Get all text nodes on the page that might be reviews
    const allTextElements = document.querySelectorAll("div, p, span");
    const potentialReviews = [];
    
    allTextElements.forEach(el => {
      const text = cleanText(el.innerText);
      // Check if text looks like a review (not too short, not too long)
      if (text && 
          text.length > 30 && 
          text.length < 800 &&
          text.includes(" ") && // Has multiple words
          !text.includes("★") &&
          !text.includes("Helpful") &&
          !text.match(/^[0-9\s]*$/) && // Not just numbers
          !text.includes("Flipkart")) {
        
        potentialReviews.push(text);
      }
    });
    
    // Remove duplicates and take top 30
    allReviews = [...new Set(potentialReviews)].slice(0, 30);
  }
  
  // Remove duplicates and limit
  let reviews = [...new Set(allReviews)].slice(0, 30);
  
  console.log(`✅ Extracted ${reviews.length} reviews`);
  if (reviews.length > 0) {
    console.log("Sample review:", reviews[0].substring(0, 100));
  }
  
  return { title, price, reviews };
}

function extractFlipkartProductPage() {
  console.log("🛒 Extracting from Flipkart PRODUCT page");
  
  const title = document.querySelector("span.B_NuCI")?.innerText?.trim() || "";
  const priceText = document.querySelector("div._30jeq3")?.innerText || "";
  const price = Number(priceText.replace(/[^0-9.]/g, "")) || 0;

  // Expand reviews on product page too
  expandAllReadMore();
  
  const reviewElements = document.querySelectorAll("div.t-ZTKy, div.ZmyHeo, div._6K-7Co, div._27M-vq");
  
  console.log(`🔍 Found ${reviewElements.length} review elements`);
  
  const reviews = Array.from(reviewElements)
    .map((el) => cleanText(el.innerText))
    .filter((t) => t.length > 30 && 
                   !t.toLowerCase().includes("read more") &&
                   !t.includes("★"));

  console.log(`✅ Extracted ${reviews.length} reviews`);
  
  return { title, price, reviews };
}

// [Keep Amazon and Generic functions same as before]
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

    console.log("✅ Consia extracted:", {
      title: payload.title.substring(0, 50) + "...",
      price: payload.price,
      reviewCount: payload.reviews.length
    });
    
    if (payload.reviews.length === 0) {
      console.warn("⚠️ NO REVIEWS EXTRACTED! Running debug...");
      
      // Quick debug - show structure
      const containers = document.querySelectorAll('div[class]');
      console.log(`Total div elements: ${containers.length}`);
      
      // Look for any text that might be reviews
      const allText = document.body.innerText;
      const sentences = allText.split(/[.!?]+/).filter(s => s.length > 30);
      console.log(`Found ${sentences.length} potential review sentences`);
      
      if (sentences.length > 0) {
        console.log("Sample sentences:", sentences.slice(0, 3));
        // Use some of these as fallback
        payload.reviews = sentences.slice(0, 10)
          .filter(s => !s.includes("★") && !s.includes("Helpful"));
      }
    }

    sendResponse(payload);
    return true; // Keep message channel open
  }
});

console.log("✅ Consia ready to extract data");