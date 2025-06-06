/**
 * Funciones de comunicación
 * con la API de Spider X.
 *
 * @author Dev Gui
 */
const axios = require("axios");

const { SPIDER_API_BASE_URL } = require("../config");

exports.play = async (type, search, apiKey) => {
  if (!search) {
    throw new Error("¡Necesitas decirme qué quieres buscar!");
  }

  const { data } = await axios.get(
    `${SPIDER_API_BASE_URL}/downloads/play-${type}?search=${encodeURIComponent(
      search
    )}&api_key=${apiKey}`
  );

  return data;
};

exports.download = async (type, url, apiKey) => {
  if (!url) {
    throw new Error(
      "¡Necesita proporcionar una URL de YouTube de lo que desea buscar!"
    );
  }

  const { data } = await axios.get(
    `${SPIDER_API_BASE_URL}/downloads/${type}?url=${encodeURIComponent(
      url
    )}&api_key=${apiKey}`
  );

  return data;
};

exports.gemini = async (text, apiKey) => {
  if (!text) {
    throw new Error("¡Necesitas informar el parámetro de texto!");
  }

  const { data } = await axios.post(
    `${SPIDER_API_BASE_URL}/ai/gemini?api_key=${apiKey}`,
    {
      text,
    }
  );

  return data.response;
};

exports.attp = async (text, apiKey) => {
  if (!text) {
    throw new Error("¡Necesitas informar el parámetro de texto!");
  }

  return `${SPIDER_API_BASE_URL}/stickers/attp?text=${encodeURIComponent(
    text
  )}&api_key=${apiKey}`;
};

exports.ttp = async (text, apiKey) => {
  if (!text) {
    throw new Error("¡Necesitas informar el parámetro de texto!");
  }

  return `${SPIDER_API_BASE_URL}/stickers/ttp?text=${encodeURIComponent(
    text
  )}&api_key=${apiKey}`;
};

exports.search = async (type, search, apiKey) => {
  if (!search) {
    throw new Error("¡Necesita informar el parámetro de búsqueda!");
  }

  const { data } = await axios.get(
    `${SPIDER_API_BASE_URL}/search/${type}?search=${encodeURIComponent(
      search
    )}&api_key=${apiKey}`
  );

  return data;
};

exports.welcome = (title, description, imageURL, apiKey) => {
  if (!title || !description || !imageURL) {
    throw new Error(
      "¡Debe proporcionar el título, la descripción y la URL de la imagen!"
    );
  }

  return `${SPIDER_API_BASE_URL}/canvas/welcome?title=${encodeURIComponent(
    title
  )}&description=${encodeURIComponent(
    description
  )}&image_url=${encodeURIComponent(imageURL)}&api_key=${apiKey}`;
};

exports.exit = (title, description, imageURL, apiKey) => {
  if (!title || !description || !imageURL) {
    throw new Error(
      "¡Debe proporcionar el título, la descripción y la URL de la imagen!"
    );
  }

  return `${SPIDER_API_BASE_URL}/canvas/goodbye?title=${encodeURIComponent(
    title
  )}&description=${encodeURIComponent(
    description
  )}&image_url=${encodeURIComponent(imageURL)}&api_key=${apiKey}`;
};

exports.imageAI = async (type, description, apiKey) => {
  if (!description) {
    throw new Error("¡Necesitas informar la descripción de la imagen!");
  }

  const paramSearch = type === "stable-diffusion-turbo" ? "search" : "text";

  const { data } = await axios.get(
    `${SPIDER_API_BASE_URL}/ai/${type}?${paramSearch}=${encodeURIComponent(
      description
    )}&api_key=${apiKey}`
  );

  return data;
};

exports.canvas = (type, imageURL, apiKey) => {
  if (!imageURL) {
    throw new Error("¡Necesitas informar la URL de la imagen!");
  }

  return `${SPIDER_API_BASE_URL}/canvas/${type}?image_url=${encodeURIComponent(
    imageURL
  )}&api_key=${apiKey}`;
};
