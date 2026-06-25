import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

print("="*60)
print("SYNTHETIC DATA GENERATION - 500 SAMPLES")
print("="*60)

# Load cleaned data
df_real = pd.read_csv('data/cleaned_responses.csv')
print(f"✅ Loaded {len(df_real)} real responses")

# ========================================
# CALCULATE STATISTICS FROM REAL DATA
# ========================================

print("\n" + "="*60)
print("Analyzing real data patterns")
print("="*60)

# Separate numeric and categorical columns
numeric_cols = df_real.select_dtypes(include=[np.number]).columns.tolist()
categorical_cols = df_real.select_dtypes(include=['object']).columns.tolist()

print(f"📊 Numeric features: {len(numeric_cols)}")
print(f"📊 Categorical features: {len(categorical_cols)}")

# Calculate statistics for numeric columns
stats = {}
for col in numeric_cols:
    stats[col] = {
        'mean': df_real[col].mean(),
        'std': df_real[col].std(),
        'min': df_real[col].min(),
        'max': df_real[col].max()
    }
    print(f"   {col}: mean={stats[col]['mean']:.2f}, std={stats[col]['std']:.2f}")

# Get value distributions for categorical columns
cat_distributions = {}
for col in categorical_cols:
    cat_distributions[col] = df_real[col].value_counts(normalize=True).to_dict()
    print(f"   {col}: {len(cat_distributions[col])} categories")

# ========================================
# GENERATE 500 SYNTHETIC SAMPLES
# ========================================

print("\n" + "="*60)
print("Generating 500 synthetic samples")
print("="*60)

num_synthetic = 500  # ← GENERATE 500 SAMPLES
synthetic_samples = []

for i in range(num_synthetic):
    synthetic = {}
    
    # Generate numeric features (add controlled noise)
    for col in numeric_cols:
        if col in stats:
            # Add 10-15% noise to create realistic variations
            noise_level = np.random.uniform(0.08, 0.15)
            noise = np.random.normal(0, stats[col]['std'] * noise_level)
            value = stats[col]['mean'] + noise
            
            # Clip to valid range
            value = max(stats[col]['min'], min(stats[col]['max'], value))
            
            # Keep original data type
            if df_real[col].dtype == 'int64':
                synthetic[col] = int(round(value))
            else:
                synthetic[col] = round(value, 2)
    
    # Generate categorical features (sample from real distributions)
    for col in categorical_cols:
        if col in cat_distributions:
            # Sample based on probability distribution
            categories = list(cat_distributions[col].keys())
            probabilities = list(cat_distributions[col].values())
            synthetic[col] = np.random.choice(categories, p=probabilities)
    
    # Ensure PHQ-9 and GAD-7 totals are consistent with individual answers
    # Recalculate totals from individual answers to ensure consistency
    phq9_cols = [f'phq9_q{i}' for i in range(1, 10)]
    if all(col in synthetic for col in phq9_cols):
        synthetic['phq9_total'] = sum(synthetic[col] for col in phq9_cols)
    
    gad7_cols = [f'gad7_q{i}' for i in range(1, 8)]
    if all(col in synthetic for col in gad7_cols):
        synthetic['gad7_total'] = sum(synthetic[col] for col in gad7_cols)
    
    # Recalculate risk level based on totals
    phq9 = synthetic.get('phq9_total', 0)
    gad7 = synthetic.get('gad7_total', 0)
    
    if phq9 >= 10 or gad7 >= 10:
        synthetic['risk_level'] = 'High Risk'
    elif phq9 >= 5 or gad7 >= 5:
        synthetic['risk_level'] = 'Moderate Risk'
    else:
        synthetic['risk_level'] = 'Low Risk'
    
    synthetic_samples.append(synthetic)

df_synthetic = pd.DataFrame(synthetic_samples)
print(f"✅ Generated {len(df_synthetic)} synthetic samples")

# ========================================
# VERIFY SYNTHETIC DATA QUALITY
# ========================================

print("\n" + "="*60)
print("Verifying synthetic data quality")
print("="*60)

# Check risk level distribution
real_dist = df_real['risk_level'].value_counts()
synth_dist = df_synthetic['risk_level'].value_counts()

print(f"\n📊 Real distribution:")
print(real_dist)
print(f"\n📊 Synthetic distribution:")
print(synth_dist)

# Check numeric ranges
print(f"\n📊 Numeric ranges comparison:")
for col in numeric_cols[:5]:  # Show first 5 numeric columns
    if col in df_synthetic.columns:
        print(f"   {col}: Real({df_real[col].min():.0f}-{df_real[col].max():.0f}) → Synthetic({df_synthetic[col].min():.0f}-{df_synthetic[col].max():.0f})")

# ========================================
# COMBINE REAL + SYNTHETIC
# ========================================

print("\n" + "="*60)
print("Combining datasets")
print("="*60)

df_combined = pd.concat([df_real, df_synthetic], ignore_index=True)
print(f"✅ Combined dataset: {len(df_combined)} total samples")
print(f"   Real: {len(df_real)}")
print(f"   Synthetic: {len(df_synthetic)}")

# ========================================
# SAVE COMBINED DATASET
# ========================================

print("\n" + "="*60)
print("Saving combined dataset")
print("="*60)

df_combined.to_csv('data/combined_dataset.csv', index=False)
print(f"✅ Saved to 'data/combined_dataset.csv'")
print(f"   File size: {len(df_combined)} rows × {len(df_combined.columns)} columns")

# ========================================
# SAVE SYNTHETIC ONLY (optional)
# ========================================

df_synthetic.to_csv('data/synthetic_only.csv', index=False)
print(f"✅ Saved synthetic-only to 'data/synthetic_only.csv'")

# ========================================
# FINAL SUMMARY
# ========================================

print("\n" + "="*60)
print("SYNTHETIC DATA GENERATION SUMMARY")
print("="*60)
print(f"\n📊 Final dataset: {len(df_combined)} samples")
print(f"   Features: {len(df_combined.columns)}")
print(f"\n📊 Risk level distribution in combined dataset:")
print(df_combined['risk_level'].value_counts())
print(f"\n📊 Percentage breakdown:")
for risk, count in df_combined['risk_level'].value_counts().items():
    pct = count / len(df_combined) * 100
    print(f"   {risk}: {count} ({pct:.1f}%)")
print("\n" + "="*60)
print("✅ SYNTHETIC DATA GENERATION COMPLETE!")
print("="*60)