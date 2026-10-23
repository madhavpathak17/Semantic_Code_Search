import os
from sentence_transformers import SentenceTransformer

MODEL_NAME = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
BATCH_SIZE = 64


class EmbeddingModel:
    def __init__(self, model_name: str = MODEL_NAME):
        self.model_name = model_name
        self._model = None

    def _load_model(self):
        if self._model is None:
            self._model = SentenceTransformer(self.model_name)

    def encode(self, texts: list[str], batch_size: int = BATCH_SIZE) -> list[list[float]]:
        self._load_model()
        if not texts:
            return []
        embeddings = self._model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )
        return embeddings.tolist()

    def encode_single(self, text: str) -> list[float]:
        result = self.encode([text])
        return result[0] if result else []

    @property
    def dimension(self) -> int:
        self._load_model()
        return self._model.get_sentence_embedding_dimension()
