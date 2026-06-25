import pandas as pd
import numpy as np
import re

print("="*60)
print("DATA CLEANING FOR NIGERIAN STUDENT DATA")
print("="*60)

# ========================================
# LOAD RAW DATA
# ========================================

df = pd.read_csv('data/raw_responses.csv')
print(f"✅ Loaded {len(df)} raw responses")
print(f"📊 Columns: {df.columns.tolist()}")

# ========================================
# FIX COLUMN NAMES
# ========================================

print("\n" + "="*60)
print("STEP 1: Fixing column names")
print("="*60)

# Fix typo in gender column
df.rename(columns={'Wat is your gender?': 'Gender'}, inplace=True)

# Simplify long column names for easier access
column_mapping = {
    'What is your age?': 'age',
    'Year of Study': 'year_of_study',
    'What is your faculty/Department': 'faculty',
    'What is your current CGPA or average percentage? (If applicable)\nLeave blank if your program doesn\'t use CGPA': 'cgpa_raw',
    'How would you describe your current academic standing?': 'academic_standing',
    'On average, how many hours do you study per day?': 'study_hours',
    'How would you rate your current academic stress level?': 'academic_stress',
    'On average, how many hours of sleep do you get per night?': 'sleep_hours',
    'How many days per week do you engage in physical activity (30+ minutes)': 'physical_activity',
    'How would you rate your current financial stress level?': 'financial_stress',
    'How would you rate your sense of belonging at your university?': 'sense_of_belonging',
    'How would you rate your social support system (family/friends)?': 'social_support'
}

df.rename(columns=column_mapping, inplace=True)

print("✅ Column names simplified")

# ========================================
# EXTRACT PHQ-9 ANSWERS (0-3 scale)
# ========================================

print("\n" + "="*60)
print("STEP 2: Extracting PHQ-9 answers (0-3 scale)")
print("="*60)

phq9_questions = [
    'Little interest or pleasure in doing things?',
    'Feeling down, depressed, or hopeless?',
    'Trouble falling or staying asleep, or sleeping too much?',
    'Feeling tired or having little energy?',
    'Poor appetite or overeating?',
    'Feeling bad about yourself — or that you are a failure or have let yourself or your family down?',
    'Trouble concentrating on things, such as reading or watching television?',
    'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?',
    'Thoughts that you would be better off dead, or of hurting yourself?'
]

def extract_phq9_value(text):
    """Extract numeric value from '1 - Several days' format"""
    if pd.isna(text):
        return 0
    text = str(text)
    match = re.search(r'^(\d+)', text)
    if match:
        return int(match.group(1))
    return 0

for i, question in enumerate(phq9_questions, 1):
    col_name = f'phq9_q{i}'
    df[col_name] = df[question].apply(extract_phq9_value)
    print(f"   PHQ-9 Q{i}: extracted values 0-3")

# Calculate PHQ-9 total
df['phq9_total'] = df[[f'phq9_q{i}' for i in range(1, 10)]].sum(axis=1)
print(f"\n✅ PHQ-9 total calculated: min={df['phq9_total'].min()}, max={df['phq9_total'].max()}, mean={df['phq9_total'].mean():.1f}")

# ========================================
# EXTRACT GAD-7 ANSWERS (0-3 scale)
# ========================================

print("\n" + "="*60)
print("STEP 3: Extracting GAD-7 answers (0-3 scale)")
print("="*60)

gad7_questions = [
    'Feeling nervous, anxious, or on edge?',
    'Not being able to stop or control worrying?',
    'Worrying too much about different things?',
    'Trouble relaxing?',
    'Being so restless that it is hard to sit still?',
    'Becoming easily annoyed or irritable?',
    'Feeling afraid as if something awful might happen?'
]

for i, question in enumerate(gad7_questions, 1):
    col_name = f'gad7_q{i}'
    df[col_name] = df[question].apply(extract_phq9_value)
    print(f"   GAD-7 Q{i}: extracted values 0-3")

# Calculate GAD-7 total
df['gad7_total'] = df[[f'gad7_q{i}' for i in range(1, 8)]].sum(axis=1)
print(f"\n✅ GAD-7 total calculated: min={df['gad7_total'].min()}, max={df['gad7_total'].max()}, mean={df['gad7_total'].mean():.1f}")

# ========================================
# CREATE RISK LEVEL
# ========================================

print("\n" + "="*60)
print("STEP 4: Creating risk level")
print("="*60)

def get_risk_level(phq9, gad7):
    if phq9 >= 10 or gad7 >= 10:
        return 'High Risk'
    elif phq9 >= 5 or gad7 >= 5:
        return 'Moderate Risk'
    else:
        return 'Low Risk'

df['risk_level'] = df.apply(lambda row: get_risk_level(row['phq9_total'], row['gad7_total']), axis=1)

print(df['risk_level'].value_counts())

# ========================================
# CLEAN YEAR OF STUDY
# ========================================

print("\n" + "="*60)
print("STEP 5: Cleaning year of study")
print("="*60)

def clean_year_of_study(value):
    if pd.isna(value):
        return 'Unknown'
    value = str(value)
    # Extract '400L', '300L', etc.
    match = re.search(r'(\d{3,4}L)', value)
    if match:
        return match.group(1)
    return value

df['year_of_study_clean'] = df['year_of_study'].apply(clean_year_of_study)
print(f"   Unique values: {df['year_of_study_clean'].unique().tolist()}")

# ========================================
# CLEAN CGPA/PERCENTAGE
# ========================================

print("\n" + "="*60)
print("STEP 6: Cleaning CGPA/Percentage")
print("="*60)

def clean_cgpa(value):
    if pd.isna(value) or value == '':
        return None
    value = str(value).strip()
    # If contains %, it's a percentage
    if '%' in value:
        # Extract number before %
        match = re.search(r'(\d+(?:\.\d+)?)', value)
        if match:
            # Convert percentage to 5.0 scale (70% = 3.5)
            pct = float(match.group(1))
            return round((pct / 100) * 5, 2)
    else:
        # Try to convert to float (CGPA)
        try:
            return float(value)
        except:
            return None
    return None

df['cgpa_clean'] = df['cgpa_raw'].apply(clean_cgpa)
print(f"   CGPA range: {df['cgpa_clean'].min():.2f} - {df['cgpa_clean'].max():.2f}")
print(f"   Missing CGPA: {df['cgpa_clean'].isna().sum()} students (likely medical)")

# ========================================
# CLEAN NUMERIC FIELDS
# ========================================

print("\n" + "="*60)
print("STEP 7: Cleaning numeric fields")
print("="*60)

# Clean study hours
df['study_hours_clean'] = pd.to_numeric(df['study_hours'].astype(str).str.strip(), errors='coerce')
print(f"   Study hours: mean={df['study_hours_clean'].mean():.1f}")

# Clean sleep hours
df['sleep_hours_clean'] = pd.to_numeric(df['sleep_hours'].astype(str).str.strip(), errors='coerce')
print(f"   Sleep hours: mean={df['sleep_hours_clean'].mean():.1f}")

# Clean physical activity
df['physical_activity_clean'] = pd.to_numeric(df['physical_activity'].astype(str).str.strip(), errors='coerce')
print(f"   Physical activity: mean={df['physical_activity_clean'].mean():.1f} days/week")

# Clean age
df['age_clean'] = pd.to_numeric(df['age'].astype(str).str.strip(), errors='coerce')
print(f"   Age: {df['age_clean'].min()} - {df['age_clean'].max()}")

# ========================================
# CLEAN CATEGORICAL FIELDS
# ========================================

print("\n" + "="*60)
print("STEP 8: Cleaning categorical fields")
print("="*60)

# Simplify academic stress
def clean_stress(value):
    if pd.isna(value):
        return 'Unknown'
    value = str(value)
    if 'Low' in value:
        return 'Low'
    elif 'Moderate' in value:
        return 'Moderate'
    elif 'High' in value:
        return 'High'
    return value

df['academic_stress_clean'] = df['academic_stress'].apply(clean_stress)
df['financial_stress_clean'] = df['financial_stress'].apply(clean_stress)
df['sense_of_belonging_clean'] = df['sense_of_belonging'].apply(clean_stress)
df['social_support_clean'] = df['social_support'].apply(clean_stress)

# Clean gender
df['gender_clean'] = df['Gender'].fillna('Unknown')

# Clean academic standing (simplify to categories)
def clean_academic_standing(value):
    if pd.isna(value):
        return 'Unknown'
    value = str(value)
    if 'Excellent' in value:
        return 'Excellent'
    elif 'Good' in value:
        return 'Good'
    elif 'Average' in value:
        return 'Average'
    elif "doesn't use" in value:
        return 'Not Applicable'
    return value

df['academic_standing_clean'] = df['academic_standing'].apply(clean_academic_standing)

# ========================================
# SELECT FINAL FEATURES FOR MODEL
# ========================================

print("\n" + "="*60)
print("STEP 9: Creating final dataset for model")
print("="*60)

# Select columns for final dataset
final_columns = [
    'age_clean',
    'gender_clean',
    'year_of_study_clean',
    'academic_standing_clean',
    'study_hours_clean',
    'academic_stress_clean',
    'sleep_hours_clean',
    'physical_activity_clean',
    'financial_stress_clean',
    'sense_of_belonging_clean',
    'social_support_clean',
    'phq9_total',
    'gad7_total',
    'risk_level'
]

# Add individual PHQ-9 and GAD-7 answers (optional, for better model)
for i in range(1, 10):
    final_columns.append(f'phq9_q{i}')
for i in range(1, 8):
    final_columns.append(f'gad7_q{i}')

# Create final dataframe
df_clean = df[final_columns].copy()

# Rename for clarity
df_clean.rename(columns={
    'age_clean': 'age',
    'gender_clean': 'gender',
    'year_of_study_clean': 'year_of_study',
    'academic_standing_clean': 'academic_standing',
    'study_hours_clean': 'study_hours',
    'academic_stress_clean': 'academic_stress',
    'sleep_hours_clean': 'sleep_hours',
    'physical_activity_clean': 'physical_activity',
    'financial_stress_clean': 'financial_stress',
    'sense_of_belonging_clean': 'sense_of_belonging',
    'social_support_clean': 'social_support'
}, inplace=True)

# Remove rows with critical missing values
initial_count = len(df_clean)
df_clean = df_clean.dropna(subset=['phq9_total', 'gad7_total'])
print(f"   Removed {initial_count - len(df_clean)} rows with missing PHQ-9/GAD-7")

# ========================================
# SAVE CLEANED DATA
# ========================================

print("\n" + "="*60)
print("STEP 10: Saving cleaned data")
print("="*60)

df_clean.to_csv('data/cleaned_responses.csv', index=False)
print(f"✅ Saved cleaned data to 'data/cleaned_responses.csv'")
print(f"   Shape: {df_clean.shape}")
print(f"   Samples: {len(df_clean)}")

# ========================================
# SUMMARY REPORT
# ========================================

print("\n" + "="*60)
print("CLEANING SUMMARY")
print("="*60)
print(f"\n📊 Final dataset:")
print(f"   Total samples: {len(df_clean)}")
print(f"   Total features: {len(df_clean.columns)}")
print(f"\n📊 Risk level distribution:")
print(df_clean['risk_level'].value_counts())
print(f"\n📊 Sample of cleaned data:")
print(df_clean.head(10))
print("\n" + "="*60)
print("✅ DATA CLEANING COMPLETE!")
print("="*60)