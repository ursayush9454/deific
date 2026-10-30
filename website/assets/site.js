/* Deific Digital - static site interactions (vanilla JS, no framework).
   Consolidated script:
   navigation, homepage animation, calculator, contact form/CAPTCHA/email,
   product demos, UAE language switcher and Render-backed voice assistant.
*/
/* GA4: paste your Measurement ID below (for example "G-ABC123XYZ").
   Google Analytics is loaded only after a visitor accepts analytics cookies.
   Leave it empty to keep analytics switched off. */
window.DD_GA4_ID = "G-2DZCJGWLVB";

(function () {
  "use strict";

  var CONFIG = {
    WHATSAPP: "918750200899",
    AI_BACKEND_URL: "https://chatbot-qpnn.onrender.com",
    LEAD_ENDPOINT: "/api/leads",
    CONTACT_EMAIL: "deific.solution@hotmail.com",
    // "auto"  = send directly via FormSubmit, and if that fails open the email app (mailto) with the enquiry filled in
    // "mailto" = always open the visitor's email app on submit
    CONTACT_MODE: "mailto",

    FEED: {
      rows: [
        { task: "New WhatsApp lead: 3BHK enquiry", where: "Real estate", agent: "Sales agent", result: "Replied in 8 sec, site visit booked for Sat 11 am", waiting: "Waiting for 47 min" },
        { task: "Patient call at 9:42 pm", where: "Hospital", agent: "AI receptionist", result: "OPD slot booked, confirmation sent on WhatsApp", waiting: "Missed call, nobody picked up" },
        { task: "GST documents pending from 14 clients", where: "CA firm", agent: "Automation flow", result: "Reminders sent, 9 clients uploaded already", waiting: "Waiting for 3 days" },
        { task: "Test-drive enquiry from Instagram", where: "Car dealer", agent: "WhatsApp agent", result: "Slot fixed, showroom executive alerted", waiting: "Waiting for 2 hr" },
        { task: "Invoice overdue by 12 days", where: "Accounts", agent: "Automation flow", result: "Payment link sent, follow-up set for Monday", waiting: "Waiting for 12 days" },
        { task: "Order complaint from a customer", where: "Customer care", agent: "Care agent", result: "Resolved from knowledge base, ticket closed", waiting: "Waiting for 5 hr" },
        { task: "Price request on website chat", where: "Website", agent: "Sales agent", result: "Brochure shared, lead scored hot, sent to CRM", waiting: "Waiting for 1 day" },
        { task: "End-of-day business report", where: "Owner", agent: "Automation flow", result: "Leads, calls and payments summary sent at 8 pm", waiting: "Not done yet" }
      ],
      autoOn: "Auto mode on",
      manual: "Manual mode",
      capAuto: "Example of a day on auto mode. Flip the switch to see it without.",
      capManual: "This is a normal day. Flip the switch in the headline.",
      ariaAuto: "Example: AI agents handling business tasks automatically",
      ariaManual: "Example: tasks waiting for your team"
    },

    AR_FEED: {
      rows: [
        { task: "عميل جديد عبر واتساب: استفسار عن شقة من 3 غرف", where: "العقارات", agent: "وكيل المبيعات", result: "تم الرد خلال 8 ثوانٍ وحُجزت زيارة للموقع يوم السبت الساعة 11 صباحًا", waiting: "بانتظار الرد منذ 47 دقيقة" },
        { task: "مكالمة مريض الساعة 9:42 مساءً", where: "الرعاية الصحية", agent: "موظف الاستقبال الذكي", result: "تم حجز موعد وإرسال التأكيد عبر واتساب", waiting: "مكالمة فائتة لم يتم الرد عليها" },
        { task: "مستندات ضريبية معلّقة لدى 14 عميلًا", where: "المحاسبة", agent: "تدفق الأتمتة", result: "أُرسلت التذكيرات ورفع 9 عملاء مستنداتهم", waiting: "بانتظار 3 أيام" },
        { task: "طلب تجربة قيادة عبر إنستغرام", where: "السيارات", agent: "وكيل واتساب", result: "تم تحديد الموعد وإبلاغ موظف المعرض", waiting: "بانتظار ساعتين" },
        { task: "فاتورة متأخرة منذ 12 يومًا", where: "الحسابات", agent: "تدفق الأتمتة", result: "أُرسل رابط الدفع وتم تحديد متابعة يوم الاثنين", waiting: "متأخرة منذ 12 يومًا" },
        { task: "شكوى عميل بشأن طلب", where: "خدمة العملاء", agent: "وكيل خدمة العملاء", result: "تم الحل من قاعدة المعرفة وإغلاق التذكرة", waiting: "بانتظار 5 ساعات" },
        { task: "طلب سعر عبر محادثة الموقع", where: "الموقع الإلكتروني", agent: "وكيل المبيعات", result: "تم إرسال الكتيّب وتصنيف العميل المحتمل وإضافته إلى CRM", waiting: "بانتظار يوم" },
        { task: "تقرير الأعمال في نهاية اليوم", where: "الإدارة", agent: "تدفق الأتمتة", result: "إرسال ملخص العملاء والمكالمات والمدفوعات الساعة 8 مساءً", waiting: "لم يتم بعد" }
      ],
      autoOn: "الوضع التلقائي يعمل",
      manual: "الوضع اليدوي",
      capAuto: "مثال ليوم عمل في الوضع التلقائي. أوقف المفتاح لمشاهدة الوضع اليدوي.",
      capManual: "هذا يوم عمل عادي. فعّل المفتاح في العنوان لمشاهدة الأتمتة.",
      ariaAuto: "مثال: وكلاء الذكاء الاصطناعي يديرون مهام العمل تلقائيًا",
      ariaManual: "مثال: مهام تنتظر فريق العمل"
    }
  };

  var $ = function (selector, root) {
    return (root || document).querySelector(selector);
  };

  var $$ = function (selector, root) {
    return Array.prototype.slice.call(
      (root || document).querySelectorAll(selector)
    );
  };

  function isArabic() {
    return /^ar(?:-|$)/i.test(
      document.documentElement.lang || ""
    ) || /^\/uae\/ar(?:\/|$)/i.test(location.pathname);
  }

  /* Visible text/attribute as written in the HTML (English), even when the
     site is in Arabic mode and the DOM now holds the translation. */
  function origText(el) {
    return typeof window.ddOriginalText === "function"
      ? window.ddOriginalText(el)
      : el.textContent;
  }

  function origAttr(el, name) {
    return typeof window.ddOriginalAttr === "function"
      ? window.ddOriginalAttr(el, name)
      : el.getAttribute(name);
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* 1. Scroll-reveal safety. */

  $$('[style*="opacity:0"],[style*="opacity: 0"]').forEach(function (el) {
    el.style.opacity = "1";
    el.style.transform = "none";
  });

  /* 2. Contact links from root and nested pages. */

  function normalizeContactLinks() {
    $$("a[href]").forEach(function (link) {
      var href = (link.getAttribute("href") || "").trim();

      if (
        !href ||
        /^(?:#|mailto:|tel:|javascript:|https?:|\/\/)/i.test(href)
      ) {
        return;
      }

      var target;

      try {
        target = new URL(href, location.href);
      } catch (error) {
        return;
      }

      // Contact links already point to the correct relative path in each page
      // (../contact/index.html etc.). Rewriting them to a root-absolute URL
      // breaks file:// and sub-folder hosting, so they are left untouched.
    });
  }

  normalizeContactLinks();

  /* 3. Mobile navigation. */

  var menuBtn = $('button[aria-label="Open menu"]');

  if (
    menuBtn &&
    !document.getElementById("dd-mobile-navigation")
  ) {
    var nav = $('nav[aria-label="Main"]');
    var mobilePanel = document.createElement("div");

    mobilePanel.id = "dd-mobile-navigation";
    mobilePanel.className =
      "fixed inset-x-0 top-[68px] bottom-0 z-40 overflow-y-auto bg-white px-5 py-5 xl:hidden";
    mobilePanel.hidden = true;

    var mobileHTML = "";

    if (nav) {
      Array.prototype.forEach.call(nav.children, function (item) {
        var btn = $("button", item);

        if (btn) {
          var links = $$("a", item);
          var seen = {};

          mobileHTML +=
            '<p class="mt-5 mb-2 text-[12px] font-semibold uppercase tracking-wider text-dd-slate">' +
            escapeHTML(btn.textContent.trim()) +
            "</p>";

          links.forEach(function (link) {
            var label = link.textContent.trim().replace(/\s+/g, " ");
            var href = link.getAttribute("href") || "#";

            if (!label || seen[href]) return;

            seen[href] = true;

            mobileHTML +=
              '<a class="block py-2 text-[16px] text-dd-ink" href="' +
              escapeHTML(href) +
              '">' +
              escapeHTML(label) +
              "</a>";
          });
        } else if (item.tagName === "A") {
          mobileHTML +=
            '<a class="block border-b border-dd-line py-3 text-[17px] font-medium text-dd-ink" href="' +
            escapeHTML(item.getAttribute("href") || "#") +
            '">' +
            escapeHTML(item.textContent.trim()) +
            "</a>";
        }
      });
    }

    mobilePanel.innerHTML = mobileHTML;
    document.body.appendChild(mobilePanel);

    menuBtn.setAttribute("aria-expanded", "false");

    menuBtn.addEventListener("click", function () {
      var open = mobilePanel.hidden;

      mobilePanel.hidden = !open;
      menuBtn.setAttribute("aria-expanded", String(open));

      document.documentElement.style.overflow = open ? "hidden" : "";
    });

    mobilePanel.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        mobilePanel.hidden = true;
        menuBtn.setAttribute("aria-expanded", "false");
        document.documentElement.style.overflow = "";
      }
    });
  }

  /* 4. Tabs: preserve the page's original active/inactive classes. */

  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);

    if (tabs.length < 2) return;

    var active = tabs.filter(function (tab) {
      return tab.getAttribute("aria-selected") === "true";
    })[0] || tabs[0];

    var inactive = tabs.filter(function (tab) {
      return tab !== active;
    })[0];

    var activeClass = active.className;
    var inactiveClass = inactive ? inactive.className : "";

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (item) {
          var selected = item === tab;

          item.setAttribute("aria-selected", String(selected));
          item.className = selected ? activeClass : inactiveClass;

          var panel = document.getElementById(
            item.getAttribute("aria-controls")
          );

          if (panel) panel.hidden = !selected;
        });
      });
    });
  });

  /* 5. Homepage ON/OFF animation. */

  var switchEl = $('button[role="switch"]');
  var consoleEl = $('div[role="img"][aria-label]');
  var autoTimer = null;
  var handled = 1284;
  var done = 3;
  var switchTouched = false;

  function activeFeed() {
    return isArabic() ? CONFIG.AR_FEED : CONFIG.FEED;
  }

  function renderConsole(auto) {
    if (!consoleEl) return;

    var feed = activeFeed();
    var ul = $("ul", consoleEl);

    if (!ul) return;

    var nums = $$("p.font-display", consoleEl);
    var count = Math.max(1, Math.min(done, feed.rows.length));

    var rows = auto
      ? feed.rows.slice(0, count).reverse()
      : feed.rows;

    ul.innerHTML = rows.map(function (row, index) {
      var icon = auto
        ? '<span class="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-dd-go text-white">&#10003;</span>'
        : '<span class="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-[#FF8A8F]">&#9719;</span>';

      var detail = auto
        ? '<p class="mt-1 text-[12.5px] leading-snug text-white/65"><span class="inline-flex items-center gap-1 text-[#5BE3A1]">' +
          escapeHTML(row.agent) +
          ":</span> " +
          escapeHTML(row.result) +
          "</p>"
        : '<p class="mt-1 text-[12.5px] text-[#FF8A8F]/90">' +
          escapeHTML(row.waiting) +
          "</p>";
                return (
        '<li class="rounded-xl px-3.5 py-3 ' +
        (index === 0
          ? "dd-row-in bg-white/[0.09]"
          : "bg-white/[0.045]") +
        '"><div class="flex items-start gap-3">' +
        icon +
        '<div class="min-w-0 flex-1">' +
        '<div class="flex items-baseline justify-between gap-3">' +
        '<p class="truncate text-[14px] font-medium">' +
        escapeHTML(row.task) +
        '</p><span class="shrink-0 text-[11px] text-white/45">' +
        escapeHTML(row.where) +
        "</span></div>" +
        detail +
        "</div></div></li>"
      );
    }).join("");

    if (nums[0]) {
      nums[0].textContent = auto
        ? handled.toLocaleString(isArabic() ? "ar-AE" : "en-IN")
        : "0";
    }

    if (nums[1]) {
      nums[1].textContent = auto
        ? String(Math.max(0, 2 - (done % 3)))
        : "37";

      nums[1].classList.remove("text-white", "text-[#FF8A8F]");
      nums[1].classList.add(
        auto ? "text-white" : "text-[#FF8A8F]"
      );
    }

    var badge = $$("span.rounded-full", consoleEl).filter(function (el) {
      return el.classList.contains("px-2.5") &&
        el.classList.contains("py-1");
    })[0];

    if (badge) {
      badge.classList.remove(
        "bg-dd-go/20",
        "text-[#5BE3A1]",
        "bg-dd-red/20",
        "text-[#FF8A8F]"
      );

      badge.classList.add(auto ? "bg-dd-go/20" : "bg-dd-red/20");
      badge.classList.add(auto ? "text-[#5BE3A1]" : "text-[#FF8A8F]");

      badge.innerHTML =
        '<span class="h-1.5 w-1.5 rounded-full ' +
        (auto ? "bg-[#5BE3A1]" : "bg-[#FF8A8F]") +
        '"></span><span>' +
        escapeHTML(auto ? feed.autoOn : feed.manual) +
        "</span>";
    }

    consoleEl.setAttribute(
      "aria-label",
      auto ? feed.ariaAuto : feed.ariaManual
    );

    var caption = null;
    var parent = consoleEl.parentElement;
    var levels = 0;

    while (parent && !caption && levels < 4) {
      caption = $$("p", parent).filter(function (p) {
        var text = p.textContent.trim();

        return (
          text === CONFIG.FEED.capManual ||
          text === CONFIG.FEED.capAuto ||
          text === CONFIG.AR_FEED.capManual ||
          text === CONFIG.AR_FEED.capAuto
        );
      })[0] || null;

      parent = parent.parentElement;
      levels++;
    }

    if (caption) {
      caption.textContent = auto ? feed.capAuto : feed.capManual;
    }
  }

  function setAuto(on) {
    if (!switchEl) return;

    var knob = switchEl.firstElementChild;

    switchEl.setAttribute("aria-checked", String(!!on));

    switchEl.classList.remove(
      "bg-dd-line",
      "bg-dd-go",
      "dd-nudge"
    );

    switchEl.classList.add(on ? "bg-dd-go" : "bg-dd-line");

    if (knob) {
      knob.style.left = on ? "calc(100% - 0.78em)" : "";
    }

    clearInterval(autoTimer);

    // Always update the console; the old first-row check broke after one toggle.
    renderConsole(!!on);

    if (on && consoleEl) {
      autoTimer = setInterval(function () {
        var rect = consoleEl.getBoundingClientRect();

        if (
          rect.bottom < 0 ||
          rect.top > window.innerHeight
        ) {
          return;
        }

        done = done >= activeFeed().rows.length ? 1 : done + 1;
        handled++;

        renderConsole(true);
      }, 2100);
    }
  }

  if (switchEl && consoleEl) {
    switchEl.addEventListener("click", function () {
      switchTouched = true;

      setAuto(
        switchEl.getAttribute("aria-checked") !== "true"
      );
    });

    setTimeout(function () {
      if (!switchTouched) setAuto(true);
    }, 2600);
  }

  /* 6. Savings calculator. */

  var calcPeople = $("#calc-people");

  if (calcPeople) {
    var calcSalary = $("#calc-salary");
    var calcRep = $("#calc-rep");
    var calcWrap = calcPeople.closest(".grid.overflow-hidden");
    var currency = "INR";
    var defaults = { INR: 25000, AED: 6000 };

    function money(amount) {
      amount = Math.round(amount);

      return currency === "INR"
        ? "₹" + amount.toLocaleString("en-IN")
        : "AED " + amount.toLocaleString("en-AE");
    }

    function outputFor(input) {
      return input && input.parentElement
        ? input.parentElement.querySelector("output bdi")
        : null;
    }

    var currencyButtons = calcWrap
      ? $$('[role="group"] button[aria-pressed]', calcWrap)
      : [];

    function calculate() {
      if (!calcSalary || !calcRep || !calcWrap) return;

      var people = +calcPeople.value;
      var salary = +calcSalary.value;
      var share = +calcRep.value / 100;
      var hours = 176;

      var output = outputFor(calcPeople);
      if (output) output.textContent = people;

      output = outputFor(calcSalary);
      if (output) output.textContent = money(salary);

      output = outputFor(calcRep);
      if (output) output.textContent = calcRep.value + "%";

      var values = $$("bdi", calcWrap).filter(function (el) {
        return !el.closest("output");
      });

      if (values.length >= 3) {
        values[0].textContent = money(people * salary * share * 0.6);
        values[1].textContent = money(people * salary * share * 0.8);

        values[2].textContent =
          Math.round(people * hours * share * 0.6).toLocaleString("en-IN") +
          "–" +
          Math.round(people * hours * share * 0.8).toLocaleString("en-IN");
      }
    }

    [calcPeople, calcSalary, calcRep].forEach(function (input) {
      if (input) input.addEventListener("input", calculate);
    });

    currencyButtons.forEach(function (button, index) {
      button.addEventListener("click", function () {
        currency = index === 0 ? "INR" : "AED";

        currencyButtons.forEach(function (other, otherIndex) {
          var selected = otherIndex === index;

          other.setAttribute("aria-pressed", String(selected));
          other.classList.toggle("bg-dd-navy", selected);
          other.classList.toggle("text-white", selected);
          other.classList.toggle("text-dd-slate", !selected);
          other.classList.toggle("hover:text-dd-ink", !selected);
        });

        calcSalary.min = currency === "INR" ? 8000 : 2000;
        calcSalary.max = currency === "INR" ? 150000 : 30000;
        calcSalary.step = currency === "INR" ? 1000 : 250;
        calcSalary.value = defaults[currency];

        calculate();
      });
    });

    calculate();
  }


  /* PropAI FAQ accordion (answers stay in the HTML so crawlers can read them). */
  $$('button[aria-controls^="faq-"]').forEach(function (btn) {
    btn.addEventListener("click", function () {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      if (open) panel.setAttribute("hidden", ""); else panel.removeAttribute("hidden");
      var icon = btn.querySelector("svg");
      if (icon) icon.classList.toggle("rotate-45", !open);
    });
  });

  /* 7. Contact form: requirement, random CAPTCHA and direct email submission. */

  function initContactForm(form) {
    if (form.dataset.ddContactBound === "true") return true;

    var firstName = $('[name="firstName"]', form);
    var lastName = $('[name="lastName"]', form);
    var email = $('[name="email"]', form);
    var phone = $('[name="phone"]', form);
    var message = $('[name="message"]', form);
    var captchaInput = $('[name="captcha"]', form);
    var question = $('[aria-label^="What is"]', form);
    var refresh = $('button[aria-label="Get a new CAPTCHA question"]', form);
    var submitButton = $('button[type="submit"]', form);

    if (
      !firstName || !lastName || !email || !phone ||
      !message || !captchaInput || !question || !submitButton
    ) {
      console.error("[Contact Form] Required form fields are missing.");
      return false;
    }

    form.dataset.ddContactBound = "true";

    // Create the requirement dropdown if the HTML does not already contain it.
    var requirement = $('[name="requirement"]', form);

    if (!requirement) {
      var requirementWrap = document.createElement("div");

      requirementWrap.className = "mt-2 space-y-2 sm:col-span-2";

      var requirementLabel = document.createElement("label");

      requirementLabel.htmlFor = "dd-contact-requirement";
      requirementLabel.className =
        "block text-sm font-medium text-gray-700";
      requirementLabel.textContent = "What do you need? *";

      requirement = document.createElement("select");
      requirement.id = "dd-contact-requirement";
      requirement.name = "requirement";
      requirement.required = true;

      requirement.className =
        "w-full h-14 rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-base outline-none transition-all focus:border-red-500 focus:ring-2 focus:ring-red-500/20";

      [
        ["", "Select your requirement"],
        ["App Development", "App Development"],
        ["Website Development", "Website Development"],
        ["CRM", "CRM"],
        ["AI Chatbots", "AI Chatbots"]
      ].forEach(function (entry) {
        var option = document.createElement("option");

        option.value = entry[0];
        option.textContent = entry[1];

        if (!entry[0]) option.disabled = true;
                requirement.appendChild(option);
      });

      requirementWrap.appendChild(requirementLabel);
      requirementWrap.appendChild(requirement);

      var phoneWrap = phone.closest(".relative") || phone.parentElement;

      if (phoneWrap && phoneWrap.parentElement) {
        phoneWrap.insertAdjacentElement("afterend", requirementWrap);
      } else {
        form.insertBefore(requirementWrap, submitButton);
      }
    }

    // Hidden spam honeypot.
    var honeypot = $('[name="_honey"]', form);

    if (!honeypot) {
      var honeyWrap = document.createElement("div");

      honeyWrap.setAttribute("aria-hidden", "true");
      honeyWrap.style.cssText =
        "position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden";

      honeyWrap.innerHTML =
        '<label>Leave this field empty<input type="text" name="_honey" tabindex="-1" autocomplete="off"></label>';

      form.appendChild(honeyWrap);
      honeypot = $('[name="_honey"]', form);
    }

    var status = document.createElement("p");

    status.className = "hidden rounded-xl px-4 py-3 text-sm";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    form.insertBefore(status, submitButton);

    var buttonSpan = submitButton.querySelector("span");
    var labelTextNode = null;

    if (buttonSpan) {
      for (var n = 0; n < buttonSpan.childNodes.length; n++) {
        if (
          buttonSpan.childNodes[n].nodeType === 3 &&
          buttonSpan.childNodes[n].nodeValue.trim()
        ) {
          labelTextNode = buttonSpan.childNodes[n];
          break;
        }
      }
    }

    function setButtonLabel(label) {
      if (labelTextNode) {
        labelTextNode.nodeValue = label;
      } else {
        submitButton.textContent = label;
      }
    }

    setButtonLabel("Verify & Send Enquiry");

    // Generate a new CAPTCHA on page load, refresh, and submission attempts.
    var answer = null;
    var previousQuestion = "";

    function makeQuestion() {
      var a, b, pair;

      do {
        a = Math.floor(Math.random() * 8) + 2;
        b = Math.floor(Math.random() * 8) + 2;
        pair = a + "+" + b;
      } while (pair === previousQuestion);

      previousQuestion = pair;
      answer = a + b;

      var display = question.querySelector("span") || question;

      display.textContent = a + " + " + b + " =";

      question.setAttribute(
        "aria-label",
        "What is " + a + " plus " + b + "?"
      );

      captchaInput.value = "";
      captchaInput.setAttribute("aria-invalid", "false");
    }

    function showStatus(text, success) {
      status.className = success
        ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        : "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700";

      status.textContent = text;
    }

    function clearStatus() {
      status.className = "hidden rounded-xl px-4 py-3 text-sm";
      status.textContent = "";
    }

    makeQuestion();

    if (refresh) {
      refresh.addEventListener("click", function (event) {
        event.preventDefault();

        makeQuestion();
        clearStatus();
      });
    }

    var counter = message.parentElement
      ? message.parentElement.querySelector(".text-right.text-xs")
      : null;

    message.setAttribute("maxlength", "500");

    function updateCounter() {
      if (counter) {
        counter.textContent = message.value.length + " / 500";
      }
    }

    message.addEventListener("input", updateCounter);
    updateCounter();

    $$("p", form).forEach(function (p) {
      if (/email composer|press send there/i.test(p.textContent)) {
        p.textContent =
          "Fill in your details and send your enquiry directly to our team.";
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();

      clearStatus();

      if (honeypot && honeypot.value.trim()) return;

      var fields = [
        firstName,
        lastName,
        email,
        phone,
        requirement,
        message
      ];

      var firstInvalid = null;

      fields.forEach(function (field) {
        if (!String(field.value || "").trim()) {
          field.setAttribute("aria-invalid", "true");

          if (!firstInvalid) firstInvalid = field;
        } else {
          field.removeAttribute("aria-invalid");
        }
      });

      if (firstInvalid) {
        showStatus("Please complete all required fields.", false);
        firstInvalid.focus();
        return;
      }

      var mail = email.value.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
        showStatus("Please enter a valid email address.", false);
        email.focus();
        email.setAttribute("aria-invalid", "true");
        return;
      }

      var tel = phone.value.trim();

      if (tel.replace(/\D/g, "").length < 7) {
        showStatus("Please enter a valid phone number.", false);
        phone.focus();
        phone.setAttribute("aria-invalid", "true");
        return;
      }

      if (
        !/^\d+$/.test(captchaInput.value.trim()) ||
        Number(captchaInput.value.trim()) !== answer
      ) {
        showStatus(
          "Incorrect CAPTCHA. A new question has been generated.",
          false
        );

        makeQuestion();
        captchaInput.focus();
        return;
      }

      var consentState = window.ddConsentCheck ? window.ddConsentCheck(form) : { ok: true };

      if (!consentState.ok) {
        showStatus(consentState.message, false);
        if (consentState.focus) consentState.focus();
        return;
      }

      var first = firstName.value.trim();
      var last = lastName.value.trim();
      var service = requirement.value;
      var body = message.value.trim();

      var subject =
        "New " + service + " enquiry from " + first + " " + last;

      var emailBody = [
        "New contact enquiry - Deific Digital",
        "",
        "Name: " + first + " " + last,
        "Email: " + mail,
        "Phone: " + tel,
        "Requirement: " + service,
        "",
        "Message:",
        body,
        "",
        "Page: " + location.href
      ].join("\n");

      var payload = {
        name: first + " " + last,
        firstName: first,
        lastName: last,
        email: mail,
        _replyto: mail,
        phone: tel,
        requirement: service,
        message: body,
        _subject: subject,
        _template: "table",
        _captcha: "false",
        _honey: "",
        page: location.href,
        emailBody: emailBody
      };

      if (consentState.data) {
        Object.assign(payload, consentState.data);
        payload.emailBody += "\n\nConsent to process data: " + consentState.data.consent +
          " (" + consentState.data.consentAt + ")\nWhatsApp opt-in: " + consentState.data.whatsappOptIn;
      }

      submitButton.disabled = true;
      setButtonLabel("Sending...");
      showStatus("Sending your enquiry...", true);

      // Submit to the same-origin backend. Brevo credentials stay server-side.
      fetch(CONFIG.LEAD_ENDPOINT || "/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ fields: payload, page: location.href, submittedAt: new Date().toISOString() })
      }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          if (!response.ok || !data || data.success === false) {
            throw new Error((data && data.message) || "Email could not be sent. Please try again.");
          }
          return data;
        });
      }).then(function () {
        try {
          if (window.ddTrack) window.ddTrack("generate_lead", { requirement: service });
        } catch (error) {}

        showStatus("Submitted successfully! Your enquiry has been sent to our team. We will contact you shortly.", true);
        form.reset();
        makeQuestion();
        updateCounter();
        fields.forEach(function (field) { field.removeAttribute("aria-invalid"); });
      }).catch(function (error) {
        console.error("[Contact Form] Backend submission failed:", error);
        showStatus("We couldn't submit your enquiry right now. Please try again in a moment.", false);
      }).finally(function () {
        submitButton.disabled = false;
        setButtonLabel("Verify & Send Enquiry");
      });
    });

    return true;
  }

  /* 8. Lead forms submit to the same-origin backend; success is shown only after email API accepts it. */

  function labelFor(field) {
    var label = field.id
      ? document.querySelector('label[for="' + field.id + '"]')
      : null;

    return (
      label
        ? origText(label)
        : origAttr(field, "aria-label") ||
          origAttr(field, "placeholder") ||
          field.name ||
          field.id ||
          ""
    ).trim().replace(/\s*\*\s*$/, "");
  }

  $$("form").forEach(function (form) {
    if ($('[name="captcha"]', form)) {
      initContactForm(form);
      return;
    }

    if (form.closest("#live-demo")) return;

    form.noValidate = true;
    if (form.dataset.ddLeadBound === "true") return;
    form.dataset.ddLeadBound = "true";

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var lead = {};
      var invalid = false;
      var fields = $$("input,select,textarea", form);
      fields.forEach(function (field) {
        if (
          field.type === "hidden" || field.type === "submit" ||
          field.type === "button" || (field.type === "checkbox" && !field.checked) ||
          field.hasAttribute("data-dd-consent")
        ) return;

        var value = (field.value || "").trim();
        var key = labelFor(field) || field.name || field.id || "Field";
        if (field.required && !value) {
          invalid = true;
          field.setAttribute("aria-invalid", "true");
          return;
        }
        if (field.type === "tel" && value && value.replace(/\D/g, "").length < 7) {
          invalid = true;
          field.setAttribute("aria-invalid", "true");
          return;
        }
        field.removeAttribute("aria-invalid");
        if (value) {
          lead[key] = value;
          var normalizedKey = String(key).toLowerCase();
          if (field.type === "email" || /email/.test(normalizedKey)) lead.email = lead.email || value;
          if (field.type === "tel" || /phone|whatsapp|mobile|telephone/.test(normalizedKey)) lead.phone = lead.phone || value;
          if (/full name|your name|first name|name$/.test(normalizedKey)) lead.name = lead.name || value;
          if (/requirement|service|what do you need|product|business type/.test(normalizedKey)) lead.requirement = lead.requirement || value;
          if (/message|details|describe|would you like to|project brief/.test(normalizedKey)) lead.message = lead.message || value;
        }
      });

      if (invalid) {
        var firstInvalid = $('[aria-invalid="true"]', form);
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var consentState = window.ddConsentCheck ? window.ddConsentCheck(form) : { ok: true };
      if (!consentState.ok) {
        var consentStatus = $('[data-dd-lead-status]', form);
        if (!consentStatus) {
          consentStatus = document.createElement("p");
          consentStatus.setAttribute("data-dd-lead-status", "");
          consentStatus.setAttribute("role", "status");
          consentStatus.setAttribute("aria-live", "polite");
          form.appendChild(consentStatus);
        }
        consentStatus.className = "mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200";
        consentStatus.textContent = consentState.message;
        if (consentState.focus) consentState.focus();
        return;
      }
      if (consentState.data) Object.assign(lead, consentState.data);

      var submitButton = $('button[type="submit"],input[type="submit"]', form);
      var originalButtonText = submitButton ? (submitButton.textContent || submitButton.value || "Submit") : "";
      var status = $('[data-dd-lead-status]', form);
      if (!status) {
        status = document.createElement("p");
        status.setAttribute("data-dd-lead-status", "");
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        status.className = "mt-3 rounded-xl px-4 py-3 text-sm";
        form.appendChild(status);
      }
      status.className = "mt-3 rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-700";
      status.textContent = "Sending your details...";
      if (submitButton) {
        submitButton.disabled = true;
        if (submitButton.tagName === "INPUT") submitButton.value = "Sending...";
        else submitButton.textContent = "Sending...";
      }

      fetch(CONFIG.LEAD_ENDPOINT || "/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ fields: lead, page: location.href, submittedAt: new Date().toISOString() })
      }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          if (!response.ok || !data || data.success === false) {
            throw new Error((data && data.message) || "Submission failed");
          }
          return data;
        });
      }).then(function () {
        try { if (window.ddTrack) window.ddTrack("generate_lead", {}); } catch (error) {}
        var notice = document.createElement("p");
        notice.className = "rounded-xl bg-emerald-50 px-4 py-4 text-[15px] font-medium text-emerald-800 ring-1 ring-emerald-200";
        notice.setAttribute("role", "status");
        notice.setAttribute("aria-live", "polite");
        notice.textContent = "Submitted successfully! We have received your details and will contact you shortly.";
        form.replaceWith(notice);
      }).catch(function (error) {
        console.error("[Lead Form] Backend submission failed:", error);
        status.className = "mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200";
        status.textContent = "We couldn't submit your details right now. Please try again in a moment.";
      }).finally(function () {
        if (submitButton && submitButton.isConnected) {
          submitButton.disabled = false;
          if (submitButton.tagName === "INPUT") submitButton.value = originalButtonText;
          else submitButton.textContent = originalButtonText;
        }
      });
    });
  });

    /* 9. Product live-demo playground. */

  var PRODUCTS = {
    "ai-receptionist": {
      title: "AI Receptionist",
      category: "Healthcare",
      greeting: "Hi! 👋 Welcome to the Deific clinic assistant. I can help with appointment requests, clinic timings and routing a request to the right team. What do you need today?",
      placeholder: "Ask about appointments or clinic timings...",
      prompts: [
        "Book an appointment",
        "What are your clinic hours?",
        "Can I speak to a person?"
      ],
      quote: "Hi Deific Digital, I'm interested in the AI Receptionist. Please share setup options and a tailored quote."
    },

    "prop-ai": {
      title: "PropAI",
      category: "Real estate",
      greeting: "Hello! 👋 Welcome to the PropAI property assistant. Tell me your preferred location, budget and property type, and I can show you a sample property enquiry flow.",
      placeholder: "Ask about properties, pricing or site visits...",
      prompts: [
        "Show me available properties",
        "Can I book a site visit?",
        "What is the price range?"
      ],
      quote: "Hi Deific Digital, I'm interested in PropAI. Please share setup options and a tailored quote."
    },

    "ai-sales-agent": {
      title: "AI Sales Agent",
      category: "Sales",
      greeting: "Hey there! 👋 I'm the Deific sample sales agent. I can demonstrate lead qualification, answer product questions and help a prospect request a sales call. What would you like to try?",
      placeholder: "Ask about lead qualification or sales...",
      prompts: [
        "Can you qualify a new lead?",
        "How does pricing work?",
        "Can I book a sales demo?"
      ],
      quote: "Hi Deific Digital, I'm interested in the AI Sales Agent. Please share setup options and a tailored quote."
    },

    "ai-customer-support": {
      title: "AI Customer Support",
      category: "Support",
      greeting: "Hi! 👋 Welcome to the Deific sample support bot. Ask me about delivery, returns, services or support handover to see a sample customer conversation.",
      placeholder: "Ask about delivery, returns or support...",
      prompts: [
        "What can you do?",
        "How does pricing work?",
        "How do returns work?"
      ],
      quote: "Hi Deific Digital, I'm interested in AI Customer Support. Please share setup options and a tailored quote."
    }
  };

  PRODUCTS["review-ninja"] = {
    title: "AI Review Ninja Pro",
    category: "Reputation",
    greeting: "Hi! 👋 I'm the sample Review Ninja Pro assistant. I can show how review requests, replies and reputation tracking work for your Google Business Profile.",
    placeholder: "Ask about reviews, ratings or replies...",
    prompts: [
      "How do you collect reviews?",
      "Can you reply to bad reviews?",
      "How does pricing work?"
    ],
    quote: "Hi Deific Digital, I'm interested in AI Review Ninja Pro. Please share setup options and a tailored quote."
  };

  PRODUCTS["monica-ai"] = {
    title: "Monica AI",
    category: "WhatsApp support",
    greeting: "Hello! 👋 I'm the sample Monica AI WhatsApp bot. Ask me about order status, FAQs or lead capture to see a sample customer conversation.",
    placeholder: "Ask about orders, FAQs or follow-ups...",
    prompts: [
      "Where is my order?",
      "Can you capture leads?",
      "Can I talk to a person?"
    ],
    quote: "Hi Deific Digital, I'm interested in Monica AI (WhatsApp bot). Please share setup options and a tailored quote."
  };

  PRODUCTS["ca-automation"] = {
    title: "CA Automation",
    category: "CA firms",
    greeting: "Hi! 👋 I'm the sample CA Automation assistant. I can demonstrate GST deadline reminders, document collection and client follow-ups for a CA firm.",
    placeholder: "Ask about GST, documents or reminders...",
    prompts: [
      "Remind clients about GST filing",
      "Collect documents from clients",
      "How does invoice matching work?"
    ],
    quote: "Hi Deific Digital, I'm interested in CA Automation. Please share setup options and a tailored quote."
  };

  PRODUCTS["medi-assist"] = {
    title: "Medi Assist",
    category: "Healthcare",
    greeting: "Hi! 👋 I'm the sample Medi Assist bot for clinics and hospitals. I can show appointment booking, reminders and patient queries on WhatsApp.",
    placeholder: "Ask about appointments or reminders...",
    prompts: [
      "Book an appointment",
      "Send me a reminder",
      "What are the clinic timings?"
    ],
    quote: "Hi Deific Digital, I'm interested in Medi Assist. Please share setup options and a tailored quote."
  };

  var DEFAULT_PRODUCT = "ai-customer-support";

  function slugFromText(value) {
    var text = String(value || "").toLowerCase();

    if (
      text.indexOf("ai receptionist") >= 0 ||
      text.indexOf("موظف الاستقبال") >= 0
    ) return "ai-receptionist";

    if (
      text.indexOf("prop ai") >= 0 ||
      text.indexOf("propai") >= 0 ||
      text.indexOf("وكيل العقارات") >= 0
    ) return "prop-ai";

    if (
      text.indexOf("ai sales agent") >= 0 ||
      text.indexOf("وكيل المبيعات") >= 0
    ) return "ai-sales-agent";

    if (
      text.indexOf("ai customer support") >= 0 ||
      text.indexOf("دعم العملاء") >= 0
    ) return "ai-customer-support";

    if (text.indexOf("review ninja") >= 0) return "review-ninja";
    if (text.indexOf("monica ai") >= 0) return "monica-ai";
    if (text.indexOf("ca automation") >= 0) return "ca-automation";
    if (text.indexOf("medi assist") >= 0) return "medi-assist";

    return null;
  }

  function productFromPath() {
    var match = location.pathname.toLowerCase().match(
      /\/products\/(prop-ai|ai-sales-agent|ai-receptionist|ai-customer-support)(?:\/|$)/
    );

    return match ? match[1] : null;
  }

  function getProductFromCard(link) {
    var current = productFromPath();

    if (current) return current;

    var node = link;
    var levels = 0;

    while (node && node !== document.body && levels < 8) {
      var detailLink = node.querySelector && node.querySelector(
        'a[href*="/products/ai-receptionist/"],' +
        'a[href*="/products/prop-ai/"],' +
        'a[href*="/products/ai-sales-agent/"],' +
        'a[href*="/products/ai-customer-support/"]'
      );

      if (detailLink) {
        var href = detailLink.getAttribute("href") || "";
        var match = href.match(
          /\/products\/(prop-ai|ai-sales-agent|ai-receptionist|ai-customer-support)\//i
        );

        if (match) return match[1].toLowerCase();
      }

      var found = slugFromText(node.textContent);
            if (found && node.textContent.length < 1800) return found;

      node = node.parentElement;
      levels++;
    }

    return productFromPath();
  }

  function updateLiveDemoLinks() {
    $$("a[href]").forEach(function (link) {
      if (link.hasAttribute("data-demo-fixed")) return;

      var raw = link.getAttribute("href") || "";

      if (
        !raw ||
        /^(?:mailto:|tel:|https?:|\/\/|#)/i.test(raw)
      ) return;

      var url;

      try {
        url = new URL(raw, location.href);
      } catch (error) {
        return;
      }

      if (!/\/products\/index\.html$/i.test(url.pathname)) return;

      if (
        url.hash &&
        url.hash !== "#live-demo" &&
        !/live-demo/i.test(url.hash)
      ) return;

      var label = (
        link.textContent ||
        link.getAttribute("aria-label") ||
        ""
      ).toLowerCase();

      var isDemo =
        /live.?demo|try (?:it|the demo)|test drive|chatbot before you buy/.test(label) ||
        /live-demo/i.test(url.hash);

      if (!isDemo) return;

      var slug = getProductFromCard(link) || productFromPath();

      if (!slug || !PRODUCTS[slug]) return;

      url.searchParams.set("demo", slug);
      url.hash = "live-demo";

      link.setAttribute(
        "href",
        url.pathname + url.search + url.hash
      );
    });
  }

  function sampleProductReply(productId, message) {
    var text = String(message || "").toLowerCase();

    if (/\b(human|person|representative|talk to someone|call me|speak to someone|escalat)\b/.test(text)) {
      if (productId === "ai-receptionist") {
        return "Of course. In a real setup, I would route this request to the clinic reception team. This sample has not contacted the clinic.";
      }

      if (productId === "prop-ai") {
        return "I can pass your request to a property advisor. In the live setup, your enquiry would be routed to the assigned sales team.";
      }

      if (productId === "ai-sales-agent") {
        return "I can hand this prospect over to a sales representative and include the conversation summary. This sample has not contacted a real team member.";
      }

      return "I can route this conversation to a support agent and share a short summary. This sample has not created a real support ticket.";
    }

    if (productId === "ai-receptionist") {
      if (/emergency|urgent|severe|chest pain|breathless|can't breathe/.test(text)) {
        return "If this is a medical emergency, contact your local emergency service immediately. This demo cannot assess symptoms or provide medical advice.";
      }

      if (/appointment|book|slot|doctor|consultation|schedule/.test(text)) {
        return "Certainly. A live receptionist flow can collect your preferred department, date and time, then check connected appointment availability. This sample has not booked a real appointment.";
      }

      if (/hour|timing|open|clinic|location|address/.test(text)) {
        return "The receptionist can share clinic hours, directions and department information from details approved by your clinic. Please confirm actual timings with the clinic.";
      }

      if (/price|fee|cost|charge/.test(text)) {
        return "Consultation fees depend on the doctor and service. In a real deployment, the assistant can share your clinic's approved fee list or route a question to reception.";
      }

      return "I can help with appointment requests, clinic information and routing a patient to reception. What department or service are you looking for?";
    }

    if (productId === "prop-ai") {
      if (/site visit|visit|appointment|book|schedule/.test(text)) {
        return "I can collect your preferred date and time for a site visit, then pass the request to the property team. Real slots require a connected booking system.";
      }

      if (/price|cost|budget|emi|payment|rate/.test(text)) {
        return "Share your approximate budget and preferred configuration, and PropAI can present matching options. Prices and financing details should come from verified property data.";
      }

      if (/location|where|near|area|address/.test(text)) {
        return "Which area or neighbourhood are you interested in? The property assistant can match listings by location and share verified map or address details.";
      }

      if (/bedroom|\bbhk\b|property|flat|villa|listing|available/.test(text)) {
        return "I can narrow down property options by location, budget and configuration. Tell me your preferred area, budget range and whether you want a flat, villa or plot.";
      }

      return "I can help match a property enquiry, answer listing questions and collect site-visit requests. Which city or budget range should I use for your search?";
    }

    if (productId === "ai-sales-agent") {
      if (/lead|qualif|prospect|customer/.test(text)) {
        return "Yes. A sales-agent flow can ask qualifying questions such as the prospect's goal, budget, timeline and preferred contact method, then pass a lead summary to your CRM.";
      }

      if (/price|pricing|cost|plan|quote/.test(text)) {
        return "Pricing usually depends on channels, CRM integrations, qualification steps and monthly conversation volume. The live agent can capture your requirements for a tailored quote.";
      }

      if (/demo|meeting|call|schedule/.test(text)) {
        return "I can collect your preferred day, time and contact method for a sales demo. A live setup can check your team's calendar and send the request for confirmation.";
      }

      if (/follow|whatsapp|email|crm/.test(text)) {
        return "A configured sales agent can send approved follow-ups, update your CRM and remind the team about promising leads. These actions require real integrations and permissions.";
      }

      return "I can demonstrate lead qualification, answer common sales questions and capture a request for follow-up. What product or service are you selling?";
    }

    if (productId === "review-ninja") {
      if (/collect|request|ask|get more|invite/.test(text)) {
        return "After a service is completed, Review Ninja Pro can send a review request on WhatsApp or SMS with a direct Google review link. Timing and wording are configured for your business.";
      }

      if (/reply|respond|bad|negative|complain/.test(text)) {
        return "It can draft polite replies to every review for your approval, and flag low ratings so your team can follow up quickly. This sample has not posted anything.";
      }

      if (/price|pricing|cost|plan/.test(text)) {
        return "Pricing depends on the number of locations and review channels. Share your business type and locations to scope a plan.";
      }

      if (/rank|google|rating|profile|seo/.test(text)) {
        return "A steady flow of genuine reviews and fast replies helps your Google Business Profile look active and trustworthy. Rankings are never guaranteed.";
      }

      return "I can demonstrate review collection, reply drafting and reputation tracking. Which platform matters most to you: Google, Facebook or WhatsApp?";
    }

    if (productId === "monica-ai") {
      if (/order|track|status|deliver/.test(text)) {
        return "In a real setup, Monica AI checks your connected order system and replies with the live status. This sample does not access real orders.";
      }

      if (/lead|capture|enquiry|inquiry|sales/.test(text)) {
        return "Monica AI can ask a few qualifying questions, save the lead to your CRM and notify your team. This sample has not stored any data.";
      }

      if (/price|pricing|cost|plan/.test(text)) {
        return "Pricing depends on your monthly conversation volume, channels and integrations. Share your main use case to scope an option.";
      }

      return "I can answer common customer questions on WhatsApp, capture leads and follow up automatically, 24/7. What would you like to try?";
    }

    if (productId === "ca-automation") {
      if (/gst|gstr|filing|deadline|return|remind/.test(text)) {
        return "The workflow tracks due dates for GSTR-1 and GSTR-3B and sends each client a reminder before the deadline. Dates here are examples, so confirm actual due dates on the GST portal.";
      }

      if (/document|upload|collect|received|paper/.test(text)) {
        return "Clients get a WhatsApp request listing the documents you need. Received files are tracked per client, and pending ones are chased automatically.";
      }

      if (/invoice|match|reconcil|2a|2b/.test(text)) {
        return "Invoice matching compares purchase records with GST data and highlights mismatches for your team to review. Final filing decisions stay with the CA.";
      }

      if (/price|pricing|cost|plan/.test(text)) {
        return "Pricing depends on the number of clients and the workflows you want automated. Share your client count to scope a plan.";
      }

      return "I can demonstrate GST reminders, document collection and client follow-ups for a CA firm. Which one should I show?";
    }

    if (productId === "medi-assist") {
      if (/emergency|urgent|severe|chest pain|breathless|can't breathe/.test(text)) {
        return "If this is a medical emergency, contact your local emergency service immediately. This demo cannot assess symptoms or provide medical advice.";
      }

      if (/appointment|book|slot|doctor|consultation|schedule/.test(text)) {
        return "A live flow collects your department, doctor and preferred time, then checks connected availability. This sample has not booked a real appointment.";
      }

      if (/remind|follow|medicine|reschedule/.test(text)) {
        return "Medi Assist sends appointment reminders and follow-up messages on WhatsApp, and lets patients reschedule in one tap. This sample has not sent any message.";
      }

      if (/hour|timing|open|clinic|location|address/.test(text)) {
        return "It can share clinic hours, directions and department details from information your clinic approves. Please confirm actual timings with the clinic.";
      }

      return "I can help with appointment booking, reminders and common patient questions. What would you like to try?";
    }

    if (/deliver|shipping|track|order/.test(text)) {
      return "I can help with a delivery enquiry. In a real deployment, the bot would retrieve order status from your connected order system. This demo does not access real orders.";
    }

    if (/return|refund|exchange/.test(text)) {
      return "I can explain your published return policy and collect the details needed by support. Actual eligibility and refunds must be checked in your order system.";
    }

    if (/price|pricing|cost|plan/.test(text)) {
      return "Setup depends on your channels, knowledge base, handover rules and integrations. Share your main support channel and approximate monthly query volume to scope an option.";
    }

    if (/service|what can|help|support/.test(text)) {
      return "I can answer common questions, guide customers through next steps and hand complex cases to a human agent. The answers can be configured around your approved business knowledge base.";
    }

    return "Thanks for your question. I can help with common FAQs, order or service questions, and routing a complex case to your team. Could you share a little more detail?";
  }

  function initProductDemo() {
    var section = $("#live-demo");

    if (!section) return;

    var shell = section.querySelector(".grid.overflow-hidden");

    if (!shell || shell.children.length < 2) return;

    var aside = shell.children[0];
    var chatPanel = shell.children[1];

    var selectorWrap = aside.querySelector(".mt-4.space-y-2");
    var selectorButtons = selectorWrap ? $$("button", selectorWrap) : [];
    var title = $("h3", chatPanel);
    var feed = $('[aria-live="polite"]', chatPanel);
    var form = $("form", chatPanel);
    var input = form ? $("input", form) : null;

    var resetButton = $(
      'button[aria-label="Reset sample conversation"]',
      chatPanel
    );

    var quoteLink = $('a[href*="wa.me"]', aside);

    var promptLabel = $$("p", chatPanel).filter(function (p) {
      return p.textContent.trim().toLowerCase() === "try asking";
    })[0];

    var promptWrap = promptLabel
      ? promptLabel.nextElementSibling
      : null;

    var promptButtons = promptWrap ? $$("button", promptWrap) : [];

    if (!title || !feed || !form || !input) return;

    var conversationLabel = feed.querySelector(".text-center");
    var activeProduct = DEFAULT_PRODUCT;

    function addMessage(kind, text) {
      var row = document.createElement("div");

      row.className = kind === "user"
        ? "flex justify-end dd-demo-message"
        : "flex justify-start dd-demo-message";

      var bubble = document.createElement("div");

      bubble.className = kind === "user"
        ? "max-w-[88%] whitespace-pre-line rounded-2xl rounded-br-sm border border-dd-red/20 bg-red-50 px-4 py-3 text-sm leading-6 text-dd-ink shadow-sm"
        : "max-w-[88%] whitespace-pre-line rounded-2xl rounded-bl-sm border border-dd-line bg-white px-4 py-3 text-sm leading-6 text-dd-ink shadow-sm";

      bubble.textContent = text;

      row.appendChild(bubble);
      feed.appendChild(row);

      feed.scrollTop = feed.scrollHeight;
    }

    function resetConversation() {
      Array.prototype.slice.call(feed.children).forEach(function (child) {
        if (child !== conversationLabel) child.remove();
      });

      if (conversationLabel) {
        conversationLabel.textContent =
          "Sample conversation · " +
          PRODUCTS[activeProduct].category +
          " · no real actions";
      }

      addMessage("bot", PRODUCTS[activeProduct].greeting);
      input.value = "";
    }

    function updateSelectedButton(slug) {
      selectorButtons.forEach(function (button) {
        var selected = slugFromText(origText(button)) === slug;

        button.setAttribute("aria-pressed", String(selected));
        button.classList.toggle("border-dd-red/50", selected);
        button.classList.toggle("bg-white", selected);
        button.classList.toggle("shadow-sm", selected);
        button.classList.toggle("border-transparent", !selected);
        button.classList.toggle("bg-transparent", !selected);

        var iconBox = button.querySelector("span.grid");

        if (iconBox) {
          iconBox.classList.toggle("bg-red-50", selected);
          iconBox.classList.toggle("text-dd-red", selected);
          iconBox.classList.toggle("bg-white", !selected);
          iconBox.classList.toggle("text-dd-slate", !selected);
        }

        $$('[data-demo-active-dot]', button).forEach(function (dot) {
          dot.remove();
        });

        if (selected) {
          var dot = document.createElement("span");

          dot.className = "h-2 w-2 rounded-full bg-dd-red";
          dot.setAttribute("data-demo-active-dot", "true");

          button.appendChild(dot);
        }
      });
    }

    function setProduct(slug, updateURL) {
      if (!PRODUCTS[slug]) slug = DEFAULT_PRODUCT;

      activeProduct = slug;

      var product = PRODUCTS[slug];

      title.textContent = product.title;
      input.placeholder = product.placeholder;

      promptButtons.forEach(function (button, index) {
        if (product.prompts[index]) {
          button.textContent = product.prompts[index];
        }
      });

      if (quoteLink) {
        try {
          var quoteURL = new URL(quoteLink.href, location.href);

          quoteURL.searchParams.set("text", product.quote);
          quoteLink.href = quoteURL.href;
        } catch (error) {}
      }

      updateSelectedButton(slug);
      resetConversation();

      if (updateURL && history.replaceState) {
                var pageURL = new URL(location.href);

        pageURL.searchParams.set("demo", slug);
        pageURL.hash = "live-demo";

        history.replaceState(
          null,
          "",
          pageURL.pathname + pageURL.search + pageURL.hash
        );
      }
    }

    function sendMessage(message) {
      var clean = String(message || "").trim();

      if (!clean) return;

      addMessage("user", clean);
      input.value = "";

      addMessage(
        "bot",
        sampleProductReply(activeProduct, clean)
      );
    }

    selectorButtons.forEach(function (button) {
      var slug = slugFromText(button.textContent);

      if (!slug) return;

      button.addEventListener("click", function (event) {
        event.preventDefault();
        setProduct(slug, true);
      });
    });

    promptButtons.forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        sendMessage(origText(button).trim());
        input.focus();
      });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      sendMessage(input.value);
    }, true);

    if (resetButton) {
      resetButton.addEventListener("click", function (event) {
        event.preventDefault();
        resetConversation();
      });
    }

    var params = new URLSearchParams(location.search);
    var requested = params.get("demo");

    if (!PRODUCTS[requested]) {
      requested = productFromPath() || DEFAULT_PRODUCT;
    }

    setProduct(requested, false);

    window.addEventListener("popstate", function () {
      var next = new URLSearchParams(location.search).get("demo");

      if (!PRODUCTS[next]) {
        next = productFromPath() || DEFAULT_PRODUCT;
      }

      setProduct(next, false);
    });
  }

  updateLiveDemoLinks();
  initProductDemo();

  /* 10. UAE English/Arabic switcher. */

  $$('[aria-label="Language"] button[lang]').forEach(function (button) {
    button.addEventListener("click", function () {
      var toArabic = button.getAttribute("lang").toLowerCase() === "ar";
      var currentArabic = isArabic();

      if (toArabic === currentArabic) return;

      try { localStorage.setItem("dd_lang", toArabic ? "ar" : "en"); } catch (e) {}

      location.href =
        (toArabic ? uaeBase() + "/ar" : uaeBase()) +
        location.hash;
    });
  });

  /* 11. Contact/careers scroll reveal. */

  var revealItems = $$(".animate-on-scroll");

  if (revealItems.length) {
    var showReveal = function (el) {
      el.classList.add("animate-fade-in-up");
    };

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            showReveal(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05 });

      revealItems.forEach(function (el) {
        observer.observe(el);
      });

      setTimeout(function () {
        revealItems.forEach(showReveal);
      }, 2500);
    } else {
      revealItems.forEach(showReveal);
    }
  }

  /* 12. AI voice assistant — vanilla JavaScript port of the React ChatWidget.
     The launcher/panel HTML already exists on every page. This block wires it
     to the Render backend and uses /web/turn (recorded audio) first, then falls
     back to /web/stt + /web/chat and browser speech synthesis when necessary.
  */
  var voiceFab = document.getElementById("sd-chat-fab");
  var voiceBox = document.getElementById("sd-chat-container");

  if (voiceFab && voiceBox && !voiceFab.dataset.ddVoiceBound) {
    voiceFab.dataset.ddVoiceBound = "true";

    var VOICE_API = String(CONFIG.AI_BACKEND_URL || "https://chatbot-qpnn.onrender.com").replace(/\/+$/, "");
    var SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    var voiceStatus = voiceBox.querySelector(".sd-voice-status");
    var voiceTitle = voiceBox.querySelector(".sd-voice-assistant-title");
    var voiceMic = voiceBox.querySelector(".sd-mic-circle-outline");
    var voiceClose = voiceBox.querySelector(".sd-voice-x");
    var voiceCanvas = document.getElementById("sd-wave-canvas");
    var voiceIsArabic = typeof isArabic === "function" ? isArabic() : /^ar(?:-|$)/i.test(document.documentElement.lang || "");

    var VT = voiceIsArabic ? {
      connecting: "جارٍ الاتصال بالمساعد…", listening: "أستمع إليك…", thinking: "لحظة…",
      speaking: "أتحدث…", muted: "الميكروفون مكتوم", mute: "اضغط لكتم الصوت",
      unmute: "اضغط لتشغيل الميكروفون", error: "تعذر الاتصال بالمساعد. تحقق من الخادم وحاول مجددًا.",
      browser: "يرجى استخدام Chrome أو Edge مع دعم التعرف على الكلام.",
      mic: "يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح."
    } : {
      connecting: "Connecting…", listening: "Speak naturally", thinking: "Thinking…",
      speaking: "Speaking…", muted: "Muted — tap mic to resume", mute: "Tap to mute",
      unmute: "Tap to resume", error: "Voice assistant request failed. Check the backend and retry.",
      browser: "Speech recognition is not supported here. Please use Chrome or Edge.",
      mic: "Please allow microphone access in your browser settings."
    };

    var V = {
      open: false, continuous: false, muted: false, busy: false, speaking: false,
      listening: false, phase: "ended", volume: 0, sessionId: "", recognition: null,
      stream: null, audioContext: null, analyser: null, recorder: null, chunks: [],
      vadTimer: null, silenceTimer: null, speechTimer: null, watchdog: null,
      speechText: "", speechDetected: false, processing: false, recording: false,
      discardNextRecording: false, audio: null, ttsController: null, raf: 0,
      waveTime: 0, recognitionFinalHandled: false
    };

    function newVoiceSessionId() {
      try {
        var existing = sessionStorage.getItem("dg_session_id");
        if (existing) return existing;
        var id = window.crypto && typeof window.crypto.randomUUID === "function"
          ? window.crypto.randomUUID()
          : "dd-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 14);
        sessionStorage.setItem("dg_session_id", id);
        return id;
      } catch (error) {
        return "dd-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 14);
      }
    }

    V.sessionId = newVoiceSessionId();

    function voiceSessionFields() {
      return { sessionId: V.sessionId, session_id: V.sessionId };
    }

    if (voiceTitle) voiceTitle.textContent = VT.mute;
    if (voiceStatus) voiceStatus.textContent = VT.connecting;
    var voiceSub = voiceBox.querySelector(".sd-voice-assistant-sub");
    if (voiceSub) voiceSub.textContent = voiceIsArabic ? "مساعد صوتي" : "voice assistant";
    if (voiceMic) voiceMic.title = VT.mute;
    voiceFab.addEventListener("click", function () { voiceBox.removeAttribute("aria-hidden"); }, true);

    function voiceSetPhase(phase, customText) {
      V.phase = phase;
      V.speaking = phase === "speaking";
      V.listening = phase === "listening";
      if (voiceStatus) {
        var shown = V.muted ? "muted" : phase;
        voiceStatus.className = "sd-voice-status " + shown;
        voiceStatus.textContent = customText || (V.muted ? VT.muted : (VT[phase] || VT.connecting));
      }
      if (voiceMic) {
        var micState = V.muted ? "muted" : (phase === "ended" ? "" : phase);
        voiceMic.className = "sd-mic-circle-outline " + micState;
        voiceMic.title = V.muted ? VT.unmute : VT.mute;
      }
      if (voiceTitle) voiceTitle.textContent = V.muted ? VT.unmute : VT.mute;
    }

    function voiceReadSession(data) {
      if (!data || typeof data !== "object") return;
      var id = data.sessionId || data.session_id || data.conversationId || data.conversation_id || data.call_id;
      if (id) {
        V.sessionId = String(id);
        try { sessionStorage.setItem("dg_session_id", V.sessionId); } catch (error) {}
      }
    }

    function voicePostJson(path, payload, signal) {
      return fetch(VOICE_API + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {}),
        signal: signal
      }).then(function (response) {
        if (response.ok) return response;
        return response.clone().text().then(function (raw) {
          var detail = raw || response.statusText || "Request failed";
          try {
            var data = JSON.parse(raw);
            detail = data.detail || data.message || data.error || JSON.stringify(data);
          } catch (error) {}
          throw new Error("HTTP " + response.status + ": " + String(detail).slice(0, 240));
        });
      });
    }

    /* Sine-wave canvas visualizer, with color responding to assistant state. */
    function drawVoiceWave() {
      if (!V.open || !voiceCanvas) return;
      var ctx = voiceCanvas.getContext("2d");
      if (!ctx) return;
      var dpr = window.devicePixelRatio || 1;
      var rect = voiceCanvas.getBoundingClientRect();
      var width = Math.max(1, Math.floor(rect.width));
      var height = Math.max(1, Math.floor(rect.height));
      if (voiceCanvas.width !== Math.floor(width * dpr) || voiceCanvas.height !== Math.floor(height * dpr)) {
        voiceCanvas.width = Math.floor(width * dpr);
        voiceCanvas.height = Math.floor(height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "screen";

      var state = V.muted || V.phase === "ended" ? "idle" : V.phase;
      var palettes = [
        { f: .014, a: 24, p: 0, s: .075, c: { connecting: "rgba(251,191,36,.18)", listening: "rgba(52,211,153,.22)", speaking: "rgba(244,63,94,.22)", thinking: "rgba(192,132,252,.22)", idle: "rgba(168,85,247,.18)" }, k: { connecting: "#fbbf24", listening: "#34d399", speaking: "#f43f5e", thinking: "#c084fc", idle: "#a855f7" }, w: 2 },
        { f: .022, a: 18, p: 1.5, s: -.06, c: { connecting: "rgba(245,158,11,.15)", listening: "rgba(45,212,191,.18)", speaking: "rgba(236,72,153,.18)", thinking: "rgba(139,92,246,.18)", idle: "rgba(59,130,246,.15)" }, k: { connecting: "#f59e0b", listening: "#2dd4bf", speaking: "#ec4899", thinking: "#8b5cf6", idle: "#3b82f6" }, w: 1.8 },
        { f: .009, a: 28, p: 3, s: .045, c: { connecting: "rgba(217,119,6,.18)", listening: "rgba(16,185,129,.2)", speaking: "rgba(225,29,72,.22)", thinking: "rgba(168,85,247,.2)", idle: "rgba(236,72,153,.18)" }, k: { connecting: "#d97706", listening: "#10b981", speaking: "#e11d48", thinking: "#a855f7", idle: "#ec4899" }, w: 2.2 },
        { f: .028, a: 12, p: 4.5, s: -.085, c: { connecting: "rgba(255,255,255,.22)", listening: "rgba(255,255,255,.25)", speaking: "rgba(255,255,255,.25)", thinking: "rgba(255,255,255,.25)", idle: "rgba(255,255,255,.2)" }, k: { connecting: "#fff", listening: "#fff", speaking: "#fff", thinking: "#fff", idle: "#fff" }, w: 1.5 }
      ];
      if (!V.wavePhases) V.wavePhases = palettes.map(function (w) { return w.p; });
      var ampScale = 1 + (V.phase === "listening" ? V.volume * 3.2 : V.phase === "speaking" ? 1 : .15);
      var yc = height / 2;
      palettes.forEach(function (wave, index) {
        V.wavePhases[index] += wave.s;
        ctx.beginPath();
        ctx.moveTo(0, yc);
        for (var x = 0; x <= width; x += 2) {
          var t = x / width;
          var env = Math.pow(Math.sin(t * Math.PI), 2);
          ctx.lineTo(x, yc + wave.a * ampScale * env * Math.sin(x * wave.f + V.wavePhases[index]));
        }
        ctx.lineTo(width, yc);
        ctx.closePath();
        ctx.fillStyle = wave.c[state] || wave.c.idle;
        ctx.fill();
        ctx.strokeStyle = wave.k[state] || wave.k.idle;
        ctx.lineWidth = wave.w;
        ctx.stroke();
      });
      var glow = { connecting: "rgba(251,191,36,.2)", listening: "rgba(52,211,153,.24)", speaking: "rgba(244,63,94,.25)", thinking: "rgba(192,132,252,.24)", idle: "rgba(168,85,247,.2)" };
      var grad = ctx.createRadialGradient(width / 2, yc, 10, width / 2, yc, Math.max(width / 2.5, 10));
      grad.addColorStop(0, glow[state] || glow.idle);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      V.raf = requestAnimationFrame(drawVoiceWave);
    }

    function stopAssistantSpeech() {
      clearTimeout(V.watchdog);
      V.watchdog = null;
      if (V.ttsController) {
        try { V.ttsController.abort(); } catch (error) {}
        V.ttsController = null;
      }
            if (V.audio) {
        try { V.audio.pause(); V.audio.currentTime = 0; V.audio.onended = null; V.audio.onerror = null; } catch (error) {}
      }
      if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (error) {}
      }
    }

    function voiceStartListeningRecognition() {
      if (!SpeechRecognitionAPI || !V.open || V.muted || V.recognition) return;
      var recognition;
      try {
        recognition = new SpeechRecognitionAPI();
        recognition.lang = voiceIsArabic ? "ar-AE" : "en-IN";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
      } catch (error) { return; }
      V.recognition = recognition;
      V.recognitionFinalHandled = false;
      recognition.onresult = function (event) {
        var finalText = "";
        var interimText = "";
        for (var i = event.resultIndex; i < event.results.length; i++) {
          var item = event.results[i];
          if (item.isFinal) finalText += item[0].transcript;
          else interimText += item[0].transcript;
        }
        var heard = (finalText || interimText).trim();
        if (!heard) return;
        V.speechText = heard;
        if (V.phase === "speaking" && !V.muted) {
          stopAssistantSpeech();
          voiceSetPhase("listening");
          V.processing = false;
          V.busy = false;
          if (!V.recording && V.stream && V.stream.active) startListeningSession();
        }
        if (finalText.trim() && V.phase === "listening" && !V.processing && !V.muted) {
          V.recognitionFinalHandled = true;
          V.processing = true;
          V.speechText = "";
          stopListeningSession(true);
          handleUserTurn(finalText.trim());
          return;
        }
        if (V.phase === "listening" && !V.muted) {
          clearTimeout(V.speechTimer);
          V.speechTimer = setTimeout(function () {
            var text = String(V.speechText || "").trim();
            if (text && V.open && V.phase === "listening" && !V.processing && !V.muted) {
              V.processing = true;
              V.speechText = "";
              stopListeningSession(true);
              handleUserTurn(text);
            }
          }, 380);
        }
      };
      recognition.onerror = function (event) {
        if (event && (event.error === "not-allowed" || event.error === "service-not-allowed")) {
          voiceSetPhase("thinking", VT.mic);
        }
      };
      recognition.onend = function () {
        if (V.recognition === recognition) V.recognition = null;
        if (V.open && V.continuous && !V.muted && (V.phase === "listening" || V.phase === "speaking") && !V.processing) {
          try { recognition.start(); V.recognition = recognition; } catch (error) {}
        }
      };
      try { recognition.start(); } catch (error) { V.recognition = null; }
    }

    function stopVoiceRecognition() {
      var recognition = V.recognition;
      V.recognition = null;
      if (!recognition) return;
      try {
        recognition.onstart = null; recognition.onresult = null; recognition.onerror = null; recognition.onend = null;
        recognition.stop();
      } catch (error) {}
    }

    function browserVoiceSpeak(text, onFinish) {
      if (!text || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
        if (onFinish) onFinish();
        return;
      }
      var utterance = new SpeechSynthesisUtterance(String(text).replace(/\bDeific\b/gi, "Deeific"));
      utterance.rate = 1;
      utterance.pitch = 1.05;
      utterance.lang = voiceIsArabic ? "ar-AE" : "en-IN";
      utterance.onend = function () { if (onFinish) onFinish(); };
      utterance.onerror = function () { if (onFinish) onFinish(); };
      try {
        if (window.speechSynthesis.getVoices) {
          var voices = window.speechSynthesis.getVoices() || [];
          var langPrefix = utterance.lang.split("-")[0].toLowerCase();
          var matching = voices.filter(function (v) { return String(v.lang || "").toLowerCase().indexOf(langPrefix) === 0; });
          var hints = ["neerja", "swara", "heera", "kalpana", "lekha", "veena", "priya", "female", "zira", "samantha", "moira", "tessa"];
          var selected = matching.find(function (v) { return hints.some(function (h) { return v.name.toLowerCase().indexOf(h) >= 0; }); });
          if (selected) utterance.voice = selected;
        }
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } catch (error) { if (onFinish) onFinish(); }
    }

    function speakThenListen(text) {
      if (V.muted || !V.open) return;
      stopAssistantSpeech();
      stopListeningSession(true);
      V.processing = false;
      V.busy = false;
      V.speechText = "";
      voiceSetPhase("speaking");
      voiceStartListeningRecognition();
      var doneFlag = false;
      function finished() {
        if (doneFlag) return;
        doneFlag = true;
        clearTimeout(V.watchdog);
        V.watchdog = null;
        if (V.open && V.continuous && !V.muted) startListeningSession();
      }
      V.watchdog = setTimeout(finished, Math.min(Math.max(String(text || "").length * 85, 4500), 12000));
      var controller = new AbortController();
      V.ttsController = controller;
      var timeout = setTimeout(function () { try { controller.abort(); } catch (error) {} }, 6500);
      voicePostJson("/web/tts", Object.assign({ text: text, message: text, language: voiceIsArabic ? "ar" : "en" }, voiceSessionFields()), controller.signal)
        .then(function (response) {
          clearTimeout(timeout);
          if (!V.open || V.phase !== "speaking" || V.processing) return null;
          var contentType = response.headers.get("content-type") || "";
          if (contentType.indexOf("json") >= 0) {
            return response.json().then(function (data) {
              var base64 = data.audioBase64 || data.audio_base64 || data.audio;
              var url = data.audioUrl || data.audio_url || data.url;
              if (base64 && String(base64).indexOf("http") !== 0) playVoiceAudio("data:audio/mpeg;base64," + String(base64).replace(/^data:[^,]+,/, ""), finished);
              else if (url || base64) playVoiceAudio(url || base64, finished);
              else browserVoiceSpeak(text, finished);
            });
          }
          return response.blob().then(function (blob) {
            var audioUrl = URL.createObjectURL(blob);
            playVoiceAudio(audioUrl, function () { URL.revokeObjectURL(audioUrl); finished(); });
          });
        })
        .catch(function () {
          clearTimeout(timeout);
          if (V.open && V.phase === "speaking" && !V.processing) browserVoiceSpeak(text, finished);
        });
    }

    function playVoiceAudio(url, onFinish) {
      if (V.muted || !url) { if (onFinish) onFinish(); return; }
      try {
        var audio = V.audio || new Audio();
        V.audio = audio;
        audio.src = url;
        audio.onended = function () { if (onFinish) onFinish(); };
        audio.onerror = function () { browserVoiceSpeak("", onFinish); };
        var playPromise = audio.play();
        if (playPromise && playPromise.catch) playPromise.catch(function () { if (V.open && V.phase === "speaking") browserVoiceSpeak("", onFinish); });
      } catch (error) { if (onFinish) onFinish(); }
    }

    function playAudioBase64(base64, fallbackText) {
      if (V.muted || !base64) return;
      stopAssistantSpeech();
      stopListeningSession(true);
      voiceSetPhase("speaking");
      V.processing = false;
      V.busy = false;
      V.speechText = "";
      voiceStartListeningRecognition();
      var finished = false;
      function onFinish() {
        if (finished) return;
        finished = true;
        clearTimeout(V.watchdog);
        V.watchdog = null;
        if (V.open && V.continuous && !V.muted) startListeningSession();
      }
      V.watchdog = setTimeout(onFinish, Math.min(Math.max(String(fallbackText || "").length * 85, 4500), 12000));
      playVoiceAudio("data:audio/mpeg;base64," + String(base64).replace(/^data:[^,]+,/, ""), onFinish);
    }

    function handleUserTurn(text) {
      text = String(text || "").trim();
      if (!text) {
        V.processing = false;
        V.busy = false;
        if (V.open && V.continuous && !V.muted) startListeningSession();
        return;
      }
      var wasInterrupted = V.phase === "speaking" || V.phase === "listening";
      V.processing = true;
      V.busy = true;
      voiceSetPhase("thinking");
      voicePostJson("/web/chat", Object.assign({
        message: text,
        language: voiceIsArabic ? "ar" : "en",
        interrupted: wasInterrupted
      }, voiceSessionFields()))
        .then(function (response) { return response.json(); })
        .then(function (data) {
          voiceReadSession(data);
          var reply = String(data.reply || data.response || data.answer || data.text || "I am here to help you with Deific Digital's services. What would you like to know?");
          V.processing = false;
          V.busy = false;
          var audio = data.audioBase64 || data.audio_base64;
          if (audio) playAudioBase64(audio, reply);
          else speakThenListen(reply);
        })
        .catch(function (error) {
          V.processing = false;
          V.busy = false;
          console.error("[Deific Voice] Chat failed:", error);
          speakThenListen("Sorry, connection error. Please try again.");
        });
    }

    function processRecordedAudio(blob) {
      if (V.muted || !V.open || !blob || blob.size < 1200) {
        V.processing = false;
        if (V.continuous && V.open && !V.muted) setTimeout(startListeningSession, 120);
        return;
      }
      V.processing = true;
      V.busy = true;
      voiceSetPhase("thinking");
      fetch(VOICE_API + "/web/turn", {
        method: "POST",
        headers: { "Content-Type": blob.type || "audio/webm", "X-Session-Id": V.sessionId },
        body: blob
      }).then(function (response) {
        if (!response.ok) throw new Error("/web/turn HTTP " + response.status);
        return response.json();
      }).then(function (data) {
        voiceReadSession(data);
        var reply = String(data.reply || data.response || data.answer || "").trim();
        var audio = data.audioBase64 || data.audio_base64;
        V.processing = false;
        V.busy = false;
        if (audio) playAudioBase64(audio, reply);
        else if (reply) speakThenListen(reply);
        else throw new Error("The voice endpoint returned no reply.");
      }).catch(function (turnError) {
        console.warn("[Deific Voice] /web/turn failed; trying speech-to-text fallback:", turnError);
        fetch(VOICE_API + "/web/stt", {
          method: "POST",
          headers: { "Content-Type": blob.type || "audio/webm" },
          body: blob
        }).then(function (response) {
          if (!response.ok) throw new Error("/web/stt HTTP " + response.status);
          return response.json();
        }).then(function (data) {
          var transcription = String(data.text || data.transcript || "").trim();
          V.processing = false;
          V.busy = false;
          if (transcription) handleUserTurn(transcription);
          else if (V.open && V.continuous && !V.muted) startListeningSession();
        }).catch(function (sttError) {
          console.warn("[Deific Voice] Speech-to-text fallback failed:", sttError);
          V.processing = false;
          V.busy = false;
          if (V.open && V.continuous && !V.muted) startListeningSession();
        });
      });
    }

    function startListeningSession() {
      if (!V.open || !V.continuous || V.muted || V.recording || V.processing) return;
      if (!V.stream || !V.stream.active) { openVoiceAssistant(); return; }
      voiceSetPhase("listening");
      V.speechDetected = false;
      V.discardNextRecording = false;
      V.chunks = [];
      var mime = "audio/webm;codecs=opus";
      if (typeof MediaRecorder === "undefined") {
        voiceSetPhase("thinking", "This browser cannot record audio. Please use Chrome or Edge.");
        if (SpeechRecognitionAPI) voiceStartListeningRecognition();
        return;
      }
      try {
        if (!MediaRecorder.isTypeSupported(mime)) {
          mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : (MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "");
        }
        var recorder = mime ? new MediaRecorder(V.stream, { mimeType: mime }) : new MediaRecorder(V.stream);
        V.recorder = recorder;
        recorder.ondataavailable = function (event) { if (event.data && event.data.size) V.chunks.push(event.data); };
        recorder.onstop = function () {
          V.recording = false;
          clearInterval(V.vadTimer);
          clearTimeout(V.silenceTimer);
          V.vadTimer = null;
          V.silenceTimer = null;
          V.volume = 0;
          var chunks = V.chunks.slice();
                    V.chunks = [];
          if (V.discardNextRecording) {
            V.discardNextRecording = false;
            return;
          }
          if (!V.processing && V.speechDetected && chunks.length) {
            processRecordedAudio(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
          } else if (V.open && V.continuous && !V.muted && !V.processing && V.phase === "listening") {
            setTimeout(startListeningSession, 120);
          }
        };
        recorder.start(100);
        V.recording = true;
        voiceStartListeningRecognition();
      } catch (error) {
        console.error("[Deific Voice] Recording could not start:", error);
        voiceSetPhase("thinking", "Could not start microphone recording. Check browser permissions.");
        return;
      }

      if (V.analyser) {
        var samples = new Uint8Array(V.analyser.frequencyBinCount);
        clearInterval(V.vadTimer);
        V.vadTimer = setInterval(function () {
          if (!V.open || V.muted || !V.analyser) return;
          V.analyser.getByteFrequencyData(samples);
          var sum = 0;
          for (var i = 0; i < samples.length; i++) sum += samples[i];
          var avg = sum / samples.length;
          V.volume = Math.min(1, avg / 110);
          if (V.phase !== "listening" || !V.recording) return;
          if (avg > 13) {
            V.speechDetected = true;
            clearTimeout(V.silenceTimer);
            V.silenceTimer = null;
          } else if (V.speechDetected && !V.silenceTimer) {
            V.silenceTimer = setTimeout(function () {
              if (V.recording && V.recorder && V.recorder.state === "recording") {
                try { V.recorder.stop(); } catch (error) {}
              }
            }, 650);
          }
        }, 40);
      }
    }

    function stopListeningSession(discard) {
      clearInterval(V.vadTimer);
      clearTimeout(V.silenceTimer);
      clearTimeout(V.speechTimer);
      V.vadTimer = null;
      V.silenceTimer = null;
      V.speechTimer = null;
      V.volume = 0;
      if (V.recorder && V.recorder.state === "recording") {
        V.discardNextRecording = discard !== false;
        try { V.recorder.stop(); } catch (error) {}
      }
      V.recording = false;
    }

    function voiceStartCall() {
      if (V.open) return;
      V.open = true;
      V.continuous = true;
      V.muted = false;
      V.busy = false;
      V.processing = false;
      V.speechDetected = false;
      V.sessionId = newVoiceSessionId();
      voiceBox.style.display = "flex";
      voiceFab.style.display = "none";
      voiceSetPhase("connecting");
      cancelAnimationFrame(V.raf);
      drawVoiceWave();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        voiceSetPhase("thinking", "Voice assistant requires HTTPS and microphone access.");
        return;
      }
      navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
        .then(function (stream) {
          if (!V.open) { stream.getTracks().forEach(function (track) { track.stop(); }); return; }
          V.stream = stream;
          try {
            var AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx && !V.audioContext) {
              V.audioContext = new AudioCtx();
              if (V.audioContext.state === "suspended") V.audioContext.resume();
              var source = V.audioContext.createMediaStreamSource(stream);
              V.analyser = V.audioContext.createAnalyser();
              V.analyser.fftSize = 256;
              source.connect(V.analyser);
            }
          } catch (error) { console.warn("[Deific Voice] Audio analyser unavailable:", error); }

          // Start the greeting immediately, without waiting for the session request.
          speakThenListen("Hello! Welcome to Deific Digital. I am your AI assistant. How can I assist you today?");
          fetch(VOICE_API + "/web/start", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.assign({ language: voiceIsArabic ? "ar" : "en", page: location.href }, voiceSessionFields()))
          }).then(function (response) { if (response.ok) return response.json(); }).then(function (data) { if (data) voiceReadSession(data); }).catch(function () {});
        })
        .catch(function (error) {
          console.error("[Deific Voice] Microphone permission failed:", error);
          voiceSetPhase("thinking", error && error.name === "NotAllowedError" ? VT.mic : VT.error);
        });
    }

    function voiceToggleMute() {
      if (!V.open) return;
      V.muted = !V.muted;
      if (V.muted) {
        stopAssistantSpeech();
        stopListeningSession(true);
        stopVoiceRecognition();
        voiceSetPhase("listening");
      } else {
        voiceSetPhase("listening");
        if (V.continuous) startListeningSession();
      }
    }

    function voiceCloseAssistant() {
      V.open = false;
      V.continuous = false;
      V.processing = false;
      V.busy = false;
      V.muted = false;
      stopAssistantSpeech();
      stopListeningSession(true);
      stopVoiceRecognition();
      cancelAnimationFrame(V.raf);
      clearTimeout(V.watchdog);
      if (V.stream) {
        V.stream.getTracks().forEach(function (track) { try { track.stop(); } catch (error) {} });
        V.stream = null;
      }
      if (V.audioContext) {
        try { V.audioContext.close(); } catch (error) {}
        V.audioContext = null;
        V.analyser = null;
      }
      V.audio = null;
      V.phase = "ended";
      voiceBox.style.display = "none";
      voiceFab.style.display = "";
      voiceSetPhase("ended");
    }

    voiceFab.addEventListener("click", voiceStartCall);
    if (voiceClose) voiceClose.addEventListener("click", voiceCloseAssistant);
    if (voiceMic) voiceMic.addEventListener("click", voiceToggleMute);
    if (voiceTitle) voiceTitle.textContent = VT.mute;
  }

  /* 13. Count-up figures are already rendered in the HTML. */
})();

/* ==========================================================================
   14. Site-wide Arabic mode.
   - "EN | عربي" toggle is added to the header of every page.
   - Preference is stored in localStorage ("dd_lang") and follows the visitor
     from page to page. Default is English, so nothing changes unless the
     visitor switches.
   - Arabic mode sets <html lang="ar" dir="rtl"> (the RTL CSS and the Arabic
     font were already part of style.css), then translates all visible text,
     placeholders, tooltips and aria-labels.
   - Shared text (menu, footer, forms, calculator, etc.) comes from the
     built-in dictionary below, instantly and offline. Everything else is
     machine-translated once and cached in the visitor's browser.
   - /uae/ and /uae/ar/ keep their own authored English/Arabic pair; the
     preference is only synced with them.
   ========================================================================== */
(function () {
  "use strict";

  var LS_KEY = "dd_lang";
  var CACHE_KEY = "dd_ar_cache_v1";
  var root = document.documentElement;

  function getPref() {
    try { return localStorage.getItem(LS_KEY) || ""; } catch (e) { return ""; }
  }

  function setPref(value) {
    try { localStorage.setItem(LS_KEY, value); } catch (e) {}
  }

  /* Works from the domain root or from a subfolder preview. */
  function uaeBase() {
    return location.pathname.replace(/\/uae(\/.*)?$/i, "/uae");
  }

  function releaseVeil() {
    root.className = root.className.replace(/\s*dd-ar-pending/g, "");
  }

  /* /uae/ pages: just keep the preference in sync with the authored pair. */
  if (/\/uae(\/|$)/i.test(location.pathname)) {
    if (/\/uae\/ar(\/|$)/i.test(location.pathname)) {
      setPref("ar");
    } else if (getPref() === "ar") {
      location.replace(uaeBase() + "/ar" + location.search + location.hash);
    }
    return;
  }

  var active = getPref() === "ar";

  /* ---------------------------------------------------------------- toggle */

  function buildToggle() {
    var wrap = document.createElement("div");

    wrap.className =
      "flex items-center rounded-full bg-dd-paper p-1 text-[13px] font-semibold ring-1 ring-dd-line";
    wrap.setAttribute("dir", "ltr");
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Site language");
    wrap.setAttribute("data-dd-lang-toggle", "true");
    wrap.setAttribute("data-no-translate", "true");

    [["en", "EN"], ["ar", "عربي"]].forEach(function (item) {
      var button = document.createElement("button");
      var on = (item[0] === "ar") === active;

      button.type = "button";
      button.setAttribute("lang", item[0]);
      button.setAttribute("aria-pressed", String(on));
      button.className = on
        ? "rounded-full px-2.5 py-1 bg-white text-dd-ink shadow-sm"
        : "rounded-full px-2.5 py-1 text-dd-slate";
      button.textContent = item[1];

      button.addEventListener("click", function () {
        if (on) return;
        setPref(item[0] === "ar" ? "ar" : "en");
        location.reload();
      });

      wrap.appendChild(button);
    });

    var nav = document.querySelector('header nav');
    var group = nav && nav.nextElementSibling;

    if (group && group.firstChild) {
      group.insertBefore(wrap, group.firstChild);
    } else if (group) {
      group.appendChild(wrap);
    } else {
      wrap.style.cssText =
        "position:fixed;left:12px;bottom:76px;z-index:60;background:#fff";
      document.body.appendChild(wrap);
    }
  }

  buildToggle();

  if (!active) return;

  /* ------------------------------------------------------------ Arabic mode */

  root.setAttribute("lang", "ar");
  root.setAttribute("dir", "rtl");

  /* Optional: paste a Google Cloud Translation API key here for the most
     reliable machine translation. Leave empty to use the free endpoint. */
  var TRANSLATE_API_KEY = "";

  var DICT = {
    /* ---- navigation / header ---- */
    "Home": "الرئيسية",
    "About": "من نحن",
    "About Us": "من نحن",
    "Who we are and how we work": "من نحن وكيف نعمل",
    "Our Team": "فريقنا",
    "The people building your product": "الفريق الذي يبني منتجك",
    "Technologies": "التقنيات",
    "The stack we build with": "التقنيات التي نبني بها",
    "Careers": "الوظائف",
    "Open roles at Deific Digital": "الوظائف المتاحة في Deific Digital",
    "Blog": "المدونة",
    "Guides and company news": "أدلة وأخبار الشركة",
    "Services": "الخدمات",
    "AI Agents & Automation": "وكلاء الذكاء الاصطناعي والأتمتة",
    "AI Agents (Receptionist, Care, Sales)": "وكلاء الذكاء الاصطناعي (الاستقبال، خدمة العملاء، المبيعات)",
    "Business Automation Flows": "تدفقات أتمتة الأعمال",
    "WhatsApp AI Agent": "وكيل ذكاء اصطناعي على واتساب",
    "AI Integration Services": "خدمات دمج الذكاء الاصطناعي",
    "Generative AI Solutions": "حلول الذكاء الاصطناعي التوليدي",
    "Industry Automation": "أتمتة القطاعات",
    "Real Estate Sales Automation": "أتمتة مبيعات العقارات",
    "Hospital Management AI": "الذكاء الاصطناعي لإدارة المستشفيات",
    "CA Firm Automation": "أتمتة مكاتب المحاسبة",
    "Car Dealer Automation": "أتمتة وكالات السيارات",
    "Smart City Solutions": "حلول المدن الذكية",
    "Development": "التطوير",
    "Web Application Development": "تطوير تطبيقات الويب",
    "Android App Development": "تطوير تطبيقات أندرويد",
    "iOS App Development": "تطوير تطبيقات iOS",
    "Cross Platform Apps": "تطبيقات متعددة المنصات",
    "Game Development": "تطوير الألعاب",
    "Digital Marketing": "التسويق الرقمي",
        "SEO (Search Engine Optimization)": "تحسين محركات البحث (SEO)",
    "Social Media Marketing": "التسويق عبر وسائل التواصل الاجتماعي",
    "Meta Ads": "إعلانات ميتا",
    "GMB Optimization": "تحسين ملف النشاط التجاري على جوجل",
    "Startups": "الشركات الناشئة",
    "MVP Development": "تطوير المنتج الأولي (MVP)",
    "Startup Idea Validation": "التحقق من فكرة المشروع الناشئ",
    "Hybrid App Development": "تطوير التطبيقات الهجينة",
    "Portfolio": "أعمالنا",
    "Products": "المنتجات",
    "Healthcare": "الرعاية الصحية",
    "AI Receptionist": "موظف الاستقبال الذكي",
    "For clinics, polyclinics and hospitals": "للعيادات والمجمعات الطبية والمستشفيات",
    "Books appointments 24/7": "يحجز المواعيد على مدار الساعة",
    "Live doctor and OPD slots": "مواعيد الأطباء والعيادات الخارجية المباشرة",
    "View details": "عرض التفاصيل",
    "Live Demo": "عرض تجريبي مباشر",
    "Real estate": "العقارات",
    "Complete Site Booking System": "نظام متكامل لحجز زيارات المواقع",
    "Auto-messages every lead": "يراسل كل عميل محتمل تلقائيًا",
    "Matching property details": "يرسل تفاصيل العقارات المناسبة",
    "Sales": "المبيعات",
    "AI Sales Agent": "وكيل المبيعات الذكي",
    "For sales teams and growing businesses": "لفرق المبيعات والشركات النامية",
    "Finds leads for you": "يبحث عن العملاء المحتملين لك",
    "Talks to every lead": "يتحدث مع كل عميل محتمل",
    "Support": "الدعم",
    "AI Customer Support": "دعم العملاء بالذكاء الاصطناعي",
    "For any business with customer queries": "لأي نشاط تجاري يتلقى استفسارات العملاء",
    "Instant replies, 24/7": "ردود فورية على مدار الساعة",
    "Solves common queries": "يحل الاستفسارات الشائعة",
    "AI agents that work on WhatsApp": "وكلاء ذكاء اصطناعي يعملون على واتساب",
    "Pick a ready-made agent and we set it up for your business.": "اختر وكيلًا جاهزًا ونحن نجهّزه لنشاطك التجاري.",
    "All products": "جميع المنتجات",
    "All Products": "جميع المنتجات",
    "Compare AI agents": "قارن بين وكلاء الذكاء الاصطناعي",
    "Book a demo": "احجز عرضًا تجريبيًا",
    "Contact": "اتصل بنا",
    "India": "الهند",
    "UAE": "الإمارات",
    "USA": "الولايات المتحدة",
    "Free automation audit": "تدقيق أتمتة مجاني",
    "Free audit": "تدقيق مجاني",
    "Main": "التنقل الرئيسي",
    "Region": "المنطقة",
    "Regions": "المناطق",
    "Open menu": "فتح القائمة",
    "Close": "إغلاق",
    "Call": "اتصال",
    "Chat on WhatsApp": "تواصل عبر واتساب",
    "WhatsApp": "واتساب",
    "WhatsApp us": "راسلنا على واتساب",
    "Deific Digital home": "الصفحة الرئيسية لـ Deific Digital",
    "Deific Digital logo": "شعار Deific Digital",

    /* ---- footer ---- */
    "Custom AI agents, automation flows and software for businesses in India and the UAE. A brand of Deific Enterprises.": "وكلاء ذكاء اصطناعي مخصصون وتدفقات أتمتة وبرمجيات للشركات في الهند والإمارات. علامة تجارية تابعة لشركة Deific Enterprises.",
    "certified": "معتمدة",
    "Company": "الشركة",
    "Industries": "القطاعات",
    "AI Agents": "وكلاء الذكاء الاصطناعي",
    "UAE (English)": "الإمارات (English)",
    "Registered office": "المقر الرسمي المسجل",
    "Branch office": "المكتب الفرعي",
    "8th Floor, STPI, A1/4 UPSIDA Building, Lakhanpur, Kanpur, Uttar Pradesh 208024, India": "الطابق الثامن، STPI، مبنى UPSIDA A1/4، لاخانبور، كانبور، أوتار براديش 208024، الهند",
    "C-270, Sector 63, Noida, Uttar Pradesh 201301, India": "C-270، القطاع 63، نويدا، أوتار براديش 201301، الهند",
    "Deific Digital. All rights reserved.": "Deific Digital. جميع الحقوق محفوظة.",
    "Terms & Conditions": "الشروط والأحكام",
    "Privacy Policy": "سياسة الخصوصية",
    "Facebook": "فيسبوك",
    "Instagram": "إنستغرام",
    "LinkedIn": "لينكدإن",

    /* ---- voice assistant ---- */
    "Deific Voice Assistant": "مساعد Deific الصوتي",
    "voice assistant": "المساعد الصوتي",
    "Tap to mute": "اضغط لكتم الصوت",
    "tap to mute": "اضغط لكتم الصوت",
    "Connecting…": "جارٍ الاتصال…",

    /* ---- city / service page template ---- */
    "Learn more": "اعرف المزيد",
    "Free consultation": "استشارة مجانية",
    "All": "الكل",
    "Frequently asked questions": "الأسئلة الشائعة",
    "Software company in": "شركة برمجيات في",
    "Software Company in": "شركة برمجيات في",
    "Software company in India": "شركة برمجيات في الهند",
    "cities we serve": "مدن نخدمها",
    "Areas we serve in": "المناطق التي نخدمها في",
    "Industries we build for in": "القطاعات التي نبني لها في",
    "Breadcrumb": "مسار التنقل",
    "businesses": "",
    "Custom software development": "تطوير برمجيات مخصصة",
    "How a project with us works": "كيف يسير مشروعك معنا",
    "1. Discovery call": "1. مكالمة الاستكشاف",
    "We listen to your process and goals. Free, no obligation.": "نستمع إلى طريقة عملك وأهدافك. مجانًا ودون أي التزام.",
    "2. Written estimate": "2. تقدير مكتوب",
    "Scope, timeline and price in INR before any work starts.": "النطاق والجدول الزمني والسعر بالروبية الهندية قبل بدء أي عمل.",
    "3. Build and review": "3. التنفيذ والمراجعة",
    "Regular demos so you see progress and change course early.": "عروض تجريبية منتظمة لتتابع التقدم وتعدّل المسار مبكرًا.",
    "4. Launch and support": "4. الإطلاق والدعم",
    "Go-live, training and ongoing support in Hindi or English.": "الإطلاق والتدريب والدعم المستمر بالهندية أو الإنجليزية.",
    "Plans in Hindi and English": "خطط بالهندية والإنجليزية",
    "AI agents & WhatsApp automation": "وكلاء الذكاء الاصطناعي وأتمتة واتساب",
    "AI receptionist, sales and customer-care agents that answer in seconds.": "موظف استقبال ووكلاء مبيعات وخدمة عملاء بالذكاء الاصطناعي يردّون خلال ثوانٍ.",
    "Business automation": "أتمتة الأعمال",
    "Reminders, follow-ups, reports and data entry that run without your team.": "تذكيرات ومتابعات وتقارير وإدخال بيانات تعمل دون تدخل فريقك.",
    "Cross-platform apps": "تطبيقات متعددة المنصات",
    "One codebase for Android and iOS to launch faster at lower cost.": "قاعدة شيفرة واحدة لأندرويد وiOS لإطلاق أسرع بتكلفة أقل.",
    "Android app development": "تطوير تطبيقات أندرويد",
    "Native Android apps for customers, field staff and delivery teams.": "تطبيقات أندرويد أصلية للعملاء والموظفين الميدانيين وفرق التوصيل.",
    "iOS app development": "تطوير تطبيقات iOS",
    "Polished iPhone and iPad apps, published on the App Store.": "تطبيقات آيفون وآيباد متقنة منشورة على App Store.",
    "Web applications, portals, ERP and CRM built around how your team really works.": "تطبيقات ويب وبوابات وأنظمة ERP وCRM مبنية وفق طريقة عمل فريقك الفعلية.",
    "Software and app development services for": "خدمات تطوير البرمجيات والتطبيقات لشركات",
    "We also build software near": "نطوّر البرمجيات أيضًا بالقرب من",
    "Check four things: relevant past work, a written scope and estimate, security practices, and how quickly the team replies. Deific Digital is ISO 9001 and ISO/IEC 27001 certified, gives a written estimate after a free discovery call, and replies on WhatsApp the same working day.": "تحقق من أربعة أمور: أعمال سابقة ذات صلة، ونطاق عمل وتقدير مكتوبان، وممارسات الأمان، وسرعة ردّ الفريق. شركة Deific Digital حاصلة على شهادتي ISO 9001 وISO/IEC 27001، وتقدّم تقديرًا مكتوبًا بعد مكالمة استكشاف مجانية، وترد على واتساب في يوم العمل نفسه.",
    "Yes. We build AI receptionists, sales agents and customer-care agents that answer calls and WhatsApp messages, book appointments, send reminders and update your CRM. We plan and support in Hindi and English.": "نعم. نبني موظفي استقبال ووكلاء مبيعات ووكلاء خدمة عملاء بالذكاء الاصطناعي يردّون على المكالمات ورسائل واتساب، ويحجزون المواعيد، ويرسلون التذكيرات، ويحدّثون نظام CRM لديك. نخطط وندعم بالهندية والإنجليزية.",
    "The cost depends on the number of users, features and integrations. A simple business website or app MVP costs far less than a full ERP. After a free discovery call we send a written estimate in INR, so you know the price before work starts.": "تعتمد التكلفة على عدد المستخدمين والميزات والتكاملات. موقع تجاري بسيط أو منتج أولي (MVP) لتطبيق أقل تكلفة بكثير من نظام ERP كامل. بعد مكالمة استكشاف مجانية نرسل لك تقديرًا مكتوبًا بالروبية الهندية لتعرف السعر قبل بدء العمل.",

    /* ---- service page template ---- */
    "Why Choose Us?": "لماذا تختارنا؟",
    "We, being a pioneering company in this space, chart our operations stepwise:": "بصفتنا شركة رائدة في هذا المجال، ننظّم عملنا خطوة بخطوة:",
    "Hire a Dedicated Developer": "وظّف مطوّرًا متخصصًا",
    "Get a skilled developer for your project, working exclusively for you.": "احصل على مطوّر ماهر لمشروعك يعمل حصريًا لأجلك.",
    "Hire Now": "وظّف الآن",
    "Your Email Address": "بريدك الإلكتروني",
    "Welcome to Deific Digital. If you would like more information, please subscribe.": "مرحبًا بك في Deific Digital. إذا رغبت في مزيد من المعلومات، يُرجى الاشتراك.",
    "Get New Insights Weekly": "احصل على أفكار جديدة أسبوعيًا",
    "Subscribe": "اشترك",
    "Process": "العملية",
    "Overview": "نظرة عامة",
    "Request A Quote": "اطلب عرض سعر",
    "Get Quote": "احصل على عرض سعر",
    "Our Process Phases": "مراحل عملنا",
    "Our design process follows a proven approach. We begin with a deep understanding of your needs and create a planning template.": "تتبع عملية التصميم لدينا نهجًا مجرّبًا. نبدأ بفهم عميق لاحتياجاتك ثم نُعدّ قالب التخطيط.",
    "Services We": "الخدمات التي",
    "Provide": "نقدّمها",
    "Get Free Consultation": "احصل على استشارة مجانية",
    "Call +91 87502 00899": "اتصل على +91 87502 00899",
    "Ready to start your digital transformation?": "هل أنت مستعد لبدء تحوّلك الرقمي؟",
    "Let's discuss your project. Get a free consultation from our experts and a no-obligation proposal.": "لنناقش مشروعك. احصل على استشارة مجانية من خبرائنا وعرض دون أي التزام.",
    "How it works": "كيف يعمل",
    "Education": "التعليم",

    /* ---- forms / messages produced by site.js ---- */
    "What do you need? *": "ما الذي تحتاجه؟ *",
    "Select your requirement": "اختر احتياجك",
    "App Development": "تطوير التطبيقات",
    "Website Development": "تطوير المواقع",
    "AI Chatbots": "روبوتات الدردشة بالذكاء الاصطناعي",
    "Verify & Send Enquiry": "تحقق وأرسل الاستفسار",
    "Please complete all required fields.": "يُرجى إكمال جميع الحقول المطلوبة.",
    "Please enter a valid email address.": "يُرجى إدخال بريد إلكتروني صالح.",
    "Please enter a valid phone number.": "يُرجى إدخال رقم هاتف صالح.",
    "Sending your enquiry...": "جارٍ إرسال استفسارك...",
    "Incorrect CAPTCHA. A new question has been generated.": "رمز التحقق غير صحيح. تم إنشاء سؤال جديد.",
    "Enquiry submitted successfully! Our team will contact you shortly.": "تم إرسال استفسارك بنجاح! سيتواصل معك فريقنا قريبًا.",
    "Thank you! We have received your details and will call you shortly.": "شكرًا لك! لقد استلمنا بياناتك وسنتصل بك قريبًا.",
    "WhatsApp is opening with your details. Press Send to submit your enquiry.": "يتم فتح واتساب ببياناتك. اضغط إرسال لتقديم استفسارك.",
    "Fill in your details and send your enquiry directly to our team.": "املأ بياناتك وأرسل استفسارك مباشرة إلى فريقنا.",

    /* ---- brand / certificates (kept as is) ---- */
    "PropAI": "PropAI", "PropAI CRM": "PropAI CRM",
    "ISO 9001": "ISO 9001", "ISO/IEC 27001": "ISO/IEC 27001",
    "Deific Digital": "Deific Digital", "Deific": "Deific", "Digital": "Digital",

    /* ---- mobile menu labels (title + subtitle are one string there) ---- */
    "About UsWho we are and how we work": "من نحن – من نحن وكيف نعمل",
    "Our TeamThe people building your product": "فريقنا – الفريق الذي يبني منتجك",
    "TechnologiesThe stack we build with": "التقنيات – التقنيات التي نبني بها",
    "CareersOpen roles at Deific Digital": "الوظائف – الوظائف المتاحة في Deific Digital",
    "BlogGuides and company news": "المدونة – أدلة وأخبار الشركة",
    "View AI Receptionist details": "عرض تفاصيل موظف الاستقبال الذكي",
    "View PropAI details": "عرض تفاصيل PropAI",
    "View AI Sales Agent details": "عرض تفاصيل وكيل المبيعات الذكي",
    "View AI Customer Support details": "عرض تفاصيل دعم العملاء بالذكاء الاصطناعي",

    /* ---- misc shared ---- */
    "How We": "كيف نقوم بـ",
    "Email:": "البريد الإلكتروني:", "Email": "البريد الإلكتروني",
    "Talk to us": "تحدّث إلينا",
    "Terms of Service": "شروط الخدمة",
    "Data Deletion": "حذف البيانات",
    "Back to": "العودة إلى",
    "Last updated:": "آخر تحديث:",
    "Happy Clients": "عملاء سعداء",
    "Who needs it": "لمن هذا المنتج",
    "The problem": "المشكلة",
    "What you get": "ما ستحصل عليه",
    "More AI products": "المزيد من منتجات الذكاء الاصطناعي",
    "Ready to launch": "جاهز للإطلاق",
    "IT & startups": "تقنية المعلومات والشركات الناشئة",
    "and": "و",
    ". All rights reserved.": ". جميع الحقوق محفوظة.",
    "Gujarat": "غوجارات", "Maharashtra": "ماهاراشترا",

    /* ---- place names ---- */
    "Kanpur": "كانبور", "Noida": "نويدا", "Delhi": "دلهي", "Uttar Pradesh": "أوتار براديش",
    "Agra": "آغرا", "Ahmedabad": "أحمد آباد", "Bengaluru": "بنغالورو", "Bhopal": "بوبال",
    "Bhubaneswar": "بوبانسوار", "Chandigarh": "تشانديغار", "Chennai": "تشيناي",
    "Coimbatore": "كويمباتور", "Dehradun": "ديرادون", "Ghaziabad": "غازي آباد",
    "Gurugram": "غورغاون", "Guwahati": "غواهاتي", "Hyderabad": "حيدر آباد", "Indore": "إندور",
    "Jaipur": "جايبور", "Kochi": "كوتشي", "Kolkata": "كولكاتا", "Lucknow": "لكناو",
    "Meerut": "ميروت", "Mumbai": "مومباي", "Nagpur": "ناغبور", "Patna": "باتنا",
    "Prayagraj": "براياغراج", "Pune": "بونه", "Raipur": "رايبور", "Ranchi": "رانشي",
    "Surat": "سورات", "Vadodara": "فادودارا", "Varanasi": "فاراناسي",
    "Visakhapatnam": "فيساخاباتنام"
  };

  /* ---------------------------------------------------------------- helpers */

  var AR_RE = /[\u0600-\u06FF]/;
  var LATIN_RE = /[A-Za-z]{2,}/;
  var SKIP_TAGS = {
    SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1,
    SVG: 1, CANVAS: 1, TEMPLATE: 1, IFRAME: 1, HEAD: 1, TITLE: 1
  };
  var ATTRS = ["placeholder", "title", "alt", "aria-label"];

  var nodeState = new WeakMap(); /* text node -> {o: original, t: translated} */
  var attrState = new WeakMap(); /* element -> { attr: {o, t} } */

  function norm(text) {
    return String(text).replace(/\s+/g, " ").trim();
  }

  function translatable(key) {
    if (!key || key.length > 1800) return false;
    if (!LATIN_RE.test(key) || AR_RE.test(key)) return false;
   if (/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(key)) return false; /* email */
    if (/^(https?:\/\/|www\.)\S+$/i.test(key)) return false;        /* url */
    if (/^[\w-]+(\.[\w-]+)+$/.test(key) && key.indexOf(" ") < 0) return false; /* domain */
    return true;
  }

  function isExcluded(node) {
    var el = node.nodeType === 1 ? node : node.parentElement;

    while (el && el !== document.documentElement) {
      if (
        SKIP_TAGS[el.tagName.toUpperCase()] ||
        el.hasAttribute("data-no-translate") ||
        el.hasAttribute("data-brand-name") ||
        el.getAttribute("translate") === "no" ||
        el.getAttribute("contenteditable") === "true" ||
        (el.classList && (el.classList.contains("notranslate") ||
                          el.classList.contains("dd-demo-message")))
      ) return true;

      el = el.parentElement;
    }

    return false;
  }

  /* ----------------------------------------------------------------- cache */

  var cache = {};

  try {
    cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}") || {};
  } catch (e) { cache = {}; }

  var saveTimer = null;

  function saveCache() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        var json = JSON.stringify(cache);

        if (json.length > 2000000) {
          cache = {};
          json = "{}";
        }

        localStorage.setItem(CACHE_KEY, json);
      } catch (e) { cache = {}; }
    }, 400);
  }

  function lookup(key) {
    if (Object.prototype.hasOwnProperty.call(DICT, key)) return DICT[key];
    if (Object.prototype.hasOwnProperty.call(cache, key)) return cache[key];
    return null;
  }

  /* --------------------------------------------------- machine translation */

  var waiting = {};         /* key -> [callbacks] */
  var waitingCount = 0;
  var flushTimer = null;
  var inflight = 0;
  var mtBroken = false;
  var queueList = [];

  function request(key, cb) {
    if (mtBroken) return;
        if (!waiting[key]) {
      waiting[key] = [];
      waitingCount++;
      queueList.push(key);
    }

    waiting[key].push(cb);
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 80);
  }

  function gtxSingle(text) {
    var url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=" +
      encodeURIComponent(text);

    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }).then(function (data) {
      var out = "";

      ((data && data[0]) || []).forEach(function (seg) {
        if (seg && typeof seg[0] === "string") out += seg[0];
      });

      if (!out) throw new Error("empty");
      return out;
    });
  }

  function officialBatch(list) {
    return fetch(
      "https://translation.googleapis.com/language/translate/v2?key=" +
        encodeURIComponent(TRANSLATE_API_KEY),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: list, source: "en", target: "ar", format: "text" })
      }
    ).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }).then(function (data) {
      var items = data && data.data && data.data.translations;

      if (!items || items.length !== list.length) throw new Error("mismatch");

      return items.map(function (item) {
        var div = document.createElement("textarea");
        div.innerHTML = item.translatedText || "";
        return div.value;
      });
    });
  }

  function freeBatch(list) {
    if (list.length === 1) {
      return gtxSingle(list[0]).then(function (out) { return [out]; });
    }

    return gtxSingle(list.join("\n")).then(function (out) {
      var parts = out.split("\n");

      if (parts.length !== list.length) throw new Error("mismatch");

      return parts.map(function (part) { return part.trim(); });
    }).catch(function (error) {
      if (!/mismatch/.test(String(error && error.message))) throw error;

      /* line alignment failed: translate one by one */
      var results = [];

      return list.reduce(function (chain, text, index) {
        return chain.then(function () {
          return gtxSingle(text).then(function (out) {
            results[index] = out;
          }).catch(function () {
            results[index] = null;
          });
        });
      }, Promise.resolve()).then(function () { return results; });
    });
  }

  function done(key, value) {
    var callbacks = waiting[key] || [];

    delete waiting[key];
    waitingCount--;

    if (value) {
      cache[key] = value;
      callbacks.forEach(function (cb) { cb(value); });
    }
  }

  function flush() {
    if (!queueList.length) return;

    var batches = [];
    var current = [];
    var size = 0;

    queueList.forEach(function (key) {
      if (current.length && (size + key.length > 1200 || current.length >= 20)) {
        batches.push(current);
        current = [];
        size = 0;
      }

      current.push(key);
      size += key.length;
    });

    if (current.length) batches.push(current);
    queueList = [];

    batches.forEach(runBatch);
  }

  var batchBacklog = [];

  function runBatch(list) {
    if (inflight >= 3) {
      batchBacklog.push(list);
      return;
    }

    inflight++;

    var job = TRANSLATE_API_KEY ? officialBatch(list) : freeBatch(list);

    job.then(function (results) {
      list.forEach(function (key, i) { done(key, results[i]); });
      saveCache();
    }).catch(function (error) {
      mtBroken = true;

      if (window.console) {
        console.warn("[Arabic mode] machine translation unavailable:", error);
      }

      list.forEach(function (key) { done(key, null); });
      batchBacklog.forEach(function (rest) {
        rest.forEach(function (key) { done(key, null); });
      });
      batchBacklog = [];
    }).then(function () {
      inflight--;

      if (batchBacklog.length) runBatch(batchBacklog.shift());

      if (!waitingCount && !inflight) releaseVeil();
    });
  }

  /* --------------------------------------------------- apply to the document */

  function processText(node) {
    var raw = node.nodeValue;
    var st = nodeState.get(node);

    if (st && st.t === raw) return;
    if (isExcluded(node)) return;

    var key = norm(raw);

    if (!translatable(key)) return;

    var apply = function (tr) {
      if (node.nodeValue !== raw) return;

      var m = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
      var next = m[1] + tr + m[3];

      node.nodeValue = next;
      nodeState.set(node, { o: raw, t: next });
    };

    var hit = lookup(key);

    if (hit !== null) apply(hit);
    else request(key, apply);
  }

  function processAttr(el, name) {
    if (isExcluded(el)) return;

    var raw = el.getAttribute(name);

    if (raw == null) return;

    var map = attrState.get(el);
    var st = map && map[name];

    if (st && st.t === raw) return;

    var key = norm(raw);

    if (!translatable(key)) return;

    var apply = function (tr) {
      if (el.getAttribute(name) !== raw) return;

      var store = attrState.get(el) || {};

      store[name] = { o: raw, t: tr };
      attrState.set(el, store);
      el.setAttribute(name, tr);
    };

    var hit = lookup(key);

    if (hit !== null) apply(hit);
    else request(key, apply);
  }

  function scan(node) {
    if (!node) return;

    if (node.nodeType === 3) {
      processText(node);
      return;
    }

    if (node.nodeType !== 1 || isExcluded(node)) return;

    var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
    var texts = [];
    var current;

    while ((current = walker.nextNode())) texts.push(current);

    texts.forEach(processText);

    var els = [node].concat(
      Array.prototype.slice.call(
        node.querySelectorAll("[placeholder],[title],[alt],[aria-label],input[type=submit],input[type=button],input[type=reset]")
      )
    );

    els.forEach(function (el) {
      ATTRS.forEach(function (name) {
        if (el.hasAttribute && el.hasAttribute(name)) processAttr(el, name);
      });

      if (el.tagName === "INPUT" && /^(submit|button|reset)$/i.test(el.type)) {
        processAttr(el, "value");
      }
    });
  }

  /* original (English) text, for code that matches or forwards visible text */

  window.ddOriginalText = function (el) {
    var out = "";
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var n;

    while ((n = walker.nextNode())) {
      var st = nodeState.get(n);
      out += st && st.t === n.nodeValue ? st.o : n.nodeValue;
    }

    return out;
  };

  window.ddOriginalAttr = function (el, name) {
    var map = attrState.get(el);
    var st = map && map[name];
    var cur = el.getAttribute(name);

    return st && st.t === cur ? st.o : cur;
  };

  function translateHead() {
    var title = norm(document.title);
    var hit = translatable(title) ? lookup(title) : null;

    var setTitle = function (tr) { document.title = tr; };

    if (hit !== null) setTitle(hit);
    else if (translatable(title)) request(title, setTitle);

    var meta = document.querySelector('meta[name="description"]');

    if (meta) {
      var desc = norm(meta.getAttribute("content") || "");

      if (translatable(desc)) {
        var setDesc = function (tr) { meta.setAttribute("content", tr); };
        var found = lookup(desc);

        if (found !== null) setDesc(found);
        else request(desc, setDesc);
      }
    }
  }

  /* ------------------------------------------------------------------ run */

  var observer = new MutationObserver(function (records) {
    records.forEach(function (rec) {
      if (rec.type === "characterData") {
        if (rec.target.nodeType === 3) processText(rec.target);
      } else if (rec.type === "attributes") {
        if (rec.target.nodeType === 1) processAttr(rec.target, rec.attributeName);
      } else {
        Array.prototype.forEach.call(rec.addedNodes, scan);
      }
    });
  });

  scan(document.body);
  translateHead();

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRS
  });

  /* Reveal the page as soon as everything cached/built-in is applied, or after
     a short wait for machine translation. The head snippet has its own
     3.5 s safety timeout, so the page can never stay hidden. */
  if (!waitingCount) releaseVeil();
  else setTimeout(releaseVeil, 1500);
})();

/* ------------------------------------------------------------------
   Consent (DPDP Act 2023 / UAE PDPL): form consent checkboxes,
   cookie banner and Google Analytics 4 that loads only after opt-in.
   ------------------------------------------------------------------ */
(function () {
  "use strict";

  var KEY = "dd_cookie_consent";
  var ar = /^ar(?:-|$)/i.test(document.documentElement.lang || "") || /^\/uae\/ar(?:\/|$)/i.test(location.pathname);
  var analyticsOn = false;
  var ga4Loaded = false;

  var TXT = ar ? {
    consent: "أوافق على",
    policy: "سياسة الخصوصية",
    consentEnd: ". *",
    wa: "(اختياري) التواصل معي عبر واتساب.",
    err: "يُرجى الموافقة على معالجة بياناتك لإرسال الاستفسار.",
    bTitle: "ملفات تعريف الارتباط على موقعنا",
    bText: "نستخدم ملفات تعريف الارتباط الضرورية لتشغيل الموقع. وبموافقتك نستخدم أيضًا ملفات التحليلات (Google Analytics) لفهم كيفية استخدام الموقع. يمكنك تغيير اختيارك في أي وقت من «إعدادات ملفات تعريف الارتباط» أسفل الصفحة.",
    accept: "قبول التحليلات", reject: "رفض غير الضروري", settings: "إعدادات ملفات تعريف الارتباط",
    privacy: "/uae/ar/privacy-policy/"
  } : {
    consent: "I agree to the",
    policy: "Privacy Policy",
    consentEnd: ". *",
    wa: "(Optional) Contact me on WhatsApp.",
    err: "Please tick the consent box so we can process your details and send your enquiry.",
    bTitle: "Cookies on our website",
    bText: "We use essential cookies to run this site. With your permission we also use analytics cookies (Google Analytics) to understand how the site is used. You can change your choice at any time from “Cookie settings” in the footer.",
    accept: "Accept analytics", reject: "Reject non-essential", settings: "Cookie settings",
    privacy: "/privacy-policy/"
  };

  function readChoice() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || "null"); return v && typeof v === "object" ? v : null; } catch (e) { return null; }
  }
  function saveChoice(analytics) {
    try { localStorage.setItem(KEY, JSON.stringify({ analytics: !!analytics, ts: new Date().toISOString(), v: 1 })); } catch (e) {}
  }

  /* ---------- Google Analytics 4 (after opt-in only) ---------- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  function loadGA4() {
    var id = (window.DD_GA4_ID || "").trim();
    if (!id || ga4Loaded) return;
    ga4Loaded = true;
    window.gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);
    window.gtag("js", new Date());
    window.gtag("config", id, { anonymize_ip: true });
  }
  function disableGA4() {
    var id = (window.DD_GA4_ID || "").trim();
    if (id) window["ga-disable-" + id] = true;
    try { if (ga4Loaded) window.gtag("consent", "update", { analytics_storage: "denied" }); } catch (e) {}
  }
  function applyChoice(analytics) {
    analyticsOn = !!analytics;
    var id = (window.DD_GA4_ID || "").trim();
    if (analyticsOn) { if (id) window["ga-disable-" + id] = false; loadGA4(); try { if (ga4Loaded) window.gtag("consent", "update", { analytics_storage: "granted" }); } catch (e) {} }
    else disableGA4();
  }

  window.ddTrack = function (name, params) {
    try {
      window.dataLayer.push(Object.assign({ event: name }, params || {}));
      if (analyticsOn && ga4Loaded && typeof window.gtag === "function") window.gtag("event", name, params || {});
    } catch (e) {}
  };

  /* ---------- Cookie banner ---------- */
  var banner = null;
  function closeBanner() { if (banner && banner.parentNode) banner.parentNode.removeChild(banner); banner = null; }
  function openBanner() {
    if (banner) return;
    banner = document.createElement("div");
    banner.className = "dd-cookie";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", TXT.bTitle);
    if (ar) banner.setAttribute("dir", "rtl");
    banner.innerHTML = '<p class="dd-cookie-title"></p><p class="dd-cookie-text"></p><p class="dd-cookie-links"><a></a></p><div class="dd-cookie-row"><button type="button" class="dd-cookie-btn" data-act="reject"></button><button type="button" class="dd-cookie-btn" data-act="accept"></button></div>';
    banner.querySelector(".dd-cookie-title").textContent = TXT.bTitle;
    banner.querySelector(".dd-cookie-text").textContent = TXT.bText;
    var link = banner.querySelector(".dd-cookie-links a");
    link.textContent = TXT.policy; link.href = privacyHref();
    banner.querySelector('[data-act="reject"]').textContent = TXT.reject;
    banner.querySelector('[data-act="accept"]').textContent = TXT.accept;
    banner.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button[data-act]") : null;
      if (!b) return;
      var yes = b.getAttribute("data-act") === "accept";
      saveChoice(yes); applyChoice(yes); closeBanner();
    });
    document.body.appendChild(banner);
  }

  /* ---------- Footer "Cookie settings" link ---------- */
  function addSettingsLink() {
    var links = document.querySelectorAll("footer a");
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute("href") || "";
      if (/privacy-policy\/index\.html$/.test(href) && !/propai/.test(href)) {
        var btn = document.createElement("button");
        btn.type = "button"; btn.className = "hover:text-white dd-cookie-settings";
        btn.textContent = TXT.settings;
        btn.addEventListener("click", function () { openBanner(); });
        links[i].insertAdjacentElement("afterend", btn);
        return;
      }
    }
  }

  /* ---------- Form consent checkboxes ---------- */
  /* UAE visitor = on a /uae page, or device timezone is Dubai, or browser region is AE.
     (No network call, so no extra data is sent anywhere to guess the country.) */
  function isUAE() {
    if (/^\/uae(?:\/|$)/i.test(location.pathname)) return true;
    try { if (Intl.DateTimeFormat().resolvedOptions().timeZone === "Asia/Dubai") return true; } catch (e) {}
    try {
      var langs = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ""];
      for (var i = 0; i < langs.length; i++) if (/-AE$/i.test(langs[i])) return true;
    } catch (e) {}
    return false;
  }
  function privacyHref() {
    if (ar) return "/uae/ar/privacy-policy/";
    if (isUAE()) return "/uae/privacy-policy/";
    return "/privacy-policy/";
  }
  var uid = 0;
  function addConsent(form) {
    if (form.querySelector("[data-dd-consent]") || form.closest("#live-demo")) return;
    var btn = form.querySelector('button[type="submit"],input[type="submit"]');
    if (!btn) return;
    var hasContact = form.querySelector('input[type="email"],input[type="tel"],input[name="email"],input[name="phone"]');
    if (!hasContact) return;
    uid++;
    var box = document.createElement("div");
    box.className = "dd-consent-box";
    if (ar) box.setAttribute("dir", "rtl");
    var l1 = document.createElement("label"); l1.className = "dd-consent"; l1.setAttribute("for", "dd-consent-" + uid);
    var c1 = document.createElement("input"); c1.type = "checkbox"; c1.id = "dd-consent-" + uid; c1.name = "consent"; c1.required = true; c1.setAttribute("data-dd-consent", "privacy");
    var s1 = document.createElement("span");
    s1.appendChild(document.createTextNode(TXT.consent + " "));
    var a = document.createElement("a"); a.href = privacyHref(); a.target = "_blank"; a.rel = "noopener"; a.textContent = TXT.policy;
    s1.appendChild(a); s1.appendChild(document.createTextNode(TXT.consentEnd));
    l1.appendChild(c1); l1.appendChild(s1); box.appendChild(l1);
    if (form.querySelector('input[type="tel"],input[name="phone"]')) {
      var l2 = document.createElement("label"); l2.className = "dd-consent"; l2.setAttribute("for", "dd-consent-wa-" + uid);
      var c2 = document.createElement("input"); c2.type = "checkbox"; c2.id = "dd-consent-wa-" + uid; c2.name = "whatsapp_optin"; c2.setAttribute("data-dd-consent", "whatsapp");
      var s2 = document.createElement("span"); s2.textContent = TXT.wa;
      l2.appendChild(c2); l2.appendChild(s2); box.appendChild(l2);
    }
    var anchor = btn;
    while (anchor.parentElement && anchor.parentElement !== form) anchor = anchor.parentElement;
    form.insertBefore(box, anchor);
  }

  window.ddConsentCheck = function (form) {
    var c = form.querySelector('[data-dd-consent="privacy"]');
    if (!c) return { ok: true };
    if (!c.checked) { return { ok: false, message: TXT.err, focus: function () { c.focus(); } }; }
    var w = form.querySelector('[data-dd-consent="whatsapp"]');
    return { ok: true, data: { consent: "Yes - privacy policy accepted", consentAt: new Date().toISOString(), consentPage: location.href, whatsappOptIn: w && w.checked ? "Yes" : "No" } };
  };

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll("form"), addConsent);
    addSettingsLink();
    var ch = readChoice();
    if (ch) applyChoice(!!ch.analytics); else { applyChoice(false); openBanner(); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
