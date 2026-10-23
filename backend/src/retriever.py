from src.embeddings import EmbeddingModel
from src.vector_store import VectorStore


class Retriever:
    def __init__(self, vector_store: VectorStore, embedding_model: EmbeddingModel):
        self.vector_store = vector_store
        self.embedding_model = embedding_model

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        query_embedding = self.embedding_model.encode_single(query)
        raw = self.vector_store.query(query_embedding=query_embedding, top_k=top_k)

        results = []
        documents = raw.get("documents", [[]])[0]
        metadatas = raw.get("metadatas", [[]])[0]
        distances = raw.get("distances", [[]])[0]

        for doc, meta, dist in zip(documents, metadatas, distances):
            similarity = max(0.0, 1.0 - (dist / 2.0))
            snippet_lines = doc.splitlines()
            if snippet_lines and (
                snippet_lines[0].startswith("# File:") or
                snippet_lines[0].startswith("// File:")
            ):
                snippet = "\n".join(snippet_lines[1:])
            else:
                snippet = doc

            results.append({
                "file_path": meta.get("path", "unknown"),
                "snippet": snippet.strip(),
                "language": meta.get("language", ""),
                "start_line": int(meta.get("start_line", 0)),
                "end_line": int(meta.get("end_line", 0)),
                "similarity_score": round(similarity, 4),
            })

        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results
