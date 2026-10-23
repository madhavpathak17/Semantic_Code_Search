import os

SUPPORTED_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx",
    ".java", ".cpp", ".c", ".html", ".css",
    ".json", ".md"
}

IGNORED_DIRS = {
    "__pycache__", ".git", "node_modules", ".venv", "venv",
    "env", ".env", "dist", "build", ".idea", ".vscode",
    ".mypy_cache", ".pytest_cache", "coverage", ".tox",
    "eggs", ".eggs", "target", "out", "bin", "obj",
}

MAX_FILE_SIZE_BYTES = 500 * 1024  # 500 KB per file


def load_code_files(root_dir: str) -> list[dict]:
    """
    Recursively scan root_dir and return a list of dicts:
    [{"path": relative_path, "content": file_content, "language": ext}, ...]
    """
    results = []

    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [
            d for d in dirnames
            if d not in IGNORED_DIRS and not d.startswith(".")
        ]

        for filename in filenames:
            ext = os.path.splitext(filename)[1].lower()
            if ext not in SUPPORTED_EXTENSIONS:
                continue

            full_path = os.path.join(dirpath, filename)

            try:
                file_size = os.path.getsize(full_path)
                if file_size > MAX_FILE_SIZE_BYTES:
                    continue
            except OSError:
                continue

            try:
                with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
            except (OSError, IOError):
                continue

            if not content.strip():
                continue

            relative_path = os.path.relpath(full_path, root_dir)
            relative_path = relative_path.replace(os.sep, "/")

            results.append({
                "path": relative_path,
                "content": content,
                "language": ext.lstrip("."),
            })

    return results
