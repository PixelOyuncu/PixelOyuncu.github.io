// Suggestions Window JavaScript with reCAPTCHA

// Global variables for reCAPTCHA
let recaptchaLoaded = false;
let recaptchaWidgetId = null;

// Load reCAPTCHA script
function loadRecaptcha() {
    if (recaptchaLoaded) return;
    
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    recaptchaLoaded = true;
}

// reCAPTCHA callback functions
window.onRecaptchaLoad = function() {
    const container = document.getElementById('recaptcha-widget');
    if (container && typeof grecaptcha !== 'undefined') {
        try {
            recaptchaWidgetId = grecaptcha.render('recaptcha-widget', {
                'sitekey': 'YOUR_SITE_KEY_HERE', // Replace with your actual site key
                'callback': onRecaptchaSuccess,
                'expired-callback': onRecaptchaExpired,
                'error-callback': onRecaptchaError,
                'theme': 'light',
                'size': 'normal'
            });
        } catch (error) {
            console.error('reCAPTCHA render error:', error);
            showRecaptchaError('Failed to load reCAPTCHA. Please refresh the page.');
        }
    }
};

function onRecaptchaSuccess(token) {
    document.getElementById('recaptcha-error').style.display = 'none';
    updateSubmitButton();
}

function onRecaptchaExpired() {
    console.log('reCAPTCHA expired');
    updateSubmitButton();
}

function onRecaptchaError() {
    console.error('reCAPTCHA error');
    showRecaptchaError('reCAPTCHA verification failed. Please try again.');
    updateSubmitButton();
}

function showRecaptchaError(message) {
    const errorElement = document.getElementById('recaptcha-error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function updateSubmitButton() {
    const submitBtn = document.getElementById('submit-suggestion');
    const form = document.getElementById('suggestion-form');
    const isFormValid = form.checkValidity();
    
    let isRecaptchaValid = false;
    if (typeof grecaptcha !== 'undefined' && recaptchaWidgetId !== null) {
        try {
            const response = grecaptcha.getResponse(recaptchaWidgetId);
            isRecaptchaValid = response && response.length > 0;
        } catch (error) {
            console.error('Error checking reCAPTCHA:', error);
        }
    }
    
    submitBtn.disabled = !(isFormValid && isRecaptchaValid);
}

// Form validation and submission
function initializeSuggestionsForm() {
    const form = document.getElementById('suggestion-form');
    const inputs = form.querySelectorAll('input, select, textarea');
    const submitBtn = document.getElementById('submit-suggestion');
    const cancelBtn = document.getElementById('cancel-suggestion');
    
    // Load reCAPTCHA when suggestions window is opened
    loadRecaptcha();
    
    // Add input event listeners for real-time validation
    inputs.forEach(input => {
        input.addEventListener('input', updateSubmitButton);
        input.addEventListener('change', updateSubmitButton);
    });
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Validate reCAPTCHA
        let recaptchaResponse = '';
        if (typeof grecaptcha !== 'undefined' && recaptchaWidgetId !== null) {
            try {
                recaptchaResponse = grecaptcha.getResponse(recaptchaWidgetId);
            } catch (error) {
                console.error('Error getting reCAPTCHA response:', error);
            }
        }
        
        if (!recaptchaResponse) {
            showRecaptchaError('Please complete the reCAPTCHA verification');
            return;
        }
        
        // Prepare form data
        const formData = {
            name: document.getElementById('suggestion-name').value,
            email: document.getElementById('suggestion-email').value,
            type: document.getElementById('suggestion-type').value,
            suggestion: document.getElementById('suggestion-text').value,
            recaptcha: recaptchaResponse
        };
        
        // Submit suggestion
        submitSuggestion(formData);
    });
    
    // Cancel button
    cancelBtn.addEventListener('click', function() {
        closeSuggestionsWindow();
    });
    
    // Close success message
    document.getElementById('close-success').addEventListener('click', function() {
        closeSuggestionsWindow();
    });
}

function submitSuggestion(formData) {
    const submitBtn = document.getElementById('submit-suggestion');
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    
    // Simulate API call (replace with actual endpoint)
    setTimeout(() => {
        // For demo purposes, we'll just show success
        // In real implementation, send data to your server
        console.log('Suggestion submitted:', formData);
        
        // Reset reCAPTCHA
        if (typeof grecaptcha !== 'undefined' && recaptchaWidgetId !== null) {
            try {
                grecaptcha.reset(recaptchaWidgetId);
            } catch (error) {
                console.error('Error resetting reCAPTCHA:', error);
            }
        }
        
        // Show success message
        showSuccessMessage();
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        
    }, 1500);
    
    /* 
    // Real implementation would look like this:
    fetch('/api/suggestions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reset reCAPTCHA
            if (typeof grecaptcha !== 'undefined' && recaptchaWidgetId !== null) {
                grecaptcha.reset(recaptchaWidgetId);
            }
            showSuccessMessage();
        } else {
            throw new Error(data.message || 'Submission failed');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to submit suggestion. Please try again.');
        // Reset reCAPTCHA on error
        if (typeof grecaptcha !== 'undefined' && recaptchaWidgetId !== null) {
            grecaptcha.reset(recaptchaWidgetId);
        }
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        updateSubmitButton();
    });
    */
}

function showSuccessMessage() {
    document.getElementById('suggestion-form').style.display = 'none';
    document.getElementById('suggestion-success').style.display = 'block';
}

function closeSuggestionsWindow() {
    // Reset form
    document.getElementById('suggestion-form').reset();
    document.getElementById('suggestion-form').style.display = 'block';
    document.getElementById('suggestion-success').style.display = 'none';
    document.getElementById('recaptcha-error').style.display = 'none';
    
    // Reset reCAPTCHA
    if (typeof grecaptcha !== 'undefined' && recaptchaWidgetId !== null) {
        try {
            grecaptcha.reset(recaptchaWidgetId);
        } catch (error) {
            console.error('Error resetting reCAPTCHA:', error);
        }
    }
    
    // Close window
    const window = document.getElementById('suggestions-window');
    window.find('.winclose').trigger('click');
}

// Initialize when DOM is loaded
$(document).ready(function() {
    // Initialize suggestions form when the suggestions window is opened
    $(document).on('click', '[data-target="suggestions"]', function() {
        // Delay initialization to ensure window is properly rendered
        setTimeout(initializeSuggestionsForm, 100);
    });
    
    // Initialize if suggestions window is already open
    if ($('#suggestions-window').is(':visible')) {
        initializeSuggestionsForm();
    }
});