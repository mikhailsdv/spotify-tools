const {openURL} = require("./utils")
const db = require("./db")
const prompts = require("prompts")

const auth = async spotifyApi => {
	const dbAuthInfo = {
		accessToken: db.get("accessToken"),
		refreshToken: db.get("refreshToken"),
	}
	if (dbAuthInfo.accessToken && dbAuthInfo.refreshToken) {
		spotifyApi.setAccessToken(dbAuthInfo.accessToken)
		spotifyApi.setRefreshToken(dbAuthInfo.refreshToken)
		return dbAuthInfo
	}

	const answers = await prompts([
		{
			type: "confirm",
			name: "start",
			message: "Before we start you should authorize your Spotify. The browser will be opened. Grant access then copy the full url from the address bar and paste here. Hit Enter to continue.",
			initial: true,
			onState: async ({value, aborted}) => {
				openURL(await spotifyApi.createAuthorizeURL([
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
				]))
			},
		},
		{
			type: "text",
			name: "url",
			message: "Enter full url from the address bar",
			format: value => value.replace(/.+?\/\?code=/, ""),
		},
	])
	try {
		const response = await spotifyApi.authorizationCodeGrant(answers.url)
		const result = {
			accessToken: response.body.access_token,
			refreshToken: response.body.refresh_token
		}
		spotifyApi.setAccessToken(result.accessToken)
		spotifyApi.setRefreshToken(result.refreshToken)
		db.set("accessToken", result.accessToken)
		db.set("refreshToken", result.refreshToken)
		return result
	}
	catch(err) {
		console.log("Couldn't authorize. Try again.")
		return false
	}
}

module.exports = auth