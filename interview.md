# Top Product Company Interview Q&A (Based on CollabMatrix)

This document contains advanced technical questions and answers that top-tier product company (FAANG/MAANG) interviewers might ask based on the architecture, design choices, and scaling challenges of the **CollabMatrix** platform.

---

## 🏗️ Systems Design & Distributed Architecture

### **Q1: In CollabMatrix, you are using STOMP over WebSockets for real-time chat and document editing. If the platform scales to 1 million concurrent users across multiple backend servers, how do you ensure that a message sent by User A on Server 1 reaches User B connected to Server 2?**
**A:** This is a classic Pub/Sub distributed systems problem. In CollabMatrix, we use **Redis Pub/Sub** (or alternatively, Kafka) as a message broker between our Spring Boot WebSocket nodes. 
When User A sends a message to Server 1, Server 1 publishes that message to a specific Redis channel (e.g., `chat:channel:general`). All other backend servers (Server 2, Server 3, etc.) are subscribed to this Redis channel. When they receive the message from Redis, they broadcast it via their local STOMP/WebSocket broker to all clients connected to them that are listening to that channel. This completely decouples the horizontal scaling of the WebSocket servers.

### **Q2: You use both PostgreSQL and MongoDB. Why introduce the operational complexity of two databases instead of just using Postgres for everything (with JSONB) or Mongo for everything?**
**A:** We apply **Polyglot Persistence** to match the database to the specific data access pattern:
- **PostgreSQL** is used for core entities: Users, Workspaces, Memberships, and Kanban Tasks. These entities require strict ACID compliance, complex relational joins, and strict schema enforcement. For example, ensuring a user isn't added to a workspace twice, or transactionally moving a task and logging an audit trail.
- **MongoDB** is used for Chat Messages and Document Snapshots. Chat systems generate massive volumes of write-heavy, loosely structured, chronological data. MongoDB handles high-throughput appends and nested documents (like threaded replies) much better at scale than relational tables.

### **Q3: What is the purpose of Kafka and Zookeeper in your architecture? Could you have achieved the same with RabbitMQ or just direct REST calls?**
**A:** Kafka is chosen for its high-throughput, distributed, append-only log structure. We use it specifically for **Change Data Capture (CDC)** and the **Transactional Outbox Pattern**.
If a microservice updates a task in Postgres, we need to reliably update the search index, send a push notification, and invalidate the Redis cache. Direct REST calls risk cascading failures and network timeouts (if the notification service goes down, the task update fails). 
With Kafka, the core service writes the event to a topic and immediately returns a response to the user. Downstream consumers pull at their own pace. RabbitMQ is a message queue (messages are deleted after consumption), whereas Kafka is an event streaming platform (messages are persisted and can be replayed by multiple independent consumer groups).

### **Q4: How do you handle "Split-Brain" network partitions in a microservices environment communicating over Kafka and Zookeeper?**
**A:** Zookeeper uses a quorum-based consensus algorithm (ZAB - Zookeeper Atomic Broadcast, similar to Paxos/Raft). To tolerate `F` failures, we need `2F + 1` nodes. In a network partition, only the partition containing the strict majority (quorum) of Zookeeper nodes continues to operate and elect a leader. The minority partition pauses its operations to prevent split-brain inconsistencies. Kafka brokers rely on this Zookeeper quorum for controller election and partition leadership, guaranteeing consistent state across the cluster.

---

## 💻 Frontend Architecture & Performance

### **Q5: The CollabMatrix dashboard uses custom SVG charts with Framer Motion for animation. Why build custom SVG charts instead of using a library like Chart.js or Recharts?**
**A:** Top product companies obsess over **bundle size and rendering performance**. Heavy libraries like Chart.js pull in massive dependencies and often rely on HTML5 Canvas, which is opaque to the DOM and harder to animate declaratively. 
By writing pure SVG paths and utilizing Framer Motion, we:
1. Keep the bundle size incredibly small (zero dependencies).
2. Achieve highly customized, premium aesthetics (glowing drop shadows, glassmorphic tooltips).
3. Can smoothly interpolate the `d` attribute of SVG `<path>` elements using Framer Motion springs when data changes, creating a fluid, app-like feel that Canvas-based libraries struggle to replicate smoothly.

### **Q6: You have a client-side Code Sandbox in the chat using `new Function`. What are the security implications of this, and how do you mitigate XSS (Cross-Site Scripting)?**
**A:** Executing arbitrary code on the client is highly dangerous. If an attacker sends a malicious script in the chat and another user runs it, the script could read `localStorage` (stealing JWTs) and make API calls on their behalf.
**Mitigation strategies:**
1. **Context Isolation:** We execute the code inside a restricted closure where global variables (`window`, `document`, `fetch`, `localStorage`) are explicitly shadowed or set to `undefined`.
2. **Iframe Sandboxing:** For production-grade security, the code should be executed inside a hidden, cross-origin `<iframe sandbox="allow-scripts">`. This ensures the code cannot access the parent DOM or cookies.
3. **Web Workers:** Running the evaluation inside a Web Worker prevents the script from accessing the DOM entirely and prevents long-running `while(true)` loops from blocking the main UI thread.

### **Q7: Your Notion-style document editor supports live concurrent cursors. How do you handle race conditions when two users edit the exact same paragraph at the exact same millisecond?**
**A:** This requires **Operational Transformation (OT)** or **Conflict-free Replicated Data Types (CRDTs)** (like Yjs or Automerge). 
Simply sending "overwrite" payloads via WebSockets leads to data loss. Instead, clients send *operations* (e.g., "Insert 'A' at index 5"). If User 1 and User 2 type simultaneously, the backend or CRDT algorithm mathematically resolves the conflicts so both clients eventually converge on the exact same document state without locking the document.

---

## ⚙️ Backend, Concurrency & Security

### **Q8: Your authentication relies on stateless JWTs. If a user's account is compromised, how do you revoke a stateless JWT before it expires?**
**A:** This is the inherent tradeoff of stateless JWTs. Since the backend doesn't check the database on every request, it can't natively know a token is revoked. 
**Solutions:**
1. **Short Expiration + Refresh Tokens:** Make the JWT expire every 15 minutes. The frontend uses a long-lived Refresh Token (stored in a secure HttpOnly cookie) to get a new JWT. To revoke access, we delete the Refresh Token from the database. The attacker loses access within 15 minutes max.
2. **Redis Denylist:** When a user logs out or is compromised, we add their current JWT's signature (or `jti` claim) to a Redis denylist with a TTL equal to the token's remaining lifespan. The API Gateway checks this Redis cache on every request. This adds a minor latency hit (1-2ms) but ensures instant revocation.

### **Q9: You implemented a Kanban board where High-priority SLAs pulse if stuck in "To Do". If you have millions of tasks, how does the backend efficiently query and alert on breached SLAs without bringing down the database?**
**A:** We avoid running a massive `SELECT * FROM tasks WHERE status = 'TODO' AND created_at < NOW() - 24h` cron job against the primary Postgres database. 
Instead, we use **Event Schedulers or Time-to-Live (TTL) queues**:
1. **Redis Delayed Queues / Key-Space Notifications:** When a High-priority task is created, we insert a key into Redis with a TTL of 24 hours. If the task moves to "In Progress", we delete the key. If the TTL expires, Redis fires a pub/sub event that a microservice catches to trigger the SLA alert.
2. **Kafka Delay Topics:** Using a dedicated consumer group that polls tasks partitioned by their SLA deadline.

### **Q10: Explain how you prevent "Lost Updates" in your PostgreSQL Kanban database if two users drag-and-drop the same task simultaneously?**
**A:** To prevent race conditions on relational data, we implement **Optimistic Concurrency Control (Optimistic Locking)**.
We add a `@Version` field to our JPA entity mapping to a `version` integer column in Postgres. 
1. User A and User B fetch the task (e.g., version = 1).
2. User A moves it to "In Progress". The backend executes: `UPDATE tasks SET status = 'IN_PROGRESS', version = 2 WHERE id = X AND version = 1`. This succeeds.
3. User B moves it to "Done". The backend executes: `UPDATE tasks SET status = 'DONE', version = 2 WHERE id = X AND version = 1`. This fails (0 rows updated) because the version is now 2.
4. User B receives an `OptimisticLockException` (HTTP 409 Conflict), and the UI prompts them to refresh the board.
