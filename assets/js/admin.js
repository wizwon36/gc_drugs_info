function renderExamOptions() {
  const select = document.getElementById('examType');
  const adminExam = document.getElementById('adminExamType');
  select.innerHTML = '<option value="">전체 검사 기준으로 검색</option>';
  adminExam.innerHTML = '<option value="">검사 선택</option>';

  examList.forEach(item => {
    const o1 = document.createElement('option');
    o1.value = item.name;
    o1.textContent = item.name;
    select.appendChild(o1);

    const o2 = document.createElement('option');
    o2.value = item.name;
    o2.textContent = item.name;
    adminExam.appendChild(o2);
  });
}

function renderAdminOptions() {
  const drugGroupSelect = document.getElementById('adminDrugGroup');
  const targetGroupSelect = document.getElementById('adminTargetValueGroup');

  drugGroupSelect.innerHTML = '<option value="">약물군 선택</option>';
  targetGroupSelect.innerHTML = '<option value="">약물군 선택</option>';

  drugGroupList.forEach(item => {
    const option1 = document.createElement('option');
    option1.value = item.name;
    option1.textContent = item.name;
    drugGroupSelect.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = item.name;
    option2.textContent = item.name;
    targetGroupSelect.appendChild(option2);
  });
}

function openAdminPanel() {
  if (isSearching || isInitializing) return;

  hideAutocomplete(true);

  document.getElementById('adminPanel').classList.remove('hidden');
  document.getElementById('adminLoginArea').classList.remove('hidden');
  document.getElementById('adminContentArea').classList.add('hidden');

  document.getElementById('adminModeBtn').classList.add('active');
  document.getElementById('patientModeBtn').classList.remove('active');
  document.getElementById('staffModeBtn').classList.remove('active');

  window.scrollTo({
    top: document.getElementById('adminPanel').offsetTop - 10,
    behavior: 'smooth'
  });
}

function closeAdminPanel() {
  document.getElementById('adminPanel').classList.add('hidden');
  document.getElementById('adminModeBtn').classList.remove('active');

  isAdminLoggedIn = false;
  document.getElementById('adminPassword').value = '';
  document.getElementById('adminLoginStatus').textContent = '';
  document.getElementById('adminLoginArea').classList.add('hidden');
  document.getElementById('adminContentArea').classList.add('hidden');

  setMode(currentMode);
}

function handleSecretAdminTrigger() {
  adminTapCount += 1;

  clearTimeout(adminTapTimer);
  adminTapTimer = setTimeout(() => {
    adminTapCount = 0;
  }, 1200);

  if (adminTapCount >= 3) {
    adminTapCount = 0;
    openAdminPanel();
  }
}

function setAdminTab(tab) {
  currentAdminTab = tab;
  document.getElementById('adminTabDrug').classList.toggle('active', tab === 'drug');
  document.getElementById('adminTabRule').classList.toggle('active', tab === 'rule');
  document.getElementById('adminTabStats').classList.toggle('active', tab === 'stats');

  document.getElementById('adminDrugPane').classList.toggle('hidden', tab !== 'drug');
  document.getElementById('adminRulePane').classList.toggle('hidden', tab !== 'rule');
  document.getElementById('adminStatsPane').classList.toggle('hidden', tab !== 'stats');

  if (tab === 'stats' && isAdminLoggedIn) loadStats(true);
}

async function loginAdmin() {
  const pw = document.getElementById('adminPassword').value.trim();

  if (!pw) {
    document.getElementById('adminLoginStatus').textContent = '비밀번호를 입력해주세요.';
    return;
  }

  showAdminLoading('관리자 로그인 중', '비밀번호를 확인하고 있습니다.');
  document.getElementById('adminLoginStatus').textContent = '로그인 확인 중입니다...';

  try {
    const res = await apiGet('verifyAdmin', { password: pw });

    if (!res.success) {
      hideAdminLoading();
      document.getElementById('adminLoginStatus').textContent = '비밀번호가 올바르지 않습니다.';
      return;
    }

    isAdminLoggedIn = true;
    document.getElementById('adminLoginStatus').textContent = '로그인되었습니다.';
    document.getElementById('adminLoginArea').classList.add('hidden');
    document.getElementById('adminContentArea').classList.remove('hidden');

    showAdminLoading('관리자 데이터 불러오는 중', '최근 등록 정보와 통계를 불러오고 있습니다.');

    await loadRecentAdminData(false);
    await loadStats(false);

    hideAdminLoading();
  } catch (err) {
    hideAdminLoading();
    document.getElementById('adminLoginStatus').textContent =
      '로그인 오류: ' + getErrorMessage(err);
  }
}

async function loadRecentAdminData(showLoading = false) {
  try {
    if (showLoading) {
      showAdminLoading('최근 데이터 불러오는 중', '최근 등록된 약물과 규칙을 조회하고 있습니다.');
    }

    const res = await apiGet('recentAdmin');

    if (showLoading) hideAdminLoading();
    if (!res.success) return;

    document.getElementById('recentDrugList').innerHTML =
      (res.drugs || []).map(item => `
        <div class="admin-item">
          <strong>${escapeHtml(item.drug_id)}</strong> · ${escapeHtml(item.brand_name)}
          <br><span class="small">${escapeHtml(item.ingredient_name)} / ${escapeHtml(item.drug_group)} / ${escapeHtml(item.caution_level)} / ${escapeHtml(item.is_active)}</span>
        </div>
      `).join('') || '<div class="small">데이터가 없습니다.</div>';

    document.getElementById('recentRuleList').innerHTML =
      (res.rules || []).map(item => `
        <div class="admin-item">
          <strong>${escapeHtml(item.rule_id)}</strong> · ${escapeHtml(item.exam_type)}
          <br><span class="small">${escapeHtml(item.target_display_type || item.target_type)} / ${escapeHtml(item.target_display_name || item.target_value)} / ${escapeHtml(item.caution_level || '일반')} / ${escapeHtml(item.need_hold)} / ${escapeHtml(item.is_active)}</span>
        </div>
      `).join('') || '<div class="small">데이터가 없습니다.</div>';
  } catch (err) {
    if (showLoading) hideAdminLoading();
    console.error(err);
  }
}

async function searchAdminDrugList(showLoading = true) {
  try {
    if (showLoading) {
      showAdminLoading('약물 검색 중', '관리자 약물 목록을 조회하고 있습니다.');
    }

    const keyword = document.getElementById('adminDrugSearch').value.trim();
    const listEl = document.getElementById('adminDrugSearchList');

    const res = await apiGet('searchAdminDrugs', { keyword, active_only: 'Y' });

    if (showLoading) hideAdminLoading();

    const items = res.items || [];

    if (!keyword || items.length === 0) {
      listEl.innerHTML = '';
      listEl.classList.add('compact-empty');
      return;
    }

    listEl.classList.remove('compact-empty');
    listEl.innerHTML = items.map(item => `
      <div class="admin-item">
        <strong>${escapeHtml(item.drug_id)}</strong> · ${escapeHtml(item.brand_name)}
        <br><span class="small">${escapeHtml(item.ingredient_name)} / ${escapeHtml(item.drug_group)} / ${escapeHtml(item.is_active)}</span>
        <div class="toolbar">
          <button class="btn secondary"
                  data-action="editDrug"
                  data-drug-id="${escapeHtml(item.drug_id)}">수정</button>
          <button class="btn secondary"
                  data-action="toggleDrug"
                  data-drug-id="${escapeHtml(item.drug_id)}">활성/비활성</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    if (showLoading) hideAdminLoading();
    console.error(err);
  }
}

async function searchAdminRuleList(showLoading = true) {
  try {
    if (showLoading) {
      showAdminLoading('규칙 검색 중', '관리자 규칙 목록을 조회하고 있습니다.');
    }

    const keyword = document.getElementById('adminRuleSearch').value.trim();
    const listEl = document.getElementById('adminRuleSearchList');

    const res = await apiGet('searchAdminRules', { keyword });

    if (showLoading) hideAdminLoading();

    const items = res.items || [];

    if (!keyword || items.length === 0) {
      listEl.innerHTML = '';
      listEl.classList.add('compact-empty');
      return;
    }

    listEl.classList.remove('compact-empty');
    listEl.innerHTML = items.map(item => `
      <div class="admin-item">
        <strong>${escapeHtml(item.rule_id)}</strong> · ${escapeHtml(item.exam_type)}
        <br><span class="small">${escapeHtml(item.target_display_type || item.target_type)} / ${escapeHtml(item.target_display_name || item.target_value)} / ${escapeHtml(item.caution_level || '일반')} / ${escapeHtml(item.need_hold)} / ${escapeHtml(item.is_active)}</span>
        <div class="toolbar">
          <button class="btn secondary"
                  data-action="editRule"
                  data-rule-id="${escapeHtml(item.rule_id)}">수정</button>
          <button class="btn secondary"
                  data-action="toggleRule"
                  data-rule-id="${escapeHtml(item.rule_id)}">활성/비활성</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    if (showLoading) hideAdminLoading();
    console.error(err);
  }
}

function prepareNewDrug() {
  clearDrugForm();

  const listEl = document.getElementById('adminDrugSearchList');
  if (listEl) {
    listEl.innerHTML = '';
    listEl.classList.add('compact-empty');
  }

  document.getElementById('adminDrugStatus').textContent = '신규 약물 입력 모드입니다.';
}

function prepareNewRule() {
  clearRuleForm();

  const listEl = document.getElementById('adminRuleSearchList');
  if (listEl) {
    listEl.innerHTML = '';
    listEl.classList.add('compact-empty');
  }

  document.getElementById('adminRuleStatus').textContent = '신규 규칙 입력 모드입니다.';
}

async function editDrug(drugId) {
  try {
    const res = await apiGet('drugDetail', { drugId });
    if (!res.success) return;

    const item = res.item;
    document.getElementById('adminDrugId').value = item.drug_id || '';
    document.getElementById('adminBrandName').value = item.brand_name || '';
    document.getElementById('adminIngredientName').value = item.ingredient_name || '';
    document.getElementById('adminDrugGroup').value = item.drug_group || '';
    document.getElementById('adminAliases').value = item.aliases || '';
    document.getElementById('adminPatientKeywords').value = item.patient_keywords || '';
    document.getElementById('adminCommonUse').value = item.common_use || '';
    document.getElementById('adminCautionLevel').value = item.caution_level || '일반';
    document.getElementById('adminStaffNote').value = item.staff_note || '';
    document.getElementById('adminDrugActive').value = item.is_active || 'Y';
    document.getElementById('adminDrugStatus').textContent = `${item.drug_id} 수정 모드입니다.`;
  } catch (err) {
    console.error(err);
  }
}

async function editRule(ruleId) {
  try {
    const res = await apiGet('ruleDetail', { ruleId });
    if (!res.success) return;

    const item = res.item;
    document.getElementById('adminRuleId').value = item.rule_id || '';
    document.getElementById('adminExamType').value = item.exam_type || '';
    document.getElementById('adminTargetType').value = item.target_type || 'group';
    document.getElementById('adminTargetValue').value = item.target_value || '';
    document.getElementById('adminRuleCautionLevel').value = item.caution_level || '일반';
    document.getElementById('adminNeedHold').value = item.need_hold || 'Y';
    document.getElementById('adminHoldPeriod').value = item.hold_period || '';
    document.getElementById('adminPatientMessage').value = item.patient_message || '';
    document.getElementById('adminStaffMessage').value = item.staff_message || '';
    document.getElementById('adminExceptionNote').value = item.exception_note || '';
    document.getElementById('adminPriority').value = item.priority || '9';
    document.getElementById('adminRuleActive').value = item.is_active || 'Y';

    syncAdminTargetValueUI();

    if ((item.target_type || '') === 'group') {
      document.getElementById('adminTargetValueGroup').value = item.target_value || '';
      document.getElementById('adminTargetValue').value = item.target_value || '';
      clearAdminTargetDrugSelection();
    } else {
      document.getElementById('adminTargetDrugSearch').value = item.target_display_name || item.target_value || '';
      document.getElementById('adminTargetDrugSelected').innerHTML =
        `<div class="target-picked-box">선택됨: ${escapeHtml(item.target_display_name || item.target_value || '')}</div>`;
    }

    document.getElementById('adminRuleStatus').textContent = `${item.rule_id} 수정 모드입니다.`;
  } catch (err) {
    console.error(err);
  }
}

async function saveDrugItem() {
  if (!isAdminLoggedIn) return;

  const payload = {
    drug_id: getValue('adminDrugId'),
    brand_name: getValue('adminBrandName'),
    ingredient_name: getValue('adminIngredientName'),
    drug_group: getValue('adminDrugGroup'),
    aliases: getValue('adminAliases'),
    patient_keywords: getValue('adminPatientKeywords'),
    common_use: getValue('adminCommonUse'),
    caution_level: getValue('adminCautionLevel'),
    staff_note: getValue('adminStaffNote'),
    is_active: getValue('adminDrugActive')
  };

  if (!payload.brand_name || !payload.ingredient_name || !payload.drug_group) {
    showErrorPopup('필수 입력값을 확인해주세요. (약품명, 성분명, 약물군)');
    return;
  }

  const action = payload.drug_id ? 'updateDrug' : 'addDrug';

  showAdminLoading(
    payload.drug_id ? '약물 정보 수정 중' : '약물 정보 저장 중',
    '관리자 약물 데이터를 저장하고 있습니다.'
  );

  try {
    const res = await apiGet(action, payload);

    document.getElementById('adminDrugStatus').textContent =
      (res.message || '') + (res.drug_id ? ` (${res.drug_id})` : '');

    if (!res.success) {
      hideAdminLoading();
      return;
    }

    if (!payload.drug_id) {
      clearDrugForm();
    }

    await loadRecentAdminData(false);
    await searchAdminDrugList(false);
    autocompleteCache.clear();
    lastAutocompleteKeyword = '';

    hideAdminLoading();
  } catch (err) {
    hideAdminLoading();
    document.getElementById('adminDrugStatus').textContent =
      '저장 오류: ' + getErrorMessage(err);
  }
}

async function saveRuleItem() {
  if (!isAdminLoggedIn) return;

  const targetType = getValue('adminTargetType');
  let targetValue = '';

  if (targetType === 'group') {
    targetValue = getValue('adminTargetValueGroup');
    document.getElementById('adminTargetValue').value = targetValue;
  } else {
    targetValue = getValue('adminTargetValue');
  }

  const payload = {
    rule_id: getValue('adminRuleId'),
    exam_type: getValue('adminExamType'),
    target_type: targetType,
    target_value: targetValue,
    caution_level: getValue('adminRuleCautionLevel') || '일반',
    need_hold: getValue('adminNeedHold'),
    hold_period: getValue('adminHoldPeriod'),
    patient_message: getValue('adminPatientMessage'),
    staff_message: getValue('adminStaffMessage'),
    exception_note: getValue('adminExceptionNote'),
    priority: getValue('adminPriority') || '9',
    is_active: getValue('adminRuleActive')
  };

  if (!payload.exam_type || !payload.target_type || !payload.target_value) {
    showErrorPopup('필수 입력값을 확인해주세요. (검사 종류, 적용 기준, 적용 대상 값)');
    return;
  }

  if (!['Y', 'N', 'CONSULT'].includes(payload.need_hold)) {
    showErrorPopup('중단 필요 여부는 Y, N, CONSULT 중 하나여야 합니다.');
    return;
  }

  if (payload.target_type === 'drug' && !/^D\d+$/i.test(payload.target_value)) {
    showErrorPopup('개별 약 규칙은 drug_id가 선택되어야 합니다.');
    return;
  }

  const action = payload.rule_id ? 'updateRule' : 'addRule';

  showAdminLoading(
    payload.rule_id ? '규칙 정보 수정 중' : '규칙 정보 저장 중',
    '관리자 규칙 데이터를 저장하고 있습니다.'
  );

  try {
    const res = await apiGet(action, payload);

    document.getElementById('adminRuleStatus').textContent =
      (res.message || '') + (res.rule_id ? ` (${res.rule_id})` : '');

    if (!res.success) {
      hideAdminLoading();
      return;
    }

    if (!payload.rule_id) {
      clearRuleForm();
    }

    await loadRecentAdminData(false);
    await searchAdminRuleList(false);

    hideAdminLoading();
  } catch (err) {
    hideAdminLoading();
    document.getElementById('adminRuleStatus').textContent =
      '저장 오류: ' + getErrorMessage(err);
  }
}

async function toggleDrug(drugId) {
  showAdminLoading('약물 상태 변경 중', '활성/비활성 상태를 변경하고 있습니다.');

  try {
    const res = await apiGet('toggleDrug', { drugId });

    document.getElementById('adminDrugStatus').textContent = res.message || '';

    if (!res.success) {
      hideAdminLoading();
      return;
    }

    await loadRecentAdminData(false);
    await searchAdminDrugList(false);
    autocompleteCache.clear();
    lastAutocompleteKeyword = '';

    hideAdminLoading();
  } catch (err) {
    hideAdminLoading();
    document.getElementById('adminDrugStatus').textContent =
      '변경 오류: ' + getErrorMessage(err);
  }
}

async function toggleRule(ruleId) {
  showAdminLoading('규칙 상태 변경 중', '활성/비활성 상태를 변경하고 있습니다.');

  try {
    const res = await apiGet('toggleRule', { ruleId });

    document.getElementById('adminRuleStatus').textContent = res.message || '';

    if (!res.success) {
      hideAdminLoading();
      return;
    }

    await loadRecentAdminData(false);
    await searchAdminRuleList(false);

    hideAdminLoading();
  } catch (err) {
    hideAdminLoading();
    document.getElementById('adminRuleStatus').textContent =
      '변경 오류: ' + getErrorMessage(err);
  }
}

function toggleCurrentDrugActive() {
  const id = getValue('adminDrugId');
  if (!id) {
    document.getElementById('adminDrugStatus').textContent = '먼저 수정할 약물을 불러오세요.';
    return;
  }
  toggleDrug(id);
}

function toggleCurrentRuleActive() {
  const id = getValue('adminRuleId');
  if (!id) {
    document.getElementById('adminRuleStatus').textContent = '먼저 수정할 규칙을 불러오세요.';
    return;
  }
  toggleRule(id);
}

async function loadStats(showLoading = false) {
  try {
    if (showLoading) {
      showAdminLoading('통계 불러오는 중', '검색 통계를 집계하고 있습니다.');
    }

    const res = await apiGet('stats');
    if (!res.success) {
      if (showLoading) hideAdminLoading();
      return;
    }

    document.getElementById('statsSummaryWrap').innerHTML = `
      <div class="summary-card full">
        <div class="summary-label">총 검색수</div>
        <div class="summary-value summary-blue">${res.totalSearches || 0}</div>
      </div>
    `;

    renderStatsList('statsKeywordList', res.topKeywords || []);
    renderStatsList('statsExamList', res.topExams || []);
    renderStatsList('statsResultList', res.topResults || []);

    if (showLoading) hideAdminLoading();
  } catch (err) {
    if (showLoading) hideAdminLoading();
    console.error(err);
  }
}

function renderStatsList(id, list) {
  document.getElementById(id).innerHTML =
    list.map(item => `
      <div class="admin-item">
        <strong>${escapeHtml(item.name)}</strong>
        <br><span class="small">검색 ${item.count}회</span>
      </div>
    `).join('') || '<div class="small">데이터가 없습니다.</div>';
}

function clearDrugForm() {
  ['adminDrugId','adminBrandName','adminIngredientName','adminAliases','adminPatientKeywords','adminCommonUse','adminStaffNote'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('adminDrugGroup').value = '';
  document.getElementById('adminCautionLevel').value = '일반';
  document.getElementById('adminDrugActive').value = 'Y';
}

function clearRuleForm() {
  ['adminRuleId','adminTargetValue','adminHoldPeriod','adminPatientMessage','adminStaffMessage','adminExceptionNote'].forEach(id => {
    document.getElementById(id).value = '';
  });

  document.getElementById('adminExamType').value = '';
  document.getElementById('adminTargetType').value = 'group';
  document.getElementById('adminRuleCautionLevel').value = '일반';
  document.getElementById('adminNeedHold').value = 'Y';
  document.getElementById('adminPriority').value = '9';
  document.getElementById('adminRuleActive').value = 'Y';

  document.getElementById('adminTargetValueGroup').value = '';
  clearAdminTargetDrugSelection();
  syncAdminTargetValueUI();
}

function syncAdminTargetValueUI() {
  const type = getValue('adminTargetType');
  const groupWrap = document.getElementById('adminTargetValueGroupWrap');
  const drugWrap = document.getElementById('adminTargetValueDrugWrap');
  const hiddenValue = document.getElementById('adminTargetValue');

  if (type === 'group') {
    groupWrap.classList.remove('hidden');
    drugWrap.classList.add('hidden');
    clearAdminTargetDrugSelection();
    hiddenValue.value = document.getElementById('adminTargetValueGroup').value || '';
  } else {
    groupWrap.classList.add('hidden');
    drugWrap.classList.remove('hidden');
    document.getElementById('adminTargetValueGroup').value = '';
    hiddenValue.value = hiddenValue.value || '';
  }
}

function scheduleAdminDrugTargetSearch() {
  clearTimeout(adminDrugTargetTimer);
  adminDrugTargetTimer = setTimeout(() => {
    searchAdminDrugTargetList();
  }, 180);
}

async function searchAdminDrugTargetList() {
  const keyword = getValue('adminTargetDrugSearch');
  const listEl = document.getElementById('adminTargetDrugSearchList');

  if (!keyword || normalizeKeyword(keyword).length < 1) {
    listEl.innerHTML = '';
    listEl.classList.add('compact-empty');
    return;
  }

  try {
    const res = await apiGet('searchAdminDrugs', { keyword, active_only: 'Y' });
    const items = (res.items || []).filter(item => String(item.is_active || '').toUpperCase() === 'Y');

    if (!items.length) {
      listEl.innerHTML = '<div class="admin-item"><span class="small">활성 상태의 약물이 없습니다.</span></div>';
      listEl.classList.remove('compact-empty');
      return;
    }

    listEl.classList.remove('compact-empty');
    listEl.innerHTML = items.slice(0, 10).map(item => `
      <div class="admin-item">
        <strong>${escapeHtml(item.drug_id)}</strong> · ${escapeHtml(item.brand_name)}
        <br><span class="small">${escapeHtml(item.ingredient_name)} / ${escapeHtml(item.drug_group)} / ${escapeHtml(item.is_active)}</span>
        <div class="toolbar">
          <button class="btn secondary"
                  data-action="selectAdminTargetDrug"
                  data-drug-id="${escapeHtml(item.drug_id)}"
                  data-brand-name="${escapeHtml(item.brand_name)}"
                  data-ingredient-name="${escapeHtml(item.ingredient_name)}">선택</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

function selectAdminTargetDrug(drugId, brandName, ingredientName) {
  document.getElementById('adminTargetValue').value = drugId;
  document.getElementById('adminTargetDrugSearch').value = brandName;
  document.getElementById('adminTargetDrugSelected').innerHTML =
    `<div class="target-picked-box">선택됨: ${escapeHtml(drugId)} · ${escapeHtml(brandName)}</div>`;

  const listEl = document.getElementById('adminTargetDrugSearchList');
  listEl.innerHTML = '';
  listEl.classList.add('compact-empty');
}

function clearAdminTargetDrugSelection() {
  document.getElementById('adminTargetDrugSearch').value = '';
  document.getElementById('adminTargetDrugSelected').innerHTML = '';
  document.getElementById('adminTargetDrugSearchList').innerHTML = '';
  document.getElementById('adminTargetDrugSearchList').classList.add('compact-empty');
}
