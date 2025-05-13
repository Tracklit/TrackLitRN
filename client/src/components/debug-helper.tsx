import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function DebugHelper() {
  const [showDebug, setShowDebug] = useState(false);
  const [elements, setElements] = useState<{selector: string, count: number}[]>([]);
  const [bodyClasses, setBodyClasses] = useState<string>('');
  
  useEffect(() => {
    if (showDebug) {
      // Find all navigation elements 
      const navElements = document.querySelectorAll('nav');
      const asideElements = document.querySelectorAll('aside');
      const divWithFixedClass = document.querySelectorAll('div[class*="fixed"]');
      const whiteBackgroundElements = document.querySelectorAll('*[class*="bg-white"]');
      
      setElements([
        { selector: 'nav elements', count: navElements.length },
        { selector: 'aside elements', count: asideElements.length },
        { selector: 'fixed position divs', count: divWithFixedClass.length },
        { selector: 'elements with white background', count: whiteBackgroundElements.length },
      ]);
      
      // Get body classes
      setBodyClasses(document.body.className);
      
      // Apply diagnostic classes
      document.querySelectorAll('nav, aside').forEach(el => {
        el.classList.add('debug-highlight-red');
      });
      
      document.querySelectorAll('div[class*="fixed"]').forEach(el => {
        el.classList.add('debug-highlight-blue');
      });
      
      document.querySelectorAll('*[class*="bg-white"]').forEach(el => {
        el.classList.add('debug-highlight-green');
      });
    } else {
      // Remove diagnostic classes
      document.querySelectorAll('.debug-highlight-red, .debug-highlight-blue, .debug-highlight-green')
        .forEach(el => {
          el.classList.remove('debug-highlight-red', 'debug-highlight-blue', 'debug-highlight-green');
        });
    }
  }, [showDebug]);
  
  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999]">
        <Button 
          onClick={() => setShowDebug(true)}
          variant="destructive"
          size="sm"
        >
          Debug
        </Button>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/90 text-white z-[9999] overflow-auto p-6">
      <style dangerouslySetInnerHTML={{ __html: `
        .debug-highlight-red { outline: 2px solid red !important; }
        .debug-highlight-blue { outline: 2px solid blue !important; }
        .debug-highlight-green { outline: 2px solid green !important; }
      `}} />
      
      <h2 className="text-xl font-bold mb-4">Debug Information</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-2">Element Counts</h3>
        <ul className="list-disc pl-6">
          {elements.map((item, i) => (
            <li key={i}>
              <span className="font-medium">{item.selector}:</span> {item.count}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-2">Body Classes</h3>
        <pre className="bg-gray-800 p-4 rounded text-xs">{bodyClasses}</pre>
      </div>
      
      <Button 
        onClick={() => setShowDebug(false)}
        variant="outline"
        className="mt-4"
      >
        Close Debug
      </Button>
    </div>
  );
}