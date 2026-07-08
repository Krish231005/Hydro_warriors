# -*- coding: utf-8 -*-
"""
Configuration module for the Water Potability and Safety Risk Analyzer.
Contains file paths, thresholds, and business rules.
"""

import os

# --- BASE DIRECTORIES ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
MODEL_DIR = os.path.join(BASE_DIR, "model")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")

# Ensure folders exist
for folder in [DATASET_DIR, MODEL_DIR, REPORTS_DIR, BACKEND_DIR]:
    if not os.path.exists(folder):
        os.makedirs(folder, exist_ok=True)

# --- FILE PATHS ---
DATASET_PATH = os.path.join(DATASET_DIR, "water_potability.csv")
# Fallback search if not found in default dataset folder
if not os.path.exists(DATASET_PATH):
    for possible_dir in [os.path.join(BASE_DIR, "database"), BASE_DIR]:
        alt_path = os.path.join(possible_dir, "water_potability.csv")
        if os.path.exists(alt_path):
            DATASET_PATH = alt_path
            break
BEST_MODEL_PATH = os.path.join(MODEL_DIR, "best_model.joblib")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.joblib")
IMPUTER_PATH = os.path.join(MODEL_DIR, "imputer.joblib")
METRICS_PATH = os.path.join(MODEL_DIR, "model_comparison_metrics.json")
DATABASE_PATH = os.path.join(BACKEND_DIR, "prediction_history.db")

# --- DATABASE CONFIG ---
DATABASE_URI = f"sqlite:///{DATABASE_PATH}"

# --- SCIENTIFIC THRESHOLDS & WHO STANDARDS ---
# Used for manual rule-based risk evaluation and flagging unsafe features.
# Standard permissible limits for drinking water.
SAFE_LIMITS = {
    "ph": {
        "min": 6.5,
        "max": 8.5,
        "unit": "pH",
        "description": "WHO/EPA standard for drinking water pH is between 6.5 and 8.5."
    },
    "Hardness": {
        "min": 0.0,
        "max": 250.0,  # moderately hard is normal, but above 250 is excessively hard.
        "unit": "mg/L",
        "description": "Hardness above 250 mg/L forms scale and limits lathering of soap."
    },
    "Solids": {
        "min": 0.0,
        "max": 1000.0,  # TDS WHO limit is 1000 mg/L (some list 500 mg/L as desirable).
        "unit": "ppm",
        "description": "Total Dissolved Solids (TDS) should ideally be under 1000 ppm for safety."
    },
    "Chloramines": {
        "min": 0.0,
        "max": 4.0,  # EPA standard is maximum of 4.0 mg/L.
        "unit": "ppm",
        "description": "Chloramines used as disinfectants are safe up to 4.0 ppm."
    },
    "Sulfate": {
        "min": 0.0,
        "max": 250.0,  # WHO secondary standard is 250 mg/L.
        "unit": "mg/L",
        "description": "High sulfates (> 250 mg/L) can cause a laxative effect and bitter taste."
    },
    "Conductivity": {
        "min": 0.0,
        "max": 400.0,  # WHO standard conductivity is up to 400 uS/cm.
        "unit": "uS/cm",
        "description": "Electrical conductivity should be under 400 uS/cm for fresh drinking water."
    },
    "Organic_carbon": {
        "min": 0.0,
        "max": 4.0,  # Total Organic Carbon (TOC) typically < 4 mg/L in treated drinking water.
        "unit": "ppm",
        "description": "TOC should be below 4.0 ppm as high levels indicate organic contaminants."
    },
    "Trihalomethanes": {
        "min": 0.0,
        "max": 80.0,  # EPA MCL standard is 80 ppb.
        "unit": "ppb",
        "description": "Disinfection byproducts (THMs) must be below 80 ppb to prevent toxicity."
    },
    "Turbidity": {
        "min": 0.0,
        "max": 5.0,  # WHO limit is 5.0 NTU (ideal is < 1.0).
        "unit": "NTU",
        "description": "Turbidity above 5 NTU indicates high suspended particles and potential pathogens."
    }
}

# --- RANDOM STATE ---
RANDOM_STATE = 4
TEST_SIZE = 0.2
CV_SPLITS = 5
