import {lazyLoad} from './lazyLoad.js'; 
//ÍNDICE
//1 - FETCH, PINTAR Y FILTRAR POKEMONS
//2 - AÑADIR POKEMONS A LIKE
//3 - SACAR FOTOS DE POKEMONS

document.querySelectorAll('.data-simplebar').forEach(el => {
    new SimpleBar(el);
});

///////////////////////////////////////////////////////////////////////////////////////
//FETCH, PINTAR Y FILTRAR POKEMONS

//recibir los pokemons de la api
const getPokemons = async () => {
    let pokemons = [];

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/?limit=150&offset=150`);
        let pokemon = await response.json();
        pokemons = pokemon.results;
    } catch (error) {
        console.log(error);
    } 
    
    //llamada a la función que reduce cada objeto con los datos que vamos a usar
    return  mapPokemons(pokemons); 
}

const mapPokemons = async (pokemons) => {
    const pokemonsArr = [];

    for(let i = 0 ; i < pokemons.length ; i++) {
        const res = await fetch(pokemons[i].url);
        const pokeObj = await res.json();
        pokemonsArr.push( {
            name : pokeObj.name,
            image: pokeObj.sprites.front_default,
            image_back : pokeObj.sprites.back_default,
            types: pokeObj.types.map(type => type.type.name),
            experience : pokeObj.base_experience,
            abilities : pokeObj.abilities.map(ab => ab.ability.name),
            moves: pokeObj.moves.map(move=> move.move.name)
        });
    }
    return pokemonsArr;
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
                <img src="${pokemon.image}" alt="${pokemon.name}" class="card-front__img">
                <i class="fi fi-ss-heart card-front__heart animate__animated"></i>
            </div>
            <div class="card-back flip">
                <ul class="card-back-txt">
                    <li class="card-back-txt__item name">Nombre: ${pokemon.name}</li>
                    <li class="card-back-txt__item types">Tipos: ${pokemon.types.join(', ')}</li>
                    <li class="card-back-txt__item experience">Experiencia: ${pokemon.experience}</li>
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
const filterCards = (cards, select, input) => {
    
    let searchFilter = select.value;
    let searchTerm = input.value.toLowerCase();

    //filtra las cartas
    //filtrar el array de divs de cartas en lugar del array de pokemons
    //permite conservar los likes
    const filteredCards = cards.filter(card => {
        //coge <ul> de características del pokemon
        const cardUl$$ = Array.from(card.children[1].children[0].children);
        //selecciona el correspondiente al criterio de búsqueda
        const liToCheck = cardUl$$.find(li => li.classList.contains(`${searchFilter}`))
        //chequea si contiene el término de búsqueda
        return liToCheck.textContent.includes(searchTerm);   
    })

    //mete al html las cards filtradas
    appendCards(filteredCards);  
}


//recorre los pokemons buscando coincidencias en el texto de la propiedad que se está buscando para generar un array de sugerencias de búsqueda
//se llama desde un event listener en el input, declarado en la función init()
const getSearchSuggestions = (pokemons, cards, select, input) => {

     
    let searchFilter = select.value;
    let searchTerm = input.value.toLowerCase();
    let searchSuggestions = pokemons.filter(pokemon => {

        if(typeof pokemon[searchFilter] === 'number') {
            return pokemon[searchFilter].toString().startsWith(searchTerm); 
        }  else if (typeof pokemon[searchFilter] === 'string'){
            return pokemon[searchFilter].startsWith(searchTerm);
        } else {
            return pokemon[searchFilter].some(elem => elem.startsWith(searchTerm))
        }
    })

    //hacer lista de sugerencias sin elementos repetidos
    const suggestionsList = []
    searchSuggestions.forEach(sugg => {
        let match;
        Array.isArray(sugg[searchFilter]) 
                ? match = sugg[searchFilter].find(elem => elem.startsWith(searchTerm)) //si la propiedad es array, devolver elemento que coincide
                : match = sugg[searchFilter]; //sinó devolver todo el valor

        if(!suggestionsList.includes(match)) suggestionsList.push(match);
    })
    paintSearchSuggestions(cards, suggestionsList, select, searchTerm, input);
    
}


const paintSearchSuggestions = (cards, suggestionsList, select, term, input) => {
    //ul donde irán las sugerencias
    const searchSuggestions$$ = document.querySelector('.search-suggestions');

    if(term.length === 0) { //si se borra el input, vacía la lista
        searchSuggestions$$.innerHTML = '';
    } else  { 
        searchSuggestions$$.innerHTML = '';

        suggestionsList.forEach(sugg => {

            const suggLi$$ = document.createElement('li');
            suggLi$$.classList.add('search-suggestions__item');
            suggLi$$.textContent = sugg;

            //mete en el input la sugerencia clicada
            suggLi$$.addEventListener('click', (e) => {
                input.value = e.target.textContent;
                searchSuggestions$$.innerHTML = '';

                filterCards(cards, select, input);
            });

            searchSuggestions$$.appendChild(suggLi$$);
        });
    }
}


/////////////////////////////////////////////////////////////////////////////
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
    const favsCamera$$ = document.querySelector('.pics-favs');

    const favoriteLi$$ = document.createElement('li');
    favoriteLi$$.classList.add('favorites-list__item');

    favoriteLi$$.innerHTML = `
        <img src="${favoritePokemon.image}" alt="${favoritePokemon.name}">
        <h3>${favoritePokemon.name}</h3>
        <i class="favorites-list__item__delete">X</i>
    `

    // //boton borrar foto de la favoritos
    const deleteBtn$$ = favoriteLi$$.querySelector('.favorites-list__item__delete');
    deleteBtn$$.addEventListener('click', (e) => {
        e.target.parentElement.remove();
        removeFromFavs(favoritePokemon.name);
        //quitar corazón carta
        const cards$$ = document.querySelectorAll('.card');
        cards$$.forEach(crd => {
            if(crd.querySelector('.card-front__name').textContent === favoritePokemon.name) {
                crd.querySelector('.card-front__heart').classList.remove('card-front__heart--liked');
            }
        })

        removeFromCamFavs(favoritePokemon.image);
    })

    // favoriteLi$$.addEventListener('click', (e) => {putFavPokeInPic(e)});
    favorites$$.appendChild(favoriteLi$$);

    //añadir a la lista de favoritos de la cámara
    const camFav$$ = document.createElement('img');
    camFav$$.classList.add('pics-favs__item');
    camFav$$.setAttribute('src', favoritePokemon.image);
    camFav$$.addEventListener('click', putFavPokeInPic);
    favsCamera$$.appendChild(camFav$$);
}


const removeFromFavs = (notFavoriteAnymore) => {
    const favoritesLis$$ = document.querySelector('.favorites-list').children;
    let imgSrc;
     
    for(const li of favoritesLis$$) {
        if(li.querySelector('h3').textContent === notFavoriteAnymore) {
            imgSrc = li.querySelector('img').src;
            li.remove();
            break;
        }
    }
    removeFromCamFavs(imgSrc);
}

//eliminar de la lista en la función de cámara al eliminar de la lista favoritos
const removeFromCamFavs = (imageUrl) => {
    const camFavs$$ = document.querySelectorAll('.pics-favs__item');
    camFavs$$.forEach(fav => {
        if (fav.getAttribute('src') === imageUrl) {
            fav.remove();
        }
    })
}

const favsMenuBehavior = () => {
    const headerHeart$$ = document.querySelector('.header-heart');
    const favoritesDiv$$ = document.querySelector('.favorites');
    const closeFavsIcon$$ = document.querySelector('.favorites__close');

    headerHeart$$.addEventListener('click', ()=> favoritesDiv$$.classList.toggle('favorites--visible'));

    closeFavsIcon$$.addEventListener('click', ()=> favoritesDiv$$.classList.toggle('favorites--visible'));
}


//////////////////////////////////////////////////////////////////////////////
//FUNCIONALIDAD DE SACAR FOTOS
const picsModalBehavior = () => {
    const cameraIcon$$ = document.querySelector('.header__cam');
    const picsModal$$ = document.querySelector('.pics');
    const closeModalIcon$$ = document.querySelector('.pics__close');

    cameraIcon$$.addEventListener('click', ()=> picsModal$$.classList.toggle('pics--visible'));

    closeModalIcon$$.addEventListener('click', ()=> picsModal$$.classList.toggle('pics--visible'));
}


//poner un pokemon favorito en la foto al clicar (solo deja meter uno)
const putFavPokeInPic = (e) => {
    const picture$$ = document.querySelector('.pics-pic-image')
    const favPokeImg$$ = e.target.nodeName === 'IMG' ? e.target : e.target.previousElementSibling ;
    const pokeInPic$$ = document.querySelector('.pics-pic-image__poke');
    console.log(favPokeImg$$.src, 'src');

        pokeInPic$$.setAttribute('src' , favPokeImg$$.src);
        picture$$.appendChild(pokeInPic$$);

    pokeInPic$$.addEventListener('click', (e) => {removeFavPokeFromPic(e)});
       
}


//quitar pokemon de la foto al clicar
const removeFavPokeFromPic = (e) => {
    e.target.remove();
}


const takePic = () => {
    const picButton$$ = document.querySelector('.pics-pic-btn');
    const picture$$ = document.querySelector('.pics-pic-image');
    const galleryList$$ = document.querySelector('.gallery__list');
    const flash$$ = document.querySelector('.pics__flash');

    picButton$$.addEventListener('click', () => {
        const myPic$$ = document.createElement('li');
        myPic$$.classList.add('gallery-list-item');
        myPic$$.innerHTML = `
            <i class="gallery-list-item__delete">X</i>
            ${picture$$.outerHTML}
        `
        myPic$$.children[1].style.height = '100%';
        galleryList$$.appendChild(myPic$$);

        //boton borrar foto de la galería
        const deleteBtn$$ = myPic$$.querySelector('.gallery-list-item__delete');
        deleteBtn$$.addEventListener('click', (e) => e.target.parentElement.remove());

        //animation flash al clicar
        flash$$.classList.add('pics__flash--flashing');
        setTimeout(() => {
            flash$$.classList.remove('pics__flash--flashing');
        }, 300)

    })
}



const galleryBehavior = () => {
    const headerFrame$$ = document.querySelector('.header__frame');
    const galleryDiv$$ = document.querySelector('.gallery');
    const closeGalleryIcon$$ = document.querySelector('.gallery__close');
    
    
    headerFrame$$.addEventListener('click', ()=> galleryDiv$$.classList.toggle('gallery--visible'));

    closeGalleryIcon$$.addEventListener('click', ()=> galleryDiv$$.classList.toggle('gallery--visible'));
}


const changePicBgd = () => {
    const arrowLeft$$ = document.querySelector('.pics-pic-arrows').children[0];
    const arrowRight$$ = document.querySelector('.pics-pic-arrows').children[1];
    const picture$$ = document.querySelector('.pics-pic-image');

    const picBgds = [
        './assets/img/bgd-1.png',
        './assets/img/bgd-2.jpg',
        './assets/img/bgd-3.JPEG',
        './assets/img/bgd-4.jpg',
        './assets/img/bgd-5.jpg',
        './assets/img/bgd-6.WEBP'
    ]

    let i = 0;
    arrowRight$$.addEventListener('click', () => {
        picBgds[i+1] ? i++ : i = 0;
        picture$$.style.backgroundImage = `url('${picBgds[i]}')`;    
    })

    arrowLeft$$.addEventListener('click', () => {
        picBgds[i-1] ? i-- : i = picBgds.length - 1;
        picture$$.style.backgroundImage = `url('${picBgds[i]}')`;    
    })


}


////////////////////////////////////////////////////////////////////////////

const init = async () => {
    //pillar primeros 150 pokemons
    let pokemons = await getPokemons();
    //quitar la animación de cargar cuando se cargue el fetch
    const loader$$ = document.querySelector('.lds-roller');
    loader$$.classList.add('hidden');

    //crear cartas en html pokemons
    let cardsArray = createCards(pokemons);

    //mete las cartas en el elemento #pokedex de pokedex.html
    appendCards(cardsArray);

    //filtrar pokemons en base a términos de búsqueda
    let searchSelect$$ = document.querySelector('.search-select');
    let searchInput$$ = document.querySelector('.search__input');

    searchInput$$.addEventListener('input', () => filterCards(cardsArray, searchSelect$$, searchInput$$));
    searchInput$$.addEventListener('input', () => getSearchSuggestions(pokemons, cardsArray, searchSelect$$, searchInput$$));

    
    //funcionalidad favoritos
    likePokemons(pokemons);
    favsMenuBehavior();

    //funcionalidad sacar fotos
    picsModalBehavior(); 
    changePicBgd();
    takePic();
    galleryBehavior();
}

init();







