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
