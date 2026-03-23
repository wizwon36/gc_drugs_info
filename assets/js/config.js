const API_BASE = 'https://script.google.com/macros/s/AKfycbzYUW9XPya-eK-2ziTRL5NhZzzgkRzgkX6hcNogE5rM_25uAoSjSsfUdwLAuf-pdqBiTQ/exec';

const state = {
  currentMode: 'patient',
  lockedMode: null,
  appConfig: {},
  examList: [],
  drugGroupList: [],
  adminExamList: [],
  adminDrugGroupList: [],
  isAdminLoggedIn: false,
  currentAdminTab: 'drug',
  autoTimer: null,

  autocompleteCache: new Map(),
  autocompleteRequestSeq: 0,
  lastAutocompleteKeyword: '',
  isSearching: false,
  isInitializing: true,
  suppressBlurHide: false,
  autocompleteLoadingKeyword: '',

  adminTapCount: 0,
  adminTapTimer: null,

  highlightTimer: null,
  isComposing: false,

  pendingAutocompleteKeyword: '',
  renderedAutocompleteKeyword: '',
  autocompleteActiveIndex: -1,

  adminDrugTargetTimer: null,

  // ✅ 추가: window.* 전역 변수 대신 state로 관리
  patientNotice: '',
  staffNotice: '',
  contactText: ''
};
