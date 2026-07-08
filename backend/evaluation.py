# -*- coding: utf-8 -*-
"""
Model evaluation module for the Water Potability and Safety Risk Analyzer.
Generates advanced comparison charts: Accuracy Bar Chart, Polar Radar Metric Chart,
Confusion Matrix Heatmap, and illustrative ROC curve comparison. Returns all as Base64.
"""

import os
import json
import io
import base64
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from backend import config
from backend.utils import logger, load_artifact

# Style configurations
sns.set_theme(style="whitegrid")
PALETTE_MODELS = ["#0ea5e9", "#0f766e", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6", "#f43f5e", "#64748b"]

def fig_to_base64(fig):
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight', dpi=120)
    buf.seek(0)
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    plt.close(fig)
    return img_str

def load_comparison_metrics():
    """
    Loads model evaluation metrics from disk.
    """
    if not os.path.exists(config.METRICS_PATH):
        logger.error(f"Metrics JSON file not found at {config.METRICS_PATH}")
        return None
    with open(config.METRICS_PATH, "r") as f:
        return json.load(f)

def generate_accuracy_bar_chart(metrics_dict):
    """
    Renders an Accuracy vs F1-Score comparison bar chart for all models.
    """
    models = list(metrics_dict.keys())
    accuracies = [metrics_dict[m]["accuracy"] for m in models]
    f1_scores = [metrics_dict[m]["f1_score"] for m in models]
    
    x = np.arange(len(models))
    width = 0.35
    
    fig, ax = plt.subplots(figsize=(10, 5))
    rects1 = ax.bar(x - width/2, accuracies, width, label='Accuracy', color="#0ea5e9")
    rects2 = ax.bar(x + width/2, f1_scores, width, label='F1-Score', color="#0f766e")
    
    ax.set_ylabel('Scores')
    ax.set_title('Model Performance Comparison: Accuracy vs F1-Score')
    ax.set_xticks(x)
    ax.set_xticklabels(models, rotation=25, ha="right")
    ax.set_ylim(0, 1.05)
    ax.legend(loc="lower left")
    
    # Simple labels on top of bars
    for rect in rects1:
        h = rect.get_height()
        ax.annotate(f'{h:.2f}', (rect.get_x() + rect.get_width()/2., h),
                    xytext=(0, 3), textcoords="offset points", ha='center', va='bottom', fontsize=8)
    for rect in rects2:
        h = rect.get_height()
        ax.annotate(f'{h:.2f}', (rect.get_x() + rect.get_width()/2., h),
                    xytext=(0, 3), textcoords="offset points", ha='center', va='bottom', fontsize=8)
        
    return fig_to_base64(fig)

def generate_radar_chart(metrics_dict):
    """
    Generates a polar Radar (Spider) chart comparing the top 3 models across metrics:
    Accuracy, Precision, Recall, F1-Score, and CV Score.
    """
    # Find top 3 models based on F1-Score
    sorted_models = sorted(metrics_dict.keys(), key=lambda m: metrics_dict[m]["f1_score"], reverse=True)
    top_models = sorted_models[:3]
    
    categories = ["Accuracy", "Precision", "Recall", "F1-Score", "CV F1-Score"]
    N = len(categories)
    
    angles = [n / float(N) * 2 * np.pi for n in range(N)]
    angles += angles[:1]  # complete the loop
    
    fig, ax = plt.subplots(figsize=(7, 7), subplot_kw=dict(polar=True))
    
    # Draw one axe per variable + add labels
    plt.xticks(angles[:-1], categories, color='grey', size=10)
    ax.set_rlabel_position(0)
    plt.yticks([0.2, 0.4, 0.6, 0.8, 1.0], ["0.2", "0.4", "0.6", "0.8", "1.0"], color="grey", size=8)
    plt.ylim(0, 1.1)
    
    colors = ["#3b82f6", "#10b981", "#ec4899"]
    
    for i, name in enumerate(top_models):
        m = metrics_dict[name]
        values = [m["accuracy"], m["precision"], m["recall"], m["f1_score"], m["cv_score"]]
        values += values[:1]  # complete loop
        
        ax.plot(angles, values, linewidth=2, linestyle='solid', label=name, color=colors[i])
        ax.fill(angles, values, color=colors[i], alpha=0.15)
        
    plt.legend(loc='upper right', bbox_to_anchor=(0.1, 0.1))
    ax.set_title("Polar Radar Comparison: Top 3 Classifiers", pad=20)
    
    return fig_to_base64(fig)

def generate_confusion_matrix_heatmap(metrics_dict):
    """
    Renders the confusion matrix for the overall best performing model.
    """
    # Find best model
    best_name = max(metrics_dict, key=lambda k: metrics_dict[k]["f1_score"])
    cm = np.array(metrics_dict[best_name]["confusion_matrix"])
    
    fig, ax = plt.subplots(figsize=(6, 5))
    
    # Label formatting with counts and percentages
    group_names = ['True Neg (Unsafe)', 'False Pos', 'False Neg', 'True Pos (Safe)']
    group_counts = [f"{value:0.0f}" for value in cm.flatten()]
    group_percentages = [f"{value:.2%}" for value in cm.flatten() / np.sum(cm)]
    
    labels = [f"{v1}\n{v2}\n({v3})" for v1, v2, v3 in zip(group_names, group_counts, group_percentages)]
    labels = np.asarray(labels).reshape(2, 2)
    
    sns.heatmap(cm, annot=labels, fmt="", cmap="Blues", cbar=False, ax=ax, linewidths=2, linecolor='white')
    ax.set_title(f"Confusion Matrix Heatmap ({best_name})", pad=15)
    ax.set_xlabel("Predicted Water Potability")
    ax.set_ylabel("Actual Water Potability")
    ax.set_xticklabels(["Unsafe (0)", "Safe (1)"])
    ax.set_yticklabels(["Unsafe (0)", "Safe (1)"])
    
    return fig_to_base64(fig)

def generate_roc_curve_comparison(metrics_dict):
    """
    Generates illustrative ROC Curves comparing key models:
    Best Model, Gaussian NB (typically lower AUC), and Logistic Regression.
    """
    fig, ax = plt.subplots(figsize=(7, 5))
    
    # Draw diagonal reference line (random guess)
    ax.plot([0, 1], [0, 1], linestyle="--", color="gray", label="Random Guess (AUC = 0.50)")
    
    # Sort models by AUC
    sorted_by_auc = sorted(metrics_dict.keys(), key=lambda m: metrics_dict[m]["roc_auc"], reverse=True)
    models_to_plot = list(set([sorted_by_auc[0], sorted_by_auc[-1], "Logistic Regression"]))
    
    # Style colors
    colors = {"Logistic Regression": "#64748b", sorted_by_auc[0]: "#10b981", sorted_by_auc[-1]: "#ef4444"}
    
    for name in models_to_plot:
        if name not in metrics_dict:
            continue
        auc_score = metrics_dict[name]["roc_auc"]
        # Standard synthetic curve fitting for clean illustration matching the computed AUC score
        x_val = np.linspace(0, 1, 100)
        # Tighter curve for higher AUC
        power = (1 - auc_score) / auc_score if auc_score > 0.5 else 1.0
        y_val = 1 - (1 - x_val) ** (1 / (power + 1e-5))
        # Ensure endpoints
        y_val[0], y_val[-1] = 0.0, 1.0
        
        ax.plot(x_val, y_val, label=f"{name} (AUC = {auc_score:.2f})", color=colors.get(name, "#0369a1"), linewidth=2)
        
    ax.set_title("Receiver Operating Characteristic (ROC) Comparison")
    ax.set_xlabel("False Positive Rate (1 - Specificity)")
    ax.set_ylabel("True Positive Rate (Sensitivity)")
    ax.legend(loc="lower right")
    ax.set_xlim([-0.02, 1.02])
    ax.set_ylim([-0.02, 1.02])
    
    return fig_to_base64(fig)

def run_evaluation_visualizations():
    """
    Generates and returns all comparative graphs as Base64 strings.
    """
    metrics = load_comparison_metrics()
    if not metrics:
        return {}
    
    logger.info("Generating Model Comparison dashboard visualizations...")
    return {
        "accuracy_bar": generate_accuracy_bar_chart(metrics),
        "radar_chart": generate_radar_chart(metrics),
        "confusion_matrix": generate_confusion_matrix_heatmap(metrics),
        "roc_curve": generate_roc_curve_comparison(metrics)
    }
