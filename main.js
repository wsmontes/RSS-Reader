// RSS Reader - Full implementation with all features from the portable version

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const els = {
    xmlFile: document.getElementById('xmlFile'),
    concurrency: document.getElementById('concurrency'),
    timeout: document.getElementById('timeout'),
    fetchBtn: document.getElementById('fetchBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    status: document.getElementById('status'),
    search: document.getElementById('search'),
    categoryFilter: document.getElementById('categoryFilter'),
    sourceFilter: document.getElementById('sourceFilter'),
    sortOrder: document.getElementById('sortOrder'),
    articles: document.getElementById('articles'),
    sourcesSummary: document.getElementById('sourcesSummary'),
    resetProxiesBtn: document.getElementById('resetProxiesBtn'),
    proxyStatsBtn: document.getElementById('proxyStatsBtn'),
  };

  // State
  const state = {
    sources: [],
    articles: [],
    isFetching: false,
    fileOrigin: (location.protocol === 'file:'),
  };
  let worker = null;

  // Utility functions
  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
  }
  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = () => reject(fr.error);
      fr.onload = () => resolve(String(fr.result || ''));
      fr.readAsText(file, 'utf-8');
    });
  }
  function parseFeedListXml(xml) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('XML inválido');
    const items = Array.from(doc.getElementsByTagName('item'));
    return items.map(it => {
      const titleEl = it.querySelector('title');
      const categoryEl = it.querySelector('category');
      const rssUrlEl = it.querySelector('rss_url');
      const linkEl = it.querySelector('link');
      const title = (titleEl ? titleEl.textContent : '').trim();
      const category = (categoryEl ? categoryEl.textContent : '').trim();
      const rssUrl = (rssUrlEl ? rssUrlEl.textContent : linkEl ? linkEl.textContent : '').trim();
      return rssUrl ? { title: title || rssUrl, category, url: rssUrl } : null;
    }).filter(Boolean);
  }
  function formatDate(dt) {
    if (!dt) return '';
    try {
      return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(dt);
    } catch (e) {
      return dt.toISOString();
    }
  }
  function dedupeAndRender() {
    const seen = new Set();
    const unique = [];
    for (const a of state.articles) {
      if (a.link && !seen.has(a.link)) {
        seen.add(a.link);
        unique.push(a);
      }
    }
    state.articles = unique;
    renderArticles();
  }
  function populateFilterOptions() {
    const sources = Array.from(new Set(state.sources.map(s => s.title))).sort((a,b)=>a.localeCompare(b));
    const cats = Array.from(new Set(state.sources.map(s => s.category || '').filter(Boolean))).sort((a,b)=>a.localeCompare(b));
    els.sourceFilter.innerHTML = '<option value="">Todas</option>' + sources.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
    els.categoryFilter.innerHTML = '<option value="">Todas</option>' + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    els.sourcesSummary.textContent = `${state.sources.length} fontes carregadas`;
  }
  function currentFilters() {
    return {
      q: els.search.value.trim().toLowerCase(),
      source: els.sourceFilter.value,
      category: els.categoryFilter.value,
      order: els.sortOrder.value,
    };
  }
  function renderArticles() {
    const { q, source, category, order } = currentFilters();
    let items = state.articles.slice();
    if (q) items = items.filter(a => (a.title + ' ' + a.description).toLowerCase().includes(q));
    if (source) items = items.filter(a => a.source === source);
    if (category) items = items.filter(a => a.sourceCategory === category);
    items.sort((a,b) => order === 'asc' ? (a.ts - b.ts) : (b.ts - a.ts));

    const frag = document.createDocumentFragment();
    for (const a of items) {
      const el = document.createElement('article');
      el.className = 'article';
      el.innerHTML = `
        <h4><a href="${escapeHtml(a.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(a.title)}</a></h4>
        <div class="meta">
          <span>Fonte: ${escapeHtml(a.source)}</span>
          ${a.sourceCategory ? `<span>Categoria: ${escapeHtml(a.sourceCategory)}</span>` : ''}
          ${a.date ? `<span>${escapeHtml(formatDate(a.date))}</span>` : ''}
        </div>
        ${a.description ? `<div class="small">${escapeHtml(a.description)}</div>` : ''}
      `;
      frag.appendChild(el);
    }
    els.articles.replaceChildren(frag);
  }

  // Web Worker creation with full proxy cascade logic
  function createWorker() {
    return new Worker('worker.js');
  }

  function startFetching() {
    if (state.isFetching) return;
    if (worker) worker.terminate();
    worker = createWorker();
    state.isFetching = true;
    state.articles = [];
    els.articles.innerHTML = '';
    els.fetchBtn.disabled = true;
    els.cancelBtn.disabled = false;
    const config = {
      concurrency: Math.max(1, Math.min(16, Number(els.concurrency.value) || 4)),
      timeoutMs: Math.max(5000, Math.min(60000, (Number(els.timeout.value) || 15) * 1000)),
    };
    const progress = { ok: 0, err: 0, total: state.sources.length, items: 0, startedAt: Date.now() };
    const statusErrors = new Set();
    function renderWorkerStatus() {
      const elapsed = Math.round((Date.now() - progress.startedAt) / 1000);
      const progressPercent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
      let statusHtml = `
        <span>Progresso: <strong>${progress.completed || 0} / ${progress.total}</strong> (${progressPercent}%)</span>
        <span class="ok">Sucesso: <strong>${progress.ok}</strong></span>
        <span class="err">Erros: <strong>${progress.err}</strong></span>
        <span>Notícias: <strong>${state.articles.length}</strong></span>
        <span>Tempo: <strong>${elapsed}s</strong></span>
      `;
      if (progress.speed) {
        statusHtml += `<span>Velocidade: <strong>${progress.speed} fontes/min</strong></span>`;
      }
      if (progress.currentSource) {
        statusHtml += `<span>Atual: <strong>${escapeHtml(progress.currentSource)}</strong></span>`;
      }
      const recentErrors = Array.from(statusErrors).slice(-3);
      if (recentErrors.length > 0) {
        const errorHtml = recentErrors.map(e => `<div class="err" style="font-size: 11px; margin-top: 4px;">${escapeHtml(e)}</div>`).join('');
        statusHtml += errorHtml;
        if (statusErrors.size > 3) {
          statusHtml += `<div class="err" style="font-size: 11px; margin-top: 4px;">... e mais ${statusErrors.size - 3} erros</div>`;
        }
      }
      els.status.innerHTML = statusHtml;
    }
    renderWorkerStatus();
    worker.onmessage = (e) => {
      const { type, items, source, message, completed, total, successful, failed, startTime, currentSource, stats } = e.data;
      if (type === 'data') {
        progress.ok++;
        if (items.length > 0) {
          Array.prototype.push.apply(state.articles, items);
          dedupeAndRender();
        }
      } else if (type === 'error') {
        progress.err++;
        statusErrors.add(`${source.title}: ${message}`);
      } else if (type === 'progress') {
        progress.ok = successful || 0;
        progress.err = failed || 0;
        progress.completed = completed || 0;
        progress.total = total || state.sources.length;
        if (currentSource) progress.currentSource = currentSource;
        if (startTime && completed > 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          progress.speed = Math.round((completed / elapsed) * 60);
        }
      } else if (type === 'done') {
        state.isFetching = false;
        els.fetchBtn.disabled = false;
        els.cancelBtn.disabled = true;
        if (worker) {
          worker.terminate();
          worker = null;
        }
      } else if (type === 'fatalError') {
        statusErrors.add(`Erro fatal: ${message}`);
        state.isFetching = false;
        els.fetchBtn.disabled = false;
        els.cancelBtn.disabled = true;
        if (worker) {
          worker.terminate();
          worker = null;
        }
      } else if (type === 'proxyStats') {
        // Display proxy stats in a user-friendly modal
        let output = '<pre style="white-space:pre-wrap;font-size:13px;line-height:1.5;margin:0">';
        output += '=== ESTATÍSTICAS DO SISTEMA DE PROXY ===\n\n';
        output += `Total de Proxies: ${stats.length}\n`;
        output += `Ativos: ${stats.filter(p => !p.quarantined && !p.tempBlocked).length}\n`;
        output += `Em Quarentena: ${stats.filter(p => p.quarantined).length}\n`;
        output += `Bloqueados Temporariamente: ${stats.filter(p => p.tempBlocked).length}\n\n`;
        // By Region
        const byRegion = {};
        stats.forEach(function(proxy) {
          const region = proxy.region || 'International';
          if (!byRegion[region]) byRegion[region] = [];
          byRegion[region].push(proxy);
        });
        output += '=== POR REGIÃO ===\n';
        Object.entries(byRegion).forEach(function([region, proxies]) {
          const active = proxies.filter(p => !p.quarantined && !p.tempBlocked).length;
          const avgSuccess = proxies.reduce((sum, p) => sum + p.successRate, 0) / proxies.length;
          output += `${region}: ${proxies.length} proxies (${active} ativos, ${(avgSuccess * 100).toFixed(1)}% sucesso médio)\n`;
        });
        // By Tier
        const byTier = {};
        stats.forEach(function(proxy) {
          const tier = proxy.tier || 'Unknown';
          if (!byTier[tier]) byTier[tier] = [];
          byTier[tier].push(proxy);
        });
        output += '\n=== POR TIER ===\n';
        Object.entries(byTier).forEach(function([tier, proxies]) {
          const active = proxies.filter(p => !p.quarantined && !p.tempBlocked).length;
          const avgSuccess = proxies.reduce((sum, p) => sum + p.successRate, 0) / proxies.length;
          output += `${tier}: ${proxies.length} proxies (${active} ativos, ${(avgSuccess * 100).toFixed(1)}% sucesso médio)\n`;
        });
        output += '\n=== TOP 10 PROXIES ===\n';
        stats.slice(0, 10).forEach(function(proxy, i) {
          const status = proxy.quarantined ? '[QUARENTENA]' : proxy.tempBlocked ? '[BLOQUEADO]' : '[ATIVO]';
          output += `${i+1}. ${proxy.name} (${proxy.region}) ${status}\n`;
          output += `   Tier: ${proxy.tier} | Sucesso: ${(proxy.successRate * 100).toFixed(1)}% (${proxy.successCount}/${proxy.successCount + proxy.failureCount})\n`;
          output += `   Score: ${proxy.score} | Último uso: ${proxy.lastUsed} | Erros recentes: ${proxy.recentErrors}\n\n`;
        });
        output += '</pre>';
        // Create or update modal
        let modal = document.getElementById('proxyStatsModal');
        if (!modal) {
          modal = document.createElement('div');
          modal.id = 'proxyStatsModal';
          modal.style.position = 'fixed';
          modal.style.top = '0';
          modal.style.left = '0';
          modal.style.width = '100vw';
          modal.style.height = '100vh';
          modal.style.background = 'rgba(0,0,0,0.6)';
          modal.style.zIndex = '9999';
          modal.style.display = 'flex';
          modal.style.alignItems = 'center';
          modal.style.justifyContent = 'center';
          modal.innerHTML = `<div style="background:#fff;max-width:700px;width:90vw;padding:24px 18px 18px 18px;border-radius:8px;box-shadow:0 4px 32px #0003;position:relative;">
            <button id="closeProxyStatsModal" style="position:absolute;top:8px;right:12px;font-size:18px;background:none;border:none;cursor:pointer;">&times;</button>
            <h3 style="margin-top:0">Estatísticas do Sistema de Proxy</h3>
            <div id="proxyStatsContent"></div>
          </div>`;
          document.body.appendChild(modal);
          document.getElementById('closeProxyStatsModal').onclick = function() {
            modal.remove();
          };
        } else {
          modal.style.display = 'flex';
        }
        document.getElementById('proxyStatsContent').innerHTML = output;
      } else if (type === 'proxyReset') {
        alert('Proxies resetados com sucesso!');
      }
      renderWorkerStatus();
    };
    worker.postMessage({
      sources: state.sources,
      config: config,
      action: 'start'
    });
  }
  function cancelFetching() {
    if (!state.isFetching || !worker) return;
    worker.postMessage({ action: 'cancel' });
    setTimeout(() => {
      if (worker) {
        worker.terminate();
        worker = null;
      }
      state.isFetching = false;
      els.fetchBtn.disabled = false;
      els.cancelBtn.disabled = true;
      els.status.innerHTML += '<span class="err"> - Cancelado pelo usuário</span>';
    }, 1000);
  }
  function resetProxies() {
    if (!worker) {
      alert('Sistema não está pronto. Carregue um arquivo XML primeiro.');
      return;
    }
    if (confirm('Resetar todos os proxies? Isso irá limpar quarentenas e estatísticas.')) {
      worker.postMessage({ action: 'resetProxies' });
    }
  }
  function showProxyStats() {
    if (!worker) {
      alert('Sistema não está pronto. Carregue um arquivo XML primeiro.');
      return;
    }
    worker.postMessage({ action: 'getProxyStats' });
    // Handler for proxyStats is in worker.onmessage
  }

  // Proxy configuration storage functions (main thread only)
  function getStorageKey(url) {
    try {
      const urlObj = new URL(url);
      return 'rss_proxy_config_' + urlObj.hostname.toLowerCase().replace(/[^a-z0-9]/g, '_');
    } catch (e) {
      return 'rss_proxy_config_' + url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    }
  }

  function saveProxyConfig(url, proxyName, success, errorType) {
    try {
      const key = getStorageKey(url);
      let config = JSON.parse(localStorage.getItem(key) || '{}');
      if (!config.attempts) config.attempts = {};
      if (!config.attempts[proxyName]) {
        config.attempts[proxyName] = {
          successes: 0,
          failures: 0,
          lastUsed: 0,
          lastError: null,
          bestTime: null
        };
      }
      const attempt = config.attempts[proxyName];
      if (success) {
        attempt.successes++;
        attempt.lastSuccess = Date.now();
        if (!config.bestProxy || attempt.successes > (config.attempts[config.bestProxy]?.successes || 0)) {
          config.bestProxy = proxyName;
        }
        console.log('[STORAGE] ✓ Saved success for', proxyName, 'with', key.replace('rss_proxy_config_', ''));
      } else {
        attempt.failures++;
        attempt.lastError = errorType;
        console.log('[STORAGE] ✗ Saved failure for', proxyName, 'with', key.replace('rss_proxy_config_', ''), '- Error:', errorType);
      }
      attempt.lastUsed = Date.now();
      config.lastUpdated = Date.now();
      localStorage.setItem(key, JSON.stringify(config));
    } catch (e) {
      console.warn('[STORAGE] Failed to save config:', e.message);
    }
  }

  function cleanupProxyConfigs() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('rss_proxy_config_')) {
          keys.push(key);
        }
      }
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      let cleared = 0;
      keys.forEach(function(key) {
        try {
          const config = JSON.parse(localStorage.getItem(key) || '{}');
          if (!config.lastUpdated || config.lastUpdated < weekAgo) {
            localStorage.removeItem(key);
            cleared++;
          }
        } catch (e) {
          localStorage.removeItem(key); // Remove corrupted data
          cleared++;
        }
      });
      if (cleared > 0) {
        console.log('[STORAGE] Cleared', cleared, 'old proxy configurations');
      }
    } catch (e) {
      console.warn('[STORAGE] Failed to clear old data:', e.message);
    }
  }

  // Make proxy functions globally available for HTML onclick
  window.resetProxies = resetProxies;
  window.showProxyStats = showProxyStats;

  // Event listeners
  if (els.resetProxiesBtn) {
    els.resetProxiesBtn.addEventListener('click', resetProxies);
  }
  if (els.proxyStatsBtn) {
    els.proxyStatsBtn.addEventListener('click', showProxyStats);
  }
  if (els.xmlFile) {
    els.xmlFile.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        els.fetchBtn.disabled = true;
        els.cancelBtn.disabled = true;
        els.status.textContent = 'Lendo arquivo...';
        const text = await readFileAsText(file);
        state.sources = parseFeedListXml(text);
        if (!state.sources.length) throw new Error('Nenhuma fonte encontrada no XML');
        state.articles = [];
        populateFilterOptions();
        renderArticles();
        els.status.innerHTML = '';
        els.fetchBtn.disabled = false;
      } catch (err) {
        console.error(err);
        els.status.innerHTML = `<span class="err">Erro ao ler XML: ${escapeHtml(err.message || String(err))}</span>`;
      }
    });
  }
  if (els.fetchBtn) els.fetchBtn.addEventListener('click', startFetching);
  if (els.cancelBtn) els.cancelBtn.addEventListener('click', cancelFetching);
  if (els.search) els.search.addEventListener('input', renderArticles);
  if (els.sourceFilter) els.sourceFilter.addEventListener('change', renderArticles);
  if (els.categoryFilter) els.categoryFilter.addEventListener('change', renderArticles);
  if (els.sortOrder) els.sortOrder.addEventListener('change', renderArticles);
});
