const API_BASE = 'https://script.google.com/macros/s/AKfycbz1oAJVr17OoZBLfJznJ3VSRXlgIL1x3hC6NVpHn0JYRcdBBrWzK9g9y1bSQykjyZ5IiQ/exec';

let currentMode = 'patient';
let lockedMode = null;
let appConfig = {};
let examList = [];
let drugGroupList = [];
let isAdminLoggedIn = false;
let currentAdminTab = 'drug';
let autoTimer = null;

let autocompleteCache = new Map();
let autocompleteRequestSeq = 0;
let lastAutocompleteKeyword = '';
let isSearching = false;
let isInitializing = true;
let suppressBlurHide = false;

let adminTapCount = 0;
let adminTapTimer = null;

let highlightTimer = null;
let isComposing = false;

let pendingAutocompleteKeyword = '';
let renderedAutocompleteKeyword = '';

let autocompleteActiveIndex = -1;
let adminDrugTargetTimer = null;
