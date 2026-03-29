# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Netwrk is a cross-platform contact management app with semantic search, geospatial queries, and smart sorting. It's a monorepo with a React Native Expo frontend and a Python Flask backend.

## Commands

### Frontend (`/frontend`)
```bash
cd frontend
yarn start          # Start Expo dev server
yarn ios            # Run on iOS simulator
yarn android        # Run on Android emulator
yarn test           # Run Jest tests (watch mode)
yarn test --watchAll=false  # Run tests once
```

### Backend (`/backend`)
```bash
cd backend
pip install -r requirements.txt   # Install dependencies
flask run                          # Run dev server
docker-compose up                  # Run via Docker (preferred for local dev)
```

The backend deploys to AWS Elastic Beanstalk. Production URL is `https://mynetwrk.com`.

## Architecture

### Frontend (`/frontend`)
- **Routing:** Expo Router with file-based routing under `app/`. Tab navigation lives in `app/(tabs)/`.
- **Server state:** TanStack Query with query keys defined in `constants/QueryKeys.ts`. All API calls go through custom hooks wrapping `useQuery`/`useMutation`.
- **UI:** Tamagui components for cross-platform UI; Nativewind/Tailwind for utility classes.
- **API layer:** All backend URLs are defined in `constants/Apis.ts`. Requests use Axios with the user's auth token passed per-request.
- **Auth:** Token stored in Expo SecureStore, passed in request headers to authenticate the user.

### Backend (`/backend`)
- **Entry point:** Flask app with blueprints for `auth`, `contacts`, `users`, and `utils` routes.
- **Database access:** All query logic lives in `app/db/accessor.py` — this is the core of the backend. Routes call accessor functions; they don't write SQL directly.
- **Models:** SQLAlchemy ORM models in `app/models/`. `Contact` model includes a `pgvector` embedding column for semantic search.
- **Semantic search:** When contacts are created/updated, OpenAI generates an embedding stored in the `Contact` model. Search queries are also embedded and compared via cosine similarity using `pgvector`.
- **Geospatial:** `GeoAlchemy2` + PostGIS for distance-based sorting. Contact locations are stored as geography points.
- **Images:** AWS S3 with presigned URLs — the backend generates upload/download URLs; images are never proxied through the server.
- **Config:** Environment variables loaded via `python-dotenv`. Key vars: `DATABASE_URL`, `OPENAI_API_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`.

### Key Data Flow
1. Frontend authenticates → receives a user token stored in SecureStore
2. All subsequent requests include the token; backend validates it against the `User` table
3. Contact search: query → OpenAI embedding → pgvector cosine similarity → optional PostGIS distance filter → sorted results
4. Images: frontend requests presigned S3 URL from backend → uploads directly to S3

### Sort Options (defined in `accessor.py`)
`DATE_ADDED`, `LAST_CONTACT_NEWEST`, `LAST_CONTACT_OLDEST`, `ALPHABETICAL`, `DISTANCE`, `RELEVANCE`, `NEXT_CONTACT_DATE`

For `RELEVANCE` sort, all results come from semantic search. For other sorts, semantic search pre-filters to top 25 candidates (`SEMANTIC_SEARCH_TOP_N`), then the chosen sort is applied.
