"""
RecoverIQ — Synthetic Transaction & Recovery Data Generator
Generates realistic correlated dataset chunks for training & simulation
Usage: python -m simulator.generate --rows 10000 --seed 42
"""

import argparse
import json
import random
import numpy as np
from datetime import datetime, timezone, timedelta

FAILURE_TYPES = [
    ("temporary_network_failure", 0.35, 0.88),  # reason, freq, base_recovery_prob
    ("bank_unavailable", 0.20, 0.82),
    ("insufficient_funds", 0.18, 0.65),
    ("payment_timeout", 0.12, 0.78),
    ("authentication_failed", 0.08, 0.70),
    ("expired_card", 0.05, 0.05),
    ("do_not_honor", 0.02, 0.20),
]

PAYMENT_METHODS = [("upi", 0.55), ("card", 0.30), ("netbanking", 0.10), ("wallet", 0.05)]

def generate_synthetic_dataset(num_rows: int = 10000, seed: int = 42, output_file: str = "data/synthetic_transactions.json"):
    random.seed(seed)
    np.random.seed(seed)

    records = []
    base_time = datetime.now(timezone.utc) - timedelta(days=90)

    for i in range(num_rows):
        # 1. Customer baseline
        ltv = float(np.random.lognormal(mean=9.5, sigma=1.0))
        cust_success_rate = float(np.clip(np.random.beta(a=8, b=2), 0.3, 0.99))
        cust_rec_rate = float(np.clip(np.random.beta(a=7, b=3), 0.2, 0.98))

        # 2. Failure type selection with correlated probability
        f_type_choice = random.choices(
            [f[0] for f in FAILURE_TYPES],
            weights=[f[1] for f in FAILURE_TYPES]
        )[0]
        base_recovery_p = next(f[2] for f in FAILURE_TYPES if f[0] == f_type_choice)

        # 3. Amount selection
        amount = float(np.random.choice([499, 999, 1499, 2499, 4999, 9999, 14999, 38500], p=[0.2, 0.25, 0.2, 0.15, 0.1, 0.05, 0.03, 0.02]))
        
        # 4. Method
        method = random.choices([m[0] for m in PAYMENT_METHODS], weights=[m[1] for m in PAYMENT_METHODS])[0]
        
        # 5. Retry count
        retry_count = int(np.random.choice([0, 1, 2, 3], p=[0.60, 0.25, 0.10, 0.05]))
        
        # 6. Realistic correlated probability calculation
        adjusted_p = base_recovery_p
        if retry_count > 0:
            adjusted_p -= retry_count * 0.15
        if cust_success_rate > 0.9:
            adjusted_p += 0.08
        if f_type_choice == "expired_card":
            adjusted_p = 0.02
        if amount > 30000:
            adjusted_p -= 0.10
        adjusted_p = float(np.clip(adjusted_p, 0.01, 0.98))

        # Target label (True if recovered, False otherwise)
        successful_recovery = bool(random.random() < adjusted_p)

        occurred_time = base_time + timedelta(minutes=random.randint(0, 90 * 24 * 60))

        records.append({
            "payment_id": f"pay_syn_{i:06d}",
            "customer_id": f"cust_syn_{random.randint(1, 2000):04d}",
            "amount": amount,
            "currency": "INR",
            "failure_reason": f_type_choice,
            "payment_method": method,
            "retry_count": retry_count,
            "subscription_flag": bool(random.random() < 0.4),
            "mandate_flag": bool(random.random() < 0.2),
            "checkout_abandoned": bool(random.random() < 0.1),
            "time_since_failure_mins": random.randint(5, 720),
            "time_of_day": occurred_time.hour,
            "customer_payment_success_rate": cust_success_rate,
            "customer_recovery_rate": cust_rec_rate,
            "customer_lifetime_value": ltv,
            "successful_recovery": successful_recovery,
            "true_probability": adjusted_p,
            "occurred_at": occurred_time.isoformat(),
        })

    print(f"[Simulator] Generated {len(records)} synthetic transactions (Seed={seed}).")
    return records

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--rows", type=int, default=10000)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    generate_synthetic_dataset(num_rows=args.rows, seed=args.seed)
