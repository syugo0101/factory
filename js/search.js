export function setupSearch(tableData, renderTable) {
  const searchInput = document.getElementById('search');
  const filterSection = document.getElementById('dynamicFilters');
  const downloadBtn = document.getElementById('downloadCsv'); // 追加：ダウンロードボタン

  const activeColumnFilters = {};
  let filteredData = tableData;  // 最新のフィルター済みデータを保持
  function sanitizeInput(input) {
    return input.replace(/[<>"]/g, '');
  }

  function parseKeywords(raw) {
    const phraseRegex = /"([^"]+)"/g;
    const phrases = [];
    raw = raw.replace(phraseRegex, (_, p) => {
      phrases.push(p.trim());
      return '';
    });

    const tokens = raw.trim().split(/\s+/).filter(t => t);
    const include = [...phrases];
    const exclude = [];
    let op = 'AND';

    tokens.forEach(tok => {
      const upper = tok.toUpperCase();
      if (upper === 'OR') {
        op = 'OR';
      } else if (upper === 'AND') {
        op = 'AND';
      } else if (tok.startsWith('-')) {
        exclude.push(tok.slice(1));
      } else {
        include.push(tok);
      }
    });

    return { op, include, exclude };
  }

  function animateDetails(details) {
    const summary = details.querySelector('summary');
    const content = [...details.children].filter(el => el !== summary);
    const wrapper = document.createElement('div');

    content.forEach(child => wrapper.appendChild(child));
    wrapper.style.overflow = 'hidden';
    wrapper.style.transition = 'max-height 0.3s ease';
    wrapper.style.maxHeight = '0';
    details.appendChild(wrapper);

    summary.addEventListener('click', e => {
      e.preventDefault();
      const isOpen = details.hasAttribute('open');
      if (isOpen) {
        wrapper.style.maxHeight = '0';
        setTimeout(() => {
          details.removeAttribute('open');
        }, 300);
      } else {
        details.setAttribute('open', '');
        requestAnimationFrame(() => {
          wrapper.style.maxHeight = wrapper.scrollHeight + 'px';
        });
      }
    });
  }

  function generateDynamicFilters(data) {
    filterSection.innerHTML = '';
    if (!data.length) return;

    const columns = Object.keys(data[0]);

    columns.forEach(col => {
      const rawValues = data.map(row => row[col]).filter(Boolean);

      // 🔽 値を分割してユニークなセットに
      const valueSet = new Set();
      rawValues.forEach(val => {
        const text = String(val);
        const splitValues = text
          .replace(/\[|\]/g, ' ')
          .split(/[\s,\.、　]+/) // 半角/全角スペース、カンマ、日本語読点含む
          .map(s => s.trim())
          .filter(Boolean);
        splitValues.forEach(item => valueSet.add(item));
      });

      const values = [...valueSet].sort();

      const details = document.createElement('details');
      details.style.marginBottom = '8px'; // 💡 隙間を追加
      const summary = document.createElement('summary');
      summary.textContent = col;
      details.appendChild(summary);

      const list = document.createElement('ul');
      list.style.listStyle = 'none';
      list.style.paddingLeft = '0';

      values.forEach(value => {
        const li = document.createElement('li');
        li.textContent = value;
        li.classList.add('filter-option');
        li.dataset.key = col;
        li.dataset.value = value;
        li.style.cursor = 'pointer';
        li.style.padding = '2px 6px';
        li.style.borderRadius = '6px';
        li.style.margin = '2px 0';
        li.style.userSelect = 'none';

        if (activeColumnFilters[col] && activeColumnFilters[col].has(value)) {
          li.style.backgroundColor = '#ffaa46';
          li.style.color = '#2a2a2a';
          li.style.fontWeight = 'bold';
        }

        list.appendChild(li);
      });

      details.appendChild(list);
      filterSection.appendChild(details);
      animateDetails(details);
    });

    filterSection.querySelectorAll('.filter-option').forEach(item => {
      item.addEventListener('click', () => {
        const key = item.dataset.key;
        const value = item.dataset.value;

        if (!activeColumnFilters[key]) {
          activeColumnFilters[key] = new Set();
        }
        if (activeColumnFilters[key].has(value)) {
          activeColumnFilters[key].delete(value);
          item.style.backgroundColor = '';
          item.style.color = '';
          item.style.fontWeight = '';
          if (activeColumnFilters[key].size === 0) {
            delete activeColumnFilters[key];
          }
        } else {
          activeColumnFilters[key].add(value);
          item.style.backgroundColor = '#ffaa46';
          item.style.color = '#2a2a2a';
          item.style.fontWeight = 'bold';
        }
        filterData();
      });
    });
  }

  function filterData() {
    const rawInput = sanitizeInput(searchInput.value);
    const { op, include, exclude } = parseKeywords(rawInput);

    filteredData = tableData.filter(row => {
      for (const [col, selectedSet] of Object.entries(activeColumnFilters)) {
        const text = String(row[col] || '');
        const splitValues = text
          .replace(/\[|\]/g, ' ')
          .split(/[\s,\.、　]+/)
          .map(s => s.trim())
          .filter(Boolean);
        if (![...selectedSet].every(sel => splitValues.includes(sel))) {
          return false;
        }
      }

      const text = Object.values(row)
        .filter(v => typeof v === 'string')
        .join(' ')
        .toLowerCase();

      for (const term of exclude) {
        if (text.includes(term.toLowerCase())) return false;
      }

      if (include.length === 0) return true;

      const lowerInclude = include.map(t => t.toLowerCase());
      return op === 'OR'
        ? lowerInclude.some(term => text.includes(term))
        : lowerInclude.every(term => text.includes(term));
    });

    renderTable(filteredData);
  }

  // CSV生成ヘルパー関数
  function convertToCsv(data) {
    if (!data.length) return '';

    const columns = Object.keys(data[0]);
    const escapeCsv = (text) => {
      if (typeof text !== 'string') text = String(text ?? '');
      if (text.includes('"') || text.includes(',') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const header = columns.join(',');
    const rows = data.map(row =>
      columns.map(col => escapeCsv(row[col])).join(',')
    );

    return [header, ...rows].join('\r\n');
  }

  // ダウンロード処理
  function downloadCsv() {
    const csv = convertToCsv(filteredData);
    if (!csv) {
      alert('ダウンロードできるデータがありません。');
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'filtered_data.csv';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  searchInput.addEventListener('input', filterData);
  generateDynamicFilters(tableData);

  // ダウンロードボタンにイベント付与
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadCsv);
  }
}