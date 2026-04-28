from fastapi import FastAPI
from app.database import engine, Base
from app.models import user, product, supplier, purchase_order, report

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartStore AI")

@app.get("/")
def root():
    return {"message": "SmartStore AI is running"} 
