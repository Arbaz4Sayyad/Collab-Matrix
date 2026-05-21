# CollabMatrix: Comprehensive Engineering Interview Guide

This document contains a structured, high-level technical interview guide based on the **CollabMatrix** architecture. These are the advanced, system-design focused questions that Staff, Principal, and MAANG-level engineers are asked during system design and architecture rounds.

---

## 1. High-Level Architecture

**Q: You chose a "Modular Monolith" for the Spring Boot backend instead of immediately jumping to microservices. Why?**
**A:** Microservices introduce immense operational overhead: network latency, distributed transactions, complex CI/CD, and hard-to-trace bugs. By building a Modular Monolith, we get the best of both worlds. The code is strictly separated into bounded contexts (`collab-auth`, `collab-task`, `collab-chat`). They communicate via well-defined internal APIs or Kafka events, preventing spaghetti code. When a specific domain (like Chat) scales to a point where it needs dedicated hardware, we can easily extract that single module into its own microservice without rewriting the system.

---

## 2. Distributed Systems

**Q: How do you handle "Split-Brain" network partitions in your event cluster communicating over Kafka and Zookeeper?**
**A:** Zookeeper uses a quorum-based consensus algorithm (ZAB - Zookeeper Atomic Broadcast). To tolerate `F` failures, we need `2F + 1` nodes (typically 3 or 5). In a network partition, only the partition containing the strict majority (quorum) of Zookeeper nodes continues to operate and elect a leader. The minority partition pauses its operations to prevent split-brain inconsistencies. Kafka brokers rely on this Zookeeper quorum for controller election, guaranteeing consistent state across the cluster.

---

## 3. Kafka & Event Streaming

**Q: Explain the Transactional Outbox Pattern used in CollabMatrix. Why not just publish to Kafka directly after saving to the database?**
**A:** If we save to PostgreSQL and then publish to Kafka directly, the Kafka publish might fail due to a network timeout. This leaves our system in an inconsistent state (task updated in DB, but notifications never sent). 
With the **Transactional Outbox Pattern**, we save the task update AND write an event record to an `outbox` table in the *same* ACID database transaction. Either both succeed or both roll back. A separate background worker (or Kafka Connect) continuously polls/tails the `outbox` table and safely publishes the events to Kafka with at-least-once delivery guarantees.

---

## 4. Redis & Caching

**Q: Redis is used as your WebSocket backplane and cache. What happens if you experience a "Cache Stampede" (Thundering Herd) when a highly active workspace's cache key expires?**
**A:** A Cache Stampede occurs when a highly requested cache key expires, and thousands of concurrent requests suddenly hit the underlying database (PostgreSQL) simultaneously, potentially bringing it down.
**Mitigations:**
1. **Probabilistic Early Expiration (PERC):** Randomly expire the cache for a small subset of requests slightly *before* the actual TTL, allowing one thread to refresh it in the background.
2. **Mutex Locks:** When a cache miss occurs, the first thread acquires a Redis distributed lock (using SETNX). Only this thread queries the DB and repopulates the cache. Other threads wait and then read from the newly populated cache.

---

## 5. Real-Time Systems

**Q: If the platform scales to 1 million concurrent users across 50 backend servers, how do you ensure a chat message sent by User A on Server 1 reaches User B connected to Server 2?**
**A:** Stateful WebSocket connections cannot be load-balanced like stateless HTTP requests. We use **Redis Pub/Sub** (or a Kafka topic) as a message broker between our Spring Boot WebSocket nodes. 
When User A sends a message to Server 1, Server 1 publishes that payload to a specific Redis channel (`workspace:123:chat`). All other backend servers are subscribed to this channel. When they receive the message from Redis, they fan it out via their local STOMP broker to all clients connected *to them* that are actively viewing that workspace.

---

## 6. Database Engineering

**Q: Explain how you prevent "Lost Updates" in your PostgreSQL Kanban database if two users drag-and-drop the same task simultaneously.**
**A:** We use **Optimistic Concurrency Control (Optimistic Locking)**.
We add a `@Version` field to our JPA entity mapping to a `version` integer column in Postgres. 
1. User A and User B fetch the task (version = 1).
2. User A moves it to "In Progress". Postgres executes: `UPDATE tasks SET status = 'IN_PROGRESS', version = 2 WHERE id = X AND version = 1`. This succeeds.
3. User B moves it to "Done". Postgres executes: `UPDATE tasks SET status = 'DONE', version = 2 WHERE id = X AND version = 1`. This fails (0 rows updated) because the version is now 2.
4. User B receives an `OptimisticLockException` (HTTP 409 Conflict), and the frontend seamlessly fetches the latest state and applies the merge.

---

## 7. Security Engineering

**Q: You have a client-side Code Sandbox in the chat. What are the security implications, and how do you mitigate Cross-Site Scripting (XSS)?**
**A:** Executing arbitrary JavaScript code on the client is highly dangerous. A malicious script could read `localStorage` to steal JWTs or make unauthorized API calls.
**Mitigations:**
1. **Context Isolation:** The code runs inside a restricted `new Function` closure where global variables (`window`, `document`, `fetch`) are explicitly shadowed and set to `undefined`.
2. **Web Workers:** For production safety, the evaluation should be offloaded to a Web Worker, which operates in a completely separate thread with absolutely zero access to the DOM.

---

## 8. Frontend Architecture

**Q: The CollabMatrix dashboard uses custom SVG charts with Framer Motion. Why build custom SVG charts instead of using a heavy library like Chart.js?**
**A:** 
1. **Performance & Bundle Size:** Heavy canvas libraries add massive dependency bloat, drastically impacting the initial load time (TTI). Pure SVG paths have zero dependency cost.
2. **Declarative Animation:** HTML5 Canvas is opaque to the DOM. By rendering pure SVG `<path>` elements, we can bind Framer Motion spring physics directly to the `d` coordinate attribute, allowing the charts to morph fluidly and reactively when realtime data streams in—an effect that is incredibly difficult to achieve smoothly in Canvas.

---

## 9. Performance Engineering

**Q: When a workspace has 10,000 tasks, how do you prevent the frontend Kanban board from freezing the browser?**
**A:** 
1. **DOM Virtualization:** We use libraries like `@tanstack/react-virtual` to only render the DOM nodes for tasks currently visible in the browser viewport. As the user scrolls, DOM nodes are recycled. This keeps the DOM tree shallow and memory usage flat.
2. **Lazy Loading:** Code-splitting routes so the browser only downloads the Kanban JavaScript bundle when the user navigates to the `/tasks` route.

---

## 10. JVM & Spring Internals

**Q: Managing thousands of long-lived concurrent WebSocket connections can cause JVM memory issues. How do you tune the JVM for this workload?**
**A:** WebSockets keep threads and objects alive much longer than standard HTTP requests.
1. **G1GC or ZGC:** We use the Garbage-First Garbage Collector (G1GC) or ZGC to minimize "Stop-The-World" pause times, which would otherwise cause massive latency spikes in real-time chat delivery.
2. **Heap Sizing:** Set `-Xms` and `-Xmx` to the same value to prevent the JVM from constantly pausing to resize the heap.
3. **Project Loom (Java 21):** While currently on Java 17, migrating to Java 21 Virtual Threads would drastically reduce the memory footprint per WebSocket connection, as virtual threads do not map 1:1 to OS threads.

---

## 11. DevOps & Kubernetes

**Q: If you deploy CollabMatrix to Kubernetes, how do you handle scaling the stateful WebSocket backend servers versus the stateless REST API servers?**
**A:** 
- **Stateless REST APIs:** Handled by standard K8s `Deployments` paired with an HPA (Horizontal Pod Autoscaler) scaling on CPU/Memory thresholds.
- **Stateful WebSockets:** Scaling WebSockets requires sticky sessions or a robust Redis backplane. When scaling *down*, Kubernetes sends a `SIGTERM`. The Spring Boot app must gracefully intercept this signal, stop accepting new WS connections, allow existing messages to flush, and gracefully disconnect clients so the frontend can seamlessly reconnect to a surviving pod.

---

## 12. Observability

**Q: A user reports a delay between moving a Kanban task and receiving the SLA notification. How do you trace this across your distributed architecture?**
**A:** We use **Distributed Tracing (OpenTelemetry/Jaeger)**.
When the frontend makes the HTTP request to move the task, an API Gateway assigns a `trace_id`. 
This `trace_id` is:
1. Logged by the Spring Boot Task module.
2. Injected into the Kafka event headers.
3. Extracted by the Notification consumer module.
We can query this single `trace_id` in Grafana/Jaeger to visualize a waterfall chart showing exactly how many milliseconds were spent in the PostgreSQL transaction, the Kafka queue wait time, and the WebSocket dispatch.

---

## 13. Failure Recovery

**Q: What happens if your Redis instance crashes entirely? How does the system degrade gracefully?**
**A:** Redis is used for WebSocket Pub/Sub and Presence tracking. 
If Redis crashes:
1. **Chat/Sync Degradation:** WebSocket messages can no longer be broadcast *between* nodes. Users connected to Node A won't see messages from Node B. However, core HTTP REST functions (creating tasks, saving docs to Mongo/Postgres) will continue to function perfectly.
2. **Recovery:** We use Redis Sentinel or a Redis Cluster for automatic failover. The Spring Boot `LettuceConnectionFactory` will automatically reconnect to the newly promoted master node, and Pub/Sub functionality will restore without restarting the backend pods.

---

## 14. Behavioral/System Ownership

**Q: What was the hardest technical decision you had to make in CollabMatrix?**
**A:** Choosing the document synchronization strategy. Initially, we looked at Operational Transformation (OT), but the requirement for a central, strictly ordered authoritative server became a massive bottleneck and single point of failure. 
Transitioning to **CRDTs (Yjs)** was difficult mathematically and conceptually, but it was the right decision. It allowed us to move conflict resolution to the client edge. The backend became a dumb, scalable relayer of byte arrays, massively simplifying our infrastructure and allowing true offline-first editing capabilities.

---

## 15. Tradeoff Discussions

**Q: In the CAP Theorem, how does CollabMatrix handle the tradeoff between Consistency and Availability across its different domains?**
**A:** We apply different CAP tradeoffs based on the domain impact:
- **Kanban Tasks (PostgreSQL):** We choose **CP (Consistency & Partition Tolerance)**. If two users move a task, it MUST be consistent to prevent corrupted workflows. We use optimistic locking. If the DB is unreachable, the request fails (sacrificing availability).
- **Presence & Chat (Redis/MongoDB):** We choose **AP (Availability & Partition Tolerance)**. It is better for a chat message to be delivered quickly (available) and eventually ordered correctly, or for a user's "online" status to be slightly delayed, than to block the entire application waiting for strict consensus.

---

## 16. Practical Experience — Code-Backed Answers

> These answers are grounded in the actual CollabMatrix implementation and are suitable for behavioral, metrics, and "tell me about a time" interview rounds.

---

**Q1: What is the heaviest API you built — how many requests did it handle per day?**

**A:** The heaviest endpoint by fan-out complexity is the **Global Workspace Search** (`GET /api/search?workspaceId=...&query=...`), implemented in `SearchServiceImpl`. A single call synchronously queries three domain provider chains — Projects, then Tasks across every resolved project ID, then Documents — before returning a merged result set. Without caching, this could easily produce 3× to 10× the number of downstream DB calls relative to the HTTP request count.

To handle this, I added a `@Cacheable(value = "global-search", key = "#workspaceId + '-' + #query")` annotation backed by Redis, which absorbs repeated queries for the same workspace and keyword. In parallel, a Bucket4j token-bucket rate-limiting filter (`RateLimitingFilter.java`, `@Order(1)`) caps each IP at 60 requests/minute at the filter chain level — before any request reaches the service layer or database.

The load profile was validated with a JMeter plan (`load-test.jmx`) simulating **200 concurrent users each executing 10 sequential requests inside a 10-second ramp-up window** — targeting the notifications endpoint as the baseline throughput benchmark.

---

**Q2: Before your DB optimisations, what were the slow query times in your logs? After?**

**A:** The `TaskRepository.findByProjectId(UUID projectId)` method, which backs the `GET /projects/{id}/tasks` Kanban board endpoint, performs a filtered query against the `tasks` table. Without an explicit index on the `project_id` column, PostgreSQL defaults to a sequential scan — meaning query cost scales linearly with total row count regardless of how many tasks belong to the target project.

Two optimisations were applied:

1. **Read-only transactions:** All read paths in `TaskServiceImpl` are annotated with `@Transactional(readOnly = true)`. This tells Hibernate to skip dirty-checking on all managed entities and allows the JDBC driver to open a read-optimised connection, reducing lock contention under concurrent load.

2. **MongoDB compound index:** For the Chat service, the `chat_messages` collection is indexed on `{ channel_id: 1, created_at: -1 }`. This converts time-ordered paginated message fetches from full collection scans into O(log n) B-tree lookups — critical for channels with high message volume.

The rationale: without the compound index on MongoDB, fetching the latest 50 messages from a busy channel requires scanning every document in the collection and sorting in memory. With the index, MongoDB resolves the query using the index tree in the correct sort order directly.

---

**Q3: Did any of your Kafka consumers ever fall behind? What was the lag, and what did you do?**

**A:** The `TaskEventConsumer` in `collab-notification` subscribes to the `workspace.task.events` topic (12 partitions, keyed by `projectId`). The `@KafkaListener` defaults to a single consumer thread — which means under a burst of concurrent task status changes within a single project, the consumer processes events sequentially and lag accumulates.

Two mitigations were designed into the system:

1. **Partition key strategy:** Events are published using `task.getProjectId().toString()` as the Kafka message key (`KafkaTemplate.send(TASK_EVENTS_TOPIC, projectId, event)`). This distributes load across 12 partitions by project, preventing a single hot partition. For very large organisations, hashing by `channelId` instead of `orgId` avoids partition skew.

2. **Idempotent consumers:** The architecture uses a Redis-based deduplication store keyed on `event_id`. If a consumer rewinds its offset after a lag spike to replay events, the Redis check prevents duplicate notifications from being delivered. Consumer lag is surfaced as a live metric in the Grafana dashboard (`kafka_consumer_lag`), scraped from the Kafka broker via Prometheus.

---

**Q4: Has anything you built or fixed ever prevented a production issue?**

**A:** Two concrete examples backed by code:

**Optimistic locking preventing silent data corruption:** The `updateTaskStatus()` method in `TaskServiceImpl` manually enforces a version check before any write — comparing the client-supplied `currentVersion` against the entity's `@Version` field. If there is a mismatch (two users racing to move the same Kanban task), an `ObjectOptimisticLockingFailureException` is thrown and the API returns HTTP 409 Conflict. The frontend re-fetches the latest state and reconciles. Without this, the last writer silently overwrites the first — producing corrupted task state that is only discovered days later when a sprint board shows incorrect statuses.

**Rate-limiting filter preventing DB connection pool exhaustion:** The `RateLimitingFilter` executes at `@Order(1)` — the first filter in the entire chain. It uses a `ConcurrentHashMap<String, Bucket>` to maintain a per-IP token bucket (Bucket4j), enforcing 60 requests/minute. Requests exceeding the limit receive a 429 immediately, before any Spring Security processing, service logic, or database connection is allocated. This protects the PostgreSQL connection pool from being exhausted by a misbehaving client or crawler — a failure mode that commonly causes complete service outages in Spring Boot applications with fixed-size HikariCP pools.

---

**Q5: Did you ever write something (a doc, a test, a script) that saved someone else repeated work?**

**A:** Four concrete artifacts in this repository:

1. **`SYSTEM_ARCHITECTURE.md`** — A full architecture reference with Mermaid topology diagrams, an ER schema, a service responsibility matrix, Kafka topic configuration (partition count, key strategy), Redis usage patterns, and a K8s deployment strategy. Any engineer joining the project can orient themselves in under 20 minutes without reverse-engineering the codebase.

2. **`interview.md` (this document)** — A 15-question senior-engineer interview guide with architecture-specific answers covering distributed systems, Kafka, Redis, CRDTs, JVM tuning, and CAP theorem tradeoffs. Prepared once, reusable by any collaborator before a system design round on CollabMatrix.

3. **`docker-compose.yml` (9-container one-command stack)** — Provisions PostgreSQL, MongoDB, Redis, Kafka, Zookeeper, Prometheus, Grafana, the Spring Boot backend, and the Vite frontend in a single `docker compose up -d --build`. Eliminates hours of manual service setup for every new contributor and resolves the "works on my machine" class of issues entirely.

4. **`devops/testing/load-test.jmx`** — A ready-to-run JMeter test plan pre-configured with a 200-user thread group, 10 iteration loops, and a 10-second ramp-up targeting the notifications API. Any engineer can reproduce the load profile and validate throughput thresholds without authoring a test plan from scratch.
