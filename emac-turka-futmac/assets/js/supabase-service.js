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

  async function listArticles(options) {
    const client = await getClient();
    let query = client.from('articles').select('*').order('published_at', { ascending: false, nullsFirst: false }).order('updated_at', { ascending: false });
    if (options && options.publishedOnly) query = query.eq('status', 'published').lte('published_at', new Date().toISOString());
    const result = await query;
    if (result.error) throw result.error;
    return result.data.map(rowToArticle);
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
    enabled: enabled(), getClient: getClient, getSession: getSession, signIn: signIn,
    signOut: signOut, listArticles: listArticles, saveArticle: saveArticle,
    deleteArticle: deleteArticle, uploadImage: uploadImage
  });
}());
