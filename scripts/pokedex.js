import {lazyLoad} from './lazyLoad.mjs';

//ÍNDICE
//1 - FETCH, PINTAR Y FILTRAR POKEMONS
//2 - AÑADIR POKEMONS A LIKE



///////////////////////////////////////////////////////////////////////////////////////
//FETCH, PINTAR Y FILTRAR POKEMONS
const pokedex$$ = document.querySelector('#pokedex');
const loader$$ = document.querySelector('.lds-roller');
//recibir los pokemons de la api
const getPokemons = async () => {
    const pokemons = [];

    for(let i = 1; i <= 150 ; i++) {
        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${i}`);
            let pokemon = await response.json();
            pokemons.push(pokemon);
        } catch (error) {
            console.log(error);
        } 
    }

    //llamada a la función que reduce cada objeto con los datos que vamos a usar
    let mappedPokemons =  mapPokemons(pokemons);
    //devolución de los pokemons mapeados
    return mappedPokemons;
}


//mapea cada pokemon del array recibido para obtener un array de objetos nuevo solo con las propiedades que . Se llama en la propia función que hace la petición para que devuelva ya los elementos mapeados.
const mapPokemons = (pokemonSinMapear) => {

    return pokemonSinMapear.map((poke) => ({
        name : poke.name,
        // image: poke.sprites.other['official-artwork'].front_default,
        image: poke.sprites.front_default,
        image_back : poke.sprites.back_default,
        type: poke.types.map(type => type.type.name),
        experience : poke.base_experience,
        abilities : poke.abilities.map(ab => ab.ability.name),
        species : poke.species.name,
        moves: poke.moves.map(move=> move.move.name)
    }))

}


//crea el HTML necesario para pintar cada pokemon
const paintPokemons = (pokemons) => {
    const pokedex$$ = document.querySelector('#pokedex');
    pokedex$$.innerHTML = '';

    for (const pokemon of pokemons) {
        const pokemonCard$$ = document.createElement('div');
        pokemonCard$$.classList.add('card', 'lazy');

        pokemonCard$$.innerHTML = `
            <div class="card-front">
                <h2 class="card-front__name">${pokemon.name}</h2>
                <img src="${pokemon.image}" alt="${pokemon.image}" class="card-front__img">
                <i class="fi fi-ss-heart card-front__heart animate__animated"></i>
            </div>
            <div class="card-back flip">
                <ul class="card-back-txt">
                    <li class="card-back-txt__item">Nombre: ${pokemon.name}</li>
                    <li class="card-back-txt__item">Tipos: ${pokemon.type.join(', ')}</li>
                    <li class="card-back-txt__item">Experiencia: ${pokemon.experience}</li>
                    <li class="card-back-txt__item">Habilidades: <br><br>&nbsp;&nbsp;&#10033;${pokemon.abilities.join('<br><br>&nbsp;&nbsp;&#10033;')}</li>
                 
                </ul>

                <img class="card-back__img animate__animated" src="${pokemon.image_back}">

            </div>
         `;

        //gira cada carta al hacerle click
        pokemonCard$$.addEventListener('click', () => {
            Array.from(pokemonCard$$.children).forEach(side => side.classList.toggle('flip'));
            const backImg$$ = pokemonCard$$.children[1].children[1];
            backImg$$.classList.toggle('animate__shakeX');
        });

        pokedex$$.appendChild(pokemonCard$$);
    }

    const cards$$ = document.querySelectorAll('.card');
    lazyLoad(cards$$);

    likePokemons();
}


//filtra los pokemons que se pintan en función de los criterios de búsqueda
//se llama desde un event listener en el input, declarado en la función init();
const filterPokemons = (pokemons, select, input) => {
    let searchCriteria = select.value;
    let searchTerm = input.value;

    const filteredPokemons = pokemons.filter(pokemon => {
        
        if(typeof pokemon[searchCriteria] === 'number') {
            return pokemon[searchCriteria] == searchTerm;
        }  else if (typeof pokemon[searchCriteria] === 'string'){
            return pokemon[searchCriteria].includes(searchTerm.toLowerCase());
        } else {
            return pokemon[searchCriteria].join(' ').includes(searchTerm.toLowerCase());
        }
        
    })

    //pinta los pokemones filtrados
    paintPokemons(filteredPokemons);
}


//recorre los pokemons buscando coincidencias en el texto de la propiedad que se está buscando para generar un array de sugerencias de búsqueda
//se llama desde un event listener en el input, declarado en la función init()
const getSearchSuggestions = (pokemons, select, input) => {
    let searchCriteria = select.value;
    let searchTerm = input.value;


    let searchSuggestions = pokemons.filter(pokemon => {
        if(typeof pokemon[searchCriteria] === 'number') {
            return pokemon[searchCriteria].toString().startsWith(searchTerm); 
        }  else if (typeof pokemon[searchCriteria] === 'string'){
            return pokemon[searchCriteria].startsWith(searchTerm.toLowerCase());
        } else {
            return pokemon[searchCriteria].some(elem => elem.startsWith(searchTerm.toLowerCase()))
        }
    })
    
    paintSearchSuggestions(pokemons, searchSuggestions, select, input);
}

const paintSearchSuggestions = (pokemons, suggestions, select, input) => {
    const searchSuggestions$$ = document.querySelector('.search-suggestions');

    if(input.value.length === 0) { //si se borra el input, vacía la lista para que no aparezcan todos los pokemones en sugerencias
        searchSuggestions$$.innerHTML = '';
    } else  { 
        searchSuggestions$$.innerHTML = '';

        suggestions.forEach(sugg => {
   
            const suggLi$$ = document.createElement('li');
    
            if(Array.isArray(sugg[select.value])) {
                suggLi$$.textContent = sugg[select.value].find(elem => elem.startsWith(input.value));
            } else {
                suggLi$$.textContent = sugg[select.value];
            }
            
            suggLi$$.classList.add('search-suggestions__item');
        
            suggLi$$.addEventListener('click', (e) => {
                input.value = e.target.textContent;
                filterPokemons(pokemons, select, input);
                searchSuggestions$$.innerHTML = '';
            });
        
            searchSuggestions$$.appendChild(suggLi$$);
        });
    }
}


const init = async () => {
    //pillar primeros 150 pokemons
    let pokemons = await getPokemons();
    //quitar la animación de cargar cuando se cargue el fetch
    loader$$.classList.add('hidden');

    //pintar pokemons
    paintPokemons(pokemons);

    //filtrar pokemons en base a términos de búsqueda
    let searchSelect$$ = document.querySelector('.search-select');
    let searchInput$$ = document.querySelector('.search__input');
    
    searchInput$$.addEventListener('input', () => filterPokemons(pokemons, searchSelect$$, searchInput$$));
    searchInput$$.addEventListener('input', () => getSearchSuggestions(pokemons, searchSelect$$, searchInput$$));
    
}

init();

//////////////////////////////////////////////////////////////////////////////////////////
//AÑADIR POKEMON A FAVORITOS

//cambia estilo de corazón en carta al clicar. Suma 1 al contador de likes del header
const likePokemons = (cardHearts, heartNum) => {
    ;

    cardHearts$$.forEach(heart => heart.addEventListener('click', (e)=> {
        heart.classList.toggle('card-front__heart--liked');
        heart.classList.toggle('animate__swing');
        console.log(headerHeartNum$$);
        
        if(heart.classList.contains('card-front__heart--liked')) {
            console.log('ola')
            headerHeartNum$$.textContent = new Number(headerHeartNum$$.textContent) + 1;
        } else {
            headerHeartNum$$.textContent = new Number(headerHeartNum$$.textContent) - 1;
        }
        
        e.stopPropagation();
    }));
}

const favoritesBar = () => {

}

const favoritePokemons = () => {
    let cardHearts$$ = document.querySelectorAll('.card-front__heart');
    let headerHeartNum$$ = document.querySelector('.header-heart__num');

    likePokemons(cardHearts$$, headerHeartNum$$);
    favoritesBar();
}

favoritePokemons();




