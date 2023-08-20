const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
let db = null;
dbPath = path.join(__dirname, "covid19India.db");
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API-1 (Returns a list of all states in the state table)

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT *
    FROM state
    ORDER BY 
    state_id;
    `;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => ({
      stateId: eachState.state_id,
      stateName: eachState.state_name,
      population: eachState.population,
    }))
  );
});

//API-2 (Returns a state based on the state ID)

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
  SELECT * FROM state 
  WHERE state_id=${stateId};`;

  const state = await db.get(getStateQuery);
  response.send({
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  });
});

//API-3(Create a district in the district table, district_id is auto-incremented)

app.post("/districts/", (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const addDistrictDetails = `
  INSERT INTO 
  district(district_Name,
    state_id,
    cases,
    cured,
    active,
    deaths)
    VALUES( '${districtName}',
    '${stateId}',
    '${cases}',
    '${cured}',
    '${active}',
    '${deaths}');`;
  const dbResponse = db.run(addDistrictDetails);
  response.send("District Successfully Added");
});

//API-4 (Returns a district based on the district ID)

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
  SELECT *
   FROM  
      district 
   WHERE district_id=${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send({
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  });
});

//API-5 (Deletes a district from the district table based on the district ID)

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
  DELETE FROM district
  WHERE district_id=${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API-6 (Update the details of a specific district based on the district ID)
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const updateDistrictDetails = `
  UPDATE district 
  SET 
            "district_name"='${districtName}',
            "state_id"='${stateId}',
            "cases"='${cases}',
            "cured"='${cured}',
            "active"='${active}',
            "deaths"='${deaths}'
  WHERE district_id=${districtId};`;

  await db.run(updateDistrictDetails);
  response.send("District Details Updated");
});

//API-7 (Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID)
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesStatsQuery = `
  SELECT 
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
  FROM 
      district 
  WHERE 
      state_id=${stateId};`;
  const stats = await db.get(getStatesStatsQuery);
  console.log(stats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API-8 (Returns an object containing the state name of a district based on the district ID)
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
  SELECT 
    state_id 
  FROM
    district
  WHERE 
    district_id=${districtId};`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);

  const getStateNameQuery = `
  SELECT 
   state_name as stateName 
 FROM 
   state
 WHERE 
    state_id=${getDistrictIdQueryResponse.state_id};`;

  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
