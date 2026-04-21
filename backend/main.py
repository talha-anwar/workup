"""Backend application entrypoint."""

from fastapi import FastAPI

app = FastAPI(title="WorkUp API", version="0.1.0")


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    """Simple health endpoint for local smoke tests."""
    return {"status": "ok"}

