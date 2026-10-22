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
    if (yes) panel.querySelector("button").focus();
  };
  btn.addEventListener("click", () => open(panel.hidden));
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
