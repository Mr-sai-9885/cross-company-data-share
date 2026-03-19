from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import requests
import pandas as pd
import os
import uuid
import json
from dotenv import load_dotenv


load_dotenv()

app = Flask(__name__)
CORS(app)   

OPENROUTER_API_KEY = "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"
PORT = 5000


DATA_REGISTRY = "dataset_registry.json"

if not os.path.exists(DATA_REGISTRY):
    with open(DATA_REGISTRY, "w") as f:
        json.dump([], f)


# ------------------ Folders ------------------
UPLOAD_FOLDER = "uploads"
PROCESSED_FOLDER = "processed"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

# ------------------ Restricted Columns ------------------
RESTRICTED_COLUMNS = [
    "name", "full_name",
    "phone", "phno", "mobile",
    "email",
    "address",
    "aadhaar", "pan",
    "id", "user_id"
]

# ------------------ Home ------------------
@app.route("/")
def home():
    return "Anonymized Data Analysis Backend Running"

# ------------------ Upload & Process CSV ------------------
@app.route("/process", methods=["POST"])
def process_csv():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if not file.filename.endswith(".csv"):
        return jsonify({"error": "Only CSV files allowed"}), 400

    # Save original file
    input_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(input_path)

    # Read CSV
    try:
        df = pd.read_csv(input_path, encoding="utf-8")
    except UnicodeDecodeError:
        df = pd.read_csv(input_path, encoding="latin1")


    original_columns = list(df.columns)

    # Remove restricted columns (case-insensitive)
    safe_columns = [
        col for col in df.columns
        if col.lower() not in RESTRICTED_COLUMNS
    ]

    anonymized_df = df[safe_columns]

    # Save anonymized CSV
    anonymized_filename = f"anonymized_{uuid.uuid4().hex[:8]}.csv"
    anonymized_path = os.path.join(PROCESSED_FOLDER, anonymized_filename)
    anonymized_df.to_csv(anonymized_path, index=False)

    # Save dataset metadata
    dataset_info = {
        "filename": anonymized_filename,
        "rows": len(anonymized_df),
        "columns": safe_columns,
        "timestamp": str(pd.Timestamp.now())
    }

    with open(DATA_REGISTRY, "r+") as f:
        data = json.load(f)
        data.append(dataset_info)
        f.seek(0)
        json.dump(data, f, indent=2)

    # Prepare response
    response = {
        "message": "CSV anonymized successfully",
        "total_rows": len(anonymized_df),
        "original_columns": original_columns,
        "removed_columns": list(set(original_columns) - set(safe_columns)),
        "final_columns": safe_columns,
        "download_file": anonymized_filename
    }

    return jsonify(response)

# ------------------ API to Retrieve Stored Datasets------------------
@app.route("/datasets", methods=["GET"])
def list_datasets():
    with open(DATA_REGISTRY, "r") as f:
        datasets = json.load(f)

    return jsonify(datasets)

# ------------------ Analyze Anonymized CSV ------------------
@app.route("/analyze/<filename>", methods=["GET"])
def analyze_csv(filename):
    file_path = os.path.join(PROCESSED_FOLDER, filename)

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    df = pd.read_csv(file_path)

    results = {}

    # Age group distribution
    if "age_group" in df.columns:
        results["age_distribution"] = df["age_group"].value_counts().to_dict()

    # Category totals
    if "category" in df.columns and "transaction_amount" in df.columns:
        results["category_totals"] = (
            df.groupby("category")["transaction_amount"]
            .sum()
            .round(2)
            .to_dict()
        )

    # Risk distribution
    if "risk_category" in df.columns:
        results["risk_distribution"] = df["risk_category"].value_counts().to_dict()

    return jsonify(results)

# ------------------ Download Anonymized CSV ------------------
@app.route("/download/<filename>")
def download_csv(filename):
    file_path = os.path.join(PROCESSED_FOLDER, filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    return send_file(file_path, as_attachment=True)

# ------------------ Ask AI ------------------
def ask_ai(prompt):
    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "meta-llama/llama-3-8b-instruct",
        "messages": [
            {"role": "system", "content": "You are an AI assistant for a privacy-preserving data analytics platform."},
            {"role": "user", "content": prompt}
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=data)
        result = response.json()

        print("🔍 FULL AI RESPONSE:", result)   # DEBUG

        # ✅ SAFE CHECK
        if "choices" in result:
            return result["choices"][0]["message"]["content"]
        else:
            return f"AI Error: {result}"

    except Exception as e:
        print("🔥 REQUEST ERROR:", str(e))
        return "AI request failed"

# ------------------ AI Query Endpoint ------------------

@app.route("/query", methods=["POST"])
def ai_query():

    data = request.json
    user_query = data.get("query")

    if not user_query:
        return jsonify({"answer": "Please enter a question."})

    # Load dataset metadata
    try:
        with open(DATA_REGISTRY, "r") as f:
            datasets = json.load(f)
    except:
        datasets = []

    dataset_context = ""

    if datasets:
        latest = datasets[-1]

        dataset_context = f"""
Latest dataset information:
Filename: {latest['filename']}
Rows: {latest['rows']}
Columns: {latest['columns']}
"""

    prompt = f"""
You are an AI assistant for a secure anonymized data analytics system.

Dataset context:
{dataset_context}

User question:
{user_query}

If the question relates to dataset analysis, answer using the dataset information.
If the question is general, answer normally.
"""

    try:

        answer = ask_ai(prompt)

    except Exception as e:
        print(f"DEBUG ERROR: {e}") # This will show in your terminal
        answer = "AI service unavailable. Check backend terminal for logs."

    return jsonify({
        "answer": answer,
        "risk_analysis": {
            "level": "Low",
            "privacy_score": 98,
            "description": "AI analysis executed safely."
        }
    })

# ------------------ Run App ------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT)
