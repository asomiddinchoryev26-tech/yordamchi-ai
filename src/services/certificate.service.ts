// jsPDF is lazy-loaded inside generateCertificatePDF() so it ships as its own
// chunk (loaded only when a certificate is generated), not in the main bundle.

// ─── Tiplari ──────────────────────────────────────────────────────────────────

export interface CertificateData {
  studentName:      string
  achievementTitle: string
  achievementTier:  'gold' | 'silver' | 'bronze' | 'special'
  achievementEmoji: string
  earnedAt:         string
  certId:           string
  periodLabel:      string
}

// ─── Konstantalar ─────────────────────────────────────────────────────────────

const TIER_RGB: Record<string, [number, number, number]> = {
  gold:    [196, 150, 40],
  silver:  [100, 116, 132],
  bronze:  [170, 110, 65],
  special: [134, 85, 234],
}

const TIER_RGB_LIGHT: Record<string, [number, number, number]> = {
  gold:    [255, 247, 220],
  silver:  [240, 244, 248],
  bronze:  [255, 243, 232],
  special: [246, 240, 255],
}

const TIER_LABELS: Record<string, string> = {
  gold:    'OLTIN',
  silver:  'KUMUSH',
  bronze:  'BRONZA',
  special: 'MAXSUS',
}

const MONTHS_UZ = [
  'Yanvar','Fevral','Mart','Aprel','May','Iyun',
  'Iyul','Avgust','Sentabr','Oktyabr','Noyabr','Dekabr',
]

// ─── Asosiy funksiya ──────────────────────────────────────────────────────────

export async function generateCertificatePDF(data: CertificateData): Promise<void> {
  // Load jsPDF on demand — keeps it out of the main app bundle.
  const { jsPDF } = await import('jspdf')
  // A4 landscape: 297mm × 210mm
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const W = 297
  const H = 210

  const [tr, tg, tb]      = TIER_RGB[data.achievementTier]      ?? TIER_RGB.bronze
  const [lr, lg, lb]      = TIER_RGB_LIGHT[data.achievementTier] ?? TIER_RGB_LIGHT.bronze
  const tierLabel          = TIER_LABELS[data.achievementTier]   ?? 'BRONZA'

  // ── 1. Fon ──────────────────────────────────────────────────────────────────
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, W, H, 'F')

  // Tepada yengil rangli chiziq
  doc.setFillColor(lr, lg, lb)
  doc.rect(0, 0, W, 45, 'F')

  // ── 2. Tashqi ramka ─────────────────────────────────────────────────────────
  doc.setDrawColor(tr, tg, tb)
  doc.setLineWidth(1.8)
  doc.rect(8, 8, W - 16, H - 16)

  // Ichki ramka
  doc.setLineWidth(0.5)
  doc.rect(11, 11, W - 22, H - 22)

  // ── 3. Burchak bezaklari ─────────────────────────────────────────────────────
  doc.setFillColor(tr, tg, tb)
  const C = 2.5
  for (const [cx, cy] of [[8, 8], [W - 8, 8], [8, H - 8], [W - 8, H - 8]] as const) {
    doc.rect(cx - C, cy - C, C * 2, C * 2, 'F')
  }

  // ── 4. Logo va platforma nomi ────────────────────────────────────────────────
  // "YA" to'garagi
  doc.setFillColor(tr, tg, tb)
  doc.circle(27, 26, 7.5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('YA', 27, 28.5, { align: 'center' })

  // Platforma nomi
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text('YordamchiAI', 40, 23)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(110, 110, 110)
  doc.text("O'quv boshqaruv tizimi", 40, 30)

  // ── 5. Tier badge (o'ng taraf) ───────────────────────────────────────────────
  const badgeX = W - 60
  doc.setFillColor(tr, tg, tb)
  doc.roundedRect(badgeX, 16, 44, 12, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(tierLabel, badgeX + 22, 24.5, { align: 'center' })

  // ── 6. Ajratuvchi chiziq ─────────────────────────────────────────────────────
  doc.setDrawColor(tr, tg, tb)
  doc.setLineWidth(0.4)
  doc.line(15, 44, W - 15, 44)

  // ── 7. Sarlavha "SERTIFIKAT" ─────────────────────────────────────────────────
  doc.setFontSize(32)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(25, 25, 25)
  doc.text('SERTIFIKAT', W / 2, 70, { align: 'center' })

  // Sarlavha tagida rangli chiziq
  doc.setDrawColor(tr, tg, tb)
  doc.setLineWidth(1)
  const lineHalf = 38
  doc.line(W / 2 - lineHalf, 74.5, W / 2 + lineHalf, 74.5)

  // ── 8. "taqdim etiladi" ──────────────────────────────────────────────────────
  doc.setFontSize(11)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(120, 120, 120)
  doc.text('taqdim etiladi', W / 2, 84, { align: 'center' })

  // ── 9. Talaba ismi ───────────────────────────────────────────────────────────
  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(tr, tg, tb)
  const name = data.studentName || 'Talaba'
  doc.text(name, W / 2, 104, { align: 'center' })

  // Ism tagida ingichka chiziq
  doc.setDrawColor(210, 210, 210)
  doc.setLineWidth(0.35)
  doc.line(50, 108, W - 50, 108)

  // ── 10. Yutuq sarlavhasi ─────────────────────────────────────────────────────
  doc.setFontSize(13.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(45, 45, 45)
  const maxTitleW = W - 60   // mm
  const lines = doc.splitTextToSize(data.achievementTitle, maxTitleW) as string[]
  // Max 2 qator
  const titleLines = lines.slice(0, 2)
  doc.text(titleLines, W / 2, 122, { align: 'center' })

  // ── 11. Pastki ajratuvchi ────────────────────────────────────────────────────
  const bottomY = 147
  doc.setDrawColor(210, 210, 210)
  doc.setLineWidth(0.35)
  doc.line(18, bottomY, W - 18, bottomY)

  // ── 12. Sana / Davr / ID ─────────────────────────────────────────────────────
  const infoY1 = bottomY + 8
  const infoY2 = bottomY + 15
  const labelColor: [number, number, number] = [140, 140, 140]
  const valueColor: [number, number, number] = [40,  40,  40 ]

  // Sana (chap)
  const earnedDate = new Date(data.earnedAt)
  const dateStr = `${earnedDate.getDate()} ${MONTHS_UZ[earnedDate.getMonth()]} ${earnedDate.getFullYear()}`
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...labelColor)
  doc.text('Berilgan sana:', 20, infoY1)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...valueColor)
  doc.text(dateStr, 20, infoY2)

  // Davr (markazda)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...labelColor)
  doc.text('Davr:', W / 2, infoY1, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...valueColor)
  doc.text(data.periodLabel, W / 2, infoY2, { align: 'center' })

  // Sertifikat ID (o'ng)
  const shortId = `CERT-${data.certId.slice(0, 8).toUpperCase()}`
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...labelColor)
  doc.text('Sertifikat ID:', W - 20, infoY1, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...valueColor)
  doc.text(shortId, W - 20, infoY2, { align: 'right' })

  // ── 13. Pastki URL ───────────────────────────────────────────────────────────
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(170, 170, 170)
  doc.text('yordamchi-ai-alpha.vercel.app', W / 2, H - 14, { align: 'center' })

  // ── Saqlash ──────────────────────────────────────────────────────────────────
  const filename = `sertifikat-${data.certId.slice(0, 8)}.pdf`
  doc.save(filename)
}

// ─── Yordamchi ────────────────────────────────────────────────────────────────

export function buildCertId(achievementId: string): string {
  return achievementId
}

export function buildPeriodLabel(year: number, month: number): string {
  return `${MONTHS_UZ[month - 1]} ${year}`
}
