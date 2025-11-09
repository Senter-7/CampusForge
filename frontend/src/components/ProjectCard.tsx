import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Star, Users } from 'lucide-react';

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  skills: string[];
  creator: {
    name: string;
    avatar: string;
  };
  rating: number;
  memberCount: number;
}

export function ProjectCard({
  title,
  description,
  skills,
  creator,
  rating,
  memberCount,
}: ProjectCardProps) {
  return (
    <Card className="p-6 rounded-xl shadow-sm border-border hover:shadow-lg transition-all cursor-pointer group">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-2">
          {skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="secondary" className="rounded-lg text-xs">
              {skill}
            </Badge>
          ))}
          {skills.length > 3 && (
            <Badge variant="outline" className="rounded-lg text-xs">
              +{skills.length - 3}
            </Badge>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={creator.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {creator.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{creator.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-chart-5 fill-chart-5" />
              <span className="text-sm">{rating}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">{memberCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
