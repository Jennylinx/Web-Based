//Counselor/Staff Referral.js - FIXED VERSION

document.addEventListener("DOMContentLoaded", async () => {
  // Highlight active nav item
  const navItems = document.querySelectorAll(".nav-item");
  const currentPage = window.location.pathname.split("/").pop().toLowerCase();

  navItems.forEach(item => {
    const itemHref = item.getAttribute("href").split("/").pop().toLowerCase();
    if (itemHref === currentPage) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Profile dropdown functionality
  const profileButton = document.getElementById("profileButton");
  const profileDropdown = document.getElementById("profileDropdown");
  
  if (profileButton && profileDropdown) {
    profileButton.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle("show");
    });

    window.addEventListener("click", (event) => {
      if (!event.target.closest("#profileDropdown")) {
        profileDropdown.classList.remove("show");
      }
    });
  }

  // Load user profile and display welcome message
  try {
    const userProfile = await apiClient.getUserProfile();
    if (userProfile.success && userProfile.data) {
      const welcomeTitle = document.getElementById("welcomeTitle");
      if (welcomeTitle) {
        welcomeTitle.textContent = `Welcome back, ${userProfile.data.fullName || userProfile.data.username}`;
      }
    }
  } catch (error) {
    console.error("Error loading user profile:", error);
  }
});

// ====================================
// COUNSELOR/STAFF REFERRAL MANAGEMENT
// ====================================

// DOM Elements
let searchInput, levelFilter, severityFilter, statusFilter, gradeFilter;
let viewReferralModal, closeViewModalBtn, cancelViewModalBtn;
let deleteConfirmModal, confirmDeleteBtn, cancelDeleteBtn;
let referralToDelete = null;

// Store loaded categories for validation
let availableCategories = [];

// Store all students for auto-fill
let allStudents = [];

// ====================================
// INITIALIZE - FIXED
// ====================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing Counselor Referral page...');
  
  initializeElements();
  setupEventListeners();
  
  // ✅ FIX: Load categories FIRST, then students, then referrals
  loadCategories()
    .then(() => loadAllStudents())
    .then(() => {
      console.log('✅ Categories and students loaded');
      console.log('📊 Total students available:', allStudents.length);
      
      if (allStudents.length > 0) {
        console.log('📋 Sample students:', allStudents.slice(0, 3));
      }
      
      loadReferrals();
    })
    .catch(error => {
      console.error('❌ Initialization error:', error);
    });
  
  // Auto-refresh every 30 seconds
  setInterval(loadReferrals, 30000);
});

// Initialize DOM elements
function initializeElements() {
  searchInput = document.getElementById('searchInput');
  levelFilter = document.getElementById('levelFilter');
  severityFilter = document.getElementById('severityFilter');
  statusFilter = document.getElementById('statusFilter');
  gradeFilter = document.getElementById('gradeFilter');
  
  viewReferralModal = document.getElementById('viewReferralModal');
  closeViewModalBtn = document.getElementById('closeViewModalBtn');
  cancelViewModalBtn = document.getElementById('cancelViewModalBtn');
  
  deleteConfirmModal = document.getElementById('deleteConfirmModal');
  confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
}

// Setup event listeners
function setupEventListeners() {
  if (closeViewModalBtn) {
    closeViewModalBtn.addEventListener('click', closeViewModal);
  }
  
  if (cancelViewModalBtn) {
    cancelViewModalBtn.addEventListener('click', closeViewModal);
  }
  
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', confirmDelete);
  }
  
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  }
  
  window.addEventListener('click', function(event) {
    if (event.target === viewReferralModal) {
      closeViewModal();
    }
    if (event.target === deleteConfirmModal) {
      closeDeleteModal();
    }
  });
  
  if (searchInput) {
    searchInput.addEventListener('input', debounce(loadReferrals, 300));
  }
  
  if (levelFilter) {
    levelFilter.addEventListener('change', loadReferrals);
  }
  
  if (severityFilter) {
    severityFilter.addEventListener('change', loadReferrals);
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', loadReferrals);
  }
  
  if (gradeFilter) {
    gradeFilter.addEventListener('change', loadReferrals);
  }
  
  // ✅ FIX: Add category filter listener
  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', loadReferrals);
  }
  
  const updateForm = document.getElementById('updateStatusForm');
  if (updateForm) {
    updateForm.addEventListener('submit', handleStatusUpdate);
  }
  
  const statusSelect = document.getElementById('view-status');
  if (statusSelect) {
    statusSelect.addEventListener('change', function() {
      handleStatusChange(this.value);
    });
  }
}

// ====================================
// LOAD ALL STUDENTS FOR AUTO-FILL
// ====================================
async function loadAllStudents() {
  try {
    console.log('📚 Loading ALL students for counselor auto-fill...');
    
    const response = await apiClient.getAllStudentsForCounselor();
    
    console.log('📥 Students response:', response);
    
    if (response.success && response.data) {
      allStudents = response.data;
      console.log('✅ Loaded', allStudents.length, 'students for auto-fill');
      console.log('Sample student:', allStudents[0]);
    } else {
      console.error('❌ Failed to load students for auto-fill:', response);
      allStudents = [];
    }
  } catch (error) {
    console.error('❌ Error loading students for auto-fill:', error);
    allStudents = [];
  }
}
// ====================================
// LOAD CATEGORIES DYNAMICALLY - FIXED
// ====================================
async function loadCategories() {
  try {
    console.log('📚 Loading categories...');
    // ✅ FIX: Use getCategories() instead of getReferralCategories()
    const response = await apiClient.getCategories();
    
    if (response.success && response.data) {
      availableCategories = response.data;
      console.log('✅ Loaded', availableCategories.length, 'categories');
      
      // ✅ FIX: Populate ALL category dropdowns after loading
      populateAllCategoryDropdowns();
      
    } else {
      console.error('❌ Failed to load categories:', response);
      availableCategories = [];
    }
  } catch (error) {
    console.error('❌ Error loading categories:', error);
    availableCategories = [];
  }
}

// ✅ NEW: Function to populate all category dropdowns at once
function populateAllCategoryDropdowns() {
  const viewCategorySelect = document.getElementById('view-category');
  const categoryFilterSelect = document.getElementById('categoryFilter');
  
  if (viewCategorySelect) {
    populateCategoryDropdown(viewCategorySelect, false);
    console.log('✅ Populated view-category dropdown');
  }
  
  if (categoryFilterSelect) {
    populateCategoryDropdown(categoryFilterSelect, true);
    console.log('✅ Populated categoryFilter dropdown');
  }
}

function populateCategoryDropdown(selectElement, isFilterDropdown = false) {
  if (!selectElement) {
    console.warn('⚠️ Select element not found');
    return;
  }
  
  // Clear and set placeholder based on dropdown type
  if (isFilterDropdown) {
    selectElement.innerHTML = '<option value="">All Categories</option>';
  } else {
    selectElement.innerHTML = '<option value="">Select Category (Optional)</option>';
  }
  
  // Add all categories
  availableCategories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.name;
    option.textContent = category.name;
    selectElement.appendChild(option);
  });
  
  console.log(`✅ Populated dropdown: ${selectElement.id} with ${availableCategories.length} categories`);
}

// ====================================
// LOAD REFERRALS - WITH CATEGORY FILTER
// ====================================
async function loadReferrals() {
  try {
    const params = new URLSearchParams();
    
    if (searchInput && searchInput.value) {
      params.append('search', searchInput.value);
    }
    
    if (levelFilter && levelFilter.value && levelFilter.value !== 'all') {
      params.append('level', levelFilter.value);
    }
    
    if (severityFilter && severityFilter.value && severityFilter.value !== 'all') {
      params.append('severity', severityFilter.value);
    }
    
    if (statusFilter && statusFilter.value && statusFilter.value !== 'all') {
      params.append('status', statusFilter.value);
    }
    
    if (gradeFilter && gradeFilter.value && gradeFilter.value !== 'all') {
      params.append('grade', gradeFilter.value);
    }
    
    // ✅ FIX: Add category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter && categoryFilter.value) {
      params.append('category', categoryFilter.value);
    }
    
    const url = `/referrals?${params.toString()}`;
    const response = await apiClient.get(url);
    
    if (response.success) {
      displayReferrals(response.data);
      updateSummaryStats(response.data);
    } else {
      console.error('Failed to load referrals:', response.error);
    }
  } catch (error) {
    console.error('Error loading referrals:', error);
  }
}

// ====================================
// DISPLAY REFERRALS
// ====================================
function displayReferrals(referrals) {
  const tbody = document.getElementById('referralTable');
  
  if (!tbody) {
    console.error('Referral table body not found');
    return;
  }
  
  if (!referrals || referrals.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="no-data" style="text-align: center; padding: 2rem; color: #666;">
          No referrals found
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = referrals.map(referral => {
    const dateValue = referral.dateReferred || referral.referralDate || referral.createdAt || new Date();
    const date = new Date(dateValue);
    
    const formattedDate = !isNaN(date.getTime()) 
      ? date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      : 'N/A';
    
    const statusColors = {
      'Pending': '#fbbf24',
      'Under Review': '#60a5fa',
      'For Consultation': '#a78bfa',
      'Complete': '#34d399'
    };

    const severityColors = {
      'Low': '#34d399',
      'Medium': '#fbbf24',
      'High': '#f87171',
      'Pending Assessment': '#9ca3af'
    };

    const shouldShowSeverity = referral.status !== 'Pending';
    const severityDisplay = shouldShowSeverity 
      ? `<span class="severity-badge" style="background-color: ${severityColors[referral.severity] || '#9ca3af'}20; color: ${severityColors[referral.severity] || '#9ca3af'}; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 500;">
           ${referral.severity || 'Pending Assessment'}
         </span>`
      : '<span style="color: #666; font-size: 0.85rem;">—</span>';
    
    const displayReferralId = referral.referralId || `REF-${referral._id?.slice(-8) || 'N/A'}`;
    
    return `
      <tr>
        <td><strong>${displayReferralId}</strong></td>
        <td>${referral.studentId || 'N/A'}</td>
        <td>${referral.studentName}</td>
        <td>${referral.level}</td>
        <td>${referral.grade}</td>
        <td>
          <span class="status-badge" style="background-color: ${statusColors[referral.status] || '#9ca3af'}20; color: ${statusColors[referral.status] || '#9ca3af'}; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 500;">
            ${referral.status}
          </span>
        </td>
        <td>${severityDisplay}</td>
        <td>${formattedDate}</td>
        <td>
          <button class="btn-icon" onclick="viewReferral('${referral._id}')" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-icon btn-delete" onclick="openDeleteModal('${referral._id}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateSummaryStats(referrals) {
  const totalCount = document.getElementById('totalCount');
  const pendingCount = document.getElementById('pendingCount');
  const reviewCount = document.getElementById('reviewCount');
  const consultationCount = document.getElementById('consultationCount');
  
  if (totalCount) totalCount.textContent = referrals.length;
  if (pendingCount) pendingCount.textContent = referrals.filter(r => r.status === 'Pending').length;
  if (reviewCount) reviewCount.textContent = referrals.filter(r => r.status === 'Under Review').length;
  if (consultationCount) consultationCount.textContent = referrals.filter(r => r.status === 'For Consultation').length;
}
// ====================================
// VIEW REFERRAL - FIXED
// ====================================
async function viewReferral(referralId) {
  try {
    const response = await apiClient.get(`/referrals/${referralId}`);
    
    if (response.success) {
      const referral = response.data;
      
      // ✅ FIX: Ensure categories are loaded before populating modal
      if (availableCategories.length === 0) {
        console.log('⏳ Categories not loaded yet, loading now...');
        await loadCategories();
      }
      
      // ✅ FIX: Re-populate the dropdown in the modal to ensure it has options
      const categorySelect = document.getElementById('view-category');
      if (categorySelect) {
        populateCategoryDropdown(categorySelect, false);
        console.log('✅ Re-populated category dropdown in modal');
      }
      
      populateViewModal(referral);
      
      // Setup student ID auto-fill
      setupStudentIdAutoFill('view');
      
      viewReferralModal.style.display = 'block';
    } else {
      showAlert('Failed to load referral details', 'error');
    }
  } catch (error) {
    console.error('Error loading referral:', error);
    showAlert('Error loading referral details', 'error');
  }
}

function closeViewModal() {
  if (viewReferralModal) {
    viewReferralModal.style.display = 'none';
  }
}

// ====================================
// POPULATE VIEW MODAL - FIXED
// ====================================
function populateViewModal(referral) {
  console.log('📋 Populating view modal with referral:', referral);
  
  // ✅ FIX: Set hidden referral ID for backend
  const referralIdField = document.getElementById('viewReferralId');
  if (referralIdField) {
    referralIdField.value = referral._id;
  }
  
  // ✅ FIX: Display formatted Referral ID
  const referralIdDisplay = document.getElementById('view-referralId-display');
  if (referralIdDisplay) {
    const displayId = referral.referralId || `REF-${referral._id?.slice(-8) || 'N/A'}`;
    referralIdDisplay.value = displayId;
  }
  
  // Check if this is a student submission
  const isStudentSubmission = referral.isStudentSubmission === true;
  const updateForm = document.getElementById('updateStatusForm');
  if (updateForm) {
    updateForm.dataset.isStudentSubmission = isStudentSubmission;
  }
  
  // Student ID - ALWAYS EDITABLE
  const studentIdField = document.getElementById('view-studentId');
  if (studentIdField) {
    studentIdField.value = referral.studentId || '';
    studentIdField.disabled = false;
    studentIdField.placeholder = 'Type student ID to auto-fill student information';
  }
  
  // Student Name
  const studentNameField = document.getElementById('view-studentName');
  if (studentNameField) {
    studentNameField.value = referral.studentName;
    studentNameField.disabled = !isStudentSubmission;
  }
  
  // Level
  const levelField = document.getElementById('view-level');
  if (levelField) {
    if (isStudentSubmission) {
      const parent = levelField.parentNode;
      const classes = levelField.className;
      
      const newLevelField = document.createElement('select');
      newLevelField.id = 'view-level';
      newLevelField.name = 'level';
      newLevelField.className = classes;
      newLevelField.required = true;
      
      newLevelField.innerHTML = `
        <option value="">Select level</option>
        <option value="Elementary">Elementary</option>
        <option value="JHS">JHS</option>
        <option value="SHS">SHS</option>
      `;
      
      parent.replaceChild(newLevelField, levelField);
      newLevelField.value = referral.level || '';
      
      newLevelField.addEventListener('change', function() {
        updateViewGradeOptions(this.value);
      });
    } else {
      levelField.value = referral.level || '';
      levelField.disabled = true;
    }
  }
  
  // Grade
  const gradeField = document.getElementById('view-grade');
  if (gradeField) {
    if (isStudentSubmission) {
      const parent = gradeField.parentNode;
      const classes = gradeField.className;
      
      const newGradeField = document.createElement('select');
      newGradeField.id = 'view-grade';
      newGradeField.name = 'grade';
      newGradeField.className = classes;
      newGradeField.required = true;
      newGradeField.innerHTML = '<option value="">Select level first</option>';
      newGradeField.disabled = true;
      
      parent.replaceChild(newGradeField, gradeField);
      updateViewGradeOptions(referral.level, referral.grade);
    } else {
      gradeField.value = referral.grade || '';
      gradeField.disabled = true;
    }
  }
  
  // ✅ FIX: Date of Interview field
  const dateInput = document.getElementById('view-dateOfInterview');
  if (dateInput) {
    const dateValue = referral.dateReferred || referral.referralDate || referral.createdAt;
    if (dateValue) {
      const date = new Date(dateValue);
      dateInput.value = date.toISOString().split('T')[0];
    }
  }
  
  // Referred By
  const referredByField = document.getElementById('view-adviser');
  if (referredByField) {
    if (isStudentSubmission) {
      const currentReferredBy = referral.referredBy || 'Student Self-Report';
      referredByField.value = currentReferredBy;
      referredByField.disabled = true;
    } else {
      const adviserName = referral.createdBy ? 
        (referral.createdBy.fullName || referral.createdBy.username) : 
        'Unknown';
      referredByField.value = adviserName;
      referredByField.disabled = true;
    }
  }
  
  document.getElementById('view-reason').value = referral.reason;
  document.getElementById('view-description').value = referral.description || '';
  document.getElementById('view-severity').value = referral.severity;
  document.getElementById('view-status').value = referral.status;
  
  // ✅ FIX: Handle category with proper error handling
  const categorySelect = document.getElementById('view-category');
  if (categorySelect) {
    const referralCategory = referral.category || '';
    
    const categoryContainer = categorySelect.parentElement;
    const existingWarning = categoryContainer.querySelector('.category-warning');
    if (existingWarning) {
      existingWarning.remove();
    }
    
    console.log('🏷️ Setting category:', referralCategory);
    console.log('📋 Available categories:', availableCategories.map(c => c.name));
    
    const categoryExists = availableCategories.some(
      cat => cat.name === referralCategory
    );
    
    if (categoryExists && referralCategory) {
      categorySelect.value = referralCategory;
      console.log('✅ Category set successfully:', referralCategory);
    } else {
      categorySelect.value = '';
      if (referralCategory) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'category-warning';
        warningDiv.style.cssText = 'color: #f59e0b; font-size: 12px; margin-top: 4px;';
        warningDiv.innerHTML = `⚠️ Previous category "${referralCategory}" no longer exists. You can leave this empty or select a new category.`;
        categoryContainer.appendChild(warningDiv);
        console.log('⚠️ Category not found in available categories');
      }
    }
  } else {
    console.error('❌ Category select element not found!');
  }
  
  document.getElementById('view-notes').value = referral.notes || '';
  
  // ✅ FIX: Trigger status change to show/hide consultation notes
  handleStatusChange(referral.status);
}

// ✅ FIX: Handle status change to show/hide consultation notes
function handleStatusChange(status) {
  const notesSection = document.getElementById('notesSection');
  const notesTextarea = document.getElementById('view-notes');
  
  console.log('📝 Status changed to:', status);
  
  if (status === 'For Consultation' || status === 'Complete') {
    if (notesSection) {
      notesSection.style.display = 'block';
      console.log('✅ Consultation notes section shown');
    }
    if (notesTextarea) {
      notesTextarea.required = true;
    }
  } else {
    if (notesSection) {
      notesSection.style.display = 'none';
      console.log('❌ Consultation notes section hidden');
    }
    if (notesTextarea) {
      notesTextarea.required = false;
    }
  }
}

// Update grade options in view modal
function updateViewGradeOptions(level, selectedGrade = '') {
  const gradeSelect = document.getElementById('view-grade');
  if (!gradeSelect) return;
  
  gradeSelect.innerHTML = '<option value="">Select grade</option>';
  
  const gradeOptions = {
    'Elementary': ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
    'JHS': ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
    'SHS': ['Grade 11', 'Grade 12']
  };
  
  if (level && gradeOptions[level]) {
    gradeOptions[level].forEach(grade => {
      const option = document.createElement('option');
      option.value = grade;
      option.textContent = grade;
      gradeSelect.appendChild(option);
    });
    gradeSelect.disabled = false;
    
    if (selectedGrade) {
      const gradeNumber = selectedGrade.replace('Grade ', '');
      const formattedGrade = gradeNumber.includes('Grade') ? gradeNumber : `Grade ${gradeNumber}`;
      gradeSelect.value = formattedGrade;
    }
  } else {
    gradeSelect.disabled = true;
  }
}

// Handle status update
async function handleStatusUpdate(e) {
  e.preventDefault();
  
  const referralId = document.getElementById('viewReferralId').value;
  const status = document.getElementById('view-status').value;
  const notes = document.getElementById('view-notes').value.trim();
  const severity = document.getElementById('view-severity').value;
  const category = document.getElementById('view-category').value;
  
  if ((status === 'For Consultation' || status === 'Complete') && !notes) {
    showAlert('Please add consultation notes before setting this status', 'error');
    return;
  }
  
  if (category && category !== '') {
    const categoryExists = availableCategories.some(cat => cat.name === category);
    if (!categoryExists) {
      showAlert('Selected category is not valid. Please select a valid category from the dropdown list.', 'error');
      return;
    }
  }
  
  const formData = {
    status: status,
    severity: severity,
    notes: notes || undefined
  };
  
  if (category && category !== '') {
    formData.category = category;
  } else {
    formData.category = null;
  }
  
  const form = e.target;
  const isStudentSubmission = form.dataset.isStudentSubmission === 'true';
  
  if (isStudentSubmission) {
    const studentId = document.getElementById('view-studentId').value.trim();
    const studentName = document.getElementById('view-studentName').value.trim();
    const level = document.getElementById('view-level').value;
    const grade = document.getElementById('view-grade').value;
    
    if (!studentName) {
      showAlert('Student name is required', 'error');
      return;
    }
    
    if (!level) {
      showAlert('Level is required', 'error');
      return;
    }
    
    if (!grade) {
      showAlert('Grade is required', 'error');
      return;
    }
    
    formData.studentId = studentId || null;
    formData.studentName = studentName;
    formData.level = level;
    formData.grade = grade;
  } else {
    const studentId = document.getElementById('view-studentId').value.trim();
    if (studentId) {
      formData.studentId = studentId;
    }
  }
  
  try {
    const response = await apiClient.put(`/referrals/${referralId}`, formData);
    
    if (response.success) {
      showAlert('Referral updated successfully!', 'success');
      closeViewModal();
      loadReferrals();
    } else {
      showAlert(response.error || 'Failed to update referral', 'error');
    }
  } catch (error) {
    console.error('Error updating referral:', error);
    showAlert('Error updating referral. Please try again.', 'error');
  }
}

// ====================================
// DELETE REFERRAL
// ====================================
function openDeleteModal(referralId) {
  referralToDelete = referralId;
  
  const deleteMessage = document.getElementById('deleteMessage');
  if (deleteMessage) {
    deleteMessage.innerHTML = `
      <div style="text-align: center;">
        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc2626; margin-bottom: 16px;"></i>
        <h3 style="margin: 12px 0; color: #ffffff;">Delete this referral?</h3>
        <p style="color: #6b7280; margin: 8px 0;">
          Are you sure you want to delete this referral? 
          <br>
          <strong>This action cannot be undone.</strong>
        </p>
      </div>
    `;
  }
  
  if (deleteConfirmModal) {
    deleteConfirmModal.style.display = 'block';
  }
}

function closeDeleteModal() {
  referralToDelete = null;
  
  const deleteMessage = document.getElementById('deleteMessage');
  if (deleteMessage) {
    deleteMessage.innerHTML = '';
  }
  
  if (deleteConfirmModal) {
    deleteConfirmModal.style.display = 'none';
  }
}

async function confirmDelete() {
  if (!referralToDelete) return;
  
  try {
    const response = await apiClient.delete(`/referrals/${referralToDelete}`);
    
    if (response.success) {
      showAlert('Referral deleted successfully', 'success');
      closeDeleteModal();
      loadReferrals();
    } else {
      showAlert(response.error || 'Failed to delete referral', 'error');
    }
  } catch (error) {
    console.error('Error deleting referral:', error);
    showAlert('Error deleting referral', 'error');
  }
}

// ====================================
// UTILITY FUNCTIONS
// ====================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showAlert(message, type = 'info') {
  if (typeof customAlert !== 'undefined') {
    switch(type) {
      case 'success':
        customAlert.success(message);
        break;
      case 'error':
        customAlert.error(message);
        break;
      case 'warning':
        customAlert.warning(message);
        break;
      default:
        customAlert.info(message);
    }
    return;
  }
  
  alert(message);
}

// ====================================
// STUDENT ID AUTO-FILL (Simplified)
// ====================================
function setupStudentIdAutoFill(fieldPrefix = 'view') {
  const studentIdInput = document.getElementById(`${fieldPrefix}-studentId`);
  
  if (!studentIdInput) {
    console.warn(`⚠️ Student ID input not found for prefix: ${fieldPrefix}`);
    return;
  }
  
  console.log(`🎯 Student ID auto-fill ready for ${fieldPrefix}`);
  // Auto-fill functionality can be added here if needed
}

// Export functions to window
window.viewReferral = viewReferral;
window.openDeleteModal = openDeleteModal;
window.closeViewModal = closeViewModal;
window.closeDeleteModal = closeDeleteModal;