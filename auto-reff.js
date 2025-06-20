const puppeteer = require('puppeteer');
const axios = require('axios');

function generateRandomName() {
  const chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function getEmailOTP(login, domain) {
  for (let i = 0; i < 15; i++) {
    const { data: mails } = await axios.get(`https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`);
    if (mails.length > 0) {
      const mailId = mails[0].id;
      const { data: mail } = await axios.get(`https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${mailId}`);
      const otpMatch = mail.body.match(/\d{6}/);
      if (otpMatch) return otpMatch[0];
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  return null;
}

async function main() {
  const referralEmail = 'bazzz@1secmail.com';
  const referralEncoded = encodeURIComponent(referralEmail);
  const domain = '1secmail.com';
  const max = 5;

  for (let i = 0; i < max; i++) {
    const login = generateRandomName();
    const email = `${login}@${domain}`;
    console.log(`📨 Login sebagai: ${email}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();

    await page.goto(`https://early.dex.org/?ref=${referralEncoded}`, { waitUntil: 'networkidle2' });

    await page.waitForSelector('button', { timeout: 10000 });
    const buttons = await page.$$('button');
    await buttons[0].click();

    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', email);
    await page.click('button[type="submit"]');

    console.log('⌛ Menunggu OTP...');
    const otp = await getEmailOTP(login, domain);
    if (!otp) {
      console.log('❌ OTP gagal diterima');
      await browser.close();
      continue;
    }

    console.log(`✅ OTP: ${otp}`);
    await page.waitForSelector('input[type="text"]');
    await page.type('input[type="text"]', otp);
    await page.click('button[type="submit"]');

    await page.waitForTimeout(5000);
    console.log(`🎉 Referral sukses pakai ${email}`);
    await browser.close();
  }
}

main();
