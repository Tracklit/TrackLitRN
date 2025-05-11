import { Result, Meet } from '@shared/schema';
import { formatDate } from '@/lib/utils';
import { formatResult } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ResultItemProps {
  meet: Meet;
  results: Result[];
}

function ResultItem({ meet, results }: ResultItemProps) {
  function getPlaceBadge(place: number | undefined) {
    if (!place) return null;
    
    if (place === 1) {
      return <Badge variant="success">1st Place</Badge>;
    } else if (place === 2) {
      return <Badge variant="success">2nd Place</Badge>;
    } else if (place === 3) {
      return <Badge variant="warning">3rd Place</Badge>;
    } else {
      return <Badge variant="secondary">{place}th Place</Badge>;
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{meet.name}</h4>
        <span className="text-xs text-darkGray">{formatDate(meet.date)}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        {results.map((result) => (
          <div key={result.id} className="bg-lightGray rounded-lg p-3">
            <p className="text-xs text-darkGray mb-1">{result.event}</p>
            <div className="flex items-baseline">
              <span className="text-lg font-bold">{formatResult(result.result, result.event)}</span>
              <span className="ml-2 text-xs">{getPlaceBadge(result.place)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface RecentResultsProps {
  results: { meet: Meet; results: Result[] }[];
  onViewAll?: () => void;
}

export function RecentResults({ results, onViewAll }: RecentResultsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="divide-y divide-lightGray">
        {results.length > 0 ? (
          results.map((item, index) => (
            <ResultItem 
              key={`${item.meet.id}-${index}`} 
              meet={item.meet} 
              results={item.results} 
            />
          ))
        ) : (
          <div className="p-8 text-center text-darkGray">
            <p>No results logged yet</p>
            <p className="text-sm mt-2">Log your first result after completing a meet</p>
          </div>
        )}
      </div>
    </div>
  );
}
