from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import os

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
models_path = os.path.join(script_dir, 'models')

print("="*60)
print("🚀 STARTING MENTAL HEALTH PREDICTION API")
print("="*60)

# ========================================
# LOAD YOUR TRAINED MODEL
# ========================================

model = None
scaler = None
feature_columns = None

try:
    # Load your trained XGBoost model
    model = joblib.load(os.path.join(models_path, 'model.pkl'))
    print(f"✅ Loaded XGBoost model (99% accuracy)")
    
    # Load scaler
    scaler = joblib.load(os.path.join(models_path, 'scaler.pkl'))
    print(f"✅ Loaded scaler")
    
    # Load feature columns
    feature_columns = joblib.load(os.path.join(models_path, 'feature_columns.pkl'))
    print(f"✅ Model expects {len(feature_columns)} features")
    
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None
    scaler = None
    feature_columns = None

# ========================================
# HELPER FUNCTION: Prepare Input Data
# ========================================

def prepare_features(data):
    """Convert incoming JSON to model features"""
    # Create dataframe with all required features
    input_dict = {}
    
    # Set default values for all features
    for col in feature_columns:
        input_dict[col] = 0
    
    # Map incoming data to features
    # Numeric fields
    if 'age' in data:
        input_dict['age'] = float(data['age'])
    if 'study_hours' in data:
        input_dict['study_hours'] = float(data['study_hours'])
    if 'sleep_hours' in data:
        input_dict['sleep_hours'] = float(data['sleep_hours'])
    if 'physical_activity' in data:
        input_dict['physical_activity'] = float(data['physical_activity'])
    if 'phq9_total' in data:
        input_dict['phq9_total'] = float(data['phq9_total'])
    if 'gad7_total' in data:
        input_dict['gad7_total'] = float(data['gad7_total'])
    
    # Map PHQ-9 individual answers
    for i in range(1, 10):
        key = f'phq9_q{i}'
        if key in data:
            input_dict[key] = float(data[key])
    
    # Map GAD-7 individual answers
    for i in range(1, 8):
        key = f'gad7_q{i}'
        if key in data:
            input_dict[key] = float(data[key])
    
    # Categorical fields (encode as numbers)
    gender_map = {'Female': 0, 'Male': 1, 'Prefer not to say': 2}
    if 'gender' in data:
        input_dict['gender'] = gender_map.get(data['gender'], 0)
    
    year_map = {'100L': 0, '200L': 1, '300L': 2, '400L': 3, '500L': 4, '600L': 5}
    if 'year_of_study' in data:
        input_dict['year_of_study'] = year_map.get(data['year_of_study'], 3)
    
    standing_map = {'Excellent': 1, 'Good': 2, 'Average': 0, 'Not Applicable': 3}
    if 'academic_standing' in data:
        input_dict['academic_standing'] = standing_map.get(data['academic_standing'], 1)
    
    stress_map = {'Low': 1, 'Moderate': 2, 'High': 0}
    if 'academic_stress' in data:
        input_dict['academic_stress'] = stress_map.get(data['academic_stress'], 2)
    if 'financial_stress' in data:
        input_dict['financial_stress'] = stress_map.get(data['financial_stress'], 2)
    
    belonging_map = {'High': 0, 'Low': 1, 'Moderate': 2}
    if 'sense_of_belonging' in data:
        input_dict['sense_of_belonging'] = belonging_map.get(data['sense_of_belonging'], 2)
    
    if 'social_support' in data:
        input_dict['social_support'] = belonging_map.get(data['social_support'], 2)
    
    # Create dataframe
    input_df = pd.DataFrame([input_dict])
    input_df = input_df[feature_columns]
    
    return input_df

# ========================================
# API ENDPOINTS
# ========================================

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'model_accuracy': '99.09%',
        'message': 'Mental Health Prediction API is running with trained XGBoost model'
    })

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if model is None or scaler is None or feature_columns is None:
            return jsonify({
                'success': False,
                'error': 'Model not loaded'
            }), 500
        
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        print(f"\n📊 Prediction request:")
        print(f"   Age: {data.get('age', 'N/A')}")
        print(f"   PHQ-9: {data.get('phq9_total', 'N/A')}")
        print(f"   GAD-7: {data.get('gad7_total', 'N/A')}")
        
        # Prepare features
        input_df = prepare_features(data)
        
        # Scale features
        input_scaled = scaler.transform(input_df)
        
        # Make prediction
        prediction = model.predict(input_scaled)[0]
        probabilities = model.predict_proba(input_scaled)[0]
        
        # Map prediction to risk level
        risk_map = {0: 'High Risk', 1: 'Low Risk', 2: 'Moderate Risk'}
        risk_level = risk_map.get(prediction, 'Unknown')
        
        print(f"   ✅ Prediction: {risk_level}")
        
        return jsonify({
            'success': True,
            'risk_level': risk_level,
            'risk_code': int(prediction),
            'phq9_total': data.get('phq9_total'),
            'gad7_total': data.get('gad7_total'),
            'probabilities': {
                'High Risk': float(probabilities[0]),
                'Low Risk': float(probabilities[1]),
                'Moderate Risk': float(probabilities[2])
            }
        })
        
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/model-info', methods=['GET'])
def model_info():
    return jsonify({
        'model_type': 'XGBoost',
        'accuracy': '99.09%',
        'features_expected': len(feature_columns) if feature_columns else 0,
        'status': 'ready'
    })

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