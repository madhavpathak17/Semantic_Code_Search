import re

CHUNK_SIZE = 40
CHUNK_OVERLAP = 8
MIN_CHUNK_LINES = 3


def _split_into_line_chunks(lines: list[str], chunk_size: int, overlap: int) -> list[list[str]]:
    chunks = []
    start = 0
    total = len(lines)
    while start < total:
        end = min(start + chunk_size, total)
        chunk_lines = lines[start:end]
        if len(chunk_lines) >= MIN_CHUNK_LINES:
            chunks.append(chunk_lines)
        if end >= total:
            break
        start += chunk_size - overlap
    return chunks


def _extract_python_blocks(content: str) -> list[tuple[int, str]]:
    blocks = []
    lines = content.splitlines()
    block_start = None
    block_lines = []
    indent_level = 0
    def_pattern = re.compile(r"^(def |class |\s*(async\s+def ))")

    i = 0
    while i < len(lines):
        line = lines[i]
        if def_pattern.match(line):
            if block_lines and block_start is not None:
                blocks.append((block_start, "\n".join(block_lines)))
            block_start = i
            block_lines = [line]
            indent_level = len(line) - len(line.lstrip())
        elif block_start is not None:
            stripped = line.strip()
            current_indent = len(line) - len(line.lstrip()) if stripped else indent_level + 1
            if not stripped or current_indent > indent_level:
                block_lines.append(line)
            else:
                blocks.append((block_start, "\n".join(block_lines)))
                block_start = None
                block_lines = []
                i -= 1
        i += 1

    if block_lines and block_start is not None:
        blocks.append((block_start, "\n".join(block_lines)))

    return blocks


def chunk_code_files(code_files: list[dict]) -> list[dict]:
    """
    Produce overlapping semantic chunks from a list of code file dicts.
    Each chunk: {"text": str, "metadata": {"path", "language", "start_line", "end_line"}}
    """
    all_chunks = []

    for file_info in code_files:
        path = file_info["path"]
        content = file_info["content"]
        language = file_info["language"]
        lines = content.splitlines()

        if not lines:
            continue

        chunks_for_file = []

        if language == "py":
            py_blocks = _extract_python_blocks(content)
            covered_lines = set()

            for start_line, block_text in py_blocks:
                block_lines = block_text.splitlines()
                end_line = start_line + len(block_lines) - 1

                if len(block_lines) > CHUNK_SIZE:
                    sub_chunks = _split_into_line_chunks(block_lines, CHUNK_SIZE, CHUNK_OVERLAP)
                    for idx, sub in enumerate(sub_chunks):
                        sub_start = start_line + idx * (CHUNK_SIZE - CHUNK_OVERLAP)
                        sub_end = sub_start + len(sub) - 1
                        chunks_for_file.append({
                            "text": f"# File: {path}\n" + "\n".join(sub),
                            "metadata": {
                                "path": path,
                                "language": language,
                                "start_line": sub_start + 1,
                                "end_line": sub_end + 1,
                            },
                        })
                else:
                    chunks_for_file.append({
                        "text": f"# File: {path}\n{block_text}",
                        "metadata": {
                            "path": path,
                            "language": language,
                            "start_line": start_line + 1,
                            "end_line": end_line + 1,
                        },
                    })

                for ln in range(start_line, end_line + 1):
                    covered_lines.add(ln)

            remaining = [(i, line) for i, line in enumerate(lines) if i not in covered_lines]
            if remaining:
                remaining_lines = [l for _, l in remaining]
                sub_chunks = _split_into_line_chunks(remaining_lines, CHUNK_SIZE, CHUNK_OVERLAP)
                start_offset = remaining[0][0] if remaining else 0
                for idx, sub in enumerate(sub_chunks):
                    sub_start = start_offset + idx * (CHUNK_SIZE - CHUNK_OVERLAP)
                    sub_end = sub_start + len(sub) - 1
                    chunks_for_file.append({
                        "text": f"# File: {path}\n" + "\n".join(sub),
                        "metadata": {
                            "path": path,
                            "language": language,
                            "start_line": sub_start + 1,
                            "end_line": sub_end + 1,
                        },
                    })
        else:
            line_chunks = _split_into_line_chunks(lines, CHUNK_SIZE, CHUNK_OVERLAP)
            for idx, chunk_lines in enumerate(line_chunks):
                start_line = idx * (CHUNK_SIZE - CHUNK_OVERLAP)
                end_line = start_line + len(chunk_lines) - 1
                chunks_for_file.append({
                    "text": f"// File: {path}\n" + "\n".join(chunk_lines),
                    "metadata": {
                        "path": path,
                        "language": language,
                        "start_line": start_line + 1,
                        "end_line": end_line + 1,
                    },
                })

        all_chunks.extend(chunks_for_file)

    return all_chunks
