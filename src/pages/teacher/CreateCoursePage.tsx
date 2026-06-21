import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/routes/paths'

// Bu sahifa MyCoursesPage ga yo'naltiradi
export default function CreateCoursePage() {
  const navigate = useNavigate()
  useEffect(() => { navigate(PATHS.TEACHER.COURSES, { replace: true }) }, [navigate])
  return null
}
