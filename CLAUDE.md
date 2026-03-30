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

### Deploying the backend to AWS
The backend runs on AWS Lambda + API Gateway (SAM). Production URL is `https://mynetwrk.com`.

```bash
cd backend

# 1. Build and push the Lambda container image
aws ecr get-login-password --region us-east-2 \
  | docker login --username AWS --password-stdin \
    711387105820.dkr.ecr.us-east-2.amazonaws.com

docker build -f Dockerfile.lambda --platform linux/amd64 --provenance=false \
  -t 711387105820.dkr.ecr.us-east-2.amazonaws.com/netwrk-backend:latest .

docker push 711387105820.dkr.ecr.us-east-2.amazonaws.com/netwrk-backend:latest

# 2. Update the Lambda function
aws lambda update-function-code \
  --function-name netwrk-backend \
  --image-uri 711387105820.dkr.ecr.us-east-2.amazonaws.com/netwrk-backend:latest \
  --region us-east-2

# 3. If infrastructure changed (template.yaml), also run:
sam deploy --region us-east-2 --capabilities CAPABILITY_IAM \
  --image-repository 711387105820.dkr.ecr.us-east-2.amazonaws.com/netwrk-backend
```

Use the `netwrk-deployer` IAM user credentials (`--profile netwrk-deployer`) for all AWS operations.

## Architecture

### Frontend (`/frontend`)
- **Routing:** Expo Router with file-based routing under `app/`. Tab navigation lives in `app/(tabs)/`.
- **Server state:** TanStack Query with query keys defined in `constants/QueryKeys.ts`. All API calls go through custom hooks wrapping `useQuery`/`useMutation`.
- **UI:** Tamagui components for cross-platform UI; Nativewind/Tailwind for utility classes.
- **API layer:** All backend URLs are defined in `constants/Apis.ts`. Requests use Axios with the user's auth token passed per-request.
- **Auth:** Token stored in Expo SecureStore, passed in request headers to authenticate the user.

### Backend (`/backend`)
- **Entry point:** `application.py` creates the Flask app via `create_app()`. `lambda_handler.py` wraps it with `apig_wsgi` for Lambda.
- **Database access:** All query logic lives in `app/db/accessor.py` — this is the core of the backend. Routes call accessor functions; they don't write SQL directly.
- **Models:** SQLAlchemy ORM models in `app/models/`. `Contact` model includes a `pgvector` embedding column for semantic search.
- **Semantic search:** When contacts are created/updated, OpenAI generates an embedding stored in the `Contact` model. Search queries are also embedded and compared via cosine similarity using `pgvector`.
- **Geospatial:** `GeoAlchemy2` + PostGIS for distance-based sorting. Contact locations are stored as geography points.
- **Images:** AWS S3 with presigned URLs — the backend generates upload/download URLs; images are never proxied through the server. S3 credentials come from the Lambda execution role (no hardcoded AWS keys needed).
- **Config:** Environment variables loaded via `python-dotenv`. Key vars: `DATABASE_URL`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `S3_BUCKET_NAME`. Secrets are stored in AWS Secrets Manager and resolved by CloudFormation at deploy time.
- **Database:** Hosted on Neon (external, not in AWS VPC). Use the **pooled** connection string (pgbouncer endpoint) for `DATABASE_URL`.

### Lambda deployment (`/backend`)
- **`Dockerfile.lambda`** — Lambda-specific container image. Multi-stage build: stage 1 installs deps using `--platform manylinux2014_x86_64 --only-binary=:all:` to get Lambda-compatible wheels; stage 2 copies into the AWS Lambda Python 3.11 base image.
- **`lambda_handler.py`** — Wraps the Flask WSGI app with `apig_wsgi` to handle API Gateway HTTP API (v2) events.
- **`template.yaml`** — AWS SAM template defining the Lambda function, API Gateway HTTP API, custom domain (`mynetwrk.com`), Route53 record, and IAM policies.
- **`samconfig.toml`** — SAM deployment config (stack name, region, parameter values). Safe to commit — no secrets stored here.
- **Scale-to-zero:** Lambda scales to zero when idle. Cold starts take ~10s (large container image). Warm requests are fast.
- **Timeouts:** Lambda timeout is 29s to match API Gateway HTTP API's hard 30s limit.

### Key Data Flow
1. Frontend authenticates → receives a user token stored in SecureStore
2. All subsequent requests include the token; backend validates it against the `User` table
3. Contact search: query → OpenAI embedding → pgvector cosine similarity → optional PostGIS distance filter → sorted results
4. Images: frontend requests presigned S3 URL from backend → uploads directly to S3

### Sort Options (defined in `accessor.py`)
`DATE_ADDED`, `LAST_CONTACT_NEWEST`, `LAST_CONTACT_OLDEST`, `ALPHABETICAL`, `DISTANCE`, `RELEVANCE`, `NEXT_CONTACT_DATE`

For `RELEVANCE` sort, all results come from semantic search. For other sorts, semantic search pre-filters to top 25 candidates (`SEMANTIC_SEARCH_TOP_N`), then the chosen sort is applied.

### AWS Resources
- **Lambda function:** `netwrk-backend` (us-east-2)
- **ECR repository:** `711387105820.dkr.ecr.us-east-2.amazonaws.com/netwrk-backend`
- **CloudFormation stack:** `netwrk-backend`
- **S3 bucket:** `netwrkbucket`
- **Secrets Manager:** `database-url`, `openai-api-key` (key: `api-key`), `google-api-key-1` (key: `api-key`)
- **IAM deploy user:** `netwrk-deployer`
