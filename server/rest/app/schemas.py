from pydantic import BaseModel
from typing import Optional

class VoiceTaskRequest(BaseModel):
    phone_number: str
    raw_intent: str
    user_name: Optional[str] = "a client"
    target_name: Optional[str] = None
    location: Optional[str] = None
    time: Optional[str] = None
