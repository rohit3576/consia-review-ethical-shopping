import re


def fake_review_score(reviews):
    suspicious = 0

    for r in reviews:
        text = r.lower()

        # very short reviews are often useless/fake
        if len(text.split()) < 5:
            suspicious += 1
            continue

        # too many exclamation marks or repeated words
        if text.count("!") > 3:
            suspicious += 1
            continue

        if re.search(r"(best product ever|must buy|amazing|awesome awesome)", text):
            suspicious += 1
            continue

    total = len(reviews)
    return round((suspicious / total) * 100, 2)
