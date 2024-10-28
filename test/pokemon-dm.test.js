import {
  html,
  fixture,
  assert,
  fixtureCleanup
} from '@open-wc/testing';
import '../pokemon-dm.js';
import sinon from 'sinon';


suite('PokemonDm', () => {
  let el;

  teardown(() => fixtureCleanup());

  suite('default', () => {
    setup(async () => {
      el = await fixture(html`
        <pokemon-dm></pokemon-dm>
      `);
      await el.updateComplete;
    });

    test('a11y', async () => {
      await assert.isAccessible(el);
    });

    test('SHADOW DOM - Structure test', () => {
      assert.shadowDom.equalSnapshot(el);
    });

    test('LIGHT DOM - Structure test', () => {
      assert.lightDom.equalSnapshot(el);
    });

    test('fetchEvolutionChain fetches and returns evolution chain data', async () => {
      const pokemon = { species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1/' } };
      const mockEvolutionChain = { chain: { species: { name: 'Ivysaur' } } };
      
      const fetchStub = sinon.stub(window, 'fetch').onFirstCall().resolves({
        ok: true,
        json: async () => ({ evolution_chain: { url: 'https://pokeapi.co/api/v2/evolution-chain/1/' } }),
      }).onSecondCall().resolves({
        ok: true,
        json: async () => mockEvolutionChain,
      });

      const result = await el.fetchEvolutionChain(pokemon);
      assert.deepEqual(result, mockEvolutionChain, 'Should return evolution chain data');
      fetchStub.restore();
    });

    test('showEvolution handles evolution data', async () => {
      const pokemon = { species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1/' } };
      const mockEvolutionChain = { 
          chain: { 
              species: { name: 'Ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2' }, 
              evolves_to: [] 
          } 
      };

      sinon.stub(el, 'fetchEvolutionChain').resolves(mockEvolutionChain);
      sinon.stub(el, 'getEvolutions').resolves([mockEvolutionChain.chain]);

      await el.showEvolution(pokemon);

      assert.deepEqual(el.selectedEvolutions, [mockEvolutionChain.chain], 'La evolución seleccionada no es la esperada');
  });

  test('getEvolutionsFromChain fetches evolutions correctly', async () => {
      const mockChain = { species: { name: 'Bulbasaur' }, evolves_to: [] };
      const mockData = { 
          name: 'Bulbasaur', 
          sprites: { other: { dream_world: { front_default: 'img.png' } } }, 
          height: 7, 
          weight: 69, 
          types: [{ type: { name: 'grass' } }] 
      };
      sinon.stub(window, 'fetch').resolves({
          ok: true,
          json: async () => mockData, 
      });
      const result = await el.getEvolutions(mockChain);
      assert.deepEqual(result, [mockData], 'Debería devolver las evoluciones correctamente');
  });

  test('fetchPokemons fetches pokemons correctly', async () => {
    const fetchStub = sinon.stub(el, 'fetchPokemons').resolves([{ name: 'Pikachu' }]);
    await el.fetchPokemons(); 
    assert.isTrue(fetchStub.calledOnce);
    fetchStub.restore(); 
  });

  test('searchPokemons should handle empty search query', async () => {
    const fetchStub = sinon.stub(el, 'fetchPokemons').resolves([]); 
    el.searchQuery = ''; 
    await el.searchPokemons(); 
    assert.isTrue(fetchStub.calledOnce);
    fetchStub.restore(); 
}); 

test('searchPokemons should fetch specific pokemon by ID', async () => {
  el.searchQuery = '1'; 
  await el.searchPokemons();
  assert.isTrue(el.pokemons.length > 0  && el.pokemons[0].hasOwnProperty('name'), 'No se encontro pokemon');  
  assert.equal(el.pokemons[0].name, 'Bulbasaur')
});

test('searchPokemons should fetch specific pokemon by ID', async () => {
  el.searchQuery = 'Bulbasaur'; 
  await el.searchPokemons();
  assert.isTrue(el.pokemons.length > 0  && el.pokemons[0].hasOwnProperty('name'), 'No se encontro pokemon');  
  assert.equal(el.pokemons[0].name, 'Bulbasaur')
});

test('searchPokemons should handle non-OK response when searching by ID', async () => {
  el.searchQuery = '99999'; 
  const originalFetch = window.fetch;
  window.fetch = async () => ({
    ok: false,
    status: 404,
  });

  await el.searchPokemons();
  assert.deepEqual(el.pokemons, [], 'El arreglo de pokemons debería estar vacío tras un ID no encontrado');
  window.fetch = originalFetch;
});

test('searchPokemons should handle non-OK response when searching by name', async () => {
  el.searchQuery = 'NonExistentName'; 

  const originalFetch = window.fetch;
  window.fetch = async (url) => {
    if (url.includes('?limit=1000')) {
      return {
        ok: false,
        status: 404,
        json: async () => ({}), 
      };
    }
    return originalFetch(url);
  };
  await el.searchPokemons();
  assert.equal(el.pokemons.length, 0, 'No se manejó correctamente la respuesta no-OK al buscar por nombre');
  window.fetch = originalFetch;
});


test('fetchPokemons should fetch and sort pokemons successfully', async () => {
  const mockPokemons = {
    count: 10,
    results: [
      { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1' },
      { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4' },
    ],
  };
  const mockPokemonData = [{ name: 'bulbasaur', weight: 69 }, { name: 'charmander', weight: 85 }];

  const originalFetch = window.fetch;
  window.fetch = async (url) => {
    if (url.includes('pokemon?limit')) {
      return { ok: true, json: async () => mockPokemons };
    } else {
      return { ok: true, json: async () => mockPokemonData.shift() };
    }
  };

  await el.fetchPokemons();

  assert.equal(el.pokemons.length, 2, 'Pokemons were not fetched correctly');
  assert.equal(el.pokemons[0].name, 'bulbasaur', 'Pokemons were not sorted correctly');
  assert.equal(el.totalPokemons, 10, 'Total pokemons count is incorrect');

  window.fetch = originalFetch;
});

test('fetchPokemons should handle non-OK response in main fetch', async () => {
  const originalFetch = window.fetch;
  window.fetch = async (url) => {
    if (url.includes('pokemon?limit')) {
      return { ok: false, status: 404 };
    }
    return originalFetch(url);
  };

  await el.fetchPokemons();

  assert.equal(el.pokemons.length, 0, 'Pokemons should be empty on error');

  window.fetch = originalFetch;
});


test('changePage should increment or decrement currentPage within valid range', async () => {
  el.totalPokemons = 30;
  el.perPage = 10;
  el.currentPage = 1; 

  el.fetchPokemons = async () => Promise.resolve();


  await el.changePage(1);
  assert.equal(el.currentPage, 2, 'No se incrementó correctamente a la página siguiente');

  await el.changePage(-1);
  assert.equal(el.currentPage, 1, 'No se decrementó correctamente a la página anterior');

  await el.changePage(-1);
  assert.equal(el.currentPage, 1, 'No debe decrementar por debajo de la página 1');

  el.currentPage = el.totalPages;
  await el.changePage(1);
  assert.equal(el.currentPage, el.totalPages, 'No debe incrementar más allá de la última página');
});


test('totalPages should return the correct number of pages', () => {
  el.totalPokemons = 45;
  el.perPage = 10;
  assert.equal(el.totalPages, 5, 'El número total de páginas es incorrecto');

  el.totalPokemons = 25;
  el.perPage = 10;
  assert.equal(el.totalPages, 3, 'El número total de páginas es incorrecto cuando hay pokémons en la última página');
});


test('visiblePages should return the correct visible page range', () => {
  el.totalPokemons = 100;
  el.perPage = 10;

  el.currentPage = 1;
  assert.deepEqual(el.visiblePages, [1, 2], 'Visible pages incorrectas en la página 1');

  el.currentPage = 5;
  assert.deepEqual(el.visiblePages, [4, 5, 6], 'Visible pages incorrectas en una página intermedia');

  el.currentPage = el.totalPages;
  assert.deepEqual(el.visiblePages, [9, 10], 'Visible pages incorrectas en la última página');
});

test('fetchEvolutionChain should handle error in species fetch', async () => {
  const mockPokemon = { species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1/' } };

  const originalFetch = window.fetch;
  window.fetch = async () => { throw new Error('Network error'); };

  const result = await el.fetchEvolutionChain(mockPokemon);

  assert.equal(result, null, 'No se manejó correctamente el error en fetch de especie');

  window.fetch = originalFetch;
});

test('fetchEvolutionChain should return evolution chain data when available', async () => {
  const mockPokemon = { species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1/' } };

  const mockSpeciesResponse = {
      evolution_chain: { url: 'https://pokeapi.co/api/v2/evolution-chain/1/' }
  };
  
  const mockEvolutionChainResponse = { chain: { evolves_to: [] } };

  const originalFetch = window.fetch;

  window.fetch = async (url) => {
      if (url === mockPokemon.species.url) {
          return { ok: true, json: async () => mockSpeciesResponse };
      } else if (url === mockSpeciesResponse.evolution_chain.url) {
          return { ok: true, json: async () => mockEvolutionChainResponse };
      }
      return originalFetch(url);
  };
  const result = await el.fetchEvolutionChain(mockPokemon);
  
  assert.deepEqual(result, mockEvolutionChainResponse, 'No se devolvió correctamente la cadena de evolución');
  window.fetch = originalFetch;
});

test('fetchEvolutionChain should return null when no evolution chain is present', async () => {
  const mockPokemon = { species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1/' } };

  const mockSpeciesResponse = {};

  const originalFetch = window.fetch;

  window.fetch = async (url) => {
      if (url === mockPokemon.species.url) {
          return { ok: true, json: async () => mockSpeciesResponse };
      }
      return originalFetch(url);
  };

  const result = await el.fetchEvolutionChain(mockPokemon);

  assert.equal(result, null, 'Se esperaba null cuando no hay cadena de evolución');

  window.fetch = originalFetch;
});

test('showEvolution should set selectedEvolutions when evolutionChain is present', async () => {
  const mockPokemon = { species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1/' } };

  const mockEvolutionChain = {
      chain: { evolves_to: [{ species: { name: 'ivysaur' } }] } 
  };

  const mockEvolutionsResponse = [{ name: 'ivysaur' }];

  const originalFetchEvolutionChain = el.fetchEvolutionChain;
  const originalGetEvolutions = el.getEvolutions;

  el.fetchEvolutionChain = async () => mockEvolutionChain;

  el.getEvolutions = async () => mockEvolutionsResponse;

  await el.showEvolution(mockPokemon);

  assert.deepEqual(el.selectedEvolutions, mockEvolutionsResponse, 'selectedEvolutions no se estableció correctamente');

  el.fetchEvolutionChain = originalFetchEvolutionChain;
  el.getEvolutions = originalGetEvolutions;
});


test('showEvolution should not set selectedEvolutions when evolutionChain is null', async () => {
  const mockPokemon = { species: { url: 'https://pokeapi.co/api/v2/pokemon-species/1/' } };

  const originalFetchEvolutionChain = el.fetchEvolutionChain;
  el.fetchEvolutionChain = async () => null;

  await el.showEvolution(mockPokemon);

  assert.deepEqual(el.selectedEvolutions, undefined, 'selectedEvolutions debería estar undefined cuando no hay cadena de evolución');

  el.fetchEvolutionChain = originalFetchEvolutionChain;
});

  });
});
