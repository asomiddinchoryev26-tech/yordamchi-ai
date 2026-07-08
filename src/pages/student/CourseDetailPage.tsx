import { useParams } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { t } = useLanguage()

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{t.cdTitle}</h1>
      <p className="text-sm text-muted-foreground mb-6">ID: {courseId}</p>
      <p className="text-muted-foreground">{t.cdComingSoon}</p>
    </div>
  )
}
