# api/commands.py
import click
from decimal import Decimal
from datetime import date, datetime
from flask import current_app as app

from api.models import (
    db, User, Rol, Profile, AccountSettings,
    Task, TaskOffered, TaskDealed, Payment, Review, Message
)

"""
Comandos CLI de Flask para poblar datos de prueba.

Uso:
    pipenv run insert-test-users 5
    pipenv run insert-test-data
"""


def setup_commands(app):
    # -----------------------------
    # 1) Crear usuarios mínimos
    # -----------------------------
    @app.cli.command("insert-test-users")  # $ pipenv run insert-test-users 5
    @click.argument("count")
    def insert_test_users(count):
        """
        Crea N usuarios (email/username/password).
        """
        print(f"Creating {count} test users")
        created = []
        for x in range(1, int(count) + 1):
            u = User(
                email=f"test_user{x}@test.com",
                username=f"test_user{x}",
                password="123456"
            )
            db.session.add(u)
            created.append(u)
        db.session.commit()
        for u in created:
            print("User:", u.email, "created.")
        print("All test users created")

    # -----------------------------
    # 2) Semilla end-to-end simple
    # -----------------------------
    @app.cli.command("insert-test-data")   # $ pipenv run insert-test-data
    def insert_test_data():
        """
        Crea: roles -> usuarios (con rol) -> perfiles/ajustes -> task -> offer -> deal
              -> payment -> (1) message -> review
        Todo respeta FKs y tipos actuales.
        """
        with app.app_context():
            print("→ Insertando datos de prueba...")

            # --- ROLES ---
            r_client = Rol(type="client")
            r_tasker = Rol(type="tasker")
            db.session.add_all([r_client, r_tasker])
            db.session.flush()

            # --- USERS ---
            u_client = User(email="poster1@test.com",
                            username="poster1", password="x")
            u_tasker = User(email="tasker1@test.com",
                            username="tasker1", password="x")
            db.session.add_all([u_client, u_tasker])
            db.session.flush()

            # Asignar roles (M2M)
            u_client.roles.append(r_client)
            u_tasker.roles.append(r_tasker)

            # --- PROFILE / SETTINGS ---
            now = datetime.utcnow()
            p_client = Profile(
                user_id=u_client.id, name="Paula", last_name="Poster",
                avatar=None, city="Santiago", birth_date=None, bio="Cliente demo",
                skills=None, rating_avg=None, created_at=now, modified_at=now
            )
            p_tasker = Profile(
                user_id=u_tasker.id, name="Tania", last_name="Tasker",
                avatar=None, city="Santiago", birth_date=None, bio="Tasker demo",
                skills="pintura,taladro", rating_avg=4.7, created_at=now, modified_at=now
            )
            s_client = AccountSettings(
                user_id=u_client.id, phone=None, billing_info=None,
                language="es", marketing_emails=True, created_at=now, modified_at=now
            )
            s_tasker = AccountSettings(
                user_id=u_tasker.id, phone=None, billing_info=None,
                language="es", marketing_emails=True, created_at=now, modified_at=now
            )
            db.session.add_all([p_client, p_tasker, s_client, s_tasker])
            db.session.flush()

            # --- TASK (publicada por el client) ---
            t = Task(
                title="Pintar dormitorio 3x3",
                description="Necesito pintura blanca, cubrir marcos.",
                location="Ñuñoa",
                price=Decimal("60000.00"),
                due_at=None,
                posted_at=date.today(),   # explícito (aunque tengas server_default)
                assigned_at=None,
                completed_at=None,
                status="open",
                publisher_id=u_client.id
            )
            db.session.add(t)
            db.session.flush()

            # --- OFFER (status es STRING en tu modelo) ---
            off = TaskOffered(
                task_id=t.id,
                tasker_id=u_tasker.id,
                status="pending",  # acorde a tu modelo actual
                amount=Decimal("400.00"),
                message="¿Te sirve hacerlo hoy?"
            )
            db.session.add(off)
            db.session.flush()

            # --- DEAL (aceptado/in_progress) ---
            deal = TaskDealed(
                task_id=t.id,
                offer_id=off.id,
                client_id=u_client.id,
                tasker_id=u_tasker.id,
                fixed_price=Decimal("55000.00"),
                status="in_progress",
                accepted_at=date.today(),
                delivered_at=None,
                cancelled_at=None
            )
            db.session.add(deal)
            db.session.flush()

            # reflejar en Task
            t.assigned_at = date.today()
            t.status = "assigned"

            # --- PAYMENT (único por deal) ---
            pay = Payment(
                dealed_id=deal.id,
                amount=Decimal("55000.00"),
                status="held"  # held/paid/refunded, etc.
            )
            db.session.add(pay)
            db.session.flush()

            # --- MESSAGE (solo 1 por el UNIQUE actual en dealer_id) ---
            existing_msg = Message.query.filter_by(dealer_id=deal.id).first()
            if not existing_msg:
                msg1 = Message(
                    body="Hola, mañana a las 10 está bien?",
                    dealer_id=deal.id,
                    sender_id=u_client.id
                )
                db.session.add(msg1)
                db.session.flush()
            else:
                msg1 = existing_msg  # para poder imprimir su id abajo

            # --- REVIEW (única por task_dealed) ---
            rev = Review(
                review="Excelente trabajo, muy puntual.",
                rate=Decimal("4.50"),
                created_at=datetime.utcnow(),
                publisher_id=u_client.id,
                worker_id=u_tasker.id,
                task_dealed_id=deal.id,   # UNIQUE
                task_id=t.id
            )
            db.session.add(rev)

            db.session.commit()

            print("✓ Roles:", [r_client.type, r_tasker.type])
            print("✓ Users:", u_client.id, u_tasker.id)
            print("✓ Task:", t.id)
            print("✓ Offer:", off.id)
            print("✓ Deal:", deal.id)
            print("✓ Payment:", pay.id)
            print("✓ Message:", msg1.id)
            print("✓ Review:", rev.id)
            print("✓ Datos de prueba creados con éxito.")
