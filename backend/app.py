# backend/app.py - ENHANCED VERSION
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import logging
from services.analyzer import analyze_product

app = Flask(__name__)
CORS(app)  # allow extension requests

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok", 
        "message": "Consia backend running ✅",
        "version": "2.0",
        "timestamp": datetime.now().isoformat(),
        "features": ["sentiment", "fake_detection", "value_score", "true_rating", "pros_cons"]
    })


@app.route("/analyze", methods=["POST"])
def analyze():
    """Main analysis endpoint"""
    start_time = datetime.now()
    
    try:
        data = request.get_json()
        
        if not data:
            logger.warning("No data provided in request")
            return jsonify({
                "success": False,
                "error": "No data provided",
                "timestamp": datetime.now().isoformat()
            }), 400
        
        # Extract data with defaults
        product_title = data.get("title", "Unknown Product")
        price = data.get("price", 0)
        reviews = data.get("reviews", [])
        
        logger.info(f"🔍 Analyzing: {product_title[:60]}...")
        logger.info(f"💰 Price: ₹{price}")
        logger.info(f"📝 Reviews: {len(reviews)}")
        
        if not reviews:
            logger.warning("No reviews provided for analysis")
        
        # Analyze the product
        analysis = analyze_product(product_title, price, reviews)
        
        # Enhanced response format
        response = {
            "success": True,
            "recommendation": analysis.get("recommendation", "Analysis Failed"),
            "confidence": analysis.get("confidence", "Medium"),
            "summary": analysis.get("analysis_summary", ""),
            
            # Product info
            "product": {
                "title": analysis.get("title", product_title),
                "price": analysis.get("price", price),
                "review_count": analysis.get("review_count", len(reviews))
            },
            
            # Analysis metrics
            "metrics": {
                "sentiment": {
                    "positive": analysis.get("sentiment", {}).get("positive_percent", 0),
                    "negative": analysis.get("sentiment", {}).get("negative_percent", 0),
                    "neutral": analysis.get("sentiment", {}).get("neutral_percent", 0)
                },
                "fake_reviews_percent": analysis.get("fake_review_percent", 0),
                "value_score": analysis.get("value_score", 0),
                "true_rating": analysis.get("true_rating", 0)
            },
            
            # Insights
            "insights": {
                "pros": analysis.get("pros", []),
                "cons": analysis.get("cons", [])
            },
            
            # Metadata
            "timestamp": datetime.now().isoformat(),
            "processing_time_ms": (datetime.now() - start_time).total_seconds() * 1000,
            "version": "2.0"
        }
        
        logger.info(f"✅ Analysis complete: {analysis.get('recommendation', 'Unknown')}")
        logger.info(f"📊 Results - Sentiment: {analysis.get('sentiment', {}).get('positive_percent', 0)}% positive, "
                   f"Fake: {analysis.get('fake_review_percent', 0)}%, "
                   f"Rating: {analysis.get('true_rating', 0)}⭐")
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"❌ Analysis error: {str(e)}", exc_info=True)
        
        return jsonify({
            "success": False,
            "error": "Internal server error",
            "message": str(e),
            "recommendation": "Analysis Failed",
            "timestamp": datetime.now().isoformat()
        }), 500


@app.route("/batch-analyze", methods=["POST"])
def batch_analyze():
    """Optional: Endpoint for analyzing multiple products at once"""
    try:
        data = request.get_json()
        
        if not data or not isinstance(data, list):
            return jsonify({
                "success": False,
                "error": "Expected list of products",
                "timestamp": datetime.now().isoformat()
            }), 400
        
        results = []
        for product_data in data:
            title = product_data.get("title", "")
            price = product_data.get("price", 0)
            reviews = product_data.get("reviews", [])
            
            analysis = analyze_product(title, price, reviews)
            results.append({
                "title": title,
                "recommendation": analysis.get("recommendation", "Unknown"),
                "true_rating": analysis.get("true_rating", 0),
                "value_score": analysis.get("value_score", 0)
            })
        
        return jsonify({
            "success": True,
            "count": len(results),
            "results": results,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Batch analysis error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500


if __name__ == "__main__":
    logger.info("🚀 Starting Consia Backend Server v2.0...")
    logger.info("📡 Endpoints:")
    logger.info("  GET  /health        - Health check")
    logger.info("  POST /analyze       - Analyze single product")
    logger.info("  POST /batch-analyze - Analyze multiple products")
    logger.info("🌐 Server running on http://127.0.0.1:5000")
    
    app.run(host="127.0.0.1", port=5000, debug=True)