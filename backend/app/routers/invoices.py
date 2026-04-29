from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.auth import get_current_user
from app.models.product import Product, StockHistory
import base64
import json
import os
from groq import Groq

router = APIRouter(prefix="/invoices", tags=["invoices"])
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@router.post("/parse")
async def parse_invoice(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    allowed_types = ["image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG and PNG images are supported"
        )

    contents = await file.read()
    base64_image = base64.b64encode(contents).decode("utf-8")

    prompt = """You are an invoice parser. Extract the following from this invoice image and return ONLY valid JSON, nothing else:
{
  "supplier_name": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "line_items": [
    {
      "name": "product name",
      "qty": number,
      "unit_price": number,
      "total": number
    }
  ],
  "grand_total": number or null
}
If you cannot extract a field, set it to null. Return ONLY the JSON object, no explanation."""

    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{file.content_type};base64,{base64_image}"
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ],
        max_tokens=1000
    )

    raw = response.choices[0].message.content.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=422,
            detail="Could not parse invoice. Please fill in manually."
        )

    return parsed


@router.post("/confirm-receipt")
def confirm_receipt(
    payload: dict,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    line_items = payload.get("line_items", [])
    updated = []

    for item in line_items:
        product = db.query(Product).filter(
            Product.name.ilike(f"%{item['name']}%"),
            Product.is_active == True
        ).first()

        if product:
            old_qty = product.stock_qty
            product.stock_qty += int(item.get("qty", 0))
            history = StockHistory(
                product_id=product.id,
                change_qty=int(item.get("qty", 0)),
                reason=f"Invoice receipt from {payload.get('supplier_name', 'unknown')}"
            )
            db.add(history)
            updated.append({
                "product": product.name,
                "old_qty": old_qty,
                "new_qty": product.stock_qty
            })

    db.commit()
    return {
        "message": f"Stock updated for {len(updated)} products",
        "updates": updated
    }