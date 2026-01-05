require("dotenv").config();
const axios = require("axios");

console.log("ENV FROM CONTROLLER:", {
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  GOOGLE_CSE_ID: process.env.GOOGLE_CSE_ID,
});



// ================================
// Sources considérées fiables
// ================================
const TRUSTED_DOMAINS = [
  ".edu",
  ".ac.",
  "um5.ac.ma",
  "uca.ma",
  "usmba.ac.ma",
  "uir.ac.ma",
  "aui.ma",
  "um6p.ma",
  "ocw.mit.edu",
  "stanford.edu",
  "cmu.edu",
  "openstax.org",
  "nptel.ac.in",
  "arxiv.org",
];

function hostOf(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

function isTrusted(url) {
  const h = hostOf(url);
  return TRUSTED_DOMAINS.some((d) => h.includes(d) || h.endsWith(d));
}

function toPdfItem(item) {
  return {
    title: item.title,
    url: item.link,
    source: hostOf(item.link),
    snippet: item.snippet || "",
  };
}

// ================================
// Google Custom Search
// ================================
async function googleSearch(q, num = 8) {
  const { data } = await axios.get("https://www.googleapis.com/customsearch/v1", {
    params: {
      key: process.env.GOOGLE_API_KEY,
      cx: process.env.GOOGLE_CSE_ID,
      q,
      num: Math.min(Math.max(num, 1), 10),
    },
    timeout: 20000,
  });

  return data.items || [];
}

// ================================
// Controller principal
// ================================
exports.searchAll = async (req, res) => {
  try {
    const { query, level } = req.body;

    if (!query) {
      return res.status(400).json({ message: "query obligatoire" });
    }

    const qBase = `${query} ${level || ""}`.trim();

    // ============================
    // 1) YouTube
    // ============================
    const yt = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        part: "snippet",
        q: qBase,
        type: "video",
        maxResults: 6,
        key: process.env.YOUTUBE_API_KEY,
      },
      timeout: 20000,
    });

    const videos = (yt.data.items || []).map((item) => ({
      title: item.snippet?.title,
      channel: item.snippet?.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
      thumbnail: item.snippet?.thumbnails?.medium?.url,
    }));

    // ============================
    // 2) PDF Cours
    // ============================
    const courseQuery = `${qBase} filetype:pdf (cours OR "support de cours" OR "lecture notes" OR polycopie)`;
    const courseItems = await googleSearch(courseQuery, 10);

    let pdfCourses = courseItems
      .map(toPdfItem)
      .filter((x) => (x.url || "").toLowerCase().includes(".pdf"))
      .filter((x) => isTrusted(x.url))
      .slice(0, 6);

    // ============================
    // 3) PDF Exercices corrigés
    // ============================
    const exoQuery = `${qBase} filetype:pdf ("exercices corrigés" OR corrigé OR solutions OR "problem set")`;
    const exoItems = await googleSearch(exoQuery, 10);

    let pdfExos = exoItems
      .map(toPdfItem)
      .filter((x) => (x.url || "").toLowerCase().includes(".pdf"))
      .filter((x) => isTrusted(x.url))
      .slice(0, 6);

    // ============================
    // 4) Fallback si whitelist trop stricte
    // ============================
    if (pdfCourses.length === 0) {
      pdfCourses = courseItems
        .map(toPdfItem)
        .filter((x) => (x.url || "").toLowerCase().includes(".pdf"))
        .slice(0, 6);
    }

    if (pdfExos.length === 0) {
      pdfExos = exoItems
        .map(toPdfItem)
        .filter((x) => (x.url || "").toLowerCase().includes(".pdf"))
        .slice(0, 6);
    }

    return res.json({
      query,
      level: level || null,
      videos,
      pdfCourses,
      pdfExos,
    });
  } catch (error) {
    console.log("====== SEARCH ERROR ======");
    console.log("STATUS:", error?.response?.status);
    console.log("URL:", error?.config?.url);
    console.log("PARAMS:", error?.config?.params);
    console.log("DATA:", JSON.stringify(error?.response?.data || {}, null, 2));
    console.log("==========================");

    return res.status(500).json({ message: "Erreur search backend" });
  }
};
