// תפריט במובייל
const menuBtn = document.querySelector(".menu-btn");
const nav = document.getElementById("nav");
if (menuBtn && nav) {
  const setOpen = (open) => {
    // כתם הצבע מתפשט מהכפתור עצמו
    const r = menuBtn.getBoundingClientRect();
    nav.style.setProperty("--mx", r.left + r.width / 2 + "px");
    nav.style.setProperty("--my", r.top + r.height / 2 + "px");
    nav.classList.toggle("open", open);
    document.documentElement.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "סגירת התפריט" : "תפריט");
  };
  menuBtn.addEventListener("click", () => setOpen(!nav.classList.contains("open")));
  // נסגר בכל נגיעה מחוץ לתפריט, בגלילה וב־Esc
  document.addEventListener("pointerdown", (e) => {
    if (nav.classList.contains("open") && !nav.contains(e.target) && !menuBtn.contains(e.target)) setOpen(false);
  });
  window.addEventListener("scroll", () => { if (nav.classList.contains("open")) setOpen(false); }, { passive: true });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) { setOpen(false); menuBtn.focus(); }
  });
}

// סינון בגלריה
const filters = document.querySelectorAll(".chip[data-filter]");
filters.forEach((chip) => {
  chip.addEventListener("click", () => {
    const value = chip.dataset.filter;
    filters.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
    document.querySelectorAll(".gallery figure[data-category]").forEach((fig) => {
      fig.hidden = value !== "all" && fig.dataset.category !== value;
    });
  });
});

// הגדלת תמונה בגלריה, עם מעבר בין עבודות (חצים, מקלדת והחלקה)
const lightbox = document.querySelector(".lightbox");
if (lightbox && typeof lightbox.showModal === "function") {
  const main = lightbox.querySelector(".lightbox-main");
  const sketchFig = lightbox.querySelector(".lightbox-sketch");
  const sketchImg = sketchFig.querySelector("img");
  const caption = lightbox.querySelector(".lightbox-caption");
  const count = lightbox.querySelector(".lightbox-count");
  const want = lightbox.querySelector(".lightbox-want a");
  let items = [];
  let index = 0;

  const show = (i) => {
    index = (i + items.length) % items.length;
    const btn = items[index];
    const source = btn.querySelector("img");
    main.src = btn.dataset.full || source.src;
    main.alt = source.alt;
    sketchFig.hidden = !btn.dataset.sketch;
    if (btn.dataset.sketch) {
      sketchImg.src = btn.dataset.sketch;
      sketchImg.alt = `הסקיצה: ${source.alt}`;
    }
    caption.textContent = btn.dataset.caption || "";
    // "רוצים בסגנון הזה?": וואטסאפ עם שם העבודה, ושורת הקופון אם הבר עדיין פתוח
    if (want) {
      const bar = document.getElementById("coupon-bar");
      let text = `היי מוריה, ראיתי באתר את העבודה "${btn.dataset.caption || source.alt}" ואשמח להזמנה בסגנון הזה`;
      if (bar && !bar.hidden && bar.dataset.line) text += `\n${bar.dataset.line}`;
      want.href = `https://wa.me/${want.dataset.phone}?text=${encodeURIComponent(text)}`;
    }
    count.textContent = `${index + 1} מתוך ${items.length}`;
  };

  // בדפדפנים שתומכים, העבודה "גדלה" מהגלריה להגדלה (View Transitions). בשאר פשוט נפתחת
  const morph = !!document.startViewTransition;
  document.querySelectorAll(".gallery button.zoom").forEach((btn) => {
    btn.addEventListener("click", () => {
      items = [...document.querySelectorAll(".gallery figure:not([hidden]) button.zoom")];
      const open = () => { show(items.indexOf(btn)); lightbox.showModal(); };
      const thumb = btn.querySelector("img");
      if (!morph) return open();
      thumb.style.viewTransitionName = "work";
      const vt = document.startViewTransition(() => {
        thumb.style.viewTransitionName = "";
        open();
        // התמונה הקטנה כבר טעונה, אז מתחילים ממנה ומחליפים לגדולה כשהיא מוכנה
        const full = main.src, small = thumb.currentSrc || thumb.src;
        main.src = small;
        main.style.viewTransitionName = "work";
        const big = new Image();
        big.onload = () => { if (main.src === small) main.src = full; };
        big.src = full;
      });
      vt.finished.finally(() => { main.style.viewTransitionName = ""; });
    });
  });
  lightbox.querySelector(".prev").addEventListener("click", () => show(index - 1));
  lightbox.querySelector(".next").addEventListener("click", () => show(index + 1));
  lightbox.addEventListener("keydown", (e) => {
    // באתר מימין לשמאל: חץ שמאלה = הבא
    if (e.key === "ArrowLeft") show(index + 1);
    if (e.key === "ArrowRight") show(index - 1);
  });
  let touchX = null;
  lightbox.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(dx > 0 ? index + 1 : index - 1);
    touchX = null;
  });
  lightbox.querySelector(".close").addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) lightbox.close(); });
}

// מאיפה הגיעו: links.html?src=ig או ?utm_source=... נשמר לביקור, ונכנס להודעת הוואטסאפ
const SOURCES = { ig: "אינסטגרם", instagram: "אינסטגרם", fb: "פייסבוק", facebook: "פייסבוק", google: "גוגל", gbp: "גוגל", wa: "וואטסאפ", ad: "מודעה", pinterest: "פינטרסט" };
const params = new URLSearchParams(location.search);
let source = params.get("src") || params.get("utm_source");
try {
  if (source) sessionStorage.setItem("src", source);
  else source = sessionStorage.getItem("src");
} catch (e) { /* בלי אחסון: מסתפקים בכתובת */ }
const sourceLabel = source ? SOURCES[source.toLowerCase()] || source : "";
if (sourceLabel) {
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach((a) => {
    const url = new URL(a.href);
    const text = url.searchParams.get("text");
    // encodeURIComponent ולא searchParams, כדי שרווחים יהיו %20 ולא +
    if (text) a.href = `${url.origin}${url.pathname}?text=${encodeURIComponent(`${text} (הגעתי דרך ${sourceLabel})`)}`;
  });
}

// טופס יצירת קשר: נשלח כהודעת וואטסאפ מוכנה, בלי שרת ובלי חשבון נוסף
const form = document.querySelector("form[data-whatsapp]");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const lines = [
      "היי מוריה, הגעתי מהאתר ואשמח לשמוע על הזמנה מאוירת.",
      `שם: ${data.get("name")}`,
      `טלפון: ${data.get("phone")}`,
      `סוג האירוע: ${data.get("event")}`,
    ];
    if (data.get("date")) lines.push(`תאריך האירוע: ${data.get("date")}`);
    if (data.getAll("extras").length) lines.push(`מעניין אותי גם: ${data.getAll("extras").join(", ")}`);
    if (data.get("message")) lines.push(`קצת עלינו: ${data.get("message")}`);
    if (data.get("colors")) lines.push(`צבעים שאנחנו אוהבים: ${data.get("colors")}`);
    if (data.get("motif")) lines.push(`חשוב לנו שיופיע: ${data.get("motif")}`);
    if (data.get("place")) lines.push(`איפה האירוע: ${data.get("place")}`);
    if (data.get("inspo")) lines.push(`השראה: ${data.get("inspo")}`);
    if (sourceLabel) lines.push(`הגעתי דרך: ${sourceLabel}`);
    if (data.get("coupon")) lines.push(data.get("coupon"));
    const url = `https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.location.href = url;
  });
}

// כפתור הוואטסאפ הצף: מופיע אחרי קצת גלילה, ונעלם כשכפתור וואטסאפ אחר כבר על המסך
const waFloat = document.querySelector(".wa-float");
if (waFloat && "IntersectionObserver" in window) {
  const inline = new Set();
  const update = () => waFloat.classList.toggle("is-hidden", window.scrollY < 240 || inline.size > 0);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((en) => (en.isIntersecting ? inline.add(en.target) : inline.delete(en.target)));
    update();
  });
  document.querySelectorAll('main a[href^="https://wa.me/"]').forEach((a) => observer.observe(a));
  window.addEventListener("scroll", update, { passive: true });
  update();
}

// לפני ואחרי: סקיצה מול ציור גמור
document.querySelectorAll(".compare").forEach((fig) => {
  const range = fig.querySelector(".compare-range");
  range.addEventListener("input", () => fig.style.setProperty("--pos", `${range.value}%`));
});

// עמוד הנוסחים: העתקה בלחיצה
document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const text = btn.closest(".wording").querySelector(".wording-text").innerText;
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = "הועתק ✓";
    } catch (e) {
      btn.textContent = "סמנו את הנוסח והעתיקו";
    }
    setTimeout(() => { btn.textContent = "להעתיק את הנוסח"; }, 2500);
  });
});

// המלצה: לחיצה על צילום ההודעה פותחת אותו בגדול
document.querySelectorAll(".quote-zoom").forEach((btn) => {
  btn.addEventListener("click", () => {
    const img = btn.querySelector("img");
    const dlg = document.createElement("dialog");
    dlg.className = "shot-dialog";
    dlg.setAttribute("aria-label", "ההודעה המלאה");
    dlg.innerHTML = '<button class="close" type="button" aria-label="סגירה">×</button>';
    const big = img.cloneNode();
    big.loading = "eager";
    dlg.appendChild(big);
    document.body.appendChild(dlg);
    const close = () => dlg.close();
    dlg.querySelector(".close").addEventListener("click", close);
    dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
    dlg.addEventListener("close", () => dlg.remove());
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  });
});
