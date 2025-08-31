from flask import Blueprint, jsonify, request
from flask_cors import CORS
from datetime import datetime
from api.models import db, User, Task, Profile, Dispute, Rol

api = Blueprint("api", __name__)
CORS(api, supports_credentials=True)

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
    return jsonify([t.serialize() for t in tasks]), 200


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
        status=data.get("status", "pending"),
    )
    db.session.add(t)
    db.session.commit()
    return jsonify(t.serialize()), 201


@api.route("/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
    t = Task.query.get(task_id)
    if not t:
        return jsonify({"error": "Tarea no encontrada"}), 404
    return jsonify(t.serialize()), 200


@api.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    t = Task.query.get(task_id)
    if not t:
        return jsonify({"error": "Tarea no encontrada"}), 404
    db.session.delete(t)
    db.session.commit()
    return jsonify({"message": "Tarea eliminada"}), 200

# =========================
# ADMIN ACTIONS AND DISPUTES
# =========================


@api.route("/disputes", methods=["GET"])
def get_disputes():
    disputes = Dispute.query.all()
    return jsonify([d.serialize() for d in disputes]), 200


@api.route("/disputes", methods=["POST"])
def create_dispute():
    data = request.get_json() or {}
    d = Dispute(
        reason=data["reason"],
        details=data["details"],
        status=data["status"],
        resolution=data["resolution"],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        dealed_id=data["task_id"],
        raised_by=data["client_id"]
    )
    db.session.add(d)
    db.session.commit()  
    return jsonify(d.serialize()), 201

@api.route("/disputes/<int:dispute_id>", methods=["PUT"])
def update_dispute(dispute_id):
    data = request.get_json() or {}
    d = Dispute(
        id = Dispute.query.get(dispute_id),
        reason=data["reason"],
        details=data["details"],
        status=data["status"],
        resolution=data["resolution"],
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        dealed_id=data["task_id"],
        raised_by=data["client_id"]
    )
    return jsonify(d.serialize()), 201

# =========================
# ROL
# =========================

@api.route("/rol", methods=["POST"])
def create_rol():
    data = request.get_json() or {}
    r = Rol(
        type=data["type"],
    )
    db.session.add(r)
    db.session.commit()  
    return jsonify(r.serialize()), 201

@api.route("/rol", methods=["GET"])
def get_roles():
    roles = Rol.query.all()
    return jsonify([r.serialize() for r in roles]), 200

@api.route("/rol/<int:rol_id>", methods=["DELETE"])
def delete_rol(rol_id):
    r = Task.query.get(rol_id)
    if not r:
        return jsonify({"error": "Rol no encontrado"}), 404
    db.session.delete(r)
    db.session.commit()
    return jsonify({"message": "Rol eliminado"}), 200