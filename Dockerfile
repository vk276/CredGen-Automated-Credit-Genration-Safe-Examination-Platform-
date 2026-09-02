# Base image with Python 3
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy all project files
COPY . /app

# Expose backend REST API port
EXPOSE 5000

# Start CredGen backend server with SQLite persistence
CMD ["python", "server.py"]
