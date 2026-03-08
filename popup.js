const DEFAULT_URLS = [
  { url: 'http://localhost:10000/login', label: 'Login' }
];

let urls = [];
let selectedIndex = 0;
let selectedChildIndex = -1; // -1 = main list, 0+ = in preview panel
let editingIndex = -1;
let editingChildIndex = -1;
let addingChildTo = -1;
let draggedIndex = -1;

// DOM Elements
const listView = document.getElementById('list-view');
const formView = document.getElementById('form-view');
const urlList = document.getElementById('url-list');
const childrenPreview = document.getElementById('children-preview');
const emptyState = document.getElementById('empty-state');
const addBtn = document.getElementById('add-btn');
const formTitle = document.getElementById('form-title');
const urlInput = document.getElementById('url-input');
const labelInput = document.getElementById('label-input');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');

// Initialize
const init = async () => {
  await loadUrls();
  render();
  setupEventListeners();
};

// Storage
const loadUrls = async () => {
  const result = await chrome.storage.sync.get('urls');
  urls = result.urls || DEFAULT_URLS;
};

const saveUrls = async () => {
  await chrome.storage.sync.set({ urls });
};

// Helpers
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const hasChildren = (item) => item.children && item.children.length > 0;

const anyGroupExists = () => urls.some(hasChildren);

// Drag and Drop Handlers
const handleDragStart = (e) => {
  draggedIndex = parseInt(e.currentTarget.dataset.index);
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', draggedIndex);
};

const handleDragEnd = (e) => {
  e.currentTarget.classList.remove('dragging');
  draggedIndex = -1;

  urlList.querySelectorAll('.url-item').forEach(item => {
    item.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
  });
};

const handleDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  const item = e.currentTarget;
  const targetIndex = parseInt(item.dataset.index);

  if (targetIndex === draggedIndex) return;

  const rect = item.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;

  item.classList.remove('drag-over-top', 'drag-over-bottom');

  if (e.clientY < midY) {
    item.classList.add('drag-over-top');
  } else {
    item.classList.add('drag-over-bottom');
  }
};

const handleDragEnter = (e) => {
  e.preventDefault();
  const item = e.currentTarget;
  if (parseInt(item.dataset.index) !== draggedIndex) {
    item.classList.add('drag-over');
  }
};

const handleDragLeave = (e) => {
  const item = e.currentTarget;
  item.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
};

const handleDrop = async (e) => {
  e.preventDefault();

  const item = e.currentTarget;
  let targetIndex = parseInt(item.dataset.index);

  if (draggedIndex === -1 || draggedIndex === targetIndex) return;

  const rect = item.getBoundingClientRect();
  const midY = rect.top + rect.height / 2;
  const dropBelow = e.clientY > midY;

  const [draggedItem] = urls.splice(draggedIndex, 1);

  if (draggedIndex < targetIndex) {
    targetIndex--;
  }

  const insertIndex = dropBelow ? targetIndex + 1 : targetIndex;
  urls.splice(insertIndex, 0, draggedItem);

  if (selectedIndex === draggedIndex) {
    selectedIndex = insertIndex;
    selectedChildIndex = -1;
  } else if (draggedIndex < selectedIndex && insertIndex >= selectedIndex) {
    selectedIndex--;
  } else if (draggedIndex > selectedIndex && insertIndex <= selectedIndex) {
    selectedIndex++;
  }

  await saveUrls();
  render();
};

const attachDragListeners = () => {
  const items = urlList.querySelectorAll('.url-item');

  items.forEach((item) => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('dragenter', handleDragEnter);
    item.addEventListener('dragleave', handleDragLeave);
    item.addEventListener('drop', handleDrop);
  });
};

// DOM element builders
const createUrlItemElement = (item, index, isSelected) => {
  const div = document.createElement('div');
  div.className = `url-item${isSelected ? ' selected' : ''}`;
  div.dataset.index = index;
  div.draggable = true;
  div.title = item.url;

  const dragHandle = document.createElement('span');
  dragHandle.className = 'drag-handle';
  dragHandle.title = 'Drag to reorder';
  dragHandle.textContent = '⋮⋮';
  div.appendChild(dragHandle);

  const shortcutKey = document.createElement('span');
  shortcutKey.className = 'shortcut-key';
  shortcutKey.textContent = index + 1;
  div.appendChild(shortcutKey);

  const urlInfo = document.createElement('div');
  urlInfo.className = 'url-info';
  const urlLabel = document.createElement('div');
  urlLabel.className = 'url-label';
  urlLabel.textContent = item.label || item.url;
  urlInfo.appendChild(urlLabel);
  if (item.label) {
    const urlText = document.createElement('div');
    urlText.className = 'url-text';
    urlText.textContent = item.url;
    urlInfo.appendChild(urlText);
  }
  div.appendChild(urlInfo);

  if (hasChildren(item)) {
    const chevron = document.createElement('span');
    chevron.className = 'chevron';
    chevron.textContent = '▸';
    div.appendChild(chevron);
  }

  const addChildBtn = document.createElement('button');
  addChildBtn.className = 'add-child-btn';
  addChildBtn.dataset.index = index;
  addChildBtn.title = 'Add child URL (c)';
  addChildBtn.textContent = '+';
  div.appendChild(addChildBtn);

  const editBtn = document.createElement('button');
  editBtn.className = 'edit-btn';
  editBtn.dataset.index = index;
  editBtn.title = 'Edit (e)';
  editBtn.textContent = '✎';
  div.appendChild(editBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.dataset.index = index;
  deleteBtn.title = 'Delete';
  deleteBtn.textContent = '×';
  div.appendChild(deleteBtn);

  return div;
};

const createPreviewItemElement = (child, parentIndex, childIdx, isSelected) => {
  const div = document.createElement('div');
  div.className = `preview-item${isSelected ? ' selected' : ''}`;
  div.dataset.parentIndex = parentIndex;
  div.dataset.childIndex = childIdx;
  div.title = child.url;

  const urlInfo = document.createElement('div');
  urlInfo.className = 'url-info';
  const urlLabel = document.createElement('div');
  urlLabel.className = 'url-label';
  urlLabel.textContent = child.label || child.url;
  urlInfo.appendChild(urlLabel);
  if (child.label) {
    const urlText = document.createElement('div');
    urlText.className = 'url-text';
    urlText.textContent = child.url;
    urlInfo.appendChild(urlText);
  }
  div.appendChild(urlInfo);

  const editBtn = document.createElement('button');
  editBtn.className = 'edit-btn';
  editBtn.dataset.parentIndex = parentIndex;
  editBtn.dataset.childIndex = childIdx;
  editBtn.title = 'Edit (e)';
  editBtn.textContent = '✎';
  div.appendChild(editBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.dataset.parentIndex = parentIndex;
  deleteBtn.dataset.childIndex = childIdx;
  deleteBtn.title = 'Delete';
  deleteBtn.textContent = '×';
  div.appendChild(deleteBtn);

  return div;
};

// Render
const render = () => {
  if (urls.length === 0) {
    urlList.classList.add('hidden');
    emptyState.classList.remove('hidden');
    hidePreview();
    return;
  }

  urlList.classList.remove('hidden');
  emptyState.classList.add('hidden');

  // Use wide layout if any group exists (avoids popup shift during navigation)
  if (anyGroupExists()) {
    document.body.classList.add('has-preview');
  } else {
    document.body.classList.remove('has-preview');
  }

  // Main list
  urlList.textContent = '';
  urls.forEach((item, index) => {
    const isSelected = index === selectedIndex && selectedChildIndex === -1;
    const el = createUrlItemElement(item, index, isSelected);
    urlList.appendChild(el);
  });

  attachDragListeners();

  // Preview panel
  renderPreview();
};

const renderPreview = () => {
  const item = urls[selectedIndex];

  if (!item || !hasChildren(item)) {
    hidePreview();
    return;
  }

  childrenPreview.classList.remove('hidden');

  childrenPreview.textContent = '';
  item.children.forEach((child, idx) => {
    const isSelected = selectedChildIndex === idx;
    const el = createPreviewItemElement(child, selectedIndex, idx, isSelected);
    childrenPreview.appendChild(el);
  });
};

const hidePreview = () => {
  childrenPreview.classList.add('hidden');
};

// Actions
const openUrl = (index) => {
  if (index >= 0 && index < urls.length) {
    chrome.tabs.create({ url: urls[index].url });
    window.close();
  }
};

const openChildUrl = (parentIndex, childIndex) => {
  const child = urls[parentIndex]?.children?.[childIndex];
  if (child) {
    chrome.tabs.create({ url: child.url });
    window.close();
  }
};

const showForm = (index = -1) => {
  editingIndex = index;
  editingChildIndex = -1;
  addingChildTo = -1;
  formTitle.textContent = index === -1 ? 'Add URL' : 'Edit URL';

  if (index >= 0) {
    urlInput.value = urls[index].url;
    labelInput.value = urls[index].label || '';
  } else {
    urlInput.value = '';
    labelInput.value = '';
  }

  listView.classList.add('hidden');
  hidePreview();
  formView.classList.remove('hidden');
  urlInput.focus();
};

const showAddChildForm = (parentIndex) => {
  editingIndex = -1;
  editingChildIndex = -1;
  addingChildTo = parentIndex;

  const parentLabel = urls[parentIndex].label || urls[parentIndex].url;
  formTitle.textContent = `Add to "${parentLabel}"`;
  urlInput.value = '';
  labelInput.value = '';

  listView.classList.add('hidden');
  hidePreview();
  formView.classList.remove('hidden');
  urlInput.focus();
};

const showEditChildForm = (parentIndex, childIndex) => {
  editingIndex = parentIndex;
  editingChildIndex = childIndex;
  addingChildTo = -1;

  const child = urls[parentIndex].children[childIndex];
  formTitle.textContent = 'Edit URL';
  urlInput.value = child.url;
  labelInput.value = child.label || '';

  listView.classList.add('hidden');
  hidePreview();
  formView.classList.remove('hidden');
  urlInput.focus();
};

const hideForm = () => {
  formView.classList.add('hidden');
  listView.classList.remove('hidden');
  editingIndex = -1;
  editingChildIndex = -1;
  addingChildTo = -1;
  render();
};

const saveUrl = async () => {
  const url = urlInput.value.trim();
  if (!url) return;

  const label = labelInput.value.trim();

  if (addingChildTo >= 0) {
    const parent = urls[addingChildTo];
    if (!parent.children) parent.children = [];
    parent.children.push({ url, label });
  } else if (editingChildIndex >= 0) {
    urls[editingIndex].children[editingChildIndex] = { url, label };
  } else if (editingIndex >= 0) {
    // Preserve children when editing parent
    const existing = urls[editingIndex];
    const updated = { url, label };
    if (existing.children) updated.children = existing.children;
    urls[editingIndex] = updated;
  } else {
    urls.push({ url, label });
  }

  await saveUrls();
  hideForm();
};

const deleteUrl = async (index) => {
  urls.splice(index, 1);
  selectedChildIndex = -1;
  if (selectedIndex >= urls.length) {
    selectedIndex = Math.max(0, urls.length - 1);
  }
  await saveUrls();
  render();
};

const deleteChild = async (parentIndex, childIndex) => {
  urls[parentIndex].children.splice(childIndex, 1);

  if (urls[parentIndex].children.length === 0) {
    delete urls[parentIndex].children;
    selectedChildIndex = -1;
  } else if (selectedChildIndex >= urls[parentIndex].children.length) {
    selectedChildIndex = urls[parentIndex].children.length - 1;
  }

  await saveUrls();
  render();
};

// Navigation
const moveSelection = (direction) => {
  if (urls.length === 0) return;

  if (selectedChildIndex >= 0) {
    // Navigating within preview panel
    const item = urls[selectedIndex];
    const next = selectedChildIndex + direction;
    if (next >= 0 && next < item.children.length) {
      selectedChildIndex = next;
    }
  } else {
    // Navigating top-level items
    selectedIndex = (selectedIndex + direction + urls.length) % urls.length;
  }

  render();
};

// Event Listeners
const setupEventListeners = () => {
  document.addEventListener('keydown', (e) => {
    // In form view
    if (!formView.classList.contains('hidden')) {
      if (e.key === 'Escape') {
        hideForm();
      } else if (e.key === 'Enter') {
        saveUrl();
      }
      return;
    }

    const key = e.key;

    // Number keys 1-9 — always open primary URL
    if (key >= '1' && key <= '9') {
      const index = parseInt(key) - 1;
      openUrl(index);
      return;
    }

    switch (key) {
      case 'ArrowUp':
      case 'k':
        e.preventDefault();
        moveSelection(-1);
        break;
      case 'ArrowDown':
      case 'j':
        e.preventDefault();
        moveSelection(1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (selectedChildIndex === -1 && urls[selectedIndex] && hasChildren(urls[selectedIndex])) {
          selectedChildIndex = 0;
          render();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (selectedChildIndex >= 0) {
          selectedChildIndex = -1;
          render();
        }
        break;
      case 'Enter':
        if (selectedChildIndex >= 0) {
          openChildUrl(selectedIndex, selectedChildIndex);
        } else {
          openUrl(selectedIndex);
        }
        break;
      case 'Escape':
        if (selectedChildIndex >= 0) {
          selectedChildIndex = -1;
          render();
        } else {
          window.close();
        }
        break;
      case 'a':
      case '+':
        showForm();
        break;
      case 'c':
        if (urls.length > 0) {
          showAddChildForm(selectedIndex);
        }
        break;
      case 'e':
        if (urls.length > 0) {
          if (selectedChildIndex >= 0) {
            showEditChildForm(selectedIndex, selectedChildIndex);
          } else {
            showForm(selectedIndex);
          }
        }
        break;
      case 'd':
      case 'Backspace':
        if (urls.length > 0) {
          if (selectedChildIndex >= 0) {
            deleteChild(selectedIndex, selectedChildIndex);
          } else {
            deleteUrl(selectedIndex);
          }
        }
        break;
    }
  });

  // Click handlers — main list
  urlList.addEventListener('click', (e) => {
    if (e.target.closest('.drag-handle')) return;

    const addChildBtn = e.target.closest('.add-child-btn');
    if (addChildBtn) {
      showAddChildForm(parseInt(addChildBtn.dataset.index));
      return;
    }

    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
      showForm(parseInt(editBtn.dataset.index));
      return;
    }

    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      deleteUrl(parseInt(deleteBtn.dataset.index));
      return;
    }

    const urlItem = e.target.closest('.url-item');
    if (urlItem) {
      openUrl(parseInt(urlItem.dataset.index));
    }
  });

  // Click handlers — preview panel
  childrenPreview.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
      showEditChildForm(parseInt(editBtn.dataset.parentIndex), parseInt(editBtn.dataset.childIndex));
      return;
    }

    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      deleteChild(parseInt(deleteBtn.dataset.parentIndex), parseInt(deleteBtn.dataset.childIndex));
      return;
    }

    const previewItem = e.target.closest('.preview-item');
    if (previewItem) {
      openChildUrl(parseInt(previewItem.dataset.parentIndex), parseInt(previewItem.dataset.childIndex));
    }
  });

  // Double-click to edit — main list
  urlList.addEventListener('dblclick', (e) => {
    if (e.target.closest('.delete-btn') || e.target.closest('.add-child-btn') || e.target.closest('.edit-btn')) return;
    const urlItem = e.target.closest('.url-item');
    if (urlItem) {
      showForm(parseInt(urlItem.dataset.index));
    }
  });

  // Double-click to edit — preview panel
  childrenPreview.addEventListener('dblclick', (e) => {
    if (e.target.closest('.delete-btn') || e.target.closest('.edit-btn')) return;
    const previewItem = e.target.closest('.preview-item');
    if (previewItem) {
      showEditChildForm(parseInt(previewItem.dataset.parentIndex), parseInt(previewItem.dataset.childIndex));
    }
  });

  addBtn.addEventListener('click', () => showForm());
  cancelBtn.addEventListener('click', hideForm);
  saveBtn.addEventListener('click', saveUrl);
};

init();
