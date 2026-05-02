// lib/archive-template.ts
// Generates a self-contained, framework-free index.html for the archive ZIP.
// This file is server-only — it embeds all content inline so the HTML works
// with no internet connection, no Vercel, and no Next.js, forever.
import 'server-only'
import type { Person, Photo, Video, Audio, Collection, Playlist } from './types'

interface ArchiveData {
  family: Person[]
  photos: Photo[]
  videos: Video[]
  audio: Audio[]
  collections: Collection[]
  playlists: Playlist[]
  exportedDate: string
}

export function generateArchiveHtml(data: ArchiveData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>The Curry Family Archive — exported ${data.exportedDate}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #1F2D5C; background: #FBF9F2; max-width: 1100px; margin: 0 auto; padding: 40px 24px; line-height: 1.6; }
  h1 { font-weight: 400; font-size: 36px; margin-bottom: 8px; }
  .meta { color: #6B6960; font-size: 14px; margin-bottom: 32px; letter-spacing: 0.05em; text-transform: uppercase; }
  nav { display: flex; gap: 24px; border-bottom: 1px solid #E2DFD5; padding-bottom: 12px; margin-bottom: 32px; flex-wrap: wrap; }
  nav button { font-family: inherit; background: none; border: none; cursor: pointer; color: #6B6960; padding: 6px 0; font-size: 14px; border-bottom: 2px solid transparent; }
  nav button.active { color: #1F2D5C; border-bottom-color: #E8A91F; }
  section { display: none; }
  section.active { display: block; }
  .item { padding: 16px 0; border-bottom: 1px solid #E2DFD5; }
  .item h3 { font-weight: 400; font-size: 22px; margin-bottom: 4px; }
  .item .label { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #B8851A; margin-bottom: 6px; }
  .item .field { font-size: 14px; color: #6B6960; margin: 4px 0; }
  .item .field b { color: #1F2D5C; font-weight: 500; }
  footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #E2DFD5; color: #8B8778; font-size: 12px; text-align: center; font-style: italic; }
</style>
</head>
<body>
  <h1>The Curry Family Archive</h1>
  <div class="meta">Exported ${data.exportedDate} · A private family archive</div>

  <nav>
    <button data-tab="family" class="active">Family (${data.family.length})</button>
    <button data-tab="photos">Photos (${data.photos.length})</button>
    <button data-tab="videos">Videos (${data.videos.length})</button>
    <button data-tab="audio">Audio (${data.audio.length})</button>
    <button data-tab="collections">Collections (${data.collections.length})</button>
    <button data-tab="playlists">Playlists (${data.playlists.length})</button>
  </nav>

  <script type="application/json" id="data-family">${JSON.stringify(data.family)}</script>
  <script type="application/json" id="data-photos">${JSON.stringify(data.photos)}</script>
  <script type="application/json" id="data-videos">${JSON.stringify(data.videos)}</script>
  <script type="application/json" id="data-audio">${JSON.stringify(data.audio)}</script>
  <script type="application/json" id="data-collections">${JSON.stringify(data.collections)}</script>
  <script type="application/json" id="data-playlists">${JSON.stringify(data.playlists)}</script>

  <section id="section-family" class="active"></section>
  <section id="section-photos"></section>
  <section id="section-videos"></section>
  <section id="section-audio"></section>
  <section id="section-collections"></section>
  <section id="section-playlists"></section>

  <footer>Held in trust for those who come after.</footer>

<script>
function load(id) { return JSON.parse(document.getElementById('data-' + id).textContent); }
function row(label, value) { return value ? '<div class="field"><b>' + label + ':</b> ' + value + '</div>' : ''; }
function renderFamily() {
  return load('family').map(function(p) {
    return '<div class="item"><div class="label">' + (p.relationLabel || '') + '</div><h3>' + p.name + '</h3>' + row('Dates', p.datesLabel) + row('Birthplace', p.birthplace || p.birthPlace) + row('Spouse', p.spouseLabel) + row('Bio', p.bio) + '</div>';
  }).join('');
}
function renderPhotos() {
  return load('photos').map(function(p) {
    return '<div class="item"><h3>' + (p.caption || p.id) + '</h3>' + row('Date', p.dateLabel) + row('File', p.filename) + row('Location', p.location) + row('In collections', (p.collectionIds || []).join(', ')) + '</div>';
  }).join('');
}
function renderVideos() {
  return load('videos').map(function(v) {
    return '<div class="item"><h3>' + v.title + '</h3>' + row('Date', v.dateLabel) + row('Source', v.source + ' / ' + v.sourceId) + row('Duration', v.duration) + row('In playlists', (v.playlistIds || []).join(', ')) + '</div>';
  }).join('');
}
function renderAudio() {
  return load('audio').map(function(a) {
    return '<div class="item"><h3>' + a.title + '</h3>' + row('Date', a.dateLabel) + row('File', a.filename) + row('Duration', a.duration) + row('Description', a.description) + '</div>';
  }).join('');
}
function renderCollections() {
  return load('collections').map(function(c) {
    return '<div class="item"><div class="label">Collection</div><h3>' + c.title + '</h3>' + row('Subtitle', c.subtitle) + row('Date', c.dateLabel) + row('Description', c.description) + '</div>';
  }).join('');
}
function renderPlaylists() {
  return load('playlists').map(function(p) {
    return '<div class="item"><div class="label">Playlist</div><h3>' + p.title + '</h3>' + row('Subtitle', p.subtitle) + row('Description', p.description) + '</div>';
  }).join('');
}
document.getElementById('section-family').innerHTML = renderFamily();
document.getElementById('section-photos').innerHTML = renderPhotos();
document.getElementById('section-videos').innerHTML = renderVideos();
document.getElementById('section-audio').innerHTML = renderAudio();
document.getElementById('section-collections').innerHTML = renderCollections();
document.getElementById('section-playlists').innerHTML = renderPlaylists();

document.querySelectorAll('nav button').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('nav button').forEach(function(b) { b.classList.remove('active'); });
    document.querySelectorAll('section').forEach(function(s) { s.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById('section-' + btn.dataset.tab).classList.add('active');
  });
});
</script>
</body>
</html>`
}
