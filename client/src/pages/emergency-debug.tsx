// Emergency debug page to test React without any complex dependencies
export default function EmergencyDebug() {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#ff0000', 
      color: 'white',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>Emergency Debug Page</h1>
      <p>If you see this, React is working!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
      <button 
        onClick={() => alert('Button click works!')}
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
  );
}