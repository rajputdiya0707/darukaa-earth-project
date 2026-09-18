import hashlib
import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_user

router = APIRouter(tags=["sites"])


def _get_owned_project(project_id: int, db: Session, user: models.User) -> models.Project:
    project = db.query(models.Project).filter(models.Project.id == project_id, models.Project.owner_id == user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/projects/{project_id}/sites", response_model=schemas.SiteOut)
def create_site(project_id: int, payload: schemas.SiteCreate, db: Session = Depends(get_db),
                 user: models.User = Depends(get_current_user)):
    _get_owned_project(project_id, db, user)
    site = models.Site(project_id=project_id, name=payload.name, geometry=payload.geometry,
                        area_hectares=payload.area_hectares or 0.0)
    db.add(site)
    db.commit()
    db.refresh(site)
    return site


@router.get("/projects/{project_id}/sites", response_model=List[schemas.SiteOut])
def list_sites(project_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    _get_owned_project(project_id, db, user)
    return db.query(models.Site).filter(models.Site.project_id == project_id).all()


@router.get("/sites/{site_id}", response_model=schemas.SiteOut)
def get_site(site_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    site = db.query(models.Site).join(models.Project).filter(
        models.Site.id == site_id, models.Project.owner_id == user.id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site


@router.get("/sites/{site_id}/analytics", response_model=schemas.SiteAnalytics)
def get_site_analytics(site_id: int, months: int = 12, db: Session = Depends(get_db),
                        user: models.User = Depends(get_current_user)):
    """
    Deterministic mock analytics generator (documented as a dataset/mock choice in the README).
    Seeds off the site id so results are stable across refreshes without needing a real
    remote-sensing pipeline in the hackathon window.
    """
    site = db.query(models.Site).join(models.Project).filter(
        models.Site.id == site_id, models.Project.owner_id == user.id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    seed = int(hashlib.sha256(str(site_id).encode()).hexdigest(), 16) % (10 ** 8)
    rng = random.Random(seed)

    points = []
    today = datetime.utcnow()
    carbon = 100 + rng.uniform(0, 50)
    canopy = 40 + rng.uniform(0, 20)
    biodiversity = 0.5 + rng.uniform(0, 0.3)

    for i in range(months, 0, -1):
        month_date = (today - timedelta(days=30 * i)).strftime("%Y-%m")
        carbon += rng.uniform(-2, 4)
        canopy += rng.uniform(-1, 1.5)
        biodiversity += rng.uniform(-0.02, 0.03)
        points.append(schemas.AnalyticsPoint(
            date=month_date,
            carbon_tonnes=round(max(carbon, 0), 2),
            canopy_cover_pct=round(min(max(canopy, 0), 100), 2),
            biodiversity_index=round(min(max(biodiversity, 0), 1), 3),
        ))

    return schemas.SiteAnalytics(site_id=site.id, site_name=site.name, points=points)


@router.delete("/sites/{site_id}")
def delete_site(site_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    site = db.query(models.Site).join(models.Project).filter(
        models.Site.id == site_id, models.Project.owner_id == user.id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    db.delete(site)
    db.commit()
    return {"ok": True}
