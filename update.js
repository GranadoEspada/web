import { update as updateCharacters } from './build/characters.js';

(async function build() {
    await updateCharacters();
})();