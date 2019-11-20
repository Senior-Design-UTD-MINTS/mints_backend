To run the server, run
```
npm start
```

**endpoints**

**sensors**

*queryParams*: None

*description*: returns: all of the table names to supply as the sensor query param for other endpoints

**latestData**

*queryParams*: 

  - sensor: maps to the table name in druid (in our case it's just MINTS_<mints_sensor_id>

*description*: returns the latest data for that sensor. Not guaranteed to be the latest so check the dateTime timestamp

**intervalData**
*queryParams*:

  - sensor: same as before
  - start: start date
  - end: end date

*description*: 

 returns the data from that timeperiod. Since it returns multiple elements, it returns a JSON object with the field "entries" that stores the array of values
