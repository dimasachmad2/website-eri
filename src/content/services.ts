// ─────────────────────────────────────────────────────────────────────────
// Halaman detail per layanan (/[locale]/services/[slug]/) — landing page
// untuk Google Ads & SEO. Bilingual ID/EN. Dikelola di kode (belum di CMS).
// Rujukan regulasi sengaja umum (PP 22/2021, Permen LHK 4, 5, 6/2021) tanpa
// angka pasal/tenggat agar tidak usang.
// ─────────────────────────────────────────────────────────────────────────

import type { Locale } from './site';

type L = { id: string; en: string };
const B = (id: string, en: string): L => ({ id, en });

export type ServiceSlug = 'ukl-upl-sppl' | 'amdal-delh-dplh' | 'persetujuan-teknis-slo' | 'rincian-teknis-limbah-b3';

type ServiceDef = {
  slug: ServiceSlug;
  short: L; // label kartu, breadcrumb, footer
  title: L; // H1
  metaTitle: L;
  metaDesc: L;
  sub: L;
  photo: string; // foto hero (juga gambar OpenGraph)
  serviceType: string;
  waTopic: string; // diselipkan di pesan WhatsApp terisi
  who: { title: L; items: L[]; note?: L };
  scope: { t: L; d: L }[];
  prep: L[];
  steps: { t: L; d: L }[];
  faq: { q: L; a: L }[];
  notice?: L;
  articleKeywords: string[]; // cocokkan judul artikel untuk "artikel terkait"
};

const SERVICES: ServiceDef[] = [
  {
    slug: 'ukl-upl-sppl',
    short: B('UKL-UPL & SPPL', 'UKL-UPL & SPPL'),
    title: B('Jasa Penyusunan UKL-UPL & SPPL', 'UKL-UPL & SPPL Preparation Services'),
    metaTitle: B('Jasa UKL-UPL & SPPL Sidoarjo, Surabaya, Gresik', 'UKL-UPL & SPPL Consultant in Sidoarjo, Surabaya, Gresik'),
    metaDesc: B(
      'Penyusunan UKL-UPL dan SPPL untuk pabrik dan usaha di Sidoarjo, Surabaya, dan Gresik. Penapisan sesuai Permen LHK 4/2021 dan pendampingan sampai persetujuan terbit.',
      'UKL-UPL and SPPL preparation for factories and businesses in Sidoarjo, Surabaya, and Gresik. Screening under Ministerial Regulation 4/2021 and support until approval is issued.',
    ),
    sub: B(
      'Kami membantu memastikan apakah usaha Anda wajib UKL-UPL atau cukup SPPL, menyusun dokumennya, dan mendampingi pemeriksaan sampai persetujuan diterbitkan.',
      'We help confirm whether your business needs a UKL-UPL or just an SPPL, prepare the document, and support the review until the approval is issued.',
    ),
    photo: '/photos/1760921678729-9658c8b792bb.jpg',
    serviceType: 'Penyusunan dokumen UKL-UPL dan SPPL',
    waTopic: 'UKL-UPL / SPPL',
    who: {
      title: B('Kapan usaha Anda membutuhkan UKL-UPL atau SPPL?', 'When does your business need a UKL-UPL or SPPL?'),
      items: [
        B('Usaha atau kegiatan baru yang tidak wajib AMDAL namun berdampak terhadap lingkungan, sehingga wajib UKL-UPL.', 'New businesses or activities that do not require an AMDAL but still affect the environment, and therefore require a UKL-UPL.'),
        B('Usaha berdampak kecil yang cukup dengan SPPL (Surat Pernyataan Kesanggupan Pengelolaan dan Pemantauan Lingkungan Hidup).', 'Low-impact businesses that only need an SPPL (statement of commitment to environmental management and monitoring).'),
        B('Perluasan, penambahan kapasitas, atau perubahan kegiatan yang membuat dokumen lingkungan lama perlu diperbarui.', 'Expansions, capacity increases, or changes in activity that require an existing environmental document to be updated.'),
        B('Persetujuan lingkungan diminta sebagai prasyarat perizinan berusaha di OSS.', 'Environmental approval is required as a prerequisite for business licensing in OSS.'),
      ],
      note: B(
        'Jenis dokumen ditentukan lewat penapisan berdasarkan KBLI, skala atau kapasitas, luas lahan dan bangunan, serta lokasi kegiatan sesuai Permen LHK 4 Tahun 2021.',
        'The document type is determined by screening the KBLI code, scale or capacity, land and building area, and location under Ministerial Regulation 4/2021.',
      ),
    },
    scope: [
      { t: B('Penapisan jenis dokumen', 'Document screening'), d: B('Memeriksa KBLI, kapasitas, luas, dan lokasi untuk memastikan kewajiban AMDAL, UKL-UPL, atau SPPL.', 'Checking KBLI, capacity, area, and location to confirm whether AMDAL, UKL-UPL, or SPPL applies.') },
      { t: B('Survei dan pengumpulan data', 'Site survey and data collection'), d: B('Peninjauan lokasi, inventarisasi sumber dampak, dan data rona lingkungan awal.', 'Site visit, inventory of impact sources, and baseline environmental data.') },
      { t: B('Penyusunan formulir UKL-UPL', 'UKL-UPL form preparation'), d: B('Uraian kegiatan, dampak yang ditimbulkan, serta matriks upaya pengelolaan dan pemantauan.', 'Activity description, expected impacts, and the management and monitoring matrix.') },
      { t: B('Integrasi Persetujuan Teknis', 'Technical approval integration'), d: B('Bila ada pembuangan air limbah atau emisi, kebutuhan Persetujuan Teknis dipetakan sejak awal.', 'If wastewater or emissions are discharged, technical approval needs are mapped from the start.') },
      { t: B('Pendampingan pemeriksaan', 'Review support'), d: B('Pengajuan, pemeriksaan administrasi dan substansi, perbaikan, sampai PKPLH diterbitkan.', 'Submission, administrative and substantive review, revisions, until the PKPLH is issued.') },
      { t: B('Pelaporan berkala', 'Periodic reporting'), d: B('Setelah persetujuan terbit, kami dapat membantu laporan pelaksanaan UKL-UPL secara berkala.', 'After approval, we can help with periodic UKL-UPL implementation reports.') },
    ],
    prep: [
      B('Data perusahaan, NIB, dan akses akun OSS', 'Company data, NIB, and OSS account access'),
      B('KBLI dan uraian kegiatan usaha', 'KBLI code and business activity description'),
      B('Kapasitas produksi, bahan baku, dan alur proses', 'Production capacity, raw materials, and process flow'),
      B('Site plan atau layout serta luas lahan dan bangunan', 'Site plan or layout, plus land and building area'),
      B('Bukti kesesuaian tata ruang (KKPR)', 'Spatial planning conformity (KKPR)'),
      B('Data utilitas: sumber air, energi, dan limbah yang dihasilkan', 'Utility data: water source, energy, and waste generated'),
    ],
    steps: [
      { t: B('Konsultasi & penapisan', 'Consultation & screening'), d: B('Menentukan jenis dokumen dan ruang lingkup kerja.', 'Defining the document type and scope of work.') },
      { t: B('Survei & data', 'Survey & data'), d: B('Peninjauan lokasi dan pengumpulan data kegiatan.', 'Site visit and activity data collection.') },
      { t: B('Penyusunan dokumen', 'Document preparation'), d: B('Formulir UKL-UPL atau SPPL beserta lampirannya.', 'UKL-UPL form or SPPL with attachments.') },
      { t: B('Pengajuan & pemeriksaan', 'Submission & review'), d: B('Pengajuan ke instansi berwenang dan tanggapan pemeriksaan.', 'Submission to the authority and responses to the review.') },
      { t: B('Persetujuan terbit', 'Approval issued'), d: B('Perbaikan akhir hingga persetujuan diterbitkan.', 'Final revisions until the approval is issued.') },
    ],
    faq: [
      {
        q: B('Apa beda UKL-UPL dan SPPL?', 'What is the difference between UKL-UPL and SPPL?'),
        a: B(
          'UKL-UPL disusun untuk kegiatan yang berdampak namun tidak wajib AMDAL. Isinya rencana pengelolaan dan pemantauan lingkungan, diperiksa instansi lingkungan hidup, lalu diterbitkan PKPLH. SPPL adalah pernyataan kesanggupan untuk kegiatan berdampak kecil dan umumnya diproses melalui OSS.',
          'A UKL-UPL is prepared for activities with environmental impacts that do not require an AMDAL. It sets out environmental management and monitoring plans, is reviewed by the environmental authority, and results in a PKPLH. An SPPL is a statement of commitment for low-impact activities and is generally processed through OSS.',
        ),
      },
      {
        q: B('Bagaimana mengetahui usaha saya wajib UKL-UPL atau SPPL?', 'How do I know whether my business needs a UKL-UPL or an SPPL?'),
        a: B(
          'Melalui penapisan: KBLI, skala atau kapasitas, luas lahan dan bangunan, serta lokasi dibandingkan dengan daftar dalam Permen LHK 4 Tahun 2021. Kirimkan data dasar usaha Anda dan kami bantu memeriksanya.',
          'Through screening: the KBLI code, scale or capacity, land and building area, and location are compared against the list in Ministerial Regulation 4/2021. Send us your basic business data and we will help check it.',
        ),
      },
      {
        q: B('Berapa lama dan berapa biaya penyusunan UKL-UPL?', 'How long does a UKL-UPL take and how much does it cost?'),
        a: B(
          'Bergantung pada skala kegiatan, kelengkapan data, kebutuhan Persetujuan Teknis, dan instansi yang berwenang. Setelah penapisan, kami sampaikan ruang lingkup kerja, jadwal, dan penawaran biaya secara tertulis.',
          'It depends on the activity scale, data completeness, technical approval needs, and the competent authority. After screening, we provide the scope of work, schedule, and a written fee proposal.',
        ),
      },
      {
        q: B('Usaha saya sudah berjalan tetapi belum punya dokumen lingkungan. Bagaimana?', 'My business is already operating without an environmental document. What now?'),
        a: B(
          'Untuk kegiatan yang sudah beroperasi tanpa dokumen lingkungan, mekanismenya melalui DPLH (setara UKL-UPL) atau DELH (setara AMDAL). Kami bantu menilai mana yang berlaku untuk usaha Anda.',
          'For activities already operating without an environmental document, the route is a DPLH (UKL-UPL level) or a DELH (AMDAL level). We can help assess which applies to your business.',
        ),
      },
    ],
    articleKeywords: ['ukl-upl', 'ukl upl', 'sppl', 'penapisan'],
  },
  {
    slug: 'amdal-delh-dplh',
    short: B('AMDAL, DELH & DPLH', 'AMDAL, DELH & DPLH'),
    title: B('Konsultan AMDAL, DELH & DPLH', 'AMDAL, DELH & DPLH Consultant'),
    metaTitle: B('Konsultan AMDAL Jawa Timur, DELH & DPLH', 'AMDAL Consultant in East Java, DELH & DPLH'),
    metaDesc: B(
      'Penyusunan AMDAL (KA, ANDAL, RKL-RPL), DELH, dan DPLH untuk kegiatan di Sidoarjo, Surabaya, Gresik, dan Jawa Timur. Pendampingan dari pelingkupan sampai SKKLH.',
      'Preparation of AMDAL (ToR, ANDAL, RKL-RPL), DELH, and DPLH for activities in Sidoarjo, Surabaya, Gresik, and East Java. Support from scoping through to the SKKLH.',
    ),
    sub: B(
      'Pendampingan AMDAL untuk rencana kegiatan berdampak penting, serta DELH dan DPLH untuk kegiatan yang sudah berjalan namun belum memiliki dokumen lingkungan.',
      'AMDAL support for planned activities with significant impacts, plus DELH and DPLH for activities already operating without an environmental document.',
    ),
    photo: '/photos/1783393208952-5cf06f930c42.jpg',
    serviceType: 'Penyusunan AMDAL, DELH, dan DPLH',
    waTopic: 'AMDAL / DELH / DPLH',
    who: {
      title: B('Kapan AMDAL, DELH, atau DPLH dibutuhkan?', 'When is an AMDAL, DELH, or DPLH needed?'),
      items: [
        B('Rencana kegiatan yang termasuk daftar wajib AMDAL menurut Permen LHK 4 Tahun 2021 karena skala atau jenisnya berpotensi menimbulkan dampak penting.', 'Planned activities on the mandatory AMDAL list under Ministerial Regulation 4/2021 because their scale or type may cause significant impacts.'),
        B('Kegiatan yang berlokasi di dalam atau berbatasan dengan kawasan lindung atau kawasan sensitif lainnya.', 'Activities located in or adjacent to protected or otherwise sensitive areas.'),
        B('Kegiatan yang sudah berjalan namun belum memiliki dokumen lingkungan: DELH (setara AMDAL) atau DPLH (setara UKL-UPL).', 'Activities already operating without an environmental document: DELH (AMDAL level) or DPLH (UKL-UPL level).'),
        B('Perluasan atau perubahan kegiatan yang memerlukan perubahan persetujuan lingkungan.', 'Expansions or changes that require the environmental approval to be amended.'),
      ],
    },
    scope: [
      { t: B('Penapisan & pelingkupan', 'Screening & scoping'), d: B('Memastikan kewajiban AMDAL serta menentukan dampak penting hipotetik dan batas wilayah studi.', 'Confirming the AMDAL obligation, hypothetical significant impacts, and study boundaries.') },
      { t: B('Pengumuman & konsultasi publik', 'Public announcement & consultation'), d: B('Pendampingan pengumuman rencana kegiatan dan konsultasi dengan masyarakat terdampak.', 'Support for announcing the planned activity and consulting affected communities.') },
      { t: B('Penyusunan KA, ANDAL & RKL-RPL', 'ToR, ANDAL & RKL-RPL'), d: B('Data primer dan sekunder, prakiraan dan evaluasi dampak, serta rencana pengelolaan dan pemantauan.', 'Primary and secondary data, impact prediction and evaluation, and management and monitoring plans.') },
      { t: B('Uji kelayakan', 'Feasibility review'), d: B('Pendampingan pemeriksaan, rapat Tim Uji Kelayakan, dan perbaikan sampai SKKLH diterbitkan.', 'Support through review, Feasibility Test Team meetings, and revisions until the SKKLH is issued.') },
      { t: B('DELH & DPLH', 'DELH & DPLH'), d: B('Evaluasi kondisi lingkungan kegiatan yang sudah berjalan beserta rencana pengelolaan dan pemantauannya.', 'Evaluating the environmental condition of operating activities along with management and monitoring plans.') },
      { t: B('Pelaporan RKL-RPL', 'RKL-RPL reporting'), d: B('Penyusunan laporan pelaksanaan RKL-RPL secara berkala setelah persetujuan terbit.', 'Periodic RKL-RPL implementation reports after approval.') },
    ],
    prep: [
      B('Deskripsi rencana kegiatan, kapasitas, dan tahapannya', 'Description of the planned activity, capacity, and phases'),
      B('Site plan, layout, dan peta lokasi', 'Site plan, layout, and location map'),
      B('Bukti kesesuaian tata ruang (KKPR)', 'Spatial planning conformity (KKPR)'),
      B('Data proses, bahan baku, utilitas, dan limbah', 'Process, raw material, utility, and waste data'),
      B('Izin dan dokumen yang sudah dimiliki (untuk DELH/DPLH)', 'Existing permits and documents (for DELH/DPLH)'),
      B('Kontak penanggung jawab untuk koordinasi konsultasi publik', 'A contact person to coordinate public consultation'),
    ],
    steps: [
      { t: B('Penapisan & pelingkupan', 'Screening & scoping'), d: B('Menetapkan kewajiban dan batas kajian.', 'Defining obligations and study boundaries.') },
      { t: B('Konsultasi publik', 'Public consultation'), d: B('Pengumuman dan penyerapan aspirasi masyarakat.', 'Announcement and gathering community input.') },
      { t: B('KA, ANDAL & RKL-RPL', 'ToR, ANDAL & RKL-RPL'), d: B('Kajian lapangan dan penyusunan dokumen.', 'Field study and document preparation.') },
      { t: B('Uji kelayakan', 'Feasibility review'), d: B('Rapat penilaian dan perbaikan dokumen.', 'Assessment meetings and document revisions.') },
      { t: B('SKKLH terbit', 'SKKLH issued'), d: B('Keputusan kelayakan lingkungan hidup diterbitkan.', 'The environmental feasibility decision is issued.') },
    ],
    faq: [
      {
        q: B('Apa saja isi dokumen AMDAL?', 'What does an AMDAL consist of?'),
        a: B(
          'AMDAL terdiri dari Kerangka Acuan (KA), ANDAL (Analisis Dampak Lingkungan Hidup), dan RKL-RPL (Rencana Pengelolaan dan Pemantauan Lingkungan Hidup). Hasil penilaiannya adalah Surat Keputusan Kelayakan Lingkungan Hidup (SKKLH).',
          'An AMDAL consists of the Terms of Reference (KA), the ANDAL (environmental impact analysis), and the RKL-RPL (environmental management and monitoring plans). The outcome of the assessment is an Environmental Feasibility Decree (SKKLH).',
        ),
      },
      {
        q: B('Apa itu DELH dan DPLH?', 'What are DELH and DPLH?'),
        a: B(
          'DELH (Dokumen Evaluasi Lingkungan Hidup) dan DPLH (Dokumen Pengelolaan Lingkungan Hidup) adalah dokumen bagi usaha yang sudah berjalan namun belum memiliki dokumen lingkungan. DELH untuk kegiatan yang seharusnya wajib AMDAL, DPLH untuk kegiatan yang seharusnya wajib UKL-UPL.',
          'DELH (environmental evaluation document) and DPLH (environmental management document) are for businesses already operating without an environmental document. DELH applies to activities that should have had an AMDAL; DPLH to those that should have had a UKL-UPL.',
        ),
      },
      {
        q: B('Berapa lama proses AMDAL?', 'How long does the AMDAL process take?'),
        a: B(
          'Lebih panjang dibanding UKL-UPL karena melibatkan konsultasi publik, pengambilan data lapangan, dan rapat uji kelayakan. Jadwalnya bergantung pada skala kegiatan dan kelengkapan data; kami menyusun jadwal kerja setelah pelingkupan.',
          'Longer than a UKL-UPL, as it involves public consultation, field data collection, and feasibility review meetings. The schedule depends on activity scale and data completeness; we prepare a work plan after scoping.',
        ),
      },
      {
        q: B('Kegiatan saya hanya perluasan. Apakah perlu AMDAL baru?', 'My activity is only expanding. Do I need a new AMDAL?'),
        a: B(
          'Perubahan kegiatan dapat memerlukan perubahan persetujuan lingkungan, misalnya melalui adendum ANDAL dan RKL-RPL, tergantung besar perubahannya. Kami bantu menelaah dokumen yang sudah Anda miliki.',
          'Changes may require an amended environmental approval, for example through an ANDAL and RKL-RPL addendum, depending on the extent of the change. We can review your existing documents.',
        ),
      },
    ],
    articleKeywords: ['amdal', 'delh', 'dplh', 'rkl-rpl', 'penapisan'],
  },
  {
    slug: 'persetujuan-teknis-slo',
    short: B('Persetujuan Teknis & SLO', 'Technical Approval & SLO'),
    title: B('Persetujuan Teknis & SLO Air Limbah dan Emisi', 'Technical Approval & SLO for Wastewater and Emissions'),
    metaTitle: B('Jasa Pertek Air Limbah, Emisi & SLO IPAL', 'Wastewater & Emission Technical Approval and SLO'),
    metaDesc: B(
      'Kajian Persetujuan Teknis baku mutu air limbah dan emisi, perencanaan IPAL, serta pendampingan Surat Kelayakan Operasional (SLO). Melayani Sidoarjo, Surabaya, Gresik.',
      'Technical approval studies for wastewater and emission standards, WWTP planning, and Operational Feasibility Letter (SLO) support. Serving Sidoarjo, Surabaya, Gresik.',
    ),
    sub: B(
      'Kajian teknis agar air limbah dan emisi memenuhi baku mutu, perencanaan IPAL, dan pendampingan Surat Kelayakan Operasional (SLO) setelah fasilitas siap beroperasi.',
      'Technical studies so wastewater and emissions meet quality standards, WWTP planning, and support for the Operational Feasibility Letter (SLO) once facilities are ready.',
    ),
    photo: '/photos/1622322977767-2c71d1787205.jpg',
    serviceType: 'Persetujuan Teknis air limbah dan emisi serta Surat Kelayakan Operasional (SLO)',
    waTopic: 'Persetujuan Teknis / SLO',
    who: {
      title: B('Kapan Persetujuan Teknis dan SLO dibutuhkan?', 'When are a Technical Approval and SLO needed?'),
      items: [
        B('Usaha yang membuang air limbah ke badan air atau laut, atau memanfaatkannya ke tanah, membutuhkan Persetujuan Teknis pemenuhan baku mutu air limbah.', 'Businesses discharging wastewater to water bodies or the sea, or applying it to land, need a technical approval for wastewater quality standards.'),
        B('Usaha dengan sumber emisi tidak bergerak, misalnya boiler atau cerobong proses, membutuhkan Persetujuan Teknis pemenuhan baku mutu emisi.', 'Businesses with stationary emission sources, such as boilers or process stacks, need a technical approval for emission standards.'),
        B('Persetujuan Teknis menjadi bagian dari proses AMDAL atau UKL-UPL, sehingga perlu disiapkan sebelum dokumen lingkungan dinilai.', 'Technical approvals are part of the AMDAL or UKL-UPL process, so they must be prepared before the environmental document is assessed.'),
        B('Setelah IPAL atau sistem pengendali emisi dibangun dan diuji, SLO diperlukan sebagai bukti fasilitas layak beroperasi.', 'Once the WWTP or emission control system is built and tested, an SLO is needed as proof the facility is fit to operate.'),
      ],
    },
    scope: [
      { t: B('Kajian teknis air limbah', 'Wastewater technical study'), d: B('Karakteristik dan debit air limbah, sistem pengolahan, titik penaatan, dan pemantauan baku mutu air limbah (BMAL).', 'Wastewater characteristics and flow, treatment system, compliance points, and wastewater quality monitoring.') },
      { t: B('Kajian teknis emisi', 'Emission technical study'), d: B('Inventarisasi sumber emisi, sistem pengendalian, cerobong, dan rencana pemantauan baku mutu emisi.', 'Emission source inventory, control systems, stacks, and an emission monitoring plan.') },
      { t: B('Perencanaan & konstruksi IPAL', 'WWTP planning & construction'), d: B('Konsep sistem sesuai karakteristik limbah dan kapasitas, sampai konstruksi bangunan sipil.', 'System concept matched to waste characteristics and capacity, through to civil construction.') },
      { t: B('Pendampingan SLO', 'SLO support'), d: B('Penyiapan data uji coba, hasil uji laboratorium, dan dokumen pendukung pengajuan SLO.', 'Preparing trial-run data, laboratory results, and supporting documents for the SLO application.') },
      { t: B('Integrasi dokumen lingkungan', 'Environmental document alignment'), d: B('Menyelaraskan Persetujuan Teknis dengan AMDAL atau UKL-UPL agar tidak terjadi revisi berulang.', 'Aligning the technical approval with the AMDAL or UKL-UPL to avoid repeated revisions.') },
      { t: B('Pemantauan berkala', 'Periodic monitoring'), d: B('Pendampingan pemantauan dan pelaporan baku mutu setelah fasilitas beroperasi.', 'Support for monitoring and reporting against standards once facilities operate.') },
    ],
    prep: [
      B('Neraca air dan debit air limbah', 'Water balance and wastewater flow'),
      B('Data proses produksi dan bahan kimia yang digunakan', 'Production process and chemicals used'),
      B('Hasil uji laboratorium air limbah atau emisi (jika ada)', 'Wastewater or emission lab results (if available)'),
      B('Layout IPAL, saluran, outlet, dan titik pembuangan', 'WWTP layout, channels, outlets, and discharge points'),
      B('Data sumber emisi: bahan bakar, kapasitas, jam operasi, dimensi cerobong', 'Emission source data: fuel, capacity, operating hours, stack dimensions'),
      B('Dokumen lingkungan dan izin yang sudah dimiliki', 'Existing environmental documents and permits'),
    ],
    steps: [
      { t: B('Identifikasi kebutuhan', 'Needs assessment'), d: B('Menentukan jenis Persetujuan Teknis yang diperlukan.', 'Determining which technical approvals are needed.') },
      { t: B('Kajian & perencanaan', 'Study & planning'), d: B('Kajian teknis dan desain sistem pengolahan.', 'Technical study and treatment system design.') },
      { t: B('Pengajuan Pertek', 'Technical approval'), d: B('Pengajuan, pemeriksaan, dan perbaikan.', 'Submission, review, and revisions.') },
      { t: B('Pembangunan fasilitas', 'Facility construction'), d: B('Pembangunan atau penyesuaian IPAL dan pengendali emisi.', 'Building or upgrading the WWTP and emission controls.') },
      { t: B('Uji coba & SLO', 'Trial run & SLO'), d: B('Uji coba operasi lalu pengajuan SLO.', 'Trial operation followed by the SLO application.') },
    ],
    faq: [
      {
        q: B('Apa itu Persetujuan Teknis (Pertek)?', 'What is a Technical Approval (Pertek)?'),
        a: B(
          'Persetujuan Teknis adalah persetujuan pemerintah yang memuat standar perlindungan dan pengelolaan lingkungan yang wajib dipenuhi, misalnya baku mutu air limbah atau emisi. Tata caranya diatur dalam Permen LHK 5 Tahun 2021.',
          'A technical approval is a government approval setting out the environmental protection standards that must be met, such as wastewater or emission quality standards. The procedure is set out in Ministerial Regulation 5/2021.',
        ),
      },
      {
        q: B('Apa beda Pertek dan SLO?', 'What is the difference between a Pertek and an SLO?'),
        a: B(
          'Pertek diperoleh di tahap perencanaan sebagai dasar desain dan standar yang harus dipenuhi. SLO diterbitkan setelah fasilitas dibangun dan hasil uji coba menunjukkan baku mutu terpenuhi, sebagai tanda fasilitas layak beroperasi.',
          'A Pertek is obtained at the planning stage as the basis for design and the standards to meet. An SLO is issued after the facility is built and trial results show the standards are met, confirming it is fit to operate.',
        ),
      },
      {
        q: B('Air limbah kami disalurkan ke IPAL kawasan industri. Apakah tetap perlu Pertek?', 'Our wastewater goes to an industrial estate WWTP. Do we still need a Pertek?'),
        a: B(
          'Kewajibannya bergantung pada skema pengelolaan di kawasan dan perjanjian dengan pengelola IPAL terpusat. Kami bantu menelaahnya berdasarkan dokumen kawasan dan kegiatan Anda.',
          'It depends on the estate’s management scheme and your agreement with the central WWTP operator. We can review it based on the estate documents and your activity.',
        ),
      },
      {
        q: B('Apakah ERI juga bisa membangun IPAL?', 'Can ERI also build the WWTP?'),
        a: B(
          'Ya. Selain kajian dan perizinan, kami menangani perencanaan sistem dan konstruksi bangunan sipil prasarana pengolahan limbah.',
          'Yes. Beyond studies and permitting, we handle system planning and civil construction of waste treatment infrastructure.',
        ),
      },
    ],
    articleKeywords: ['persetujuan teknis', 'pertek', 'slo', 'air limbah', 'emisi', 'ipal'],
  },
  {
    slug: 'rincian-teknis-limbah-b3',
    short: B('Rincian Teknis Limbah B3', 'Hazardous Waste Technical Details'),
    title: B('Rincian Teknis Penyimpanan Limbah B3', 'Hazardous (B3) Waste Storage Technical Details'),
    metaTitle: B('Jasa Rincian Teknis (Rintek) Limbah B3', 'Hazardous Waste (B3) Storage Technical Details'),
    metaDesc: B(
      'Penyusunan Rincian Teknis Penyimpanan Limbah B3 untuk TPS limbah B3 pabrik dan usaha di Sidoarjo, Surabaya, Gresik: identifikasi limbah, desain TPS, SOP, dan pengajuan.',
      'Preparation of hazardous waste storage technical details for factory and business storage facilities in Sidoarjo, Surabaya, Gresik: waste identification, storage design, SOPs, and submission.',
    ),
    sub: B(
      'Kami menyusun Rincian Teknis Penyimpanan Limbah B3 untuk tempat penyimpanan sementara (TPS) di lokasi usaha Anda, dari identifikasi limbah sampai pendampingan pengajuan.',
      'We prepare hazardous waste storage technical details for the temporary storage facility (TPS) at your site, from waste identification to submission support.',
    ),
    photo: '/photos/1586528116311-ad8dd3c8310d.jpg',
    serviceType: 'Penyusunan Rincian Teknis Penyimpanan Limbah B3',
    waTopic: 'Rincian Teknis Limbah B3',
    who: {
      title: B('Siapa yang membutuhkan Rincian Teknis Limbah B3?', 'Who needs hazardous waste storage technical details?'),
      items: [
        B('Usaha yang menghasilkan limbah B3, misalnya oli bekas, aki bekas, kemasan bahan kimia, lampu TL, majun terkontaminasi, atau sludge tertentu.', 'Businesses generating hazardous waste, such as used oil, used batteries, chemical packaging, fluorescent lamps, contaminated rags, or certain sludges.'),
        B('Penghasil limbah B3 yang menyimpan limbahnya sementara sebelum diserahkan ke pihak berizin.', 'Hazardous waste generators that store waste temporarily before handing it to licensed parties.'),
        B('Usaha yang sedang menyusun AMDAL atau UKL-UPL, karena rincian teknis penyimpanan limbah B3 dimuat dalam persetujuan lingkungan.', 'Businesses preparing an AMDAL or UKL-UPL, as hazardous waste storage technical details are included in the environmental approval.'),
        B('TPS limbah B3 baru, pindah lokasi, atau ada perubahan jenis dan jumlah limbah.', 'A new, relocated, or changed TPS, or changes in waste types and quantities.'),
      ],
    },
    scope: [
      { t: B('Identifikasi & inventarisasi', 'Identification & inventory'), d: B('Jenis, kode, karakteristik, dan perkiraan timbulan limbah B3 dari setiap proses.', 'Type, code, characteristics, and estimated generation of hazardous waste from each process.') },
      { t: B('Desain & kelayakan TPS', 'TPS design & suitability'), d: B('Lokasi, konstruksi bangunan, ventilasi, saluran dan bak penampung ceceran, serta pemisahan limbah.', 'Location, construction, ventilation, spill channels and sumps, and waste segregation.') },
      { t: B('Kemasan, simbol & label', 'Packaging, symbols & labels'), d: B('Ketentuan kemasan dan penandaan sesuai karakteristik limbah B3.', 'Packaging and marking requirements based on waste characteristics.') },
      { t: B('SOP & logbook', 'SOPs & logbook'), d: B('Prosedur penyimpanan dan tanggap darurat, serta pencatatan neraca dan logbook limbah B3.', 'Storage and emergency procedures, plus hazardous waste balance and logbook records.') },
      { t: B('Penyusunan dokumen', 'Document preparation'), d: B('Rincian teknis disusun dan diselaraskan dengan dokumen lingkungan usaha Anda.', 'Technical details prepared and aligned with your environmental documents.') },
      { t: B('Pendampingan pengajuan', 'Submission support'), d: B('Pengajuan, verifikasi, dan perbaikan sampai rincian teknis disetujui.', 'Submission, verification, and revisions until the technical details are approved.') },
    ],
    prep: [
      B('Daftar proses produksi dan bahan yang digunakan', 'Production processes and materials used'),
      B('Jenis dan perkiraan jumlah limbah B3 per bulan', 'Types and estimated monthly quantities of hazardous waste'),
      B('Kondisi atau rencana TPS: lokasi, ukuran, dan foto', 'Existing or planned TPS: location, size, and photos'),
      B('Layout area pabrik', 'Site layout'),
      B('Dokumen lingkungan yang sudah dimiliki', 'Existing environmental documents'),
      B('Kontrak dengan pengangkut atau pengolah limbah B3 berizin (jika ada)', 'Contracts with licensed hazardous waste transporters or processors (if any)'),
    ],
    steps: [
      { t: B('Survei & identifikasi', 'Survey & identification'), d: B('Peninjauan proses dan sumber limbah B3.', 'Reviewing processes and hazardous waste sources.') },
      { t: B('Evaluasi TPS', 'TPS evaluation'), d: B('Penilaian atau desain tempat penyimpanan.', 'Assessing or designing the storage facility.') },
      { t: B('Rincian teknis & SOP', 'Technical details & SOPs'), d: B('Penyusunan dokumen dan prosedur.', 'Preparing documents and procedures.') },
      { t: B('Pengajuan & verifikasi', 'Submission & verification'), d: B('Pengajuan dan tanggapan verifikasi.', 'Submission and responses to verification.') },
      { t: B('Penerapan', 'Implementation'), d: B('Penerapan SOP dan pencatatan di lapangan.', 'Applying SOPs and record-keeping on site.') },
    ],
    faq: [
      {
        q: B('Apa itu Rincian Teknis Penyimpanan Limbah B3?', 'What are hazardous waste storage technical details?'),
        a: B(
          'Dokumen yang memuat ketentuan teknis penyimpanan limbah B3 di lokasi penghasil: jenis dan jumlah limbah, lokasi dan desain TPS, kemasan, simbol dan label, serta prosedur pengelolaannya. Ketentuannya mengacu pada PP 22 Tahun 2021 dan Permen LHK 6 Tahun 2021.',
          'A document setting out the technical requirements for storing hazardous waste at the generator’s site: waste types and quantities, TPS location and design, packaging, symbols and labels, and handling procedures. It refers to Government Regulation 22/2021 and Ministerial Regulation 6/2021.',
        ),
      },
      {
        q: B('Berapa lama limbah B3 boleh disimpan di TPS?', 'How long can hazardous waste be stored at the TPS?'),
        a: B(
          'Batas waktu penyimpanan bergantung pada jumlah timbulan per hari dan kategori limbahnya. Batas yang berlaku untuk usaha Anda kami tuangkan dalam rincian teknis dan SOP agar mudah dipatuhi.',
          'The storage time limit depends on daily generation and the waste category. We set out the limits that apply to your business in the technical details and SOPs so they are easy to follow.',
        ),
      },
      {
        q: B('Apakah usaha kecil juga wajib mengelola limbah B3?', 'Do small businesses also have to manage hazardous waste?'),
        a: B(
          'Kewajiban pengelolaan limbah B3 berlaku bagi setiap penghasil limbah B3, termasuk usaha kecil, dengan ketentuan penyimpanan yang disesuaikan dengan jumlah timbulannya.',
          'Hazardous waste obligations apply to every generator, including small businesses, with storage requirements scaled to the quantity generated.',
        ),
      },
      {
        q: B('Apakah ERI juga mengangkut limbah B3?', 'Does ERI also transport hazardous waste?'),
        a: B(
          'Tidak. Kami berfokus pada rincian teknis, desain TPS, dan pendampingan kepatuhan. Pengangkutan dan pengolahan dilakukan oleh pihak yang memiliki izin khusus.',
          'No. We focus on technical details, TPS design, and compliance support. Transport and treatment are carried out by specially licensed parties.',
        ),
      },
    ],
    notice: B(
      'ERI menyusun dokumen dan mendampingi penyimpanan limbah B3 di lokasi Anda. Pengangkutan, pemanfaatan, dan pengolahan limbah B3 dilakukan oleh pihak yang memiliki izin khusus.',
      'ERI prepares documents and supports on-site hazardous waste storage. Transport, utilisation, and treatment of hazardous waste are carried out by specially licensed parties.',
    ),
    articleKeywords: ['limbah b3', 'rincian teknis', 'rintek', 'tps'],
  },
];

// ── Ikon garis (24×24, dirender via <Icon>) ──
export const ICONS = {
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16l4-5 3 3 5-6"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 11a3 3 0 1 0 0-6M21 20a6 6 0 0 0-4-5.6"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 2.5h6v3H9zM9 13l2 2 4-4"/>',
  droplet: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9 14a3 3 0 0 0 3 3"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6 11a3.5 3.5 0 0 0 1 7z"/>',
  build: '<path d="M3 21h18M5 21V10l7-5 7 5v11"/><path d="M9 21v-6h6v6"/>',
  box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11M9 8h6"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
} as const;
type IconKey = keyof typeof ICONS;

// ── Foto & elemen visual per layanan (foto di public/photos/, Unsplash) ──
type Media = {
  heroAlt: L;
  side: string; // foto di samping "Kapan dibutuhkan"
  sideAlt: L;
  band: string; // pita foto lebar
  bandAlt: L;
  bandText: L;
  icons: IconKey[]; // per item scope, urut sama
};

const MEDIA: Record<ServiceSlug, Media> = {
  'ukl-upl-sppl': {
    heroAlt: B('Bangunan pabrik dan gudang industri', 'Factory and industrial warehouse building'),
    side: '/photos/1581094481644-f2ab64522498.jpg',
    sideAlt: B('Tim lapangan berdiskusi saat survei lokasi', 'Field team discussing during a site survey'),
    band: '/photos/1622322977879-af6982dcba00.jpg',
    bandAlt: B('Foto udara instalasi pengolahan air limbah', 'Aerial view of a wastewater treatment plant'),
    bandText: B('Dokumen yang tepat sejak awal menghemat waktu perizinan.', 'The right document from the start saves permitting time.'),
    icons: ['search', 'pin', 'doc', 'link', 'shield', 'chart'],
  },
  'amdal-delh-dplh': {
    heroAlt: B('Foto udara kawasan pengolahan di tengah perbukitan hijau', 'Aerial view of a treatment facility among green hills'),
    side: '/photos/1622322977875-e2d580e129ba.jpg',
    sideAlt: B('Foto udara permukiman di sekitar instalasi pengolahan', 'Aerial view of homes next to a treatment facility'),
    band: '/photos/1774789599304-cca1e1ffbb95.jpg',
    bandAlt: B('Foto udara instalasi pengolahan air limbah dan lahan sekitarnya', 'Aerial view of a wastewater plant and surrounding land'),
    bandText: B('Kajian dampak yang teliti, dari data lapangan hingga uji kelayakan.', 'Careful impact studies, from field data to feasibility review.'),
    icons: ['search', 'people', 'layers', 'shield', 'clipboard', 'chart'],
  },
  'persetujuan-teknis-slo': {
    heroAlt: B('Bak pengendap instalasi pengolahan air limbah dari udara', 'Aerial view of a wastewater clarifier'),
    side: '/photos/1617155093730-a8bf47be792d.jpg',
    sideAlt: B('Sampel air limbah dalam gelas ukur laboratorium', 'Wastewater sample in a laboratory beaker'),
    band: '/photos/1705147219565-fe9f6f369d03.jpg',
    bandAlt: B('Unit pengendali emisi pada bangunan industri', 'Emission control units on an industrial building'),
    bandText: B('Dari kajian baku mutu dan desain IPAL hingga fasilitas layak beroperasi.', 'From quality standard studies and WWTP design to a facility fit to operate.'),
    icons: ['droplet', 'cloud', 'build', 'clipboard', 'link', 'chart'],
  },
  'rincian-teknis-limbah-b3': {
    heroAlt: B('Area penyimpanan barang di dalam gudang', 'Storage area inside a warehouse'),
    side: '/photos/1504917595217-d4dc5ebe6122.jpg',
    sideAlt: B('Pekerjaan logam di area produksi', 'Metalwork in a production area'),
    band: '/photos/1711304548487-4950020f4d62.jpg',
    bandAlt: B('Bangunan pabrik dengan cerobong', 'Factory building with a stack'),
    bandText: B('Limbah B3 tersimpan aman, tercatat rapi, dan siap diverifikasi.', 'Hazardous waste stored safely, recorded properly, and ready for verification.'),
    icons: ['search', 'box', 'tag', 'book', 'doc', 'upload'],
  },
};

export const SERVICE_SLUGS = SERVICES.map((s) => s.slug);

// Kartu layanan di beranda/halaman layanan → halaman detail (urutan = svc.docs / svc.tech di site.ts).
export const DOC_LINKS: (ServiceSlug | null)[] = ['ukl-upl-sppl', 'amdal-delh-dplh', null, null, 'rincian-teknis-limbah-b3', null];
export const TECH_LINKS: (ServiceSlug | null)[] = ['persetujuan-teknis-slo', 'persetujuan-teknis-slo', 'persetujuan-teknis-slo', null, null, null];

type Resolved<T> = T extends L ? string : T extends (infer U)[] ? Resolved<U>[] : T extends object ? { [K in keyof T]: Resolved<T[K]> } : T;

function pick<T>(node: T, l: Locale): Resolved<T> {
  if (Array.isArray(node)) return node.map((x) => pick(x, l)) as Resolved<T>;
  if (node && typeof node === 'object') {
    const o = node as Record<string, unknown>;
    if (Object.keys(o).length === 2 && 'id' in o && 'en' in o) return o[l] as Resolved<T>;
    return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, pick(v, l)])) as Resolved<T>;
  }
  return node as Resolved<T>;
}

export type Service = Resolved<ServiceDef> & { media: Resolved<Media> };

const resolve = (s: ServiceDef, l: Locale): Service => ({ ...pick(s, l), media: pick(MEDIA[s.slug], l) });

export function getService(slug: string, l: Locale): Service | undefined {
  const s = SERVICES.find((x) => x.slug === slug);
  return s ? resolve(s, l) : undefined;
}

export function getServices(l: Locale): Service[] {
  return SERVICES.map((s) => resolve(s, l));
}
