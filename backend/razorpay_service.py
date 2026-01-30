import os
from typing import Optional

import razorpay
from fastapi import HTTPException, status


class RazorpayService:
    def __init__(self) -> None:
        key_id = os.environ.get("RAZORPAY_KEY_ID")
        key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
        if not key_id or not key_secret:
            raise RuntimeError("Razorpay keys not configured in environment")
        self.key_id = key_id
        self.client = razorpay.Client(auth=(key_id, key_secret))

    def create_order(self, amount: float, receipt: str, notes: Optional[dict] = None) -> dict:
        try:
            # Razorpay expects amount in paise
            order_amount = int(amount * 100)
            order_currency = "INR"
            order = self.client.order.create(
                {
                    "amount": order_amount,
                    "currency": order_currency,
                    "receipt": receipt,
                    "notes": notes or {},
                }
            )
            return order
        except Exception as e:  # noqa: BLE001
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Error creating Razorpay order: {e}",
            ) from e

    def verify_signature(self, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
        try:
            params_dict = {
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            }
            self.client.utility.verify_payment_signature(params_dict)
            return True
        except razorpay.errors.SignatureVerificationError:  # type: ignore[attr-defined]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Razorpay signature verification failed",
            )


_razorpay_service: Optional[RazorpayService] = None


def get_razorpay_service() -> RazorpayService:
    global _razorpay_service
    if _razorpay_service is None:
        _razorpay_service = RazorpayService()
    return _razorpay_service
