const API_BASE = 'https://script.google.com/macros/s/AKfycbz1oAJVr17OoZBLfJznJ3VSRXlgIL1x3hC6NVpHn0JYRcdBBrWzK9g9y1bSQykjyZ5IiQ/exec';

const state = {
  currentMode: 'patient',
  lockedMode: null,
  appConfig: {},
  examList: [],
  drugGroupList: [],
  isAdminLoggedIn: false,
  currentAdminTab: 'drug',
  autoTimer: null,

  autocompleteCache: new Map(),
  autocompleteRequestSeq: 0,
  lastAutocompleteKeyword: '',
  isSearching: false,
  isInitializing: true,
  suppressBlurHide: false,

  adminTapCount: 0,
  adminTapTimer: null,

  highlightTimer: null,
  isComposing: false,

  pendingAutocompleteKeyword: '',
  renderedAutocompleteKeyword: '',
  autocompleteActiveIndex: -1,

  adminDrugTargetTimer: null
};
