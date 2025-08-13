from app import create_app

application = create_app()

# Needed for EB healthchecks
@application.route("/", methods=["GET"])
def health_check():
    return 'OK', 200


if __name__ == "__main__":
    application.run(debug=True)
