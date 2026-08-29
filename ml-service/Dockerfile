FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source files and dataset
COPY . .
COPY ../ShapeTeam_Dataset.xlsx ./data/ShapeTeam_Dataset.xlsx

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
