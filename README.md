# 🧠 TixBee Backend

Backend for the TixBee platform—a fully microservices system written in **Node.js + TypeScript**. It handles everything from authentication and ticketing to queue management and payments, all communicating through a event-driven architecture.

> For frontned repository [Click here](https://github.com/khaftab/code-sprint-frontend){:target="\_blank"} or check out the [live preview here](https://tixbee.khaftab.me){:target="\_blank"}

## ⚙️ Key Features

- 🧾 **Independent Microservices**  
  Each domain (auth, tickets, payments, etc.) runs as its own service, and each service manages its own database—no service directly updates another service’s data.

- 📦 **Shared Logic as NPM Package**  
  Common patterns—such as auth middleware, NATS event types, and utility functions—are moved into a `common` directory and published as an NPM package. Each service uses this package to ensure consistency and reduce code duplication.

- 📡 **NATS JetStream**  
  Services communicate asynchronously using NATS JetStream. Events are stored durably, enabling reliable delivery even if a service goes down temporarily. With replay support, new services or late consumers can process past events.

- 🔐 **JWT-Based Auth**  
  Stateless auth across services; each service independently verifies incoming JWTs.

- ⏳ **Smart Queue & Locking**  
  Fair, first-come-first-serve queue for high-demand ticket purchases, with timeout logic.

- 🔄 **Optimistic Concurrency Control (OCC)**  
  Ensures data stays correct using MongoDB’s versioning. Each update increases the version number. When handling updates (like from NATS), the service looks for the document using its ID and the previous version. This makes sure updates happen in the right order in case of too many update events.

- 🛡️ **Robust Operation Validation**  
  Every critical action—like purchasing a ticket—performs strict checks to ensure the ticket isn't already sold or locked by another user in the payment process. This prevents double-selling even under heavy load.

- 📜 **Remote Logging with Logtail**  
  Integrated with the Logtail platform, logs are formatted with winston and chalk (for coloring) from all services. This includes error tracking and key events such as successful payments (with payment IDs), user signups, and more—enabling robust monitoring and troubleshooting.

- 🧪 **Comprehensive Unit Testing**  
  All services include unit tests using Jest, Supertest, and an in-memory database (if needed), covering every implementation detail. For NATS event handling, mock functions are used to simulate event-driven behavior.

- 🚀 **CI/CD pipeline with GitHub Actions**
  - **First-Time Deployment:**  
    A dedicated, manually-triggered workflow builds and pushes all service images to Docker Hub, installs dependencies on the `GKE Standard cluster` (authenticating with GitHub environment secrets), creates Kubernetes secrets from GitHub secrets, adds the ingress controller, and applies all `kubectl` config files.
  - **SSL Configuration:**  
    Another manual workflow installs Cert Manager, applies the ClusterIssuer, and updates the ingress config with your domain (after you point your domain to the Load Balancer’s external IP).
  - **Multi-Cloud Support:**  
    Includes workflows for AKS (Azure Kubernetes Service) and GKE Autopilot clusters, covering both initial setup and SSL (SSL workflow is specific for Autopilot; GKE Standard and AKS share the same SSL config).
  - **Service Updates:**  
    Each service has its own workflow that detects changes in its folder. On merging to `main`, it tests, builds and pushes the updated image, logs into the cluster, and restarts the deployment.
  - **Manifest Changes:**  
    A manifest workflow triggers when any Kubernetes config file is updated, ensuring cluster state stays in sync.

---

## 🧱 Architecture

![TixBee Microservices Architecture](https://res.cloudinary.com/dinoawbez/image/upload/w_1280/tixbee-diagram-1.png)

---

## 🔩 Services Breakdown

### 🔐 Auth Service

- JWT token generation + validation
- Stores users in MongoDB
- Used for signup/login – other services handle auth check internally

### 🎫 Tickets Service

- Create, update, delete, and fetch tickets
- Validates ownership before updates
- Emits `TicketCreated`, `TicketUpdated`, and `TicketDeleted` events

### 📋 Orders Service

- Places orders
- Listens to `TicketCreated`, `TicketUpdated`, `TicketDeleted`, `PaymentCreated`, and `ExpirationComplete` events
- Stores orders and tickets in MongoDB
- Emits `OrderCreated`, `OrderCancelled` and `AddUserToQueue` events

### 💳 Payments Service

- Integrates with Stripe `PaymentIntents` API to create and manage the payment flow
- Returns an early response to the client when additional authentication (like 3D Secure) is required
- Listens for Stripe webhook events (like payment_intent.succeeded) to confirm and record successful transactions
- Listens to `OrderCreated` and `OrderCancelled` events
- Emits `PaymentCreated` event

### ⏳ Expiration Service

- Listens to `OrderCreated` event
- Adds a job to BullMQ (Redis) with a 3-minute delay for each order
- After the delay, it emits `ExpirationComplete` event
- On receiving this event, the `Orders` Service cancels the order if it hasn't been paid yet

### ⌛ Queue Service

- Creates a WebSocket server (using `socket.io`) for real-time queue updates to clients
- Shares estimated wait times and queue position
- Listens to `AddUserToQueue`, `OrderCancelled`, `OrderCreated`, and `TicketUnavailable` events
- Uses a NATS bucket to store queue data
- Provides `addToQueue`, `removeFromQueue`, `getQueueStatus`, and other methods for queue management
- Flow:
  - The `Orders` service emits `AddUserToQueue` event
  - Checks if the user is already in the queue
  - If not, adds them to the queue and sends the current queue status to the client
  - Sends updates to the client when the queue changes (e.g., when its user turn or a ticket becomes unavailable)

---

## 🧪 Local Setup

### ✅ Prerequisites

Before running TixBee backend locally, make sure you have:

- 🐳 **Docker + Kubernetes** – To run containers and orchestrate services
- 💳 **Stripe Test Account** – For testing the payment flows
- ⚙️ **Stripe CLI** – To handle webhooks during development
- 💻 **Recommended: 16GB+ RAM** – Running all microservices and databases locally is resource-intensive. For smooth development (especially alongside tools like VS Code), at least 16GB RAM is advised.

---

### 🚀 Run Locally

```bash
git clone https://github.com/khaftab/tixbee-backend.git
cd tixbee-backend
```

Install dependencies for each microservice (e.g., `auth`, `tickets`, etc.):

```bash
cd auth
npm install
```

Create necessary secrets in your Kubernetes cluster:

```bash
kubectl create secret generic jwt-secret --from-literal=JWT_SECRET=your_jwt_secret
kubectl create secret generic origin-url --from-literal=ORIGIN_URL='["http://localhost:5173","https://tixbee.khaftab.me"]'
# 1. Get your Stripe secret key from the Stripe dashboard (developers).
# 2. To obtain the webhook secret, run the following command in your terminal:
#    stripe listen --forward-to https://localhost/api/payments/webhook --skip-verify
#    (This will display a webhook signing secret in the output.)
# 3. Copy the webhook secret from the Stripe CLI output and replace 'your_webhook_secret' below.
kubectl create secret generic stripe-secret \
  --from-literal=STRIPE_KEY=your_stripe_key \
  --from-literal=STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

Install Ingress-NGINX controller:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.1/deploy/static/provider/cloud/deploy.yaml
```

Now start all services:

```bash
skaffold dev
```

It will:

- Build Docker images for your services.
- Deploy them to your Kubernetes cluster.
- Continuously watch for code changes, automatically rebuilding and redeploying as needed.
- Restart the server when changes are detected.

After running this command, you can visit https://localhost to access the backend server.
Note: You may encounter an SSL warning due to the default self-signed certificate provided by the ingress. You can safely bypass this warning.

> ✅ To run unit tests for a service:
>
> ```bash
> cd orders
> npm run test
> ```

---

## ☁️ Cloud Deployment Overview

TixBee backend can be deployed on any Kubernetes provider such as GKE, AKS, or EKS (not tested yet; may require minor changes).

### 🔧 1. Set Up a Kubernetes Cluster

Provision a `standard` Kubernetes cluster (2 nodes, each with 1–2 vCPUs, 4GB RAM):

- On **GKE**, assign the following roles to your Service Account:
  - `Kubernetes Engine Admin`
  - `Kubernetes Engine Cluster Admin`
  - `Kubernetes Engine Default Node Service Agent`

Generate a JSON key and save it.

Other providers (e.g., Azure or AWS) require different secrets:

- AKS → `AZURE_CREDENTIALS`, `AKS_RESOURCE_GROUP`, `AKS_CLUSTER_NAME`
- EKS → IAM roles and cluster access

### 🔑 2. Add GitHub Secrets

In your backend GitHub repo, add the following secrets (adjust according to your cloud provider):

| Secret Name             | Description                                                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GKE_PROJECT_ID`        | GCP project ID                                                                                                                                                                              |
| `GKE_ZONE`              | GCP cluster zone                                                                                                                                                                            |
| `GKE_SA_KEY`            | GCP service account JSON                                                                                                                                                                    |
| `GKE_CLUSTER_NAME`      | Your GKE cluster name                                                                                                                                                                       |
| `DOCKER_USERNAME`       | Docker Hub username                                                                                                                                                                         |
| `DOCKER_PASSWORD`       | Docker Hub password                                                                                                                                                                         |
| `JWT_KEY`               | JWT secret                                                                                                                                                                                  |
| `ORIGIN_URL`            | CORS allowed origins                                                                                                                                                                        |
| `STRIPE_KEY`            | Your Stripe secret key                                                                                                                                                                      |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret. Register the `https://<your-domain>/api/payments/webhook` endpoint as a webhook in your Stripe dashboard, then copy the "Signing secret" provided by Stripe. |
| `TIXBEE_SOURCE_TOKEN`   | [BetterStack](https://betterstack.com/telemetry){:target="\_blank"} Logtail token (for remote logging)                                                                                      |

### 🏁 3. Initial Cluster Setup

After pushing code to `main` branch (make sure you replace your domain in `infra/k8s/prod-ssl/ingress-srv.yaml`):

- Go to **GitHub Actions**
- Cancel all auto-triggered workflows (cluster isn’t ready yet)
- Run the `Initial cluster setup` workflow manually
  - This will:
    - Configure the cluster
    - Install Ingress
    - Build/push Docker images
    - Apply Kubernetes manifests

Verify ingress is active:

```bash
kubectl get service -n ingress-nginx
```

Copy the **EXTERNAL-IP** from the `LoadBalancer` service, open in browser:

```url
http://<external-ip>
```

If you see **404 Not Found** from NGINX → all good.  
Visit a sample endpoint like:

```url
http://<external-ip>/api/users/currentuser
```

You should get:

```json
{ "currentUser": null }
```

---

## 🌐 Domain & DNS Setup

Point your domain to the external IP (from Load Balancer) using A and CNAME records.

### Example DNS Records

#### For subdomain `backend-tixbee.khaftab.me`:

```
| Type  | Host                | Value                     |
|-------|---------------------|---------------------------|
| A     | backend-tixbee      | <external-ip>             |
| CNAME | www.backend-tixbee  | backend-tixbee.khaftab.me |
```

#### For root domain `khaftab.me`:

```
| Type  | Host  | Value              |
|-------|-------|--------------------|
| A     | @     | <external-ip>      |
| CNAME | www   | khaftab.me         |
```

Now test your backend over domain:

```bash
curl http://backend-tixbee.khaftab.me/api/users/currentuser
# Should return: { "currentUser": null }
```

> ❗ Use HTTP here; SSL is not yet enabled.

---

## 🔐 SSL Setup

Run the `Setup SSL` GitHub workflow:

- Installs **Cert Manager**
- Applies **ClusterIssuer**
- Patches `ingress-srv.yaml` with TLS config

After a few minutes, test with:

```bash
curl -v https://backend-tixbee.khaftab.me/api/users/currentuser
```

If you see a valid TLS certificate chain, SSL is successfully configured.

---

## 🧩 Troubleshooting Tips

- ❌ Seeing “fake Kubernetes ingress certificate”?  
  → Check if cert secret exists and ingress is referencing it.

- ❌ GitHub Actions failing on deploy?  
  → Double-check cloud auth secrets, login method and Service Account permissions.

Once SSL is working and the API is live under your domain, your backend is ready for production use.

---

## 🗺️ Future Improvements

- 📊 Central metrics dashboard (Prometheus + Grafana)
- 🧪 e2e testing with real NATS and Redis

---

## 📬 Contact

For suggestions, questions, or collaborations, feel free to reach out via [GitHub Issues](https://github.com/khaftab/code-sprint-backend/issues){:target="\_blank"} or connect with me on [LinkedIn](https://www.linkedin.com/in/kh-aftab-uddin-ahmed){:target="\_blank"}.
