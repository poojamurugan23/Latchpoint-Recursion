"""Generates synthetic training data for the Latchpoint risk model (spec §8.2).

2,000 synthetic users, each with a randomized personal baseline (mean amount,
std, preferred hours, 3-5 regular payees). Each gets 15-30 transactions.
~15% of rows are labeled risky by injecting one of three patterns: drift,
network, or repeat-loss. Everything else is labeled clean.

Run from backend/: python -m app.ml.generate_synthetic_data
"""

import random

import numpy as np
import pandas as pd

from app.ml.feature_spec import FEATURE_COLUMNS

random.seed(42)
np.random.seed(42)

N_USERS = 2000
OUT_PATH = "app/ml/synthetic_transactions.csv"


def make_row(**kwargs):
    row = {col: 0 for col in FEATURE_COLUMNS}
    row.update(kwargs)
    return row


def generate_user_rows(user_id: int, global_payee_counter: list[int]) -> list[dict]:
    mean_amount = float(np.random.uniform(500, 50000))
    std_amount = mean_amount * float(np.random.uniform(0.1, 0.35))
    hour_low = random.randint(6, 20)
    hour_high = min(23, hour_low + random.randint(2, 6))

    n_payees = random.randint(3, 5)
    payee_ids = list(range(global_payee_counter[0], global_payee_counter[0] + n_payees))
    global_payee_counter[0] += n_payees

    # Some payees share a device fingerprint (mule-style network cluster) — this
    # is what the "network" injection pattern relies on.
    shared_cluster = []
    if random.random() < 0.7 and n_payees >= 3:
        shared_cluster = random.sample(payee_ids, k=min(3, n_payees))

    # A payee this user has a history of losing money to — feeds "repeat-loss".
    loss_payee = random.choice(payee_ids) if random.random() < 0.7 else None

    rows = []
    history = []  # up to last 10 completed transactions: dict(amount, hour, payee_id, day)
    day_totals: dict[int, float] = {}
    day_counts: dict[int, int] = {}
    payee_loss_streak: dict[int, int] = {p: 0 for p in payee_ids}

    day = 0
    n_txns = random.randint(15, 30)
    t = 0
    while t < n_txns:
        window = history[-10:]
        baseline_n = len(window)
        if baseline_n == 0:
            personal_mean, personal_std = mean_amount, max(std_amount, mean_amount * 0.1)
            confidence_score = 0.3
        else:
            amounts = [h["amount"] for h in window]
            personal_mean = float(np.mean(amounts))
            personal_std = max(float(np.std(amounts)), personal_mean * 0.1, 1.0)
            confidence_score = 0.3 if baseline_n < 3 else (0.6 if baseline_n < 10 else 1.0)
        typical_payees = {h["payee_id"] for h in window} or set(payee_ids)

        label = 0
        pattern_roll = random.random()

        # --- DRIFT: burst of 3 same-day small txns, then a 4th escalated one ---
        if baseline_n >= 3 and pattern_roll < 0.09 and t + 3 < n_txns:
            burst_day = day
            for _ in range(3):
                amt = max(50.0, np.random.normal(personal_mean, personal_std * 0.5))
                hour = random.randint(hour_low, hour_high)
                day_totals[burst_day] = day_totals.get(burst_day, 0.0) + amt
                day_counts[burst_day] = day_counts.get(burst_day, 0) + 1
                rows.append(
                    make_row(
                        deviation_ratio=(amt - personal_mean) / personal_std,
                        is_new_payee=0,
                        is_odd_hour=int(not (hour_low - 2 <= hour <= hour_high + 2)),
                        baseline_confidence_score=confidence_score,
                        exposure_today=day_totals[burst_day],
                        exposure_vs_baseline_ratio=day_totals[burst_day] / max(personal_mean, 1.0),
                        txn_count_today=day_counts[burst_day],
                        pause_count=random.randint(0, 2),
                        edit_count=random.randint(0, 3),
                        back_navigation_count=random.randint(0, 1),
                        time_in_flow_sec=random.uniform(10, 90),
                        device_shared_with_other_payees_count=0,
                        recipient_is_new_device_pairing=0,
                        ip_is_vpn_or_proxy=0,
                        repeat_pattern_negative_outcome=0,
                        prior_negative_outcome_streak=0,
                        label=0,
                    )
                )
                history.append({"amount": amt, "hour": hour, "payee_id": random.choice(payee_ids), "day": burst_day})
                t += 1
            drift_amt = personal_mean * random.uniform(4.0, 8.0)
            hour = random.randint(hour_low, hour_high)
            day_totals[burst_day] = day_totals.get(burst_day, 0.0) + drift_amt
            day_counts[burst_day] = day_counts.get(burst_day, 0) + 1
            rows.append(
                make_row(
                    deviation_ratio=(drift_amt - personal_mean) / personal_std,
                    is_new_payee=0,
                    is_odd_hour=0,
                    baseline_confidence_score=confidence_score,
                    exposure_today=day_totals[burst_day],
                    exposure_vs_baseline_ratio=day_totals[burst_day] / max(personal_mean, 1.0),
                    txn_count_today=day_counts[burst_day],
                    pause_count=random.randint(0, 4),
                    edit_count=random.randint(0, 4),
                    back_navigation_count=random.randint(0, 2),
                    time_in_flow_sec=random.uniform(10, 120),
                    device_shared_with_other_payees_count=0,
                    recipient_is_new_device_pairing=0,
                    ip_is_vpn_or_proxy=0,
                    repeat_pattern_negative_outcome=0,
                    prior_negative_outcome_streak=0,
                    label=1,
                )
            )
            history.append({"amount": drift_amt, "hour": hour, "payee_id": random.choice(payee_ids), "day": burst_day})
            day += random.randint(1, 4)
            t += 1
            continue

        # --- NETWORK: payment to a payee sharing a device with 2+ other payees ---
        if shared_cluster and 0.09 <= pattern_roll < 0.22:
            payee_id = random.choice(shared_cluster)
            amt = max(50.0, np.random.normal(personal_mean, personal_std))
            hour = random.randint(hour_low, hour_high)
            day_totals[day] = day_totals.get(day, 0.0) + amt
            day_counts[day] = day_counts.get(day, 0) + 1
            rows.append(
                make_row(
                    deviation_ratio=(amt - personal_mean) / personal_std,
                    is_new_payee=int(payee_id not in typical_payees),
                    is_odd_hour=int(not (hour_low - 2 <= hour <= hour_high + 2)),
                    baseline_confidence_score=confidence_score,
                    exposure_today=day_totals[day],
                    exposure_vs_baseline_ratio=day_totals[day] / max(personal_mean, 1.0),
                    txn_count_today=day_counts[day],
                    pause_count=random.randint(0, 3),
                    edit_count=random.randint(0, 3),
                    back_navigation_count=random.randint(0, 2),
                    time_in_flow_sec=random.uniform(10, 100),
                    device_shared_with_other_payees_count=len(shared_cluster) - 1,
                    recipient_is_new_device_pairing=int(payee_id not in typical_payees),
                    ip_is_vpn_or_proxy=random.choice([0, 0, 1]),
                    repeat_pattern_negative_outcome=0,
                    prior_negative_outcome_streak=0,
                    label=1,
                )
            )
            history.append({"amount": amt, "hour": hour, "payee_id": payee_id, "day": day})
            day += random.randint(1, 4)
            t += 1
            continue

        # --- REPEAT-LOSS: 3+ prior losses to same payee, then another attempt ---
        if (
            loss_payee is not None
            and payee_loss_streak[loss_payee] >= 3
            and 0.22 <= pattern_roll < 0.32
        ):
            amt = personal_mean * random.uniform(1.0, 2.0)
            hour = random.randint(hour_low, hour_high)
            day_totals[day] = day_totals.get(day, 0.0) + amt
            day_counts[day] = day_counts.get(day, 0) + 1
            rows.append(
                make_row(
                    deviation_ratio=(amt - personal_mean) / personal_std,
                    is_new_payee=0,
                    is_odd_hour=int(not (hour_low - 2 <= hour <= hour_high + 2)),
                    baseline_confidence_score=confidence_score,
                    exposure_today=day_totals[day],
                    exposure_vs_baseline_ratio=day_totals[day] / max(personal_mean, 1.0),
                    txn_count_today=day_counts[day],
                    pause_count=random.randint(0, 3),
                    edit_count=random.randint(0, 3),
                    back_navigation_count=random.randint(0, 2),
                    time_in_flow_sec=random.uniform(10, 100),
                    device_shared_with_other_payees_count=0,
                    recipient_is_new_device_pairing=0,
                    ip_is_vpn_or_proxy=0,
                    repeat_pattern_negative_outcome=1,
                    prior_negative_outcome_streak=payee_loss_streak[loss_payee],
                    label=1,
                )
            )
            history.append({"amount": amt, "hour": hour, "payee_id": loss_payee, "day": day})
            payee_loss_streak[loss_payee] = 0  # streak resets after the flagged attempt
            day += random.randint(1, 4)
            t += 1
            continue

        # --- BUSY BUT CLEAN: 4-5 same-day normal-amount txns, all label 0.
        # Without this, "4+ transactions today" alone becomes spuriously
        # correlated with risk, since only drift bursts ever reach that count
        # elsewhere in the synthetic data. ---
        if baseline_n >= 3 and 0.32 <= pattern_roll < 0.42 and t + 4 < n_txns:
            busy_day = day
            for _ in range(random.randint(4, 5)):
                amt = max(20.0, np.random.normal(personal_mean, personal_std * 0.7))
                hour = random.randint(hour_low, hour_high)
                day_totals[busy_day] = day_totals.get(busy_day, 0.0) + amt
                day_counts[busy_day] = day_counts.get(busy_day, 0) + 1
                rows.append(
                    make_row(
                        deviation_ratio=(amt - personal_mean) / personal_std,
                        is_new_payee=0,
                        is_odd_hour=int(not (hour_low - 2 <= hour <= hour_high + 2)),
                        baseline_confidence_score=confidence_score,
                        exposure_today=day_totals[busy_day],
                        exposure_vs_baseline_ratio=day_totals[busy_day] / max(personal_mean, 1.0),
                        txn_count_today=day_counts[busy_day],
                        pause_count=random.randint(0, 2),
                        edit_count=random.randint(0, 2),
                        back_navigation_count=random.randint(0, 1),
                        time_in_flow_sec=random.uniform(15, 60),
                        device_shared_with_other_payees_count=0,
                        recipient_is_new_device_pairing=0,
                        ip_is_vpn_or_proxy=0,
                        repeat_pattern_negative_outcome=0,
                        prior_negative_outcome_streak=0,
                        label=0,
                    )
                )
                history.append(
                    {"amount": amt, "hour": hour, "payee_id": random.choice(payee_ids), "day": busy_day}
                )
                t += 1
            day += random.randint(1, 4)
            continue

        # --- CLEAN transaction ---
        if loss_payee is not None and random.random() < 0.5:
            payee_id = loss_payee
        else:
            payee_id = random.choice(payee_ids)
            if random.random() < 0.05:
                payee_id = global_payee_counter[0]
                global_payee_counter[0] += 1
                payee_ids.append(payee_id)
                payee_loss_streak[payee_id] = 0

        amt = max(20.0, np.random.normal(personal_mean, personal_std))
        hour = random.randint(hour_low, hour_high)
        day_totals[day] = day_totals.get(day, 0.0) + amt
        day_counts[day] = day_counts.get(day, 0) + 1

        outcome_is_loss = 0
        if payee_id == loss_payee and payee_loss_streak[payee_id] < 3:
            outcome_is_loss = 1
            payee_loss_streak[payee_id] += 1
        elif random.random() < 0.1:
            outcome_is_loss = 1

        rows.append(
            make_row(
                deviation_ratio=(amt - personal_mean) / personal_std,
                is_new_payee=int(payee_id not in typical_payees),
                is_odd_hour=int(not (hour_low - 2 <= hour <= hour_high + 2)),
                baseline_confidence_score=confidence_score,
                exposure_today=day_totals[day],
                exposure_vs_baseline_ratio=day_totals[day] / max(personal_mean, 1.0),
                txn_count_today=day_counts[day],
                pause_count=random.randint(0, 2),
                edit_count=random.randint(0, 2),
                back_navigation_count=random.randint(0, 1),
                time_in_flow_sec=random.uniform(5, 60),
                device_shared_with_other_payees_count=(
                    len(shared_cluster) - 1 if payee_id in shared_cluster else 0
                ),
                recipient_is_new_device_pairing=int(payee_id not in typical_payees),
                ip_is_vpn_or_proxy=random.choice([0, 0, 0, 1]),
                repeat_pattern_negative_outcome=0,
                prior_negative_outcome_streak=payee_loss_streak.get(payee_id, 0),
                label=label,
            )
        )
        history.append({"amount": amt, "hour": hour, "payee_id": payee_id, "day": day})
        day += random.randint(0, 3) or 1
        t += 1

    return rows


def main():
    global_payee_counter = [1]
    all_rows = []
    for user_id in range(N_USERS):
        all_rows.extend(generate_user_rows(user_id, global_payee_counter))

    df = pd.DataFrame(all_rows, columns=FEATURE_COLUMNS + ["label"])
    df.to_csv(OUT_PATH, index=False)

    risky_pct = 100 * df["label"].mean()
    print(f"Generated {len(df)} rows across {N_USERS} users.")
    print(f"Risky label rate: {risky_pct:.1f}%")
    print(f"Saved to {OUT_PATH}")


if __name__ == "__main__":
    main()
