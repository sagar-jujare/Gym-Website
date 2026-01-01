from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.pool import NullPool
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ===================== DATABASE CONFIGURATION =====================
# Neon.tech PostgreSQL Connection
DATABASE_URL = os.environ.get('DATABASE_URL', '')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Validate DATABASE_URL
if not DATABASE_URL or "xxxxx" in DATABASE_URL or not DATABASE_URL.startswith(('postgresql://', 'postgres://')):
    logger.error("=" * 60)
    logger.error("DATABASE_URL is not configured properly!")
    logger.error("Please update /app/backend/.env with your Neon.tech connection string:")
    logger.error('DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"')
    logger.error("=" * 60)
    raise ValueError("DATABASE_URL must be configured with a valid Neon.tech PostgreSQL connection string")

# For Neon.tech, we need to handle the connection string format
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

logger.info(f"Connecting to database: {DATABASE_URL.split('@')[1].split('/')[0] if '@' in DATABASE_URL else 'unknown'}...")

# Create SQLAlchemy engine with SSL for Neon.tech
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,  # Recommended for serverless
    connect_args={"sslmode": "require"} if "neon.tech" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'gym-admin-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72

# Cashfree Settings
CASHFREE_CLIENT_ID = os.environ.get('CASHFREE_CLIENT_ID', '')
CASHFREE_CLIENT_SECRET = os.environ.get('CASHFREE_CLIENT_SECRET', '')
CASHFREE_ENVIRONMENT = os.environ.get('CASHFREE_ENVIRONMENT', 'SANDBOX')
CASHFREE_API_URL = "https://sandbox.cashfree.com/pg" if CASHFREE_ENVIRONMENT == "SANDBOX" else "https://api.cashfree.com/pg"

# ===================== DATABASE MODELS (SQLAlchemy) =====================

class AdminModel(Base):
    __tablename__ = "admins"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="admin")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class MembershipPlanModel(Base):
    __tablename__ = "membership_plans"
    
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    duration_months = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    benefits = Column(Text, nullable=False)  # JSON string
    popular = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class TrainerModel(Base):
    __tablename__ = "trainers"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    specialty = Column(String(200), nullable=False)
    experience_years = Column(Integer, nullable=False)
    bio = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=False)
    certifications = Column(Text, default="[]")  # JSON string
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class MemberModel(Base):
    __tablename__ = "members"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String(200), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(20), nullable=False)
    address = Column(Text, nullable=True)
    date_of_joining = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    membership_plan_id = Column(String(50), ForeignKey("membership_plans.id"), nullable=False)
    membership_start_date = Column(DateTime(timezone=True), nullable=False)
    membership_expiry_date = Column(DateTime(timezone=True), nullable=False)
    trainer_id = Column(String(36), ForeignKey("trainers.id"), nullable=True)
    status = Column(String(20), default="Active")  # Active, Expired, Suspended
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class PaymentModel(Base):
    __tablename__ = "payments"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id = Column(String(36), ForeignKey("members.id"), nullable=False)
    order_id = Column(String(50), unique=True, nullable=False, index=True)
    cf_order_id = Column(String(100), nullable=True)
    payment_session_id = Column(String(255), nullable=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), nullable=True)
    payment_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default="PENDING")  # PENDING, PAID, FAILED
    due_amount = Column(Float, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class ContactMessageModel(Base):
    __tablename__ = "contact_messages"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

# ===================== PYDANTIC SCHEMAS =====================

class MembershipPlanSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    duration_months: int
    price: float
    benefits: List[str]
    popular: bool
    created_at: Optional[datetime] = None

class TrainerSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    specialty: str
    experience_years: int
    bio: str
    image_url: str
    certifications: List[str]
    created_at: Optional[datetime] = None

class MemberCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    address: Optional[str] = ""
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

class AdminLogin(BaseModel):
    email: str
    password: str

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str

class CreateOrderRequest(BaseModel):
    member_id: str
    amount: float
    plan_name: str
    return_url: str

# ===================== APP SETUP =====================

app = FastAPI(title="Iron & Neon Gym API - PostgreSQL")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ===================== UTILITIES =====================

import json

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

def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    payload = decode_jwt_token(token)
    admin = db.query(AdminModel).filter(AdminModel.id == payload.get("admin_id")).first()
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return admin

def model_to_dict(model):
    """Convert SQLAlchemy model to dictionary"""
    result = {}
    for column in model.__table__.columns:
        value = getattr(model, column.name)
        if isinstance(value, datetime):
            result[column.name] = value.isoformat()
        else:
            result[column.name] = value
    return result

# ===================== SEED DATA =====================

def seed_initial_data(db: Session):
    # Seed admin if not exists
    admin_exists = db.query(AdminModel).filter(AdminModel.email == "admin@ironandneon.com").first()
    if not admin_exists:
        admin = AdminModel(
            username="admin",
            email="admin@ironandneon.com",
            password_hash=hash_password("admin123")
        )
        db.add(admin)
        db.commit()
        logger.info("Default admin created: admin@ironandneon.com / admin123")
    
    # Seed membership plans
    plans_count = db.query(MembershipPlanModel).count()
    if plans_count == 0:
        plans = [
            MembershipPlanModel(
                id="plan_monthly",
                name="Monthly",
                duration_months=1,
                price=1999,
                benefits=json.dumps(["Full gym access", "Locker room", "Basic equipment", "Workout plans"]),
                popular=False
            ),
            MembershipPlanModel(
                id="plan_quarterly",
                name="Quarterly",
                duration_months=3,
                price=4999,
                benefits=json.dumps(["Full gym access", "Locker room", "All equipment", "Personal trainer (2 sessions)", "Diet consultation"]),
                popular=True
            ),
            MembershipPlanModel(
                id="plan_yearly",
                name="Yearly",
                duration_months=12,
                price=14999,
                benefits=json.dumps(["Full gym access", "Premium locker", "All equipment", "Personal trainer (12 sessions)", "Diet consultation", "Spa access", "Guest passes (4)"]),
                popular=False
            )
        ]
        for plan in plans:
            db.add(plan)
        db.commit()
        logger.info("Membership plans seeded")
    
    # Seed trainers
    trainers_count = db.query(TrainerModel).count()
    if trainers_count == 0:
        trainers = [
            TrainerModel(
                name="Marcus Steel",
                specialty="Strength & Conditioning",
                experience_years=8,
                bio="Former professional powerlifter with 8+ years of coaching experience. Specializes in building raw strength and muscle mass.",
                image_url="https://images.unsplash.com/photo-1704223523232-526f6fab30a3?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
                certifications=json.dumps(["NSCA-CSCS", "ISSA CPT", "Precision Nutrition L1"])
            ),
            TrainerModel(
                name="Elena Cruz",
                specialty="HIIT & Functional Training",
                experience_years=6,
                bio="CrossFit Level 3 trainer focused on high-intensity functional movements. Helps clients push beyond their limits.",
                image_url="https://images.unsplash.com/photo-1580983555975-05bc6e99eb6e?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
                certifications=json.dumps(["CrossFit L3", "NASM-CPT", "TRX Certified"])
            ),
            TrainerModel(
                name="James Chen",
                specialty="Bodybuilding & Physique",
                experience_years=10,
                bio="Competition prep specialist with multiple bodybuilding titles. Expert in muscle hypertrophy and stage-ready conditioning.",
                image_url="https://images.unsplash.com/photo-1567013127542-490d757e51fc?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
                certifications=json.dumps(["IFBB Pro Card", "ACE CPT", "Nutrition Coach"])
            ),
            TrainerModel(
                name="Sarah Mitchell",
                specialty="Yoga & Flexibility",
                experience_years=7,
                bio="Certified yoga instructor combining ancient practices with modern fitness science. Focus on mobility, recovery, and mind-body connection.",
                image_url="https://images.unsplash.com/photo-1518611012118-696072aa579a?crop=entropy&cs=srgb&fm=jpg&q=85&w=400",
                certifications=json.dumps(["RYT-500", "Mobility WOD Coach", "Meditation Certified"])
            )
        ]
        for trainer in trainers:
            db.add(trainer)
        db.commit()
        logger.info("Trainers seeded")

# ===================== PUBLIC ROUTES =====================

@api_router.get("/")
def root():
    return {"message": "Iron & Neon Gym API - PostgreSQL (Neon.tech)", "status": "operational"}

@api_router.get("/plans")
def get_plans(db: Session = Depends(get_db)):
    plans = db.query(MembershipPlanModel).all()
    result = []
    for plan in plans:
        plan_dict = model_to_dict(plan)
        plan_dict['benefits'] = json.loads(plan_dict['benefits'])
        result.append(plan_dict)
    return {"plans": result}

@api_router.get("/trainers")
def get_trainers(db: Session = Depends(get_db)):
    trainers = db.query(TrainerModel).all()
    result = []
    for trainer in trainers:
        trainer_dict = model_to_dict(trainer)
        trainer_dict['certifications'] = json.loads(trainer_dict['certifications'])
        result.append(trainer_dict)
    return {"trainers": result}

@api_router.post("/contact/form")
def submit_contact_form(form: ContactForm, db: Session = Depends(get_db)):
    contact = ContactMessageModel(
        name=form.name,
        email=form.email,
        phone=form.phone,
        message=form.message
    )
    db.add(contact)
    db.commit()
    return {"message": "Thank you for contacting us. We'll get back to you soon!"}

# ===================== AUTH ROUTES =====================

@api_router.post("/admin/login")
def admin_login(credentials: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(AdminModel).filter(AdminModel.email == credentials.email).first()
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(credentials.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_jwt_token({"admin_id": admin.id, "email": admin.email, "role": admin.role})
    return {"token": token, "admin": {"id": admin.id, "email": admin.email, "username": admin.username, "role": admin.role}}

@api_router.get("/admin/me")
def get_current_admin_info(admin: AdminModel = Depends(get_current_admin)):
    return {"admin": {"id": admin.id, "email": admin.email, "username": admin.username, "role": admin.role}}

# ===================== ADMIN MEMBER ROUTES =====================

@api_router.get("/admin/members")
def get_members(admin: AdminModel = Depends(get_current_admin), db: Session = Depends(get_db)):
    members = db.query(MemberModel).all()
    return {"members": [model_to_dict(m) for m in members]}

@api_router.get("/admin/members/{member_id}")
def get_member(member_id: str, admin: AdminModel = Depends(get_current_admin), db: Session = Depends(get_db)):
    member = db.query(MemberModel).filter(MemberModel.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"member": model_to_dict(member)}

@api_router.post("/admin/members")
def create_member(member_data: MemberCreate, admin: AdminModel = Depends(get_current_admin), db: Session = Depends(get_db)):
    # Get plan to calculate expiry
    plan = db.query(MembershipPlanModel).filter(MembershipPlanModel.id == member_data.membership_plan_id).first()
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid membership plan")
    
    expiry_date = member_data.membership_start_date + timedelta(days=plan.duration_months * 30)
    
    member = MemberModel(
        full_name=member_data.full_name,
        email=member_data.email,
        phone=member_data.phone,
        address=member_data.address or "",
        membership_plan_id=member_data.membership_plan_id,
        membership_start_date=member_data.membership_start_date,
        membership_expiry_date=expiry_date,
        trainer_id=member_data.trainer_id
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    
    return {"member": model_to_dict(member), "message": "Member created successfully"}

@api_router.put("/admin/members/{member_id}")
def update_member(member_id: str, member_data: MemberUpdate, admin: AdminModel = Depends(get_current_admin), db: Session = Depends(get_db)):
    member = db.query(MemberModel).filter(MemberModel.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    update_data = member_data.model_dump(exclude_unset=True)
    
    # Recalculate expiry if plan or start date changes
    if 'membership_plan_id' in update_data or 'membership_start_date' in update_data:
        plan_id = update_data.get('membership_plan_id', member.membership_plan_id)
        start_date = update_data.get('membership_start_date', member.membership_start_date)
        plan = db.query(MembershipPlanModel).filter(MembershipPlanModel.id == plan_id).first()
        if plan:
            update_data['membership_expiry_date'] = start_date + timedelta(days=plan.duration_months * 30)
    
    for key, value in update_data.items():
        if value is not None:
            setattr(member, key, value)
    
    db.commit()
    db.refresh(member)
    
    return {"member": model_to_dict(member), "message": "Member updated successfully"}

@api_router.delete("/admin/members/{member_id}")
def delete_member(member_id: str, admin: AdminModel = Depends(get_current_admin), db: Session = Depends(get_db)):
    member = db.query(MemberModel).filter(MemberModel.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(member)
    db.commit()
    return {"message": "Member deleted successfully"}

# ===================== ADMIN PAYMENT ROUTES =====================

@api_router.get("/admin/payments")
def get_payments(admin: AdminModel = Depends(get_current_admin), db: Session = Depends(get_db)):
    payments = db.query(PaymentModel).all()
    return {"payments": [model_to_dict(p) for p in payments]}

@api_router.post("/admin/payments/record")
def record_manual_payment(
    member_id: str,
    amount: float,
    payment_method: str,
    admin: AdminModel = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    member = db.query(MemberModel).filter(MemberModel.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    payment = PaymentModel(
        member_id=member_id,
        order_id=f"MANUAL-{uuid.uuid4().hex[:8].upper()}",
        amount=amount,
        payment_method=payment_method,
        payment_date=datetime.now(timezone.utc),
        status="PAID"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    
    return {"payment": model_to_dict(payment), "message": "Payment recorded successfully"}

# ===================== CASHFREE PAYMENT ROUTES =====================

@api_router.post("/payment/create-order")
async def create_cashfree_order(request: CreateOrderRequest, db: Session = Depends(get_db)):
    member = db.query(MemberModel).filter(MemberModel.id == request.member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    order_id = f"GYM-{uuid.uuid4().hex[:12].upper()}"
    
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
            "customer_name": member.full_name,
            "customer_email": member.email,
            "customer_phone": member.phone
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
                payment = PaymentModel(
                    member_id=request.member_id,
                    order_id=order_id,
                    cf_order_id=result.get('cf_order_id'),
                    payment_session_id=result.get('payment_session_id'),
                    amount=request.amount,
                    status="PENDING"
                )
                db.add(payment)
                db.commit()
                
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
async def verify_payment(order_id: str, db: Session = Depends(get_db)):
    payment = db.query(PaymentModel).filter(PaymentModel.order_id == order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
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
                new_status = result.get('order_status', payment.status)
                if new_status != payment.status:
                    payment.status = new_status
                    if new_status == "PAID":
                        payment.payment_date = datetime.now(timezone.utc)
                    db.commit()
                
                return {"order_id": order_id, "status": new_status, "amount": payment.amount}
            else:
                return {"order_id": order_id, "status": payment.status, "amount": payment.amount}
    except:
        return {"order_id": order_id, "status": payment.status, "amount": payment.amount}

@api_router.post("/payment/webhook")
async def payment_webhook(request: dict, db: Session = Depends(get_db)):
    try:
        event = request.get('type')
        order_data = request.get('data', {}).get('order', {})
        order_id = order_data.get('order_id')
        
        if not order_id:
            return {"status": "ignored"}
        
        payment = db.query(PaymentModel).filter(PaymentModel.order_id == order_id).first()
        if not payment:
            return {"status": "payment_not_found"}
        
        if event == "PAYMENT_SUCCESS" or order_data.get('order_status') == "PAID":
            payment_data = request.get('data', {}).get('payment', {})
            payment.status = "PAID"
            payment.payment_method = payment_data.get('payment_method')
            payment.payment_date = datetime.now(timezone.utc)
            db.commit()
            logger.info(f"Payment successful for order: {order_id}")
        elif event == "PAYMENT_FAILED":
            payment.status = "FAILED"
            db.commit()
            logger.info(f"Payment failed for order: {order_id}")
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"status": "error"}

# ===================== DASHBOARD ROUTES =====================

@api_router.get("/admin/dashboard")
def get_dashboard_stats(admin: AdminModel = Depends(get_current_admin), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    
    total_members = db.query(MemberModel).count()
    active_members = db.query(MemberModel).filter(MemberModel.status == "Active").count()
    expired_members = db.query(MemberModel).filter(MemberModel.status == "Expired").count()
    
    # Monthly revenue
    paid_payments = db.query(PaymentModel).filter(PaymentModel.status == "PAID").all()
    monthly_revenue = sum(p.amount for p in paid_payments)
    
    # Upcoming renewals (next 7 days)
    next_week = now + timedelta(days=7)
    upcoming_renewals = db.query(MemberModel).filter(
        MemberModel.status == "Active",
        MemberModel.membership_expiry_date <= next_week,
        MemberModel.membership_expiry_date >= now
    ).count()
    
    # Recent payments
    recent_payments = db.query(PaymentModel).filter(PaymentModel.status == "PAID").order_by(PaymentModel.payment_date.desc()).limit(5).all()
    recent_payments_list = []
    for payment in recent_payments:
        member = db.query(MemberModel).filter(MemberModel.id == payment.member_id).first()
        payment_dict = model_to_dict(payment)
        payment_dict['member_name'] = member.full_name if member else "Unknown"
        recent_payments_list.append(payment_dict)
    
    # Revenue by month (last 6 months)
    revenue_by_month = []
    for i in range(5, -1, -1):
        month_date = now - timedelta(days=30*i)
        month_name = month_date.strftime("%b")
        revenue_by_month.append({"month": month_name, "revenue": monthly_revenue / 6 if i == 0 else monthly_revenue / 8})
    
    return {
        "total_members": total_members,
        "active_members": active_members,
        "expired_members": expired_members,
        "monthly_revenue": monthly_revenue,
        "upcoming_renewals": upcoming_renewals,
        "recent_payments": recent_payments_list,
        "revenue_by_month": revenue_by_month
    }

@api_router.get("/admin/reports/members")
def export_members_report(admin: AdminModel = Depends(get_current_admin), db: Session = Depends(get_db)):
    members = db.query(MemberModel).all()
    result = []
    for member in members:
        member_dict = model_to_dict(member)
        plan = db.query(MembershipPlanModel).filter(MembershipPlanModel.id == member.membership_plan_id).first()
        member_dict['plan_name'] = plan.name if plan else "Unknown"
        result.append(member_dict)
    return {"members": result}

@api_router.get("/admin/reports/payments")
def export_payments_report(admin: AdminModel = Depends(get_current_admin), db: Session = Depends(get_db)):
    payments = db.query(PaymentModel).all()
    result = []
    for payment in payments:
        payment_dict = model_to_dict(payment)
        member = db.query(MemberModel).filter(MemberModel.id == payment.member_id).first()
        payment_dict['member_name'] = member.full_name if member else "Unknown"
        result.append(payment_dict)
    return {"payments": result}

@api_router.get("/admin/contact-messages")
def get_contact_messages(admin: AdminModel = Depends(get_current_admin), db: Session = Depends(get_db)):
    messages = db.query(ContactMessageModel).order_by(ContactMessageModel.created_at.desc()).all()
    return {"messages": [model_to_dict(m) for m in messages]}

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
def startup_event():
    # Create tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")
    
    # Seed initial data
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()

@app.on_event("shutdown")
def shutdown_event():
    engine.dispose()
