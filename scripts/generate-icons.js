const sharp = require('sharp');
const fs = require('fs');

async function generateIcons() {
  const iconSvg = fs.readFileSync('public/icon-source.svg');
  const maskableSvg = fs.readFileSync('public/icon-maskable-source.svg');

  // Standard icons
  await sharp(iconSvg).resize(192, 192).png().toFile('public/icon-192.png');
  console.log('Generated: icon-192.png');
  await sharp(iconSvg).resize(512, 512).png().toFile('public/icon-512.png');
  console.log('Generated: icon-512.png');
  await sharp(iconSvg).resize(180, 180).png().toFile('public/apple-touch-icon.png');
  console.log('Generated: apple-touch-icon.png');

  // Maskable icons
  await sharp(maskableSvg).resize(192, 192).png().toFile('public/icon-maskable-192.png');
  console.log('Generated: icon-maskable-192.png');
  await sharp(maskableSvg).resize(512, 512).png().toFile('public/icon-maskable-512.png');
  console.log('Generated: icon-maskable-512.png');

  // Favicon
  await sharp(iconSvg).resize(32, 32).png().toFile('public/favicon-32.png');
  console.log('Generated: favicon-32.png');
  await sharp(iconSvg).resize(16, 16).png().toFile('public/favicon-16.png');
  console.log('Generated: favicon-16.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
