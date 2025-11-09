import { Card } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Star, BookOpen } from 'lucide-react';

interface ProfessorCardProps {
  id: string;
  name: string;
  department: string;
  rating: number;
  courseCount: number;
}

export function ProfessorCard({
  name,
  department,
  rating,
  courseCount,
}: ProfessorCardProps) {
  return (
    <Card className="p-6 rounded-xl shadow-sm border-border hover:shadow-lg transition-all cursor-pointer group">
      <div className="space-y-4">
        {/* Avatar and Name */}
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-20 w-20 mb-3">
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <h3 className="mb-1 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-sm text-muted-foreground">{department}</p>
        </div>

        {/* Stats */}
        <div className="pt-4 border-t border-border flex items-center justify-around">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <Star className="h-4 w-4 text-chart-5 fill-chart-5" />
              <span>{rating}</span>
            </div>
            <span className="text-xs text-muted-foreground">Rating</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>{courseCount}</span>
            </div>
            <span className="text-xs text-muted-foreground">Courses</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
