async function initializeApp() {
  isInitializing = true;
  showLoadingOverlay('초기 데이터 불러오는 중', '약물 및 검사 정보를 준비하고 있습니다.');
  setStatus('초기 데이터를 불러오는 중입니다...', true);

  try {
    const url = new URL(API_BASE);
    url.searchParams.set('action', 'init');

    const res = await fetch(url.toString(), {
      method: 'GET'
    });

    const data = await res.json();

    isInitializing = false;
    hideLoadingOverlay();

    if (!data.success) {
      showErrorPopup(data.message || '초기화에 실패했습니다.');
      return;
    }

    appConfig = data.config || {};
    examList = data.exams || [];
    drugGroupList = data.drugGroups || [];
    renderExamOptions();
    renderAdminOptions();
    applyConfig();
    setStatus('약 이름만 입력해도 검색할 수 있습니다.');
  } catch (err) {
    isInitializing = false;
    hideLoadingOverlay();
    showErrorPopup('초기화 중 오류가 발생했습니다: ' + getErrorMessage(err));
  }
}

function applyConfig() {
  const hospitalName = appConfig.hospital_name || '녹십자아이메드';
  const patientNotice = appConfig.patient_notice || '복용약은 임의로 중단하지 말고, 반드시 검진센터 또는 처방의와 상담 후 결정하세요.';
  const staffNotice = appConfig.staff_notice || '최종 안내 전 검사 종류와 환자 상태를 다시 확인하세요.';
  const contactPhone = appConfig.contact_phone || '';
  const contactText = contactPhone ? `<div class="contact">문의: ${escapeHtml(contactPhone)}</div>` : '';

  document.getElementById('footerNotice').innerHTML = `<div>${escapeHtml(patientNotice)}</div>${contactText}`;
  document.querySelector('.brand-title').textContent = hospitalName;

  window.patientNotice = patientNotice;
  window.staffNotice = staffNotice;
  window.contactText = contactText;

  const heroModeLabel = document.getElementById('heroModeLabel');
  if (heroModeLabel) {
    heroModeLabel.classList.add('hidden');
    heroModeLabel.textContent = '환자용';
    heroModeLabel.classList.remove('staff');
  }

  const homeBtn = document.getElementById('homeBtn');
  if (homeBtn) homeBtn.classList.add('hidden');
}

function startPatientMode() {
  lockedMode = 'patient';
  startModeWithLoading('patient');
}

function startStaffMode() {
  if (isSearching || isInitializing) return;

  const pw = window.prompt('직원용 조회 비밀번호를 입력하세요.');

  if (pw === null) {
    return;
  }

  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayPassword = `${yy}${mm}${dd}`;

  if (String(pw).trim() !== todayPassword) {
    showErrorPopup('비밀번호가 올바르지 않습니다.');
    return;
  }

  lockedMode = 'staff';
  startModeWithLoading('staff');
}

function startModeWithLoading(mode) {
  if (isSearching || isInitializing) return;

  const title = mode === 'patient' ? '환자용 화면 준비 중' : '직원용 화면 준비 중';
  const message = mode === 'patient'
    ? '안내 화면으로 이동하고 있습니다.'
    : '조회 화면으로 이동하고 있습니다.';

  showLoadingOverlay(title, message);
  setStatus('화면을 준비하고 있습니다...', true);

  setTimeout(() => {
    document.getElementById('landingPanel').classList.add('hidden');
    document.getElementById('mainPanel').classList.remove('hidden');
    document.getElementById('homeBtn').classList.remove('hidden');

    if (mode === 'patient') {
      setMode('patient');
      simplifyPatientUI();
    } else {
      setMode('staff');
      restoreFullUI();
    }

    applyLockedModeUI();
    updateHeroModeLabel(mode);

    hideLoadingOverlay();
    setStatus(mode === 'patient' ? '환자용 안내 모드입니다.' : '직원용 조회 모드입니다.');

    setTimeout(() => {
      const keyword = document.getElementById('keyword');
      if (keyword) keyword.focus();
    }, 50);
  }, 1500);
}

function bindStaticEvents() {
  document.getElementById('startPatientBtn')?.addEventListener('click', startPatientMode);
  document.getElementById('startStaffBtn')?.addEventListener('click', startStaffMode);
  document.getElementById('homeBtn')?.addEventListener('click', goHome);

  document.getElementById('patientModeBtn')?.addEventListener('click', () => setMode('patient'));
  document.getElementById('staffModeBtn')?.addEventListener('click', () => setMode('staff'));
  document.getElementById('adminModeBtn')?.addEventListener('click', openAdminPanel);

  document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
  document.getElementById('searchBtnMobile')?.addEventListener('click', handleSearch);

  document.getElementById('adminLoginBtn')?.addEventListener('click', loginAdmin);

  document.getElementById('adminTabDrug')?.addEventListener('click', () => setAdminTab('drug'));
  document.getElementById('adminTabRule')?.addEventListener('click', () => setAdminTab('rule'));
  document.getElementById('adminTabStats')?.addEventListener('click', () => setAdminTab('stats'));
  document.getElementById('closeAdminPanelBtn')?.addEventListener('click', closeAdminPanel);

  document.getElementById('adminDrugSearchBtn')?.addEventListener('click', () => searchAdminDrugList(true));
  document.getElementById('adminDrugRecentBtn')?.addEventListener('click', () => loadRecentAdminData(true));
  document.getElementById('adminDrugNewBtn')?.addEventListener('click', prepareNewDrug);
  document.getElementById('saveDrugBtn')?.addEventListener('click', saveDrugItem);
  document.getElementById('toggleCurrentDrugBtn')?.addEventListener('click', toggleCurrentDrugActive);

  document.getElementById('adminRuleSearchBtn')?.addEventListener('click', () => searchAdminRuleList(true));
  document.getElementById('adminRuleRecentBtn')?.addEventListener('click', () => loadRecentAdminData(true));
  document.getElementById('adminRuleNewBtn')?.addEventListener('click', prepareNewRule);
  document.getElementById('saveRuleBtn')?.addEventListener('click', saveRuleItem);
  document.getElementById('toggleCurrentRuleBtn')?.addEventListener('click', toggleCurrentRuleActive);
}

function goHome() {
  if (isSearching || isInitializing) return;

  showLoadingOverlay('처음 화면으로 이동 중', '입력 내용과 검색 결과를 정리하고 있습니다.');
  setStatus('처음 화면으로 이동 중입니다...', true);

  setTimeout(() => {
    resetSearchUI();

    document.getElementById('landingPanel').classList.remove('hidden');
    document.getElementById('mainPanel').classList.add('hidden');
    document.getElementById('adminPanel').classList.add('hidden');
    document.getElementById('homeBtn').classList.add('hidden');

    currentMode = 'patient';
    lockedMode = null;
    isAdminLoggedIn = false;
    document.getElementById('adminModeBtn').classList.remove('active');
    document.getElementById('patientModeBtn').classList.add('active');
    document.getElementById('staffModeBtn').classList.remove('active');
    applyLockedModeUI();

    document.getElementById('footerNotice').innerHTML =
      `<div>${escapeHtml(window.patientNotice || '')}</div>${window.contactText || ''}`;

    const heroModeLabel = document.getElementById('heroModeLabel');
    if (heroModeLabel) {
      heroModeLabel.classList.add('hidden');
      heroModeLabel.textContent = '환자용';
      heroModeLabel.classList.remove('staff');
    }

    document.getElementById('adminPassword').value = '';
    document.getElementById('adminLoginStatus').textContent = '';
    document.getElementById('adminLoginArea').classList.add('hidden');
    document.getElementById('adminContentArea').classList.add('hidden');

    clearDrugForm();
    clearRuleForm();

    hideLoadingOverlay();
    window.scrollTo(0, 0);
  }, 1500);
}

function simplifyPatientUI() {
}

function restoreFullUI() {
}

function applyLockedModeUI() {
  const patientBtn = document.getElementById('patientModeBtn');
  const staffBtn = document.getElementById('staffModeBtn');

  if (!patientBtn || !staffBtn) return;

  if (!lockedMode) {
    patientBtn.classList.remove('hidden');
    staffBtn.classList.remove('hidden');
    return;
  }

  if (lockedMode === 'patient') {
    patientBtn.classList.remove('hidden');
    staffBtn.classList.add('hidden');
  } else if (lockedMode === 'staff') {
    patientBtn.classList.add('hidden');
    staffBtn.classList.remove('hidden');
  }
}

function updateHeroModeLabel(mode) {
  const heroModeLabel = document.getElementById('heroModeLabel');
  if (!heroModeLabel) return;

  heroModeLabel.classList.remove('hidden');

  if (mode === 'staff') {
    heroModeLabel.textContent = '직원용';
    heroModeLabel.classList.add('staff');
  } else {
    heroModeLabel.textContent = '환자용';
    heroModeLabel.classList.remove('staff');
  }
}

function setMode(mode) {
  if (lockedMode && mode !== lockedMode) return;

  currentMode = mode;
  hideAutocomplete(true);

  document.getElementById('patientModeBtn').classList.toggle('active', mode === 'patient');
  document.getElementById('staffModeBtn').classList.toggle('active', mode === 'staff');
  document.getElementById('adminModeBtn').classList.remove('active');

  if (mode === 'patient') {
    document.getElementById('footerNotice').innerHTML = `<div>${escapeHtml(window.patientNotice || '')}</div>${window.contactText || ''}`;
    simplifyPatientUI();
  } else {
    document.getElementById('footerNotice').innerHTML = `<div>${escapeHtml(window.staffNotice || '')}</div>${window.contactText || ''}`;
    restoreFullUI();
  }

  document.getElementById('adminPanel').classList.add('hidden');
  clearResults();
}

window.addEventListener('DOMContentLoaded', () => {
  syncAppWidth();
  bindStaticEvents();
  
  setTimeout(() => {
    syncAppWidth();
  }, 50);

  initializeApp();

  setTimeout(() => {
    syncAdminTargetValueUI();
  }, 0);

  const keywordInput = document.getElementById('keyword');
  const autoBox = document.getElementById('autocompleteBox');
  const examSelect = document.getElementById('examType');

  autoBox.addEventListener('mouseleave', () => {
    autocompleteActiveIndex = -1;
    updateAutocompleteActiveItem();
  });

  const adminTargetType = document.getElementById('adminTargetType');
  const adminTargetValueGroup = document.getElementById('adminTargetValueGroup');
  const adminTargetDrugSearch = document.getElementById('adminTargetDrugSearch');

  if (adminTargetType) {
    adminTargetType.addEventListener('change', syncAdminTargetValueUI);
  }

  if (adminTargetValueGroup) {
    adminTargetValueGroup.addEventListener('change', () => {
      document.getElementById('adminTargetValue').value = adminTargetValueGroup.value || '';
    });
  }

  if (adminTargetDrugSearch) {
    adminTargetDrugSearch.addEventListener('input', () => {
      scheduleAdminDrugTargetSearch();
    });

    adminTargetDrugSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchAdminDrugTargetList();
      }
    });
  }

  keywordInput.addEventListener('compositionstart', () => {
    isComposing = true;
  });

  keywordInput.addEventListener('compositionend', () => {
    isComposing = false;
    setTimeout(() => {
      scheduleAutocomplete();
    }, 30);
  });

  keywordInput.addEventListener('input', () => {
    setTimeout(() => {
      scheduleAutocomplete();
    }, 0);
  });

  keywordInput.addEventListener('focus', () => {
    scheduleAutocomplete();
  });

  keywordInput.addEventListener('blur', () => {
    setTimeout(() => {
      if (!suppressBlurHide) hideAutocomplete(true);
      suppressBlurHide = false;
    }, 120);
  });

  keywordInput.addEventListener('keydown', handleKeywordKeydown);

  examSelect.addEventListener('change', () => {});

  autoBox.addEventListener('mousedown', () => {
    suppressBlurHide = true;
  });

  autoBox.addEventListener('touchstart', () => {
    suppressBlurHide = true;
  }, { passive: true });

  document.addEventListener('click', (e) => {
    const field = document.getElementById('keywordField');
    if (field && !field.contains(e.target)) hideAutocomplete(true);
  });

  document.addEventListener('touchstart', (e) => {
    const field = document.getElementById('keywordField');
    if (field && !field.contains(e.target)) hideAutocomplete(true);
  }, { passive: true });

  window.addEventListener('resize', () => {
    syncAppWidth();
  });

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      syncAppWidth();
    }, 180);
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      syncAppWidth();
    });

    window.visualViewport.addEventListener('scroll', () => {
      syncAppWidth();
    });
  }

  const secretAdminTrigger = document.getElementById('secretAdminTrigger');
  if (secretAdminTrigger) {
    secretAdminTrigger.addEventListener('click', handleSecretAdminTrigger);
  }

  const adminPasswordInput = document.getElementById('adminPassword');
  if (adminPasswordInput) {
    adminPasswordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        loginAdmin();
      }
    });
  }
});
