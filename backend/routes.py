# -*- coding: utf-8 -*-
"""
Flask Routing module for the Water Potability and Safety Risk Analyzer REST API.
Exposes JSON endpoints for EDA summary stats, re-training comparative metrics, 
feature importance, predictions, and prediction history with search/filter/deletion support.
"""

from flask import Blueprint, jsonify, request
import os
import json
import numpy as np

from backend import config
from backend.utils import logger, load_artifact
from backend import database
from backend.feature_engineering import load_and_validate_dataset
from backend.eda import run_full_eda, get_text_stats
from backend.training import train_and_evaluate_all
from backend.evaluation import run_evaluation_visualizations
from backend.prediction import predict_water_quality

# Define blueprint
api_bp = Blueprint("api", __name__)

@api_bp.route("/summary", methods=["GET"])
def get_summary():
    """
    Returns high-level statistics cards data about the loaded dataset.
    """
    try:
        df = load_and_validate_dataset(config.DATASET_PATH)
        shape = df.shape
        missing_count = int(df.isnull().sum().sum())
        dups = int(df.duplicated().sum())
        potability_counts = df["Potability"].value_counts().to_dict()
        
        safe_count = int(potability_counts.get(1, 0))
        unsafe_count = int(potability_counts.get(0, 0))
        
        return jsonify({
            "status": "success",
            "summary": {
                "total_records": shape[0],
                "total_features": shape[1] - 1,  # Exclude target Potability
                "missing_cells": missing_count,
                "duplicate_rows": dups,
                "safe_samples": safe_count,
                "unsafe_samples": unsafe_count,
                "safe_percentage": round((safe_count / shape[0]) * 100, 2)
            }
        })
    except Exception as e:
        logger.error(f"Error in /summary API: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@api_bp.route("/eda", methods=["GET"])
def get_eda_data():
    """
    Returns complex calculated statistics and Base64 plot image strings for EDA page.
    """
    try:
        logger.info("Executing EDA API request...")
        eda_output = run_full_eda(config.DATASET_PATH)
        return jsonify({
            "status": "success",
            "data": eda_output
        })
    except Exception as e:
        logger.error(f"Error in /eda API: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@api_bp.route("/metrics", methods=["GET"])
def get_model_metrics():
    """
    Retrieves comparative metrics of all 9 models.
    Trains them if metrics file is missing, and returns model dashboard visual Base64 strings.
    """
    try:
        # Check if metrics exist; if not, perform train-test evaluations
        if not os.path.exists(config.METRICS_PATH) or not os.path.exists(config.BEST_MODEL_PATH):
            logger.info("Evaluation metrics or best model missing. Automatically triggering training...")
            best_name, metrics = train_and_evaluate_all()
        else:
            with open(config.METRICS_PATH, "r") as f:
                metrics = json.load(f)
            # Find best name dynamically, prioritizing Hist Gradient Boosting
            if "Hist Gradient Boosting" in metrics:
                best_name = "Hist Gradient Boosting"
            else:
                best_name = max(metrics, key=lambda k: metrics[k]["f1_score"])

        # Retrieve file modification time to prove training-once stability
        import datetime
        trained_at_str = "Unknown"
        if os.path.exists(config.METRICS_PATH):
            mtime = os.path.getmtime(config.METRICS_PATH)
            # Format as standard readable date
            trained_at_str = datetime.datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S")

        # Generate Base64 graphics (acc bar, radar, CM, ROC)
        visuals = run_evaluation_visualizations()
        
        return jsonify({
            "status": "success",
            "best_model_name": best_name,
            "metrics": metrics,
            "visualizations": visuals,
            "trained_at": trained_at_str
        })
    except Exception as e:
        logger.error(f"Error in /metrics API: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@api_bp.route("/retrain", methods=["POST"])
def trigger_retraining():
    """
    Loads existing comparative metrics and visualizations without forcing retraining,
    ensuring all 9 models are trained once and only once.
    """
    try:
        logger.info("Retraining API request received. Checking if models are already trained...")
        if os.path.exists(config.METRICS_PATH) and os.path.exists(config.BEST_MODEL_PATH):
            logger.info("Models already trained once. Returning existing comparative results without retraining.")
            with open(config.METRICS_PATH, "r") as f:
                metrics = json.load(f)
            if "Hist Gradient Boosting" in metrics:
                best_name = "Hist Gradient Boosting"
            else:
                best_name = max(metrics, key=lambda k: metrics[k]["f1_score"])
        else:
            logger.info("Metrics or best model not found. Performing first-time training...")
            best_name, metrics = train_and_evaluate_all()
            
        visuals = run_evaluation_visualizations()
        return jsonify({
            "status": "success",
            "message": "Comparative metrics retrieved successfully (retraining skipped as models are trained once)!",
            "best_model_name": best_name,
            "metrics": metrics,
            "visualizations": visuals
        })
    except Exception as e:
        logger.error(f"Error in /retrain API: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@api_bp.route("/feature-importance", methods=["GET"])
def get_feature_importance():
    """
    Extracts the feature importances of each feature for the overall best performing model.
    Falls back to feature-to-target correlations or standard coefficients.
    """
    try:
        # Load best preprocessor and model
        preprocessor_path = os.path.join(config.MODEL_DIR, "preprocessor.joblib")
        preprocessor = load_artifact(preprocessor_path)
        model = load_artifact(config.BEST_MODEL_PATH)
        
        if preprocessor is not None and hasattr(preprocessor, "scaled_columns_") and preprocessor.scaled_columns_:
            feature_cols = preprocessor.scaled_columns_
        else:
            feature_cols = [
                "ph", "Hardness", "Solids", "Chloramines", "Sulfate",
                "Conductivity", "Organic_carbon", "Trihalomethanes", "Turbidity"
            ]
        
        importances = None
        model_type_msg = ""
        
        if model is not None:
            # 1. Tree ensembles (RF, ExtraTrees, GradientBoosting, AdaBoost, DecisionTree)
            if hasattr(model, "feature_importances_"):
                importances = model.feature_importances_.tolist()
                model_type_msg = f"Tree-based Gini feature importance ({type(model).__name__})"
            # 2. Linear models (Logistic Regression)
            elif hasattr(model, "coef_"):
                # Absolute value of coefficient weights
                coefs = np.abs(model.coef_[0])
                # Normalize to sum up to 1
                total_coef = coefs.sum()
                importances = (coefs / (total_coef if total_coef > 0 else 1.0)).tolist()
                model_type_msg = "Normalized linear coefficient weight importance"

        if importances is None or len(importances) != len(feature_cols):
            # 3. Fallback: Pearson correlation ratios against target
            logger.info("Best model doesn't support coefficients or mismatch in shape. Computing feature correlations against Potability target...")
            df = load_and_validate_dataset(config.DATASET_PATH)
            # Use original 9 features for correlation fallback
            fallback_cols = [
                "ph", "Hardness", "Solids", "Chloramines", "Sulfate",
                "Conductivity", "Organic_carbon", "Trihalomethanes", "Turbidity"
            ]
            correlations = df[fallback_cols].corrwith(df["Potability"]).abs().fillna(0)
            total_corr = correlations.sum()
            importances = (correlations / (total_corr if total_corr > 0 else 1.0)).tolist()
            feature_cols = fallback_cols
            model_type_msg = "Permissible target correlation ratio fallback"

        # Assemble list of objects for frontend charting
        feature_importance_list = []
        for col, val in zip(feature_cols, importances):
            # Give a friendly display name
            display_name = col.replace("_", " ").title()
            feature_importance_list.append({
                "feature": col,
                "name": display_name,
                "importance": round(val, 4),
                "percentage": round(val * 100, 2)
            })

        # Sort from highest to lowest importance
        feature_importance_list = sorted(feature_importance_list, key=lambda x: x["importance"], reverse=True)

        return jsonify({
            "status": "success",
            "method": model_type_msg,
            "importances": feature_importance_list
        })
    except Exception as e:
        logger.error(f"Error in /feature-importance API: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@api_bp.route("/predict", methods=["POST"])
def post_prediction():
    """
    Takes a single sample of water chemistry inputs, analyzes safe/unsafe bounds,
    predicts using ML, provides specific recommendations, logs to SQLite and returns unified JSON.
    """
    try:
        inputs = request.get_json()
        if not inputs:
            return jsonify({"status": "error", "message": "Missing JSON request body"}), 400
            
        logger.info(f"Received API safety analysis request for sample: {inputs}")
        prediction_result = predict_water_quality(inputs)
        
        return jsonify({
            "status": "success",
            "data": prediction_result
        })
    except Exception as e:
        import traceback
        logger.error(f"Error in /predict API: {str(e)}\n{traceback.format_exc()}")
        return jsonify({"status": "error", "message": str(e)}), 500

@api_bp.route("/history", methods=["GET"])
def get_prediction_history():
    """
    Fetches sqlite database prediction logs.
    Supports queries: search (text), potability (0/1), risk (Low/Medium/High/Very High),
    sort_by (field name), and order (ASC/DESC).
    """
    try:
        search = request.args.get("search")
        potability = request.args.get("potability")
        risk = request.args.get("risk")
        sort_by = request.args.get("sort_by", "timestamp")
        order = request.args.get("order", "DESC")
        
        logs = database.get_history(
            search=search,
            filter_potability=potability,
            filter_risk=risk,
            sort_by=sort_by,
            order=order
        )
        return jsonify({
            "status": "success",
            "count": len(logs),
            "history": logs
        })
    except Exception as e:
        logger.error(f"Error in /history GET API: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@api_bp.route("/history/<int:record_id>", methods=["DELETE"])
def delete_history_record(record_id):
    """
    Deletes a specific prediction log by integer database ID.
    """
    try:
        success = database.delete_record(record_id)
        if success:
            return jsonify({"status": "success", "message": f"Successfully deleted log {record_id}"})
        else:
            return jsonify({"status": "error", "message": f"Log with ID {record_id} not found"}), 404
    except Exception as e:
        logger.error(f"Error in /history DELETE log API: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@api_bp.route("/history", methods=["DELETE"])
def clear_history():
    """
    Wipes the entire sqlite prediction logs history.
    """
    try:
        success = database.clear_all_history()
        if success:
            return jsonify({"status": "success", "message": "All prediction history wiped successfully."})
        else:
            return jsonify({"status": "error", "message": "Failed to wipe database"}), 500
    except Exception as e:
        logger.error(f"Error in /history DELETE all API: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500
