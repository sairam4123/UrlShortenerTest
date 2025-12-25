from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db import Base


class LinkMetadata(Base):
    __tablename__ = "link_metadata"

    link_id: Mapped[str] = mapped_column(ForeignKey("links.id"), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    long_url: Mapped[str] = mapped_column(String)
    clicks: Mapped[int] = mapped_column(Integer, default=0)
    last_ip: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    link: Mapped["Link"] = relationship("Link", back_populates="link_metadata")


class LinkClickLog(Base):
    __tablename__ = "link_click_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    link_id: Mapped[str] = mapped_column(ForeignKey("links.id"), index=True)
    click_ip: Mapped[Optional[str]] = mapped_column(String)
    timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime)
    user_agent: Mapped[Optional[str]] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    link: Mapped["Link"] = relationship("Link", back_populates="logs")


class Link(Base):
    __tablename__ = "links"

    id: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    long_url: Mapped[str] = mapped_column(String, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    link_metadata: Mapped["LinkMetadata"] = relationship("LinkMetadata", back_populates="link", uselist=False)
    logs: Mapped[list["LinkClickLog"]] = relationship("LinkClickLog", back_populates="link")
