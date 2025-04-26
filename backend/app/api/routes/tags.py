# app/api/routes/tags.py
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select, func

from app.api.deps import SessionDep, CurrentUser
from app.models import Tag, TagCreate, TagPublic, TagsPublic, TagUpdate, Message

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/", response_model=TagsPublic)
def read_tags(
    *,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve tags.
    """
    # тэги — глобальные, показываем всем
    count_stmt = select(func.count()).select_from(Tag)
    count = session.exec(count_stmt).one()
    stmt = select(Tag).offset(skip).limit(limit)
    tags = session.exec(stmt).all()
    return TagsPublic(data=tags, count=count)


@router.get("/{tag_id}", response_model=TagPublic)
def read_tag(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tag_id: uuid.UUID,
) -> Tag:
    """
    Get tag by ID.
    """
    tag = session.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@router.post("/", response_model=TagPublic, status_code=status.HTTP_201_CREATED)
def create_tag(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tag_in: TagCreate,
) -> Tag:
    """
    Create new tag (только суперпользователь).
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    tag = Tag.model_validate(tag_in)
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return tag


@router.put("/{tag_id}", response_model=TagPublic)
def update_tag(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tag_id: uuid.UUID,
    tag_in: TagUpdate,
) -> Tag:
    """
    Update a tag (только суперпользователь).
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    tag = session.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    update_data = tag_in.model_dump(exclude_unset=True)
    tag.sqlmodel_update(update_data)
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return tag


@router.delete("/{tag_id}", response_model=Message)
def delete_tag(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tag_id: uuid.UUID,
) -> Message:
    """
    Delete a tag (только суперпользователь).
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    tag = session.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    session.delete(tag)
    session.commit()
    return Message(message="Tag deleted successfully")
