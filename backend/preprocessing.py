# -*- coding: utf-8 -*-
"""
Preprocessing pipeline for the Water Potability and Safety Risk Analyzer.
Implements custom manual fitting for:
1. Missing value imputation using training column medians.
2. Outlier clipping using training column 1.5 * IQR bounds.
3. Feature scaling using StandardScaler.
Ensures perfect alignment of preprocessing between training and runtime inference.
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from backend.utils import logger

class PotabilityPreprocessor:
    def __init__(self):
        self.medians_ = {}
        self.iqr_bounds_ = {}
        self.scaler_ = StandardScaler()
        self.feature_cols = [
            "ph", "Hardness", "Solids", "Chloramines", "Sulfate",
            "Conductivity", "Organic_carbon", "Trihalomethanes", "Turbidity"
        ]
        self.scaled_columns_ = []

    def fit(self, X):
        """
        Calculates medians, IQR clipping bounds, and standard scaler params on the training set.
        X: pd.DataFrame or numpy array of shape (n_samples, n_features)
        """
        # Convert to pandas DataFrame for ease of analysis if it's a numpy array
        if isinstance(X, np.ndarray):
            X_df = pd.DataFrame(X, columns=self.feature_cols)
        else:
            X_df = X.copy()

        logger.info("Fitting manual preprocessing pipeline...")
        
        # 1. Calculate training medians and IQR bounds for each feature
        for col in self.feature_cols:
            if col not in X_df.columns:
                raise ValueError(f"Required column '{col}' missing from input data.")
            
            # Median (for imputation)
            median_val = float(X_df[col].median(skipna=True))
            # Handle edge case where all values in a column are NaN
            if np.isnan(median_val):
                median_val = 0.0
            self.medians_[col] = median_val
            
            # IQR clipping bounds (for outlier handling)
            q1 = X_df[col].quantile(0.25)
            q3 = X_df[col].quantile(0.75)
            iqr = q3 - q1
            low_bound = q1 - 1.5 * iqr
            high_bound = q3 + 1.5 * iqr
            self.iqr_bounds_[col] = (low_bound, high_bound)
            
            logger.info(f"Feature '{col}': Median = {median_val:.4f}, IQR Bounds = [{low_bound:.4f}, {high_bound:.4f}]")

        # Impute and clip a temporary copy of X to fit the StandardScaler
        X_clean = self._impute_and_clip(X_df)
        
        # 3. Apply engineered features
        X_engineered = self._engineer_features(X_clean)
        self.scaled_columns_ = list(X_engineered.columns)
        
        # 2. Fit StandardScaler
        self.scaler_.fit(X_engineered[self.scaled_columns_])
        logger.info("StandardScaler fitted successfully.")
        return self

    def _impute_and_clip(self, df):
        """
        Helper method to apply training medians and clipping bounds.
        """
        df_out = df.copy()
        for col in self.feature_cols:
            # Impute missing values with training median
            df_out[col] = df_out[col].fillna(self.medians_[col])
            
            # Clip outliers using training IQR bounds
            low, high = self.iqr_bounds_[col]
            df_out[col] = np.clip(df_out[col], low, high)
            
        return df_out

    def _engineer_features(self, df):
        """
        Helper method to dynamically generate engineered features based on WHO drinking water standards.
        """
        df_out = df.copy()
        
        # WHO standard permissible limits for drinking water
        safe_limits = {
            "ph": (6.5, 8.5),
            "Hardness": (0.0, 250.0),
            "Solids": (0.0, 1000.0),
            "Chloramines": (0.0, 4.0),
            "Sulfate": (0.0, 250.0),
            "Conductivity": (0.0, 400.0),
            "Organic_carbon": (0.0, 4.0),
            "Trihalomethanes": (0.0, 80.0),
            "Turbidity": (0.0, 5.0)
        }
        
        unsafe_count = np.zeros(len(df_out))
        total_dev = np.zeros(len(df_out))
        
        for col, (min_val, max_val) in safe_limits.items():
            if col in df_out.columns:
                val = df_out[col]
                
                # Compute numerical deviation
                dev = np.zeros(len(df_out))
                dev[val < min_val] = min_val - val[val < min_val]
                dev[val > max_val] = val[val > max_val] - max_val
                
                denom = (max_val - min_val) if max_val > min_val else 1.0
                normalized_dev = dev / denom
                
                df_out[f"{col}_dev"] = normalized_dev
                
                # Unsafe binary flag
                is_unsafe = (val < min_val) | (val > max_val)
                df_out[f"{col}_unsafe"] = is_unsafe.astype(float)
                
                unsafe_count += is_unsafe.astype(float)
                total_dev += normalized_dev
                
        df_out["total_unsafe"] = unsafe_count
        df_out["total_dev"] = total_dev
        
        # High-order interaction features
        if "ph" in df_out.columns and "Turbidity" in df_out.columns:
            df_out["ph_turbidity"] = df_out["ph"] * df_out["Turbidity"]
        if "Sulfate" in df_out.columns and "Solids" in df_out.columns:
            df_out["sulfate_solids"] = df_out["Sulfate"] * df_out["Solids"]
            
        return df_out

    def transform(self, X):
        """
        Applies imputer, outlier clipping, and scaling to the input data.
        """
        if isinstance(X, np.ndarray):
            X_df = pd.DataFrame(X, columns=self.feature_cols)
        else:
            X_df = X.copy()

        # Check that columns are correct
        for col in self.feature_cols:
            if col not in X_df.columns:
                raise ValueError(f"Required column '{col}' missing from input data.")

        # Impute and clip
        X_clean = self._impute_and_clip(X_df)
        
        # Engineer features
        X_engineered = self._engineer_features(X_clean)
        
        # Scale
        scaled_data = self.scaler_.transform(X_engineered[self.scaled_columns_])
        
        # Return as DataFrame for easy down-stream consumption
        return pd.DataFrame(scaled_data, columns=self.scaled_columns_, index=X_df.index)

    def fit_transform(self, X):
        """
        Fit to data, then transform it.
        """
        return self.fit(X).transform(X)
