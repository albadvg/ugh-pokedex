export function lazyLoad(cards) {

    if("IntersectionObserver" in window) {
        // let lazyElements = document.querySelectorAll('.lazy');
    
        let observer = new IntersectionObserver (
            (entries, observer) => {
                entries.forEach(entry => {
                    if(!entry.isIntersecting) return ;
                    
                    const lazyElem = entry.target;
                    lazyElem.classList.add('lazy__loaded');
                    observer.unobserve(lazyElem);
                });
            },
            {
                threshold : [.7]
            }       
        );
        
        cards.forEach(card =>  
            observer.observe(card)
        );
    }
}



