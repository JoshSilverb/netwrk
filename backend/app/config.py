import os
import logging

DATABASE_URL_temp = os.getenv("DATABASE_URL")
if not DATABASE_URL_temp:
    raise RuntimeError("DATABASE_URL environment variable not set.")
GOOGLE_API_KEY_temp = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY_temp:
    raise RuntimeError("GOOGLE_API_KEY environment variable not set.")
OPENAI_API_KEY_temp = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY_temp:
    raise RuntimeError("OPENAI_API_KEY environment variable not set.")
S3_BUCKET_NAME_temp = os.getenv("S3_BUCKET_NAME")
if not S3_BUCKET_NAME_temp:
    raise RuntimeError("S3_BUCKET_NAME environment variable not set.")

class Config:
    SQLALCHEMY_DATABASE_URI = DATABASE_URL_temp
    GOOGLE_API_KEY = GOOGLE_API_KEY_temp
    OPENAI_API_KEY = OPENAI_API_KEY_temp
    S3_BUCKET_NAME = S3_BUCKET_NAME_temp
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Logging configuration for AWS EB
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    @staticmethod
    def configure_logging():
        # Configure root logger to output to stdout (picked up by EB logs)
        logging.basicConfig(
            level=getattr(logging, Config.LOG_LEVEL),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[logging.StreamHandler()]
        )
        
        # Set werkzeug logger to WARNING to reduce noise
        logging.getLogger('werkzeug').setLevel(logging.WARNING)
