const path = require("path");

module.exports = {
	migration: path.join(__dirname, "./migration.js"),
	seed: path.join(__dirname, "./seed.js")
};