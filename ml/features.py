"""
RecoverIQ — ML Feature Engineering Pipeline
Extracts 13 target-leakage-free features for XGBoost P(successful_recovery)
"""

from typing import Dict, Any
import numpy as np

FEATURE_NAMES = [
    "amount",
    "failure_reason_enc",
    "retry_count",
    "customer_payment_success_rate",
    "customer_recovery_rate",
    "historical_retry_success_rate",
    "time_since_failure_mins",
    "payment_method_enc",
    "subscription_flag",
    "mandate_flag",
    "checkout_abandoned",
    "time_of_day",
    "customer_lifetime_value",
]

FAILURE_REASON_MAP = {
    "temporary_network_failure": 1,
    "payment_timeout": 2,
    "bank_unavailable": 3,
    "authentication_failed": 4,
    "insufficient_funds": 5,
    "checkout_abandoned": 6,
    "mandate_failed": 7,
    "limit_exceeded": 8,
    "do_not_honor": 9,
    "expired_card": 10,
}

PAYMENT_METHOD_MAP = {
    "upi": 1,
    "card": 2,
    "netbanking": 3,
    "wallet": 4,
    "emi": 5,
}

def extract_feature_vector(payment_data: Dict[str, Any], customer_data: Dict[str, Any]) -> np.ndarray:
    """
    Transforms raw transaction and customer dict into numerical numpy array for model inference.
    Strictly avoids outcome fields to prevent target leakage.
    """
    amount = float(payment_data.get("amount", 0.0))
    reason_str = payment_data.get("failure_reason", "temporary_network_failure")
    reason_enc = FAILURE_REASON_MAP.get(reason_str, 0)
    retry_count = int(payment_data.get("retry_count", 0))
    
    cust_success_rate = float(customer_data.get("payment_success_rate", 0.75))
    cust_rec_rate = float(customer_data.get("recovery_rate", 0.65))
    hist_retry_success = 0.68
    
    time_since_failure = float(payment_data.get("time_since_failure_mins", 15.0))
    method_str = payment_data.get("payment_method", "upi")
    method_enc = PAYMENT_METHOD_MAP.get(method_str, 1)
    
    subscription = 1.0 if payment_data.get("subscription_flag") else 0.0
    mandate = 1.0 if payment_data.get("mandate_flag") else 0.0
    abandoned = 1.0 if payment_data.get("checkout_abandoned") else 0.0
    
    hour = int(payment_data.get("time_of_day", 14))
    ltv = float(customer_data.get("lifetime_value", 15000.0))
    
    return np.array([
        amount,
        reason_enc,
        retry_count,
        cust_success_rate,
        cust_rec_rate,
        hist_retry_success,
        time_since_failure,
        method_enc,
        subscription,
        mandate,
        abandoned,
        hour,
        ltv,
    ], dtype=np.float32)
