import {mapsData} from "../models/GameMap.js";
import {drawMap, setCanvasEvent} from "./MapToCanvas.js";
import {translate} from "../utils/Translator.js";
import Game from "../models/Game.js";
import PathFinder from "../utils/PathFinder.js";

export function mainMenu() {
    const menu = document.getElementById("mainMenu")
    menu.classList.remove("hidden")

    if (! menu.classList.contains("ready")) {
        menu.classList.add("ready")

        const playButton = document.getElementById("mainMenuPlayButton")
        playButton.addEventListener("click", () => {
            menu.classList.add("hidden")
            lobby()
        })
    }
}

function lobby() {
    const lobby = document.getElementById("lobby")
    lobby.classList.remove("hidden")

    let selectedMapId = 0
    updateMapPreview(mapsData[selectedMapId].map)

    function updateMapPreview(map) {
        document.getElementById("mapName").textContent = translate(`map.${map.name}.name`)
        const canvas = document.getElementById("mapPreview")
        drawMap(canvas, canvas.getContext("2d"), map, 0)
    }

    if (! lobby.classList.contains("ready")) {
        lobby.classList.add("ready")

        const prevMapButton = document.getElementById("lobbyPrevMapButton")
        prevMapButton.addEventListener("click", () => {
            selectedMapId -= 1
            if (selectedMapId === -1) { selectedMapId = mapsData.length - 1 }
            updateMapPreview(mapsData[selectedMapId].map)
        })

        const nextMapButton = document.getElementById("lobbyNextMapButton")
        nextMapButton.addEventListener("click", () => {
            selectedMapId += 1
            if (selectedMapId === mapsData.length) { selectedMapId = 0 }
            updateMapPreview(mapsData[selectedMapId].map)
        })

        const startGameButton = document.getElementById("lobbyStartButton")
        startGameButton.addEventListener("click", () => {
            lobby.classList.add("hidden")
            game(mapsData[selectedMapId])
        })
    }
}

function game(map) {
    const game = document.getElementById("game")
    game.classList.remove("hidden")

    const entitiesCanvas = document.getElementById("gameCanvas")
    const entitiesCtx = entitiesCanvas.getContext("2d")

    const gameController = new Game(map, eventReceiver, new PathFinder(map.map))
    globalThis.game = gameController
    setCanvasEvent(entitiesCanvas, gameController.click.bind(gameController))
    gameController.resume()
    eventReceiver(0)

    function eventReceiver(frameTiming) {
        drawMap(entitiesCanvas, entitiesCtx, gameController, frameTiming)
        document.getElementById("pauseMenu").classList.toggle("hidden", ! gameController.isPaused)
    }
}