const appState = {
  phone: "+998 90 123 45 67",
  otpSent: false,
  otp: "",
  otpError: "",
  countdown: 0,
  passportScanned: false,
  faceVerified: false,
  cardNumber: "4111 1111 1111 2345",
  topupAmount: "300,000",
  paid: false,
};

const routes = [
  { path: "/", title: "Click SuperApp", action: "Open Tourist Mode", render: renderHome },
  { path: "/login", title: "Phone verification", action: "Verify code", render: renderLogin },
  { path: "/passport", title: "Passport scan", action: "Confirm passport", render: renderPassport },
  { path: "/face", title: "Face verification", action: "Continue", render: renderFace },
  { path: "/card", title: "Bank card", action: "Bind card", render: renderCard },
  { path: "/topup", title: "Top up", action: "Top up wallet", render: renderTopup },
  { path: "/pay", title: "Payment confirmation", action: "Confirm payment", render: renderPay },
  { path: "/success", title: "Payment successful", action: "Back home", render: renderSuccess },
];

const screen = document.querySelector("#screen");
let countdownTimer = null;
const BASE_PATH = window.location.pathname.startsWith("/QR-code") ? "/QR-code" : "";

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

function nextRoute() {
  const index = routeIndex();
  return routes[Math.min(index + 1, routes.length - 1)].path;
}

function render() {
  const current = routes[routeIndex()];
  document.title = `${current.title} | Click Tourist Mode`;
  screen.innerHTML = current.render();
}

function renderHome() {
  return `
    <div class="home-screen">
      <section class="balance-card">
        <div class="mini-profile">
          <span class="user-icon"></span>
          <div>
            <small>Phone number</small>
            <strong>--</strong>
          </div>
        </div>
        <p>Total balance</p>
        <strong class="balance">128 256 512 <span>UZS</span></strong>
        <div class="wallet-row">
          <span>My Wallet</span>
          <b>64 128 UZS</b>
          <button type="button">Click Marathon</button>
        </div>
      </section>

      <section class="quick-grid" aria-label="Quick actions">
        ${quickAction("barcode", "Click Pass")}
        ${quickAction("phone-icon", "Click Boom")}
        ${quickAction("card", "Cards and Wallet")}
        ${quickAction("qr", "QR Scanner")}
      </section>

      <button class="tourist-banner" type="button" data-go="/login" aria-label="Open Tourist Mode">
        <span>Tourist Mode</span>
        <strong>Passport-based payment access for visitors</strong>
      </button>

      <section class="mini-apps">
        <div class="section-title">
          <h1>Mini Apps</h1>
          <button type="button">See all</button>
        </div>
        <div class="mini-grid">
          ${miniApp("orange", "Mobile")}
          ${miniApp("purple", "My House")}
          ${miniApp("green", "My Car")}
          ${miniApp("blue", "Click Marathon")}
          ${miniApp("pink", "Tickets")}
          ${miniApp("red", "Bringo")}
          ${miniApp("violet", "Click Travel")}
          ${miniApp("emerald", "Yashil Meros")}
        </div>
      </section>
    </div>
  `;
}

function renderLogin() {
  return `
    <div class="flow-screen">
      ${stepHeader("1 / 7", "手机号验证码登录", "Use SMS verification before visitor KYC. Demo code: 123456.")}
      <label class="input-card">
        <span>Mobile phone</span>
        <input id="phone-input" inputmode="tel" value="${appState.phone}" />
      </label>
      <div class="otp-row">
        <label class="input-card">
          <span>Verification code</span>
          <input id="otp-input" inputmode="numeric" maxlength="6" value="${appState.otp}" placeholder="123456" />
        </label>
        <button class="secondary-action" type="button" data-action="sendOtp">
          ${appState.countdown > 0 ? `${appState.countdown}s` : appState.otpSent ? "Resend" : "Send"}
        </button>
      </div>
      ${appState.otpError ? `<p class="form-error">${appState.otpError}</p>` : ""}
      <button class="primary-action" type="button" data-action="verifyOtp">Verify and continue</button>
    </div>
  `;
}

function renderPassport() {
  return `
    <div class="flow-screen">
      ${stepHeader("2 / 7", "护照扫描", "Place the passport photo page inside the frame.")}
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
        ${detail("Expiry", appState.passportScanned ? "2031-09-18" : "--")}
      </section>
      <button class="primary-action" type="button" data-go="/face" ${appState.passportScanned ? "" : "disabled"}>Confirm passport</button>
    </div>
  `;
}

function renderFace() {
  return `
    <div class="flow-screen">
      ${stepHeader("3 / 7", "人脸验证", "Match live face with the passport photo.")}
      <section class="scanner face-scanner ${appState.faceVerified ? "done" : ""}">
        <div class="face"></div>
        <p>${appState.faceVerified ? "Face matched" : "Look straight at the screen"}</p>
      </section>
      <button class="secondary-action wide" type="button" data-action="verifyFace">
        ${appState.faceVerified ? "Verified" : "Start face check"}
      </button>
      <section class="details-card">
        ${detail("Validity", "30 days")}
        ${detail("Max balance", "1,000,000 UZS")}
        ${detail("Transfers", "Disabled")}
      </section>
      <button class="primary-action" type="button" data-go="/card" ${appState.faceVerified ? "" : "disabled"}>Continue</button>
    </div>
  `;
}

function renderCard() {
  return `
    <div class="flow-screen">
      ${stepHeader("4 / 7", "绑定银行卡", "Bind an international bank card for tourist wallet top-up.")}
      <section class="bank-preview">
        <span>VISA</span>
        <strong>${maskCard(appState.cardNumber)}</strong>
        <small>ANNA TOURIST</small>
      </section>
      <label class="input-card">
        <span>Card number</span>
        <input id="card-input" inputmode="numeric" value="${appState.cardNumber}" />
      </label>
      <div class="two-col">
        <label class="input-card"><span>Expiry</span><input value="09/31" /></label>
        <label class="input-card"><span>CVV</span><input value="123" /></label>
      </div>
      <label class="input-card">
        <span>Cardholder</span>
        <input value="ANNA TOURIST" />
      </label>
      <button class="primary-action" type="button" data-go="/topup">Bind card</button>
    </div>
  `;
}

function renderTopup() {
  const amounts = ["100,000", "300,000", "500,000", "Custom"];
  return `
    <div class="flow-screen">
      ${stepHeader("5 / 7", "充值", "Choose an amount to credit the temporary UZS wallet.")}
      <section class="wallet-panel">
        <span>Current balance</span>
        <strong>0 UZS</strong>
      </section>
      <div class="amount-grid">
        ${amounts.map((amount) => `<button class="${amount === appState.topupAmount ? "selected" : ""}" type="button" data-amount="${amount}">${amount}<span>UZS</span></button>`).join("")}
      </div>
      <section class="details-card">
        ${detail("Top-up amount", `${appState.topupAmount} UZS`)}
        ${detail("Fee", "0 UZS")}
        ${detail("Wallet after top-up", `${appState.topupAmount} UZS`)}
      </section>
      <button class="primary-action" type="button" data-go="/pay">Top up wallet</button>
    </div>
  `;
}

function renderPay() {
  return `
    <div class="flow-screen">
      ${stepHeader("6 / 7", "支付确认", "Review merchant and balance before confirming.")}
      <section class="merchant-card">
        <div>SC</div>
        <h2>Samarkand Coffee</h2>
        <p>Merchant QR payment</p>
      </section>
      <section class="details-card">
        ${detail("Amount", "45,000 UZS")}
        ${detail("Balance", `${appState.topupAmount} UZS`)}
        ${detail("After payment", "255,000 UZS")}
      </section>
      <label class="input-card">
        <span>Payment PIN</span>
        <input inputmode="numeric" maxlength="4" value="0000" />
      </label>
      <button class="primary-action" type="button" data-action="pay">Confirm payment</button>
    </div>
  `;
}

function renderSuccess() {
  return `
    <div class="flow-screen">
      ${stepHeader("7 / 7", "支付成功", "Receipt saved for the tourist visitor wallet.")}
      <section class="success-card">
        <div>OK</div>
        <h2>Payment successful</h2>
        <p>45,000 UZS paid to Samarkand Coffee.</p>
      </section>
      <section class="details-card">
        ${detail("Merchant", "Samarkand Coffee")}
        ${detail("Time", "Today, 14:32")}
        ${detail("Transaction ID", "TM-20260528-01432")}
        ${detail("Remaining", "255,000 UZS")}
      </section>
      <button class="primary-action" type="button" data-go="/">Back home</button>
    </div>
  `;
}

function quickAction(icon, label) {
  return `<button type="button"><span class="qa-icon ${icon}"></span>${label}</button>`;
}

function miniApp(color, label) {
  return `<button type="button"><span class="${color}"></span>${label}</button>`;
}

function stepHeader(step, title, subtitle) {
  return `
    <header class="flow-header">
      <button class="back-link" type="button" data-action="back">Back</button>
      <span>${step}</span>
      <h1>${title}</h1>
      <p>${subtitle}</p>
    </header>
  `;
}

function detail(label, value) {
  return `<div class="detail-row"><span>${label}</span><strong>${value}</strong></div>`;
}

function maskCard(value) {
  const digits = value.replace(/\D/g, "");
  return `••••  ••••  ••••  ${digits.slice(-4) || "2345"}`;
}

function sendOtp() {
  appState.phone = document.querySelector("#phone-input")?.value || appState.phone;
  appState.otpSent = true;
  appState.otpError = "Verification code sent. Use 123456 for this demo.";
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
  if (appState.otp !== "123456") {
    appState.otpError = "Please enter the 6-digit verification code: 123456.";
    render();
    return;
  }
  appState.otpError = "";
  navigate("/passport");
}

screen.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  const goTarget = event.target.closest("[data-go]");
  const amountTarget = event.target.closest("[data-amount]");

  if (amountTarget) {
    appState.topupAmount = amountTarget.dataset.amount;
    render();
    return;
  }

  if (goTarget && !goTarget.disabled) {
    navigate(goTarget.dataset.go);
    return;
  }

  if (!actionTarget) return;
  const action = actionTarget.dataset.action;

  if (action === "back") {
    window.history.back();
  } else if (action === "sendOtp") {
    sendOtp();
  } else if (action === "verifyOtp") {
    verifyOtp();
  } else if (action === "scanPassport") {
    appState.passportScanned = true;
    render();
  } else if (action === "verifyFace") {
    appState.faceVerified = true;
    render();
  } else if (action === "pay") {
    appState.paid = true;
    navigate("/success");
  }
});

screen.addEventListener("input", (event) => {
  if (event.target.id === "otp-input") appState.otp = event.target.value;
  if (event.target.id === "phone-input") appState.phone = event.target.value;
  if (event.target.id === "card-input") appState.cardNumber = event.target.value;
});

window.addEventListener("popstate", render);
render();
