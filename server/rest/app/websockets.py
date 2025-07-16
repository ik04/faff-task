from fastapi import WebSocket
from typing import List

active_connections: List[WebSocket] = []

async def connect_socket(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)

async def disconnect_socket(websocket: WebSocket):
    active_connections.remove(websocket)

async def broadcast(data: dict):
    for connection in active_connections:
        await connection.send_json(data)
