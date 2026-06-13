# TmBE — Run Commands

## Prerequisites

Ensure the virtual environment is set up before running any commands.

---

## Setup Virtual Environment

```bash
cd TmBE
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## Run the FastAPI Server

```bash
cd /Users/anwarshah/Desktop/PPro/TMLearning/TmBE
source venv/bin/activate
uvicorn app.main:app --reload
```

> Server runs at: **http://127.0.0.1:8000**  
> API docs available at: **http://127.0.0.1:8000/docs**

---

## Notes

- `uvicorn` is installed inside `venv/` — always activate the virtual environment first.
- The `--reload` flag enables hot-reload on file changes (for development only).
- Run from the `TmBE/` root directory so `app.main` resolves correctly.
