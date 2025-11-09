import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export function SearchBar({ onSearch, initialQuery = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
    } else {
      onSearch(''); // Empty query means show all
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search projects, professors, courses..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            className="h-14 pl-12 pr-4 rounded-xl border-2 bg-card"
          />
        </div>
        <Button 
          size="lg" 
          className="h-14 px-8 rounded-xl"
          onClick={handleSearch}
        >
          Search
        </Button>
      </div>
    </div>
  );
}
