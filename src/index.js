const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.static('public'));
const server = http.createServer(app);

const host = '0.0.0.0';
const port = 3000;

server.listen(port, host, function () {
  console.log(`Server running at http://localhost:${port}`);
});

const io = new Server(server, {
  cors: { origin: '*' }
});

let totalHorses = 0;
let totalLaps = 0;

let horses = [];

io.on('connection', (socket) => {
  console.log(`user connected: ${socket.id}`);

  socket.on('settings', ({ horses, laps }) => {
    totalHorses = horses;
    totalLaps = laps;

    io.emit('open', laps);

    console.log(`waiting players - total horses: ${totalHorses}, total laps: ${totalLaps}`);
  });

  socket.on('register', ({ name, style }) => {
    if (horses.length >= totalHorses) return;

    horses.push({
      id: socket.id,
      name,
      style,
      laps: []
    });

    if (horses.length >= 2) ready = true;

    console.log('horses: ', horses);
  });

  socket.on('disconnect', () => {
    console.log(`user disconnected: ${socket.id}`);
  });
});
