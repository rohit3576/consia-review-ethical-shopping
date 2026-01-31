from flask import Flask, request, jsonify
from flask_cors import CORS

from services.analyzer import analyze_product

app = Flask(__name__)
CORS(app)  # allow extension requests

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Consia backend running ✅"})


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()

    # product payload from extension
    product_title = data.get("title", "")
    price = data.get("price", 0)
    reviews = data.get("reviews", [])

    result = analyze_product(product_title, price, reviews)
    return jsonify(result)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
