import os
import json
import urllib.request
import urllib.error


class LLMLayer:
    """
    Pluggable LLM integration layer supporting OpenAI and Google Gemini.
    Set OPENAI_API_KEY or GEMINI_API_KEY environment variables to activate.
    """

    def __init__(self):
        self.openai_key = os.getenv("OPENAI_API_KEY", "")
        self.gemini_key = os.getenv("GEMINI_API_KEY", "")
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4o")
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

    def _call_openai(self, system_prompt: str, user_message: str) -> str:
        url = "https://api.openai.com/v1/chat/completions"
        payload = json.dumps({
            "model": self.openai_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            "max_tokens": 1024,
            "temperature": 0.2,
        }).encode("utf-8")
        req = urllib.request.Request(url, data=payload, method="POST")
        req.add_header("Content-Type", "application/json")
        req.add_header("Authorization", f"Bearer {self.openai_key}")
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            return data["choices"][0]["message"]["content"].strip()

    def _call_gemini(self, system_prompt: str, user_message: str) -> str:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.gemini_model}:generateContent?key={self.gemini_key}"
        )
        full_prompt = f"{system_prompt}\n\n{user_message}"
        payload = json.dumps({
            "contents": [{"parts": [{"text": full_prompt}]}],
            "generationConfig": {"maxOutputTokens": 1024, "temperature": 0.2},
        }).encode("utf-8")
        req = urllib.request.Request(url, data=payload, method="POST")
        req.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()

    def summarize_results(self, query: str, results: list[dict]) -> str:
        if not self.openai_key and not self.gemini_key:
            return ""
        system_prompt = (
            "You are a senior software engineer assistant. "
            "Given a developer's search query and relevant code snippets, "
            "provide a concise (3-5 sentence) explanation of how the code relates to the query. "
            "Focus on key patterns, functions, or concepts. Be precise and technical."
        )
        snippets_text = "\n\n---\n\n".join(
            f"File: {r['file_path']} (lines {r['start_line']}-{r['end_line']})\n"
            f"```{r['language']}\n{r['snippet'][:500]}\n```"
            for r in results[:3]
        )
        user_message = f"Query: {query}\n\nCode Results:\n{snippets_text}"
        try:
            if self.openai_key:
                return self._call_openai(system_prompt, user_message)
            elif self.gemini_key:
                return self._call_gemini(system_prompt, user_message)
        except Exception:
            return ""
        return ""

    def explain_snippet(self, snippet: str, language: str) -> str:
        if not self.openai_key and not self.gemini_key:
            return ""
        system_prompt = (
            "You are a code explainer. Given a code snippet, "
            "explain what it does in 2-3 sentences. Be concise and technical."
        )
        user_message = f"```{language}\n{snippet[:800]}\n```"
        try:
            if self.openai_key:
                return self._call_openai(system_prompt, user_message)
            elif self.gemini_key:
                return self._call_gemini(system_prompt, user_message)
        except Exception:
            return ""
        return ""

    @property
    def is_configured(self) -> bool:
        return bool(self.openai_key or self.gemini_key)

    @property
    def provider(self) -> str:
        if self.openai_key:
            return "openai"
        if self.gemini_key:
            return "gemini"
        return "none"
