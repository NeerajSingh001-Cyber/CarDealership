document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.querySelector('.product-grid');

    fetch('/cars')
        .then(r => r.json())
        .then(payload => {
            const cars = Array.isArray(payload) ? payload : (payload.data || []);
            productGrid.innerHTML = '';
            cars.forEach(car => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.dataset.price = car.price;     
                card.dataset.type  = car.type;       
                card.dataset.fuel  = car.fuel;
                card.innerHTML = `
                    <img src="${car.image}" alt="${car.name}">
                    <h2>${car.name}</h2>
                    <h3>Color: ${car.color}</h3>
                    <p>${car.description}</p>
                    <div class="price">₹${car.price.toLocaleString('en-IN')}</div>
                    <button onclick="viewDetails(${car.id})">View More Details</button>
                `;
                productGrid.appendChild(card);
            });
            initFilters();
            initSearch();
        })
        .catch(err => console.error('Error loading cars:', err));
});

function viewDetails(id) {
    sessionStorage.setItem('selectedCarId', id);
    window.location.href = 'cardetails.html';
}

let activeFilters = {
    budget: null,   
    type:   null,   
    fuel:   null    
};

function initFilters() {
    document.querySelectorAll('.filter-item').forEach(item => {
        item.addEventListener('click', () => {
            const type  = item.dataset.type;  
            const value = item.dataset.value;
            if (activeFilters[type] === value) {
                activeFilters[type] = null;
                item.classList.remove('active');
            } else {
                document.querySelectorAll(`.filter-item[data-type="${type}"]`)
                        .forEach(i => i.classList.remove('active'));

                activeFilters[type] = value;
                item.classList.add('active');
            }
            applyFilters();
        });
    });
}
function priceInLakhs(price) {
    return price / 100000;   
}

function applyFilters() {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        const price = Number(card.dataset.price);
        const type  = card.dataset.type;
        const fuel  = card.dataset.fuel;
        let show = true;
        if (activeFilters.budget) {
            const limit = {
                under50:  50,
                under100: 100,
                under500: 500,
                under1000:1000
            }[activeFilters.budget];
            if (priceInLakhs(price) > limit) show = false;
        }

        if (activeFilters.type && type !== activeFilters.type) show = false;
        if (activeFilters.fuel && fuel !== activeFilters.fuel) show = false;
        card.style.display = show ? '' : 'none';
    });
}
function initSearch() {
    const searchInput = document.querySelector('.search-bar input');
    const searchBtn   = document.querySelector('.search-bar button');
    const doSearch = () => {
        const term = searchInput.value.trim().toLowerCase();
        document.querySelectorAll('.product-card').forEach(card => {
            const name = card.querySelector('h2').textContent.toLowerCase();
            const filter = card.style.display !== 'none';
            card.style.display = (name.includes(term) && filter) ? '' : 'none';
        });
    };
    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keyup', e => { if (e.key === 'Enter') doSearch(); });
}