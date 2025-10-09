"""rename user -> users (preserve data & FKs)"""

from alembic import op

# Alembic identifiers — keep the ones your file already has
revision = "394b42086892"
down_revision = "030bb9805c68"
branch_labels = None
depends_on = None


def upgrade():
    # Simple rename keeps data and foreign keys in Postgres
    op.rename_table("user", "users")

    # Optional niceties (you can skip both safely):
    # 1) If you want to also rename the PK sequence:
    # op.execute('ALTER SEQUENCE IF EXISTS "user_id_seq" RENAME TO users_id_seq')
    #
    # 2) If you have a default nextval referencing the old sequence name
    #    *and* you renamed the sequence above, update the default:
    # op.execute("ALTER TABLE users ALTER COLUMN id SET DEFAULT nextval('users_id_seq')")


def downgrade():
    op.rename_table("users", "user")
    # Optional: undo sequence rename if you did it above
    # op.execute('ALTER SEQUENCE IF EXISTS users_id_seq RENAME TO "user_id_seq"')
    # op.execute('ALTER TABLE "user" ALTER COLUMN id SET DEFAULT nextval(\'"user_id_seq"\')')
