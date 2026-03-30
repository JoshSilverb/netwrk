from apig_wsgi import make_lambda_handler
from application import application

handler = make_lambda_handler(application)
