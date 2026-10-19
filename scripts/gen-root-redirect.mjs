// Membuat out/index.html untuk mengarahkan root "/" ke /id/ (atau /en/ bila
// bahasa browser Inggris). Diperlukan karena mode export statis tidak menjalankan
// middleware next-intl yang biasanya menangani redirect locale di "/".
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="google-site-verification" content="4ayvO_n9NzqIeKdzJtV-q2oJh8mpKlazVqVjWUOFtAA">
<title>PT Enviro Resources Indonesia</title>
<script>
  (function () {
    var en = (navigator.language || 'id').toLowerCase().indexOf('en') === 0;
    // Pertahankan query (gclid/utm) & hash agar atribusi iklan tidak hilang.
    location.replace((en ? '/en/' : '/id/') + location.search + location.hash);
  })();
</script>
<meta http-equiv="refresh" content="0; url=/id/">
</head>
<body>
<p>Mengalihkan… <a href="/id/">Beranda</a> · <a href="/en/">Home</a></p>
</body>
</html>
`;

writeFileSync(join(process.cwd(), 'out', 'index.html'), html, 'utf8');
console.log('✓ out/index.html (root redirect) dibuat');
