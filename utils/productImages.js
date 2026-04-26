
// ─── Список ключевых слов для смартфонов ─────────────────────────────────────
//   keys  — слова, по которым распознаём название товара (в нижнем регистре)
//   img   — изображение, которое подключаем через require (встроенный ресурс)
//   file  — имя файла картинки (сохраняется в SQLite для корзины/вишлиста)
const phoneKeywords = [
  { keys: ['iphone', 'apple iphone'], img: require('../assets/images/phones/iphone13.png'), file: 'iphone13.png' },
  { keys: ['samsung', 'galaxy'], img: require('../assets/images/phones/samsungGs23.png'), file: 'samsungGs23.png' },
  { keys: ['xiaomi', 'redmi'], img: require('../assets/images/phones/xredmiNote12.png'), file: 'xredmiNote12.png' },
  { keys: ['pixel', 'google'], img: require('../assets/images/phones/googlepixel7a.png'), file: 'googlepixel7a.png' },
  { keys: ['realme', 'realmi'], img: require('../assets/images/phones/Realmi11pro.png'), file: 'Realmi11pro.png' },
  { keys: ['oneplus', 'nord'], img: require('../assets/images/phones/oneplusNordCe3.png'), file: 'oneplusNordCe3.png' },
];

// ─── Список ключевых слов для ноутбуков ──────────────────────────────────────
// Аналогично смартфонам — для ноутбуков указываем свои ключевые слова и картинки
const laptopKeywords = [
  { keys: ['lenovo', 'v15'], img: require('../assets/images/laptops/lenovov15ada.png'), file: 'lenovov15ada.png' },
  { keys: ['probook', 'hp pro'], img: require('../assets/images/laptops/hpprobook430.png'), file: 'hpprobook430.png' },
  { keys: ['macbook pro', 'mac pro', 'applemacpro'], img: require('../assets/images/laptops/applemacpro16.png'), file: 'applemacpro16.png' },
  { keys: ['swift 5', 'acerswift5'], img: require('../assets/images/laptops/acerswift5.png'), file: 'acerswift5.png' },
  { keys: ['swift'], img: require('../assets/images/laptops/acerswift1.png'), file: 'acerswift1.png' },
];

// ─── Функция: является ли название товара ноутбуком? ─────────────────────────
// Принимает строку name (название товара), переводит в нижний регистр
// и проверяет, содержит ли оно одно из характерных для ноутбуков слов
// Возвращает true или false
export const isLaptopName = (name = '') => {
  const l = name.toLowerCase();
  return l.includes('ноутбук') || l.includes('macbook') || l.includes('laptop') ||
    l.includes('lenovo') || l.includes('probook') || l.includes('elitebook') ||
    l.includes('swift') || l.includes('thinkpad') || l.includes('vivobook') ||
    l.includes('zenbook') || l.includes('hp ') || l.includes('acer');
};

// ─── Функция: является ли название товара смартфоном? ────────────────────────
// То же самое, что isLaptopName, но для смартфонов
// Проверяем слова типа 'iphone', 'samsung', 'смартфон' и т.д.
export const isPhoneName = (name = '') => {
  const l = name.toLowerCase();
  return l.includes('iphone') || l.includes('samsung') || l.includes('xiaomi') ||
    l.includes('realme') || l.includes('realmi') || l.includes('pixel') ||
    l.includes('oneplus') || l.includes('nord') || l.includes('смартфон') ||
    l.includes('galaxy') || l.includes('redmi') || l.includes('google');
};

// ─── Внутренняя вспомогательная функция поиска ───────────────────────────────
// Ищет в переданном массиве (keywords) первую запись,
// у которой хотя бы одно ключевое слово содержится в названии товара (name)
// Это "приватная" функция — она не экспортируется, используется только внутри этого файла
const findEntry = (keywords, name = '') => {
  const l = name.toLowerCase();
  return keywords.find(entry => entry.keys.some(k => l.includes(k)));
};

// ─── Возвращает source (источник) изображения для компонента <Image> ─────────
// Используется при отображении картинки на экране
// Сначала ищет ноутбук, затем телефон
// Если ничего не нашло — возвращает null (тогда отображается заглушка)
/** Возвращает source для <Image> или null (показать заглушку) */
export const getProductImage = (name = '') => {
  const laptopEntry = findEntry(laptopKeywords, name);
  if (laptopEntry) return laptopEntry.img;
  const phoneEntry = findEntry(phoneKeywords, name);
  if (phoneEntry) return phoneEntry.img;
  return null;
};

// ─── Возвращает имя файла картинки для сохранения в базе данных ──────────────
// SQLite не может хранить сами картинки, поэтому сохраняем только имя файла (строку)
// При отображении потом снова вызываем getProductImage по названию товара
/** Возвращает строку-имя файла для сохранения в SQLite */
export const getProductImageFile = (name = '') => {
  const laptopEntry = findEntry(laptopKeywords, name);
  if (laptopEntry) return laptopEntry.file;
  const phoneEntry = findEntry(phoneKeywords, name);
  if (phoneEntry) return phoneEntry.file;
  return null;
};
