// Add a simple debug route that bypasses everything
const debugRoute = (req, res, next) => {
  if (req.path === '/simple-test') {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Simple Test</title></head>
      <body>
        <h1>Simple Server Test Working!</h1>
        <p>Time: ${new Date().toISOString()}</p>
        <script>
          console.log("Basic JavaScript working");
          document.body.style.backgroundColor = "#00ff00";
        </script>
      </body>
      </html>
    `);
    return;
  }
  next();
};

module.exports = { debugRoute };