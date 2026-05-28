const appState = {
  locale: "en",
  phone: "+998 90 123 45 67",
  otpSent: false,
  otp: "",
  smsCode: "",
  otpError: "",
  countdown: 0,
  registered: false,
  passportScanned: false,
  faceVerified: false,
  topupAmount: 300000,
  walletBalance: 0,
  walletActive: false,
  pin: "",
  paid: false,
  refunded: false,
};

const routes = [
  { path: "/", title: "Click SuperApp", render: renderHome },
  { path: "/login", title: "Phone verification", render: renderLogin },
  { path: "/passport", title: "Passport scan", render: renderPassport },
  { path: "/face", title: "Face verification", render: renderFace },
  { path: "/topup", title: "Top up wallet", render: renderTopup },
  { path: "/wallet", title: "Tourist wallet", render: renderWallet },
  { path: "/pass", title: "Payment method", render: renderPass },
  { path: "/pay", title: "Payment confirmation", render: renderPay },
  { path: "/success", title: "Payment successful", render: renderSuccess },
  { path: "/refund", title: "Departure refund", render: renderRefund },
];

const copy = {
  en: {
    homeBanner: "Passport-based payment access for visitors",
    touristProfile: "Tourist visitor",
    verified: "Verified",
    notStarted: "Not started",
    walletReady: "Wallet active",
    walletLocked: "Wallet locked",
    choosePaymentMethod: "Choose payment method",
    refundBeforeDeparture: "Refund before departure",
    limits: "Travel wallet safeguards",
  },
  zh: {
    homeBanner: "面向游客的护照支付入口",
    touristProfile: "游客访客",
    verified: "已验证",
    notStarted: "未开始",
    walletReady: "钱包已启用",
    walletLocked: "钱包未启用",
    choosePaymentMethod: "选择支付方式",
    refundBeforeDeparture: "离境前退款",
    limits: "旅行钱包保护",
  },
};

const screen = document.querySelector("#screen");
let countdownTimer = null;
const BASE_PATH = window.location.pathname.startsWith("/QR-code") ? "/QR-code" : "";
const PAYMENT_AMOUNT = 45000;

function t(key) {
  return copy[appState.locale][key];
}

function getCurrentPath() {
  const path = window.location.pathname.replace(BASE_PATH, "") || "/";
  return routes.some((route) => route.path === path) ? path : "/";
}

function routeIndex(path = getCurrentPath()) {
  return Math.max(0, routes.findIndex((route) => route.path === path));
}

function navigate(path) {
  window.history.pushState({}, "", `${BASE_PATH}${path}`);
  render();
}

function render() {
  const current = routes[routeIndex()];
  document.title = `${current.title} | Click Tourist Mode`;
  screen.innerHTML = current.render();
}

function renderHome() {
  const status = appState.walletActive ? t("walletReady") : t("walletLocked");
  return `
    <div class="home-screen">
      ${demoControls()}
      <section class="balance-card">
        <div class="mini-profile">
          <span class="user-icon"></span>
          <div>
            <small>${t("touristProfile")}</small>
            <strong>${appState.registered ? appState.phone : "--"}</strong>
          </div>
        </div>
        <p>Tourist wallet</p>
        <strong class="balance">${formatUZS(appState.walletBalance)} <span>UZS</span></strong>
        <div class="wallet-row">
          <span>${status}</span>
          <b>${appState.passportScanned ? t("verified") : t("notStarted")}</b>
          <button type="button" data-go="${appState.walletActive ? "/pass" : "/login"}">
            ${appState.walletActive ? "Open Pass" : "Start"}
          </button>
        </div>
      </section>

      <section class="quick-grid" aria-label="Quick actions">
        ${quickAction("barcode", "Pay", "/pass", !appState.walletActive)}
        ${quickAction("phone-icon", "Top up", "/topup", !appState.faceVerified)}
        ${quickAction("card", "Refund", "/refund", !appState.walletActive)}
        ${quickAction("qr", "QR Scanner", "/pay", !appState.walletActive)}
      </section>

      <button class="tourist-banner" type="button" data-go="${appState.walletActive ? "/wallet" : "/login"}">
        <span>Tourist Mode</span>
        <strong>${t("homeBanner")}</strong>
      </button>

      <section class="mini-apps">
        <div class="section-title">
          <h1>Mini Apps</h1>
          <button type="button">See all</button>
        </div>
        <div class="mini-grid">
          ${miniApp("orange", "Mobile")}
          ${miniApp("purple", "Hotels")}
          ${miniApp("green", "Transport")}
          ${miniApp("blue", "Click Travel")}
          ${miniApp("pink", "Tickets")}
          ${miniApp("red", "Food")}
          ${miniApp("violet", "Museums")}
          ${miniApp("emerald", "Receipts")}
        </div>
      </section>
    </div>
  `;
}

function renderLogin() {
  if (appState.registered) {
    return `
      <div class="flow-screen">
        ${progressHeader("1 / 8", "Phone verified", "This temporary visitor session is linked to your contact number.")}
        <section class="success-card compact-success">
          <div>OK</div>
          <h2>Registration successful</h2>
          <p>${appState.phone} can now continue to passport verification.</p>
        </section>
        <button class="primary-action" type="button" data-go="/passport">Continue to passport scan</button>
      </div>
    `;
  }

  return `
    <div class="flow-screen">
      ${progressHeader("1 / 8", "Phone verification", "Use any reachable mobile number to receive a Tourist Mode SMS code.")}
      <label class="input-card">
        <span>Mobile phone</span>
        <input id="phone-input" inputmode="tel" autocomplete="tel" value="${appState.phone}" />
      </label>
      <div class="otp-row">
        <label class="input-card">
          <span>Verification code</span>
          <input id="otp-input" inputmode="numeric" maxlength="6" value="${appState.otp}" placeholder="6-digit code" />
        </label>
        <button class="secondary-action" type="button" data-action="sendOtp">
          ${appState.countdown > 0 ? `${appState.countdown}s` : appState.otpSent ? "Resend" : "Send"}
        </button>
      </div>
      ${appState.smsCode ? renderSmsPreview() : ""}
      ${appState.otpError ? `<p class="${appState.otpError.includes("sent") ? "form-hint" : "form-error"}">${appState.otpError}</p>` : ""}
      <button class="primary-action" type="button" data-action="verifyOtp">Verify and continue</button>
    </div>
  `;
}

function renderPassport() {
  return `
    <div class="flow-screen">
      ${progressHeader("2 / 8", "Passport scan", "Scan the passport photo page. The visitor account stays temporary and limited.")}
      <section class="scanner passport-scanner ${appState.passportScanned ? "done" : ""}">
        <div class="scan-line"></div>
        <div class="passport-card">
          <span></span><span></span><span></span>
        </div>
      </section>
      <button class="secondary-action wide" type="button" data-action="scanPassport">
        ${appState.passportScanned ? "Scan completed" : "Start scan"}
      </button>
      <section class="details-card">
        ${detail("Name", appState.passportScanned ? "ANNA TOURIST" : "--")}
        ${detail("Nationality", appState.passportScanned ? "Germany" : "--")}
        ${detail("Passport No.", appState.passportScanned ? "C01X204877" : "--")}
        ${detail("Departure", appState.passportScanned ? "2026-06-10" : "--")}
      </section>
      <button class="primary-action" type="button" data-go="/face" ${appState.passportScanned ? "" : "disabled"}>Confirm passport</button>
    </div>
  `;
}

function renderFace() {
  return `
    <div class="flow-screen">
      ${progressHeader("3 / 8", "Face verification", "Match live face with the passport photo before enabling payments.")}
      <section class="scanner face-scanner ${appState.faceVerified ? "done" : ""}">
        <div class="face"></div>
        <p>${appState.faceVerified ? "Face matched" : "Look straight at the screen"}</p>
      </section>
      <button class="secondary-action wide" type="button" data-action="verifyFace">
        ${appState.faceVerified ? "Verified" : "Start face check"}
      </button>
      ${limitCard()}
      <button class="primary-action" type="button" data-go="/topup" ${appState.faceVerified ? "" : "disabled"}>Create visitor wallet</button>
    </div>
  `;
}

function renderTopup() {
  const amounts = [100000, 300000, 500000, 750000];
  return `
    <div class="flow-screen">
      ${progressHeader("4 / 8", "Top up wallet", "Add UZS to the visitor wallet with an international card.")}
      <section class="wallet-panel">
        <span>Current balance</span>
        <strong>${formatUZS(appState.walletBalance)} UZS</strong>
      </section>
      <div class="amount-grid">
        ${amounts.map((amount) => `<button class="${amount === appState.topupAmount ? "selected" : ""}" type="button" data-amount="${amount}">${formatUZS(amount)}<span>UZS</span></button>`).join("")}
      </div>
      <section class="topup-place">
        ${cardMarkup()}
      </section>
      <section class="details-card">
        ${detail("Top-up amount", `${formatUZS(appState.topupAmount)} UZS`)}
        ${detail("Fee", "Shown before confirmation")}
        ${detail("Wallet after top-up", `${formatUZS(appState.walletBalance + appState.topupAmount)} UZS`)}
      </section>
      <button class="primary-action" type="button" data-action="topup">Top up wallet</button>
    </div>
  `;
}

function renderWallet() {
  return `
    <div class="flow-screen">
      ${progressHeader("5 / 8", "Tourist wallet", "Use the visitor wallet to pay or transfer, then refund the remaining balance before departure.")}
      <section class="wallet-ticket">
        <span>Available balance</span>
        <strong>${formatUZS(appState.walletBalance)} UZS</strong>
        <p>Valid until 2026-06-10</p>
      </section>
      ${limitCard()}
      <div class="action-stack">
        <button class="primary-action" type="button" data-go="/pass" ${appState.walletBalance >= PAYMENT_AMOUNT ? "" : "disabled"}>${t("choosePaymentMethod")}</button>
        <button class="secondary-action wide" type="button" data-go="/refund">${t("refundBeforeDeparture")}</button>
      </div>
    </div>
  `;
}

function renderPass() {
  return `
    <div class="flow-screen">
      ${progressHeader("6 / 8", "Choose payment", "Pay a shop or transfer to another Click user.")}
      <section class="payment-options" aria-label="Payment options">
        <button class="payment-option selected" type="button">
          <span>1</span>
          <strong>Show my code</strong>
          <small>Recipient scans you</small>
        </button>
        <button class="payment-option" type="button" data-go="/pay">
          <span>2</span>
          <strong>Scan or transfer</strong>
          <small>Scan QR or choose contact</small>
        </button>
      </section>
      <section class="click-pass-card">
        <span>My payment code</span>
        ${qrPattern()}
        <strong>TM-${String(appState.walletBalance).slice(0, 3)}-UZ</strong>
        <p>Valid for 60 seconds</p>
      </section>
      <button class="primary-action" type="button" data-go="/pay">Review payment request</button>
    </div>
  `;
}

function renderPay() {
  const afterPayment = Math.max(0, appState.walletBalance - PAYMENT_AMOUNT);
  return `
    <div class="flow-screen">
      ${progressHeader("7 / 8", "Payment confirmation", "Review the recipient, amount, and remaining balance before paying.")}
      <section class="merchant-card">
        <div>SC</div>
        <h2>Samarkand Coffee</h2>
        <p>QR payment request</p>
      </section>
      <section class="details-card">
        ${detail("Amount", `${formatUZS(PAYMENT_AMOUNT)} UZS`)}
        ${detail("Balance", `${formatUZS(appState.walletBalance)} UZS`)}
        ${detail("After payment", `${formatUZS(afterPayment)} UZS`)}
      </section>
      <label class="input-card">
        <span>Payment PIN</span>
        <input id="pin-input" inputmode="numeric" maxlength="4" value="${appState.pin}" placeholder="0000" />
      </label>
      ${appState.otpError ? `<p class="form-error">${appState.otpError}</p>` : ""}
      <button class="primary-action" type="button" data-action="pay" ${appState.walletBalance >= PAYMENT_AMOUNT ? "" : "disabled"}>Confirm payment</button>
    </div>
  `;
}

function renderSuccess() {
  return `
    <div class="flow-screen">
      ${progressHeader("8 / 8", "Payment successful", "Receipt saved in the tourist visitor wallet.")}
      <section class="success-card">
        <div>OK</div>
        <h2>Payment successful</h2>
        <p>${formatUZS(PAYMENT_AMOUNT)} UZS sent to Samarkand Coffee.</p>
      </section>
      <section class="details-card">
        ${detail("Recipient", "Samarkand Coffee")}
        ${detail("Time", "Today, 14:32")}
        ${detail("Transaction ID", "TM-20260528-01432")}
        ${detail("Remaining", `${formatUZS(appState.walletBalance)} UZS`)}
      </section>
      <div class="action-stack">
        <button class="primary-action" type="button" data-go="/wallet">Back to wallet</button>
        <button class="secondary-action wide" type="button" data-go="/refund">Refund before departure</button>
      </div>
    </div>
  `;
}

function renderRefund() {
  const canRefund = appState.walletBalance > 0 && !appState.refunded;
  return `
    <div class="flow-screen">
      ${progressHeader("Exit", "Departure refund", "Close the temporary wallet and return remaining funds before leaving Uzbekistan.")}
      <section class="wallet-ticket refund">
        <span>Refundable balance</span>
        <strong>${formatUZS(appState.walletBalance)} UZS</strong>
        <p>${appState.refunded ? "Refund completed to original card." : "Refund remaining balance to the original card."}</p>
      </section>
      <section class="details-card">
        ${detail("Passport profile", appState.passportScanned ? "ANNA TOURIST" : "--")}
        ${detail("Refund method", "Original card")}
        ${detail("Wallet status", appState.refunded ? "Closed" : "Active")}
      </section>
      <div class="action-stack">
        <button class="primary-action" type="button" data-action="refund" ${canRefund ? "" : "disabled"}>${appState.refunded ? "Refund completed" : "Confirm refund"}</button>
        <button class="secondary-action wide" type="button" data-go="/">Back home</button>
      </div>
    </div>
  `;
}

function demoControls() {
  return `
    <section class="demo-controls" aria-label="Prototype controls">
      <button class="${appState.locale === "en" ? "selected" : ""}" type="button" data-locale="en">EN</button>
      <button class="${appState.locale === "zh" ? "selected" : ""}" type="button" data-locale="zh">中文</button>
      <button type="button" data-action="reset">Reset</button>
    </section>
  `;
}

function progressHeader(step, title, subtitle) {
  const numericStep = Number.parseInt(step, 10);
  const progress = Number.isFinite(numericStep) ? Math.min(100, Math.round((numericStep / 8) * 100)) : 100;
  return `
    <header class="flow-header">
      <h1>${title}</h1>
      <p>${subtitle}</p>
      <div class="flow-progress"><i style="width:${progress}%"></i></div>
    </header>
  `;
}

function quickAction(icon, label, path, disabled = false) {
  return `<button type="button" data-go="${path}" ${disabled ? "disabled" : ""}><span class="qa-icon ${icon}"></span>${label}</button>`;
}

function miniApp(color, label) {
  return `<button type="button"><span class="${color}"></span>${label}</button>`;
}

function detail(label, value) {
  return `<div class="detail-row"><span>${label}</span><strong>${value}</strong></div>`;
}

function limitCard() {
  return `
    <section class="details-card limit-card">
      <h2>${t("limits")}</h2>
      ${detail("Wallet works until", "Departure")}
      ${detail("Refund goes to", "Original card")}
    </section>
  `;
}

function cardMarkup() {
  return `
    <div class="card-on-file">
      <span>VISA</span>
      <strong>${maskCard("4111 1111 1111 2345")}</strong>
    </div>
    <div>
      <strong>International card top-up</strong>
      <small>Card is charged securely; wallet receives UZS</small>
    </div>
  `;
}

function qrPattern() {
  const modules = [
    [8, 1], [10, 1], [8, 2], [11, 2], [14, 2], [16, 2],
    [7, 4], [9, 4], [11, 4], [14, 4], [7, 5], [10, 5], [12, 5], [16, 5],
    [2, 8], [4, 8], [6, 8], [9, 8], [13, 8], [15, 8], [17, 8],
    [8, 10], [11, 10], [12, 10], [15, 10], [2, 11], [5, 11], [9, 11], [14, 11],
    [8, 13], [10, 13], [12, 13], [16, 13], [7, 15], [9, 15], [11, 15], [13, 15], [15, 15], [17, 15],
    [8, 17], [10, 17], [14, 17], [16, 17],
  ];
  return `
    <div class="qr-pattern" aria-label="Demo QR code">
      <span class="qr-finder top-left"></span>
      <span class="qr-finder top-right"></span>
      <span class="qr-finder bottom-left"></span>
      ${modules.map(([col, row]) => `<i style="grid-column:${col};grid-row:${row}"></i>`).join("")}
    </div>
  `;
}

function maskCard(value) {
  const digits = value.replace(/\D/g, "");
  return `••••  ••••  ••••  ${digits.slice(-4) || "2345"}`;
}

function formatUZS(value) {
  return new Intl.NumberFormat("en-US").format(value).replaceAll(",", " ");
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function renderSmsPreview() {
  return `
    <section class="sms-preview" aria-label="Incoming SMS verification code">
      <div>
        <span>SMS from Click</span>
        <strong>${appState.smsCode}</strong>
      </div>
      <p>Your Tourist Mode verification code is ${appState.smsCode}. It is valid for 5 minutes.</p>
      <button type="button" data-action="fillOtp">Use this code</button>
    </section>
  `;
}

function isValidPhone(value) {
  return value.replace(/\D/g, "").length >= 8;
}

function sendOtp() {
  appState.phone = document.querySelector("#phone-input")?.value.trim() || "";
  if (!isValidPhone(appState.phone)) {
    appState.otpError = "Please enter your mobile phone number first.";
    render();
    return;
  }
  appState.smsCode = generateOtp();
  appState.otpSent = true;
  appState.registered = false;
  appState.otp = "";
  appState.otpError = "SMS verification code sent.";
  appState.countdown = 30;
  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    appState.countdown -= 1;
    if (appState.countdown <= 0) {
      clearInterval(countdownTimer);
      appState.countdown = 0;
    }
    if (getCurrentPath() === "/login") render();
  }, 1000);
  render();
}

function verifyOtp() {
  appState.otp = document.querySelector("#otp-input")?.value.trim() || "";
  if (!appState.smsCode) {
    appState.otpError = "Send an SMS verification code first.";
    render();
    return;
  }
  if (appState.otp !== appState.smsCode) {
    appState.otpError = "The verification code is incorrect. Please check the SMS and try again.";
    render();
    return;
  }
  appState.registered = true;
  appState.otpError = "";
  render();
}

function resetDemo() {
  Object.assign(appState, {
    otpSent: false,
    otp: "",
    smsCode: "",
    otpError: "",
    countdown: 0,
    registered: false,
    passportScanned: false,
    faceVerified: false,
    topupAmount: 300000,
    walletBalance: 0,
    walletActive: false,
    pin: "",
    paid: false,
    refunded: false,
  });
  clearInterval(countdownTimer);
  navigate("/");
}

screen.addEventListener("click", (event) => {
  const localeTarget = event.target.closest("[data-locale]");
  const amountTarget = event.target.closest("[data-amount]");
  const goTarget = event.target.closest("[data-go]");
  const actionTarget = event.target.closest("[data-action]");

  if (localeTarget) {
    appState.locale = localeTarget.dataset.locale;
    render();
    return;
  }

  if (amountTarget) {
    appState.topupAmount = Number(amountTarget.dataset.amount);
    render();
    return;
  }

  if (goTarget && !goTarget.disabled) {
    navigate(goTarget.dataset.go);
    return;
  }

  if (!actionTarget || actionTarget.disabled) return;
  const action = actionTarget.dataset.action;

  if (action === "back") {
    window.history.back();
  } else if (action === "sendOtp") {
    sendOtp();
  } else if (action === "fillOtp") {
    appState.otp = appState.smsCode;
    render();
  } else if (action === "verifyOtp") {
    verifyOtp();
  } else if (action === "scanPassport") {
    appState.passportScanned = true;
    render();
  } else if (action === "verifyFace") {
    appState.faceVerified = true;
    render();
  } else if (action === "topup") {
    appState.walletBalance += appState.topupAmount;
    appState.walletActive = true;
    appState.refunded = false;
    navigate("/wallet");
  } else if (action === "pay") {
    appState.pin = document.querySelector("#pin-input")?.value.trim() || "";
    if (appState.pin.length !== 4) {
      appState.otpError = "Enter a 4-digit payment PIN.";
      render();
      return;
    }
    appState.walletBalance -= PAYMENT_AMOUNT;
    appState.paid = true;
    appState.otpError = "";
    navigate("/success");
  } else if (action === "refund") {
    appState.walletBalance = 0;
    appState.walletActive = false;
    appState.refunded = true;
    render();
  } else if (action === "reset") {
    resetDemo();
  }
});

screen.addEventListener("input", (event) => {
  if (event.target.id === "otp-input") appState.otp = event.target.value;
  if (event.target.id === "phone-input") appState.phone = event.target.value;
  if (event.target.id === "pin-input") appState.pin = event.target.value;
});

window.addEventListener("popstate", render);
render();
