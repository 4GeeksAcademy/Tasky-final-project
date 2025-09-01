# src/api/routes.py
import os
from decimal import Decimal
from datetime import datetime, date

from flask import Blueprint, jsonify, request
from flask_cors import CORS

from api.models import (
    db, User, Task, Profile,
    TaskOffered, TaskDealed, Review, Message
)
from api.statuses import TaskStatus, OfferStatus, DealStatus, statuses_as_dict

# =========================
# Blueprint + CORS (solo en API)
# =========================
api = Blueprint("api", __name__)

FRONT = os.getenv(
    "FRONTEND_ORIGIN",
    # default para Codespaces (puerto 3000 del front)
    "https://urban-space-cod-gj7pgr6p66rhv959-3000.app.github.dev"
)

# Habilita CORS para todas las rutas de este blueprint
CORS(
    api,
    resources={r"/*": {"origins": [FRONT]}},
    supports_credentials=False,      # no estás usando cookies
    expose_headers=["Content-Type"]
)

# =========================
# HEALTH
# =========================


@api.route("/health", methods=["GET"])
def health():
    return jsonify({"msg": "Hello from Tasky API"}), 200

# =========================
# USERS
# =========================


@api.route("/users", methods=["GET"])
def get_users():
    users = User.query.all()
    return jsonify([u.serialize() for u in users]), 200


@api.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):
    u = User.query.get(user_id)
    if not u:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify(u.serialize()), 200


@api.route("/users", methods=["POST"])
def create_user():
    data = request.get_json() or {}
    if not data.get("email") or not data.get("password") or not data.get("username"):
        return jsonify({"error": "email, password y username son requeridos"}), 400
    u = User(
        email=data["email"],
        password=data["password"],      # TODO: hashear en prod
        username=data["username"]
    )
    db.session.add(u)
    db.session.commit()
    return jsonify(u.serialize()), 201


@api.route("/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    u = User.query.get(user_id)
    if not u:
        return jsonify({"error": "Usuario no encontrado"}), 404
    data = request.get_json() or {}
    u.email = data.get("email", u.email)
    u.username = data.get("username", u.username)
    u.password = data.get("password", u.password)  # TODO: hashear en prod
    db.session.commit()
    return jsonify(u.serialize()), 200


@api.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    u = User.query.get(user_id)
    if not u:
        return jsonify({"error": "Usuario no encontrado"}), 404
    db.session.delete(u)
    db.session.commit()
    return jsonify({"message": "Usuario eliminado"}), 200


@api.route("/users/by-username/<string:username>", methods=["GET"])
def get_user_by_username(username):
    u = User.query.filter(User.username.ilike(username)).first()
    if not u:
        return jsonify({"error": "Usuario no encontrado"}), 404
    return jsonify(u.serialize()), 200

# =========================
# PROFILES (PUBLIC/PRIVATE)
# =========================


@api.route("/users/<int:user_id>/profile", methods=["GET"])
def get_profile(user_id):
    prof = Profile.query.get(user_id)  # PK = user_id en este modelo
    if not prof:
        return jsonify({"error": "Perfil no encontrado"}), 404
    return jsonify(prof.serialize()), 200


@api.route("/users/<int:user_id>/profile", methods=["PUT"])
def update_profile(user_id):
    """
    Crea o actualiza el perfil del usuario.
    Si el perfil no existe, lo crea con valores por defecto para
    las columnas NOT NULL (name, etc.).
    """
    data = request.get_json() or {}
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    prof = Profile.query.get(user_id)  # PK = user_id
    if not prof:
        prof = Profile(
            user_id=user_id,
            name=(data.get("name") or user.username or ""),
            last_name=data.get("last_name") or "",
            avatar=data.get("avatar") or "",
            city=data.get("city") or "",
            birth_date=data.get("birth_date"),
            bio=data.get("bio") or "",
            skills=data.get("skills") or "",
            rating_avg=data.get("rating_avg") or 0.0,
            created_at=datetime.utcnow(),
            modified_at=datetime.utcnow(),
        )
        db.session.add(prof)
    else:
        for field in ["name", "last_name", "avatar", "city", "birth_date", "bio", "skills", "rating_avg"]:
            if field in data and data[field] is not None:
                setattr(prof, field, data[field])
        prof.modified_at = datetime.utcnow()

    db.session.commit()
    return jsonify(prof.serialize()), 200

# =========================
# TASKS (mínimo viable)
# =========================


@api.route("/tasks", methods=["GET"])
def list_tasks():
    tasks = Task.query.all()
    out = []
    for t in tasks:
        d = t.serialize_all_data()
        deal = _latest_deal(t.id)
        d["assigned_tasker_id"] = deal.tasker_id if deal else None
        out.append(d)
    return jsonify(out), 200


@api.route("/tasks", methods=["POST"])
def create_task():
    data = request.get_json() or {}
    if not data.get("title") or not data.get("description") or not data.get("publisher_id"):
        return jsonify({"error": "title, description, publisher_id son requeridos"}), 400
    t = Task(
        title=data["title"],
        description=data["description"],
        publisher_id=data["publisher_id"],
        location=data.get("location"),
        price=data.get("price"),
        status=data.get("status", TaskStatus.OPEN.value if hasattr(
            TaskStatus, "OPEN") else "open"),
    )
    db.session.add(t)
    db.session.commit()
    return jsonify(t.serialize_all_data()), 201


@api.route("/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
    t = Task.query.get(task_id)
    if not t:
        return jsonify({"error": "Tarea no encontrada"}), 404

    data = t.serialize_all_data()

    # ← AÑADIDO: asignado desde el último deal (fuente de verdad)
    deal = _latest_deal(task_id)
    data["assigned_tasker_id"] = deal.tasker_id if deal else None

    return jsonify(data), 200


@api.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    t = Task.query.get(task_id)
    if not t:
        return jsonify({"error": "Tarea no encontrada"}), 404
    db.session.delete(t)
    db.session.commit()
    return jsonify({"message": "Tarea eliminada"}), 200

# =========================
# OFFERS (en Task)
# =========================


@api.route("/tasks/<int:task_id>/offers", methods=["POST"])
def create_offer(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Tarea no encontrada"}), 404

    data = request.get_json() or {}
    tasker_id = data.get("tasker_id")
    amount = data.get("amount")
    message = (data.get("message") or "").strip()

    if not tasker_id or amount is None:
        return jsonify({"error": "tasker_id y amount son obligatorios"}), 400

    # upsert por (task_id, tasker_id)
    offer = TaskOffered.query.filter_by(
        task_id=task_id, tasker_id=tasker_id).first()
    if not offer:
        offer = TaskOffered(task_id=task_id, tasker_id=tasker_id)
        # si deseas forzar estado inicial:
        try:
            offer.status = OfferStatus.PENDING.value  # si tienes Enum
        except Exception:
            offer.status = "pending"
        db.session.add(offer)

    offer.amount = Decimal(str(amount))
    offer.message = message

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "No se pudo guardar la oferta"}), 500

    return jsonify(offer.serialize()), 201


@api.route("/tasks/<int:task_id>/offers", methods=["GET"])
def list_offers(task_id):
    tasker_id = request.args.get("tasker_id", type=int)
    q = TaskOffered.query.filter_by(task_id=task_id)
    if tasker_id:
        q = q.filter_by(tasker_id=tasker_id)
    rows = q.all()
    if tasker_id and not rows:
        return jsonify({"message": "no offer for this tasker"}), 404
    return jsonify([r.serialize() for r in rows]), 200


@api.route("/tasks/<int:task_id>/offers/<int:offer_id>", methods=["PUT"])
def update_offer(task_id, offer_id):
    data = request.get_json() or {}
    row = TaskOffered.query.filter_by(id=offer_id, task_id=task_id).first()
    if not row:
        return jsonify({"message": "offer not found"}), 404

    task = Task.query.get(task_id)
    if not task or task.status != "open":
        return jsonify({"message": "task is not open"}), 400

    amt = data.get("amount", None)
    msg = (data.get("message") or "").strip()

    if amt is not None:
        row.amount = Decimal(str(amt))
    row.message = msg

    db.session.commit()
    return jsonify(row.serialize()), 200

# =========================
# REVIEWS (cliente → tasker)
# =========================


@api.route("/tasks/<int:task_id>/reviews", methods=["POST"])
def create_review(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Tarea no encontrada"}), 404

    data = request.get_json() or {}
    rating = data.get("rating")                  # 1..5 (float/int)
    comment = (data.get("comment") or "").strip()

    # Inferimos cliente y tasker desde el deal más reciente
    publisher_id = getattr(task, "publisher_id", None)
    deal = TaskDealed.query.filter_by(
        task_id=task_id).order_by(TaskDealed.id.desc()).first()
    worker_id = data.get("worker_id") or (deal.tasker_id if deal else None)

    if rating is None or worker_id is None or deal is None:
        return jsonify({"error": "rating y worker_id/deal requeridos (no se pudo inferir)"}), 400

    # 1 review por deal
    existing = Review.query.filter_by(task_dealed_id=deal.id).first()
    if existing:
        return jsonify({"error": "Ya existe una review para este deal"}), 409

    review = Review(
        review=comment,
        rate=rating,
        created_at=datetime.utcnow(),
        publisher_id=publisher_id,
        worker_id=worker_id,
        task_dealed_id=deal.id,
        task_id=task_id,
    )
    db.session.add(review)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "No se pudo guardar la review"}), 500

    return jsonify(review.serialize()), 201


@api.route("/tasks/<int:task_id>/reviews", methods=["GET"])
def get_reviews(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Tarea no encontrada"}), 404

    reviews = Review.query.filter_by(task_id=task_id).all()
    return jsonify([r.serialize() for r in reviews]), 200

# =========================
# CHAT (mensajes por último deal)
# =========================


def _latest_deal(task_id):
    return TaskDealed.query.filter_by(task_id=task_id).order_by(TaskDealed.id.desc()).first()


@api.route("/tasks/<int:task_id>/messages", methods=["GET"])
def list_messages(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify([]), 200

    deal = _latest_deal(task_id)
    if not deal:
        return jsonify([]), 200

    msgs = Message.query.filter_by(dealer_id=deal.id) \
        .order_by(Message.created_at.asc(), Message.id.asc()).all()
    return jsonify([m.serialize() for m in msgs]), 200


@api.route("/tasks/<int:task_id>/messages", methods=["POST"])
def create_message(task_id):
    data = request.get_json() or {}
    body = (data.get("body") or "").strip()
    sender_id = data.get("sender_id")  # ⚠ tu front debe enviarlo

    if not body or not sender_id:
        return jsonify({"error": "body y sender_id son obligatorios"}), 400

    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Tarea no encontrada"}), 404

    deal = _latest_deal(task_id)
    if not deal:
        return jsonify({"error": "No hay deal para esta tarea"}), 404

    if sender_id not in (deal.client_id, deal.tasker_id):
        return jsonify({"error": "sender_id no pertenece a este deal"}), 403

    msg = Message(
        body=body,
        created_at=datetime.utcnow(),
        dealer_id=deal.id,
        sender_id=sender_id
    )
    db.session.add(msg)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "No se pudo crear el mensaje"}), 500

    return jsonify(msg.serialize()), 201

# =========================
# DEALS
# =========================


@api.route("/tasks/<int:task_id>/deals", methods=["POST"])
def create_deal(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Tarea no encontrada"}), 404

    data = request.get_json() or {}
    tasker_id = data.get("tasker_id")
    offer_id = data.get("offer_id")
    fixed_price = data.get("fixed_price")  # opcional

    if not tasker_id:
        return jsonify({"error": "tasker_id es obligatorio"}), 400
    if not offer_id:
        return jsonify({"error": "offer_id es obligatorio"}), 400

    offer = TaskOffered.query.filter_by(id=offer_id, task_id=task_id).first()
    if not offer:
        return jsonify({"error": "Offer no encontrada para esta tarea"}), 400
    if offer.tasker_id != tasker_id:
        return jsonify({"error": "offer_id no corresponde al tasker indicado"}), 400

    # ¿ya hay deal? (solo 1 por task)
    deal = TaskDealed.query.filter_by(task_id=task_id).first()
    if not deal:
        # inferir FKs y precio desde la offer/task
        deal = TaskDealed(
            task_id=task.id,
            offer_id=offer.id,
            client_id=task.publisher_id,
            tasker_id=offer.tasker_id,
            fixed_price=Decimal(
                str(fixed_price)) if fixed_price is not None else offer.amount,
            status="accepted",
            accepted_at=date.today()
        )
        db.session.add(deal)
    else:
        # actualizar por consistencia si ya había deal
        deal.offer_id = offer.id
        deal.client_id = task.publisher_id
        deal.tasker_id = offer.tasker_id
        if not deal.fixed_price:
            deal.fixed_price = offer.amount
        deal.status = "accepted"
        if not deal.accepted_at:
            deal.accepted_at = date.today()

    # reflejar en Task → CLAVE para canChat
    # tu app usa "assigned" post-aceptación
    task.status = "assigned"
    task.assigned_at = task.assigned_at or date.today()
    task.assigned_tasker_id = offer.tasker_id    # <<=== IMPORTANTE

    # marcar offer como aceptada
    offer.status = "accepted"

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "No se pudo guardar el deal",
            "detail": str(getattr(e, "orig", e))
        }), 500

    return jsonify(deal.serialize()), 201


@api.route("/tasks/<int:task_id>/deal", methods=["GET"])
def get_latest_deal_for_task(task_id):
    deal = TaskDealed.query.filter_by(
        task_id=task_id).order_by(TaskDealed.id.desc()).first()
    if not deal:
        return jsonify({"error": "No hay deals para esta tarea"}), 404
    return jsonify(deal.serialize()), 200


@api.get("/meta/statuses")
def meta_statuses():
    return jsonify(statuses_as_dict()), 200

@api.route("/tasks/<int:task_id>/complete", methods=["PUT"])
def complete_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Tarea no encontrada"}), 404

    deal = _latest_deal(task_id)
    if not deal:
        return jsonify({"error": "No hay deal para esta tarea"}), 400

    # marcar estados
    task.status = "completed"
    task.completed_at = date.today()

    deal.status = "completed"
    if not deal.delivered_at:
        deal.delivered_at = date.today()

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"error": "No se pudo completar la tarea"}), 500

    # enriquecer respuesta con assigned_tasker_id desde el deal (como ya haces)
    data = task.serialize_all_data()
    data["assigned_tasker_id"] = deal.tasker_id
    return jsonify(data), 200
