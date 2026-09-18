import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import xgboost as xgb
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import StackingClassifier
import joblib
import warnings
warnings.filterwarnings('ignore')

print("="*60)
print("TRAINING MENTAL HEALTH PREDICTION MODEL")
print("="*60)

# ========================================
# LOAD COMBINED DATASET
# ========================================

df = pd.read_csv('data/combined_dataset.csv')
print(f"✅ Loaded {len(df)} total samples (47 real + 500 synthetic)")

# ========================================
# PREPARE FEATURES
# ========================================

print("\n" + "="*60)
print("Preparing features for training")
print("="*60)

# Define feature columns (exclude target and identifier columns)
exclude_cols = ['risk_level', 'Timestamp']
feature_cols = [col for col in df.columns if col not in exclude_cols]

print(f"📊 Using {len(feature_cols)} features")

# Separate features and target
X = df[feature_cols].copy()
y = df['risk_level'].copy()

# Encode categorical variables
categorical_cols = X.select_dtypes(include=['object']).columns.tolist()
print(f"📊 Categorical columns to encode: {categorical_cols}")

for col in categorical_cols:
    le = LabelEncoder()
    X[col] = le.fit_transform(X[col].astype(str))
    print(f"   Encoded {col}")

# Encode target
target_encoder = LabelEncoder()
y_encoded = target_encoder.fit_transform(y)
print(f"\n🎯 Target encoding:")
for i, label in enumerate(target_encoder.classes_):
    print(f"   {label} → {i}")

# ========================================
# SPLIT DATA
# ========================================

print("\n" + "="*60)
print("Splitting data (80% train, 20% test)")
print("="*60)

X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)

print(f"📊 Train size: {len(X_train)}")
print(f"📊 Test size: {len(X_test)}")

# ========================================
# SCALE FEATURES
# ========================================

print("\n" + "="*60)
print("Scaling features")
print("="*60)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Save scaler
joblib.dump(scaler, 'models/scaler.pkl')
print(f"✅ Scaler saved to 'models/scaler.pkl'")

# ========================================
# TRAIN RANDOM FOREST
# ========================================

print("\n" + "="*60)
print("Training Random Forest Classifier...")
print("="*60)

rf_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42,
    class_weight='balanced'
)
rf_model.fit(X_train_scaled, y_train)

rf_train_acc = accuracy_score(y_train, rf_model.predict(X_train_scaled))
rf_test_acc = accuracy_score(y_test, rf_model.predict(X_test_scaled))

print(f"✅ Random Forest - Train Accuracy: {rf_train_acc:.4f}")
print(f"✅ Random Forest - Test Accuracy: {rf_test_acc:.4f}")

# ========================================
# TRAIN XGBOOST
# ========================================

print("\n" + "="*60)
print("Training XGBoost Classifier...")
print("="*60)

xgb_model = xgb.XGBClassifier(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    random_state=42,
    use_label_encoder=False,
    eval_metric='mlogloss'
)
xgb_model.fit(X_train_scaled, y_train)

xgb_train_acc = accuracy_score(y_train, xgb_model.predict(X_train_scaled))
xgb_test_acc = accuracy_score(y_test, xgb_model.predict(X_test_scaled))

print(f"✅ XGBoost - Train Accuracy: {xgb_train_acc:.4f}")
print(f"✅ XGBoost - Test Accuracy: {xgb_test_acc:.4f}")

# ========================================
# CREATE STACKING ENSEMBLE
# ========================================

print("\n" + "="*60)
print("Creating Stacking Ensemble (Random Forest + XGBoost)")
print("="*60)

stacking_model = StackingClassifier(
    estimators=[
        ('rf', rf_model),
        ('xgb', xgb_model)
    ],
    final_estimator=LogisticRegression(),
    cv=5
)
stacking_model.fit(X_train_scaled, y_train)

stack_train_acc = accuracy_score(y_train, stacking_model.predict(X_train_scaled))
stack_test_acc = accuracy_score(y_test, stacking_model.predict(X_test_scaled))

print(f"✅ Stacking Ensemble - Train Accuracy: {stack_train_acc:.4f}")
print(f"✅ Stacking Ensemble - Test Accuracy: {stack_test_acc:.4f}")

# ========================================
# SELECT BEST MODEL
# ========================================

print("\n" + "="*60)
print("Model Comparison")
print("="*60)

accuracies = {
    'Random Forest': rf_test_acc,
    'XGBoost': xgb_test_acc,
    'Stacking Ensemble': stack_test_acc
}

for name, acc in accuracies.items():
    print(f"   {name}: {acc:.4f}")

best_model_name = max(accuracies, key=accuracies.get)
print(f"\n🏆 BEST MODEL: {best_model_name} with accuracy {accuracies[best_model_name]:.4f}")

# Save the best model
if best_model_name == 'Random Forest':
    final_model = rf_model
elif best_model_name == 'XGBoost':
    final_model = xgb_model
else:
    final_model = stacking_model

joblib.dump(final_model, 'models/model.pkl')
print(f"✅ Final model saved to 'models/model.pkl'")

# ========================================
# DETAILED EVALUATION
# ========================================

print("\n" + "="*60)
print("Detailed Classification Report")
print("="*60)

y_pred = final_model.predict(X_test_scaled)

print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=target_encoder.classes_))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# ========================================
# CROSS-VALIDATION
# ========================================

print("\n" + "="*60)
print("5-Fold Cross-Validation")
print("="*60)

cv_scores = cross_val_score(final_model, X_train_scaled, y_train, cv=5)
print(f"Cross-validation scores: {cv_scores}")
print(f"Mean CV score: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")

# ========================================
# SAVE FEATURE COLUMNS FOR API
# ========================================

joblib.dump(feature_cols, 'models/feature_columns.pkl')
print(f"\n✅ Feature columns saved to 'models/feature_columns.pkl'")

# ========================================
# FINAL SUMMARY
# ========================================

print("\n" + "="*60)

print("TRAINING COMPLETE!")
print("="*60)
print(f"\n📊 Final model: {best_model_name}")
print(f"📊 Test accuracy: {accuracies[best_model_name]:.4f}")
print(f"📊 Model saved to: models/model.pkl")
print(f"📊 Scaler saved to: models/scaler.pkl")
print(f"📊 Feature columns saved to: models/feature_columns.pkl")
print("\n✅ Ready to deploy to Flask API!")
print("="*60)