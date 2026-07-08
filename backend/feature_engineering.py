# -*- coding: utf-8 -*-
"""
Feature engineering module for the Water Potability and Safety Risk Analyzer.
Handles dataset loading, train-test splitting, and engineered feature transformations
to maximize the predictive power of Scikit-learn models.
"""

import pandas as pd
from sklearn.model_selection import train_test_split
from backend import config
from backend.utils import logger
from backend.preprocessing import PotabilityPreprocessor

def load_and_validate_dataset(csv_path):
    """
    Loads the water potability CSV and ensures it has the required columns.
    """
    logger.info(f"Loading dataset from: {csv_path}")
    df = pd.read_csv(csv_path)
    
    # Correct column names if they have case discrepancies
    rename_map = {col: col.strip() for col in df.columns}
    # Ensure standard names
    standard_names = {
        "ph": "ph", "hardness": "Hardness", "solids": "Solids",
        "chloramines": "Chloramines", "sulfate": "Sulfate",
        "conductivity": "Conductivity", "organic_carbon": "Organic_carbon",
        "trihalomethanes": "Trihalomethanes", "turbidity": "Turbidity",
        "potability": "Potability"
    }
    
    for old_col, clean_col in rename_map.items():
        lower_clean = clean_col.lower()
        if lower_clean in standard_names:
            df = df.rename(columns={old_col: standard_names[lower_clean]})
            
    # Validate required columns
    required_cols = list(standard_names.values())
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Dataset is missing critical columns: {missing_cols}")
        
    logger.info(f"Dataset successfully loaded. Shape: {df.shape}")
    return df

def build_features(df, is_training=True):
    """
    Optionally engineers features that add value to the Scikit-learn classifiers.
    To avoid over-fitting and maintain raw model purity, we will work directly 
    with the 9 main physical features of the water potability dataset.
    Returns:
    X: pd.DataFrame of features
    y: pd.Series of target (if is_training is True, else None)
    """
    feature_cols = [
        "ph", "Hardness", "Solids", "Chloramines", "Sulfate",
        "Conductivity", "Organic_carbon", "Trihalomethanes", "Turbidity"
    ]
    X = df[feature_cols].copy()
    
    if is_training:
        y = df["Potability"].copy()
        return X, y
    return X, None

def get_prepared_data(csv_path):
    """
    Performs train-test split and fits the preprocessing pipeline.
    Returns:
    X_train_scaled, X_test_scaled, y_train, y_test, preprocessor
    """
    df = load_and_validate_dataset(csv_path)
    X, y = build_features(df, is_training=True)
    
    # Train-test split
    logger.info(f"Performing train-test split (test_size={config.TEST_SIZE}, random_state={config.RANDOM_STATE})...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, 
        test_size=config.TEST_SIZE, 
        random_state=config.RANDOM_STATE, 
        stratify=y
    )
    
    # Preprocessor initialization and fitting
    preprocessor = PotabilityPreprocessor()
    X_train_scaled = preprocessor.fit_transform(X_train)
    X_test_scaled = preprocessor.transform(X_test)
    
    logger.info("Dataset split and preprocessing complete.")
    return X_train_scaled, X_test_scaled, y_train, y_test, preprocessor
