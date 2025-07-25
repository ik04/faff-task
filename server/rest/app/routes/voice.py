from fastapi import APIRouter, HTTPException, Request
from app.schemas import VoiceTaskRequest
from app.utils import build_system_prompt
import httpx
import os
from dotenv import load_dotenv
from app.websockets import broadcast

load_dotenv()  

router = APIRouter()
VAPI_API_KEY = os.getenv("VAPI_API_KEY")
PHONE_NUMBER_ID = os.getenv("VAPI_PHONE_NUMBER_ID")
CALLBACK_URL = os.getenv("CALLBACK_URL") # ngrok link for testing
VAPI_BASE_URL = "https://api.vapi.ai"

@router.post("/vapi/call")
async def place_call(request: VoiceTaskRequest):
    if not VAPI_API_KEY:
        raise HTTPException(status_code=500, detail="VAPI_API_KEY not configured")
    
    if not PHONE_NUMBER_ID:
        raise HTTPException(status_code=500, detail="VAPI_PHONE_NUMBER_ID not configured")
    
    prompt = build_system_prompt(request)
    
    headers = {
        "Authorization": f"Bearer {VAPI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "phoneNumberId": PHONE_NUMBER_ID,
        "customer": {
            "number": request.phone_number
        },
        "assistant": {
            "model": {
                "provider": "anthropic",
                "model": "claude-3-sonnet-20240229",
                "messages": [
                    {
                        "role": "system",
                        "content": prompt
                    }
                ],
                "functions": [
                    {
                        "name": "endCall",
                        "description": "End the phone call when the task is completed or when the user wants to hang up",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "reason": {
                                    "type": "string",
                                    "description": "Reason for ending the call"
                                }
                            },
                            "required": ["reason"]
                        }
                    }
                ]
            },
            "voice": {
                "provider": "11labs",
                "voiceId": "pGYsZruQzo8cpdFVZyJc",
                "model": "eleven_multilingual_v2",
                "stability": 0.5,
                "similarityBoost": 0.8,
                "style": 0.0,
                "useSpeakerBoost": True
            },
            "firstMessage": f"Hello, this is Nova calling on behalf of {request.user_name or 'a client'}. May I know who I'm speaking with?",
            "summaryPrompt": "Write a short natural-language summary of what happened on the call, clearly stating whether the task was completed or what the outcome was.",
            "callbackUrl": CALLBACK_URL,
            "endCallMessage": "Thank you for your time. Have a great day!",
            "endCallFunctionEnabled": True
        }
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{VAPI_BASE_URL}/call",
                headers=headers,
                json=payload
            )
            
            response.raise_for_status() 
            
            return {
                "message": "Call initiated successfully", 
                "vapi_response": response.json()
            }
    
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"VAPI API error: {e.response.text}"
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Request failed: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/vapi/webhook")
async def handle_vapi_webhook(request: Request):
    data = await request.json()
    await broadcast(data)

    return {"message": "Full webhook data broadcasted"}
