# Real_time_Collaborative_Pathology_code_Challenge
This Repository is my submission of the code challenge for the GSoC 2021 proposed project Real Time Collaborative Pathology by caMicroscope

**Please do watch this demo video to understand the workflow :** 
 [Demo Video](https://drive.google.com/file/d/1uNPM9OFe_gXdHaIYgR8oPxngUTi1q4Hq/view?usp=sharing)

# Instructions for running the code

***Please Run the Web Application in Google Chrome as it's been tested for Chrome only as of now***

1. Clone this repository ( **Note this repository is large only because of the sample slides I chose which are around 200MB in size**)
2. In this directory run **docker-compose -f develop.yml build**.
3. After this run **docker-compose -f develop.yml up**.

(**Note that peer server is running on port *9000*, socket server is running on port *8000* and the web application is running on port *3000*.**)

6. Go to the browser and open **http://localhost:3000/**

# Explanation of my Implementation of the code challenge
Although, the code challenge was just the chat app, I instead developed a basic prototype for the Real Time Collaborative Pathology Project which includes chat, basic video call (*I have not implemented audio in this prototype intentionally*),
viewing participants list and syncing of Panning and Zooming of the Openseadragon instances.
## Workflow of my Project is as follows :
1. On the Home Page you will see two options
  - Start Digital Slide Conference : Select any slide and then click on this option. This basically creates a new Room(socket.io) for the meeting.
  - Join Conference : This option will let you join a running meeting after you provide the Room ID.
 
2. After starting or joining a meeting you see the slide and the following options :

| Icon Image | Title | Function |
|------------|-------|----------|
|![](https://fonts.gstatic.com/s/i/materialicons/description/v4/24px.svg)| Meeting Details | Details of the meeting, **most important is Conference ID which is needed by anyone who wants to join a meeting** |
|![](https://fonts.gstatic.com/s/i/materialicons/rss_feed/v4/24px.svg)| Video Gallery | Click this to see incoming video and you can also start your own video by clicking the video camera icon which appears after clicking this |
|![](https://fonts.gstatic.com/s/i/materialicons/chat/v4/24px.svg)| Chat| Send Broadcast messages to people in the meeeting (in the room basically) |
|![](https://fonts.gstatic.com/s/i/materialicons/people/v4/24px.svg)| Participants | List of People who are in the meeting (in the room basically)
|![](https://fonts.gstatic.com/s/i/materialicons/call_end/v4/24px.svg)| Leave Meeting | Leave Meeting (exit room) and go back to Home Page |
