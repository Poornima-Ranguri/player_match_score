const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const app = express();
const databasePath = path.join(__dirname, "cricketMatchDetails.db");
let database = null;

app.use(express.json());

const initializeDbAndServer = async () => {
  database = await open({
    filename: databasePath,
    driver: sqlite3.Database,
  });
  app.listen(3000, () => {
    console.log("Server is Running at localhost//3000");
  });
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//API 1

app.get("/players/", async (request, response) => {
  const getplayerDetails = `
        SELECT
          *
        FROM
        player_details;
    `;
  const playersArray = await database.all(getplayerDetails);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//API 2

app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
        SELECT 
          *
        FROM
            player_details
        WHERE 
            player_id = ${playerId};    
    `;

  const getPlayer = await database.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(getPlayer));
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
        UPDATE
            player_details
        SET
            player_name = '${playerName}'
        WHERE 
            player_id = ${playerId};    
  `;
  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
        SELECT 
          *
        FROM
            match_details 
        WHERE
            match_id = ${matchId};
    `;
  const matchResult = await database.get(getMatchQuery);
  response.send(convertMatchObjectToResponseObject(matchResult));
});

//API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
        SELECT 
          *
        FROM player_match_score
        NATURAL JOIN match_details
        WHERE
            player_id = ${playerId};
    `;
  const matches = await database.all(getMatchesQuery);
  response.send(
    matches.map((eachMatch) => convertMatchObjectToResponseObject(eachMatch))
  );
});

//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerQuery = `
        SELECT
           player_details.player_id ,
           player_details.player_name 
        FROM player_match_score 
        NATURAL JOIN player_details
        WHERE 
            match_id = ${matchId};



    `;
  const player = await database.all(getPlayerQuery);
  response.send(
    player.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScore = `
    SELECT
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes 
        FROM player_details INNER JOIN player_match_score ON 
        player_details.player_id = player_match_score.player_id
        WHERE 
            player_details.player_id = ${playerId};



    `;
  const getPlayer = await database.get(getPlayerScore);
  response.send(getPlayer);
});

module.exports = app;
