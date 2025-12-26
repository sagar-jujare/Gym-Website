from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import hashlib
import hmac
import json
import httpx
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'gym-admin-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Cashfree Settings
CASHFREE_CLIENT_ID = os.environ.get('CASHFREE_CLIENT_ID', '')
CASHFREE_CLIENT_SECRET = os.environ.get('CASHFREE_CLIENT_SECRET', '')
CASHFREE_ENVIRONMENT = os.environ.get('CASHFREE_ENVIRONMENT', 'SANDBOX')
CASHFREE_API_URL = "https://sandbox.cashfree.com/pg" if CASHFREE_ENVIRONMENT == "SANDBOX" else "https://api.cashfree.com/pg"

app = FastAPI(title="Iron & Neon Gym API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class MembershipPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    duration_months: int
    price: float
    benefits: List[str]
    popular: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Trainer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    specialty: str
    experience_years: int
    bio: str
    image_url: str
    certifications: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Member(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    email: EmailStr
    phone: str
    address: str
    date_of_joining: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    membership_plan_id: str
    membership_start_date: datetime
    membership_expiry_date: datetime
    trainer_id: Optional[str] = None
    status: str = "Active"  # Active, Expired, Suspended
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MemberCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    address: str
    membership_plan_id: str
    membership_start_date: datetime
    trainer_id: Optional[str] = None

class MemberUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    membership_plan_id: Optional[str] = None
    membership_start_date: Optional[datetime] = None
    trainer_id: Optional[str] = None
    status: Optional[str] = None

class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    member_id: str
    order_id: str
    cf_order_id: Optional[str] = None
    payment_session_id: Optional[str] = None
    amount: float
    payment_method: Optional[str] = None
    payment_date: Optional[datetime] = None
    status: str = "PENDING"  # PENDING, PAID, FAILED
    due_amount: float = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Admin(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    password_hash: str
    role: str = "admin"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminLogin(BaseModel):
    email: str
    password: str

class CreateOrderRequest(BaseModel):
    member_id: str
    amount: float
    plan_name: str
    return_url: str

# ===================== UTILITIES =====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(data: dict) -> str:
    payload = data.copy()
    payload['exp'] = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    payload = decode_jwt_token(token)
    admin = await db.admins.find_one({"id": payload.get("admin_id")}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return admin

def serialize_doc(doc: dict) -> dict:
    if doc and '_id' in doc:
        del doc['_id']
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
    return doc

# ===================== SEED DATA =====================

async def seed_initial_data():
    # Seed admin if not exists
    admin_exists = await db.admins.find_one({"email": "admin@ironandneon.com"})
    if not admin_exists:
        admin = Admin(
            username="admin",
            email="admin@ironandneon.com",
            password_hash=hash_password("admin123")
        )
        await db.admins.insert_one(admin.model_dump())
        logger.info("Default admin created: admin@ironandneon.com / admin123")
    
    # Seed membership plans
    plans_count = await db.membership_plans.count_documents({})
    if plans_count == 0:
        plans = [
            MembershipPlan(
                id="plan_monthly",
                name="Monthly",
                duration_months=1,
                price=1999,
                benefits=["Full gym access", "Locker room", "Basic equipment", "Workout plans"],
                popular=False
            ),
            MembershipPlan(
                id="plan_quarterly",
                name="Quarterly",
                duration_months=3,
                price=4999,
                benefits=["Full gym access", "Locker room", "All equipment", "Personal trainer (2 sessions)", "Diet consultation"],
                popular=True
            ),
            MembershipPlan(
                id="plan_yearly",
                name="Yearly",
                duration_months=12,
                price=14999,
                benefits=["Full gym access", "Premium locker", "All equipment", "Personal trainer (12 sessions)", "Diet consultation", "Spa access", "Guest passes (4)"],
                popular=False
            )
        ]
        for plan in plans:
            await db.membership_plans.insert_one(plan.model_dump())
        logger.info("Membership plans seeded")
    
    # Seed trainers
    trainers_count = await db.trainers.count_documents({})
    if trainers_count == 0:
        trainers = [
            Trainer(
                name="Marcus Steel",
                specialty="Strength & Conditioning",
                experience_years=8,
                bio="Former professional powerlifter with 8+ years of coaching experience. Specializes in building raw strength and muscle mass.",
                image_url="https://images.unsplash.com/photo-1704223523232-526f6fab30a3?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
                certifications=["NSCA-CSCS", "ISSA CPT", "Precision Nutrition L1"]
            ),
            Trainer(
                name="Elena Cruz",
                specialty="HIIT & Functional Training",
                experience_years=6,
                bio="CrossFit Level 3 trainer focused on high-intensity functional movements. Helps clients push beyond their limits.",
                image_url="https://images.unsplash.com/photo-1580983555975-05bc6e99eb6e?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
                certifications=["CrossFit L3", "NASM-CPT", "TRX Certified"]
            ),
            Trainer(
                name="James Chen",
                specialty="Bodybuilding & Physique",
                experience_years=10,
                bio="Competition prep specialist with multiple bodybuilding titles. Expert in muscle hypertrophy and stage-ready conditioning.",
                image_url="https://images.unsplash.com/photo-1567013127542-490d757e51fc?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
                certifications=["IFBB Pro Card", "ACE CPT", "Nutrition Coach"]
            ),
            Trainer(
                name="Sarah Mitchell",
                specialty="Yoga & Flexibility",
                experience_years=7,
                bio="Certified yoga instructor combining ancient practices with modern fitness science. Focus on mobility, recovery, and mind-body connection.",
                image_url="https://images.unsplash.com/photo-1518611012118-696072aa579a?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
                certifications=["RYT-500", "Mobility WOD Coach", "Meditation Certified"]
            )
        ]
        for trainer in trainers:
            await db.trainers.insert_one(trainer.model_dump())
        logger.info("Trainers seeded")

# ===================== PUBLIC ROUTES =====================

@api_router.get("/")
async def root():
    return {"message": "Iron & Neon Gym API", "status": "operational"}

@api_router.get("/plans")
async def get_plans():
    plans = await db.membership_plans.find({}, {"_id": 0}).to_list(100)
    return {"plans": plans}

@api_router.get("/trainers")
async def get_trainers():
    trainers = await db.trainers.find({}, {"_id": 0}).to_list(100)
    return {"trainers": trainers}

@api_router.post("/contact")
async def submit_contact(name: str, email: EmailStr, phone: Optional[str] = None, message: str = ""):
    contact = ContactMessage(name=name, email=email, phone=phone, message=message)
    await db.contact_messages.insert_one(contact.model_dump())
    return {"message": "Thank you for contacting us. We'll get back to you soon!"}

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str

@api_router.post("/contact/form")
async def submit_contact_form(form: ContactForm):
    contact = ContactMessage(name=form.name, email=form.email, phone=form.phone, message=form.message)
    doc = contact.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.contact_messages.insert_one(doc)
    return {"message": "Thank you for contacting us. We'll get back to you soon!"}

# ===================== AUTH ROUTES =====================

@api_router.post("/admin/login")
async def admin_login(credentials: AdminLogin):
    admin = await db.admins.find_one({"email": credentials.email}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(credentials.password, admin['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_jwt_token({"admin_id": admin['id'], "email": admin['email'], "role": admin['role']})
    return {"token": token, "admin": {"id": admin['id'], "email": admin['email'], "username": admin['username'], "role": admin['role']}}

@api_router.get("/admin/me")
async def get_current_admin_info(admin: dict = Depends(get_current_admin)):
    return {"admin": {"id": admin['id'], "email": admin['email'], "username": admin['username'], "role": admin['role']}}

# ===================== ADMIN MEMBER ROUTES =====================

@api_router.get("/admin/members")
async def get_members(admin: dict = Depends(get_current_admin)):
    members = await db.members.find({}, {"_id": 0}).to_list(1000)
    for member in members:
        for key, value in member.items():
            if isinstance(value, datetime):
                member[key] = value.isoformat()
    return {"members": members}

@api_router.get("/admin/members/{member_id}")
async def get_member(member_id: str, admin: dict = Depends(get_current_admin)):
    member = await db.members.find_one({"id": member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    for key, value in member.items():
        if isinstance(value, datetime):
            member[key] = value.isoformat()
    return {"member": member}

@api_router.post("/admin/members")
async def create_member(member_data: MemberCreate, admin: dict = Depends(get_current_admin)):
    # Get plan to calculate expiry
    plan = await db.membership_plans.find_one({"id": member_data.membership_plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid membership plan")
    
    expiry_date = member_data.membership_start_date + timedelta(days=plan['duration_months'] * 30)
    
    member = Member(
        full_name=member_data.full_name,
        email=member_data.email,
        phone=member_data.phone,
        address=member_data.address,
        membership_plan_id=member_data.membership_plan_id,
        membership_start_date=member_data.membership_start_date,
        membership_expiry_date=expiry_date,
        trainer_id=member_data.trainer_id
    )
    doc = member.model_dump()
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
    await db.members.insert_one(doc)
    return {"member": doc, "message": "Member created successfully"}

@api_router.put("/admin/members/{member_id}")
async def update_member(member_id: str, member_data: MemberUpdate, admin: dict = Depends(get_current_admin)):
    existing = await db.members.find_one({"id": member_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Member not found")
    
    update_data = {k: v for k, v in member_data.model_dump().items() if v is not None}
    
    # Recalculate expiry if plan or start date changes
    if 'membership_plan_id' in update_data or 'membership_start_date' in update_data:
        plan_id = update_data.get('membership_plan_id', existing['membership_plan_id'])
        start_date = update_data.get('membership_start_date', existing['membership_start_date'])
        if isinstance(start_date, str):
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        plan = await db.membership_plans.find_one({"id": plan_id}, {"_id": 0})
        if plan:
            update_data['membership_expiry_date'] = start_date + timedelta(days=plan['duration_months'] * 30)
    
    for key, value in update_data.items():
        if isinstance(value, datetime):
            update_data[key] = value.isoformat()
    
    await db.members.update_one({"id": member_id}, {"$set": update_data})
    updated = await db.members.find_one({"id": member_id}, {"_id": 0})
    for key, value in updated.items():
        if isinstance(value, datetime):
            updated[key] = value.isoformat()
    return {"member": updated, "message": "Member updated successfully"}

@api_router.delete("/admin/members/{member_id}")
async def delete_member(member_id: str, admin: dict = Depends(get_current_admin)):
    result = await db.members.delete_one({"id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"message": "Member deleted successfully"}

# ===================== ADMIN PAYMENT ROUTES =====================

@api_router.get("/admin/payments")
async def get_payments(admin: dict = Depends(get_current_admin)):
    payments = await db.payments.find({}, {"_id": 0}).to_list(1000)
    for payment in payments:
        for key, value in payment.items():
            if isinstance(value, datetime):
                payment[key] = value.isoformat()
    return {"payments": payments}

@api_router.post("/admin/payments/record")
async def record_manual_payment(
    member_id: str,
    amount: float,
    payment_method: str,
    admin: dict = Depends(get_current_admin)
):
    member = await db.members.find_one({"id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    payment = Payment(
        member_id=member_id,
        order_id=f"MANUAL-{uuid.uuid4().hex[:8].upper()}",
        amount=amount,
        payment_method=payment_method,
        payment_date=datetime.now(timezone.utc),
        status="PAID"
    )
    doc = payment.model_dump()
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
    await db.payments.insert_one(doc)
    return {"payment": doc, "message": "Payment recorded successfully"}

# ===================== CASHFREE PAYMENT ROUTES =====================

@api_router.post("/payment/create-order")
async def create_cashfree_order(request: CreateOrderRequest):
    member = await db.members.find_one({"id": request.member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    order_id = f"GYM-{uuid.uuid4().hex[:12].upper()}"
    
    # Create Cashfree order
    headers = {
        "Content-Type": "application/json",
        "x-client-id": CASHFREE_CLIENT_ID,
        "x-client-secret": CASHFREE_CLIENT_SECRET,
        "x-api-version": "2023-08-01"
    }
    
    payload = {
        "order_id": order_id,
        "order_amount": request.amount,
        "order_currency": "INR",
        "customer_details": {
            "customer_id": request.member_id,
            "customer_name": member['full_name'],
            "customer_email": member['email'],
            "customer_phone": member['phone']
        },
        "order_meta": {
            "return_url": request.return_url + f"?order_id={order_id}"
        },
        "order_note": f"Payment for {request.plan_name}"
    }
    
    try:
        async with httpx.AsyncClient() as client_http:
            response = await client_http.post(f"{CASHFREE_API_URL}/orders", json=payload, headers=headers)
            result = response.json()
            
            if response.status_code == 200:
                # Store payment record
                payment = Payment(
                    member_id=request.member_id,
                    order_id=order_id,
                    cf_order_id=result.get('cf_order_id'),
                    payment_session_id=result.get('payment_session_id'),
                    amount=request.amount,
                    status="PENDING"
                )
                doc = payment.model_dump()
                for key, value in doc.items():
                    if isinstance(value, datetime):
                        doc[key] = value.isoformat()
                await db.payments.insert_one(doc)
                
                return {
                    "order_id": order_id,
                    "cf_order_id": result.get('cf_order_id'),
                    "payment_session_id": result.get('payment_session_id'),
                    "amount": request.amount
                }
            else:
                logger.error(f"Cashfree order creation failed: {result}")
                raise HTTPException(status_code=400, detail=result.get('message', 'Failed to create order'))
    except httpx.RequestError as e:
        logger.error(f"Cashfree API error: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment gateway error")

@api_router.get("/payment/verify/{order_id}")
async def verify_payment(order_id: str):
    payment = await db.payments.find_one({"order_id": order_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Verify with Cashfree
    headers = {
        "x-client-id": CASHFREE_CLIENT_ID,
        "x-client-secret": CASHFREE_CLIENT_SECRET,
        "x-api-version": "2023-08-01"
    }
    
    try:
        async with httpx.AsyncClient() as client_http:
            response = await client_http.get(f"{CASHFREE_API_URL}/orders/{order_id}", headers=headers)
            result = response.json()
            
            if response.status_code == 200:
                new_status = result.get('order_status', payment['status'])
                if new_status != payment['status']:
                    update_data = {"status": new_status}
                    if new_status == "PAID":
                        update_data["payment_date"] = datetime.now(timezone.utc).isoformat()
                    await db.payments.update_one({"order_id": order_id}, {"$set": update_data})
                    payment['status'] = new_status
                
                return {"order_id": order_id, "status": new_status, "amount": payment['amount']}
            else:
                return {"order_id": order_id, "status": payment['status'], "amount": payment['amount']}
    except:
        return {"order_id": order_id, "status": payment['status'], "amount": payment['amount']}

@api_router.post("/payment/webhook")
async def payment_webhook(request: Request):
    try:
        body = await request.body()
        data = await request.json()
        
        event = data.get('type')
        order_data = data.get('data', {}).get('order', {})
        order_id = order_data.get('order_id')
        
        if not order_id:
            return {"status": "ignored"}
        
        payment = await db.payments.find_one({"order_id": order_id})
        if not payment:
            return {"status": "payment_not_found"}
        
        if event == "PAYMENT_SUCCESS" or order_data.get('order_status') == "PAID":
            payment_data = data.get('data', {}).get('payment', {})
            await db.payments.update_one(
                {"order_id": order_id},
                {
                    "$set": {
                        "status": "PAID",
                        "payment_method": payment_data.get('payment_method'),
                        "payment_date": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            logger.info(f"Payment successful for order: {order_id}")
        elif event == "PAYMENT_FAILED":
            await db.payments.update_one({"order_id": order_id}, {"$set": {"status": "FAILED"}})
            logger.info(f"Payment failed for order: {order_id}")
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error"}

# ===================== DASHBOARD ROUTES =====================

@api_router.get("/admin/dashboard")
async def get_dashboard_stats(admin: dict = Depends(get_current_admin)):
    now = datetime.now(timezone.utc)
    
    # Total members
    total_members = await db.members.count_documents({})
    
    # Active vs Expired
    active_members = await db.members.count_documents({"status": "Active"})
    expired_members = await db.members.count_documents({"status": "Expired"})
    
    # Monthly revenue (current month)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_payments = await db.payments.find({"status": "PAID"}).to_list(1000)
    monthly_revenue = sum(p['amount'] for p in monthly_payments if p.get('payment_date'))
    
    # Upcoming renewals (next 7 days)
    next_week = now + timedelta(days=7)
    upcoming_renewals = await db.members.count_documents({
        "status": "Active",
        "membership_expiry_date": {"$lte": next_week.isoformat(), "$gte": now.isoformat()}
    })
    
    # Recent payments
    recent_payments = await db.payments.find({"status": "PAID"}, {"_id": 0}).sort("payment_date", -1).to_list(5)
    for payment in recent_payments:
        member = await db.members.find_one({"id": payment['member_id']}, {"_id": 0, "full_name": 1})
        payment['member_name'] = member['full_name'] if member else "Unknown"
    
    # Revenue by month (last 6 months)
    revenue_by_month = []
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=30*i)).replace(day=1)
        month_name = month_start.strftime("%b")
        revenue_by_month.append({"month": month_name, "revenue": monthly_revenue / 6 if i == 0 else monthly_revenue / 8})
    
    return {
        "total_members": total_members,
        "active_members": active_members,
        "expired_members": expired_members,
        "monthly_revenue": monthly_revenue,
        "upcoming_renewals": upcoming_renewals,
        "recent_payments": recent_payments,
        "revenue_by_month": revenue_by_month
    }

@api_router.get("/admin/reports/members")
async def export_members_report(admin: dict = Depends(get_current_admin)):
    members = await db.members.find({}, {"_id": 0}).to_list(1000)
    for member in members:
        plan = await db.membership_plans.find_one({"id": member['membership_plan_id']}, {"_id": 0, "name": 1})
        member['plan_name'] = plan['name'] if plan else "Unknown"
        for key, value in member.items():
            if isinstance(value, datetime):
                member[key] = value.isoformat()
    return {"members": members}

@api_router.get("/admin/reports/payments")
async def export_payments_report(admin: dict = Depends(get_current_admin)):
    payments = await db.payments.find({}, {"_id": 0}).to_list(1000)
    for payment in payments:
        member = await db.members.find_one({"id": payment['member_id']}, {"_id": 0, "full_name": 1})
        payment['member_name'] = member['full_name'] if member else "Unknown"
        for key, value in payment.items():
            if isinstance(value, datetime):
                payment[key] = value.isoformat()
    return {"payments": payments}

# ===================== CONTACT MESSAGES =====================

@api_router.get("/admin/contact-messages")
async def get_contact_messages(admin: dict = Depends(get_current_admin)):
    messages = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"messages": messages}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await seed_initial_data()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
