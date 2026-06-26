// ─── Tiplari ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface StudentContext {
  studentName:    string
  groups:         { name: string; subjectName?: string; subjectIcon?: string }[]
  recentLessons:  { title: string; content?: string | null }[]
  testStats:      { passed: number; total: number; avgPct: number }
  attPct:         number | null
  attTotal:       number
}

// ─── Provider interfeysi ───────────────────────────────────────────────────────
// OpenAI yoki boshqa provayderga o'tish uchun faqat shu klassni almashtiring.

export interface AIProvider {
  complete(messages: ChatMessage[], context: StudentContext): Promise<string>
}

// ─── Til aniqlash ─────────────────────────────────────────────────────────────

function detectLang(text: string): 'uz' | 'ru' | 'en' {
  const cyrillic = /[а-яёА-ЯЁ]/.test(text)
  const latinUz  = /[o'g'O'G']|o['`']|g['`']|sh|ch|ng|oʻ|gʻ/i.test(text)
  if (cyrillic && !latinUz) return 'ru'
  if (latinUz || /[a-z]/i.test(text)) return 'uz'
  return 'uz'
}

// ─── Mock AI Provider (MVP) ───────────────────────────────────────────────────
// Real OpenAI integratsiyasi uchun bu klassni OpenAIProvider bilan almashtiring.

export class MockAIProvider implements AIProvider {
  async complete(messages: ChatMessage[], ctx: StudentContext): Promise<string> {
    // Oxirgi foydalanuvchi xabari
    const last   = messages.filter(m => m.role === 'user').at(-1)?.content ?? ''
    const lang   = detectLang(last)
    const isFirst = messages.filter(m => m.role === 'user').length === 1

    // 1-xabarda salom
    if (isFirst || /^(salom|assalom|привет|hello|hi|hey)\b/i.test(last.trim())) {
      return this.greeting(ctx, lang)
    }

    // Mavzuga mos javob
    return this.route(last.toLowerCase(), ctx, lang)
  }

  private greeting(ctx: StudentContext, lang: 'uz' | 'ru' | 'en'): string {
    const name     = ctx.studentName || 'Talaba'
    const subjects = ctx.groups.map(g => g.subjectIcon ? `${g.subjectIcon} ${g.subjectName ?? g.name}` : g.name)
    const subjStr  = subjects.length > 0 ? subjects.join(', ') : ''

    if (lang === 'ru') {
      return `Привет, ${name}! 👋\n\nЯ YordamchiAI — ваш персональный учебный ассистент.\n\n${subjStr ? `Вы изучаете: **${subjStr}**\n\n` : ''}Я могу помочь вам:\n• Объяснить темы по вашим предметам\n• Ответить на вопросы по урокам\n• Помочь с подготовкой к тестам\n• Дать советы по учёбе\n\nС чего начнём? 😊`
    }
    if (lang === 'en') {
      return `Hello, ${name}! 👋\n\nI'm YordamchiAI — your personal learning assistant.\n\n${subjStr ? `You are studying: **${subjStr}**\n\n` : ''}I can help you:\n• Explain topics from your subjects\n• Answer questions about lessons\n• Help you prepare for tests\n• Give study tips\n\nWhat shall we start with? 😊`
    }
    return `Assalomu alaykum, ${name}! 👋\n\nMen YordamchiAI — sizning shaxsiy o'quv yordamchingizman.\n\n${subjStr ? `Siz o'qiyotgan fanlar: **${subjStr}**\n\n` : ''}Sizga quyidagilarda yordam bera olaman:\n• Dars mavzularini tushuntirish\n• Savollaringizga javob berish\n• Test tayyorgarligida yordam\n• O'qish maslahatlari\n\nNimadan boshlaylik? 😊`
  }

  private route(q: string, ctx: StudentContext, lang: 'uz' | 'ru' | 'en'): string {
    // Davomat
    if (/davomat|qatnash|keldim|kelmad|присутств|посещ|attendance/i.test(q)) {
      return this.attendance(ctx, lang)
    }
    // Test / imtihon
    if (/test|imtihon|quiz|sinov|экзамен|тест/i.test(q)) {
      return this.tests(ctx, lang)
    }
    // Dars / lesson
    if (/dars|lesson|mavzu|тема|урок|lecture/i.test(q)) {
      return this.lessons(ctx, lang)
    }
    // Yordam / help
    if (/yordam|help|pomogi|pomoch|что умеешь|nima qila/i.test(q)) {
      return this.help(ctx, lang)
    }
    // Motivatsiya
    if (/qiyin|mushkul|tushunmad|не понимаю|трудно|hard|difficult|usam|charchad/i.test(q)) {
      return this.motivate(ctx, lang)
    }
    // Matematik hisoblash
    if (/\d+\s*[+\-*/^]\s*\d+|hisobla|calculate|вычисл|formula/i.test(q)) {
      return this.math(q, lang)
    }
    // Tarif / ta'rif / definition
    if (/nima bu|что такое|what is|ta'rif|определени|definition/i.test(q)) {
      return this.definition(q, ctx, lang)
    }
    // Reja / schedule
    if (/reja|jadval|расписан|schedule|timetable|qachon/i.test(q)) {
      return this.schedule(ctx, lang)
    }
    // Mavzuga mos agar guruh fanlaridan biri bo'lsa
    const matchedSubject = ctx.groups.find(g =>
      g.subjectName && q.includes(g.subjectName.toLowerCase())
    )
    if (matchedSubject) {
      return this.subjectHelp(matchedSubject.subjectName ?? matchedSubject.name, ctx, lang)
    }
    // Umumiy javob
    return this.general(q, ctx, lang)
  }

  private attendance(ctx: StudentContext, lang: 'uz' | 'ru' | 'en'): string {
    const pct = ctx.attPct
    if (lang === 'ru') {
      if (pct === null) return 'У вас пока нет записей о посещаемости. Как только начнутся занятия, здесь появится статистика.'
      const eval_ = pct >= 80 ? '— отличный результат! 🌟' : pct >= 60 ? '— старайтесь посещать больше занятий.' : '— это низкий показатель. Постарайтесь не пропускать занятия!'
      return `Ваша посещаемость: **${pct}%** из ${ctx.attTotal} занятий ${eval_}\n\nРегулярное посещение напрямую влияет на ваш итоговый балл. Советую поддерживать посещаемость выше 80%.`
    }
    if (lang === 'en') {
      if (pct === null) return 'You have no attendance records yet. Statistics will appear once classes begin.'
      const eval_ = pct >= 80 ? '— excellent! 🌟' : pct >= 60 ? '— try to attend more classes.' : '— this is low. Try not to miss classes!'
      return `Your attendance: **${pct}%** out of ${ctx.attTotal} sessions ${eval_}\n\nRegular attendance directly affects your final score. I recommend keeping attendance above 80%.`
    }
    if (pct === null) return "Hali davomatga yozuv yo'q. Darslar boshlangach bu yerda statistika paydo bo'ladi."
    const eval_ = pct >= 80 ? '— ajoyib natija! 🌟' : pct >= 60 ? '— ko\'proq darslarga qatnashishga harakat qiling.' : "— bu past ko'rsatkich. Darslardan qolmang!"
    return `Sizning davomatingiz: **${pct}%** — ${ctx.attTotal} ta darsdan ${eval_}\n\nMuntazam qatnashish yakuniy balingizga to'g'ridan-to'g'ri ta'sir qiladi. Davomatingizni 80% dan yuqori ushlab turishni tavsiya etaman.`
  }

  private tests(ctx: StudentContext, lang: 'uz' | 'ru' | 'en'): string {
    const { passed, total, avgPct } = ctx.testStats
    const tips = [
      lang === 'ru' ? 'Повторяйте материал за день до теста' : lang === 'en' ? 'Review material the day before the test' : 'Testdan bir kun oldin materialni takrorlang',
      lang === 'ru' ? 'Решайте по одному вопросу и не спешите' : lang === 'en' ? 'Answer one question at a time, do not rush' : 'Savollarni birma-bir yechib, shoshilmang',
      lang === 'ru' ? 'Сначала ответьте на лёгкие вопросы' : lang === 'en' ? 'Answer easy questions first' : 'Avval oson savollarni yechib oling',
      lang === 'ru' ? 'Исключайте явно неверные варианты' : lang === 'en' ? 'Eliminate obviously wrong answers' : "Noto'g'ri javoblarni avval chetlatib tashlang",
    ]

    if (lang === 'ru') {
      if (total === 0) return `У вас пока нет результатов тестов.\n\n**Советы для подготовки:**\n${tips.map(t => `• ${t}`).join('\n')}`
      return `Ваши результаты тестов:\n• Пройдено: **${passed} из ${total}**\n• Средний балл: **${avgPct}%**\n\n**Советы для подготовки:**\n${tips.map(t => `• ${t}`).join('\n')}`
    }
    if (lang === 'en') {
      if (total === 0) return `You have no test results yet.\n\n**Preparation tips:**\n${tips.map(t => `• ${t}`).join('\n')}`
      return `Your test results:\n• Passed: **${passed} out of ${total}**\n• Average score: **${avgPct}%**\n\n**Preparation tips:**\n${tips.map(t => `• ${t}`).join('\n')}`
    }
    if (total === 0) return `Hali test natijalaringiz yo'q.\n\n**Tayyorgarlik maslahatlari:**\n${tips.map(t => `• ${t}`).join('\n')}`
    return `Sizning test natijalaringiz:\n• O'tganlari: **${passed} ta / ${total} tadan**\n• O'rtacha ball: **${avgPct}%**\n\n**Tayyorgarlik maslahatlari:**\n${tips.map(t => `• ${t}`).join('\n')}`
  }

  private lessons(ctx: StudentContext, lang: 'uz' | 'ru' | 'en'): string {
    const recent = ctx.recentLessons.slice(0, 3)
    if (lang === 'ru') {
      if (recent.length === 0) return 'Пока нет доступных уроков. Спросите меня о конкретной теме — я постараюсь помочь!'
      const list = recent.map(l => `• **${l.title}**`).join('\n')
      return `Ваши последние уроки:\n${list}\n\nХотите, чтобы я объяснил какую-то из этих тем подробнее? Просто напишите название темы!`
    }
    if (lang === 'en') {
      if (recent.length === 0) return 'No lessons available yet. Ask me about a specific topic and I will try to help!'
      const list = recent.map(l => `• **${l.title}**`).join('\n')
      return `Your recent lessons:\n${list}\n\nWould you like me to explain any of these topics in more detail? Just write the topic name!`
    }
    if (recent.length === 0) return "Hali mavjud darslar yo'q. Biron mavzu haqida so'rang — yordam berishga harakat qilaman!"
    const list = recent.map(l => `• **${l.title}**`).join('\n')
    return `Sizning so'nggi darslaringiz:\n${list}\n\nQaysi mavzuni batafsil tushuntirishimni istaysiz? Mavzu nomini yozing!`
  }

  private help(ctx: StudentContext, lang: 'uz' | 'ru' | 'en'): string {
    const subjs = ctx.groups.map(g => g.subjectName ?? g.name).filter(Boolean)
    if (lang === 'ru') {
      return `Я могу помочь вам со следующим:\n\n📚 **Учёба**\n• Объяснить темы${subjs.length ? ` (${subjs.join(', ')})` : ''}\n• Ответить на вопросы по урокам\n• Помочь с подготовкой к тестам\n\n📊 **Ваша статистика**\n• Посещаемость\n• Результаты тестов\n• Прогресс обучения\n\n💡 **Советы**\n• Методы эффективного обучения\n• Тайм-менеджмент\n• Мотивация\n\nПросто напишите ваш вопрос!`
    }
    if (lang === 'en') {
      return `I can help you with:\n\n📚 **Study**\n• Explain topics${subjs.length ? ` (${subjs.join(', ')})` : ''}\n• Answer lesson questions\n• Test preparation\n\n📊 **Your stats**\n• Attendance\n• Test results\n• Learning progress\n\n💡 **Tips**\n• Effective study methods\n• Time management\n• Motivation\n\nJust write your question!`
    }
    return `Sizga quyidagilarda yordam bera olaman:\n\n📚 **O'qish**\n• Mavzularni tushuntirish${subjs.length ? ` (${subjs.join(', ')})` : ''}\n• Dars savollariga javob berish\n• Test tayyorgarligida ko'mak\n\n📊 **Statistikangiz**\n• Davomat holati\n• Test natijalari\n• O'quv progressi\n\n💡 **Maslahatlar**\n• Samarali o'qish usullari\n• Vaqtni boshqarish\n• Motivatsiya\n\nSavolingizni yozing!`
  }

  private motivate(ctx: StudentContext, lang: 'uz' | 'ru' | 'en'): string {
    const name = ctx.studentName.split(' ')[0] || 'Do\'st'
    const msgs_uz = [
      `${name}, hamma ham qiyin paytlardan o'tadi. Muhimi — davom etish! Har kichik qadam muvaffaqiyatga olib boradi. 💪`,
      `O'qish ba'zan og'ir tuyuladi, lekin siz bu yerda ekanligingiz allaqachon katta qadam. Birga hal qilamiz! 🌟`,
      `Qiyin mavzu — bu sizning miyangiz o'sib borayotganining belgisi. Savolingizni yozing, tushuntirib beraman. 🧠`,
    ]
    const msgs_ru = [
      `${name}, все проходят через трудности. Главное — продолжать! Каждый маленький шаг ведёт к успеху. 💪`,
      `Учёба иногда кажется сложной, но то, что вы здесь — уже большой шаг. Разберёмся вместе! 🌟`,
      `Сложная тема — это знак того, что ваш мозг растёт. Напишите вопрос, объясню! 🧠`,
    ]
    const msgs_en = [
      `${name}, everyone goes through tough times. The key is to keep going! Every small step leads to success. 💪`,
      `Learning can feel hard sometimes, but being here is already a big step. Let's figure it out together! 🌟`,
      `A difficult topic means your brain is growing. Write your question and I'll explain! 🧠`,
    ]
    const msgs = lang === 'ru' ? msgs_ru : lang === 'en' ? msgs_en : msgs_uz
    return msgs[Math.floor(Math.random() * msgs.length)]
  }

  private math(q: string, lang: 'uz' | 'ru' | 'en'): string {
    // Oddiy hisoblash
    const match = q.match(/(\d+(?:\.\d+)?)\s*([+\-*/])\s*(\d+(?:\.\d+)?)/)
    if (match) {
      const a = parseFloat(match[1])
      const b = parseFloat(match[3])
      const op = match[2]
      let result: number | string
      if (op === '+') result = a + b
      else if (op === '-') result = a - b
      else if (op === '*') result = a * b
      else result = b !== 0 ? +(a / b).toFixed(6) : 'noaniq (0 ga bo\'lish)'

      if (lang === 'ru') return `${a} ${op} ${b} = **${result}**\n\nЕсли хотите решить более сложный пример, напишите его полностью!`
      if (lang === 'en') return `${a} ${op} ${b} = **${result}**\n\nFor a more complex calculation, write it out in full!`
      return `${a} ${op} ${b} = **${result}**\n\nMurakkab misol uchun to'liq yozing!`
    }
    if (lang === 'ru') return 'Напишите математический пример, например: **2 + 2** или **15 * 4** — я вычислю!'
    if (lang === 'en') return 'Write a math example, like: **2 + 2** or **15 * 4** — I will calculate it!'
    return "Matematik misolni yozing, masalan: **2 + 2** yoki **15 * 4** — hisoblab beraman!"
  }

  private definition(q: string, _ctx: StudentContext, lang: 'uz' | 'ru' | 'en'): string {
    // Savol ichidan kalit so'zni aniqlash
    const cleaned = q
      .replace(/nima bu|что такое|what is|ta'rif|определение|definition/gi, '')
      .replace(/[?]/g, '')
      .trim()
    const term = cleaned.slice(0, 40) || 'bu mavzu'

    if (lang === 'ru') return `Вы спрашиваете о **"${term}"**.\n\nЯ пока работаю в базовом режиме. Для точного определения советую:\n• Обратиться к материалам ваших уроков\n• Спросить у преподавателя\n• Поискать в учебнике\n\nЕсли у вас есть конкретный вопрос по этой теме — напишите, постараюсь помочь!`
    if (lang === 'en') return `You are asking about **"${term}"**.\n\nI am currently in basic mode. For an accurate definition I suggest:\n• Check your lesson materials\n• Ask your teacher\n• Look it up in your textbook\n\nIf you have a specific question about this topic, write it and I will try to help!`
    return `Siz **"${term}"** haqida so'rayapsiz.\n\nHozircha asosiy rejimda ishlamoqdaman. Aniq ta'rif uchun:\n• Dars materiallaringizni ko'ring\n• O'qituvchingizdan so'rang\n• Darslikdan izlang\n\nBu mavzu bo'yicha aniq savolingiz bo'lsa — yozing, yordam berishga harakat qilaman!`
  }

  private schedule(ctx: StudentContext, lang: 'uz' | 'ru' | 'en'): string {
    const groups = ctx.groups.map(g => `• ${g.subjectIcon ?? ''} **${g.name}**${g.subjectName ? ` — ${g.subjectName}` : ''}`).join('\n')
    if (lang === 'ru') return `Ваши группы:\n${groups || '• Группы не найдены'}\n\nРасписание занятий уточните у вашего преподавателя или в разделе «Уроки».`
    if (lang === 'en') return `Your groups:\n${groups || '• No groups found'}\n\nFor the class schedule, check with your teacher or visit the Lessons section.`
    return `Sizning guruhlaringiz:\n${groups || "• Guruhlar topilmadi"}\n\nDars jadvalini o'qituvchingizdan yoki "Darslarim" bo'limidan bilib oling.`
  }

  private subjectHelp(subjectName: string, ctx: StudentContext, lang: 'uz' | 'ru' | 'en'): string {
    const lessons = ctx.recentLessons.slice(0, 3)
    if (lang === 'ru') {
      const list = lessons.length ? lessons.map(l => `• ${l.title}`).join('\n') : '• Уроки пока не добавлены'
      return `По предмету **${subjectName}** у вас следующие уроки:\n${list}\n\nЗадайте конкретный вопрос по теме, и я постараюсь объяснить!`
    }
    if (lang === 'en') {
      const list = lessons.length ? lessons.map(l => `• ${l.title}`).join('\n') : '• No lessons added yet'
      return `For the subject **${subjectName}** you have the following lessons:\n${list}\n\nAsk a specific question about the topic and I will try to explain!`
    }
    const list = lessons.length ? lessons.map(l => `• ${l.title}`).join('\n') : "• Darslar hali qo'shilmagan"
    return `**${subjectName}** fanidan quyidagi darslaringiz bor:\n${list}\n\nMavzu bo'yicha aniq savol bering — tushuntirib beraman!`
  }

  private general(_q: string, ctx: StudentContext, lang: 'uz' | 'ru' | 'en'): string {
    const subjs = ctx.groups.map(g => g.subjectName ?? g.name).filter(Boolean)
    if (lang === 'ru') {
      return `Хороший вопрос! Я учебный ассистент, специализируюсь на вашей учёбе${subjs.length ? ` (${subjs.join(', ')})` : ''}.\n\nЯ могу помочь с:\n• Вопросами по урокам\n• Подготовкой к тестам\n• Статистикой посещаемости и результатами\n\nПопробуйте задать вопрос по учебной теме!`
    }
    if (lang === 'en') {
      return `Good question! I am a learning assistant specializing in your studies${subjs.length ? ` (${subjs.join(', ')})` : ''}.\n\nI can help with:\n• Lesson questions\n• Test preparation\n• Attendance and test result statistics\n\nTry asking a question about your study topics!`
    }
    return `Yaxshi savol! Men o'quv yordamchisiman, sizning ta'limingizga${subjs.length ? ` (${subjs.join(', ')})` : ''} ixtisoslashganman.\n\nYordam bera oladiganlarim:\n• Dars mavzulari bo'yicha savollar\n• Test tayyorgarligida ko'mak\n• Davomat va test natijalaringiz statistikasi\n\nO'quv mavzusi bo'yicha savol berib ko'ring!`
  }
}

// ─── Edge Function Provider (Gemini 2.5 Flash) ───────────────────────────────
// Supabase Edge Function "ai-chat" orqali Gemini API ga murojaat qiladi.
// Provaydern almashtirish uchun faqat export qatorini o'zgartiring.

import { supabase } from '@/lib/supabase'

class EdgeFunctionProvider implements AIProvider {
  async complete(messages: ChatMessage[], context: StudentContext): Promise<string> {
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: { messages, context },
    })
    if (error) {
      // FunctionsHttpError.context — Edge Function'ning haqiqiy response body'si
      const ctx = (error as unknown as { context?: { error?: string } }).context
      const detail = ctx?.error ?? error.message
      throw new Error(detail)
    }
    if (data?.error) throw new Error(data.error as string)
    if (!data?.response) throw new Error('AI xizmatidan bo\'sh javob keldi')
    return data.response as string
  }
}

// ─── Eksport ──────────────────────────────────────────────────────────────────
// Provaydern almashtirish: shu qatorni o'zgartiring:
//   export const aiProvider: AIProvider = new MockAIProvider()   ← test uchun
//   export const aiProvider: AIProvider = new EdgeFunctionProvider() ← Gemini

export const aiProvider: AIProvider = new EdgeFunctionProvider()

// ─── Context yuklash ──────────────────────────────────────────────────────────

export async function loadStudentContext(studentId: string, studentName: string): Promise<StudentContext> {
  const [enrollRes, testRes, attRes] = await Promise.all([
    supabase
      .from('student_groups')
      .select('group:groups(id, name, subject:subjects(name, icon))')
      .eq('student_id', studentId),
    supabase
      .from('test_results')
      .select('score, total_questions')
      .eq('student_id', studentId)
      .not('submitted_at', 'is', null),
    supabase
      .from('attendance')
      .select('status')
      .eq('student_id', studentId),
  ])

  // Guruhlar + fanlar
  const groups = ((enrollRes.data ?? []) as any[]).map((e) => {
    const g    = e.group
    const subj = g?.subject
    return {
      name:        g?.name ?? '',
      subjectName: subj?.name ?? undefined,
      subjectIcon: subj?.icon ?? undefined,
    }
  }).filter(g => g.name)

  // Guruh IDlaridan so'nggi darslarni olish
  const groupIds = ((enrollRes.data ?? []) as any[]).map(e => e.group?.id).filter(Boolean)
  let recentLessons: { title: string; content?: string | null }[] = []
  if (groupIds.length > 0) {
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('title, content')
      .in('group_id', groupIds)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(5)
    recentLessons = lessonData ?? []
  }

  // Test statistikasi
  const tests   = testRes.data ?? []
  const passed  = tests.filter(t => t.total_questions > 0 && (t.score / t.total_questions) >= 0.6).length
  const avgPct  = tests.length > 0
    ? Math.round(tests.reduce((a, t) => a + (t.total_questions > 0 ? (t.score / t.total_questions) * 100 : 0), 0) / tests.length)
    : 0

  // Davomat
  const attData  = attRes.data ?? []
  const present  = attData.filter(a => a.status === 'present').length
  const attTotal = attData.length
  const attPct   = attTotal > 0 ? Math.round((present / attTotal) * 100) : null

  return {
    studentName: studentName,
    groups,
    recentLessons,
    testStats: { passed, total: tests.length, avgPct },
    attPct,
    attTotal,
  }
}
