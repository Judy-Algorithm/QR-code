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
  topupMethod: "cash",
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
  { path: "/pass", title: "Click Pass", render: renderPass },
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
    payWithClickPass: "Pay with Click Pass",
    refundBeforeDeparture: "Refund before departure",
    limits: "Temporary wallet limits",
  },
  zh: {
    homeBanner: "面向游客的护照支付入口",
    touristProfile: "游客访客",
    verified: "已验证",
    notStarted: "未开始",
    walletReady: "钱包已启用",
    walletLocked: "钱包未启用",
    payWithClickPass: "使用 Click Pass 支付",
    refundBeforeDeparture: "离境前退款",
    limits: "临时钱包限制",
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
        ${quickAction("barcode", "Click Pass", "/pass", !appState.walletActive)}
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
      ${progressHeader("4 / 8", "Top up wallet", "Choose cash desk or international card top-up for the temporary UZS wallet.")}
      <section class="method-switch" aria-label="Top up method">
        <button class="${appState.topupMethod === "cash" ? "selected" : ""}" type="button" data-method="cash">Cash point</button>
        <button class="${appState.topupMethod === "card" ? "selected" : ""}" type="button" data-method="card">Intl card</button>
      </section>
      <section class="wallet-panel">
        <span>Current balance</span>
        <strong>${formatUZS(appState.walletBalance)} UZS</strong>
      </section>
      <div class="amount-grid">
        ${amounts.map((amount) => `<button class="${amount === appState.topupAmount ? "selected" : ""}" type="button" data-amount="${amount}">${formatUZS(amount)}<span>UZS</span></button>`).join("")}
      </div>
      <section class="topup-place">
        ${appState.topupMethod === "cash" ? cashDeskMarkup() : cardMarkup()}
      </section>
      <section class="details-card">
        ${detail("Top-up amount", `${formatUZS(appState.topupAmount)} UZS`)}
        ${detail("Fee", appState.topupMethod === "cash" ? "0 UZS" : "1% card estimate")}
        ${detail("Wallet after top-up", `${formatUZS(appState.walletBalance + appState.topupAmount)} UZS`)}
      </section>
      <button class="primary-action" type="button" data-action="topup">Top up wallet</button>
    </div>
  `;
}

function renderWallet() {
  return `
    <div class="flow-screen">
      ${progressHeader("5 / 8", "Tourist wallet", "The wallet can pay selected Click merchants and refund the remaining balance before departure.")}
      <section class="wallet-ticket">
        <span>Available balance</span>
        <strong>${formatUZS(appState.walletBalance)} UZS</strong>
        <p>Valid until 2026-06-10</p>
      </section>
      ${limitCard()}
      <div class="action-stack">
        <button class="primary-action" type="button" data-go="/pass" ${appState.walletBalance >= PAYMENT_AMOUNT ? "" : "disabled"}>${t("payWithClickPass")}</button>
        <button class="secondary-action wide" type="button" data-go="/refund">${t("refundBeforeDeparture")}</button>
      </div>
    </div>
  `;
}

function renderPass() {
  return `
    <div class="flow-screen">
      ${progressHeader("6 / 8", "Click Pass", "Show the QR code to the cashier. The code refreshes every 60 seconds.")}
      <section class="click-pass-card">
        <span>Click Pass</span>
        <div class="qr-pattern" aria-label="Demo QR code"></div>
        <strong>TM-${String(appState.walletBalance).slice(0, 3)}-UZ</strong>
        <p>Valid for 60 seconds</p>
      </section>
      <section class="merchant-strip">
        <div>SC</div>
        <span>
          <strong>Samarkand Coffee</strong>
          <small>Cashier scanned visitor Click Pass</small>
        </span>
      </section>
      <button class="primary-action" type="button" data-go="/pay">Review merchant request</button>
    </div>
  `;
}

function renderPay() {
  const afterPayment = Math.max(0, appState.walletBalance - PAYMENT_AMOUNT);
  return `
    <div class="flow-screen">
      ${progressHeader("7 / 8", "Payment confirmation", "Review the merchant, amount, and remaining balance before paying.")}
      <section class="merchant-card">
        <div>SC</div>
        <h2>Samarkand Coffee</h2>
        <p>Merchant QR payment</p>
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
        <p>${formatUZS(PAYMENT_AMOUNT)} UZS paid to Samarkand Coffee.</p>
      </section>
      <section class="details-card">
        ${detail("Merchant", "Samarkand Coffee")}
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
        <p>${appState.refunded ? "Refund completed. Tourist Mode is closed." : "Refund to original top-up method or airport partner desk."}</p>
      </section>
      <section class="details-card">
        ${detail("Passport profile", appState.passportScanned ? "ANNA TOURIST" : "--")}
        ${detail("Refund method", appState.topupMethod === "cash" ? "Partner cash desk" : "International card")}
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
      <button class="back-link" type="button" data-action="back">Back</button>
      <span>${step}</span>
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
      ${detail("Validity", "30 days")}
      ${detail("Max balance", "1,000,000 UZS")}
      ${detail("Single payment", "300,000 UZS")}
      ${detail("P2P transfers", "Disabled")}
    </section>
  `;
}

function cashDeskMarkup() {
  return `
    <div class="cash-map">
      <span class="map-pin">C</span>
    </div>
    <div>
      <strong>Tashkent Airport Click desk</strong>
      <small>Arrival hall, open 24 hours</small>
    </div>
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
      <small>Demo risk review passed</small>
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
    topupMethod: "cash",
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
  const methodTarget = event.target.closest("[data-method]");
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

  if (methodTarget) {
    appState.topupMethod = methodTarget.dataset.method;
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
