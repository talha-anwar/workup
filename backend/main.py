from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import auth, projects, bids, contracts, reviews, search, reports, admin, users

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="WorkUp API", 
    version="1.0.0",
    swagger_ui_parameters={"persistAuthorization": True}
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000/",
        "http://localhost:5500/",
        "http://127.0.0.1:5500/"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(bids.router)
app.include_router(contracts.router)
app.include_router(reviews.router)
app.include_router(search.router)
app.include_router(reports.router)
app.include_router(admin.router)
app.include_router(users.router)


@app.get("/")
def root():
    return {"message": "WorkUp API is running"}