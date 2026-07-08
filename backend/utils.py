# -*- coding: utf-8 -*-
"""
Utility module for the Water Potability and Safety Risk Analyzer.
Contains custom logging, directory initializers, and joblib model helpers.
"""

import os
import sys
import logging
import threading
import joblib
from backend import config

# --- THREADING LOCKS FOR CONCURRENT SAFETY ---
plot_lock = threading.Lock()

# --- CUSTOM LOGGING ---
def setup_logger(name="WaterPotabilityAnalyzer"):
    """
    Sets up a highly visible console logger with color-coded formatting.
    """
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [%(filename)s:%(lineno)d]: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger

logger = setup_logger()

# --- DIRECTORY INITIALIZATION ---
def initialize_workspace():
    """
    Ensures that all project folders (dataset, model, database, reports) exist.
    """
    for directory in [config.DATASET_DIR, config.MODEL_DIR, config.REPORTS_DIR, config.BACKEND_DIR]:
        if not os.path.exists(directory):
            logger.info(f"Creating directory: {directory}")
            os.makedirs(directory, exist_ok=True)
        else:
            logger.debug(f"Directory already exists: {directory}")

# --- MODEL SERIALIZATION HELPERS ---
def save_artifact(obj, file_path):
    """
    Saves a Python object (model, scaler, imputer) to disk using joblib.
    """
    try:
        initialize_workspace()
        logger.info(f"Saving artifact to {file_path}...")
        joblib.dump(obj, file_path)
        logger.info("Artifact saved successfully!")
        return True
    except Exception as e:
        logger.error(f"Error saving artifact to {file_path}: {str(e)}")
        return False

def load_artifact(file_path):
    """
    Loads a Python object (model, scaler, imputer) from disk using joblib.
    """
    try:
        if not os.path.exists(file_path):
            logger.error(f"Artifact path does not exist: {file_path}")
            return None
        logger.info(f"Loading artifact from {file_path}...")
        obj = joblib.load(file_path)
        logger.info("Artifact loaded successfully!")
        return obj
    except Exception as e:
        logger.error(f"Error loading artifact from {file_path}: {str(e)}")
        return None
