# AI Semantic Code Search

A production-ready full-stack application for semantically searching codebases using natural language queries. Powered by sentence-transformers embeddings and ChromaDB vector storage.

## Architecture

```
semantic-code-search/
├── backend/
│   ├── app.py                  # Flask application & API endpoints
│   ├── requirements.txt
│   ├── .env.example
│   ├── data/
│   │   ├── repository/         # Extracted ZIP contents
│   │   └── chroma/             # ChromaDB persistent storage
│   └── src/
│       ├── __init__.py
│       ├── file_loader.py      # Recursive code file scanner
│       ├── chunker.py          # Semantic code chunking
│       ├── embeddings.py       # sentence-transformers wrapper
│       ├── vector_store.py     # ChromaDB interface
│       ├── retriever.py        # Query → results pipeline
│       └── llm.py              # Gemini / OpenAI integration layer
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Sidebar.jsx
        │   ├── UploadCard.jsx
        │   └── SearchCard.jsx
        └── pages/
            └── Dashboard.jsx
```

## Prerequisites

- Python 3.12+
- Node.js 18+
- pip

## Installation

### Backend

```bash
cd backend

# Create and activate virtual environment
python3.12 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env file (optional – needed only for LLM features)
cp .env.example .env
```

### Frontend

```bash
cd frontend
npm install
```

## Running

### Start Backend (Terminal 1)

```bash
cd backend
source .venv/bin/activate
python app.py
# Flask runs on http://localhost:5000
```

### Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
# Vite dev server on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

## API Endpoints

| Method | Endpoint       | Description                              |
|--------|----------------|------------------------------------------|
| GET    | /api/health    | Health check                             |
| GET    | /api/status    | Index status & chunk count               |
| POST   | /api/upload    | Upload & index a ZIP repository          |
| POST   | /api/search    | Semantic search (body: `{query, top_k}`) |
| POST   | /api/reset     | Clear the index and repository           |

### Example Search Request

```bash
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "authentication middleware", "top_k": 5}'
```

### Example Response

```json
{
  "query": "authentication middleware",
  "total": 5,
  "results": [
    {
      "file_path": "src/middleware/auth.py",
      "snippet": "def require_auth(f):\n    ...",
      "language": "py",
      "start_line": 12,
      "end_line": 38,
      "similarity_score": 0.8721
    }
  ]
}
```

## Supported File Types

`.py` `.js` `.jsx` `.ts` `.tsx` `.java` `.cpp` `.c` `.html` `.css` `.json` `.md`

## Optional LLM Integration

Set either key in `backend/.env` to enable AI-powered result summaries:

```env
OPENAI_API_KEY=sk-...
# or
GEMINI_API_KEY=AIza...
```

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18 + Vite + TailwindCSS       |
| Backend     | Flask 3 + Flask-CORS                |
| Embeddings  | sentence-transformers/all-MiniLM-L6-v2 |
| Vector DB   | ChromaDB (persistent)               |
| LLM Layer   | OpenAI GPT-4o / Google Gemini 1.5   |
| Python      | 3.12                                |

## How It Works

1. User uploads a ZIP of their codebase via the React frontend
2. Flask extracts the ZIP into `data/repository/`
3. `file_loader.py` recursively scans all supported code files (ignoring `node_modules`, `.git`, etc.)
4. `chunker.py` splits files into overlapping semantic chunks (40 lines, 8-line overlap); Python files use AST-aware function/class extraction
5. `embeddings.py` encodes all chunks using `all-MiniLM-L6-v2` (384-dimensional vectors)
6. `vector_store.py` upserts embeddings into ChromaDB with cosine similarity
7. User types a natural language query in the search UI
8. The query is embedded, ChromaDB retrieves the top-k nearest chunks
9. Results are returned with file path, line range, code snippet, and similarity score
10. The frontend renders results with syntax highlighting and expandable cards
