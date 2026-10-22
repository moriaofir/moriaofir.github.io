// מחשבון "מתי להתחיל": מתאריך האירוע אחורה, לפי src/_data/timeline.json
const planner = document.querySelector(".planner");
if (planner) {
  const steps = JSON.parse(planner.dataset.plan || "[]");
  const input = planner.querySelector("input[type=date]");
  const out = document.querySelector(".plan-out");
  const fmt = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", year: "numeric" });
  const render = () => {
    if (!input.value) { out.hidden = true; return; }
    const event = new Date(`${input.value}T12:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    out.innerHTML = "";
    steps.forEach((s) => {
      const d = new Date(event);
      d.setDate(d.getDate() - s.weeks * 7);
      const li = document.createElement("li");
      const late = d < today;
      li.className = late ? "late" : "";
      const when = document.createElement("strong");
      when.textContent = late ? "כבר עכשיו" : fmt.format(d);
      li.append(when, ` ${s.text}`);
      out.append(li);
    });
    out.hidden = false;
  };
  input.addEventListener("change", render);
  input.addEventListener("input", render);
}
