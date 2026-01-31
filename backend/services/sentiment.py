from textblob import TextBlob


def get_sentiment_report(reviews):
    pos, neg, neutral = 0, 0, 0

    for r in reviews:
        polarity = TextBlob(r).sentiment.polarity

        if polarity > 0.1:
            pos += 1
        elif polarity < -0.1:
            neg += 1
        else:
            neutral += 1

    total = len(reviews)

    return {
        "total_reviews": total,
        "positive_percent": round((pos / total) * 100, 2),
        "negative_percent": round((neg / total) * 100, 2),
        "neutral_percent": round((neutral / total) * 100, 2),
    }
