from flask import Flask
from .db.session import db
from .routes.auth import auth_bp
from .routes.contacts import contacts_bp
from .routes.users import users_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object("app.config.Config")

    db.init_app(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(contacts_bp)
    app.register_blueprint(users_bp)

    return app
