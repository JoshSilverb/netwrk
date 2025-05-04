FROM python:3.11-slim

# Install system packages needed for psycopg2 and pip builds
RUN apt-get update && apt-get install -y \
    libpq-dev gcc \
 && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source (for build completeness; live updates come from mounted volumes)
COPY lambda/app               ./app
COPY sql                      ./sql
COPY lambda/integration_tests ./integration_tests

CMD ["/bin/bash"]
