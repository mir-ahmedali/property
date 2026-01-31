from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorDatabase
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timezone

from db import db, get_db, close_db_client
from models import (
    UserCreate,
    UserRegister,
    UserLogin,
    UserInDB,
    UserPublic,
    Token,
    FranchiseCreate,
    FranchiseInDB,
    FranchisePublic,
    PropertyCreate,
    PropertyUpdate,
    PropertyInDB,
    PropertyPublic,
    LeadCreate,
    LeadInDB,
    LeadPublic,
    DashboardCustomer,
    DashboardAgent,
    DashboardFranchise,
    SuperAdminDashboard,
    AdminDashboardModel,
    UserDashboardModel,
    RazorpayOrderRequest,
    RazorpayOrderResponse,
    RazorpayVerifyRequest,
)
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_active_user,
    user_to_public,
)
from razorpay_service import get_razorpay_service


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection handled in db.py


# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Golasco Property API"}


# ---------- Auth Routes ----------

@api_router.post("/auth/register", response_model=Token)
async def register_user(payload: UserRegister, database: AsyncIOMotorDatabase = Depends(get_db)):
    """Public registration: always creates a normal user awaiting approval."""
    existing = await database.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    password_hash = get_password_hash(payload.password)
    user_in_db = UserInDB(
        email=payload.email,
        full_name=payload.full_name,
        role="user",
        franchise_id=None,
        password_hash=password_hash,
        is_verified=False,
    )
    await database.users.insert_one(user_in_db.model_dump())

    # User can log in only after super admin approval, but we still return a token for basic access
    access_token = create_access_token({"sub": user_in_db.id, "role": user_in_db.role})
    return Token(access_token=access_token, user=user_to_public(user_in_db))


async def seed_default_users(database: AsyncIOMotorDatabase) -> None:
    """Seed one Super Admin and one Admin if they do not exist."""
    from auth import get_password_hash as _hash  # avoid circular import at module import time

    super_admin_email = "super@golasco.com"
    admin_email = "admin@golasco.com"

    existing_super = await database.users.find_one({"role": "super_admin"})
    if not existing_super:
        super_user = UserInDB(
            email=super_admin_email,
            full_name="Default Super Admin",
            role="super_admin",
            franchise_id=None,
            password_hash=_hash("Super@123"),
            is_verified=True,
        )
        await database.users.insert_one(super_user.model_dump())

    existing_admin = await database.users.find_one({"role": "admin"})
    if not existing_admin:
        admin_user = UserInDB(
            email=admin_email,
            full_name="Default Admin",
            role="admin",
            franchise_id="default-company",
            password_hash=_hash("Admin@123"),
            is_verified=True,
        )
        await database.users.insert_one(admin_user.model_dump())


# Startup event removed


# ---------- Super Admin User Management ----------

@api_router.get("/super-admin/users/pending", response_model=SuperAdminDashboard)
async def list_pending_users(

# ---------- Dev utility: seed default users ----------

@api_router.get("/dev/seed-default-users")
async def dev_seed_default_users(database: AsyncIOMotorDatabase = Depends(get_db)):
    """One-time helper to create default Super Admin and Admin users.

    This is meant for initial setup only. Call once, then you can login with:
    - super@golasco.com / Super@123
    - admin@golasco.com / Admin@123
    """
    await seed_default_users(database)

    super_doc = await database.users.find_one({"role": "super_admin"}, {"_id": 0})
    admin_doc = await database.users.find_one({"role": "admin"}, {"_id": 0})

    return {
        "super_admin": UserPublic(**super_doc) if super_doc else None,
        "admin": UserPublic(**admin_doc) if admin_doc else None,
    }

    current_user: UserInDB = Depends(get_current_active_user),
    database: AsyncIOMotorDatabase = Depends(get_db),
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only Super Admin can view pending users")

    pending_cursor = database.users.find({"is_verified": False}, {"_id": 0})
    pending_docs = await pending_cursor.to_list(200)
    pending_users = [UserPublic(**doc) for doc in pending_docs]

    total_users = await database.users.count_documents({})
    return SuperAdminDashboard(total_users=total_users, pending_users=pending_users)


@api_router.post("/super-admin/users/{user_id}/verify", response_model=UserPublic)
async def verify_user_request(
    user_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    database: AsyncIOMotorDatabase = Depends(get_db),
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only Super Admin can verify users")

    doc = await database.users.find_one({"id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")

    await database.users.update_one({"id": user_id}, {"$set": {"is_verified": True}})
    updated = await database.users.find_one({"id": user_id}, {"_id": 0})
    return UserPublic(**updated)


# ---------- Simple Dashboards for new roles ----------

@api_router.get("/dashboard/user", response_model=UserDashboardModel)
async def dashboard_user(current_user: UserInDB = Depends(get_current_active_user)):
    if current_user.role != "user":
        raise HTTPException(status_code=403, detail="Only normal users can access this dashboard")
    return UserDashboardModel(user=user_to_public(current_user))


@api_router.get("/dashboard/admin", response_model=AdminDashboardModel)
async def dashboard_admin(
    current_user: UserInDB = Depends(get_current_active_user),
    database: AsyncIOMotorDatabase = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can access this dashboard")

    company_id = current_user.franchise_id
    members_cursor = database.users.find({"franchise_id": company_id}, {"_id": 0}) if company_id else []
    members_docs = await members_cursor.to_list(200) if company_id else []
    members = [UserPublic(**doc) for doc in members_docs]

    return AdminDashboardModel(company_id=company_id, team_members=members)


@api_router.get("/dashboard/super-admin", response_model=SuperAdminDashboard)
async def dashboard_super_admin(
    current_user: UserInDB = Depends(get_current_active_user),
    database: AsyncIOMotorDatabase = Depends(get_db),
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only Super Admin can access this dashboard")

    pending_cursor = database.users.find({"is_verified": False}, {"_id": 0})
    pending_docs = await pending_cursor.to_list(200)
    pending_users = [UserPublic(**doc) for doc in pending_docs]

    total_users = await database.users.count_documents({})
    return SuperAdminDashboard(total_users=total_users, pending_users=pending_users)


# Startup event removed


@api_router.post("/auth/login", response_model=Token)
async def login_user(payload: UserLogin, database: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await database.users.find_one({"email": payload.email})
    if not doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    user = UserInDB(**doc)
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    # Only super admin can bypass verification
    if user.role != "super_admin" and not user.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your account is pending approval by Super Admin")

    access_token = create_access_token({"sub": user.id, "role": user.role})
    return Token(access_token=access_token, user=user_to_public(user))


@api_router.get("/auth/me", response_model=UserPublic)
async def get_me(current_user: UserInDB = Depends(get_current_active_user)):
    return user_to_public(current_user)


# ---------- Franchise & Agent Management (simplified) ----------

@api_router.post("/franchises", response_model=FranchisePublic)
async def create_franchise(
    payload: FranchiseCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    database: AsyncIOMotorDatabase = Depends(get_db),
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admin can create franchises")

    franchise = FranchiseInDB(**payload.model_dump())
    await database.franchises.insert_one(franchise.model_dump())
    return FranchisePublic(**franchise.model_dump())


# ---------- Property Management ----------

@api_router.post("/properties", response_model=PropertyPublic)
async def create_property(
    payload: PropertyCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    database: AsyncIOMotorDatabase = Depends(get_db),
):
    if current_user.role not in {"agent", "franchise_owner"}:
        raise HTTPException(status_code=403, detail="Not allowed to create properties")

    franchise_id = current_user.franchise_id
    if not franchise_id:
        raise HTTPException(status_code=400, detail="User is not linked to a franchise")

    prop = PropertyInDB(**payload.model_dump(), franchise_id=franchise_id)
    await database.properties.insert_one(prop.model_dump())
    return PropertyPublic(**prop.model_dump())


@api_router.get("/properties", response_model=List[PropertyPublic])
async def list_properties(
    city: Optional[str] = None,
    type: Optional[str] = None,
    max_price: Optional[float] = None,
    database: AsyncIOMotorDatabase = Depends(get_db),
):
    query: dict = {}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if type:
        query["property_type"] = type
    if max_price is not None:
        query["price"] = {"$lte": max_price}

    docs = await database.properties.find(query, {"_id": 0}).to_list(200)
    return [PropertyPublic(**doc) for doc in docs]


@api_router.get("/properties/{property_id}", response_model=PropertyPublic)
async def get_property(property_id: str, database: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await database.properties.find_one({"id": property_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Property not found")
    return PropertyPublic(**doc)


@api_router.put("/properties/{property_id}", response_model=PropertyPublic)
async def update_property(
    property_id: str,
    payload: PropertyUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
    database: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await database.properties.find_one({"id": property_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Property not found")

    prop = PropertyInDB(**doc)
    if current_user.role == "agent" and prop.assigned_agent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to edit this property")
    if current_user.role == "franchise_owner" and prop.franchise_id != (current_user.franchise_id or ""):
        raise HTTPException(status_code=403, detail="Not allowed to edit this property")

    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items()}
    update_data["updated_at"] = datetime.now(timezone.utc)
    await database.properties.update_one({"id": property_id}, {"$set": update_data})

    updated = await database.properties.find_one({"id": property_id}, {"_id": 0})
    return PropertyPublic(**updated)


@api_router.delete("/properties/{property_id}")
async def delete_property(
    property_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    database: AsyncIOMotorDatabase = Depends(get_db),
):
    doc = await database.properties.find_one({"id": property_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Property not found")

    prop = PropertyInDB(**doc)
    if current_user.role != "franchise_owner" or prop.franchise_id != (current_user.franchise_id or ""):
        raise HTTPException(status_code=403, detail="Not allowed to delete this property")

    await database.properties.delete_one({"id": property_id})
    return {"success": True}


# ---------- Leads & Booking ----------

@api_router.post("/leads", response_model=LeadPublic)
async def create_lead(
    payload: LeadCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    database: AsyncIOMotorDatabase = Depends(get_db),
):
    if current_user.role != "customer":
        raise HTTPException(status_code=403, detail="Only customers can create leads")

    prop_doc = await database.properties.find_one({"id": payload.property_id})
    if not prop_doc:
        raise HTTPException(status_code=404, detail="Property not found")

    prop = PropertyInDB(**prop_doc)
    lead = LeadInDB(
        **payload.model_dump(),
        customer_id=current_user.id,
        assigned_agent_id=prop.assigned_agent_id,
        franchise_id=prop.franchise_id,
    )
    await database.leads.insert_one(lead.model_dump())
    return LeadPublic(**lead.model_dump())


@api_router.post("/leads/booking/create-order", response_model=RazorpayOrderResponse)
async def create_booking_order(
    payload: RazorpayOrderRequest,
    current_user: UserInDB = Depends(get_current_active_user),
    database: AsyncIOMotorDatabase = Depends(get_db),
):
    if current_user.role != "customer":
        raise HTTPException(status_code=403, detail="Only customers can create bookings")

    prop_doc = await database.properties.find_one({"id": payload.property_id})
    if not prop_doc:
        raise HTTPException(status_code=404, detail="Property not found")

    prop = PropertyInDB(**prop_doc)

    razorpay_service = get_razorpay_service()
    receipt_id = f"lead-booking-{current_user.id}-{int(datetime.now(timezone.utc).timestamp())}"
    order = razorpay_service.create_order(
        amount=payload.amount,
        receipt=receipt_id,
        notes={"property_id": prop.id, "customer_id": current_user.id},
    )

    lead = LeadInDB(
        property_id=prop.id,
        type="booking",
        message=None,
        amount=payload.amount,
        customer_id=current_user.id,
        assigned_agent_id=prop.assigned_agent_id,
        franchise_id=prop.franchise_id,
        razorpay_order_id=order["id"],
    )
    await database.leads.insert_one(lead.model_dump())

    razorpay_key_public = os.environ.get("RAZORPAY_KEY_ID", "")

    return RazorpayOrderResponse(
        order_id=order["id"],
        amount=payload.amount,
        currency=order["currency"],
        razorpay_key=razorpay_key_public,
        lead_id=lead.id,
    )


@api_router.post("/leads/booking/verify")
async def verify_booking_payment(
    payload: RazorpayVerifyRequest,
    current_user: UserInDB = Depends(get_current_active_user),
    database: AsyncIOMotorDatabase = Depends(get_db),
):
    if current_user.role != "customer":
        raise HTTPException(status_code=403, detail="Only customers can verify bookings")

    lead_doc = await database.leads.find_one({"id": payload.lead_id})
    if not lead_doc:
        raise HTTPException(status_code=404, detail="Lead not found")

    lead = LeadInDB(**lead_doc)
    if lead.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to verify this lead")

    razorpay_service = get_razorpay_service()
    razorpay_service.verify_signature(
        payload.razorpay_order_id, payload.razorpay_payment_id, payload.razorpay_signature
    )

    await database.leads.update_one(
        {"id": lead.id},
        {
            "$set": {
                "status": "completed",
                "razorpay_payment_id": payload.razorpay_payment_id,
                "razorpay_order_id": payload.razorpay_order_id,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    return {"success": True}


# ---------- Dashboards ----------

@api_router.get("/dashboard/customer", response_model=DashboardCustomer)
async def dashboard_customer(
    current_user: UserInDB = Depends(get_current_active_user),
    database: AsyncIOMotorDatabase = Depends(get_db),
):
    if current_user.role != "customer":
        raise HTTPException(status_code=403, detail="Only customers can access this dashboard")

    cursor = database.leads.find({"customer_id": current_user.id}, {"_id": 0})
    docs = await cursor.to_list(200)
    leads = [LeadPublic(**doc) for doc in docs]

    total_leads = len(leads)
    completed_bookings = len([
        lead for lead in leads if lead.type == "booking" and lead.status == "completed"
    ])

    return DashboardCustomer(total_leads=total_leads, completed_bookings=completed_bookings, leads=leads)


@api_router.get("/dashboard/agent", response_model=DashboardAgent)
async def dashboard_agent(
    current_user: UserInDB = Depends(get_current_active_user),
    database: AsyncIOMotorDatabase = Depends(get_db),
):
    if current_user.role != "agent":
        raise HTTPException(status_code=403, detail="Only agents can access this dashboard")

    leads_cursor = database.leads.find({"assigned_agent_id": current_user.id}, {"_id": 0})
    leads_docs = await leads_cursor.to_list(200)
    leads = [LeadPublic(**doc) for doc in leads_docs]

    props_count = await database.properties.count_documents({"assigned_agent_id": current_user.id})
    total_leads = len(leads)
    completed_bookings = len([
        lead for lead in leads if lead.type == "booking" and lead.status == "completed"
    ])

    return DashboardAgent(
        total_leads=total_leads,
        completed_bookings=completed_bookings,
        properties_count=props_count,
        leads=leads,
    )


@api_router.get("/dashboard/franchise", response_model=DashboardFranchise)
async def dashboard_franchise(
    current_user: UserInDB = Depends(get_current_active_user),
    database: AsyncIOMotorDatabase = Depends(get_db),
):
    if current_user.role != "franchise_owner":
        raise HTTPException(status_code=403, detail="Only franchise owners can access this dashboard")

    if not current_user.franchise_id:
        raise HTTPException(status_code=400, detail="User not linked to a franchise")

    fid = current_user.franchise_id

    props_cursor = database.properties.find({"franchise_id": fid}, {"_id": 0})
    props_docs = await props_cursor.to_list(500)

    total_properties = len(props_docs)
    available_properties = len([p for p in props_docs if p.get("status") == "available"])
    booked_properties = len([p for p in props_docs if p.get("status") == "booked"])
    sold_properties = len([p for p in props_docs if p.get("status") == "sold"])

    leads_cursor = database.leads.find({"franchise_id": fid}, {"_id": 0}).sort("created_at", -1)
    leads_docs = await leads_cursor.to_list(200)
    leads = [LeadPublic(**doc) for doc in leads_docs]

    total_booking_amount = float(
        sum(
            (lead_doc.get("amount") or 0)
            for lead_doc in leads_docs
            if lead_doc.get("type") == "booking" and lead_doc.get("status") == "completed"
        )
    )

    recent_leads = leads[:10]

    return DashboardFranchise(
        total_properties=total_properties,
        available_properties=available_properties,
        booked_properties=booked_properties,
        sold_properties=sold_properties,
        total_booking_amount=total_booking_amount,
        recent_leads=recent_leads,
    )


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_db_client()