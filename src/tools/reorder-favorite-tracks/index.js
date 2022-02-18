const config = require("../../config")
const {sleep, msToTime, arrayChop, loadAllPages, arrayMove} = require("../../utils")
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
		let reorderedTracks = savedTracks.slice()
		const loop = async () => {
			const from = await prompts([
				{
					type: "select",
					name: "trackIndex",
					message: "Choose a track you want to replace",
					choices: [{title: "√ Save and continue...", value: "finish"}, ...reorderedTracks.map((item, index) => ({title: `${index + 1}. ${item.name} — ${item.artist}`, value: index}))],
					initial: 1,
				},
			])
			if (from.trackIndex !== "finish") {
				const to = await prompts([
					{
						type: "select",
						name: "placeIndex",
						message: "Choose a new place for your track. Note that you can't choose the same place so it's disabled.",
						choices: reorderedTracks
							.map((item, index) => [
								{title: `${index + 1}. ${item.name} — ${item.artist}`, value: null, disabled: true},
								{title: "░░░░░░░Place here░░░░░░░", value: index, disabled: from.trackIndex === index},
							])
							.flat(),
					},
				])
				reorderedTracks = arrayMove(reorderedTracks, from.trackIndex, to.placeIndex)
				await loop()
			}
		}
		await loop()
		const reorderedTrackIds = reorderedTracks.reverse().map(item => item.id)

		await (async () => {
			console.log("Starting to remove your tracks. Don't worry, it's ok...")
			const chunks = arrayChop(reorderedTrackIds, 50)
			let counter = 0
			for (const chunk of chunks) {
				await spotifyApi.removeFromMySavedTracks(chunk)
				counter += chunks.find(item => item === chunk).length
				console.log(`Removed ${counter}/${reorderedTrackIds.length}`)
				await sleep(80)
			}
		})()

		await (async () => {
			console.log(`Starting to save your tracks back. The process will take about ${msToTime(Math.round(reorderedTrackIds.length * 650))}.`)
			//const chunks = arrayChop(reorderedTrackIds, 50)
			let counter = 0
			for (const id of reorderedTrackIds) {
				await spotifyApi.addToMySavedTracks([id])
				counter++
				console.log(`Saved ${counter}/${reorderedTrackIds.length}`)
				await sleep(600)
			}
		})()
		console.log("Finished! Check out your Spotify saved tracks. If something went wrong you can always recover your tracks from saved_tracks.json. Contact me if you have any troubles https://t.me/mikhailsdv")
	} catch (err) {
		console.log("Error occurred:", err)
	}
})()
