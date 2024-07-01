import {maps} from "../models/GameMap.js";
import {drawEntities, printMapOnCanvas} from "./MapToCanvas.js";
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
    updateMapPreview(maps[selectedMapId])

    function updateMapPreview(map) {
        document.getElementById("mapName").textContent = translate(`map.${map.name}.name`)
        const canvas = document.getElementById("mapPreview")
        printMapOnCanvas(canvas, map)
    }

    if (! lobby.classList.contains("ready")) {
        lobby.classList.add("ready")

        const prevMapButton = document.getElementById("lobbyPrevMapButton")
        prevMapButton.addEventListener("click", () => {
            selectedMapId -= 1
            if (selectedMapId === -1) { selectedMapId = maps.length - 1 }
            updateMapPreview(maps[selectedMapId])
        })

        const nextMapButton = document.getElementById("lobbyNextMapButton")
        nextMapButton.addEventListener("click", () => {
            selectedMapId += 1
            if (selectedMapId === maps.length) { selectedMapId = 0 }
            updateMapPreview(maps[selectedMapId])
        })

        const startGameButton = document.getElementById("lobbyStartButton")
        startGameButton.addEventListener("click", () => {
            lobby.classList.add("hidden")
            game(maps[selectedMapId])
        })
    }
}

function game(map) {
    const game = document.getElementById("game")
    game.classList.remove("hidden")

    const mapCanvas = document.getElementById("mapCanvas")
    const entitiesCanvas = document.getElementById("entityCanvas")
    const entitiesCtx = entitiesCanvas.getContext("2d")

    const gameController = new Game(map, eventReceiver, new PathFinder(map))
    globalThis.game = gameController
    printMapOnCanvas(mapCanvas, gameController.map, gameController.click.bind(gameController))
    gameController.resume()
    eventReceiver(0)

    function eventReceiver(frameTiming) {
        drawEntities(entitiesCanvas, entitiesCtx, gameController, frameTiming)
        document.getElementById("pauseMenu").classList.toggle("hidden", ! gameController.isPaused)
    }
}