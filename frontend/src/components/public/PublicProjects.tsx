import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function PublicProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/projects")
      .then((res) => res.json())
      .then(setProjects)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-4">Loading projects...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Explore Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <Link
            to={`/projects/${p.projectId}`}
            key={p.projectId}
            className="border p-4 rounded-xl hover:shadow-md transition"
          >
            <h2 className="font-bold text-lg">{p.title}</h2>
            <p className="text-sm text-gray-600">{p.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
