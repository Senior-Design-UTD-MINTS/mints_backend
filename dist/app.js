"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const request_1 = __importDefault(require("request"));
const cors_1 = __importDefault(require("cors"));
const app = express_1.default();
const port = 3000;
const DRUID_SQL_URL = "http://localhost:8082/druid/v2/sql/";
const LATEST_DATA_QUERY = {
    query: "SELECT __time as dateTime, Latitude, Longitude, PM1, PM2_5, PM4, PM10, PMTotal, Temperature, Humidity FROM INITIAL_DATA ORDER BY __time DESC LIMIT 1"
};
const TABLE_NAME_QUERY = {
    query: "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'TABLE'"
};
function handleLatestData(req, res) {
    request_1.default.post(DRUID_SQL_URL, (error, _response, body) => {
        if (body) {
            let str = JSON.stringify(body);
            let jsonResult = str.substring(1, str.length - 1);
            res.contentType("json");
            res.send(jsonResult);
        }
        else {
            console.log(error);
            res.sendStatus(500);
            res.send({ error: "Error connecting to database" });
        }
    }).json(LATEST_DATA_QUERY);
}
function handleIntervalData(req, res, firstDate, lastDate, sensor) {
    var INTERVAL_DATA_QUERY = { query: "SELECT __time as dateTime, Latitude, Longitude, PM1, PM2_5, PM4, PM10, PMTotal, Temperature, Humidity FROM MINTS_" + sensor + " WHERE __time > '" + firstDate + "' AND __time < '" + lastDate + "'" };
    if (isIsoDate(firstDate) && isIsoDate(lastDate)) {
        request_1.default.post(DRUID_SQL_URL, (error, _response, body) => {
            if (body) {
                console.log(body);
                res.contentType("json");
                res.send(body);
            }
            else {
                console.log(error);
                res.sendStatus(400);
                res.send("error connecting to druid");
            }
        }).json(INTERVAL_DATA_QUERY);
    }
    else {
        res.sendStatus(400);
        console.log("invalid arguments");
    }
}
function getSensors(req, res) {
    request_1.default.post(DRUID_SQL_URL, (error, _response, body) => {
        if (body) {
            console.log(body);
            res.contentType("json");
            res.send(body);
        }
        else {
            console.log(error);
            res.sendStatus(400);
            res.send("error connecting to druid");
        }
    }).json(TABLE_NAME_QUERY);
}
function isIsoDate(str) {
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str))
        return false;
    var d = new Date(str);
    return d.toISOString() === str;
}
// setting up server and routing
app.use(cors_1.default());
app.get("/sensors", getSensors);
app.get("/latestData", handleLatestData);
app.get("/intervalData", (req, res) => {
    handleIntervalData(req, res, "2019-10-06T20:12:30.000Z", "2019-11-06T20:12:30.000Z", "001e06305a12");
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
//# sourceMappingURL=app.js.map