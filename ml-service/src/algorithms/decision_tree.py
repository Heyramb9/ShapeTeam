import os
import joblib
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_squared_error, r2_score

class DecisionTreeModel:
    def __init__(self, max_depth=10):
        self.model = DecisionTreeRegressor(max_depth=max_depth, random_state=42)

    def train(self, X, y):
        """
        Trains the Decision Tree regressor on feature matrix X and target labels y.
        Returns evaluation metrics (MSE and R2 Score).
        """
        self.model.fit(X, y)
        predictions = self.model.predict(X)
        mse = mean_squared_error(y, predictions)
        r2 = r2_score(y, predictions)
        return {
            "mse": float(mse),
            "r2": float(r2)
        }

    def save(self, filepath):
        """
        Serializes and saves the trained model to disk.
        """
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self.model, filepath)
        print(f"[DT] Model saved to: {filepath}")

    def load(self, filepath):
        """
        Deserializes and loads the model from disk.
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file not found at {filepath}")
        self.model = joblib.load(filepath)
        print(f"[DT] Model loaded from: {filepath}")

    def predict(self, feature_vector):
        """
        Predicts the fit score for a single candidate or multiple candidates.
        feature_vector shape: (n_samples, n_features) or (n_features,)
        """
        if len(feature_vector.shape) == 1:
            feature_vector = feature_vector.reshape(1, -1)
        return self.model.predict(feature_vector)
