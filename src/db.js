const fs = require("fs")
const path = require("path")
const dbfile = path.resolve(__dirname, "./db.json")

const db = {
	read: () => {
		return JSON.parse(fs.readFileSync(dbfile))
	},
	write: json => {
		fs.writeFileSync(dbfile, JSON.stringify(json))
	},
	get: key => {
		let dbjson = db.read()
		return dbjson[key]
	},
	set: (key, value) => {
		let dbjson = db.read()
		dbjson[key] = value
		db.write(dbjson)
	}
}

module.exports = db