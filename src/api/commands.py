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
    pipenv run flask insert-test-users 5
    pipenv run flask insert-test-data
    pipenv run flask simulate-offer-accept --task-id 1 --client-id 1 --tasker-id 2 --amount 60000
    pipenv run flask fix-assigned-tasker --task-id 1
"""


def setup_commands(app):
    # -----------------------------
    # 1) Crear usuarios mínimos
    # -----------------------------
    # $ pipenv run flask insert-test-users 5
    @app.cli.command("insert-test-users")
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
    # $ pipenv run flask insert-test-data
    @app.cli.command("insert-test-data")
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

            # --- OFFER ---
            off = TaskOffered(
                task_id=t.id,
                tasker_id=u_tasker.id,
                status="pending",  # acorde a tu modelo actual
                amount=Decimal("400.00"),
                message="¿Te sirve hacerlo hoy?"
            )
            db.session.add(off)
            db.session.flush()

            # --- DEAL ---
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

            # --- PAYMENT ---
            pay = Payment(
                dealed_id=deal.id,
                amount=Decimal("55000.00"),
                status="held"  # held/paid/refunded, etc.
            )
            db.session.add(pay)
            db.session.flush()

            # --- MESSAGE ---
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
                msg1 = existing_msg

            # --- REVIEW ---
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

    # -----------------------------
    # simulate-offer-accept
    # -----------------------------
    @app.cli.command("simulate-offer-accept")
    @click.option("--task-id", default=1, show_default=True, type=int)
    @click.option("--client-id", default=1, show_default=True, type=int)
    @click.option("--tasker-id", default=2, show_default=True, type=int)
    @click.option("--amount", default=60000, show_default=True, type=float)
    def simulate_offer_accept(task_id, client_id, tasker_id, amount):
        """
        Simula el flujo de la compañera:
          - Task <task_id> publicada por client <client_id> (status 'open' o 'pending')
          - Tasker <tasker_id> hace/actualiza offer
          - Client acepta -> crea Deal y task pasa a 'assigned'
        Idempotente: reutiliza registros si ya existen.
        """
        from decimal import Decimal
        from datetime import date

        # 1) validar entidades base
        task = Task.query.get(task_id)
        if not task:
            raise click.ClickException(f"Task {task_id} no existe")
        if task.publisher_id != client_id:
            raise click.ClickException(
                f"La task {task_id} no pertenece al client {client_id}")

        if not User.query.get(client_id):
            raise click.ClickException(f"Client {client_id} no existe")
        if not User.query.get(tasker_id):
            raise click.ClickException(f"Tasker {tasker_id} no existe")

        # 2) asegurar offer (task_id, tasker_id)
        offer = TaskOffered.query.filter_by(
            task_id=task.id, tasker_id=tasker_id).first()
        if not offer:
            offer = TaskOffered(
                task_id=task.id,
                tasker_id=tasker_id,
                status="pending",
                amount=Decimal(str(amount)),
                message="Simulación: puedo mañana"
            )
            db.session.add(offer)
            db.session.flush()
            click.echo(
                f"✓ Offer {offer.id} creada (task={task.id}, tasker={tasker_id}, amount={offer.amount})")
        else:
            offer.amount = Decimal(str(amount))
            if not offer.message:
                offer.message = "Simulación: puedo mañana"
            click.echo(f"↺ Offer {offer.id} reutilizada")

        # 3) crear/reutilizar deal (1 por task)
        deal = TaskDealed.query.filter_by(task_id=task.id).first()
        if deal:
            click.echo(
                f"↺ Deal {deal.id} ya existía para task {task.id}, asegurando consistencia…")
            deal.offer_id = offer.id
            deal.client_id = client_id
            deal.tasker_id = tasker_id
            if not deal.fixed_price:
                deal.fixed_price = offer.amount
            deal.status = "accepted"
            if not deal.accepted_at:
                deal.accepted_at = date.today()
        else:
            deal = TaskDealed(
                task_id=task.id,
                offer_id=offer.id,
                client_id=client_id,
                tasker_id=tasker_id,
                fixed_price=offer.amount,
                status="accepted",
                accepted_at=date.today()
            )
            db.session.add(deal)
            db.session.flush()
            click.echo(f"✓ Deal {deal.id} creado para task {task.id}")

        # 4) estados coherentes
        offer.status = "accepted"
        task.status = "assigned"  # consistente con tu seed
        if not task.assigned_at:
            task.assigned_at = date.today()
        # CLAVE: dejar el tasker asignado para habilitar chat en el front
        task.assigned_tasker_id = tasker_id

        # 5) commit
        db.session.commit()

        # 6) salida
        click.echo("--- RESUMEN ---")
        click.echo(
            f"Task:    id={task.id} status={task.status} publisher_id={task.publisher_id} assigned_tasker_id={getattr(task, 'assigned_tasker_id', None)}")
        click.echo(
            f"Offer:   id={offer.id} status={offer.status} tasker_id={offer.tasker_id} amount={offer.amount}")
        click.echo(
            f"Deal:    id={deal.id} client_id={deal.client_id} tasker_id={deal.tasker_id} fixed_price={deal.fixed_price}")
        click.echo(
            f"Fechas:  assigned_at={task.assigned_at} accepted_at={deal.accepted_at}")

    # -----------------------------
    # fix-assigned-tasker (backfill)
    # -----------------------------
    @app.cli.command("fix-assigned-tasker")
    @click.option("--task-id", required=False, type=int, help="Si no se pasa, intenta todas las tasks")
    def fix_assigned_tasker(task_id):
        """
        Para cada task 'assigned/in_progress/completed' sin assigned_tasker_id,
        toma el último deal y copia su tasker_id a la task.
        """
        from api.models import TaskDealed, Task
        from datetime import date

        qs = Task.query
        if task_id:
            qs = qs.filter_by(id=task_id)
        tasks = qs.all()

        n = 0
        for t in tasks:
            if t.status in ("assigned", "in_progress", "completed") and not getattr(t, "assigned_tasker_id", None):
                deal = TaskDealed.query.filter_by(
                    task_id=t.id).order_by(TaskDealed.id.desc()).first()
                if deal:
                    t.assigned_tasker_id = deal.tasker_id
                    if not t.assigned_at:
                        t.assigned_at = date.today()
                    n += 1

        db.session.commit()
        print(f"✓ actualizadas {n} tasks")

    @app.cli.command("delete-review")
    @click.option("--task-id", required=True, type=int)
    def delete_review(task_id):
        """
        Borra la review asociada al ÚLTIMO deal de la task.
        Útil para reintentar el POST desde el front (regla 1 review por deal).
        """
        from api.models import TaskDealed, Review
        deal = TaskDealed.query.filter_by(task_id=task_id).order_by(TaskDealed.id.desc()).first()
        if not deal:
            raise click.ClickException(f"No hay deal para task {task_id}")

        rev = Review.query.filter_by(task_dealed_id=deal.id).first()
        if not rev:
            click.echo(f"No hay review para deal {deal.id} (task {task_id})")
            return

        db.session.delete(rev)
        db.session.commit()
        click.echo(f"✓ Review {rev.id} borrada (task {task_id}, deal {deal.id})")

    # -----------------------------
    # delete-offer
    # -----------------------------
    @app.cli.command("delete-offer")
    @click.option("--task-id", required=True, type=int, help="ID de la tarea")
    @click.option("--tasker-id", required=True, type=int, help="ID del tasker")
    def delete_offer(task_id, tasker_id):
        """
        Borra la oferta de un tasker específico en una task.
        Útil para resetear pruebas y permitir que el tasker vuelva a ofertar.
        """
        from api.models import TaskOffered

        offer = TaskOffered.query.filter_by(task_id=task_id, tasker_id=tasker_id).first()
        if not offer:
            click.echo(f"No existe oferta para task {task_id} del tasker {tasker_id}")
            return

        db.session.delete(offer)
        db.session.commit()
        click.echo(f"✓ Oferta {offer.id} borrada (task {task_id}, tasker {tasker_id})")

    # -----------------------------
    # accept-offer
    # -----------------------------
    @app.cli.command("accept-offer")
    @click.option("--offer-id", required=True, type=int)
    @click.option("--publisher-id", required=True, type=int)
    @click.option("--tasker-id", required=True, type=int)
    def accept_offer(offer_id, publisher_id, tasker_id):
        """
        Acepta una oferta existente:
          - Cambia offer.status = 'accepted'
          - Crea o actualiza deal con status 'accepted'
          - Actualiza la task a 'assigned' con assigned_tasker_id
        """

        from api.models import Task, TaskOffered, TaskDealed
        from datetime import date

        offer = TaskOffered.query.get(offer_id)
        if not offer:
            raise click.ClickException(f"No existe la offer {offer_id}")

        task = Task.query.get(offer.task_id)
        if not task:
            raise click.ClickException(f"No existe la task {offer.task_id}")

        # Validar publisher y tasker
        if task.publisher_id != publisher_id:
            raise click.ClickException(f"La task {task.id} no pertenece al publisher {publisher_id}")
        if offer.tasker_id != tasker_id:
            raise click.ClickException(f"La offer {offer.id} no pertenece al tasker {tasker_id}")

        # 1) actualizar la offer
        offer.status = "accepted"

        # 2) crear/reutilizar deal
        deal = TaskDealed.query.filter_by(task_id=task.id, tasker_id=tasker_id).first()
        if not deal:
            deal = TaskDealed(
                task_id=task.id,
                offer_id=offer.id,
                client_id=publisher_id,
                tasker_id=tasker_id,
                fixed_price=offer.amount,
                status="accepted",
                accepted_at=date.today()
            )
            db.session.add(deal)
        else:
            deal.offer_id = offer.id
            deal.client_id = publisher_id
            deal.tasker_id = tasker_id
            deal.status = "accepted"
            if not deal.fixed_price:
                deal.fixed_price = offer.amount
            if not deal.accepted_at:
                deal.accepted_at = date.today()

        # 3) actualizar task
        task.status = "assigned"
        task.assigned_tasker_id = tasker_id
        if not task.assigned_at:
            task.assigned_at = date.today()

        db.session.commit()

        click.echo(f"✓ Offer {offer.id} aceptada")
        click.echo(f"✓ Deal {deal.id} {'creado' if deal else 'actualizado'}")
        click.echo(f"✓ Task {task.id} → status={task.status}, assigned_tasker_id={task.assigned_tasker_id}")