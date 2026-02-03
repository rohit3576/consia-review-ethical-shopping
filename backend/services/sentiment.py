# backend/services/sentiment.py - ML VERSION
import joblib
import os
from textblob import TextBlob

class SentimentML:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.load_models()
    
    def load_models(self):
        """Load trained ML models"""
        try:
            model_path = "backend/ml/sentiment_model.pkl"
            vectorizer_path = "backend/ml/sentiment_vectorizer.pkl"
            
            if os.path.exists(model_path) and os.path.exists(vectorizer_path):
                self.model = joblib.load(model_path)
                self.vectorizer = joblib.load(vectorizer_path)
                print("✅ ML Sentiment model loaded")
                return True
        except Exception as e:
            print(f"❌ Error loading ML model: {e}")
        
        self.model = None
        self.vectorizer = None
        return False
    
    def predict_ml(self, text):
        """Predict sentiment using ML model"""
        if self.model and self.vectorizer:
            try:
                text_vec = self.vectorizer.transform([text])
                prediction = self.model.predict(text_vec)[0]
                proba = self.model.predict_proba(text_vec)[0]
                
                # 1 = positive, 0 = negative
                if prediction == 1:
                    return {"sentiment": "positive", "confidence": float(proba[1])}
                else:
                    return {"sentiment": "negative", "confidence": float(proba[0])}
            except Exception as e:
                print(f"❌ ML prediction error: {e}")
        
        return None
    
    def predict_textblob(self, text):
        """Predict sentiment using TextBlob (fallback)"""
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        
        if polarity > 0.1:
            return {"sentiment": "positive", "confidence": (polarity + 1) / 2}
        elif polarity < -0.1:
            return {"sentiment": "negative", "confidence": (-polarity + 1) / 2}
        else:
            return {"sentiment": "neutral", "confidence": 0.5}

# Create global analyzer
ml_analyzer = SentimentML()
ml_loaded = ml_analyzer.load_models()

def get_sentiment_report(reviews):
    """Get sentiment analysis report - uses ML if available"""
    if not reviews:
        return {
            "total_reviews": 0,
            "positive_percent": 0,
            "negative_percent": 0,
            "neutral_percent": 0,
            "method": "none"
        }
    
    pos_count = 0
    neg_count = 0
    neu_count = 0
    method_used = "textblob"  # default
    
    for review in reviews:
        # Try ML first
        if ml_loaded:
            result = ml_analyzer.predict_ml(review)
            if result:
                method_used = "ml_model"
            else:
                result = ml_analyzer.predict_textblob(review)
        else:
            result = ml_analyzer.predict_textblob(review)
        
        # Count based on prediction
        if result["sentiment"] == "positive":
            pos_count += 1
        elif result["sentiment"] == "negative":
            neg_count += 1
        else:
            neu_count += 1
    
    total = len(reviews)
    
    return {
        "total_reviews": total,
        "positive_percent": round((pos_count / total) * 100, 1),
        "negative_percent": round((neg_count / total) * 100, 1),
        "neutral_percent": round((neu_count / total) * 100, 1),
        "positive_count": pos_count,
        "negative_count": neg_count,
        "neutral_count": neu_count,
        "method": method_used
    }