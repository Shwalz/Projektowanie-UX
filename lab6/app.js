/* ============================================================
   Budżet pod kontrolą — laboratorium 6
   Czysty JavaScript. Każdy widget zarządza stanem ARIA,
   a obsługa klawiatury działa bez myszy.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 1. Nawigacja na wąskim ekranie ---------- */
  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");

  navToggle.addEventListener("click", function () {
    var open = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!open));
    mainNav.classList.toggle("is-open", !open);
  });

  /* ---------- 2. Zakładki: strzałki, Home, End ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));

  function selectTab(tab, setFocus) {
    tabs.forEach(function (t) {
      var selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;                       /* roving tabindex */
      document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
    });
    if (setFocus) tab.focus();
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () { selectTab(tab, false); });

    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = tabs[(index + 1) % tabs.length];
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = tabs[(index - 1 + tabs.length) % tabs.length];
      else if (e.key === "Home") next = tabs[0];
      else if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  });

  /* ---------- 3. Akordeon FAQ ---------- */
  var triggers = Array.prototype.slice.call(document.querySelectorAll(".accordion__trigger"));

  triggers.forEach(function (btn, index) {
    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      document.getElementById(btn.getAttribute("aria-controls")).hidden = expanded;
    });

    /* wzorzec ARIA Authoring Practices: strzałki przenoszą fokus między nagłówkami */
    btn.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowDown") next = triggers[(index + 1) % triggers.length];
      else if (e.key === "ArrowUp") next = triggers[(index - 1 + triggers.length) % triggers.length];
      else if (e.key === "Home") next = triggers[0];
      else if (e.key === "End") next = triggers[triggers.length - 1];
      if (next) { e.preventDefault(); next.focus(); }
    });
  });

  /* ---------- 4. Okno dialogowe z pułapką fokusu ---------- */
  var modal = document.getElementById("helpModal");
  var backdrop = document.getElementById("modalBackdrop");
  var openHelp = document.getElementById("openHelp");
  var modalClose = document.getElementById("modalClose");
  var lastFocused = null;

  function openModal() {
    lastFocused = document.activeElement;
    modal.hidden = false;
    backdrop.hidden = false;
    modalClose.focus();
    document.addEventListener("keydown", modalKeys, true);
  }

  function closeModal() {
    modal.hidden = true;
    backdrop.hidden = true;
    document.removeEventListener("keydown", modalKeys, true);
    if (lastFocused) lastFocused.focus();     /* fokus wraca na przycisk otwierający */
  }

  function modalKeys(e) {
    if (e.key === "Escape") { e.preventDefault(); closeModal(); return; }
    if (e.key !== "Tab") return;

    var focusable = modal.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  openHelp.addEventListener("click", openModal);
  modalClose.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);

  /* ---------- 5. Walidacja formularza ---------- */
  var form = document.getElementById("txForm");
  var summary = document.getElementById("formErrors");

  var RULES = [
    {
      id: "txTitle",
      label: "Opis transakcji",
      check: function (v) { return v.trim().length >= 3; },
      message: "Podaj opis transakcji, co najmniej 3 znaki."
    },
    {
      id: "txAmount",
      label: "Kwota w złotych",
      check: function (v) {
        var n = parseFloat(v.replace(",", ".").replace(/\s/g, ""));
        return isFinite(n) && n > 0;
      },
      message: "Kwota musi być większa od zera. Wpisz ją w złotych, na przykład 24,90."
    },
    {
      id: "txEmail",
      label: "Adres e-mail",
      check: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      message: "Wpisz adres w formacie nazwa@domena.pl."
    },
    {
      id: "txCategory",
      label: "Kategoria",
      check: function (v) { return v !== ""; },
      message: "Wybierz kategorię z listy."
    }
  ];

  function clearError(rule) {
    var input = document.getElementById(rule.id);
    var field = input.closest(".field");
    var msg = document.getElementById(rule.id + "Error");

    field.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
    if (msg) msg.remove();

    /* w aria-describedby zostaje sam tekst pomocniczy */
    input.setAttribute("aria-describedby", rule.id + "Help");
  }

  function showError(rule) {
    var input = document.getElementById(rule.id);
    var field = input.closest(".field");
    var msgId = rule.id + "Error";

    field.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");

    var msg = document.getElementById(msgId);
    if (!msg) {
      msg = document.createElement("p");
      msg.id = msgId;
      msg.className = "error-text";
      msg.setAttribute("role", "alert");          /* czytnik odczyta komunikat od razu */
      field.appendChild(msg);
    }
    msg.textContent = rule.message;

    /* pole wskazuje i tekst pomocniczy, i komunikat błędu */
    input.setAttribute("aria-describedby", rule.id + "Help " + msgId);
  }

  function validateField(rule) {
    var input = document.getElementById(rule.id);
    var ok = rule.check(input.value);
    if (ok) clearError(rule); else showError(rule);
    return ok;
  }

  /* sprawdzenie pojedynczego pola po jego opuszczeniu */
  RULES.forEach(function (rule) {
    var input = document.getElementById(rule.id);
    input.addEventListener("blur", function () {
      if (input.value !== "") validateField(rule);
    });
    input.addEventListener("input", function () {
      if (input.getAttribute("aria-invalid") === "true") validateField(rule);
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var invalid = RULES.filter(function (rule) { return !validateField(rule); });

    if (invalid.length === 0) {
      summary.hidden = true;
      summary.innerHTML = "";
      form.reset();
      RULES.forEach(clearError);
      openModal();
      document.getElementById("helpModalTitle").textContent = "Transakcja zapisana";
      document.getElementById("helpModalDesc").textContent =
        "Wpis trafił do października. Przez 10 sekund możesz cofnąć zapis z poziomu listy transakcji.";
      return;
    }

    /* zbiorczy komunikat z odnośnikami do pól */
    var items = invalid.map(function (rule) {
      return '<li><a href="#' + rule.id + '">' + rule.label + ": " + rule.message + "</a></li>";
    }).join("");

    summary.innerHTML = "<strong>Nie zapisano. Popraw " + invalid.length +
      (invalid.length === 1 ? " pole" : " pola") + ":</strong><ul>" + items + "</ul>";
    summary.hidden = false;

    document.getElementById(invalid[0].id).focus();   /* fokus na pierwszym błędnym polu */
  });

  form.addEventListener("reset", function () {
    summary.hidden = true;
    summary.innerHTML = "";
    RULES.forEach(clearError);
  });
})();
