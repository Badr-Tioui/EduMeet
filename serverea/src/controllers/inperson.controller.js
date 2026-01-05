const axios = require("axios");
const cheerio = require("cheerio");

// --- Helpers ---
function getImageFromCSE(item) {
  const pm = item?.pagemap || {};
  const thumb = pm?.cse_thumbnail?.[0]?.src;
  const img = pm?.cse_image?.[0]?.src;
  return thumb || img || "";
}

function extractOgImage(html) {
  // og:image
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (og) return og;

  // twitter:image
  const tw = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (tw) return tw;

  return "";
}

function normalizePhone(raw) {
  if (!raw) return "";
  let s = String(raw).trim().replace(/[^\d+]/g, "");

  // Maroc: 06/07 -> +2126/+2127
  if (/^0[67]\d{8}$/.test(s)) s = "+212" + s.slice(1);
  if (/^212[67]\d{8}$/.test(s)) s = "+" + s;

  return s;
}

function extractPhones(html) {
  const out = new Set();

  // tel:
  const tel = html.match(/href=["']tel:([^"']+)["']/gi) || [];
  for (const m of tel) {
    const v = m.replace(/.*href=["']tel:/i, "").replace(/["'].*/g, "");
    const n = normalizePhone(v);
    if (n) out.add(n);
  }

  // whatsapp links
  const wa = html.match(/https?:\/\/(wa\.me|api\.whatsapp\.com)\/[^\s"'<>]+/gi) || [];
  for (const u of wa) {
    const digits = u.replace(/\D/g, "");
    const n = normalizePhone(digits.startsWith("0") ? digits : "+" + digits);
    if (n) out.add(n);
  }

  // text patterns (+212 / 06 / 07)
  const text =
    html.match(
      /(\+212\s?[67]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}|0[67]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2})/g
    ) || [];
  for (const t of text) {
    const n = normalizePhone(t);
    if (n) out.add(n);
  }

  return Array.from(out);
}

function extractAddressBasic(html) {
  const street = html.match(/"streetAddress"\s*:\s*"([^"]+)"/i)?.[1] || "";
  const locality = html.match(/"addressLocality"\s*:\s*"([^"]+)"/i)?.[1] || "";
  const region = html.match(/"addressRegion"\s*:\s*"([^"]+)"/i)?.[1] || "";
  const parts = [street, locality, region].filter(Boolean);
  return parts.length ? parts.join(", ") : "";
}

function mapsDirections(destination) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function classifyResult(url = "") {
  const u = url.toLowerCase();
  const platforms = ["superprof", "apprentus", "preply", "tutoring", "linkedin"];
  const isPlatform = platforms.some((d) => u.includes(d));
  return { isPlatform };
}

async function googleCSE(query, num = 10) {
  const { data } = await axios.get("https://www.googleapis.com/customsearch/v1", {
    params: {
      key: process.env.GOOGLE_API_KEY,
      cx: process.env.GOOGLE_CSE_ID,
      q: query,
      num: Math.min(Math.max(num, 1), 10),
    },
    timeout: 20000,
  });
  return data.items || [];
}

async function fetchHtml(url) {
  const r = await axios.get(url, {
    timeout: 15000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    validateStatus: (s) => s >= 200 && s < 400,
  });
  return String(r.data || "");
}

function findContactUrl(baseUrl, html) {
  try {
    const $ = cheerio.load(html);
    const anchors = $("a")
      .map((_, a) => ({
        href: $(a).attr("href") || "",
        text: ($(a).text() || "").toLowerCase(),
      }))
      .get();

    const cand = anchors.find(
      (a) => a.text.includes("contact") || a.text.includes("contacter") || a.text.includes("nous contacter")
    );

    if (cand?.href) {
      const href = cand.href.trim();
      if (href.startsWith("http")) return href;
      const u = new URL(baseUrl);
      return new URL(href, u.origin).toString();
    }

    const u = new URL(baseUrl);
    return `${u.origin}/contact`;
  } catch {
    return "";
  }
}

/* =========================
   ✅ NOUVEAU: Scoring + Query "Soutien"
========================= */
function scoreTutoringIntent(item) {
  const t = `${item.title || ""} ${item.snippet || ""} ${item.link || ""}`.toLowerCase();

  const POS = [
    "cours particuliers",
    "soutien",
    "soutien scolaire",
    "professeur particulier",
    "cours à domicile",
    "a domicile",
    "tuteur",
    "coach",
    "annonce",
    "tarif",
    "dh",
    "mad",
    "réserver",
    "reservation",
    "heures",
    "h/",
  ];

  const NEG = [
    "université",
    "faculté",
    "departement",
    "enseignant-chercheur",
    "chercheur",
    "publication",
    "research",
    "paper",
    "portfolio",
    "cv",
    "linkedin",
    "wikipedia",
    ".pdf",
  ];

  let score = 0;
  for (const w of POS) if (t.includes(w)) score += 2;
  for (const w of NEG) if (t.includes(w)) score -= 3;

  const bonusDomains = ["apprentus", "superprof", "preply", "tutor", "cours"];
  if (bonusDomains.some((d) => (item.link || "").toLowerCase().includes(d))) score += 2;

  return score;
}

function buildQuery(city, subject) {
  const cityQ = `"${city}" OR "${city.replace("è", "e").replace("é", "e")}"`;
  const subjQ = `"${subject}" OR ${subject}`;

  return `("cours particuliers" OR "soutien scolaire" OR "soutien" OR "professeur particulier" OR "cours à domicile" OR "annonce")
(${subjQ})
(${cityQ})
-université -faculté -departement -research -publication -cv -portfolio -linkedin -wikipedia -pdf`;
}

/* =========================
   ✅ Controller
========================= */
exports.inpersonSearch = async (req, res) => {
  try {
    const { city, subject } = req.body;
    if (!city || !subject) {
      return res.status(400).json({ message: "city et subject sont obligatoires." });
    }

    // ✅ 1) Query orientée “soutien”
    const q = buildQuery(city, subject);

    // ✅ 2) Google CSE
    const items = await googleCSE(q, 10);

    // ✅ 3) Filtrage par scoring (tutoring intent)
    const filtered = items
      .map((it) => ({ it, score: scoreTutoringIntent(it) }))
      .filter((x) => x.score >= 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.it);

    // ✅ 4) Si rien → indisponible
    if (filtered.length === 0) {
      return res.json({
        city,
        subject,
        inPerson: [],
        message: `Indisponible: ما لقيناش أساتذة soutien لـ ${subject} فـ ${city}.`,
      });
    }

    // ✅ 5) Enrichissement (scrape tel + contact)
    const results = await Promise.all(
      filtered.map(async (it) => {
        let imageUrl = getImageFromCSE(it);
        const name = it.title || "Prof / Centre";
        const url = it.link || "";
        const snippet = it.snippet || "";

        const { isPlatform } = classifyResult(url);

        let phone = "Non disponible";
        let whatsapp = "";
        let address = "";
        let mapsUrl = mapsDirections(`${name} ${city}`);

        if (!url) {
          return { name, address: snippet, phone, whatsapp, url, mapsUrl, kind: isPlatform ? "prof" : "centre" };
        }

        try {
          const html = await fetchHtml(url);

          if (!imageUrl) {
            const ogImg = extractOgImage(html);
            if (ogImg) imageUrl = ogImg;
          }

          // phone on main page
          const phones = extractPhones(html);
          if (phones.length) {
            phone = phones[0];
            whatsapp = phones.length > 1 ? phones[1] : "";
          }

          address = extractAddressBasic(html);

          // if not platform and no phone → try contact page
          if (!isPlatform && phone === "Non disponible") {
            const contactUrl = findContactUrl(url, html);
            if (contactUrl) {
              try {
                const contactHtml = await fetchHtml(contactUrl);
                const p2 = extractPhones(contactHtml);
                if (p2.length) {
                  phone = p2[0];
                  whatsapp = p2.length > 1 ? p2[1] : "";
                }
                if (!address) address = extractAddressBasic(contactHtml);
              } catch {}
            }
          }

          const destination = address && address.length > 6 ? address : `${name} ${city}`;
          mapsUrl = mapsDirections(destination);
        } catch {
          // ignore scrape errors
        }

        if (!address) address = snippet;

        return { name, address, phone, whatsapp, url, mapsUrl, imageUrl, kind: isPlatform ? "prof" : "centre" };
      })
    );

    return res.json({ city, subject, inPerson: results });
  } catch (e) {
    console.error(e?.response?.data || e.message);
    return res.status(500).json({ message: "Erreur inperson-search" });
  }
};
