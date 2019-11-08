import express from "express";
import request from "request";
import cors from "cors";

const app: express.Application = express();
const port: number = 3000;
const DRUID_SQL_URL: string = "http://localhost:8082/druid/v2/sql/";
const LATEST_DATA_QUERY: Object = {
  query: "SELECT __time as dateTime, Latitude, Longitude, PM1, PM2_5, PM4, PM10, PMTotal, Temperature, Humidity FROM INITIAL_DATA ORDER BY __time DESC LIMIT 1"
};
const TABLE_NAME_QUERY: any = {
  query: "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'TABLE'"
};

function handleLatestData(req: express.Request, res: express.Response): void {
  request.post(DRUID_SQL_URL, (error: any, _response: request.Response, body: any) => {
    if (body) {
      let str = JSON.stringify(body);
      let jsonResult = str.substring(1, str.length - 1);
      res.contentType("json");
      res.send(jsonResult);
    } else {
      console.log(error);
      res.sendStatus(500);
      res.send({ error: "Error connecting to database" });
    }
  }).json(LATEST_DATA_QUERY);
}

function handleIntervalData(req: express.Request, res: express.Response, firstDate: string, lastDate: string, sensor: string): void {
  var INTERVAL_DATA_QUERY: any = { query: "SELECT __time as dateTime, Latitude, Longitude, PM1, PM2_5, PM4, PM10, PMTotal, Temperature, Humidity FROM MINTS_" + sensor + " WHERE __time >= '" + firstDate + "' AND __time <= '" + lastDate + "'" }
  var first = new Date(firstDate);
  var last = new Date(lastDate);
  if (isIsoDate(firstDate) && isIsoDate(lastDate) && first <= last) {
    request.post(DRUID_SQL_URL, (error: any, _response: request.Response, body: string) => {
      if (body) {
        console.log(body)
        res.contentType("json");
        res.send(body);
      } else {
        console.log(error);
        res.sendStatus(400);
        res.send("error connecting to druid");
      }
    }).json(INTERVAL_DATA_QUERY);
  } else {
    res.sendStatus(400);
    console.log("invalid arguments");
  }
}

function getSensors(req: express.Request, res: express.Response): void {
  request.post(DRUID_SQL_URL, (error: any, _response: request.Response, body: string) => {
    if (body) {
      console.log(body)
      res.contentType("json");
      res.send(body);
    } else {
      console.log(error);
      res.sendStatus(400);
      res.send("error connecting to druid");
    }
  }).json(TABLE_NAME_QUERY);
}

function isIsoDate(str) {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
  var d = new Date(str);
  return d.toISOString() === str;
}


// setting up server and routing
app.use(cors());
app.get("/sensors", getSensors);
app.get("/latestData", handleLatestData);
app.get("/intervalData", (req, res) => {
  handleIntervalData(req, res, req.query.firstDate, req.query.lastDate, req.query.sensors);
});

app.get("/", (req, res) => {
  res.send("hello world");
});

app.listen(port, err => {
  if (err) {
    return console.error(err);
  }
  return console.log(`server is listening on port ${port}`);
});

