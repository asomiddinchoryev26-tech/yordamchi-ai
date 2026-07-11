/**
 * pages/admin/AcademicPage.tsx
 * Institut akademik boshqaruvi — semestrlar + kurslar (kredit bilan).
 * Faqat org_type='institute' tashkilotlarda ko'rinadi (route + nav gate).
 */

import { useState, useEffect, useCallback } from 'react'
import { GraduationCap, Plus, Trash2, Loader2, Check, CalendarDays, BookMarked, X } from 'lucide-react'
import { academicService, type Semester, type Course, type TeacherOpt } from '@/services/academic.service'

const CARD = 'bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm'
const INPUT = 'px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
const BTN = 'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50'
const BTN_BG = { background: 'linear-gradient(135deg,#5B7FFF,#7C3AED)' }

export default function AcademicPage() {
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [courses,   setCourses]   = useState<Course[]>([])
  const [teachers,  setTeachers]  = useState<TeacherOpt[]>([])
  const [loading,   setLoading]   = useState(true)

  // semester form
  const [semName, setSemName] = useState('')
  const [semBusy, setSemBusy] = useState(false)

  // course form
  const [cName, setCName] = useState('')
  const [cCode, setCCode] = useState('')
  const [cCredits, setCCredits] = useState('6')
  const [cSem, setCSem] = useState('')
  const [cTeacher, setCTeacher] = useState('')
  const [cBusy, setCBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [s, c, t] = await Promise.all([academicService.listSemesters(), academicService.listCourses(), academicService.listTeachers()])
    setSemesters(s); setCourses(c); setTeachers(t); setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])

  const addSemester = async () => {
    if (!semName.trim()) return
    setSemBusy(true); setErr(null)
    try { await academicService.createSemester(semName); setSemName(''); await load() }
    catch (e) { setErr(e instanceof Error ? e.message : 'Xatolik') } finally { setSemBusy(false) }
  }
  const addCourse = async () => {
    if (!cName.trim()) return
    setCBusy(true); setErr(null)
    try {
      await academicService.createCourse({ name: cName, code: cCode, credits: Number(cCredits) || 0, semester_id: cSem, teacher_id: cTeacher })
      setCName(''); setCCode(''); setCCredits('6'); setCSem(''); setCTeacher(''); await load()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Xatolik') } finally { setCBusy(false) }
  }
  const delCourse = async (id: string) => { try { await academicService.deleteCourse(id); await load() } catch { /* */ } }
  const delSemester = async (id: string) => { try { await academicService.deleteSemester(id); await load() } catch { /* */ } }

  const semName_ = (id: string | null) => semesters.find(s => s.id === id)?.name ?? '—'
  const teacherName = (id: string | null) => teachers.find(t => t.id === id)?.full_name ?? '—'

  return (
    <div className="space-y-5 pb-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-indigo-500" /> Kurslar va semestrlar
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Institut akademik strukturasi — kurslarni kredit bilan boshqaring</p>
      </div>
      {err && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-center gap-2"><X className="w-4 h-4" /> {err}</div>}

      {/* Semestrlar */}
      <div className={CARD}>
        <div className="flex items-center gap-2 mb-3"><CalendarDays className="w-4 h-4 text-emerald-500" /><h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Semestrlar</h2></div>
        <div className="flex flex-wrap gap-2 mb-3">
          <input value={semName} onChange={e => setSemName(e.target.value)} placeholder="Masalan: 2026 Kuzgi semestr" className={`${INPUT} flex-1 min-w-[200px]`} />
          <button type="button" onClick={() => void addSemester()} disabled={semBusy || !semName.trim()} className={BTN} style={BTN_BG}>
            {semBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Qo‘shish
          </button>
        </div>
        {loading ? <div className="h-10 rounded-xl bg-gray-50 dark:bg-gray-700 animate-pulse" />
          : semesters.length === 0 ? <p className="text-sm text-gray-400">Hali semestr yo‘q</p> : (
          <div className="flex flex-wrap gap-2">
            {semesters.map(s => (
              <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200">
                {s.name}
                <button type="button" onClick={() => void delSemester(s.id)} className="text-red-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Kurslar */}
      <div className={CARD}>
        <div className="flex items-center gap-2 mb-3"><BookMarked className="w-4 h-4 text-indigo-500" /><h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Kurslar</h2></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          <input value={cName} onChange={e => setCName(e.target.value)} placeholder="Kurs nomi (Oliy matematika)" className={INPUT} />
          <input value={cCode} onChange={e => setCCode(e.target.value)} placeholder="Kod (MATH101)" className={INPUT} />
          <input value={cCredits} onChange={e => setCCredits(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Kredit" type="number" min={0} className={INPUT} />
          <select value={cSem} onChange={e => setCSem(e.target.value)} className={INPUT}>
            <option value="">Semestr tanlang</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={cTeacher} onChange={e => setCTeacher(e.target.value)} className={INPUT}>
            <option value="">O‘qituvchi tanlang</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
          <button type="button" onClick={() => void addCourse()} disabled={cBusy || !cName.trim()} className={BTN} style={BTN_BG}>
            {cBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Kurs qo‘shish
          </button>
        </div>
        {loading ? <div className="h-16 rounded-xl bg-gray-50 dark:bg-gray-700 animate-pulse" />
          : courses.length === 0 ? <p className="text-sm text-gray-400">Hali kurs yo‘q</p> : (
          <div className="space-y-2">
            {courses.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold">{c.credits}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{c.name} {c.code && <span className="text-gray-400 font-normal">· {c.code}</span>}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{c.credits} kredit · 📅 {semName_(c.semester_id)} · 👨‍🏫 {teacherName(c.teacher_id)}</p>
                </div>
                <button type="button" onClick={() => void delCourse(c.id)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
