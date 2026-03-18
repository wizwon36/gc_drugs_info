const API_BASE = 'https://script.google.com/macros/s/AKfycbyrR40UQWw2FwlU6tiPplAfAQqzE1d3JBvmamNvxNRymOg1vH9IP6fFZ2qDm5hxNFqwmg/exec';
const UI_LOADING_DELAY = 750;

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

  adminDrugTargetTimer: null
};
