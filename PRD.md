# PRD — Application de Gestion des Relevés de Notes (بيان النقط)
**Établissement :** FSJES Ain Chock — Université Hassan II de Casablanca  
**Version :** 3.0  
**Date :** 2026-06-10  
**Délai de livraison :** 2 semaines  
**Plateforme :** Web uniquement

---

## Table des Matières

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Contexte & Objectif Principal](#2-contexte--objectif-principal)
3. [Rôles et Permissions](#3-rôles-et-permissions)
4. [Fonctionnalités Requises](#4-fonctionnalités-requises)
5. [Structure des Données](#5-structure-des-données)
6. [Format Excel d'Import](#6-format-excel-dimport)
7. [Modèle du Relevé PDF](#7-modèle-du-relevé-pdf)
8. [Architecture Technique](#8-architecture-technique)
9. [Plan d'Implémentation — 2 Semaines](#9-plan-dimplémentation--2-semaines)
10. [Historique des Actions (Audit Log)](#10-historique-des-actions-audit-log)
11. [Critères de Succès](#11-critères-de-succès)
12. [Risques & Mitigations](#12-risques--mitigations)

---

## 1. Résumé Exécutif

Application web de gestion et de génération des relevés de notes archivés (بيان النقط) pour la FSJES Ain Chock. Les données des anciens étudiants sont importées depuis des fichiers Excel et stockées en base de données. Un professeur peut rechercher un étudiant et imprimer son relevé **une seule fois**. Un administrateur dispose de pleins droits. Chaque action est enregistrée dans un historique complet.

---

## 2. Contexte & Objectif Principal

### Problème
Les relevés de notes des anciens étudiants (archives) existent en format papier ou Excel non structuré. Il n'y a aucun système pour :
- Retrouver rapidement un étudiant (par nom + date de naissance)
- Générer un relevé PDF officiel à la demande
- Contrôler qu'un étudiant ne reçoit qu'une seule copie

### Objectif
Créer un système web permettant de :
1. **Importer** les données depuis Excel et les stocker en base
2. **Rechercher** un étudiant par nom, date de naissance, numéro d'examen
3. **Générer** un relevé PDF fidèle au format FSJES officiel
4. **Contrôler** les impressions (1 seule pour un prof, illimité pour admin)
5. **Auditer** chaque action (import, consultation, impression, modification)

### Périmètre
- Application **web uniquement** (navigateur)
- Étudiants **anciens / archivés** uniquement (pas de gestion d'inscriptions en cours)
- Établissement : FSJES Ain Chock
- Délai : **2 semaines**

---

## 3. Rôles et Permissions

| Action | Professeur | Administrateur |
|---|:---:|:---:|
| Se connecter | ✅ | ✅ |
| Rechercher un étudiant | ✅ | ✅ |
| Consulter un relevé (prévisualisation) | ✅ | ✅ |
| Importer des données Excel | ❌ | ✅ |
| Saisir manuellement un étudiant/notes | ❌ | ✅ |
| Modifier un étudiant / ses notes | ❌ | ✅ |
| Supprimer un étudiant | ❌ | ✅ |
| Gérer les sessions (matières) | ❌ | ✅ |
| **Imprimer un relevé** | ✅ **(1 fois max)** | ✅ **(illimité)** |
| Voir l'historique des actions | ❌ | ✅ |
| Gérer les comptes utilisateurs | ❌ | ✅ |

---

## 4. Fonctionnalités Requises

### F1 — Authentification
- Login email + mot de passe
- Sessions JWT (8h)
- Déconnexion automatique après inactivité

### F2 — Recherche d'Étudiant
- Champ de recherche par : **Nom et Prénom** (الاسم و النسب) + **Date de naissance** (تاريخ الميلاد)
- Recherche partielle (contient) sur le nom
- Filtre optionnel par : Année académique, Filière, Année d'étude
- Résultats paginés en tableau
- Chaque ligne affiche : Nom, N° Examen, Année académique, Filière, Statut impression

### F3 — Import Excel
- L'admin sélectionne un fichier `.xlsx` / `.xls` et choisit la session cible dans le frontend
- **Le frontend parse le fichier Excel** (via SheetJS) et construit un tableau JSON structuré
- L'admin visualise un aperçu des données parsées avant confirmation
- Le frontend envoie le JSON au backend (`POST /api/import/`) — aucun fichier brut n'est transféré
- Le backend valide, détecte les doublons (même N° examen + même session), et persiste en base
- Rapport retourné : X succès / Y erreurs avec détail des lignes en erreur, affiché dans le frontend
- Les données importées s'ajoutent sans écraser l'existant (sauf doublon explicite)

### F4 — Saisie Manuelle (Admin uniquement)
- Formulaire fiche étudiant complet
- Saisie des notes dans les champs fixes (ecrit_score_1..4, oral_score_1..4)
- Les noms des matières correspondent à la session sélectionnée
- Calcul automatique : total_ecrit, total_oral, total_general, average, mention

### F5 — Génération du Relevé PDF
- Template fidèle au format FSJES Ain Chock (voir section 7)
- Langue arabe avec RTL
- Génération à la demande depuis la fiche étudiant
- Prévisualisation dans le navigateur avant impression
- Chaque PDF porte : numéro de série unique, date de génération
- Tampon **"نسخة أصلية"** (original) ou **"نسخة مكررة رقم X"** (duplicata) pour l'admin

### F6 — Contrôle des Impressions
- **Professeur** : bouton "طباعة" disponible uniquement si aucune impression précédente
  - Après impression : bouton désactivé, message "تمت الطباعة بتاريخ [date]"
- **Admin** : peut imprimer sans limite, motif obligatoire pour réimpression
- Compteur d'impressions visible sur chaque fiche étudiant

### F7 — Historique des Actions (Audit Log)
- Chaque action enregistrée : qui, quoi, quand, détail
- Actions tracées : login, consultation, import, saisie, modification, suppression, impression
- Visible par l'admin uniquement
- Filtrable par utilisateur, type d'action, date

### F8 — Gestion des Comptes (Admin uniquement)
- Création des comptes Admins et Professeurs
- Modification des données (nom, email, rôle)
- Suppression des comptes
- Activation et désactivation des utilisateurs

---

## 5. Structure des Données

Basée sur l'analyse des vrais relevés FSJES Ain Chock. Schéma à **6 tables**.

> **Principe clé :** La table `sessions` définit les *noms* des matières (jusqu'à 4 écrites + 4 orales). La table `grades` stocke les *notes* dans des colonnes fixes correspondantes. `grades.ecrit_score_1` est la note de la matière nommée dans `sessions.ecrit_subject_1`, et ainsi de suite.

---

### 5.1 Table `students` — Informations de l'étudiant

| Colonne | Type | Arabe | Exemple |
|---|---|---|---|
| id | UUID PK | — | 550e8400-e29b-41d4-a716-446655440000 |
| full_name | VARCHAR(255) | الاسم و النسب | محمد الأمين |
| exam_number | VARCHAR(50) | رقم الامتحان | 3847 |
| birth_date | DATE | المزداد بتاريخ | 1995-07-22 |
| birth_place | VARCHAR(150) | مكان الميلاد | الدار البيضاء |
| academic_year | VARCHAR(20) | السنة الجامعية | 2022/2023 |
| study_year | INTEGER | السنة الدراسية | 1 |
| branch | VARCHAR(150) | الفرع | فرع الحقوق |
| print_count | INTEGER | عدد النسخ المطبوعة | 0 |
| created_at | TIMESTAMP | — | — |

---

### 5.2 Table `sessions` — Modèle de Session (remplace `subjects`)

Une **session** représente une session d'examen pour une filière et une année données. Elle définit les noms des matières qui s'appliquent à tous les étudiants de ce groupe.

| Colonne | Type | Description | Exemple |
|---|---|---|---|
| id | UUID PK | — | — |
| session_name | VARCHAR(100) | Nom de la dورة | عادية / استدراكية / أكتوبر |
| session_date | DATE | Date de la session | 2023-06-15 |
| academic_year | VARCHAR(20) | Année universitaire | 2022/2023 |
| study_year | INTEGER | Année d'étude | 1 |
| branch | VARCHAR(150) | Filière concernée | فرع الحقوق |
| ecrit_subject_1 | VARCHAR(200) | Nom matière écrite 1 | القانون الدستوري |
| ecrit_subject_2 | VARCHAR(200) | Nom matière écrite 2 | المدخل لدراسة القانون |
| ecrit_subject_3 | VARCHAR(200) | Nom matière écrite 3 | العلاقات الدولية |
| ecrit_subject_4 | VARCHAR(200) | Nom matière écrite 4 | NULL (si < 4 matières) |
| oral_subject_1 | VARCHAR(200) | Nom matière orale 1 | المدخل لدراسة الشريعة الإسلامية |
| oral_subject_2 | VARCHAR(200) | Nom matière orale 2 | تاريخ المؤسسات |
| oral_subject_3 | VARCHAR(200) | Nom matière orale 3 | الاقتصاد السياسي |
| oral_subject_4 | VARCHAR(200) | Nom matière orale 4 | المصطلحات القانونية |

> Les colonnes `ecrit_subject_X` ou `oral_subject_X` sont NULL si la filière a moins de 4 matières dans cette catégorie.

---

### 5.3 Table `grades` — Notes (schéma fixe)

Une ligne par étudiant par session. Les colonnes de notes sont fixes et correspondent aux matières définies dans la session associée.

| Colonne | Type | Arabe | Correspond à |
|---|---|---|---|
| id | UUID PK | — | — |
| student_id | UUID FK → students | — | — |
| session_id | UUID FK → sessions | — | — |
| ecrit_score_1 | FLOAT | نقطة المادة الكتابية 1 | sessions.ecrit_subject_1 |
| ecrit_score_2 | FLOAT | نقطة المادة الكتابية 2 | sessions.ecrit_subject_2 |
| ecrit_score_3 | FLOAT | نقطة المادة الكتابية 3 | sessions.ecrit_subject_3 |
| ecrit_score_4 | FLOAT | نقطة المادة الكتابية 4 | sessions.ecrit_subject_4 |
| written_total | FLOAT | مجموع الكتابي | somme ecrit_score_1..4 |
| oral_score_1 | FLOAT | نقطة المادة الشفهية 1 | sessions.oral_subject_1 |
| oral_score_2 | FLOAT | نقطة المادة الشفهية 2 | sessions.oral_subject_2 |
| oral_score_3 | FLOAT | نقطة المادة الشفهية 3 | sessions.oral_subject_3 |
| oral_score_4 | FLOAT | نقطة المادة الشفهية 4 | sessions.oral_subject_4 |
| oral_total | FLOAT | مجموع الشفوي | somme oral_score_1..4 |
| general_total | FLOAT | المجموع العام | written_total + oral_total |
| average | FLOAT | المعدل | general_total / nb matières |
| general_result | VARCHAR(20) | النتيجة العامة | ناجح / راسب |
| mention | VARCHAR(50) | الميزة | مقبول / جيد / جيد جدا / ممتاز |

#### Exemple de lecture combinée (JOIN)

Pour afficher le relevé de l'étudiant, on joint `grades` et `sessions` :

| Matière (sessions) | Note (grades) |
|---|---|
| `sessions.ecrit_subject_1` = "القانون الدستوري" | `grades.ecrit_score_1` = 13.00 |
| `sessions.ecrit_subject_2` = "المدخل لدراسة القانون" | `grades.ecrit_score_2` = 11.50 |
| `sessions.oral_subject_1` = "الاقتصاد السياسي" | `grades.oral_score_1` = 14.00 |

---

### 5.4 Table `print_logs` — Historique des Impressions

| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | — |
| student_id | UUID FK | Étudiant concerné |
| printed_by | UUID FK | Utilisateur qui a imprimé |
| printed_at | TIMESTAMP | Date et heure |
| print_number | INTEGER | 1 = original, 2+ = duplicata |
| is_admin_override | BOOLEAN | Réimpression forcée par admin |
| override_reason | TEXT | Motif (obligatoire si override) |
| serial_number | VARCHAR(50) | N° unique du PDF généré |

---

### 5.5 Table `audit_logs` — Historique de Toutes les Actions

| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | — |
| user_id | UUID FK | Utilisateur |
| action | VARCHAR(50) | LOGIN / SEARCH / IMPORT / CREATE / UPDATE / DELETE / PRINT / VIEW |
| entity | VARCHAR(50) | student / grade / session / user |
| entity_id | UUID | ID de l'entité concernée |
| detail | TEXT | Ex: "Importé 45 étudiants depuis fichier X" |
| ip_address | VARCHAR(45) | IP de l'utilisateur |
| created_at | TIMESTAMP | Date et heure |

---

### 5.6 Table `users` — Utilisateurs

| Colonne | Type | Description |
|---|---|---|
| id | UUID PK | — |
| email | VARCHAR(255) | Identifiant unique |
| password_hash | VARCHAR | Hash bcrypt |
| full_name | VARCHAR(255) | Nom complet |
| role | ENUM(admin, professor) | Rôle |
| is_active | BOOLEAN | Compte actif |
| created_at | TIMESTAMP | — |

---

### 5.7 Diagramme des Relations

```
users ──────────────────────────────────────────┐
  │                                             │
  │ printed_by                                  │ user_id
  ▼                                             ▼
print_logs ←── student_id ──► students     audit_logs
                                  │
                                  │ student_id
                                  ▼
                               grades ←── session_id ──► sessions
```

---

## 6. Format Excel d'Import

### Flux de traitement

```
[Fichier .xlsx]
      │
      ▼ (navigateur — SheetJS)
[Frontend parse le fichier]
      │  lecture des en-têtes arabes
      │  mapping colonnes → champs
      │  calcul des totaux manquants
      ▼
[Aperçu tableau dans l'UI]
      │  l'admin vérifie, corrige si besoin
      ▼
POST /api/import/
  { session_id, rows: [ { full_name, exam_number, ... scores ... }, ... ] }
      │
      ▼ (Django — DRF)
[Backend valide + persiste]
      │  vérifie doublons
      │  enregistre students + grades
      ▼
{ success: 45, errors: [ { row: 12, reason: "doublon" } ] }
```

> Le backend ne reçoit **jamais** le fichier Excel brut — seulement le JSON structuré produit par le frontend.

### Structure des colonnes

Le fichier Excel a une ligne d'en-tête en arabe. L'admin sélectionne la **session** avant l'import — le frontend sait ainsi quelle matière correspond à chaque colonne numérotée.

| Colonne Excel | Colonne DB | Obligatoire |
|---|---|:---:|
| اسم المرشح / الاسم و النسب | students.full_name | ✅ |
| تاريخ الميلاد | students.birth_date | ✅ |
| مكان الميلاد | students.birth_place | ❌ |
| رقم الامتحان / رقم التسجيل | students.exam_number | ✅ |
| [Colonne matière écrite 1] | grades.ecrit_score_1 | ✅ |
| [Colonne matière écrite 2] | grades.ecrit_score_2 | ❌ |
| [Colonne matière écrite 3] | grades.ecrit_score_3 | ❌ |
| [Colonne matière écrite 4] | grades.ecrit_score_4 | ❌ |
| مجموع الكتابي | grades.written_total | ❌ (calculé) |
| نتيجة الكتابي | grades.written_result | ❌ (calculé) |
| [Colonne matière orale 1] | grades.oral_score_1 | ✅ |
| [Colonne matière orale 2] | grades.oral_score_2 | ❌ |
| [Colonne matière orale 3] | grades.oral_score_3 | ❌ |
| [Colonne matière orale 4] | grades.oral_score_4 | ❌ |
| مجموع الشفوي | grades.oral_total | ❌ (calculé) |
| المجموع العام | grades.general_total | ❌ (calculé) |
| المعدل | grades.average | ❌ (calculé) |
| الميزة | grades.mention | ❌ (calculé) |
| الملاحظات | grades.observations | ❌ |

> Les colonnes calculées sont recalculées automatiquement si absentes.

### Règles d'import
- L'ordre des colonnes matières dans l'Excel doit correspondre à l'ordre défini dans la session (écrit 1→4, oral 1→4)
- **Calculs effectués dans le frontend** avant envoi au backend :
  - Si `مجموع الكتابي` absent → calculé = somme des ecrit_score présents
  - Si `المعدل` absent → calculé = general_total / nombre de matières non-nulles
  - Si `الميزة` absent → déduite du average : ≥16 ممتاز, ≥14 جيد جدا, ≥12 جيد, ≥10 مقبول, <10 راسب
- **Validation backend** : doublon = même `exam_number` + même `session_id` → ignoré avec avertissement
- Le backend re-valide les types et contraintes (les données viennent du navigateur)

### Payload JSON envoyé au backend

```json
POST /api/import/
{
  "session_id": "uuid-de-la-session",
  "rows": [
    {
      "full_name": "محمد الأمين",
      "exam_number": "3847",
      "birth_date": "1995-07-22",
      "birth_place": "الدار البيضاء",
      "ecrit_score_1": 13.0,
      "ecrit_score_2": 11.5,
      "ecrit_score_3": 14.0,
      "ecrit_score_4": null,
      "written_total": 38.5,
      "oral_score_1": 12.0,
      "oral_score_2": 15.0,
      "oral_score_3": 11.0,
      "oral_score_4": 13.0,
      "oral_total": 51.0,
      "general_total": 89.5,
      "average": 11.19,
      "written_result": "ناجح",
      "general_result": "ناجح",
      "mention": "مقبول",
      "observations": ""
    }
  ]
}
```

---

## 7. Modèle du Relevé PDF

Le PDF généré reproduit fidèlement le format officiel FSJES Ain Chock.

### En-tête
```
[Logo FSJES Ain Chock]
FACULTÉ DES SCIENCES JURIDIQUES, ÉCONOMIQUES ET SOCIALES AIN CHOCK
UNIVERSITÉ HASSAN II DE CASABLANCA

بيان النقط لمواد السنة [study_year] من [branch]
```

### Informations Étudiant (bloc droite)
```
الاسم و النسب:  [full_name]
رقم الامتحان:   [exam_number]
المزداد بتاريخ: [birth_date]
السنة الجامعية: [academic_year]
الدورة:         [session_name]
```

### Tableau des Matières Kittabiya (مواد كتابية)
| المواد الكتابية | النقطة | نتيجة الكتابي |
|---|---|---|
| sessions.ecrit_subject_1 | grades.ecrit_score_1 | ناجح/راسب |
| sessions.ecrit_subject_2 | grades.ecrit_score_2 | ناجح/راسب |
| sessions.ecrit_subject_3 | grades.ecrit_score_3 | ناجح/راسب |
| sessions.ecrit_subject_4 | grades.ecrit_score_4 | ناجح/راسب |

### Tableau des Matières Chafawiya (مواد شفهية)
| المواد الشفهية | النقطة النهائية |
|---|---|
| sessions.oral_subject_1 | grades.oral_score_1 |
| sessions.oral_subject_2 | grades.oral_score_2 |
| sessions.oral_subject_3 | grades.oral_score_3 |
| sessions.oral_subject_4 | grades.oral_score_4 |

> Les lignes avec matière NULL dans la session sont omises du PDF.

### Récapitulatif
| — | — |
|---|---|
| مجموع الكتابي | grades.written_total |
| مجموع الشفوي | grades.oral_total |
| المجموع العام | grades.general_total |
| المعدل | grades.average |
| النتيجة العامة | grades.general_result |
| الميزة | grades.mention |

### Pied de Page
```
الدارالبيضاء، في [date impression]

                    [Tampon: نسخة أصلية  OU  نسخة مكررة رقم X]
                    [N° Série: RN-FSJES-AAAA-XXXXXXXX]
```

---

## 8. Architecture Technique

### Stack

| Couche | Technologie | Justification |
|---|---|---|
| Backend API | **Django 5 + Django REST Framework** | ORM puissant, admin intégré, DRF mature |
| Authentification | **djangorestframework-simplejwt** | JWT stateless, refresh tokens |
| Base de données | **PostgreSQL 18** | Robuste, concurrent, multi-utilisateurs |
| Excel Parsing | **SheetJS (xlsx)** — côté frontend | Parsing dans le navigateur, aucune dépendance backend |
| PDF Génération | **WeasyPrint + Jinja2** | PDF depuis HTML/CSS → RTL arabe facile |
| Frontend | **React + TypeScript + Vite** | Composants rapides, bonne lib RTL |
| UI Components | **Ant Design** | Supporte RTL nativement, tables et formulaires pro |
| Infrastructure | **Docker + Docker Compose** | Environnement identique sur toutes les machines |

### Docker — Services

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:18
    environment:
      POSTGRES_DB: releves_fsjes
      POSTGRES_USER: fsjes_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    depends_on: [db]
    environment:
      DATABASE_URL: postgresql://fsjes_user:${DB_PASSWORD}@db:5432/releves_fsjes
      SECRET_KEY: ${DJANGO_SECRET_KEY}
      ALLOWED_HOSTS: localhost,127.0.0.1
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    depends_on: [backend]
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app

volumes:
  pgdata:
```

> **Pour démarrer** (sur n'importe quelle machine avec Docker installé) :
> ```bash
> cp .env.example .env   # remplir les mots de passe
> docker compose up --build
> ```
> Aucune installation de Python, PostgreSQL ou Node requise sur la machine hôte.

### Structure du Projet

```
gestion-releves/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── backend/                          ← Django project
│   ├── Dockerfile
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/                       ← Django settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── releves/                      ← Main Django app
│       ├── models.py                 ← Student, Session, Grade, PrintLog, AuditLog, User
│       ├── serializers.py            ← DRF serializers
│       ├── views.py                  ← API views
│       ├── urls.py
│       ├── admin.py
│       ├── permissions.py            ← IsAdmin, IsProfessor
│       ├── services/
│       │   ├── pdf_generator.py      ← WeasyPrint → PDF relevé
│       │   └── print_control.py      ← Logique 1 impression / prof
│       └── templates/
│           └── releve_fsjes.html     ← Template HTML relevé (arabe RTL)
├── frontend/                         ← React app
│   ├── Dockerfile
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Search.tsx            ← Page principale
│   │   │   ├── StudentDetail.tsx     ← Fiche + bouton impression
│   │   │   ├── Import.tsx            ← Parse Excel (SheetJS) + aperçu + envoi JSON
│   │   │   ├── Sessions.tsx          ← Gestion sessions (admin)
│   │   │   ├── AuditLog.tsx          ← Historique (admin)
│   │   │   └── Users.tsx             ← Gestion comptes (admin)
│   │   ├── components/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── StudentTable.tsx
│   │   │   ├── GradesForm.tsx
│   │   │   ├── ExcelPreview.tsx      ← Aperçu des données parsées avant import
│   │   │   └── PrintButton.tsx
│   │   ├── utils/
│   │   │   └── excelParser.ts        ← Logique SheetJS : lecture + mapping colonnes arabes
│   │   └── api/                      ← Clients Axios
│   └── package.json
└── README.md
```

---

## 9. Plan d'Implémentation — 2 Semaines

### Semaine 1 — Backend & Données

#### Jour 1 (Lundi) — Setup Docker & Auth
- Configurer `docker-compose.yml` (db + backend + frontend)
- Créer le projet Django avec DRF
- Définir tous les modèles (Student, Session, Grade, PrintLog, AuditLog, User)
- Implémenter login/logout JWT (SimpleJWT)
- Permissions : IsAdmin, IsProfessor

**Livrable J1** : `docker compose up` démarre tout, login fonctionnel

#### Jour 2 (Mardi) — API Étudiants & Sessions
- CRUD sessions (Admin) : créer une session avec les noms des matières
- CRUD étudiants (recherche par nom + date + filtres)
- CRUD notes (lier un étudiant à une session + saisir les 8 notes)
- Calcul automatique : totaux, moyenne, mention
- Audit log sur chaque action

**Livrable J2** : API étudiants + sessions + notes fonctionnelle

#### Jour 3 (Mercredi) — Import Excel
- **Backend** : endpoint `POST /api/import/` — reçoit le JSON, valide (doublons, types), persiste students + grades, retourne le rapport
- **Frontend** : intégration SheetJS, mapping colonnes arabes → champs JSON, calcul des totaux manquants, écran d'aperçu avant envoi, affichage du rapport d'erreurs

**Livrable J3** : Import Excel opérationnel (parse dans le navigateur, données envoyées en JSON)

#### Jour 4 (Jeudi) — Génération PDF
- Template HTML/CSS du relevé FSJES (arabe RTL, JOIN grades+sessions)
- Intégration WeasyPrint
- Numéro de série unique (RN-FSJES-AAAA-XXXXXXXX)
- Tampon ORIGINAL / DUPLICATA

**Livrable J4** : PDF généré fidèle au format FSJES

#### Jour 5 (Vendredi) — Contrôle Impressions & Audit
- Logique blocage 1 impression / professeur
- Override admin avec motif obligatoire
- Compteur `students.print_count` incrémenté à chaque impression
- API audit log complète avec filtres

**Livrable S1** : Backend complet et fonctionnel

---

### Semaine 2 — Frontend & Finalisation

#### Jour 6 (Lundi) — Interface de Recherche
- Page Login
- Page Recherche principale (بحث)
- Tableau des résultats avec pagination et colonne statut impression

**Livrable J6** : Recherche + liste étudiants

#### Jour 7 (Mardi) — Fiche Étudiant & Notes
- Page fiche étudiant avec tableau des notes (par session)
- Les noms des matières viennent de `sessions` — affichage dynamique
- Récapitulatif (totaux + moyenne + mention)
- Prévisualisation PDF dans le navigateur

**Livrable J7** : Fiche étudiant + preview PDF

#### Jour 8 (Mercredi) — Import Excel & Gestion Sessions
- Page upload Excel avec sélection de session + rapport d'import
- Page gestion des sessions (créer/modifier les modèles de matières)
- Formulaire saisie manuelle étudiant (admin)

**Livrable J8** : Import + gestion sessions

#### Jour 9 (Jeudi) — Admin : Historique & Comptes
- Page historique des actions (audit log avec filtres)
- Page gestion des comptes : créer, modifier, activer/désactiver
- Bouton d'impression avec comportement selon rôle

**Livrable J9** : Interface admin complète

#### Jour 10 (Vendredi) — Tests & Déploiement
- Tests fonctionnels des scénarios critiques
- Correction des bugs
- Vérification RTL arabe sur tous les écrans
- Build Docker production (`docker-compose.prod.yml`)
- Documentation utilisateur (1 page A4 par rôle)

**Livrable Final** : Application livrée, dockerisée, documentée

---

### Récapitulatif Timeline

```
SEMAINE 1                          SEMAINE 2
J1: Docker + Auth                  J6: UI Recherche
J2: API Étudiants + Sessions       J7: UI Fiche + PDF Preview
J3: Import Excel                   J8: UI Import + Sessions
J4: Génération PDF FSJES           J9: UI Audit + Comptes
J5: Print Control + Audit          J10: Tests + Déploiement
```

**Charge estimée** : ~70-80 heures sur 10 jours (7-8h/jour)

---

## 10. Historique des Actions (Audit Log)

| Action | Déclencheur | Détail enregistré |
|---|---|---|
| LOGIN | Connexion | Email, IP, succès/échec |
| SEARCH | Recherche étudiant | Critères de recherche |
| VIEW | Consultation fiche | ID étudiant, nom |
| IMPORT | Upload Excel | Fichier, session, nb lignes, nb succès/erreurs |
| CREATE | Saisie manuelle | Champs créés |
| UPDATE | Modification | Champs modifiés (avant/après) |
| DELETE | Suppression | Nom + N° examen de l'étudiant supprimé |
| PRINT | Impression relevé | ID étudiant, n° impression, type, motif si duplicata |

---

## 11. Critères de Succès

### Fonctionnels
- [ ] Recherche par **nom + date de naissance** retourne les bons résultats en < 2 secondes
- [ ] Import d'un fichier Excel de 500 lignes se termine en < 30 secondes avec rapport d'erreurs
- [ ] Le PDF généré est **visuellement identique** au format FSJES officiel (arabe RTL)
- [ ] Un professeur **ne peut pas imprimer deux fois** le même relevé
- [ ] Un admin peut imprimer avec motif → tampon "نسخة مكررة" sur le PDF
- [ ] Chaque action est visible dans l'historique admin
- [ ] La correspondance **session.ecrit_subject_X ↔ grades.ecrit_score_X** est correcte sur le PDF

### Infrastructure
- [ ] `docker compose up` démarre l'application complète sans configuration manuelle
- [ ] L'environnement est identique sur toutes les machines de développement
- [ ] Les données PostgreSQL persistent entre les redémarrages (volume Docker)

### Qualité
- [ ] L'interface est en **arabe RTL** correctement alignée
- [ ] L'application fonctionne sur Chrome, Firefox, Edge (Windows)
- [ ] Aucun mot de passe stocké en clair

---

## 12. Risques & Mitigations

| Risque | Probabilité | Mitigation |
|---|:---:|---|
| Variabilité du nombre de matières (< 4 écrites ou < 4 orales) | Haute | Les colonnes subject/score sont nullable — on ignore les NULL dans le PDF et les calculs |
| Rendu RTL imparfait dans WeasyPrint | Moyenne | Tester dès J4 avec police Amiri ou Noto Naskh Arabic |
| Délai trop court | Haute | Prioriser : J1-J5 = backend complet ; J6-J8 = UI minimum viable |
| Données Excel mal formatées | Haute | Validation stricte + rapport d'erreurs ligne par ligne |
| Premier lancement Docker lent (images à télécharger) | Moyenne | Précharger les images sur les machines de dev avant de commencer |
| Performances sur grosse base d'archives | Faible | Index PostgreSQL sur `full_name`, `birth_date`, `exam_number` |

---

## Annexe — Matières par Filière (à compléter via l'interface Admin)

### فرع الحقوق — السنة الأولى — الدورة العادية
**كتابية :** القانون الدستوري، المدخل لدراسة القانون، العلاقات الدولية  
**شفهية :** المدخل لدراسة الشريعة الإسلامية، تاريخ المؤسسات و الوقائع الاجتماعية، الاقتصاد السياسي، المصطلحات القانونية

### فرع العلوم القانونية — السنة الثالثة — الدورة العادية
**كتابية :** الفقه الإسلامي، القانون التجاري، المسطرة الجنائية  
**شفهية :** القانون المدني، المسطرة المدنية، القانون الدولي الخاص، المالية العامة، الحريات العامة

> Les autres filières et années seront créées via la page **Gestion des Sessions** dans l'interface admin avant le premier import Excel.

---

*Document mis à jour le 2026-06-10 — Version 3.0. Stack : Django + Docker + PostgreSQL. Délai : 2 semaines.*
