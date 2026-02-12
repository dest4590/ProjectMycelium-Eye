### ProjectMycelium-Eye

**ProjectMycelium-Eye** is the central command-and-control dashboard for the Mycelium ecosystem. Designed as a high-performance "observatory," it provides a sophisticated interface for visualizing, orchestrating, and analyzing the underlying social graph data in real-time.

It transforms complex datasets into actionable visual intelligence, allowing for deep exploration of digital network topologies.

### 🚀 Key Features & Functionalities

- **Dynamic Network Visualization:** Utilizes `vis-network` to render interactive, high-fidelity social connection maps. The graph supports real-time updates via WebSocket streams, allowing users to watch the network expand as the backend scraper discovers new nodes.

- **Orchestration Control Panel:** Enables direct management of scanning parameters. Users can initiate recursive crawls, define entry points (seed accounts), and set depth constraints directly from the interface.

- **Advanced Analytical Suite:** A dedicated module for deep-data interrogation:
    - **Influence Analysis (PageRank):** Execute PageRank algorithms with a single click to identify "key influencers" and high-centrality nodes within the network.
    - **Relationship Pathfinding:** Calculates and visualizes the shortest path between any two arbitrary nodes, uncovering hidden chains of connection.
    - **Neighborhood Analysis:** Interactive node exploration allows users to isolate specific sub-graphs and audit the "inner circles" of target profiles.
    - **Granular Data Filtering:** Supports query-based filtering (e.g., `degree > 10`) to eliminate noise and focus on statistically significant network clusters.

- **Context-Aware Interaction:** Implements a robust context menu for rapid node management, allowing users to expand connections, highlight neighbors, or pivot scanning targets on the fly.

- **Workspace Segmentation:** Supports a multi-project architecture. Users can seamlessly toggle between isolated environments (e.g., "Corporate," "Academic," "Personal") to maintain data integrity across different research scopes.

- **Asynchronous System Monitoring:** Features a built-in real-time telemetry console that streams backend logs, scanning progress, and error reports, providing full transparency into the system's "under-the-hood" operations.

### 🛠️ Technical Stack

- **Frontend Framework:** `Vue.js 3` (Composition API) with `Vite` for optimized builds and reactive state management.
- **Graph Engine:** `vis-network` for rendering large-scale, interactive relationship graphs.
- **Communication Protocols:** `Axios` for RESTful API interactions and `@stomp/stompjs` for full-duplex `WebSocket` communication, ensuring low-latency data updates.



https://github.com/user-attachments/assets/3a7f37b0-2979-4655-8351-d488d48959e6

