import os

DATABASE_URL_temp = os.getenv("DATABASE_URL")
if not DATABASE_URL_temp:
    raise RuntimeError("DATABASE_URL environment variable not set.")
GOOGLE_API_KEY_temp = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY_temp:
    raise RuntimeError("GOOGLE_API_KEY environment variable not set.")
OPENAI_API_KEY_temp = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY_temp:
    raise RuntimeError("OPENAI_API_KEY environment variable not set.")

class Config:
    SQLALCHEMY_DATABASE_URI = DATABASE_URL_temp
    GOOGLE_API_KEY = GOOGLE_API_KEY_temp
    OPENAI_API_KEY = OPENAI_API_KEY_temp
    SQLALCHEMY_TRACK_MODIFICATIONS = False
