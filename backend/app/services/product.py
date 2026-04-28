from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.product import Product, StockHistory
from app.schemas.product import ProductCreate, ProductUpdate
from datetime import date

def get_all_products(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    category: str = None,
    status: str = None,
    keyword: str = None
):
    query = db.query(Product).filter(Product.is_active == True)

    if category:
        query = query.filter(Product.category == category)

    if keyword:
        query = query.filter(Product.name.ilike(f"%{keyword}%"))

    if status == "low":
        query = query.filter(Product.stock_qty <= Product.reorder_threshold)
    elif status == "critical":
        query = query.filter(Product.stock_qty == 0)
    elif status == "expired":
        query = query.filter(Product.expiry_date <= date.today())

    total = query.count()
    products = query.offset((page - 1) * page_size).limit(page_size).all()
    return products, total

def get_product_by_id(db: Session, product_id: int):
    return db.query(Product).filter(
        Product.id == product_id,
        Product.is_active == True
    ).first()

def create_product(db: Session, product: ProductCreate):
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, updates: ProductUpdate):
    product = get_product_by_id(db, product_id)
    if not product:
        return None
    update_data = updates.model_dump(exclude_unset=True)
    old_qty = product.stock_qty
    for key, value in update_data.items():
        setattr(product, key, value)
    if "stock_qty" in update_data:
        change = update_data["stock_qty"] - old_qty
        history = StockHistory(
            product_id=product_id,
            change_qty=change,
            reason="manual update"
        )
        db.add(history)
    db.commit()
    db.refresh(product)
    return product

def delete_product(db: Session, product_id: int):
    product = get_product_by_id(db, product_id)
    if not product:
        return None
    product.is_active = False
    db.commit()
    return product

def get_stock_history(db: Session, product_id: int):
    return db.query(StockHistory).filter(
        StockHistory.product_id == product_id
    ).order_by(StockHistory.created_at.desc()).all()

def get_forecast(db: Session, product_id: int):
    from datetime import datetime, timedelta
    history = db.query(StockHistory).filter(
        StockHistory.product_id == product_id,
        StockHistory.change_qty < 0
    ).order_by(StockHistory.created_at.desc()).limit(30).all()

    if not history:
        avg_demand = 5
    else:
        total = sum(abs(h.change_qty) for h in history)
        avg_demand = total / len(history)

    forecast = []
    for i in range(1, 8):
        forecast.append({
            "date": (datetime.today() + timedelta(days=i)).strftime("%Y-%m-%d"),
            "predicted_demand": round(avg_demand, 2)
        })
    return forecast