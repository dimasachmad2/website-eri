// Membuat file import GTM (Admin → Import Container → Merge) untuk konversi ERI.
// Event dataLayer berasal dari src/components/ConversionTracker.tsx.
//
//   node infra/gtm/build-container.mjs                      → GA4 event + Conversion Linker
//   node infra/gtm/build-container.mjs wa=AbC form=XyZ tel=Qrs   → + tag konversi Google Ads
//
// Label = "Conversion Label" dari Google Ads (Goals → Conversions → Use Google Tag Manager).
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const GTM_PUBLIC_ID = 'GTM-55FBHKTQ';
const GA4_ID = 'G-PFQ0X92618';
const ADS_CONVERSION_ID = '18490272114';
const ALL_PAGES = '2147479553'; // trigger bawaan "All Pages"

const EVENTS = ['wa_click', 'contact_form_submit', 'phone_click', 'email_click', 'compro_download'];
const ADS = {
  wa: { event: 'wa_click', name: 'Klik WhatsApp' },
  form: { event: 'contact_form_submit', name: 'Kirim Form Kontak' },
  tel: { event: 'phone_click', name: 'Klik Telepon' },
  compro: { event: 'compro_download', name: 'Unduh Company Profile' },
};

const labels = Object.fromEntries(
  process.argv.slice(2).map((a) => a.split('=')).filter(([k, v]) => ADS[k] && v),
);

const base = { accountId: '0', containerId: '0' };
const tpl = (key, value) => ({ type: 'TEMPLATE', key, value });
const bool = (key, value) => ({ type: 'BOOLEAN', key, value: String(value) });

let nextId = 1;
const id = () => String(nextId++);

const variable = [
  { ...base, variableId: id(), name: 'DLV - cta_location', type: 'v',
    parameter: [{ type: 'INTEGER', key: 'dataLayerVersion', value: '2' }, bool('setDefaultValue', false), tpl('name', 'cta_location')] },
  { ...base, variableId: id(), name: 'DLV - link_url', type: 'v',
    parameter: [{ type: 'INTEGER', key: 'dataLayerVersion', value: '2' }, bool('setDefaultValue', false), tpl('name', 'link_url')] },
];

const trigger = [];
const customEvent = (name, value, regex = false) => {
  const t = { ...base, triggerId: id(), name, type: 'CUSTOM_EVENT',
    customEventFilter: [{ type: regex ? 'MATCH_REGEX' : 'EQUALS', parameter: [tpl('arg0', '{{_event}}'), tpl('arg1', value)] }] };
  trigger.push(t);
  return t.triggerId;
};

const allConversions = customEvent('CE - ERI konversi (semua)', `^(${EVENTS.join('|')})$`, true);

const tag = [
  { ...base, tagId: id(), name: 'Google Ads - Conversion Linker', type: 'gclidw',
    parameter: [bool('enableCrossDomain', false), bool('enableUrlPassthrough', false), bool('enableCookieOverrides', false)],
    firingTriggerId: [ALL_PAGES], tagFiringOption: 'ONCE_PER_EVENT' },
  { ...base, tagId: id(), name: 'GA4 - Event konversi ERI', type: 'gaawe',
    parameter: [
      bool('sendEcommerceData', false),
      tpl('eventName', '{{Event}}'),
      tpl('measurementIdOverride', GA4_ID),
      { type: 'LIST', key: 'eventSettingsTable', list: [
        { type: 'MAP', map: [tpl('parameter', 'cta_location'), tpl('parameterValue', '{{DLV - cta_location}}')] },
        { type: 'MAP', map: [tpl('parameter', 'link_url'), tpl('parameterValue', '{{DLV - link_url}}')] },
      ] },
    ],
    firingTriggerId: [allConversions], tagFiringOption: 'ONCE_PER_EVENT' },
];

for (const [key, label] of Object.entries(labels)) {
  const { event, name } = ADS[key];
  tag.push({ ...base, tagId: id(), name: `Google Ads - ${name}`, type: 'awct',
    parameter: [
      tpl('conversionId', ADS_CONVERSION_ID), tpl('conversionLabel', label),
      bool('enableConversionLinker', true), tpl('conversionCookiePrefix', '_gcl'),
      bool('enableNewCustomerReporting', false), bool('enableProductReporting', false),
      bool('enableEnhancedConversion', false), bool('enableShippingData', false), bool('rdp', false),
    ],
    firingTriggerId: [customEvent(`CE - ${event}`, event)], tagFiringOption: 'ONCE_PER_EVENT' });
}

const container = {
  exportFormatVersion: 2,
  exportTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
  containerVersion: {
    path: 'accounts/0/containers/0/versions/0', ...base, containerVersionId: '0',
    container: { path: 'accounts/0/containers/0', ...base, name: 'Enviro Resources Indonesia', publicId: GTM_PUBLIC_ID, usageContext: ['WEB'] },
    tag, trigger, variable,
    builtInVariable: [{ ...base, type: 'EVENT', name: 'Event' }],
  },
};

const out = fileURLToPath(new URL('./eri-conversions.json', import.meta.url));
writeFileSync(out, JSON.stringify(container, null, 2) + '\n');
console.log(`${out}\n  tag: ${tag.map((t) => t.name).join(', ')}`);
