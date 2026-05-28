# Click Tourist Mode QR Demo

Mobile-first static prototype for a QR-scanned Click SuperApp style tourist payment flow.

## Flow

- `/` Click-style home screen with anonymous phone shown as `--` and a green `Tourist Mode` entry.
- `/login` phone verification code login. Demo OTP: `123456`.
- `/passport` passport scan simulation.
- `/face` face verification simulation.
- `/card` bank card binding.
- `/topup` tourist wallet top-up.
- `/pay` payment confirmation.
- `/success` payment receipt.

## Local Preview

```bash
npm start
```

Open `http://127.0.0.1:4173/`.

## Test

```bash
npm test
```

## QR Usage

After deploying with GitHub Pages, create a QR code for the Pages URL, for example:

```text
https://judy-algorithm.github.io/QR-code/
```
