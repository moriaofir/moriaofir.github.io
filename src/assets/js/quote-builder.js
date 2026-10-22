// מחולל הצעות המחיר של מוריה: רשימת הצעות, עריכה, מסמך הצעה מוכן, PDF ושליחה בוואטסאפ.
// הכול נשמר רק במכשיר (localStorage). אין שרת ואין חשבון.
(function () {
  var CFG = JSON.parse(document.getElementById("config").textContent);
  var KEY = "moria-quotes-v1";
  var UNLOCK = "moria-quotes-unlocked";
  var $ = function (id) { return document.getElementById(id); };

  // ---------- אחסון ----------
  function load() {
    try { var d = JSON.parse(localStorage.getItem(KEY)); if (d && d.quotes) return d; } catch (e) {}
    return { counter: 0, quotes: [] };
  }
  var db = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); return true; }
    catch (e) { alertMsg("לא הצלחתי לשמור בטלפון. אולי התמונה גדולה מדי, או שהזיכרון מלא."); return false; }
  }
  function alertMsg(t) { var m = $("share-msg"); if (m) m.textContent = t; }

  // ---------- עזרים ----------
  var money = function (n) { return (Math.round(n * 100) / 100).toLocaleString("he-IL") + " ₪"; };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var heDate = function (d) { d = new Date(d); return isNaN(d) ? "" : d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear(); };
  var addDays = function (d, n) { return new Date(new Date(d).getTime() + (Number(n) || 0) * 864e5); };
  var waPhone = function (p) {
    var digits = String(p || "").replace(/\D/g, "");
    if (digits.indexOf("0") === 0) digits = "972" + digits.slice(1);
    return digits;
  };

  function totals(q) {
    var sub = 0;
    q.lines.forEach(function (l) { sub += (Number(l.qty) || 0) * (Number(l.price) || 0); });
    var disc = 0, label = "";
    if (q.discType === "first") { disc = sub * 0.10; label = "הנחת הזמנה ראשונה (" + CFG.couponCode + ")"; }
    else if (q.discType === "pct" && q.discValue) { disc = sub * Number(q.discValue) / 100; label = "הנחה " + Number(q.discValue) + "%"; }
    else if (q.discType === "amount" && q.discValue) { disc = Math.min(sub, Number(q.discValue)); label = "הנחה"; }
    var total = sub - disc;
    return { sub: sub, disc: disc, label: label, total: total, deposit: Math.round(total * (Number(q.depositPct) || 0) / 100) };
  }

  // ---------- כניסה ----------
  function unlock() { $("lock").hidden = true; $("app").hidden = false; show("list"); }
  var unlocked = false;
  try { unlocked = sessionStorage.getItem(UNLOCK) === "1" || localStorage.getItem(UNLOCK) === "1"; } catch (e) {}
  if (!CFG.pin || unlocked) unlock();
  $("lock-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if ($("pin").value.trim() === String(CFG.pin)) {
      try { localStorage.setItem(UNLOCK, "1"); } catch (e2) {}
      unlock();
    } else { $("pin-err").textContent = "הקוד לא נכון. נסי שוב."; }
  });

  // ---------- ניווט ----------
  var current = null;
  function show(view) {
    ["list", "edit", "preview"].forEach(function (v) { $("view-" + v).hidden = v !== view; });
    if (view === "list") renderList();
    if (view === "preview") renderDoc();
    window.scrollTo(0, 0);
  }
  document.querySelectorAll("[data-go]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (b.dataset.go === "preview" && !$("quote-form").reportValidity()) return;
      show(b.dataset.go);
    });
  });

  // ---------- רשימה ----------
  function renderList() {
    var box = $("quote-list");
    var items = db.quotes.slice().sort(function (a, b) { return b.updated - a.updated; });
    $("list-empty").hidden = items.length > 0;
    box.innerHTML = items.map(function (q) {
      return '<div class="item" data-id="' + q.id + '">' +
        '<button class="item-main" type="button" data-act="open"><strong>' + esc(q.names || "בלי שם") + '</strong>' +
        '<span>הצעה ' + esc(q.number) + ' · ' + heDate(q.created) + (q.eventDate ? ' · ' + esc(q.event || "אירוע") + ' ' + heDate(q.eventDate) : '') + '</span>' +
        '<span class="item-total">' + money(totals(q).total) + '</span></button>' +
        '<div class="item-acts"><button class="link" type="button" data-act="copy">שכפול</button>' +
        '<button class="link danger" type="button" data-act="del">מחיקה</button></div></div>';
    }).join("");
  }
  $("quote-list").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-act]"); if (!btn) return;
    var id = btn.closest(".item").dataset.id;
    var q = db.quotes.find(function (x) { return x.id === id; });
    if (!q) return;
    if (btn.dataset.act === "open") { edit(q); }
    else if (btn.dataset.act === "copy") {
      var c = newQuote();
      ["event", "lines", "discType", "discValue", "depositPct", "validDays", "turnaround", "notes"].forEach(function (k) { c[k] = JSON.parse(JSON.stringify(q[k])); });
      db.quotes.push(c); save(); edit(c);
    } else if (btn.dataset.act === "del") {
      if (btn.dataset.sure) { db.quotes = db.quotes.filter(function (x) { return x !== q; }); save(); renderList(); }
      else { btn.dataset.sure = "1"; btn.textContent = "בטוח? למחוק"; }
    }
  });

  function newQuote() {
    db.counter = (db.counter || 0) + 1;
    var now = Date.now();
    return {
      id: "q" + now.toString(36), number: new Date().getFullYear() + "-" + String(db.counter).padStart(3, "0"),
      created: now, updated: now, names: "", phone: "", email: "", event: "חתונה", eventDate: "", venue: "",
      sketch: "", sketchCaption: "", lines: [],
      discType: "none", discValue: "", depositPct: CFG.depositPercent, validDays: CFG.validDays,
      turnaround: CFG.turnaround || "", notes: ""
    };
  }
  $("new-quote").addEventListener("click", function () {
    var q = newQuote();
    if (CFG.catalog[0]) q.lines.push(lineFrom(CFG.catalog[0]));
    db.quotes.push(q); save(); edit(q);
  });

  // ---------- עריכה ----------
  var form = $("quote-form");
  var fields = ["names", "phone", "email", "event", "eventDate", "venue", "sketchCaption", "discType", "discValue", "depositPct", "validDays", "turnaround", "notes"];
  function lineFrom(p) { return { name: p.name, desc: p.desc || "", qty: 1, price: Number(p.price) || 0 }; }

  function edit(q) {
    current = q;
    fields.forEach(function (f) { if (form.elements[f]) form.elements[f].value = q[f] == null ? "" : q[f]; });
    $("edit-number").textContent = "הצעה " + q.number;
    setSketch(q.sketch);
    renderLines();
    syncDisc();
    show("edit");
  }
  function touch() { current.updated = Date.now(); save(); $("live-total").textContent = money(totals(current).total); }

  form.addEventListener("input", function (e) {
    if (!current) return;
    var t = e.target;
    if (t.dataset.line != null) {
      current.lines[+t.dataset.line][t.dataset.field] = t.type === "number" ? t.value : t.value;
      var row = t.closest(".line");
      var l = current.lines[+t.dataset.line];
      row.querySelector(".line-sum").textContent = money((Number(l.qty) || 0) * (Number(l.price) || 0));
    } else if (fields.indexOf(t.name) > -1) {
      current[t.name] = t.value;
      if (t.name === "discType") syncDisc();
    }
    touch();
  });
  form.addEventListener("change", function (e) { if (e.target.name === "discType") { current.discType = e.target.value; syncDisc(); touch(); } });
  function syncDisc() {
    var t = form.elements.discType.value;
    var v = form.elements.discValue;
    v.hidden = !(t === "pct" || t === "amount");
    v.placeholder = t === "pct" ? "אחוז" : "₪";
  }

  function renderLines() {
    $("lines").innerHTML = current.lines.map(function (l, i) {
      return '<div class="line">' +
        '<div class="line-head"><input aria-label="שם המוצר" data-line="' + i + '" data-field="name" value="' + esc(l.name) + '">' +
        '<button class="link danger" type="button" data-remove="' + i + '" aria-label="הסרת השורה">הסרה</button></div>' +
        '<input class="line-desc" aria-label="פירוט" placeholder="פירוט (רשות)" data-line="' + i + '" data-field="desc" value="' + esc(l.desc) + '">' +
        '<div class="line-nums"><label>כמות<input type="number" inputmode="decimal" min="0" data-line="' + i + '" data-field="qty" value="' + esc(l.qty) + '"></label>' +
        '<label>מחיר ליח\' (₪)<input type="number" inputmode="decimal" min="0" data-line="' + i + '" data-field="price" value="' + esc(l.price) + '"></label>' +
        '<span class="line-sum">' + money((Number(l.qty) || 0) * (Number(l.price) || 0)) + '</span></div></div>';
    }).join("") || '<p class="small">עוד אין מוצרים בהצעה.</p>';
    $("live-total").textContent = money(totals(current).total);
  }
  $("lines").addEventListener("click", function (e) {
    var b = e.target.closest("[data-remove]"); if (!b) return;
    current.lines.splice(+b.dataset.remove, 1); renderLines(); touch();
  });
  $("catalog").innerHTML = CFG.catalog.map(function (p, i) {
    return '<button class="chip" type="button" data-cat="' + i + '">' + esc(p.name) + ' · ' + money(p.price) + '</button>';
  }).join("");
  $("catalog").addEventListener("click", function (e) {
    var b = e.target.closest("[data-cat]"); if (!b) return;
    current.lines.push(lineFrom(CFG.catalog[+b.dataset.cat])); renderLines(); touch();
  });
  $("add-free").addEventListener("click", function () {
    current.lines.push({ name: "", desc: "", qty: 1, price: 0 }); renderLines(); touch();
    var inputs = $("lines").querySelectorAll('[data-field="name"]'); inputs[inputs.length - 1].focus();
  });

  // תמונת הסקיצה: מקטינים ל־1000px כדי שתיכנס לזיכרון של הטלפון
  function setSketch(src) {
    var img = $("sketch-preview");
    img.hidden = !src; if (src) img.src = src;
    $("sketch-remove").hidden = !src;
  }
  $("f-sketch").addEventListener("change", function (e) {
    var file = e.target.files[0]; if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var im = new Image();
      im.onload = function () {
        var scale = Math.min(1, 1000 / Math.max(im.width, im.height));
        var c = document.createElement("canvas");
        c.width = Math.round(im.width * scale); c.height = Math.round(im.height * scale);
        var ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(im, 0, 0, c.width, c.height);
        current.sketch = c.toDataURL("image/jpeg", 0.82);
        setSketch(current.sketch); touch();
      };
      im.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  });
  $("sketch-remove").addEventListener("click", function () { current.sketch = ""; setSketch(""); touch(); });

  // ---------- המסמך ----------
  function renderDoc() {
    var q = current, t = totals(q), b = CFG.business || {};
    var valid = addDays(q.created, q.validDays);
    var pay = CFG.payment || {};
    var payWays = [];
    if (pay.bit) payWays.push("ביט: " + esc(pay.bit));
    if (pay.paybox) payWays.push("PayBox: " + esc(pay.paybox));
    if (pay.bank) payWays.push("העברה בנקאית: " + esc(pay.bank));
    var terms = [];
    if (q.turnaround) terms.push("<li><b>זמן עבודה:</b> " + esc(q.turnaround) + "</li>");
    if (CFG.revisions) terms.push("<li><b>תיקונים:</b> " + esc(CFG.revisions) + "</li>");
    if (Number(q.depositPct)) terms.push("<li><b>מקדמה:</b> " + Number(q.depositPct) + "% (" + money(t.deposit) + ") לשריון התאריך, עם אישור ההצעה.</li>");
    if (CFG.paymentTerms) terms.push("<li><b>תנאי תשלום:</b> " + esc(CFG.paymentTerms) + "</li>");
    if (payWays.length) terms.push("<li><b>אמצעי תשלום:</b> " + payWays.join(" · ") + "</li>");
    if (CFG.cancellation) terms.push("<li><b>ביטול:</b> " + esc(CFG.cancellation) + "</li>");
    terms.push("<li>ההצעה בתוקף עד " + heDate(valid) + ".</li>");

    $("doc").innerHTML =
      '<header class="doc-head">' +
        '<div class="doc-brand"><img src="assets/img/logo-small.png" alt="" width="54" height="51"><div><strong>' + esc(CFG.name) + '</strong><span>' + esc(CFG.tagline) + '</span></div></div>' +
        '<div class="doc-biz">' + (b.idNumber ? esc(b.idLabel || "עוסק פטור מס'") + ' ' + esc(b.idNumber) + '<br>' : '') +
          (b.address ? esc(b.address) + '<br>' : '') + esc(CFG.phone) + '<br>' + esc(CFG.email) + '</div>' +
      '</header>' +
      '<div class="doc-title"><h1>הצעת מחיר</h1><div class="doc-meta">מס\' ' + esc(q.number) + '<br>תאריך: ' + heDate(q.created) + '<br>בתוקף עד: ' + heDate(valid) + '</div></div>' +
      '<div class="doc-to"><b>לכבוד:</b> ' + esc(q.names) +
        (q.phone ? ' · <span dir="ltr">' + esc(q.phone) + '</span>' : '') + (q.email ? ' · <span dir="ltr">' + esc(q.email) + '</span>' : '') +
        (q.event || q.eventDate || q.venue ? '<br><b>האירוע:</b> ' + esc(q.event) + (q.eventDate ? ', ' + heDate(q.eventDate) : '') + (q.venue ? ', ' + esc(q.venue) : '') : '') + '</div>' +
      (q.sketch ? '<figure class="doc-sketch"><img src="' + q.sketch + '" alt="">' + (q.sketchCaption ? '<figcaption>' + esc(q.sketchCaption) + '</figcaption>' : '') + '</figure>' : '') +
      '<table class="doc-table"><thead><tr><th>#</th><th>תיאור</th><th>כמות</th><th>מחיר ליח\'</th><th>סה"כ</th></tr></thead><tbody>' +
        q.lines.map(function (l, i) {
          return '<tr><td>' + (i + 1) + '</td><td><b>' + esc(l.name) + '</b>' + (l.desc ? '<small>' + esc(l.desc) + '</small>' : '') + '</td><td>' + esc(l.qty) + '</td><td>' + money(Number(l.price) || 0) + '</td><td>' + money((Number(l.qty) || 0) * (Number(l.price) || 0)) + '</td></tr>';
        }).join("") +
      '</tbody></table>' +
      '<div class="doc-totals">' +
        (t.disc ? '<div><span>סה"כ לפני הנחה</span><span>' + money(t.sub) + '</span></div><div><span>' + esc(t.label) + '</span><span>‎-' + money(t.disc) + '</span></div>' : '') +
        '<div class="grand"><span>סה"כ לתשלום</span><span>' + money(t.total) + '</span></div>' +
        (CFG.vatNote ? '<div class="note">' + esc(CFG.vatNote) + '</div>' : '') +
        (Number(q.depositPct) ? '<div><span>מקדמה לשריון (' + Number(q.depositPct) + '%)</span><span>' + money(t.deposit) + '</span></div>' : '') +
      '</div>' +
      '<section class="doc-terms"><h2>תנאים</h2><ul>' + terms.join("") + '</ul>' + (q.notes ? '<p>' + esc(q.notes).replace(/\n/g, "<br>") + '</p>' : '') + '</section>' +
      (CFG.thanks ? '<p class="doc-thanks">' + esc(CFG.thanks) + '</p>' : '');
  }

  // ---------- PDF ושליחה ----------
  // שם קובץ באנגלית: חלק מהדפדפנים מתעלמים משם בעברית
  function fileName() { return "Moria-Ofir-quote-" + current.number + ".pdf"; }
  function makePdf() {
    if (!window.html2canvas || !window.jspdf) return Promise.reject(new Error("lib"));
    var el = $("doc"), breaks = [];
    el.classList.add("pdf-mode");
    return (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () {
      // נקודות שבהן מותר לחתוך לעמוד חדש: סוף כל שורה בטבלה וכל חלק במסמך
      var top = el.getBoundingClientRect().top;
      breaks = Array.prototype.map.call(el.querySelectorAll(".doc > *, .doc-table tr, .doc-terms li"), function (n) {
        return (n.getBoundingClientRect().bottom - top) * 2;
      }).sort(function (a, b) { return a - b; });
      return window.html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
    }).then(function (canvas) {
      el.classList.remove("pdf-mode");
      var pdf = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
      var pw = 210, ph = 297, margin = 10, w = pw - margin * 2;
      var pxPerMm = canvas.width / w, pageH = Math.floor((ph - margin * 2) * pxPerMm);
      for (var y = 0, page = 0; y < canvas.height - 2; page++) {
        var h = Math.min(pageH, canvas.height - y);
        if (y + h < canvas.height) {
          var cut = breaks.filter(function (b) { return b > y + pageH * 0.5 && b <= y + pageH; }).pop();
          if (cut) h = Math.ceil(cut - y);
        }
        var slice = document.createElement("canvas"); slice.width = canvas.width; slice.height = h;
        slice.getContext("2d").drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
        if (page) pdf.addPage();
        pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, w, h / pxPerMm);
        y += h;
      }
      return pdf.output("blob");
    }, function (err) { el.classList.remove("pdf-mode"); throw err; });
  }
  function download(blob) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = fileName();
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  function busy(btn, on) { btn.disabled = on; btn.dataset.label = btn.dataset.label || btn.textContent; btn.textContent = on ? "מכינה את הקובץ..." : btn.dataset.label; }

  $("save-pdf").addEventListener("click", function () {
    var btn = this; busy(btn, true);
    makePdf().then(function (blob) { download(blob); alertMsg("הקובץ נשמר בהורדות."); })
      .catch(function () { window.print(); })
      .then(function () { busy(btn, false); });
  });
  // וואטסאפ: בטלפון נפתח חלון השיתוף עם קובץ ה-PDF עצמו. ההודעה מועתקת ללוח, כי וואטסאפ
  // לא תמיד מקבל קובץ וטקסט יחד. במחשב אי אפשר לצרף קובץ דרך קישור, אז הקובץ יורד ומצרפים ידנית
  $("share").addEventListener("click", function () {
    var btn = this; busy(btn, true);
    var text = "היי " + (current.names || "") + ", מצורפת הצעת המחיר שלכם. אשמח לענות על כל שאלה.";
    var copied = false;
    try { navigator.clipboard.writeText(text).then(function () { copied = true; }, function () {}); } catch (e) {}
    makePdf().then(function (blob) {
      var file = new File([blob], fileName(), { type: "application/pdf" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file] }).then(function () {
          alertMsg(copied ? "הקובץ נשלח. ההודעה מועתקת, אפשר להדביק אותה בצ'אט." : "הקובץ נשלח.");
        }, function () { alertMsg(""); });
      }
      download(blob);
      alertMsg("במחשב וואטסאפ לא מקבל קובץ דרך קישור. הקובץ ירד להורדות: בצ'אט שנפתח לוחצים על האטב ומצרפים אותו.");
      window.open("https://wa.me/" + waPhone(current.phone) + "?text=" + encodeURIComponent(text), "_blank");
    }).catch(function () {
      alertMsg("לא הצלחתי להכין PDF. נסי את \"שמירה כ-PDF\" ושלחי את הקובץ ידנית.");
    }).then(function () { busy(btn, false); });
  });

  // ---------- גיבוי ----------
  $("export").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(db)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "moria-quotes-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a); a.click(); a.remove();
  });
  $("import").addEventListener("change", function (e) {
    var file = e.target.files[0]; if (!file) return;
    file.text().then(function (txt) {
      var data = JSON.parse(txt);
      if (!data || !Array.isArray(data.quotes)) throw new Error("bad");
      var have = {}; db.quotes.forEach(function (q) { have[q.id] = true; });
      data.quotes.forEach(function (q) { if (!have[q.id]) db.quotes.push(q); });
      db.counter = Math.max(db.counter || 0, data.counter || 0);
      save(); renderList();
    }).catch(function () { $("list-empty").hidden = false; $("list-empty").textContent = "הקובץ הזה לא נראה כמו גיבוי של הצעות מחיר."; });
    e.target.value = "";
  });
})();
