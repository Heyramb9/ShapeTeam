import os
import pandas as pd
import numpy as np

from src.config import config

# Numeric features used for Decision Tree training and K-Means clustering
FEATURES = [
    "Experience_Years",
    "Performance_Rating",
    "Communication_Score",
    "Leadership_Score",
    "Teamwork_Score",
    "Problem_Solving",
    "Current_Workload_%",
    "Skill_Match_%",
    "Behavior_Match_%"
]

TARGET = "Role_Suitability_Score"


def load_and_preprocess_dataset():
    """
    Loads the Excel dataset and performs basic cleaning and feature selection.
    """
    dataset_path = config["dataset_path"]
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Excel dataset not found at: {dataset_path}")

    df = pd.read_excel(dataset_path)

    # Coerce all numeric feature columns and fill nulls with column median
    for col in FEATURES + [TARGET]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
            df[col] = df[col].fillna(df[col].median())

    return df


def get_feature_matrix(df):
    """
    Extracts the feature matrix X and target vector y from the loaded dataframe.
    """
    X = df[FEATURES].values
    y = df[TARGET].values if TARGET in df.columns else None
    return X, y


def generate_deterministic_embedding(skills_list):
    """
    Generates a 384-dimensional unit vector from a list of skill strings using a
    deterministic hash-scatter scheme.  This replaces a heavy sentence-transformer
    model download while preserving vector similarity characteristics suitable for
    pgvector storage and cosine-distance queries.
    """
    vector = np.zeros(384)

    for skill in skills_list:
        skill_str = str(skill).strip().lower()
        if not skill_str:
            continue
        # Scatter each skill across 5 buckets with different seeds
        for seed in range(5):
            h_key = f"{skill_str}_seed_{seed}"
            # Deterministic hash: weighted character sum
            h_val = sum(
                ord(ch) * (idx + 1) * (seed + 7)
                for idx, ch in enumerate(h_key)
            )
            index = h_val % 384
            sign = 1 if (h_val % 2) == 0 else -1
            vector[index] += sign

    # Normalise to unit length
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm

    return vector.tolist()
