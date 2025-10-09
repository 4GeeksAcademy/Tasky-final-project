# src/api/statuses.py
from enum import StrEnum

# Estados del ciclo de vida de la tarea publicada por el cliente


class TaskStatus(StrEnum):
    OPEN = "pending"          # o "opened" definir, por ahora pending in db
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

# Estados de la oferta de un tasker sobre una tarea


class OfferStatus(StrEnum):
    PENDING = "pending"    # enviada/no respondida
    ACCEPTED = "accepted"
    # Futuro:
    # DENIED = "denied"
    # CANCELLED = "cancelled"

# Estados del "deal" (cuando la oferta fue aprobada por el cliente)


class DealStatus(StrEnum):
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

# Útil para entregar esto como JSON al frontend


def statuses_as_dict():
    return {
        "task": [s.value for s in TaskStatus],
        "offer": [s.value for s in OfferStatus],
        "deal": [s.value for s in DealStatus],
    }
