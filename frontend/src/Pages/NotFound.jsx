import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>404 — Page not found</h1>
      <Link to="/">Back to dashboard</Link>
    </div>
  );
}