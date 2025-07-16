from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websockets import connect_socket, disconnect_socket

router = APIRouter()

@router.websocket("/ws/updates")
async def websocket_endpoint(websocket: WebSocket):
    await connect_socket(websocket)
    try:
        while True:
            await websocket.receive_text()  
    except WebSocketDisconnect:
        await disconnect_socket(websocket)
