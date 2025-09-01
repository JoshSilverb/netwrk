FROM python:3.11-slim

# Install system packages needed for psycopg2 and pip builds
RUN apt-get update && apt-get install -y \
    libpq-dev gcc curl \
 && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy entrypoint
COPY application.py .

# Copy source (for build completeness; live updates come from mounted volumes)
# COPY lambda/app               ./app
# COPY sql                      ./sql
# COPY lambda/integration_tests ./integration_tests

COPY app ./app
COPY sql ./sql
# COPY run.py ./run.py
# COPY run.sh ./run.sh

# RUN python3 application.py

CMD ["/bin/bash"]
