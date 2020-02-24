import ReactDom from 'react-dom';
import React, { useState, useContext } from 'react';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Nav from 'react-bootstrap/Nav';
import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import { Container, Row, Col, Spinner, ButtonGroup } from 'react-bootstrap';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import styled from 'styled-components';


const AppNavbar = () => {
  return (
    <Navbar bg="light" expand="lg">
      <Navbar.Brand href="/">Lecture Controller</Navbar.Brand>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
          <Link className="nav-link" role="button" to="/"> Dashboard </Link>
          <Link className="nav-link" role="button" to="/recording_layout"> Recording Layout </Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
}

const Home = () => {
  return (
    <h1> XDD </h1>
  );
}

const SideSpinner = styled.div`
    position: absolute;
    right: 20px;
    top: 20px;
`;

const Lecture = ({ lecture, current, onSetCurrentLecture }) => {
  const setCurrentLecture =
    (state) => () => onSetCurrentLecture({ id: lecture.id, state })
  return (
    <Card>
      <Card.Body>
        <Card.Title> {lecture.title} </Card.Title>
        <Card.Text>
          <i> {lecture.lecturer} </i> <br />
          start {(new Date(lecture.startTime)).toLocaleString()} <br />
          end {(new Date(lecture.endTime)).toLocaleString()} <br />
        </Card.Text>
        {current ?
          <ButtonGroup aria-label="Basic example">
            <Button onClick={setCurrentLecture("waiting")} variant="secondary"> Wait for Start </Button>
            <Button onClick={setCurrentLecture("started")} variant="success"> Start lecture </Button>
            <Button onClick={setCurrentLecture("stopped")} variant="primary">End lecture </Button>
          </ButtonGroup>
          :
          <div>
            <Button onClick={() => onSetCurrentLecture({ id: lecture.id, state: "waiting" })}>
              Wait for start
                        </Button>
          </div>
        }
      </Card.Body>
    </Card>
  )
}

const Schedule = ({ schedule, currentLecture, onSetCurrentLecture }) => {
  return (
    <Container>
      <Row>
        <Col>
          {schedule.map(lecture => (
            <Lecture
              key={lecture.id}
              lecture={lecture}
              current={lecture.id === currentLecture.id}
              onSetCurrentLecture={onSetCurrentLecture} />
          ))}
        </Col>
      </Row>
    </Container>
  );
}

const Lectures = () => {
  return (
    <div> XDDDDD </div>
  );
}

const Main = (props) => {
  return (
    <main>
      <Switch>
        <Route path="/">
          <Schedule {...props} />
        </Route>
      </Switch>
    </main>
  )
}

const useWebsocket = () => {

}

const CenterSpinner = styled.div`
    position: absolute;
    left: 50%;
    top: 50%;
`

const App = () => {
  const [wsStatus, setwsStatus] = useState('connecting');
  const [schedule, setSchedule] = useState(null)
  const [currentLecture, setCurrentLecture] = useState({
    id: 0,
    state: "waiting",
  })
  const ws = React.useRef(new WebSocket('ws://localhost:40510'));    // event emmited when connected
  const handleWsMessage = (ev) => {
    const handlers = {
      "update_schedule": setSchedule,
      "update_current_lecture": setCurrentLecture,
    }
    const data = ev.data;
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

    console.log(json);

    return handler(json.data);
  }

  const onSetCurrentLecture = (data) => {
    ws.current.send(JSON.stringify({ type: "update_current_lecture", data }));
  }

  React.useEffect(() => {
    ws.current.onopen = () => {
      setwsStatus('connected');
    }
    ws.current.onclose = () => {
      setwsStatus('closed');
    }
    ws.current.onmessage = handleWsMessage
  });

  if (wsStatus != "connected" || schedule == null) {
    return (
      <CenterSpinner>
        <Spinner animation="grow" role="status">
          <span className="sr-only">Loading...</span>
        </Spinner>
      </CenterSpinner>
    )
  }

  return (
    <Router>
      <Switch>
        <Route path="/recording_layout">
          Layout
        </Route>
        <Route>
          <AppNavbar>
          </AppNavbar>
          <Main {...{ schedule, currentLecture, onSetCurrentLecture }}></Main>
        </Route>
      </Switch>
    </Router>
  )
}

ReactDom.render(<App> </App>, document.getElementById('react-root'))
