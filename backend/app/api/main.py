from fastapi import APIRouter

from app.api.routes import items, login, private, users, utils, tags, events, user_tags
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)

api_router.include_router(tags.router)
api_router.include_router(events.router)
api_router.include_router(user_tags.router)

if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
