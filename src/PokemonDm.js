import { LitElement} from 'lit-element';

export class PokemonDm extends LitElement {

  static get properties() {
    return {
        pokemons: { type: Array },
        currentPage: { type: Number },
        totalPokemons: { type: Number },
        perPage: { type: Number },
    };
}

constructor() {
    super();
    this.pokemons = [];
    this.currentPage = 1;
    this.totalPokemons = 0;
    this.perPage = 10;
}
  
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

async searchPokemons() {
    if (this.searchQuery.length < 1) {
      return this.fetchPokemons();
    }
  
    const idQuery = parseInt(this.searchQuery);
  
    if (!isNaN(idQuery)) {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${idQuery}`);
        if (response.ok) {
          this.pokemons = [await response.json()];
        } else {
          this.pokemons = [];
        }
      } catch (error) {
        console.error('Error al buscar Pokémon por ID:', error);
        this.pokemons = [];
      }
    } else {
      try {
        const allPokemonsResponse = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
        const allPokemons = await allPokemonsResponse.json();
  
        if (allPokemons.results && Array.isArray(allPokemons.results)) {
          this.pokemons = (await Promise.all(
            allPokemons.results
              .filter(pokemon => pokemon.name.startsWith(this.searchQuery.toLowerCase()))
              .map(async pokemon => {
                const pokemonResponse = await fetch(pokemon.url);
                return pokemonResponse.ok ? await pokemonResponse.json() : null;
              })
          )).filter(pokemon => pokemon !== null);
        } else {
          this.pokemons = allPokemons.name ? [allPokemons] : [];
        }
      } catch (error) {
        console.error('Error al buscar Pokémon por nombre:', error);
        this.pokemons = [];
      }
    }
  }
  
  

async fetchEvolutionChain(pokemon) {
    try {
        const speciesResponse = await fetch(pokemon.species.url);
        const speciesData = await speciesResponse.json();

        if (speciesData.evolution_chain) {
            const evolutionChainResponse = await fetch(speciesData.evolution_chain.url);
            const evolutionChainData = await evolutionChainResponse.json();
            return evolutionChainData;
        }
        return null;
    } catch (error) {
        console.error("Error al obtener la cadena de evolución:", error);
        return null;
    }
}

async showEvolution(pokemon) {
    const evolutionChain = await this.fetchEvolutionChain(pokemon);
    if (evolutionChain) {
        const evolutions = await this.getEvolutions(evolutionChain.chain);
        this.selectedEvolutions = evolutions;
    }
}

async getEvolutions(chain) {
    const evolutions = [];
    let current = chain;

    while (current) {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${current.species.name}`);
        if (response.ok) {
            const pokemonData = await response.json();
            evolutions.push(pokemonData);
        }
        current = current.evolves_to[0] || null;
    }
    return evolutions;
}



}
