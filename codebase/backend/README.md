# VLearn LangChain Chatbot Backend

Python service implementing the exact `POST /api/chatbot` contract used by the Vinext frontend.

## Scope

- FastAPI request/response validation.
- LangGraph workflow: context guardrail → LangChain answer → output guardrail.
- Grounded system prompt using prioritized `selectedRegions[].parsedText` plus deduplicated `slideContexts` for the selected page and its `-1/+1` neighbors.
- Source-aware citations: `[Vùng n]` for freehand evidence and `[Slide n]` for contextual evidence.
- No vector RAG, persistence or vision analysis in this baseline; slide text is extracted locally from the PDF text layer.
- `previewUrl` is accepted for API compatibility but is not sent to the text-only model.

## Local setup

Requires Python 3.10+.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
Copy-Item .env.example .env
```

Fill `OPENAI_API_KEY` and, if needed, change `OPENAI_MODEL` in `.env`.

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

Health check: `GET http://127.0.0.1:8000/health`.

## Test

```powershell
python -m pytest
```

The Vinext proxy should use:

```env
BACKEND_CHATBOT_SERVICE_URL=http://127.0.0.1:8000/api/chatbot
```
