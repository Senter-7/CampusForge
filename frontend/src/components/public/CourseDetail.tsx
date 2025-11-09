import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/courses/${id}`)
      .then((res) => res.json())
      .then(setCourse)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="p-4">Loading course details...</p>;
  if (!course) return <p className="p-4">Course not found.</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{course.name}</h1>
      <p className="text-gray-700 mb-4">{course.description}</p>
      {course.professorName && (
        <p className="text-sm text-gray-500">
          Taught by: <strong>{course.professorName}</strong>
        </p>
      )}
    </div>
  );
}
