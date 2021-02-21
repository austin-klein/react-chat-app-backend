const express = require('express');

const http = require('http');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*'
  }
});
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users.js');

const PORT = process.env.PORT || 5000;

const router = require('./router');

app.use(router);
app.use(cors());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});


io.on('connection', (socket) => {
  console.log('new connection');

  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    socket.emit('message', {
      user: 'ChatBot',
      text: `Hello ${user.name}, welcome to ${user.room}`,
    });

    socket.broadcast.to(user.room).emit('message', { user: 'ChatBot', text: `${user.name}, has joined the chat` });

    socket.join(user.room);

    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('message', { user: user.name, text: message });
    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', { user: 'ChatBot', text: `${user.name} has left the chat` });
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })
    }

  });
});



server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
