# backend/services/analyzer.py - ENHANCED VERSION
from services.sentiment import get_sentiment_report
from services.fake_review import fake_review_score
from services.value_score import value_for_money_score
from textblob import TextBlob
import re

def extract_key_phrases(reviews, sentiment_type="positive"):
    """Extract key phrases from reviews for Pros/Cons"""
    key_phrases = []
    
    # Keywords for pros and cons
    positive_keywords = ['good', 'great', 'excellent', 'awesome', 'best', 'love', 
                         'perfect', 'amazing', 'worth', 'recommend', 'satisfied',
                         'happy', 'value', 'quality', 'comfortable', 'nice']
    
    negative_keywords = ['bad', 'poor', 'worst', 'waste', 'issue', 'problem',
                         'disappointed', 'terrible', 'avoid', "don't buy", 'not good',
                         'broken', 'defective', 'faulty', 'return', 'complaint']
    
    target_keywords = positive_keywords if sentiment_type == "positive" else negative_keywords
    
    for review in reviews:
        # Clean the review
        review = review[:500]  # Limit length for processing
        
        # Get sentences
        sentences = re.split(r'[.!?]+', review)
        
        for sentence in sentences:
            sentence = sentence.strip()
            if 20 < len(sentence) < 150:  # Reasonable sentence length
                # Check for keywords
                if any(keyword in sentence.lower() for keyword in target_keywords):
                    # Use TextBlob to check sentiment
                    blob = TextBlob(sentence)
                    sentiment = blob.sentiment.polarity
                    
                    # Validate sentiment matches type
                    if (sentiment_type == "positive" and sentiment > 0.1) or \
                       (sentiment_type == "negative" and sentiment < -0.1):
                        
                        # Make the phrase presentable
                        phrase = sentence.capitalize()
                        if not phrase.endswith('.'):
                            phrase += '.'
                        
                        key_phrases.append(phrase)
    
    # Remove duplicates while preserving order
    seen = set()
    unique_phrases = []
    for phrase in key_phrases:
        if phrase not in seen:
            seen.add(phrase)
            unique_phrases.append(phrase)
    
    return unique_phrases[:3]  # Return top 3

def calculate_true_rating(sentiment_score, fake_percent, review_count):
    """Calculate a true rating (1-5 stars) based on sentiment, fake reviews, and data quality"""
    
    # Base rating from sentiment (0-100% to 1-5 stars)
    base_rating = 1 + (sentiment_score / 100) * 4
    
    # Penalty for fake reviews (up to 1.5 stars)
    fake_penalty = (fake_percent / 100) * 1.5
    
    # Bonus for having enough reviews
    review_bonus = min(0.5, review_count / 100)  # Up to 0.5 bonus
    
    # Calculate final rating
    true_rating = base_rating - fake_penalty + review_bonus
    
    # Clamp between 1 and 5
    true_rating = max(1.0, min(5.0, true_rating))
    
    # Round to 1 decimal place
    return round(true_rating, 1)

def analyze_product(title, price, reviews):
    if not reviews:
        return {
            "title": title,
            "recommendation": "Not Enough Data ❓",
            "reason": "No reviews found for analysis",
            "sentiment": {},
            "fake_review_percent": 0,
            "value_score": 0,
            "true_rating": 0,
            "pros": [],
            "cons": []
        }

    # Get basic analysis
    sentiment = get_sentiment_report(reviews)
    fake_percent = fake_review_score(reviews)
    value_score = value_for_money_score(price, sentiment["positive_percent"], fake_percent)
    
    # NEW: Calculate true rating
    true_rating = calculate_true_rating(
        sentiment["positive_percent"], 
        fake_percent,
        len(reviews)
    )
    
    # NEW: Extract pros and cons
    pros = extract_key_phrases(reviews, "positive")
    cons = extract_key_phrases(reviews, "negative")
    
    # IMPROVED DECISION LOGIC (More realistic thresholds)
    # Original was too strict: sentiment >= 70 and fake <= 15 and value >= 60
    
    positive_score = sentiment["positive_percent"]
    neutral_score = sentiment["neutral_percent"]
    
    # Decision matrix
    if positive_score >= 60 and fake_percent <= 25 and value_score >= 40:
        recommendation = "✅ Worth Buying"
        confidence = "High"
    elif positive_score >= 50 and fake_percent <= 30 and value_score >= 35:
        recommendation = "✅ Worth Buying"
        confidence = "Moderate"
    elif positive_score >= 40 and neutral_score >= 30 and fake_percent <= 35:
        recommendation = "⚠️ Consider Alternatives"
        confidence = "Low"
    else:
        recommendation = "❌ Not Recommended"
        confidence = "Low"
    
    # Add special cases
    if fake_percent > 40:
        recommendation = "❌ High Fake Reviews Detected"
        confidence = "High"
    elif len(reviews) < 5:
        recommendation = "⚠️ Limited Reviews Available"
        confidence = "Low"
    
    return {
        "title": title,
        "price": price,
        "recommendation": recommendation,
        "confidence": confidence,  # NEW
        "sentiment": sentiment,
        "fake_review_percent": fake_percent,
        "value_score": value_score,
        "true_rating": true_rating,  # NEW
        "pros": pros,  # NEW
        "cons": cons,  # NEW
        "review_count": len(reviews),  # NEW
        "analysis_summary": generate_summary(recommendation, positive_score, fake_percent, true_rating)  # NEW
    }

def generate_summary(recommendation, positive_score, fake_percent, true_rating):
    """Generate a human-readable summary"""
    if "Worth Buying" in recommendation:
        return f"Product has {positive_score}% positive reviews with a {true_rating}⭐ rating. Good value for money."
    elif "Consider" in recommendation:
        return f"Mixed reviews ({positive_score}% positive). Consider checking alternatives."
    else:
        return f"Low recommendation due to {fake_percent}% potential fake reviews or poor sentiment."