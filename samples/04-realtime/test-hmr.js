const http = require('http');
const next = require('next');

const app = next({ dev: true, dir: "." });
app.prepare().then(() => {
  const handle = app.getRequestHandler();
  const server = http.createServer((req, res) => handle(req, res));
  
  // Let's see how many upgrade listeners are attached after a request
  server.listen(3006, () => {
    console.log("Listening 3006. Upgrade listeners:", server.listenerCount('upgrade'));
    
    // Simulate a request to trigger lazy initialization
    fetch('http://localhost:3006/').then(() => {
        console.log("After request. Upgrade listeners:", server.listenerCount('upgrade'));
        process.exit();
    });
  });
});
