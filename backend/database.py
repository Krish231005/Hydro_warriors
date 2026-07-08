# -*- coding: utf-8 -*-
"""
Database module for the Water Potability and Safety Risk Analyzer.
Handles the SQLite history table for storing prediction logs, metadata, risk levels,
and generated recommendations.
"""

import sqlite3
import json
from datetime import datetime
from backend import config
from backend.utils import logger

def get_db_connection():
    """
    Creates and returns a connection to the SQLite database.
    """
    conn = sqlite3.connect(config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Access columns by name
    return conn

def init_db():
    """
    Initializes the database and creates the prediction_history table if it does not exist.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    logger.info("Initializing prediction_history database...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS prediction_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            ph REAL,
            hardness REAL,
            solids REAL,
            chloramines REAL,
            sulfate REAL,
            conductivity REAL,
            organic_carbon REAL,
            trihalomethanes REAL,
            turbidity REAL,
            prediction INTEGER,
            confidence_score REAL,
            risk_level TEXT,
            unsafe_parameters TEXT,
            recommendation TEXT
        )
    """)
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully!")

def insert_prediction(data):
    """
    Inserts a new prediction record into the SQLite database.
    
    Parameters:
    data (dict): Dictionary containing ph, hardness, solids, chloramines, sulfate,
                 conductivity, organic_carbon, trihalomethanes, turbidity,
                 prediction, confidence_score, risk_level, unsafe_parameters (list),
                 and recommendation (list).
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Serialize lists into strings for storage
        unsafe_params_str = json.dumps(data.get("unsafe_parameters", []))
        rec_str = json.dumps(data.get("recommendation", []))
        
        cursor.execute("""
            INSERT INTO prediction_history (
                ph, hardness, solids, chloramines, sulfate, conductivity,
                organic_carbon, trihalomethanes, turbidity, prediction,
                confidence_score, risk_level, unsafe_parameters, recommendation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get("ph"),
            data.get("hardness"),
            data.get("solids"),
            data.get("chloramines"),
            data.get("sulfate"),
            data.get("conductivity"),
            data.get("organic_carbon"),
            data.get("trihalomethanes"),
            data.get("turbidity"),
            data.get("prediction"),
            data.get("confidence_score"),
            data.get("risk_level"),
            unsafe_params_str,
            rec_str
        ))
        
        conn.commit()
        last_id = cursor.lastrowid
        conn.close()
        logger.info(f"Successfully inserted prediction record with ID: {last_id}")
        return last_id
    except Exception as e:
        logger.error(f"Error inserting prediction into database: {str(e)}")
        return None

def get_history(search=None, filter_potability=None, filter_risk=None, sort_by="timestamp", order="DESC"):
    """
    Retrieves prediction logs from the SQLite database.
    Supports in-database filtering, search, and sorting.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = "SELECT * FROM prediction_history WHERE 1=1"
        params = []
        
        # In-database search (fuzzy search on risk level or recommendations)
        if search:
            query += " AND (risk_level LIKE ? OR recommendation LIKE ? OR unsafe_parameters LIKE ?)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param])
            
        # Potability filter
        if filter_potability is not None and filter_potability != "":
            query += " AND prediction = ?"
            params.append(int(filter_potability))
            
        # Risk level filter
        if filter_risk:
            query += " AND risk_level = ?"
            params.append(str(filter_risk))
            
        # Standard safety check for sorting columns
        allowed_sorts = ["id", "timestamp", "ph", "hardness", "solids", "chloramines", 
                         "sulfate", "conductivity", "organic_carbon", "trihalomethanes", 
                         "turbidity", "prediction", "confidence_score", "risk_level"]
        if sort_by not in allowed_sorts:
            sort_by = "timestamp"
            
        order = "DESC" if order.upper() == "DESC" else "ASC"
        query += f" ORDER BY {sort_by} {order}"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        # Post-process list results (de-serialize lists)
        results = []
        for row in rows:
            record = dict(row)
            try:
                record["unsafe_parameters"] = json.loads(record["unsafe_parameters"])
            except Exception:
                record["unsafe_parameters"] = []
                
            try:
                record["recommendation"] = json.loads(record["recommendation"])
            except Exception:
                record["recommendation"] = []
                
            results.append(record)
            
        return results
    except Exception as e:
        logger.error(f"Error retrieving prediction history: {str(e)}")
        return []

def delete_record(record_id):
    """
    Deletes a single prediction record by ID.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM prediction_history WHERE id = ?", (record_id,))
        conn.commit()
        changes = conn.total_changes
        conn.close()
        logger.info(f"Successfully deleted {changes} record(s) with ID: {record_id}")
        return changes > 0
    except Exception as e:
        logger.error(f"Error deleting record {record_id}: {str(e)}")
        return False

def clear_all_history():
    """
    Clears all logs from prediction_history.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM prediction_history")
        conn.commit()
        changes = conn.total_changes
        conn.close()
        logger.info("Successfully cleared all prediction history!")
        return True
    except Exception as e:
        logger.error(f"Error clearing prediction history: {str(e)}")
        return False
