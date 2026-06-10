// Dev-only: capture verification screenshots of the local preview.
import puppeteer from 'puppeteer';

const URL = 'http://localhost:4321/';
const out = (n) => `docs/_verify-${n}.png`;

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();

const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

// Desktop dark
await page.setViewport({ width: 1440, height: 900 });
await page.goto(URL, { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 1600));
await page.screenshot({ path: out('desktop-dark-hero') });
await page.evaluate(() => document.querySelector('#work').scrollIntoView());
await new Promise(r => setTimeout(r, 1200));
await page.screenshot({ path: out('desktop-dark-work') });
await page.evaluate(() => document.querySelector('#skills').scrollIntoView());
await new Promise(r => setTimeout(r, 1200));
await page.screenshot({ path: out('desktop-dark-skills') });
await page.evaluate(() => document.querySelector('#contact').scrollIntoView());
await new Promise(r => setTimeout(r, 1200));
await page.screenshot({ path: out('desktop-dark-contact') });

// Light theme
await page.evaluate(() => document.getElementById('theme-toggle').click());
await new Promise(r => setTimeout(r, 600));
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 900));
await page.screenshot({ path: out('desktop-light-hero') });

// Mobile dark
await page.evaluate(() => { localStorage.removeItem('vl-theme'); });
await page.setViewport({ width: 390, height: 844 });
await page.goto(URL, { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: out('mobile-dark-hero') });
await page.evaluate(() => document.querySelector('#work').scrollIntoView());
await new Promise(r => setTimeout(r, 1100));
await page.screenshot({ path: out('mobile-dark-work') });

console.log(JSON.stringify({ errors }, null, 2));
await browser.close();
