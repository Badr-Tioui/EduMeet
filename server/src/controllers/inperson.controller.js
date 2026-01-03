const axios = require("axios");
const cheerio = require("cheerio");

// --- Helpers ---
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
    html.match(/(\+212\s?[67]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}|0[67]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2})/g) || [];
  for (const t of text) {
    const n = normalizePhone(t);
    if (n) out.add(n);
  }

  return Array.from(out);
}

function extractAddressBasic(html) {
  // JSON-LD address (best effort)
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

  // Plateformes “profs” (tel souvent privé)
  const platforms = [
    "superprof",
    "apprentus",
    "preply",
    "tutoring",
    "linkedin",
  ];

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
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
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

    // candidates by label
    const cand = anchors.find((a) => a.text.includes("contact") || a.text.includes("contacter") || a.text.includes("nous contacter"));
    if (cand?.href) {
      // absolute or relative
      const href = cand.href.trim();
      if (href.startsWith("http")) return href;
      const u = new URL(baseUrl);
      return new URL(href, u.origin).toString();
    }

    // fallback common paths
    const u = new URL(baseUrl);
    return `${u.origin}/contact`;
  } catch {
    return "";
  }
}

// --- Controller ---
exports.inpersonSearch = async (req, res) => {
  try {
    const { city, subject } = req.body;
    if (!city || !subject) {
      return res.status(400).json({ message: "city et subject sont obligatoires." });
    }

    // ✅ Requête mixte “centres + profs”
    // - centres / soutien : augmente chances de tel public
    // - prof / cours particuliers : garde les profils plateformes
    const q =
      `(${subject} ${city} "cours particuliers") OR ` +
      `(prof ${subject} ${city}) OR ` +
      `("centre de soutien" ${subject} ${city}) OR ` +
      `("soutien scolaire" ${subject} ${city}) OR ` +
      `("centre de formation" ${subject} ${city})`;

    const items = await googleCSE(q, 10);
    const top = items.slice(0, 8);

    const results = await Promise.all(
      top.map(async (it) => {
        const name = it.title || "Prof / Centre";
        const url = it.link || "";
        const snippet = it.snippet || "";

        const { isPlatform } = classifyResult(url);

        let phone = "Non disponible";
        let whatsapp = "";
        let address = "";
        let mapsUrl = mapsDirections(`${name} ${city}`);

        // ⚙️ Si pas d’URL, fallback
        if (!url) {
          return { name, address: snippet, phone, whatsapp, url, mapsUrl };
        }

        // ⚡ Pour plateformes: on ne s’acharne pas (tel souvent absent), on garde le lien
        // Pour centres: on tente HTML + page contact
        try {
          const html = await fetchHtml(url);

          // 1) Tel/WhatsApp sur page principale
          const phones = extractPhones(html);
          if (phones.length) {
            phone = phones[0];
            whatsapp = phones.length > 1 ? phones[1] : "";
          }

          // 2) Adresse JSON-LD si possible
          address = extractAddressBasic(html);

          // 3) Si centre (non-platform) et pas de tel → tenter page contact
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

          // 4) Itinéraire : si adresse trouvée → destination = adresse, sinon name+city
          const destination = address && address.length > 6 ? address : `${name} ${city}`;
          mapsUrl = mapsDirections(destination);
        } catch {
          // si scrape échoue, on garde snippet + lien
        }

        // fallback address = snippet
        if (!address) address = snippet;

        return { name, address, phone, whatsapp, url, mapsUrl, kind: isPlatform ? "prof" : "centre" };
      })
    );

    return res.json({ city, subject, inPerson: results });
  } catch (e) {
    console.error(e?.response?.data || e.message);
    return res.status(500).json({ message: "Erreur inperson-search" });
  }
};
