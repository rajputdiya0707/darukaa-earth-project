from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine
from .routers import auth, projects, sites

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Darukaa.Earth API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your deployed frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(sites.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "darukaa-earth-api"}


@app.get("/health")
def health():
    return {"status": "healthy"}
