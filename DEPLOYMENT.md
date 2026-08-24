# CollabMatrix Deployment Guide (Docker & 100% Free Cloud Hosting)

This guide provides step-by-step instructions to:
1. **Run the entire 9-container stack locally with Docker Compose.**
2. **Deploy the application online 100% FREE ($0/month)** across modern cloud providers.

---

## 1. Running Locally with Docker Compose

The project includes an enterprise-grade `docker-compose.yml` orchestrating all 9 services:

| Container | Image / Source | Internal Port | Exposed Port | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `collab-frontend` | React 18 + Vite + Nginx | 80 | **8082** | Web Application & Gateway Proxy |
| `collab-backend` | Java 17 + Spring Boot 3 | 8080 | **8080** | Core REST API & STOMP WebSockets |
| `collab-postgres` | `postgres:15-alpine` | 5432 | **5432** | Relational Database (Auth, Tasks, Workspaces) |
| `collab-mongodb` | `mongo:6.0` | 27017 | **27017** | Document Database (Chat messages, Docs) |
| `collab-redis` | `redis:7.0-alpine` | 6379 | **6379** | Cache, Rate Limiter, WebSocket Pub/Sub |
| `collab-kafka` | `confluentinc/cp-kafka:7.3.0` | 9092, 29092 | **9092** | Event Streaming & CDC Outbox |
| `collab-zookeeper`| `confluentinc/cp-zookeeper:7.3.0` | 2181 | - | Kafka Distributed Coordination |
| `collab-prometheus`| `prom/prometheus:v2.44.0` | 9090 | **9090** | System & JVM Metrics Scraping |
| `collab-grafana` | `grafana/grafana:9.5.2` | 3000 | **3000** | Real-time Observability Dashboard |

### Step 1.1: Start All Services

Run the following command in the project root:

```bash
docker compose up --build -d
```

### Step 1.2: Verify Container Health

Check status of all running containers:

```bash
docker compose ps
```

### Step 1.3: Access the Applications

- 🌐 **Frontend Web App:** [http://localhost:8082](http://localhost:8082)
- 🔌 **Backend REST API & Actuator Health:** [http://localhost:8080/api/actuator/health](http://localhost:8080/api/actuator/health)
- 📊 **Grafana Dashboard:** [http://localhost:3000](http://localhost:3000) *(User: `admin` / Password: `admin`)*
- 📈 **Prometheus Metrics:** [http://localhost:9090](http://localhost:9090)

### Step 1.4: Stop or Restart Services

```bash
# Stop all containers
docker compose down

# Stop and wipe database volumes (clean reset)
docker compose down -v
```

---

## 2. Free Online Deployment Guide ($0/Month)

You can host CollabMatrix online completely free using the **Managed Free-Tier Cloud Stack** or a **Free Cloud VM**.

```mermaid
graph TD
    Client[Users worldwide] -->|HTTPS| Vercel[Vercel / Netlify\nFrontend CDN (Free)]
    Vercel -->|REST & WSS| Render[Render.com\nBackend Docker (Free)]
    Render --> Neon[(Neon / Supabase\nPostgreSQL Free)]
    Render --> Atlas[(MongoDB Atlas\nMongo M0 Free)]
    Render --> Upstash[(Upstash\nRedis Serverless Free)]
```

---

### Step 2.1: Provision Free Managed Databases (5 minutes)

#### 1. PostgreSQL (Relational DB) — Neon.tech or Supabase
1. Go to [https://neon.tech](https://neon.tech) and sign up for a free account.
2. Create a new project named `collab-matrix`.
3. Copy your connection string. It will look like:
   `postgresql://username:password@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. Form your Spring Boot JDBC URL:
   - **`SPRING_DATASOURCE_URL`**: `jdbc:postgresql://ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - **`SPRING_DATASOURCE_USERNAME`**: `username`
   - **`SPRING_DATASOURCE_PASSWORD`**: `password`

#### 2. MongoDB (Document DB) — MongoDB Atlas
1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and register.
2. Create a **Free Shared Cluster (M0)** (512MB free forever).
3. Under **Database Access**, create a user `collab_admin` with a password.
4. Under **Network Access**, click **Add IP Address** and choose `0.0.0.0/0` (Allow access from anywhere).
5. Click **Connect -> Drivers** and copy your connection string:
   - **`SPRING_DATA_MONGODB_URI`**: `mongodb+srv://collab_admin:<password>@cluster0.xyz.mongodb.net/collab_matrix?retryWrites=true&w=majority`

#### 3. Redis (Cache & Session) — Upstash Redis
1. Go to [https://upstash.com](https://upstash.com) and register for free.
2. Click **Create Database** -> Name: `collab-redis` -> Region: Choose closest region.
3. In details, copy:
   - **`SPRING_REDIS_HOST`**: `endpoint-name.upstash.io`
   - **`SPRING_REDIS_PORT`**: `6379`
   - **`SPRING_REDIS_PASSWORD`**: `your-upstash-password`
   - **`SPRING_REDIS_SSL_ENABLED`**: `true`

---

### Step 2.2: Deploy Backend to Render.com (Free)

1. Push your repository to **GitHub**.
2. Go to [https://render.com](https://render.com) and connect your GitHub account.
3. Click **New +** -> **Web Service**.
4. Select your `Collab-Matrix` repository.
5. Configure the service:
   - **Name**: `collab-matrix-backend`
   - **Language / Environment**: `Docker`
   - **Dockerfile Path**: `./collab-core/Dockerfile`
   - **Docker Context**: `./backend`
   - **Instance Type**: `Free`
6. Under **Environment Variables**, add:
   - `PORT` = `8080`
   - `SPRING_DATASOURCE_URL` = *(Your Neon JDBC URL)*
   - `SPRING_DATASOURCE_USERNAME` = *(Your Neon User)*
   - `SPRING_DATASOURCE_PASSWORD` = *(Your Neon Password)*
   - `SPRING_DATA_MONGODB_URI` = *(Your Mongo Atlas URI)*
   - `SPRING_REDIS_HOST` = *(Your Upstash Host)*
   - `SPRING_REDIS_PORT` = `6379`
   - `SPRING_REDIS_PASSWORD` = *(Your Upstash Password)*
   - `SPRING_REDIS_SSL_ENABLED` = `true`
   - `JAVA_OPTS` = `-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Xss512k`
7. Click **Deploy Web Service**.
8. Once deployed, Render will provide a public URL, e.g.: `https://collab-matrix-backend.onrender.com`.

---

### Step 2.3: Deploy Frontend to Vercel (Free)

1. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** -> **Project**.
3. Import your `Collab-Matrix` repository.
4. Set **Root Directory** to `frontend`.
5. Under **Environment Variables**, configure:
   - `VITE_API_URL` = `https://collab-matrix-backend.onrender.com/api`
   - `VITE_WS_URL` = `https://collab-matrix-backend.onrender.com/api/ws`
6. Click **Deploy**.
7. Vercel will build and assign an instant production URL (e.g. `https://collab-matrix.vercel.app`) with free global SSL!

---

### Step 2.4: Alternative: Oracle Cloud Always-Free Compute (Deploy ALL 9 Containers on 1 Free VM)

If you want to run the full Docker Compose stack (including Kafka, Zookeeper, Prometheus, and Grafana) on a single dedicated cloud machine for free:

1. Sign up for [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/).
2. Create an **Ampere A1 Compute Instance** (ARM64, 4 OCPUs, 24GB RAM, 200GB Storage — 100% Free Forever).
3. SSH into the instance and install Docker & Docker Compose:
   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io docker-compose-v2 git
   sudo usermod -aG docker $USER
   ```
4. Clone and run your repository:
   ```bash
   git clone https://github.com/Arbaz4Sayyad/Collab-Matrix.git
   cd Collab-Matrix
   docker compose up --build -d
   ```
5. Open ingress ports `80`, `443`, `8082`, `3000` in Oracle Cloud Security Lists.
6. The entire 9-container production stack is live on your public IP!

---

## 3. Summary of Environment Variables

| Variable | Local Docker Default | Production Cloud Example |
| :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://postgres:5432/collab_matrix` | `jdbc:postgresql://ep-xyz.neon.tech/collab_matrix?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | `collab_admin` | `your_neon_username` |
| `SPRING_DATASOURCE_PASSWORD` | `CollabSecurePassword2026!` | `your_neon_password` |
| `SPRING_DATA_MONGODB_URI` | `mongodb://collab_admin:CollabMongoPassword2026!@mongodb:27017/collab_matrix?authSource=admin` | `mongodb+srv://user:pass@cluster.mongodb.net/collab_matrix?retryWrites=true` |
| `SPRING_REDIS_HOST` | `redis` | `endpoint.upstash.io` |
| `SPRING_REDIS_PORT` | `6379` | `6379` |
| `SPRING_REDIS_PASSWORD` | `CollabRedisPassword2026!` | `your_upstash_password` |
| `SPRING_REDIS_SSL_ENABLED` | `false` | `true` |
| `PORT` | `8080` | Assigned by cloud provider (e.g., Render/Koyeb) |
| `VITE_API_URL` | `/api` | `https://your-backend.onrender.com/api` |
| `VITE_WS_URL` | `/ws` | `https://your-backend.onrender.com/api/ws` |
