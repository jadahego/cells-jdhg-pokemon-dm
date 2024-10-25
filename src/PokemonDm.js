import { LitElement} from 'lit-element';

export class PokemonDm extends LitElement {

  async fetchPokemons() {
    const offset = (this.currentPage - 1) * this.perPage;

    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${this.perPage}&offset=${offset}`);

      if (!response.ok) {
        throw new Error(`Error en la solicitud: ${response.status}`);
      }
      const data = await response.json();

      const detailedPokemons = await Promise.all(data.results.map(async(pokemon) => {
        const pokemonResponse = await fetch(pokemon.url);
        if (!pokemonResponse.ok) {
          throw new Error(`Error al obtener datos de Pokémon: ${pokemonResponse.status}`);
        }
        return await pokemonResponse.json();
      }));

      this.pokemons = detailedPokemons;
      this.pokemons.sort((a, b) => a.weight - b.weight);
      this.totalPokemons = data.count;

      this.dispatchEvent(new CustomEvent('my-data-request-success', {
        detail: { pokemons: this.pokemons, total: this.totalPokemons },
        bubbles: true,
        composed: true
      }));

    } catch (error) {
      console.error('Error en fetchPokemons:', error);

      this.dispatchEvent(new CustomEvent('my-data-request-failure', {
        detail: error,
        bubbles: true,
        composed: true
      }));
    }
  }

  willBeActive(active) {
    if (active) {
      this.fetchPokemons();
    } else {
      this.reset();
    }
  }

  async changePage(page) {
    this.currentPage = page;
    await this.fetchPokemons();
  }

  async nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      await this.fetchPokemons();
    }
  }

  async prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      await this.fetchPokemons();
    }
  }

  get totalPages() {
    return Math.ceil(this.totalPokemons / this.perPage);
  }

  get visiblePages() {
    const total = this.totalPages;
    const pages = [];
    const startPage = Math.max(1, this.currentPage - 1);
    const endPage = Math.min(total, this.currentPage + 1);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

}
