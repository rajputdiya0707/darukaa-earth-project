from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""


class ProjectOut(BaseModel):
    id: int
    name: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


class SiteCreate(BaseModel):
    name: str
    geometry: Any  # GeoJSON Polygon
    area_hectares: Optional[float] = 0.0


class SiteOut(BaseModel):
    id: int
    project_id: int
    name: str
    geometry: Any
    area_hectares: float
    created_at: datetime

    class Config:
        from_attributes = True


class AnalyticsPoint(BaseModel):
    date: str
    carbon_tonnes: float
    canopy_cover_pct: float
    biodiversity_index: float


class SiteAnalytics(BaseModel):
    site_id: int
    site_name: str
    points: List[AnalyticsPoint]
