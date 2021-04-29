const sleep = ms => {
	return new Promise(resolve => setTimeout(resolve, ms))
}

const openURL = url => {
	const start = (process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open")
	require("child_process").exec(`${start} ${url.replace(/&/g, "^&")}`)
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
}