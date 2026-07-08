# -*- coding: utf-8 -*-
"""
Model training and selection module for the Water Potability and Safety Risk Analyzer.
Trains 9 distinct classification models, evaluates metrics, compares performances,
generates evaluation visualizations, and saves the best model + preprocessing pipeline.
"""

import os
import json
import time
import numpy as np
import pandas as pd
from sklearn.model_selection import cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, classification_report

# Import classifiers
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, AdaBoostClassifier, ExtraTreesClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB

from backend import config
from backend.utils import logger, save_artifact
from backend.feature_engineering import get_prepared_data

def get_classifiers():
    """
    Returns a dictionary of initialized models to compare.
    """
    return {
        "Logistic Regression": LogisticRegression(max_iter=2000, random_state=config.RANDOM_STATE),
        "Decision Tree": DecisionTreeClassifier(random_state=config.RANDOM_STATE, max_depth=10),
        "Random Forest": RandomForestClassifier(n_estimators=150, random_state=config.RANDOM_STATE, n_jobs=-1),
        "Gradient Boosting": GradientBoostingClassifier(random_state=config.RANDOM_STATE),
        "AdaBoost": AdaBoostClassifier(random_state=config.RANDOM_STATE),
        "Extra Trees": ExtraTreesClassifier(n_estimators=150, random_state=config.RANDOM_STATE, n_jobs=-1),
        "K-Nearest Neighbors": KNeighborsClassifier(n_neighbors=5, n_jobs=-1),
        "Support Vector Machine": SVC(probability=True, random_state=config.RANDOM_STATE),
        "Gaussian Naive Bayes": Gaussian NaiveBayes()
    }

def train_and_evaluate_all():
    """
    Trains and compares 9 classifiers, logs comparative results, saves the best model.
    """
    logger.info("Starting model training and evaluation process...")
    
    # 1. Load data and preprocessing pipeline
    X_train, X_test, y_train, y_test, preprocessor = get_prepared_data(config.DATASET_PATH)
    
    classifiers = get_classifiers()
    results = {}
    
    # 2. Iterate through all classifiers
    for name, model in classifiers.items():
        logger.info(f"Training model: {name}...")
        
        # Track training time
        start_train = time.time()
        model.fit(X_train, y_train)
        end_train = time.time()
        train_time = round(end_train - start_train, 4)
        
        # Track prediction time
        start_pred = time.time()
        y_pred = model.predict(X_test)
        end_pred = time.time()
        pred_time = round(end_pred - start_pred, 4)
        
        # Probabilities for ROC-AUC
        if hasattr(model, "predict_proba"):
            y_prob = model.predict_proba(X_test)[:, 1]
        elif hasattr(model, "decision_function"):
            y_prob = model.decision_function(X_test)
        else:
            y_prob = y_pred  # Fallback
            
        # Calculate test metrics
        accuracy = round(accuracy_score(y_test, y_pred), 4)
        precision = round(precision_score(y_test, y_pred, zero_division=0), 4)
        recall = round(recall_score(y_test, y_pred, zero_division=0), 4)
        f1 = round(f1_score(y_test, y_pred, zero_division=0), 4)
        roc_auc = round(roc_auc_score(y_test, y_prob), 4)
        
        # 5-fold cross-validation score on training set
        logger.info(f"Computing 5-fold CV score for: {name}...")
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring="f1", n_jobs=-1)
        mean_cv_score = round(float(np.mean(cv_scores)), 4)
        
        # Confusion Matrix
        cm = confusion_matrix(y_test, y_pred).tolist()  # [[TN, FP], [FN, TP]]
        
        # Classification report as dict
        cls_report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
        
        results[name] = {
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "roc_auc": roc_auc,
            "cv_score": mean_cv_score,
            "train_time": train_time,
            "predict_time": pred_time,
            "confusion_matrix": cm,
            "classification_report": cls_report
        }
        
        logger.info(f"Finished {name}. F1-Score: {f1:.4f}, Accuracy: {accuracy:.4f}, CV-F1: {mean_cv_score:.4f}")

    # 3. Save comparative metrics JSON
    with open(config.METRICS_PATH, "w") as f:
        json.dump(results, f, indent=4)
    logger.info(f"Model comparison metrics saved to {config.METRICS_PATH}")
    
    # 4. Automatically select the best model (using test F1-Score as primary selector)
    best_name = max(results, key=lambda k: results[k]["f1_score"])
    best_f1 = results[best_name]["f1_score"]
    logger.info(f"Selected Best Model based on F1-Score: {best_name} (F1 = {best_f1:.4f})")
    
    # Re-instantiate a fresh model of the same type and fit on the training data, then save
    best_model = classifiers[best_name]
    
    # 5. Save best model and standard preprocessing objects
    save_artifact(best_model, config.BEST_MODEL_PATH)
    save_artifact(preprocessor, os.path.join(config.MODEL_DIR, "preprocessor.joblib"))
    
    # Also save separate components for granular safety fallback loading
    save_artifact(preprocessor.scaler_, config.SCALER_PATH)
    save_artifact(preprocessor.medians_, config.IMPUTER_PATH)
    
    return best_name, results
