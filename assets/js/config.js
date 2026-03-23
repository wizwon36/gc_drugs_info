const API_BASE = 'https://script.google.com/macros/s/AKfycbxZkPZWX8bL0UoLMo2HtiJQAlfxsfWPhnnVf1vVqvFciI4oayZZlrYwJt7qDxyG-kI-jg/exec';

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
