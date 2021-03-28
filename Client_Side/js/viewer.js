const $RTCP = {};
const fileDetails = [
    {
        path : "test_dzi/sampleSlide_files/",
        format : 'jpeg',
        overlap : "1",
        tileSize : "254",
        height : "32914",
        width : "46000"
    },
    {
        path : "test_dzi/sampleSlideTwo_files/",
        format : "jpeg",
        overlap : "1",
        tileSize : "254",
        height : "17497",
        width : "15374"
    }
]

function getURLParams(){
    const url = decodeURIComponent(window.location.href);
    try{
        const jsonString = url.split('?')[1];
        console.log("Query String :" + jsonString + "\nQuery Object :");
        const query = JSON.parse(jsonString);
        console.log(query);

        if(query.action === 'start'){
            $RTCP.action = query.action;
            $RTCP.slideID = parseInt(query.slideID);
        } else if(query.action === "join"){
            $RTCP.action = query.action;
            $RTCP.roomID = parseInt(query.roomID);
        } else{
            throw err;
        }
        var userName = prompt('Enter Your Name :', '');
        if(userName === null){
            window.open('/', '_self');
        }
        $RTCP.userName = userName;
        console.log("User Name : " + $RTCP.userName);

        initializeSocketConnection();
    } 
    catch(err){
        alert("Invalid URL Query");
        window.open('/', '_self');
    }    
}

function initializeSocketConnection(){
    $RTCP.socket = io();
    
    addSocketEventListeners();
}

function addSocketEventListeners(){

    $RTCP.socket.on('connect', () =>{
        console.log('Connected to Server');
        console.log("Socket ID : " + $RTCP.socket.id);
        const sendThis = {
            action : $RTCP.action,
            userName : $RTCP.userName,
            roomID : $RTCP.roomID ,
            slideID : $RTCP.slideID
        };
        $RTCP.socket.emit('initialize', JSON.stringify(sendThis));
    });
    
    $RTCP.socket.on('room_Details', (jsonObject) => {
        const updateObject = JSON.parse(jsonObject);
        console.log("Current Room Details");
        console.log(updateObject);

        $RTCP.roomID = updateObject.roomID;
        $RTCP.slideID = updateObject.slideID;

        loadSlides(parseInt($RTCP.slideID));

        if($RTCP.action == "join"){
            initializePeer();
            
        } else{
            initializePeer();
        }
        
        
    });
    

    $RTCP.socket.on('newPeerAdd', (jsonObject) =>{
        console.log('Peer Added');
        const payload = JSON.parse(jsonObject);
        console.log("Peer Details added : ");
        console.log(payload);

        $RTCP.peerList.push({
            peerID : payload.peerID,
            socketID : payload.socketID,
            name : payload.name,
        });

        const sendThis = {
            to : payload.socketID,
            peerID : $RTCP.peer.id,
            socketID : $RTCP.socket.id,
            name : $RTCP.userName            
        };

        $RTCP.socket.emit('newPeerReply', JSON.stringify(sendThis));

    });

    $RTCP.socket.on('newPeerRevert', (jsonObject) =>{
        console.log('Peer Added');
        const payload = JSON.parse(jsonObject);
        console.log("Peer Details added : ");
        console.log(payload);

        $RTCP.peerList.push({
            peerID : payload.peerID,
            socketID : payload.socketID,
            name : payload.name,
        });
    });

    $RTCP.socket.on('MemberList', (str) => {
        console.log("Participants List Recieved");
        var memList = str.split(',');
        console.log(memList);
        const parent = document.getElementById("attendees");
        while(document.getElementsByClassName("attendance").length > 0){
            document.getElementsByClassName("attendance")[0].remove();
        }
        for(i = 0; i < memList.length; i++){
            const elem = document.createElement("DIV");
            elem.className = "attendance";
            elem.innerHTML = memList[i];
            parent.appendChild(elem);
        }
    });

    $RTCP.socket.on('disconnect', () =>{
        alert("Server Disconnected");
        window.open('/', '_self');
    });

    $RTCP.socket.on('exit', () => {
        alert('Invalid Room ID');
        window.open('/', '_self');
    });



    $RTCP.socket.on('chatReceive', (jsonObject) => {
        console.log("Message Received");
        const payload = JSON.parse(jsonObject);
        console.log("Message : ");
        console.log(payload);
        const dm = document.createElement("DIV");
        const author = document.createElement("SPAN");
        const content = document.createElement("SPAN");
        dm.id = "dm";
        author.id = "author";
        content.id = "content";
        author.innerHTML = payload.author;
        content.innerHTML = payload.content;
        dm.appendChild(author);
        dm.appendChild(content);
        document.getElementById("chatWindow").appendChild(dm);
    });

    $RTCP.socket.on('panUpdate', (jsonObject) =>{
        const payload = JSON.parse(jsonObject);
        console.log(payload);
        var newCenter = $RTCP.viewer.viewport.imageToViewportCoordinates(parseFloat(payload.x), parseFloat(payload.y));
        $RTCP.panState = false;
        $RTCP.viewer.viewport.panTo(newCenter);
        $RTCP.panState = true;
    });

    $RTCP.socket.on('zoomUpdate', (jsonObject) =>{
        const payload = JSON.parse(jsonObject);
        $RTCP.zoomState = false;
        $RTCP.viewer.viewport.zoomTo(parseFloat(payload.zoom));
        $RTCP.zoomState = true;
    });
    

    $RTCP.socket.on('peer disconnected', (peerID) => {
        for(i = 0; i < $RTCP.peerList.length; i++){
            if($RTCP.peerList[i].peerID == peerID){
                $RTCP.peerList[i] = $RTCP.peerList[$RTCP.peerList.length - 1];
                $RTCP.peerList.pop();
                break;
            }
        }
        try{
            if($RTCP.incomingCalls.hasOwnProperty(peerID)){
                $RTCP.incomingCalls[peerID].remove();
                delete $RTCP.incomingCalls[peerID];
            }
        }
        catch(err){
            console.log('No such incoming Call');
        }
    });

    $RTCP.socket.on('vfd', (jsonObject) => {
        const payload = JSON.parse(jsonObject);
        try{
            if($RTCP.incomingCalls.hasOwnProperty(payload.from)){
                $RTCP.incomingCalls[payload.from].remove();
                delete $RTCP.incomingCalls[payload.from];
            }
        }
        catch(err){
            console.log('No such incoming Call');
        }
    });

}

function loadSlides(index){
    $RTCP.viewer = OpenSeadragon({
        id: "openseadragonOne",
        prefixUrl: "openseadragon/images/",
        tileSources: {
            Image: {
                xmlns:    "http://schemas.microsoft.com/deepzoom/2009",
                Url:      fileDetails[index].path,
                Format:   fileDetails[index].format, 
                Overlap:  fileDetails[index].overlap, 
                TileSize: fileDetails[index].tileSize,
                Size: {
                    Height: fileDetails[index].height,
                    Width: fileDetails[index].width
                }
            }
        },
        autoHideControls:false
    });
    console.log("Slide Loaded");

    document.querySelector("[title = 'Go home' ").style.display = 'none';
    document.querySelector("[title = 'Toggle full page' ").style.display = 'none';

    $RTCP.panState = true;
    $RTCP.zoomState = true;

    $RTCP.viewer.addHandler('pan', function(event){
        if($RTCP.panState){
            var currCenter = $RTCP.viewer.viewport.viewportToImageCoordinates($RTCP.viewer.viewport.getCenter());
            var sendThis = {
                roomID : $RTCP.roomID,
                x : currCenter.x,
                y : currCenter.y
            };
            $RTCP.socket.emit('pan', JSON.stringify(sendThis));
        }        
    });

    $RTCP.viewer.addHandler('zoom', function(event){
        if($RTCP.zoomState){
            var sendThis = {
                roomID : $RTCP.roomID,
                zoom : $RTCP.viewer.viewport.getZoom()
            };
            $RTCP.socket.emit('zoom', JSON.stringify(sendThis));
        }        
    });

}

function initializePeer(){
    $RTCP.peer = new Peer($RTCP.socket.id, {
        host: "localhost",
        port: 9000,
        path: '/peerjs'
    });
    
    
    $RTCP.peerList = [];
    $RTCP.calls = [];
    $RTCP.incomingCalls = [];
    $RTCP.outgoingCalls = [];
    $RTCP.videoElements = [];
    addPeerEventListeners();
}

function addPeerEventListeners(){

    $RTCP.peer.on('open', function(id) {

        console.log('Peer ID Created : ' + $RTCP.peer.id);

        console.log($RTCP.peer.id);
        if($RTCP.action === 'join'){
            const sendThis = {
                roomID : $RTCP.roomID,
                name : $RTCP.userName,
                peerID : $RTCP.peer.id,
                socketID : $RTCP.socket.id
            };
            $RTCP.socket.emit('newPeer', JSON.stringify(sendThis));
        }
        

    });

    $RTCP.peer.on('call', call =>{

        console.log('Call Received');

        // $RTCP.calls.push(call);

        call.answer(null);

        const video = document.createElement('video');

        const videoWrapper = document.createElement('DIV');
        videoWrapper.className = 'videoWrapper';
        const nameTag = document.createElement('SPAN');

        for(i = 0; i < $RTCP.peerList.length ; i++){
            if($RTCP.peerList[i].peerID == call.peer){
                nameTag.innerHTML = $RTCP.peerList[i].name;
                break;
            }
        }
        
        nameTag.className = 'nameTag';
        videoWrapper.appendChild(video);
        videoWrapper.appendChild(nameTag);
        

        // $RTCP.videoElements.push(video);

        $RTCP.incomingCalls[call.peer] = videoWrapper;

        call.on('stream', userVideoStream => { 
            addVideoStream(video, userVideoStream, videoWrapper);
        });

        call.on('close', () => {
            video.remove();
            console.log("Closing Incoming Call");
            // try{
            //     if($RTCP.localStream != null){
            //         const recall = $RTCP.peer.call(call.peer, $RTCP.localStream);
            //         $RTCP.calls.push(recall);
    
            //         const revideo = document.createElement('video');
            //         $RTCP.videoElements.push(revideo);
    
            //         recall.on('stream', userVideoStream => {
            //             addVideoStream(video, userVideoStream);
            //         });
                    
            //         recall.on('close', () => {
            //             video.remove();
            //         });
            //     }
            // }
            // catch(err){
            //     console.log('No active User');
            // }

        });
    });
}

function initializeProperties(){
    document.getElementById("attendees").style.display = "none";
    document.getElementById("messages").style.display = "none";
    document.getElementById("roomDetails").style.display = "none";
    document.getElementById("videoGallery").style.display = "none";
    $RTCP.webCam = false;
    $RTCP.localStream = null;
    $RTCP.videoGrid = document.getElementById('video-grid');
    addControlPanelEventListeners();
}

function addVideoStream(video, stream, videoWrapper) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
    $RTCP.videoGrid.append(videoWrapper);
}

function addControlPanelEventListeners(){

    document.getElementById("leaveMeeting").addEventListener('click', () => {
        window.open('/', '_self');
    });

    document.getElementById("copyToClipboard").addEventListener('click', () =>{
        var str = document.getElementById("cid").innerHTML;
        const el = document.createElement('textarea');
        el.value = str;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        showMessage("Conference ID Copied")
        document.body.removeChild(el);
    });

    document.getElementById("meetingDetails").addEventListener('click', () =>{
        hideSidePanels(true, false, true, true);
        if(document.getElementById("roomDetails").style.display === "none"){
            document.getElementById("roomDetails").style.display = "block";
            document.getElementById("meetingDetails").style.color = "#212529";
            document.getElementById("meetingDetails").style.backgroundColor = "white";
            document.getElementById("cid").innerHTML = $RTCP.roomID;
            document.getElementById("uname").innerHTML = $RTCP.userName;
            document.getElementById("sname").innerHTML = $RTCP.slideID == 0 ? "Sample Slide One" : "Sample Slide Two";

        } else{
            document.getElementById("roomDetails").style.display = "none";
            document.getElementById("meetingDetails").style.color = "";
            document.getElementById("meetingDetails").style.backgroundColor = "";
        }
    });

    document.getElementById("participants").addEventListener('click', () => {
        hideSidePanels(false, true, true, true);
        if(document.getElementById("attendees").style.display === "none"){
            document.getElementById("attendees").style.display = "block";
            document.getElementById("participants").style.color = "#212529";
            document.getElementById("participants").style.backgroundColor = "white";
            $RTCP.socket.emit('requireMemberList', $RTCP.roomID);
        } else{
            document.getElementById("attendees").style.display = "none";
            document.getElementById("participants").style.color = "";
            document.getElementById("participants").style.backgroundColor = "";
        }
    });

    document.getElementById("chat").addEventListener('click', () => {
        hideSidePanels(true, true, false, true);
        if(document.getElementById("messages").style.display === "none"){
            document.getElementById("messages").style.display = "grid";
            document.getElementById("textBox").focus();
            document.getElementById("chat").style.color = "#212529";
            document.getElementById("chat").style.backgroundColor = "white";
        } else{
            document.getElementById("messages").style.display = "none";
            document.getElementById("chat").style.color = "";
            document.getElementById("chat").style.backgroundColor = "";
        }
    });

    document.getElementById("sendMessage").addEventListener('click', () =>{
        var str = document.getElementById("textBox").value.trim();
        if(str !== ""){
            const dm = document.createElement("DIV");
            const author = document.createElement("SPAN");
            const content = document.createElement("SPAN");
            dm.id = "dm";
            author.id = "author";
            content.id = "content";
            author.innerHTML = "You";
            content.innerHTML = str;
            dm.appendChild(author);
            dm.appendChild(content);
            document.getElementById("chatWindow").appendChild(dm);
            document.getElementById("textBox").value = "";
            document.getElementById("textBox").focus();
            const payload = {
                roomID : $RTCP.roomID,
                author : $RTCP.userName,
                content : str
            }
            $RTCP.socket.emit('chatSend', JSON.stringify(payload));
        } else{
            document.getElementById("textBox").value = "";
            document.getElementById("textBox").focus();
        }
    });

    for(i = 0; i < 4; i++){
        document.getElementsByClassName('cross')[i].addEventListener('click', () => {
            hideSidePanels(true, true, true, true);
        });
    }

    document.getElementById("video").addEventListener('click', () =>{
        hideSidePanels(true, true, true, false);
        if(document.getElementById("videoGallery").style.display === "none"){
            document.getElementById("videoGallery").style.display = "grid";
            document.getElementById("video").style.color = "#212529";
            document.getElementById("video").style.backgroundColor = "white";

        } else{
            document.getElementById("videoGallery").style.display = "none";
            document.getElementById("video").style.color = "";
            document.getElementById("video").style.backgroundColor = "";
        }
    });  
    
    document.getElementById('toggleWebcam').addEventListener('click', () =>{


        if(!$RTCP.webCam){

            const myVideo = document.createElement('video');
            const videoWrapper = document.createElement('DIV');
            videoWrapper.className = 'videoWrapper';
            const nameTag = document.createElement('SPAN');
            nameTag.innerHTML = "You";
            nameTag.className = 'nameTag';
            videoWrapper.id = "user_" + $RTCP.userName;
            videoWrapper.appendChild(myVideo);
            videoWrapper.appendChild(nameTag);

            navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            }).then(stream => {
                $RTCP.localStream = stream;
                addVideoStream(myVideo, stream, videoWrapper);
                document.getElementById("toggleWebcam").style.color = "white";
                document.getElementById("toggleWebcam").style.backgroundColor = "#212529";
                $RTCP.webCam = true;

                // try{
                //     for(i = 0; i < $RTCP.calls.length ; i++){
                //         $RTCP.calls[i].close();
                //         $RTCP.videoElements[i].remove();
                //     }
                //     $RTCP.calls = [];
                //     $RTCP.videoElements = [];
                // }
                // catch(err){
                //     console.log('No active calls');
                // }
                
                for(i = 0 ; i < $RTCP.peerList.length; i++){
                    try{
                        console.log('Calling');

                        // $RTCP.calls = [];
                        // $RTCP.videoElements = [];
                        $RTCP.outgoingCalls = [];

                        const call = $RTCP.peer.call($RTCP.peerList[i].peerID, $RTCP.localStream);

                        const video = document.createElement('video');
                        const videoWrapper = document.createElement('DIV');
                        videoWrapper.className = 'videoWrapper';
                        const nameTag = document.createElement('SPAN');
                        nameTag.innerHTML = "You";
                        nameTag.className = 'nameTag';
                        videoWrapper.appendChild(video);
                        videoWrapper.appendChild(nameTag);

                        // $RTCP.outgoingCalls.push({
                        //     call : call,
                        // });

                        call.on('stream', userVideoStream => {
                            addVideoStream(video, userVideoStream, videoWrapper);
                        });
                        
                        call.on('close', () => {
                            video.remove();
                            // try{
                            //     if($RTCP.localStream != null){
                            //         const recall = $RTCP.peer.call(call.peer, $RTCP.localStream);
                            //         $RTCP.calls.push(recall);
                    
                            //         const revideo = document.createElement('video');
                            //         $RTCP.videoElements.push(revideo);
                    
                            //         recall.on('stream', userVideoStream => {
                            //             addVideoStream(video, userVideoStream);
                            //         });
                                    
                            //         recall.on('close', () => {
                            //             video.remove();
                            //         });
                            //     }
                            // }
                            // catch(err){
                            //     console.log('No active User');
                            // }                        
                        });
                    }
                    catch(err){
                        console.error(err);
                        console.error('User is offline');
                    }
                }

            }).catch(err => {
                console.error('Something went wrong while accessing WebCam');
            });



        } else{
            if($RTCP.localStream != null){
                $RTCP.localStream.getTracks().forEach( (track) => {
                    track.stop();
                });
                document.getElementById("toggleWebcam").style.color = "";
                document.getElementById("toggleWebcam").style.backgroundColor = "";
                document.getElementById("user_" + $RTCP.userName).remove();
                $RTCP.webCam = false;
                $RTCP.localStream = null;
                try{
                    const sendThis = {
                        from : $RTCP.peer.id,
                        roomID : $RTCP.roomID
                    }
                    // for(i = 0; i < $RTCP.outgoingCalls.length ; i++){
                        
                    //     // $RTCP.outgoingCalls[i].call.close();
                    //     sendThis.to.push($RTCP.outgoingCalls[i].call.peer);
                        
                    // }
                    $RTCP.socket.emit('videoFeed disconnected', JSON.stringify(sendThis));
                    $RTCP.outgoingCalls = [];
                }
                catch(err){
                    console.log('No active calls');
                }
            }
            
            
        }
    });

}

function showMessage(str){
    document.getElementById("alertBar").innerHTML = str;
    document.getElementById("alertBar").style.display = "block";
    setTimeout(
        function(){
            document.getElementById("alertBar").style.display = "none"; 
        }, 1100);
}

function hideSidePanels(attendance, info, chat, video){
    if(attendance){
        document.getElementById("attendees").style.display = "none";
        document.getElementById("participants").style.color = "";
        document.getElementById("participants").style.backgroundColor = "";
    }
    if(info){
        document.getElementById("roomDetails").style.display = "none";
        document.getElementById("meetingDetails").style.color = "";
        document.getElementById("meetingDetails").style.backgroundColor = "";
    }
    if(chat){
        document.getElementById("messages").style.display = "none";
        document.getElementById("chat").style.color = "";
        document.getElementById("chat").style.backgroundColor = "";
    }
    if(video){
        document.getElementById("videoGallery").style.display = "none";
        document.getElementById("video").style.color = "";
        document.getElementById("video").style.backgroundColor = "";
    }
    
}


getURLParams();
initializeProperties();