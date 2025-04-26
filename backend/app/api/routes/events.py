# app/api/routes/events.py
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select, func

from app.api.deps import SessionDep, CurrentUser
from app.models import Event, EventCreate, EventPublic, EventsPublic, EventUpdate, Message

router = APIRouter(prefix="/events", tags=["events"])


@router.get("/", response_model=EventsPublic)
def read_events(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve events: все для суперюзера, свои — для остальных.
    """
    if current_user.is_superuser:
        count_stmt = select(func.count()).select_from(Event)
        stmt = select(Event).offset(skip).limit(limit)
    else:
        count_stmt = (
            select(func.count())
            .select_from(Event)
            .where(Event.host_id == current_user.id)
        )
        stmt = (
            select(Event)
            .where(Event.host_id == current_user.id)
            .offset(skip)
            .limit(limit)
        )
    count = session.exec(count_stmt).one()
    events = session.exec(stmt).all()
    return EventsPublic(data=events, count=count)


@router.get("/{event_id}", response_model=EventPublic)
def read_event(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    event_id: uuid.UUID,
) -> Any:
    """
    Get event by ID.
    """
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not current_user.is_superuser and event.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return event


@router.post("/", response_model=EventPublic, status_code=status.HTTP_201_CREATED)
def create_event(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    event_in: EventCreate,
) -> Any:
    """
    Create new event.
    """
    event = Event.model_validate(event_in, update={"host_id": current_user.id})
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


@router.put("/{event_id}", response_model=EventPublic)
def update_event(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    event_id: uuid.UUID,
    event_in: EventUpdate,
) -> Any:
    """
    Update an event.
    """
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not current_user.is_superuser and event.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    update_data = event_in.model_dump(exclude_unset=True)
    event.sqlmodel_update(update_data)
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


@router.delete("/{event_id}", response_model=Message)
def delete_event(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    event_id: uuid.UUID,
) -> Message:
    """
    Delete an event.
    """
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not current_user.is_superuser and event.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    session.delete(event)
    session.commit()
    return Message(message="Event deleted successfully")
