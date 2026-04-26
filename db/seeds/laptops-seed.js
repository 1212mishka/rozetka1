import { addLaptop, createLaptopsTable, laptopExists, updateLaptop } from './laptops';

export function seedLaptops() {
  createLaptopsTable();

  const laptops = [
    {
      name: 'Apple MacBook Air M2',
      price: 48000,
      discount: 8,
      old_price: 52000,
      release_year: 2022,
      description: 'Лёгкий и мощный ноутбук с процессором Apple M2.',
      reviews: 'Отличная автономность!|Очень тихий.',
      questions: 'Есть ли подсветка клавиатуры?|Сколько держит батарея?',
      specs: 'Экран: 13.6" Retina; Процессор: Apple M2; Память: 256 ГБ SSD',
      video: 'https://www.youtube.com/watch?v=macbookairm2',
      payment: 'Картой, рассрочка',
      warranty: '12 месяцев',
      delivery: 'Курьером, самовывоз',
      image: 'laptop0.png',
    },
    {
      name: 'ASUS ZenBook 14',
      price: 34000,
      discount: 10,
      old_price: 38000,
      release_year: 2026,
      description: 'Тонкий ультрабук с IPS-экраном и быстрым SSD.',
      reviews: 'Очень лёгкий.|Быстрый запуск системы.',
      questions: 'Есть ли HDMI?|Какой объём памяти?',
      specs: 'Экран: 14" IPS; Процессор: Intel i5; Память: 512 ГБ SSD',
      video: 'https://www.youtube.com/watch?v=zenbook14',
      payment: 'Картой, наличными',
      warranty: '24 месяца',
      delivery: 'Самовывоз, курьер',
      image: 'laptop1.png',
    },
  ];

  for (const laptop of laptops) {
    if (!laptopExists(laptop.name)) {
      addLaptop(laptop);
    } else {
      updateLaptop(laptop);
    }
  }
}