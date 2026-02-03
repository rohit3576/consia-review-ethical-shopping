# backend/ml/train_fake_detector.py
import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

print("🚀 Training Consia Fake Review Detector...")

# Create fake/real review dataset
data = {
    "text": [
        # Fake reviews (often repetitive, excessive punctuation)
        "Best product ever!!!", "Amazing!!! Must buy!!", 
        "Love it love it love it!", "Perfect perfect perfect!",
        "Excellent!! 5 stars!", "Awesome product!!!",
        "Worth every penny!!", "Superb quality!!!",
        "Highly recommend!!!", "Outstanding!!!",
        "Fantastic!!!", "Great!! Very nice!!",
        
        # Real reviews (more varied, detailed)
        "The product is good but the battery life could be better.",
        "Received damaged. Customer service was helpful though.",
        "Good for the price but not excellent quality.",
        "Works as expected, no issues so far.",
        "Took 5 days to deliver, product is okay.",
        "The color is different from the picture but quality is fine.",
        "Not satisfied with the performance, returning it.",
        "Average product, does the job but nothing special.",
        "Better than I expected, worth the money.",
        "The instructions were unclear but figured it out.",
        "Good value, but the size is smaller than expected.",
        "Works well for basic tasks but not for heavy use."
    ],
    "label": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,  # 1 = fake
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]   # 0 = real
}

df = pd.DataFrame(data)
print(f"📊 Dataset: {len(df)} reviews")
print(f"   Fake: {sum(df['label'] == 1)}")
print(f"   Real: {sum(df['label'] == 0)}")

X = df["text"]
y = df["label"]

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Vectorizer
vectorizer = TfidfVectorizer(stop_words="english", max_features=1000)
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# Model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train_vec, y_train)

# Evaluate
y_pred = model.predict(X_test_vec)
print(f"✅ Accuracy: {accuracy_score(y_test, y_pred):.2%}")
print("\n📊 Classification Report:")
print(classification_report(y_test, y_pred))

# Save model
os.makedirs("backend/ml", exist_ok=True)
joblib.dump(model, "backend/ml/fake_model.pkl")
joblib.dump(vectorizer, "backend/ml/fake_vectorizer.pkl")

print("\n💾 Model saved:")
print("   - backend/ml/fake_model.pkl")
print("   - backend/ml/fake_vectorizer.pkl")