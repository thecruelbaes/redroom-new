// Единый источник правды по контенту сайта «RedRoom Studio».
// Меняешь телефон / преподавателя / отзыв — только здесь.
// ⚠️ Места, помеченные TODO, нужно заменить реальными данными перед сдачей.

export const SITE = {
  name: 'RedRoom Studio',
  shortName: 'RED ROOM',
  sub: 'STUDIO',
  tagline: 'Школа музыки в Новороссийске',
  city: 'Новороссийск',
  description:
    'Индивидуальные уроки барабанов и гитары в Новороссийске. RedRoom Studio — живые инструменты, опытные преподаватели, репетиционная точка и звукозапись. Первое занятие бесплатно.',
  url: 'https://redroomstudio.ru',
  // TODO: подтвердить телефон студии.
  phones: [{ display: '+7 (000) 000-00-00', href: 'tel:+70000000000' }],
  // Telegram-канал — главный оффер (подписка = бесплатное пробное занятие).
  telegramChannel: 'https://t.me/redroomstudio',
  telegramChannelHandle: '@redroomstudio',
  // TODO: подтвердить адрес студии.
  address: 'г. Новороссийск',
  workHours: 'Ежедневно, по записи',
  legalEntity: 'ИП Шубный Сергей Александрович',
};

export type IconKey = 'drums' | 'guitar' | 'rehearsal' | 'record';

export type Service = {
  id: string;
  title: string;
  desc: string;
  image: string;
  icon: IconKey;
  flagship?: boolean;
};

export const SERVICES: Service[] = [
  {
    id: 'drums',
    title: 'Уроки барабанов',
    desc: 'Индивидуальные занятия на живой установке. Ритм, координация, техника — от первого удара до игры любимых треков.',
    image: '/images/service-drums.jpg',
    icon: 'drums',
    flagship: true,
  },
  {
    id: 'guitar',
    title: 'Уроки гитары',
    desc: 'Акустика и электро, любой стиль. Аккорды, ритм, соло и импровизация — программа под твою цель и уровень.',
    image: '/images/service-guitar.jpg',
    icon: 'guitar',
    flagship: true,
  },
  {
    id: 'rehearsal',
    title: 'Репетиционная точка',
    desc: 'Оборудованная точка для репетиций группы или сольных занятий. Барабаны, усиление, комфортный звук.',
    image: '/images/service-rehearsal.jpg',
    icon: 'rehearsal',
  },
  {
    id: 'record',
    title: 'Звукозапись',
    desc: 'Запись, сведение и мастеринг в студии. Зафиксируй свой материал в качественном звуке.',
    image: '/images/service-record.jpg',
    icon: 'record',
  },
];

export const ADVANTAGES = [
  {
    title: 'Индивидуально под тебя',
    desc: 'Никаких потоков. Программа строится под твою цель, вкус и темп — от нуля до сцены.',
  },
  {
    title: 'Любой возраст и уровень',
    desc: 'Берём и детей, и взрослых. Никогда не поздно начать — важно только желание играть.',
  },
  {
    title: 'Живые инструменты',
    desc: 'Настоящая установка и гитары, а не имитация. Ты сразу чувствуешь инструмент по-настоящему.',
  },
  {
    title: 'Своя студия и точка',
    desc: 'Уроки, репетиции и запись — всё в одном месте. Атмосфера, в которой хочется играть.',
  },
];

// Цифры для блока статистики. TODO: заменить на реальные.
export const STATS: { value: string; label: string }[] = [
  { value: '5+', label: 'лет на сцене' },
  { value: '100+', label: 'учеников' },
  { value: '2', label: 'направления' },
  { value: '∞', label: 'драйва' },
];

export type Teacher = {
  id: string;
  name: string;
  instrument: string;
  image: string;
  bio: string;
};

// TODO: заменить био на реальные (опыт, стиль, регалии).
export const TEACHERS: Teacher[] = [
  {
    id: 'oleg',
    name: 'Олег',
    instrument: 'Барабаны',
    image: '/images/teacher-oleg.jpg',
    bio: 'Барабанщик с опытом живых выступлений. Ставит технику, ритм и сценическую уверенность — занятия проходят на драйве.',
  },
  {
    id: 'vladimir',
    name: 'Владимир',
    instrument: 'Барабаны',
    image: '/images/teacher-vladimir.jpg',
    bio: 'Преподаёт барабаны для любого уровня. Любит разбирать с учениками их любимые треки и быстро выводить на результат.',
  },
  {
    id: 'sergei',
    name: 'Сергей',
    instrument: 'Гитара',
    image: '/images/teacher-sergei.jpg',
    bio: 'Гитарист, играет акустику и электро. Учит аккомпанементу, ритму и соло — от первых аккордов до собственного звучания.',
  },
];

// Галерея студии и атмосферы.
export const GALLERY: { src: string; alt: string }[] = [
  { src: '/images/gallery/g1.jpg', alt: 'Барабанная установка под сценическим светом' },
  { src: '/images/gallery/g3.jpg', alt: 'Гитарист на сцене в RedRoom Studio' },
  { src: '/images/gallery/g5.jpg', alt: 'Репетиционная точка с барабанами и гитарой' },
  { src: '/images/gallery/g6.jpg', alt: 'Студия звукозаписи в неоновом свете' },
  { src: '/images/gallery/g2.jpg', alt: 'Живое выступление под красным светом' },
  { src: '/images/gallery/g4.jpg', alt: 'Гитара крупным планом на репетиции' },
];

// TODO: заменить на реальные отзывы (Яндекс / 2ГИС / скрины переписки).
export const REVIEWS: { name: string; role: string; text: string }[] = [
  {
    name: 'Анна',
    role: 'ученица · барабаны',
    text: 'Пришла с нуля, думала это не для меня. Через месяц уже играла первый ритм любимой песни. Преподаватель объясняет спокойно и по делу.',
  },
  {
    name: 'Дмитрий',
    role: 'ученик · гитара',
    text: 'Брал индивидуальные занятия по электрогитаре. Программа реально под меня, разбираем то, что хочу играть. Атмосфера в студии огонь.',
  },
  {
    name: 'Мария',
    role: 'мама ученика',
    text: 'Сын ходит на барабаны и горит этим. Видно, что преподаватели любят своё дело. Записались после бесплатного пробного — не пожалели.',
  },
];

export const RATING_SUMMARY = { score: '5.0', label: 'по отзывам учеников' };
