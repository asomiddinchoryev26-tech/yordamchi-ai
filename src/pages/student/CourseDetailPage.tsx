import { useParams } from 'react-router-dom'

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Course Detail</h1>
      <p className="text-sm text-muted-foreground mb-6">ID: {courseId}</p>
      <p className="text-muted-foreground">Course content and lessons coming soon.</p>
    </div>
  )
}
