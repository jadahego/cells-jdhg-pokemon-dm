import { LitElement} from 'lit-element';

export class PokemonDm extends LitElement {
  
  async fetchPokemons() {
    const offset = (this.currentPage - 1) * this.perPage;
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${this.perPage}&offset=${offset}`);
        if (!response.ok) throw new Error(`Error en la solicitud: ${response.status}`);

        const data = await response.json();
        this.pokemons = await Promise.all(data.results.map(async (pokemon) => {
            const pokemonData = await fetch(pokemon.url).then(res => res.json());
            return pokemonData;
        }));

        this.pokemons.sort((a, b) => a.weight - b.weight);
        this.totalPokemons = data.count;
    } catch (error) {
        console.error('Error en fetchPokemons:', error);
    }
}

async changePage(delta) {
    const newPage = this.currentPage + delta;
    if (newPage >= 1 && newPage <= this.totalPages) {
        this.currentPage = newPage;
        await this.fetchPokemons();
    }
}

get totalPages() {
    return Math.ceil(this.totalPokemons / this.perPage);
}

get visiblePages() {
    const startPage = Math.max(1, this.currentPage - 1);
    const endPage = Math.min(this.totalPages, this.currentPage + 1);
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
}

}
