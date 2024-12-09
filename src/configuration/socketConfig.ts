import http from 'http';
import { Server, Socket } from 'socket.io';

export default function configureSocket(server: http.Server): Server {
    const io = new Server(server);

    io.on('connection', (socket: Socket) => {
        console.log('A user connected');

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });

    });

    return io;
}
