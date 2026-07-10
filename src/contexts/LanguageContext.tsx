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
  heroTitle: string        // Fallback title with | split
  heroSubtitle: string     // Fallback subtitle
  heroBadge: string        // Eyebrow badge above headline
  heroCtaPrimary: string   // Primary CTA button label
  heroCtaSecondary: string // Secondary CTA button label
  heroCtaDemo: string      // Secondary CTA label
  heroNoCreditCard: string // Friction reducer
  heroRoleStudent: string  // Role tab: student
  heroRoleTeacher: string  // Role tab: teacher
  heroRoleSchool: string   // Role tab: school/institution
  // Dynamic per-role headlines (| splits plain|gradient)
  heroTitleStudent: string
  heroTitleTeacher: string
  heroTitleSchool: string
  // Dynamic per-role subtitles (sentences separated by '. ')
  heroSubtitleStudent: string
  heroSubtitleTeacher: string
  heroSubtitleSchool: string
  // Conversion copy
  heroDiff: string              // ChatGPT differentiation line
  heroUrgency: string           // Urgency/beta copy
  heroSocialInline: string      // Inline social proof above CTA
  heroTrustNoInstall: string    // Trust badge: no installation
  heroCtaStudentAction: string  // Role-specific primary CTA — student
  heroCtaTeacherAction: string  // Role-specific primary CTA — teacher
  heroCtaSchoolAction: string   // Role-specific primary CTA — school
  heroAlreadyUser: string       // "Already have an account?" text
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
  // Welcome + Role selection (auth flow)
  welcomeGreeting: string
  welcomePreparing: string
  roleSelectSubtitle: string
  roleContinue: string
  haveAccountQ: string
  roleStudentTitle: string
  roleStudentDesc: string
  roleStudentP1: string
  roleStudentP2: string
  roleStudentP3: string
  roleStudentP4: string
  roleTeacherTitle: string
  roleTeacherDesc: string
  roleTeacherP1: string
  roleTeacherP2: string
  roleTeacherP3: string
  roleTeacherP4: string
  roleSchoolTitle: string
  roleSchoolDesc: string
  roleSchoolP1: string
  roleSchoolP2: string
  roleSchoolP3: string
  roleSchoolP4: string
  // Landing — Audience + Statistics
  audienceHeading: string
  detailsBtn: string
  audStudentTitle: string
  audStudentP1: string
  audStudentP2: string
  audStudentP3: string
  audStudentP4: string
  audTeacherTitle: string
  audTeacherP1: string
  audTeacherP2: string
  audTeacherP3: string
  audTeacherP4: string
  audSchoolTitle: string
  audSchoolP1: string
  audSchoolP2: string
  audSchoolP3: string
  audSchoolP4: string
  statActiveStudents: string
  statInstitutions: string
  statUserRating: string
  // Landing — Features / Pricing / About / FAQ
  secFeaturesTitle: string; secFeaturesSub: string
  featChatT: string; featChatD: string
  featVisionT: string; featVisionD: string
  featTestsT: string; featTestsD: string
  featAttendT: string; featAttendD: string
  featHwT: string; featHwD: string
  featMatT: string; featMatD: string
  secPricingTitle: string; secPricingSub: string; popularBadge: string
  priceFree: string; priceNegotiable: string; pricePeriodMonth: string
  planStarterName: string; planStarterDesc: string; planStarterF1: string; planStarterF2: string; planStarterF3: string; planStarterF4: string; ctaStartFree: string
  planProName: string; planProDesc: string; planProF1: string; planProF2: string; planProF3: string; planProF4: string; planProF5: string; ctaBuyPro: string
  planSchoolName: string; planSchoolDesc: string; planSchoolF1: string; planSchoolF2: string; planSchoolF3: string; planSchoolF4: string; planSchoolF5: string; ctaContact: string
  secAboutTitle: string; secAboutSub: string; aboutParagraph: string
  aboutVal1T: string; aboutVal1D: string; aboutVal2T: string; aboutVal2D: string; aboutVal3T: string; aboutVal3D: string
  secFaqTitle: string; secFaqSub: string
  faqQ1: string; faqA1: string; faqQ2: string; faqA2: string; faqQ3: string; faqA3: string
  faqQ4: string; faqA4: string; faqQ5: string; faqA5: string; faqQ6: string; faqA6: string
  // Student — bottom nav + notifications
  navHome: string; navCourses: string; navAI: string; navStats: string; navProfile: string
  notifTitle: string; notifMarkAll: string; notifEmpty: string; notifLoading: string
  notifNow: string; notifMinAgo: string; notifHourAgo: string; notifDayAgo: string
  // Student — achievements page
  achTitle: string; achSubtitle: string; achNextLevel: string; achLeft: string
  achMyCoins: string; achRecentRewards: string; achBadges: string; achAIRec: string
  achRating: string; achClassRank: string; achSchoolRank: string
  achCompletedLessons: string; achAssignments: string; achAvgAIScore: string; achStudyHours: string; achAttendance: string
  achWeeklyActivity: string; achHourShort: string
  achPresent: string; achAbsent: string; achLate: string; achLateShort: string
  achAttendanceTitle: string; achDays: string; achTimes: string
  achAIAnalysis: string; achRiskLow: string; achRiskMed: string; achRiskHigh: string
  achCertificates: string; achCertEmpty: string; achDownload: string
  // Student — lessons page
  lessTitle: string; lessSubtitle: string
  lessAll: string; lessActive: string; lessCompleted: string; lessLocked: string
  lessSearchPh: string; lessTeacher: string; lessCourse: string; lessDone: string; lessLessonsDone: string; lessContinue: string
  lessMyCourses: string; lessCoursesCount: string
  lessToday: string; lessLastViewed: string; lessContinueBtn: string
  lessStDone: string; lessStProgress: string
  lessAnalytics: string; lessStreak: string
  lessNoHw: string; lessDeadline: string; lessNoDeadline: string
  lessHwGraded: string; lessHwSubmitted: string; lessHwOverdue: string; lessHwDueToday: string; lessHwNotDone: string
  // Student — assignments (AI) page
  asgTitle: string; asgSubtitle: string
  asgAICapabilities: string; asgAICheck: string; asgAIChat: string; asgLimitOver: string; asgClose: string
  pmTitle: string; pmDesc: string; pmF1: string; pmF2: string; pmF3: string; pmCta: string; pmPayMethods: string; pmCard: string
  arAIScore: string; arMistakes: string; arWeakTopics: string
  anAvgScore: string; anImprovement: string; anWeekly: string
  // Student — QR attendance
  qrError: string; qrLockedTitle: string; qrLockedDesc: string; qrTitle: string; qrSubtitle: string
  qrDone: string; qrRewarded: string; qrPlaceholder: string; qrChecking: string; qrMark: string; qrCameraSoon: string
  qrScanBtn: string; qrScanning: string; qrOrCode: string; qrCamDenied: string
  // Teacher — features
  tfViewsSuffix: string; tfLessonViews: string; tfRefresh: string
  tfTotalStudents: string; tfViewed: string; tfCompleted: string
  tfMin: string; tfDoneWatch: string; tfWatched: string; tfNotOpened: string; tfNoStudents: string
  tfGroup: string; tfStartSession: string; tfEnterCode: string; tfExpires: string; tfCloseSession: string; tfCameraSoon: string; tfShowQr: string
  tfQrLockTitle: string; tfQrLockDesc: string; tfVideoLockTitle: string; tfVideoLockDesc: string; tfVideoOpen: string; tfVideoOpenDesc: string
  tfAIStudentAnalysis: string; tfWeakStudents: string; tfAILockTitle: string; tfAILockDesc: string
  // Landing navbar
  nbHome: string; nbFeatures: string; nbPricing: string; nbAbout: string; nbFaq: string
  nbSelectLang: string; nbCloseMenu: string; nbOpenMenu: string; nbMainMenu: string
  // Error / 404 pages
  nf404Title: string; nf404Desc: string; nfGoHome: string; ebTitle: string; ebRetry: string
  // Admin — features
  admFaolPremium: string; admFree: string; admPremiumMgmt: string; admPlan: string; admStart: string; admEnd: string; admSave: string; admSaved: string
  admPermissions: string; admSuperAdmin: string; admNoOtherAdmins: string; admSuper: string; admActive: string; admDisabled: string; admDisable: string; admActivate: string
  // Super Admin PRO
  saSysHealth: string; saLastBackup: string; saSupabaseAuto: string
  saPayCenter: string; saSum: string; saTotalRevenue: string; saMonthlyRevenue: string; saExpired: string; saUserIdManual: string; saUserUuidPh: string; saPayHistory: string
  saAnnCenter: string; saAnnTitlePh: string; saAnnBodyPh: string; saSend: string; saSent: string; saAnnNote: string
  saPromoCodes: string; saCodePh: string; saDiscountPct: string; saFreeDays: string; saDays: string; saLimitPh: string; saCreate: string; saNoPromo: string
  saActivityLog: string; saSearchAction: string; saLogEmpty: string; saOnlySuper: string; saSuperMgmt: string
  // Platform control (super-admin)
  saPlatform: string; saOrgsTitle: string; saStatOrgs: string; saStatUsers: string; saStatPaid: string; saStatRevenue: string
  saMembers: string; saStudentsShort: string; saTeachersShort: string; saSuspend: string; saActivate: string
  saSuspended: string; saActiveOrg: string; saApplyPlan: string; saPlanMonths: string; saNoOrgs: string; saOrgSuspendedNote: string
  saCreateOrg: string; saOrgNamePh: string; saDelete: string; saDeleteOrgConfirm: string; saOrgNotEmptyErr: string
  saUsersTitle: string; saUserSearchPh: string; saNoUsers: string; saCreate2: string
  // Materials — file preview modal
  fpPdf: string; fpImage: string; fpVideo: string; fpAudio: string; fpDocument: string; fpText: string; fpFile: string; fpFilePrefix: string
  fpZoomOut: string; fpZoomIn: string; fpRotate: string; fpFsExit: string; fpFsEnter: string; fpClose: string
  fpCantPreview: string; fpCantPreviewDl: string; fpCantPreviewType: string
  fpRequired: string; fpOptional: string; fpMakeOptional: string; fpMakeRequired: string
  fpFileInfo: string; fpInfo: string; fpCancel: string
  fpName: string; fpExtension: string; fpSize: string; fpUploaded: string; fpUploader: string
  fpViewed: string; fpDownloaded: string; fpLastView: string; fpLastDownload: string
  fpActions: string; fpCopied: string; fpLink: string; fpRename: string; fpReplace: string
  fpComingSoon: string; fpAskAI: string
  // Student dashboard page
  sdGreetMorning: string; sdGreetDay: string; sdGreetEvening: string; sdGreetNight: string
  sdSun: string; sdMon: string; sdTue: string; sdWed: string; sdThu: string; sdFri: string; sdSat: string
  sdToday: string; sdWave: string
  sdTodayLessons: string; sdNoTodayLessons: string; sdNoTodayHint: string
  sdUpcomingLessons: string; sdNoUpcoming: string; sdNoUpcomingHint: string
  sdNoAttendance: string; sdNoAttendanceHint: string
  sdPresent: string; sdLate: string; sdExcused: string; sdAbsent: string
  sdUpcomingBucket: string; sdGraded: string
  sdAiPlaceholder: string; sdAiAsk: string; sdCamera: string; sdGallery: string; sdVoice: string
  sdAlgebra: string; sdPhysics: string; sdChemistry: string; sdEnglish: string; sdHistory: string; sdEssay: string; sdLessonPlan: string
  sdAsgNo: string; sdLoadFailed: string; sdAsgHint: string
  sdStatSolved: string; sdStatAccuracy: string; sdStatAIAvail: string; sdStatLangs: string
  sdRecBefore: string; sdRecAfter: string; sdStartAI: string; sdMyLessons: string
  sdOnlineReady: string; sdStatsShort: string; sdRankShort: string
  sdErrTitle: string; sdErrDesc: string
  // Teacher dashboard page
  tdTabStudents: string; tdTabCourses: string; tdTabReports: string; tdTabAchievements: string
  tdGold: string; tdSilver: string; tdBronze: string; tdSpecial: string; tdBelowBronze: string; tdAchievement: string
  tdTeacher: string; tdRealData: string
  tdStudents: string; tdGroups: string; tdLessons: string; tdTestResults: string
  tdSearchStudent: string; tdNoStudents: string; tdStudentNotFound: string; tdColStudent: string; tdColGroup: string; tdColStatus: string; tdInactive: string; tdCompleted: string
  tdAttSummary: string; tdParticipations: string; tdPresentPct: string; tdGoToAttendance: string
  tdTopStudents: string; tdNoTestResults: string
  tdAchWord: string; tdAchieved: string; tdScoreDistribution: string; tdTotalScore: string
  tdGoldMsg: string; tdSilverMsg: string; tdBronzeMsg: string; tdNoCertYet: string
  tdScoreTest: string; tdScoreConsistency: string; tdScoreActivity: string
  tdForBronze: string; tdForSilver: string; tdForGold: string; tdScoreNeeded: string
  tdAchievedTitle: string; tdCount: string; tdBall: string; tdNoAchYet: string; tdAchEmptyDesc: string
  tdBronzeGoal: string; tdSilverGoal: string; tdGoldGoal: string; tdRecentActivity: string; tdDashboardTitle: string
  tdFullStudents: string; tdGroupWord: string; tdNoGroups: string; tdStudentWord: string; tdLessonWord: string; tdView: string; tdMoreAchievements: string
  // Admin dashboard page
  adWelcome: string; adTitle: string; adInSystem: string; adUsersWord: string; adRealtime: string
  adTabUsers: string; adTabTeachers: string; adTabActivity: string; adCourses: string
  adStudent: string; adAdmin: string; adTeachers: string; adTests: string; adAttRecords: string
  adMonthlySignups: string; adTotal: string; adAllSystemsOk: string
  adSearchUser: string; adAll: string; adUser: string; adRole: string; adJoined: string
  adTeachersCount: string; adGroupC: string; adNoTeachers: string; adAllTeachers: string
  adRecentStudents: string; adCoursesCount: string; adNoCourses: string; adAllCourses: string
  adNoActivity: string; adTest: string; adUserWord: string; adUserNotFound: string
  // Student — lessons page (page-level)
  lpAIHelp: string; lpComingSoon: string; lpAllLessons: string; lpNoResults: string; lpLessonText: string
  lpSummarize: string; lpExplainEasier: string; lpMakeQuiz: string; lpTranslate: string; lpAskAIQ: string; lpContextNote: string
  // Student — tests page
  tsBackToList: string; tsAnswered: string; tsQuestions: string; tsQuestionPalette: string; tsUnanswered: string; tsSubmit: string
  tsResult: string; tsPassed: string; tsRetry: string; tsCorrect: string; tsQuestionWord: string; tsQuestionAnalysis: string; tsCorrectMark: string
  tsMotiv90: string; tsMotiv80: string; tsMotiv60: string; tsMotivLow: string
  tsTitle: string; tsSubtitle: string; tsNoTests: string; tsNoTestsHint: string; tsMinutes: string; tsStart: string
  // Student — assignments page (page-level)
  asgpDueToday: string; asgpFilterAria: string; asgpSubject: string; asgpAllSubjects: string
  asgpLoadFail: string; asgpNoMatch: string; asgpMaxScore: string; asgpMaterials: string
  asgpGrade: string; asgpFeedback: string; asgpMyWork: string; asgpPickFile: string; asgpSubmitBtn: string; asgpDeadlinePassed: string
  asgpAIHelp: string; asgpAIPlaceholder: string; asgpAICheckBtn: string; asgpRecheck: string; asgpNoMaterials: string
  // Student — my progress page
  mpTitle: string; mpSubtitle: string; mpLoadErr: string; mpTestAvg: string; mpPassedTests: string
  mpAttDetail: string; mpByGroup: string; mpPassed: string; mpFailed: string; mpNoResults: string; mpNoResultsHint: string
  // Months (full names)
  mJan: string; mFeb: string; mMar: string; mApr: string; mMay: string; mJun: string
  mJul: string; mAug: string; mSep: string; mOct: string; mNov: string; mDec: string
  // Student — attendance page
  stAttSubtitle: string; stAttOverall: string; stAttEmptyHint: string
  // Student — AI assistant page
  aiNewChat: string; aiSearchPh: string; aiNoConvs: string; aiSearchNotFound: string
  aiPinned: string; aiYesterday: string; aiOlder: string; aiChatWord: string; aiHistory: string; aiOpen: string
  aiCopy: string; aiLike: string; aiDislike: string; aiRegenerate: string; aiContinue: string; aiThinking: string; aiWaiting: string
  aiRename: string; aiRenameEdit: string; aiPin: string; aiUnpin: string
  aiMsgsLoadErr: string; aiNewChatErr: string; aiContinueErr: string; aiRegenErr: string; aiDeleteErr: string
  aiContextPanel: string; aiExport: string; aiDropFile: string; aiRemoveFile: string; aiCancel: string
  aiVoiceUnsupported: string; aiVoiceWrite: string; aiVoiceStop: string
  aiQaMath: string; aiQaMathD: string; aiQaCode: string; aiQaCodeD: string; aiQaTranslate: string; aiQaTranslateD: string
  aiQaPdf: string; aiQaPdfD: string; aiQaEssay: string; aiQaEssayD: string; aiQaTest: string; aiQaTestD: string
  // Profile page (student/teacher shared)
  pfTitle: string; pfSubtitle: string; pfUpdated: string; pfPwChanged: string; pfPwMismatch: string; pfError: string
  pfAdministrator: string; pfAvatarUsing: string; pfAvatarInitials: string; pfUploadPhoto: string; pfAvatarDeleteQ: string; pfYesDelete: string
  pfPersonalInfo: string; pfFullName: string; pfFullNamePh: string; pfEmailNoChange: string; pfPhone: string; pfBioPh: string; pfSaveChanges: string
  pfAccountInfo: string; pfBlocked: string; pfRegistered: string; pfLanguage: string; pfAbout: string
  pfSecurity: string; pfChangePw: string; pfNewPw: string; pfPwMin: string; pfConfirmPw: string; pfPwRepeat: string
  pfAppearance: string; pfThemeNote: string
  // Student — course catalog
  ccTitle: string; ccJoinedGroups: string; ccEmpty: string; ccEmptyHint: string; ccTotalLessons: string; ccActiveCourses: string; ccLesson: string
  // Teacher — courses (lessons manage) page
  tcSubtitle: string; tcNewLesson: string; tcNoGroup: string; tcNoGroupHint: string
  tcEditLesson: string; tcAddLesson: string; tcLessonName: string; tcLessonNamePh: string; tcDate: string; tcSubject: string; tcNoSubject: string
  tcLessonContent: string; tcContentPh: string; tcVideoUrl: string; tcVideoOk: string; tcVideoBad: string
  tcMaterials: string; tcDropAria: string; tcDropActive: string; tcDropIdle: string; tcDropHint: string
  tcUploadAfterSave: string; tcRemove: string; tcNoMaterialYet: string; tcPublish: string; tcAdd: string
  tcLessonsEmpty: string; tcLessonsEmptyHint: string; tcAddFirst: string
  tcPublished: string; tcDraft: string; tcHasText: string; tcDeleteShort: string; tcPublishState: string; tcEditT: string
  tcAttachments: string; tcUploading: string; tcAddFile: string; tcNoFilesYet: string; tcFileTypesHint: string
  tcNameRequired: string; tcSaveErr: string; tcStatusErr: string; tcUploadErr: string; tcReplaceErr: string; tcFileDeleteErr: string; tcDownloadErr: string
  // Teacher — attendance page
  taSubtitle: string; taSaved: string; taNoActiveGroup: string; taNoActiveGroupAssigned: string; taNoName: string; taNotePh: string; taSaveBtn: string
  tgTotalGroups: string; tgTotalStudents: string
  // Admin — achievements management
  aaTitle: string; aaSubtitle: string; aaCycleTitle: string; aaCycleDesc: string; aaYear: string; aaMonth: string
  aaCalculating: string; aaCalculate: string; aaForPeriod: string; aaCycleDone: string; aaSnapshots: string; aaStudTeach: string
  aaAwarded: string; aaNewOrUpdated: string; aaAwardedSuffix: string; aaNoAwards: string; aaTypeWord: string
  aaTotalTypes: string; aaTotalAwarded: string; aaErrorLabel: string; aaNotFound: string; aaMigrationHint: string; aaTimesGiven: string
  // Admin — attendance page
  aatSubtitle: string; aatFrom: string; aatFilter: string; aatSearchPh: string; aatNotFound: string; aatNote: string; aatLimitPrefix: string; aatLimitSuffix: string
  // Admin — subjects page
  sbNameRequired: string; sbTitle: string; sbCount: string; sbNewSubject: string; sbEditSubject: string; sbAddSubject: string
  sbNameLabel: string; sbNamePh: string; sbDescription: string; sbDescPh: string; sbColor: string; sbIcon: string
  sbNamePreview: string; sbDescPreview: string; sbEmpty: string; sbEmptyHint: string; sbAddFirst: string; sbNoDesc: string
  // Admin — teachers page
  thNameRequired: string; thEmailInvalid: string; thNewTeacher: string; thTotal: string; thEditTeacher: string; thAddTeacher: string
  thFullName: string; thNamePh: string; thEmailEditHint: string; thTempPassword: string; thPhone: string; thBioLabel: string; thBioPh: string
  thTeachSubjects: string; thNoSubjectsA: string; thNoSubjectsB: string; thEmptyHint: string; thAddFirst: string; thSearchNotFoundSuffix: string; thFilterNoResult: string; thDeleteQ: string; thGroupWord: string
  // Admin — students page
  stuNewStudent: string; stuEditStudent: string; stuAddStudent: string; stuCount: string; stuNamePh: string; stuExtraInfo: string; stuBioPh: string
  stuAddToGroup: string; stuNoGroupsA: string; stuNoGroupsB: string; stuEmpty: string; stuEmptyHint: string; stuAddFirst: string; stuSearchNotFoundSuffix: string; stuNoGroupAssigned: string
  // Admin — courses page
  acSearchPh: string; acFilterNotFound: string; acEmptyHint: string; acTestWord: string; acFilledSuffix: string
  // Admin — groups page
  agNameRequired: string; agNewGroup: string; agEditGroup: string; agAddGroup: string; agGroupName: string; agNamePh: string; agCapacity: string
  agStartDate: string; agEndDate: string; agDescPh: string; agSearchPh: string; agEmpty: string; agEmptyHint: string; agAddFirst: string; agSearchNotFoundSuffix: string; agSeats: string
  // Admin — lessons page
  alSubtitle: string; alTotalLessons: string; alPublished: string; alSearchPh: string; alEmpty: string; alEmptyHint: string; alNoContent: string
  // Admin — tests page
  atSubtitle: string; atSearchPh: string; atEmpty: string; atEmptyHint: string; atResults: string; atFilterNotFound: string
  // Admin — reports page
  arpSubtitle: string; arpGroupAtt: string; arpAvg: string; arpEmpty: string; arpEmptyHint: string
  // Admin — settings page
  asTitle: string; asSubtitle: string; asSaved: string; asGeneral: string; asSystemInfo: string; asPlatform: string; asVersion: string
  asSecurity: string; asNewPw: string; asConfirmPw: string; asPwChange: string; asPwChanged: string; asPwShort: string; asPwMismatch: string; asPwErr: string
  asOrgName: string; asOrgDesc: string; asOrgDescPh: string; asSupportEmail: string; asMaxGroup: string; asOrgNameReq: string
  // Admin — analytics page
  anTitle: string; anSubtitle: string; anAdmins: string; anMonthlyStudents: string; anMonthlyTeachers: string; anNoData: string; anCount: string
  anAttStates: string; anNoTestResults: string; anPassRate: string; anPassed: string; anFailed: string; anTotalSubmitted: string
  // Public — pricing page
  ppTitle: string; ppSubtitle: string; ppGetStarted: string
  // Teacher — achievements page
  taMyAch: string; taMyAchSub: string; taAchEmptyHint: string; taBall: string; taAboutTitle: string; taAboutDesc: string
  // Student — course detail (placeholder)
  cdTitle: string; cdComingSoon: string
  tstSearchPh: string; tstAllGroups: string; tstNotFound: string
  // Teacher — tests page
  ttNameRequired: string; ttMinQuestion: string; ttFillAllQ: string; ttFillAllOpts: string; ttPublishStatusErr: string
  ttResults: string; ttNoSubmissions: string; ttScore: string; ttPercent: string
  ttEditTest: string; ttNewTest: string; ttTestInfo: string; ttTestName: string; ttTestNamePh: string; ttDesc: string; ttDescPh: string; ttNoGroupSel: string; ttDuration: string; ttPublish: string
  ttQuestions: string; ttAddQuestion: string; ttNoQuestions: string; ttQuestionPh: string; ttVariant: string; ttCreateTest: string
  ttCountWord: string; ttEmpty: string; ttEmptyHint: string; ttPublished: string; ttUnpublish: string; ttPublishAction: string
  // Teacher — assignments page
  tapConfirmDelete: string; tapSubtitle: string; tapNew: string; tapEmpty: string; tapSubmittedCount: string; tapViewWorks: string; tapEdit: string
  tapTitleField: string; tapTitlePh: string; tapDescPh: string; tapNotSelected: string; tapMaxScore: string; tapDeadline: string
  tapGroupsField: string; tapNoGroups: string; tapAttachedFiles: string; tapAttachAfterSave: string; tapAttachFile: string
  // Admin — users page
  auRoleChangeErr: string; auAdmins: string; auJami: string; auAllStatuses: string; auEmpty: string; auNotFound: string; auToggleHint: string; auJoined: string
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
  // AI Teacher Panel
  atpTitle: string; atpPanelAria: string; atpStreakTitle: string; atpInsightsTitle: string
  atpNewBadge: string; atpMasteryTitle: string; atpWeakTitle: string; atpPathTitle: string
  atpGoalTitle: string; atpAchTitle: string; atpMissionTitle: string; atpNextTitle: string
  atpWeeklyActivity: string
  atpLvlBeginner: string; atpLvlLearner: string; atpLvlKnower: string; atpLvlMentor: string; atpLvlExpert: string
  atpLevel: string; atpNextLevel: string
  atpDayMon: string; atpDayTue: string; atpDayWed: string; atpDayThu: string; atpDayFri: string; atpDaySat: string; atpDaySun: string
  atpKun: string; atpStreakActive: string; atpTodayActive: string
  atpMasteryOverall: string
  atpPathCurrent: string; atpPathTopic3: string; atpPathTopic4: string; atpDone: string; atpInProgress: string
  atpWeakDiscriminant: string; atpWeakNegRoots: string; atpWeakFuncVals: string; atpWeakPractice: string
  atpGoalStudy: string; atpGoalHourSuffix: string; atpGoalReview: string
  atpAch1Name: string; atpAch1Desc: string; atpAch2Name: string; atpAch2Desc: string
  atpAch3Name: string; atpAch3Desc: string; atpAch4Name: string; atpAch4Desc: string
  atpAch5Name: string; atpAch5Desc: string; atpAch6Name: string; atpAch6Desc: string
  atpAch7Name: string; atpAch7Desc: string; atpAch8Name: string; atpAch8Desc: string
  atpAchLockedSuffix: string
  atpMissionReward: string; atpMissionTask1: string; atpMissionTask2: string; atpMissionTask3: string
  atpMissionTask4: string; atpMissionTask5: string; atpMissionDoneSuffix: string
  atpNextDesc: string
  atpInsLoading: string; atpInsTestLow: string; atpInsTestHigh: string; atpInsTestNone: string
  atpInsAttLow: string; atpInsAttHigh: string; atpInsAttMid: string; atpInsSubject: string
  atpInsXpHigh: string; atpInsXpMid: string; atpInsXpLow: string
  atpPromptPath: string; atpPromptWeak: string; atpPromptSubject: string
  atpPromptToday: string; atpPromptExam: string; atpPromptWeakImprove: string
  // Avatar uploader / cropper
  avChangePhoto: string; avUploading: string; avUploadPhoto: string; avDelete: string
  avFormatHint: string; avErrFormat: string; avErrSize: string
  avCropTitle: string; avCropDesc: string; avReset: string; avCancel: string; avConfirm: string; avCropHint: string
  emailPlaceholder: string; videoUrlPlaceholder: string
  // Premium — manual payment (admin + user)
  saPendingPayments: string; saViewReceipt: string; saApprove: string; saReject: string
  pmPayTitle: string; pmPayHint: string; pmCardTransfer: string; pmPerMonth: string
  pmUploadReceipt: string; pmSelectReceipt: string; pmSubmitPayment: string; pmBack: string
  pmPaySuccess: string; pmPaySuccessDesc: string; pmReceiptRequired: string; pmPayError: string
  pmChoosePlan: string; pmPendingTitle: string; pmPendingDesc: string
  // Settings page
  setSubtitle: string; setPreferences: string; setAppearance: string; setSecurity: string
  setDarkOn: string; setPremiumTheme: string; setReminders: string; setRemindersDesc: string
  setAiUpdates: string; setAiUpdatesDesc: string; setChangePassword: string
  setActiveSession: string; setSessionDesc: string; setEdit: string
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
  heroSubtitle: "YordamchiAI o'quvchining bilim darajasini tahlil qiladi, zaif mavzularini aniqlaydi va aynan unga mos tushuntirishlar beradi.",
  heroBadge: "AI bilan o'qishning yangi avlodi",
  heroCtaPrimary: 'Bepul boshlash',
  heroCtaSecondary: "Demo ko'rish",
  heroCtaDemo: "Ko'proq ma'lumot",
  heroNoCreditCard: "Kredit karta talab qilinmaydi · 30 kun bepul",
  heroRoleStudent: "Talabaman",
  heroRoleTeacher: "O'qituvchiman",
  heroRoleSchool: "Maktab vakili",
  heroTitleStudent: "Imtihondan qo'rqmang.|AI o'qituvchingiz 24/7 tayyor.",
  heroTitleTeacher: "Dars tayyorgarligiga 2 soat emas.|AI bilan — 20 daqiqa. Har safar.",
  heroTitleSchool: "Barcha sinflar. Barcha natijalar.|Bitta ekranda.",
  heroSubtitleStudent: "Testdan oldin zaif mavzularingiz aniq ko'rsatiladi. Har savolingizga kurs materiallaringiz asosida javob olasiz. Imtihon kuni xotirjam turing — AI bilan tayyor bo'lasiz.",
  heroSubtitleTeacher: "Testlar va dars materiallarini AI bilan daqiqalarda yarating. Har bir talabaning rivojini real vaqtda ko'ring. Davomat, hisobotlar, xabarnomalar — barchasi avtomatik.",
  heroSubtitleSchool: "Barcha o'qituvchilar va talabalar bitta platformada boshqariladi. AI muammoli o'quvchilarni erta aniqlaydi — siz o'z vaqtida choralar ko'rasiz. Ma'muriy ishlar avtomatlashtiriladi.",
  heroDiff: "ChatGPT bilmaydi — YordamchiAI kurs materiallaringizni biladi",
  heroUrgency: "Ilk foydalanuvchilar uchun: Barcha imkoniyatlar bepul",
  heroSocialInline: "1,200+ talaba foydalanmoqda · ★ 4.9/5",
  heroTrustNoInstall: "O'rnatish kerak emas",
  heroCtaStudentAction: "AI o'qituvchimni olaman",
  heroCtaTeacherAction: "AI sinfimni yarataman",
  heroCtaSchoolAction: "Maktabimni modernizatsiya qilaman",
  heroAlreadyUser: "Hisobingiz bormi?",
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
  welcomeGreeting: 'Xush kelibsiz,',
  welcomePreparing: 'AI yordamchingiz tayyorlanmoqda',
  roleSelectSubtitle: "YordamchiAI'dan qanday foydalanmoqchisiz?",
  roleContinue: 'Davom etish',
  haveAccountQ: 'Hisobingiz bormi?',
  roleStudentTitle: 'Talaba',
  roleStudentDesc: "AI yordamchi bilan shaxsiy o'rganish",
  roleStudentP1: 'AI Yordamchi',
  roleStudentP2: 'Kurslar va darslar',
  roleStudentP3: 'Testlar va natijalar',
  roleStudentP4: 'Rivojlanish tahlili',
  roleTeacherTitle: "O'qituvchi",
  roleTeacherDesc: "O'quvchilaringizni boshqaring va baholang",
  roleTeacherP1: "O'quvchilar va guruhlar",
  roleTeacherP2: 'Darslar va topshiriqlar',
  roleTeacherP3: 'Davomat nazorati',
  roleTeacherP4: 'Statistika va tahlil',
  roleSchoolTitle: "Ta'lim muassasasi",
  roleSchoolDesc: "Butun LMS tizimini to'liq boshqaring",
  roleSchoolP1: 'Foydalanuvchilar boshqaruvi',
  roleSchoolP2: "O'qituvchi va o'quvchilar",
  roleSchoolP3: 'Kurslar va hisobotlar',
  roleSchoolP4: "To'liq LMS nazorati",
  audienceHeading: 'Kimlar uchun',
  detailsBtn: 'Batafsil',
  audStudentTitle: 'Talabalar uchun',
  audStudentP1: 'AI yordamchi 24/7',
  audStudentP2: 'Test va imtihonlar',
  audStudentP3: "Mavzular bo'yicha tushuntirishlar",
  audStudentP4: 'Natijalarni kuzatish',
  audTeacherTitle: "O'qituvchilar uchun",
  audTeacherP1: 'Dars materiallarini yuklash',
  audTeacherP2: "O'quvchilarni baholash",
  audTeacherP3: 'Davomat va faoliyat nazorati',
  audTeacherP4: 'Statistikalar va tahlillar',
  audSchoolTitle: 'Maktab va institutlar uchun',
  audSchoolP1: 'LMS platforma',
  audSchoolP2: 'Barcha jarayonlarni boshqarish',
  audSchoolP3: 'Hisobotlar va analitika',
  audSchoolP4: 'Xavfsiz va ishonchli tizim',
  statActiveStudents: 'Faol talabalar',
  statInstitutions: "Ta'lim muassasalari",
  statUserRating: 'Foydalanuvchi reytingi',
  secFeaturesTitle: 'Imkoniyatlar', secFeaturesSub: "YordamchiAI bilan o'qish va o'qitishning barcha vositalari",
  featChatT: 'AI suhbat', featChatD: "Har qanday savolga 24/7 aqlli javob va bosqichma-bosqich tushuntirish.",
  featVisionT: 'Rasm orqali yechim', featVisionD: 'Masala rasmini yuboring — AI Vision uni tahlil qilib yechadi.',
  featTestsT: 'Interaktiv testlar', featTestsD: 'Bilimni sinang — natijalar avtomatik va xavfsiz baholanadi.',
  featAttendT: 'Davomat nazorati', featAttendD: 'Qatnashuv va faollikni real vaqtda kuzatib boring.',
  featHwT: 'Uy vazifalari', featHwD: 'Topshiriqlarni yuboring, qabul qiling, baholang va izohlang.',
  featMatT: "O'quv materiallari", featMatD: 'PDF, video va hujjatlar — barcha darslik materiallari bir joyda.',
  secPricingTitle: 'Narxlar', secPricingSub: "O'zingizga mos rejani tanlang — istalgan vaqtda o'zgartirasiz", popularBadge: 'Ommabop',
  priceFree: 'Bepul', priceNegotiable: 'Kelishuv', pricePeriodMonth: "so'm / oy",
  planStarterName: "Boshlang'ich", planStarterDesc: "Sinab ko'rish uchun", planStarterF1: 'Kunlik AI suhbat (cheklangan)', planStarterF2: 'Asosiy testlar', planStarterF3: '1 ta fan', planStarterF4: 'Rivojlanishni kuzatish', ctaStartFree: 'Bepul boshlash',
  planProName: 'Pro', planProDesc: "Faol o'quvchilar uchun", planProF1: 'Cheksiz AI suhbat', planProF2: 'Barcha test va imtihonlar', planProF3: 'AI Vision — rasm orqali yechim', planProF4: 'Rivojlanish statistikasi', planProF5: 'Ustuvor yordam', ctaBuyPro: 'Pro sotib olish',
  planSchoolName: 'Maktab', planSchoolDesc: 'Maktab va institutlar', planSchoolF1: "Pro'dagi barcha imkoniyatlar", planSchoolF2: "Cheksiz o'quvchilar", planSchoolF3: 'Admin panel va boshqaruv', planSchoolF4: 'Hisobotlar va analitika', planSchoolF5: 'Maxsus integratsiya', ctaContact: "Bog'lanish",
  secAboutTitle: 'Biz haqimizda', secAboutSub: "YordamchiAI — har bir o'quvchiga shaxsiy AI o'qituvchi", aboutParagraph: "YordamchiAI o'quvchining bilim darajasini tahlil qilib, zaif tomonlarini aniqlaydi va aynan unga mos tushuntirishlar beradi. Bizning maqsad — sifatli ta'limni har bir o'quvchi uchun ochiq, tushunarli va qiziqarli qilish.",
  aboutVal1T: "Ilg'or sun'iy intellekt", aboutVal1D: "Gemini asosidagi zamonaviy AI — har bir o'quvchiga moslashadi.", aboutVal2T: "O'zbek tilida", aboutVal2D: "To'liq o'zbek tilida, mahalliy ta'lim dasturiga mos.", aboutVal3T: 'Xavfsiz va ishonchli', aboutVal3D: "Ma'lumotlaringiz himoyalangan, maxfiylik kafolatlanadi.",
  secFaqTitle: "Ko'p so'raladigan savollar", secFaqSub: 'Savollaringizga javob shu yerda',
  faqQ1: 'YordamchiAI nima?', faqA1: "Bu — sun'iy intellekt asosidagi ta'lim platformasi. U o'quvchining bilimini tahlil qiladi, zaif mavzularni aniqlaydi va shaxsiy tushuntirishlar beradi.",
  faqQ2: 'Platforma bepulmi?', faqA2: "Boshlang'ich reja bepul. Kengaytirilgan imkoniyatlar (cheksiz AI suhbat, AI Vision, barcha testlar) uchun Pro reja mavjud.",
  faqQ3: 'AI Vision qanday ishlaydi?', faqA3: "Masala yoki misol rasmini yuborasiz — AI uni o'qib, bosqichma-bosqich yechib beradi va tushuntiradi.",
  faqQ4: 'Qaysi fanlar mavjud?', faqA4: "Matematika, fizika, ona tili, ingliz tili va boshqa maktab fanlari. Ro'yxat doimiy kengaytirilmoqda.",
  faqQ5: "Ma'lumotlarim xavfsizmi?", faqA5: "Ha. Barcha ma'lumotlar shifrlangan holda saqlanadi va uchinchi shaxslarga berilmaydi.",
  faqQ6: "O'qituvchilar uchun qanday foyda?", faqA6: "O'qituvchilar dars materiallarini yuklaydi, testlar yaratadi, davomat va o'quvchilar rivojini kuzatadi.",
  navHome: 'Asosiy', navCourses: 'Kurslar', navAI: 'AI', navStats: 'Statistika', navProfile: 'Profil',
  notifTitle: 'Bildirishnomalar', notifMarkAll: "Barchasini o'qildim", notifEmpty: "Bildirishnomalar yo'q", notifLoading: 'Yuklanmoqda…',
  notifNow: 'hozir', notifMinAgo: 'daqiqa oldin', notifHourAgo: 'soat oldin', notifDayAgo: 'kun oldin',
  achTitle: 'Natijalarim 🏆', achSubtitle: 'Har kuni rivojlanishingizni kuzating', achNextLevel: 'Keyingi darajaga:', achLeft: 'qoldi',
  achMyCoins: 'Mening tangalarim', achRecentRewards: "So'nggi mukofotlar", achBadges: "Badge'lar", achAIRec: 'AI tavsiyasi',
  achRating: 'Reyting', achClassRank: 'Sinf reytingi', achSchoolRank: 'Maktab reytingi',
  achCompletedLessons: 'Tugatilgan darslar', achAssignments: 'Topshiriqlar', achAvgAIScore: "O'rtacha AI baho", achStudyHours: "O'qish soatlari", achAttendance: 'Davomat',
  achWeeklyActivity: 'Haftalik faollik', achHourShort: 's',
  achPresent: 'Keldi', achAbsent: 'Qoldirdi', achLate: 'Kech qoldi', achLateShort: 'Kech',
  achAttendanceTitle: 'Davomat 📅', achDays: 'kun', achTimes: 'marta',
  achAIAnalysis: 'AI tahlili', achRiskLow: 'Past xavf', achRiskMed: "O'rta xavf", achRiskHigh: 'Yuqori xavf',
  achCertificates: 'Sertifikatlar', achCertEmpty: "Sertifikatlar hali yo'q — yutuqlarga erishing", achDownload: 'Yuklab olish',
  lessTitle: 'Mening darslarim 📚', lessSubtitle: 'Bilimingizni har kuni rivojlantiring',
  lessAll: 'Barchasi', lessActive: 'Faol', lessCompleted: 'Bajarilgan', lessLocked: 'Qulflangan',
  lessSearchPh: 'Kurs qidirish...', lessTeacher: "O'qituvchi:", lessCourse: 'Kurs', lessDone: 'Tugallandi', lessLessonsDone: 'dars bajarildi', lessContinue: 'Davom etish',
  lessMyCourses: 'Mening kurslarim', lessCoursesCount: 'ta kurs',
  lessToday: 'Bugungi darslar', lessLastViewed: "Oxirgi ko'rilgan dars", lessContinueBtn: 'Davom ettirish',
  lessStDone: 'Bajarildi', lessStProgress: 'Jarayonda',
  lessAnalytics: "O'quv tahlili", lessStreak: 'Ketma-ket kunlar',
  lessNoHw: "Hozircha topshiriqlar yo'q", lessDeadline: 'Muddat:', lessNoDeadline: 'Muddatsiz',
  lessHwGraded: 'Baholandi', lessHwSubmitted: 'Topshirilgan', lessHwOverdue: "Muddati o'tgan", lessHwDueToday: 'Bugun muddati', lessHwNotDone: 'Bajarilmagan',
  asgTitle: 'Topshiriqlar 📝', asgSubtitle: 'AI yordamida bilimlaringizni rivojlantiring',
  asgAICapabilities: 'AI imkoniyatlaringiz', asgAICheck: 'AI tekshiruv', asgAIChat: 'AI suhbat', asgLimitOver: 'Limit tugadi — Premium →', asgClose: 'Yopish',
  pmTitle: 'Bepul AI limitingiz tugadi 🚀', pmDesc: "Premium bilan cheksiz AI tekshiruv, ko'proq suhbat, rasm va PDF tahlilidan foydalaning.", pmF1: 'AI tekshiruv: kuniga 50 marta', pmF2: 'AI suhbat: kuniga 300 savol', pmF3: 'Rasm va PDF tahlil kengaytirilgan', pmCta: "Premiumga o'tish", pmPayMethods: "To'lov usullari (tez orada)", pmCard: 'Karta',
  arAIScore: 'AI bahosi', arMistakes: 'Xatolar', arWeakTopics: 'Zaif mavzular',
  anAvgScore: "O'rtacha baho", anImprovement: 'AI yaxshilanish', anWeekly: 'Haftalik',
  qrError: 'Xatolik', qrLockedTitle: 'QR Davomat Premium imkoniyat 🚀', qrLockedDesc: 'Premium bilan avtomatik davomatdan foydalaning — QR kodni skanerlab bir zumda belgilang.', qrTitle: 'QR Davomat', qrSubtitle: "O'qituvchi ko'rsatgan QR kodni kiriting",
  qrDone: 'Davomat belgilandi ✅', qrRewarded: "+XP va tangalar hisobingizga qo'shildi", qrPlaceholder: 'QR kod (masalan: A1B2C3)', qrChecking: 'Tekshirilmoqda…', qrMark: 'Davomatni belgilash', qrCameraSoon: "📷 Kamera skaneri keyingi yangilanishda qo'shiladi",
  qrScanBtn: 'Kamera bilan skanerlash', qrScanning: 'Skanerlanmoqda…', qrOrCode: 'yoki kod kiriting', qrCamDenied: "Kameraga ruxsat berilmadi. Kodni qo'lda kiriting.",
  tfViewsSuffix: "ko'rishlar", tfLessonViews: "Dars ko'rishlari", tfRefresh: 'Yangilash',
  tfTotalStudents: "Jami o'quvchi", tfViewed: "Ko'rgan", tfCompleted: 'Tugatgan',
  tfMin: 'daq', tfDoneWatch: 'tugatildi', tfWatched: "ko'rildi", tfNotOpened: 'ochilmagan', tfNoStudents: "Guruhda o'quvchilar yo'q",
  tfGroup: 'Guruh', tfStartSession: 'Sessiya boshlash', tfEnterCode: "Yoki shu kodni kiritadi:", tfExpires: 'Amal muddati:', tfCloseSession: 'Sessiyani yopish', tfCameraSoon: '📷 QR kamera skaneri keyingi yangilanishda', tfShowQr: "O'quvchilar QR kodni skanerlaydi:",
  tfQrLockTitle: 'QR davomat Premium funksiyasi', tfQrLockDesc: 'Premium bilan QR orqali avtomatik davomat oling.', tfVideoLockTitle: 'Video dars Premium', tfVideoLockDesc: 'Video darslar yuklash Premium/Education tarifida mavjud.', tfVideoOpen: 'Video yuklash ochiq ✅', tfVideoOpenDesc: "Darsga video biriktiring — o'quvchilar ko'radi, ko'rish statistikasi yig'iladi.",
  tfAIStudentAnalysis: "AI o'quvchi tahlili", tfWeakStudents: "O'zlashtirishi past o'quvchilar", tfAILockTitle: 'AI tahlil Premium', tfAILockDesc: "Premium bilan AI o'quvchilar zaifligini aniqlaydi.",
  nbHome: 'Bosh sahifa', nbFeatures: 'Imkoniyatlar', nbPricing: 'Narxlar', nbAbout: 'Biz haqimizda', nbFaq: 'FAQ',
  nbSelectLang: 'Tilni tanlash', nbCloseMenu: 'Menyuni yopish', nbOpenMenu: 'Menyuni ochish', nbMainMenu: 'Asosiy menyu',
  nf404Title: 'Sahifa topilmadi', nf404Desc: "Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan.", nfGoHome: 'Bosh sahifaga', ebTitle: 'Nimadir xato ketdi', ebRetry: 'Qayta urinish',
  admFaolPremium: 'Faol Premium', admFree: 'Bepul (Free)', admPremiumMgmt: 'Premium boshqaruvi', admPlan: 'Reja', admStart: 'Boshlanish', admEnd: 'Tugash', admSave: 'Saqlash', admSaved: 'Saqlandi',
  admPermissions: 'Admin ruxsatlari', admSuperAdmin: 'Super Admin', admNoOtherAdmins: "Boshqa adminlar yo'q", admSuper: 'Super', admActive: 'Faol', admDisabled: "O'chirilgan", admDisable: "O'chirish", admActivate: 'Faollashtirish',
  saSysHealth: 'Tizim holati', saLastBackup: "So'nggi backup:", saSupabaseAuto: 'Supabase avtomatik',
  saPayCenter: "To'lov markazi", saSum: "so'm", saTotalRevenue: 'Jami daromad', saMonthlyRevenue: 'Oylik daromad', saExpired: 'Muddati tugagan', saUserIdManual: "Foydalanuvchi ID (qo'lda premium)", saUserUuidPh: 'user uuid…', saPayHistory: "To'lov tarixi",
  saAnnCenter: "E'lonlar markazi", saAnnTitlePh: 'Sarlavha (masalan: Yangi dars 🚀)', saAnnBodyPh: 'Matn (ixtiyoriy)', saSend: 'Yuborish', saSent: 'Yuborildi', saAnnNote: "E'lon mavjud bildirishnoma tizimi orqali tarqatiladi.",
  saPromoCodes: 'Promo kodlar', saCodePh: 'KOD', saDiscountPct: 'Chegirma %', saFreeDays: 'Bepul kun', saDays: 'kun', saLimitPh: 'Limit', saCreate: 'Yaratish', saNoPromo: "Promo kodlar yo'q",
  saActivityLog: 'Faoliyat jurnali', saSearchAction: "Harakat bo'yicha qidirish…", saLogEmpty: "Jurnal bo'sh", saOnlySuper: "Bu bo'lim faqat Super Admin uchun", saSuperMgmt: 'Super Admin boshqaruvi',
  saPlatform: 'Platforma boshqaruvi', saOrgsTitle: 'Tashkilotlar', saStatOrgs: 'Tashkilotlar', saStatUsers: 'Foydalanuvchilar', saStatPaid: "To'lovli", saStatRevenue: 'Jami daromad',
  saMembers: "a'zo", saStudentsShort: 'oʻquvchi', saTeachersShort: 'ustoz', saSuspend: 'Bloklash', saActivate: 'Faollashtirish',
  saSuspended: 'Bloklangan', saActiveOrg: 'Faol', saApplyPlan: "Reja o'rnatish", saPlanMonths: 'oy', saNoOrgs: 'Tashkilotlar yoʻq', saOrgSuspendedNote: 'Bloklangan tashkilot foydalanuvchilari tizimga kira olmaydi.',
  saCreateOrg: 'Yangi tashkilot', saOrgNamePh: 'Tashkilot nomi', saDelete: "O'chirish", saDeleteOrgConfirm: "Bu tashkilotni butunlay o'chirasizmi?", saOrgNotEmptyErr: "A'zosi bor tashkilotni o'chirib bo'lmaydi.",
  saUsersTitle: 'Foydalanuvchilar', saUserSearchPh: 'Ism yoki email bo‘yicha qidirish…', saNoUsers: 'Foydalanuvchi topilmadi', saCreate2: 'Yaratish',
  fpPdf: 'PDF', fpImage: 'Rasm', fpVideo: 'Video', fpAudio: 'Audio', fpDocument: 'Hujjat', fpText: 'Matn', fpFile: 'Fayl', fpFilePrefix: 'Fayl:',
  fpZoomOut: 'Kichraytirish', fpZoomIn: 'Kattalashtirish', fpRotate: 'Aylantirish', fpFsExit: "To'liq ekrandan chiqish", fpFsEnter: "To'liq ekran", fpClose: 'Yopish',
  fpCantPreview: "Ko'rib chiqib bo'lmadi", fpCantPreviewDl: "Ko'rib chiqib bo'lmadi — yuklab oling", fpCantPreviewType: "Bu fayl turini ko'rib bo'lmaydi",
  fpRequired: 'Majburiy', fpOptional: 'Ixtiyoriy', fpMakeOptional: 'Ixtiyoriy qilish', fpMakeRequired: 'Majburiy qilish',
  fpFileInfo: "Fayl ma'lumotlari", fpInfo: "Ma'lumot", fpCancel: 'Bekor',
  fpName: 'Nomi', fpExtension: 'Kengaytma', fpSize: 'Hajmi', fpUploaded: 'Yuklangan', fpUploader: 'Yuklovchi',
  fpViewed: "Ko'rildi", fpDownloaded: 'Yuklandi', fpLastView: "Oxirgi ko'rish", fpLastDownload: 'Oxirgi yuklash',
  fpActions: 'Amallar', fpCopied: 'Nusxalandi', fpLink: 'Havola', fpRename: 'Qayta nomlash', fpReplace: 'Almashtirish',
  fpComingSoon: 'Tez orada', fpAskAI: "🤖 Bu fayl haqida AI'dan so'rang",
  sdGreetMorning: 'Xayrli tong', sdGreetDay: 'Xayrli kun', sdGreetEvening: 'Xayrli kech', sdGreetNight: 'Xayrli tun',
  sdSun: 'Yakshanba', sdMon: 'Dushanba', sdTue: 'Seshanba', sdWed: 'Chorshanba', sdThu: 'Payshanba', sdFri: 'Juma', sdSat: 'Shanba',
  sdToday: 'Bugun', sdWave: "qo'l silkitish",
  sdTodayLessons: 'Bugungi darslar', sdNoTodayLessons: "Bugun rejalashtirilgan dars yo'q", sdNoTodayHint: 'Dam olishni ham unutmang 🌿',
  sdUpcomingLessons: 'Kelgusi darslar', sdNoUpcoming: 'Kelgusi darslar hali belgilanmagan', sdNoUpcomingHint: "Yangi jadval tez orada qo'shiladi",
  sdNoAttendance: "Davomat ma'lumoti yo'q", sdNoAttendanceHint: "Darslar boshlangach shu yerda ko'rinadi",
  sdPresent: 'Kelgan', sdLate: 'Kechikkan', sdExcused: 'Sababli', sdAbsent: 'Kelmagan',
  sdUpcomingBucket: 'Kelgusi', sdGraded: 'Baholangan',
  sdAiPlaceholder: 'Savolingizni yozing yoki rasm / PDF yuklang…', sdAiAsk: 'AI ga savol yozing', sdCamera: 'Kamera', sdGallery: 'Galereya', sdVoice: 'Ovoz',
  sdAlgebra: 'Algebra', sdPhysics: 'Fizika', sdChemistry: 'Kimyo', sdEnglish: 'Ingliz tili', sdHistory: 'Tarix', sdEssay: 'Insho', sdLessonPlan: 'Dars rejasi',
  sdAsgNo: "Topshiriqlar yo'q", sdLoadFailed: "Yuklab bo'lmadi", sdAsgHint: "Yangi uy vazifalari shu yerda ko'rinadi",
  sdStatSolved: 'Yechilgan savollar', sdStatAccuracy: 'Aniqlik darajasi', sdStatAIAvail: 'AI mavjud', sdStatLangs: "Qo'llab-quvvatlanadigan tillar",
  sdRecBefore: 'bugun', sdRecAfter: 'mavzusini takrorlang', sdStartAI: 'AI Yordamchini boshlash', sdMyLessons: 'Darslarim',
  sdOnlineReady: 'tayyor', sdStatsShort: 'Statistika', sdRankShort: 'Reyting',
  sdErrTitle: "Ma'lumotlarni yuklab bo'lmadi", sdErrDesc: "Internet aloqasini tekshiring va qayta urinib ko'ring.",
  tdTabStudents: 'Talabalarim', tdTabCourses: 'Guruhlarim', tdTabReports: 'Hisobotlar', tdTabAchievements: 'Yutuqlar',
  tdGold: 'Oltin', tdSilver: 'Kumush', tdBronze: 'Bronza', tdSpecial: 'Maxsus', tdBelowBronze: '< Bronza', tdAchievement: 'Yutuq',
  tdTeacher: "O'qituvchi", tdRealData: "Real ma'lumotlar",
  tdStudents: 'Talabalar', tdGroups: 'Guruhlar', tdLessons: 'Darslar', tdTestResults: 'Test natijalari',
  tdSearchStudent: 'Talaba ism yoki guruh...', tdNoStudents: "Guruhlarda talabalar yo'q", tdStudentNotFound: 'Talaba topilmadi', tdColStudent: 'Talaba', tdColGroup: 'Guruh', tdColStatus: 'Holat', tdInactive: 'Nofaol', tdCompleted: 'Tugatilgan',
  tdAttSummary: "Guruh bo'yicha davomat xulosa", tdParticipations: 'qatnashish', tdPresentPct: 'kelgan', tdGoToAttendance: "Davomat belgilash sahifasiga o'tish",
  tdTopStudents: 'Top talabalar (test natijalari)', tdNoTestResults: "Test natijalari yo'q — testlarni nashr qilib, talabalar topshirgach hisobot paydo bo'ladi",
  tdAchWord: 'yutuq', tdAchieved: 'Erishildi', tdScoreDistribution: 'Ballar taqsimoti', tdTotalScore: 'Umumiy ball',
  tdGoldMsg: '🥇 Oltin darajaga erishgansiz!', tdSilverMsg: '🥈 Kumush darajada!', tdBronzeMsg: '🥉 Bronza darajada!', tdNoCertYet: 'Hali sertifikat darajasiga yetmadingiz',
  tdScoreTest: 'Test bali', tdScoreConsistency: 'Izchillik', tdScoreActivity: 'Faollik',
  tdForBronze: 'Bronza uchun:', tdForSilver: 'Kumush uchun:', tdForGold: 'Oltin uchun:', tdScoreNeeded: 'ball kerak',
  tdAchievedTitle: 'Erishilgan yutuqlar', tdCount: 'ta', tdBall: 'ball', tdNoAchYet: "Hali yutuqlar yo'q", tdAchEmptyDesc: "Oylik hisob-kitob tugagandan so'ng yutuqlaringiz bu yerda ko'rinadi.",
  tdBronzeGoal: "60+ ball to'pla", tdSilverGoal: "75+ ball to'pla", tdGoldGoal: "90+ ball to'pla", tdRecentActivity: "So'nggi faollik", tdDashboardTitle: "O'qituvchi Dashboardi",
  tdFullStudents: "To'liq talabalar sahifasi", tdGroupWord: 'guruh', tdNoGroups: 'Guruh biriktirilmagan', tdStudentWord: 'talaba', tdLessonWord: 'dars', tdView: "Ko'rish", tdMoreAchievements: 'ta yutuq',
  adWelcome: 'Xush kelibsiz 👋', adTitle: 'Administrator Paneli', adInSystem: 'Tizimda', adUsersWord: 'ta foydalanuvchi', adRealtime: 'Real vaqt',
  adTabUsers: 'Foydalanuvchilar', adTabTeachers: "O'qituvchilar", adTabActivity: 'Faollik', adCourses: 'Kurslar',
  adStudent: 'Talaba', adAdmin: 'Admin', adTeachers: "O'qituvchilar", adTests: 'Testlar', adAttRecords: 'Davomat yozuvi',
  adMonthlySignups: "Oylik ro'yxatdan o'tish (so'nggi 12 oy)", adTotal: 'Jami:', adAllSystemsOk: 'Barcha tizimlar ishlayapti — Supabase ulanishi faol',
  adSearchUser: 'Ism yoki email...', adAll: 'Hammasi', adUser: 'Foydalanuvchi', adRole: 'Rol', adJoined: "Qo'shildi",
  adTeachersCount: "ta o'qituvchi", adGroupC: 'Guruh', adNoTeachers: "O'qituvchilar yo'q", adAllTeachers: "Barcha o'qituvchilar",
  adRecentStudents: "ta so'nggi talaba", adCoursesCount: 'ta kurs (guruh)', adNoCourses: "Kurslar yo'q", adAllCourses: 'Barcha kurslar',
  adNoActivity: "Hali faollik yo'q", adTest: 'Test', adUserWord: 'Foydalanuvchi', adUserNotFound: 'Foydalanuvchi topilmadi',
  lpAIHelp: 'AI Yordam', lpComingSoon: 'Tez orada ishga tushadi', lpAllLessons: 'Barcha darslar', lpNoResults: 'Qidiruv natijalari topilmadi', lpLessonText: 'Dars matni',
  lpSummarize: 'Darsni umumlashtirish', lpExplainEasier: 'Osonroq tushuntirish', lpMakeQuiz: 'Quiz yaratish', lpTranslate: 'Tarjima qilish', lpAskAIQ: 'AI ga savol berish', lpContextNote: 'darsi kontekstida yordam beradi',
  tsBackToList: "Testlar ro'yxatiga qaytish", tsAnswered: 'javoblangan', tsQuestions: 'Savollar', tsQuestionPalette: 'Savollar palitasi', tsUnanswered: 'ta savolga javob berilmagan', tsSubmit: 'Testni topshirish',
  tsResult: 'NATIJA', tsPassed: 'Muvaffaqiyatli topshirildi', tsRetry: "Qaytadan urinib ko'ring", tsCorrect: "ta to'g'ri", tsQuestionWord: 'ta savol', tsQuestionAnalysis: 'Savollar tahlili', tsCorrectMark: "✓ To'g'ri",
  tsMotiv90: "Ajoyib! Siz bu mavzuni mukammal o'zlashtirgansiz! 🏆", tsMotiv80: "Zo'r natija! Deyarli mukammal erishuvingiz bor! ⭐", tsMotiv60: 'Tabriklaymiz! Muvaffaqiyatli topshirdingiz! 🎉', tsMotivLow: "Yaxshi urinish! Biroz ko'proq mashq qilsangiz — muvaffaqiyatga erishasiz 📚",
  tsTitle: 'Testlar', tsSubtitle: 'Mavjud online testlar', tsNoTests: "Mavjud test yo'q", tsNoTestsHint: "O'qituvchi test nashr qilsa, bu yerda ko'rinadi", tsMinutes: 'daqiqa', tsStart: 'Boshlash',
  asgpDueToday: 'Bugun tugaydi', asgpFilterAria: "Holat bo'yicha filtr", asgpSubject: 'Fan:', asgpAllSubjects: 'Barcha fanlar',
  asgpLoadFail: "Topshiriqlarni yuklab bo'lmadi", asgpNoMatch: 'Bu filtrga mos topshiriq topilmadi', asgpMaxScore: 'Maks.', asgpMaterials: 'Materiallar',
  asgpGrade: 'Baho:', asgpFeedback: 'Izoh:', asgpMyWork: 'Ishim', asgpPickFile: 'Topshiriq faylini tanlang', asgpSubmitBtn: 'Topshirish', asgpDeadlinePassed: 'Muddat tugagan',
  asgpAIHelp: 'AI yordam olish', asgpAIPlaceholder: "Javobingizni matn ko'rinishida yozing — AI tekshirib, baho va tavsiya beradi…", asgpAICheckBtn: 'AI tekshirish', asgpRecheck: 'Qayta tekshirish', asgpNoMaterials: "Biriktirilgan material yo'q",
  mpTitle: 'Mening natijalarim', mpSubtitle: "O'quv jarayoni statistikasi", mpLoadErr: "Ma'lumotlarni yuklashda xatolik", mpTestAvg: "Test o'rtacha", mpPassedTests: "O'tgan test",
  mpAttDetail: 'Davomat tafsiloti', mpByGroup: "Guruh bo'yicha", mpPassed: "O'tdi", mpFailed: "O'tmadi", mpNoResults: "Hali natijalar yo'q", mpNoResultsHint: "Darslarga qatnashib, testlarni topshirgan sari bu yerda ko'rinadi",
  mJan: 'Yanvar', mFeb: 'Fevral', mMar: 'Mart', mApr: 'Aprel', mMay: 'May', mJun: 'Iyun',
  mJul: 'Iyul', mAug: 'Avgust', mSep: 'Sentabr', mOct: 'Oktyabr', mNov: 'Noyabr', mDec: 'Dekabr',
  stAttSubtitle: 'Dars davomatingiz tarixi', stAttOverall: 'Umumiy davomat', stAttEmptyHint: "O'qituvchi davomat belgilasa, bu yerda ko'rinadi",
  aiNewChat: 'Yangi suhbat', aiSearchPh: 'Qidirish...', aiNoConvs: "Hali suhbat yo'q", aiSearchNotFound: 'topilmadi',
  aiPinned: '📌 Pinlangan', aiYesterday: 'Kecha', aiOlder: 'Oldingi', aiChatWord: 'Suhbat', aiHistory: 'Suhbatlar tarixi', aiOpen: 'Ochish',
  aiCopy: 'Nusxalash', aiLike: 'Yaxshi', aiDislike: 'Yomon', aiRegenerate: 'Qaytadan yaratish', aiContinue: 'Davom etish', aiThinking: "AI o'ylayapti", aiWaiting: 'Javob kutilyapti',
  aiRename: "Nomini o'zgartirish", aiRenameEdit: 'Nomini tahrirlash', aiPin: 'Pinlash', aiUnpin: 'Pinni olib tashlash',
  aiMsgsLoadErr: 'Xabarlarni yuklashda xatolik', aiNewChatErr: 'Yangi suhbat yaratishda xatolik', aiContinueErr: 'Davom etishda xatolik', aiRegenErr: 'Qaytadan yaratishda xatolik', aiDeleteErr: "O'chirishda xatolik",
  aiContextPanel: 'Kontekst paneli', aiExport: 'Eksport', aiDropFile: 'Faylni bu yerga tashlang', aiRemoveFile: 'Faylni olib tashlash', aiCancel: 'Bekor qilish',
  aiVoiceUnsupported: "Qo'llab-quvvatlanmaydi", aiVoiceWrite: 'Ovoz bilan yozish', aiVoiceStop: "To'xtatish",
  aiQaMath: 'Matematika', aiQaMathD: 'Tenglamalar, formulalar', aiQaCode: 'Dasturlash', aiQaCodeD: 'Kod, debugging', aiQaTranslate: 'Tarjima', aiQaTranslateD: "Ko'p tilli",
  aiQaPdf: 'PDF tahlili', aiQaPdfD: 'Hujjat tahlili', aiQaEssay: 'Insho', aiQaEssayD: 'Yozish, tahrir', aiQaTest: 'Test yaratish', aiQaTestD: 'Savollar generatsiyasi',
  pfTitle: 'Profil', pfSubtitle: "Shaxsiy ma'lumotlar va hisob sozlamalari", pfUpdated: 'Profil muvaffaqiyatli yangilandi', pfPwChanged: "Parol muvaffaqiyatli o'zgartirildi", pfPwMismatch: 'Parollar mos kelmadi', pfError: 'Xatolik yuz berdi',
  pfAdministrator: 'Administrator', pfAvatarUsing: 'Yuklangan rasm ishlatilmoqda', pfAvatarInitials: "Ismi harflari ko'rsatilmoqda", pfUploadPhoto: 'Rasm yuklash', pfAvatarDeleteQ: "Avatar o'chirilsinmi?", pfYesDelete: "Ha, o'chirish",
  pfPersonalInfo: "Shaxsiy ma'lumotlar", pfFullName: "To'liq ism *", pfFullNamePh: 'Ism Familiya', pfEmailNoChange: "Email (o'zgartirib bo'lmaydi)", pfPhone: 'Telefon raqami', pfBioPh: "O'zingiz haqida qisqacha...", pfSaveChanges: "O'zgarishlarni saqlash",
  pfAccountInfo: "Hisob ma'lumotlari", pfBlocked: 'Bloklangan', pfRegistered: "Ro'yxat", pfLanguage: 'Til', pfAbout: 'Haqida',
  pfSecurity: 'Xavfsizlik', pfChangePw: "Parolni o'zgartirish", pfNewPw: 'Yangi parol', pfPwMin: 'Kamida 8 ta belgi', pfConfirmPw: 'Parolni tasdiqlash', pfPwRepeat: 'Parolni qayta kiriting',
  pfAppearance: "Ko'rinish", pfThemeNote: "Mavzu sozlamasi Navbar'dagi 🌙/☀️ tugmasi orqali o'zgartiriladi.",
  ccTitle: 'Kurslarim', ccJoinedGroups: "ta guruhga qo'shilgansiz", ccEmpty: "Hali hech qanday kursga qo'shilmadingiz", ccEmptyHint: "Administrator guruhga qo'shsa, shu yerda ko'rinadi", ccTotalLessons: 'Jami dars', ccActiveCourses: 'Faol kurs', ccLesson: 'Dars',
  tcSubtitle: 'Guruh darslarini boshqarish', tcNewLesson: 'Yangi dars', tcNoGroup: "Sizga biriktirilgan guruh yo'q", tcNoGroupHint: 'Administrator guruh belgilashi kerak',
  tcEditLesson: 'Darsni tahrirlash', tcAddLesson: "Yangi dars qo'shish", tcLessonName: 'Dars nomi', tcLessonNamePh: 'Masalan: 1-dars: Kirish', tcDate: 'Sana', tcSubject: 'Fan', tcNoSubject: '— Fan tanlanmagan —',
  tcLessonContent: 'Dars matni / Konspekt', tcContentPh: 'Dars mazmuni, topshiriqlar, izohlar...', tcVideoUrl: 'Video havolasi (YouTube yoki Vimeo)', tcVideoOk: 'Video havola tanildi', tcVideoBad: "Faqat YouTube va Vimeo havolalari qo'llab-quvvatlanadi",
  tcMaterials: 'Dars materiallari', tcDropAria: 'Fayllarni sudrab tashlang yoki tanlang', tcDropActive: 'Fayllarni shu yerga tashlang', tcDropIdle: 'Fayllarni sudrab tashlang yoki bosing', tcDropHint: 'PDF, Word, Excel, PowerPoint, rasm (JPG/PNG), ZIP • Maks. 20 MB • bir nechta fayl',
  tcUploadAfterSave: 'saqlangach yuklanadi', tcRemove: 'Olib tashlash', tcNoMaterialYet: "Hali material qo'shilmagan", tcPublish: "Darsni nashr qilish (talabalar ko'ra oladi)", tcAdd: "Qo'shish",
  tcLessonsEmpty: "Darslar yo'q", tcLessonsEmptyHint: "Ushbu guruh uchun hali dars qo'shilmagan", tcAddFirst: "Birinchi darsni qo'shing",
  tcPublished: 'Nashr', tcDraft: 'Qoralama', tcHasText: 'Matn mavjud', tcDeleteShort: "O'chir", tcPublishState: 'Nashr holati', tcEditT: 'Tahrirlash',
  tcAttachments: 'Fayl biriktirmalar', tcUploading: 'Yuklanmoqda...', tcAddFile: "Fayl qo'shish", tcNoFilesYet: "Hali fayl qo'shilmagan", tcFileTypesHint: 'PDF, rasm, Word, Excel, PowerPoint, TXT • Maks. 20 MB',
  tcNameRequired: 'Dars nomi majburiy', tcSaveErr: 'Saqlashda xatolik', tcStatusErr: "Holat o'zgartirishda xatolik", tcUploadErr: 'Yuklashda xatolik', tcReplaceErr: 'Almashtirishda xatolik', tcFileDeleteErr: "Faylni o'chirishda xatolik", tcDownloadErr: 'Yuklab olishda xatolik',
  taSubtitle: 'Guruh davomatini belgilang', taSaved: 'Davomat muvaffaqiyatli saqlandi', taNoActiveGroup: 'Aktiv guruh topilmadi', taNoActiveGroupAssigned: "Sizga biriktirilgan aktiv guruh yo'q", taNoName: 'Ism kiritilmagan', taNotePh: 'Izoh (ixtiyoriy)...', taSaveBtn: 'Davomatni saqlash',
  tgTotalGroups: 'Jami guruh', tgTotalStudents: 'Jami talaba',
  aaTitle: 'Yutuqlar boshqaruvi', aaSubtitle: 'Oylik hisoblash sikli va sertifikatlar', aaCycleTitle: 'Oylik hisoblash sikli', aaCycleDesc: 'Tanlangan oy uchun ballar hisoblanadi va yutuqlar avtomatik beriladi', aaYear: 'Yil', aaMonth: 'Oy',
  aaCalculating: 'Hisoblanmoqda...', aaCalculate: 'Hisoblash', aaForPeriod: 'uchun', aaCycleDone: 'Hisoblash muvaffaqiyatli tugadi', aaSnapshots: 'Snapshot hisoblandi', aaStudTeach: "talaba + o'qituvchi",
  aaAwarded: 'Yutuq berildi', aaNewOrUpdated: 'yangi yoki yangilangan', aaAwardedSuffix: '— berilgan yutuqlar', aaNoAwards: "Bu oy uchun yutuq berilmadi — ballar yetarli emas yoki hali ma'lumot yo'q", aaTypeWord: 'yutuq turi',
  aaTotalTypes: 'Jami yutuq turlari', aaTotalAwarded: 'Jami berilgan yutuqlar', aaErrorLabel: 'Xatolik:', aaNotFound: 'Yutuqlar topilmadi', aaMigrationHint: 'Avval migratsiyalar (008–010) ni Supabase SQL Editor da ishga tushiring', aaTimesGiven: 'marta berilgan',
  aatSubtitle: 'Barcha talabalar davomati', aatFrom: 'Boshlanish', aatFilter: 'Filtrlash', aatSearchPh: 'Talaba yoki guruh...', aatNotFound: 'Davomat yozuvlari topilmadi', aatNote: 'Izoh', aatLimitPrefix: 'Faqat 100 ta yozuv ko\'rsatilmoqda (', aatLimitSuffix: 'tadan)',
  sbNameRequired: "Fan nomi bo'sh bo'lishi mumkin emas", sbTitle: 'Fanlar', sbCount: 'ta fan', sbNewSubject: 'Yangi fan', sbEditSubject: 'Fanni tahrirlash', sbAddSubject: "Yangi fan qo'shish",
  sbNameLabel: 'Fan nomi', sbNamePh: 'Masalan: Matematika', sbDescription: 'Tavsif', sbDescPh: "Fan haqida qisqacha ma'lumot...", sbColor: 'Rang', sbIcon: 'Ikonka',
  sbNamePreview: 'Fan nomi', sbDescPreview: 'Tavsif...', sbEmpty: "Fanlar yo'q", sbEmptyHint: "Hali hech qanday fan qo'shilmagan", sbAddFirst: "Birinchi fanni qo'shing", sbNoDesc: "Tavsif yo'q",
  thNameRequired: 'Ism va familiya majburiy', thEmailInvalid: "To'g'ri email manzil kiriting", thNewTeacher: "Yangi o'qituvchi", thTotal: 'Jami', thEditTeacher: "O'qituvchini tahrirlash", thAddTeacher: "Yangi o'qituvchi qo'shish",
  thFullName: 'Ism va familiya', thNamePh: 'Abdullayev Abror', thEmailEditHint: "Email tahrirlash uchun Supabase Dashboard'dan foydalaning", thTempPassword: 'Vaqtinchalik parol', thPhone: 'Telefon', thBioLabel: "Bio / Qisqacha ma'lumot", thBioPh: "O'qituvchi haqida qisqacha...",
  thTeachSubjects: "O'qitiladigan fanlar", thNoSubjectsA: 'Fan qo\'shilmagan. Avval', thNoSubjectsB: "moduliga o'ting.", thEmptyHint: "Hali hech qanday o'qituvchi qo'shilmagan", thAddFirst: "Birinchi o'qituvchini qo'shing", thSearchNotFoundSuffix: "bo'yicha o'qituvchi topilmadi", thFilterNoResult: "Tanlangan filtr bo'yicha natija yo'q", thDeleteQ: "O'chirilsinmi?", thGroupWord: 'guruh',
  stuNewStudent: 'Yangi talaba', stuEditStudent: 'Talabani tahrirlash', stuAddStudent: "Yangi talaba qo'shish", stuCount: 'ta talaba', stuNamePh: 'Karimov Kamol', stuExtraInfo: "Qo'shimcha ma'lumot", stuBioPh: 'Talaba haqida qisqacha...',
  stuAddToGroup: "Guruhga qo'shish", stuNoGroupsA: "Faol guruh yo'q. Avval", stuNoGroupsB: 'modulidan guruh yarating.', stuEmpty: "Talabalar yo'q", stuEmptyHint: "Hali hech qanday talaba qo'shilmagan", stuAddFirst: "Birinchi talabani qo'shing", stuSearchNotFoundSuffix: "bo'yicha talaba topilmadi", stuNoGroupAssigned: "Guruhga qo'shilmagan",
  acSearchPh: "Kurs, o'qituvchi yoki fan...", acFilterNotFound: "Filtr bo'yicha kurs topilmadi", acEmptyHint: "Guruhlar modulidan guruh yarating — ular bu yerda kurs sifatida ko'rinadi", acTestWord: 'test', acFilledSuffix: "to'lgan",
  agNameRequired: "Guruh nomi bo'sh bo'lishi mumkin emas", agNewGroup: 'Yangi guruh', agEditGroup: 'Guruhni tahrirlash', agAddGroup: "Yangi guruh qo'shish", agGroupName: 'Guruh nomi', agNamePh: 'Masalan: G-101', agCapacity: "Sig'im (o'quvchilar soni)",
  agStartDate: 'Boshlanish sanasi', agEndDate: 'Tugash sanasi', agDescPh: "Guruh haqida qo'shimcha ma'lumot...", agSearchPh: "Guruh, fan yoki o'qituvchi...", agEmpty: "Guruhlar yo'q", agEmptyHint: "Hali hech qanday guruh qo'shilmagan", agAddFirst: "Birinchi guruhni qo'shing", agSearchNotFoundSuffix: "bo'yicha guruh topilmadi", agSeats: "o'rin",
  alSubtitle: 'Barcha guruhlarning darslari', alTotalLessons: 'Jami dars', alPublished: 'Nashr qilingan', alSearchPh: "Dars nomi yoki o'qituvchi...", alEmpty: "Darslar yo'q", alEmptyHint: "O'qituvchilar dars qo'shgach bu yerda ko'rinadi", alNoContent: "Kontent qo'shilmagan",
  atSubtitle: 'Barcha testlar va natijalar', atSearchPh: 'Test nomi yoki guruh...', atEmpty: "Testlar yo'q", atEmptyHint: "O'qituvchilar test yaratgandan so'ng bu yerda ko'rinadi", atResults: 'natija', atFilterNotFound: "Filtr bo'yicha test topilmadi",
  arpSubtitle: 'Platforma statistikasi va hisobotlari', arpGroupAtt: "Guruh bo'yicha davomat", arpAvg: "O'rtacha:", arpEmpty: "Hisobot uchun ma'lumot yo'q", arpEmptyHint: "Davomat va test natijalarini qo'shgandan so'ng hisobot paydo bo'ladi",
  asTitle: 'Sozlamalar', asSubtitle: 'Tizim konfiguratsiyasi', asSaved: 'Sozlamalar muvaffaqiyatli saqlandi', asGeneral: 'Umumiy sozlamalar', asSystemInfo: "Tizim ma'lumotlari", asPlatform: 'Platforma', asVersion: 'Versiya',
  asSecurity: 'Xavfsizlik', asNewPw: 'Yangi parol', asConfirmPw: 'Parolni tasdiqlang', asPwChange: 'Parolni o‘zgartirish', asPwChanged: 'Parol muvaffaqiyatli o‘zgartirildi', asPwShort: 'Parol kamida 8 ta belgidan iborat bo‘lishi kerak', asPwMismatch: 'Parollar mos kelmadi', asPwErr: 'Parolni o‘zgartirishda xatolik',
  asOrgName: 'Tashkilot nomi', asOrgDesc: 'Tashkilot tavsifi', asOrgDescPh: "Online ta'lim platformasi", asSupportEmail: 'Yordam email manzili', asMaxGroup: 'Guruhda maksimal talabalar soni', asOrgNameReq: 'Tashkilot nomi majburiy',
  anTitle: 'Analitika', anSubtitle: "Platforma ishlash ko'rsatkichlari", anAdmins: 'Adminlar', anMonthlyStudents: "Oylik talabalar (so'nggi 6 oy)", anMonthlyTeachers: "Oylik o'qituvchilar (so'nggi 6 oy)", anNoData: "Ma'lumot yo'q", anCount: 'ta',
  anAttStates: 'Davomat holatlari', anNoTestResults: "Test natijasi yo'q", anPassRate: "O'tish darajasi", anPassed: "O'tdi (≥60%)", anFailed: "O'tmadi (<60%)", anTotalSubmitted: 'topshirilgan',
  ppTitle: 'Oddiy va shaffof narxlar', ppSubtitle: 'Ehtiyojingizga mos rejani tanlang.', ppGetStarted: 'Boshlash',
  taMyAch: 'Mening yutuqlarim', taMyAchSub: 'Har bir yutuq uchun sertifikat yuklab olish mumkin', taAchEmptyHint: 'Admin oylik hisoblash siklini ishga tushirganda yutuqlar avtomatik beriladi', taBall: 'Ball:', taAboutTitle: "O'qituvchi yutuqlari haqida", taAboutDesc: "Eng yaxshi o'qituvchi, Top mentor va A'lo mukofoti — har oy admin tomonidan avtomatik beriladi. Ballar davomad sifati, talabalar test natijalari va o'qitish faoliyati asosida hisoblanadi.",
  cdTitle: 'Kurs tafsilotlari', cdComingSoon: 'Kurs kontenti va darslar tez orada.',
  tstSearchPh: 'Ism, email yoki telefon...', tstAllGroups: 'Barcha guruhlar', tstNotFound: "Qidiruv bo'yicha talaba topilmadi",
  ttNameRequired: 'Test nomi majburiy', ttMinQuestion: 'Kamida 1 ta savol kerak', ttFillAllQ: "Barcha savollar to'ldirilishi kerak", ttFillAllOpts: "Barcha variantlar to'ldirilishi kerak", ttPublishStatusErr: "Nashr holatini o'zgartirishda xatolik",
  ttResults: 'Natijalar', ttNoSubmissions: 'Hali hech kim topshirmagan', ttScore: 'Ball', ttPercent: 'Foiz',
  ttEditTest: 'Testni tahrirlash', ttNewTest: 'Yangi test', ttTestInfo: "Test ma'lumotlari", ttTestName: 'Test nomi', ttTestNamePh: 'Masalan: Algebra — 1-bob testi', ttDesc: 'Tavsif', ttDescPh: 'Test haqida qisqacha...', ttNoGroupSel: '— Guruh tanlanmagan —', ttDuration: 'Vaqt (daqiqa)', ttPublish: "Testni nashr qilish (talabalar ko'ra oladi)",
  ttQuestions: 'Savollar', ttAddQuestion: "Savol qo'shish", ttNoQuestions: 'Savol yo\'q. "Savol qo\'shish" tugmasini bosing', ttQuestionPh: 'Savol matni...', ttVariant: 'Variant', ttCreateTest: 'Test yaratish',
  ttCountWord: 'ta test', ttEmpty: "Testlar yo'q", ttEmptyHint: 'Birinchi testingizni yarating', ttPublished: 'Nashr qilingan', ttUnpublish: 'Qayta qoralama', ttPublishAction: 'Nashr qilish',
  tapConfirmDelete: "Bu topshiriqni o'chirmoqchimisiz?", tapSubtitle: 'Uy vazifalarini yarating va baholang', tapNew: 'Yangi topshiriq', tapEmpty: 'Hali topshiriq yaratmagansiz', tapSubmittedCount: 'topshirildi', tapViewWorks: "Ishlarni ko'rish", tapEdit: 'Topshiriqni tahrirlash',
  tapTitleField: 'Sarlavha *', tapTitlePh: "Masalan: 5-mavzu bo'yicha masalalar", tapDescPh: 'Topshiriq tafsilotlari…', tapNotSelected: 'Tanlanmagan', tapMaxScore: 'Maksimal ball', tapDeadline: 'Muddat',
  tapGroupsField: 'Guruhlar *', tapNoGroups: "Guruhlaringiz yo'q", tapAttachedFiles: 'Biriktirilgan fayllar', tapAttachAfterSave: 'Fayllarni topshiriq saqlangach biriktira olasiz.', tapAttachFile: 'Fayl biriktirish',
  auRoleChangeErr: "Rolni o'zgartirishda xatolik", auAdmins: 'Adminlar', auJami: 'Jami', auAllStatuses: 'Barcha holat', auEmpty: "Foydalanuvchilar yo'q", auNotFound: "Filtr bo'yicha foydalanuvchi topilmadi", auToggleHint: "Bosganda holat o'zgaradi", auJoined: "Qo'shilgan",
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
  aiAssistant: 'YordamchiAI',
  // AI Teacher Panel
  atpTitle: "AI O'qituvchi", atpPanelAria: "AI o'qituvchi paneli", atpStreakTitle: 'Kundalik streak', atpInsightsTitle: 'AI tahlil',
  atpNewBadge: 'Yangi', atpMasteryTitle: "O'zlashtirish darajasi", atpWeakTitle: 'Zaif tomonlar', atpPathTitle: "O'quv yo'li",
  atpGoalTitle: 'Bugungi maqsad', atpAchTitle: 'Yutuqlar', atpMissionTitle: 'Haftalik missiya', atpNextTitle: 'Sprint 2.3 da',
  atpWeeklyActivity: 'Haftalik faollik',
  atpLvlBeginner: 'Yangi boshlovchi', atpLvlLearner: "O'rganuvchi", atpLvlKnower: 'Bilimdon', atpLvlMentor: 'Ustoz shogird', atpLvlExpert: 'Ekspert',
  atpLevel: 'Daraja', atpNextLevel: 'keyingi daraja',
  atpDayMon: 'Du', atpDayTue: 'Se', atpDayWed: 'Ch', atpDayThu: 'Pa', atpDayFri: 'Ju', atpDaySat: 'Sh', atpDaySun: 'Ya',
  atpKun: 'kun', atpStreakActive: 'Ketma-ket faollik!', atpTodayActive: 'Bugun faol',
  atpMasteryOverall: 'Umumiy',
  atpPathCurrent: 'Joriy mavzu', atpPathTopic3: 'Uchinchi daraja tenglamalar', atpPathTopic4: 'Funksiyalar va grafiklar', atpDone: 'Tugatildi', atpInProgress: 'Davom etmoqda',
  atpWeakDiscriminant: 'Diskriminant hisoblash', atpWeakNegRoots: 'Manfiy ildizlar', atpWeakFuncVals: 'Funksiya qiymatlari', atpWeakPractice: 'Mashq qilish uchun bosing',
  atpGoalStudy: "O'rganish", atpGoalHourSuffix: "— 1 soat mashg'ulot", atpGoalReview: 'AI bilan birga takrorlang',
  atpAch1Name: 'Birinchi savol', atpAch1Desc: 'AI bilan birinchi suhbat', atpAch2Name: 'Haftalik jangchi', atpAch2Desc: '7 kun ketma-ket faol',
  atpAch3Name: 'Test ustasi', atpAch3Desc: "O'rtacha 75%+ test natijasi", atpAch4Name: 'Davomat qahramoni', atpAch4Desc: '90%+ davomat',
  atpAch5Name: 'Bilimdon', atpAch5Desc: "500+ XP yig'ish", atpAch6Name: 'Perfeksionist', atpAch6Desc: 'Barcha testlarda 90%+',
  atpAch7Name: 'Aniq nishonchi', atpAch7Desc: '5 ta test topshirish', atpAch8Name: "Tez o'rganuvchi", atpAch8Desc: 'Birinchi haftada 3+ dars',
  atpAchLockedSuffix: 'ta nishon qulflanmagan',
  atpMissionReward: '100 XP + 🏆 Nishon', atpMissionTask1: "3 ta dars o'tish", atpMissionTask2: '2 ta test topshirish', atpMissionTask3: 'AI bilan suhbat',
  atpMissionTask4: '80%+ test natijasi', atpMissionTask5: "50+ XP yig'ish", atpMissionDoneSuffix: 'vazifa bajarildi',
  atpNextDesc: "Uyga vazifalar, o'qituvchi izohlari va reja tuzish real ma'lumotlar bilan",
  atpInsLoading: "AI o'qituvchi ma'lumotlaringizni yuklamoqda…",
  atpInsTestLow: "Test o'rtachangiz {pct}% — diskriminant hisoblashga e'tibor bering.",
  atpInsTestHigh: "Test natijalaringiz zo'r ({pct}%)! Siz keyingi darajaga tayyor.",
  atpInsTestNone: "Hali test topshirmadingiz. Birinchi testni sinab ko'ring!",
  atpInsAttLow: 'Davomatingiz {pct}% — har bir dars natijangizni 3% ga oshiradi.',
  atpInsAttHigh: 'Davomatingiz {pct}% — bu muvaffaqiyatning eng kuchli garovidir!',
  atpInsAttMid: "Davomatingiz {pct}% — yana bir oz zo'r bo'lsangiz, yangi rekord!",
  atpInsSubject: "{subject} bo'yicha tizimli ravishda o'sib borayapsiz.",
  atpInsXpHigh: "Ishonchingiz so'nggi haftada 12% oshdi. Shunday davom eting!",
  atpInsXpMid: "Har kuni AI bilan 20 daqiqa mashq — bu 40% tez o'rganishni ta'minlaydi.",
  atpInsXpLow: "Birinchi suhbatdan keyin AI o'quv reja tuzib beradi. Boshlang!",
  atpPromptPath: '"{topic}" mavzusida menga yordam ber', atpPromptWeak: '"{topic}" mavzusini batafsilroq tushuntir va misollar ber',
  atpPromptSubject: "{subject} bo'yicha savol ber", atpPromptToday: 'Bugungi darsni tushuntir',
  atpPromptExam: 'Imtihonga tayyorlanish rejasi tuz', atpPromptWeakImprove: 'Zaif mavzularimni qanday yaxshilashim mumkin?',
  // Avatar uploader / cropper
  avChangePhoto: "O'zgartirish", avUploading: 'Yuklanmoqda…', avUploadPhoto: 'Rasm yuklash', avDelete: "O'chirish",
  avFormatHint: 'JPG, PNG yoki WebP · Maksimal hajm 5 MB',
  avErrFormat: "Format qo'llab-quvvatlanmaydi. JPG, PNG yoki WebP yuklang.", avErrSize: "Fayl 5 MB dan kichik bo'lishi kerak.",
  avCropTitle: 'Rasmni kesish', avCropDesc: "Doira ichidagi qism profil rasmingiz bo'ladi", avReset: "Qayta o'rnatish",
  avCancel: 'Bekor', avConfirm: 'Tasdiqlash', avCropHint: 'Rasmni suring va kattalashtiring • Doira ichidagi qism saqlanadi',
  emailPlaceholder: 'sizning@email.com', videoUrlPlaceholder: 'https://www.youtube.com/watch?v=... yoki https://vimeo.com/...',
  saPendingPayments: 'Kutilayotgan to\'lovlar', saViewReceipt: 'Chekni ko\'rish', saApprove: 'Tasdiqlash', saReject: 'Rad etish',
  pmPayTitle: 'Premiumga to\'lov', pmPayHint: 'Quyidagi kartaga pul o\'tkazing va chek rasmini yuklang. Admin tasdiqlagach premium faollashadi.',
  pmCardTransfer: 'Karta raqami', pmPerMonth: 'oyiga',
  pmUploadReceipt: 'To\'lov chekini yuklang', pmSelectReceipt: 'Chek rasmini tanlang (JPG/PNG/PDF)', pmSubmitPayment: 'To\'lovni yuborish', pmBack: 'Orqaga',
  pmPaySuccess: 'To\'lov yuborildi!', pmPaySuccessDesc: 'Chek qabul qilindi. Admin tasdiqlagach premium avtomatik faollashadi.',
  pmReceiptRequired: 'Iltimos, chek rasmini yuklang', pmPayError: 'To\'lovni yuborib bo\'lmadi. Qayta urinib ko\'ring.',
  pmChoosePlan: 'Rejani tanlang', pmPendingTitle: 'To\'lov tekshirilmoqda',
  pmPendingDesc: 'To\'lovingiz yuborilgan va admin tasdig\'ini kutmoqda. Tasdiqlangach premium avtomatik faollashadi.',
  setSubtitle: 'Hisob va ilova sozlamalari', setPreferences: 'Afzalliklar', setAppearance: 'Ko\'rinish', setSecurity: 'Xavfsizlik',
  setDarkOn: 'Qorong\'i rejim yoqilgan', setPremiumTheme: 'Premium mavzu', setReminders: 'Dars eslatmalari',
  setRemindersDesc: 'Darslar va topshiriqlar haqida eslatmalar', setAiUpdates: 'AI yordamchi yangiliklari',
  setAiUpdatesDesc: 'Yangi AI imkoniyatlari haqida xabarlar', setChangePassword: 'Parolni o\'zgartirish',
  setActiveSession: 'Faol sessiya', setSessionDesc: 'Siz bu qurilmada tizimga kirgansiz', setEdit: 'Tahrirlash',
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
  heroSubtitle: 'YordamchiAI анализирует уровень знаний ученика, выявляет слабые темы и даёт объяснения, подходящие именно ему.',
  heroBadge: 'Новое поколение обучения с ИИ',
  heroCtaPrimary: 'Начать бесплатно',
  heroCtaSecondary: 'Смотреть демо',
  heroCtaDemo: 'Узнать больше',
  heroNoCreditCard: 'Без кредитной карты · 30 дней бесплатно',
  heroRoleStudent: 'Я студент',
  heroRoleTeacher: 'Я преподаватель',
  heroRoleSchool: 'Представляю школу',
  heroTitleStudent: 'Не паникуйте перед экзаменом.|ИИ-репетитор готов 24/7.',
  heroTitleTeacher: 'Не тратьте 2 часа на подготовку.|С ИИ — 20 минут. Каждый раз.',
  heroTitleSchool: 'Все классы. Все результаты.|На одном экране.',
  heroSubtitleStudent: 'Слабые темы выявляются до экзамена — AI показывает точно. Ответы на вопросы основаны на вашей учебной программе. В день экзамена будьте спокойны — ИИ вас подготовит.',
  heroSubtitleTeacher: 'Создавайте тесты и материалы с ИИ за минуты. Отслеживайте прогресс каждого ученика в реальном времени. Посещаемость, отчёты, уведомления — всё автоматически.',
  heroSubtitleSchool: 'Все учителя и ученики — в одной системе. ИИ выявляет отстающих заранее — вы успеваете принять меры. Административная работа автоматизируется.',
  heroDiff: 'ChatGPT не знает — YordamchiAI знает вашу учебную программу',
  heroUrgency: 'Для первых пользователей: все функции бесплатно',
  heroSocialInline: '1 200+ студентов пользуются · ★ 4.9/5',
  heroTrustNoInstall: 'Установка не нужна',
  heroCtaStudentAction: 'Получить ИИ-репетитора',
  heroCtaTeacherAction: 'Создать ИИ-класс',
  heroCtaSchoolAction: 'Модернизировать школу',
  heroAlreadyUser: 'Уже есть аккаунт?',
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
  welcomeGreeting: 'Добро пожаловать,',
  welcomePreparing: 'Ваш AI-помощник готовится',
  roleSelectSubtitle: 'Как вы хотите использовать YordamchiAI?',
  roleContinue: 'Продолжить',
  haveAccountQ: 'Уже есть аккаунт?',
  roleStudentTitle: 'Ученик',
  roleStudentDesc: 'Персональное обучение с AI-помощником',
  roleStudentP1: 'AI-помощник',
  roleStudentP2: 'Курсы и уроки',
  roleStudentP3: 'Тесты и результаты',
  roleStudentP4: 'Анализ прогресса',
  roleTeacherTitle: 'Учитель',
  roleTeacherDesc: 'Управляйте и оценивайте своих учеников',
  roleTeacherP1: 'Ученики и группы',
  roleTeacherP2: 'Уроки и задания',
  roleTeacherP3: 'Контроль посещаемости',
  roleTeacherP4: 'Статистика и анализ',
  roleSchoolTitle: 'Учебное заведение',
  roleSchoolDesc: 'Полное управление всей LMS-системой',
  roleSchoolP1: 'Управление пользователями',
  roleSchoolP2: 'Учителя и ученики',
  roleSchoolP3: 'Курсы и отчёты',
  roleSchoolP4: 'Полный контроль LMS',
  audienceHeading: 'Для кого',
  detailsBtn: 'Подробнее',
  audStudentTitle: 'Для учеников',
  audStudentP1: 'AI-помощник 24/7',
  audStudentP2: 'Тесты и экзамены',
  audStudentP3: 'Объяснения по темам',
  audStudentP4: 'Отслеживание результатов',
  audTeacherTitle: 'Для учителей',
  audTeacherP1: 'Загрузка учебных материалов',
  audTeacherP2: 'Оценивание учеников',
  audTeacherP3: 'Контроль посещаемости и активности',
  audTeacherP4: 'Статистика и анализ',
  audSchoolTitle: 'Для школ и институтов',
  audSchoolP1: 'LMS-платформа',
  audSchoolP2: 'Управление всеми процессами',
  audSchoolP3: 'Отчёты и аналитика',
  audSchoolP4: 'Безопасная и надёжная система',
  statActiveStudents: 'Активные ученики',
  statInstitutions: 'Учебные заведения',
  statUserRating: 'Рейтинг пользователей',
  secFeaturesTitle: 'Возможности', secFeaturesSub: 'Все инструменты для обучения и преподавания с YordamchiAI',
  featChatT: 'AI-чат', featChatD: 'Умные ответы 24/7 на любой вопрос и пошаговые объяснения.',
  featVisionT: 'Решение по фото', featVisionD: 'Отправьте фото задачи — AI Vision проанализирует и решит её.',
  featTestsT: 'Интерактивные тесты', featTestsD: 'Проверьте знания — результаты оцениваются автоматически и безопасно.',
  featAttendT: 'Контроль посещаемости', featAttendD: 'Отслеживайте посещаемость и активность в реальном времени.',
  featHwT: 'Домашние задания', featHwD: 'Отправляйте, принимайте, оценивайте и комментируйте задания.',
  featMatT: 'Учебные материалы', featMatD: 'PDF, видео и документы — все материалы уроков в одном месте.',
  secPricingTitle: 'Тарифы', secPricingSub: 'Выберите подходящий тариф — меняйте в любое время', popularBadge: 'Популярный',
  priceFree: 'Бесплатно', priceNegotiable: 'Договорная', pricePeriodMonth: 'сум / мес',
  planStarterName: 'Начальный', planStarterDesc: 'Для пробы', planStarterF1: 'Ежедневный AI-чат (ограниченно)', planStarterF2: 'Базовые тесты', planStarterF3: '1 предмет', planStarterF4: 'Отслеживание прогресса', ctaStartFree: 'Начать бесплатно',
  planProName: 'Pro', planProDesc: 'Для активных учеников', planProF1: 'Безлимитный AI-чат', planProF2: 'Все тесты и экзамены', planProF3: 'AI Vision — решение по фото', planProF4: 'Статистика прогресса', planProF5: 'Приоритетная поддержка', ctaBuyPro: 'Купить Pro',
  planSchoolName: 'Школа', planSchoolDesc: 'Школы и институты', planSchoolF1: 'Все возможности Pro', planSchoolF2: 'Безлимит учеников', planSchoolF3: 'Админ-панель и управление', planSchoolF4: 'Отчёты и аналитика', planSchoolF5: 'Индивидуальная интеграция', ctaContact: 'Связаться',
  secAboutTitle: 'О нас', secAboutSub: 'YordamchiAI — персональный AI-учитель для каждого ученика', aboutParagraph: 'YordamchiAI анализирует уровень знаний ученика, выявляет слабые стороны и даёт подходящие именно ему объяснения. Наша цель — сделать качественное образование открытым, понятным и увлекательным для каждого.',
  aboutVal1T: 'Передовой ИИ', aboutVal1D: 'Современный AI на базе Gemini — адаптируется к каждому ученику.', aboutVal2T: 'На узбекском языке', aboutVal2D: 'Полностью на узбекском, соответствует местной программе.', aboutVal3T: 'Безопасно и надёжно', aboutVal3D: 'Ваши данные защищены, конфиденциальность гарантирована.',
  secFaqTitle: 'Частые вопросы', secFaqSub: 'Ответы на ваши вопросы здесь',
  faqQ1: 'Что такое YordamchiAI?', faqA1: 'Это образовательная платформа на базе ИИ. Она анализирует знания ученика, выявляет слабые темы и даёт персональные объяснения.',
  faqQ2: 'Платформа бесплатна?', faqA2: 'Начальный тариф бесплатный. Для расширенных возможностей (безлимитный AI-чат, AI Vision, все тесты) есть тариф Pro.',
  faqQ3: 'Как работает AI Vision?', faqA3: 'Вы отправляете фото задачи — AI читает её, решает пошагово и объясняет.',
  faqQ4: 'Какие предметы доступны?', faqA4: 'Математика, физика, родной язык, английский и другие школьные предметы. Список постоянно расширяется.',
  faqQ5: 'Мои данные в безопасности?', faqA5: 'Да. Все данные хранятся в зашифрованном виде и не передаются третьим лицам.',
  faqQ6: 'Чем полезно учителям?', faqA6: 'Учителя загружают материалы, создают тесты, следят за посещаемостью и прогрессом учеников.',
  navHome: 'Главная', navCourses: 'Курсы', navAI: 'AI', navStats: 'Статистика', navProfile: 'Профиль',
  notifTitle: 'Уведомления', notifMarkAll: 'Прочитать всё', notifEmpty: 'Нет уведомлений', notifLoading: 'Загрузка…',
  notifNow: 'сейчас', notifMinAgo: 'мин назад', notifHourAgo: 'ч назад', notifDayAgo: 'дн назад',
  achTitle: 'Мои достижения 🏆', achSubtitle: 'Следите за прогрессом каждый день', achNextLevel: 'До следующего уровня:', achLeft: 'осталось',
  achMyCoins: 'Мои монеты', achRecentRewards: 'Последние награды', achBadges: 'Значки', achAIRec: 'Рекомендация AI',
  achRating: 'Рейтинг', achClassRank: 'Рейтинг в классе', achSchoolRank: 'Рейтинг в школе',
  achCompletedLessons: 'Завершённые уроки', achAssignments: 'Задания', achAvgAIScore: 'Средний балл AI', achStudyHours: 'Часы обучения', achAttendance: 'Посещаемость',
  achWeeklyActivity: 'Недельная активность', achHourShort: 'ч',
  achPresent: 'Присутствовал', achAbsent: 'Пропустил', achLate: 'Опоздал', achLateShort: 'Опозд.',
  achAttendanceTitle: 'Посещаемость 📅', achDays: 'дн', achTimes: 'раз',
  achAIAnalysis: 'Анализ AI', achRiskLow: 'Низкий риск', achRiskMed: 'Средний риск', achRiskHigh: 'Высокий риск',
  achCertificates: 'Сертификаты', achCertEmpty: 'Сертификатов пока нет — достигайте целей', achDownload: 'Скачать',
  lessTitle: 'Мои уроки 📚', lessSubtitle: 'Развивайте свои знания каждый день',
  lessAll: 'Все', lessActive: 'Активные', lessCompleted: 'Завершённые', lessLocked: 'Заблокировано',
  lessSearchPh: 'Поиск курса...', lessTeacher: 'Учитель:', lessCourse: 'Курс', lessDone: 'Завершён', lessLessonsDone: 'уроков пройдено', lessContinue: 'Продолжить',
  lessMyCourses: 'Мои курсы', lessCoursesCount: 'курсов',
  lessToday: 'Уроки на сегодня', lessLastViewed: 'Последний урок', lessContinueBtn: 'Продолжить',
  lessStDone: 'Выполнено', lessStProgress: 'В процессе',
  lessAnalytics: 'Учебная аналитика', lessStreak: 'Дней подряд',
  lessNoHw: 'Пока нет заданий', lessDeadline: 'Срок:', lessNoDeadline: 'Без срока',
  lessHwGraded: 'Оценено', lessHwSubmitted: 'Сдано', lessHwOverdue: 'Просрочено', lessHwDueToday: 'Срок сегодня', lessHwNotDone: 'Не выполнено',
  asgTitle: 'Задания 📝', asgSubtitle: 'Развивайте знания с помощью AI',
  asgAICapabilities: 'Ваши AI-возможности', asgAICheck: 'AI-проверка', asgAIChat: 'AI-чат', asgLimitOver: 'Лимит исчерпан — Premium →', asgClose: 'Закрыть',
  pmTitle: 'Бесплатный AI-лимит исчерпан 🚀', pmDesc: 'С Premium — безлимитная AI-проверка, больше чата, анализ изображений и PDF.', pmF1: 'AI-проверка: 50 раз в день', pmF2: 'AI-чат: 300 вопросов в день', pmF3: 'Расширенный анализ изображений и PDF', pmCta: 'Перейти на Premium', pmPayMethods: 'Способы оплаты (скоро)', pmCard: 'Карта',
  arAIScore: 'Оценка AI', arMistakes: 'Ошибки', arWeakTopics: 'Слабые темы',
  anAvgScore: 'Средний балл', anImprovement: 'Улучшение AI', anWeekly: 'За неделю',
  qrError: 'Ошибка', qrLockedTitle: 'QR-посещаемость — Premium 🚀', qrLockedDesc: 'С Premium — автоматическая посещаемость: отсканируйте QR-код и отметьтесь мгновенно.', qrTitle: 'QR-посещаемость', qrSubtitle: 'Введите QR-код, показанный учителем',
  qrDone: 'Посещение отмечено ✅', qrRewarded: '+XP и монеты добавлены на ваш счёт', qrPlaceholder: 'QR-код (например: A1B2C3)', qrChecking: 'Проверка…', qrMark: 'Отметить посещение', qrCameraSoon: '📷 Сканер камеры появится в следующем обновлении',
  qrScanBtn: 'Сканировать камерой', qrScanning: 'Сканирование…', qrOrCode: 'или введите код', qrCamDenied: 'Нет доступа к камере. Введите код вручную.',
  tfViewsSuffix: 'просмотры', tfLessonViews: 'Просмотры урока', tfRefresh: 'Обновить',
  tfTotalStudents: 'Всего учеников', tfViewed: 'Просмотрели', tfCompleted: 'Завершили',
  tfMin: 'мин', tfDoneWatch: 'завершил', tfWatched: 'просмотрел', tfNotOpened: 'не открыл', tfNoStudents: 'В группе нет учеников',
  tfGroup: 'Группа', tfStartSession: 'Начать сессию', tfEnterCode: 'Или введите этот код:', tfExpires: 'Действует до:', tfCloseSession: 'Закрыть сессию', tfCameraSoon: '📷 Сканер QR-камеры в следующем обновлении', tfShowQr: 'Ученики сканируют QR-код:',
  tfQrLockTitle: 'QR-посещаемость — Premium', tfQrLockDesc: 'С Premium — автоматическая посещаемость через QR.', tfVideoLockTitle: 'Видеоурок — Premium', tfVideoLockDesc: 'Загрузка видеоуроков доступна на тарифе Premium/Education.', tfVideoOpen: 'Загрузка видео открыта ✅', tfVideoOpenDesc: 'Прикрепите видео к уроку — ученики смотрят, собирается статистика просмотров.',
  tfAIStudentAnalysis: 'AI-анализ учеников', tfWeakStudents: 'Отстающие ученики', tfAILockTitle: 'AI-анализ — Premium', tfAILockDesc: 'С Premium AI выявляет слабые места учеников.',
  nbHome: 'Главная', nbFeatures: 'Возможности', nbPricing: 'Цены', nbAbout: 'О нас', nbFaq: 'FAQ',
  nbSelectLang: 'Выбрать язык', nbCloseMenu: 'Закрыть меню', nbOpenMenu: 'Открыть меню', nbMainMenu: 'Главное меню',
  nf404Title: 'Страница не найдена', nf404Desc: 'Страница, которую вы ищете, не существует или была перемещена.', nfGoHome: 'На главную', ebTitle: 'Что-то пошло не так', ebRetry: 'Повторить',
  admFaolPremium: 'Активный Premium', admFree: 'Бесплатный (Free)', admPremiumMgmt: 'Управление Premium', admPlan: 'Тариф', admStart: 'Начало', admEnd: 'Окончание', admSave: 'Сохранить', admSaved: 'Сохранено',
  admPermissions: 'Права админов', admSuperAdmin: 'Супер-админ', admNoOtherAdmins: 'Других админов нет', admSuper: 'Супер', admActive: 'Активен', admDisabled: 'Отключён', admDisable: 'Отключить', admActivate: 'Активировать',
  saSysHealth: 'Состояние системы', saLastBackup: 'Последний бэкап:', saSupabaseAuto: 'Supabase автоматически',
  saPayCenter: 'Платёжный центр', saSum: 'сум', saTotalRevenue: 'Общий доход', saMonthlyRevenue: 'Доход за месяц', saExpired: 'Истёкшие', saUserIdManual: 'ID пользователя (ручной premium)', saUserUuidPh: 'user uuid…', saPayHistory: 'История платежей',
  saAnnCenter: 'Центр объявлений', saAnnTitlePh: 'Заголовок (например: Новый урок 🚀)', saAnnBodyPh: 'Текст (необязательно)', saSend: 'Отправить', saSent: 'Отправлено', saAnnNote: 'Объявление рассылается через систему уведомлений.',
  saPromoCodes: 'Промокоды', saCodePh: 'КОД', saDiscountPct: 'Скидка %', saFreeDays: 'Бесплатные дни', saDays: 'дн', saLimitPh: 'Лимит', saCreate: 'Создать', saNoPromo: 'Промокодов нет',
  saActivityLog: 'Журнал действий', saSearchAction: 'Поиск по действию…', saLogEmpty: 'Журнал пуст', saOnlySuper: 'Этот раздел только для Супер-админа', saSuperMgmt: 'Управление Супер-админа',
  saPlatform: 'Управление платформой', saOrgsTitle: 'Организации', saStatOrgs: 'Организации', saStatUsers: 'Пользователи', saStatPaid: 'Платные', saStatRevenue: 'Общий доход',
  saMembers: 'участ.', saStudentsShort: 'ученик', saTeachersShort: 'учитель', saSuspend: 'Заблокировать', saActivate: 'Активировать',
  saSuspended: 'Заблокирован', saActiveOrg: 'Активен', saApplyPlan: 'Установить план', saPlanMonths: 'мес', saNoOrgs: 'Нет организаций', saOrgSuspendedNote: 'Пользователи заблокированной организации не смогут войти.',
  saCreateOrg: 'Новая организация', saOrgNamePh: 'Название организации', saDelete: 'Удалить', saDeleteOrgConfirm: 'Удалить эту организацию полностью?', saOrgNotEmptyErr: 'Нельзя удалить организацию с участниками.',
  saUsersTitle: 'Пользователи', saUserSearchPh: 'Поиск по имени или email…', saNoUsers: 'Пользователи не найдены', saCreate2: 'Создать',
  fpPdf: 'PDF', fpImage: 'Изображение', fpVideo: 'Видео', fpAudio: 'Аудио', fpDocument: 'Документ', fpText: 'Текст', fpFile: 'Файл', fpFilePrefix: 'Файл:',
  fpZoomOut: 'Уменьшить', fpZoomIn: 'Увеличить', fpRotate: 'Повернуть', fpFsExit: 'Выйти из полноэкранного режима', fpFsEnter: 'Полный экран', fpClose: 'Закрыть',
  fpCantPreview: 'Не удалось открыть', fpCantPreviewDl: 'Не удалось открыть — скачайте', fpCantPreviewType: 'Этот тип файла нельзя открыть',
  fpRequired: 'Обязательно', fpOptional: 'Необязательно', fpMakeOptional: 'Сделать необязательным', fpMakeRequired: 'Сделать обязательным',
  fpFileInfo: 'Информация о файле', fpInfo: 'Информация', fpCancel: 'Отмена',
  fpName: 'Имя', fpExtension: 'Расширение', fpSize: 'Размер', fpUploaded: 'Загружено', fpUploader: 'Загрузил',
  fpViewed: 'Просмотрено', fpDownloaded: 'Скачано', fpLastView: 'Последний просмотр', fpLastDownload: 'Последнее скачивание',
  fpActions: 'Действия', fpCopied: 'Скопировано', fpLink: 'Ссылка', fpRename: 'Переименовать', fpReplace: 'Заменить',
  fpComingSoon: 'Скоро', fpAskAI: '🤖 Спросить AI об этом файле',
  sdGreetMorning: 'Доброе утро', sdGreetDay: 'Добрый день', sdGreetEvening: 'Добрый вечер', sdGreetNight: 'Доброй ночи',
  sdSun: 'Воскресенье', sdMon: 'Понедельник', sdTue: 'Вторник', sdWed: 'Среда', sdThu: 'Четверг', sdFri: 'Пятница', sdSat: 'Суббота',
  sdToday: 'Сегодня', sdWave: 'помахать рукой',
  sdTodayLessons: 'Уроки на сегодня', sdNoTodayLessons: 'На сегодня уроков нет', sdNoTodayHint: 'Не забудьте отдохнуть 🌿',
  sdUpcomingLessons: 'Предстоящие уроки', sdNoUpcoming: 'Предстоящие уроки ещё не назначены', sdNoUpcomingHint: 'Новое расписание скоро появится',
  sdNoAttendance: 'Нет данных о посещаемости', sdNoAttendanceHint: 'Появится, когда начнутся уроки',
  sdPresent: 'Присутствовал', sdLate: 'Опоздал', sdExcused: 'По уважит.', sdAbsent: 'Отсутствовал',
  sdUpcomingBucket: 'Предстоящие', sdGraded: 'Оценено',
  sdAiPlaceholder: 'Напишите вопрос или загрузите фото / PDF…', sdAiAsk: 'Напишите вопрос AI', sdCamera: 'Камера', sdGallery: 'Галерея', sdVoice: 'Голос',
  sdAlgebra: 'Алгебра', sdPhysics: 'Физика', sdChemistry: 'Химия', sdEnglish: 'Английский', sdHistory: 'История', sdEssay: 'Сочинение', sdLessonPlan: 'План урока',
  sdAsgNo: 'Заданий нет', sdLoadFailed: 'Не удалось загрузить', sdAsgHint: 'Новые домашние задания появятся здесь',
  sdStatSolved: 'Решённых вопросов', sdStatAccuracy: 'Точность', sdStatAIAvail: 'AI доступен', sdStatLangs: 'Поддерживаемых языков',
  sdRecBefore: 'сегодня повторите тему', sdRecAfter: '', sdStartAI: 'Запустить AI-помощника', sdMyLessons: 'Мои уроки',
  sdOnlineReady: 'готов', sdStatsShort: 'Статистика', sdRankShort: 'Рейтинг',
  sdErrTitle: 'Не удалось загрузить данные', sdErrDesc: 'Проверьте интернет-соединение и попробуйте снова.',
  tdTabStudents: 'Мои ученики', tdTabCourses: 'Мои группы', tdTabReports: 'Отчёты', tdTabAchievements: 'Достижения',
  tdGold: 'Золото', tdSilver: 'Серебро', tdBronze: 'Бронза', tdSpecial: 'Особый', tdBelowBronze: '< Бронза', tdAchievement: 'Достижение',
  tdTeacher: 'Учитель', tdRealData: 'Реальные данные',
  tdStudents: 'Ученики', tdGroups: 'Группы', tdLessons: 'Уроки', tdTestResults: 'Результаты тестов',
  tdSearchStudent: 'Имя ученика или группа...', tdNoStudents: 'В группах нет учеников', tdStudentNotFound: 'Ученик не найден', tdColStudent: 'Ученик', tdColGroup: 'Группа', tdColStatus: 'Статус', tdInactive: 'Неактивен', tdCompleted: 'Завершён',
  tdAttSummary: 'Сводка посещаемости по группам', tdParticipations: 'посещений', tdPresentPct: 'присутств.', tdGoToAttendance: 'Перейти к отметке посещаемости',
  tdTopStudents: 'Лучшие ученики (результаты тестов)', tdNoTestResults: 'Результатов тестов нет — опубликуйте тесты, и после сдачи учениками появится отчёт',
  tdAchWord: 'достиж.', tdAchieved: 'Достигнуто', tdScoreDistribution: 'Распределение баллов', tdTotalScore: 'Общий балл',
  tdGoldMsg: '🥇 Вы достигли золотого уровня!', tdSilverMsg: '🥈 Серебряный уровень!', tdBronzeMsg: '🥉 Бронзовый уровень!', tdNoCertYet: 'Вы ещё не достигли уровня сертификата',
  tdScoreTest: 'Балл теста', tdScoreConsistency: 'Стабильность', tdScoreActivity: 'Активность',
  tdForBronze: 'До бронзы:', tdForSilver: 'До серебра:', tdForGold: 'До золота:', tdScoreNeeded: 'балл(ов) нужно',
  tdAchievedTitle: 'Полученные достижения', tdCount: 'шт', tdBall: 'балл', tdNoAchYet: 'Достижений пока нет', tdAchEmptyDesc: 'После завершения месячного расчёта ваши достижения появятся здесь.',
  tdBronzeGoal: 'Наберите 60+ баллов', tdSilverGoal: 'Наберите 75+ баллов', tdGoldGoal: 'Наберите 90+ баллов', tdRecentActivity: 'Последняя активность', tdDashboardTitle: 'Панель учителя',
  tdFullStudents: 'Полная страница учеников', tdGroupWord: 'групп', tdNoGroups: 'Группы не назначены', tdStudentWord: 'учеников', tdLessonWord: 'уроков', tdView: 'Смотреть', tdMoreAchievements: 'достиж.',
  adWelcome: 'Добро пожаловать 👋', adTitle: 'Панель администратора', adInSystem: 'В системе', adUsersWord: 'пользователей', adRealtime: 'Реальное время',
  adTabUsers: 'Пользователи', adTabTeachers: 'Учителя', adTabActivity: 'Активность', adCourses: 'Курсы',
  adStudent: 'Ученик', adAdmin: 'Админ', adTeachers: 'Учителя', adTests: 'Тесты', adAttRecords: 'Записей посещаемости',
  adMonthlySignups: 'Регистрации по месяцам (последние 12 мес.)', adTotal: 'Всего:', adAllSystemsOk: 'Все системы работают — подключение к Supabase активно',
  adSearchUser: 'Имя или email...', adAll: 'Все', adUser: 'Пользователь', adRole: 'Роль', adJoined: 'Присоединился',
  adTeachersCount: 'учителей', adGroupC: 'Группа', adNoTeachers: 'Учителей нет', adAllTeachers: 'Все учителя',
  adRecentStudents: 'недавних учеников', adCoursesCount: 'курсов (групп)', adNoCourses: 'Курсов нет', adAllCourses: 'Все курсы',
  adNoActivity: 'Активности пока нет', adTest: 'Тест', adUserWord: 'Пользователь', adUserNotFound: 'Пользователь не найден',
  lpAIHelp: 'AI помощь', lpComingSoon: 'Скоро заработает', lpAllLessons: 'Все уроки', lpNoResults: 'Результаты поиска не найдены', lpLessonText: 'Текст урока',
  lpSummarize: 'Обобщить урок', lpExplainEasier: 'Объяснить проще', lpMakeQuiz: 'Создать квиз', lpTranslate: 'Перевести', lpAskAIQ: 'Спросить AI', lpContextNote: 'помогает в контексте урока',
  tsBackToList: 'Вернуться к списку тестов', tsAnswered: 'отвечено', tsQuestions: 'Вопросы', tsQuestionPalette: 'Палитра вопросов', tsUnanswered: 'вопрос(ов) без ответа', tsSubmit: 'Сдать тест',
  tsResult: 'РЕЗУЛЬТАТ', tsPassed: 'Успешно сдано', tsRetry: 'Попробуйте снова', tsCorrect: 'верных', tsQuestionWord: 'вопросов', tsQuestionAnalysis: 'Анализ вопросов', tsCorrectMark: '✓ Верно',
  tsMotiv90: 'Отлично! Вы прекрасно освоили эту тему! 🏆', tsMotiv80: 'Отличный результат! Почти идеально! ⭐', tsMotiv60: 'Поздравляем! Вы успешно сдали! 🎉', tsMotivLow: 'Хорошая попытка! Немного больше практики — и вы добьётесь успеха 📚',
  tsTitle: 'Тесты', tsSubtitle: 'Доступные онлайн-тесты', tsNoTests: 'Доступных тестов нет', tsNoTestsHint: 'Когда учитель опубликует тест, он появится здесь', tsMinutes: 'минут', tsStart: 'Начать',
  asgpDueToday: 'Истекает сегодня', asgpFilterAria: 'Фильтр по статусу', asgpSubject: 'Предмет:', asgpAllSubjects: 'Все предметы',
  asgpLoadFail: 'Не удалось загрузить задания', asgpNoMatch: 'Нет заданий по этому фильтру', asgpMaxScore: 'Макс.', asgpMaterials: 'Материалы',
  asgpGrade: 'Оценка:', asgpFeedback: 'Комментарий:', asgpMyWork: 'Моя работа', asgpPickFile: 'Выберите файл задания', asgpSubmitBtn: 'Сдать', asgpDeadlinePassed: 'Срок истёк',
  asgpAIHelp: 'Получить помощь AI', asgpAIPlaceholder: 'Напишите ответ текстом — AI проверит, оценит и даст рекомендации…', asgpAICheckBtn: 'Проверить AI', asgpRecheck: 'Проверить снова', asgpNoMaterials: 'Прикреплённых материалов нет',
  mpTitle: 'Мои результаты', mpSubtitle: 'Статистика учебного процесса', mpLoadErr: 'Ошибка при загрузке данных', mpTestAvg: 'Средний тест', mpPassedTests: 'Сдано тестов',
  mpAttDetail: 'Детали посещаемости', mpByGroup: 'По группам', mpPassed: 'Сдал', mpFailed: 'Не сдал', mpNoResults: 'Результатов пока нет', mpNoResultsHint: 'Посещайте уроки и сдавайте тесты — всё появится здесь',
  mJan: 'Январь', mFeb: 'Февраль', mMar: 'Март', mApr: 'Апрель', mMay: 'Май', mJun: 'Июнь',
  mJul: 'Июль', mAug: 'Август', mSep: 'Сентябрь', mOct: 'Октябрь', mNov: 'Ноябрь', mDec: 'Декабрь',
  stAttSubtitle: 'История вашей посещаемости', stAttOverall: 'Общая посещаемость', stAttEmptyHint: 'Когда учитель отметит посещаемость, она появится здесь',
  aiNewChat: 'Новый чат', aiSearchPh: 'Поиск...', aiNoConvs: 'Чатов пока нет', aiSearchNotFound: 'не найдено',
  aiPinned: '📌 Закреплённые', aiYesterday: 'Вчера', aiOlder: 'Ранее', aiChatWord: 'Чат', aiHistory: 'История чатов', aiOpen: 'Открыть',
  aiCopy: 'Копировать', aiLike: 'Хорошо', aiDislike: 'Плохо', aiRegenerate: 'Сгенерировать заново', aiContinue: 'Продолжить', aiThinking: 'AI думает', aiWaiting: 'Ожидание ответа',
  aiRename: 'Переименовать', aiRenameEdit: 'Редактировать название', aiPin: 'Закрепить', aiUnpin: 'Открепить',
  aiMsgsLoadErr: 'Ошибка загрузки сообщений', aiNewChatErr: 'Ошибка создания чата', aiContinueErr: 'Ошибка продолжения', aiRegenErr: 'Ошибка повторной генерации', aiDeleteErr: 'Ошибка удаления',
  aiContextPanel: 'Панель контекста', aiExport: 'Экспорт', aiDropFile: 'Перетащите файл сюда', aiRemoveFile: 'Убрать файл', aiCancel: 'Отменить',
  aiVoiceUnsupported: 'Не поддерживается', aiVoiceWrite: 'Голосовой ввод', aiVoiceStop: 'Остановить',
  aiQaMath: 'Математика', aiQaMathD: 'Уравнения, формулы', aiQaCode: 'Программирование', aiQaCodeD: 'Код, отладка', aiQaTranslate: 'Перевод', aiQaTranslateD: 'Многоязычный',
  aiQaPdf: 'Анализ PDF', aiQaPdfD: 'Анализ документа', aiQaEssay: 'Сочинение', aiQaEssayD: 'Письмо, редактура', aiQaTest: 'Создать тест', aiQaTestD: 'Генерация вопросов',
  pfTitle: 'Профиль', pfSubtitle: 'Личные данные и настройки аккаунта', pfUpdated: 'Профиль успешно обновлён', pfPwChanged: 'Пароль успешно изменён', pfPwMismatch: 'Пароли не совпадают', pfError: 'Произошла ошибка',
  pfAdministrator: 'Администратор', pfAvatarUsing: 'Используется загруженное фото', pfAvatarInitials: 'Показываются инициалы', pfUploadPhoto: 'Загрузить фото', pfAvatarDeleteQ: 'Удалить аватар?', pfYesDelete: 'Да, удалить',
  pfPersonalInfo: 'Личные данные', pfFullName: 'Полное имя *', pfFullNamePh: 'Имя Фамилия', pfEmailNoChange: 'Email (нельзя изменить)', pfPhone: 'Номер телефона', pfBioPh: 'Кратко о себе...', pfSaveChanges: 'Сохранить изменения',
  pfAccountInfo: 'Данные аккаунта', pfBlocked: 'Заблокирован', pfRegistered: 'Регистрация', pfLanguage: 'Язык', pfAbout: 'О себе',
  pfSecurity: 'Безопасность', pfChangePw: 'Изменить пароль', pfNewPw: 'Новый пароль', pfPwMin: 'Минимум 8 символов', pfConfirmPw: 'Подтвердите пароль', pfPwRepeat: 'Введите пароль ещё раз',
  pfAppearance: 'Внешний вид', pfThemeNote: 'Тема меняется кнопкой 🌙/☀️ в навбаре.',
  ccTitle: 'Мои курсы', ccJoinedGroups: 'групп(ы), в которых вы состоите', ccEmpty: 'Вы ещё не присоединились ни к одному курсу', ccEmptyHint: 'Когда администратор добавит вас в группу, курс появится здесь', ccTotalLessons: 'Всего уроков', ccActiveCourses: 'Активных курсов', ccLesson: 'Уроков',
  tcSubtitle: 'Управление уроками группы', tcNewLesson: 'Новый урок', tcNoGroup: 'Вам не назначена группа', tcNoGroupHint: 'Администратор должен назначить группу',
  tcEditLesson: 'Редактировать урок', tcAddLesson: 'Добавить урок', tcLessonName: 'Название урока', tcLessonNamePh: 'Например: Урок 1: Введение', tcDate: 'Дата', tcSubject: 'Предмет', tcNoSubject: '— Предмет не выбран —',
  tcLessonContent: 'Текст урока / Конспект', tcContentPh: 'Содержание урока, задания, примечания...', tcVideoUrl: 'Ссылка на видео (YouTube или Vimeo)', tcVideoOk: 'Ссылка распознана', tcVideoBad: 'Поддерживаются только ссылки YouTube и Vimeo',
  tcMaterials: 'Материалы урока', tcDropAria: 'Перетащите файлы или выберите', tcDropActive: 'Бросьте файлы сюда', tcDropIdle: 'Перетащите файлы или нажмите', tcDropHint: 'PDF, Word, Excel, PowerPoint, изображения (JPG/PNG), ZIP • Макс. 20 МБ • несколько файлов',
  tcUploadAfterSave: 'загрузится после сохранения', tcRemove: 'Убрать', tcNoMaterialYet: 'Материалы ещё не добавлены', tcPublish: 'Опубликовать урок (ученики увидят)', tcAdd: 'Добавить',
  tcLessonsEmpty: 'Уроков нет', tcLessonsEmptyHint: 'Для этой группы ещё не добавлены уроки', tcAddFirst: 'Добавьте первый урок',
  tcPublished: 'Опубл.', tcDraft: 'Черновик', tcHasText: 'Есть текст', tcDeleteShort: 'Удалить', tcPublishState: 'Статус публикации', tcEditT: 'Редактировать',
  tcAttachments: 'Прикреплённые файлы', tcUploading: 'Загрузка...', tcAddFile: 'Добавить файл', tcNoFilesYet: 'Файлы ещё не добавлены', tcFileTypesHint: 'PDF, изображения, Word, Excel, PowerPoint, TXT • Макс. 20 МБ',
  tcNameRequired: 'Название урока обязательно', tcSaveErr: 'Ошибка сохранения', tcStatusErr: 'Ошибка смены статуса', tcUploadErr: 'Ошибка загрузки', tcReplaceErr: 'Ошибка замены', tcFileDeleteErr: 'Ошибка удаления файла', tcDownloadErr: 'Ошибка скачивания',
  taSubtitle: 'Отметьте посещаемость группы', taSaved: 'Посещаемость успешно сохранена', taNoActiveGroup: 'Активная группа не найдена', taNoActiveGroupAssigned: 'Вам не назначена активная группа', taNoName: 'Имя не указано', taNotePh: 'Комментарий (необязательно)...', taSaveBtn: 'Сохранить посещаемость',
  tgTotalGroups: 'Всего групп', tgTotalStudents: 'Всего учеников',
  aaTitle: 'Управление достижениями', aaSubtitle: 'Ежемесячный расчёт и сертификаты', aaCycleTitle: 'Ежемесячный цикл расчёта', aaCycleDesc: 'За выбранный месяц рассчитываются баллы и автоматически выдаются достижения', aaYear: 'Год', aaMonth: 'Месяц',
  aaCalculating: 'Расчёт...', aaCalculate: 'Рассчитать', aaForPeriod: 'за', aaCycleDone: 'Расчёт успешно завершён', aaSnapshots: 'Снимков рассчитано', aaStudTeach: 'ученики + учителя',
  aaAwarded: 'Достижений выдано', aaNewOrUpdated: 'новые или обновлённые', aaAwardedSuffix: '— выданные достижения', aaNoAwards: 'За этот месяц достижения не выданы — недостаточно баллов или пока нет данных', aaTypeWord: 'типов достижений',
  aaTotalTypes: 'Всего типов достижений', aaTotalAwarded: 'Всего выдано достижений', aaErrorLabel: 'Ошибка:', aaNotFound: 'Достижения не найдены', aaMigrationHint: 'Сначала запустите миграции (008–010) в Supabase SQL Editor', aaTimesGiven: 'раз выдано',
  aatSubtitle: 'Посещаемость всех учеников', aatFrom: 'Начало', aatFilter: 'Фильтр', aatSearchPh: 'Ученик или группа...', aatNotFound: 'Записи посещаемости не найдены', aatNote: 'Комментарий', aatLimitPrefix: 'Показаны только 100 записей (из ', aatLimitSuffix: ')',
  sbNameRequired: 'Название предмета не может быть пустым', sbTitle: 'Предметы', sbCount: 'предметов', sbNewSubject: 'Новый предмет', sbEditSubject: 'Редактировать предмет', sbAddSubject: 'Добавить предмет',
  sbNameLabel: 'Название предмета', sbNamePh: 'Например: Математика', sbDescription: 'Описание', sbDescPh: 'Кратко о предмете...', sbColor: 'Цвет', sbIcon: 'Иконка',
  sbNamePreview: 'Название предмета', sbDescPreview: 'Описание...', sbEmpty: 'Предметов нет', sbEmptyHint: 'Пока не добавлено ни одного предмета', sbAddFirst: 'Добавьте первый предмет', sbNoDesc: 'Нет описания',
  thNameRequired: 'Имя и фамилия обязательны', thEmailInvalid: 'Введите корректный email', thNewTeacher: 'Новый учитель', thTotal: 'Всего', thEditTeacher: 'Редактировать учителя', thAddTeacher: 'Добавить учителя',
  thFullName: 'Имя и фамилия', thNamePh: 'Иванов Иван', thEmailEditHint: 'Для изменения email используйте Supabase Dashboard', thTempPassword: 'Временный пароль', thPhone: 'Телефон', thBioLabel: 'Био / Краткая информация', thBioPh: 'Кратко об учителе...',
  thTeachSubjects: 'Преподаваемые предметы', thNoSubjectsA: 'Предметы не добавлены. Сначала перейдите в модуль', thNoSubjectsB: '.', thEmptyHint: 'Пока не добавлено ни одного учителя', thAddFirst: 'Добавьте первого учителя', thSearchNotFoundSuffix: '— учитель не найден', thFilterNoResult: 'Нет результатов по выбранному фильтру', thDeleteQ: 'Удалить?', thGroupWord: 'групп',
  stuNewStudent: 'Новый ученик', stuEditStudent: 'Редактировать ученика', stuAddStudent: 'Добавить ученика', stuCount: 'учеников', stuNamePh: 'Иванов Иван', stuExtraInfo: 'Доп. информация', stuBioPh: 'Кратко об ученике...',
  stuAddToGroup: 'Добавить в группу', stuNoGroupsA: 'Активных групп нет. Сначала создайте группу в модуле', stuNoGroupsB: '.', stuEmpty: 'Учеников нет', stuEmptyHint: 'Пока не добавлено ни одного ученика', stuAddFirst: 'Добавьте первого ученика', stuSearchNotFoundSuffix: '— ученик не найден', stuNoGroupAssigned: 'Не добавлен в группу',
  acSearchPh: 'Курс, учитель или предмет...', acFilterNotFound: 'Курсы по фильтру не найдены', acEmptyHint: 'Создайте группу в модуле «Группы» — она появится здесь как курс', acTestWord: 'тест', acFilledSuffix: 'заполнено',
  agNameRequired: 'Название группы не может быть пустым', agNewGroup: 'Новая группа', agEditGroup: 'Редактировать группу', agAddGroup: 'Добавить группу', agGroupName: 'Название группы', agNamePh: 'Например: Г-101', agCapacity: 'Вместимость (число учеников)',
  agStartDate: 'Дата начала', agEndDate: 'Дата окончания', agDescPh: 'Доп. информация о группе...', agSearchPh: 'Группа, предмет или учитель...', agEmpty: 'Групп нет', agEmptyHint: 'Пока не добавлено ни одной группы', agAddFirst: 'Добавьте первую группу', agSearchNotFoundSuffix: '— группа не найдена', agSeats: 'мест',
  alSubtitle: 'Уроки всех групп', alTotalLessons: 'Всего уроков', alPublished: 'Опубликовано', alSearchPh: 'Название урока или учитель...', alEmpty: 'Уроков нет', alEmptyHint: 'Когда учителя добавят уроки, они появятся здесь', alNoContent: 'Контент не добавлен',
  atSubtitle: 'Все тесты и результаты', atSearchPh: 'Название теста или группа...', atEmpty: 'Тестов нет', atEmptyHint: 'Когда учителя создадут тесты, они появятся здесь', atResults: 'результ.', atFilterNotFound: 'Тесты по фильтру не найдены',
  arpSubtitle: 'Статистика и отчёты платформы', arpGroupAtt: 'Посещаемость по группам', arpAvg: 'Средн.:', arpEmpty: 'Нет данных для отчёта', arpEmptyHint: 'После добавления посещаемости и результатов тестов появится отчёт',
  asTitle: 'Настройки', asSubtitle: 'Конфигурация системы', asSaved: 'Настройки успешно сохранены', asGeneral: 'Общие настройки', asSystemInfo: 'Информация о системе', asPlatform: 'Платформа', asVersion: 'Версия',
  asSecurity: 'Безопасность', asNewPw: 'Новый пароль', asConfirmPw: 'Подтвердите пароль', asPwChange: 'Изменить пароль', asPwChanged: 'Пароль успешно изменён', asPwShort: 'Пароль должен быть не менее 8 символов', asPwMismatch: 'Пароли не совпадают', asPwErr: 'Ошибка при смене пароля',
  asOrgName: 'Название организации', asOrgDesc: 'Описание организации', asOrgDescPh: 'Онлайн-платформа обучения', asSupportEmail: 'Email поддержки', asMaxGroup: 'Макс. число учеников в группе', asOrgNameReq: 'Название организации обязательно',
  anTitle: 'Аналитика', anSubtitle: 'Показатели работы платформы', anAdmins: 'Админы', anMonthlyStudents: 'Ученики по месяцам (посл. 6 мес.)', anMonthlyTeachers: 'Учителя по месяцам (посл. 6 мес.)', anNoData: 'Нет данных', anCount: 'шт',
  anAttStates: 'Статусы посещаемости', anNoTestResults: 'Нет результатов тестов', anPassRate: 'Процент сдачи', anPassed: 'Сдал (≥60%)', anFailed: 'Не сдал (<60%)', anTotalSubmitted: 'сдано',
  ppTitle: 'Простые и прозрачные цены', ppSubtitle: 'Выберите план под ваши нужды.', ppGetStarted: 'Начать',
  taMyAch: 'Мои достижения', taMyAchSub: 'Для каждого достижения можно скачать сертификат', taAchEmptyHint: 'Достижения выдаются автоматически, когда админ запустит ежемесячный расчёт', taBall: 'Балл:', taAboutTitle: 'О достижениях учителя', taAboutDesc: 'Лучший учитель, Топ-ментор и награда «Отличник» — выдаются автоматически админом каждый месяц. Баллы рассчитываются на основе качества посещаемости, результатов тестов учеников и преподавательской активности.',
  cdTitle: 'Детали курса', cdComingSoon: 'Контент курса и уроки скоро появятся.',
  tstSearchPh: 'Имя, email или телефон...', tstAllGroups: 'Все группы', tstNotFound: 'По поиску учеников не найдено',
  ttNameRequired: 'Название теста обязательно', ttMinQuestion: 'Нужен минимум 1 вопрос', ttFillAllQ: 'Все вопросы должны быть заполнены', ttFillAllOpts: 'Все варианты должны быть заполнены', ttPublishStatusErr: 'Ошибка смены статуса публикации',
  ttResults: 'Результаты', ttNoSubmissions: 'Ещё никто не сдал', ttScore: 'Балл', ttPercent: 'Процент',
  ttEditTest: 'Редактировать тест', ttNewTest: 'Новый тест', ttTestInfo: 'Данные теста', ttTestName: 'Название теста', ttTestNamePh: 'Например: Алгебра — тест по главе 1', ttDesc: 'Описание', ttDescPh: 'Кратко о тесте...', ttNoGroupSel: '— Группа не выбрана —', ttDuration: 'Время (минут)', ttPublish: 'Опубликовать тест (ученики увидят)',
  ttQuestions: 'Вопросы', ttAddQuestion: 'Добавить вопрос', ttNoQuestions: 'Вопросов нет. Нажмите «Добавить вопрос»', ttQuestionPh: 'Текст вопроса...', ttVariant: 'Вариант', ttCreateTest: 'Создать тест',
  ttCountWord: 'тест(ов)', ttEmpty: 'Тестов нет', ttEmptyHint: 'Создайте свой первый тест', ttPublished: 'Опубликован', ttUnpublish: 'В черновик', ttPublishAction: 'Опубликовать',
  tapConfirmDelete: 'Удалить это задание?', tapSubtitle: 'Создавайте и оценивайте домашние задания', tapNew: 'Новое задание', tapEmpty: 'Вы ещё не создали заданий', tapSubmittedCount: 'сдано', tapViewWorks: 'Смотреть работы', tapEdit: 'Редактировать задание',
  tapTitleField: 'Заголовок *', tapTitlePh: 'Например: задачи по теме 5', tapDescPh: 'Детали задания…', tapNotSelected: 'Не выбрано', tapMaxScore: 'Максимальный балл', tapDeadline: 'Срок',
  tapGroupsField: 'Группы *', tapNoGroups: 'У вас нет групп', tapAttachedFiles: 'Прикреплённые файлы', tapAttachAfterSave: 'Файлы можно прикрепить после сохранения задания.', tapAttachFile: 'Прикрепить файл',
  auRoleChangeErr: 'Ошибка смены роли', auAdmins: 'Админы', auJami: 'Всего', auAllStatuses: 'Все статусы', auEmpty: 'Пользователей нет', auNotFound: 'По фильтру пользователи не найдены', auToggleHint: 'Нажмите, чтобы сменить статус', auJoined: 'Добавлен',
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
  aiAssistant: 'YordamchiAI',
  // AI Teacher Panel
  atpTitle: 'AI Учитель', atpPanelAria: 'Панель AI учителя', atpStreakTitle: 'Ежедневная серия', atpInsightsTitle: 'AI анализ',
  atpNewBadge: 'Новое', atpMasteryTitle: 'Уровень освоения', atpWeakTitle: 'Слабые темы', atpPathTitle: 'Путь обучения',
  atpGoalTitle: 'Цель на сегодня', atpAchTitle: 'Достижения', atpMissionTitle: 'Недельная миссия', atpNextTitle: 'В Sprint 2.3',
  atpWeeklyActivity: 'Активность за неделю',
  atpLvlBeginner: 'Новичок', atpLvlLearner: 'Ученик', atpLvlKnower: 'Знаток', atpLvlMentor: 'Наставник', atpLvlExpert: 'Эксперт',
  atpLevel: 'Уровень', atpNextLevel: 'следующий уровень',
  atpDayMon: 'Пн', atpDayTue: 'Вт', atpDayWed: 'Ср', atpDayThu: 'Чт', atpDayFri: 'Пт', atpDaySat: 'Сб', atpDaySun: 'Вс',
  atpKun: 'дн.', atpStreakActive: 'Активность подряд!', atpTodayActive: 'Сегодня активен',
  atpMasteryOverall: 'Общий',
  atpPathCurrent: 'Текущая тема', atpPathTopic3: 'Уравнения третьей степени', atpPathTopic4: 'Функции и графики', atpDone: 'Завершено', atpInProgress: 'В процессе',
  atpWeakDiscriminant: 'Вычисление дискриминанта', atpWeakNegRoots: 'Отрицательные корни', atpWeakFuncVals: 'Значения функции', atpWeakPractice: 'Нажмите для практики',
  atpGoalStudy: 'Обучение', atpGoalHourSuffix: '— 1 час занятий', atpGoalReview: 'Повторяйте вместе с AI',
  atpAch1Name: 'Первый вопрос', atpAch1Desc: 'Первый диалог с AI', atpAch2Name: 'Недельный боец', atpAch2Desc: '7 дней подряд активны',
  atpAch3Name: 'Мастер тестов', atpAch3Desc: 'Средний результат 75%+', atpAch4Name: 'Герой посещаемости', atpAch4Desc: 'Посещаемость 90%+',
  atpAch5Name: 'Знаток', atpAch5Desc: 'Набрать 500+ XP', atpAch6Name: 'Перфекционист', atpAch6Desc: '90%+ во всех тестах',
  atpAch7Name: 'Точный стрелок', atpAch7Desc: 'Сдать 5 тестов', atpAch8Name: 'Быстрый ученик', atpAch8Desc: '3+ урока за первую неделю',
  atpAchLockedSuffix: 'значков не разблокировано',
  atpMissionReward: '100 XP + 🏆 Значок', atpMissionTask1: 'Пройти 3 урока', atpMissionTask2: 'Сдать 2 теста', atpMissionTask3: 'Диалог с AI',
  atpMissionTask4: 'Результат теста 80%+', atpMissionTask5: 'Набрать 50+ XP', atpMissionDoneSuffix: 'задач выполнено',
  atpNextDesc: 'Домашние задания, комментарии учителя и планирование с реальными данными',
  atpInsLoading: 'AI учитель загружает ваши данные…',
  atpInsTestLow: 'Ваш средний балл {pct}% — уделите внимание вычислению дискриминанта.',
  atpInsTestHigh: 'Ваши результаты тестов отличные ({pct}%)! Вы готовы к следующему уровню.',
  atpInsTestNone: 'Вы ещё не сдавали тесты. Попробуйте первый тест!',
  atpInsAttLow: 'Ваша посещаемость {pct}% — каждый урок повышает результат на 3%.',
  atpInsAttHigh: 'Ваша посещаемость {pct}% — это залог успеха!',
  atpInsAttMid: 'Ваша посещаемость {pct}% — ещё немного и новый рекорд!',
  atpInsSubject: 'Вы систематически растёте по предмету {subject}.',
  atpInsXpHigh: 'Ваша уверенность выросла на 12% за неделю. Так держать!',
  atpInsXpMid: '20 минут практики с AI каждый день — это на 40% быстрее обучение.',
  atpInsXpLow: 'После первого диалога AI составит учебный план. Начните!',
  atpPromptPath: 'Помоги мне по теме "{topic}"', atpPromptWeak: 'Объясни тему "{topic}" подробнее и дай примеры',
  atpPromptSubject: 'Задай вопрос по предмету {subject}', atpPromptToday: 'Объясни сегодняшний урок',
  atpPromptExam: 'Составь план подготовки к экзамену', atpPromptWeakImprove: 'Как мне улучшить слабые темы?',
  // Avatar uploader / cropper
  avChangePhoto: 'Изменить', avUploading: 'Загрузка…', avUploadPhoto: 'Загрузить фото', avDelete: 'Удалить',
  avFormatHint: 'JPG, PNG или WebP · Макс. размер 5 МБ',
  avErrFormat: 'Формат не поддерживается. Загрузите JPG, PNG или WebP.', avErrSize: 'Файл должен быть меньше 5 МБ.',
  avCropTitle: 'Обрезка фото', avCropDesc: 'Часть внутри круга станет фото профиля', avReset: 'Сбросить',
  avCancel: 'Отмена', avConfirm: 'Подтвердить', avCropHint: 'Перетаскивайте и увеличивайте фото • Сохранится часть внутри круга',
  emailPlaceholder: 'ваш@email.com', videoUrlPlaceholder: 'https://www.youtube.com/watch?v=... или https://vimeo.com/...',
  saPendingPayments: 'Ожидающие платежи', saViewReceipt: 'Посмотреть чек', saApprove: 'Подтвердить', saReject: 'Отклонить',
  pmPayTitle: 'Оплата Premium', pmPayHint: 'Переведите на карту ниже и загрузите фото чека. После подтверждения администратором premium активируется.',
  pmCardTransfer: 'Номер карты', pmPerMonth: 'в месяц',
  pmUploadReceipt: 'Загрузите чек об оплате', pmSelectReceipt: 'Выберите фото чека (JPG/PNG/PDF)', pmSubmitPayment: 'Отправить платёж', pmBack: 'Назад',
  pmPaySuccess: 'Платёж отправлен!', pmPaySuccessDesc: 'Чек получен. После подтверждения администратором premium активируется автоматически.',
  pmReceiptRequired: 'Пожалуйста, загрузите фото чека', pmPayError: 'Не удалось отправить платёж. Попробуйте снова.',
  pmChoosePlan: 'Выберите план', pmPendingTitle: 'Платёж на проверке',
  pmPendingDesc: 'Ваш платёж отправлен и ожидает подтверждения администратора. После подтверждения premium активируется автоматически.',
  setSubtitle: 'Настройки аккаунта и приложения', setPreferences: 'Предпочтения', setAppearance: 'Внешний вид', setSecurity: 'Безопасность',
  setDarkOn: 'Тёмный режим включён', setPremiumTheme: 'Премиум тема', setReminders: 'Напоминания об уроках',
  setRemindersDesc: 'Напоминания об уроках и заданиях', setAiUpdates: 'Обновления AI-ассистента',
  setAiUpdatesDesc: 'Новости о новых возможностях AI', setChangePassword: 'Изменить пароль',
  setActiveSession: 'Активная сессия', setSessionDesc: 'Вы вошли на этом устройстве', setEdit: 'Редактировать',
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
  heroSubtitle: 'YordamchiAI analyzes the student’s knowledge level, identifies weak topics, and gives explanations tailored to them.',
  heroBadge: 'The new generation of AI-powered learning',
  heroCtaPrimary: 'Start for free',
  heroCtaSecondary: 'Watch demo',
  heroCtaDemo: 'Learn more',
  heroNoCreditCard: 'No credit card required · Free for 30 days',
  heroRoleStudent: 'I\'m a student',
  heroRoleTeacher: 'I\'m a teacher',
  heroRoleSchool: 'I represent a school',
  heroTitleStudent: 'No more exam panic.|Your AI tutor is ready 24/7.',
  heroTitleTeacher: 'Stop spending 2 hours on prep.|With AI — 20 minutes. Every time.',
  heroTitleSchool: 'Every class. Every result.|On one screen.',
  heroSubtitleStudent: 'Weak topics are shown precisely before every exam. Answers to your questions are based on your exact curriculum. Feel calm on exam day — AI prepares you for exactly what matters.',
  heroSubtitleTeacher: 'Create tests and lesson materials with AI in minutes. Track every student\'s progress in real time. Attendance, reports and notifications — all automated.',
  heroSubtitleSchool: 'All teachers and students managed in one platform. AI identifies struggling students early — you act before they fall behind. Administrative work is automated.',
  heroDiff: 'Unlike ChatGPT — YordamchiAI knows your exact curriculum',
  heroUrgency: 'For early users: all features are free',
  heroSocialInline: '1,200+ students using it · ★ 4.9/5',
  heroTrustNoInstall: 'No installation required',
  heroCtaStudentAction: 'Get My AI Tutor',
  heroCtaTeacherAction: 'Build My AI Classroom',
  heroCtaSchoolAction: 'Modernize My School',
  heroAlreadyUser: 'Already have an account?',
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
  welcomeGreeting: 'Welcome,',
  welcomePreparing: 'Your AI assistant is getting ready',
  roleSelectSubtitle: 'How do you want to use YordamchiAI?',
  roleContinue: 'Continue',
  haveAccountQ: 'Already have an account?',
  roleStudentTitle: 'Student',
  roleStudentDesc: 'Personalized learning with an AI assistant',
  roleStudentP1: 'AI Assistant',
  roleStudentP2: 'Courses and lessons',
  roleStudentP3: 'Tests and results',
  roleStudentP4: 'Progress analysis',
  roleTeacherTitle: 'Teacher',
  roleTeacherDesc: 'Manage and grade your students',
  roleTeacherP1: 'Students and groups',
  roleTeacherP2: 'Lessons and assignments',
  roleTeacherP3: 'Attendance control',
  roleTeacherP4: 'Statistics and analysis',
  roleSchoolTitle: 'Institution',
  roleSchoolDesc: 'Full control of the entire LMS',
  roleSchoolP1: 'User management',
  roleSchoolP2: 'Teachers and students',
  roleSchoolP3: 'Courses and reports',
  roleSchoolP4: 'Full LMS control',
  audienceHeading: 'Who is it for',
  detailsBtn: 'Learn more',
  audStudentTitle: 'For students',
  audStudentP1: 'AI assistant 24/7',
  audStudentP2: 'Tests and exams',
  audStudentP3: 'Topic-based explanations',
  audStudentP4: 'Progress tracking',
  audTeacherTitle: 'For teachers',
  audTeacherP1: 'Upload lesson materials',
  audTeacherP2: 'Grade students',
  audTeacherP3: 'Attendance and activity control',
  audTeacherP4: 'Statistics and analytics',
  audSchoolTitle: 'For schools and institutes',
  audSchoolP1: 'LMS platform',
  audSchoolP2: 'Manage all processes',
  audSchoolP3: 'Reports and analytics',
  audSchoolP4: 'Secure and reliable system',
  statActiveStudents: 'Active students',
  statInstitutions: 'Institutions',
  statUserRating: 'User rating',
  secFeaturesTitle: 'Features', secFeaturesSub: 'All the tools for learning and teaching with YordamchiAI',
  featChatT: 'AI chat', featChatD: 'Smart 24/7 answers to any question with step-by-step explanations.',
  featVisionT: 'Solve by photo', featVisionD: 'Send a photo of a problem — AI Vision analyzes and solves it.',
  featTestsT: 'Interactive tests', featTestsD: 'Test your knowledge — results are graded automatically and securely.',
  featAttendT: 'Attendance control', featAttendD: 'Track attendance and activity in real time.',
  featHwT: 'Homework', featHwD: 'Send, accept, grade and comment on assignments.',
  featMatT: 'Learning materials', featMatD: 'PDFs, videos and documents — all lesson materials in one place.',
  secPricingTitle: 'Pricing', secPricingSub: 'Choose the plan that fits you — change anytime', popularBadge: 'Popular',
  priceFree: 'Free', priceNegotiable: 'Custom', pricePeriodMonth: 'UZS / month',
  planStarterName: 'Starter', planStarterDesc: 'To try it out', planStarterF1: 'Daily AI chat (limited)', planStarterF2: 'Basic tests', planStarterF3: '1 subject', planStarterF4: 'Progress tracking', ctaStartFree: 'Start for free',
  planProName: 'Pro', planProDesc: 'For active learners', planProF1: 'Unlimited AI chat', planProF2: 'All tests and exams', planProF3: 'AI Vision — solve by photo', planProF4: 'Progress statistics', planProF5: 'Priority support', ctaBuyPro: 'Buy Pro',
  planSchoolName: 'School', planSchoolDesc: 'Schools and institutes', planSchoolF1: 'All Pro features', planSchoolF2: 'Unlimited students', planSchoolF3: 'Admin panel and management', planSchoolF4: 'Reports and analytics', planSchoolF5: 'Custom integration', ctaContact: 'Contact us',
  secAboutTitle: 'About us', secAboutSub: 'YordamchiAI — a personal AI teacher for every student', aboutParagraph: 'YordamchiAI analyzes the student’s knowledge level, identifies weak points, and gives explanations tailored to them. Our goal is to make quality education open, clear and engaging for everyone.',
  aboutVal1T: 'Advanced AI', aboutVal1D: 'Modern Gemini-based AI — adapts to every student.', aboutVal2T: 'In Uzbek', aboutVal2D: 'Fully in Uzbek, aligned with the local curriculum.', aboutVal3T: 'Safe and reliable', aboutVal3D: 'Your data is protected and privacy is guaranteed.',
  secFaqTitle: 'Frequently asked questions', secFaqSub: 'Answers to your questions are here',
  faqQ1: 'What is YordamchiAI?', faqA1: 'It is an AI-powered education platform. It analyzes a student’s knowledge, identifies weak topics and gives personalized explanations.',
  faqQ2: 'Is the platform free?', faqA2: 'The Starter plan is free. For advanced features (unlimited AI chat, AI Vision, all tests) there is a Pro plan.',
  faqQ3: 'How does AI Vision work?', faqA3: 'You send a photo of a problem — the AI reads it, solves it step by step and explains.',
  faqQ4: 'Which subjects are available?', faqA4: 'Math, physics, native language, English and other school subjects. The list is constantly expanding.',
  faqQ5: 'Is my data safe?', faqA5: 'Yes. All data is stored encrypted and never shared with third parties.',
  faqQ6: 'How is it useful for teachers?', faqA6: 'Teachers upload materials, create tests, and track attendance and student progress.',
  navHome: 'Home', navCourses: 'Courses', navAI: 'AI', navStats: 'Statistics', navProfile: 'Profile',
  notifTitle: 'Notifications', notifMarkAll: 'Mark all read', notifEmpty: 'No notifications', notifLoading: 'Loading…',
  notifNow: 'now', notifMinAgo: 'min ago', notifHourAgo: 'h ago', notifDayAgo: 'd ago',
  achTitle: 'My Achievements 🏆', achSubtitle: 'Track your progress every day', achNextLevel: 'To next level:', achLeft: 'left',
  achMyCoins: 'My coins', achRecentRewards: 'Recent rewards', achBadges: 'Badges', achAIRec: 'AI recommendation',
  achRating: 'Rating', achClassRank: 'Class rank', achSchoolRank: 'School rank',
  achCompletedLessons: 'Completed lessons', achAssignments: 'Assignments', achAvgAIScore: 'Average AI score', achStudyHours: 'Study hours', achAttendance: 'Attendance',
  achWeeklyActivity: 'Weekly activity', achHourShort: 'h',
  achPresent: 'Present', achAbsent: 'Absent', achLate: 'Late', achLateShort: 'Late',
  achAttendanceTitle: 'Attendance 📅', achDays: 'days', achTimes: 'times',
  achAIAnalysis: 'AI analysis', achRiskLow: 'Low risk', achRiskMed: 'Medium risk', achRiskHigh: 'High risk',
  achCertificates: 'Certificates', achCertEmpty: 'No certificates yet — reach your goals', achDownload: 'Download',
  lessTitle: 'My Lessons 📚', lessSubtitle: 'Grow your knowledge every day',
  lessAll: 'All', lessActive: 'Active', lessCompleted: 'Completed', lessLocked: 'Locked',
  lessSearchPh: 'Search course...', lessTeacher: 'Teacher:', lessCourse: 'Course', lessDone: 'Completed', lessLessonsDone: 'lessons done', lessContinue: 'Continue',
  lessMyCourses: 'My courses', lessCoursesCount: 'courses',
  lessToday: "Today's lessons", lessLastViewed: 'Last viewed lesson', lessContinueBtn: 'Continue',
  lessStDone: 'Done', lessStProgress: 'In progress',
  lessAnalytics: 'Learning analytics', lessStreak: 'Streak days',
  lessNoHw: 'No assignments yet', lessDeadline: 'Deadline:', lessNoDeadline: 'No deadline',
  lessHwGraded: 'Graded', lessHwSubmitted: 'Submitted', lessHwOverdue: 'Overdue', lessHwDueToday: 'Due today', lessHwNotDone: 'Not done',
  asgTitle: 'Assignments 📝', asgSubtitle: 'Grow your knowledge with AI',
  asgAICapabilities: 'Your AI capabilities', asgAICheck: 'AI check', asgAIChat: 'AI chat', asgLimitOver: 'Limit reached — Premium →', asgClose: 'Close',
  pmTitle: 'Your free AI limit is used up 🚀', pmDesc: 'With Premium — unlimited AI checks, more chat, image and PDF analysis.', pmF1: 'AI check: 50 times a day', pmF2: 'AI chat: 300 questions a day', pmF3: 'Extended image and PDF analysis', pmCta: 'Go Premium', pmPayMethods: 'Payment methods (coming soon)', pmCard: 'Card',
  arAIScore: 'AI score', arMistakes: 'Mistakes', arWeakTopics: 'Weak topics',
  anAvgScore: 'Average score', anImprovement: 'AI improvement', anWeekly: 'Weekly',
  qrError: 'Error', qrLockedTitle: 'QR Attendance — Premium 🚀', qrLockedDesc: 'With Premium — automatic attendance: scan the QR code and check in instantly.', qrTitle: 'QR Attendance', qrSubtitle: 'Enter the QR code shown by your teacher',
  qrDone: 'Attendance marked ✅', qrRewarded: '+XP and coins added to your account', qrPlaceholder: 'QR code (e.g. A1B2C3)', qrChecking: 'Checking…', qrMark: 'Mark attendance', qrCameraSoon: '📷 Camera scanner coming in the next update',
  qrScanBtn: 'Scan with camera', qrScanning: 'Scanning…', qrOrCode: 'or enter code', qrCamDenied: 'Camera access denied. Enter the code manually.',
  tfViewsSuffix: 'views', tfLessonViews: 'Lesson views', tfRefresh: 'Refresh',
  tfTotalStudents: 'Total students', tfViewed: 'Viewed', tfCompleted: 'Completed',
  tfMin: 'min', tfDoneWatch: 'completed', tfWatched: 'watched', tfNotOpened: 'not opened', tfNoStudents: 'No students in the group',
  tfGroup: 'Group', tfStartSession: 'Start session', tfEnterCode: 'Or enter this code:', tfExpires: 'Expires:', tfCloseSession: 'Close session', tfCameraSoon: '📷 QR camera scanner in the next update', tfShowQr: 'Students scan the QR code:',
  tfQrLockTitle: 'QR attendance — Premium', tfQrLockDesc: 'With Premium — automatic attendance via QR.', tfVideoLockTitle: 'Video lesson — Premium', tfVideoLockDesc: 'Uploading video lessons is available on Premium/Education.', tfVideoOpen: 'Video upload unlocked ✅', tfVideoOpenDesc: 'Attach a video to the lesson — students watch it and view stats are collected.',
  tfAIStudentAnalysis: 'AI student analysis', tfWeakStudents: 'Underperforming students', tfAILockTitle: 'AI analysis — Premium', tfAILockDesc: 'With Premium, AI identifies students’ weak spots.',
  nbHome: 'Home', nbFeatures: 'Features', nbPricing: 'Pricing', nbAbout: 'About us', nbFaq: 'FAQ',
  nbSelectLang: 'Select language', nbCloseMenu: 'Close menu', nbOpenMenu: 'Open menu', nbMainMenu: 'Main menu',
  nf404Title: 'Page not found', nf404Desc: "The page you're looking for doesn't exist or has been moved.", nfGoHome: 'Go home', ebTitle: 'Something went wrong', ebRetry: 'Try again',
  admFaolPremium: 'Active Premium', admFree: 'Free', admPremiumMgmt: 'Premium management', admPlan: 'Plan', admStart: 'Start', admEnd: 'End', admSave: 'Save', admSaved: 'Saved',
  admPermissions: 'Admin permissions', admSuperAdmin: 'Super Admin', admNoOtherAdmins: 'No other admins', admSuper: 'Super', admActive: 'Active', admDisabled: 'Disabled', admDisable: 'Disable', admActivate: 'Activate',
  saSysHealth: 'System health', saLastBackup: 'Last backup:', saSupabaseAuto: 'Supabase automatic',
  saPayCenter: 'Payment center', saSum: 'UZS', saTotalRevenue: 'Total revenue', saMonthlyRevenue: 'Monthly revenue', saExpired: 'Expired', saUserIdManual: 'User ID (manual premium)', saUserUuidPh: 'user uuid…', saPayHistory: 'Payment history',
  saAnnCenter: 'Announcement center', saAnnTitlePh: 'Title (e.g. New lesson 🚀)', saAnnBodyPh: 'Text (optional)', saSend: 'Send', saSent: 'Sent', saAnnNote: 'The announcement is delivered via the existing notification system.',
  saPromoCodes: 'Promo codes', saCodePh: 'CODE', saDiscountPct: 'Discount %', saFreeDays: 'Free days', saDays: 'days', saLimitPh: 'Limit', saCreate: 'Create', saNoPromo: 'No promo codes',
  saActivityLog: 'Activity log', saSearchAction: 'Search by action…', saLogEmpty: 'Log is empty', saOnlySuper: 'This section is for Super Admin only', saSuperMgmt: 'Super Admin management',
  saPlatform: 'Platform control', saOrgsTitle: 'Organizations', saStatOrgs: 'Organizations', saStatUsers: 'Users', saStatPaid: 'Paid', saStatRevenue: 'Total revenue',
  saMembers: 'members', saStudentsShort: 'students', saTeachersShort: 'teachers', saSuspend: 'Suspend', saActivate: 'Activate',
  saSuspended: 'Suspended', saActiveOrg: 'Active', saApplyPlan: 'Set plan', saPlanMonths: 'mo', saNoOrgs: 'No organizations', saOrgSuspendedNote: 'Users of a suspended organization cannot sign in.',
  saCreateOrg: 'New organization', saOrgNamePh: 'Organization name', saDelete: 'Delete', saDeleteOrgConfirm: 'Delete this organization entirely?', saOrgNotEmptyErr: 'Cannot delete an organization that has members.',
  saUsersTitle: 'Users', saUserSearchPh: 'Search by name or email…', saNoUsers: 'No users found', saCreate2: 'Create',
  fpPdf: 'PDF', fpImage: 'Image', fpVideo: 'Video', fpAudio: 'Audio', fpDocument: 'Document', fpText: 'Text', fpFile: 'File', fpFilePrefix: 'File:',
  fpZoomOut: 'Zoom out', fpZoomIn: 'Zoom in', fpRotate: 'Rotate', fpFsExit: 'Exit fullscreen', fpFsEnter: 'Fullscreen', fpClose: 'Close',
  fpCantPreview: 'Cannot preview', fpCantPreviewDl: 'Cannot preview — download it', fpCantPreviewType: 'This file type cannot be previewed',
  fpRequired: 'Required', fpOptional: 'Optional', fpMakeOptional: 'Make optional', fpMakeRequired: 'Make required',
  fpFileInfo: 'File information', fpInfo: 'Info', fpCancel: 'Cancel',
  fpName: 'Name', fpExtension: 'Extension', fpSize: 'Size', fpUploaded: 'Uploaded', fpUploader: 'Uploaded by',
  fpViewed: 'Viewed', fpDownloaded: 'Downloaded', fpLastView: 'Last viewed', fpLastDownload: 'Last downloaded',
  fpActions: 'Actions', fpCopied: 'Copied', fpLink: 'Link', fpRename: 'Rename', fpReplace: 'Replace',
  fpComingSoon: 'Coming soon', fpAskAI: '🤖 Ask AI about this file',
  sdGreetMorning: 'Good morning', sdGreetDay: 'Good afternoon', sdGreetEvening: 'Good evening', sdGreetNight: 'Good night',
  sdSun: 'Sunday', sdMon: 'Monday', sdTue: 'Tuesday', sdWed: 'Wednesday', sdThu: 'Thursday', sdFri: 'Friday', sdSat: 'Saturday',
  sdToday: 'Today', sdWave: 'wave hand',
  sdTodayLessons: "Today's lessons", sdNoTodayLessons: 'No lessons scheduled today', sdNoTodayHint: "Don't forget to rest 🌿",
  sdUpcomingLessons: 'Upcoming lessons', sdNoUpcoming: 'No upcoming lessons yet', sdNoUpcomingHint: 'A new schedule will be added soon',
  sdNoAttendance: 'No attendance data', sdNoAttendanceHint: 'It will appear once lessons begin',
  sdPresent: 'Present', sdLate: 'Late', sdExcused: 'Excused', sdAbsent: 'Absent',
  sdUpcomingBucket: 'Upcoming', sdGraded: 'Graded',
  sdAiPlaceholder: 'Type your question or upload an image / PDF…', sdAiAsk: 'Type a question to AI', sdCamera: 'Camera', sdGallery: 'Gallery', sdVoice: 'Voice',
  sdAlgebra: 'Algebra', sdPhysics: 'Physics', sdChemistry: 'Chemistry', sdEnglish: 'English', sdHistory: 'History', sdEssay: 'Essay', sdLessonPlan: 'Lesson plan',
  sdAsgNo: 'No assignments', sdLoadFailed: 'Failed to load', sdAsgHint: 'New homework will appear here',
  sdStatSolved: 'Solved questions', sdStatAccuracy: 'Accuracy', sdStatAIAvail: 'AI available', sdStatLangs: 'Supported languages',
  sdRecBefore: 'revise the', sdRecAfter: 'topic today', sdStartAI: 'Start AI Assistant', sdMyLessons: 'My lessons',
  sdOnlineReady: 'ready', sdStatsShort: 'Progress', sdRankShort: 'Ranking',
  sdErrTitle: 'Failed to load data', sdErrDesc: 'Check your internet connection and try again.',
  tdTabStudents: 'My students', tdTabCourses: 'My groups', tdTabReports: 'Reports', tdTabAchievements: 'Achievements',
  tdGold: 'Gold', tdSilver: 'Silver', tdBronze: 'Bronze', tdSpecial: 'Special', tdBelowBronze: '< Bronze', tdAchievement: 'Achievement',
  tdTeacher: 'Teacher', tdRealData: 'Real data',
  tdStudents: 'Students', tdGroups: 'Groups', tdLessons: 'Lessons', tdTestResults: 'Test results',
  tdSearchStudent: 'Student name or group...', tdNoStudents: 'No students in groups', tdStudentNotFound: 'Student not found', tdColStudent: 'Student', tdColGroup: 'Group', tdColStatus: 'Status', tdInactive: 'Inactive', tdCompleted: 'Completed',
  tdAttSummary: 'Attendance summary by group', tdParticipations: 'participations', tdPresentPct: 'present', tdGoToAttendance: 'Go to attendance marking page',
  tdTopStudents: 'Top students (test results)', tdNoTestResults: 'No test results — publish tests and a report will appear once students submit',
  tdAchWord: 'achiev.', tdAchieved: 'Achieved', tdScoreDistribution: 'Score distribution', tdTotalScore: 'Total score',
  tdGoldMsg: '🥇 You reached the gold level!', tdSilverMsg: '🥈 Silver level!', tdBronzeMsg: '🥉 Bronze level!', tdNoCertYet: "You haven't reached certificate level yet",
  tdScoreTest: 'Test score', tdScoreConsistency: 'Consistency', tdScoreActivity: 'Activity',
  tdForBronze: 'For bronze:', tdForSilver: 'For silver:', tdForGold: 'For gold:', tdScoreNeeded: 'points needed',
  tdAchievedTitle: 'Achievements earned', tdCount: 'pcs', tdBall: 'pts', tdNoAchYet: 'No achievements yet', tdAchEmptyDesc: 'Your achievements will appear here after the monthly calculation is done.',
  tdBronzeGoal: 'Score 60+ points', tdSilverGoal: 'Score 75+ points', tdGoldGoal: 'Score 90+ points', tdRecentActivity: 'Recent activity', tdDashboardTitle: 'Teacher Dashboard',
  tdFullStudents: 'Full students page', tdGroupWord: 'groups', tdNoGroups: 'No groups assigned', tdStudentWord: 'students', tdLessonWord: 'lessons', tdView: 'View', tdMoreAchievements: 'more',
  adWelcome: 'Welcome 👋', adTitle: 'Administrator Panel', adInSystem: 'In the system', adUsersWord: 'users', adRealtime: 'Real time',
  adTabUsers: 'Users', adTabTeachers: 'Teachers', adTabActivity: 'Activity', adCourses: 'Courses',
  adStudent: 'Student', adAdmin: 'Admin', adTeachers: 'Teachers', adTests: 'Tests', adAttRecords: 'Attendance records',
  adMonthlySignups: 'Monthly signups (last 12 months)', adTotal: 'Total:', adAllSystemsOk: 'All systems operational — Supabase connection active',
  adSearchUser: 'Name or email...', adAll: 'All', adUser: 'User', adRole: 'Role', adJoined: 'Joined',
  adTeachersCount: 'teachers', adGroupC: 'Group', adNoTeachers: 'No teachers', adAllTeachers: 'All teachers',
  adRecentStudents: 'recent students', adCoursesCount: 'courses (groups)', adNoCourses: 'No courses', adAllCourses: 'All courses',
  adNoActivity: 'No activity yet', adTest: 'Test', adUserWord: 'User', adUserNotFound: 'User not found',
  lpAIHelp: 'AI Help', lpComingSoon: 'Coming soon', lpAllLessons: 'All lessons', lpNoResults: 'No search results found', lpLessonText: 'Lesson text',
  lpSummarize: 'Summarize lesson', lpExplainEasier: 'Explain simpler', lpMakeQuiz: 'Create quiz', lpTranslate: 'Translate', lpAskAIQ: 'Ask AI', lpContextNote: 'helps in this lesson context',
  tsBackToList: 'Back to tests list', tsAnswered: 'answered', tsQuestions: 'Questions', tsQuestionPalette: 'Question palette', tsUnanswered: 'question(s) unanswered', tsSubmit: 'Submit test',
  tsResult: 'RESULT', tsPassed: 'Passed successfully', tsRetry: 'Try again', tsCorrect: 'correct', tsQuestionWord: 'questions', tsQuestionAnalysis: 'Question analysis', tsCorrectMark: '✓ Correct',
  tsMotiv90: "Excellent! You've mastered this topic perfectly! 🏆", tsMotiv80: 'Great result! Almost perfect! ⭐', tsMotiv60: 'Congratulations! You passed successfully! 🎉', tsMotivLow: "Good try! A bit more practice and you'll succeed 📚",
  tsTitle: 'Tests', tsSubtitle: 'Available online tests', tsNoTests: 'No tests available', tsNoTestsHint: 'When a teacher publishes a test, it will appear here', tsMinutes: 'minutes', tsStart: 'Start',
  asgpDueToday: 'Due today', asgpFilterAria: 'Filter by status', asgpSubject: 'Subject:', asgpAllSubjects: 'All subjects',
  asgpLoadFail: 'Failed to load assignments', asgpNoMatch: 'No assignments match this filter', asgpMaxScore: 'Max', asgpMaterials: 'Materials',
  asgpGrade: 'Grade:', asgpFeedback: 'Feedback:', asgpMyWork: 'My work', asgpPickFile: 'Choose assignment file', asgpSubmitBtn: 'Submit', asgpDeadlinePassed: 'Deadline passed',
  asgpAIHelp: 'Get AI help', asgpAIPlaceholder: 'Write your answer as text — AI will check it, grade and give tips…', asgpAICheckBtn: 'AI check', asgpRecheck: 'Check again', asgpNoMaterials: 'No attached materials',
  mpTitle: 'My Results', mpSubtitle: 'Learning process statistics', mpLoadErr: 'Error loading data', mpTestAvg: 'Test average', mpPassedTests: 'Tests passed',
  mpAttDetail: 'Attendance details', mpByGroup: 'By group', mpPassed: 'Passed', mpFailed: 'Failed', mpNoResults: 'No results yet', mpNoResultsHint: 'Attend lessons and take tests — everything will appear here',
  mJan: 'January', mFeb: 'February', mMar: 'March', mApr: 'April', mMay: 'May', mJun: 'June',
  mJul: 'July', mAug: 'August', mSep: 'September', mOct: 'October', mNov: 'November', mDec: 'December',
  stAttSubtitle: 'Your lesson attendance history', stAttOverall: 'Overall attendance', stAttEmptyHint: 'When the teacher marks attendance, it will appear here',
  aiNewChat: 'New chat', aiSearchPh: 'Search...', aiNoConvs: 'No chats yet', aiSearchNotFound: 'not found',
  aiPinned: '📌 Pinned', aiYesterday: 'Yesterday', aiOlder: 'Earlier', aiChatWord: 'Chat', aiHistory: 'Chat history', aiOpen: 'Open',
  aiCopy: 'Copy', aiLike: 'Good', aiDislike: 'Bad', aiRegenerate: 'Regenerate', aiContinue: 'Continue', aiThinking: 'AI is thinking', aiWaiting: 'Waiting for reply',
  aiRename: 'Rename', aiRenameEdit: 'Edit title', aiPin: 'Pin', aiUnpin: 'Unpin',
  aiMsgsLoadErr: 'Error loading messages', aiNewChatErr: 'Error creating chat', aiContinueErr: 'Error continuing', aiRegenErr: 'Error regenerating', aiDeleteErr: 'Error deleting',
  aiContextPanel: 'Context panel', aiExport: 'Export', aiDropFile: 'Drop the file here', aiRemoveFile: 'Remove file', aiCancel: 'Cancel',
  aiVoiceUnsupported: 'Not supported', aiVoiceWrite: 'Voice input', aiVoiceStop: 'Stop',
  aiQaMath: 'Math', aiQaMathD: 'Equations, formulas', aiQaCode: 'Coding', aiQaCodeD: 'Code, debugging', aiQaTranslate: 'Translate', aiQaTranslateD: 'Multilingual',
  aiQaPdf: 'PDF analysis', aiQaPdfD: 'Document analysis', aiQaEssay: 'Essay', aiQaEssayD: 'Writing, editing', aiQaTest: 'Create test', aiQaTestD: 'Question generation',
  pfTitle: 'Profile', pfSubtitle: 'Personal information and account settings', pfUpdated: 'Profile updated successfully', pfPwChanged: 'Password changed successfully', pfPwMismatch: 'Passwords do not match', pfError: 'An error occurred',
  pfAdministrator: 'Administrator', pfAvatarUsing: 'Uploaded photo in use', pfAvatarInitials: 'Showing initials', pfUploadPhoto: 'Upload photo', pfAvatarDeleteQ: 'Delete avatar?', pfYesDelete: 'Yes, delete',
  pfPersonalInfo: 'Personal information', pfFullName: 'Full name *', pfFullNamePh: 'First Last', pfEmailNoChange: 'Email (cannot be changed)', pfPhone: 'Phone number', pfBioPh: 'Briefly about yourself...', pfSaveChanges: 'Save changes',
  pfAccountInfo: 'Account info', pfBlocked: 'Blocked', pfRegistered: 'Registered', pfLanguage: 'Language', pfAbout: 'About',
  pfSecurity: 'Security', pfChangePw: 'Change password', pfNewPw: 'New password', pfPwMin: 'At least 8 characters', pfConfirmPw: 'Confirm password', pfPwRepeat: 'Re-enter password',
  pfAppearance: 'Appearance', pfThemeNote: 'Theme is switched via the 🌙/☀️ button in the navbar.',
  ccTitle: 'My Courses', ccJoinedGroups: 'group(s) you are enrolled in', ccEmpty: "You haven't joined any course yet", ccEmptyHint: 'When an administrator adds you to a group, it will appear here', ccTotalLessons: 'Total lessons', ccActiveCourses: 'Active courses', ccLesson: 'Lessons',
  tcSubtitle: 'Manage group lessons', tcNewLesson: 'New lesson', tcNoGroup: 'No group assigned to you', tcNoGroupHint: 'An administrator must assign a group',
  tcEditLesson: 'Edit lesson', tcAddLesson: 'Add new lesson', tcLessonName: 'Lesson name', tcLessonNamePh: 'E.g.: Lesson 1: Introduction', tcDate: 'Date', tcSubject: 'Subject', tcNoSubject: '— No subject selected —',
  tcLessonContent: 'Lesson text / Notes', tcContentPh: 'Lesson content, assignments, notes...', tcVideoUrl: 'Video link (YouTube or Vimeo)', tcVideoOk: 'Video link recognized', tcVideoBad: 'Only YouTube and Vimeo links are supported',
  tcMaterials: 'Lesson materials', tcDropAria: 'Drag files or choose', tcDropActive: 'Drop files here', tcDropIdle: 'Drag files here or click', tcDropHint: 'PDF, Word, Excel, PowerPoint, images (JPG/PNG), ZIP • Max 20 MB • multiple files',
  tcUploadAfterSave: 'uploads after saving', tcRemove: 'Remove', tcNoMaterialYet: 'No materials added yet', tcPublish: 'Publish lesson (students can see it)', tcAdd: 'Add',
  tcLessonsEmpty: 'No lessons', tcLessonsEmptyHint: 'No lessons added for this group yet', tcAddFirst: 'Add the first lesson',
  tcPublished: 'Published', tcDraft: 'Draft', tcHasText: 'Has text', tcDeleteShort: 'Delete', tcPublishState: 'Publish status', tcEditT: 'Edit',
  tcAttachments: 'File attachments', tcUploading: 'Uploading...', tcAddFile: 'Add file', tcNoFilesYet: 'No files added yet', tcFileTypesHint: 'PDF, images, Word, Excel, PowerPoint, TXT • Max 20 MB',
  tcNameRequired: 'Lesson name is required', tcSaveErr: 'Save error', tcStatusErr: 'Status change error', tcUploadErr: 'Upload error', tcReplaceErr: 'Replace error', tcFileDeleteErr: 'File delete error', tcDownloadErr: 'Download error',
  taSubtitle: 'Mark group attendance', taSaved: 'Attendance saved successfully', taNoActiveGroup: 'No active group found', taNoActiveGroupAssigned: 'No active group assigned to you', taNoName: 'No name provided', taNotePh: 'Note (optional)...', taSaveBtn: 'Save attendance',
  tgTotalGroups: 'Total groups', tgTotalStudents: 'Total students',
  aaTitle: 'Achievements management', aaSubtitle: 'Monthly calculation cycle and certificates', aaCycleTitle: 'Monthly calculation cycle', aaCycleDesc: 'Scores are calculated for the selected month and achievements are awarded automatically', aaYear: 'Year', aaMonth: 'Month',
  aaCalculating: 'Calculating...', aaCalculate: 'Calculate', aaForPeriod: 'for', aaCycleDone: 'Calculation completed successfully', aaSnapshots: 'Snapshots computed', aaStudTeach: 'students + teachers',
  aaAwarded: 'Achievements awarded', aaNewOrUpdated: 'new or updated', aaAwardedSuffix: '— awarded achievements', aaNoAwards: 'No achievements awarded this month — not enough points or no data yet', aaTypeWord: 'achievement type',
  aaTotalTypes: 'Total achievement types', aaTotalAwarded: 'Total achievements awarded', aaErrorLabel: 'Error:', aaNotFound: 'No achievements found', aaMigrationHint: 'First run migrations (008–010) in Supabase SQL Editor', aaTimesGiven: 'times awarded',
  aatSubtitle: 'Attendance of all students', aatFrom: 'From', aatFilter: 'Filter', aatSearchPh: 'Student or group...', aatNotFound: 'No attendance records found', aatNote: 'Note', aatLimitPrefix: 'Showing only 100 records (of ', aatLimitSuffix: ')',
  sbNameRequired: 'Subject name cannot be empty', sbTitle: 'Subjects', sbCount: 'subjects', sbNewSubject: 'New subject', sbEditSubject: 'Edit subject', sbAddSubject: 'Add subject',
  sbNameLabel: 'Subject name', sbNamePh: 'E.g.: Mathematics', sbDescription: 'Description', sbDescPh: 'Briefly about the subject...', sbColor: 'Color', sbIcon: 'Icon',
  sbNamePreview: 'Subject name', sbDescPreview: 'Description...', sbEmpty: 'No subjects', sbEmptyHint: 'No subjects added yet', sbAddFirst: 'Add the first subject', sbNoDesc: 'No description',
  thNameRequired: 'First and last name required', thEmailInvalid: 'Enter a valid email address', thNewTeacher: 'New teacher', thTotal: 'Total', thEditTeacher: 'Edit teacher', thAddTeacher: 'Add teacher',
  thFullName: 'First and last name', thNamePh: 'John Doe', thEmailEditHint: 'Use Supabase Dashboard to edit email', thTempPassword: 'Temporary password', thPhone: 'Phone', thBioLabel: 'Bio / Brief info', thBioPh: 'Briefly about the teacher...',
  thTeachSubjects: 'Taught subjects', thNoSubjectsA: 'No subjects added. First go to the', thNoSubjectsB: 'module.', thEmptyHint: 'No teachers added yet', thAddFirst: 'Add the first teacher', thSearchNotFoundSuffix: '— teacher not found', thFilterNoResult: 'No results for the selected filter', thDeleteQ: 'Delete?', thGroupWord: 'groups',
  stuNewStudent: 'New student', stuEditStudent: 'Edit student', stuAddStudent: 'Add student', stuCount: 'students', stuNamePh: 'John Doe', stuExtraInfo: 'Additional info', stuBioPh: 'Briefly about the student...',
  stuAddToGroup: 'Add to group', stuNoGroupsA: 'No active groups. First create a group in the', stuNoGroupsB: 'module.', stuEmpty: 'No students', stuEmptyHint: 'No students added yet', stuAddFirst: 'Add the first student', stuSearchNotFoundSuffix: '— student not found', stuNoGroupAssigned: 'Not added to a group',
  acSearchPh: 'Course, teacher or subject...', acFilterNotFound: 'No courses found for the filter', acEmptyHint: 'Create a group in the Groups module — it will appear here as a course', acTestWord: 'test', acFilledSuffix: 'filled',
  agNameRequired: 'Group name cannot be empty', agNewGroup: 'New group', agEditGroup: 'Edit group', agAddGroup: 'Add group', agGroupName: 'Group name', agNamePh: 'E.g.: G-101', agCapacity: 'Capacity (number of students)',
  agStartDate: 'Start date', agEndDate: 'End date', agDescPh: 'Additional info about the group...', agSearchPh: 'Group, subject or teacher...', agEmpty: 'No groups', agEmptyHint: 'No groups added yet', agAddFirst: 'Add the first group', agSearchNotFoundSuffix: '— group not found', agSeats: 'seats',
  alSubtitle: 'Lessons of all groups', alTotalLessons: 'Total lessons', alPublished: 'Published', alSearchPh: 'Lesson name or teacher...', alEmpty: 'No lessons', alEmptyHint: 'When teachers add lessons, they will appear here', alNoContent: 'No content added',
  atSubtitle: 'All tests and results', atSearchPh: 'Test name or group...', atEmpty: 'No tests', atEmptyHint: 'When teachers create tests, they will appear here', atResults: 'results', atFilterNotFound: 'No tests found for the filter',
  arpSubtitle: 'Platform statistics and reports', arpGroupAtt: 'Attendance by group', arpAvg: 'Avg:', arpEmpty: 'No data for the report', arpEmptyHint: 'A report will appear after attendance and test results are added',
  asTitle: 'Settings', asSubtitle: 'System configuration', asSaved: 'Settings saved successfully', asGeneral: 'General settings', asSystemInfo: 'System information', asPlatform: 'Platform', asVersion: 'Version',
  asSecurity: 'Security', asNewPw: 'New password', asConfirmPw: 'Confirm password', asPwChange: 'Change password', asPwChanged: 'Password changed successfully', asPwShort: 'Password must be at least 8 characters', asPwMismatch: 'Passwords do not match', asPwErr: 'Failed to change password',
  asOrgName: 'Organization name', asOrgDesc: 'Organization description', asOrgDescPh: 'Online education platform', asSupportEmail: 'Support email address', asMaxGroup: 'Max students per group', asOrgNameReq: 'Organization name is required',
  anTitle: 'Analytics', anSubtitle: 'Platform performance metrics', anAdmins: 'Admins', anMonthlyStudents: 'Monthly students (last 6 months)', anMonthlyTeachers: 'Monthly teachers (last 6 months)', anNoData: 'No data', anCount: 'pcs',
  anAttStates: 'Attendance states', anNoTestResults: 'No test results', anPassRate: 'Pass rate', anPassed: 'Passed (≥60%)', anFailed: 'Failed (<60%)', anTotalSubmitted: 'submitted',
  ppTitle: 'Simple, transparent pricing', ppSubtitle: 'Choose the plan that fits your needs.', ppGetStarted: 'Get started',
  taMyAch: 'My achievements', taMyAchSub: 'You can download a certificate for each achievement', taAchEmptyHint: 'Achievements are awarded automatically when the admin runs the monthly cycle', taBall: 'Score:', taAboutTitle: 'About teacher achievements', taAboutDesc: 'Best Teacher, Top Mentor and Excellence award — given automatically by the admin each month. Scores are calculated from attendance quality, student test results and teaching activity.',
  cdTitle: 'Course detail', cdComingSoon: 'Course content and lessons coming soon.',
  tstSearchPh: 'Name, email or phone...', tstAllGroups: 'All groups', tstNotFound: 'No students found for this search',
  ttNameRequired: 'Test name is required', ttMinQuestion: 'At least 1 question is required', ttFillAllQ: 'All questions must be filled in', ttFillAllOpts: 'All options must be filled in', ttPublishStatusErr: 'Publish status change error',
  ttResults: 'Results', ttNoSubmissions: 'No one has submitted yet', ttScore: 'Score', ttPercent: 'Percent',
  ttEditTest: 'Edit test', ttNewTest: 'New test', ttTestInfo: 'Test details', ttTestName: 'Test name', ttTestNamePh: 'E.g.: Algebra — Chapter 1 test', ttDesc: 'Description', ttDescPh: 'Briefly about the test...', ttNoGroupSel: '— No group selected —', ttDuration: 'Time (minutes)', ttPublish: 'Publish test (students can see it)',
  ttQuestions: 'Questions', ttAddQuestion: 'Add question', ttNoQuestions: 'No questions. Click "Add question"', ttQuestionPh: 'Question text...', ttVariant: 'Option', ttCreateTest: 'Create test',
  ttCountWord: 'test(s)', ttEmpty: 'No tests', ttEmptyHint: 'Create your first test', ttPublished: 'Published', ttUnpublish: 'Back to draft', ttPublishAction: 'Publish',
  tapConfirmDelete: 'Delete this assignment?', tapSubtitle: 'Create and grade homework', tapNew: 'New assignment', tapEmpty: "You haven't created any assignments yet", tapSubmittedCount: 'submitted', tapViewWorks: 'View submissions', tapEdit: 'Edit assignment',
  tapTitleField: 'Title *', tapTitlePh: 'E.g.: problems on topic 5', tapDescPh: 'Assignment details…', tapNotSelected: 'Not selected', tapMaxScore: 'Max score', tapDeadline: 'Deadline',
  tapGroupsField: 'Groups *', tapNoGroups: 'You have no groups', tapAttachedFiles: 'Attached files', tapAttachAfterSave: 'You can attach files after saving the assignment.', tapAttachFile: 'Attach file',
  auRoleChangeErr: 'Role change error', auAdmins: 'Admins', auJami: 'Total', auAllStatuses: 'All statuses', auEmpty: 'No users', auNotFound: 'No users match the filter', auToggleHint: 'Click to toggle status', auJoined: 'Joined',
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
  aiAssistant: 'YordamchiAI',
  // AI Teacher Panel
  atpTitle: 'AI Teacher', atpPanelAria: 'AI teacher panel', atpStreakTitle: 'Daily streak', atpInsightsTitle: 'AI insights',
  atpNewBadge: 'New', atpMasteryTitle: 'Mastery level', atpWeakTitle: 'Weak topics', atpPathTitle: 'Learning path',
  atpGoalTitle: "Today's goal", atpAchTitle: 'Achievements', atpMissionTitle: 'Weekly mission', atpNextTitle: 'In Sprint 2.3',
  atpWeeklyActivity: 'Weekly activity',
  atpLvlBeginner: 'Beginner', atpLvlLearner: 'Learner', atpLvlKnower: 'Knowledgeable', atpLvlMentor: 'Mentor', atpLvlExpert: 'Expert',
  atpLevel: 'Level', atpNextLevel: 'next level',
  atpDayMon: 'Mo', atpDayTue: 'Tu', atpDayWed: 'We', atpDayThu: 'Th', atpDayFri: 'Fr', atpDaySat: 'Sa', atpDaySun: 'Su',
  atpKun: 'days', atpStreakActive: 'Streak active!', atpTodayActive: 'Active today',
  atpMasteryOverall: 'Overall',
  atpPathCurrent: 'Current topic', atpPathTopic3: 'Third-degree equations', atpPathTopic4: 'Functions and graphs', atpDone: 'Completed', atpInProgress: 'In progress',
  atpWeakDiscriminant: 'Discriminant calculation', atpWeakNegRoots: 'Negative roots', atpWeakFuncVals: 'Function values', atpWeakPractice: 'Tap to practice',
  atpGoalStudy: 'Study', atpGoalHourSuffix: '— 1 hour of practice', atpGoalReview: 'Review together with AI',
  atpAch1Name: 'First question', atpAch1Desc: 'First chat with AI', atpAch2Name: 'Weekly warrior', atpAch2Desc: '7 days active in a row',
  atpAch3Name: 'Test master', atpAch3Desc: 'Average test score 75%+', atpAch4Name: 'Attendance hero', atpAch4Desc: '90%+ attendance',
  atpAch5Name: 'Knowledgeable', atpAch5Desc: 'Earn 500+ XP', atpAch6Name: 'Perfectionist', atpAch6Desc: '90%+ in all tests',
  atpAch7Name: 'Sharp shooter', atpAch7Desc: 'Complete 5 tests', atpAch8Name: 'Fast learner', atpAch8Desc: '3+ lessons in the first week',
  atpAchLockedSuffix: 'badges locked',
  atpMissionReward: '100 XP + 🏆 Badge', atpMissionTask1: 'Complete 3 lessons', atpMissionTask2: 'Take 2 tests', atpMissionTask3: 'Chat with AI',
  atpMissionTask4: 'Test score 80%+', atpMissionTask5: 'Earn 50+ XP', atpMissionDoneSuffix: 'tasks done',
  atpNextDesc: 'Homework, teacher comments and planning with real data',
  atpInsLoading: 'AI teacher is loading your data…',
  atpInsTestLow: 'Your test average is {pct}% — focus on discriminant calculation.',
  atpInsTestHigh: 'Your test results are great ({pct}%)! You are ready for the next level.',
  atpInsTestNone: "You haven't taken any tests yet. Try your first test!",
  atpInsAttLow: 'Your attendance is {pct}% — each lesson raises your result by 3%.',
  atpInsAttHigh: 'Your attendance is {pct}% — this is the strongest key to success!',
  atpInsAttMid: 'Your attendance is {pct}% — a little more effort and a new record!',
  atpInsSubject: 'You are steadily growing in {subject}.',
  atpInsXpHigh: 'Your confidence rose 12% this week. Keep it up!',
  atpInsXpMid: '20 minutes of AI practice daily means 40% faster learning.',
  atpInsXpLow: 'After the first chat, AI will build a study plan. Get started!',
  atpPromptPath: 'Help me with the topic "{topic}"', atpPromptWeak: 'Explain the topic "{topic}" in more detail and give examples',
  atpPromptSubject: 'Ask me a question about {subject}', atpPromptToday: "Explain today's lesson",
  atpPromptExam: 'Make an exam preparation plan', atpPromptWeakImprove: 'How can I improve my weak topics?',
  // Avatar uploader / cropper
  avChangePhoto: 'Change', avUploading: 'Uploading…', avUploadPhoto: 'Upload photo', avDelete: 'Delete',
  avFormatHint: 'JPG, PNG or WebP · Max size 5 MB',
  avErrFormat: 'Format not supported. Upload JPG, PNG or WebP.', avErrSize: 'File must be smaller than 5 MB.',
  avCropTitle: 'Crop photo', avCropDesc: 'The part inside the circle becomes your profile photo', avReset: 'Reset',
  avCancel: 'Cancel', avConfirm: 'Confirm', avCropHint: 'Drag and zoom the photo • The part inside the circle is saved',
  emailPlaceholder: 'your@email.com', videoUrlPlaceholder: 'https://www.youtube.com/watch?v=... or https://vimeo.com/...',
  saPendingPayments: 'Pending payments', saViewReceipt: 'View receipt', saApprove: 'Approve', saReject: 'Reject',
  pmPayTitle: 'Premium payment', pmPayHint: 'Transfer to the card below and upload a photo of the receipt. Premium activates once an admin approves it.',
  pmCardTransfer: 'Card number', pmPerMonth: 'per month',
  pmUploadReceipt: 'Upload payment receipt', pmSelectReceipt: 'Choose receipt image (JPG/PNG/PDF)', pmSubmitPayment: 'Submit payment', pmBack: 'Back',
  pmPaySuccess: 'Payment submitted!', pmPaySuccessDesc: 'Receipt received. Premium activates automatically once an admin approves it.',
  pmReceiptRequired: 'Please upload a receipt image', pmPayError: 'Could not submit payment. Please try again.',
  pmChoosePlan: 'Choose a plan', pmPendingTitle: 'Payment under review',
  pmPendingDesc: 'Your payment has been submitted and is awaiting admin approval. Premium activates automatically once approved.',
  setSubtitle: 'Account & app settings', setPreferences: 'Preferences', setAppearance: 'Appearance', setSecurity: 'Security',
  setDarkOn: 'Dark mode enabled', setPremiumTheme: 'Premium theme', setReminders: 'Learning reminders',
  setRemindersDesc: 'Reminders about lessons and assignments', setAiUpdates: 'AI assistant updates',
  setAiUpdatesDesc: 'News about new AI features', setChangePassword: 'Change password',
  setActiveSession: 'Active session', setSessionDesc: 'You are signed in on this device', setEdit: 'Edit',
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
