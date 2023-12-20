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
    return  mapPokemons(pokemons); 
}


//mapea cada pokemon del array recibido para obtener un array de objetos nuevo solo con las propiedades que . Se llama en la propia función que hace la petición para que devuelva ya los elementos mapeados.
const mapPokemons = (pokemonSinMapear) => {

    return pokemonSinMapear.map((poke) => ({
        name : poke.name,
        image: poke.sprites.front_default,
        image_back : poke.sprites.back_default,
        types: poke.types.map(type => type.type.name),
        experience : poke.base_experience,
        abilities : poke.abilities.map(ab => ab.ability.name),
        species : poke.species.name,
        moves: poke.moves.map(move=> move.move.name)
    }))
}


//crea el HTML necesario para pintar cada pokemon
const createCards = (pokemons) => {

    const allPokemonCards = [];

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
                    <li class="card-back-txt__item name">Nombre: ${pokemon.name}</li>
                    <li class="card-back-txt__item types">Tipos: ${pokemon.types.join(', ')}</li>
                    <li class="card-back-txt__item experience">Experiencia: ${pokemon.experience}</li>
                    <li class="card-back-txt__item species">Especie: ${pokemon.species}</li>
                    <li class="card-back-txt__item abilities">Habilidades: <br><br>&nbsp;&nbsp;&#10033;${pokemon.abilities.join('<br><br>&nbsp;&nbsp;&#10033;')}</li>         
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

        //crea array con cards de todos los pokemons
        allPokemonCards.push(pokemonCard$$);
    }
    
    return allPokemonCards;
}


//mete las cartas hechas en la función anterior en la #pokedex del html
const appendCards = (cards) => {
    const pokedex$$ = document.querySelector('#pokedex');
    pokedex$$.innerHTML = '';

    for(const card of cards) {
        pokedex$$.appendChild(card);
        lazyLoad(card);
    }
}


//filtra los pokemons que se pintan en función de los criterios de búsqueda
//se llama desde un event listener en el input, declarado en la función init();
const filterCards = (cards) => {
    let searchFilter = document.querySelector('.search-select').value;
    let searchTerm = document.querySelector('.search__input').value;

    const filteredCards = cards.filter(card => {
        const cardUl$$ = Array.from(card.children[1].children[0].children);
        console.log(cardUl$$);
        const liToCheck = cardUl$$.find(li => li.classList.contains(`${searchFilter}`))
        
        return liToCheck.textContent.includes(searchTerm);   
    })
  
    //mete al html las cards filtradas
    appendCards(filteredCards);
}


//recorre los pokemons buscando coincidencias en el texto de la propiedad que se está buscando para generar un array de sugerencias de búsqueda
//se llama desde un event listener en el input, declarado en la función init()
const getSearchSuggestions = (pokemons, cards) => {
    const searchSelect$$ = document.querySelector('.search-select');
    let searchFilter = searchSelect$$.value;
    let searchTerm = document.querySelector('.search__input').value;

    let searchSuggestions = pokemons.filter(pokemon => {

        if(typeof pokemon[searchFilter] === 'number') {
            return pokemon[searchFilter].toString().startsWith(searchTerm); 
        }  else if (typeof pokemon[searchFilter] === 'string'){
            return pokemon[searchFilter].startsWith(searchTerm.toLowerCase());
        } else {
            return pokemon[searchFilter].some(elem => elem.startsWith(searchTerm.toLowerCase()))
        }
    })
    
    paintSearchSuggestions(cards, searchSuggestions, searchFilter, searchTerm);
}


const paintSearchSuggestions = (cards, searchSuggestions, filter, term) => {
    //ul donde irán las sugerencias
    const searchSuggestions$$ = document.querySelector('.search-suggestions');

    if(term.length === 0) { //si se borra el input, vacía la lista
        searchSuggestions$$.innerHTML = '';
    } else  { 
        searchSuggestions$$.innerHTML = '';

        searchSuggestions.forEach(sugg => {

            const suggLi$$ = document.createElement('li');
            suggLi$$.classList.add('search-suggestions__item');

            if(Array.isArray(sugg[filter])) { //si la propiedad es array, devolver elemento que coincide
                suggLi$$.textContent = sugg[filter].find(elem => elem.startsWith(term));
            } else {
                suggLi$$.textContent = sugg[filter];
            }
  
            suggLi$$.addEventListener('click', (e) => {
                const searchSuggestions$$ = document.querySelector('.search-suggestions');
                const searchInput$$ = document.querySelector('.search__input');
                searchInput$$.value = e.target.textContent;
                searchSuggestions$$.innerHTML = '';

                filterCards(cards);
            });

            searchSuggestions$$.appendChild(suggLi$$);
        });
    }
}


//////////////////////////////////////////////////////////////////////////////////////////
//AÑADIR POKEMONS A FAVORITOS

//cambia estilo de corazón en carta al clicar. Suma 1 al contador de likes del header
const likePokemons = (pokemons) => {
    let cardHearts$$ = document.querySelectorAll('.card-front__heart');
    let headerHeartNum$$ = document.querySelector('.header-heart__num');

    cardHearts$$.forEach(heart => heart.addEventListener('click', (e)=> {
        heart.classList.toggle('card-front__heart--liked');
        heart.classList.toggle('animate__swing');
        e.stopPropagation();
        if(heart.classList.contains('card-front__heart--liked')) {
            headerHeartNum$$.textContent = new Number(headerHeartNum$$.textContent) + 1;
            let thisPokemonName = heart.parentElement.children[0].textContent;
            addToFavs(thisPokemonName, pokemons);
        } else {
            headerHeartNum$$.textContent = new Number(headerHeartNum$$.textContent) - 1;
            let thisPokemonName = heart.parentElement.children[0].textContent;
            removeFromFavs(thisPokemonName);
        }
    }));   
}


const addToFavs = (favoriteName, pokemons) => {
    const favoritePokemon = pokemons.find(poke => poke.name === favoriteName);
    const favorites$$ = document.querySelector('.favorites-list');

    const favoriteLi$$ = document.createElement('li');
    favoriteLi$$.classList.add('favorites-list__item');

    favoriteLi$$.innerHTML = `
        <img src="${favoritePokemon.image}" alt="${favoritePokemon.name}">
        <h3>${favoritePokemon.name}</h3>
    `
    favorites$$.appendChild(favoriteLi$$);
}


const removeFromFavs = (notFavoriteAnymore) => {
    const favoritesLis$$ = document.querySelector('.favorites-list').children;
    console.log(favoritesLis$$, notFavoriteAnymore);
    for(const li of favoritesLis$$) {
        if(li.querySelector('h3').textContent === notFavoriteAnymore) {
            li.remove();
            break;
        }
    }
}


const favsMenuBehavior = () => {
    const headerHeart$$ = document.querySelector('.header-heart');
    const favoritesDiv$$ = document.querySelector('.favorites');
    const closeFavsIcon$$ = document.querySelector('.favorites__close');

    headerHeart$$.addEventListener('click', ()=> favoritesDiv$$.classList.toggle('favorites--visible'));

    closeFavsIcon$$.addEventListener('click', ()=> favoritesDiv$$.classList.toggle('favorites--visible'));
}


const init = async () => {
    //pillar primeros 150 pokemons
    let pokemons = await getPokemons();
    //quitar la animación de cargar cuando se cargue el fetch
    loader$$.classList.add('hidden');

    //crear cartas en html pokemons
    let cardsArray = createCards(pokemons);

    //mete las cartas en el elemento #pokedex de pokedex.html
    appendCards(cardsArray);

    //filtrar pokemons en base a términos de búsqueda
    let searchInput$$ = document.querySelector('.search__input');
    
    searchInput$$.addEventListener('input', () => filterCards(cardsArray));
    searchInput$$.addEventListener('input', () => getSearchSuggestions(pokemons, cardsArray));

    //favorites functionality
    likePokemons(pokemons);
    favsMenuBehavior();
}


//girar la flecha del select al clicar
const rotateSelectArrow = () => {
    const searchSelect$$ = document.querySelector('.search-select');
    const selectArrow$$ = document.querySelector('.search-select__arrow');
    console.log(searchSelect$$);
    searchSelect$$.onclick = function() {
        selectArrow$$.classList.toggle('rotate');
    }
}
rotateSelectArrow()

init();







