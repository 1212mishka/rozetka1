const phoneKeywords = [
  { keys: ['iphone', 'apple iphone'], img: require('../../assets/images/phones/iphone13.png'), file: 'iphone13.png' },
  { keys: ['samsung', 'galaxy'], img: require('../../assets/images/phones/samsungGs23.png'), file: 'samsungGs23.png' },
  { keys: ['xiaomi', 'redmi'], img: require('../../assets/images/phones/xredmiNote12.png'), file: 'xredmiNote12.png' },
  { keys: ['pixel', 'google'], img: require('../../assets/images/phones/googlepixel7a.png'), file: 'googlepixel7a.png' },
  { keys: ['realme', 'realmi'], img: require('../../assets/images/phones/Realmi11pro.png'), file: 'Realmi11pro.png' },
  { keys: ['oneplus', 'nord'], img: require('../../assets/images/phones/oneplusNordCe3.png'), file: 'oneplusNordCe3.png' },
];

const laptopKeywords = [
  { keys: ['lenovo', 'v15'], img: require('../../assets/images/laptops/lenovov15ada.png'), file: 'lenovov15ada.png' },
  { keys: ['probook', 'hp pro'], img: require('../../assets/images/laptops/hpprobook430.png'), file: 'hpprobook430.png' },
  { keys: ['macbook pro', 'mac pro', 'applemacpro'], img: require('../../assets/images/laptops/applemacpro16.png'), file: 'applemacpro16.png' },
  { keys: ['swift 5', 'acerswift5'], img: require('../../assets/images/laptops/acerswift5.png'), file: 'acerswift5.png' },
  { keys: ['swift'], img: require('../../assets/images/laptops/acerswift1.png'), file: 'acerswift1.png' },
];

export function isLaptopName(name = '') {
  const l = name.toLowerCase();
  return l.includes('ноутбук') || l.includes('macbook') || l.includes('laptop') ||
    l.includes('lenovo') || l.includes('probook') || l.includes('elitebook') ||
    l.includes('swift') || l.includes('thinkpad') || l.includes('vivobook') ||
    l.includes('zenbook') || l.includes('hp ') || l.includes('acer');
}

export function isPhoneName(name = '') {
  const l = name.toLowerCase();
  return l.includes('iphone') || l.includes('samsung') || l.includes('xiaomi') ||
    l.includes('realme') || l.includes('realmi') || l.includes('pixel') ||
    l.includes('oneplus') || l.includes('nord') || l.includes('смартфон') ||
    l.includes('galaxy') || l.includes('redmi') || l.includes('google');
}

function findEntry(keywords, name = '') {
  const l = name.toLowerCase();
  return keywords.find(function(entry) {
    return entry.keys.some(function(k) { return l.includes(k); });
  });
}

export function getProductImage(name = '') {
  const laptop = findEntry(laptopKeywords, name);
  if (laptop) return laptop.img;
  const phone = findEntry(phoneKeywords, name);
  if (phone) return phone.img;
  return null;
}

export function getProductImageFile(name = '') {
  const laptop = findEntry(laptopKeywords, name);
  if (laptop) return laptop.file;
  const phone = findEntry(phoneKeywords, name);
  if (phone) return phone.file;
  return null;
}
