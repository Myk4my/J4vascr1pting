const express = require("express");
const fs = require("fs");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();

const PORT = process.env["NODE_PORT"] || 8000;
const DB_FILE = process.env["RPS_FILE"] || "rps.db";

// INIT/CREATE DATABASE
let db;
if (!fs.existsSync(DB_FILE)) {
	db = new sqlite3.Database(DB_FILE);
	db.run(`
		CREATE TABLE PLAYERLOG (
		id INTEGER PRIMARY KEY,
		player TEXT,
		playerChoice TEXT,
		computerChoice TEXT,
		outcome TEXT
		)
	`, (err) => {
		if (err) {
			console.log(err.message);
		} else {
			console.log("PLAYERLOG table created");
		}
	});
} else {
	db = new sqlite3.Database(DB_FILE);
}

// game logic
const beats = {
        rock: "scissors",
        paper: "rock",
        scissors: "paper"
}

function getComputerChoice()    {
        const choices = Object.keys(beats);
        const choiceIdx = Math.floor(Math.random() * choices.length);
        return choices[choiceIdx];
}

function play(playerChoice)     {
        // get comp choice
        const computerChoice = getComputerChoice();

        // decl result
        let result =    {
                computerChoice,
                outcome: ""
        };

        // determine outcome
        if(beats[playerChoice] === computerChoice) {
                result.outcome = "WIN";
        } else if(beats[computerChoice] === playerChoice) {
                result.outcome = "LOSS";
        } else {
                result.outcome = "DRAW";
        }
        return result;
}

function getPlayerLogs(player, callback)	{
	let playerLogs = db.all(`SELECT player, playerChoice, computerChoice, outcome FROM PLAYERLOG WHERE player = '${player}'`, 
		(err, rows) => {
			if (err) {
				console.log(err.message);
				callback([]);
			} else {
				callback(rows);
			}
		}
	);
}

function save(player, choice, result)	{
	db.run(`
		INSERT INTO PLAYERLOG (player, playerChoice, computerChoice, outcome)
		VALUES ('${player}','${choice}', '${result.computerChoice}', '${result.outcome}');
	`);
}

// App Middleware
app.use(express.json());
app.use(cors());

// Play API
app.post("/api/play", (req, res) => {
	const {player, choice} = req.body;
	const result = play(choice);
	save(player, choice, result);
	res.send(JSON.stringify(result));
});

// Logs API
app.post("/api/logs", (req, res) => {
	const player = req.body.player;
	getPlayerLogs(player, playerLogs => {
		console.log(playerLogs);
		res.send(JSON.stringify(playerLogs));
	});
});

// Listen
app.listen(PORT, () => {
	console.log(`Listening on ${PORT}`);
});

