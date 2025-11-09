import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Star } from 'lucide-react';

interface CourseCardProps {
  id: string;
  name: string;
  professor: string;
  description: string;
  rating: number;
  tags: string[];
}

export function CourseCard({
  name,
  professor,
  description,
  rating,
  tags,
}: CourseCardProps) {
  return (
    <Card className="p-6 rounded-xl shadow-sm border-border hover:shadow-lg transition-all cursor-pointer group">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <h3 className="flex-1 group-hover:text-primary transition-colors">
              {name}
            </h3>
            <div className="flex items-center gap-1 ml-2">
              <Star className="h-4 w-4 text-chart-5 fill-chart-5" />
              <span>{rating}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{professor}</p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>

        {/* Tags */}
        <div className="pt-4 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="rounded-lg text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
