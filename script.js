const clientId = "94c9124a845d4f1e88364fa8c0eb6c22";
const clientSecret = "951b741e351348cebf03894f393bfb03";

const search = document.getElementById("search");
const help = document.getElementById("help");

let oldArtist = "";
help.innerHTML = `Type an artist name to get their top 50 songs from Spotify. Click on the song title to listen to a preview. Click on the artist name to open the artist's Spotify page.`;

async function getBearerToken() {
  return await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(clientId + ":" + clientSecret),
    },
    body: "grant_type=client_credentials&client_id=94c9124a845d4f1e88364fa8c0eb6c22&client_secret=951b741e351348cebf03894f393bfb03",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data) {
        const access_token = data.access_token;
        return access_token;
      }
    })
    .catch((error) => console.error("Error:", error));
}

async function getAllSongsBySpecificArtist(artist) {
  const access_token = await getBearerToken();

  return fetch(
    `https://api.spotify.com/v1/search?q=artist:${artist}&type=track&market=US&limit=50`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      method: "GET",
    }
  )
    .then((response) => response.json())
    .then((data) => {
      if (data) {
        const tracks = data.tracks.items;
        const sortedTracks = tracks.sort((a, b) => b.popularity - a.popularity);
        return sortedTracks;
      }
    })
    .catch((error) => console.error("Error:", error));
}

async function getArtistsLogo(artistId) {
  const access_token = await getBearerToken();

  return fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
    method: "GET",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data) {
        return data.images[0].url; 
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}



async function renderSongs(songs) {
  const list = document.getElementById("top-songs");
  list.innerHTML = "";

  const logoPromises = songs.map(async (song) => {
    const artistLogoUrl = await getArtistsLogo(song.artists[0].id);
    return artistLogoUrl;
  });

  const artistLogoUrls = await Promise.all(logoPromises);

  songs.forEach((song, index) => {
    const songTitle = document.createElement("li");
    const audioPlayer = document.createElement("audio");
    const artistLogoImg = document.createElement("img");
    const artistLogoUrl = artistLogoUrls[index];

    artistLogoImg.src = artistLogoUrl;
    artistLogoImg.alt = `${song.artists[0].name} logo`;
    artistLogoImg.className = "logo";
    songTitle.appendChild(artistLogoImg);

    songTitle.innerHTML += `<b>${song.name}</b> - <a href="${
      song.artists[0].external_urls.spotify
    }" class="song-artist">${song.artists[0].name}</a>`;

    if (song.preview_url === null) {
      const noPreviewSpan = document.createElement("span");
      noPreviewSpan.className = "no-preview";
      noPreviewSpan.textContent = "No preview available";
      songTitle.appendChild(noPreviewSpan);
    } else {
      audioPlayer.src = song.preview_url;
      audioPlayer.controls = true;
      songTitle.appendChild(audioPlayer);
    }

    songTitle.href = song.external_urls.spotify;
    songTitle.addEventListener("click", (e) => {
      window.location.href = song.external_urls.spotify;
    });

    list.appendChild(songTitle);
  });
}


search.addEventListener("input", (e) => {
  e.preventDefault();

  const allSongs = getAllSongsBySpecificArtist(search.value);
  allSongs.then((songs) => renderSongs(songs));
});
