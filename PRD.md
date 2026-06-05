# PRD — Application de Gestion des Relevés de Notes (بيان النقط)
**Établissement :** FSJES Ain Chock — Université Hassan II de Casablanca  
**Version :** 2.0  
**Date :** 2026-06-02  
**Délai de livraison :** 2 semaines  
**Plateforme :** Web uniquement

---

## Table des Matières

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Contexte & Objectif Principal](#2-contexte--objectif-principal)
3. [Rôles et Permissions](#3-rôles-et-permissions)
4. [Fonctionnalités Requises](#4-fonctionnalités-requises)
5. [Structure des Données (basée sur les vrais relevés FSJES)](#5-structure-des-données)
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
2. **Rechercher** un étudiant par nom, prénom, date de naissance
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
| Importer des données Excel | ✅ | ✅ |
| Saisir manuellement un étudiant/notes | ❌ | ✅ |
| Modifier un étudiant / ses notes | ❌ | ✅ |
| Supprimer un étudiant | ❌ | ✅ |
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
- Upload d'un fichier `.xlsx` / `.xls`
- Détection automatique de la filière et de l'année à partir du nom de fichier ou d'un champ de saisie
- Validation avant import : colonnes manquantes, doublons (même N° examen)
- Rapport d'import : X succès / Y erreurs avec détail des lignes en erreur
- Les données importées s'ajoutent sans écraser l'existant (sauf doublon explicite)

### F4 — Saisie Manuelle (Admin uniquement)
- Formulaire fiche étudiant complet
- Ajout/modification des notes matière par matière
- Calcul automatique : مجموع الكتابي، مجموع الشفوي، المجموع العام، المعدل، الميزة

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

---

## 5. Structure des Données

Basée sur l'analyse des vrais relevés FSJES Ain Chock fournis.

### 5.1 Table `students` — Informations de l'étudiant

| Colonne | Type | Arabe | Exemple |
|---|---|---|---|
| id | UUID | — | 550e8400-e29b-41d4-a716-446655440000 |
| full_name | VARCHAR(255) | الاسم و النسب | أحمد بنعلي |
| exam_number | VARCHAR(50) | رقم الامتحان / رقم التسجيل | 3847 |
| birth_date | DATE | المزداد بتاريخ | 1995-07-22 |
| birth_place | VARCHAR(150) | مكان الميلاد | فاس |
| academic_year | VARCHAR(20) | السنة الجامعية | 2022/2023 |
| study_year | INTEGER | السنة الدراسية | 1 |
| branch | VARCHAR(150) | الفرع | فرع الحقوق / فرع العلوم القانونية |
| session | VARCHAR(50) | الدورة | عادية / أكتوبر / استدراكية |
| print_count | INTEGER | عدد النسخ المطبوعة | 0 |
| created_at | TIMESTAMP | — | 2026-01-15T09:30:00Z |

### 5.2 Table `subjects` — Matières

| Colonne | Type | Arabe | Exemple |
|---|---|---|---|
| id | UUID | — | — |
| name | VARCHAR(200) | اسم المادة | القانون الدستوري |
| type | ENUM | النوع | كتابي / شفوي |
| branch | VARCHAR(150) | الفرع | فرع الحقوق |
| study_year | INTEGER | السنة | 1 |
| order_index | INTEGER | الترتيب | 1 |

**Exemple de matières — Année 1, Fرع الحقوق :**

*Matières Kittabiya (كتابية — écrites) :*
- القانون الدستوري
- المدخل لدراسة القانون
- العلاقات الدولية

*Matières Chafawiya (شفهية — orales) :*
- المدخل لدراسة الشريعة الإسلامية
- تاريخ المؤسسات و الوقائع الاجتماعية
- الاقتصاد السياسي
- المصطلحات القانونية

**Exemple — Année 3, فرع العلوم القانونية :**

*Kittabiya (كتابية) :*
- الفقه الإسلامي
- القانون التجاري
- المسطرة الجنائية

*Chafawiya (شفهية) :*
- القانون المدني
- المسطرة المدنية
- القانون الدولي الخاص
- المالية العامة
- الحريات العامة

### 5.3 Table `grades` — Notes

| Colonne | Type | Arabe | Exemple |
|---|---|---|---|
| id | UUID | — | — |
| student_id | UUID FK | — | — |
| subject_id | UUID FK | — | — |
| note | DECIMAL(5,2) | النقطة | 13.00 |
| written_result | VARCHAR(20) | نتيجة الكتابي | ناجح / راسب |

### 5.4 Table `transcript_summary` — Récapitulatif

| Colonne | Type | Arabe | Exemple |
|---|---|---|---|
| id | UUID | — | — |
| student_id | UUID FK | — | — |
| total_written | DECIMAL(6,2) | مجموع الكتابي | 35 |
| total_oral | DECIMAL(6,2) | مجموع الشفوي | 46 |
| total_general | DECIMAL(6,2) | المجموع العام | 81 |
| average | DECIMAL(4,2) | المعدل | 11 |
| general_result | VARCHAR(20) | النتيجة العامة | ناجح / راسب |
| mention | VARCHAR(50) | الميزة | مقبول / جيد / جيد جدا / ممتاز |
| copy_general | VARCHAR(50) | النسخة العامة | — |
| notes_observations | TEXT | الملاحظات | — |

### 5.5 Table `print_logs` — Historique Impressions

| Colonne | Type | Description |
|---|---|---|
| id | UUID | — |
| student_id | UUID FK | Étudiant concerné |
| printed_by | UUID FK | Utilisateur qui a imprimé |
| printed_at | TIMESTAMP | Date et heure |
| print_number | INTEGER | 1 = original, 2+ = duplicata |
| is_admin_override | BOOLEAN | Réimpression forcée par admin |
| override_reason | TEXT | Motif (obligatoire si override) |

### 5.6 Table `audit_logs` — Historique de Toutes les Actions

| Colonne | Type | Description |
|---|---|---|
| id | UUID | — |
| user_id | UUID FK | Utilisateur |
| action | VARCHAR(50) | LOGIN / SEARCH / IMPORT / CREATE / UPDATE / DELETE / PRINT / VIEW |
| entity | VARCHAR(50) | student / transcript / user |
| entity_id | UUID | ID de l'entité concernée |
| detail | TEXT | Détail (ex: "Importé 45 étudiants depuis fichier X") |
| ip_address | VARCHAR(45) | IP de l'utilisateur |
| created_at | TIMESTAMP | Date et heure |

### 5.7 Table `users` — Utilisateurs

| Colonne | Type | Description |
|---|---|---|
| id | UUID | — |
| email | VARCHAR(255) | Identifiant unique |
| password_hash | VARCHAR | Hash bcrypt |
| full_name | VARCHAR(255) | Nom complet |
| role | ENUM(admin, professor) | Rôle |
| is_active | BOOLEAN | Compte actif |
| created_at | TIMESTAMP | — |

---

## 6. Format Excel d'Import

### Structure des colonnes (basée sur les vrais fichiers FSJES)

Le fichier Excel a une ligne d'en-tête en arabe. L'application reconnaît automatiquement les colonnes suivantes :

| Colonne Excel | Colonne DB | Obligatoire |
|---|---|:---:|
| اسم المرشح | full_name | ✅ |
| تاريخ الميلاد | birth_date | ✅ |
| مكان الميلاد | birth_place | ❌ |
| رقم الامتحان | exam_number | ✅ |
| [Colonnes matières kittabiya dynamiques] | grades (type=كتابي) | ✅ |
| نتيجة الكتابي | written_result | ❌ |
| مجموع الكتابي | total_written | ❌ |
| [Colonnes matières shafawiya dynamiques] | grades (type=شفوي) | ✅ |
| مجموع الشفاهي | total_oral | ❌ |
| المجموع العام | total_general | ❌ |
| المعدل | average | ❌ |
| النسخة العامة | copy_general | ❌ |
| الميزة او الملاحظات | mention + observations | ❌ |

> Les colonnes marquées ❌ sont recalculées automatiquement si absentes.

### Règles d'import
- Si `مجموع الكتابي` est absent → calculé automatiquement = somme des notes kittabiya
- Si `المعدل` est absent → calculé = المجموع العام / nombre de matières
- Si `الميزة` est absent → déduite du معدل : ≥16 ممتاز, ≥14 جيد جدا, ≥12 جيد, ≥10 مقبول, <10 راسب
- Doublon = même `رقم الامتحان` dans la même `السنة الجامعية` → ignoré avec avertissement

---

## 7. Modèle du Relevé PDF

Le PDF généré reproduit fidèlement le format officiel FSJES Ain Chock.

### En-tête
```
[Logo FSJES Ain Chock]
FACULTÉ DES SCIENCES JURIDIQUES, ÉCONOMIQUES ET SOCIALES AIN CHOCK
UNIVERSITÉ HASSAN II DE CASABLANCA

بيان النقط لمواد السنة [X] من [الفرع]
```

### Informations Étudiant (bloc droite)
```
الاسم و النسب:  [full_name]
رقم الامتحان:   [exam_number]
المزداد بتاريخ: [birth_date]
السنة الجامعية: [academic_year]
الدورة:         [session]
```

### Tableau des Matières Kittabiya (مواد كتابية)
| المواد الكتابية | النقطة | نتيجة الكتابي |
|---|---|---|
| [nom matière 1] | [note] | ناجح/راسب |
| [nom matière 2] | [note] | ناجح/راسب |

### Tableau des Matières Chafawiya (مواد شفهية)
| المواد الشفهية | النقطة النهائية |
|---|---|
| [nom matière 1] | [note] |
| [nom matière 2] | [note] |

### Récapitulatif
| — | — |
|---|---|
| مجموع الكتابي | [valeur] |
| مجموع الشفوي | [valeur] |
| المجموع العام | [valeur] |
| المعدل | [valeur] |
| النتيجة العامة | ناجح / راسب |
| الميزة | مقبول / جيد / جيد جدا / ممتاز |

### Pied de Page
```
الدارالبيضاء، في [date impression]

                    [Tampon: نسخة أصلية  OU  نسخة مكررة رقم X]
                    [N° Série: RN-FSJES-AAAA-XXXXXXXX]
```

---

## 8. Architecture Technique

### Stack (optimisé pour 2 semaines)

| Couche | Technologie | Justification |
|---|---|---|
| Backend API | **Python + FastAPI** | Rapide à développer, pandas natif pour Excel |
| Frontend | **React + TypeScript + Vite** | Composants rapides, bonne lib RTL |
| UI Components | **Ant Design** | Supporte RTL nativement, tables et formulaires pro |
| Base de données | **PostgreSQL** | Robuste, concurrent, adapté à un usage multi-utilisateurs |
| ORM | **SQLAlchemy + Alembic** | Standard Python, migrations versionnées |
| Excel Import | **pandas + openpyxl** | Robuste, lit tous formats Excel |
| PDF Génération | **WeasyPrint** | PDF depuis HTML/CSS → template arabe/RTL facile |
| Auth | **JWT (python-jose) + bcrypt** | Standard, stateless |
| Déploiement | **Uvicorn + nginx** ou serveur local | Simple, rapide à mettre en place |

### Structure du Projet
```
gestion-releves/
├── backend/
│   ├── main.py                  # FastAPI app
│   ├── database.py              # SQLAlchemy + PostgreSQL
│   ├── models.py                # Tous les modèles DB
│   ├── schemas.py               # Schémas Pydantic
│   ├── routers/
│   │   ├── auth.py              # Login / logout
│   │   ├── students.py          # CRUD étudiants + search
│   │   ├── grades.py            # Notes
│   │   ├── import_excel.py      # Upload & parse Excel
│   │   ├── transcripts.py       # Génération PDF + print control
│   │   └── audit.py             # Historique actions
│   ├── services/
│   │   ├── excel_parser.py      # Logique parsing Excel FSJES
│   │   ├── pdf_generator.py     # WeasyPrint → PDF relevé
│   │   └── print_control.py     # Logique 1 impression / prof
│   └── templates/
│       └── releve_fsjes.html    # Template HTML du relevé (arabe RTL)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Search.tsx       # Page principale: recherche étudiants
│   │   │   ├── StudentDetail.tsx # Fiche + bouton impression
│   │   │   ├── Import.tsx       # Upload Excel
│   │   │   ├── AuditLog.tsx     # Historique (admin)
│   │   │   └── Users.tsx        # Gestion utilisateurs (admin)
│   │   ├── components/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── StudentTable.tsx
│   │   │   ├── GradesForm.tsx
│   │   │   └── PrintButton.tsx
│   │   └── api/                 # Clients Axios
│   └── package.json
└── requirements.txt
```

---

## 9. Plan d'Implémentation — 2 Semaines

### Semaine 1 — Backend & Données

#### Jour 1 (Lundi) — Setup & Auth
- Initialiser le projet FastAPI + React
- Créer la base PostgreSQL avec tous les modèles
- Implémenter login/logout JWT
- Middleware de vérification des rôles

**Livrable J1** : App démarre, login fonctionnel

#### Jour 2 (Mardi) — Modèle de Données Étudiants
- CRUD complet étudiants (API)
- CRUD notes + résumé transcript
- Endpoint recherche (nom + date naissance + filtres)
- Audit log sur chaque action

**Livrable J2** : API étudiants + recherche fonctionnelle

#### Jour 3 (Mercredi) — Import Excel
- Parseur Excel pour format FSJES (colonnes arabes)
- Gestion des colonnes dynamiques (matières variables selon filière)
- Validation + rapport d'erreurs
- Import des données en base

**Livrable J3** : Import Excel opérationnel

#### Jour 4 (Jeudi) — Génération PDF
- Template HTML/CSS du relevé FSJES (arabe RTL)
- Intégration WeasyPrint
- Numéro de série unique
- Logique tampon ORIGINAL / DUPLICATA

**Livrable J4** : PDF généré fidèle au format FSJES

#### Jour 5 (Vendredi) — Contrôle Impressions & Audit
- Logique blocage 1 impression / professeur
- Override admin avec motif
- Compteur d'impressions
- API audit log complète (toutes les actions)

**Livrable S1** : Backend complet et fonctionnel

---

### Semaine 2 — Frontend & Finalisation

#### Jour 6 (Lundi) — Interface de Recherche
- Page Login
- Page Recherche principale (بحث)
- Tableau des résultats avec pagination
- Colonne statut impression (couleur)

**Livrable J6** : Recherche + liste étudiants

#### Jour 7 (Mardi) — Fiche Étudiant & Notes
- Page fiche étudiant complète
- Affichage des notes en tableau (kittabiya / chafawiya)
- Récapitulatif (مجموع + معدل + ميزة)
- Prévisualisation PDF dans le navigateur

**Livrable J7** : Fiche étudiant + preview PDF

#### Jour 8 (Mercredi) — Import Excel & Admin
- Page upload Excel avec rapport d'import
- Formulaire saisie manuelle (admin)
- Formulaire modification étudiant (admin)
- Confirmation suppression (admin)

**Livrable J8** : Import + CRUD admin

#### Jour 9 (Jeudi) — Historique & Gestion Utilisateurs
- Page historique des actions (admin)
- Filtres : par utilisateur / type d'action / date
- Page gestion des comptes (créer/désactiver)
- Bouton d'impression avec comportement selon rôle

**Livrable J9** : Interface admin complète

#### Jour 10 (Vendredi) — Tests, Polish & Déploiement
- Tests fonctionnels des scénarios critiques
- Correction des bugs
- Vérification RTL arabe sur tous les écrans
- Déploiement sur serveur / poste local
- Documentation utilisateur (1 page A4 par rôle)

**Livrable Final** : Application livrée, déployée, documentée

---

### Récapitulatif Timeline

```
SEMAINE 1                          SEMAINE 2
J1: Setup + Auth                   J6: UI Recherche
J2: API Étudiants + Recherche      J7: UI Fiche + PDF Preview
J3: Import Excel                   J8: UI Import + Admin CRUD
J4: Génération PDF FSJES           J9: UI Audit + Utilisateurs
J5: Print Control + Audit          J10: Tests + Déploiement
```

**Charge estimée** : ~70-80 heures sur 10 jours (7-8h/jour)

---

## 10. Historique des Actions (Audit Log)

Chaque action importante génère automatiquement une entrée dans `audit_logs`.

| Action | Déclencheur | Détail enregistré |
|---|---|---|
| LOGIN | Connexion | Email, IP, succès/échec |
| SEARCH | Recherche étudiant | Critères de recherche |
| VIEW | Consultation fiche | ID étudiant, nom |
| IMPORT | Upload Excel | Fichier, nb lignes, nb succès/erreurs |
| CREATE | Saisie manuelle | Champs créés |
| UPDATE | Modification | Champs modifiés (avant/après) |
| DELETE | Suppression | Nom + N° examen de l'étudiant supprimé |
| PRINT | Impression relevé | ID étudiant, n° impression, type (original/duplicata), motif si duplicata |

---

## 11. Critères de Succès

### Fonctionnels
- [ ] Recherche par **nom + date de naissance** retourne les bons résultats en < 2 secondes
- [ ] Import d'un fichier Excel de 500 lignes se termine en < 30 secondes avec rapport d'erreurs
- [ ] Le PDF généré est **visuellement identique** au format FSJES officiel (arabe RTL)
- [ ] Un professeur **ne peut pas imprimer deux fois** le même relevé
- [ ] Un admin peut imprimer avec motif → tampon "نسخة مكررة" sur le PDF
- [ ] Chaque action (import, impression, suppression) est visible dans l'historique admin

### Qualité
- [ ] L'interface est en **arabe RTL** correctement alignée
- [ ] L'application fonctionne sur Chrome, Firefox, Edge (Windows)
- [ ] Aucun mot de passe stocké en clair

---

## 12. Risques & Mitigations

| Risque | Probabilité | Mitigation |
|---|:---:|---|
| Variabilité des colonnes Excel selon la filière | Haute | Parseur flexible : détecte les colonnes par nom en arabe, ignore les inconnues |
| Rendu RTL imparfait dans WeasyPrint | Moyenne | Tester tôt J4 avec une vraie feuille de style arabe + police Amiri ou Noto Naskh Arabic |
| Délai trop court pour tout finir | Haute | Prioriser : J1-J5 = backend complet ; J6-J8 = UI minimum viable ; J9-J10 = polish |
| Données Excel manquantes ou mal formatées | Haute | Validation stricte à l'import + rapport d'erreurs ligne par ligne |
| Performances sur grosse base d'archives | Faible | Index PostgreSQL sur full_name + birth_date + exam_number |

---

## Annexe — Matières par Filière (à compléter)

### فرع الحقوق — السنة الأولى
**كتابية :** القانون الدستوري، المدخل لدراسة القانون، العلاقات الدولية  
**شفهية :** المدخل لدراسة الشريعة الإسلامية، تاريخ المؤسسات و الوقائع الاجتماعية، الاقتصاد السياسي، المصطلحات القانونية

### فرع العلوم القانونية — السنة الثالثة
**كتابية :** الفقه الإسلامي، القانون التجاري، المسطرة الجنائية  
**شفهية :** القانون المدني، المسطرة المدنية، القانون الدولي الخاص، المالية العامة، الحريات العامة

> Les autres filières et années seront ajoutées lors de l'import Excel initial.

---

*Document mis à jour le 2026-06-02. Délai de livraison : 2 semaines.*
