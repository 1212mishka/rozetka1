import { addCategory, createCategoriesTable, categoryExists, updateCategory } from './categories';

export function seedCategories() {
  createCategoriesTable();

  const categories = [
    { label: "Ноутбуки та комп'ютери", image: 'cimage1.png' },
    { label: 'Смартфони, ТВ і електроніка', image: 'cimage2.png' },
    { label: 'Товари для геймерів', image: 'cimage3.png' },
    { label: 'Побутова техніка', image: 'cimage4.png' },
    { label: 'Товари для дому', image: 'cimage5.png' },
    { label: 'Інструменти та автотовари', image: 'cimage6.png' },
    { label: 'Сантехніка та ремонт', image: 'cimage7.png' },
    { label: 'Дача, сад і огород', image: 'cimage8.png' },
    { label: 'Спорт і захоплення', image: 'cimage9.png' },
    { label: 'Одяг, взуття та прикраси', image: 'cimage10.png' },
    { label: "Краса та здоров'я", image: 'cimage11.png' },
    { label: 'Дитячі товари', image: 'cimage12.png' },
    { label: 'Зоотовари', image: 'cimage13.png' },
    { label: 'Канцтовари та книги', image: 'cimage14.png' },
    { label: 'Алкогольні напої та продукти', image: 'cimage15.png' },
    { label: 'Товари для бізнесу та послуги', image: 'cimage16.png' },
  ];

  for (const category of categories) {
    if (!categoryExists(category.label)) {
      addCategory(category);
    } else {
      updateCategory(category);
    }
  }
}