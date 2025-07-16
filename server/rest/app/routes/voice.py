from fastapi import APIRouter, HTTPException
from app.schemas import VoiceTaskRequest
from app.utils import build_system_prompt, VAPI_BASE_URL, HEADERS, AGENT_ID
import requests

router = APIRouter()

@router.post("/vapi/call")
async def place_call(request: VoiceTaskRequest):
    prompt = build_system_prompt(request)

    payload = {
        "agent_id": AGENT_ID,
        "phone_number": request.phone_number,
        "assistant": {
            "first_message": f"Hello, this is Nova calling on behalf of {request.user_name or 'a client'}. May I know who I'm speaking with?",
            "model": "claude-4",
            "system_prompt": prompt,
            "summary_prompt": "Write a short natural-language summary of what happened on the call, clearly stating whether the task was completed or what the outcome was.",
            "output_schema": {
                "status": "completed | failed | transferred | in_progress",
                "action_taken": "brief summary of what was done",
                "follow_up_required": "true | false",
                "notes": "important context, answers, or quotes gathered during the call"
            }
        },
        "voice": {
            "provider": "11labs",
            "voice_id": "eleven_turbo_v2_5"
        },
        "transcriber": {
            "provider": "azure"
        },
        "silence_timeout": 200
    }

    response = requests.post(f"{VAPI_BASE_URL}/calls", json=payload, headers=HEADERS)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Vapi API error: {response.text}")

    return {"message": "Call initiated successfully", "vapi_response": response.json()}