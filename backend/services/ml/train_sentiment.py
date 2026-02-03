# backend/ml/train_sentiment.py
import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

print("🚀 Training Consia ML Sentiment Model...")

# Create sample dataset (you can replace with real dataset later)
data = {
    "text": [
        # Positive reviews
        "Great product! Very happy with purchase.", "Excellent quality, worth the money.",
        "Good value for money.", "Amazing! Best purchase this year.",
        "Works perfectly, very satisfied.", "High quality materials, durable.",
        "Love it! Exceeded expectations.", "Good for the price point.",
        "Perfect! Exactly what I needed.", "Reliable product, good performance.",
        "Very nice product, works well.", "Good battery life, recommend.",
        "Satisfied customer, good experience.", "Better than expected.",
        "Worth every penny, happy buyer.", "Quality is impressive.",
        "Easy to use, good instructions.", "Fast delivery, good packaging.",
        "Happy with the purchase decision.", "Meets all expectations.",
        
        # Negative reviews
        "Worst product ever, don't buy.", "Terrible experience, broke immediately.",
        "Poor quality, not recommended.", "Disappointed, not as described.",
        "Complete waste of money.", "Fake product, received damaged.",
        "Regret buying this product.", "Not worth it, many issues.",
        "Bad quality, stopped working.", "Scam! Avoid this product.",
        "Very bad experience, returning.", "Doesn't work as advertised.",
        "Poor customer service.", "Overpriced for the quality.",
        "Defective item, be careful.", "Not reliable, broke quickly.",
        "Waste of time and money.", "Fake reviews on this product.",
        "Terrible battery life.", "Wrong item delivered."
    ],
    "label": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
}

df = pd.DataFrame(data)
print(f"📊 Created dataset: {len(df)} reviews")
print(f"   Positive (1): {sum(df['label'] == 1)}")
print(f"   Negative (0): {sum(df['label'] == 0)}")

X = df["text"]
y = df["label"]

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Vectorizer
vectorizer = TfidfVectorizer(stop_words="english", max_features=2000)
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# Model
model = LogisticRegression(max_iter=1000, random_state=42)
model.fit(X_train_vec, y_train)

# Evaluate
y_pred = model.predict(X_test_vec)
print(f"✅ Accuracy: {accuracy_score(y_test, y_pred):.2%}")
print("\n📊 Classification Report:")
print(classification_report(y_test, y_pred))

# Save model
os.makedirs("backend/ml", exist_ok=True)
joblib.dump(model, "backend/ml/sentiment_model.pkl")
joblib.dump(vectorizer, "backend/ml/sentiment_vectorizer.pkl")

print("\n💾 Model saved:")
print("   - backend/ml/sentiment_model.pkl")
print("   - backend/ml/sentiment_vectorizer.pkl")

# Test predictions
print("\n🔍 Sample Predictions:")
test_samples = [
    "This is amazing! Love it!",
    "Terrible product, waste of money",
    "Good but not great",
    "Excellent quality!"
]

for sample in test_samples:
    sample_vec = vectorizer.transform([sample])
    pred = model.predict(sample_vec)[0]
    proba = model.predict_proba(sample_vec)[0]
    sentiment = "👍 POSITIVE" if pred == 1 else "👎 NEGATIVE"
    confidence = proba[1] if pred == 1 else proba[0]
    print(f"  '{sample}' → {sentiment} ({confidence:.1%})")