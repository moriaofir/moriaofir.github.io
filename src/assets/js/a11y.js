// כפתור נגישות: פתיחה וסגירה של התפריט, ושמירת ההגדרות במכשיר (ההגדרות עצמן מוחלות כבר ב־<head>, ראו base.njk)
(() => {
  const html = document.documentElement;
  const btn = document.getElementById("a11y-btn");
  const panel = document.getElementById("a11y-panel");
  if (!btn || !panel) return;
  const KEY = "a11y";
  const sizes = ["רגיל", "גדול", "גדול יותר", "הכי גדול"];
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} };
  let state = load();

  const apply = () => {
    [1, 2, 3].forEach((n) => html.classList.toggle(`a11y-size-${n}`, state.size === n));
    panel.querySelectorAll("[data-a11y]").forEach((b) => {
      const on = !!state[b.dataset.a11y];
      html.classList.toggle(`a11y-${b.dataset.a11y}`, on);
      b.setAttribute("aria-pressed", String(on));
    });
    panel.querySelector("#a11y-size-out").textContent = sizes[state.size || 0];
    // מסמנים על הכפתור שיש הגדרה פעילה
    btn.classList.toggle("is-active", Object.values(state).some(Boolean));
  };

  const open = (yes) => {
    panel.hidden = !yes;
    btn.setAttribute("aria-expanded", String(yes));
    if (yes) { if (btn.style.top) place(parseFloat(btn.style.top)); panel.querySelector("button").focus(); }
  };
  btn.addEventListener("click", (e) => { if (dragged) { dragged = false; e.preventDefault(); return; } open(panel.hidden); });

  // אפשר לגרור את הכפתור למעלה ולמטה לאורך הקצה. המיקום נשמר במכשיר
  const POS = "a11yPos";
  const place = (y) => {
    const half = btn.offsetHeight / 2 + 8;
    const top = Math.max(half, Math.min(window.innerHeight - half, y));
    btn.style.top = top + "px";
    panel.style.top = Math.max(16 + panel.offsetHeight / 2, Math.min(window.innerHeight - 16 - panel.offsetHeight / 2, top)) + "px";
    return top;
  };
  let dragged = false, startY = 0, moving = false;
  try { const f = parseFloat(localStorage.getItem(POS)); if (f > 0 && f < 1) place(f * window.innerHeight); } catch (e) {}
  btn.addEventListener("pointerdown", (e) => { startY = e.clientY; moving = true; dragged = false; });
  window.addEventListener("pointermove", (e) => {
    if (!moving) return;
    if (!dragged && Math.abs(e.clientY - startY) < 8) return;
    if (!dragged) { dragged = true; btn.classList.add("dragging"); try { btn.setPointerCapture(e.pointerId); } catch (err) {} }
    place(e.clientY);
  });
  const drop = () => {
    if (!moving) return;
    moving = false;
    btn.classList.remove("dragging");
    if (dragged) { try { localStorage.setItem(POS, String(parseFloat(btn.style.top) / window.innerHeight)); } catch (e) {} }
  };
  window.addEventListener("pointerup", drop);
  window.addEventListener("pointercancel", drop);
  window.addEventListener("resize", () => { if (btn.style.top) { try { place(parseFloat(localStorage.getItem(POS)) * window.innerHeight); } catch (e) {} } });
  panel.querySelector(".a11y-close").addEventListener("click", () => { open(false); btn.focus(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) { open(false); btn.focus(); } });
  document.addEventListener("pointerdown", (e) => { if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) open(false); });

  panel.querySelectorAll("[data-size]").forEach((b) => b.addEventListener("click", () => {
    state.size = Math.max(0, Math.min(3, (state.size || 0) + Number(b.dataset.size)));
    save(state); apply();
  }));
  panel.querySelectorAll("[data-a11y]").forEach((b) => b.addEventListener("click", () => {
    state[b.dataset.a11y] = !state[b.dataset.a11y];
    save(state); apply();
  }));
  panel.querySelector(".a11y-reset").addEventListener("click", () => { state = {}; save(state); apply(); });
  apply();
})();
