const API_BASE = 'https://script.google.com/macros/s/AKfycbwdLK23L39y4WaPthsdR_A49rkCSb02CFDTZ1j_eS1xU5gY_Gk9bJ1BABmQwM3Mt2R3UQ/exec';

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
