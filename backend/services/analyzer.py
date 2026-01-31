from services.sentiment import get_sentiment_report
from services.fake_review import fake_review_score
from services.value_score import value_for_money_score


def analyze_product(title, price, reviews):
    if not reviews:
        return {
            "title": title,
            "recommendation": "Not Enough Data ❓",
            "reason": "No reviews found for analysis",
            "sentiment": {},
            "fake_review_percent": 0,
            "value_score": 0
        }

    sentiment = get_sentiment_report(reviews)
    fake_percent = fake_review_score(reviews)
    value_score = value_for_money_score(price, sentiment["positive_percent"], fake_percent)

    # Decision logic
    if sentiment["positive_percent"] >= 70 and fake_percent <= 15 and value_score >= 60:
        recommendation = "✅ Worth Buying"
    else:
        recommendation = "❌ Not Recommended"

    return {
        "title": title,
        "price": price,
        "recommendation": recommendation,
        "sentiment": sentiment,
        "fake_review_percent": fake_percent,
        "value_score": value_score
    }
