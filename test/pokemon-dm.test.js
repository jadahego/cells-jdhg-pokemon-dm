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
  console.log('hola',JSON.stringify(el.pokemons[0]))
  assert.isTrue(el.pokemons.length > 0  && el.pokemons[0].hasOwnProperty('name'), 'No se encontro pokemon');  
  assert.equal(el.pokemons[0].name, 'Bulbasaur')
});

test('searchPokemons should fetch specific pokemon by ID', async () => {
  el.searchQuery = 'Bulbasaur'; 
  await el.searchPokemons();
  console.log('hola',JSON.stringify(el.pokemons.length>0))
  assert.isTrue(el.pokemons.length > 0  && el.pokemons[0].hasOwnProperty('name'), 'No se encontro pokemon');  
  assert.equal(el.pokemons[0].name, 'Bulbasaur')
});

  });
});
