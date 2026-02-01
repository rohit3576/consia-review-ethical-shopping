// extension/popup.js - ENHANCED VERSION
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function setStatus(text, type = "info") {
  const statusEl = document.getElementById("status");
  statusEl.textContent = text;
  
  // Color coding based on type
  statusEl.style.color = {
    "info": "#2196F3",
    "success": "#4CAF50",
    "error": "#f44336",
    "warning": "#FF9800"
  }[type] || "#2196F3";
}

function showResult(data) {
  document.getElementById("result").classList.remove("hidden");
  
  // Check if data is in new format or old format
  const isNewFormat = data.success !== undefined;
  
  if (isNewFormat && !data.success) {
    // Error in new format
    document.getElementById("recText").textContent = data.recommendation || "Analysis Failed";
    document.getElementById("title").textContent = data.product?.title || "Unknown";
    document.getElementById("price").textContent = data.product?.price || "-";
    
    // Set all metrics to 0
    document.getElementById("pos").textContent = "0";
    document.getElementById("neg").textContent = "0";
    document.getElementById("neu").textContent = "0";
    document.getElementById("fake").textContent = "0";
    document.getElementById("value").textContent = "0";
    
    // Show error message
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.innerHTML = `<p>${data.error || "Unknown error"}</p>`;
    document.getElementById("result").appendChild(errorDiv);
    return;
  }
  
  // Extract data based on format
  let recommendation, title, price, sentiment, fakePercent, valueScore, trueRating, pros, cons;
  
  if (isNewFormat) {
    // New format (with success field)
    recommendation = data.recommendation;
    title = data.product?.title || data.title;
    price = data.product?.price || data.price;
    sentiment = data.metrics?.sentiment || data.sentiment;
    fakePercent = data.metrics?.fake_reviews_percent || data.fake_review_percent;
    valueScore = data.metrics?.value_score || data.value_score;
    trueRating = data.metrics?.true_rating || data.true_rating;
    pros = data.insights?.pros || data.pros || [];
    cons = data.insights?.cons || data.cons || [];
  } else {
    // Old format
    recommendation = data.recommendation;
    title = data.title;
    price = data.price;
    sentiment = data.sentiment;
    fakePercent = data.fake_review_percent;
    valueScore = data.value_score;
    trueRating = data.true_rating || 0;
    pros = data.pros || [];
    cons = data.cons || [];
  }
  
  // Update basic info
  document.getElementById("recText").textContent = recommendation;
  document.getElementById("title").textContent = title || "-";
  document.getElementById("price").textContent = price ? `₹${price}` : "-";
  
  // Update sentiment metrics
  document.getElementById("pos").textContent = 
    (sentiment?.positive_percent || sentiment?.positive || 0).toFixed(1) + "%";
  document.getElementById("neg").textContent = 
    (sentiment?.negative_percent || sentiment?.negative || 0).toFixed(1) + "%";
  document.getElementById("neu").textContent = 
    (sentiment?.neutral_percent || sentiment?.neutral || 0).toFixed(1) + "%";
  
  // Update fake reviews and value score
  document.getElementById("fake").textContent = (fakePercent || 0).toFixed(1) + "%";
  document.getElementById("value").textContent = (valueScore || 0).toFixed(0);
  
  // Add True Rating if available
  if (trueRating && document.getElementById("trueRating")) {
    document.getElementById("trueRating").textContent = `${trueRating}/5`;
    updateStarRating(trueRating);
  } else if (trueRating) {
    // Create true rating element if it doesn't exist
    const ratingHtml = `
      <div class="metric-row">
        <span>⭐ True Rating:</span>
        <span id="trueRating">${trueRating}/5</span>
      </div>
    `;
    const valueRow = document.getElementById("value").closest('.metric-row');
    valueRow.insertAdjacentHTML('afterend', ratingHtml);
    updateStarRating(trueRating);
  }
  
  // Add Pros and Cons if available
  addProsCons(pros, cons);
  
  // Color code the recommendation
  colorCodeRecommendation(recommendation);
}

function updateStarRating(rating) {
  const starsContainer = document.getElementById("starsContainer");
  if (!starsContainer) return;
  
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  let starsHTML = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      starsHTML += '<span class="star full">★</span>';
    } else if (hasHalfStar && i === fullStars + 1) {
      starsHTML += '<span class="star half">★</span>';
    } else {
      starsHTML += '<span class="star empty">★</span>';
    }
  }
  
  starsContainer.innerHTML = starsHTML;
}

function addProsCons(pros, cons) {
  const prosContainer = document.getElementById("prosContainer");
  const consContainer = document.getElementById("consContainer");
  
  // Create containers if they don't exist
  if (!prosContainer && pros.length > 0) {
    const prosHtml = `
      <div class="insight-box">
        <h4>👍 Pros</h4>
        <ul id="prosContainer">
          ${pros.map(pro => `<li>${pro}</li>`).join('')}
        </ul>
      </div>
    `;
    document.getElementById("result").insertAdjacentHTML('beforeend', prosHtml);
  } else if (prosContainer) {
    prosContainer.innerHTML = pros.map(pro => `<li>${pro}</li>`).join('');
  }
  
  if (!consContainer && cons.length > 0) {
    const consHtml = `
      <div class="insight-box">
        <h4>👎 Cons</h4>
        <ul id="consContainer">
          ${cons.map(con => `<li>${con}</li>`).join('')}
        </ul>
      </div>
    `;
    document.getElementById("result").insertAdjacentHTML('beforeend', consHtml);
  } else if (consContainer) {
    consContainer.innerHTML = cons.map(con => `<li>${con}</li>`).join('');
  }
}

function colorCodeRecommendation(recommendation) {
  const recText = document.getElementById("recText");
  
  if (recommendation.includes("✅") || recommendation.includes("Worth Buying")) {
    recText.style.color = "#4CAF50";
    recText.style.fontWeight = "bold";
  } else if (recommendation.includes("⚠️") || recommendation.includes("Consider")) {
    recText.style.color = "#FF9800";
    recText.style.fontWeight = "bold";
  } else if (recommendation.includes("❌") || recommendation.includes("Not Recommended")) {
    recText.style.color = "#f44336";
    recText.style.fontWeight = "bold";
  }
}

document.getElementById("analyzeBtn").addEventListener("click", async () => {
  try {
    setStatus("Extracting product info…", "info");
    document.getElementById("analyzeBtn").disabled = true;
    
    // Clear previous results
    document.getElementById("result").classList.add("hidden");
    document.getElementById("result").innerHTML = `
      <div class="basic-info">
        <div class="metric-row">
          <span>Recommendation:</span>
          <span id="recText">-</span>
        </div>
        <div class="metric-row">
          <span>Title:</span>
          <span id="title">-</span>
        </div>
        <div class="metric-row">
          <span>Price:</span>
          <span id="price">-</span>
        </div>
      </div>
      <div class="metrics">
        <div class="metric-row">
          <span>✅ Positive:</span>
          <span id="pos">0%</span>
        </div>
        <div class="metric-row">
          <span>❌ Negative:</span>
          <span id="neg">0%</span>
        </div>
        <div class="metric-row">
          <span>😐 Neutral:</span>
          <span id="neu">0%</span>
        </div>
        <div class="metric-row">
          <span>🕵 Fake Reviews:</span>
          <span id="fake">0%</span>
        </div>
        <div class="metric-row">
          <span>💰 Value Score:</span>
          <span id="value">0/100</span>
        </div>
      </div>
      <div id="starsContainer" class="stars-container"></div>
      <div id="prosContainer" class="pros-container hidden"></div>
      <div id="consContainer" class="cons-container hidden"></div>
    `;

    const tab = await getActiveTab();
    
    // Check if we're on a supported website
    if (!tab.url.includes("flipkart") && !tab.url.includes("amazon")) {
      setStatus("⚠️ Please open Flipkart or Amazon product page", "warning");
      document.getElementById("analyzeBtn").disabled = false;
      return;
    }

    setStatus("Extracting reviews…", "info");
    
    const productData = await chrome.tabs.sendMessage(tab.id, { action: "extract" });

    if (!productData || !productData.reviews || productData.reviews.length === 0) {
      setStatus("❌ No reviews found on this page", "error");
      document.getElementById("analyzeBtn").disabled = false;
      return;
    }

    console.log("📦 Extracted data:", {
      title: productData.title,
      price: productData.price,
      reviewCount: productData.reviews.length,
      sampleReviews: productData.reviews.slice(0, 2)
    });

    setStatus("Analyzing with Consia AI…", "info");

    const res = await fetch("http://127.0.0.1:5000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: productData.title,
        price: productData.price,
        reviews: productData.reviews
      })
    });

    if (!res.ok) {
      throw new Error(`Backend error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    
    console.log("📊 Analysis result:", data);
    
    if (data.success === false) {
      throw new Error(data.error || "Analysis failed");
    }

    setStatus("✅ Analysis complete!", "success");
    showResult(data);

  } catch (err) {
    console.error("❌ Error:", err);
    
    // More specific error messages
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      setStatus("❌ Backend not reachable. Run: python app.py", "error");
    } else if (err.message.includes("Cannot read properties")) {
      setStatus("❌ Please refresh the page and try again", "error");
    } else {
      setStatus(`❌ ${err.message}`, "error");
    }
    
    // Show error in result area
    document.getElementById("result").classList.remove("hidden");
    document.getElementById("recText").textContent = "Analysis Failed";
    document.getElementById("recText").style.color = "#f44336";
    
  } finally {
    document.getElementById("analyzeBtn").disabled = false;
  }
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Consia popup loaded");
});