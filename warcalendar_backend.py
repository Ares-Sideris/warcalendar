from fastapi import FastAPI, HTTPException, Depends, Header
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Table,
    ForeignKey,
    create_engine,
    and_,
    or_,
)
from sqlalchemy.orm import relationship, sessionmaker, declarative_base, Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import os

# --- Config ---
API_KEY = os.getenv("ADMIN_API_KEY", "supersecret")

# --- Database Setup ---
DATABASE_URL = "sqlite:///./events.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# --- Association Table ---
event_tag_association = Table(
    "event_tag",
    Base.metadata,
    Column("event_id", Integer, ForeignKey("events.id")),
    Column("tag_id", Integer, ForeignKey("tags.id")),
)


# --- Models ---
class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    type = Column(String, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    description = Column(String)
    image_url = Column(String)
    source_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    tags = relationship("Tag", secondary=event_tag_association, back_populates="events")


class Tag(Base):
    __tablename__ = "tags"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    events = relationship(
        "Event", secondary=event_tag_association, back_populates="tags"
    )


# --- Pydantic Schemas ---
class TagBase(BaseModel):
    name: str


class TagCreate(TagBase):
    pass


class TagRead(TagBase):
    id: int

    class Config:
        orm_mode = True


class EventBase(BaseModel):
    title: str
    type: str
    start_date: datetime
    end_date: datetime
    description: Optional[str] = None
    image_url: Optional[str] = None
    source_url: Optional[str] = None


class EventCreate(EventBase):
    tag_ids: list[int] = []


class EventRead(EventBase):
    id: int
    created_at: datetime
    tags: list[TagRead] = []

    class Config:
        orm_mode = True


class EventUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    source_url: Optional[str] = None
    tag_ids: Optional[list[int]] = None


class TagUpdate(TagBase):
    pass


# --- FastAPI App ---
app = FastAPI()

Base.metadata.create_all(bind=engine)


# --- Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")


# --- Routes ---
@app.post("/tags/", response_model=TagRead, dependencies=[Depends(verify_api_key)])
def create_tag(tag: TagCreate, db: Session = Depends(get_db)):
    db_tag = Tag(name=tag.name)
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag


@app.get("/tags/", response_model=list[TagRead])
def list_tags(db: Session = Depends(get_db)):
    return db.query(Tag).all()


@app.post("/events/", response_model=EventRead, dependencies=[Depends(verify_api_key)])
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    tags = db.query(Tag).filter(Tag.id.in_(event.tag_ids)).all()
    db_event = Event(**event.dict(exclude={"tag_ids"}))
    db_event.tags = tags
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


@app.get("/events/", response_model=list[EventRead])
def list_events(
    type: Optional[str] = None,
    tag: Optional[str] = None,
    active: Optional[bool] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Event)

    if type:
        query = query.filter(Event.type == type)

    if from_date:
        query = query.filter(Event.start_date >= from_date)
    if to_date:
        query = query.filter(Event.end_date <= to_date)

    if active:
        now = datetime.utcnow()
        query = query.filter(and_(Event.start_date <= now, Event.end_date >= now))

    if tag:
        query = query.join(Event.tags).filter(Tag.name == tag)

    return query.all()


@app.get("/events/{event_id}", response_model=EventRead)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@app.put(
    "/events/{event_id}",
    response_model=EventRead,
    dependencies=[Depends(verify_api_key)],
)
def update_event(event_id: int, event: EventUpdate, db: Session = Depends(get_db)):
    db_event = db.query(Event).filter(Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.tag_ids is not None:
        tags = db.query(Tag).filter(Tag.id.in_(event.tag_ids)).all()
        db_event.tags = tags

    for field, value in event.dict(exclude={"tag_ids"}, exclude_none=True).items():
        setattr(db_event, field, value)

    db.commit()
    db.refresh(db_event)
    return db_event


@app.delete("/events/{event_id}", dependencies=[Depends(verify_api_key)])
def delete_event(event_id: int, db: Session = Depends(get_db)):
    db_event = db.query(Event).filter(Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(db_event)
    db.commit()
    return {"detail": "deleted"}


@app.put(
    "/tags/{tag_id}", response_model=TagRead, dependencies=[Depends(verify_api_key)]
)
def update_tag(tag_id: int, tag: TagUpdate, db: Session = Depends(get_db)):
    db_tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not db_tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    db_tag.name = tag.name
    db.commit()
    db.refresh(db_tag)
    return db_tag


@app.delete("/tags/{tag_id}", dependencies=[Depends(verify_api_key)])
def delete_tag(tag_id: int, db: Session = Depends(get_db)):
    db_tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not db_tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    db.delete(db_tag)
    db.commit()
    return {"detail": "deleted"}
