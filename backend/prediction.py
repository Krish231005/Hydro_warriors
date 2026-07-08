# -*- coding: utf-8 -*-
"""
Prediction, Risk Analysis, and Recommendation engine for water samples.
Loads the best trained classifier, executes the fitted manual preprocessing pipeline,
conducts rigorous rule-based chemical risk classification, and generates highly targeted,
actionable mitigation recommendations. Logs output to SQLite history.
"""

import os
import numpy as np
import pandas as pd
from backend import config
from backend.utils import logger, load_artifact
from backend.database import insert_prediction

def get_preprocessor_and_model():
    """
    Loads and returns the fitted preprocessor and the best ML classifier.
    """
    preprocessor_path = os.path.join(config.MODEL_DIR, "preprocessor.joblib")
    preprocessor = load_artifact(preprocessor_path)
    model = load_artifact(config.BEST_MODEL_PATH)
    return preprocessor, model

def analyze_unsafe_parameters(inputs):
    """
    Checks each feature value against WHO/EPA safety bounds in config.
    Returns a list of flagged parameters with current values, bounds, and explanations.
    """
    flagged = []
    
    for param, val in inputs.items():
        if param in config.SAFE_LIMITS:
            limits = config.SAFE_LIMITS[param]
            val_float = float(val) if val is not None else 0.0
            
            is_low = val_float < limits["min"]
            is_high = val_float > limits["max"]
            
            if is_low or is_high:
                condition = "LOW" if is_low else "HIGH"
                flagged.append({
                    "parameter": param,
                    "value": round(val_float, 4),
                    "condition": condition,
                    "min": limits["min"],
                    "max": limits["max"],
                    "unit": limits["unit"],
                    "description": limits["description"]
                })
                
    return flagged

def evaluate_risk_level(flagged_count):
    """
    Assigns a standard rule-based risk level based on the number of flagged unsafe metrics.
    """
    if flagged_count == 0:
        return "Low"
    elif 1 <= flagged_count <= 2:
        return "Medium"
    elif 3 <= flagged_count <= 4:
        return "High"
    else:
        return "Very High"

def generate_recommendations(flagged_params, risk_level):
    """
    Generates tailored, scientifically sound mitigation strategies based on flagged features.
    """
    recs = []
    
    if not flagged_params:
        recs.append("Water parameters fall completely within WHO/EPA drinking water standards. Maintain regular seasonal testing.")
        return recs

    # Generate specific recommendations for each violation
    for item in flagged_params:
        param = item["parameter"]
        cond = item["condition"]
        
        if param == "ph":
            if cond == "LOW":
                recs.append("Acidic Water (pH < 6.5): Add a pH neutralizer feed system (such as soda ash or calcium carbonate) to prevent copper plumbing corrosion.")
            else:
                recs.append("Alkaline Water (pH > 8.5): High pH can cause scaling and reduce chloramine disinfection efficacy. Check for municipal treatment error or consider mild acid injection.")
        elif param == "Hardness":
            recs.append("Excessive Hardness (> 250 mg/L): Install an ion-exchange water softener to replace scaling calcium and magnesium ions with sodium ions.")
        elif param == "Solids":
            recs.append("High Dissolved Solids (TDS > 1000 ppm): Implement a high-performance Reverse Osmosis (RO) filtration system or solar distillation unit to filter out heavy mineral solutes.")
        elif param == "Chloramines":
            recs.append("Excessive Disinfectant (Chloramines > 4.0 ppm): Install active charcoal or carbon block filters to safely absorb and neutralize chemical disinfectants.")
        elif param == "Sulfate":
            recs.append("High Sulfate (> 250 mg/L): Sulfates have laxative properties and cause bitter tastes. Use a reverse osmosis filtration system or water distillation.")
        elif param == "Conductivity":
            recs.append("Elevated Conductivity (> 400 uS/cm): High electrical conductivity indicates excessive mineral salinity. Treat water utilizing reverse osmosis filtration.")
        elif param == "Organic_carbon":
            recs.append("High Organic Carbon (TOC > 4.0 ppm): Elevated organic load serves as nutrient source for bacterial pathogens. Apply Active Carbon Filtration combined with UV disinfection.")
        elif param == "Trihalomethanes":
            recs.append("Dangerous Carcinogenic Byproducts (THMs > 80 ppb): High levels represent toxic runoffs or heavy chlorination. Implement Advanced Reverse Osmosis coupled with Granular Activated Carbon (GAC) block filters.")
        elif param == "Turbidity":
            recs.append("Suspended Pathogen Indicator (Turbidity > 5 NTU): Cloudiness shields bacteria from disinfectants. Employ coagulant-based mechanical sediment filters followed by Ultraviolet (UV) disinfection.")

    # Risk-level general guardrails
    if risk_level in ["High", "Very High"]:
        recs.append("URGENT: Immediately boil all drinking water for at least 3 minutes before any ingestion, or use certified bottled alternative water.")
        recs.append("ALERT: Suspend water usage for infants or vulnerable individuals and notify local public health/municipal water authorities for an immediate site inspection.")
    else:
        recs.append("Conduct a professional water re-test in 30 days to verify that treatment adjustments have successfully resolved anomalies.")
        
    return recs

def predict_water_quality(inputs):
    """
    Main prediction pipeline. Integrates Preprocessor, best Saved Model, Risk Analyzer, 
    and Recommendation Engine. Stores logs directly in SQLite database.
    """
    # 1. Standardize/Extract Inputs
    ordered_keys = [
        "ph", "Hardness", "Solids", "Chloramines", "Sulfate",
        "Conductivity", "Organic_carbon", "Trihalomethanes", "Turbidity"
    ]
    
    input_dict = {}
    for key in ordered_keys:
        val = inputs.get(key)
        # Handle empty fields as None (will be imputed)
        if val is None or val == "" or str(val).strip() == "":
            input_dict[key] = None
        else:
            input_dict[key] = float(val)

    # 2. Rule-Based Quality & Risk Checks
    flagged_unsafe = analyze_unsafe_parameters(input_dict)
    risk_level = evaluate_risk_level(len(flagged_unsafe))
    recommendations = generate_recommendations(flagged_unsafe, risk_level)

    # 3. ML Model Prediction
    preprocessor, model = get_preprocessor_and_model()
    
    if preprocessor is None or model is None:
        # Fallback prediction if model has not been trained yet
        logger.warning("ML Model or Preprocessor not found on disk. Falling back to rule-based classification.")
        prediction = 0 if len(flagged_unsafe) > 2 else 1
        confidence = 0.50
    else:
        # Convert dictionary to DataFrame with matching columns
        sample_df = pd.DataFrame([input_dict])
        
        # Scale the inputs exactly like training data
        sample_scaled = preprocessor.transform(sample_df)
        
        # Class predict (0 = Unsafe, 1 = Safe)
        prediction = int(model.predict(sample_scaled)[0])
        
        # Probability predict for confidence scoring
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(sample_scaled)[0]
            confidence = float(probs[prediction])
        else:
            confidence = 1.0

    # Assemble comprehensive response structure
    result = {
        "ph": input_dict["ph"],
        "hardness": input_dict["Hardness"],
        "solids": input_dict["Solids"],
        "chloramines": input_dict["Chloramines"],
        "sulfate": input_dict["Sulfate"],
        "conductivity": input_dict["Conductivity"],
        "organic_carbon": input_dict["Organic_carbon"],
        "trihalomethanes": input_dict["Trihalomethanes"],
        "turbidity": input_dict["Turbidity"],
        "prediction": prediction,
        "confidence_score": round(confidence * 100, 2),  # In %
        "risk_level": risk_level,
        "unsafe_parameters": flagged_unsafe,
        "recommendation": recommendations
    }
    
    # 4. Durable SQLite Persistence
    db_id = insert_prediction(result)
    result["id"] = db_id
    
    return result
