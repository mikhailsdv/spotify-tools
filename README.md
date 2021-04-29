# spotify-tools
Some tools for expanding Spotify functionality.

How to use:
---
1. Install [Node.js](https://nodejs.org/en/download/).
2. [Download](https://github.com/mikhailsdv/spotify-tools/archive/main.zip) or clone the repository to your computer.
3. Run terminal form the root directory of the project and run:
```
npm i
```
Click Enter and wait untill all the dependencies are installed.

4. Open [this URL](https://developer.spotify.com/dashboard/applications) (log in if neccessary).
5. In your «Dashboard» click on «CREATE AN APP».
6. Enter any name and description of your app, tick all the checkboxes then click «CREATE».
7. Now you're in your app's cabinet. Click «Edit Settings» → in the Redirect URIs enter `https://example.com/` → click «SAVE».
8. Find your Client ID on the page and copy it  → opent file `/src/config.js` with notepad (or any other text editor) in the project's directory → paste your Client ID between quotes after `clientId:`.
9. Don't close notepad. Go back to browser → click Show Client Secret → copy your Client Secret → paste between quotes after `clientSecret:`


Now you can use any tool in `/src/tools/`. Just open tool's folder and run `start.sh` or run `index.js` script directly from terminal.


Feedback
---
If you have some troubles with `spotify-tools` contact me in Telegram [@mikhailsdv](https://t.me/mikhailsdv).  
Subscribe to my Telegram channel [@FilteredInternet](https://t.me/FilteredInternet).
