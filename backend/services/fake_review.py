# backend/services/fake_review.py - ML VERSION
import joblib
import os
import re

class FakeDetectorML:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.load_models()
    
    def load_models(self):
        """Load trained fake detection models"""
        try:
            model_path = "backend/ml/fake_model.pkl"
            vectorizer_path = "backend/ml/fake_vectorizer.pkl"
            
            if os.path.exists(model_path) and os.path.exists(vectorizer_path):
                self.model = joblib.load(model_path)
                self.vectorizer = joblib.load(vectorizer_path)
                print("✅ Fake detection model loaded")
                return True
        except Exception as e:
            print(f"❌ Error loading fake detector: {e}")
        
        self.model = None
        self.vectorizer = None
        return False
    
    def detect_ml(self, text):
        """Detect fake review using ML"""
        if self.model and self.vectorizer:
            try:
                text_vec = self.vectorizer.transform([text])
                prediction = self.model.predict(text_vec)[0]
                proba = self.model.predict_proba(text_vec)[0]
                
                # 1 = fake, 0 = real
                is_fake = bool(prediction)
                confidence = float(proba[1] if is_fake else proba[0])
                
                return {
                    "is_fake": is_fake,
                    "confidence": confidence,
                    "method": "ml_model",
                    "score": confidence * 100
                }
            except Exception as e:
                print(f"❌ ML fake detection error: {e}")
        
        return None
    
    def detect_rules(self, text):
        """Rule-based fake detection"""
        score = 0
        reasons = []
        
        # Rule 1: Very short (less than 5 words)
        words = text.split()
        if len(words) < 5:
            score += 30
            reasons.append("Too short (<5 words)")
        
        # Rule 2: Excessive punctuation
        excl_count = text.count('!') + text.count('?')
        if excl_count > 2:
            score += min(40, excl_count * 15)
            reasons.append(f"Excessive punctuation ({excl_count})")
        
        # Rule 3: Repeated words/phrases
        for word in words:
            if words.count(word) > 2 and len(word) > 3:
                score += 20
                reasons.append(f"Repeated word: '{word}'")
                break
        
        # Rule 4: Common fake phrases
        fake_phrases = [
            "best product ever", "must buy", "highly recommend",
            "love it", "excellent", "amazing", "awesome", "perfect"
        ]
        text_lower = text.lower()
        for phrase in fake_phrases:
            if phrase in text_lower:
                score += 15
                reasons.append(f"Common fake phrase")
                break
        
        # Normalize score
        final_score = min(100, score)
        is_fake = final_score > 50
        
        return {
            "is_fake": is_fake,
            "score": final_score,
            "confidence": final_score / 100,
            "method": "rule_based",
            "reasons": reasons
        }

# Global detector
fake_detector = FakeDetectorML()
fake_ml_loaded = fake_detector.load_models()

def fake_review_score(reviews):
    """Calculate fake review percentage"""
    if not reviews:
        return 0
    
    fake_count = 0
    analyzed_count = 0
    
    for review in reviews:
        if len(review.strip()) < 10:  # Skip very short
            continue
        
        # Try ML detection
        if fake_ml_loaded:
            result = fake_detector.detect_ml(review)
            if not result:
                result = fake_detector.detect_rules(review)
        else:
            result = fake_detector.detect_rules(review)
        
        if result and result["is_fake"]:
            fake_count += 1
        
        analyzed_count += 1
        
        if analyzed_count >= 30:  # Limit for performance
            break
    
    if analyzed_count == 0:
        return 0
    
    fake_percent = (fake_count / analyzed_count) * 100
    return round(fake_percent, 1)