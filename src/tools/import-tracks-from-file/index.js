const config = require("../../config")
const {sleep} = require("../../utils")
const auth = require("../../auth")
const fs = require("fs")
const spotifyApi = require("../../spotifyApiModule")
const prompts = require("prompts")

;(async () => {
	await auth(spotifyApi)
	try {
		console.log("Loading playlists. Please, wait...")
		const user = await spotifyApi.getMe()
		let playlists = await spotifyApi.getUserPlaylists()
		playlists = playlists.body.items
			.filter(item => item.owner.id === user.body.id)
			.map(item => {
				return {
					name: item.name,
					tracks: item.tracks.total,
					id: item.id,
				}
			})
		const answers = await prompts([
			{
				type: "select",
				name: "playlist",
				message: "Choose a playlist to which you want to add tracks",
				choices: [
					{title: "♥ Your favourite tracks"},
					...playlists.map(item => ({title: `${item.name} (${item.tracks} tracks)`})),
				],
			},
		])
		if (answers.playlist === undefined) return

		fs.readFile("./tracks.txt", "utf8", async (err, data) => {
			if (err) {
				return console.log(err)
			}
			const tracks = data
				.split(/\r\n|\n|\r/)
				.filter(item => item.trim().length > 0)
			console.log(`Your file contains ${tracks.length} tracks. The process will take about ${Math.round(tracks.length * 2.5)} seconds.\n`)

			const notFound = []
			let i = 0
			for (let track of tracks) {
				console.log(`${i + 1}/${tracks.length} Searching "${track}"`)

				try {
					const response = await spotifyApi.searchTracks(track.replace(/\s?[-—]\s?/, " "))
					if (response.statusCode === 200) {
						const foundTracks = response.body.tracks.items
						if (foundTracks.length === 0) {
							notFound.push(track)
							console.log("Not found :(")
						}
						else {
							if (answers.playlist === 0) {
								const containsMySavedTracks = await spotifyApi.containsMySavedTracks([foundTracks[0].id])
 								if (containsMySavedTracks.body[0]) {
									console.log("Track is already in your library. Skipping.")
									continue
								}
								await spotifyApi.addToMySavedTracks([foundTracks[0].id])
							}
							else {
								await spotifyApi.addTracksToPlaylist(playlists[answers.playlist - 1].id, [`spotify:track:${foundTracks[0].id}`])
							}
							console.log("Found and added!")
						}
					}
					else {
						console.log(response)
					}
				}
				catch(err) {
					console.log(err)
				}
				console.log("Waiting 2s...\n")
				i++
				await sleep(2000)
			}
			if (notFound.length > 0) {
				console.log(`Found ${tracks.length - notFound.length}/${tracks.length} tracks.`)
				console.log("Not found tracks can be found in ./not_found_tracks.txt")
				fs.writeFileSync("./not_found_tracks.txt", notFound.join("\n"))
			}
		})
	}
	catch(err) {
		console.log("Error occurred:", err)
	}
})()