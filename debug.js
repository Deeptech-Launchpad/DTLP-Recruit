const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('http://localhost:3000');
        await page.click('a[data-page="offers"]');
        await page.waitForTimeout(1000);
        await page.screenshot({path: 'offers-clicked.png'});
        const appHtml = await page.$eval('#app-container', el => el.innerHTML);
        require('fs').writeFileSync('app-dump.html', appHtml);
        
        const appsDisplay = await page.$eval('#page-applications', el => getComputedStyle(el).display);
        const offersDisplay = await page.$eval('#page-offers', el => getComputedStyle(el).display);
        console.log('Apps:', appsDisplay);
        console.log('Offers:', offersDisplay);
        
        console.log('Done');
        await browser.close();
    } catch(e) {
        console.error(e);
    }
})();
