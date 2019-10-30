import express from "express";
import request from "request";

const app: express.Application = express();
const port: number = 3000;
const DRUID_SQL_URL: string = "http://localhost:8082/druid/v2/sql/";
const LATEST_DATA_QUERY: Object = {
  query: "SELECT * FROM INITIAL_DATA ORDER BY __time DESC LIMIT 1"
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

app.get("/latestData", handleLatestData);
app.get("/", (req, res) => {
  res.send("hello world");
});

app.listen(port, err => {
  if (err) {
    return console.error(err);
  }
  return console.log(`server is listening on port ${port}`);
});
