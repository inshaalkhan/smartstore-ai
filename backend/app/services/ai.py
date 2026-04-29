from groq import Groq
from sqlalchemy.orm import Session
from app.models.product import Product, StockHistory
from app.models.purchase_order import PurchaseOrder, POLineItem
from app.models.supplier import Supplier
from datetime import date, datetime, timedelta
import os
import json

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are SmartStore AI, an intelligent assistant for a retail inventory management system.
You help store managers with stock levels, supplier information, purchase orders, and business insights.
Always use the available tools to fetch real data before answering questions about inventory or orders.
Never make up stock numbers, prices, or supplier details — always call a tool first.
Be concise, helpful, and professional."""

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_low_stock_products",
            "description": "Get all products that are low on stock or below their reorder threshold",
            "parameters": {
                "type": "object",
                "properties": {
                    "threshold_pct": {
                        "type": "number",
                        "description": "Percentage of reorder threshold to check against (default 100 means at or below threshold)"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_product_detail",
            "description": "Get full details of a specific product by name or ID",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_name": {
                        "type": "string",
                        "description": "Name of the product to look up"
                    },
                    "product_id": {
                        "type": "integer",
                        "description": "ID of the product to look up"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_po_history",
            "description": "Get purchase order history, optionally filtered by supplier or number of days",
            "parameters": {
                "type": "object",
                "properties": {
                    "supplier_name": {
                        "type": "string",
                        "description": "Filter by supplier name"
                    },
                    "days": {
                        "type": "integer",
                        "description": "Number of days to look back (default 30)"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_expiring_products",
            "description": "Get products that are expiring within a certain number of days",
            "parameters": {
                "type": "object",
                "properties": {
                    "days_ahead": {
                        "type": "integer",
                        "description": "Number of days ahead to check for expiry (default 14)"
                    }
                },
                "required": []
            }
        }
    }
]

def run_tool(tool_name: str, tool_args: dict, db: Session):
    if tool_name == "get_low_stock_products":
        products = db.query(Product).filter(
            Product.is_active == True,
            Product.stock_qty <= Product.reorder_threshold
        ).all()
        return [
            {
                "id": p.id,
                "name": p.name,
                "stock_qty": p.stock_qty,
                "reorder_threshold": p.reorder_threshold,
                "category": p.category
            }
            for p in products
        ]

    elif tool_name == "get_product_detail":
        query = db.query(Product).filter(Product.is_active == True)
        if tool_args.get("product_id"):
            product = query.filter(Product.id == tool_args["product_id"]).first()
        elif tool_args.get("product_name"):
            product = query.filter(
                Product.name.ilike(f"%{tool_args['product_name']}%")
            ).first()
        else:
            return {"error": "Please provide product_id or product_name"}
        if not product:
            return {"error": "Product not found"}
        return {
            "id": product.id,
            "name": product.name,
            "sku": product.sku,
            "category": product.category,
            "stock_qty": product.stock_qty,
            "unit_price": product.unit_price,
            "expiry_date": str(product.expiry_date) if product.expiry_date else None,
            "reorder_threshold": product.reorder_threshold,
            "supplier_id": product.supplier_id
        }

    elif tool_name == "get_po_history":
        days = tool_args.get("days", 30)
        since = datetime.utcnow() - timedelta(days=days)
        query = db.query(PurchaseOrder).filter(PurchaseOrder.created_at >= since)
        if tool_args.get("supplier_name"):
            supplier = db.query(Supplier).filter(
                Supplier.name.ilike(f"%{tool_args['supplier_name']}%")
            ).first()
            if supplier:
                query = query.filter(PurchaseOrder.supplier_id == supplier.id)
        pos = query.order_by(PurchaseOrder.created_at.desc()).all()
        return [
            {
                "id": po.id,
                "supplier_id": po.supplier_id,
                "status": po.status,
                "created_at": str(po.created_at),
                "line_items": [
                    {
                        "product_name": item.product_name,
                        "qty": item.qty,
                        "unit_price": item.unit_price
                    }
                    for item in po.line_items
                ]
            }
            for po in pos
        ]

    elif tool_name == "get_expiring_products":
        days_ahead = tool_args.get("days_ahead", 14)
        expiry_limit = date.today() + timedelta(days=days_ahead)
        products = db.query(Product).filter(
            Product.is_active == True,
            Product.expiry_date != None,
            Product.expiry_date <= expiry_limit
        ).all()
        return [
            {
                "id": p.id,
                "name": p.name,
                "expiry_date": str(p.expiry_date),
                "stock_qty": p.stock_qty,
                "category": p.category
            }
            for p in products
        ]

    return {"error": f"Unknown tool: {tool_name}"}

def detect_and_run_tool(message: str, db: Session):
    message_lower = message.lower()
    
    if any(word in message_lower for word in ["low stock", "running out", "reorder", "low on stock"]):
        return "get_low_stock_products", run_tool("get_low_stock_products", {}, db)
    
    elif any(word in message_lower for word in ["expir", "expire", "expiry"]):
        return "get_expiring_products", run_tool("get_expiring_products", {"days_ahead": 14}, db)
    
    elif any(word in message_lower for word in ["purchase order", "po history", "orders", "ordered"]):
        return "get_po_history", run_tool("get_po_history", {"days": 30}, db)
    
    elif any(word in message_lower for word in ["detail", "tell me about", "info about", "what is", "price of", "stock of"]):
        words = message.split()
        for i, word in enumerate(words):
            if word.lower() in ["about", "of", "for"]:
                product_name = " ".join(words[i+1:])
                return "get_product_detail", run_tool("get_product_detail", {"product_name": product_name}, db)
        return "get_product_detail", run_tool("get_product_detail", {"product_name": message}, db)
    
    return None, None


def chat_with_ai(messages: list, db: Session):
    last_message = messages[-1]["content"] if messages else ""
    
    tool_name, tool_result = detect_and_run_tool(last_message, db)
    
    if tool_result is not None:
        tool_context = f"""
The user asked: {last_message}

Here is the real data from the database for tool '{tool_name}':
{json.dumps(tool_result, indent=2)}

Please answer the user's question using ONLY this data. Do not make up any numbers.
"""
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": tool_context}
            ],
            max_tokens=1000
        )
    else:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages,
            max_tokens=1000
        )
    
    return response.choices[0].message.content