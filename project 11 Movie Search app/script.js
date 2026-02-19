const API_KEY = '2c65241';
const API_URL = 'https://www.omdbapi.com/';

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const moviesGrid = document.getElementById('moviesGrid');
const trendingMovies = document.getElementById('trendingMovies');
const searchResults = document.getElementById('searchResults');
const loader = document.getElementById('loader');
const errorMsg = document.getElementById('errorMsg');
const modal = document.getElementById('movieModal');
const closeModal = document.querySelector('.close');
const favoriteBtn = document.getElementById('favoriteBtn');

let currentMovieId = null;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let debounceTimer;

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
    loadTrendingMovies();
});

// Search functionality
searchBtn.addEventListener('click', () => searchMovies(searchInput.value));
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchMovies(searchInput.value);
});

// Debounced search while typing
searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    if (e.target.value.length > 2) {
        debounceTimer = setTimeout(() => {
            searchMovies(e.target.value);
        }, 500);
    }
});

// Load trending movies
async function loadTrendingMovies() {
    const trendingTitles = ['Inception', 'Interstellar', 'The Dark Knight', 'Avengers', 'Spider-Man', 'Iron Man', 'Batman', 'Superman'];
    showLoader();
    
    try {
        const promises = trendingTitles.map(title => 
            fetch(`${API_URL}?apikey=${API_KEY}&s=${title}&type=movie`)
                .then(res => res.json())
        );
        
        const results = await Promise.all(promises);
        const movies = results.flatMap(data => data.Search || []).slice(0, 8);
        
        displayMovies(movies, trendingMovies);
    } catch (error) {
        showError('Failed to load trending movies');
    } finally {
        hideLoader();
    }
}

// Search movies
async function searchMovies(query) {
    if (!query.trim()) {
        showError('Please enter a movie name');
        return;
    }

    showLoader();
    hideError();
    
    try {
        const response = await fetch(`${API_URL}?apikey=${API_KEY}&s=${query}`);
        const data = await response.json();
        
        if (data.Response === 'True') {
            displayMovies(data.Search, moviesGrid);
            searchResults.classList.remove('hidden');
        } else {
            showError(data.Error || 'No movies found');
            searchResults.classList.add('hidden');
        }
    } catch (error) {
        showError('Failed to fetch movies. Please try again.');
    } finally {
        hideLoader();
    }
}

// Display movies in grid
function displayMovies(movies, container) {
    container.innerHTML = movies.map(movie => `
        <div class="movie-card" onclick="showMovieDetails('${movie.imdbID}')">
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/200x300?text=No+Image'}" 
                 alt="${movie.Title}">
            <div class="movie-info">
                <h3>${movie.Title}</h3>
                <div class="movie-meta">
                    <span>${movie.Year}</span>
                    <span>${movie.Type}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Show movie details in modal
async function showMovieDetails(imdbID) {
    showLoader();
    currentMovieId = imdbID;
    
    try {
        const response = await fetch(`${API_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`);
        const movie = await response.json();
        
        if (movie.Response === 'True') {
            document.getElementById('modalPoster').src = movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Image';
            document.getElementById('modalTitle').textContent = movie.Title;
            document.getElementById('modalYear').textContent = movie.Year;
            document.getElementById('modalRating').textContent = `⭐ ${movie.imdbRating}`;
            document.getElementById('modalRuntime').textContent = movie.Runtime;
            document.getElementById('modalGenre').textContent = movie.Genre;
            document.getElementById('modalPlot').textContent = movie.Plot;
            document.getElementById('modalDirector').textContent = movie.Director;
            document.getElementById('modalCast').textContent = movie.Actors;
            
            updateFavoriteButton();
            modal.classList.remove('hidden');
        }
    } catch (error) {
        showError('Failed to load movie details');
    } finally {
        hideLoader();
    }
}

// Close modal
closeModal.addEventListener('click', () => {
    modal.classList.add('hidden');
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
});

// Favorites functionality
favoriteBtn.addEventListener('click', () => {
    if (favorites.includes(currentMovieId)) {
        favorites = favorites.filter(id => id !== currentMovieId);
    } else {
        favorites.push(currentMovieId);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoriteButton();
});

function updateFavoriteButton() {
    if (favorites.includes(currentMovieId)) {
        favoriteBtn.textContent = '💚 Remove from Favorites';
        favoriteBtn.classList.add('active');
    } else {
        favoriteBtn.textContent = '❤️ Add to Favorites';
        favoriteBtn.classList.remove('active');
    }
}

// Utility functions
function showLoader() {
    loader.classList.remove('hidden');
}

function hideLoader() {
    loader.classList.add('hidden');
}

function showError(message) {
    errorMsg.textContent = message;
    errorMsg.classList.remove('hidden');
    setTimeout(() => hideError(), 5000);
}

function hideError() {
    errorMsg.classList.add('hidden');
}
