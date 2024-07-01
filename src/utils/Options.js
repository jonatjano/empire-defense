import * as Translator from "./Translator.js";
import TexturePack from "./TexturePack.js";

class Options {
    /** @type {boolean} */
    #debug

    /** @type {string[]} */
    #knownLanguages
    /** @type {string} */
    #language
    /** @type {string} */
    #fallbackLanguage

    /** @type {TexturePack[]} */
    #knownTexturePacks
    /** @type {TexturePack} */
    #texturePack

    // todo stuff with local storage and proxy and stuff
    constructor() {
        // document.body.classList.add("hidden")
        // document.querySelector("#mapPreview").classList.add("hidden")
        // document.querySelectorAll("#game > *").forEach(element => element.classList.add("hidden"))
        this.loadMeta()
    }

    loadMeta() {
        return fetch("/assets/meta.json")
            .then(res => res.json())
            .then(
                /** @param {{
                 *  languages: {default: string, list: string[]},
                 *  texturePacks: {default: string, list: string[]},
                 *  debug: ?boolean,
                 *  showStats: ?boolean
                 * }} meta */
                meta => {
                /* debug */
                this.debug = meta.debug ?? false
                this.showStats = meta.showStats ?? this.debug

                /* languages */
                this.#knownLanguages = meta.languages.list
                this.#fallbackLanguage = meta.languages.default
                this.language = window.navigator.languages.find(language => this.#knownLanguages.includes(language)) ?? this.#fallbackLanguage

                /* texture pack */
                this.#knownTexturePacks = meta.texturePacks.list.map(name => new TexturePack(name))
                this.texturePack = this.#knownTexturePacks.find(pack => pack.name === meta.texturePacks.default) ?? this.#knownTexturePacks[0]
            })
            .then(_ => console.log(this))
    }

    get zoom() { return 60 }

    /**
     * @param {boolean} value
     */
    set debug(value) {
        if (this.debug === value) { return }
        this.#debug = !! value
        document.getElementById("debugOverlay").classList.toggle("hidden", ! this.#debug)
    }
    get debug() { return this.#debug }

    /**
     * @param {boolean} value
     */
    set showStats(value) {
        document.getElementById("debugOverlay").classList.toggle("hidden", ! value)
    }

    /**
     * @param {string} value
     */
    set language(value) {
        if (this.language === value) { return }
        if (! Translator.KNOWN_LANGUAGES.includes(value)) {
            console.warn(`Language "${value}" is not supported, defaulting to ${this.#fallbackLanguage}`)
            value = this.#fallbackLanguage
        }
        this.#language = value
        Translator.loadTranslation()
            .then(Translator.translateDocument)
    }
    get language() { return this.#language }
    get fallbackLanguage() { return this.#fallbackLanguage }

    set texturePack(value) {
        if (this.texturePack === value) { return }
        let texturePack = value
        if (typeof value === "string") {
            texturePack = this.#knownTexturePacks.find(pack => pack.name === value)
        }
        if (texturePack) {
            this.#texturePack = texturePack
            this.#texturePack.changeDocumentTextures()
        }
    }

    get texturePack() { return this.#texturePack }
}

const options = new Options()
globalThis.options = options
export default options

