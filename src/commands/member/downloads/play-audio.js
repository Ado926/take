const { PREFIX } = require(`${BASE_DIR}/config`);
const yts = require("yt-search");
const { ddownr, formatViews } = require(`${BASE_DIR}/services/youtube-downloader.js`);
const { InvalidParameterError } = require(`${BASE_DIR}/errors`);

module.exports = {
  name: "play-audio",
  description: "Descargo música y la envío.",
  commands: ["play-audio", "play", "pa"],
  usage: `${PREFIX}play-audio MC Hariel`,
  /**
   * @param {Object} props - The command properties.
   * @param {any} props.conn - The Baileys connection object.
   * @param {any} props.m - The message object.
   * @param {function} props.sendAudioFromURL - Function to send audio from URL.
   * @param {string} props.fullArgs - The full arguments for the command.
   * @param {function} props.sendWaitReact - Function to send a wait reaction.
   * @param {function} props.sendSuccessReact - Function to send a success reaction.
   * @param {function} props.sendErrorReply - Function to send an error reply.
   * @returns {Promise<void>}
   */
  handle: async ({
    conn,
    m,
    sendAudioFromURL, // Keep this prop if it's preferred for sending audio
    fullArgs,
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
  }) => {
    if (!fullArgs.length) {
      // This error is for invalid parameters, not a processing error, so throw is fine.
      throw new InvalidParameterError("¡Necesitas decirme qué quieres buscar!");
    }

    // The original file had this check, keeping it.
    if (fullArgs.includes("http://") || fullArgs.includes("https://")) {
      throw new InvalidParameterError(
        `¡No puedes usar enlaces para buscar música! Usa ${PREFIX}play-audio <nombre de la canción>`
      );
    }

    await sendWaitReact();

    try {
      const searchResults = await yts(fullArgs);
      if (!searchResults.all || searchResults.all.length === 0) {
        await sendErrorReply("⚠ No se encontraron resultados para tu búsqueda.");
        return;
      }

      const videoInfo = searchResults.all[0];
      const { title, thumbnail, timestamp, views, ago, url: videoUrl } = videoInfo;
      const vistas = formatViews(views);

      // Fetch thumbnail buffer
      // Using a try-catch for getFile as it might fail for various reasons
      let thumbBuffer;
      try {
        const thumbnailFile = await conn.getFile(thumbnail);
        thumbBuffer = thumbnailFile?.data;
      } catch (thumbError) {
        console.error("Error al obtener la miniatura:", thumbError);
        // Not fatal, can proceed without thumbnail in JT if needed, or use a default
      }

      const infoMessage = `🫆
\`Kirito-Bot - Descargas\`
✦ Título: ${title}
◆ ▬▬▬▬▬▬ ❴✪❵ ▬▬▬▬▬▬ ◆ ✰ Duración: ${timestamp}
◆ ▬▬▬▬▬▬ ❴✪❵ ▬▬▬▬▬▬ ◆ ✰ Vistas: ${vistas}
◆ ▬▬▬▬▬▬ ❴✪❵ ▬▬▬▬▬▬ ◆ ✰ Canal: ${(videoInfo.author?.name) || "Desconocido"}
◆ ▬▬▬▬▬▬ ❴✪❵ ▬▬▬▬▬▬ ◆ ✰ Publicado: ${ago}
◆ ▬▬▬▬▬▬ ❴✪❵ ▬▬▬▬▬▬ ◆ ∞ Enlace: ${videoUrl}`;

      const JT = {
        contextInfo: {
          externalAdReply: {
            title: "𝐊𝐢𝐫𝐢𝐭𝐨 ☆ 𝐁𝐨𝐭 𝐌𝐃 ฅ՞•ﻌ•՞ฅ",
            body: "𝑬𝒍 𝒎𝒆𝒋𝒐𝒓 𝑩𝒐𝒕 𝒅𝒆 𝑾𝒉𝒂𝒕𝒔𝑨𝒑𝒑",
            mediaType: 1,
            previewType: 0,
            mediaUrl: videoUrl,
            sourceUrl: videoUrl,
            thumbnail: thumbBuffer, // thumbBuffer can be undefined here
            renderLargerThumbnail: true,
          },
        },
      };

      await conn.sendMessage(m.chat, { text: infoMessage }, { quoted: m, ...JT });
      await sendSuccessReact(); // React after sending info message

      const OCEANSAVER_API_KEY = process.env.OCEANSAVER_API_KEY;
      if (!OCEANSAVER_API_KEY) {
        // This is a server-side configuration error.
        console.error("La API key de Oceansaver no está configurada.");
        await sendErrorReply("Error de configuración del bot: Falta la API key para la descarga de audio.");
        return;
      }

      const audioData = await ddownr.download(videoUrl, "mp3", OCEANSAVER_API_KEY);

      if (audioData && audioData.downloadUrl) {
        // Using conn.sendMessage directly as per user's handler structure
        await conn.sendMessage(m.chat, {
            audio: { url: audioData.downloadUrl },
            mimetype: "audio/mpeg",
            // ptt: true, // Optional: if you want it as a voice note
        }, { quoted: m });
      } else {
        await sendErrorReply("⛔ No se pudo obtener el enlace de descarga del audio.");
      }
    } catch (error) {
      console.error("Error en el comando play-audio:", error);
      // Check if the error is an InvalidParameterError, if so, rethrow or handle as specific user input error
      if (error instanceof InvalidParameterError) {
          await sendErrorReply(error.message); // Send the specific message from InvalidParameterError
      } else {
          await sendErrorReply("Ocurrió un error procesando tu solicitud de audio.");
      }
    }
  },
};
