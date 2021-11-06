const {openURL} = require("./utils")
const db = require("./db")
const prompts = require("prompts")
const puppeteer = require("puppeteer-extra")
const StealthPlugin = require("puppeteer-extra-plugin-stealth")
puppeteer.use(StealthPlugin())

const auth = spotifyApi => new Promise(resolve => {
	;(async () => {
		try {
			const dbAuthInfo = {
				accessToken: db.get("accessToken"),
				refreshToken: db.get("refreshToken"),
			}
			if (dbAuthInfo.accessToken && dbAuthInfo.refreshToken) {
				spotifyApi.setAccessToken(dbAuthInfo.accessToken)
				spotifyApi.setRefreshToken(dbAuthInfo.refreshToken)
				return resolve(dbAuthInfo)
			}

			const answers = await prompts([
				{
					type: "confirm",
					name: "start",
					message: "Before we start you should authorize your Spotify. The browser will open. Grant access then copy the full url from the address bar and paste here. Hit Enter to continue.",
					initial: true,
				},
			])
			if (answers.start !== true) {
				console.log("Ok. Aborting...")
				return resolve(false)
			}

			const url = await spotifyApi.createAuthorizeURL([
				"ugc-image-upload",
				"user-read-recently-played",
				"user-top-read",
				"user-read-playback-position",
				"user-read-playback-state",
				"user-modify-playback-state",
				"user-read-currently-playing",
				"app-remote-control",
				"streaming",
				"playlist-modify-public",
				"playlist-modify-private",
				"playlist-read-private",
				"playlist-read-collaborative",
				"user-follow-modify",
				"user-follow-read",
				"user-library-modify",
				"user-library-read",
				"user-read-email",
				"user-read-private",
			])
			const browser = await puppeteer.launch({ headless: false })
			const page = await browser.newPage()
			await page.goto(url, {
				waitUntil: "networkidle2",
			})

			page.on("framenavigated", async frame => {
				const frameUrl = frame.url()
				if (/https:\/\/example\.com\/\?code/.test(frameUrl)) {
					const code = frame.url().replace(/.+?\/\?code=/, "")
					browser.close()

					const response = await spotifyApi.authorizationCodeGrant(code)
					const result = {
						accessToken: response.body.access_token,
						refreshToken: response.body.refresh_token
					}
					spotifyApi.setAccessToken(result.accessToken)
					spotifyApi.setRefreshToken(result.refreshToken)
					db.set("accessToken", result.accessToken)
					db.set("refreshToken", result.refreshToken)
					return resolve(result)
				}
			})
		}
		catch(err) {
			console.log("Couldn't authorize. Try again.")
			return resolve(false)
		}
	})()
})

module.exports = auth