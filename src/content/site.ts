// ─────────────────────────────────────────────────────────────────────────
// Konten situs PT Enviro Resources Indonesia (bilingual ID/EN).
// Di-port dari mockup design-reference/. Di Fase 2, sumber ini diganti Directus;
// bentuk `getSite(locale)` dipertahankan agar komponen tidak berubah.
// ─────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next';

export type Locale = 'id' | 'en';

export const SITE_URL = 'https://enviroresources.co.id';
export const COMPANY = 'PT Enviro Resources Indonesia';
const OG_IMAGE = '/photos/1774789599304-cca1e1ffbb95.jpg';

type L = { id: string; en: string };
const B = (id: string, en: string): L => ({ id, en });

export type Photo = { img: string; credit: string; href: string };
const photo = (id: string, name: string, user: string): Photo => ({
  img: `/photos/${id}.jpg`,
  credit: `Photo by ${name} on Unsplash`,
  href: `https://unsplash.com/@${user}`,
});

const num = <T extends object>(arr: T[]) =>
  arr.map((x, i) => ({ n: String(i + 1).padStart(2, '0'), ...x }));

// SVG path (inner markup) untuk ikon — dirender via <Icon>.
const focusIcons = [
  '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 2.5h6v3H9zM9 13l2 2 4-4"/>',
  '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9 14a3 3 0 0 0 3 3"/>',
  '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
];
const valueIcons = [
  '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6"/>',
  '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  '<path d="M12 21c-5-3-8-6.5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 4.5-3 8-8 11z"/>',
];
export const methodIcons = [
  '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8"/>',
  '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
];

// ── Data mentah (bilingual) ────────────────────────────────────────────────
const content = {
  nav: {
    home: B('Beranda', 'Home'),
    about: B('Tentang Kami', 'About Us'),
    services: B('Layanan', 'Services'),
    portfolio: B('Portofolio', 'Portfolio'),
    legal: B('Legalitas', 'Legal'),
    team: B('Tim Ahli', 'Our Experts'),
    articles: B('Artikel', 'Insights'),
    contact: B('Kontak', 'Contact'),
  },
  cta: B('Minta Penawaran', 'Request a Quote'),
  ctaBand: B('Mari diskusikan kebutuhan lingkungan perusahaan Anda', "Let's discuss your company's environmental needs"),
  hero: {
    eyebrow: B('KONSULTAN LINGKUNGAN · GRESIK, JAWA TIMUR', 'ENVIRONMENTAL CONSULTANTS · GRESIK, EAST JAVA'),
    sub: B(
      'Konsultasi lingkungan, pengurusan perizinan lingkungan, ANDALALIN, SIPA air tanah, perizinan kesehatan & keamanan pangan, dan jasa konstruksi sistem pengolahan air.',
      'Environmental consulting, environmental permitting, traffic impact analysis (ANDALALIN), groundwater permits (SIPA), health & food safety permits, and water treatment system construction.',
    ),
    b1: B('Konsultasi Sekarang', 'Discuss Your Project'),
    b2: B('Unduh Company Profile', 'Download Company Profile'),
  },
  focus: num([
    { t: B('Konsultasi lingkungan', 'Environmental consulting'), d: B('Penyusunan dokumen, persetujuan teknis, pelaporan, audit, serta pendampingan kepatuhan.', 'Document preparation, technical approvals, reporting, audits, and compliance support.') },
    { t: B('Prasarana pengolahan limbah', 'Waste treatment infrastructure'), d: B('Perencanaan dan konstruksi bangunan sipil untuk mendukung sistem pengolahan limbah.', 'Planning and civil construction to support waste treatment systems.') },
    { t: B('Pengelolaan limbah non-B3', 'Non-hazardous waste management'), d: B('Pengumpulan, pengangkutan, pengolahan, dan pembuangan sesuai ruang lingkup izin usaha.', 'Collection, transport, treatment, and disposal within the scope of our business license.') },
  ]).map((f, i) => ({ ...f, iconPaths: focusIcons[i] })),
  home: {
    svcEyebrow: B('LAYANAN', 'SERVICES'), svcTitle: B('Dokumen, persetujuan, dan pelaporan', 'Documents, approvals, and reporting'), svcAll: B('Semua layanan', 'All services'),
    pfEyebrow: B('PORTOFOLIO', 'PORTFOLIO'), pfTitle: B('Proyek terpilih', 'Selected projects'), pfAll: B('Lihat portofolio', 'View portfolio'),
  },
  faq: {
    title: B('Pertanyaan yang sering diajukan', 'Frequently asked questions'),
    sub: B('Belum menemukan jawaban? Tim kami siap membantu penapisan awal kebutuhan perizinan Anda.', "Can't find an answer? Our team can help with an initial screening of your permit needs."),
    cta: B('Tanya via WhatsApp', 'Ask via WhatsApp'),
    list: [
      { q: B('Apa perbedaan AMDAL, UKL-UPL, dan SPPL?', 'What is the difference between AMDAL, UKL-UPL, and SPPL?'), a: B('Ketiganya ditentukan oleh skala dan dampak kegiatan. AMDAL untuk kegiatan yang berdampak penting, UKL-UPL untuk kegiatan yang tidak berdampak penting, dan SPPL untuk usaha dengan dampak ringan. Jenis yang wajib dipenuhi ditetapkan melalui penapisan.', 'All three depend on the scale and impact of the activity. AMDAL applies to activities with significant impact, UKL-UPL to activities without significant impact, and SPPL to businesses with minor impact. The required type is determined through screening.') },
      { q: B('Berapa lama proses penyusunan dokumen lingkungan?', 'How long does preparing an environmental document take?'), a: B('Durasi bergantung pada jenis dokumen, kelengkapan data, dan jadwal pembahasan di instansi berwenang. Estimasi waktu kami sampaikan setelah penapisan awal.', 'Duration depends on the document type, data completeness, and the review schedule of the competent authority. We provide a time estimate after initial screening.') },
      { q: B('Data apa saja yang perlu disiapkan?', 'What data needs to be prepared?'), a: B('Umumnya legalitas usaha (NIB), kesesuaian tata ruang (KKPR), rencana tapak atau layout, serta deskripsi kegiatan dan kapasitas. Daftar lengkap kami berikan sesuai jenis dokumen.', 'Generally business legality (NIB), spatial conformity (KKPR), site plan or layout, and a description of activities and capacity. We provide a full list based on the document type.') },
      { q: B('Apa itu Persetujuan Teknis (Pertek)?', 'What is a Technical Approval (Pertek)?'), a: B('Persetujuan Teknis adalah persetujuan dari instansi berwenang atas pemenuhan standar perlindungan lingkungan, misalnya untuk pembuangan air limbah atau emisi. Pertek menjadi bagian dari persetujuan lingkungan.', 'A Technical Approval is the competent authority’s approval that environmental protection standards are met, for example for wastewater discharge or emissions. It forms part of the environmental approval.') },
      { q: B('Bagaimana cara memulai konsultasi?', 'How do I start a consultation?'), a: B('Hubungi kami melalui WhatsApp atau formulir kontak. Tim kami akan melakukan penapisan awal dan menyampaikan lingkup pekerjaan beserta penawaran.', 'Contact us via WhatsApp or the contact form. Our team will run an initial screening and share the scope of work along with a quote.') },
    ],
  },
  clients: { label: B('DIPERCAYA OLEH', 'TRUSTED BY') },
  testi: {
    eyebrow: B('TESTIMONI', 'TESTIMONIALS'), title: B('Apa kata klien kami', 'What our clients say'), status: B('Contoh isi, menunggu data klien', 'Sample content, awaiting client data'),
    list: [
      { text: B('Tim ERI membantu kami memetakan kewajiban lingkungan sejak awal, sehingga proses persetujuan berjalan lebih terarah.', 'The ERI team helped us map our environmental obligations early, so the approval process ran in a clearer direction.'), name: B('Nama Klien', 'Client Name'), role: B('Jabatan · Perusahaan', 'Title · Company') },
      { text: B('Pendampingan saat pembahasan dokumen sangat membantu. Revisi dari instansi ditindaklanjuti dengan cepat.', 'Support during document review was very helpful. Revisions from the authority were followed up quickly.'), name: B('Nama Klien', 'Client Name'), role: B('Jabatan · Perusahaan', 'Title · Company') },
      { text: B('Perencanaan IPAL disesuaikan dengan karakteristik limbah dan kondisi lahan kami.', 'The WWTP planning was tailored to our waste characteristics and site conditions.'), name: B('Nama Klien', 'Client Name'), role: B('Jabatan · Perusahaan', 'Title · Company') },
      { text: B('Jadwal pemantauan dan pelaporan berkala kami kini lebih tertib dan terdokumentasi.', 'Our periodic monitoring and reporting schedule is now more orderly and well documented.'), name: B('Nama Klien', 'Client Name'), role: B('Jabatan · Perusahaan', 'Title · Company') },
      { text: B('Komunikasi dengan tim konsultan jelas di setiap tahap, dari survei sampai persetujuan terbit.', 'Communication with the consulting team was clear at every stage, from survey to approval.'), name: B('Nama Klien', 'Client Name'), role: B('Jabatan · Perusahaan', 'Title · Company') },
      { text: B('Pengangkutan limbah non-B3 berjalan rutin sesuai jadwal dan dilengkapi dokumen yang rapi.', 'Non-hazardous waste collection runs on schedule with tidy supporting documents.'), name: B('Nama Klien', 'Client Name'), role: B('Jabatan · Perusahaan', 'Title · Company') },
    ],
  },
  method: {
    eyebrow: B('METODE PENDAMPINGAN', 'OUR METHOD'), title: B('Lima tahap, dari penapisan hingga tindak lanjut', 'Five stages, from screening to follow-up'),
    note: B('Setiap tahap mengikuti kelengkapan data dan jadwal instansi berwenang.', 'Each stage follows data completeness and the schedule of the competent authority.'),
    steps: num([
      { t: B('Penapisan', 'Screening'), d: B('Menentukan kewajiban, kewenangan, data, dan ruang lingkup.', 'Determining obligations, authority, data, and scope.') },
      { t: B('Survei dan pengumpulan data', 'Survey and data collection'), d: B('Memeriksa kondisi eksisting serta dokumen pendukung.', 'Reviewing existing conditions and supporting documents.') },
      { t: B('Penyusunan dan kajian teknis', 'Drafting and technical study'), d: B('Mengolah data menjadi dokumen dan rekomendasi.', 'Turning data into documents and recommendations.') },
      { t: B('Pembahasan dan perbaikan', 'Review and revision'), d: B('Mendampingi verifikasi, rapat, serta revisi dokumen.', 'Supporting verification, meetings, and document revisions.') },
      { t: B('Persetujuan dan tindak lanjut', 'Approval and follow-up'), d: B('Menyerahkan keluaran dan rencana pemenuhan kewajiban.', 'Delivering outputs and a compliance fulfilment plan.') },
    ]),
  },
  sectors: {
    eyebrow: B('SEKTOR', 'SECTORS'), title: B('Sektor yang kami layani', 'Sectors we serve'),
    note: B('Lingkup penugasan ditetapkan setelah penapisan kegiatan, lokasi, skala, dan status perizinan.', 'Engagement scope is set after screening the activity, location, scale, and permit status.'),
    list: num(
      [
        B('Industri manufaktur', 'Manufacturing'),
        B('Pergudangan dan logistik', 'Warehousing and logistics'),
        B('Fasilitas komersial', 'Commercial facilities'),
        B('Rumah sakit dan layanan kesehatan', 'Hospitals and healthcare'),
        B('Perumahan dan kawasan', 'Housing and estates'),
        B('Hotel, restoran, dan usaha pangan', 'Hotels, restaurants, and food businesses'),
        B('Fasilitas pengelolaan limbah', 'Waste management facilities'),
        B('Usaha kecil dan menengah', 'Small and medium enterprises'),
      ].map((t, i) => ({
        t,
        ...[
          photo('1504917595217-d4dc5ebe6122', 'Christopher Burns', 'christopher__burns'),
          photo('1586528116311-ad8dd3c8310d', 'Ruchindra Gunasekara', 'ruchindra'),
          photo('1497366216548-37526070297c', 'Nastuh Abootalebi', 'sunday_digital'),
          photo('1519494026892-80bbd2d6fd0d', 'Martha Dominguez de Gouveia', 'marthadomingues'),
          photo('1560518883-ce09059eeffa', 'Tierra Mallorca', 'tierramallorca'),
          photo('1566073771259-6a8506099945', 'Sara Dubler', 'sara_dubler'),
          photo('1532996122724-e3c354a0b15b', 'Nareeta Martin', 'splashabout'),
          photo('1441986300917-64674bd600d8', 'Clark Street Mercantile', 'mercantile'),
        ][i],
      })),
    ),
  },
  pages: {
    about: { title: B('Mitra konsultasi dan pengelolaan lingkungan yang dipercaya', 'A trusted partner in environmental consulting and management'), sub: B('Mendampingi pelaku usaha dan instansi dalam pemenuhan kewajiban lingkungan, kesehatan lingkungan, dan perencanaan sistem pengolahan limbah, serta pengelolaan limbah.', 'Supporting businesses and institutions in meeting environmental and environmental-health obligations, planning waste treatment systems, and managing waste.') },
    services: { title: B('Layanan dari kajian hingga konstruksi', 'Services from study to construction'), sub: B('Pendampingan disesuaikan dengan skala kegiatan, kewenangan, lokasi, dan status perizinan eksisting.', 'Support is tailored to activity scale, authority, location, and existing permit status.') },
    portfolio: { title: B('Portofolio proyek', 'Project portfolio'), sub: B('Pilihan penugasan dokumen lingkungan, persetujuan teknis, dan prasarana pengolahan limbah.', 'Selected engagements in environmental documents, technical approvals, and waste treatment infrastructure.') },
    legal: { title: B('Sertifikasi & legalitas', 'Certifications & legal'), sub: B('Ruang lingkup usaha dan dokumen legal yang menjadi dasar setiap penugasan.', 'The business scope and legal documents underpinning every engagement.') },
    team: { title: B('Tenaga ahli', 'Our experts'), sub: B('Tim lintas disiplin teknik lingkungan, kesehatan lingkungan, arsitektur, hukum, dan administrasi.', 'A multidisciplinary team across environmental engineering, environmental health, architecture, law, and administration.') },
    articles: { title: B('Artikel & wawasan', 'Articles & insights'), sub: B('Catatan seputar regulasi dan praktik perizinan lingkungan.', 'Notes on environmental regulation and permitting practice.') },
    contact: { title: B('Mari diskusikan kebutuhan lingkungan perusahaan Anda', "Let's discuss your company's environmental needs"), sub: B('Ceritakan rencana kegiatan dan status perizinan Anda. Tim kami akan membantu menentukan kewajiban dan ruang lingkup kerja.', 'Tell us about your planned activity and permit status. Our team will help define obligations and scope of work.') },
  },
  about: {
    intro: B('Mendampingi pelaku usaha dan instansi dalam pemenuhan kewajiban lingkungan, kesehatan lingkungan, dan perencanaan sistem pengolahan limbah, serta pengelolaan limbah.', 'Supporting businesses and institutions in meeting environmental and environmental-health obligations, planning waste treatment systems, and managing waste.'),
    approach: B('Pendekatan kami menghubungkan kajian teknis, proses perizinan, dan kebutuhan operasional agar rekomendasi dapat diterapkan di lapangan.', 'Our approach connects technical studies, the permitting process, and operational needs so recommendations can be applied in the field.'),
    visionL: B('VISI', 'VISION'), vision: B('Menjadi mitra konsultasi dan pengelolaan lingkungan yang dipercaya dalam mendukung kepatuhan serta kinerja lingkungan usaha.', 'To be a trusted environmental consulting and management partner supporting business compliance and environmental performance.'),
    missionL: B('MISI', 'MISSION'),
    mission: num([
      B('Menyusun kajian dan dokumen lingkungan secara teliti serta dapat dipertanggungjawabkan.', 'Prepare environmental studies and documents carefully and accountably.'),
      B('Mengembangkan solusi pengolahan limbah yang sesuai karakteristik kegiatan dan kondisi lapangan.', 'Develop waste treatment solutions suited to each activity and site condition.'),
      B('Mendampingi proses perizinan, pelaporan, monitoring, dan peningkatan kinerja lingkungan.', 'Support permitting, reporting, monitoring, and environmental performance improvement.'),
      B('Menjalankan pengelolaan limbah non-B3 sesuai ketentuan dan standar operasional.', 'Carry out non-hazardous waste management in line with regulations and operating standards.'),
    ].map((t) => ({ t }))),
    principlesL: B('PRINSIP KERJA', 'HOW WE WORK'), principlesT: B('Empat prinsip dalam setiap penugasan', 'Four principles in every engagement'),
    principles: num([
      { t: B('Kepatuhan', 'Compliance'), d: B('Rujukan regulasi dan kewenangan menjadi dasar setiap proses.', 'Regulatory references and authority form the basis of every process.') },
      { t: B('Ketelitian teknis', 'Technical rigour'), d: B('Data lapangan, perhitungan, dan dokumen diperiksa secara berlapis.', 'Field data, calculations, and documents are checked in layers.') },
      { t: B('Praktisitas', 'Practicality'), d: B('Rekomendasi mempertimbangkan fasilitas, personel, biaya, dan operasi klien.', "Recommendations consider the client's facilities, personnel, cost, and operations.") },
      { t: B('Akuntabilitas', 'Accountability'), d: B('Lingkup kerja, keluaran, jadwal, dan komunikasi proyek disampaikan dengan jelas.', 'Scope, deliverables, schedule, and project communication are stated clearly.') },
    ]),
    valuesL: B('NILAI KERJA', 'OUR VALUES'), valuesT: B('Cara tim berkomunikasi dan menyelesaikan pekerjaan', 'How our team communicates and delivers'),
    values: num([
      { t: B('Akurat', 'Accurate'), d: B('Analisis dan dokumen berbasis data yang dapat ditelusuri.', 'Analysis and documents based on traceable data.') },
      { t: B('Patuh', 'Compliant'), d: B('Ruang lingkup mengikuti kewajiban dan regulasi yang relevan.', 'Scope follows relevant obligations and regulations.') },
      { t: B('Transparan', 'Transparent'), d: B('Progres, kebutuhan data, dan kendala disampaikan secara terbuka.', 'Progress, data needs, and obstacles are shared openly.') },
      { t: B('Responsif', 'Responsive'), d: B('Koordinasi proyek dilakukan cepat dan terarah.', 'Project coordination is fast and focused.') },
      { t: B('Bertanggung jawab', 'Responsible'), d: B('Rekomendasi mempertimbangkan dampak lingkungan dan kelayakan operasional.', 'Recommendations weigh environmental impact and operational feasibility.') },
    ]).map((v, i) => ({ ...v, iconPaths: valueIcons[i] })),
    compL: B('KOMPETENSI', 'CAPABILITIES'), compT: B('Kompetensi pelaksanaan proyek', 'Project delivery capabilities'),
    comp: [
      { t: B('Kajian dan dokumen', 'Studies and documents'), d: B('Pengumpulan data, evaluasi dampak, penyusunan matriks pengelolaan dan pemantauan.', 'Data collection, impact evaluation, management and monitoring matrices.') },
      { t: B('Koordinasi perizinan', 'Permit coordination'), d: B('Pendampingan pemeriksaan administrasi, verifikasi teknis, perbaikan, dan tindak lanjut.', 'Support through administrative checks, technical verification, revisions, and follow-up.') },
      { t: B('Rekayasa lingkungan', 'Environmental engineering'), d: B('Penilaian kebutuhan prasarana dan integrasi dengan operasi pengolahan limbah.', 'Assessing infrastructure needs and integration with waste treatment operations.') },
      { t: B('Monitoring dan pelaporan', 'Monitoring and reporting'), d: B('Evaluasi pemenuhan kewajiban serta penyusunan laporan berkala.', 'Evaluating compliance and preparing periodic reports.') },
    ],
  },
  svc: {
    docL: B('DOKUMEN & PERSETUJUAN LINGKUNGAN', 'ENVIRONMENTAL DOCUMENTS & APPROVALS'), docT: B('Layanan dokumen dan persetujuan lingkungan', 'Environmental document and approval services'),
    docNote: B('Pendampingan disesuaikan dengan skala kegiatan, kewenangan, lokasi, dan status perizinan eksisting.', 'Support is tailored to activity scale, authority, location, and existing permit status.'),
    docs: num([
      B('AMDAL dan UKL-UPL', 'AMDAL and UKL-UPL'),
      B('DELH dan DPLH', 'DELH and DPLH'),
      B('Persetujuan Lingkungan', 'Environmental Approval'),
      B('Analisis Dampak Lalu Lintas (Andalalin)', 'Traffic Impact Analysis (Andalalin)'),
      B('Rincian Teknis Limbah B3', 'Hazardous Waste Technical Details'),
      B('SIPA (Surat Izin Pengusahaan Air Tanah)', 'SIPA (Groundwater Use Permit)'),
    ].map((t) => ({ t }))),
    techL: B('TEKNIS, OPERASI & PELAPORAN', 'TECHNICAL, OPERATIONS & REPORTING'), techT: B('Layanan teknis, operasi, dan pelaporan', 'Technical, operations, and reporting services'),
    tech: [
      { t: B('Persetujuan Teknis Emisi', 'Emission Technical Approval'), d: B('Kajian teknis pemenuhan baku mutu emisi.', 'Technical study for meeting emission quality standards.') },
      { t: B('Persetujuan Teknis Air Limbah', 'Wastewater Technical Approval'), d: B('Kajian pemenuhan baku mutu air limbah (BMAL).', 'Study for meeting wastewater quality standards (BMAL).') },
      { t: B('Surat Laik Operasi', 'Operational Feasibility Certificate (SLO)'), d: B('Pendampingan kesiapan teknis dan administrasi SLO.', 'Support for SLO technical and administrative readiness.') },
      { t: B('Pelaporan RKL-RPL / UKL-UPL', 'RKL-RPL / UKL-UPL Reporting'), d: B('Penyusunan laporan pelaksanaan pengelolaan dan pemantauan lingkungan.', 'Preparing environmental management and monitoring implementation reports.') },
      { t: B('Audit dan Monitoring Lingkungan', 'Environmental Audit and Monitoring'), d: B('Pemeriksaan kondisi lapangan, dokumen, serta tindak lanjut.', 'Inspection of site conditions, documents, and follow-up.') },
      { t: B('Pendampingan PROPER', 'PROPER Assistance'), d: B('Pemetaan bukti pemenuhan dan penguatan kesiapan penilaian.', 'Mapping compliance evidence and strengthening assessment readiness.') },
    ],
  },
  fw: {
    eyebrow: B('KERANGKA PERIZINAN', 'PERMITTING FRAMEWORK'), title: B('Kerangka perizinan lingkungan', 'Environmental permitting framework'),
    sub: B('Persetujuan lingkungan menjadi prasyarat yang terhubung dengan perizinan berusaha.', 'Environmental approval is a prerequisite linked to business licensing.'),
    baseL: B('LANDASAN UTAMA', 'LEGAL BASIS'),
    pp: B('Penyelenggaraan Perlindungan dan Pengelolaan Lingkungan Hidup', 'Implementation of Environmental Protection and Management'),
    permen: B('Daftar kegiatan wajib AMDAL, UKL-UPL, atau SPPL menurut KBLI, skala, dan parameter kegiatan.', 'List of activities requiring AMDAL, UKL-UPL, or SPPL by KBLI code, scale, and activity parameters.'),
    objL: B('OBJEK PENAPISAN', 'SCREENING CRITERIA'),
    obj: [B('KBLI dan uraian kegiatan', 'KBLI code and activity description'), B('Kapasitas produksi', 'Production capacity'), B('Luas lahan atau bangunan', 'Land or building area'), B('Lokasi dan sensitivitas kawasan', 'Location and area sensitivity')],
    resL: B('HASIL PENAPISAN', 'SCREENING OUTCOME'),
    prinL: B('Prinsip pelaksanaan', 'Implementation principle'),
    prin: B('Proses dimulai dari data rencana usaha yang final. Kesesuaian tata ruang, kewenangan penerbit, serta kebutuhan persetujuan teknis harus dipastikan sebelum dokumen diajukan. Perubahan desain di tengah proses dapat mengubah jenis dokumen dan ruang lingkup kajian.', 'The process starts from final business plan data. Spatial conformity, issuing authority, and technical approval needs must be confirmed before submission. Design changes mid-process can change the document type and study scope.'),
  },
  infra: {
    title: B('Solusi prasarana pengolahan limbah', 'Waste treatment infrastructure solutions'),
    scope: B('Kajian kebutuhan prasarana, pengembangan konsep sistem, konstruksi bangunan sipil, serta koordinasi kesiapan operasi.', 'Infrastructure needs assessment, system concept development, civil construction, and operational readiness coordination.'),
    focusL: B('Fokus perencanaan', 'Planning focus'),
    focus: [B('Kesesuaian karakteristik limbah', 'Fit with waste characteristics'), B('Kapasitas dan beban pengolahan', 'Treatment capacity and load'), B('Integrasi dengan area produksi', 'Integration with production areas'), B('Akses operasi dan pemeliharaan', 'Operation and maintenance access'), B('Kepatuhan terhadap persyaratan teknis', 'Compliance with technical requirements')],
  },
  nonb3: {
    title: B('Pengelolaan limbah non-B3', 'Non-hazardous waste management'),
    items: [
      { t: B('Pengumpulan dan pengangkutan', 'Collection and transport'), d: B('Pelayanan diarahkan untuk limbah atau sampah tidak berbahaya, dengan alur penanganan yang terdokumentasi dan tujuan pengelolaan yang sesuai.', 'Services for non-hazardous waste, with documented handling flows and appropriate destinations.') },
      { t: B('Pengolahan dan pembuangan', 'Treatment and disposal'), d: B('Metode pengolahan disesuaikan dengan jenis limbah non-B3, kemampuan fasilitas, serta perizinan yang dimiliki atau digunakan melalui mitra.', 'Treatment methods match the waste type, facility capability, and permits held directly or through partners.') },
    ],
  },
  legal: {
    kbliT: B('Ruang lingkup KBLI', 'Registered business scope (KBLI)'),
    kbli: [
      { c: '74999', t: B('Aktivitas profesional, ilmiah, dan teknis lainnya YTDL', 'Other professional, scientific, and technical activities n.e.c.'), d: B('Landasan aktivitas konsultasi profesional sesuai perizinan perusahaan.', 'Basis for professional consulting activities under the company license.') },
      { c: '71102', t: B('Aktivitas perancangan dan konsultasi teknis', 'Engineering design and technical consulting'), d: B('Landasan aktivitas konsultasi profesional perancangan.', 'Basis for professional design consulting.') },
      { c: '42203', t: B('Konstruksi bangunan sipil prasarana sistem pengolahan limbah', 'Civil construction of waste treatment infrastructure'), d: B('Pelaksanaan prasarana sipil yang mendukung sistem pengolahan limbah.', 'Civil works supporting waste treatment systems.') },
      { c: '38219', t: B('Pengolahan dan pembuangan limbah atau sampah tidak berbahaya lainnya', 'Treatment and disposal of other non-hazardous waste'), d: B('Pengolahan limbah non-B3, termasuk pengolahan organik menjadi kompos atau proses non-bahaya lainnya.', 'Non-hazardous waste treatment, including composting of organics and other non-hazardous processes.') },
      { c: '38110', t: B('Pengumpulan limbah atau sampah tidak berbahaya', 'Collection of non-hazardous waste'), d: B('Pengumpulan limbah non-B3 untuk disalurkan ke fasilitas pengelolaan yang sesuai.', 'Collecting non-hazardous waste for delivery to suitable management facilities.') },
    ],
    docL: B('DOKUMEN LEGAL', 'LEGAL DOCUMENTS'), docT: B('Sertifikat dan dokumen perusahaan', 'Company certificates and documents'),
    docs: [B('Akta Pendirian Perusahaan', 'Deed of Establishment'), B('Nomor Induk Berusaha (NIB)', 'Business Identification Number (NIB)'), B('NPWP Perusahaan', 'Company Tax ID (NPWP)'), B('Sertifikat Badan Usaha (SBU)', 'Business Entity Certificate (SBU)')],
  },
  articles: [
    { cat: B('Regulasi', 'Regulation'), status: B('Contoh judul', 'Sample title'), t: B('Memahami penapisan AMDAL, UKL-UPL, dan SPPL menurut Permen LHK 4 Tahun 2021', 'Understanding AMDAL, UKL-UPL, and SPPL screening under Ministerial Regulation 4/2021') },
    { cat: B('Persetujuan Teknis', 'Technical Approval'), status: B('Contoh judul', 'Sample title'), t: B('Kapan usaha Anda membutuhkan Persetujuan Teknis Air Limbah?', 'When does your business need a Wastewater Technical Approval?') },
    { cat: B('Pelaporan', 'Reporting'), status: B('Contoh judul', 'Sample title'), t: B('Menyiapkan laporan RKL-RPL dan UKL-UPL secara berkala', 'Preparing periodic RKL-RPL and UKL-UPL reports') },
    { cat: B('PROPER', 'PROPER'), status: B('Contoh judul', 'Sample title'), t: B('Memetakan bukti pemenuhan untuk penilaian PROPER', 'Mapping compliance evidence for PROPER assessment') },
  ].map((a, i) => ({
    ...a,
    ...[
      photo('1622322977875-e2d580e129ba', 'Patrick Federi', 'federi'),
      photo('1532094349884-543bc11b234d', 'Hans Reniers', 'hansreniers'),
      photo('1542744095-fcf48d80b0fd', 'Campaign Creators', 'campaign_creators'),
      photo('1705147219565-fe9f6f369d03', 'Declan Sun', 'declansun'),
    ][i],
  })),
  contact: {
    officeL: B('KANTOR PUSAT', 'HEAD OFFICE'), phoneL: B('TELEPON / WHATSAPP', 'PHONE / WHATSAPP'),
    formT: B('Minta penawaran', 'Request a quote'), formSub: B('Isi formulir berikut, tim kami akan menghubungi Anda.', 'Fill in the form and our team will contact you.'),
    f: { name: B('Nama', 'Name'), company: B('Perusahaan / Instansi', 'Company / Institution'), phone: B('Telepon', 'Phone'), service: B('Layanan yang dibutuhkan', 'Service needed'), other: B('Lainnya / belum tahu', 'Other / not sure'), msg: B('Rencana kegiatan & status perizinan', 'Planned activity & permit status'), send: B('Kirim Permintaan', 'Send Request') },
    thanksT: B('Terima kasih', 'Thank you'), thanks: B('Permintaan Anda sudah kami terima. Tim kami akan menghubungi Anda melalui email atau telepon.', 'We have received your request. Our team will contact you by email or phone.'),
  },
  footer: { company: B('Perusahaan', 'Company'), svc: [B('AMDAL & UKL-UPL', 'AMDAL & UKL-UPL'), B('Persetujuan Teknis', 'Technical Approvals'), B('Prasarana Pengolahan Limbah', 'Waste Treatment Infrastructure'), B('Pengelolaan Limbah Non-B3', 'Non-hazardous Waste')] },
  filters: [
    { key: 'all', label: B('Semua', 'All') },
    { key: 'doc', label: B('Dokumen Lingkungan', 'Environmental Documents') },
    { key: 'tech', label: B('Persetujuan Teknis', 'Technical Approvals') },
    { key: 'infra', label: B('Prasarana Limbah', 'Waste Infrastructure') },
    { key: 'waste', label: B('Limbah Non-B3', 'Non-hazardous Waste') },
  ],
  projects: [
    { key: 'p1', cat: 'doc', tag: B('AMDAL', 'AMDAL') },
    { key: 'p2', cat: 'infra', tag: B('IPAL', 'WWTP') },
    { key: 'p3', cat: 'doc', tag: B('UKL-UPL', 'UKL-UPL') },
    { key: 'p4', cat: 'tech', tag: B('Pertek Air Limbah', 'Wastewater Approval') },
    { key: 'p5', cat: 'doc', tag: B('Andalalin', 'Andalalin') },
    { key: 'p6', cat: 'waste', tag: B('Limbah Non-B3', 'Non-hazardous Waste') },
  ].map((p, i) => ({
    ...p,
    ...[
      photo('1783393208952-5cf06f930c42', 'Heming paper', 'hemingpaper'),
      photo('1622322977767-2c71d1787205', 'Patrick Federi', 'federi'),
      photo('1760921678729-9658c8b792bb', 'Soo hong Lee', 'leesoohong'),
      photo('1617155093730-a8bf47be792d', 'RephiLe water', 'revolution_in_filtration'),
      photo('1711304548487-4950020f4d62', 'Dmitry Korkhau', 'korkhau'),
      photo('1622322977879-af6982dcba00', 'Patrick Federi', 'federi'),
    ][i],
    t: B('Nama proyek (menunggu data)', 'Project name (awaiting data)'),
    loc: B('Klien · Lokasi · Tahun', 'Client · Location · Year'),
  })),
};

// Foto hero untuk tiap halaman non-home.
const pageHeroPhoto: Record<string, Photo> = {
  about: photo('1517048676732-d65bc937f952', 'Dylan Gillis', 'mainermedia'),
  services: photo('1774789599304-cca1e1ffbb95', 'Subhash Chand', 'hsubhash'),
  portfolio: photo('1622322977767-2c71d1787205', 'Patrick Federi', 'federi'),
  legal: photo('1542744095-fcf48d80b0fd', 'Campaign Creators', 'campaign_creators'),
  team: photo('1581094481644-f2ab64522498', 'ThisisEngineering', 'thisisengineering'),
  articles: photo('1532094349884-543bc11b234d', 'Hans Reniers', 'hansreniers'),
  contact: photo('1497366216548-37526070297c', 'Nastuh Abootalebi', 'sunday_digital'),
};

// Foto per tahap metode (untuk stepper di beranda).
const methodPhotos: Photo[] = [
  photo('1542744095-fcf48d80b0fd', 'Campaign Creators', 'campaign_creators'),
  photo('1581092570490-cc40829efaae', 'ThisisEngineering', 'thisisengineering'),
  photo('1532094349884-543bc11b234d', 'Hans Reniers', 'hansreniers'),
  photo('1517048676732-d65bc937f952', 'Dylan Gillis', 'mainermedia'),
  photo('1581092457781-8524efafa559', 'ThisisEngineering', 'thisisengineering'),
];

const heroPhoto = photo('1774789599304-cca1e1ffbb95', 'Subhash Chand', 'hsubhash');
const aboutPhoto = photo('1517048676732-d65bc937f952', 'Dylan Gillis', 'mainermedia');

const teamNames = [
  'Dian Retno Hapsari, S.T', 'Jesicca Fatma Dewi, S.ST', 'Denissa Rahma Abidiana, S.T',
  'M. Rifky Bintar Rahmadani, S.ST', 'Ahmad Fikri Haikal, S.T', 'Rossa Anggraini Ayu Aranais, S.KL',
  'Jiemmy Ardian, S.Ars', 'Mochammad Erfian Ramadhan, S.T', 'Febby Dwi Kaffi Hutomo, S.T',
  'Kenny Bellardo, S.ST', 'Yofy Eko Saputro, A.Md', 'Ade Al Munawar, S.H',
  'Putut Djatmiko, S.E', 'Nurul Wahidah, A.Md',
];

// Titik kota untuk peta CTA band (x%, y%, tampilkan label?)
export const cities = [
  ['Medan', 8.8, 18, true], ['Pekanbaru', 14.68, 34.28, false], ['Palembang', 21.67, 52.78, false],
  ['Jakarta', 26.09, 69.86, true], ['Bandung', 27.69, 73.58, false], ['Semarang', 33.63, 73.9, false],
  ['Surabaya', 38.56, 75.39, true], ['Denpasar', 43.78, 82.86, false], ['Pontianak', 31.35, 37.14, false],
  ['Banjarmasin', 42.45, 54.53, false], ['Balikpapan', 47.18, 43.69, true], ['Makassar', 52.65, 64.17, true],
  ['Manado', 64.11, 29.21, false], ['Ambon', 71.17, 56.54, false], ['Jayapura', 97.67, 50.35, true],
].map(([name, x, y, label], i) => ({
  name: name as string,
  x: `${x}%`,
  y: `${y}%`,
  label: label as boolean,
  delay: (i * 0.17).toFixed(2),
}));

// Logo klien (di public/clients/). File .webp.
export const CLIENTS = [
  { name: 'PT Santos Jaya Abadi', logo: '/clients/santos-jaya-abadi.webp' },
  { name: 'Indoprima', logo: '/clients/indoprima.webp' },
  { name: 'Anindya', logo: '/clients/anindya.webp' },
  { name: 'Auto2000', logo: '/clients/auto2000.webp' },
  { name: 'Klien', logo: '/clients/group-26.webp' },
  { name: 'Klien', logo: '/clients/group-27.webp' },
  { name: 'Klien', logo: '/clients/group-28.webp' },
  { name: 'Klien', logo: '/clients/group-29.webp' },
];

// Sertifikat ISO (PDF di public/legal/).
export const ISO_CERTS = [
  { code: 'ISO 9001', id: 'Manajemen Mutu', en: 'Quality Management', file: '/legal/iso-9001.pdf' },
  { code: 'ISO 14001', id: 'Manajemen Lingkungan', en: 'Environmental Management', file: '/legal/iso-14001.pdf' },
  { code: 'ISO 45001', id: 'Kesehatan & Keselamatan Kerja (K3)', en: 'Occupational Health & Safety', file: '/legal/iso-45001.pdf' },
];

export const WHATSAPP = 'https://wa.me/628111360999';
export const PHONE_DISPLAY = '0811-1360-999';

// Nav order & mana yang masuk dropdown "Tentang Kami".
export const NAV_KEYS = ['home', 'about', 'services', 'portfolio', 'legal', 'team', 'articles', 'contact'] as const;
export type PageKey = (typeof NAV_KEYS)[number];
export const ABOUT_GROUP: PageKey[] = ['about', 'legal', 'team'];
// Segmen rute per halaman (dipakai untuk href).
export const ROUTES: Record<PageKey, string> = {
  home: '/', about: '/about', services: '/services', portfolio: '/portfolio',
  legal: '/legal', team: '/team', articles: '/articles', contact: '/contact',
};

// ── Resolver locale ─────────────────────────────────────────────────────────
function loc(node: unknown, l: Locale): unknown {
  if (Array.isArray(node)) return node.map((x) => loc(x, l));
  if (node && typeof node === 'object') {
    const keys = Object.keys(node as object);
    if (keys.length === 2 && 'id' in (node as object) && 'en' in (node as object)) {
      return (node as Record<Locale, string>)[l];
    }
    const o: Record<string, unknown> = {};
    for (const k of keys) o[k] = loc((node as Record<string, unknown>)[k], l);
    return o;
  }
  return node;
}

/**
 * Konten situs yang sudah di-resolve ke satu bahasa, plus data turunan.
 * Bentuk `t` mengikuti struktur `content` (leaf {id,en} menjadi string).
 */
export function getSite(locale: Locale) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = loc(content, locale) as any;

  const allServices = [
    ...t.svc.docs.map((d: { t: string }) => ({ cat: locale === 'id' ? 'DOKUMEN' : 'DOCUMENTS', t: d.t })),
    ...t.svc.tech.map((d: { t: string }) => ({ cat: locale === 'id' ? 'TEKNIS & PELAPORAN' : 'TECHNICAL & REPORTING', t: d.t })),
  ];

  const methodSteps = t.method.steps.map((s: { n: string; t: string; d: string }, i: number) => ({
    ...s,
    photo: methodPhotos[i],
    iconPaths: methodIcons[i],
  }));

  const stageWord = locale === 'en' ? 'STAGE ' : 'TAHAP ';

  return {
    locale,
    t,
    nav: t.nav as Record<PageKey, string>,
    allServices,
    projects: t.projects as ProjectItem[],
    homeProjects: (t.projects as ProjectItem[]).slice(0, 3),
    team: teamNames,
    methodSteps,
    stageWord,
    heroPhoto,
    aboutPhoto,
    pageHeroPhoto,
    cities,
  };
}

export type ProjectItem = {
  key: string; cat: string; tag: string; img: string; credit: string; href: string; t: string; loc: string;
};

export function pageHero(locale: Locale, page: PageKey) {
  const t = loc(content.pages[page as keyof typeof content.pages], locale) as { title: string; sub: string };
  const nav = loc(content.nav, locale) as Record<PageKey, string>;
  const aboutOverview = locale === 'en' ? 'Company Overview' : 'Sekilas Perusahaan';

  // Halaman di grup "Tentang Kami" → breadcrumb bertingkat.
  let crumbs: string[];
  if (page === 'about') crumbs = [nav.about, aboutOverview];
  else if (page === 'legal' || page === 'team') crumbs = [nav.about, nav[page]];
  else crumbs = [nav[page]];

  return { ...t, crumbs, photo: pageHeroPhoto[page] };
}

/** Metadata SEO per halaman (title, description, OpenGraph). */
export function metaFor(locale: Locale, page: PageKey): Metadata {
  const nav = loc(content.nav, locale) as Record<PageKey, string>;

  let title: Metadata['title'];
  let ogTitle: string;
  let description: string;

  if (page === 'home') {
    ogTitle = `${COMPANY} — Solutions for a Greener Tomorrow`;
    title = { absolute: ogTitle };
    description = loc(content.hero.sub, locale) as string;
  } else {
    const p = loc(content.pages[page as keyof typeof content.pages], locale) as { title: string; sub: string };
    title = nav[page];
    ogTitle = `${nav[page]} · ${COMPANY}`;
    description = p.sub;
  }

  return {
    title,
    description,
    alternates: { canonical: `/${locale}${ROUTES[page] === '/' ? '' : ROUTES[page]}/` },
    openGraph: {
      title: ogTitle,
      description,
      type: 'website',
      siteName: COMPANY,
      locale: locale === 'en' ? 'en_US' : 'id_ID',
      url: `${SITE_URL}/${locale}${ROUTES[page] === '/' ? '' : ROUTES[page]}/`,
      images: [OG_IMAGE],
    },
  };
}
