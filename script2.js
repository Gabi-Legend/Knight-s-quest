document.addEventListener("DOMContentLoaded", function () {
  // Obținem referințe către elementele DOM
  const startBtn = document.getElementById("startBtn");
  const selectMapBtn = document.getElementById("selectMapBtn");
  const mapSelectionMenu = document.getElementById("mapSelectionMenu");
  const confirmMapBtn = document.getElementById("confirmMapBtn");
  const cancelMapBtn = document.getElementById("cancelMapBtn");
  const mapOptions = document.querySelectorAll(".map-option");
  const gameCanvas = document.getElementById("gameCanvas");
  const menu = document.getElementById("menu");
  const loadingScreen = document.getElementById("loadingScreen");

  // Variabilă pentru a stoca harta selectată
  let selectedMap = "images/map.png"; // Harta implicită
  let mapConfirmed = false;

  // Afișăm meniul de selectare a hărții când se apasă butonul "Select Map"
  selectMapBtn.addEventListener("click", function () {
    menu.classList.add("hidden");
    mapSelectionMenu.classList.remove("hidden");
  });

  // Revenim la meniul principal când se apasă butonul "Cancel"
  cancelMapBtn.addEventListener("click", function () {
    mapSelectionMenu.classList.add("hidden");
    menu.classList.remove("hidden");
  });

  // Gestionăm selecția hărții
  mapOptions.forEach((option) => {
    option.addEventListener("click", function () {
      // Eliminăm clasa selected-map de la toate opțiunile
      mapOptions.forEach((opt) => opt.classList.remove("selected-map"));
      // Adăugăm clasa selected-map la opțiunea selectată
      this.classList.add("selected-map");
      // Stocăm harta selectată
      selectedMap = this.getAttribute("data-map");
    });
  });

  // Confirmăm selecția hărții
  confirmMapBtn.addEventListener("click", function () {
    mapSelectionMenu.classList.add("hidden");
    menu.classList.remove("hidden");
    mapConfirmed = true;

    // Actualizăm textul butonului Select Map pentru a indica harta selectată
    const mapName = document.querySelector(".selected-map p").textContent;
    selectMapBtn.textContent = `Map: ${mapName}`;
    selectMapBtn.classList.add("map-selected");
  });

  // Începem jocul când se apasă butonul "Start Adventure"
  startBtn.addEventListener("click", function () {
    // Ascundem meniul
    menu.classList.add("hidden");

    // Afișăm ecranul de încărcare
    loadingScreen.classList.remove("hidden");
    loadingScreen.style.display = "flex";

    // Setăm harta selectată ca fundal pentru canvas
    gameCanvas.style.backgroundImage = `url('${selectedMap}')`;

    // Simulăm încărcarea (la fel ca logica originală a jocului)
    setTimeout(function () {
      loadingScreen.classList.add("hidden");
      gameCanvas.style.display = "block";

      // Logică suplimentară pentru începerea jocului ar merge aici
      // Aceasta ar trebui să se potrivească cu ce se întâmplă când jocul începe efectiv

      // Afișăm butonul de upgrade care există deja în HTML-ul dvs.
      document.getElementById("upgradesBtn").classList.remove("hidden");

      // Ascundem butonul "mapBtn" (butonul pentru schimbarea hărții în timpul jocului)
      // dacă aveți un astfel de buton
      if (document.getElementById("mapBtn")) {
        document.getElementById("mapBtn").classList.add("hidden");
      }
    }, 2000);
  });
});
