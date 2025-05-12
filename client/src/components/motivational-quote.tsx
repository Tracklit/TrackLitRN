import { Quote } from 'lucide-react';

interface MotivationalQuoteProps {
  quote: string;
  author: string;
}

export function MotivationalQuote({ quote, author }: MotivationalQuoteProps) {
  return (
    <div className="relative">
      <Quote className="h-12 w-12 text-primary opacity-20 absolute top-0 left-0" />
      <div className="pl-4">
        <p className="text-xl font-medium text-foreground">"{quote}"</p>
        <p className="text-sm mt-3 text-primary">- {author}</p>
      </div>
    </div>
  );
}
