FROM python:3.11-slim

WORKDIR /code

# Instalamos libmagic1 para la detección de Magic Numbers
RUN apt-get update && apt-get install -y \
  libmagic1 \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONPATH=/code

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
