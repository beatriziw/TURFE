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
let currentLap = 1;

let horses = [];

let ready = false;

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
      laps: [],
      totalTime: 0
    });

    if (horses.length >= 2) ready = true;

    io.emit('horses_qtt', horses.length);

    console.log('horses: ', horses);
  });

  socket.on('start', () => {
    if (!ready) {
      console.log(`error: ${horses.length} horses registered`);
      return;
    }

    io.emit('startted', totalLaps);

    console.log(`game started with ${horses.length} horses`);
  });

  socket.on('skill_used', (id) => {
    let max = 3;
    let min = 1;
    let interval = max - min;

    let player = horses.find((horse) => horse.id == socket.id);
    let target = horses.find((horse) => horse.id == id);

    if (player && target) {
      let r = Number((Math.random() * interval + min).toFixed(1));

      let prevTotalTime = target.totalTime;
      let updattedTotalTime = target.totalTime + r;
      let index = horses.findIndex((item) => item.id == player.id);

      horses[index].totalTime = updattedTotalTime;

      io.emit('skill_log', {
        player,
        target,
        prevTotalTime,
        updattedTotalTime
      });
    }

    return;
  });

  socket.on('play', () => {
    let max = 9;
    let min = 7;
    let interval = max - min;

    let horse = horses.find((horse) => horse.id == socket.id);

    if (horse) {
      let previousLap = horse.laps[horse.laps.length - 1];
      let r = Number((Math.random() * interval + min).toFixed(1));

      horse.laps.push({
        number: previousLap ? previousLap.number + 1 : 1,
        time: r
      });

      horse.totalTime += r;
    }

    if (horse && currentLap < totalLaps) {
      let r = Number((Math.random() * 9 + 1).toFixed());

      if (r % 4 == 0) {
        io.emit('skill_available', { playerId: socket.id, horses });
      }
    }

    if (check()) {
      currentLap++;

      if (currentLap > totalLaps) return io.emit('finish', { currentLap, horses });

      io.emit('next', { currentLap, horses });
      console.log(`lap done! going to lap ${currentLap}`);
    }

    return;
  });

  socket.on('disconnect', () => {
    console.log(`user disconnected: ${socket.id}`);
  });
});

function check() {
  if (horses.length === 0) return false;

  for (let i = 0; i < horses.length; i++) {
    let horse = horses[i];
    let previousLap = horse.laps[horse.laps.length - 1];

    if (!previousLap || previousLap.number < currentLap) {
      console.log(`Not ready for lap ${currentLap}: ${horse.name}`);
      return false;
    }
  }

  return true;
}
