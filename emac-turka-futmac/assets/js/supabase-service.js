(function () {
  'use strict';

  const config = window.FUTMAC_SUPABASE_CONFIG || {};
  let clientPromise = null;

  function enabled() {
    return config.enabled === true && /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url || '') && typeof config.publishableKey === 'string' && config.publishableKey.length > 20;
  }

  function loadLibrary() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve(window.supabase);
    return new Promise(function (resolve, reject) {
      const existing = document.querySelector('script[data-futmac-supabase]');
      if (existing) {
        existing.addEventListener('load', function () { resolve(window.supabase); }, { once: true });
        existing.addEventListener('error', function () { reject(new Error('Supabase bağlantı kütüphanesi yüklenemedi.')); }, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      script.dataset.futmacSupabase = 'true';
      script.onload = function () { resolve(window.supabase); };
      script.onerror = function () { reject(new Error('Supabase bağlantı kütüphanesi yüklenemedi.')); };
      document.head.appendChild(script);
    });
  }

  async function getClient() {
    if (!enabled()) throw new Error('Supabase bağlantısı henüz yapılandırılmadı.');
    if (!clientPromise) {
      clientPromise = loadLibrary().then(function (library) {
        return library.createClient(config.url, config.publishableKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
      });
    }
    return clientPromise;
  }

  function rowToArticle(row) {
    const published = row.published_at ? new Date(row.published_at) : new Date(row.updated_at || row.created_at);
    return {
      id: row.id,
      slug: row.slug,
      type: row.content_type,
      category: row.category_slug,
      title: row.title,
      excerpt: row.excerpt,
      content: row.body,
      date: published.toISOString().slice(0, 10),
      displayDate: new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(published),
      time: published.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      author: row.author_name || 'FUTMAC Servisi',
      authorId: row.author_slug || undefined,
      image: row.image_url || 'assets/images/futbol-manset.svg',
      status: row.status,
      readTime: row.read_time || '3 dk',
      url: 'haber-onizleme.html?id=' + encodeURIComponent(row.id),
      remote: true
    };
  }

  function articleToRow(article) {
    const publishedAt = new Date(article.date + 'T' + article.time + ':00');
    const row = {
      slug: article.slug,
      content_type: article.type,
      category_slug: article.category,
      title: article.title,
      excerpt: article.excerpt,
      body: article.content,
      author_name: article.author,
      author_slug: article.authorId || null,
      image_url: article.image,
      status: article.status,
      read_time: article.readTime,
      published_at: article.status === 'published' ? publishedAt.toISOString() : null
    };
    if (article.id && !String(article.id).startsWith('local-')) row.id = article.id;
    return row;
  }

  async function signIn(email, password) {
    const client = await getClient();
    const result = await client.auth.signInWithPassword({ email: email, password: password });
    if (result.error) throw result.error;
    const profile = await getProfile(result.data.user.id);
    if (!profile || !['editor', 'admin'].includes(profile.role)) {
      await client.auth.signOut();
      throw new Error('Bu hesabın yönetim paneline erişim yetkisi yok.');
    }
    return { session: result.data.session, profile: profile };
  }

  async function getSession() {
    const client = await getClient();
    const result = await client.auth.getSession();
    if (result.error) throw result.error;
    if (!result.data.session) return null;
    const profile = await getProfile(result.data.session.user.id);
    if (!profile || !['editor', 'admin'].includes(profile.role)) return null;
    return { session: result.data.session, profile: profile };
  }

  async function getProfile(userId) {
    const client = await getClient();
    const result = await client.from('profiles').select('id,display_name,role').eq('id', userId).single();
    if (result.error) throw result.error;
    return result.data;
  }

  async function signOut() {
    const client = await getClient();
    const result = await client.auth.signOut();
    if (result.error) throw result.error;
  }

  async function requestPasswordReset(email) {
    const client = await getClient();
    const redirectTo = new URL('sifre-yenile.html', window.location.href).href;
    const result = await client.auth.resetPasswordForEmail(email, { redirectTo: redirectTo });
    if (result.error) throw result.error;
  }

  async function updatePassword(password) {
    const client = await getClient();
    const result = await client.auth.updateUser({ password: password });
    if (result.error) throw result.error;
    return result.data.user;
  }

  async function listArticles(options) {
    const client = await getClient();
    let query = client.from('articles').select('*').order('published_at', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false });
    if (options && options.publishedOnly) query = query.eq('status', 'published').lte('published_at', new Date().toISOString());
    const result = await query;
    if (result.error) throw result.error;
    return result.data.map(rowToArticle);
  }

  function optionalRows(result) {
    if (!result.error) return result.data;
    const message = String(result.error.message || '');
    if (['PGRST205', '42P01'].includes(result.error.code) || message.includes('schema cache') || message.includes('does not exist')) return null;
    throw result.error;
  }

  async function listAuthors() {
    const client = await getClient();
    const rows = optionalRows(await client.from('authors').select('*').order('sort_order').order('name'));
    if (rows === null) return null;
    return rows.map(function (row) {
      const profiles = { furkan:'yazar-furkan.html', eray:'yazar-eray.html', berkay:'yazar-berkay.html' };
      return { id: row.slug, name: row.name, role: row.role, bio: row.bio, image: row.image_url, active: row.is_active, sortOrder: row.sort_order, profile: profiles[row.slug] || 'yazarlar.html' };
    });
  }

  async function listTeams() {
    const client = await getClient();
    const rows = optionalRows(await client.from('league_teams').select('*').order('sort_order').order('name'));
    if (rows === null) return null;
    return rows.map(function (row) { return { id: row.id, name: row.name, manager: row.manager, shortName: row.short_name || '', active: row.is_active, sortOrder: row.sort_order }; });
  }

  async function listStandings() {
    const client = await getClient();
    const rows = optionalRows(await client.from('standings').select('team_id,played,won,drawn,lost,fantasy_points,league_points,movement,form,updated_at,team:league_teams!standings_team_id_fkey(id,name,manager,sort_order)'));
    if (rows === null) return null;
    rows.sort(function (a, b) { return b.league_points - a.league_points || b.fantasy_points - a.fantasy_points || (a.team.sort_order || 0) - (b.team.sort_order || 0); });
    return rows.map(function (row, index) { return { rank: index + 1, teamId: row.team_id, team: row.team.name, manager: row.team.manager, played: row.played, won: row.won, drawn: row.drawn, lost: row.lost, fantasy: row.fantasy_points, points: row.league_points, change: row.movement, form: row.form || [], updatedAt: row.updated_at }; });
  }

  async function listFixtures() {
    const client = await getClient();
    const rows = optionalRows(await client.from('fixtures').select('id,week,kickoff_at,status,home_score,away_score,home:league_teams!fixtures_home_team_id_fkey(id,name),away:league_teams!fixtures_away_team_id_fkey(id,name)').order('week').order('kickoff_at'));
    if (rows === null) return null;
    const weeks = {};
    rows.forEach(function (row) {
      const kickoff = new Date(row.kickoff_at);
      if (!weeks[row.week]) weeks[row.week] = [];
      weeks[row.week].push({ id: row.id, week: row.week, homeTeamId: row.home.id, awayTeamId: row.away.id, home: row.home.name, away: row.away.name, kickoffAt: row.kickoff_at, date: new Intl.DateTimeFormat('tr-TR', { day:'numeric', month:'long', year:'numeric' }).format(kickoff), time: kickoff.toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' }), status: row.status, homeScore: row.home_score, awayScore: row.away_score });
    });
    return weeks;
  }

  async function saveFixture(fixture) {
    const client = await getClient();
    const row = { week: fixture.week, home_team_id: fixture.homeTeamId, away_team_id: fixture.awayTeamId, kickoff_at: fixture.kickoffAt, status: fixture.status, home_score: fixture.status === 'scheduled' ? null : fixture.homeScore, away_score: fixture.status === 'scheduled' ? null : fixture.awayScore };
    if (fixture.id) row.id = fixture.id;
    const result = row.id ? await client.from('fixtures').update(row).eq('id', row.id).select().single() : await client.from('fixtures').insert(row).select().single();
    if (result.error) throw result.error;
    return result.data;
  }

  async function deleteFixture(id) {
    const client = await getClient(); const result = await client.from('fixtures').delete().eq('id', id); if (result.error) throw result.error;
  }

  async function saveStanding(item) {
    const client = await getClient();
    const row = { team_id:item.teamId, played:item.played, won:item.won, drawn:item.drawn, lost:item.lost, fantasy_points:item.fantasy, league_points:item.points, movement:item.change, form:item.form };
    const result = await client.from('standings').upsert(row, { onConflict:'team_id' }).select().single(); if (result.error) throw result.error; return result.data;
  }

  async function saveAuthor(author) {
    const client = await getClient();
    const row = { slug:author.id, name:author.name, role:author.role, bio:author.bio, image_url:author.image, is_active:author.active, sort_order:author.sortOrder };
    const result = await client.from('authors').upsert(row, { onConflict:'slug' }).select().single(); if (result.error) throw result.error; return result.data;
  }

  async function saveArticle(article) {
    const client = await getClient();
    const row = articleToRow(article);
    const result = row.id
      ? await client.from('articles').update(row).eq('id', row.id).select().single()
      : await client.from('articles').insert(row).select().single();
    if (result.error) throw result.error;
    return rowToArticle(result.data);
  }

  async function deleteArticle(id) {
    const client = await getClient();
    const result = await client.from('articles').delete().eq('id', id);
    if (result.error) throw result.error;
  }

  async function uploadImage(file, folder) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!file || !allowed.includes(file.type)) throw new Error('Yalnızca JPG, PNG veya WebP görsel yüklenebilir.');
    if (file.size > 5 * 1024 * 1024) throw new Error('Görsel 5 MB sınırını aşıyor.');
    const client = await getClient();
    const userResult = await client.auth.getUser();
    if (userResult.error || !userResult.data.user) throw new Error('Görsel yüklemek için yeniden giriş yapın.');
    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const safeFolder = folder === 'authors' ? 'authors' : 'articles';
    const path = safeFolder + '/' + userResult.data.user.id + '/' + crypto.randomUUID() + '.' + extension;
    const upload = await client.storage.from(config.mediaBucket || 'futmac-media').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (upload.error) throw upload.error;
    const publicUrl = client.storage.from(config.mediaBucket || 'futmac-media').getPublicUrl(path);
    return publicUrl.data.publicUrl;
  }

  window.FUTMAC_SUPABASE = Object.freeze({
    enabled: enabled(), leagueManagementEnabled: config.leagueManagementEnabled === true,
    getClient: getClient, getSession: getSession, signIn: signIn,
    signOut: signOut, requestPasswordReset: requestPasswordReset, updatePassword: updatePassword,
    listArticles: listArticles, saveArticle: saveArticle, deleteArticle: deleteArticle,
    listAuthors: listAuthors, listTeams: listTeams, listStandings: listStandings, listFixtures: listFixtures,
    saveFixture: saveFixture, deleteFixture: deleteFixture, saveStanding: saveStanding, saveAuthor: saveAuthor,
    uploadImage: uploadImage
  });
}());
