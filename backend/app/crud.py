import uuid
from typing import Any
from uuid import UUID

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import Item, ItemCreate, User, UserCreate, UserUpdate, Tag, TagCreate, TagUpdate, EventCreate, Event, \
    EventUpdate, UserTagLink


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


def create_tag(*, session: Session, tag_in: TagCreate) -> Tag:
    """
    Создаёт новый тэг. Если тэг с таким именем уже есть — вернёт ошибку на уровне БД (unique constraint)
    """
    db_tag = Tag.model_validate(tag_in)
    session.add(db_tag)
    session.commit()
    session.refresh(db_tag)
    return db_tag


def get_tag_by_id(*, session: Session, tag_id: uuid.UUID) -> Tag | None:
    statement = select(Tag).where(Tag.id == tag_id)
    return session.exec(statement).first()


def get_tag_by_name(*, session: Session, name: str) -> Tag | None:
    statement = select(Tag).where(Tag.name == name)
    return session.exec(statement).first()


def get_tags(
        *, session: Session, skip: int = 0, limit: int = 100
) -> list[Tag]:
    statement = select(Tag).offset(skip).limit(limit)
    return session.exec(statement).all()


def update_tag(
        *, session: Session, db_tag: Tag, tag_in: TagUpdate
) -> Tag:
    tag_data = tag_in.model_dump(exclude_unset=True)
    db_tag.sqlmodel_update(tag_data)
    session.add(db_tag)
    session.commit()
    session.refresh(db_tag)
    return db_tag


def delete_tag(*, session: Session, db_tag: Tag) -> None:
    session.delete(db_tag)
    session.commit()


# ——— EVENT CRUD ———

def create_event(
        *, session: Session, event_in: EventCreate
) -> Event:
    """
    Создаёт событие. В EventCreate должно быть поле host_id.
    """
    db_event = Event.model_validate(event_in)
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    return db_event


def get_event_by_id(*, session: Session, event_id: uuid.UUID) -> Event | None:
    statement = select(Event).where(Event.id == event_id)
    return session.exec(statement).first()


def get_events(
        *, session: Session, skip: int = 0, limit: int = 100
) -> list[Event]:
    statement = select(Event).offset(skip).limit(limit)
    return session.exec(statement).all()


def get_events_for_user(
        *, session: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[Event]:
    statement = (
        select(Event)
        .where(Event.host_id == user_id)
        .offset(skip)
        .limit(limit)
    )
    return session.exec(statement).all()


def update_event(
        *, session: Session, db_event: Event, event_in: EventUpdate
) -> Event:
    event_data = event_in.model_dump(exclude_unset=True)
    db_event.sqlmodel_update(event_data)
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    return db_event


def delete_event(*, session: Session, db_event: Event) -> None:
    session.delete(db_event)
    session.commit()


def get_tags_for_user(
        *, session: Session, user_id: UUID
) -> list[Tag]:
    statement = (
        select(Tag)
        .join(UserTagLink, UserTagLink.tag_id == Tag.id)
        .where(UserTagLink.user_id == user_id)
    )
    return session.exec(statement).all()


def add_tag_to_user(
        *, session: Session, user_id: UUID, tag_id: UUID
) -> None:
    # Проверяем, что юзер и тэг существуют
    user = session.get(User, user_id)
    tag = session.get(Tag, tag_id)
    if not user or not tag:
        return None

    # Проверяем, что связь ещё не существует
    exists = session.exec(
        select(UserTagLink).where(
            (UserTagLink.user_id == user_id) &
            (UserTagLink.tag_id == tag_id)
        )
    ).first()
    if exists:
        return None

    link = UserTagLink(user_id=user_id, tag_id=tag_id)
    session.add(link)
    session.commit()


def remove_tag_from_user(
        *, session: Session, user_id: UUID, tag_id: UUID
) -> None:
    link = session.exec(
        select(UserTagLink).where(
            (UserTagLink.user_id == user_id) &
            (UserTagLink.tag_id == tag_id)
        )
    ).first()
    if not link:
        return None
    session.delete(link)
    session.commit()
