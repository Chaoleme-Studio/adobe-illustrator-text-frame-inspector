var cs = new CSInterface();
var allFrames = [];
var riskOnly = false;
var STORAGE_KEY = 'text-frame-inspector-settings-v1';
var LANG_KEY = 'text-frame-inspector-lang-v1';
var defaultSettings = {
  prefixes: [
    '滚滚',
    '滚滚长江东逝水',
    '是非',
    '是非成败转头空',
    'lorem',
    'lorem ipsum',
    'ipsum',
    'placeholder',
    'dummy text',
    'sample text',
    'the quick brown fox',
    'your text here',
    'text goes here',
    'enter text',
    'type your text',
    '请输入',
    '文本内容',
    '在此输入'
  ],
  allColor: '#ffaa00',
  riskColor: '#ff3c3c',
  focusColor: '#00c8ff',
  allWidth: 1,
  riskWidth: 2,
  focusWidth: 2,
  crossWidth: 1.5
};
var currentLang = localStorage.getItem(LANG_KEY) || 'zh';
var i18n = {
  zh: {
    appTitle: '文本框检查器',
    tabMain: '当前页',
    tabSettings: '配置',
    searchPlaceholder: '搜索文字内容 / Search text...',
    filterRiskTitle: '只看风险项',
    scanLabel: '扫描所有文字',
    scanHint: '列出全部文本框，标出风险项',
    highlightAllLabel: '高亮所有文本框位置',
    highlightAllHint: '给每个文本框画定位框',
    highlightRiskLabel: '高亮所有敏感字文本框',
    highlightRiskHint: '只标出占位文本 / 风险文本框',
    restoreLabel: '还原 / Restore',
    restoreHint: '移除所有临时高亮',
    emptyTitle: '点击「扫描」开始检测',
    emptyHint: 'Click "扫描" to start',
    prefixTitle: '敏感词前缀',
    prefixHint: '每行一个，文本以前缀命中即判定为占位文本',
    allColor: '全部框颜色',
    riskColor: '敏感框颜色',
    focusColor: '定位线颜色',
    allWidth: '全部框粗细',
    riskWidth: '敏感框粗细',
    focusWidth: '定位框粗细',
    crossWidth: '定位线粗细',
    saveLabel: '保存配置',
    saveHint: '保存到本地并立即生效',
    ready: '就绪 / Ready'
  },
  en: {
    appTitle: 'Text Frame Inspector',
    tabMain: 'Inspect',
    tabSettings: 'Settings',
    searchPlaceholder: 'Search text...',
    filterRiskTitle: 'Show risky items only',
    scanLabel: 'Scan Text Frames',
    scanHint: 'List all text frames and flag risky ones',
    highlightAllLabel: 'Highlight All Text Frames',
    highlightAllHint: 'Draw temporary position boxes',
    highlightRiskLabel: 'Highlight Risky Text Frames',
    highlightRiskHint: 'Show placeholder and risky text frames only',
    restoreLabel: 'Restore',
    restoreHint: 'Remove temporary highlights',
    emptyTitle: 'Click Scan to start',
    emptyHint: 'Scan the current Illustrator document',
    prefixTitle: 'Sensitive Prefixes',
    prefixHint: 'One prefix per line. Prefix matches are flagged as placeholder text.',
    allColor: 'All frame color',
    riskColor: 'Risk frame color',
    focusColor: 'Focus line color',
    allWidth: 'All frame width',
    riskWidth: 'Risk frame width',
    focusWidth: 'Focus box width',
    crossWidth: 'Focus line width',
    saveLabel: 'Save Settings',
    saveHint: 'Store locally and apply immediately',
    ready: 'Ready'
  }
};

initializeUI();

function initializeUI() {
  bindTabs();
  bindLanguage();
  bindActions();
  loadSettingsIntoForm(loadSettings());
  applyLanguage(currentLang);
  syncSettingsToHost(false);
}

function bindTabs() {
  document.getElementById('tab-main').addEventListener('click', function () {
    activateTab('main');
  });

  document.getElementById('tab-settings').addEventListener('click', function () {
    activateTab('settings');
  });
}

function bindLanguage() {
  document.getElementById('lang-zh').addEventListener('click', function () {
    applyLanguage('zh');
  });

  document.getElementById('lang-en').addEventListener('click', function () {
    applyLanguage('en');
  });
}

function applyLanguage(lang) {
  currentLang = lang === 'en' ? 'en' : 'zh';
  localStorage.setItem(LANG_KEY, currentLang);
  document.documentElement.lang = currentLang === 'en' ? 'en' : 'zh';

  document.getElementById('lang-zh').classList.toggle('active', currentLang === 'zh');
  document.getElementById('lang-en').classList.toggle('active', currentLang === 'en');

  var dict = i18n[currentLang];
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
    var key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) el.setAttribute('placeholder', dict[key]);
  });

  document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
    var key = el.getAttribute('data-i18n-title');
    if (dict[key]) el.setAttribute('title', dict[key]);
  });
}

function activateTab(tabName) {
  document.getElementById('tab-main').classList.toggle('active', tabName === 'main');
  document.getElementById('tab-settings').classList.toggle('active', tabName === 'settings');
  document.getElementById('panel-main').classList.toggle('active', tabName === 'main');
  document.getElementById('panel-settings').classList.toggle('active', tabName === 'settings');
}

function bindActions() {
  document.getElementById('btn-scan').addEventListener('click', function () {
    syncSettingsToHost(false);
    setStatus('扫描中… / Scanning…', 'loading');
    showEmpty('⏳', '扫描中…');

    cs.evalScript('getAllTextFrames()', function (result) {
      try {
        var data = JSON.parse(result);
        if (data.error) { setStatus('⚠ ' + data.error, 'error'); return; }

        allFrames = data.frames;
        renderList(allFrames, '');

        var risks = allFrames.filter(function (f) { return f.hasRisk; }).length;
        setStatus(
          '共 ' + data.total + ' 个文本框' + (risks ? '，⚠ ' + risks + ' 个风险项' : '，未发现风险'),
          risks ? 'error' : 'success'
        );
      } catch (e) {
        setStatus(formatEvalError('扫描失败 / Scan failed', result), 'error');
      }
    });
  });

  document.getElementById('btn-highlight').addEventListener('click', function () {
    syncSettingsToHost(false);
    setStatus('高亮中… / Highlighting…', 'loading');
    cs.evalScript('highlightAllTextFrames()', function (result) {
      try {
        var data = JSON.parse(result);
        if (data.error) { setStatus('⚠ ' + data.error, 'error'); return; }
        setStatus('✓ 已高亮 ' + data.count + ' 个文本框', 'success');
      } catch (e) {
        setStatus(formatEvalError('高亮失败 / Highlight failed', result), 'error');
      }
    });
  });

  document.getElementById('btn-highlight-risk').addEventListener('click', function () {
    syncSettingsToHost(false);
    setStatus('高亮敏感字中… / Highlighting risky text…', 'loading');
    cs.evalScript('highlightRiskTextFrames()', function (result) {
      try {
        var data = JSON.parse(result);
        if (data.error) { setStatus('⚠ ' + data.error, 'error'); return; }
        setStatus('✓ 已高亮 ' + data.count + ' 个敏感字文本框', 'success');
      } catch (e) {
        setStatus(formatEvalError('高亮敏感字失败 / Highlight risky text failed', result), 'error');
      }
    });
  });

  document.getElementById('btn-restore').addEventListener('click', function () {
    cs.evalScript('clearHighlights()', function (result) {
      try {
        var data = JSON.parse(result);
        if (data.error) { setStatus('⚠ ' + data.error, 'error'); return; }
        setStatus('✓ 已还原 ' + (data.count || 0) + ' 个文本框', 'success');
      } catch (e) {
        setStatus(formatEvalError('还原失败 / Restore failed', result), 'error');
      }
    });
  });

  document.getElementById('search-box').addEventListener('input', function () {
    applyListFilters();
  });

  document.getElementById('btn-filter-risk').addEventListener('click', function () {
    riskOnly = !riskOnly;
    this.classList.toggle('active', riskOnly);
    this.setAttribute('aria-pressed', riskOnly ? 'true' : 'false');
    applyListFilters();
  });

  document.getElementById('btn-save-settings').addEventListener('click', function () {
    var settings = readSettingsFromForm();
    saveSettings(settings);
    syncSettingsToHost(true);
  });
}

function renderList(frames, keyword) {
  var list = document.getElementById('frame-list');
  var header = document.getElementById('results-header');
  var empty = document.getElementById('empty-state');

  list.innerHTML = '';

  if (!frames || frames.length === 0) {
    header.style.display = 'none';
    showEmpty('📭', '文档中没有文本框', 'No text frames found');
    return;
  }

  empty.style.display = 'none';
  header.style.display = 'flex';

  var riskCount = frames.filter(function (f) { return f.hasRisk; }).length;
  document.getElementById('results-count').textContent = '共 ' + frames.length + ' 个';

  var riskEl = document.getElementById('results-risk');
  if (riskCount > 0) {
    riskEl.textContent = '⚠ ' + riskCount + ' 个风险';
    riskEl.className = '';
  } else {
    riskEl.textContent = '✓ 全部正常';
    riskEl.className = 'ok';
  }

  frames.forEach(function (frame) {
    var li = document.createElement('li');
    li.className = 'frame-item ' + (frame.hasRisk ? 'risk' : 'clean');
    li.dataset.index = frame.index;
    li.dataset.content = (frame.content || '').toLowerCase();
    li.dataset.rawContent = frame.content || '(空)';

    var displayText = formatFrameContent(frame.content || '(空)', keyword);

    var tags = (frame.risks || []).map(function (r) {
      return '<span class="tag">' + esc(r) + '</span>';
    }).join('');

    li.innerHTML =
      '<div class="frame-content">' + displayText + '</div>' +
      '<div class="frame-meta">' +
        '图层: ' + esc(frame.layerName) +
        (frame.fontInfo ? ' &nbsp;·&nbsp; ' + esc(frame.fontInfo) : '') +
        ' &nbsp;#' + (frame.index + 1) +
      '</div>' +
      (tags ? '<div>' + tags + '</div>' : '');

    li.addEventListener('click', function () {
      focusFrameItem(li, frame.index);
    });

    list.appendChild(li);
  });

  applyListFilters();
}

function applyListFilters() {
  var items = document.querySelectorAll('.frame-item');
  var keyword = document.getElementById('search-box').value.trim();
  var kl = keyword.toLowerCase();
  var visible = 0;

  items.forEach(function (li) {
    var content = li.dataset.content || '';
    var textMatch = !kl || content.indexOf(kl) >= 0;
    var riskMatch = !riskOnly || li.classList.contains('risk');
    var match = textMatch && riskMatch;
    var contentEl = li.querySelector('.frame-content');

    if (contentEl) {
      contentEl.innerHTML = formatFrameContent(li.dataset.rawContent || '', keyword);
    }

    li.classList.toggle('hidden-item', !match);
    if (match) visible++;
  });

  document.getElementById('search-count').textContent = keyword || riskOnly ? visible + ' 条' : '';
}

function formatFrameContent(content, keyword) {
  var displayText = esc(content || '(空)');
  if (!keyword) return displayText;
  var re = new RegExp('(' + escRegex(keyword) + ')', 'gi');
  return displayText.replace(re, '<mark>$1</mark>');
}

function focusFrameItem(item, index) {
  document.querySelectorAll('.frame-item.active').forEach(function (el) {
    el.classList.remove('active');
  });
  item.classList.add('active');

  syncSettingsToHost(false);
  setStatus('定位中… / Focusing…', 'loading');
  cs.evalScript('selectTextFrame(' + index + ')', function (result) {
    try {
      var data = JSON.parse(result);
      if (data.error) { setStatus('⚠ ' + data.error, 'error'); return; }
      setStatus('✓ 已定位到文本框 #' + (index + 1), 'success');
    } catch (e) {
      setStatus(formatEvalError('定位失败 / Focus failed', result), 'error');
    }
  });
}

function loadSettings() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaults();
    var parsed = JSON.parse(raw);
    return mergeSettings(parsed);
  } catch (e) {
    return cloneDefaults();
  }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function cloneDefaults() {
  return mergeSettings({});
}

function mergeSettings(source) {
  return {
    prefixes: Array.isArray(source.prefixes) && source.prefixes.length ? source.prefixes : defaultSettings.prefixes.slice(),
    allColor: source.allColor || defaultSettings.allColor,
    riskColor: source.riskColor || defaultSettings.riskColor,
    focusColor: source.focusColor || defaultSettings.focusColor,
    allWidth: parsePositiveNumber(source.allWidth, defaultSettings.allWidth),
    riskWidth: parsePositiveNumber(source.riskWidth, defaultSettings.riskWidth),
    focusWidth: parsePositiveNumber(source.focusWidth, defaultSettings.focusWidth),
    crossWidth: parsePositiveNumber(source.crossWidth, defaultSettings.crossWidth)
  };
}

function parsePositiveNumber(value, fallback) {
  var num = parseFloat(value);
  return isFinite(num) && num > 0 ? num : fallback;
}

function loadSettingsIntoForm(settings) {
  document.getElementById('settings-prefixes').value = settings.prefixes.join('\n');
  document.getElementById('settings-all-color').value = settings.allColor;
  document.getElementById('settings-risk-color').value = settings.riskColor;
  document.getElementById('settings-focus-color').value = settings.focusColor;
  document.getElementById('settings-all-width').value = settings.allWidth;
  document.getElementById('settings-risk-width').value = settings.riskWidth;
  document.getElementById('settings-focus-width').value = settings.focusWidth;
  document.getElementById('settings-cross-width').value = settings.crossWidth;
}

function readSettingsFromForm() {
  var prefixes = document.getElementById('settings-prefixes').value
    .split(/\r?\n/)
    .map(function (line) { return line.trim(); })
    .filter(function (line) { return !!line; });

  return mergeSettings({
    prefixes: prefixes,
    allColor: document.getElementById('settings-all-color').value,
    riskColor: document.getElementById('settings-risk-color').value,
    focusColor: document.getElementById('settings-focus-color').value,
    allWidth: document.getElementById('settings-all-width').value,
    riskWidth: document.getElementById('settings-risk-width').value,
    focusWidth: document.getElementById('settings-focus-width').value,
    crossWidth: document.getElementById('settings-cross-width').value
  });
}

function syncSettingsToHost(showSuccess) {
  var settings = readSettingsFromForm();
  var payload = JSON.stringify(settings)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
  cs.evalScript("setInspectorSettings('" + payload + "')", function (result) {
    if (!showSuccess) return;
    try {
      var data = JSON.parse(result);
      if (data.error) {
        setStatus('⚠ ' + data.error, 'error');
        return;
      }
      setStatus('✓ 配置已保存并生效', 'success');
    } catch (e) {
      setStatus(formatEvalError('保存配置失败 / Save settings failed', result), 'error');
    }
  });
}

function showEmpty(icon, text, hint) {
  var empty = document.getElementById('empty-state');
  empty.style.display = 'flex';
  empty.innerHTML =
    '<div class="empty-icon">' + icon + '</div>' +
    '<p>' + text + '</p>' +
    (hint ? '<p class="hint">' + hint + '</p>' : '');
  document.getElementById('frame-list').innerHTML = '';
  document.getElementById('results-header').style.display = 'none';
}

function setStatus(msg, type) {
  var bar = document.getElementById('status-bar');
  bar.textContent = msg;
  bar.className = 'status-bar ' + (type || '');
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatEvalError(prefix, result) {
  var raw = String(result || '').trim();
  if (!raw) return prefix;
  if (raw.length > 120) raw = raw.slice(0, 117) + '...';
  return prefix + ': ' + raw;
}
