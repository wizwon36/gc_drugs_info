// ⚠️  이 파일은 템플릿입니다.
// __API_BASE__ 는 GitHub Actions 배포 시 secrets.API_BASE 값으로 자동 교체됩니다.
// 이 파일을 직접 수정하지 마세요. API URL 변경은 GitHub Secrets에서 하세요.
const API_BASE = '__API_BASE__';

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

  patientNotice: '',
  staffNotice: '',
  contactText: '',

  adminToken: ''
};
