async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function setStatus(text) {
  document.getElementById("status").textContent = text;
}

function showResult(data) {
  document.getElementById("result").classList.remove("hidden");

  document.getElementById("recText").textContent = data.recommendation;
  document.getElementById("title").textContent = data.title || "-";
  document.getElementById("price").textContent = data.price ?? "-";

  document.getElementById("pos").textContent = data.sentiment?.positive_percent ?? 0;
  document.getElementById("neg").textContent = data.sentiment?.negative_percent ?? 0;
  document.getElementById("neu").textContent = data.sentiment?.neutral_percent ?? 0;
  document.getElementById("fake").textContent = data.fake_review_percent ?? 0;
  document.getElementById("value").textContent = data.value_score ?? 0;
}

document.getElementById("analyzeBtn").addEventListener("click", async () => {
  try {
    setStatus("Extracting product info…");

    const tab = await getActiveTab();

    const productData = await chrome.tabs.sendMessage(tab.id, { action: "extract" });

    if (!productData) {
      setStatus("❌ Could not extract data from this page.");
      return;
    }

    setStatus("Sending to Consia AI server…");

    const res = await fetch("http://127.0.0.1:5000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData)
    });

    const data = await res.json();
    setStatus("✅ Analysis complete!");
    showResult(data);

  } catch (err) {
    console.error(err);
    setStatus("❌ Error: Backend not reachable on http://127.0.0.1:5000");
  }
});
