# FSJES Ain Chock — Gestion des Relevés de Notes

Application web de gestion et d'impression des relevés de notes pour la Faculté des Sciences Juridiques, Économiques et Sociales Ain Chock, Université Hassan II de Casablanca.

---

## Fonctionnalités

- **Import Excel** — chargement des données étudiantes et notes depuis un fichier `.xlsx`
- **Recherche** — par nom, numéro d'examen, date de naissance, filière, année universitaire
- **Génération PDF** — relevé officiel en arabe (RTL) avec numéro de série unique
- **Contrôle d'impression** — les professeurs impriment 1 fois par étudiant ; les admins ont un accès illimité avec motif obligatoire
- **Compteur d'impressions** — visible sur chaque fiche étudiant
- **Journal d'audit** — toutes les actions sont tracées (consultation, impression, import, modification)

---

## Stack technique

| Couche | Technologie |
|---|---|
| Backend API | Python 3.14 + FastAPI |
| Base de données | PostgreSQL 18 |
| ORM | SQLAlchemy + Alembic |
| Auth | JWT (python-jose) + bcrypt |
| Excel | pandas + openpyxl |
| PDF | WeasyPrint + Jinja2 (RTL arabe) |
| Frontend | React + TypeScript + Vite *(repo séparé)* |

---

## Structure du projet

```
GestionDesRelevetsDeNote/
├── backend/
│   ├── app/
│   │   ├── main.py              # Point d'entrée FastAPI
│   │   ├── config.py            # Variables d'environnement
│   │   ├── database.py          # Connexion SQLAlchemy
│   │   ├── dependencies.py      # Dépendances (auth, rôles)
│   │   ├── models/
│   │   │   ├── user.py          # Utilisateurs (admin / professeur)
│   │   │   ├── student.py       # Étudiants + récapitulatif notes
│   │   │   ├── grade.py         # Notes par matière
│   │   │   ├── transcript.py    # Journal d'impressions (PrintLog)
│   │   │   └── audit_log.py     # Journal d'audit
│   │   ├── schemas/             # Schémas Pydantic (validation I/O)
│   │   ├── routers/
│   │   │   ├── auth.py          # POST /api/auth/login
│   │   │   ├── student.py       # CRUD /api/students
│   │   │   ├── grades.py        # GET/POST /api/grades/{student_id}
│   │   │   ├── transcript.py    # Génération PDF + logs impression
│   │   │   ├── import_excel.py  # POST /api/import
│   │   │   └── audit.py         # GET /api/audit
│   │   └── services/
│   │       ├── excel_parser.py  # Parsing et import Excel
│   │       └── pdf_generator.py # Génération relevé PDF (arabe RTL)
│   ├── .env                     # Variables locales (NE PAS committer)
│   ├── .env.example             # Template de configuration
│   └── requirements.txt
├── PRD.md                       # Product Requirements Document
└── README.md
```

---

## Prérequis

- Python 3.11+ (testé sur 3.14.5)
- PostgreSQL 18
- Git Bash ou PowerShell

---

## Installation (backend)

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd GestionDesRelevetsDeNote/backend
```

### 2. Créer l'environnement virtuel

```bash
python -m venv venv
source venv/Scripts/activate   # Git Bash
# ou : .\venv\Scripts\Activate.ps1  (PowerShell)
```

### 3. Installer les dépendances

```bash
pip install --only-binary=:all: -r requirements.txt
pip install email-validator
```

> Si `bcrypt` / `passlib` pose problème avec Python 3.14 :
> ```bash
> pip install "bcrypt==4.0.1"
> ```

### 4. Créer la base de données PostgreSQL

Dans pgAdmin (ou psql) :

```sql
CREATE USER fsjes_user WITH PASSWORD 'fsjes_password_dev';
CREATE DATABASE releves_fsjes OWNER fsjes_user;
GRANT ALL PRIVILEGES ON DATABASE releves_fsjes TO fsjes_user;
```

### 5. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditer `.env` avec vos valeurs :

```env
DATABASE_URL=postgresql+psycopg2://fsjes_user:fsjes_password_dev@localhost:5432/releves_fsjes
JWT_SECRET_KEY=change-this-to-a-long-random-secret-in-production
FRONTEND_URL=http://localhost:5173
FIRST_ADMIN_EMAIL=admin@fsjes.ma
FIRST_ADMIN_PASSWORD=Admin@2026
FIRST_ADMIN_NAME=Administrateur FSJES
```

### 6. Démarrer le serveur

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Au premier démarrage, les tables sont créées automatiquement et le compte admin initial est inséré.

**API interactive** : [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Endpoints principaux

| Méthode | Endpoint | Description | Rôle requis |
|---|---|---|---|
| POST | `/api/auth/login` | Connexion (retourne JWT) | — |
| GET | `/api/students` | Recherche étudiants | Tous |
| GET | `/api/students/{id}` | Fiche étudiant + notes | Tous |
| POST | `/api/students` | Créer un étudiant | Admin |
| PUT | `/api/students/{id}` | Modifier un étudiant | Admin |
| DELETE | `/api/students/{id}` | Supprimer un étudiant | Admin |
| GET | `/api/grades/{student_id}` | Notes d'un étudiant | Tous |
| POST | `/api/grades/{student_id}` | Mettre à jour les notes | Admin |
| POST | `/api/import` | Import depuis Excel | Admin |
| GET | `/api/transcripts/{id}/pdf` | Télécharger le relevé PDF | Tous |
| POST | `/api/transcripts/{id}/print` | Enregistrer une impression | Tous |
| GET | `/api/audit` | Journal d'audit | Admin |
| GET | `/api/health` | Vérification du serveur | — |

---

## Rôles et permissions

| Action | Professeur | Admin |
|---|---|---|
| Rechercher / consulter un étudiant | ✅ | ✅ |
| Imprimer un relevé | ✅ (1 fois) | ✅ (illimité) |
| Importer depuis Excel | — | ✅ |
| Modifier / supprimer un étudiant | — | ✅ |
| Voir le journal d'audit complet | — | ✅ |
| Gérer les comptes utilisateurs | — | ✅ |

---

## Format Excel attendu

Le fichier doit contenir une ligne par étudiant avec les colonnes en arabe reconnues automatiquement :

| Colonne arabe | Champ |
|---|---|
| `اسم المرشح` / `الاسم و النسب` | Nom complet |
| `رقم الامتحان` / `رقم التسجيل` | Numéro d'examen |
| `تاريخ الميلاد` | Date de naissance |
| `مكان الميلاد` | Lieu de naissance |
| `المعدل` | Moyenne générale |
| `المجموع العام` | Total général |
| `مجموع الكتابي` | Total écrit |
| `مجموع الشفاهي` | Total oral |
| `الميزة` | Mention |
| *Toute autre colonne* | Matière (note directe) |

---

## Sécurité

- Ne jamais committer le fichier `.env` (contient le mot de passe DB et la clé JWT)
- Utiliser `.env.example` comme référence partagée
- En production : remplacer `JWT_SECRET_KEY` par une valeur aléatoire longue
- Le mot de passe PostgreSQL ne doit pas contenir `@` dans l'URL de connexion (encode en `%40`)

---

## Développement

**Backend** : Ahmed Ennaki  
**Frontend** : *(collègue — repo React séparé)*  
**Institution** : FSJES Ain Chock, Université Hassan II de Casablanca
