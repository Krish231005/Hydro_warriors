# -*- coding: utf-8 -*-
"""
Main Flask Server Entrypoint for the Water Potability and Safety Risk Analyzer.
Sets up CORS, initializes databases, starts automatic background training if needed,
and listens on port 5000 for proxy requests.
"""

import os
import sys

# Add parent directory to system path to ensure clean 'backend' package imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask
from flask_cors import CORS

from backend import config
from backend.utils import logger, initialize_workspace
from backend.database import init_db
from backend.routes import api_bp

def create_app():
    """
    Application factory for Flask.
    """
    app = Flask(__name__)
    
    # Configure CORS - allow cross-origin requests from dev ports
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # 1. Initialize folders
    initialize_workspace()
    
    # 2. Initialize database
    init_db()
    
    # 3. Register blueprint routes
    app.register_blueprint(api_bp, url_prefix="/api")
    
    # 4. Check for pre-trained models. If missing, fit them on startup so the app is immediately usable.
    best_model_path = config.BEST_MODEL_PATH
    if not os.path.exists(best_model_path) and os.path.exists(config.DATASET_PATH):
        logger.info("Fitted model not found on disk. Automatically triggering initial training on startup...")
        try:
            from backend.training import train_and_evaluate_all
            train_and_evaluate_all()
            logger.info("Initial model training completed successfully on startup!")
        except Exception as e:
            logger.error(f"Failed to perform startup model training: {str(e)}")
            
    return app

if __name__ == "__main__":
    app = create_app()
    # Flask app runs on port 5000 internally. Port 3000 will be managed by Express/Vite proxy.
    PORT = 5000
    logger.info(f"Starting Flask backend server on port {PORT}...")
    app.run(host="0.0.0.0", port=PORT, debug=False)
