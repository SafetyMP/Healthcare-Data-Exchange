"""Durable consent map.

A revoke is a record, not process memory. HL7 FHIR Consent is persistent; an
OPAL data source that forgets the map on restart puts the old grant back in
front of the PDP. When CHEX_CONSENT_PATH is set, every change is written
before the process returns, and a new process loads that file.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

# Seed matches config/routing.yaml so the walking skeleton is internally consistent.
# Research starts revoked for *-001. Treatment and derivative start granted
# so those reads can pass OPA.
SEED: dict[str, dict[str, bool]] = {
    "patient-eu-001": {"research": False, "treatment": True, "derivative": True},
    "patient-eu-002": {"research": True, "treatment": True, "derivative": True},
    "patient-us-001": {"research": False, "treatment": True, "derivative": True},
    "patient-us-002": {"research": True, "treatment": True, "derivative": True},
}


def _copy(source: dict[str, dict[str, bool]]) -> dict[str, dict[str, bool]]:
    return {subject: dict(flags) for subject, flags in source.items()}


class ConsentStore:
    def __init__(self, path: str | None, seed: dict[str, dict[str, bool]] | None = None) -> None:
        self.path = path or None
        self.data = _copy(seed if seed is not None else SEED)
        if self.path and os.path.exists(self.path):
            loaded = json.loads(Path(self.path).read_text())
            if isinstance(loaded, dict):
                for subject, flags in loaded.items():
                    if isinstance(subject, str) and isinstance(flags, dict):
                        self.data[subject] = {
                            str(purpose): bool(value) for purpose, value in flags.items()
                        }

    def snapshot(self) -> dict[str, dict[str, bool]]:
        return _copy(self.data)

    def get(self, subject: str) -> dict[str, bool] | None:
        flags = self.data.get(subject)
        return dict(flags) if flags is not None else None

    def set_purpose(self, subject: str, purpose: str, granted: bool) -> dict[str, bool]:
        flags = self.data.setdefault(subject, {})
        flags[purpose] = granted
        self._save()
        return dict(flags)

    def _save(self) -> None:
        if not self.path:
            return
        path = Path(self.path)
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_suffix(path.suffix + ".tmp")
        temporary.write_text(json.dumps(self.data, sort_keys=True))
        os.replace(temporary, path)
