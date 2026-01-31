from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, Literal
import uuid

from pydantic import BaseModel, EmailStr, Field, ConfigDict


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: Literal["super_admin", "admin", "user"]
    franchise_id: Optional[str] = None  # used as company/branch id for admin & user


class UserCreate(UserBase):
    password: str = Field(min_length=6)


class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserInDB(UserBase):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    password_hash: str
    is_verified: bool = False
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    franchise_id: Optional[str] = None
    is_verified: bool = False


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class FranchiseBase(BaseModel):
    name: str
    city: str


class FranchiseCreate(FranchiseBase):
    owner_user_id: Optional[str] = None


class FranchiseInDB(FranchiseBase):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class FranchisePublic(FranchiseBase):
    id: str
    owner_user_id: Optional[str] = None


class PropertyBase(BaseModel):
    title: str
    description: str
    city: str
    price: float
    property_type: str
    status: Literal["available", "booked", "sold"] = "available"


class PropertyCreate(PropertyBase):
    assigned_agent_id: Optional[str] = None


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    city: Optional[str] = None
    price: Optional[float] = None
    property_type: Optional[str] = None
    status: Optional[Literal["available", "booked", "sold"]] = None
    assigned_agent_id: Optional[str] = None


class PropertyInDB(PropertyBase):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    franchise_id: str
    assigned_agent_id: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class PropertyPublic(PropertyBase):
    id: str
    franchise_id: str
    assigned_agent_id: Optional[str] = None


class LeadBase(BaseModel):
    property_id: str
    type: Literal["site_visit", "loan", "booking"]
    message: Optional[str] = None


class LeadCreate(LeadBase):
    amount: Optional[float] = None


class LeadInDB(LeadBase):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    assigned_agent_id: Optional[str] = None
    franchise_id: Optional[str] = None
    status: Literal["new", "in_progress", "completed", "cancelled"] = "new"
    amount: Optional[float] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class LeadPublic(LeadBase):
    id: str
    customer_id: str
    assigned_agent_id: Optional[str] = None
    franchise_id: Optional[str] = None
    status: str
    amount: Optional[float] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None


class DashboardCustomer(BaseModel):
    total_leads: int
    completed_bookings: int
    leads: list[LeadPublic]


class DashboardAgent(BaseModel):
    total_leads: int
    completed_bookings: int
    properties_count: int
    leads: list[LeadPublic]


class DashboardFranchise(BaseModel):
    total_properties: int
    available_properties: int
    booked_properties: int
    sold_properties: int
    total_booking_amount: float
    recent_leads: list[LeadPublic]


class SuperAdminDashboard(BaseModel):
    total_users: int
    pending_users: list[UserPublic]


class AdminDashboardModel(BaseModel):
    company_id: Optional[str] = None
    team_members: list[UserPublic]


class UserDashboardModel(BaseModel):
    user: UserPublic


class RazorpayOrderRequest(BaseModel):
    property_id: str
    amount: float


class RazorpayOrderResponse(BaseModel):
    order_id: str
    amount: float
    currency: str
    razorpay_key: str
    lead_id: str


class RazorpayVerifyRequest(BaseModel):
    lead_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
