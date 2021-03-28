const { info, debug } = require('console');
const { query } = require('express');
const express = require('express');
const path = require('path'); 
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);


const Conference_Rooms = [];
const Room_Details = [];

function printRoomDetails(){
    console.log('-----x----------BEGIN ROOM DETAILS----------x-----');
    for(i = 1; i <= Room_Details.length; i++){
        console.log( i.toString() + '. Room ID : ' + Room_Details[i-1].roomID.toString() + ", Slide ID : " + Room_Details[i-1].slideID.toString() );
        console.log("   Members : ");
        for(j = 0; j < Room_Details[i-1].members.length; j++){
            console.log("   Socket ID : " + Room_Details[i-1].members[j].id + ", Name : " + Room_Details[i-1].members[j].name);
        }
    }
    console.log('-----x----------END ROOM DETAILS----------x-----');
}

app.use(express.static(__dirname + '/Client_Side'));

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.get('/', (req, res) =>{
    console.log('-----x----------x----------x-----');
    console.info("REQUEST : GET ;; ROUTE : '/'");
    res.sendFile(__dirname + '/home.html');
});

app.get('/viewer', (req, res) => {
    console.log('-----x----------x----------x-----');
    console.info("REQUEST : GET ;; ROUTE : '/viewer'");
    res.sendFile(__dirname + '/viewer.html');
});

app.get('/checkID', (req, res) =>{
    console.log('-----x----------x----------x-----');
    console.info("REQUEST : GET ;; ROUTE : '/checkID'");
    
    res.status(200);
    if(req.query.roomID){
        var searchThis = parseInt(req.query.roomID);
        if(Conference_Rooms.indexOf(searchThis) != -1){
            res.send("Valid");
            console.info("STATUS : Valid");
        } else{
            res.send("Invalid");
            console.info("STATUS : Invalid");
        }
    } else{
        res.send("Invalid");
        console.info("STATUS : Invalid");
    }
   
});

io.on('connection', (socket) => {

    console.log('-----x----------x----------x-----');

    console.log("NEW CONNECTION : " + socket.id);

    socket.on('initialize', (jsonObject) => {
        console.log('-----x----------x----------x-----');
        console.log("Event : initialize");
        console.debug("Socket ID : " + socket.id);
        const details = JSON.parse(jsonObject);
        console.log("Payload : ");
        console.debug(details);

        if(details.action === "start"){
            var tempRoomId = Math.floor((Math.random() * 100000) + 1);
            while(Conference_Rooms.indexOf(tempRoomId) != -1){
                tempRoomId++;
            }
            Conference_Rooms.push(tempRoomId);
            const MeetDetails = {
                roomID : tempRoomId.toString(),
                slideID : details.slideID,
                members : [
                    {
                        id : socket.id,
                        name : details.userName
                    }
                ]
            }
            console.log("New Meeting Details :");
            console.log(MeetDetails);
            Room_Details.push(MeetDetails);

            socket.join(MeetDetails.roomID);
            socket.emit('room_Details', JSON.stringify(MeetDetails));

        } else if(details.action === "join"){

            var index = Conference_Rooms.indexOf(parseInt(details.roomID));
            if(index != -1){
                Room_Details[index].members.push({
                    id : socket.id,
                    name : details.userName
                });
                printRoomDetails();
                
                socket.join(details.roomID.toString());
                socket.emit('room_Details', JSON.stringify(Room_Details[index]));

                var memList = [];
                for(i = 0; i < Room_Details[index].members.length; i++){
                    memList.push(Room_Details[index].members[i].name);
                }
                try{
                    io.in(Conference_Rooms[index].toString()).emit('MemberList', memList.toString());
                }
                catch(err){
                    console.log(err);
                }
                

            } else{
                socket.emit('exit');
            }

        }
    });



    socket.on('newPeer', (jsonObject) => {
        console.log('-----x----------x----------x-----');
        console.log("Event : newPeer");

        const payload = JSON.parse(jsonObject);
        console.log("Payload : ");
        console.log(payload);

        socket.to(payload.roomID.toString()).emit('newPeerAdd', jsonObject);
    });

    socket.on('newPeerReply', (jsonObject) =>{
        console.log('-----x----------x----------x-----');
        console.log("Event : newPeerReply");
        const payload = JSON.parse(jsonObject);
        console.log("Payload : ");
        console.log(payload);
        io.to(payload.to.toString()).emit('newPeerRevert', jsonObject);
    });

    socket.on('disconnect', () =>{

        console.log('-----x----------x----------x-----');
        console.log("Event : disconnect");
        console.log("Socket ID :" + socket.id);
        printRoomDetails()

        var roomIndex = -1;
        for(i = 0; i < Room_Details.length; i++){
            for(j = 0; j < Room_Details[i].members.length ; j++){
                var user = Room_Details[i].members[j];
                if(user.id == socket.id){
                    roomIndex = i;
                    break;
                }
            }
        }
        console.log("Room Index :" + (roomIndex).toString() );
        try{
            console.log("Room ID : " + Conference_Rooms[roomIndex]);

            io.in(Conference_Rooms[roomIndex].toString()).emit('peer disconnected', socket.id);

            if(Room_Details[roomIndex].members.length === 1){
                var tempRoomID = Conference_Rooms[Conference_Rooms.length - 1];
                var tempRoomDetails = Room_Details[Room_Details.length - 1];
                Conference_Rooms[roomIndex] = tempRoomID;
                Room_Details[roomIndex] = tempRoomDetails;
                Conference_Rooms.pop();
                Room_Details.pop();
            } 
            else{
                var userIndex = -1;
                for(j = 0; j < Room_Details[roomIndex].members.length ; j++){
                    var user = Room_Details[roomIndex].members[j];
                    if(user.id == socket.id){
                        userIndex = j;
                        break;
                    }
                }
                console.log("User Index : " + userIndex);
                var len = Room_Details[roomIndex].members.length;
                var tempUser = Room_Details[roomIndex].members[len - 1];
                Room_Details[roomIndex].members[userIndex] = tempUser;
                Room_Details[roomIndex].members.pop();
                var memList = [];
                for(i = 0; i < Room_Details[roomIndex].members.length; i++){
                    memList.push(Room_Details[roomIndex].members[i].name);
                }
                io.in(Conference_Rooms[roomIndex].toString()).emit('MemberList', memList.toString());
            }
        }
        catch(err){
            console.log(err);
        }
        console.log('Socket ID removed');
        printRoomDetails();

        
    });

    

    socket.on('requireMemberList', (str) => {
        console.log('-----x----------x----------x-----');
        console.log("Event : requireMemberList");
        console.log("Room ID : " + str);
        try{
            var index = Conference_Rooms.indexOf(parseInt(str));
            var memList = [];
            for(i = 0; i < Room_Details[index].members.length; i++){
                memList.push(Room_Details[index].members[i].name);
            }
            socket.emit('MemberList', memList.toString());
        }
        catch(err){
            console.error(err);
        }
    });

    socket.on('chatSend', (jsonObject) => {
        console.log('-----x----------x----------x-----');
        console.log("Event : chatSend");
        const payload = JSON.parse(jsonObject);
        console.log("Payload : ");
        console.log(payload);
        socket.to(payload.roomID.toString()).emit('chatReceive', jsonObject);
    });

    socket.on('pan', (jsonObject) => {
        const payload = JSON.parse(jsonObject);
        socket.to(payload.roomID.toString()).emit('panUpdate', jsonObject);
    });

    socket.on('zoom', (jsonObject) => {
        const payload = JSON.parse(jsonObject);
        socket.to(payload.roomID.toString()).emit('zoomUpdate', jsonObject);
    });

    socket.on('videoFeed disconnected', (jsonObject) => {
        console.log('-----x----------x----------x-----');
        console.log("Event : videoFeed disconnected");
        const payload = JSON.parse(jsonObject);
        console.log("Payload : ");
        console.log(payload);
        socket.to(payload.roomID).emit('vfd', JSON.stringify({
            from : payload.from
        }));
        
    });

    
});

http.listen('3000', () => {
    console.log('listening on Port 3000');
});