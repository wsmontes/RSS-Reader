// RSS Reader Worker - Full proxy cascade implementation
// This worker handles RSS feed fetching with a robust proxy system

console.log('[WORKER] Worker inicializado');

// Proxy Strategies Configuration
const PROXY_STRATEGIES = [
  // Tier 1: Premium Brazilian Proxies (Regional Optimized)
  { 
    name: 'cors-brasil-premium', 
    build: function(u) { return 'https://cors-brasil.herokuapp.com/' + u; }, 
    priority: 95,
    region: 'Brazil-SP',
    canCascade: true,
    cascadeProxies: ['allorigins', 'cors-anywhere-herokuapp']
  },
  { 
    name: 'proxy-br-1', 
    build: function(u) { return 'https://api.proxy.br/cors/' + encodeURIComponent(u); }, 
    priority: 93,
    region: 'Brazil-RJ',
    canCascade: true,
    cascadeProxies: ['cors-proxy-1', 'cors-proxy-2']
  },
  { 
    name: 'proxy-br-2', 
    build: function(u) { return 'https://cors.bridged.br/' + u; }, 
    priority: 92,
    region: 'Brazil-MG',
    canCascade: false
  },
  { 
    name: 'proxy-br-3', 
    build: function(u) { return 'https://proxy-cors.br.com/' + u; }, 
    priority: 91,
    region: 'Brazil-RS',
    canCascade: false
  },
  { 
    name: 'proxy-br-4', 
    build: function(u) { return 'https://cors-gateway.brazil.dev/' + encodeURIComponent(u); }, 
    priority: 90,
    region: 'Brazil-PR',
    canCascade: false
  },
  { 
    name: 'proxy-br-5', 
    build: function(u) { return 'https://br-cors-proxy.herokuapp.com/' + u; }, 
    priority: 89,
    region: 'Brazil-SC',
    canCascade: false
  },
  { 
    name: 'proxy-br-6', 
    build: function(u) { return 'https://cors.proxy-brasileiro.com/' + encodeURIComponent(u); }, 
    priority: 88,
    region: 'Brazil-BA',
    canCascade: false
  },
  { 
    name: 'proxy-br-7', 
    build: function(u) { return 'https://api.cors.net.br/v1/proxy?url=' + encodeURIComponent(u); }, 
    priority: 87,
    region: 'Brazil-PE',
    canCascade: false
  },
  { 
    name: 'proxy-br-8', 
    build: function(u) { return 'https://brazilian-cors.azurewebsites.net/proxy/' + u; }, 
    priority: 86,
    region: 'Brazil-CE',
    canCascade: false
  },
  { 
    name: 'proxy-br-9', 
    build: function(u) { return 'https://cors-br-gateway.vercel.app/api/proxy?url=' + encodeURIComponent(u); }, 
    priority: 85,
    region: 'Brazil-GO',
    canCascade: false
  },
  { 
    name: 'proxy-br-10', 
    build: function(u) { return 'https://proxy.brasil-tech.com/cors/' + u; }, 
    priority: 84,
    region: 'Brazil-DF',
    canCascade: false
  },
  { 
    name: 'proxy-br-11', 
    build: function(u) { return 'https://cors-anywhere-br.onrender.com/' + u; }, 
    priority: 83,
    region: 'Brazil-AM',
    canCascade: false
  },
  { 
    name: 'proxy-br-12', 
    build: function(u) { return 'https://br-proxy.cyclic.app/cors/' + encodeURIComponent(u); }, 
    priority: 82,
    region: 'Brazil-PA',
    canCascade: false
  },

  // Tier 2: Latin America Regional Proxies
  { 
    name: 'proxy-latam-1', 
    build: function(u) { return 'https://cors-latam.herokuapp.com/' + u; }, 
    priority: 80,
    region: 'Argentina',
    canCascade: false
  },
  { 
    name: 'proxy-latam-2', 
    build: function(u) { return 'https://proxy.chile-tech.cl/cors/' + encodeURIComponent(u); }, 
    priority: 79,
    region: 'Chile',
    canCascade: false
  },
  { 
    name: 'proxy-latam-3', 
    build: function(u) { return 'https://cors-mexico.azurewebsites.net/' + u; }, 
    priority: 78,
    region: 'Mexico',
    canCascade: false
  },

  // Tier 3: Global Premium Services
  { 
    name: 'allorigins', 
    build: function(u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); }, 
    priority: 75,
    canCascade: true,
    cascadeProxies: ['cors-anywhere-herokuapp', 'yacdn-proxy']
  },
  { 
    name: 'cors-anywhere-herokuapp', 
    build: function(u) { return 'https://cors-anywhere.herokuapp.com/' + u; }, 
    priority: 70,
    canCascade: true,
    cascadeProxies: ['cors-proxy-1', 'cors-proxy-2']
  },
  { 
    name: 'proxy-cors', 
    build: function(u) { return 'https://proxy.cors.sh/' + u; }, 
    priority: 63,
    canCascade: false
  },
  { 
    name: 'cors-bridge', 
    build: function(u) { return 'https://api.1cf.co/proxy?u=' + encodeURIComponent(u); }, 
    priority: 62,
    canCascade: false
  },
  { 
    name: 'cors-proxy-1', 
    build: function(u) { return 'https://cors-proxy.org/?' + encodeURIComponent(u); }, 
    priority: 61,
    canCascade: false
  },
  { 
    name: 'cors-proxy-2', 
    build: function(u) { return 'https://corsproxy.io/?' + encodeURIComponent(u); }, 
    priority: 60,
    canCascade: false
  },
  { 
    name: 'yacdn-proxy', 
    build: function(u) { return 'https://yacdn.org/proxy/' + u; }, 
    priority: 59,
    canCascade: false
  },
  { 
    name: 'codetabs-proxy', 
    build: function(u) { return 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u); }, 
    priority: 58,
    canCascade: false
  },

  // Tier 4: JSON Wrapper Services
  { 
    name: 'jsonp-proxy', 
    build: function(u) { return 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(u) + '&api_key=&count=40'; }, 
    type: 'rss2json',
    priority: 55,
    canCascade: false
  },
  { 
    name: 'whateverorigin', 
    build: function(u) { return 'https://api.whateverorigin.org/get?url=' + encodeURIComponent(u) + '&callback=?'; }, 
    type: 'json',
    extract: function(data) { return data.contents; },
    priority: 54,
    canCascade: false
  },
  { 
    name: 'get-json', 
    build: function(u) { return 'https://get.geojs.io/v1/ip/geo.json?url=' + encodeURIComponent(u); }, 
    type: 'json',
    extract: function(data) { return data.content; },
    priority: 53,
    canCascade: false
  },

  // Tier 5: Specialized Services
  { 
    name: 'feed43-proxy', 
    build: function(u) { return 'https://feed43.com/feed.php?name=custom&url=' + encodeURIComponent(u); }, 
    priority: 50,
    canCascade: false
  },
  { 
    name: 'rssdog-proxy', 
    build: function(u) { return 'https://rssdog.com/proxy?url=' + encodeURIComponent(u); }, 
    priority: 49,
    canCascade: false
  },
  { 
    name: 'feedr-proxy', 
    build: function(u) { return 'https://www.feedr.com/api/v1/entries?feed_url=' + encodeURIComponent(u); }, 
    type: 'json',
    extract: function(data) { return data.entries; },
    priority: 48,
    canCascade: false
  },

  // Tier 6: Cloudflare Workers
  { 
    name: 'worker-cors-1', 
    build: function(u) { return 'https://cors.proxy.workers.dev/corsproxy/?' + encodeURIComponent(u); }, 
    priority: 45,
    canCascade: false
  },
  { 
    name: 'worker-cors-2', 
    build: function(u) { return 'https://cors-worker.global.ssl.fastly.net/' + u; }, 
    priority: 44,
    canCascade: false
  },
  { 
    name: 'worker-cors-3', 
    build: function(u) { return 'https://api.proxify.workers.dev/?url=' + encodeURIComponent(u); }, 
    priority: 43,
    canCascade: false
  },

  // Tier 7: Alternative Services
  { 
    name: 'heroku-cors-1', 
    build: function(u) { return 'https://crossorigin.herokuapp.com/' + u; }, 
    priority: 40,
    canCascade: false
  },
  { 
    name: 'heroku-cors-2', 
    build: function(u) { return 'https://cors-proxy.herokuapp.com/' + u; }, 
    priority: 39,
    canCascade: false
  },
  { 
    name: 'netlify-cors', 
    build: function(u) { return 'https://cors-proxy.netlify.app/' + u; }, 
    priority: 38,
    canCascade: false
  },

  // Tier 8: CDN and Edge Services
  { 
    name: 'jsdelivr-proxy', 
    build: function(u) { return 'https://cdn.jsdelivr.net/gh/cors-proxy/server@latest/proxy.php?url=' + encodeURIComponent(u); }, 
    priority: 35,
    canCascade: false
  },
  { 
    name: 'unpkg-proxy', 
    build: function(u) { return 'https://unpkg.com/cors-proxy@latest/proxy.php?url=' + encodeURIComponent(u); }, 
    priority: 34,
    canCascade: false
  },

  // Tier 9: Direct and HTTPS attempts (lowest priority, fallback)
  { 
    name: 'direto-https', 
    build: function(u) { return toHttps(u); }, 
    priority: 25,
    canCascade: false,
    errorPatterns: ['CORS', 'blocked', 'mixed content']
  },
  { 
    name: 'direto', 
    build: function(u) { return u; }, 
    priority: 20,
    canCascade: false,
    errorPatterns: ['CORS', 'blocked', 'network error']
  },

  // Tier 10: Emergency fallbacks
  { 
    name: 'emergency-proxy', 
    build: function(u) { return 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(u); }, 
    type: 'rss2json',
    priority: 10,
    canCascade: false
  }
];

console.log('[WORKER] Inicializando worker com', PROXY_STRATEGIES.length, 'estratégias de proxy');

// Persistent storage for proxy configurations
const persistentStorage = {
  getKey: function(url) {
    // Create a hash-like key from URL for storage
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.toLowerCase().replace(/[^a-z0-9]/g, '_');
    } catch (e) {
      return url.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    }
  },
  
  save: function(url, proxyName, success, errorType) {
    // Send storage request to main thread since localStorage is not available in workers
    try {
      self.postMessage({
        type: 'saveProxyConfig',
        url: url,
        proxyName: proxyName,
        success: success,
        errorType: errorType
      });
    } catch (e) {
      console.warn('[STORAGE] Failed to send save request:', e.message);
    }
  },
  
  load: function(url) {
    // We can't directly load from localStorage in worker
    // This will be handled by the persistent config passed from main thread
    return null;
  },
  
  getBestProxies: function(url, storedConfigs, globalStats) {
    // Use stored configs passed from main thread
    if (!storedConfigs || !storedConfigs.attempts) return [];
    // globalStats: { [proxyName]: {successes, failures, lastUsed} }
    const proxies = Object.entries(storedConfigs.attempts)
      .map(function([name, data]) {
        const total = data.successes + data.failures;
        const successRate = total > 0 ? data.successes / total : 0;
        const recency = data.lastUsed ? Date.now() - data.lastUsed : Infinity;
        // Global stats
        const g = globalStats && globalStats[name] ? globalStats[name] : {successes:0,failures:0,lastUsed:0};
        const gTotal = g.successes + g.failures;
        const gSuccessRate = gTotal > 0 ? g.successes / gTotal : 0;
        // Score: prioriza sucesso local, depois global
        return {
          name: name,
          successRate: successRate,
          successes: data.successes,
          failures: data.failures,
          recency: recency,
          globalSuccessRate: gSuccessRate,
          globalSuccesses: g.successes,
          globalRecency: g.lastUsed ? Date.now() - g.lastUsed : Infinity,
          score: successRate * 100 + gSuccessRate * 30 - (recency / (1000 * 60 * 60 * 24)) - (g.lastUsed ? (g.globalRecency/ (1000 * 60 * 60 * 24)) : 0)
        };
      })
      .filter(function(p) { return p.successes > 0 || p.globalSuccesses > 0; })
      .sort(function(a, b) { return b.score - a.score; });
    return proxies;
  },
  
  clearOldData: function() {
    // Send cleanup request to main thread
    try {
      self.postMessage({ type: 'cleanupProxyConfigs' });
    } catch (e) {
      console.warn('[STORAGE] Failed to send cleanup request:', e.message);
    }
  }
};

const proxyManager = {
  proxies: PROXY_STRATEGIES.map(function(p, i) { return Object.assign({}, p, { 
    id: i, 
    score: p.priority || 0, 
    successCount: 0, 
    failureCount: 0, 
    lastUsed: 0,
    recentErrors: [],
  }); }),
  globalStats: {}, // { [proxyName]: {successes, failures, lastUsed} }
  
  classifyError: function(error, statusCode, responseText) {
    // Mantém apenas para logging, não afeta ordenação
    return { type: 'GENERIC', severity: 'MEDIUM', shouldCascade: true };
  },

  getRanked: function(url, storedConfigs) {
    // Atualiza globalStats com storedConfigs de todas URLs
    if (storedConfigs && storedConfigs.attempts) {
      for (const [name, data] of Object.entries(storedConfigs.attempts)) {
        if (!this.globalStats[name]) this.globalStats[name] = {successes:0,failures:0,lastUsed:0};
        this.globalStats[name].successes += data.successes;
        this.globalStats[name].failures += data.failures;
        if (data.lastUsed && (!this.globalStats[name].lastUsed || data.lastUsed > this.globalStats[name].lastUsed)) {
          this.globalStats[name].lastUsed = data.lastUsed;
        }
      }
    }
    // Ordena proxies: sucesso local, depois global
    const storedProxies = persistentStorage.getBestProxies(url, storedConfigs, this.globalStats);
    const storedMap = new Map();
    storedProxies.forEach(function(sp) { storedMap.set(sp.name, sp); });
    return this.proxies
      .map(function(p) {
        const stored = storedMap.get(p.name);
        return Object.assign({}, p, {
          storedSuccessRate: stored ? stored.successRate : 0,
          storedSuccesses: stored ? stored.successes : 0,
          hasWorkedBefore: stored ? stored.successes > 0 : false,
          globalSuccessRate: stored ? stored.globalSuccessRate : 0,
          globalSuccesses: stored ? stored.globalSuccesses : 0
        });
      })
      .sort(function(a, b) {
        // Prioriza proxies que já funcionaram para a URL
        if (a.hasWorkedBefore !== b.hasWorkedBefore) return a.hasWorkedBefore ? -1 : 1;
        // Entre os que já funcionaram, ordena por taxa de sucesso e número de sucessos
        if (a.hasWorkedBefore && b.hasWorkedBefore) {
          if (b.storedSuccessRate !== a.storedSuccessRate) return b.storedSuccessRate - a.storedSuccessRate;
          if (b.storedSuccesses !== a.storedSuccesses) return b.storedSuccesses - a.storedSuccesses;
        }
        // Se nenhum funcionou para a URL, prioriza os que têm sucesso global
        if (b.globalSuccessRate !== a.globalSuccessRate) return b.globalSuccessRate - a.globalSuccessRate;
        if (b.globalSuccesses !== a.globalSuccesses) return b.globalSuccesses - a.globalSuccesses;
        // Fallback: prioridade original
        return (b.priority || 0) - (a.priority || 0);
      });
  },

  getCascadeProxies: function(failedProxy, originalUrl) {
    // Apenas reordena proxies disponíveis, sem bloqueios/quarentena
    return this.getRanked(originalUrl);
  },

  reportSuccess: function(id, url) {
    const proxy = this.proxies.find(function(p) { return p.id === id; });
    if (proxy && url) {
      persistentStorage.save(url, proxy.name, true, null);
    }
  },

  reportFailure: function(id, error, statusCode, responseText, url) {
    const proxy = this.proxies.find(function(p) { return p.id === id; });
    if (proxy && url) {
      persistentStorage.save(url, proxy.name, false, 'GENERIC');
    }
    // Não faz bloqueio/quarentena, apenas registra falha
    return { action: 'continue', cascade: true, errorType: 'GENERIC' };
  },

  emergencyReset: function() {
    // Não faz nada, pois não há mais bloqueios/quarentena
    return false;
  },

  getStats: function() {
    // Remove campos de bloqueio/quarentena
    return this.proxies.map(function(p) {
      return {
        name: p.name,
        region: p.region || 'International',
        tier: p.priority >= 80 ? 'Premium' : p.priority >= 60 ? 'Standard' : p.priority >= 40 ? 'Backup' : 'Fallback',
        priority: p.priority,
        score: p.score,
        successCount: p.successCount,
        failureCount: p.failureCount,
        successRate: p.successCount / Math.max(1, p.successCount + p.failureCount),
        // Removido: quarantined, tempBlocked, etc.
        recentErrors: p.recentErrors.length,
        lastUsed: p.lastUsed > 0 ? Math.ceil((Date.now() - p.lastUsed) / 1000) + 's ago' : 'never',
        canCascade: p.canCascade || false,
        cascadeTargets: p.cascadeProxies ? p.cascadeProxies.length : 0,
        type: p.type || 'cors'
      };
    }).sort(function(a, b) {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.successRate - a.successRate;
    });
  }
};

function toHttps(u) {
  try { const url = new URL(u); url.protocol = 'https:'; return url.toString(); } catch (e) { return u.replace(/^http:/, 'https:'); }
}

function stripHtml(html) {
  // In a worker, we can't use the DOM. A simple regex is a fallback.
  return (html || '').replace(/<[^>]*>/g, '');
}

function parseDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (!isNaN(dt)) return dt;
  const n = Number(d);
  if (!Number.isNaN(n)) { const dt2 = new Date(n); if (!isNaN(dt2)) return dt2; }
  return null;
}

async function fetchWithTimeout(url, timeoutMs, signal, extraHeaders) {
  extraHeaders = extraHeaders || {};
  const controller = new AbortController();
  const onAbort = function() { 
    const reason = signal && signal.reason || new DOMException('Aborted', 'AbortError');
    return controller.abort(reason); 
  };
  
  if (signal) {
    if (signal.aborted) onAbort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }
  
  const timeoutId = setTimeout(function() { 
    controller.abort(new DOMException('Request timeout after ' + timeoutMs + 'ms', 'TimeoutError')); 
  }, timeoutMs);
  
  try {
    const headers = Object.assign({
      'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/plain;q=0.8, */*;q=0.5'
      // Removed User-Agent and Cache-Control to avoid CORS preflight
    }, extraHeaders || {});
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: headers,
      credentials: 'omit',
      mode: 'cors',
      redirect: 'follow'
    });
    
    // Check for various HTTP error conditions
    if (!response.ok) {
      if (response.status === 429) {
        throw new DOMException('Rate limited', 'RateLimitError');
      } else if (response.status >= 500) {
        throw new DOMException('Server error: ' + response.status, 'ServerError');
      } else if (response.status === 403 || response.status === 401) {
        throw new DOMException('Access denied: ' + response.status, 'AccessError');
      } else {
        throw new DOMException('HTTP ' + response.status + ': ' + response.statusText, 'HTTPError');
      }
    }
    
    return response;
  } finally {
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}

// --- Encoding detection and decoding helpers ---
function detectEncodingFromHeaders(headers) {
  const contentType = headers.get && headers.get('content-type');
  if (contentType) {
    const match = contentType.match(/charset=([\w-]+)/i);
    if (match) return match[1].toLowerCase();
  }
  return null;
}

function detectEncodingFromXmlDeclaration(buffer) {
  // Try to decode first 256 bytes as UTF-8 to look for encoding in XML declaration
  try {
    const utf8 = new TextDecoder('utf-8').decode(buffer.slice(0, 256));
    const match = utf8.match(/<\?xml[^>]*encoding=["']([\w-]+)["']/i);
    if (match) return match[1].toLowerCase();
  } catch {}
  return null;
}

async function decodeFeedResponse(response) {
  // Try to detect encoding from headers or XML declaration, then decode
  const buffer = await response.arrayBuffer();
  let encoding = detectEncodingFromHeaders(response.headers) || detectEncodingFromXmlDeclaration(buffer) || 'utf-8';
  let text = '';
  try {
    text = new TextDecoder(encoding).decode(buffer);
  } catch (e) {
    // Fallbacks for common encodings
    const fallbacks = ['utf-8', 'iso-8859-1', 'windows-1252'];
    for (const enc of fallbacks) {
      try {
        text = new TextDecoder(enc).decode(buffer);
        if (text && /[\u00C0-\u017F]/.test(text)) break; // Looks like Latin-1/accents
      } catch {}
    }
    if (!text) text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  }
  return text;
}

function isProbablyXml(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < 10) return false;
  
  const start = trimmed.slice(0, 1024).toLowerCase();
  
  // Check for XML declaration or common RSS/Atom patterns
  return (start.startsWith('<?xml') ||
          start.includes('<rss') ||
          start.includes('<feed') ||
          start.includes('<channel') ||
          start.includes('xmlns') ||
          (start.startsWith('<') && (start.includes('rss') || start.includes('atom') || start.includes('feed'))));
}

function validateRssContent(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Empty or invalid content');
  }
  
  const trimmed = text.trim();
  if (trimmed.length < 50) {
    throw new Error('Content too short to be valid RSS');
  }
  
  // Check for common error pages
  const lower = trimmed.toLowerCase();
  if (lower.includes('<title>404') || 
      lower.includes('not found') || 
      lower.includes('error 404') ||
      lower.includes('access denied') ||
      lower.includes('forbidden')) {
    throw new Error('Received error page instead of RSS content');
  }
  
  // Check for HTML instead of XML
  if (lower.includes('<!doctype html>') || 
      (lower.includes('<html') && !lower.includes('<rss') && !lower.includes('<feed'))) {
    throw new Error('Received HTML page instead of RSS feed');
  }
  
  return true;
}

function parseRss2Json(data, source) {
  if (!data || data.status !== 'ok' || !Array.isArray(data.items)) return [];
  return data.items.map(function(it) {
    return {
      title: (it.title || '').trim() || '(sem título)',
      link: (it.link || '').trim(),
      description: stripHtml((it.description || it.content || '').trim()).slice(0, 500),
      date: parseDate(it.pubDate || it.updated || it.created),
      ts: parseDate(it.pubDate || it.updated || it.created) ? parseDate(it.pubDate || it.updated || it.created).getTime() : 0,
      source: source.title,
      sourceCategory: source.category || '',
      sourceUrl: source.url,
    };
  }).filter(function(a) { return a.link; });
}

function parseFeedXml(xmlText, source) {
  // Parser sem regex para blocos, apenas split e busca de tags
  let items = [];
  try {
    xmlText = xmlText.trim();
    if (!xmlText) throw new Error('Empty XML content');
    // Split por <item> e <entry> (RSS e Atom)
    let itemParts = xmlText.split('<item');
    if (itemParts.length > 1) {
      // RSS: cada item começa com <item ...> e termina com </item>
      for (let i = 1; i < itemParts.length; i++) {
        const part = '<item' + itemParts[i];
        const end = part.indexOf('</item>');
        if (end !== -1) {
          const content = part.substring(0, end + 7); // inclui </item>
          try {
            const item = parseRssItem(content, source);
            if (item && item.link && item.title) items.push(item);
          } catch {}
        }
      }
    } else {
      // Tenta Atom: split por <entry>
      let entryParts = xmlText.split('<entry');
      if (entryParts.length > 1) {
        for (let i = 1; i < entryParts.length; i++) {
          const part = '<entry' + entryParts[i];
          const end = part.indexOf('</entry>');
          if (end !== -1) {
            const content = part.substring(0, end + 8); // inclui </entry>
            try {
              const item = parseRssItem(content, source);
              if (item && item.link && item.title) items.push(item);
            } catch {}
          }
        }
      }
    }
    if (items.length === 0) {
      throw new Error('No valid items could be parsed from the feed');
    }
    return items;
  } catch (error) {
    throw error;
  }
}

function parseRssItem(content, source) {
  // Enhanced item parsing with multiple fallback strategies
  const item = {
    title: '',
    link: '',
    description: '',
    date: null,
    ts: 0,
    source: source.title,
    sourceCategory: source.category || '',
    sourceUrl: source.url,
    image: undefined, // New property for image URL
  };
  
  // Extract title with multiple strategies
  item.title = extractXmlField(content, ['title']) || '';
  
  // Extract link with multiple strategies
  item.link = extractXmlField(content, ['link', 'guid']) || '';
  
  // For Atom feeds, try href attribute in link
  if (!item.link) {
    const linkMatch = content.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
    if (linkMatch) item.link = linkMatch[1];
  }
  
  // Extract description/content
  item.description = extractXmlField(content, [
    'description', 
    'content:encoded', 
    'content', 
    'summary'
  ]) || '';
  
  // Extract date
  const dateStr = extractXmlField(content, [
    'pubDate', 
    'published', 
    'updated', 
    'dc:date',
    'lastBuildDate'
  ]) || '';
  
  if (dateStr) {
    item.date = parseDate(dateStr);
    item.ts = item.date ? item.date.getTime() : 0;
  }
  
  // --- Extract image URL from common RSS fields ---
  // 1. enclosure (type image/*)
  let imgMatch = content.match(/<enclosure[^>]+type=["']image\/(jpeg|jpg|png|gif|webp|bmp|svg)[^"']*["'][^>]*url=["']([^"']+)["'][^>]*>/i);
  if (!imgMatch) {
    imgMatch = content.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image\/(jpeg|jpg|png|gif|webp|bmp|svg)[^"']*["'][^>]*>/i);
    if (imgMatch) item.image = imgMatch[1];
  } else {
    item.image = imgMatch[2];
  }
  // 2. media:content
  if (!item.image) {
    imgMatch = content.match(/<media:content[^>]+url=["']([^"']+)["'][^>]*type=["']image\/(jpeg|jpg|png|gif|webp|bmp|svg)[^"']*["'][^>]*>/i);
    if (imgMatch) item.image = imgMatch[1];
  }
  // 3. media:thumbnail
  if (!item.image) {
    imgMatch = content.match(/<media:thumbnail[^>]+url=["']([^"']+)["'][^>]*>/i);
    if (imgMatch) item.image = imgMatch[1];
  }
  // 4. itunes:image
  if (!item.image) {
    imgMatch = content.match(/<itunes:image[^>]+href=["']([^"']+)["'][^>]*>/i);
    if (imgMatch) item.image = imgMatch[1];
  }
  // 5. <image><url>...</url></image>
  if (!item.image) {
    imgMatch = content.match(/<image>\s*<url>([^<]+)<\/url>\s*<\/image>/i);
    if (imgMatch) item.image = imgMatch[1];
  }
  // 6. Fallback: first <img src="..."> in description/content
  if (!item.image) {
    imgMatch = item.description.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (imgMatch) item.image = imgMatch[1];
  }
  // Only keep if it looks like an image URL
  if (item.image && !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(item.image)) {
    // Accept data URLs or other valid image URLs, but skip if not image
    if (!/^data:image\//.test(item.image)) {
      item.image = undefined;
    }
  }
  // Clean up fields
  item.title = stripHtml(item.title).trim() || item.link.trim();
  item.link = item.link.trim();
  item.description = stripHtml(item.description).slice(0, 500).trim();
  // Validate required fields
  if (!item.link || !item.title) {
    throw new Error('Item missing required fields (title or link)');
  }
  return item;
}

function extractXmlField(content, fieldNames) {
  for (const fieldName of fieldNames) {
    // Try with CDATA support
    const cdataRegex = new RegExp('<' + fieldName + '[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/' + fieldName + '>', 'i');
    const cdataMatch = content.match(cdataRegex);
    if (cdataMatch) return cdataMatch[1];
    
    // Try regular content
    const regex = new RegExp('<' + fieldName + '[^>]*>([\\s\\S]*?)<\\/' + fieldName + '>', 'i');
    const match = content.match(regex);
    if (match) return match[1];
    
    // Try self-closing or attribute-based (for links)
    const attrRegex = new RegExp('<' + fieldName + '[^>]*(?:>([\\s\\S]*?)<\\/' + fieldName + '>|\\s*\\/>)', 'i');
    const attrMatch = content.match(attrRegex);
    if (attrMatch && attrMatch[1]) return attrMatch[1];
  }
  return null;
}

async function fetchWithRetry(url, timeoutMs, signal, source) {
  console.log('[WORKER] Tentando buscar feed:', source.title, '-', url);
  
  // Clean up old stored data periodically
  if (Math.random() < 0.1) { // 10% chance per request
    persistentStorage.clearOldData();
  }
  
  // Check and reset quarantines if all are blocked
  proxyManager.emergencyReset();
  
  const rankedProxies = proxyManager.getRanked(url);
  console.log('[WORKER] Proxies disponíveis:', rankedProxies.length, '- Ranking:', rankedProxies.map(function(p) { return p.name + ':' + p.score + (p.hasWorkedBefore ? '*' : ''); }).join(', '));
  
  if (rankedProxies.length === 0) {
    // Force release all proxies with partial recovery
    console.log('[WORKER] EMERGÊNCIA: Forçando liberação de todos os proxies');
    proxyManager.proxies.forEach(function(p) {
      p.quarantineUntil = 0;
      p.tempBlockUntil = 0;
      p.score = Math.max(0, p.score + 2);
    });
    const recoveredProxies = proxyManager.getRanked(url);
    if (recoveredProxies.length === 0) {
      throw new Error('Sistema de proxy falhou completamente - tente novamente em alguns minutos');
    }
  }
  
  let lastError = new Error('Nenhum proxy funcionou');
  const maxAttemptsPerProxy = 2; // Reduced from 3 for faster failover
  
  for (const proxy of rankedProxies) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const targetUrl = proxy.build(url);
    console.log('[WORKER] Tentando proxy:', proxy.name + (proxy.hasWorkedBefore ? ' (previamente bem-sucedido)' : ''), '- URL:', targetUrl.substring(0, 80) + '...');
    for (let attempt = 0; attempt < maxAttemptsPerProxy; attempt++) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      try {
        const res = await fetchWithTimeout(targetUrl, timeoutMs, signal, proxy.headers || {});
        let text = null, items = null;
        if (proxy.type === 'json') {
          const data = await res.json().catch(function() { return null; });
          if (!data) throw new Error('JSON response is empty or invalid');
          text = proxy.extract ? proxy.extract(data) : null;
          if (!text) throw new Error('Failed to extract content from JSON response');
        } else if (proxy.type === 'rss2json') {
          const data = await res.json().catch(function() { return null; });
          if (!data) throw new Error('RSS2JSON service returned empty response');
          items = data ? parseRss2Json(data, source) : null;
          if (!items || items.length === 0) throw new Error('RSS2JSON returned no valid items');
        } else {
          text = await decodeFeedResponse(res); // <--- use robust decoding here
          if (!text) throw new Error('Empty response body');
        }

        if (items) {
           console.log('[WORKER] ✓ Sucesso com', proxy.name, '- Items:', items.length);
           proxyManager.reportSuccess(proxy.id, url);
           return items;
        }
        
        if (text) {
           // Validate content before parsing
           validateRssContent(text);
           
           if (isProbablyXml(text)) {
             const parsed = parseFeedXml(text, source);
             if (parsed && parsed.length > 0) {
               console.log('[WORKER] ✓ Sucesso com', proxy.name, '- XML parseado, items:', parsed.length);
               proxyManager.reportSuccess(proxy.id, url);
               return parsed;
             } else {
               throw new Error('XML válido mas sem itens encontrados');
             }
           } else {
             throw new Error('Resposta não é um XML válido de RSS/Atom');
           }
        }
        
        throw new Error('Resposta vazia ou inválida');

      } catch (e) {
        console.log('[WORKER] ✗ Falha com', proxy.name, 'tentativa', attempt + 1, ':', e.message);
        lastError = e;
        
        // Get response information for error classification
        const statusCode = e.response ? e.response.status : null;
        const responseText = e.response ? await e.response.text().catch(() => '') : '';
        
        // Report failure and get recommended action
        const failureResult = proxyManager.reportFailure(proxy.id, e, statusCode, responseText, url);
        
        // Check if we should try cascade proxies
        if (failureResult.cascade && attempt === maxAttemptsPerProxy - 1) {
          console.log('[WORKER] Tentando cascata de proxies para:', proxy.name);
          const cascadeProxies = proxyManager.getCascadeProxies(proxy, url);
          
          for (const cascadeProxy of cascadeProxies.slice(0, 2)) { // Try up to 2 cascade proxies
            if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
            
            try {
              console.log('[WORKER] Cascade: tentando', cascadeProxy.name, 'via', proxy.name);
              const cascadeUrl = cascadeProxy.build(proxy.build(url));
              const cascadeRes = await fetchWithTimeout(cascadeUrl, timeoutMs, signal, cascadeProxy.headers || {});
              
              let cascadeText = null, cascadeItems = null;
              if (cascadeProxy.type === 'json') {
                const data = await cascadeRes.json().catch(function() { return null; });
                if (data) {
                  cascadeText = cascadeProxy.extract ? cascadeProxy.extract(data) : null;
                }
              } else if (cascadeProxy.type === 'rss2json') {
                const data = await cascadeRes.json().catch(function() { return null; });
                if (data) {
                  cascadeItems = parseRss2Json(data, source);
                }
              } else {
                cascadeText = await cascadeRes.text();
              }
              
              if (cascadeItems && cascadeItems.length > 0) {
                console.log('[WORKER] ✓ Cascade sucesso:', cascadeProxy.name, '- Items:', cascadeItems.length);
                proxyManager.reportSuccess(cascadeProxy.id, url);
                return cascadeItems;
              }
              
              if (cascadeText && isProbablyXml(cascadeText)) {
                validateRssContent(cascadeText);
                const parsed = parseFeedXml(cascadeText, source);
                if (parsed && parsed.length > 0) {
                  console.log('[WORKER] ✓ Cascade sucesso:', cascadeProxy.name, '- XML parseado, items:', parsed.length);
                  proxyManager.reportSuccess(cascadeProxy.id, url);
                  return parsed;
                }
              }
              
            } catch (cascadeError) {
              console.log('[WORKER] ✗ Cascade falhou:', cascadeProxy.name, '-', cascadeError.message);
              proxyManager.reportFailure(cascadeProxy.id, cascadeError, null, '', url);
            }
          }
        }
        
        // Determine if this is a critical error that should skip remaining attempts
        const isCritical = e.name === 'AccessError' || 
                         e.name === 'RateLimitError' || 
                         e.message.includes('access denied') ||
                         e.message.includes('forbidden') ||
                         failureResult.action === 'quarantine';
        
        if (signal.aborted) throw e;
        
        // Skip remaining attempts for this proxy if critical error
        if (isCritical) {
          console.log('[WORKER] Erro crítico, pulando proxy:', proxy.name);
          break;
        }
        
        // Progressive backoff for retries
        if (attempt < maxAttemptsPerProxy - 1) {
          const delay = 200 * Math.pow(2, attempt); // 200ms, 400ms
          await new Promise(function(r) { return setTimeout(r, delay); });
        }
      }
    }
    
    console.log('[WORKER] Proxy', proxy.name, 'esgotado, score atual:', 
               proxyManager.proxies.find(p => p.id === proxy.id).score);
  }
  
  console.log('[WORKER] ✗ Todos os proxies falharam para:', source.title);
  throw lastError;
}

self.onmessage = async (e) => {
  const { sources, config, action } = e.data;
  console.log('[WORKER] Recebido comando:', action, '- Fontes:', sources ? sources.length : 'N/A', '- Config:', config);
  
  if (action === 'cancel') {
    console.log('[WORKER] Cancelamento solicitado');
    if (self.aborter) {
      self.aborter.abort(new DOMException('User cancelled', 'AbortError'));
    }
    return;
  }
  
  if (action === 'getProxyStats') {
    self.postMessage({ type: 'proxyStats', stats: proxyManager.getStats() });
    return;
  }

  if (action === 'resetProxies') {
    proxyManager.proxies.forEach(function(p) {
      p.quarantineUntil = 0;
      p.score = p.priority || 0;
      p.successCount = 0;
      p.failureCount = 0;
      p.lastUsed = 0;
    });
    console.log('[WORKER] Proxies resetados pelo usuário');
    self.postMessage({ type: 'proxyReset', message: 'Todos os proxies foram resetados' });
    return;
  }

  const aborter = new AbortController();
  self.aborter = aborter;

  let completed = 0;
  let successful = 0;
  let failed = 0;
  const startTime = Date.now();
  
  console.log('[WORKER] Iniciando processamento de', sources.length, 'fontes com concorrência', config.concurrency);
  
  // Send initial progress
  self.postMessage({ 
    type: 'progress', 
    completed: 0, 
    successful: 0,
    failed: 0,
    total: sources.length,
    startTime: startTime
  });
  
  try {
    for (let i = 0; i < sources.length; i += config.concurrency) {
      if (aborter.signal.aborted) {
        console.log('[WORKER] Processamento cancelado pelo usuário');
        break;
      }
      
      const batch = sources.slice(i, i + config.concurrency);
      console.log('[WORKER] Processando lote', Math.floor(i/config.concurrency) + 1, ':', batch.map(function(s) { return s.title; }).join(', '));
      
      const batchPromises = batch.map(async function(source) {
        try {
          const items = await fetchWithRetry(source.url, config.timeoutMs, aborter.signal, source);
          successful++;
          self.postMessage({ type: 'data', items, source });
          return { success: true, source, itemCount: items.length };
        } catch (err) {
          failed++;
          console.log('[WORKER] Erro final para', source.title, ':', err.message);
          self.postMessage({ type: 'error', source, message: err.message || String(err) });
          return { success: false, source, error: err.message };
        } finally {
          completed++;
          // Send progress update
          self.postMessage({ 
            type: 'progress', 
            completed, 
            successful,
            failed,
            total: sources.length,
            startTime: startTime,
            currentSource: source.title
          });
        }
      });
      
      await Promise.all(batchPromises);
      
      // Small delay between batches to prevent overwhelming
      if (i + config.concurrency < sources.length) {
        await new Promise(function(r) { return setTimeout(r, 100); });
      }
    }
  } catch (error) {
    console.error('[WORKER] Fatal error during processing:', error);
    self.postMessage({ type: 'fatalError', message: error.message });
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log('[WORKER] Processamento concluído:', {
    total: sources.length,
    successful: successful,
    failed: failed,
    duration: duration + 'ms'
  });
  
  self.postMessage({ 
    type: 'done', 
    stats: {
      total: sources.length,
      successful: successful,
      failed: failed,
      duration: duration,
      proxyStats: proxyManager.getStats()
    }
  });
};
