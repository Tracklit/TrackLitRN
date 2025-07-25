// Simple test page to isolate the crash issue
export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Test Page</h1>
        <p className="text-muted-foreground">This is a simple test page without authentication</p>
      </div>
    </div>
  );
}