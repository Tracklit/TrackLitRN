import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

function TestApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Test React App</h1>
        <p>If you can see this, React is working!</p>
        <p>Current time: {new Date().toLocaleTimeString()}</p>
      </div>
    </QueryClientProvider>
  );
}

export default TestApp;