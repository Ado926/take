const { PREFIX } = require(`${BASE_DIR}/config`);
const yts = require("yt-search");
const { formatViews, downloadVideoFromMultipleSources } = require(`${BASE_DIR}/services/youtube-downloader.js`);
const { InvalidParameterError } = require(`${BASE_DIR}/errors`);

module.exports = {
  name: "play-video",
  description: "Descargo videos y los envío.",
  commands: ["play-video", "pv", "ytmp4", "getvid"], // Added ytmp4, getvid from user example
  usage: `${PREFIX}play-video MC Hariel`,
  /**
   * @param {Object} props - The command properties.
   * @param {any} props.conn - The Baileys connection object.
   * @param {any} props.m - The message object.
   * @param {string} props.fullArgs - The full arguments for the command.
   * @param {function} props.sendWaitReact - Function to send a wait reaction.
   * @param {function} props.sendSuccessReact - Function to send a success reaction.
   * @param {function} props.sendErrorReply - Function to send an error reply.
   * @returns {Promise<void>}
   */
  handle: async ({
    conn,
    m,
    fullArgs,
    sendWaitReact,
    sendSuccessReact,
    sendErrorReply,
    // sendVideoFromURL and sendImageFromURL are no longer used directly
  }) => {
    if (!fullArgs.length) {
      throw new InvalidParameterError("¡Necesitas decirme qué quieres buscar!");
    }

    if (fullArgs.includes("http://") || fullArgs.includes("https://")) {
      throw new InvalidParameterError(
        `¡No puedes usar enlaces para buscar videos! Usa ${PREFIX}play-video <nombre del video>`
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

      let thumbBuffer;
      try {
        const thumbnailFile = await conn.getFile(thumbnail);
        thumbBuffer = thumbnailFile?.data;
      } catch (thumbError) {
        console.error("Error al obtener la miniatura:", thumbError);
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
            thumbnail: thumbBuffer,
            renderLargerThumbnail: true,
          },
        },
      };

      await conn.sendMessage(m.chat, { text: infoMessage }, { quoted: m, ...JT });
      await sendSuccessReact();

      // Construct sourcesArray for video download
      const ZENKEY_API_KEY = process.env.ZENKEY_API_KEY;
      // Note: User's original code used 'zenkey' as a fallback if ZENKEY_API_KEY was missing.
      // If a key is truly mandatory and no fallback should be used, this logic should be stricter (e.g., throw error).
      // For now, matching user's likely intent of having a default/fallback for Zenkey.

      const sourcesArray = [
        `https://api.siputzx.my.id/api/d/ytmp4?url=${videoUrl}`,
        `https://api.zenkey.my.id/api/download/ytmp4?apikey=${ZENKEY_API_KEY || 'zenkey'}&url=${videoUrl}`,
        `https://axeel.my.id/api/download/video?url=${encodeURIComponent(videoUrl)}`,
        `https://delirius-apiofc.vercel.app/download/ytmp4?url=${videoUrl}`
      ];

      if (!ZENKEY_API_KEY) {
          console.warn("ZENKEY_API_KEY no está configurada. La fuente de Zenkey podría fallar o usar una clave predeterminada/pública.");
          // Optionally send a message to chat if this is a common issue and not fatal.
          // await conn.reply(m.chat, "Advertencia: La API key de Zenkey no está configurada en el bot. Intentando otras fuentes...", m);
      }

      const videoResult = await downloadVideoFromMultipleSources(sourcesArray, title, thumbBuffer);

      if (videoResult.success && videoResult.videoData) {
        await conn.sendMessage(m.chat, {
          video: { url: videoResult.videoData.url },
          fileName: videoResult.videoData.fileName,
          mimetype: videoResult.videoData.mimetype,
          caption: videoResult.videoData.caption,
          thumbnail: videoResult.videoData.thumbnail // This is the thumbBuffer
        }, { quoted: m });
      } else {
        await sendErrorReply(videoResult.error || "⛔ No se pudo obtener el enlace de descarga del video desde ninguna fuente.");
      }

    } catch (error) {
      console.error("Error en el comando play-video:", error);
      if (error instanceof InvalidParameterError) {
        await sendErrorReply(error.message);
      } else {
        await sendErrorReply("Ocurrió un error procesando tu solicitud de video.");
      }
    }
  },
};
