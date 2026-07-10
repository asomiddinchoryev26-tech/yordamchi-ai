/**
 * lib/orgTerms.ts
 * Tashkilot turiga qarab atamalar (maktab / institut / o'quv markazi).
 * Faqat KO'RINISH o'zgaradi — mantiq bir xil (guruh = guruh, faqat nomi boshqacha).
 *
 * Ishlatish:  const term = useOrgTerms();  term.group  // "Sinf" / "Kurs" / "Guruh"
 */

import type { OrgType } from '@/types/auth.types'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'

type Lang = 'uz' | 'ru' | 'en'

export interface OrgTerms {
  group:    string   // "Guruh"
  groups:   string   // "Guruhlar"
  student:  string   // "O'quvchi"
  students: string   // "O'quvchilar"
}

// [group, groups, student, students]
const TERMS: Record<OrgType, Record<Lang, [string, string, string, string]>> = {
  school: {
    uz: ['Sinf', 'Sinflar', "O'quvchi", "O'quvchilar"],
    ru: ['Класс', 'Классы', 'Ученик', 'Ученики'],
    en: ['Class', 'Classes', 'Student', 'Students'],
  },
  institute: {
    uz: ['Kurs', 'Kurslar', 'Talaba', 'Talabalar'],
    ru: ['Курс', 'Курсы', 'Студент', 'Студенты'],
    en: ['Course', 'Courses', 'Student', 'Students'],
  },
  center: {
    uz: ['Guruh', 'Guruhlar', 'Tinglovchi', 'Tinglovchilar'],
    ru: ['Группа', 'Группы', 'Слушатель', 'Слушатели'],
    en: ['Group', 'Groups', 'Learner', 'Learners'],
  },
}

export function orgTerms(type: OrgType | null, language: string): OrgTerms {
  const lang = (['uz', 'ru', 'en'].includes(language) ? language : 'uz') as Lang
  const [group, groups, student, students] = TERMS[type ?? 'school'][lang]
  return { group, groups, student, students }
}

/** Joriy foydalanuvchi tashkiloti turiga mos atamalar. */
export function useOrgTerms(): OrgTerms {
  const { user } = useAuth()
  const { language } = useLanguage()
  return orgTerms(user?.orgType ?? null, language)
}
