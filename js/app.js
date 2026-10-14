
const API_URL = "https://dragonball-api.com/api/characters";

const searchForm = document.getElementById("searchForm");
const characterNameInput = document.getElementById("characterName");
const searchButton = document.getElementById("searchButton");
const showAllButton = document.getElementById("showAllButton");
const characterGrid = document.getElementById("characterGrid");
const feedback = document.getElementById("feedback");
const resultCount = document.getElementById("resultCount");
const resultsTitle = document.getElementById("resultsTitle");
const jsonOutput = document.getElementById("jsonOutput");
const copyJsonButton = document.getElementById("copyJsonButton");

let lastJsonData = null;

function showFeedback(message, type = "") {
    feedback.textContent = message;
    feedback.className = "feedback";

    if (type) {
        feedback.classList.add(type);
    }
}

function getCharacters(data) {
    // La API devuelve una lista dentro de "items".
    // Esta comprobación también permite manejar una lista directa.
    if (Array.isArray(data)) {
        return data;
    }

    if (data && Array.isArray(data.items)) {
        return data.items;
    }

    if (data && data.id) {
        return [data];
    }

    return [];
}

function createTag(text) {
    const tag = document.createElement("span");
    tag.className = "character-tag";
    tag.textContent = text || "No disponible";
    return tag;
}

function createStat(label, value) {
    const row = document.createElement("div");
    row.className = "character-stat";

    const labelElement = document.createElement("span");
    labelElement.textContent = label;

    const valueElement = document.createElement("strong");
    valueElement.textContent =
        value !== undefined && value !== null && value !== ""
            ? String(value)
            : "No disponible";

    row.append(labelElement, valueElement);
    return row;
}

function createCharacterCard(character) {
    const card = document.createElement("article");
    card.className = "character-card";

    const imageWrap = document.createElement("div");
    imageWrap.className = "character-image-wrap";

    const imageUrl = character.image;

    if (imageUrl) {
        const image = document.createElement("img");
        image.className = "character-image";
        image.src = imageUrl;
        image.alt = `Imagen de ${character.name || "personaje"}`;
        image.loading = "lazy";

        image.addEventListener("error", () => {
            image.remove();

            const fallback = document.createElement("p");
            fallback.className = "character-image-fallback";
            fallback.textContent = "Imagen no disponible";
            imageWrap.appendChild(fallback);
        });

        imageWrap.appendChild(image);
    } else {
        const fallback = document.createElement("p");
        fallback.className = "character-image-fallback";
        fallback.textContent = "Imagen no disponible";
        imageWrap.appendChild(fallback);
    }

    const info = document.createElement("div");
    info.className = "character-info";

    const name = document.createElement("h3");
    name.textContent = character.name || "Personaje sin nombre";

    const tags = document.createElement("div");
    tags.className = "character-tags";
    tags.append(
        createTag(character.race),
        createTag(character.gender)
    );

    const description = document.createElement("p");
    description.className = "character-description";
    description.textContent =
        character.description || "Este personaje no tiene una descripción disponible.";

    const stats = document.createElement("div");
    stats.append(
        createStat("Ki", character.ki),
        createStat("Ki máximo", character.maxKi),
        createStat(
            "Afiliación",
            character.affiliation
        )
    );

    info.append(name, tags, description, stats);
    card.append(imageWrap, info);

    return card;
}

function renderCharacters(characters) {
    characterGrid.replaceChildren();

    if (characters.length === 0) {
        showFeedback(
            "No se encontraron personajes. Prueba con otro nombre.",
            "error"
        );

        resultCount.textContent = "0 personajes";
        return;
    }

    const fragment = document.createDocumentFragment();

    characters.forEach((character) => {
        fragment.appendChild(createCharacterCard(character));
    });

    characterGrid.appendChild(fragment);

    resultCount.textContent =
        `${characters.length} personaje${characters.length === 1 ? "" : "s"}`;

    showFeedback("Los personajes se cargaron correctamente.", "success");
}

function displayJson(data) {
    lastJsonData = data;
    jsonOutput.textContent = JSON.stringify(data, null, 2);
}

async function loadCharacters(name = "") {
    const searchName = name.trim();

    searchButton.disabled = true;
    showAllButton.disabled = true;
    searchButton.textContent = "Consultando...";
    characterGrid.replaceChildren();

    showFeedback("Consultando la API pública de Dragon Ball...");
    resultCount.textContent = "Cargando...";
    jsonOutput.textContent = "Esperando respuesta del servidor...";

    try {
        const url = new URL(API_URL);

        if (searchName) {
            // La búsqueda se realiza en el servidor de la API.
            url.searchParams.set("name", searchName);
            resultsTitle.textContent = `Resultados para "${searchName}"`;
        } else {
            // Solicitamos una página con hasta 100 personajes.
            url.searchParams.set("page", "1");
            url.searchParams.set("limit", "100");
            resultsTitle.textContent = "Personajes destacados";
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `La API respondió con el estado HTTP ${response.status}.`
            );
        }

        const data = await response.json();
        displayJson(data);

        const characters = getCharacters(data);
        renderCharacters(characters);

        if (characters.length > 0 && searchName) {
            showFeedback(
                `Búsqueda completada: se encontraron ${characters.length} resultado(s).`,
                "success"
            );
        }
    } catch (error) {
        console.error("Error al consultar la API:", error);

        characterGrid.replaceChildren();
        resultCount.textContent = "Consulta fallida";

        showFeedback(
            "No fue posible obtener los personajes. Comprueba tu conexión e inténtalo de nuevo.",
            "error"
        );

        jsonOutput.textContent =
            `Error: ${error.message}\n\n` +
            "No se recibió una respuesta válida de la API.";
    } finally {
        searchButton.disabled = false;
        showAllButton.disabled = false;
        searchButton.textContent = "Buscar personaje";
    }
}

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = characterNameInput.value.trim();

    if (!name) {
        showFeedback(
            "Escribe el nombre de un personaje antes de buscar.",
            "error"
        );

        characterNameInput.focus();
        return;
    }

    loadCharacters(name);
});

showAllButton.addEventListener("click", () => {
    characterNameInput.value = "";
    loadCharacters();
});

copyJsonButton.addEventListener("click", async () => {
    if (lastJsonData === null) {
        showFeedback(
            "Todavía no hay datos JSON para copiar.",
            "error"
        );
        return;
    }

    try {
        await navigator.clipboard.writeText(
            JSON.stringify(lastJsonData, null, 2)
        );

        showFeedback("JSON copiado al portapapeles.", "success");
    } catch (error) {
        console.error("No se pudo copiar el JSON:", error);

        showFeedback(
            "El navegador no permitió copiar automáticamente. Puedes seleccionar y copiar el contenido del panel JSON.",
            "error"
        );
    }
});

// Cargar personajes al abrir la aplicación.
loadCharacters();
