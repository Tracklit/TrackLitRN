// Ultra-simple debug page with no dependencies
export default function DebugSimple() {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#000', 
      color: '#fff', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>Debug Page Working!</h1>
      <p>If you see this, the React app is loading correctly.</p>
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => alert('JavaScript is working!')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Button
        </button>
      </div>
    </div>
  );
}