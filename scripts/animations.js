function animateTitle() {
    const titleLetters = document.querySelector('h1').children;

    for(let i = 0 ; i < titleLetters.length ; i++) {
        titleLetters[i].style.display = 'inline-block';
        titleLetters[i].classList.add('animate__animated' , 'animate__backInDown');
        titleLetters[i].style.animationDelay = `${(i + 1) / 20}s`;
        titleLetters[i].style.animationDuration = `.5s`;

    }
}

animateTitle();

//girar la flecha del select al clicar
const rotateSelectArrow = () => {
    const searchSelect$$ = document.querySelector('.search-select');
    const selectArrow$$ = document.querySelector('.search-select__arrow');
    searchSelect$$.onclick = function() {
        selectArrow$$.classList.toggle('rotate');
    }
}
rotateSelectArrow()



