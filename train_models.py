"""
One-shot training script: trains Decision Tree and K-Means on the
ShapeTeam synthetic dataset (ShapeTeam_Dataset.xlsx) and saves the serialised models to disk.
Run from the workspace root:  python train_models.py
"""
import sys, os

# Force UTF-8 output so emoji in imported modules don't crash on Windows cp1252
sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "ml-service"))

from src.preprocessing import load_and_preprocess_dataset, get_feature_matrix
from src.algorithms.decision_tree import DecisionTreeModel
from src.algorithms.kmeans_cluster import KMeansModel
from src.config import config

print("=" * 55)
print("  ShapeTeam ML Training Pipeline")
print("=" * 55)

print("\n[1/4] Loading dataset ...")
df = load_and_preprocess_dataset()
X, y = get_feature_matrix(df)
print(f"      Loaded {X.shape[0]:,} records with {X.shape[1]} features.")

print("\n[2/4] Training Decision Tree Regressor ...")
dt = DecisionTreeModel(max_depth=10)
dt_metrics = dt.train(X, y)
dt_path = os.path.join(config["model_dir"], "decision_tree.joblib")
dt.save(dt_path)
print(f"      MSE = {dt_metrics['mse']:.4f}  |  R2 = {dt_metrics['r2']:.4f}")

print("\n[3/4] Training K-Means Clusterer (k=10) ...")
km = KMeansModel(n_clusters=10)
km_metrics = km.train(X)
km_path = os.path.join(config["model_dir"], "kmeans.joblib")
km.save(km_path)
print(f"      Inertia = {km_metrics['inertia']:.2f}")

print("\n[4/4] Verifying saved model files ...")
print(f"      decision_tree.joblib : {'OK' if os.path.exists(dt_path) else 'MISSING'}")
print(f"      kmeans.joblib        : {'OK' if os.path.exists(km_path) else 'MISSING'}")

print("\n  All models trained and saved successfully!")
print("=" * 55)
