import express from "express";
import request from "request";

const app: express.Application = express();
const port: number = 3000;
const DRUID_SQL_URL: string = "http://localhost:8082/druid/v2/sql/";
const LATEST_DATA_QUERY: any = {
  query: "SELECT * FROM INITIAL_DATA WHERE __time >= FLOOR(CURRENT_TIMESTAMP TO minute)"
};

function handleLatestData(req: express.Request, res: express.Response): void {
  request.post(DRUID_SQL_URL, (error: any, _response: request.Response, body: string) => {
    if (body) {
      console.log(body)
      res.contentType("json");
      res.send(body);
    } else {
      console.log(error);
      res.sendStatus(400);
      res.send("error connecting to druid");
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
