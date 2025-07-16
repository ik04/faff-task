from fastapi import FastAPI
from app.routes import voice, ws


app = FastAPI()
app.include_router(voice.router)
app.include_router(ws.router)