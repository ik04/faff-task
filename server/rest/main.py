from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import voice, ws


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://faff-task.vercel.app/","http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(voice.router)
app.include_router(ws.router)