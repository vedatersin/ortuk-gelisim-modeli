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
  domain: string;
  grade: string;
  itemDifficulty: string;
  discrimination: string;
  anchorStatus: string;
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
  school: SchoolInfo;
  course: CourseInfo;
  evidenceNotes: Record<string, string>;
};

const STORAGE_KEY = "tymm-ortuk-gelisim-modeli-v2";
const terms = ["T0 Güz", "T1 Kış", "T2 Bahar", "T3 Yıl Sonu"];
const scoreKeys = ["T0", "T1", "T2", "T3"] as const;
const cohortMeans = [199.8, 214.2, 230.0, 244.8];

const pageDefinitions: Array<{ id: PageId; label: string; code: string }> = [
  { id: "home", label: "Giriş Ekranı", code: "ANA" },
  { id: "school", label: "Okul Bilgileri", code: "OKL" },
  { id: "data-entry", label: "Bilgi Giriş İşlemleri", code: "BGI" },
  { id: "registration", label: "Kayıt İşlemleri", code: "KYT" },
  { id: "courses", label: "Ders İşlemleri", code: "DRS" },
  { id: "growth", label: "Örtük Gelişim", code: "OGM" },
  { id: "rubric", label: "Rubrik Girişi", code: "RBR" },
  { id: "reports", label: "Görsel Raporlama", code: "RPR" },
];

const defaultStudents: Student[] = [
  { id: "OGR-3", schoolNo: "5003", className: "5-A", scores: [187.3, 200.0, 217.6, 225.1], percentile: 32 },
  { id: "OGR-4", schoolNo: "5004", className: "5-A", scores: [177.9, 200.8, 221.5, 247.2], percentile: 95 },
  { id: "OGR-7", schoolNo: "5007", className: "5-A", scores: [202.8, 196.2, 219.3, 227.9], percentile: 11 },
  { id: "OGR-8", schoolNo: "5008", className: "5-A", scores: [187.8, 203.6, 238.7, 243.4], percentile: 73 },
  { id: "OGR-9", schoolNo: "5009", className: "5-A", scores: [192.6, 211.7, 222.7, 240.9], percentile: 54 },
  { id: "OGR-10", schoolNo: "5010", className: "5-A", scores: [203.4, 214.7, 222.5, 240.4], percentile: 30 },
  { id: "OGR-12", schoolNo: "5012", className: "5-A", scores: [185.7, 197.1, 227.5, 253.7], percentile: 94 },
  { id: "OGR-14", schoolNo: "5014", className: "5-A", scores: [232.4, 234.7, 254.3, 283.4], percentile: 62 },
  { id: "OGR-198", schoolNo: "5198", className: "5-A", scores: [195.0, 236.9, 250.8, 294.8], percentile: 100 },
  { id: "OGR-1", schoolNo: "5001", className: "5-A", scores: [200.5, null, 245.7, null] },
  { id: "OGR-2", schoolNo: "5002", className: "5-A", scores: [197.6, null, 239.5, 251.3] },
  { id: "OGR-5", schoolNo: "5005", className: "5-A", scores: [null, 200.8, 233.9, 242.4] },
  { id: "OGR-6", schoolNo: "5006", className: "5-A", scores: [201.5, 212.4, 238.1, null] },
  { id: "OGR-11", schoolNo: "5011", className: "5-A", scores: [208.7, null, null, 259.7] },
  { id: "OGR-13", schoolNo: "5013", className: "5-A", scores: [195.8, 207.8, null, null] },
];

const defaultRubric: Record<string, [number, number, number, number]> = Object.fromEntries(
  defaultStudents.map((student, index) => [
    student.id,
    [((index + 1) % 4) + 1, ((index + 2) % 4) + 1, ((index + 3) % 4) + 1, (index % 4) + 1],
  ]),
);

const defaultState: AppState = {
  page: "growth",
  selectedStudentId: "OGR-4",
  selectedTerm: "2026-2027",
  selectedClass: "5-A",
  selectedCourse: "Matematik Okuryazarlığı",
  students: defaultStudents,
  rubricByStudent: defaultRubric,
  school: {
    institutionCode: "IOK10007",
    institutionName: "Türkiye Yüzyılı Maarif Modeli Pilot Okulu",
    province: "Ankara",
    district: "Merkez",
    term: "2026-2027",
    teacher: "Öğretmen",
  },
  course: {
    course: "Matematik Okuryazarlığı",
    domain: "Boylamsal bilişsel gelişim",
    grade: "5-A",
    itemDifficulty: "b parametresi",
    discrimination: "a parametresi",
    anchorStatus: "Dikey ölçekleme için çapa madde",
  },
  evidenceNotes: {
    T0: "Hazırbulunuşluk izleme sınavı yapıldı.",
    T1: "Bağlam temelli performans görevi işlendi.",
    T2: "Alt öğrenme alanı analizi tamamlandı.",
    T3: "Yıl sonu ölçümü ile slope değerlendirildi.",
  },
};

const evidence = [
  ["T0", "Hazırbulunuşluk izleme sınavı", "Başlangıç noktası"],
  ["T1", "Gereksinim modelleme bağlam temelli performans görevi", "Öğrenme kanıtı"],
  ["T2", "Süreç içi izleme ve alt öğrenme alanı analizi", "Boylamsal ölçüm"],
  ["T3", "Yıl sonu ölçümü ve gelişim hızı değerlendirmesi", "Slope kestirimi"],
];

const rubricRows = [
  "Bilgi ve beceri yetkinliği",
  "Eğilim ve değer gelişimi",
  "Sosyal-duygusal gelişim",
  "Performans göstergesi kanıtı",
];

const modules = [
  ["Modül A", "Yapılandırılmış veri girişi", "Rubrik ve nitel/nicel kanıt ekranları"],
  ["Modül B", "Madde havuzu ve IRT altyapısı", "Güçlük, ayırt edicilik ve çapa madde alanları"],
  ["Modül C", "Psikometrik analiz motoru", "Intercept, slope ve FIML hesaplama"],
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

function normalizeLoadedState(value: Partial<AppState>): AppState {
  return {
    ...defaultState,
    ...value,
    school: { ...defaultState.school, ...value.school },
    course: { ...defaultState.course, ...value.course },
    evidenceNotes: { ...defaultState.evidenceNotes, ...value.evidenceNotes },
    students: Array.isArray(value.students) && value.students.length > 0 ? value.students : defaultStudents,
    rubricByStudent: { ...defaultRubric, ...value.rubricByStudent },
  };
}

export default function Home() {
  const [state, setState] = useState<AppState>(() => {
    if (typeof window === "undefined") return defaultState;

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const hash = window.location.hash.replace("#", "") as PageId;
      const loadedState = saved ? normalizeLoadedState(JSON.parse(saved) as Partial<AppState>) : defaultState;

      if (pageDefinitions.some((page) => page.id === hash)) {
        return { ...loadedState, page: hash };
      }

      return loadedState;
    } catch {
      return defaultState;
    }
  });
  const [saveStatus, setSaveStatus] = useState("Yerel veri hazır");
  const [registrationDraft, setRegistrationDraft] = useState<RegistrationDraft>({
    id: "OGR-YENI",
    schoolNo: "5999",
    className: "5-A",
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.location.hash = state.page;
  }, [state]);

  const selected = state.students.find((student) => student.id === state.selectedStudentId) ?? state.students[0];
  const selectedRubric = state.rubricByStudent[selected.id] ?? [1, 1, 1, 1];
  const stats = useMemo(() => getStudentMath(selected), [selected]);
  const rubricAverage = selectedRubric.reduce((sum, value) => sum + value, 0) / selectedRubric.length;
  const classStudents = state.students.filter((student) => student.className === state.selectedClass);
  const completedCount = state.students.filter((student) => student.scores.every((score) => typeof score === "number")).length;
  const min = 165;
  const max = 305;
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
    setState((current) => ({ ...current, course: { ...current.course, [field]: value } }));
  }

  function updateStudentScore(studentId: string, scoreIndex: number, value: string) {
    setSaveStatus("Kaydedildi");
    const parsed = value.trim() === "" ? null : Number(value);
    setState((current) => ({
      ...current,
      students: current.students.map((student) => {
        if (student.id !== studentId) return student;
        const scores = [...student.scores] as Student["scores"];
        scores[scoreIndex] = Number.isFinite(parsed) ? parsed : null;
        return { ...student, scores };
      }),
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
            onSelect={(id) => updateState({ selectedStudentId: id })}
            onScoreChange={updateStudentScore}
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
            <option>Matematik Okuryazarlığı</option>
            <option>Türkçe Okuryazarlığı</option>
            <option>Fen Bilimleri</option>
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
        <article className="status-card"><span>Tam Gözlem</span><strong>{completedCount}</strong><small>T0-T3 eksiksiz ölçüm</small></article>
        <article className="status-card"><span>Dengesiz Panel</span><strong>{students.length - completedCount}</strong><small>FIML için korunur</small></article>
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
  onSelect,
  onScoreChange,
}: {
  students: Student[];
  selectedStudentId: string;
  onSelect: (id: string) => void;
  onScoreChange: (studentId: string, scoreIndex: number, value: string) => void;
}) {
  return (
    <section className="panel">
      <header className="panel-title"><strong>Bilgi Giriş İşlemleri - T0/T1/T2/T3</strong><span>Öğrenci puanları lokalde kalır</span></header>
      <div className="table-wrap">
        <table className="class-table data-entry-table">
          <thead>
            <tr>
              <th>Okul No</th>
              <th>Öğrenci ID</th>
              <th>T0 Güz</th>
              <th>T1 Kış</th>
              <th>T2 Bahar</th>
              <th>T3 Yıl Sonu</th>
              <th>Gözlem</th>
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
                        aria-label={`${student.id} ${scoreKeys[index]}`}
                        className="score-input"
                        inputMode="decimal"
                        value={score ?? ""}
                        onChange={(event) => onScoreChange(student.id, index, event.target.value)}
                      />
                    </td>
                  ))}
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
        <header className="panel-title"><strong>Ders İşlemleri</strong><span>Madde bankası ve IRT alanları</span></header>
        <div className="form-grid">
          {Object.entries(course).map(([field, value]) => (
            <label key={field}>
              {courseLabels[field as keyof CourseInfo]}
              <input value={value} onChange={(event) => onChange(field as keyof CourseInfo, event.target.value)} />
            </label>
          ))}
        </div>
      </section>
      <section className="panel system-panel">
        <header className="panel-title"><strong>Madde Bankası / IRT Alanları</strong><span>Çapa madde düzeni</span></header>
        <table className="item-bank">
          <thead><tr><th>Alan</th><th>Parametre</th><th>Durum</th></tr></thead>
          <tbody>
            <tr><td>Güçlük</td><td>{course.itemDifficulty}</td><td>Madde havuzu</td></tr>
            <tr><td>Ayırt edicilik</td><td>{course.discrimination}</td><td>IRT altyapısı</td></tr>
            <tr><td>Dikey ölçekleme</td><td>Anchor items</td><td>{course.anchorStatus}</td></tr>
          </tbody>
        </table>
      </section>
    </>
  );
}

const courseLabels: Record<keyof CourseInfo, string> = {
  course: "Ders",
  domain: "Alan",
  grade: "Sınıf / Şube",
  itemDifficulty: "Güçlük",
  discrimination: "Ayırt Edicilik",
  anchorStatus: "Çapa Madde",
};

function GrowthScreen({
  selected,
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
  return (
    <>
      <section className="status-grid" aria-label="Öğrenci bütüncül durum kartları">
        <article className="status-card"><span>Bilişsel Yetenek Skoru</span><strong>{scoreText(stats.latest)}</strong><small>Akran ortalaması: {cohortMeans[3].toFixed(1)}</small></article>
        <article className="status-card"><span>Gelişim Hızı (Slope)</span><strong>{stats.slope.toFixed(1)}</strong><small>{stats.trend} yörünge - yüzdeklik: {selected.percentile ?? "FIML"}</small></article>
        <article className="status-card"><span>Başlangıç Noktası</span><strong>{scoreText(stats.intercept)}</strong><small>Intercept için ilk gözlenen ölçüm</small></article>
        <article className="status-card"><span>Öğrenme Kanıtı</span><strong>{stats.observed}/4</strong><small>Rubrik ortalaması: {rubricAverage.toFixed(2)}</small></article>
      </section>

      <section className="analysis-layout">
        <article className="panel growth-panel">
          <header className="panel-title"><strong>Ana Alan: Boylamsal Büyüme Eğrisi Grafiği</strong><span>Yetenek Puanı / RIT</span></header>
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
            {terms.map((term, index) => <text key={term} x={46 + index * 156} y="272" className="term-label">{term}</text>)}
          </svg>
          <div className="legend"><span><i className="student-swatch" /> Öğrencinin gerçek gelişimi</span><span><i className="cohort-swatch" /> Türkiye/Akran büyüme normu</span></div>
        </article>

        <article className="panel message-panel">
          <header className="panel-title"><strong>Pedagojik Mesaj</strong></header>
          <p>{selected.id} için {terms[0]}-{terms[3]} aralığında {stats.trend.toLowerCase()} yörünge görülmektedir. Boylamsal ölçümler, tek puan yerine gelişim hızını izleme amacıyla değerlendirilmiştir.</p>
          <dl>
            <div><dt>Panel veri</dt><dd>Dengesiz panel ölçümleri korunur</dd></div>
            <div><dt>Eksik veri</dt><dd>FIML hesaplama motoruna aktarılır</dd></div>
            <div><dt>Karar desteği</dt><dd>Erken uyarı ve farklılaştırılmış öğretim</dd></div>
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
        {evidence.map(([time, title, tag]) => (
          <article key={time}>
            <strong>{time}</strong>
            <span>{title}</span>
            <small>{tag}</small>
            <em>{notes[time]}</em>
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
          <thead><tr><th>Öğrenci ID</th><th>T0</th><th>T1</th><th>T2</th><th>T3</th><th>Gözlem</th><th>Yörünge</th></tr></thead>
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
        <header className="panel-title"><strong>Öğrenme Kanıtı Notları</strong><span>T0-T3</span></header>
        <div className="form-grid single">
          {scoreKeys.map((key) => (
            <label key={key}>
              {key} kanıt açıklaması
              <textarea value={evidenceNotes[key]} onChange={(event) => onEvidenceChange(key, event.target.value)} />
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
  rubricByStudent,
}: {
  students: Student[];
  selected: Student;
  rubricByStudent: Record<string, [number, number, number, number]>;
}) {
  const reportRows = students.map((student) => {
    const stats = getStudentMath(student);
    const rubric = rubricByStudent[student.id] ?? [1, 1, 1, 1];
    const average = rubric.reduce((sum, value) => sum + value, 0) / rubric.length;
    return { student, stats, average };
  });
  const rising = reportRows.filter((row) => row.stats.trend === "Artan").length;

  return (
    <>
      <section className="status-grid" aria-label="Rapor özeti">
        <article className="status-card"><span>Artan Yörünge</span><strong>{rising}</strong><small>Öğrenci sayısı</small></article>
        <article className="status-card"><span>Akran Normu T3</span><strong>{cohortMeans[3].toFixed(1)}</strong><small>Yapay veri ortalaması</small></article>
        <article className="status-card"><span>Seçili Öğrenci</span><strong>{selected.id}</strong><small>{getStudentMath(selected).trend} yörünge</small></article>
        <article className="status-card"><span>Eksik Veri</span><strong>{students.length - students.filter((student) => student.scores.every((score) => typeof score === "number")).length}</strong><small>Dengesiz panel</small></article>
      </section>
      <section className="panel">
        <header className="panel-title"><strong>Görsel Raporlama - Mikro Öğretmen Ekranı</strong><span>ÖDM/Bakanlık için özetlenebilir</span></header>
        <div className="report-bars">
          {reportRows.slice(0, 12).map((row) => (
            <div key={row.student.id}>
              <span>{row.student.id}</span>
              <strong style={{ width: `${Math.max(6, Math.min(100, row.stats.slope * 3))}%` }} />
              <em>{row.stats.slope.toFixed(1)}</em>
            </div>
          ))}
        </div>
      </section>
      <section className="panel system-panel">
        <header className="panel-title"><strong>Rapor Tablosu</strong><span>Gelişim + rubrik</span></header>
        <div className="table-wrap">
          <table className="class-table">
            <thead><tr><th>Öğrenci</th><th>Son Puan</th><th>Slope</th><th>Yörünge</th><th>Rubrik</th><th>Gözlem</th></tr></thead>
            <tbody>
              {reportRows.map((row) => (
                <tr key={row.student.id}>
                  <td>{row.student.id}</td>
                  <td>{scoreText(row.stats.latest)}</td>
                  <td>{row.stats.slope.toFixed(1)}</td>
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
