const fetch = require("node-fetch");
const axios = require("axios");

// Definición de formatos de audio y video (puede ser útil tenerlos aquí o pasarlos si es necesario)
const formatAudio = ["mp3", "m4a", "webm", "acc", "flac", "opus", "ogg", "wav"];
const formatVideo = ["360", "480", "720", "1080", "1440", "4k"];

const ddownr = {
  download: async (url, format, apiKey) => {
    if (!apiKey) {
      throw new Error("API key para ddownr.download es requerida.");
    }
    if (!formatAudio.includes(format) && !formatVideo.includes(format)) {
      throw new Error("⚠ Formato no soportado, elige uno de la lista disponible.");
    }

    // La API Key está hardcodeada aquí temporalmente. Se modificará en el siguiente paso.
    const config = {
      method: "GET",
      url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=${apiKey}`,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, como Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    };

    try {
      const response = await axios.request(config);
      if (response.data?.success) {
        const { id, title, info } = response.data;
        // Nota: cekProgress también tiene una URL hardcodeada que necesitará atención.
        const downloadUrl = await ddownr.cekProgress(id);
        return { id, title, image: info.image, downloadUrl };
      } else {
        throw new Error("⛔ No se pudo obtener los detalles del video.");
      }
    } catch (error) {
      console.error("❌ Error en ddownr.download:", error);
      throw error;
    }
  },

  cekProgress: async (id) => {
    // La URL está hardcodeada aquí temporalmente. Se modificará en el siguiente paso.
    const config = {
      method: "GET",
      url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, como Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    };

    try {
      while (true) {
        const response = await axios.request(config);
        if (response.data?.success && response.data.progress === 1000) {
          return response.data.download_url;
        }
        // Esperar 5 segundos antes de reintentar
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error("❌ Error en ddownr.cekProgress:", error);
      throw error;
    }
  }
};

// Función para formatear vistas (tomada del código original)
function formatViews(views) {
  if (typeof views !== "number") return "Desconocido";
  return views >= 1000 ? (views / 1000).toFixed(1) + "k (" + views.toLocaleString() + ")" : views.toString();
}

// Exportar las funciones que se utilizarán en los comandos
async function downloadVideoFromMultipleSources(sources, videoTitle, videoThumbnail) {
  if (!sources || !sources.length) {
    return { success: false, error: "No se proporcionaron fuentes de descarga de video." };
  }
  if (!videoTitle) {
    // Usar un nombre genérico si no se proporciona título
    videoTitle = "video_descargado";
  }

  let success = false;
  for (let sourceUrl of sources) {
    try {
      // Asumimos que node-fetch ya está importado como 'fetch' en este archivo
      const res = await fetch(sourceUrl); // Las URLs ya vienen con API keys embebidas desde el comando

      // Intentar obtener la URL de descarga. La estructura del JSON puede variar.
      // Esto es una suposición basada en el código original del handler.
      // Puede necesitar ajustes si las APIs reales devuelven estructuras diferentes.
      let jsonData;
      try {
        jsonData = await res.json();
      } catch (e) {
        console.error(`Error al parsear JSON de ${sourceUrl}:`, e.message);
        // Si no es JSON, podría ser un stream directo? Por ahora asumimos JSON.
        // Si la respuesta no es OK, también es un problema.
        if (!res.ok) {
             console.error(`Error de red/servidor para ${sourceUrl}: ${res.status} ${res.statusText}`);
             continue; // Probar la siguiente fuente
        }
        // Si no es JSON y la respuesta es OK, no sabemos cómo manejarla por ahora.
        continue;
      }

      const { data, result, downloads } = jsonData; // Destructuración común
      let downloadUrl = data?.dl || result?.download?.url || downloads?.url || data?.download?.url || result?.url; // Añadido result?.url

      if (downloadUrl) {
        success = true;
        return {
          success: true,
          videoData: {
            url: downloadUrl,
            fileName: `${videoTitle}.mp4`,
            mimetype: "video/mp4",
            caption: `⚔ Aquí tienes tu video descargado por Kirito-Bot MD ⚔`, // Este mensaje puede ser parametrizado luego si es necesario
            thumbnail: videoThumbnail, // Esto es el buffer de la imagen
          }
        };
      }
    } catch (e) {
      console.error(`⚠ Error con la fuente ${sourceUrl}:`, e.message);
      // Continuar con la siguiente fuente
    }
  }

  if (!success) {
    return { success: false, error: "⛔ *Error:* No se encontró un enlace de descarga válido después de intentar todas las fuentes." };
  }
}

module.exports = { ddownr, formatViews, downloadVideoFromMultipleSources };
