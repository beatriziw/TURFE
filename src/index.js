const express = require('express');
const http = require('http');

const app = express();
app.use(express.static('public'));
const server = http.createServer(app);

const host = '0.0.0.0';
const port = 3000;

server.listen(port, host, function () {
  console.log(`Server running at http://localhost:${port}`);
});
