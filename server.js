const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeaves, getRoomUsers } = require('./utils/user');


const app  = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static
app.use(express.static(path.join(__dirname,'public')));

const botName = "ChatBot";
// Run when a client connects
io.on('connection',(socket)=>{
    socket.on('joinRoom',({username,room})=>{
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);
        // Welcome current user
        socket.emit('message',formatMessage(botName,'Welcome to RealChat!'));
        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message',formatMessage(botName, `${user.username} has joined the chat`));
        
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users:getRoomUsers(user.room)
        })

    });
    

    // Listen for chat message 
    socket.on('chatMessage',(msg)=>{
        const user = getCurrentUser(socket.id)
        io.to(user.room).emit('message',formatMessage(user.username,msg));
    });

    // Runs when client disconnects
    socket.on('disconnect',()=>{
        const user = userLeaves(socket.id);
        if(user){
            io.to(user.room).emit('message',formatMessage(botName,`${user.username} has left the chat`));
            io.to(user.room).emit('roomUsers',{
                room:user.room,
                users:getRoomUsers(user.room)
            })
        }
    });
})







const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=> console.log(`Server started on PORT ${PORT}`));