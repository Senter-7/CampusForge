import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function PublicCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/courses")
      .then((res) => res.json())
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-4">Loading courses...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Explore Courses</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((c) => (
          <Link
            to={`/explore/courses/${c.courseId}`}
            key={c.courseId}
            className="border p-4 rounded-xl hover:shadow-md transition"
          >
            <h2 className="font-bold text-lg">{c.name}</h2>
            <p className="text-sm text-gray-600">
              {c.description?.substring(0, 100)}...
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
