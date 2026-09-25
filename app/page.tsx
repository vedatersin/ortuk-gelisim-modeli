"use client";

import { useEffect, useMemo, useState } from "react";

type PageId =
  | "home"
  | "school"
  | "data-entry"
  | "registration"
  | "courses"
  | "growth"
  | "rubric"
  | "reports";

type Student = {
  id: string;
  schoolNo: string;
  className: string;
  scores: [number | null, number | null, number | null, number | null];
  percentile?: number;
};

type SchoolInfo = {
  institutionCode: string;
  institutionName: string;
  province: string;
  district: string;
  term: string;
  teacher: string;
};

type CourseInfo = {
  course: string;
  grade: string;
  applicationPeriod: string;
  taskCode: string;
  taskType: string;
  scale: string;
  learningOutcome: string;
};

type RegistrationDraft = {
  id: string;
  schoolNo: string;
  className: string;
};

type AppState = {
  page: PageId;
  selectedStudentId: string;
  selectedTerm: string;
  selectedClass: string;
  selectedCourse: string;
  students: Student[];
  rubricByStudent: Record<string, [number, number, number, number]>;
  levelByStudent: Record<string, number>;
  school: SchoolInfo;
  course: CourseInfo;
  evidenceNotes: Record<string, string>;
};

const STORAGE_KEY = "tymm-ortuk-gelisim-modeli-v2";
const scoreKeys = ["T0", "T1", "T2", "T3"] as const;
const courseOptions = ["Matematik", "Fen Bilimleri", "Türkçe", "Yabancı Dil", "Sosyal Bilgiler"];
const assessmentNames = [
  "Hazırbulunuşluk Değerlendirmesi",
  "Performans Görevi",
  "Süreç İzleme Değerlendirmesi",
  "Yıl Sonu Gelişim Değerlendirmesi",
];
const chartAssessmentNames = ["Hazırbulunuşluk", "Performans Görevi", "Süreç İzleme", "Yıl Sonu"];
const cohortMeans = [24.9, 35.1, 46.4, 57.0];

const pageDefinitions: Array<{ id: PageId; label: string; code: string }> = [
  { id: "home", label: "Giriş Ekranı", code: "ANA" },
  { id: "school", label: "Okul Bilgileri", code: "OKL" },
  { id: "data-entry", label: "Süreç ve Kanıt Girişi", code: "SKG" },
  { id: "registration", label: "Kayıt İşlemleri", code: "KYT" },
  { id: "courses", label: "Ders İşlemleri", code: "DRS" },
  { id: "growth", label: "Örtük Gelişim", code: "OGM" },
  { id: "rubric", label: "Rubrik Girişi", code: "RBR" },
  { id: "reports", label: "Görsel Raporlama", code: "RPR" },
];

const defaultStudents: Student[] = [
  { id: "OGR-3", schoolNo: "5003", className: "5-A", scores: [15.9, 25.0, 37.6, 42.9], percentile: 32 },
  { id: "OGR-4", schoolNo: "5004", className: "5-A", scores: [9.2, 25.6, 40.4, 58.7], percentile: 95 },
  { id: "OGR-7", schoolNo: "5007", className: "5-A", scores: [27.0, 22.3, 38.8, 44.9], percentile: 11 },
  { id: "OGR-8", schoolNo: "5008", className: "5-A", scores: [16.3, 27.6, 52.6, 56.0], percentile: 73 },
  { id: "OGR-9", schoolNo: "5009", className: "5-A", scores: [19.7, 33.4, 41.2, 54.2], percentile: 54 },
  { id: "OGR-10", schoolNo: "5010", className: "5-A", scores: [27.4, 35.5, 41.1, 53.9], percentile: 30 },
  { id: "OGR-12", schoolNo: "5012", className: "5-A", scores: [14.8, 22.9, 44.6, 63.4], percentile: 94 },
  { id: "OGR-14", schoolNo: "5014", className: "5-A", scores: [48.1, 49.8, 63.8, 84.6], percentile: 62 },
  { id: "OGR-198", schoolNo: "5198", className: "5-A", scores: [21.4, 51.4, 61.3, 92.7], percentile: 100 },
  { id: "OGR-1", schoolNo: "5001", className: "5-A", scores: [25.4, null, 57.6, null] },
  { id: "OGR-2", schoolNo: "5002", className: "5-A", scores: [23.3, null, 53.2, 61.6] },
  { id: "OGR-5", schoolNo: "5005", className: "5-A", scores: [null, 25.6, 49.2, 55.3] },
  { id: "OGR-6", schoolNo: "5006", className: "5-A", scores: [26.1, 33.9, 52.2, null] },
  { id: "OGR-11", schoolNo: "5011", className: "5-A", scores: [31.2, null, null, 67.6] },
  { id: "OGR-13", schoolNo: "5013", className: "5-A", scores: [22.0, 30.6, null, null] },
];

const defaultRubric: Record<string, [number, number, number, number]> = Object.fromEntries(
  defaultStudents.map((student, index) => [
    student.id,
    [((index + 1) % 4) + 1, ((index + 2) % 4) + 1, ((index + 3) % 4) + 1, (index % 4) + 1],
  ]),
);

const defaultLevels: Record<string, number> = Object.fromEntries(
  defaultStudents.map((student, index) => [student.id, (index % 4) + 1]),
);

const defaultState: AppState = {
  page: "growth",
  selectedStudentId: "OGR-4",
  selectedTerm: "2026-2027",
  selectedClass: "5-A",
  selectedCourse: "Matematik",
  students: defaultStudents,
  rubricByStudent: defaultRubric,
  levelByStudent: defaultLevels,
  school: {
    institutionCode: "IOK10007",
    institutionName: "Türkiye Yüzyılı Maarif Modeli Pilot Okulu",
    province: "Ankara",
    district: "Merkez",
    term: "2026-2027",
    teacher: "Öğretmen",
  },
  course: {
    course: "Matematik",
    grade: "5-A",
    applicationPeriod: "Performans Görevi",
    taskCode: "5. Sınıf Problem Çözme Görevi - Form A",
    taskType: "Performans Görevi",
    scale: "4'lü Analitik Rubrik (1-4 Düzey)",
    learningOutcome: "M.5.1. Sayılar ve İşlemler / Veri İnceleme",
  },
  evidenceNotes: {
    T0: "Hazırbulunuşluk değerlendirmesi tamamlandı.",
    T1: "Bağlam temelli performans görevi uygulandı.",
    T2: "Süreç içi izleme ve alt öğrenme alanı değerlendirmesi tamamlandı.",
    T3: "Yıl sonu gelişim değerlendirmesi tamamlandı.",
  },
};

const evidence = scoreKeys.map((key, index) => ({
  key,
  title: assessmentNames[index],
  period: ["Güz başlangıcı", "1. dönem", "2. dönem", "Yıl sonu"][index],
  tag: ["Başlangıç düzeyi", "Otantik öğrenme kanıtı", "Süreç içi gelişim", "Gelişim değerlendirmesi"][index],
}));

const rubricRows = [
  "Bilgi ve beceri yetkinliği",
  "Eğilim ve değer gelişimi",
  "Sosyal-duygusal gelişim",
  "Performans göstergesi kanıtı",
];

const modules = [
  ["Modül A", "Yapılandırılmış veri girişi", "Rubrik ve nitel/nicel kanıt ekranları"],
  ["Modül B", "Değerlendirme aracı havuzu", "Önceden hazırlanmış görev, test ve açık uçlu soru seçenekleri"],
  ["Modül C", "Gelişim analiz altyapısı", "Puan değişimi, eksik değerlendirme ve gelişim eğilimi"],
  ["e-Okul SSO", "Entegrasyon katmanı", "Yetkilendirme, sınıf eşleştirme ve nakil koruması"],
  ["Dashboard", "Görsel raporlama", "Öğretmen mikro ekranı ve ÖDM/Bakanlık makro ekranı"],
];

function scoreText(value: number | null) {
  return typeof value === "number" ? value.toFixed(1) : "Girilmedi";
}

function compact(value: number | null) {
  return typeof value === "number" ? Math.round(value).toString() : "-";
}

function linePath(values: Array<number | null>, min: number, max: number) {
  return values
    .map((value, index) => {
      if (typeof value !== "number") return null;
      const x = 46 + index * 156;
      const y = 248 - ((value - min) / (max - min)) * 188;
      return `${x},${y}`;
    })
    .filter(Boolean)
    .join(" ");
}

function getStudentMath(student: Student) {
  const indexed = student.scores
    .map((value, index) => ({ value, index }))
    .filter((entry): entry is { value: number; index: number } => typeof entry.value === "number");
  const first = indexed[0];
  const last = indexed[indexed.length - 1];
  const growth = first && last ? last.value - first.value : 0;
  const slope = first && last && last.index !== first.index ? growth / (last.index - first.index) : 0;
  const trend = slope > 0 ? "Artan" : slope < 0 ? "Azalan" : "Durağan";

  return {
    latest: last?.value ?? null,
    intercept: first?.value ?? null,
    growth,
    slope,
    trend,
    observed: indexed.length,
  };
}

function getActionFeedback(student: Student, course: string) {
  const stats = getStudentMath(student);
  const change = Math.abs(stats.growth).toFixed(1);

  if (stats.trend === "Artan") {
    return {
      authentic: `${course} kapsamındaki performans ve süreç değerlendirmelerinde ${change} puanlık gelişim görülmüştür. Öğrenci, öğrendiklerini görev bağlamında kullanmaya başlamıştır.`,
      teacher: "Bir sonraki uygulamada aynı öğrenme çıktısını daha karmaşık bir bağlamda yeniden gözlemleyin ve çözüm sürecini kısa bir öğrenci açıklamasıyla kanıtlayın.",
      parent: "Evde günlük yaşamdan bir problem seçerek çocuğunuzdan çözüm yolunu açıklamasını isteyin; yalnızca sonucu değil, nasıl düşündüğünü de konuşun.",
    };
  }

  if (stats.trend === "Azalan") {
    return {
      authentic: `${course} değerlendirmelerinde önceki uygulamaya göre ${change} puanlık gerileme görülmüştür. Bulguyu tek bir puanla değil, görev kanıtlarıyla birlikte ele alın.`,
      teacher: "Öğrenme çıktısını daha küçük adımlara ayırın, kısa bir yeniden öğretim uygulayın ve benzer bir görevle yakın izleme yapın.",
      parent: "Kısa ve düzenli çalışma aralıkları oluşturun; çocuğunuzdan yaptığı işlemi veya verdiği yanıtı kendi cümleleriyle açıklamasını isteyin.",
    };
  }

  return {
    authentic: `${course} değerlendirmelerinde mevcut düzey korunmaktadır. Yeni bir öğrenme kanıtı ile öğrencinin bilgiyi farklı bir bağlamda kullanıp kullanamadığı gözlenmelidir.`,
    teacher: "Aynı kazanımı farklı bir görev türüyle yeniden değerlendirin ve öğrencinin kullandığı stratejileri karşılaştırın.",
    parent: "Evde yapılan kısa çalışmalarda doğru cevaptan önce düşünme yolunu anlatmasını destekleyin ve ilerlemeyi küçük örneklerle görünür kılın.",
  };
}

function normalizeScore(value: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value > 100) return Math.round(Math.max(0, Math.min(100, ((value - 165) / 140) * 100)) * 10) / 10;
  return Math.round(Math.max(0, Math.min(100, value)) * 10) / 10;
}

function normalizeLoadedState(value: Partial<AppState>): AppState {
  const students = Array.isArray(value.students) && value.students.length > 0
    ? value.students.map((student) => ({
        ...student,
        scores: student.scores.map(normalizeScore) as Student["scores"],
      }))
    : defaultStudents;
  const loadedCourse = { ...defaultState.course, ...value.course };
  const course = {
    ...loadedCourse,
    course: courseOptions.includes(loadedCourse.course) ? loadedCourse.course : defaultState.course.course,
    applicationPeriod: assessmentNames.includes(loadedCourse.applicationPeriod)
      ? loadedCourse.applicationPeriod
      : defaultState.course.applicationPeriod,
  };

  return {
    ...defaultState,
    ...value,
    school: { ...defaultState.school, ...value.school },
    course,
    evidenceNotes: { ...defaultState.evidenceNotes, ...value.evidenceNotes },
    selectedCourse: courseOptions.includes(value.selectedCourse ?? "") ? value.selectedCourse! : defaultState.selectedCourse,
    students,
    rubricByStudent: { ...defaultRubric, ...value.rubricByStudent },
    levelByStudent: { ...defaultLevels, ...value.levelByStudent },
  };
}

export default function Home() {
  const [state, setState] = useState<AppState>(defaultState);
  const [storageReady, setStorageReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Yerel veri hazırlanıyor");
  const [registrationDraft, setRegistrationDraft] = useState<RegistrationDraft>({
    id: "OGR-YENI",
    schoolNo: "5999",
    className: "5-A",
  });

  useEffect(() => {
    const loadStorage = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        const hash = window.location.hash.replace("#", "") as PageId;
        const loadedState = saved ? normalizeLoadedState(JSON.parse(saved) as Partial<AppState>) : defaultState;

        if (pageDefinitions.some((page) => page.id === hash)) {
          setState({ ...loadedState, page: hash });
        } else {
          setState(loadedState);
        }
      } catch {
        setState(defaultState);
      }
      setStorageReady(true);
      setSaveStatus("Yerel veri hazır");
    }, 0);

    return () => window.clearTimeout(loadStorage);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.location.hash = state.page;
  }, [state, storageReady]);

  const selected = state.students.find((student) => student.id === state.selectedStudentId) ?? state.students[0];
  const selectedRubric = state.rubricByStudent[selected.id] ?? [1, 1, 1, 1];
  const stats = useMemo(() => getStudentMath(selected), [selected]);
  const rubricAverage = selectedRubric.reduce((sum, value) => sum + value, 0) / selectedRubric.length;
  const classStudents = state.students.filter((student) => student.className === state.selectedClass);
  const completedCount = state.students.filter((student) => student.scores.every((score) => typeof score === "number")).length;
  const min = 0;
  const max = 100;
  const studentPath = linePath(selected.scores, min, max);
  const cohortPath = linePath(cohortMeans, min, max);

  function updateState(patch: Partial<AppState>) {
    setSaveStatus("Kaydedildi");
    setState((current) => ({ ...current, ...patch }));
  }

  function setPage(page: PageId) {
    updateState({ page });
  }

  function updateSchool(field: keyof SchoolInfo, value: string) {
    setSaveStatus("Kaydedildi");
    setState((current) => ({ ...current, school: { ...current.school, [field]: value } }));
  }

  function updateCourse(field: keyof CourseInfo, value: string) {
    setSaveStatus("Kaydedildi");
    setState((current) => ({
      ...current,
      selectedCourse: field === "course" ? value : current.selectedCourse,
      course: { ...current.course, [field]: value },
    }));
  }

  function updateStudentScore(studentId: string, scoreIndex: number, value: string) {
    setSaveStatus("Kaydedildi");
    const parsed = value.trim() === "" ? null : Number(value);
    setState((current) => ({
      ...current,
      students: current.students.map((student) => {
        if (student.id !== studentId) return student;
        const scores = [...student.scores] as Student["scores"];
        scores[scoreIndex] = Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed!)) : null;
        return { ...student, scores };
      }),
    }));
  }

  function updateStudentLevel(studentId: string, value: number) {
    setSaveStatus("Kaydedildi");
    setState((current) => ({
      ...current,
      levelByStudent: { ...current.levelByStudent, [studentId]: Math.max(1, Math.min(4, value)) },
    }));
  }

  function updateRubric(index: number, value: number) {
    setSaveStatus("Kaydedildi");
    setState((current) => {
      const currentRubric = current.rubricByStudent[selected.id] ?? [1, 1, 1, 1];
      const next = [...currentRubric] as [number, number, number, number];
      next[index] = value;

      return {
        ...current,
        rubricByStudent: { ...current.rubricByStudent, [selected.id]: next },
      };
    });
  }

  function updateEvidence(term: string, value: string) {
    setSaveStatus("Kaydedildi");
    setState((current) => ({
      ...current,
      evidenceNotes: { ...current.evidenceNotes, [term]: value },
    }));
  }

  function addStudent() {
    const id = registrationDraft.id.trim().toUpperCase();
    if (!id || state.students.some((student) => student.id === id)) {
      setSaveStatus("Öğrenci eklenemedi: ID boş veya kayıtlı");
      return;
    }

    const student: Student = {
      id,
      schoolNo: registrationDraft.schoolNo.trim() || id.replace(/\D/g, "") || "0000",
      className: registrationDraft.className.trim() || state.selectedClass,
      scores: [null, null, null, null],
    };

    setState((current) => ({
      ...current,
      students: [...current.students, student],
      rubricByStudent: { ...current.rubricByStudent, [id]: [1, 1, 1, 1] },
      levelByStudent: { ...current.levelByStudent, [id]: 1 },
      selectedStudentId: id,
      selectedClass: student.className,
      page: "data-entry",
    }));
    setSaveStatus("Kaydedildi");
    setRegistrationDraft({ id: "OGR-YENI", schoolNo: "5999", className: state.selectedClass });
  }

  function resetLocalData() {
    window.localStorage.removeItem(STORAGE_KEY);
    setState(defaultState);
    setSaveStatus("Yerel veri sıfırlandı");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Kurum menüsü">
        <div className="sidebar-title">Kurum İşlemleri</div>
        <label className="period-label" htmlFor="period">Eğitim Öğretim Dönemi</label>
        <select
          id="period"
          className="period-select"
          value={state.selectedTerm}
          onChange={(event) => updateState({ selectedTerm: event.target.value })}
        >
          <option>2026-2027</option>
          <option>2027-2028</option>
        </select>
        <nav>
          {pageDefinitions.map((item) => (
            <button
              className={item.id === state.page ? "menu-item active" : "menu-item"}
              key={item.id}
              onClick={() => setPage(item.id)}
              type="button"
            >
              <span className="menu-dot" />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="brand-mark">TR</div>
          <div>
            <p className="eyebrow">Milli Eğitim Bakanlığı Okul Yönetim Bilgi Sistemi</p>
            <h1>Türkiye Yüzyılı Maarif Modeli - Öğrenci Gelişim İzleme Paneli</h1>
          </div>
          <div className="session-box">
            <span>Bağlantı Sonu</span>
            <strong>09:33</strong>
            <small>{saveStatus}</small>
          </div>
        </header>

        <div className="module-strip">
          <strong>{pageDefinitions.find((page) => page.id === state.page)?.label}</strong>
          <span>{pageDefinitions.find((page) => page.id === state.page)?.code}10007</span>
        </div>

        <FilterPanel
          state={state}
          selected={selected}
          onState={updateState}
        />

        {state.page === "home" && (
          <HomeScreen
            students={state.students}
            completedCount={completedCount}
            rubricAverage={rubricAverage}
            openPage={setPage}
          />
        )}

        {state.page === "school" && (
          <SchoolScreen
            school={state.school}
            onChange={updateSchool}
            resetLocalData={resetLocalData}
          />
        )}

        {state.page === "data-entry" && (
          <DataEntryScreen
            students={classStudents.length ? classStudents : state.students}
            selectedStudentId={selected.id}
            selectedCourse={state.selectedCourse}
            selectedClass={state.selectedClass}
            course={state.course}
            levels={state.levelByStudent}
            onSelect={(id) => updateState({ selectedStudentId: id })}
            onScoreChange={updateStudentScore}
            onLevelChange={updateStudentLevel}
            onCourseChange={updateCourse}
          />
        )}

        {state.page === "registration" && (
          <RegistrationScreen
            draft={registrationDraft}
            setDraft={setRegistrationDraft}
            addStudent={addStudent}
            students={state.students}
          />
        )}

        {state.page === "courses" && (
          <CoursesScreen
            course={state.course}
            onChange={updateCourse}
          />
        )}

        {state.page === "growth" && (
          <GrowthScreen
            selected={selected}
            selectedCourse={state.selectedCourse}
            stats={stats}
            selectedRubric={selectedRubric}
            rubricAverage={rubricAverage}
            studentPath={studentPath}
            cohortPath={cohortPath}
            min={min}
            max={max}
            students={state.students}
            evidenceNotes={state.evidenceNotes}
            onSelect={(id) => updateState({ selectedStudentId: id })}
          />
        )}

        {state.page === "rubric" && (
          <RubricScreen
            selected={selected}
            rubric={selectedRubric}
            rubricAverage={rubricAverage}
            evidenceNotes={state.evidenceNotes}
            onRubricChange={updateRubric}
            onEvidenceChange={updateEvidence}
          />
        )}

        {state.page === "reports" && (
          <ReportsScreen
            students={state.students}
            selected={selected}
            selectedCourse={state.selectedCourse}
            rubricByStudent={state.rubricByStudent}
          />
        )}
      </section>
    </main>
  );
}

function FilterPanel({
  state,
  selected,
  onState,
}: {
  state: AppState;
  selected: Student;
  onState: (patch: Partial<AppState>) => void;
}) {
  const classOptions = Array.from(new Set(state.students.map((student) => student.className)));

  return (
    <section className="filter-panel" aria-label="Filtreler">
      <div className="tool-icons" aria-hidden="true">
        <span>+</span>
        <span>□</span>
        <span>▣</span>
        <span>⌕</span>
        <span>↻</span>
      </div>
      <div className="field-grid">
        <label>
          Ders
          <select value={state.selectedCourse} onChange={(event) => onState({ selectedCourse: event.target.value })}>
            {courseOptions.map((course) => <option key={course}>{course}</option>)}
          </select>
        </label>
        <label>
          Dönem
          <select value={state.selectedTerm} onChange={(event) => onState({ selectedTerm: event.target.value })}>
            <option>2026-2027</option>
            <option>2027-2028</option>
          </select>
        </label>
        <label>
          Sınıf / Şube
          <select value={state.selectedClass} onChange={(event) => onState({ selectedClass: event.target.value })}>
            {classOptions.map((className) => <option key={className}>{className}</option>)}
          </select>
        </label>
        <label>
          Öğrenci
          <select value={selected.id} onChange={(event) => onState({ selectedStudentId: event.target.value })}>
            {state.students.map((student) => <option key={student.id}>{student.id}</option>)}
          </select>
        </label>
      </div>
    </section>
  );
}

function HomeScreen({
  students,
  completedCount,
  rubricAverage,
  openPage,
}: {
  students: Student[];
  completedCount: number;
  rubricAverage: number;
  openPage: (page: PageId) => void;
}) {
  return (
    <>
      <section className="status-grid" aria-label="Sistem özeti">
        <article className="status-card"><span>Öğrenci Kaydı</span><strong>{students.length}</strong><small>Yapay veri setinden aktarılan panel</small></article>
        <article className="status-card"><span>Tam Değerlendirme</span><strong>{completedCount}</strong><small>Dört değerlendirmesi tamamlanan öğrenci</small></article>
        <article className="status-card"><span>Eksik Değerlendirme</span><strong>{students.length - completedCount}</strong><small>Tamamlanması beklenen öğrenci kaydı</small></article>
        <article className="status-card"><span>Rubrik Ortalaması</span><strong>{rubricAverage.toFixed(2)}</strong><small>Seçili öğrenci ölçeği</small></article>
      </section>
      <section className="panel">
        <header className="panel-title"><strong>Modül Kısayolları</strong><span>Sol menü ile aynı ekranlara gider</span></header>
        <div className="quick-grid">
          {pageDefinitions.slice(1).map((page) => (
            <button key={page.id} type="button" onClick={() => openPage(page.id)}>
              <strong>{page.label}</strong>
              <span>{page.code} modülünü aç</span>
            </button>
          ))}
        </div>
      </section>
      <SystemPanel />
    </>
  );
}

function SchoolScreen({
  school,
  onChange,
  resetLocalData,
}: {
  school: SchoolInfo;
  onChange: (field: keyof SchoolInfo, value: string) => void;
  resetLocalData: () => void;
}) {
  return (
    <section className="panel form-panel">
      <header className="panel-title"><strong>Okul Bilgileri</strong><span>localStorage ile saklanır</span></header>
      <div className="form-grid">
        {Object.entries(school).map(([field, value]) => (
          <label key={field}>
            {schoolLabels[field as keyof SchoolInfo]}
            <input value={value} onChange={(event) => onChange(field as keyof SchoolInfo, event.target.value)} />
          </label>
        ))}
      </div>
      <div className="action-row">
        <button type="button" className="primary-action">Kaydedildi</button>
        <button type="button" className="secondary-action" onClick={resetLocalData}>Yerel veriyi sıfırla</button>
      </div>
    </section>
  );
}

const schoolLabels: Record<keyof SchoolInfo, string> = {
  institutionCode: "Kurum Kodu",
  institutionName: "Kurum Adı",
  province: "İl",
  district: "İlçe",
  term: "Dönem",
  teacher: "Kullanıcı",
};

function DataEntryScreen({
  students,
  selectedStudentId,
  selectedCourse,
  selectedClass,
  course,
  levels,
  onSelect,
  onScoreChange,
  onLevelChange,
  onCourseChange,
}: {
  students: Student[];
  selectedStudentId: string;
  selectedCourse: string;
  selectedClass: string;
  course: CourseInfo;
  levels: Record<string, number>;
  onSelect: (id: string) => void;
  onScoreChange: (studentId: string, scoreIndex: number, value: string) => void;
  onLevelChange: (studentId: string, value: number) => void;
  onCourseChange: (field: keyof CourseInfo, value: string) => void;
}) {
  return (
    <section className="process-flow" aria-label="Süreç ve kanıt girişi">
      <article className="panel process-step">
        <header className="panel-title"><strong>1. Bağlam Seçimi</strong><span>Ders ve uygulama dönemi</span></header>
        <div className="step-fields">
          <label>Ders<input value={selectedCourse} readOnly /></label>
          <label>Sınıf / Şube<input value={selectedClass} readOnly /></label>
          <label>
            Uygulama Dönemi
            <select value={course.applicationPeriod} onChange={(event) => onCourseChange("applicationPeriod", event.target.value)}>
              {assessmentNames.map((name) => <option key={name}>{name}</option>)}
            </select>
          </label>
        </div>
      </article>

      <article className="panel process-step">
        <header className="panel-title"><strong>2. Ölçme Görevi ve Rubrik Seçimi</strong><span>Hazır değerlendirme havuzu</span></header>
        <div className="step-fields">
          <label>
            Değerlendirme Aracı
            <select value={course.taskCode} onChange={(event) => onCourseChange("taskCode", event.target.value)}>
              <option>5. Sınıf Problem Çözme Görevi - Form A</option>
              <option>MAT-5.1.2 Bağlam Temelli Görev</option>
              <option>Süreç İzleme Testi - Form A</option>
              <option>Açık Uçlu Soru Havuzu - Form A</option>
            </select>
          </label>
          <label>
            Öğrenme Kanıtı / Görev Türü
            <select value={course.taskType} onChange={(event) => onCourseChange("taskType", event.target.value)}>
              <option>Performans Görevi</option>
              <option>Süreç İzleme Testi</option>
              <option>Açık Uçlu Soru Havuzu</option>
            </select>
          </label>
          <label>
            Değerlendirme Biçimi / Skala
            <select value={course.scale} onChange={(event) => onCourseChange("scale", event.target.value)}>
              <option>4&apos;lü Analitik Rubrik (1-4 Düzey)</option>
              <option>Ham Puan (0-100)</option>
            </select>
          </label>
          <label className="wide-field">Öğrenme Çıktısı / Alt Alan<input value={course.learningOutcome} onChange={(event) => onCourseChange("learningOutcome", event.target.value)} /></label>
        </div>
      </article>

      <article className="panel process-step">
        <header className="panel-title"><strong>3. Sınıf Not ve Düzey Girişi</strong><span>0-100 puan ve 1-4 gelişim düzeyi</span></header>
        <div className="level-legend" aria-label="Düzey açıklamaları">
          <span><strong>1</strong> Başlangıç</span><span><strong>2</strong> Gelişmekte</span><span><strong>3</strong> Yetkin</span><span><strong>4</strong> İleri</span>
        </div>
        <div className="table-wrap">
          <table className="class-table data-entry-table">
            <thead>
              <tr>
                <th>Okul No</th>
                <th>Öğrenci ID</th>
                {assessmentNames.map((name) => <th key={name}>{name}<small>0-100</small></th>)}
                <th>Düzey</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const stats = getStudentMath(student);
                return (
                  <tr key={student.id} className={student.id === selectedStudentId ? "selected-row" : ""}>
                    <td>{student.schoolNo}</td>
                    <td><button type="button" onClick={() => onSelect(student.id)}>{student.id}</button></td>
                    {student.scores.map((score, index) => (
                      <td key={scoreKeys[index]}>
                        <input
                          aria-label={`${student.id} ${assessmentNames[index]} puanı`}
                          className="score-input"
                          inputMode="decimal"
                          min="0"
                          max="100"
                          type="number"
                          value={score ?? ""}
                          onChange={(event) => onScoreChange(student.id, index, event.target.value)}
                        />
                      </td>
                    ))}
                    <td>
                      <select className="level-select" aria-label={`${student.id} gelişim düzeyi`} value={levels[student.id] ?? 1} onChange={(event) => onLevelChange(student.id, Number(event.target.value))}>
                        <option value="1">1 - Başlangıç</option>
                        <option value="2">2 - Gelişmekte</option>
                        <option value="3">3 - Yetkin</option>
                        <option value="4">4 - İleri</option>
                      </select>
                    </td>
                    <td>{stats.observed}/4 tamamlandı</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function RegistrationScreen({
  draft,
  setDraft,
  addStudent,
  students,
}: {
  draft: RegistrationDraft;
  setDraft: (draft: RegistrationDraft) => void;
  addStudent: () => void;
  students: Student[];
}) {
  return (
    <section className="entry-layout">
      <article className="panel form-panel">
        <header className="panel-title"><strong>Kayıt İşlemleri</strong><span>Yeni öğrenci panel satırı</span></header>
        <div className="form-grid single">
          <label>Öğrenci ID<input value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value })} /></label>
          <label>Okul No<input value={draft.schoolNo} onChange={(event) => setDraft({ ...draft, schoolNo: event.target.value })} /></label>
          <label>Sınıf / Şube<input value={draft.className} onChange={(event) => setDraft({ ...draft, className: event.target.value })} /></label>
        </div>
        <div className="action-row">
          <button type="button" className="primary-action" onClick={addStudent}>Öğrenciyi ekle</button>
        </div>
      </article>
      <article className="panel">
        <header className="panel-title"><strong>Kayıtlı Öğrenciler</strong><span>{students.length} kayıt</span></header>
        <div className="compact-list">
          {students.slice(-8).map((student) => (
            <div key={student.id}><strong>{student.id}</strong><span>{student.schoolNo}</span><small>{student.className}</small></div>
          ))}
        </div>
      </article>
    </section>
  );
}

function CoursesScreen({
  course,
  onChange,
}: {
  course: CourseInfo;
  onChange: (field: keyof CourseInfo, value: string) => void;
}) {
  return (
    <>
      <section className="panel form-panel">
        <header className="panel-title"><strong>Ders ve Değerlendirme Aracı İşlemleri</strong><span>Öğretmen görünümü</span></header>
        <div className="form-grid course-form">
          <label>
            Ders
            <select value={course.course} onChange={(event) => onChange("course", event.target.value)}>
              {courseOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>Sınıf / Şube<input value={course.grade} onChange={(event) => onChange("grade", event.target.value)} /></label>
          <label>
            Uygulama Dönemi
            <select value={course.applicationPeriod} onChange={(event) => onChange("applicationPeriod", event.target.value)}>
              {assessmentNames.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Değerlendirme Aracı
            <select value={course.taskCode} onChange={(event) => onChange("taskCode", event.target.value)}>
              <option>5. Sınıf Problem Çözme Görevi - Form A</option>
              <option>MAT-5.1.2 Bağlam Temelli Görev</option>
              <option>Süreç İzleme Testi - Form A</option>
              <option>Açık Uçlu Soru Havuzu - Form A</option>
            </select>
          </label>
          <label>
            Öğrenme Kanıtı / Görev Türü
            <select value={course.taskType} onChange={(event) => onChange("taskType", event.target.value)}>
              <option>Performans Görevi</option>
              <option>Süreç İzleme Testi</option>
              <option>Açık Uçlu Soru Havuzu</option>
            </select>
          </label>
          <label>
            Değerlendirme Biçimi / Skala
            <select value={course.scale} onChange={(event) => onChange("scale", event.target.value)}>
              <option>4&apos;lü Analitik Rubrik (1-4 Düzey)</option>
              <option>Ham Puan (0-100)</option>
            </select>
          </label>
          <label className="wide-field">Öğrenme Çıktısı / Alt Alan<input value={course.learningOutcome} onChange={(event) => onChange("learningOutcome", event.target.value)} /></label>
        </div>
      </section>
      <section className="panel system-panel">
        <header className="panel-title"><strong>Değerlendirme Aracı Özeti</strong><span>Seçimler yerel olarak kaydedilir</span></header>
        <table className="item-bank">
          <thead><tr><th>Öğretmen Alanı</th><th>Seçili Değer</th><th>Kullanım</th></tr></thead>
          <tbody>
            <tr><td>Öğrenme Kanıtı / Görev Türü</td><td>{course.taskType}</td><td>Görev havuzundan seçim</td></tr>
            <tr><td>Değerlendirme Biçimi / Skala</td><td>{course.scale}</td><td>Sınıf not ve düzey girişi</td></tr>
            <tr><td>Öğrenme Çıktısı / Alt Alan</td><td>{course.learningOutcome}</td><td>Gelişim raporuyla ilişkilendirme</td></tr>
          </tbody>
        </table>
      </section>
    </>
  );
}

function GrowthScreen({
  selected,
  selectedCourse,
  stats,
  selectedRubric,
  rubricAverage,
  studentPath,
  cohortPath,
  min,
  max,
  students,
  evidenceNotes,
  onSelect,
}: {
  selected: Student;
  selectedCourse: string;
  stats: ReturnType<typeof getStudentMath>;
  selectedRubric: [number, number, number, number];
  rubricAverage: number;
  studentPath: string;
  cohortPath: string;
  min: number;
  max: number;
  students: Student[];
  evidenceNotes: Record<string, string>;
  onSelect: (id: string) => void;
}) {
  const feedback = getActionFeedback(selected, selectedCourse);

  return (
    <>
      <section className="status-grid" aria-label="Öğrenci bütüncül durum kartları">
        <article className="status-card"><span>Güncel Gelişim Puanı</span><strong>{scoreText(stats.latest)}</strong><small>100 üzerinden - akran ortalaması: {cohortMeans[3].toFixed(1)}</small></article>
        <article className="status-card"><span>Puan Değişimi</span><strong>{stats.growth >= 0 ? "+" : ""}{stats.growth.toFixed(1)}</strong><small>{stats.trend} gelişim eğilimi</small></article>
        <article className="status-card"><span>Başlangıç Puanı</span><strong>{scoreText(stats.intercept)}</strong><small>İlk tamamlanan değerlendirme</small></article>
        <article className="status-card"><span>Öğrenme Kanıtı</span><strong>{stats.observed}/4</strong><small>Rubrik ortalaması: {rubricAverage.toFixed(2)}</small></article>
      </section>

      <section className="analysis-layout">
        <article className="panel growth-panel">
          <header className="panel-title"><strong>Boylamsal Gelişim Grafiği</strong><span>Puan / 100</span></header>
          <svg viewBox="0 0 548 286" className="growth-chart" role="img" aria-label="Öğrenci ve akran büyüme eğrisi">
            <line x1="46" y1="248" x2="514" y2="248" className="axis" />
            <line x1="46" y1="36" x2="46" y2="248" className="axis" />
            <polyline points={cohortPath} className="cohort-line" />
            <polyline points={studentPath} className="student-line" />
            {cohortMeans.map((value, index) => <circle key={`c-${index}`} cx={46 + index * 156} cy={248 - ((value - min) / (max - min)) * 188} r="4" className="cohort-dot" />)}
            {selected.scores.map((value, index) => typeof value === "number" ? (
              <g key={`${selected.id}-${index}`}>
                <circle cx={46 + index * 156} cy={248 - ((value - min) / (max - min)) * 188} r="5" className="student-dot" />
                <text x={46 + index * 156} y={232 - ((value - min) / (max - min)) * 188}>{Math.round(value)}</text>
              </g>
            ) : null)}
            {chartAssessmentNames.map((term, index) => <text key={term} x={46 + index * 156} y="272" className="term-label">{term}</text>)}
          </svg>
          <div className="legend"><span><i className="student-swatch" /> Öğrencinin gerçek gelişimi</span><span><i className="cohort-swatch" /> Türkiye/Akran büyüme normu</span></div>
        </article>

        <article className="panel message-panel">
          <header className="panel-title"><strong>Eyleme Dönük Geri Bildirim</strong></header>
          <p>{selected.id} için dört değerlendirme boyunca {stats.trend.toLowerCase()} gelişim eğilimi görülmektedir.</p>
          <dl className="feedback-list">
            <div><dt>Otantik değerlendirme</dt><dd>{feedback.authentic}</dd></div>
            <div><dt>Öğretmen eylemi</dt><dd>{feedback.teacher}</dd></div>
            <div><dt>Veli önerisi</dt><dd>{feedback.parent}</dd></div>
          </dl>
        </article>
      </section>

      <EvidenceTimeline notes={evidenceNotes} />
      <StudentTable students={students} selectedId={selected.id} onSelect={onSelect} />
      <section className="panel system-panel">
        <header className="panel-title"><strong>Seçili Öğrenci Rubrik Özeti</strong><span>{selected.id}</span></header>
        <div className="rubric-summary">
          {rubricRows.map((row, index) => <div key={row}><span>{row}</span><strong>{selectedRubric[index]}</strong></div>)}
        </div>
      </section>
    </>
  );
}

function EvidenceTimeline({ notes }: { notes: Record<string, string> }) {
  return (
    <section className="panel evidence-panel">
      <header className="panel-title"><strong>Etkinlik Zaman Tüneli</strong><span>Öğrenme kanıtları simgeleri</span></header>
      <div className="timeline">
        {evidence.map((item) => (
          <article key={item.key}>
            <strong>{item.title}</strong>
            <span>{item.period}</span>
            <small>{item.tag}</small>
            <em>{notes[item.key]}</em>
          </article>
        ))}
      </div>
    </section>
  );
}

function StudentTable({ students, selectedId, onSelect }: { students: Student[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <section className="panel">
      <header className="panel-title"><strong>Sınıf Listesi - Seçilen Alanlara Göre Ders Gelişim Girişi</strong><span>Yapay veri seti: 500 öğrenci</span></header>
      <div className="table-wrap">
        <table className="class-table">
          <thead><tr><th>Öğrenci ID</th>{chartAssessmentNames.map((name) => <th key={name}>{name}</th>)}<th>Gözlem</th><th>Gelişim Eğilimi</th></tr></thead>
          <tbody>
            {students.map((student) => {
              const stats = getStudentMath(student);
              return (
                <tr key={student.id} className={student.id === selectedId ? "selected-row" : ""}>
                  <td><button type="button" onClick={() => onSelect(student.id)}>{student.id}</button></td>
                  {student.scores.map((score, index) => <td key={index}>{compact(score)}</td>)}
                  <td>{stats.observed}/4</td>
                  <td>{stats.trend}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RubricScreen({
  selected,
  rubric,
  rubricAverage,
  evidenceNotes,
  onRubricChange,
  onEvidenceChange,
}: {
  selected: Student;
  rubric: [number, number, number, number];
  rubricAverage: number;
  evidenceNotes: Record<string, string>;
  onRubricChange: (index: number, value: number) => void;
  onEvidenceChange: (term: string, value: string) => void;
}) {
  return (
    <section className="entry-layout">
      <article className="panel">
        <header className="panel-title"><strong>Sınıf İçi Anlık Gözlem Verisi Girişi</strong><span>{selected.id} - Rubrik 1-4</span></header>
        <div className="rubric-list">
          {rubricRows.map((row, index) => (
            <label key={row} className="rubric-row">
              <span>{row}</span>
              <input type="range" min="1" max="4" value={rubric[index]} onChange={(event) => onRubricChange(index, Number(event.target.value))} />
              <strong>{rubric[index]}</strong>
            </label>
          ))}
        </div>
        <div className="rubric-total">Rubrik ortalaması: <strong>{rubricAverage.toFixed(2)}</strong></div>
      </article>
      <article className="panel form-panel">
        <header className="panel-title"><strong>Öğrenme Kanıtı Notları</strong><span>Değerlendirme bazında kaydedilir</span></header>
        <div className="form-grid single">
          {evidence.map((item) => (
            <label key={item.key}>
              {item.title} kanıt açıklaması
              <textarea value={evidenceNotes[item.key]} onChange={(event) => onEvidenceChange(item.key, event.target.value)} />
            </label>
          ))}
        </div>
      </article>
    </section>
  );
}

function ReportsScreen({
  students,
  selected,
  selectedCourse,
  rubricByStudent,
}: {
  students: Student[];
  selected: Student;
  selectedCourse: string;
  rubricByStudent: Record<string, [number, number, number, number]>;
}) {
  const reportRows = students.map((student) => {
    const stats = getStudentMath(student);
    const rubric = rubricByStudent[student.id] ?? [1, 1, 1, 1];
    const average = rubric.reduce((sum, value) => sum + value, 0) / rubric.length;
    return { student, stats, average };
  });
  const rising = reportRows.filter((row) => row.stats.trend === "Artan").length;
  const selectedFeedback = getActionFeedback(selected, selectedCourse);

  return (
    <>
      <section className="status-grid" aria-label="Rapor özeti">
        <article className="status-card"><span>Artan Yörünge</span><strong>{rising}</strong><small>Öğrenci sayısı</small></article>
        <article className="status-card"><span>Yıl Sonu Akran Ortalaması</span><strong>{cohortMeans[3].toFixed(1)}</strong><small>100 puanlık sistem</small></article>
        <article className="status-card"><span>Seçili Öğrenci</span><strong>{selected.id}</strong><small>{getStudentMath(selected).trend} yörünge</small></article>
        <article className="status-card"><span>Eksik Veri</span><strong>{students.length - students.filter((student) => student.scores.every((score) => typeof score === "number")).length}</strong><small>Dengesiz panel</small></article>
      </section>
      <section className="panel report-feedback">
        <header className="panel-title"><strong>Seçili Öğrenci Gelişim Raporu</strong><span>{selected.id} - {selectedCourse}</span></header>
        <div className="feedback-grid">
          <article><strong>Otantik Değerlendirme</strong><p>{selectedFeedback.authentic}</p></article>
          <article><strong>Öğretmen İçin Sonraki Adım</strong><p>{selectedFeedback.teacher}</p></article>
          <article><strong>Veli Önerisi</strong><p>{selectedFeedback.parent}</p></article>
        </div>
      </section>
      <section className="panel">
        <header className="panel-title"><strong>Öğrenci Puan Değişimleri</strong><span>İlk ve son değerlendirme farkı</span></header>
        <div className="report-bars">
          {reportRows.slice(0, 12).map((row) => (
            <div key={row.student.id}>
              <span>{row.student.id}</span>
              <strong style={{ width: `${Math.max(6, Math.min(100, Math.abs(row.stats.growth)))}%` }} />
              <em>{row.stats.growth >= 0 ? "+" : ""}{row.stats.growth.toFixed(1)}</em>
            </div>
          ))}
        </div>
      </section>
      <section className="panel system-panel">
        <header className="panel-title"><strong>Rapor Tablosu</strong><span>Gelişim + rubrik</span></header>
        <div className="table-wrap">
          <table className="class-table">
            <thead><tr><th>Öğrenci</th><th>Son Puan / 100</th><th>Puan Değişimi</th><th>Gelişim Eğilimi</th><th>Rubrik</th><th>Gözlem</th></tr></thead>
            <tbody>
              {reportRows.map((row) => (
                <tr key={row.student.id}>
                  <td>{row.student.id}</td>
                  <td>{scoreText(row.stats.latest)}</td>
                  <td>{row.stats.growth >= 0 ? "+" : ""}{row.stats.growth.toFixed(1)}</td>
                  <td>{row.stats.trend}</td>
                  <td>{row.average.toFixed(2)}</td>
                  <td>{row.stats.observed}/4</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function SystemPanel() {
  return (
    <section className="panel system-panel">
      <header className="panel-title"><strong>Uygulama Aşamaları ve Sistem Bileşenleri</strong><span>Rapor ve sunum kapsamı</span></header>
      <div className="module-grid">
        {modules.map(([code, title, body]) => <article key={code}><strong>{code}</strong><span>{title}</span><small>{body}</small></article>)}
      </div>
    </section>
  );
}
