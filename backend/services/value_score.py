def value_for_money_score(price, positive_percent, fake_percent):
    """
    Simple scoring:
    - More positive sentiment increases score
    - More fake reviews decreases score
    - Higher price slightly decreases score
    """

    if price is None:
        price = 0

    score = positive_percent

    # penalize fake reviews
    score -= (fake_percent * 1.2)

    # penalize high price
    if price > 5000:
        score -= 10
    if price > 20000:
        score -= 15

    # keep score between 0-100
    score = max(0, min(100, score))
    return round(score, 2)
