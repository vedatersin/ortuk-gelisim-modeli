"use client";

import { useMemo, useState } from "react";

type Student = {
  id: string;
  scores: [number | null, number | null, number | null, number | null];
  percentile?: number;
};

const terms = ["T0 Güz", "T1 Kış", "T2 Bahar", "T3 Yıl Sonu"];
const cohortMeans = [199.8, 214.2, 230.0, 244.8];

const students: Student[] = [
  { id: "OGR-3", scores: [187.3, 200.0, 217.6, 225.1], percentile: 32 },
  { id: "OGR-4", scores: [177.9, 200.8, 221.5, 247.2], percentile: 95 },
  { id: "OGR-7", scores: [202.8, 196.2, 219.3, 227.9], percentile: 11 },
  { id: "OGR-8", scores: [187.8, 203.6, 238.7, 243.4], percentile: 73 },
  { id: "OGR-9", scores: [192.6, 211.7, 222.7, 240.9], percentile: 54 },
  { id: "OGR-10", scores: [203.4, 214.7, 222.5, 240.4], percentile: 30 },
  { id: "OGR-12", scores: [185.7, 197.1, 227.5, 253.7], percentile: 94 },
  { id: "OGR-14", scores: [232.4, 234.7, 254.3, 283.4], percentile: 62 },
  { id: "OGR-198", scores: [195.0, 236.9, 250.8, 294.8], percentile: 100 },
  { id: "OGR-1", scores: [200.5, null, 245.7, null] },
  { id: "OGR-2", scores: [197.6, null, 239.5, 251.3] },
  { id: "OGR-5", scores: [null, 200.8, 233.9, 242.4] },
  { id: "OGR-6", scores: [201.5, 212.4, 238.1, null] },
  { id: "OGR-11", scores: [208.7, null, null, 259.7] },
  { id: "OGR-13", scores: [195.8, 207.8, null, null] },
];

const menuItems = [
  "Giriş Ekranı",
  "Okul Bilgileri",
  "Bilgi Giriş İşlemleri",
  "Kayıt İşlemleri",
  "Ders İşlemleri",
  "Örtük Gelişim",
  "Rubrik Girişi",
  "Görsel Raporlama",
];

const evidence = [
  ["t0", "Hazırbulunuşluk izleme sınavı", "Başlangıç noktası"],
  ["t1", "Gereksinim modelleme bağlam temelli performans görevi", "Öğrenme kanıtı"],
  ["t2", "Süreç içi izleme ve alt öğrenme alanı analizi", "Boylamsal ölçüm"],
  ["t3", "Yıl sonu ölçümü ve gelişim hızı değerlendirmesi", "Slope kestirimi"],
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

function useStudentMath(student: Student) {
  return useMemo(() => {
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
  }, [student]);
}

export default function Home() {
  const [studentId, setStudentId] = useState("OGR-4");
  const [rubric, setRubric] = useState([3, 3, 2, 4]);
  const selected = students.find((student) => student.id === studentId) ?? students[0];
  const stats = useStudentMath(selected);
  const rubricAverage = rubric.reduce((sum, value) => sum + value, 0) / rubric.length;
  const min = 165;
  const max = 305;
  const studentPath = linePath(selected.scores, min, max);
  const cohortPath = linePath(cohortMeans, min, max);

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Kurum menüsü">
        <div className="sidebar-title">Kurum İşlemleri</div>
        <label className="period-label" htmlFor="period">Eğitim Öğretim Dönemi</label>
        <select id="period" className="period-select" defaultValue="2026-2027">
          <option>2026-2027</option>
        </select>
        <nav>
          {menuItems.map((item) => (
            <button className={item === "Örtük Gelişim" ? "menu-item active" : "menu-item"} key={item}>
              <span className="menu-dot" />
              {item}
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
          </div>
        </header>

        <div className="module-strip">
          <strong>Sınıf / Şube Bazında Örtük Gelişim İşlemleri</strong>
          <span>IOK10007</span>
        </div>

        <section className="filter-panel" aria-label="Filtreler">
          <div className="tool-icons" aria-hidden="true">
            <span>+</span>
            <span>□</span>
            <span>▣</span>
            <span>⌕</span>
            <span>↻</span>
          </div>
          <div className="field-grid">
            <label>Ders<select defaultValue="Matematik Okuryazarlığı"><option>Matematik Okuryazarlığı</option></select></label>
            <label>Dönem<select defaultValue="2026-2027"><option>2026-2027</option></select></label>
            <label>Sınıf / Şube<select defaultValue="5-A"><option>5-A</option></select></label>
            <label>Öğrenci<select value={studentId} onChange={(event) => setStudentId(event.target.value)}>{students.map((student) => <option key={student.id}>{student.id}</option>)}</select></label>
          </div>
        </section>

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

        <section className="panel evidence-panel">
          <header className="panel-title"><strong>Etkinlik Zaman Tüneli</strong><span>Öğrenme kanıtları simgeleri</span></header>
          <div className="timeline">{evidence.map(([time, title, tag]) => <article key={time}><strong>{time}</strong><span>{title}</span><small>{tag}</small></article>)}</div>
        </section>

        <section className="entry-layout">
          <article className="panel">
            <header className="panel-title"><strong>Sınıf İçi Anlık Gözlem Verisi Girişi</strong><span>Rubrik 1-4</span></header>
            <div className="rubric-list">
              {rubricRows.map((row, index) => (
                <label key={row} className="rubric-row">
                  <span>{row}</span>
                  <input type="range" min="1" max="4" value={rubric[index]} onChange={(event) => {
                    const next = [...rubric];
                    next[index] = Number(event.target.value);
                    setRubric(next);
                  }} />
                  <strong>{rubric[index]}</strong>
                </label>
              ))}
            </div>
          </article>

          <article className="panel">
            <header className="panel-title"><strong>Madde Bankası / IRT Alanları</strong><span>Çapa madde düzeni</span></header>
            <table className="item-bank">
              <thead><tr><th>Alan</th><th>Parametre</th><th>Durum</th></tr></thead>
              <tbody>
                <tr><td>Güçlük</td><td>b</td><td>Madde havuzu</td></tr>
                <tr><td>Ayırt edicilik</td><td>a</td><td>IRT altyapısı</td></tr>
                <tr><td>Dikey ölçekleme</td><td>Anchor items</td><td>Kademe geçişi</td></tr>
              </tbody>
            </table>
          </article>
        </section>

        <section className="panel">
          <header className="panel-title"><strong>Sınıf Listesi - Seçilen Alanlara Göre Ders Gelişim Girişi</strong><span>Yapay veri seti: 500 öğrenci</span></header>
          <div className="table-wrap">
            <table className="class-table">
              <thead><tr><th>Öğrenci ID</th><th>T0</th><th>T1</th><th>T2</th><th>T3</th><th>Gözlem</th><th>Yörünge</th></tr></thead>
              <tbody>
                {students.map((student) => {
                  const filled = student.scores.filter((value) => typeof value === "number").length;
                  const first = student.scores.find((value) => typeof value === "number") ?? null;
                  const last = [...student.scores].reverse().find((value) => typeof value === "number") ?? null;
                  const trend = typeof first === "number" && typeof last === "number" && last > first ? "Artan" : "Durağan";

                  return (
                    <tr key={student.id} className={student.id === selected.id ? "selected-row" : ""}>
                      <td><button onClick={() => setStudentId(student.id)}>{student.id}</button></td>
                      {student.scores.map((score, index) => <td key={index}>{compact(score)}</td>)}
                      <td>{filled}/4</td>
                      <td>{trend}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel system-panel">
          <header className="panel-title"><strong>Uygulama Aşamaları ve Sistem Bileşenleri</strong><span>Rapor ve sunum kapsamı</span></header>
          <div className="module-grid">{modules.map(([code, title, body]) => <article key={code}><strong>{code}</strong><span>{title}</span><small>{body}</small></article>)}</div>
        </section>
      </section>
    </main>
  );
}
