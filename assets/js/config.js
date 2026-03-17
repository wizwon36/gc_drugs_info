const API_BASE = 'https://script.google.com/macros/s/AKfycbziZUGLtMlQEZo3dCmuw21h8V2LuNH-5z5V54LunxPiI7Z6_HJySAdxmn5TSwhlO6uY6g/exec';

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
