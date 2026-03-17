function setStatus(text, isLoading = false) {
  const el = document.getElementById('statusText');
  if (!el) return;

  el.textContent = text || '';
  el.classList.toggle('loading', !!isLoading);

  if (!text) {
    el.classList.add('hidden');
    return;
  }

  el.classList.remove('hidden');
}

function showErrorPopup(message) {
  const msg = String(message || '오류가 발생했습니다.');
  window.alert(msg);
}

function setSearchButtonLoading(loading) {
  const btn = document.getElementById('searchBtn');

  if (btn) {
    btn.disabled = !!loading;
    btn.classList.toggle('loading', !!loading);
    btn.textContent = loading ? '조회중' : '🔍 조회';
  }
}

function showLoadingOverlay(title, message) {
  const overlay = document.getElementById('loadingOverlay');
  document.getElementById('loadingTitle').textContent = title || '불러오는 중';
  document.getElementById('loadingMessage').textContent = message || '처리 중입니다.';
  overlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.add('hidden');
}

function showAdminLoading(title, message) {
  showLoadingOverlay(title || '처리 중', message || '관리자 작업을 진행하고 있습니다.');
}

function hideAdminLoading() {
  hideLoadingOverlay();
}

function clearResults() {
  document.getElementById('summaryArea').innerHTML = '';
  document.getElementById('groupArea').innerHTML = '';
}

function resetSearchUI() {
  const keywordEl = document.getElementById('keyword');
  const examTypeEl = document.getElementById('examType');

  if (document.activeElement) {
    document.activeElement.blur();
  }

  if (keywordEl) {
    keywordEl.value = '';
    keywordEl.style.height = '';
    keywordEl.classList.remove('highlighted');
  }

  if (examTypeEl) {
    examTypeEl.selectedIndex = 0;
    examTypeEl.value = '';
  }

  clearResults();
  hideAutocomplete(true);
  clearTimeout(autoTimer);
  clearTimeout(highlightTimer);

  autocompleteCache.clear();
  autocompleteRequestSeq++;
  lastAutocompleteKeyword = '';
  isSearching = false;
  suppressBlurHide = false;

  setSearchButtonLoading(false);
  setStatus('');
}
