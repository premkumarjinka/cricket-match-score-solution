const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server  running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT * FROM player_details ORDER BY player_id
    `;
  const getAllPlayersResponse = await db.all(getAllPlayersQuery);
  response.send(
    getAllPlayersResponse.map((eachPlayer) => {
      return {
        playerId: eachPlayer.player_id,
        playerName: eachPlayer.player_name,
      };
    })
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT * FROM player_details WHERE player_id=${playerId}
    `;
  const getPlayerResponse = await db.get(getPlayerQuery);
  response.send({
    playerId: getPlayerResponse.player_id,
    playerName: getPlayerResponse.player_name,
  });
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
  UPDATE player_details 
  SET player_name = "${playerName}"
  WHERE 
  player_id=${playerId};
  `;
  const updatePlayerResponse = await db.run(updatePlayerQuery);

  response.send("Player Details Updated");
});
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT * FROM  match_details WHERE match_id=${matchId}
    `;
  const getMatchResponse = await db.get(getMatchQuery);
  response.send({
    matchId: getMatchResponse.match_id,
    match: getMatchResponse.match,
    year: getMatchResponse.year,
  });
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
  SELECT  * FROM player_match_score NATURAL JOIN match_details 
  WHERE player_id=${playerId}
  `;
  const playerMatches = await db.all(getMatchesQuery);
  response.send(
    playerMatches.map((eachMatch) => {
      return {
        matchId: eachMatch.match_id,
        match: eachMatch.match,
        year: eachMatch.year,
      };
    })
  );
});

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT * FROM player_match_score 
    NATURAL JOIN player_details
    WHERE match_id=${matchId}
    `;
  const matchPlayers = await db.all(getMatchPlayersQuery);
  response.send(
    matchPlayers.map((eachPlayerMatch) => {
      return {
        playerId: eachPlayerMatch.player_id,
        playerName: eachPlayerMatch.player_name,
      };
    })
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getSumQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  console.log("hai");
  const getSumResponse = await db.get(getSumQuery);
  console.log(getSumResponse);
  response.send(getSumResponse);
});

module.exports = app;
