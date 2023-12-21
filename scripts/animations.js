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



