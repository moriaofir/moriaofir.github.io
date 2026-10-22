import fs from "node:fs";

export default function (eleventyConfig) {
  // מחולל הצעות המחיר של מוריה (עמוד פנימי). "enabled": false במחירון מכבה אותו
  const { enabled: quotesOn } = JSON.parse(fs.readFileSync("src/_data/priceList.json", "utf8"));
  if (!quotesOn) eleventyConfig.ignores.add("src/quote-builder.njk");
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  eleventyConfig.addGlobalData("year", () => new Date().getFullYear());

  // אייקונים קטנים שחוזרים בכל עמוד
  eleventyConfig.addShortcode("waIcon", (size) =>
    `<svg width="${size || 22}" height="${size || 22}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.5-4.3A8.5 8.5 0 1 1 20.5 11.6z"/></svg>`
  );
  eleventyConfig.addShortcode("brushLine", () =>
    `<svg class="brush-line" viewBox="0 0 120 14" aria-hidden="true"><path d="M2 8 C 22 2, 38 12, 60 7 S 98 3, 118 8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`
  );

  // אייקון נגישות (דמות בעיגול) לכפתור הנגישות בצד המסך
  eleventyConfig.addShortcode("a11yIcon", (size) =>
    `<svg width="${size || 26}" height="${size || 26}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="6.8" r="1.3" fill="currentColor" stroke="none"/><path d="M7 9.5c1.6.5 3.3.7 5 .7s3.4-.2 5-.7"/><path d="M12 10.2v3.6"/><path d="M12 13.8l-2.4 4.4M12 13.8l2.4 4.4"/></svg>`
  );

  // אייקונים לשירותים: מכחול, עיצוב גרפי, מסגרת, בית, מתנה ועוד
  const serviceIcons = {
    glass: '<path d="M7 4h10l-1.4 15.2a1 1 0 0 1-1 .8H9.4a1 1 0 0 1-1-.8z"/><path d="M7.6 10h8.8"/>',
    frame: '<rect x="3.5" y="4.5" width="17" height="15" rx="1"/><rect x="7" y="8" width="10" height="8"/><path d="M7 14l3-3 3 3 2-2 2 2"/>',
    box: '<path d="M3.5 8 12 4l8.5 4v8.5L12 20.5 3.5 16.5z"/><path d="M3.5 8 12 12l8.5-4M12 12v8.5"/>',
    house: '<path d="M4 11 12 4.5l8 6.5"/><path d="M6 9.5V19.5h12V9.5"/><path d="M10 19.5v-5h4v5"/>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M3 9h18M12 9v11"/><path d="M12 9c-1.5-3-5-3.5-5-1.2C7 9 9.5 9 12 9zm0 0c1.5-3 5-3.5 5-1.2C17 9 14.5 9 12 9z"/>',
    envelope: '<rect x="3.5" y="6" width="17" height="12" rx="1"/><path d="m4 7 8 6 8-6"/>',
    brush: '<path d="M14.5 4.5l5 5L11 18l-5-5z"/><path d="M6 13c-2 0-3 1.5-3 3.5 0 1.5-.5 2.5-1.5 3 3 .5 6-.5 6.5-3.5"/>',
    layout: '<rect x="3.5" y="4.5" width="8" height="11" rx="1"/><rect x="13" y="4.5" width="7.5" height="6" rx="1"/><rect x="13" y="12.5" width="7.5" height="7" rx="1"/><path d="M5.5 18.5h6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  };
  eleventyConfig.addShortcode("serviceIcon", (name) =>
    `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${serviceIcons[name] || ""}</svg>`
  );

  // wa.me link with a message prefilled for the page
  eleventyConfig.addFilter("whatsapp", (message, phone) =>
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  );

  // שאלות נפוצות לפי נושא, ואלה שאין להן נושא מהרשימה
  eleventyConfig.addFilter("byTopic", (items, topic) => (items || []).filter((q) => q.topic === topic));
  eleventyConfig.addFilter("withoutTopics", (items, topics) => (items || []).filter((q) => !(topics || []).includes(q.topic)));

  // עבודות לקרוסלה בדף הבית: כולן, חוץ מאלה שסומנו carousel: false
  eleventyConfig.addFilter("inCarousel", (items) => (items || []).filter((i) => i.carousel !== false));

  // גרסה קטנה (600px) של תמונה, אם קיימת לידה: image.webp → image-600.webp
  eleventyConfig.addFilter("small", (src) => {
    if (!src || !src.endsWith(".webp")) return "";
    const small = src.replace(/\.webp$/, "-600.webp");
    return fs.existsSync(`src/${small}`) ? small : "";
  });

  // מידות אמיתיות של תמונת webp, כדי שכל עבודה תוצג בצורה שלה בלי קפיצות בטעינה
  const sizeCache = {};
  eleventyConfig.addFilter("imgSize", (src) => {
    if (!src) return { w: 4, h: 5 };
    if (sizeCache[src]) return sizeCache[src];
    let size = { w: 4, h: 5 };
    try {
      const b = fs.readFileSync(`src/${src}`);
      const chunk = b.toString("ascii", 12, 16);
      if (chunk === "VP8X") size = { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
      else if (chunk === "VP8L") { const bits = b.readUInt32LE(21); size = { w: 1 + (bits & 0x3fff), h: 1 + ((bits >> 14) & 0x3fff) }; }
      else if (chunk === "VP8 ") size = { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    } catch (e) {}
    return (sizeCache[src] = size);
  });

  // הצעות מחיר: נתיב יחסי לתמונה, תאריכים בעברית, ואילו תוספות להציע
  eleventyConfig.addFilter("rel", (src) => String(src || "").replace(/^\/+/, ""));
  eleventyConfig.addFilter("addDays", (date, days) => new Date(new Date(date).getTime() + (Number(days) || 0) * 864e5));
  eleventyConfig.addFilter("heDate", (date) => {
    const d = new Date(date);
    return isNaN(d) ? "" : `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  });
  eleventyConfig.addFilter("isoDate", (date) => new Date(date).toISOString().slice(0, 10));
  eleventyConfig.addFilter("offeredExtras", (extras, offer, extraLines) => {
    const names = (offer || []).map((n) => String(n).trim()).filter(Boolean);
    const list = (extras || []).filter((x) => !names.length || names.includes(x.name));
    return list.concat((extraLines || []).filter((x) => x && x.name));
  });

  // נתונים לסקריפט בתוך העמוד, בלי לשבור את תגית ה-script
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v).replace(/</g, "\\u003c"));

  // נתוני שאלות ותשובות לגוגל (FAQPage)
  eleventyConfig.addFilter("faqSchema", (items) =>
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: (items || []).map((q) => ({
        "@type": "Question",
        name: q.question,
        acceptedAnswer: { "@type": "Answer", text: q.answer },
      })),
    }).replace(/</g, "\\u003c")
  );

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
