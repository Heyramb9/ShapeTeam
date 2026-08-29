import os
import joblib
from sklearn.cluster import KMeans

class KMeansModel:
    def __init__(self, n_clusters=5):
        self.model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)

    def train(self, X):
        """
        Trains K-Means on the feature matrix X.
        Returns the clustering inertia (sum of squared distances of samples to their closest cluster center).
        """
        self.model.fit(X)
        return {
            "inertia": float(self.model.inertia_)
        }

    def save(self, filepath):
        """
        Serializes and saves the trained K-Means model to disk.
        """
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self.model, filepath)
        print(f"[KM] Model saved to: {filepath}")

    def load(self, filepath):
        """
        Deserializes and loads the K-Means model from disk.
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file not found at {filepath}")
        self.model = joblib.load(filepath)
        print(f"[KM] Model loaded from: {filepath}")

    def predict(self, feature_vector):
        """
        Predicts the cluster ID for a single candidate or multiple candidates.
        feature_vector shape: (n_samples, n_features) or (n_features,)
        """
        import numpy as np
        if len(np.shape(feature_vector)) == 1:
            feature_vector = np.array(feature_vector).reshape(1, -1)
        return self.model.predict(feature_vector)
