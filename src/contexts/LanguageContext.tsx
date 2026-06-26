import { createContext, useContext, useState, type ReactNode } from 'react'

export type Language = 'uz' | 'ru' | 'en'

export type Translations = {
  // Nav sections
  mainSection: string
  studentsSection: string
  learningSection: string
  systemSection: string
  learningProcessSection: string
  otherSection: string
  menuSection: string
  // Nav items
  dashboard: string
  students: string
  teachers: string
  groups: string
  subjects: string
  lessons: string
  attendance: string
  tests: string
  reports: string
  settings: string
  profile: string
  courses: string
  myCourses: string
  achievements: string
  logout: string
  // Auth
  login: string
  register: string
  forgotPassword: string
  email: string
  password: string
  rememberMe: string
  // Common
  search: string
  loading: string
  error: string
  success: string
  cancel: string
  save: string
  delete: string
  edit: string
  add: string
  back: string
  active: string
  inactive: string
  name: string
  date: string
  status: string
  actions: string
  close: string
  // Main layout
  pricing: string
  privacyPolicy: string
  termsOfService: string
  allRightsReserved: string
  // Roles
  adminRole: string
  teacherRole: string
  studentRole: string
  // Sidebar stats
  systemStatus: string
  systemWorking: string
  usersLabel: string
  activeGroupsLabel: string
  totalLessonsLabel: string
  myResults: string
  myResultsStudent: string
  groupLabel: string
  studentLabel: string
  lessonLabel: string
  courseLabel: string
  completedTests: string
  attendancePct: string
  noGroup: string
  noGroupStudent: string
  // Formatted strings with {n} placeholder
  teacherStudentsFmt: string
  attRecordsFmt: string
  coursesJoinedFmt: string
  // Navbar
  notifications: string
  openMenu: string
  searchPlaceholder: string
  adminSearchPlaceholder: string
  teacherSearchPlaceholder: string
  studentSearchPlaceholder: string
  // Theme
  lightMode: string
  darkMode: string
  systemMode: string
  // Language
  langUz: string
  langRu: string
  langEn: string
  language: string

  // ── Landing page ──────────────────────────────────────────────────────────
  heroTagline: string
  heroTitle: string        // Use | as delimiter: text before | is plain, after | is gradient
  heroSubtitle: string
  heroBadge: string        // Eyebrow badge above headline
  heroCtaPrimary: string   // Primary CTA button label (no arrow — rendered as icon)
  heroCtaDemo: string      // Secondary CTA label
  heroNoCreditCard: string // Friction reducer text below CTAs
  heroRoleStudent: string  // Role tab: student
  heroRoleTeacher: string  // Role tab: teacher
  heroRoleSchool: string   // Role tab: school/institution
  startFree: string
  viewPricing: string
  whyTitle: string
  whySubtitle: string
  feature1Title: string
  feature1Desc: string
  feature2Title: string
  feature2Desc: string
  feature3Title: string
  feature3Desc: string
  ctaTitle: string
  ctaSubtitle: string
  registerNow: string
  // ── Social Proof ─────────────────────────────────────────────────────────
  statStudentsLabel: string
  statTeachersLabel: string
  statConversationsLabel: string
  statCentersLabel: string
  statRatingLabel: string

  // ── Auth pages ────────────────────────────────────────────────────────────
  loginTitle: string
  loginSubtitle: string
  selectRole: string
  emailLabel: string
  passwordLabel: string
  forgotPasswordQuestion: string
  rememberMeLabel: string
  noAccount: string
  signUpLink: string
  orDivider: string
  // Register
  registerTitle: string
  registerSubtitle: string
  fullName: string
  fullNamePlaceholder: string
  roleLabel: string
  minPasswordHint: string
  createAccount: string
  hasAccount: string
  checkEmailTitle: string
  checkEmailDesc: string
  goToLogin: string
  // Forgot password
  forgotPasswordTitle: string
  forgotPasswordDesc: string
  sendLink: string
  backToLogin: string
  emailSentTitle: string
  emailSentDesc: string
  spamNote: string
  resetLinkSentTo: string
  // AI Assistant
  aiAssistant: string
}

// ─── O'ZBEK ──────────────────────────────────────────────────────────────────

const uz: Translations = {
  mainSection: 'Asosiy',
  studentsSection: "O'quvchilar",
  learningSection: "Ta'lim jarayoni",
  systemSection: 'Tizim',
  learningProcessSection: "O'quv jarayoni",
  otherSection: 'Boshqa',
  menuSection: 'Menyu',
  dashboard: 'Bosh sahifa',
  students: 'Talabalar',
  teachers: "O'qituvchilar",
  groups: 'Guruhlar',
  subjects: 'Fanlar',
  lessons: 'Darslar',
  attendance: 'Davomat',
  tests: 'Testlar',
  reports: 'Hisobotlar',
  settings: 'Sozlamalar',
  profile: 'Profil',
  courses: 'Kurslar',
  myCourses: 'Darslarim',
  achievements: 'Yutuqlar',
  logout: 'Chiqish',
  login: 'Kirish',
  register: "Ro'yxatdan o'tish",
  forgotPassword: 'Parolni unutdim',
  email: 'Email',
  password: 'Parol',
  rememberMe: 'Eslab qol',
  search: 'Qidirish',
  loading: 'Yuklanmoqda',
  error: 'Xato',
  success: 'Muvaffaqiyatli',
  cancel: 'Bekor qilish',
  save: 'Saqlash',
  delete: "O'chirish",
  edit: 'Tahrirlash',
  add: "Qo'shish",
  back: 'Orqaga',
  active: 'Faol',
  inactive: 'Faol emas',
  name: 'Ism',
  date: 'Sana',
  status: 'Holat',
  actions: 'Harakatlar',
  close: 'Yopish',
  pricing: 'Narxlar',
  privacyPolicy: 'Maxfiylik siyosati',
  termsOfService: 'Foydalanish shartlari',
  allRightsReserved: 'Barcha huquqlar himoyalangan',
  adminRole: 'Tizim administratori',
  teacherRole: "O'qituvchi",
  studentRole: 'Talaba',
  systemStatus: 'Tizim holati',
  systemWorking: 'Barcha tizimlar ishlayapti ✓',
  usersLabel: 'Foydalanuvchi',
  activeGroupsLabel: 'Faol guruh',
  totalLessonsLabel: 'Jami darslar',
  myResults: 'Mening natijalari',
  myResultsStudent: 'Mening natijalarim',
  groupLabel: 'Guruh',
  studentLabel: 'Talaba',
  lessonLabel: 'Dars',
  courseLabel: 'Kurs',
  completedTests: 'Test ✓',
  attendancePct: 'Davomat',
  noGroup: 'Guruh biriktirilmagan',
  noGroupStudent: "Hali kursga qo'shilmadingiz",
  teacherStudentsFmt: "{n} ta talabangiz bor",
  attRecordsFmt: '{n} ta dars yozuvi mavjud',
  coursesJoinedFmt: "{n} ta kursga qo'shilgansiz",
  notifications: 'Bildirishnomalar',
  openMenu: 'Menyu ochish',
  searchPlaceholder: 'Qidirish...',
  adminSearchPlaceholder: 'Foydalanuvchi, kurs, guruh...',
  teacherSearchPlaceholder: 'Talaba, guruh yoki dars...',
  studentSearchPlaceholder: "Dars, mavzu yoki o'qituvchi...",
  lightMode: 'Kunduzgi',
  darkMode: 'Tungi',
  systemMode: 'Tizim',
  langUz: "O'zbek",
  langRu: 'Русский',
  langEn: 'English',
  language: 'Til',

  // Landing
  heroTagline: "AI bilan ta'lim yangi darajada",
  heroTitle: "O'quvchilar va o'qituvchilar uchun|AI yordamchi",
  heroSubtitle: "Savollaringizga bir soniyada javob oling. Darslarni avtomatlang. Har bir talabaning o'quv yo'lini shaxsiylang.",
  heroBadge: "Gemini 2.5 Flash bilan quvvatlangan",
  heroCtaPrimary: "Bepul boshlash",
  heroCtaDemo: "Demoni ko'rish",
  heroNoCreditCard: "Kredit karta talab qilinmaydi · 30 kun bepul",
  heroRoleStudent: "Talabaman",
  heroRoleTeacher: "O'qituvchiman",
  heroRoleSchool: "Maktab vakili",
  startFree: 'Bepul boshlash →',
  viewPricing: "Narxlarni ko'rish",
  whyTitle: 'Nima uchun YordamchiAI?',
  whySubtitle: 'Har bir foydalanuvchi uchun moslashtirilgan imkoniyatlar',
  feature1Title: 'Talabalar uchun',
  feature1Desc: "AI yordamida shaxsiy o'rganish yo'li, interaktiv testlar va real vaqt tahlili.",
  feature2Title: "O'qituvchilar uchun",
  feature2Desc: "Darslarni boshqarish, talabalar davomati va o'quv natijalarini kuzatish.",
  feature3Title: 'Adminlar uchun',
  feature3Desc: "To'liq platforma nazorati, foydalanuvchilar va tizim sozlamalarini boshqarish.",
  ctaTitle: 'Bugun boshlang — bepul!',
  ctaSubtitle: "Minglab o'qituvchilar va talabalar allaqachon YordamchiAI bilan ta'limni yangi darajaga olib chiqdi.",
  registerNow: "Hoziroq ro'yxatdan o'ting →",
  // Social Proof
  statStudentsLabel: "Faol talabalar",
  statTeachersLabel: "O'qituvchilar",
  statConversationsLabel: "AI suhbatlar",
  statCentersLabel: "Ta'lim markazlari",
  statRatingLabel: "Foydalanuvchi bahosi",

  // Auth - Login
  loginTitle: 'Hisobga kirish',
  loginSubtitle: "Platformaga kirish uchun ma'lumotlaringizni kiriting.",
  selectRole: 'Rolni tanlang',
  emailLabel: 'Email manzil',
  passwordLabel: 'Parol',
  forgotPasswordQuestion: 'Parolni unutdingizmi?',
  rememberMeLabel: 'Meni eslab qol',
  noAccount: "Hisobingiz yo'qmi?",
  signUpLink: "Ro'yxatdan o'ting",
  orDivider: 'yoki',

  // Auth - Register
  registerTitle: "Ro'yxatdan o'tish",
  registerSubtitle: "Yangi hisob yarating va platformadan foydalanishni boshlang.",
  fullName: "To'liq ism",
  fullNamePlaceholder: 'Ism Familiya',
  roleLabel: 'Rol',
  minPasswordHint: 'Kamida 6 ta belgi',
  createAccount: 'Hisob yaratish',
  hasAccount: 'Hisobingiz bormi?',
  checkEmailTitle: 'Emailingizni tekshiring',
  checkEmailDesc: 'manziliga tasdiqlash havolasi yuborildi. Havolani bosib ro\'yxatni yakunlang.',
  goToLogin: "Kirishga o'tish",

  // Auth - Forgot password
  forgotPasswordTitle: 'Parolni tiklash',
  forgotPasswordDesc: 'Email manzilingizni kiriting — tiklash havolasini yuboramiz.',
  sendLink: 'Havola yuborish',
  backToLogin: '← Kirishga qaytish',
  emailSentTitle: 'Email yuborildi!',
  emailSentDesc: 'manziliga parolni tiklash havolasi yuborildi.',
  spamNote: 'Agar email kelmasa, spam papkani tekshiring.',
  resetLinkSentTo: 'Tiklash havolasi yuborildi',
  aiAssistant: 'AI Yordamchi',
}

// ─── РУССКИЙ ─────────────────────────────────────────────────────────────────

const ru: Translations = {
  mainSection: 'Главное',
  studentsSection: 'Студенты',
  learningSection: 'Учебный процесс',
  systemSection: 'Система',
  learningProcessSection: 'Учебный процесс',
  otherSection: 'Другое',
  menuSection: 'Меню',
  dashboard: 'Главная',
  students: 'Студенты',
  teachers: 'Преподаватели',
  groups: 'Группы',
  subjects: 'Предметы',
  lessons: 'Уроки',
  attendance: 'Посещаемость',
  tests: 'Тесты',
  reports: 'Отчёты',
  settings: 'Настройки',
  profile: 'Профиль',
  courses: 'Курсы',
  myCourses: 'Мои уроки',
  achievements: 'Достижения',
  logout: 'Выйти',
  login: 'Войти',
  register: 'Зарегистрироваться',
  forgotPassword: 'Забыли пароль',
  email: 'Email',
  password: 'Пароль',
  rememberMe: 'Запомнить',
  search: 'Поиск',
  loading: 'Загрузка',
  error: 'Ошибка',
  success: 'Успешно',
  cancel: 'Отмена',
  save: 'Сохранить',
  delete: 'Удалить',
  edit: 'Редактировать',
  add: 'Добавить',
  back: 'Назад',
  active: 'Активный',
  inactive: 'Неактивный',
  name: 'Имя',
  date: 'Дата',
  status: 'Статус',
  actions: 'Действия',
  close: 'Закрыть',
  pricing: 'Цены',
  privacyPolicy: 'Конфиденциальность',
  termsOfService: 'Условия использования',
  allRightsReserved: 'Все права защищены',
  adminRole: 'Администратор системы',
  teacherRole: 'Преподаватель',
  studentRole: 'Студент',
  systemStatus: 'Состояние системы',
  systemWorking: 'Все системы работают ✓',
  usersLabel: 'Пользователей',
  activeGroupsLabel: 'Активных групп',
  totalLessonsLabel: 'Всего уроков',
  myResults: 'Мои результаты',
  myResultsStudent: 'Мои результаты',
  groupLabel: 'Групп',
  studentLabel: 'Студентов',
  lessonLabel: 'Уроков',
  courseLabel: 'Курсов',
  completedTests: 'Тест ✓',
  attendancePct: 'Посещ.',
  noGroup: 'Группа не назначена',
  noGroupStudent: 'Вы ещё не записаны на курс',
  teacherStudentsFmt: 'У вас {n} студентов',
  attRecordsFmt: '{n} записей о занятиях',
  coursesJoinedFmt: 'Записаны на {n} курс(ов)',
  notifications: 'Уведомления',
  openMenu: 'Открыть меню',
  searchPlaceholder: 'Поиск...',
  adminSearchPlaceholder: 'Пользователь, курс, группа...',
  teacherSearchPlaceholder: 'Студент, группа или урок...',
  studentSearchPlaceholder: 'Урок, тема или преподаватель...',
  lightMode: 'Светлый',
  darkMode: 'Тёмный',
  systemMode: 'Системный',
  langUz: "O'zbek",
  langRu: 'Русский',
  langEn: 'English',
  language: 'Язык',

  // Landing
  heroTagline: 'Образование нового уровня с ИИ',
  heroTitle: 'ИИ-ассистент для студентов|и преподавателей',
  heroSubtitle: 'Мгновенные ответы на любые вопросы. Автоматизируйте уроки. Персонализируйте путь каждого ученика с помощью ИИ.',
  heroBadge: 'Работает на Gemini 2.5 Flash',
  heroCtaPrimary: 'Начать бесплатно',
  heroCtaDemo: 'Смотреть демо',
  heroNoCreditCard: 'Без кредитной карты · 30 дней бесплатно',
  heroRoleStudent: 'Я студент',
  heroRoleTeacher: 'Я преподаватель',
  heroRoleSchool: 'Представляю школу',
  startFree: 'Начать бесплатно →',
  viewPricing: 'Посмотреть цены',
  whyTitle: 'Почему YordamchiAI?',
  whySubtitle: 'Возможности, адаптированные для каждого пользователя',
  feature1Title: 'Для студентов',
  feature1Desc: 'Персональный путь обучения с ИИ, интерактивные тесты и аналитика в реальном времени.',
  feature2Title: 'Для преподавателей',
  feature2Desc: 'Управление уроками, посещаемость студентов и отслеживание учебных результатов.',
  feature3Title: 'Для администраторов',
  feature3Desc: 'Полный контроль платформы, управление пользователями и настройками системы.',
  ctaTitle: 'Начните сегодня — бесплатно!',
  ctaSubtitle: 'Тысячи преподавателей и студентов уже вывели образование на новый уровень с YordamchiAI.',
  registerNow: 'Зарегистрироваться сейчас →',
  // Social Proof
  statStudentsLabel: 'Активных студентов',
  statTeachersLabel: 'Преподавателей',
  statConversationsLabel: 'ИИ диалогов',
  statCentersLabel: 'Учебных центров',
  statRatingLabel: 'Оценка пользователей',

  // Auth - Login
  loginTitle: 'Войти в аккаунт',
  loginSubtitle: 'Введите свои данные для входа на платформу.',
  selectRole: 'Выберите роль',
  emailLabel: 'Email адрес',
  passwordLabel: 'Пароль',
  forgotPasswordQuestion: 'Забыли пароль?',
  rememberMeLabel: 'Запомнить меня',
  noAccount: 'Нет аккаунта?',
  signUpLink: 'Зарегистрироваться',
  orDivider: 'или',

  // Auth - Register
  registerTitle: 'Зарегистрироваться',
  registerSubtitle: 'Создайте новый аккаунт и начните пользоваться платформой.',
  fullName: 'Полное имя',
  fullNamePlaceholder: 'Имя Фамилия',
  roleLabel: 'Роль',
  minPasswordHint: 'Минимум 6 символов',
  createAccount: 'Создать аккаунт',
  hasAccount: 'Уже есть аккаунт?',
  checkEmailTitle: 'Проверьте email',
  checkEmailDesc: 'на этот адрес отправлена ссылка для подтверждения. Перейдите по ней, чтобы завершить регистрацию.',
  goToLogin: 'Перейти к входу',

  // Auth - Forgot password
  forgotPasswordTitle: 'Восстановление пароля',
  forgotPasswordDesc: 'Введите email адрес — мы отправим ссылку для сброса пароля.',
  sendLink: 'Отправить ссылку',
  backToLogin: '← Назад к входу',
  emailSentTitle: 'Email отправлен!',
  emailSentDesc: 'на этот адрес отправлена ссылка для сброса пароля.',
  spamNote: 'Если письмо не пришло, проверьте папку спам.',
  resetLinkSentTo: 'Ссылка отправлена на',
  aiAssistant: 'ИИ Ассистент',
}

// ─── ENGLISH ─────────────────────────────────────────────────────────────────

const en: Translations = {
  mainSection: 'Main',
  studentsSection: 'Students',
  learningSection: 'Learning',
  systemSection: 'System',
  learningProcessSection: 'Learning Process',
  otherSection: 'Other',
  menuSection: 'Menu',
  dashboard: 'Dashboard',
  students: 'Students',
  teachers: 'Teachers',
  groups: 'Groups',
  subjects: 'Subjects',
  lessons: 'Lessons',
  attendance: 'Attendance',
  tests: 'Tests',
  reports: 'Reports',
  settings: 'Settings',
  profile: 'Profile',
  courses: 'Courses',
  myCourses: 'My Lessons',
  achievements: 'Achievements',
  logout: 'Logout',
  login: 'Login',
  register: 'Register',
  forgotPassword: 'Forgot Password',
  email: 'Email',
  password: 'Password',
  rememberMe: 'Remember me',
  search: 'Search',
  loading: 'Loading',
  error: 'Error',
  success: 'Success',
  cancel: 'Cancel',
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
  add: 'Add',
  back: 'Back',
  active: 'Active',
  inactive: 'Inactive',
  name: 'Name',
  date: 'Date',
  status: 'Status',
  actions: 'Actions',
  close: 'Close',
  pricing: 'Pricing',
  privacyPolicy: 'Privacy Policy',
  termsOfService: 'Terms of Service',
  allRightsReserved: 'All rights reserved',
  adminRole: 'System Administrator',
  teacherRole: 'Teacher',
  studentRole: 'Student',
  systemStatus: 'System Status',
  systemWorking: 'All systems running ✓',
  usersLabel: 'Users',
  activeGroupsLabel: 'Active groups',
  totalLessonsLabel: 'Total lessons',
  myResults: 'My Results',
  myResultsStudent: 'My Results',
  groupLabel: 'Groups',
  studentLabel: 'Students',
  lessonLabel: 'Lessons',
  courseLabel: 'Courses',
  completedTests: 'Test ✓',
  attendancePct: 'Attend.',
  noGroup: 'No group assigned',
  noGroupStudent: 'You have not joined any course yet',
  teacherStudentsFmt: '{n} students assigned',
  attRecordsFmt: '{n} attendance records',
  coursesJoinedFmt: 'Enrolled in {n} course(s)',
  notifications: 'Notifications',
  openMenu: 'Open menu',
  searchPlaceholder: 'Search...',
  adminSearchPlaceholder: 'User, course, group...',
  teacherSearchPlaceholder: 'Student, group or lesson...',
  studentSearchPlaceholder: 'Lesson, topic or teacher...',
  lightMode: 'Light',
  darkMode: 'Dark',
  systemMode: 'System',
  langUz: "O'zbek",
  langRu: 'Русский',
  langEn: 'English',
  language: 'Language',

  // Landing
  heroTagline: 'Education at a new level with AI',
  heroTitle: 'The AI Assistant|Built for Education',
  heroSubtitle: 'Get instant answers to any question. Automate lesson tracking. Personalize every student\'s learning path with AI.',
  heroBadge: 'Powered by Gemini 2.5 Flash',
  heroCtaPrimary: 'Start for free',
  heroCtaDemo: 'Watch demo',
  heroNoCreditCard: 'No credit card required · Free for 30 days',
  heroRoleStudent: 'I\'m a student',
  heroRoleTeacher: 'I\'m a teacher',
  heroRoleSchool: 'I represent a school',
  startFree: 'Start free →',
  viewPricing: 'View pricing',
  whyTitle: 'Why YordamchiAI?',
  whySubtitle: 'Tailored features for every user',
  feature1Title: 'For Students',
  feature1Desc: 'Personalized AI learning paths, interactive tests, and real-time analytics.',
  feature2Title: 'For Teachers',
  feature2Desc: 'Manage lessons, track student attendance, and monitor learning outcomes.',
  feature3Title: 'For Admins',
  feature3Desc: 'Full platform control, user management, and system configuration.',
  ctaTitle: 'Start today — it\'s free!',
  ctaSubtitle: 'Thousands of teachers and students have already elevated their education with YordamchiAI.',
  registerNow: 'Register now →',
  // Social Proof
  statStudentsLabel: 'Active students',
  statTeachersLabel: 'Teachers',
  statConversationsLabel: 'AI conversations',
  statCentersLabel: 'Education centers',
  statRatingLabel: 'User rating',

  // Auth - Login
  loginTitle: 'Sign in to your account',
  loginSubtitle: 'Enter your credentials to access the platform.',
  selectRole: 'Select role',
  emailLabel: 'Email address',
  passwordLabel: 'Password',
  forgotPasswordQuestion: 'Forgot your password?',
  rememberMeLabel: 'Remember me',
  noAccount: "Don't have an account?",
  signUpLink: 'Sign up',
  orDivider: 'or',

  // Auth - Register
  registerTitle: 'Create an account',
  registerSubtitle: 'Sign up to start using the platform.',
  fullName: 'Full name',
  fullNamePlaceholder: 'First Last',
  roleLabel: 'Role',
  minPasswordHint: 'At least 6 characters',
  createAccount: 'Create account',
  hasAccount: 'Already have an account?',
  checkEmailTitle: 'Check your email',
  checkEmailDesc: 'A confirmation link has been sent to this address. Click it to complete registration.',
  goToLogin: 'Go to login',

  // Auth - Forgot password
  forgotPasswordTitle: 'Reset password',
  forgotPasswordDesc: 'Enter your email address and we will send you a reset link.',
  sendLink: 'Send link',
  backToLogin: '← Back to login',
  emailSentTitle: 'Email sent!',
  emailSentDesc: 'A password reset link has been sent to this address.',
  spamNote: "If you don't receive it, check your spam folder.",
  resetLinkSentTo: 'Reset link sent to',
  aiAssistant: 'AI Assistant',
}

// ─── Context ──────────────────────────────────────────────────────────────────

const translations: Record<Language, Translations> = { uz, ru, en }

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) ?? 'uz'
  })

  function setLanguage(lang: Language) {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}
