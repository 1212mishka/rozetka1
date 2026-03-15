import { addPhone, createPhonesTable, phoneExists, updatePhone } from './phones';

export function seedPhones() {
  createPhonesTable();

  const phones = [
    {
      name: 'Apple iPhone 13',
      price: 35000,
      discount: 10,
      old_price: 39000,
      description: 'Современный смартфон с отличной камерой и производительностью.',
      reviews: 'Очень доволен покупкой!|Классная камера!',
      questions: 'Есть ли беспроводная зарядка?|Какая гарантия?',
      specs: 'Экран: 6.1" OLED; Процессор: A15 Bionic; Память: 128 ГБ',
      video: 'https://www.youtube.com/watch?v=iphone13review',
      payment: 'Картой, наличными, рассрочка',
      warranty: '12 месяцев',
      delivery: 'Курьером, самовывоз',
      image: 'phone0.png',
      release_year: 2021,
    },
    {
      name: 'Samsung Galaxy S23',
      price: 32000,
      discount: 15,
      old_price: 37500,
      description: 'Флагман Samsung с мощной батареей и ярким экраном.',
      reviews: 'Быстрый, красивый, удобный.|Экран супер!',
      questions: 'Есть ли влагозащита?|Поддержка 5G?',
      specs: 'Экран: 6.2" AMOLED; Процессор: Snapdragon 8 Gen 2; Память: 256 ГБ',
      video: 'https://www.youtube.com/watch?v=galaxys23review',
      payment: 'Картой, наличными, кредит',
      warranty: '24 месяца',
      delivery: 'Курьером, почта',
      image: 'phone1.png',
      release_year: 2020,
    },
    {
      name: 'Xiaomi Redmi Note 12',
      price: 18000,
      discount: 5,
      old_price: 19000,
      description: 'Доступный смартфон с хорошей камерой и батареей.',
      reviews: 'Лучший за свои деньги.|Быстрая зарядка.',
      questions: 'Есть NFC?|Какой процессор?',
      specs: 'Экран: 6.5" IPS; Процессор: MediaTek Helio G88; Память: 128 ГБ',
      video: 'https://www.youtube.com/watch?v=redminote12review',
      payment: 'Картой, наличными',
      warranty: '12 месяцев',
      delivery: 'Самовывоз, курьер',
      image: 'phone2.png',
      release_year: 2022,
    },
    {
      name: 'Realme 11 Pro',
      price: 21000,
      discount: 7,
      old_price: 22500,
      description: 'Смартфон с AMOLED-экраном и быстрой зарядкой.',
      reviews: 'Экран яркий.|Заряжается за час.',
      questions: 'Есть ли NFC?|Какой процессор?',
      specs: 'Экран: 6.7" AMOLED; Процессор: Dimensity 7050; Память: 256 ГБ',
      video: 'https://www.youtube.com/watch?v=realme11pro',
      payment: 'Картой, рассрочка',
      warranty: '12 месяцев',
      delivery: 'Курьером, самовывоз',
      image: 'phone3.png',
      release_year: 2024,
    },
    {
      name: 'Google Pixel 7a',
      price: 27000,
      discount: 12,
      old_price: 30500,
      description: 'Чистый Android, отличная камера и поддержка обновлений.',
      reviews: 'Фото супер!|Чистый Android.',
      questions: 'Есть беспроводная зарядка?|Сколько обновлений?',
      specs: 'Экран: 6.1" OLED; Процессор: Google Tensor G2; Память: 128 ГБ',
      video: 'https://www.youtube.com/watch?v=pixel7a',
      payment: 'Картой, наличными',
      warranty: '24 месяца',
      delivery: 'Курьером, почта',
      image: 'phone4.png',
      release_year: 2023,

    },
    {
      name: 'OnePlus Nord CE 3',
      price: 19500,
      discount: 6,
      old_price: 21000,
      description: 'Быстрый смартфон с хорошей батареей и экраном 120 Гц.',
      reviews: 'Экран плавный.|Батарея держит долго.',
      questions: 'Есть ли 5G?|Какой адаптер в комплекте?',
      specs: 'Экран: 6.7" AMOLED 120 Гц; Процессор: Snapdragon 782G; Память: 128 ГБ',
      video: 'https://www.youtube.com/watch?v=oneplusnordce3',
      payment: 'Картой, кредит',
      warranty: '12 месяцев',
      delivery: 'Самовывоз, курьер',
      image: 'phone5.png',
      release_year: 2026,
    },
  ];

for (const phone of phones) {
  if (!phoneExists(phone.name)) {
    addPhone(phone);
  } else {
    updatePhone(phone); // ← обновляем если уже есть
  }
}
}