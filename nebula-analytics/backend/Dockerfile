# Use a lightweight production-ready Python base image
FROM python:3.11-slim

# Prevent Python from writing pyc files to disk and buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire rest of the application code
COPY . .

# Expose our high-performance Uvicorn port
EXPOSE 8000

# Fire up the real-time server bound to the local network bridge
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]