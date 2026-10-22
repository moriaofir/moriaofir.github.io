// תוספות: כניסה, קופון, כותרת צמודה, חזרה למעלה, קרוסלה, כניסה עדינה של חלקים
const root = document.documentElement;
// בעל האתר ביקש שהתנועה תרוץ אצל כולם, גם כשהאנימציות כבויות במכשיר (2026-10-21)
const calm = false;
const store = {
  get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch (e) {} },
};
const session = { set(key, value) { try { sessionStorage.setItem(key, value); } catch (e) {} } };

// כניסה: בכל פתיחה של האתר (לא במעבר בין עמודים). נסגרת לבד אחרי שנייה וחצי, או בלחיצה על "דילוג"
const intro = document.getElementById("intro");
if (intro && root.classList.contains("intro-on")) {
  session.set("introSeen", "1");
  const finish = () => {
    intro.classList.add("done");
    setTimeout(() => root.classList.remove("intro-on"), 350);
  };
  intro.querySelector(".intro-skip").addEventListener("click", finish);
  intro.addEventListener("animationend", (e) => { if (e.animationName === "intro-out") root.classList.remove("intro-on"); });
}

// קופון: אפשר לסגור את הפס. כל עוד הוא פתוח, שורת הקוד נכנסת לכל הודעת וואטסאפ
const bar = document.getElementById("coupon-bar");
if (bar) {
  const line = bar.dataset.line;
  const form = document.querySelector("form[data-whatsapp]");
  // encodeURIComponent כמו ב־site.js, כדי שרווחים יהיו %20 ולא +
  const setText = (a, text) => {
    const url = new URL(a.href);
    a.href = `${url.origin}${url.pathname}?text=${encodeURIComponent(text)}`;
  };
  const addLine = () => {
    document.querySelectorAll('a[href^="https://wa.me/"]').forEach((a) => {
      const text = new URL(a.href).searchParams.get("text") || "";
      if (!text.includes(line)) setText(a, text ? `${text}\n${line}` : line);
    });
    if (form && !form.querySelector('input[name="coupon"]')) {
      const hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.name = "coupon";
      hidden.value = line;
      form.appendChild(hidden);
    }
  };
  const removeLine = () => {
    document.querySelectorAll('a[href^="https://wa.me/"]').forEach((a) => {
      const text = new URL(a.href).searchParams.get("text") || "";
      if (text.includes(line)) setText(a, text.replace(`\n${line}`, "").replace(line, ""));
    });
    if (form) form.querySelectorAll('input[name="coupon"]').forEach((i) => i.remove());
  };
  if (store.get("couponClosed") === "1") bar.hidden = true;
  else addLine();
  bar.querySelector(".coupon-close").addEventListener("click", () => {
    bar.hidden = true;
    store.set("couponClosed", "1");
    removeLine();
  });
}

// כותרת צמודה וכפתור חזרה למעלה
const header = document.querySelector(".site-header");
const toTop = document.getElementById("to-top");
// החזרה למעלה מופיעה רק כשגוללים חזרה למעלה (או בסוף העמוד), כדי לא להסתיר טקסט בזמן קריאה
let lastY = window.scrollY;
const onScroll = () => {
  const y = window.scrollY;
  if (header) header.classList.toggle("scrolled", y > 24);
  if (toTop) {
    const atEnd = window.innerHeight + y >= document.documentElement.scrollHeight - 80;
    if (Math.abs(y - lastY) > 4 || atEnd) toTop.classList.toggle("show", y > 600 && (y < lastY || atEnd));
  }
  lastY = y;
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();
if (toTop) toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" }));
if (!calm) root.style.scrollBehavior = "smooth";

// קרוסלה: העבודות זזות לבד ברצף, נעצרות במגע או בריחוף וממשיכות אחרי רגע
document.querySelectorAll(".carousel").forEach((carousel) => {
  const track = carousel.querySelector(".carousel-track");
  const originals = [...carousel.querySelectorAll(".carousel-slide")];
  const dots = [...carousel.querySelectorAll(".carousel-dot")];
  if (originals.length < 2) return;
  // עותק של כל העבודות בסוף, כדי שהלולאה תהיה חלקה
  originals.forEach((s) => {
    const copy = s.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    copy.querySelectorAll("a").forEach((a) => a.setAttribute("tabindex", "-1"));
    track.appendChild(copy);
  });
  const slides = [...track.querySelectorAll(".carousel-slide")];
  const n = originals.length;
  const rtl = getComputedStyle(track).direction === "rtl";
  const sign = rtl ? -1 : 1;
  // רוחב סט אחד = המרחק בין העבודה הראשונה לעותק שלה
  const loopWidth = () => Math.abs(slides[n].getBoundingClientRect().left - slides[0].getBoundingClientRect().left);
  const centerOn = (slide, smooth) => {
    const t = track.getBoundingClientRect(), r = slide.getBoundingClientRect();
    track.scrollBy({ left: (r.left + r.width / 2) - (t.left + t.width / 2), behavior: smooth ? "smooth" : "auto" });
  };
  const wrap = () => {
    const w = loopWidth();
    if (w && Math.abs(track.scrollLeft) >= w) track.scrollLeft -= sign * w;
  };
  const markCurrent = () => {
    const t = track.getBoundingClientRect(), mid = t.left + t.width / 2;
    let best = 0, bestDist = Infinity;
    slides.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - mid);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    dots.forEach((d, i) => d.setAttribute("aria-current", String(i === best % n)));
    return best;
  };
  let raf;
  track.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { wrap(); markCurrent(); }); }, { passive: true });
  dots.forEach((d, i) => d.addEventListener("click", () => { hold(6000); centerOn(slides[i], !calm); }));

  let held = false, resumeTimer;
  const hold = (ms) => {
    held = true;
    clearTimeout(resumeTimer);
    if (ms) resumeTimer = setTimeout(() => { held = false; }, ms);
  };
  carousel.addEventListener("pointerdown", () => hold());
  carousel.addEventListener("pointerup", () => hold(3000));
  carousel.addEventListener("pointercancel", () => hold(3000));
  carousel.addEventListener("mouseenter", () => hold());
  carousel.addEventListener("mouseleave", () => hold(800));
  carousel.addEventListener("wheel", () => hold(3000), { passive: true });

  if (calm) {
    // מי שביקש פחות תנועה: מעבר שקט לעבודה הבאה כל כמה שניות, בלי החלקה
    const interval = Number(carousel.dataset.interval) || 4000;
    setInterval(() => { if (!held && !document.hidden) { centerOn(slides[markCurrent() + 1] || slides[0], false); wrap(); } }, interval);
    return;
  }
  // תנועה רציפה ואיטית
  carousel.classList.add("drifting");
  const speed = 0.035; // פיקסלים לאלפית שנייה, בערך 35 פיקסלים בשנייה
  let pos = track.scrollLeft, last = performance.now();
  const step = (now) => {
    const dt = Math.min(now - last, 64);
    last = now;
    if (held || document.hidden || root.classList.contains("a11y-still")) {
      pos = track.scrollLeft;
    } else {
      pos += sign * speed * dt;
      const w = loopWidth();
      if (w && Math.abs(pos) >= w) pos -= sign * w;
      track.scrollLeft = pos;
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
});

// באנר המלצות מתחלף: המלצה אחת בכל פעם, עוצר בריחוף, במגע ובפוקוס
document.querySelectorAll(".quote-rotator").forEach((rot) => {
  const slides = [...rot.querySelectorAll(".quote-slide")];
  const dots = [...rot.querySelectorAll(".carousel-dot")];
  if (slides.length < 2) return;
  let current = 0, held = false, resumeTimer;
  const show = (i) => {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, j) => {
      s.classList.toggle("is-active", j === current);
      if (j === current) s.removeAttribute("aria-hidden"); else s.setAttribute("aria-hidden", "true");
    });
    dots.forEach((d, j) => d.setAttribute("aria-current", String(j === current)));
  };
  const hold = (ms) => { held = true; clearTimeout(resumeTimer); if (ms) resumeTimer = setTimeout(() => { held = false; }, ms); };
  dots.forEach((d, i) => d.addEventListener("click", () => { hold(10000); show(i); }));
  rot.addEventListener("mouseenter", () => hold());
  rot.addEventListener("mouseleave", () => hold(1500));
  rot.addEventListener("focusin", () => hold());
  rot.addEventListener("focusout", () => hold(1500));
  rot.addEventListener("pointerdown", () => hold(8000));
  // החלקה בטלפון: ימינה או שמאלה מחליף המלצה
  let x0 = null;
  rot.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  rot.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 40) { hold(8000); show(current + (dx < 0 ? -1 : 1)); }
  });
  const interval = Number(rot.dataset.interval) || 7000;
  setInterval(() => { if (!held && !document.hidden && !root.classList.contains("a11y-still")) show(current + 1); }, interval);
});

// חלקים שנכנסים בעדינות כשמגיעים אליהם (רק מה שמתחת לקו המסך הראשון)
if ("IntersectionObserver" in window && !calm) {
  const targets = document.querySelectorAll("main .section .wrap, main .hero .stack");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  targets.forEach((el) => {
    if (el.getBoundingClientRect().top > window.innerHeight) {
      el.classList.add("fade");
      io.observe(el);
    }
  });
}
