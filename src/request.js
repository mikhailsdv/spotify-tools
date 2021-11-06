const axios = require("axios")

const request = axios.create({
	timeout: 15000,
	withCredentials: true,
})

module.exports = request