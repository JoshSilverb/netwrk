"""netwrk development configuration."""

import pathlib

# Root of this application, useful if it doesn't occupy an entire domain
APPLICATION_ROOT = '/'

# Secret key for encrypting cookies
SECRET_KEY = b'0\x99\x98\x0b\xae\x9b`I\x88`\xb3r+\
    \xbc\x9f\xe1\x11\xf3\xa0q#\x8d\xf3\x02'
SESSION_COOKIE_NAME = 'login'

# File Upload to var/uploads/
NETWRKAPP_ROOT = pathlib.Path(__file__).resolve().parent.parent
UPLOAD_FOLDER = NETWRKAPP_ROOT/'var'/'uploads'
ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'gif'])
MAX_CONTENT_LENGTH = 16 * 1024 * 1024

# Database file is var/netwrk.sqlite3
DATABASE_FILENAME = NETWRKAPP_ROOT/'var'/'netwrk.sqlite3'

POSTGRESQL_DATABASE_HOST = "localhost"
POSTGRESQL_DATABASE_PORT = 5432
POSTGRESQL_DATABASE_USER = "joshs" # OS or WSL username
POSTGRESQL_DATABASE_PASSWORD = None
POSTGRESQL_DATABASE_DB = "netwrk"

EMBEDDING_DIM = 256