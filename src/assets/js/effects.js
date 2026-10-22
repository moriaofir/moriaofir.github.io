// אפקטים (סבב השראה 2026-10-21). העיצוב ב־assets/css/effects.css
// עטוף בפונקציה, כי extras.js כבר מגדיר root ו־calm ברמת הקובץ
(() => {
  const html = document.documentElement;
  // בעל האתר ביקש שהאפקטים ירוצו אצל כולם, גם במחשב שבו האנימציות כבויות (2026-10-21)
  const still = false;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  // אם יש כניסה מצוירת, מחכים שתיגמר לפני שמציירים את ראש העמוד
  const introDelay = html.classList.contains("intro-on") ? 1700 : 0;
  const hasIO = "IntersectionObserver" in window;
  const belowFold = (el) => el.getBoundingClientRect().top > window.innerHeight;
  // כל פעם שחלק נכנס למסך האפקט רץ, וכשהוא יוצא לגמרי מהמסך הוא מתאפס, כדי שירוץ שוב בפעם הבאה
  const each = (els, enter, leave, options) => {
    if (!hasIO) return els.forEach(enter);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { if (!e.target.fxIn) { e.target.fxIn = true; enter(e.target); } }
        else if (e.target.fxIn && (e.boundingClientRect.bottom < 0 || e.boundingClientRect.top > window.innerHeight)) { e.target.fxIn = false; if (leave) leave(e.target); }
      });
    }, options || { rootMargin: "0px 0px -10% 0px" });
    els.forEach((el) => io.observe(el));
  };

  // 1. ציור שנחשף ככתם מים שמתפשט. רק מה שמתחת לקו המסך הראשון
  if (!still && hasIO) {
    const imgs = [...document.querySelectorAll(".gallery button.zoom > img:first-of-type, .service-img, .studio-grid img, main .section > .wrap > img")];
    // נקודה אחרת בכל פעם, כדי שהכתם לא יתפשט תמיד מאותו מקום
    const spot = (img) => {
      img.style.setProperty("--bx", `${35 + Math.random() * 30}%`);
      img.style.setProperty("--by", `${35 + Math.random() * 30}%`);
    };
    imgs.forEach((img) => {
      spot(img);
      // מה שכבר על המסך בטעינה נשאר גלוי, ונחשף מחדש רק כשחוזרים אליו
      if (belowFold(img)) img.classList.add("bloom-wait");
      img.addEventListener("animationend", (e) => {
        if (e.animationName === "bloom") img.classList.remove("bloom-wait", "bloom-run");
      });
    });
    each(imgs, (img) => { if (img.classList.contains("bloom-wait")) img.classList.add("bloom-run"); },
      (img) => { spot(img); img.classList.remove("bloom-run"); img.classList.add("bloom-wait"); },
      { rootMargin: "0px 0px -6% 0px" });
    // ביטחון: תמונה שעל המסך ועדיין מוסתרת (למשל בתחתית עמוד קצר) נחשפת כשמגיעים לסוף העמוד
    const reveal = () => {
      if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 40) return;
      imgs.forEach((img) => {
        const r = img.getBoundingClientRect();
        if (img.classList.contains("bloom-wait") && r.top < window.innerHeight && r.bottom > 0) img.classList.add("bloom-run");
      });
    };
    window.addEventListener("scroll", reveal, { passive: true });
  }

  // 3. קווי עיפרון: קו קטן מתחת לכותרות, קו המכחול הקיים, ומסגרת קשת סביב התמונה בראש דף הבית
  const lines = [
    "M2 6 C 18 2, 30 9, 48 5 S 78 3, 90 6",
    "M2 5 C 16 8, 34 2, 50 6 S 80 8, 90 4",
    "M2 7 C 22 3, 40 4, 56 6 S 82 2, 90 5",
  ];
  const svgNS = "http://www.w3.org/2000/svg";
  const makeSvg = (cls, viewBox, d, width) => {
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", cls);
    svg.setAttribute("viewBox", viewBox);
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", width);
    path.setAttribute("stroke-linecap", "round");
    svg.appendChild(path);
    return svg;
  };
  document.querySelectorAll("main .section-head > h2, main .section .stack > h2, main .section .wrap > h2, main .section .stack > h1").forEach((h, i) => {
    if (h.querySelector(".pencil-line")) return;
    h.appendChild(makeSvg("pencil-line", "0 0 92 10", lines[i % lines.length], "1.3"));
  });
  const heroImg = document.querySelector(".hero .hero-img");
  if (heroImg && !heroImg.closest(".hero-frame")) {
    const frame = document.createElement("span");
    frame.className = "hero-frame";
    heroImg.before(frame);
    frame.appendChild(heroImg);
    // קשת סביב התמונה, קצת מחוץ לה, כמו קו עיפרון שלא סגור עד הסוף
    frame.appendChild(makeSvg("hero-arch", "0 0 100 121", "M0.6 119 L0.6 50 A 49.4 49.4 0 0 1 99.4 50 L99.3 116", "0.4"));
  }
  const drawn = [...document.querySelectorAll(".pencil-line, .brush-line, .hero-arch")];
  drawn.forEach((svg) => svg.querySelectorAll("path").forEach((p) => {
    try { p.style.setProperty("--len", Math.ceil(p.getTotalLength() + 2)); } catch (e) {}
  }));
  if (!still) {
    drawn.forEach((svg) => svg.classList.add("draw-wait"));
    let first = true;
    each(drawn, (svg) => {
      const wait = svg.classList.contains("hero-arch") && first ? introDelay + 250 : 60;
      setTimeout(() => { if (svg.fxIn) svg.classList.add("draw-run"); }, wait);
    }, (svg) => svg.classList.remove("draw-run"));
    setTimeout(() => { first = false; }, introDelay + 400);
  }

  // 5. הזמנות שמתרוממות ונוטות אחרי העכבר
  if (fine && !still) {
    document.querySelectorAll(".gallery button.zoom").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        btn.classList.add("is-tilting");
        btn.style.setProperty("--ry", `${((x - 0.5) * 8).toFixed(2)}deg`);
        btn.style.setProperty("--rx", `${((0.5 - y) * 6).toFixed(2)}deg`);
        btn.style.setProperty("--gx", `${(x * 100).toFixed(0)}%`);
        btn.style.setProperty("--gy", `${(y * 100).toFixed(0)}%`);
      });
      btn.addEventListener("pointerleave", () => {
        btn.classList.remove("is-tilting");
        ["--rx", "--ry"].forEach((v) => btn.style.removeProperty(v));
      });
    });
  }

  // 7. לחיצה ארוכה על עבודה שיש לה סרטון: המכחול מצייר אותה. משחררים והציור חוזר
  document.querySelectorAll(".gallery button.zoom[data-video]").forEach((btn) => {
    const hint = document.createElement("span");
    hint.className = "hold-hint";
    hint.textContent = fine ? "להחזיק לחוץ: המכחול בפעולה" : "לחיצה ארוכה: המכחול בפעולה";
    btn.appendChild(hint);
    let timer, played = false, video;
    btn.addEventListener("pointerdown", () => {
      played = false;
      clearTimeout(timer);
      timer = setTimeout(() => {
        played = true;
        if (!video) {
          video = document.createElement("video");
          video.className = "zoom-video";
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          video.setAttribute("playsinline", "");
          video.setAttribute("aria-hidden", "true");
          video.src = btn.dataset.video;
          btn.appendChild(video);
        }
        video.currentTime = 0;
        video.play().catch(() => {});
        btn.classList.add("is-playing");
      }, 420);
    });
    const stop = () => {
      clearTimeout(timer);
      if (video) { btn.classList.remove("is-playing"); video.pause(); }
    };
    ["pointerup", "pointerleave", "pointercancel"].forEach((t) => btn.addEventListener(t, stop));
    // אחרי לחיצה ארוכה לא פותחים את ההגדלה
    btn.addEventListener("click", (e) => {
      if (played) { e.preventDefault(); e.stopImmediatePropagation(); played = false; }
    }, true);
    btn.addEventListener("contextmenu", (e) => e.preventDefault());
  });

  // 2. מהסקיצה לציור: תנועת רמז קצרה של הידית בפעם הראשונה שרואים אותה
  if (!still) {
    each([...document.querySelectorAll(".compare")], (fig) => {
      if (html.classList.contains("a11y-still")) return;
      const range = fig.querySelector(".compare-range");
      const start = performance.now(), dur = 1800;
      const step = (now) => {
        const t = Math.min((now - start) / dur, 1);
        const pos = 50 + Math.sin(t * Math.PI * 2) * 18 * (1 - t);
        fig.style.setProperty("--pos", `${pos}%`);
        if (range) range.value = pos;
        if (t < 1) requestAnimationFrame(step);
      };
      setTimeout(() => requestAnimationFrame(step), 300);
    }, null, { threshold: 0.6 });
  }

  // 9. עקבות צבע עדינות אחרי העכבר, במחשב בלבד
  if (fine && !still && window.CanvasRenderingContext2D) {
    const canvas = document.createElement("canvas");
    canvas.className = "paint-trail";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = 1;
    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener("resize", size);
    // טורקיז, ורוד ומרווה מהפלטה של האתר
    const colors = ["79,163,165", "214,150,140", "150,180,135", "120,170,190"];
    const LIFE = 1800;
    let blobs = [], raf = 0, lastX = null, lastY = null, travel = 0;
    const draw = (now) => {
      ctx.clearRect(0, 0, w, h);
      blobs = blobs.filter((b) => now - b.t < LIFE);
      blobs.forEach((b) => {
        const age = (now - b.t) / LIFE;
        const r = b.r * (0.55 + 0.6 * Math.min(1, age * 2.5));
        const a = b.a * (1 - age);
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
        g.addColorStop(0, `rgba(${b.c},${a * 0.5})`);
        g.addColorStop(0.78, `rgba(${b.c},${a * 0.75})`);
        g.addColorStop(0.93, `rgba(${b.c},${a * 1.3})`);
        g.addColorStop(1, `rgba(${b.c},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = blobs.length ? requestAnimationFrame(draw) : 0;
    };
    const ready = performance.now() + introDelay;
    document.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse" || performance.now() < ready || html.classList.contains("a11y-still")) return;
      if (lastX !== null) travel += Math.hypot(e.clientX - lastX, e.clientY - lastY);
      lastX = e.clientX; lastY = e.clientY;
      if (travel < 28) return;
      travel = 0;
      blobs.push({
        x: e.clientX + (Math.random() - 0.5) * 10, y: e.clientY + (Math.random() - 0.5) * 10,
        r: 16 + Math.random() * 20, a: 0.09 + Math.random() * 0.05,
        c: colors[Math.floor(Math.random() * colors.length)], t: performance.now(),
      });
      if (blobs.length > 40) blobs.shift();
      if (!raf) raf = requestAnimationFrame(draw);
    }, { passive: true });
  }

  // 12. פרחים מהציורים של מוריה, בצדי דף הבית. זזים בעומק בזמן הגלילה
  // העלים הוסרו לבקשת מוריה (2026-10-21): לא מתחברים לציפורים
  const hero = document.querySelector(".hero");
  if (hero) {
    const deco = (section, name, file) => {
      if (!section) return;
      const img = document.createElement("img");
      img.className = `deco deco-${name}`;
      img.src = `assets/img/effects/${file}`;
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      img.loading = "lazy";
      img.decoding = "async";
      section.classList.add("has-deco");
      section.prepend(img);
    };
    deco(hero, "cosmos", "cosmos.webp");
    deco(document.querySelector(".names-section"), "cosmos", "cosmos.webp");
  }

  // כותרת מצוירת לעמודים הפנימיים: פרט קטן מהציורים של מוריה ליד הכותרת הראשית
  const pageArt = { gallery: "bouquet", how: "cosmos", about: "cosmos", contact: "bouquet", services: "cosmos", reviews: "bouquet", prices: "cosmos", wording: "cosmos", en: "bouquet" };
  const art = pageArt[document.body.dataset.page];
  const first = document.querySelector("main > .section:first-child");
  if (art && first && !hero) {
    const img = document.createElement("img");
    img.className = `page-art page-art-${art}`;
    img.src = `assets/img/effects/${art}.webp`;
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.decoding = "async";
    first.classList.add("has-page-art");
    first.prepend(img);
  }

  // 10. השמות שלכם על ההזמנה: מה שכותבים מופיע מיד בכתב יד על ההזמנה לדוגמה
  document.querySelectorAll(".names-try").forEach((box) => {
    const [a, b, d] = ["#nt-a", "#nt-b", "#nt-date"].map((s) => box.querySelector(s));
    const namesOut = box.querySelector(".nc-names");
    const dateOut = box.querySelector(".nc-date");
    const cta = box.querySelector(".names-cta");
    const val = (i) => i.value.trim();
    const render = () => {
      // בהזמנה של גיתית ונועם כל שם בנפרד, עם & ביניהם; בכל הזמנה אחרת "א וב"
      const na = namesOut.querySelector(".nc-a"), nb = namesOut.querySelector(".nc-b");
      if (na && nb) { na.textContent = val(a) || a.placeholder; nb.textContent = val(b) || b.placeholder; }
      else namesOut.textContent = `${val(a) || a.placeholder} ו${val(b) || b.placeholder}`;
      dateOut.textContent = val(d) || d.placeholder;
      if (!still) { namesOut.classList.remove("pop"); void namesOut.offsetWidth; namesOut.classList.add("pop"); }
    };
    [a, b, d].forEach((i) => i.addEventListener("input", render));
    // השמות נכנסים להודעת הוואטסאפ, בשורה השנייה (אחרי הפתיחה, לפני שורת הקופון אם יש)
    cta.addEventListener("click", () => {
      if (!val(a) && !val(b)) return;
      const url = new URL(cta.href);
      const text = (url.searchParams.get("text") || "").split("\n");
      const line = `השמות שלנו: ${val(a)} ו${val(b)}${val(d) ? `, ${val(d)}` : ""}`;
      if (text[1] && text[1].startsWith("השמות שלנו:")) text[1] = line;
      else text.splice(1, 0, line);
      cta.href = `${url.origin}${url.pathname}?text=${encodeURIComponent(text.join("\n"))}`;
    });
  });
})();
