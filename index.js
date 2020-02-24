
const express = require('express')
const path = require('path')
const fs = require('fs')
const app = express()
const port = 3000;
const WebSocketServer = require('ws').Server;

const readConfig = () => {
  let schedule;

  try {
    schedule = JSON.parse(fs.readFileSync('days.json'));
  } catch(error) {
    return null;
  }

  return {
    schedule,
    startDate: new Date(2020, 1, 27),
  };
}

const extractLectureSchedule = (config) => {
  const startDate = config.startDate;
  const schedule = config.schedule;

  const addDays = (date, numberOfDays) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + numberOfDays);
    return newDate;
  }

  const addTime = (date, timestring) => {
    const h = parseInt(timestring.split(":")[0]);
    const m = parseInt(timestring.split(":")[1]);
    const newDate = (h > 6 ? new Date(date) : addDays(date, 1));
    newDate.setHours(h);
    newDate.setMinutes(m);
    return newDate;
  }

  let id = 0;
  const events = schedule.flatMap((day) => {
    const daysToNum = {
      "Czwartek": 0,
      "Piątek": 1,
      "Sobota": 2,
      "Niedziela": 3,
    }

    const date = addDays(startDate, daysToNum[day.name]);
    const lectures = day.events
      .filter((event) => {
        return event.type == "LECTURE";
      })
      .map((event) => {
        const startTime = addTime(date, event.startTime);
        const endTime = addTime(date, event.endTime);
        id += 1;
        return {
          ...event,
          startTime,
          endTime,
          id,
        }
      });
    return lectures;
  });

  return events;
}

const config = readConfig();
if (!config) {
  return 1;
}

const lectureSchedule = extractLectureSchedule(config);

app.use('/css', express.static('css'));
app.use('/dist', express.static('dist'));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'app.html')));
app.get('/recording_overlay', (req, res) => 
    res.sendFile(path.join(__dirname, 'recording_overlay', 'index.html')))

app.use(express.static('recording_overlay'));

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

const wss = new WebSocketServer({port: 40510})

let ws_connections = [];

let currentLecture = {
  id: 0,
  state: "waiting",
}

const updateCurrentLecture = (lecture) => {
  const ids = lectureSchedule.map(lecture => lecture.id);
  const states = ["waiting", "started", "finished"];
  if (!lecture.id || !lecture.state)
  {
    console.error("Received invalid lecture:", lecture);    
    return;
  }

  if (!ids.includes(lecture.id))
  {
    console.error("Invalid lecture id:", lecture.id);
    return;
  }

  if (!states.includes(lecture.state))
  {
    console.error("Invalid lecture state:", lecture.state);
    return;
  }

  currentLecture = lecture;
  ws_connections.forEach(ws => ws.send(JSON.stringify(
    { type: "update_current_lecture", 
      data: currentLecture})));
}

wss.on('connection', function (ws) {
  ws_connections.push(ws);
  ws.on('message', function (message) {
    const handlers = {
      "update_current_lecture": updateCurrentLecture,
    }
    console.log(message);
    const data = message;
    let json;
    try {
      json = JSON.parse(data);
    } catch (error) {
      console.error("Failed to parse message:", error);
      return;
    }

    if (!json.type) {
      console.error("Message has no type");
      return;
    }
    
    const handler = handlers[json.type];
    if (!handler) {
      console.error("Unknown message type:", json.type);
      return;
    }

    return handler(json.data); 
  })
  ws.send(JSON.stringify({
    type: 'update_schedule',
    data: lectureSchedule,
  }));
})
