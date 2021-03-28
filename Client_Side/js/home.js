function toggle(str){
    const c1 = document.getElementById('s1');
    const c2 = document.getElementById('s2');
    count = 0;
    if(c1.checked){
        count += 1;
    }
    if(c2.checked){
        count += 1;
    }
    if(str === 's1'){
        if(count > 1){
            c1.checked = true;
            c2.checked = false;
            count -= 1;
        }
    }
    if(str === 's2'){
        if(count > 1){
            c1.checked = false;
            c2.checked = true;
            count -= 1;
        }
    }
}

document.getElementById("startConference").addEventListener("click", function(event){
    event.preventDefault();
    const checkedBoxes = [];
    const c1 = document.getElementById('s1');
    const c2 = document.getElementById('s2');
    if(c1.checked){
        checkedBoxes.push(0);
    }
    if(c2.checked){
        checkedBoxes.push(1);
    }
    if(checkedBoxes.length < 1){
        alert("Please Select a Slide for Slide Conferencing");
        location.reload();
    } else{
        const query = {
            action : 'start',
            slideID : c1.checked ? 0 : 1            
        };
        const address = '/viewer?' + JSON.stringify(query);
        window.open(address, '_self');
    }
});

document.getElementById("joinConference").addEventListener("click", function(event){
    event.preventDefault();
    var roomId = prompt("Please enter Conference ID : ", "");
    if(roomId != null){
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                if(this.responseText === "Valid"){
                    const query = {
                        action : 'join',
                        roomID : roomId
                    }
                    window.open('/viewer?' + JSON.stringify(query), '_self');
                } else{
                    alert('Invalid Conference ID')
                }
            }
        }; 
        xhttp.open("GET", "/checkID?roomID=" + roomId, true);
        xhttp.send();
    }
});