import os
import zipfile
import shutil
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from src.file_loader import load_code_files
from src.chunker import chunk_code_files
from src.embeddings import EmbeddingModel
from src.vector_store import VectorStore
from src.retriever import Retriever
from src.llm import LLMLayer

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_DIR = os.path.join(BASE_DIR, "data", "repository")
CHROMA_DIR = os.path.join(BASE_DIR, "data", "chroma")

os.makedirs(REPO_DIR, exist_ok=True)
os.makedirs(CHROMA_DIR, exist_ok=True)

embedding_model = EmbeddingModel()
vector_store = VectorStore(persist_directory=CHROMA_DIR)
retriever = Retriever(vector_store=vector_store, embedding_model=embedding_model)
llm_layer = LLMLayer()


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Semantic Code Search API is running."})


@app.route("/api/upload", methods=["POST"])
def upload_repository():
    if "file" not in request.files:
        return jsonify({"error": "No file provided."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    if not file.filename.endswith(".zip"):
        return jsonify({"error": "Only ZIP files are supported."}), 400

    if os.path.exists(REPO_DIR):
        shutil.rmtree(REPO_DIR)
    os.makedirs(REPO_DIR, exist_ok=True)

    vector_store.reset_collection()

    with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        with zipfile.ZipFile(tmp_path, "r") as zip_ref:
            zip_ref.extractall(REPO_DIR)
    except zipfile.BadZipFile:
        os.unlink(tmp_path)
        return jsonify({"error": "Invalid ZIP file."}), 400
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    code_files = load_code_files(REPO_DIR)
    if not code_files:
        return jsonify({"error": "No supported code files found in repository."}), 400

    chunks = chunk_code_files(code_files)
    if not chunks:
        return jsonify({"error": "Could not extract any code chunks."}), 400

    texts = [c["text"] for c in chunks]
    metadatas = [c["metadata"] for c in chunks]
    ids = [f"chunk_{i}" for i in range(len(chunks))]

    embeddings = embedding_model.encode(texts)
    vector_store.add(ids=ids, embeddings=embeddings, documents=texts, metadatas=metadatas)

    return jsonify({
        "message": "Repository indexed successfully.",
        "files_processed": len(code_files),
        "chunks_indexed": len(chunks),
    })


@app.route("/api/search", methods=["POST"])
def search():
    data = request.get_json()
    if not data or "query" not in data:
        return jsonify({"error": "Missing 'query' field."}), 400

    query = data["query"].strip()
    if not query:
        return jsonify({"error": "Query cannot be empty."}), 400

    top_k = int(data.get("top_k", 5))
    top_k = max(1, min(top_k, 20))

    if vector_store.count() == 0:
        return jsonify({"error": "No repository indexed. Please upload a ZIP first."}), 400

    results = retriever.search(query=query, top_k=top_k)

    return jsonify({
        "query": query,
        "results": results,
        "total": len(results),
    })


@app.route("/api/status", methods=["GET"])
def status():
    count = vector_store.count()
    return jsonify({
        "indexed": count > 0,
        "chunks_count": count,
    })


@app.route("/api/reset", methods=["POST"])
def reset():
    if os.path.exists(REPO_DIR):
        shutil.rmtree(REPO_DIR)
    os.makedirs(REPO_DIR, exist_ok=True)
    vector_store.reset_collection()
    return jsonify({"message": "Repository and index cleared."})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
