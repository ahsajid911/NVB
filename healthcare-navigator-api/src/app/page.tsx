export default function Home() {
  return (
    <div style={{ padding: "40px", fontFamily: "system-ui" }}>
      <h1>Healthcare Navigator API</h1>
      <p>Backend API for Healthcare Navigator Bangladesh</p>
      <h2>Endpoints</h2>
      <ul>
        <li>GET /api/data?type=doctors|hospitals|specialties|districts</li>
        <li>GET /api/data/stats</li>
        <li>POST /api/data (create)</li>
        <li>DELETE /api/data (bulk delete)</li>
        <li>POST /api/seed (seed database)</li>
        <li>POST /api/auth/login</li>
        <li>POST /api/auth/logout</li>
        <li>GET /api/auth/me</li>
        <li>GET/PUT /api/ai/providers</li>
        <li>GET/POST /api/ai/api-keys</li>
        <li>DELETE /api/ai/api-keys/[id]</li>
        <li>POST /api/ai/test-connection</li>
        <li>POST /api/ai/chat</li>
        <li>POST /api/ai/symptom-analysis</li>
        <li>GET /api/symptoms</li>
        <li>GET /api/profile</li>
        <li>GET /api/logs</li>
        <li>GET /api/admins</li>
      </ul>
    </div>
  );
}