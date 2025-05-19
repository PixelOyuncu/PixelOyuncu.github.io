$(function () {
	// Define application icons based on window title
	const appIcons = {
		'Welcome': 'https://img.icons8.com/?size=100&id=1H52efUsDX7A&format=png&color=000000',
		'default': 'https://fileinfo.cn/upload/icon/202002/exe.png',
		'Simple Tower Defense': "https://s6.imgcdn.dev/Y6P17i.png",
		'Suggestions': "https://img.icons8.com/3d-fluency/100/comments.png"
	};

	// Desktop click handler - deactivate all windows when clicking on the desktop
	$('#desktop').on('mousedown', function (e) {
		// Only deactivate if clicking directly on the desktop (not on windows or icons)
		if ($(e.target).attr('id') === 'desktop') {
			$('.window').removeClass('activeWindow').css('z-index', 1000);
			$('#taskbar .taskbarPanel').removeClass('activeTab');
		}
	});

	// Clear taskbar and icons first to prevent duplication
	$('#taskbar').empty();
	$('#icons').empty();

	// Initialize windows
	$('.window').each(function (i) {
		const win = $(this);
		win.attr('id', 'window' + i).data('id', i);

		const title = win.data('title') || 'Window';
		const iconUrl = appIcons[title] || appIcons['default'];

		let header = win.find('.windowHeader');
		if (header.length === 0) {
			header = $('<div class="windowHeader"><strong><div class="app-icon" style="background-image: url(' + iconUrl + ')"></div>' + title + '</strong></div>');
			win.prepend(header);
		} else if (header.find('.app-icon').length === 0) {
			header.find('strong').prepend('<div class="app-icon" style="background-image: url(' + iconUrl + ')"></div>');
		}

		if (header.find('.winclose').length === 0) {
			header.append('<span class="winminimize">─</span>');
			header.append('<span class="winmaximize">□</span>');
			header.append('<span class="winclose">×</span>');
		}

		// Add double-click handler to the app icon
		header.find('.app-icon').on('dblclick', function () {
			// Close the window on double-click
			header.find('.winclose').trigger('click');
		});

		// Add double-click handler to the window header
		header.on('dblclick', function (e) {
			// Make sure we're not double-clicking the control buttons or app icon
			if (!$(e.target).is('.winclose, .winminimize, .winmaximize, .app-icon')) {
				// Toggle maximize on double-click
				header.find('.winmaximize').trigger('click');
			}
		});

		// Wrap content in wincontent if it doesn't already exist
		if (!win.hasClass('suggestions-window') && win.find('.wincontent').length === 0) {
			const contents = win.contents().not('.windowHeader');
			const wrapper = $('<div class="wincontent"></div>').append(contents);
			win.append(wrapper);
		}

		win.draggable({
			handle: '.windowHeader',
			stack: '.window',
			containment: '#desktop'
		}).resizable({
			minHeight: 150,
			minWidth: 200,
			handles: 'all'
		}).on('mousedown', function (e) {
			// Stop propagation to prevent desktop click handler from firing
			e.stopPropagation();

			// Make active window when clicked
			$('.window').removeClass('activeWindow');
			$(this).addClass('activeWindow');

			// Force z-index update to ensure active window appears on top
			$('.window').css('z-index', 1000);
			$(this).css('z-index', 1001);

			// Update taskbar to show active window
			$('#taskbar .taskbarPanel').removeClass('activeTab');
			$('#taskbar .taskbarPanel').eq($(this).data('id')).addClass('activeTab');
		});

		// Always add to taskbar, regardless of window state
		addToTaskbar(i, title, iconUrl);

		// If window has closed class, also mark its taskbar panel as closed
		if (win.hasClass('closed')) {
			$('#taskbar .taskbarPanel').eq(i).addClass('closed');
		}
	});

	function addToTaskbar(id, title, iconUrl) {
		// Create taskbar panel with app icon
		const tab = $('<div class="taskbarPanel"><div class="app-icon" style="background-image: url(' + iconUrl + ')"></div>' + title + '</div>');
		tab.data('id', id);
		$('#taskbar').append(tab);
		tab.on('click', function (e) {
			// Stop propagation to prevent desktop click handler from firing
			e.stopPropagation();

			const win = $('#window' + id);

			if (win.hasClass('minimizedWindow')) {
				// Restore window with animation
				win.removeClass('minimizedWindow').addClass('restoring').show();
				$('.window').removeClass('activeWindow');
				win.addClass('activeWindow');
				$('#taskbar .taskbarPanel').removeClass('activeTab');
				tab.removeClass('minimizedTab closed').addClass('activeTab');

				// Force z-index update for active window
				$('.window').css('z-index', 1000);
				win.css('z-index', 1001);

				win.one('animationend', function () {
					win.removeClass('restoring');
				});
			} else if (win.is(':visible')) {
				// Minimize window with animation if it's already visible
				win.addClass('minimizing');
				tab.removeClass('activeTab').addClass('minimizedTab');

				win.one('animationend', function () {
					win.addClass('minimizedWindow').removeClass('minimizing activeWindow').hide();
				});
			} else {
				// Just show the window if it was closed
				win.show().removeClass('closing minimizedWindow closed').addClass('opening');
				$('.window').removeClass('activeWindow');
				win.addClass('activeWindow');
				$('#taskbar .taskbarPanel').removeClass('activeTab');
				tab.removeClass('minimizedTab closed').addClass('activeTab');

				// Force z-index update for active window
				$('.window').css('z-index', 1000);
				win.css('z-index', 1001);

				// --- Overflow/scrollbar patch: recalc wincontent height on open ---
				const content = win.find('.wincontent');
				if (content.length > 0) {
					content.css('height', 'auto'); // Reset first
					// Force reflow
					void content[0].offsetHeight;
					content.css('height', 'calc(100% - 48px)');
				}
				// ---------------------------------------------------------------

				win.one('animationend', function () {
					win.removeClass('opening');
				});
			}
		});
	}

	// Set first window as active by default
	$('.window:visible').first().addClass('activeWindow').css('z-index', 1001);
	$('#taskbar .taskbarPanel').not('.closed').first().addClass('activeTab');

	// Restore the original close button handler
	$(document).on('click', '.winclose', function (e) {
		// Stop propagation to prevent desktop click handler from firing
		e.stopPropagation();

		const windowEl = $(this).closest('.window');
		const taskId = windowEl.data('id');

		windowEl.removeClass('opening').addClass('closing');
		$('#taskbar .taskbarPanel').eq(taskId).removeClass('activeTab');

		windowEl.one('animationend', function () {
			windowEl.hide().removeClass('closing activeWindow').addClass('closed');
			$('#taskbar .taskbarPanel').eq(taskId).addClass('closed');
		});
	});

	// Window controls handlers
	$(document).on('click', '.winmaximize', function (e) {
		// Stop propagation to prevent desktop click handler from firing
		e.stopPropagation();

		const win = $(this).closest('.window');
		win.toggleClass('fullSizeWindow');
	});

	$(document).on('click', '.winminimize', function (e) {
		// Stop propagation to prevent desktop click handler from firing
		e.stopPropagation();

		const win = $(this).closest('.window');
		const id = win.data('id');

		// Add minimizing animation
		win.addClass('minimizing');
		$('#taskbar .taskbarPanel').eq(id).removeClass('activeTab').addClass('minimizedTab');

		win.one('animationend', function () {
			win.addClass('minimizedWindow').removeClass('minimizing activeWindow').hide();
		});
	});

	// Create desktop shortcuts with proper Windows 11 style
	const shortcuts = [
		{ id: 0, title: 'Welcome' },
		{ id: 1, title: 'Simple Tower Defense' },
		{ id: 2, title: 'Suggestions' }
	];

	shortcuts.forEach(shortcut => {
		const win = $('#window' + shortcut.id);
		const title = win.data('title') || shortcut.title;
		const iconUrl = appIcons[title] || appIcons['default'];

		const shortcutEl = $('<a class="openWindow"></a>')
			.attr('data-id', shortcut.id)
			.append('<div class="app-icon" style="background-image: url(' + iconUrl + ')"></div>')
			.append(title);

		$('#icons').append(shortcutEl);

		// Add click and double-click behavior to match Windows
		shortcutEl.on('click', function (e) {
			e.preventDefault();
			e.stopPropagation();
			$(this).trigger('openWindow');
		});

		shortcutEl.on('dblclick', function (e) {
			e.preventDefault();
			e.stopPropagation();
			$(this).trigger('openWindow');
		});

		// Custom openWindow event
		shortcutEl.on('openWindow', function () {
			const id = $(this).data('id');
			const win = $('#window' + id);

			if (!win.is(':visible')) {
				// Hide any animation classes
				win.show().removeClass('closing minimizedWindow minimizing closed').addClass('opening');

				// Set as active window
				$('.window').removeClass('activeWindow');
				win.addClass('activeWindow');

				// Force z-index update for active window
				$('.window').css('z-index', 1000);
				win.css('z-index', 1001);

				// Animate and update taskbar
				win.one('animationend', function () {
					win.removeClass('opening');
				});

				$('#taskbar .taskbarPanel').removeClass('activeTab');
				$('#taskbar .taskbarPanel').eq(id).removeClass('closed minimizedTab').addClass('activeTab');

				// --- Overflow/scrollbar patch: recalc wincontent height on open ---
				const content = win.find('.wincontent');
				if (content.length > 0) {
					content.css('height', 'auto'); // Reset first
					// Force reflow
					void content[0].offsetHeight;
					content.css('height', 'calc(100% - 48px)');
				}
				// ---------------------------------------------------------------

				// If Suggestions window is opened, initialize the form
				if (win.data('title') === 'Suggestions') {
					setTimeout(initializeSuggestionsForm, 100);
				}
			}
		});
	});

	// Form validation and submission for suggestions window
	function initializeSuggestionsForm() {
		const form = document.getElementById('suggestion-form');
		const inputs = form ? form.querySelectorAll('input, select, textarea') : [];
		const submitBtn = document.getElementById('submit-suggestion');
		const cancelBtn = document.getElementById('cancel-suggestion');
		
		if (!form) return;
		
		// Add input event listeners for real-time validation
		inputs.forEach(input => {
			input.addEventListener('input', updateSubmitButton);
			input.addEventListener('change', updateSubmitButton);
		});
		
		// Initial button state update
		updateSubmitButton();
		
		// Form submission
		form.addEventListener('submit', function(e) {
			e.preventDefault();
			
			// Validate form
			if (!form.checkValidity()) {
				form.reportValidity();
				return;
			}
			
			// Prepare form data
			const formData = {
				name: document.getElementById('suggestion-name').value,
				email: document.getElementById('suggestion-email').value,
				type: document.getElementById('suggestion-type').value,
				suggestion: document.getElementById('suggestion-text').value
			};
			
			// Submit suggestion
			submitSuggestion(formData);
		});
		
		// Cancel button
		if (cancelBtn) {
			cancelBtn.addEventListener('click', function() {
				closeSuggestionsWindow();
			});
		}
		
		// Close success message
		const closeSuccessBtn = document.getElementById('close-success');
		if (closeSuccessBtn) {
			closeSuccessBtn.addEventListener('click', function() {
				closeSuggestionsWindow();
			});
		}
	}

	function updateSubmitButton() {
		const form = document.getElementById('suggestion-form');
		const submitBtn = document.getElementById('submit-suggestion');
		
		if (!submitBtn || !form) return;
		
		// Check if form is valid
		const nameInput = document.getElementById('suggestion-name');
		const typeSelect = document.getElementById('suggestion-type');
		const textArea = document.getElementById('suggestion-text');
		
		const isNameValid = nameInput && nameInput.value.trim().length > 0;
		const isTypeValid = typeSelect && typeSelect.value !== '';
		const isTextValid = textArea && textArea.value.trim().length > 0;
		
		const isFormValid = isNameValid && isTypeValid && isTextValid;
		
		submitBtn.disabled = !isFormValid;
	}

	function submitSuggestion(formData) {
		const submitBtn = document.getElementById('submit-suggestion');
		const originalText = submitBtn.textContent;

		// Show loading state
		submitBtn.disabled = true;
		submitBtn.textContent = 'Submitting...';

		// Discord webhook URL (replace with your actual webhook)
		const DISCORD_WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL_HERE';

		// Prepare Discord webhook payload
		const payload = {
			username: 'Suggestion Bot',
			embeds: [{
				title: 'New Suggestion',
				fields: [
					{ name: 'Name', value: formData.name || 'Anonymous' },
					{ name: 'Email', value: formData.email || 'N/A' },
					{ name: 'Type', value: formData.type || 'N/A' },
					{ name: 'Suggestion', value: formData.suggestion || '' }
				],
				timestamp: new Date().toISOString()
			}]
		};

		// Send to Discord webhook
		fetch(DISCORD_WEBHOOK_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		})
		.then(response => {
			if (response.ok) {
				showSuccessMessage();
			} else {
				alert('Failed to send suggestion. Please try again later.');
			}
		})
		.catch(() => {
			alert('Failed to send suggestion. Please try again later.');
		})
		.finally(() => {
			submitBtn.disabled = false;
			submitBtn.textContent = originalText;
		});
	}

	function showSuccessMessage() {
		document.getElementById('suggestion-form').style.display = 'none';
		document.getElementById('suggestion-success').style.display = 'block';
	}

	function closeSuggestionsWindow() {
		// Reset form
		const form = document.getElementById('suggestion-form');
		if (form) {
			form.reset();
			form.style.display = 'block';
		}
		
		const successMsg = document.getElementById('suggestion-success');
		if (successMsg) {
			successMsg.style.display = 'none';
		}
		
		// Update submit button state after reset
		updateSubmitButton();
		
		// Close window
		const window = $('#suggestions-window');
		window.find('.winclose').trigger('click');
	}

	// Make functions globally available
	window.initializeSuggestionsForm = initializeSuggestionsForm;
});