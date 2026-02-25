# FileSift

**Local-first semantic file search powered by language models**

FileSift is a local file indexing and search tool that enables natural-language search across a filesystem. Instead of relying on filenames or directory structure, FileSift indexes file *content* and allows users to find code, documents, data files, and images using semantic queries.

The project was built to solve a personal pain point — navigating a large, messy local filesystem — and evolved into a general-purpose, extensible retrieval system suitable for developer workflows and power users.

---

## What It Does

* Indexes local directories using file-type–specific processors (code, documents, images, data files)
* Supports **hybrid retrieval**, combining semantic vector search (FAISS) with keyword-based search (BM25)
* Exposes a fast CLI with a background daemon to keep indexes hot in memory
* Works with any **OpenAI-compatible inference provider**, enabling fully local or cloud-based execution

Search queries like:

> "authentication logic" or "images of charts"

return results based on meaning rather than filename matching alone.

---

## System Design

FileSift is designed as a **local-first retrieval system** with an emphasis on responsiveness and low operational overhead:

* **Indexing**: Files are chunked and embedded using lightweight embedding models chosen for a balance of speed and quality
* **Storage**: Each indexed directory maintains its own `.filesift` store containing:

  * A FAISS vector index for semantic search
  * A BM25 index for lexical search
  * Metadata for file tracking
* **Search**:

  * Queries are embedded using the same model
  * Semantic and keyword results are combined using **Reciprocal Rank Fusion (RRF)** for improved relevance

Hybrid retrieval was chosen to handle both fuzzy semantic queries and cases where users remember specific keywords or identifiers.

---

## Performance & UX Considerations

* **Cold start latency**: ~6 seconds (loading indexes into memory)
* **Warm search latency**: <1 second via a background daemon
* **Daemon model**: Indexes are kept in memory to support rapid iterative searching, with automatic shutdown after a configurable inactivity window to limit memory usage

This design reflects the assumption that users often perform multiple searches in short bursts when trying to locate files.

---

## File Processing Strategy

* **Code files**: Indexed with additional contextual instructions to help models better infer structure and intent
* **Documents & data files**: Parsed and chunked for semantic retrieval
* **Images**: Captioned using vision-language models and indexed via text embeddings
* **Binary files**: Skipped entirely using a hardcoded allowlist of supported formats

This approach keeps the system robust while avoiding costly or low-signal indexing paths.

---

## Tradeoffs & Limitations

* Image indexing can be slow when using larger vision-language models
* Indexing speed is constrained by external inference latency and hardware
* Deleted or renamed files currently require a full reindex (v0.1), with filesystem listeners planned for future versions

These tradeoffs were made intentionally to keep the daemon lightweight and inference-provider–agnostic.

---

## Design Philosophy

FileSift prioritizes:

* **Local execution** over hosted services
* **Composable retrieval primitives** rather than monolithic AI agents
* **Explicit performance tradeoffs** instead of hidden background costs

The project is intended as a foundation for exploring local AI tooling, retrieval systems, and future agent-based workflows that operate directly over a user’s personal data.
