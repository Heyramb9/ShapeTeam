import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

config = {
    "dataset_path": os.path.join(os.path.dirname(BASE_DIR), "ShapeTeam_Dataset.xlsx"),
    "model_dir": os.path.join(BASE_DIR, "models"),
    "rules_path": os.path.join(BASE_DIR, "rules", "team_rules.pl"),
    "weight_fit": 1.5,  # Heuristic scaling weight (trade-off: fit vs cost)
}

# Ensure models and rules directories exist
os.makedirs(config["model_dir"], exist_ok=True)
os.makedirs(os.path.dirname(config["rules_path"]), exist_ok=True)
