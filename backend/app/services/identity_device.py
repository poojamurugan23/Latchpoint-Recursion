"""IP intelligence + device fingerprint handling (spec §7).

`enrich_ip` is a stub: no real external API is called for the MVP. Results
are deterministic (hashed from the IP) so repeated calls for the same IP are
stable across requests, and the function signature is shaped so a real
provider (e.g. IPQualityScore) can be dropped in later without touching
callers.
"""

import hashlib
import random
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.device import Device

ASNS = ["AS7018", "AS3356", "AS15169", "AS16509", "AS8075", "AS4837", "AS9498"]
COUNTRIES = ["IN", "US", "SG", "GB", "AE", "DE", "NL"]


def enrich_ip(ip: str) -> dict:
    seed = int(hashlib.sha256(ip.encode()).hexdigest(), 16)
    rng = random.Random(seed)
    return {
        "asn": rng.choice(ASNS),
        "geo_country": rng.choice(COUNTRIES),
        "is_vpn_or_proxy": rng.random() < 0.12,
    }


def upsert_device(
    db: Session, fingerprint_hash: str, ip: str, user_id: int | None = None
) -> Device:
    device = db.query(Device).filter(Device.fingerprint_hash == fingerprint_hash).first()
    intel = enrich_ip(ip)
    now = datetime.now(timezone.utc)

    if device is None:
        device = Device(
            user_id=user_id,
            fingerprint_hash=fingerprint_hash,
            ip_address=ip,
            asn=intel["asn"],
            geo_country=intel["geo_country"],
            is_vpn_or_proxy=intel["is_vpn_or_proxy"],
            first_seen_at=now,
            last_seen_at=now,
        )
        db.add(device)
        db.flush()
    else:
        device.last_seen_at = now
        device.ip_address = ip
        if user_id is not None:
            device.user_id = user_id
        db.flush()

    return device
