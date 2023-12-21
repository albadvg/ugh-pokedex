export function lazyLoad(card) {

    if("IntersectionObserver" in window) {
    
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
        
        
        observer.observe(card)
        
    }
}



