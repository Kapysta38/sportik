import uuid

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.api.deps import SessionDep, CurrentUser
from app.crud import get_tags_for_user, add_tag_to_user, remove_tag_from_user
from app.models import TagPublic

router = APIRouter(prefix="/users/{user_id}/tags", tags=["user-tags"])


@router.get("/", response_model=list[TagPublic])
def list_user_tags(
        user_id: uuid.UUID,
        session: SessionDep,
        current_user: CurrentUser,
):
    # можно дать возможность смотреть тэги только себе или суперу
    if not current_user.is_superuser and current_user.id != user_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not enough permissions")

    return get_tags_for_user(session=session, user_id=user_id)


@router.post(
    "/{tag_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def assign_tag(
        *,
        user_id: uuid.UUID,
        tag_id: uuid.UUID,
        session: SessionDep,
):
    add_tag_to_user(session=session, user_id=user_id, tag_id=tag_id)


@router.delete(
    "/{tag_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def unassign_tag(
        *,
        user_id: uuid.UUID,
        tag_id: uuid.UUID,
        session: SessionDep,
):
    remove_tag_from_user(session=session, user_id=user_id, tag_id=tag_id)
