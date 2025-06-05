// Toggle Tema
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const html = document.documentElement;

themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    const isDark = html.classList.contains('dark');
    themeIcon.innerHTML = isDark
        ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>`
        : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>`;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Inisialisasi Tema
if (localStorage.getItem('theme') === 'dark') {
    html.classList.add('dark');
    themeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>`;
}

// Pencarian Anime
const searchButton = document.getElementById('search-button');
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const noResults = document.getElementById('no-results');

searchButton.addEventListener('click', async () => {
    const query = searchInput.value.trim();
    if (!query) return;

    // Tampilkan loading
    resultsContainer.innerHTML = '';
    loading.classList.remove('hidden');
    error.classList.add('hidden');
    noResults.classList.add('hidden');

    try {
        // Ambil data dari Jikan API (MyAnimeList)
        const malResponse = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=5`);
        const malData = await malResponse.json();

        // Ambil data dari AniList API
        const anilistResponse = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `
                    query ($search: String) {
                        Page {
                            media(search: $search, type: ANIME) {
                                title { romaji english native }
                                description
                                genres
                                tags { name }
                                format
                                startDate { year month day }
                                season
                                seasonYear
                                status
                                averageScore
                                studios { nodes { name } }
                            }
                        }
                    }
                `,
                variables: { search: query }
            })
        });
        const anilistData = await anilistResponse.json();

        // Gabungkan data
        const mergedData = mergeAnimeData(malData.data, anilistData.data.Page.media);

        // Tampilkan hasil
        displayResults(mergedData);
    } catch (err) {
        loading.classList.add('hidden');
        error.classList.remove('hidden');
        console.error(err);
    }
});

// Fungsi untuk menggabungkan data
function mergeAnimeData(malData, anilistData) {
    const merged = [];
    const titles = new Set();

    // Proses data MAL
    malData.forEach(anime => {
        const title = anime.title.toLowerCase();
        if (!titles.has(title)) {
            titles.add(title);
            merged.push({
                title_alternative: anime.title_english || anime.title_japanese || 'N/A',
                synopsis: anime.synopsis || 'N/A',
                genres: anime.genres.map(g => g.name).join(', ') || 'N/A',
                themes: anime.themes.map(t => t.name).join(', ') || 'N/A',
                demographics: anime.demographics.map(d => d.name).join(', ') || 'N/A',
                release_date: anime.aired?.string || 'N/A',
                season: anime.season ? `${anime.season} ${anime.year || ''}` : 'N/A',
                rating: anime.rating || 'N/A',
                score: anime.score || 'N/A',
                studios: anime.studios.map(s => s.name).join(', ') || 'N/A',
                producers: anime.producers.map(p => p.name).join(', ') || 'N/A'
            });
        }
    });

    // Proses data AniList
    anilistData.forEach(anime => {
        const title = (anime.title.romaji || anime.title.english || anime.title.native).toLowerCase();
        if (!titles.has(title)) {
            titles.add(title);
            merged.push({
                title_alternative: anime.title.english || anime.title.native || 'N/A',
                synopsis: anime.description?.replace(/<[^>]+>/g, '') || 'N/A',
                genres: anime.genres.join(', ') || 'N/A',
                themes: anime.tags.map(t => t.name).join(', ') || 'N/A',
                demographics: anime.format || 'N/A',
                release_date: anime.startDate ? `${anime.startDate.day}/${anime.startDate.month}/${anime.startDate.year}` : 'N/A',
                season: anime.season ? `${anime.season} ${anime.seasonYear}` : 'N/A',
                rating: 'N/A',
                score: anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A',
                studios: anime.studios.nodes.map(s => s.name).join(', ') || 'N/A',
                producers: 'N/A'
            });
        }
    });

    return merged;
}

// Fungsi untuk menampilkan hasil
function displayResults(animes) {
    loading.classList.add('hidden');
    resultsContainer.innerHTML = '';

    if (animes.length === 0) {
        noResults.classList.remove('hidden');
        return;
    }

    animes.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <p class="text-sm sm:text-base mb-2" data-clipboard="${anime.title_alternative}"><strong>Judul Alternatif:</strong> ${anime.title_alternative}</p>
            <p class="text-sm sm:text-base mb-2" data-clipboard="${anime.synopsis}"><strong>Sinopsis:</strong> ${anime.synopsis}</p>
            <p class="text-sm sm:text-base mb-2" data-clipboard="${anime.genres}"><strong>Genre:</strong> ${anime.genres}</p>
            <p class="text-sm sm:text-base mb-2" data-clipboard="${anime.themes}"><strong>Tag Tema:</strong> ${anime.themes}</p>
            <p class="text-sm sm:text-base mb-2" data-clipboard="${anime.demographics}"><strong>Demografi:</strong> ${anime.demographics}</p>
            <p class="text-sm sm:text-base mb-2" data-clipboard="${anime.release_date}"><strong>Tanggal Rilis:</strong> ${anime.release_date}</p>
            <p class="text-sm sm:text-base mb-2" data-clipboard="${anime.season}"><strong>Musim Rilis:</strong> ${anime.season}</p>
            <p class="text-sm sm:text-base mb-2" data-clipboard="${anime.rating}"><strong>Rating Penonton:</strong> ${anime.rating}</p>
            <p class="text-sm sm:text-base mb-2" data-clipboard="${anime.score}"><strong>Rating Anime:</strong> ${anime.score}</p>
            <p class="text-sm sm:text-base mb-2" data-clipboard="${anime.studios}"><strong>Studio:</strong> ${anime.studios}</p>
            <p class="text-sm sm:text-base mb-2" data-clipboard="${anime.producers}"><strong>Produser:</strong> ${anime.producers}</p>
        `;
        resultsContainer.appendChild(card);
    });

    // Tambahkan event listener untuk salin teks
    resultsContainer.querySelectorAll('p[data-clipboard]').forEach(element => {
        element.addEventListener('click', () => {
            const text = element.getAttribute('data-clipboard');
            navigator.clipboard.writeText(text).then(() => {
                alert('Teks disalin: ' + text.slice(0, 50) + (text.length > 50 ? '...' : ''));
            });
        });
    });
}
