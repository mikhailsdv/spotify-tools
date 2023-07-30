const config = require("../../config")
const {sleep, msToTime, arrayChop, loadAllPages, arrayMove, getDateString} = require("../../utils")
const auth = require("../../auth")
const fs = require("fs")
const spotifyApi = require("../../spotify-api-module")
const prompts = require("prompts")

;(async () => {
	const isAuthSuccess = await auth(spotifyApi)
	if (!isAuthSuccess) return
	try {
		console.log("Loading your saved tracks. Please, wait...")
		const savedTracks = await loadAllPages({perPage: 50}, async ({limit, offset, result}) => {
			const response = await spotifyApi.getMySavedTracks({
				limit,
				offset,
			})
			result.push(
				...response.body.items.map(item => ({
					name: item.track.name,
					artist: item.track.artists.map(artist => artist.name).join(", "),
					id: item.track.id,
				}))
			)
			return response.body.items.length > 0
		})
		console.log("Creating a dump of your tracks in case something goes wrong...")
		fs.writeFileSync("./saved_tracks.json", JSON.stringify(savedTracks))
		// ...reorderedTracks.map((item, index) => ({title: `${index + 1}. ${item.name} — ${item.artist}`, value: index})
		const variations = [
			{title: "Speed up", playlistName: "Speed up songs from your favorite tracks"},
			{title: "Slowed", playlistName: "Slowed songs from your favorite tracks"},
			{title: "Acoustic", playlistName: "Acoustic songs from your favorite tracks"},
			{title: "Bass boosted", playlistName: "Bass boosted songs from your favorite tracks"},
		]
		const variationPrompt = await prompts([
			{
				type: "select",
				name: "variation",
				message: "Choose desired variation",
				choices: variations,
				initial: 0,
			},
		])
		if (variationPrompt.variation === undefined) return
		const variation = variations[variationPrompt.variation]

		//console.log(`Your file contains ${tracks.length} tracks. The process will take about ${msToTime(Math.round(tracks.length * 2500))}.\n`)
		console.log(`\nCreating new playlist «${variation.playlistName}»...`)
		const newPlaylist = await spotifyApi.createPlaylist(variation.playlistName, {
			//description: variation.playlistName,
			public: false
		})

		console.log(`\nSearching ${variation.title.toLowerCase()} tracks...`)
		const foundTracks = []
		for (const track of savedTracks) {
			try {
				const response = await spotifyApi.searchTracks(`${track.name} ${track.artist} ${variation.title}`)
				const firstTrack = response.body.tracks.items[0]
				if (track.name === firstTrack.name) {
					console.log(`Nothing found for «${track.name}» :(`)
				} else {
					console.log("Found!", firstTrack.name)
					foundTracks.push(firstTrack)
				}
			} catch(err) {
				console.error(err)
			}
			await sleep(2000)
		}
		console.log(`\nAdding tracks to the new playlist...`)
		for (const chunk of arrayChop(foundTracks.map(({id}) => `spotify:track:${id}`), 100)) {
			await spotifyApi.addTracksToPlaylist(newPlaylist.body.id, chunk)
		}

		console.log("Finished!")
	} catch (err) {
		console.log("Error occurred:", err)
	}
})()
