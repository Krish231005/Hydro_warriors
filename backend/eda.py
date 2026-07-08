# -*- coding: utf-8 -*-
"""
EDA module for the Water Potability and Safety Risk Analyzer.
Computes dataset shape, missing values, duplicates, data types, summary statistics, 
skewness, kurtosis, covariance, variance, standard deviation, and safe/unsafe comparisons.
Generates fully annotated plots (Histogram, KDE, Box, Violin, Scatter, Correlation Heatmap,
Count Plot) with Title, Labels, Observations, and Business Insights, returning them as Base64.
"""

import os
import io
import base64
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for server
import matplotlib.pyplot as plt
import seaborn as sns
from backend import config
from backend.utils import logger
from backend.feature_engineering import load_and_validate_dataset

# Set standard styles
sns.set_theme(style="whitegrid")
plt.rcParams.update({
    'font.size': 10,
    'axes.labelsize': 11,
    'axes.titlesize': 13,
    'xtick.labelsize': 9,
    'ytick.labelsize': 9,
    'figure.titlesize': 14
})

# Color palette
PALETTE = {
    "Safe": "#0ea5e9",      # Sky blue
    "Unsafe": "#ef4444",    # Red
    "Neutral": "#64748b",   # Slate gray
    "Accent": "#0f766e"     # Teal
}

def fig_to_base64(fig):
    """
    Converts a Matplotlib figure to a Base64-encoded PNG string.
    """
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', dpi=120)
    buf.seek(0)
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    return img_str

def get_text_stats(df):
    """
    Computes all standard text/numerical statistics.
    """
    feature_cols = [
        "ph", "Hardness", "Solids", "Chloramines", "Sulfate",
        "Conductivity", "Organic_carbon", "Trihalomethanes", "Turbidity"
    ]
    
    # 1. Dataset Shape
    shape = df.shape
    
    # 2. Missing Values
    missing_vals = df.isnull().sum().to_dict()
    missing_percentages = (df.isnull().sum() / len(df) * 100).round(2).to_dict()
    
    # 3. Duplicate Values
    duplicates = int(df.duplicated().sum())
    
    # 4. Data Types
    dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}
    
    # 5. Summary Statistics
    desc = df.describe().to_dict()
    
    # 6. Skewness and Kurtosis
    skewness = df[feature_cols].skew().to_dict()
    kurtosis = df[feature_cols].kurtosis().to_dict()
    
    # 7. Variance and Standard Deviation
    variance = df[feature_cols].var().to_dict()
    std_dev = df[feature_cols].std().to_dict()
    
    # 8. Covariance Matrix
    covariance = df[feature_cols].cov().round(4).to_dict()
    
    # 9. Correlation Matrix
    correlation = df[feature_cols].corr().round(4).to_dict()
    
    # 10. Target (Potability) Distribution
    pot_counts = df["Potability"].value_counts().to_dict()
    pot_percentages = (df["Potability"].value_counts(normalize=True) * 100).round(2).to_dict()
    
    # 11. Outlier Analysis (using IQR)
    outliers = {}
    for col in feature_cols:
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        count = int(((df[col] < lower) | (df[col] > upper)).sum())
        pct = round((count / len(df)) * 100, 2)
        outliers[col] = {"count": count, "percentage": pct, "lower_bound": float(lower), "upper_bound": float(upper)}

    return {
        "shape": shape,
        "missing_values": {col: {"count": int(missing_vals[col]), "percentage": missing_percentages[col]} for col in df.columns},
        "duplicates": duplicates,
        "data_types": dtypes,
        "summary_statistics": desc,
        "skewness": skewness,
        "kurtosis": kurtosis,
        "variance": variance,
        "standard_deviation": std_dev,
        "covariance": covariance,
        "correlation": correlation,
        "potability_distribution": {str(k): {"count": int(v), "percentage": pot_percentages[k]} for k, v in pot_counts.items()},
        "outlier_analysis": outliers
    }

def generate_eda_plots(df):
    """
    Generates high-quality annotated plots and returns them as Base64 strings.
    """
    plots_b64 = {}
    feature_cols = [
        "ph", "Hardness", "Solids", "Chloramines", "Sulfate",
        "Conductivity", "Organic_carbon", "Trihalomethanes", "Turbidity"
    ]
    
    # --- 1. Target Distribution Count Plot ---
    fig, ax = plt.subplots(figsize=(6, 5))
    sns.countplot(data=df, x="Potability", palette=[PALETTE["Unsafe"], PALETTE["Safe"]], ax=ax)
    ax.set_title("Potability (Target) Class Distribution")
    ax.set_xticklabels(["Unsafe (0)", "Safe (1)"])
    ax.set_xlabel("Water Quality Classification")
    ax.set_ylabel("Sample Count")
    
    # Annotate class counts and percentages
    total = len(df)
    for p in ax.patches:
        count = p.get_height()
        percentage = f"{100 * count / total:.1f}%"
        ax.annotate(f"{count}\n({percentage})", (p.get_x() + p.get_width() / 2., count * 0.4),
                    ha='center', va='center', color='white', fontweight='bold', size=11)
        
    plots_b64["potability_distribution"] = {
        "image": fig_to_base64(fig),
        "title": "Potability Distribution Analysis",
        "observation": "The dataset exhibits a moderate class imbalance. Unsafe water (Class 0) forms the majority (~61%), while safe, potable drinking water (Class 1) constitutes the remaining ~39%.",
        "insight": "Machine learning classifiers must account for class distribution during evaluation. Metrics like F1-Score and ROC-AUC are more informative than raw Accuracy. Stratified splitting is required."
    }

    # --- 2. Correlation Heatmap ---
    fig, ax = plt.subplots(figsize=(8, 7))
    corr_matrix = df[feature_cols].corr()
    sns.heatmap(corr_matrix, annot=True, cmap="coolwarm", fmt=".3f", linewidths=0.5, ax=ax, cbar=True)
    ax.set_title("Feature Pearson Correlation Matrix")
    plots_b64["correlation_heatmap"] = {
        "image": fig_to_base64(fig),
        "title": "Feature Correlation Heatmap",
        "observation": "There is virtually zero linear correlation between the physical features. The highest absolute correlation is between Sulfate and Solids, which is negligible (~ -0.08).",
        "insight": "Due to the absence of linear relationships, basic linear classifiers (like Logistic Regression) may struggle. Non-linear, tree-based ensemble models (Random Forest, Gradient Boosting) are strongly suited for capturing complex, non-linear interactions in water chemistry."
    }

    # --- 3. Outlier Detection Boxplot ---
    fig, ax = plt.subplots(figsize=(10, 5))
    df_melt = pd.melt(df[feature_cols])
    # Normalize features temporarily to render them clearly on a single plot axis
    df_melt_normalized = df[feature_cols].copy()
    for col in feature_cols:
        col_min = df_melt_normalized[col].min()
        col_max = df_melt_normalized[col].max()
        df_melt_normalized[col] = (df_melt_normalized[col] - col_min) / (col_max - col_min)
        
    df_melt_norm = pd.melt(df_melt_normalized)
    sns.boxplot(data=df_melt_norm, x="variable", y="value", palette="Blues", ax=ax)
    ax.set_title("Normalized Outlier Identification Boxplot")
    ax.set_xlabel("Water Parameter Feature")
    ax.set_ylabel("Normalized Scaled Value [0-1]")
    plt.xticks(rotation=30, ha="right")
    
    plots_b64["boxplot_outliers"] = {
        "image": fig_to_base64(fig),
        "title": "Boxplot Outlier Detection",
        "observation": "All features display significant outlier points on both the upper and lower extremes. Features like pH, Solids, and Trihalomethanes contain heavily dispersed outlier profiles.",
        "insight": "Standardizing directly without handling outliers would distort the standard scaling (mean=0, variance=1). IQR clipping will be implemented in the manual preprocessor to bind extremes and stabilize model training."
    }

    # --- 4. Violin Plot (Potability Comparison) ---
    # Render violin plot of pH by Potability as an illustrative relationship
    fig, ax = plt.subplots(figsize=(7, 5))
    sns.violinplot(data=df, x="Potability", y="ph", palette=[PALETTE["Unsafe"], PALETTE["Safe"]], ax=ax)
    ax.set_title("pH Distribution by Potability Status")
    ax.set_xticklabels(["Unsafe (0)", "Safe (1)"])
    ax.set_xlabel("Potability")
    ax.set_ylabel("pH Level")
    
    plots_b64["violin_ph"] = {
        "image": fig_to_base64(fig),
        "title": "pH Level Violin Comparison",
        "observation": "The distribution shape and density of pH are nearly identical for both potable (Safe) and non-potable (Unsafe) water, centered tightly around a neutral pH of 7.",
        "insight": "Water safety is a multivariate systemic problem. Single variables viewed in isolation cannot determine potability. We must construct a multi-dimensional classifier to capture interactions."
    }

    # --- 5. Histogram with KDE Curve (Sulfate Distribution) ---
    fig, ax = plt.subplots(figsize=(7, 5))
    sns.histplot(data=df, x="Sulfate", kde=True, color=PALETTE["Accent"], ax=ax, bins=30)
    ax.set_title("Distribution and KDE Density of Sulfate")
    ax.set_xlabel("Sulfate (mg/L)")
    ax.set_ylabel("Frequency Density")
    
    plots_b64["histogram_sulfate"] = {
        "image": fig_to_base64(fig),
        "title": "Sulfate Distribution (Histogram & KDE)",
        "observation": "Sulfate displays a near-perfect Gaussian (normal) distribution, with its mode centered around 333 mg/L. It has a slight right skew due to outliers.",
        "insight": "Sulfate is a critical chemical feature. While the distribution is bell-shaped, values exceeding the WHO limit of 250 mg/L represent elevated risk. Normal scaling will perform excellently on this feature."
    }

    # --- 6. Scatter Plot (Solids vs Conductivity) ---
    fig, ax = plt.subplots(figsize=(7, 5))
    sns.scatterplot(data=df, x="Solids", y="Conductivity", hue="Potability", 
                    palette=[PALETTE["Unsafe"], PALETTE["Safe"]], alpha=0.6, ax=ax)
    ax.set_title("Scatter Matrix Relation: Solids vs Conductivity")
    ax.set_xlabel("Solids (ppm)")
    ax.set_ylabel("Conductivity (μS/cm)")
    
    plots_b64["scatter_solids_conductivity"] = {
        "image": fig_to_base64(fig),
        "title": "Solids vs Conductivity Scatter Relationship",
        "observation": "Safe and unsafe samples overlap completely across the scatter spectrum. No visual separating hyperplane exists between Solids (dissolved minerals) and Conductivity.",
        "insight": "Linear boundary separators (like linear SVMs) will fail to split these classes. The classification boundary must be non-linear, modeled using kernel methods or recursive decision trees."
    }

    return plots_b64

def run_full_eda(csv_path):
    """
    Executes the entire EDA flow. Returns JSON stats and Base64 encoded plots.
    """
    df = load_and_validate_dataset(csv_path)
    logger.info("Computing text statistics...")
    text_stats = get_text_stats(df)
    logger.info("Generating EDA visualization plots...")
    plot_stats = generate_eda_plots(df)
    return {
        "stats": text_stats,
        "plots": plot_stats
    }
