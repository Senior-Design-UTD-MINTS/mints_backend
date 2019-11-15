import express from "express";
import request from "request";
import cors from "cors";

const app: express.Application = express();
const port: number = 3000;
const DRUID_SQL_URL: string = "http://localhost:8082/druid/v2/sql/";
const TABLE_NAME_QUERY: any = {
  query: "SELECT TABLE_NAME as sensor FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'TABLE'"
};
const BASE_SENSOR_INFO_SELECT_CLAUSE: string = "SELECT __time as dateTime, Latitude, Longitude, PM1, PM2_5, PM4, PM10, PMTotal, Temperature, Humidity"

function handleLatestData(req: express.Request, res: express.Response): void {
  if (req.query.sensor) {
    let sensor: string = req.query.sensor;
    if (isSQLInjectionAttempt(sensor)) {
      res.sendStatus(400);
      res.send("bad sensor string");
      return;
    }
    let query_str: string = BASE_SENSOR_INFO_SELECT_CLAUSE + ` FROM ${sensor} ORDER BY __time DESC LIMIT 1`;
    request.post(DRUID_SQL_URL, (error: any, _response: request.Response, body: any) => {
      if (body) {
        // removing the array notation since it will only have 1 item
        let str: string = JSON.stringify(body);
        let jsonResult: string = str.substring(1, str.length - 1);
        res.contentType("json");
        res.send(jsonResult);
      } else {
        console.log(error);
        res.sendStatus(500);
        res.send({ error: "Error connecting to database" });
      }
    }).json({ query: query_str });
  } else {
    res.sendStatus(400);
    res.send("Provide a sensor id to query");
  }
}

function handleIntervalData(req: express.Request, res: express.Response): void {
  if (req.query.sensor && req.query.start && req.query.end) {
    let sensor: string = req.query.sensor;
    let startDate: Date = new Date(req.query.start);
    let endDate: Date = new Date(req.query.end);
    if (!startDate || !endDate) {
      res.sendStatus(400);
      res.send("Need valid dates for the start and end query params");
    } else if (isSQLInjectionAttempt(sensor)) {
      res.sendStatus(400);
      res.send("Bad sensor string");
    } else if (startDate > endDate) {
      res.sendStatus(400);
      res.send("Start date must start before end date");
    } else {
      let isoStartDate: string = startDate.toISOString();
      let isoEndDate: string = endDate.toISOString();
      let query_str: string = BASE_SENSOR_INFO_SELECT_CLAUSE + ` FROM ${sensor} WHERE __time >= '${isoStartDate}' AND __time <= '${isoEndDate}'`;
      request.post(DRUID_SQL_URL, (error: any, _response: request.Response, body: any) => {
        if (body) {
          res.contentType("json");
          res.send({ "entries": body });
        } else {
          console.log(error);
          res.sendStatus(400);
          res.send("error connecting to druid");
        }
      }).json({ query: query_str });
    }
  } else {
    res.sendStatus(400);
    console.log("invalid args");
  }
}

function getSensors(req: express.Request, res: express.Response): void {
  request.post(DRUID_SQL_URL, (error: any, _response: request.Response, body: any) => {
    if (body) {
      console.log(body);
      // we receive an array of { "sensors": "<SENSOR_ID>"}. 
      // we convert to an array of strings of the <SENSOR_ID> values
      let innerBody = body.map(x => `"${x.sensor}", `).reduce((acc, sensor) => acc + sensor);
      let withoutTrailingComma = innerBody.substring(0, innerBody.length - 2);
      let fin = `{ "sensors": [ ${withoutTrailingComma} ] }`;
      res.contentType("json");
      res.send(fin);
    } else {
      console.log(error);
      res.sendStatus(400);
      res.send("error connecting to druid");
    }
  }).json(TABLE_NAME_QUERY).toJSON;
}

function isSQLInjectionAttempt(s: string): boolean {
  return s.includes("--") || s.includes("\'");
}

// setting up server and routing
app.use(cors());
app.get("/sensors", getSensors);
app.get("/latestData", handleLatestData);
app.get("/intervalData", handleIntervalData);
app.get("/", (req, res) => {
  res.send("hello world");
});

app.listen(port, err => {
  if (err) {
    return console.error(err);
  }
  return console.log(`server is listening on port ${port}`);
});

