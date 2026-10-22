// הצעת מחיר: המעטפה נפתחת לבד אחרי רגע, או מיד בנגיעה. מופיעה בכל פתיחה
(function () {
  var env = document.getElementById("envelope");
  if (!env || env.hidden) return;
  var done = false;
  function open() {
    if (done) return;
    done = true;
    env.classList.add("open");
    setTimeout(function () { env.classList.add("gone"); }, 1900);
    setTimeout(function () { env.hidden = true; }, 2450);
  }
  env.addEventListener("click", open);
  setTimeout(open, 700);
})();
