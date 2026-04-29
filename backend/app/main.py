from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import user, product, supplier, purchase_order, report
from app.routers import auth, products, suppliers, purchase_orders, ai, invoices

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartStore AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(suppliers.router)
app.include_router(purchase_orders.router)
app.include_router(ai.router)
app.include_router(invoices.router)

@app.get("/")
def root():
    return {"message": "SmartStore AI is running"}