export default function MinimalTest() {
  return (
    <div style={{ padding: '20px', color: 'white', background: 'black', minHeight: '100vh' }}>
      <h1>Minimal Test Page</h1>
      <p>If you can see this, React is working.</p>
      <button onClick={() => alert('Button works!')}>Test Button</button>
    </div>
  );
}