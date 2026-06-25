from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import os

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Allow React to call this API

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
models_path = os.path.join(script_dir, 'models')

print("="*60)
print("🚀 STARTING MENTAL HEALTH PREDICTION API")
print("="*60)

# ========================================
# LOAD MODELS
# ========================================

try:
    # Load the pretrained models
    rf_model = joblib.load(os.path.join(models_path, 'random_forest_model.pkl'))
    xgb_model = joblib.load(os.path.join(models_path, 'xgboost_model.pkl'))
    scaler = joblib.load(os.path.join(models_path, 'scaler.pkl'))
    selected_features = joblib.load(os.path.join(models_path, 'selected_features.pkl'))
    
    print(f"✅ Loaded Random Forest model")
    print(f"✅ Loaded XGBoost model")
    print(f"✅ Loaded scaler")
    print(f"✅ Model expects {len(selected_features)} features: {selected_features}")
    
    # For now, we'll use Random Forest as the primary model
    model = rf_model
    print(f"✅ Using Random Forest as primary model")
    
except Exception as e:
    print(f"❌ Error loading models: {e}")
    print("   Make sure model files exist in 'models/' folder")
    model = None
    scaler = None
    selected_features = None

# ========================================
# HELPER FUNCTION: Map Form Data to Model Features
# ========================================

def map_form_to_model_features(data):
    """
    Map Google Form data to the features expected by the model.
    This will be improved when we have real Nigerian data.
    """
    # Initialize with default values
    features = {}
    
    # Set default values for all expected features
    for feature in selected_features:
        features[feature] = 0
    
    # Map age
    if 'age' in data:
        features['age'] = float(data['age'])
    
    # Map school_year (convert 100L→1, 200L→2, 300L→3, 400L→4)
    if 'year_of_study' in data:
        year_map = {'100L': 1, '200L': 2, '300L': 3, '400L': 4, '500L': 5, '600L': 6}
        year_str = data['year_of_study']
        features['school_year'] = year_map.get(year_str, 3)
    
    # Map PHQ-9 total score
    if 'phq9_total' in data:
        features['phq_score'] = float(data['phq9_total'])
    
    # Map GAD-7 total score
    if 'gad7_total' in data:
        features['gad_score'] = float(data['gad7_total'])
    
    # Set reasonable defaults for other features
    features['depressiveness'] = features['phq_score'] / 27 * 10
    features['anxiety_severity'] = features['gad_score'] / 21 * 10
    features['bmi'] = 22
    features['epworth_score'] = 8
    features['depression_severity'] = features['depressiveness']
    features['who_bmi'] = 1
    
    return features

# ========================================
# API ENDPOINTS
# ========================================

@app.route('/health', methods=['GET'])
def health_check():
    """Check if API is running"""
    return jsonify({
        'status': 'healthy',
        'message': 'Mental Health Prediction API is running',
        'model_loaded': model is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Predict mental health risk from assessment data"""
    try:
        # Check if model is loaded
        if model is None:
            return jsonify({
                'success': False,
                'error': 'Model not loaded. Please check server logs.'
            }), 500
        
        # Get data from request
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        print(f"\n📊 Received prediction request:")
        print(f"   Age: {data.get('age', 'N/A')}")
        print(f"   Year: {data.get('year_of_study', 'N/A')}")
        print(f"   PHQ-9: {data.get('phq9_total', 'N/A')}")
        print(f"   GAD-7: {data.get('gad7_total', 'N/A')}")
        
        # Map form data to model features
        features = map_form_to_model_features(data)
        
        # Create feature array in correct order
        feature_values = [features[f] for f in selected_features]
        feature_array = np.array([feature_values])
        
        # Scale features
        feature_scaled = scaler.transform(feature_array)
        
        # Make prediction
        prediction = model.predict(feature_scaled)[0]
        probabilities = model.predict_proba(feature_scaled)[0]
        
        # Map prediction to risk level
        risk_map = {0: 'Low Risk', 1: 'Moderate Risk', 2: 'High Risk'}
        risk_level = risk_map.get(prediction, 'Unknown')
        
        print(f"   ✅ Prediction: {risk_level}")
        
        return jsonify({
            'success': True,
            'risk_level': risk_level,
            'risk_code': int(prediction),
            'probabilities': {
                'Low Risk': float(probabilities[0]),
                'Moderate Risk': float(probabilities[1]) if len(probabilities) > 1 else 0,
                'High Risk': float(probabilities[2]) if len(probabilities) > 2 else 0
            }
        })
        
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get information about the loaded model"""
    return jsonify({
        'model_type': type(model).__name__ if model else 'Not loaded',
        'expected_features': selected_features if selected_features else [],
        'num_features': len(selected_features) if selected_features else 0
    })

# ========================================
# RUN THE API
# ========================================

if __name__ == '__main__':
    print("\n" + "="*60)
    print("API ENDPOINTS:")
    print("  GET  /health      - Check API status")
    print("  POST /predict     - Get risk prediction")
    print("  GET  /model-info  - Get model information")
    print("="*60)
    print("\n🚀 API running at: http://localhost:5000")
    print("="*60)
    
    app.run(host='0.0.0.0', port=5000, debug=True)