import { Quote } from 'lucide-react';

interface MotivationalQuoteProps {
  quote: string;
  author: string;
}

export function MotivationalQuote({ quote, author }: MotivationalQuoteProps) {
  return (
    <div className="bg-gradient-to-r from-secondary to-primary rounded-xl shadow-sm p-6 text-white">
      <Quote className="h-6 w-6 opacity-50 mb-2" />
      <p className="text-lg font-medium">"{quote}"</p>
      <p className="text-sm mt-2 opacity-80">- {author}</p>
    </div>
  );
}
