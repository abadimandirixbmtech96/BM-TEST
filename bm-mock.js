(function (w) {
  'use strict';
  var KEY = 'bmtest-db-v1';
  var UID = '00000000-0000-4000-8000-000000000001';
  var EMAIL = 'uji@bmtech.test';

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  }
  function rid() { return 'r_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9); }
  function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
  function pick(a, i) { return a[i % a.length]; }

  var HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function judul(d) { return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + String(d.getFullYear()).slice(2) + ' · ' + HARI[d.getDay()] + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  function seed() {
    var now = new Date();
    var db = { folders: [], notes: [], trash_items: [], customers: [], karyawan: [], admin_roles: [{ user_id: UID, role: 'owner', aktif: true }], announcements: [], announcement_seen: [], login_log: [], shop_barang: [], shop_v_stok: [] };
    var F = [['BUKU BESAR', '#7C8A99', 'admin-data-v1'], ['BUKU HUTANG PIUTANG', '#D9A536', 'hutangpiutang-data-v1'], ['BUKU WARUNG', '#D9A536', 'warung-data-v1'], ['BUKU OPERASIONAL', '#D9A536', 'operasional-data-v1'], ['BUKU KASBON', '#D9A536', 'kasbon-data-v1']];
    var fid = {};
    F.forEach(function (f, i) {
      var id = uuid(); fid[f[2]] = id;
      var t = new Date(now.getTime() - (90 - i) * 864e5).toISOString();
      db.folders.push({ id: id, name: f[0], color: f[1], created_at: t, updated_at: t, owner_username: null, schema: null });
    });
    var PJ = ['Yono', 'Mail', 'Amin', 'Kuswanto', 'Yono x mail'];
    var CUS = ['Pak Joko', 'Rudi Motor', 'Bu Sari', 'Andi', 'Dedi Bengkel', 'Mas Eko', 'Hendra', 'Toko Jaya Motor', 'Bayu', 'Wawan', 'Pak Slamet', 'Rizal', 'Agus Racing', 'Bengkel Sinar', 'Pak Darto', 'Feri'];
    var BRG = ['Blok Mio 1', 'Head Vario 1', 'Kruk as Beat 1', 'Blok Blade 1, Head 1', 'Skir klep Supra 2', 'Blok RX-K 1', 'Korter Satria 1', 'Head Ninja 2', 'Bubut kruk Smash 1', 'Blok Jupiter Z 1', 'Askruk KPH 1', 'Blok Grand 2', 'Canteng 1', 'Blok Genio 1, Askruk 1'];
    var KEL = ['B&J', 'B&J', 'B&J', 'Tidak ada', 'Head', ''];
    var STK = ['Tidak ada', 'Tidak ada', 'Tidak ada', 'B&J', 'Blok', ''];
    var MET = ['cash', 'cash', 'transfer', 'cash', 'campur', ''];
    var HRG = [85000, 120000, 150000, 175000, 250000, 300000, 350000, 450000, 40000, 65000, 600000, 95000];
    var IMG = ['/dashboard-bm-tech.jpg', '/logo-login.jpg', '/background-admin.jpg'];
    var seq = 0;
    for (var d = 45; d >= 0; d--) {
      var day = new Date(now.getTime() - d * 864e5);
      if (day.getDay() === 0 && d % 3) continue;
      day.setHours(8, 10 + (d * 7) % 45, 0, 0);
      if (d === 0 && day > now) day = new Date(now.getTime() - 3600e3);
      var n = 6 + (d * 5) % 12;
      var recs = [];
      for (var i = 0; i < n; i++) {
        seq++;
        var t = new Date(day.getTime() + i * 37 * 60e3);
        if (t > now) t = new Date(now.getTime() - (n - i) * 60e3);
        var h = pick(HRG, seq * 3 + d);
        var met = pick(MET, seq + d);
        var r = { id: rid() + seq, pj: pick(PJ, seq + d), customer: pick(CUS, seq * 7 + d), barang: pick(BRG, seq * 5 + d), barangKeluar: pick(KEL, seq + i), stokBarang: pick(STK, seq * 2 + i), keterangan: seq % 4 === 0 ? 'Ambil sore' : (seq % 7 === 0 ? 'Bayar nanti' : ''), harga: seq % 9 === 0 ? '√' : h, created_at: t.toISOString(), bukti: seq % 3 === 0 ? [pick(IMG, seq)] : [] };
        if (met && d < 40) r.metode = met;
        if (met === 'campur') { r.bayarCash = Math.round(h / 2000) * 1000; r.bayarTransfer = h - r.bayarCash; }
        recs.push(r);
      }
      db.notes.push({ id: uuid(), folder_id: fid['admin-data-v1'], title: judul(day), preview: null, content: { schema: 'admin-data-v1', records: recs, trash: [], legacy: null }, amount: null, tx_category: null, date_tag: null, created_at: day.toISOString(), pinned: d === 1, updated_at: new Date(day.getTime() + 9 * 3600e3 > now.getTime() ? now.getTime() : day.getTime() + 9 * 3600e3).toISOString(), deleted_at: null });
    }
    var HP = [['Pak Joko', 'piutang', 350000, 100000], ['Toko Jaya Motor', 'hutang', 1200000, 400000], ['Bengkel Sinar', 'piutang', 450000, 450000], ['Mas Eko', 'piutang', 175000, 0], ['Agus Racing', 'hutang', 800000, 800000], ['Pak Darto', 'piutang', 260000, 60000]];
    for (var k = 0; k < 3; k++) {
      var dd = new Date(now.getTime() - (k * 9 + 2) * 864e5);
      var rr = HP.slice(k * 2, k * 2 + 2).map(function (x, j) { return { id: rid() + 'h' + k + j, nama: x[0], jenis: x[1], total: x[2], dibayar: x[3], keterangan: x[1] === 'hutang' ? 'Belanja sparepart' : 'Servis blok', created_at: new Date(dd.getTime() + j * 3600e3).toISOString() }; });
      db.notes.push({ id: uuid(), folder_id: fid['hutangpiutang-data-v1'], title: judul(dd), content: { schema: 'hutangpiutang-data-v1', records: rr, trash: [], legacy: null }, created_at: dd.toISOString(), updated_at: dd.toISOString(), pinned: false, deleted_at: null });
    }
    var KAR = ['Yono', 'Mail', 'Amin', 'Kuswanto'];
    for (var q = 0; q < 4; q++) {
      var kd = new Date(now.getTime() - (q * 5 + 1) * 864e5); kd.setHours(19, 40, 0, 0);
      db.notes.push({ id: uuid(), folder_id: fid['kasbon-data-v1'], title: judul(kd), content: { schema: 'kasbon-data-v1', records: [{ id: rid() + 'k' + q, nama: KAR[q], total: [100000, 50000, 150000, 75000][q], dibayar: q === 2 ? 150000 : 0, keterangan: 'Kasbon', created_at: kd.toISOString() }], trash: [], legacy: null }, created_at: kd.toISOString(), updated_at: kd.toISOString(), pinned: false, deleted_at: null });
    }
    var OPI = ['Bensin', 'Oli mesin bubut', 'Amplas', 'Token listrik', 'Makan siang', 'Mata bor', 'Gas LPG', 'Galon'];
    for (var wk = 0; wk < 3; wk++) {
      var ws = new Date(now.getTime()); ws.setHours(8, 0, 0, 0);
      var back = (ws.getDay() - 4 + 7) % 7 + wk * 7; ws = new Date(ws.getTime() - back * 864e5);
      var orr = [];
      for (var o = 0; o < 9; o++) {
        var ot = new Date(ws.getTime() + Math.floor(o / 2) * 864e5 + (o % 2) * 4 * 3600e3);
        if (ot > now) break;
        orr.push({ id: rid() + 'o' + wk + o, item: pick(OPI, o + wk), buyer: pick(KAR, o), seller: pick(['Toko Makmur', 'SPBU', 'Warung Bu Tin', 'Toko Teknik'], o + wk), harga: [25000, 60000, 15000, 100000, 45000, 30000, 22000, 7000][o % 8], metode: pick(['cash', 'cash', 'transfer', 'campur'], o), keterangan: '', created_at: ot.toISOString(), bukti: o % 3 === 0 ? [pick(IMG, o)] : [] });
      }
      if (!orr.length) continue;
      db.notes.push({ id: uuid(), folder_id: fid['operasional-data-v1'], title: 'OPERASIONAL ' + pad(ws.getDate()) + '-' + pad(ws.getMonth() + 1) + '-' + ws.getFullYear(), content: { schema: 'operasional-data-v1', records: orr, trash: [], legacy: null }, created_at: ws.toISOString(), updated_at: ws.toISOString(), pinned: false, deleted_at: null });
    }
    for (var u = 0; u < 2; u++) {
      var ud = new Date(now.getTime() - (u * 6 + 3) * 864e5);
      db.notes.push({ id: uuid(), folder_id: fid['warung-data-v1'], title: judul(ud), content: { schema: 'warung-data-v1', records: [{ id: rid() + 'w' + u, nama: ['Oli Yamalube', 'Busi NGK'][u], jumlah: '2', nominal: [90000, 36000][u], keterangan: '', created_at: ud.toISOString() }], trash: [], legacy: null }, created_at: ud.toISOString(), updated_at: ud.toISOString(), pinned: false, deleted_at: null });
    }
    var M = [['Mio', 115000], ['Blade', 130000], ['RX-K', 145000], ['Vario 125', 125000], ['Jupiter Z', 120000]];
    var OS = ['STD', '25', '50', '75', '100'];
    M.forEach(function (m, a) {
      OS.forEach(function (os, b) {
        var id = uuid();
        db.shop_barang.push({ id: id, nama: m[0] + (os === 'STD' ? ' STD' : ' OS ' + os), nama_dasar: m[0], jenis: 'piston', atribut: { os: os }, satuan: 'pcs', harga_jual: m[1] + b * 5000, arsip: false });
        db.shop_v_stok.push({ barang_id: id, stok: (a * 7 + b * 3) % 9 });
      });
    });
    db.trash_items.push({ id: uuid(), kind: 'note', label: 'Catatan contoh di Sampah', payload: { note: { id: uuid(), folder_id: fid['admin-data-v1'], title: 'Contoh terhapus', content: { schema: 'admin-data-v1', records: [], trash: [] }, created_at: now.toISOString() } }, deleted_at: new Date(now.getTime() - 2 * 864e5).toISOString(), deleted_by: UID });
    return db;
  }

  var DB;
  function load() {
    try { if (/[?&]reset=1/.test(location.search)) localStorage.removeItem(KEY); } catch (e) {}
    try { DB = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { DB = null; }
    if (!DB || !DB.folders) { DB = seed(); save(); }
  }
  var saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {} }, 30); }
  load();
  w.addEventListener('storage', function (e) { if (e.key === KEY) { try { DB = JSON.parse(e.newValue); } catch (x) {} } });
  function table(t) { if (!DB[t]) DB[t] = []; return DB[t]; }

  function cmpVal(a) { return a == null ? '' : a; }
  function proj(row, cols) {
    if (!cols || cols === '*' || /\*/.test(cols)) return clone(row);
    var o = {};
    cols.split(',').forEach(function (c) { c = c.trim().split(':')[0].split('(')[0]; if (c) o[c] = clone(row[c]); });
    return o;
  }
  function delay() { return new Promise(function (r) { setTimeout(r, 60 + Math.random() * 90); }); }

  function Q(t) {
    this.t = t; this.f = []; this.ord = []; this.lim = null; this.rng = null; this.op = 'select'; this.cols = '*'; this.opt = {}; this.payload = null; this.ret = false; this.one = 0; this.upOpt = {};
  }
  var P = Q.prototype;
  P.select = function (c, o) { if (this.op === 'select') { this.cols = c || '*'; this.opt = o || {}; } else { this.ret = true; this.cols = c || '*'; } return this; };
  P.insert = function (v) { this.op = 'insert'; this.payload = v; return this; };
  P.upsert = function (v, o) { this.op = 'upsert'; this.payload = v; this.upOpt = o || {}; return this; };
  P.update = function (v) { this.op = 'update'; this.payload = v; return this; };
  P['delete'] = function () { this.op = 'delete'; return this; };
  function add(name, fn) { P[name] = function (c, v) { this.f.push(function (r) { return fn(r[c], v, r, c); }); return this; }; }
  add('eq', function (a, b) { return String(a) === String(b); });
  add('neq', function (a, b) { return String(a) !== String(b); });
  add('gt', function (a, b) { return cmpVal(a) > b; });
  add('gte', function (a, b) { return cmpVal(a) >= b; });
  add('lt', function (a, b) { return cmpVal(a) < b; });
  add('lte', function (a, b) { return cmpVal(a) <= b; });
  add('in', function (a, b) { return (b || []).map(String).indexOf(String(a)) > -1; });
  add('is', function (a, b) { return b === null ? a == null : a === b; });
  add('like', function (a, b) { return new RegExp('^' + String(b).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*') + '$').test(String(a)); });
  add('ilike', function (a, b) { return new RegExp('^' + String(b).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*') + '$', 'i').test(String(a)); });
  P.not = function () { return this; };
  P.or = function () { return this; };
  P.filter = function (c, op, v) { return this[op] ? this[op](c, v) : this; };
  P.match = function (o) { var s = this; Object.keys(o || {}).forEach(function (k) { s.eq(k, o[k]); }); return s; };
  P.contains = function () { return this; };
  P.order = function (c, o) { this.ord.push([c, !(o && o.ascending === false)]); return this; };
  P.limit = function (n) { this.lim = n; return this; };
  P.range = function (a, b) { this.rng = [a, b]; return this; };
  P.single = function () { this.one = 1; return this; };
  P.maybeSingle = function () { this.one = 2; return this; };
  P.abortSignal = function () { return this; };
  P.returns = function () { return this; };
  P.throwOnError = function () { return this; };
  P.then = function (ok, no) { return this.run().then(ok, no); };
  P['catch'] = function (no) { return this.run()['catch'](no); };
  P['finally'] = function (f) { return this.run()['finally'](f); };
  P.match_ = function (r) { for (var i = 0; i < this.f.length; i++) if (!this.f[i](r)) return false; return true; };
  P.run = function () {
    var s = this;
    if (s._p) return s._p;
    s._p = delay().then(function () {
      var rows = table(s.t), out, now = new Date().toISOString();
      if (s.op === 'select') {
        out = rows.filter(function (r) { return s.match_(r); });
        var count = out.length;
        s.ord.slice().reverse().forEach(function (o) { out.sort(function (a, b) { var x = cmpVal(a[o[0]]), y = cmpVal(b[o[0]]); return (x < y ? -1 : x > y ? 1 : 0) * (o[1] ? 1 : -1); }); });
        if (s.rng) out = out.slice(s.rng[0], s.rng[1] + 1);
        if (s.lim != null) out = out.slice(0, s.lim);
        out = out.map(function (r) { return proj(r, s.cols); });
        if (s.opt.head) return { data: null, error: null, count: count, status: 200 };
        return fin(out, s.opt.count ? count : null);
      }
      if (s.op === 'insert' || s.op === 'upsert') {
        var arr = Array.isArray(s.payload) ? s.payload : [s.payload];
        var res = [];
        for (var i = 0; i < arr.length; i++) {
          var v = clone(arr[i]);
          if (!v.id && s.t !== 'shop_v_stok') v.id = uuid();
          var ex = v.id != null ? rows.filter(function (r) { return String(r.id) === String(v.id); })[0] : null;
          if (ex && s.op === 'insert') return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' }, status: 409 };
          if (ex) { Object.assign(ex, v, { updated_at: now }); res.push(ex); continue; }
          if (!v.created_at) v.created_at = now;
          if (s.t === 'notes' || s.t === 'folders') { v.updated_at = v.updated_at || now; if (s.t === 'notes' && v.pinned == null) v.pinned = false; }
          if (s.t === 'trash_items' && !v.deleted_at) v.deleted_at = now;
          rows.push(v); res.push(v);
        }
        save(); notify(s.t);
        return s.ret ? fin(res.map(function (r) { return proj(r, s.cols); })) : { data: null, error: null, status: 201 };
      }
      if (s.op === 'update') {
        var hit = rows.filter(function (r) { return s.match_(r); });
        hit.forEach(function (r) { Object.assign(r, clone(s.payload)); if (s.t === 'notes' || s.t === 'folders') r.updated_at = now; });
        if (hit.length) { save(); notify(s.t); }
        return s.ret ? fin(hit.map(function (r) { return proj(r, s.cols); })) : { data: null, error: null, status: 204, count: hit.length };
      }
      if (s.op === 'delete') {
        var del = rows.filter(function (r) { return s.match_(r); });
        DB[s.t] = rows.filter(function (r) { return del.indexOf(r) < 0; });
        if (del.length) { save(); notify(s.t); }
        return s.ret ? fin(del.map(function (r) { return proj(r, s.cols); })) : { data: null, error: null, status: 204 };
      }
    });
    return s._p;
    function fin(list, count) {
      if (s.one) {
        if (list.length === 1) return { data: list[0], error: null, status: 200 };
        if (!list.length && s.one === 2) return { data: null, error: null, status: 200 };
        return { data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' }, status: 406 };
      }
      return { data: list, error: null, count: count == null ? null : count, status: 200 };
    }
  };

  var chans = [];
  function notify(t) {
    chans.forEach(function (c) { c.h.forEach(function (h) { if (!h.table || h.table === t) setTimeout(function () { try { h.fn({ table: t, eventType: 'UPDATE' }); } catch (e) {} }, 400); }); });
  }

  var USER = { id: UID, email: EMAIL, user_metadata: { full_name: 'Admin Uji Coba' }, app_metadata: {} };
  var SESSION = { access_token: 'uji-coba', refresh_token: 'uji-coba', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: USER };

  var RPC = {
    is_admin: true, is_owner: true, is_dev_admin: true, has_perm: true, is_karyawan: false, is_customer: false,
    server_now: function () { return new Date().toISOString(); },
    note_backup: null, touch_login: null, backup_now: null, owner_kick_login: null,
    shop_boleh: true, shop_pakai_bengkel: { ok: true }, shop_terapkan: { ok: true },
    shop_ambil_semua: function () { return { barang: DB.shop_barang, stok: DB.shop_v_stok }; },
    backup_list: [], note_versions: [], dev_logs: [], announcement_seen_counts: [], weekly_summary: [],
    system_health: function () { return { notes: DB.notes.length, folders: DB.folders.length }; },
    system_health_detail: null, note_restore_missing: { added: 0 }
  };

  function client() {
    var authCbs = [];
    return {
      from: function (t) { return new Q(t); },
      rpc: function (name, args) {
        var p = delay().then(function () {
          var v = RPC.hasOwnProperty(name) ? RPC[name] : null;
          if (typeof v === 'function') v = v(args);
          return { data: clone(v), error: null, status: 200 };
        });
        p.abortSignal = function () { return p; };
        return p;
      },
      auth: {
        getSession: function () { return Promise.resolve({ data: { session: SESSION }, error: null }); },
        getUser: function () { return Promise.resolve({ data: { user: USER }, error: null }); },
        refreshSession: function () { return Promise.resolve({ data: { session: SESSION, user: USER }, error: null }); },
        signInWithPassword: function () { return Promise.resolve({ data: { session: SESSION, user: USER }, error: null }); },
        signOut: function () { return Promise.resolve({ error: null }); },
        updateUser: function () { return Promise.resolve({ data: { user: USER }, error: null }); },
        onAuthStateChange: function (fn) { authCbs.push(fn); setTimeout(function () { try { fn('INITIAL_SESSION', SESSION); } catch (e) {} }, 0); return { data: { subscription: { unsubscribe: function () {} } } }; },
        storageKey: 'bmtech-auth'
      },
      storage: {
        from: function () {
          return {
            upload: function (p) { return delay().then(function () { return { data: { path: p }, error: null }; }); },
            remove: function () { return delay().then(function () { return { data: [], error: null }; }); },
            getPublicUrl: function (p) { return { data: { publicUrl: '/' + p } }; },
            createSignedUrl: function (p) { return Promise.resolve({ data: { signedUrl: '/' + p }, error: null }); },
            list: function () { return Promise.resolve({ data: [], error: null }); }
          };
        }
      },
      channel: function () {
        var c = { h: [], on: function (ev, f, fn) { c.h.push({ table: f && f.table, fn: fn }); return c; }, subscribe: function (cb) { chans.push(c); if (cb) setTimeout(function () { cb('SUBSCRIBED'); }, 0); return c; }, unsubscribe: function () { chans = chans.filter(function (x) { return x !== c; }); return Promise.resolve('ok'); } };
        return c;
      },
      removeChannel: function (c) { if (c && c.unsubscribe) c.unsubscribe(); return Promise.resolve('ok'); },
      removeAllChannels: function () { chans = []; return Promise.resolve([]); },
      functions: { invoke: function () { return Promise.resolve({ data: null, error: { message: 'Tidak tersedia di uji coba' } }); } }
    };
  }

  try { localStorage.setItem('bmtech-auth', JSON.stringify(SESSION)); localStorage.setItem('bm-admin-ok', UID); } catch (e) {}
  w.supabase = { createClient: function () { return client(); } };
  w.BMTEST = { reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} load(); } };
})(window);
