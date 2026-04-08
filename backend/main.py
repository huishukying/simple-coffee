from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime
import psycopg2
import psycopg2.extras
import json

#database
DB_CONFIG = {
    "host": "localhost",
    "database": "coffee_shop_db",
    "user": "shukyinghui",
    "password": "",
    "port": "5432"
}

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def init_database():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                customer_name VARCHAR(100) NOT NULL,
                customer_email VARCHAR(100) NOT NULL,
                customer_address TEXT NOT NULL,
                items JSONB NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                order_date TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()
        print("Database initialized")
    else:
        print("Failed to initialize database")

#FastAPI

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_database()

class OrderItem(BaseModel):
    name: str
    quantity: int
    price: float

class Order(BaseModel):
    customer_name: str
    customer_email: str
    customer_address: str
    items: List[OrderItem]
    total_amount: float
    order_date: str

@app.get("/")
def root():
    return {"message": "Coffee Shop API is running with PostgreSQL", "endpoints": ["POST /api/orders", "GET /api/orders"]}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.post("/api/orders")
def create_order(order: Order):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor()

        items_json = json.dumps([item.dict() for item in order.items])

        cursor.execute("""
            INSERT INTO orders (customer_name, customer_email, customer_address, items, total_amount, order_date)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            order.customer_name,
            order.customer_email,
            order.customer_address,
            items_json,
            order.total_amount,
            order.order_date
        ))

        order_id = cursor.fetchone()[0]
        conn.commit()

        print(f"Order {order_id} saved to PostgreSQL from {order.customer_name}")
        print(f"Total: ${order.total_amount}")
        print(f"Items: {len(order.items)}")

        cursor.close()
        conn.close()

        return {
            "message": "Order created successfully",
            "order_id": order_id,
            "status": "success"
        }
    except Exception as e:
        print(f"Error saving order: {e}")
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/orders")
def get_all_orders():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("""
            SELECT id, customer_name, customer_email, customer_address, items, total_amount, order_date, created_at
            FROM orders
            ORDER BY created_at DESC
        """)

        orders = cursor.fetchall()
        
        cursor.close()
        conn.close()

        return {
            "count": len(orders),
            "orders": orders
        }
    except Exception as e:
        print(f"Error fetching orders: {e}")
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


#get specific order
@app.get("/api/orders/{order_id}")
def get_order_id(order_id: int):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Database connection failed")
    try:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute("""
            SELECT id, customer_name, customer_email, customer_address, items, total_amount, order_date, created_at
            FROM orders
            WHERE id = %s
        """, (order_id,))

        order = cursor.fetchone()
        
        cursor.close()
        conn.close()

        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        return order

    except Exception as e:
        print(f"Error fetching orders: {e}")
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
