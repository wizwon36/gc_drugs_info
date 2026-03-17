function setStatus(text, isLoading = false) {
  const el = document.getElementById('statusText');
  if (!el) return;

  el.textContent = text || '';
  el.classList.toggle('loading', !!isLoading);

  if (!text) {
    el.classList.add('hidden');
    return;
  }

  if (isLoading) {
    el.classList.add('hidden');
    return;
  }

  el.classList.add('hidden');
}

function showErrorPopup(message) {
  const msg = String(message || '오류가 발생했습니다.');
  window.alert(msg);
}

function setSearchButtonLoading(loading) {
  const btn = document.getElementById('searchBtn');
  if (!btn) return;

  btn.disabled = !!loading;
  btn.classList.toggle('loading', !!loading);
  btn.textContent = loading ? '조회중' : '조회';
}

function showLoadingOverlay(title, message) {
  const overlay = document.getElementById('loadingOverlay');
  if (!overlay) return;

  const titleEl = document.getElementById('loadingTitle');
  const msgEl = document.getElementById('loadingMessage');

  if (titleEl) titleEl.textContent = title || '불러오는 중';
  if (msgEl) msgEl.textContent = message || '처리 중입니다.';

  overlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loadingOverlay');
  if (!overlay) return;

  overlay.classList.add('hidden');
}

function showAdminLoading(title, message) {
  showLoadingOverlay(title || '처리 중', message || '관리자 작업을 진행하고 있습니다.');
}

function hideAdminLoading() {
  hideLoadingOverlay();
}

function clearResults() {
  const summaryArea = document.getElementById('summaryArea');
  const groupArea = document.getElementById('groupArea');

  if (summaryArea) summaryArea.innerHTML = '';
  if (groupArea) groupArea.innerHTML = '';
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

  clearTimeout(state.autoTimer);
  clearTimeout(state.highlightTimer);

  state.autocompleteCache.clear();
  state.autocompleteRequestSeq += 1;
  state.lastAutocompleteKeyword = '';
  state.isSearching = false;
  state.suppressBlurHide = false;
  state.pendingAutocompleteKeyword = '';
  state.renderedAutocompleteKeyword = '';
  state.autocompleteActiveIndex = -1;

  setSearchButtonLoading(false);
  setStatus('');
}
