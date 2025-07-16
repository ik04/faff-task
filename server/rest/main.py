from fastapi import FastAPI
from app.routes import voice


app = FastAPI()
app.include_router(voice.router)
