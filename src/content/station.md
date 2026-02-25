# FileSift

**A fast, local-first, open-source utility that helps AI coding agents intelligently search and understand codebases.**

FileSift is a AI-native utility designed to help humans and coding agents understand codebases. The project evolved from a generalized file search tool into a specialized, privacy-first developer tool. Instead of the slow, wasteful approach of generating LLM summaries for every file, FileSift now uses lightning-fast, code-specific embedding models (Jina AI Code Embeddings) to index source code directly.

Most importantly, it emphasizes complete privacy: all embeddings are generated on your machine, ensuring your code never leaves your local environment.

---

## What It Does

* Indexes codebases using specialized code embeddings for high-quality semantic retrieval
* Features a background daemon to keep indexes hot in memory
* Supports searching a fast, "primitive" index while deep embedding jobs are actively running in the background
* Ships with first-class support for spinning up an **MCP (Model Context Protocol) server**, giving coding agents immediate access to your codebase context
* Can be installed directly as an **agent skill**

Search queries like:

> "authentication logic for user login" or "database connection management"

return precise results based on the meaning of the code, which both developers and autonomous agents can effortlessly navigate.

---

## System Design

FileSift is designed as a retrieval system with an emphasis on speed, privacy, and agent interoperability.

* **Indexing**: Code is parsed, chunked, and embedded directly using Jina AI code embedding models. This replaces earlier workflows that relied on expensive LLM summarization.
* **Storage**: Each indexed directory maintains its own `.filesift` store containing the necessary index layers.
* **Daemonized Search**: 
  * A background process keeps the indexes hot for near-instant retrieval.
  * Users and agents can start searching the fast primitive index immediately without waiting for the full semantic index to finish building.

---

## Agent & UX Workflows

* **Humans**: Exposes a fast CLI to intuitively query the codebase manually.
* **Agents**: Includes a built-in MCP server that autonomous coding agents can connect to. This enables agents to perform semantic retrieval over an entire repository without needing to scrape or read every file individually.

---

## Technical & UX Considerations

* **Privacy First**: Complete isolation. By running the Jina embeddings locally, your codebase context is completely secure.
* **Warm search latency**: <1 second via the background daemon.
* **Graceful Search Degradation**: The ability to query an initial primitive index means you don't have to wait for large monolithic indexing jobs to finish before getting to work.

---

## Design Philosophy

FileSift prioritizes:

* **Absolute Privacy**: Fully local execution over hosted third-party services.
* **Agentic First-Class Support**: Building retrieval primitives specifically for LLM-based coding agents (MCP, Skills)—not just human eyeballs.

The project serves as a foundational tool for the next generation of AI-native developer workflows, bridging the gap between how humans and autonomous systems navigate deep codebase structures.
