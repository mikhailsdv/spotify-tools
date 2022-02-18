const sleep = ms => {
	return new Promise(resolve => setTimeout(resolve, ms))
}

const openURL = url => {
	const start = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open"
	require("child_process").exec(`${start} ${url.replace(/&/g, "^&")}`)
}

const calcOffset = (page, perPage) => (page - 1) * perPage

const objToCookieString = obj => {
	let str = ""
	for (const key in obj) {
		str += `${key}=${obj[key]}; `
	}
	return str
}

const arrayShuffle = array_ => {
	const array = array_.slice()
	let currentIndex = array.length,
		randomIndex

	while (currentIndex !== 0) {
		randomIndex = Math.floor(Math.random() * currentIndex)
		currentIndex--
		;[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]]
	}

	return array
}

const arrayChop = (array, perChunk) => {
	return array.reduce((all, one, i) => {
		const ch = Math.floor(i / perChunk)
		all[ch] = [].concat(all[ch] || [], one)
		return all
	}, [])
}

const getDateString = () => {
	const d = new Date()
	const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
	return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

const loadAllPages = async ({perPage}, f) => {
	const result = []
	const load = async page => {
		const hasNextPage = await f({
			limit: perPage,
			offset: calcOffset(page, perPage),
			result,
		})
		if (!hasNextPage) return result
		return await load(page + 1)
	}
	return await load(1)
}

const msToTime = (ms = 0) => {
	let result = ""
	const h = Math.floor(ms / 1000 / 60 / 60)
	const m = Math.floor((ms / 1000 / 60 / 60 - h) * 60)
	const s = Math.floor(((ms / 1000 / 60 / 60 - h) * 60 - m) * 60)

	h > 0 && (result += `${h}h `)
	m > 0 && (result += `${m}m `)
	result += `${s}s`

	return result.trim()
}

const arrayMove = (arr, fromIndex, toIndex) => {
	const arr_ = arr.slice()
	const element = arr_[fromIndex]
	arr_.splice(fromIndex, 1)
	arr_.splice(toIndex, 0, element)
	return arr_
}

/*const pluralize = (n, singular, plural, accusative) => {
	n = Math.abs(n)
	let n10 = n % 10;
	let n100 = n % 100;
	if (n10 === 1 && n100 !== 11) {
		return singular;
	}
	if (
		(2 <= n10 && n10 <= 4) &&
		!(12 <= n100 && n100 <= 14)
	) {
		return plural;
	}
	return accusative;
}*/

module.exports = {
	sleep,
	openURL,
	objToCookieString,
	calcOffset,
	arrayShuffle,
	arrayChop,
	getDateString,
	loadAllPages,
	msToTime,
	arrayMove,
}
