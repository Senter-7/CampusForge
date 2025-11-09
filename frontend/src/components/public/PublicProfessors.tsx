import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function PublicProfessors() {
  const [professors, setProfessors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/professors")
      .then((res) => res.json())
      .then(setProfessors)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-4">Loading professors...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Explore Professors</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {professors.map((p) => (
          <Link
            to={`/explore/professors/${p.professorId}`}
            key={p.professorId}
            className="border p-4 rounded-xl hover:shadow-md transition"
          >
            <h2 className="font-bold text-lg">{p.name}</h2>
            <p className="text-sm text-gray-600">{p.department}</p>
            <p className="text-xs text-gray-500">{p.email}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
