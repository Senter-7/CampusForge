import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export function ProfessorDetail() {
  const { id } = useParams();
  const [professor, setProfessor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/professors/${id}`)
      .then((res) => res.json())
      .then(setProfessor)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="p-4">Loading professor details...</p>;
  if (!professor) return <p className="p-4">Professor not found.</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{professor.name}</h1>
      <p className="text-gray-700 mb-2">{professor.department}</p>
      <p className="text-sm text-gray-500">{professor.email}</p>
    </div>
  );
}
