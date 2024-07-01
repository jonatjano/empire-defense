import * as Translator from "./Translator.js";

class Options {
    /** @type {boolean} */
    #debug
    /** @type {typeof Translator.KNOWN_LANGUAGES} */
    #language
    // todo stuff with local storage and proxy and stuff
    constructor() {
        this.debug = false
        this.#language = window.navigator.languages.find(language => Translator.KNOWN_LANGUAGES.includes(language)) ?? Translator.FALLBACK_LANGUAGE
    }

    get zoom() { return 75 }

    /**
     * @param {boolean} value
     */
    set debug(value) {
        this.#debug = !! value
        document.getElementById("debugOverlay").classList.toggle("hidden", ! this.#debug)
    }
    get debug() { return this.#debug }

    /**
     * @param {typeof Translator.KNOWN_LANGUAGES} value
     */
    set language(value) {
        if (! Translator.KNOWN_LANGUAGES.includes(value)) {
            console.warn(`Language "${value}" is not supported, defaulting to ${Translator.FALLBACK_LANGUAGE}`)
            value = Translator.FALLBACK_LANGUAGE
        }
        this.#language = value
        Translator.loadTranslation()
            .then(Translator.translateDocument)
    }
    get language() { return this.#language }
}

const options = new Options()
globalThis.options = options
export default options