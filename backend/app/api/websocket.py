from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.simulation.engine import sim_engine

router = APIRouter()

@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await websocket.accept()
    await sim_engine.register_websocket(websocket)
    try:
        await sim_engine._execute_tick()
    except Exception:
        pass
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        await sim_engine.unregister_websocket(websocket)
    except Exception:
        await sim_engine.unregister_websocket(websocket)
