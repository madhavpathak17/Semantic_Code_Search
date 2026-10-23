import os
import chromadb
from chromadb.config import Settings

COLLECTION_NAME = "code_chunks"


class VectorStore:
    def __init__(self, persist_directory: str):
        self.persist_directory = persist_directory
        os.makedirs(persist_directory, exist_ok=True)
        self._client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(anonymized_telemetry=False),
        )
        self._collection = self._get_or_create_collection()

    def _get_or_create_collection(self):
        return self._client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )

    def add(self, ids: list[str], embeddings: list[list[float]], documents: list[str], metadatas: list[dict]) -> None:
        if not ids:
            return
        sanitized_metadatas = []
        for meta in metadatas:
            sanitized = {}
            for k, v in meta.items():
                if isinstance(v, (str, int, float, bool)):
                    sanitized[k] = v
                else:
                    sanitized[k] = str(v)
            sanitized_metadatas.append(sanitized)

        batch_size = 500
        for i in range(0, len(ids), batch_size):
            self._collection.upsert(
                ids=ids[i:i + batch_size],
                embeddings=embeddings[i:i + batch_size],
                documents=documents[i:i + batch_size],
                metadatas=sanitized_metadatas[i:i + batch_size],
            )

    def query(self, query_embedding: list[float], top_k: int = 5) -> dict:
        results = self._collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, self._collection.count() or 1),
            include=["documents", "metadatas", "distances"],
        )
        return results

    def count(self) -> int:
        try:
            return self._collection.count()
        except Exception:
            return 0

    def reset_collection(self) -> None:
        try:
            self._client.delete_collection(COLLECTION_NAME)
        except Exception:
            pass
        self._collection = self._get_or_create_collection()
