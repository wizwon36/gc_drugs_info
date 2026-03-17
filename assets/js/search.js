function handleKeywordKeydown(e) {
  const box = document.getElementById('autocompleteBox');
  const items = Array.from(box.querySelectorAll('.autocomplete-item'));
  const isOpen = box.style.display === 'block' && items.length > 0;

  if (e.key === 'ArrowDown') {
    if (!isOpen) return;
    e.preventDefault();
    clearTimeout(state.autoTimer);

    if (state.autocompleteActiveIndex < 0) {
      state.autocompleteActiveIndex = 0;
    } else {
      state.autocompleteActiveIndex = Math.min(state.autocompleteActiveIndex + 1, items.length - 1);
    }

    updateAutocompleteActiveItem();
    return;
  }

  if (e.key === 'ArrowUp') {
    if (!isOpen) return;
    e.preventDefault();
    clearTimeout(state.autoTimer);

    if (state.autocompleteActiveIndex < 0) {
      state.autocompleteActiveIndex = items.length - 1;
    } else {
      state.autocompleteActiveIndex = Math.max(state.autocompleteActiveIndex - 1, 0);
    }

    updateAutocompleteActiveItem();
    return;
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();

    if (isOpen && state.autocompleteActiveIndex >= 0 && items[state.autocompleteActiveIndex]) {
      items[state.autocompleteActiveIndex].click();
      return;
    }

    handleSearch();
    return;
  }

  if (e.key === 'Escape') {
    hideAutocomplete(true);
  }
}

function updateAutocompleteActiveItem() {
  const box = document.getElementById('autocompleteBox');
  const items = Array.from(box.querySelectorAll('.autocomplete-item'));

  items.forEach((item, index) => {
    item.classList.toggle('active', index === state.autocompleteActiveIndex);
  });

  if (state.autocompleteActiveIndex >= 0 && items[state.autocompleteActiveIndex]) {
    items[state.autocompleteActiveIndex].scrollIntoView({
      block: 'nearest'
    });
  }
}

function scheduleAutocomplete() {
  if (state.isSearching || state.isInitializing) {
    hideAutocomplete(true);
    return;
  }

  clearTimeout(state.autoTimer);

  state.autoTimer = setTimeout(() => {
    const keyword = normalizeKeyword(getLastToken(document.getElementById('keyword').value || ''));

    if (!keyword || keyword.length < 2) {
      state.pendingAutocompleteKeyword = '';
      hideAutocomplete(true);
      state.autocompleteRequestSeq++;
      return;
    }

    state.pendingAutocompleteKeyword = keyword;
    runAutocompleteRequest(keyword);
  }, state.isComposing ? 120 : 60);
}

async function runAutocompleteRequest(keyword) {
  const currentKeyword = normalizeKeyword(getLastToken(document.getElementById('keyword').value || ''));

  if (!keyword || keyword.length < 2 || !currentKeyword || currentKeyword.length < 2) {
    hideAutocomplete(true);
    return;
  }

  if (keyword !== currentKeyword) {
    keyword = currentKeyword;
  }

  if (state.autocompleteCache.has(keyword)) {
    renderAutocomplete(state.autocompleteCache.get(keyword), keyword);
    return;
  }

  const requestId = ++state.autocompleteRequestSeq;
  showAutocompleteLoading();

  try {
    const url = new URL(API_BASE);
    url.searchParams.set('action', 'suggest');
    url.searchParams.set('keyword', keyword);

    const res = await fetch(url.toString(), { method: 'GET' });
    const data = await res.json();

    const latestKeyword = normalizeKeyword(getLastToken(document.getElementById('keyword').value || ''));

    if (requestId !== state.autocompleteRequestSeq) return;
    if (state.isSearching || state.isInitializing) return;

    if (!latestKeyword || latestKeyword.length < 2) {
      hideAutocomplete(true);
      return;
    }

    if (latestKeyword !== keyword) {
      hideAutocomplete(true);
      return;
    }

    const list = (data && data.suggestions) ? data.suggestions : [];
    state.autocompleteCache.set(keyword, list);
    renderAutocomplete(list, keyword);
  } catch (e) {
    const latestKeyword = normalizeKeyword(getLastToken(document.getElementById('keyword').value || ''));

    if (requestId !== state.autocompleteRequestSeq) return;
    if (state.isSearching || state.isInitializing) return;

    if (!latestKeyword || latestKeyword.length < 2 || latestKeyword !== keyword) {
      hideAutocomplete(true);
      return;
    }

    showAutocompleteEmpty('자동완성 조회 중 오류가 발생했습니다.');
  }
}

function fetchAutocompleteSuggestions(keyword) {
  runAutocompleteRequest(keyword);
}

function showAutocompleteLoading() {
  const box = document.getElementById('autocompleteBox');
  state.autocompleteActiveIndex = -1;
  box.innerHTML = `
    <div class="autocomplete-loading">
      <span class="mini-spinner"></span>
      <span>검색 중...</span>
    </div>
  `;
  box.style.display = 'block';
}

function showAutocompleteEmpty(message) {
  const box = document.getElementById('autocompleteBox');
  state.autocompleteActiveIndex = -1;
  box.innerHTML = `<div class="autocomplete-empty">${escapeHtml(message || '검색 결과가 없습니다.')}</div>`;
  box.style.display = 'block';
}

function renderAutocomplete(list, keyword = '') {
  const box = document.getElementById('autocompleteBox');
  const currentKeyword = normalizeKeyword(getLastToken(document.getElementById('keyword').value || ''));

  if (!currentKeyword || currentKeyword.length < 2) {
    hideAutocomplete(true);
    return;
  }

  if (keyword && currentKeyword !== keyword) {
    hideAutocomplete(true);
    return;
  }

  if (!list || !list.length) {
    state.autocompleteActiveIndex = -1;
    state.renderedAutocompleteKeyword = currentKeyword;
    showAutocompleteEmpty('일치하는 약물이 없습니다.');
    return;
  }

  if (
    box.style.display === 'block' &&
    state.renderedAutocompleteKeyword === currentKeyword &&
    box.querySelectorAll('.autocomplete-item').length === list.length
  ) {
    return;
  }

  state.autocompleteActiveIndex = -1;
  state.renderedAutocompleteKeyword = currentKeyword;

  box.innerHTML = list.map((item, index) => `
    <div class="autocomplete-item"
         data-index="${index}"
         data-action="selectSuggestion"
         data-brand-name="${escapeHtml(item.brand_name)}">
      <div class="auto-title">${escapeHtml(item.brand_name)}</div>
      <div class="auto-sub">${escapeHtml(item.ingredient_name)} · ${escapeHtml(item.drug_group)}</div>
    </div>
  `).join('');

  box.style.display = 'block';
}

function setAutocompleteActive(index) {
  state.autocompleteActiveIndex = index;
  updateAutocompleteActiveItem();
}

function selectSuggestion(name) {
  const textarea = document.getElementById('keyword');
  const tokens = splitMultiInputTokens(textarea.value);

  if (tokens.length === 0) {
    textarea.value = name + ', ';
  } else {
    tokens[tokens.length - 1] = name;
    textarea.value = rebuildKeywordText(tokens) + ', ';
  }

  hideAutocomplete(true);
  state.lastAutocompleteKeyword = '';
  state.autocompleteRequestSeq++;
  triggerSelectionFeedback();
  textarea.focus();
}

function triggerSelectionFeedback() {
  const textarea = document.getElementById('keyword');
  textarea.classList.remove('highlighted');
  clearTimeout(state.highlightTimer);

  requestAnimationFrame(() => {
    textarea.classList.add('highlighted');
  });

  state.highlightTimer = setTimeout(() => {
    textarea.classList.remove('highlighted');
  }, 520);

  if (navigator.vibrate) {
    navigator.vibrate(18);
  }
}

function hideAutocomplete(forceReset = false) {
  const box = document.getElementById('autocompleteBox');
  box.style.display = 'none';
  box.innerHTML = '';
  state.autocompleteActiveIndex = -1;
  state.renderedAutocompleteKeyword = '';

  if (forceReset) {
    clearTimeout(state.autoTimer);
    state.pendingAutocompleteKeyword = '';
  }
}

function handleSearch() {
  if (state.isSearching) return;

  const keywordRaw = document.getElementById('keyword').value.trim();
  const examType = document.getElementById('examType').value;

  if (!keywordRaw) {
    showErrorPopup('검색어를 입력해주세요.');
    return;
  }

  const tokens = splitMultiInputTokens(keywordRaw);
  const dedupedKeyword = rebuildKeywordText(tokens);
  document.getElementById('keyword').value = dedupedKeyword;

  if (!dedupedKeyword) {
    showErrorPopup('검색어를 입력해주세요.');
    return;
  }

  const tooShortToken = tokens.find(token => normalizeKeyword(token).length < 2);
  if (tooShortToken) {
    showErrorPopup('검색어는 2글자 이상 입력해주세요.');
    return;
  }

  hideAutocomplete(true);
  state.autocompleteRequestSeq++;
  if (document.activeElement) document.activeElement.blur();

  state.isSearching = true;
  setSearchButtonLoading(true);
  showLoadingOverlay(
    '검색 중',
    examType
      ? '선택한 검사 기준을 조회하고 있습니다.'
      : '전체 검사 기준을 조회하고 있습니다.'
  );
  setStatus(
    examType
      ? '선택한 검사 기준으로 검색 중입니다...'
      : '약물과 연결된 전체 검사 기준을 검색 중입니다...',
    true
  );
  clearResults();

  (async () => {
    try {
      const url = new URL(API_BASE);
      url.searchParams.set('action', 'search');
      url.searchParams.set('keyword', dedupedKeyword);
      url.searchParams.set('examType', examType || '');
      url.searchParams.set('mode', state.currentMode);
      url.searchParams.set('userAgent', navigator.userAgent);

      const res = await fetch(url.toString(), { method: 'GET' });
      const data = await res.json();

      state.isSearching = false;
      setSearchButtonLoading(false);
      hideLoadingOverlay();

      if (!data.success) {
        showErrorPopup(data.message || '검색에 실패했습니다.');
        return;
      }

      renderResults(data);

      const groupArea = document.getElementById('groupArea');
      if (groupArea.innerHTML.trim()) {
        setTimeout(() => {
          groupArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
    } catch (err) {
      state.isSearching = false;
      setSearchButtonLoading(false);
      hideLoadingOverlay();
      showErrorPopup('검색 중 오류가 발생했습니다: ' + getErrorMessage(err));
    }
  })();
}

function renderResults(res) {
  renderSummary(res.summary || null);
  renderGroupedResults(res.groupedResults || []);

  const totalKeywords = (res.keywords || []).length;
  const totalDrugRows = (res.results || []).length;
  const unresolved = (res.unresolvedKeywords || []).length;

  if (totalDrugRows === 0) {
    setStatus(res.message || '검색 결과가 없습니다.');
  } else {
    setStatus(`입력 약 ${totalKeywords}건 중 결과 약물 ${totalDrugRows}건을 찾았습니다. 미확인 ${unresolved}건.`);
  }
}

function renderSummary(summary) {
  const area = document.getElementById('summaryArea');
  area.innerHTML = '';
}

function renderGroupedResults(groupedResults) {
  const area = document.getElementById('groupArea');
  area.innerHTML = '';

  if (!groupedResults.length) {
    area.innerHTML = `<div class="empty">검색 결과가 없습니다.</div>`;
    return;
  }

  groupedResults.forEach(group => {
    const section = document.createElement('div');
    section.className = 'group-section';

    if (!group.found) {
      section.innerHTML = `
        <div class="group-header">
          <h3 class="group-title">검색어: ${escapeHtml(group.keyword)}</h3>
          <div class="group-count-badge">결과 없음</div>
        </div>

        <div class="empty" style="margin-top:0;">
          일치하는 약 정보를 찾지 못했습니다.<br>
          복용 중단에 해당하는 약이 아니거나, 등록되지 않은 약입니다.
          ${renderSuggestionChips(group.suggestions || [], group.keyword)}
        </div>
      `;
    } else {
      const sortedRows = [...group.results].sort((a, b) => {
        return Number(b.sort_weight || 0) - Number(a.sort_weight || 0);
      });

      section.innerHTML = `
        <div class="group-header">
          <h3 class="group-title">검색어: ${escapeHtml(group.keyword)}</h3>
          <div class="group-count-badge">${sortedRows.length}건</div>
        </div>

        <div class="result-wrap">
          ${sortedRows.map(item => createResultCardHtml(item)).join('')}
        </div>
      `;
    }

    area.appendChild(section);
  });
}

function renderSuggestionChips(list, originalKeyword) {
  if (!list || !list.length) return '';
  return `
    <div class="suggest-list">
      ${list.map(item => `
        <button class="suggest-chip"
                data-action="replaceKeywordAndSearch"
                data-old-name="${escapeHtml(originalKeyword)}"
                data-new-name="${escapeHtml(item.brand_name)}">
          ${escapeHtml(item.brand_name)}
        </button>
      `).join('')}
    </div>
  `;
}

function replaceKeywordAndSearch(oldName, newName) {
  const tokens = splitMultiInputTokens(document.getElementById('keyword').value);
  const replaced = tokens.map(token => normalizeKeyword(token) === normalizeKeyword(oldName) ? newName : token);
  document.getElementById('keyword').value = rebuildKeywordText(replaced);
  triggerSelectionFeedback();
  handleSearch();
}

function createResultCardHtml(item) {
  const examResults = Array.isArray(item.exam_results) ? item.exam_results : [];

  const commonInfo = `
    <div class="group-keyword-chip">검색어: ${escapeHtml(item.search_keyword || '-')}</div>

    <div class="result-head">
      <div>
        <div class="drug-name">${escapeHtml(item.brand_name || '-')}</div>
        <div class="subline">
          성분명: ${escapeHtml(item.ingredient_name || '-')}<br>
          약물군: ${escapeHtml(item.drug_group || '-')}
        </div>
      </div>
    </div>

    <div class="kv">
      <div class="k">일반 용도</div><div class="v">${escapeHtml(item.common_use || '-')}</div>
      <div class="k">검색 별칭</div><div class="v">${escapeHtml((item.aliases || []).join(', ') || '-')}</div>
      ${state.currentMode === 'staff' ? `<div class="k">약물 기본 주의도</div><div class="v">${escapeHtml(item.caution_level || '일반')}</div>` : ''}
      ${state.currentMode === 'staff' ? `<div class="k">직원 참고 메모</div><div class="v">${escapeHtml(item.staff_note || '-')}</div>` : ''}
    </div>

    ${state.currentMode === 'patient' ? `
      <div class="patient-help-note">
        아래 검사별 안내를 꼭 확인하세요.
      </div>
    ` : ''}
  `;

  let examHtml = '';

  if (!examResults.length) {
    examHtml = `
      <div class="exam-result-empty">
        해당 약에 연결된 검사 규칙이 없습니다.
      </div>
    `;
  } else {
    examHtml = `
      <div class="exam-result-list">
        ${examResults.map(result => {
          const rule = result.applied_rule || {};
          const caution = getExamDisplayCaution(item, rule);
          const showHoldPeriod = shouldShowHoldPeriod(rule);
          const patientGuidance = getPatientGuidanceNote(rule);

          return `
            <div class="exam-result-item">
              <div class="exam-result-head">
                <div class="exam-result-title">${escapeHtml(result.exam_type || '검사 미지정')}</div>
                <div class="exam-result-meta">
                  <div class="badge ${caution.className}">${escapeHtml(caution.label)}</div>
                  ${state.currentMode === 'staff'
                    ? `<div class="exam-meta-badge">매칭 ${escapeHtml(String(result.matched_rule_count || 0))}건</div>`
                    : ''
                  }
                </div>
              </div>

              <div class="exam-result-grid">
                <div class="k">복용 안내</div>
                <div class="v">${escapeHtml(formatNeedHold(rule.need_hold))}</div>

                ${showHoldPeriod ? `
                  <div class="k">중단 시점</div>
                  <div class="v">${escapeHtml(rule.hold_period || '-')}</div>
                ` : ''}

                <div class="k">${state.currentMode === 'staff' ? '환자 안내' : '안내 문구'}</div>
                <div class="v">${escapeHtml(rule.patient_message || '-')}</div>

                ${state.currentMode === 'staff' ? `
                  <div class="k">직원 안내</div>
                  <div class="v">${escapeHtml(rule.staff_message || '-')}</div>

                  <div class="k">예외 사항</div>
                  <div class="v">${escapeHtml(rule.exception_note || '-')}</div>
                ` : ''}
              </div>

              ${state.currentMode === 'patient' && patientGuidance ? `
                <div class="patient-guidance-box">
                  <strong>안내:</strong> ${escapeHtml(patientGuidance)}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  return `<div class="result-card">${commonInfo}${examHtml}</div>`;
}

function getRuleCautionLevel(item, rule) {
  return (rule && rule.caution_level) || item.caution_level || '일반';
}

function formatNeedHold(value) {
  if (value === 'Y') return '중단 필요';
  if (value === 'N') return state.currentMode === 'patient' ? '복용 유지' : '대부분 유지';
  if (value === 'CONSULT') return '상담 필요';
  return value || '-';
}

function shouldShowHoldPeriod(rule) {
  const needHold = String(rule?.need_hold || '').trim();
  const holdPeriod = String(rule?.hold_period || '').trim();

  if (!holdPeriod) return false;
  if (needHold === 'N' && holdPeriod === '임의중단 금지') return false;

  return true;
}

function getPatientGuidanceNote(rule) {
  const needHold = String(rule?.need_hold || '').trim();

  if (needHold === 'Y') {
    return '검사 전까지 중단 시점을 꼭 확인하세요.';
  }
  if (needHold === 'CONSULT') {
    return '임의로 결정하지 말고 검진센터 또는 처방의와 먼저 상의하세요.';
  }
  if (needHold === 'N') {
    return '별도 안내가 없는 경우 복용 후 방문하세요.';
  }
  return '';
}

function getCautionClass(level) {
  if (level === '매우높음' || level === '높음') return 'badge-danger';
  if (level === '중간') return 'badge-warn';
  return 'badge-normal';
}

function mapPatientCautionLabel(level) {
  const value = String(level || '').trim();

  if (state.currentMode === 'staff') {
    return value || '일반';
  }

  switch (value) {
    case '일반':
      return '복용 가능';
    case '중간':
      return '주의';
    case '높음':
      return '중요';
    case '매우높음':
      return '반드시 확인';
    default:
      return value || '복용 가능';
  }
}

function getExamDisplayCaution(item, rule) {
  const rawLevel = (rule && rule.caution_level) || item.caution_level || '일반';
  return {
    raw: rawLevel,
    label: mapPatientCautionLabel(rawLevel),
    className: getCautionClass(rawLevel)
  };
}

function getTargetTypeLabel(value) {
  if (value === 'drug') return '약 개별';
  if (value === 'group') return '약물군';
  return value || '-';
}
