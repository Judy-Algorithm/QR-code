const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");

test("mobile prototype exposes the requested route sequence", () => {
  ["/login", "/passport", "/face", "/topup", "/wallet", "/pass", "/pay", "/success", "/refund"].forEach((route) => {
    assert.match(script, new RegExp(`path:\\s*["']${route}["']`));
  });
});

test("home screen shows anonymous phone and tourist mode entry", () => {
  assert.match(script, /--/);
  assert.match(script, /Tourist Mode/);
});

test("login flow includes phone OTP actions", () => {
  assert.match(script, /sendOtp/i);
  assert.match(script, /generateOtp/i);
  assert.match(script, /fillOtp/i);
  assert.match(script, /sms-preview/i);
  assert.match(script, /验证码|verification code|SMS/i);
  assert.doesNotMatch(script, /Demo code: 123456/);
});

test("layout is tuned for Click SuperApp style mobile aspect", () => {
  assert.match(styles, /aspect-ratio:\s*9\s*\/\s*19\.5/);
  assert.match(html, /Click Tourist Mode/);
});
