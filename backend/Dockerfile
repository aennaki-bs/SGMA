FROM python:3.12-slim

WORKDIR /app

# System dependencies required by WeasyPrint for PDF rendering
# libgdk-pixbuf-xlib-2.0-0 replaces libgdk-pixbuf2.0-0 in Debian Trixie
# fonts-noto-core provides Arabic (Naskh) support
RUN apt-get update && apt-get install -y \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-xlib-2.0-0 \
    libffi-dev \
    shared-mime-info \
    fonts-noto-core \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

ENTRYPOINT ["sh", "entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
