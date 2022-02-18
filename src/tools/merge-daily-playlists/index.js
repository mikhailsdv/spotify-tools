const config = require("../../config")
const prompts = require("prompts")
//const fs = require("fs")
const {
	arrayChop,
	objToCookieString,
	//calcOffset,
	sleep,
	arrayShuffle,
	getDateString,
	loadAllPages,
} = require("../../utils")
const spotifyApi = require("../../spotify-api-module")
const request = require("../../request")
const puppeteer = require("puppeteer-extra")
const StealthPlugin = require("puppeteer-extra-plugin-stealth")
puppeteer.use(StealthPlugin())

const auth = () => new Promise(resolve => {
	;(async () => {
		try {
			const extractCookies = async page => {
				try {
					const cookies = await page.cookies()
					const tokens = {
						sp_key: null,
						sp_dc: null,
					}
					for (const item of cookies) {
						if (Object.keys(tokens).includes(item.name)) {
							tokens[item.name] = item.value
						}
					}
					if (Object.values(tokens).every(item => item !== null)) {
						return tokens
					}
					else {
						return false
					}
				}
				catch(err) {
					console.log(err)
					return false
				}
			}

			const browser = await puppeteer.launch({ headless: false })

			const page = await browser.newPage()

			await page.goto("https://accounts.spotify.com/en/login", {
				waitUntil: "networkidle2",
			})

			for (const event of ["response", "close"]) {
				page.on(event, async () => {
					const cookies = await extractCookies(page)
					if (cookies) {
						const userAgent = await browser.userAgent()
						await browser.close()
						resolve({
							cookies,
							userAgent,
						})
					}
				})
			}
		}
		catch(err) {
			resolve(false)
		}
	})()
})

;(async () => {
	try {
		const chooseMode = await prompts([
			{
				type: "select",
				name: "mode",
				message: "Choose filter mode:",
				choices: [
					{title: "Remove only my saved tracks from the final playlist"},
					{title: "Remove all the tracks from my library from the final playlist"},
				],
			},
		])
		if (chooseMode.mode === undefined) return

		console.log("\nBrowser will open. Please, log into your account.")
		await sleep(3000)

		const authData = await auth()
		if (!authData) {
			return console.log("Can't auth. Try again.")
		}

		console.log("\nGetting access token...")
		const response = await request({
			url: "https://open.spotify.com/get_access_token?reason=transport&productType=web_player",
			method: "get",
			headers: {
				"Cookie": objToCookieString(authData.cookies),
				"User-Agent": authData.userAgent,
			},
		})
		const accessToken = response.data.accessToken
		spotifyApi.setAccessToken(accessToken)
		//console.log("Access token:", accessToken)

		console.log("\nGetting daily mixes...")
		const madeForX = await request({
			url: "https://api.spotify.com/v1/views/made-for-x",
			method: "get",
			headers: {
				"Authorization": `Bearer ${accessToken}`,
			},
		})
		const dailyMixes = madeForX.data.content.items
		const dailyTracksIds = []
		for (const playlist of dailyMixes) {
			console.log(`Getting «${playlist.name}»...`)
			const playlistData = await spotifyApi.getPlaylist(playlist.id)
			dailyTracksIds.push(...playlistData.body.tracks.items.map(item => item.track.id))
		}
		console.log(`Collected ${dailyTracksIds.length} tracks.`)
		
		console.log("\nRemoving your saved tracks...")
		const containsMySavedTracks = []
		for (const chunk of arrayChop(dailyTracksIds, 50)) {
			const response = await spotifyApi.containsMySavedTracks(chunk)
			containsMySavedTracks.push(...response.body)
		}
		let filteredDailyTracksIds = dailyTracksIds.filter((_, index) => !containsMySavedTracks[index])

		if (chooseMode.mode === 1) {
			console.log("\nRemoving your library tracks. This may take time...")
			const userPlaylists = await loadAllPages({perPage: 20}, async ({limit, offset, result}) => {
				const response = await spotifyApi.getUserPlaylists({
					limit,
					offset,
				})
				result.push(...response.body.items.map(item => ({
					id: item.id,
					name: item.name,
				})))
				return response.body.items.length > 0
			})
			console.log(`\nYou have ${userPlaylists.length} playlists. Loading tracks...`)
			const allLibrary = []
			for (const userPlaylist of userPlaylists) {
				console.log(`Loading tracks of «${userPlaylist.name}»...`)
				const playlistTracksIds = await loadAllPages({perPage: 50}, async ({limit, offset, result}) => {
					const response = await spotifyApi.getPlaylistTracks(userPlaylist.id, {
						limit,
						offset,
					})
					result.push(...response.body.items.map(item => item.track.id))
					return response.body.items.length > 0
				})
				allLibrary.push(...playlistTracksIds)
			}
			filteredDailyTracksIds = filteredDailyTracksIds.filter(id => !allLibrary.includes(id))
		}
		
		console.log("\nShuffling tracks...")
		filteredDailyTracksIds = arrayShuffle(filteredDailyTracksIds).map(item => `spotify:track:${item}`)

		const newPlaylistName = `Fixed Mix (${getDateString()})`
		console.log(`\nCreating new playlist «${newPlaylistName}»...`)
		const newPlaylist = await spotifyApi.createPlaylist(newPlaylistName, {
			description: "Daily mix from all your daily mixes withont your saved tracks. Enjoy.",
			public: false
		})

		console.log(`\nAdding tracks to the new playlist...`)
		for (const chunk of arrayChop(filteredDailyTracksIds, 100)) {
			const addTracksToPlaylist = await spotifyApi.addTracksToPlaylist(newPlaylist.body.id, chunk)
		}

		console.log(`\nSuccess! Check your Spotify.`)
	}
	catch(err) {
		console.log("\nError occurred:", err)
	}
})()