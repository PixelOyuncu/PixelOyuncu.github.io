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

	// Clear taskbar first to prevent duplication
	$('#taskbar').empty();

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

		if (win.find('.wincontent').length === 0) {
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
				content.css('height', 'auto'); // Reset first
				// Force reflow
				void content[0].offsetHeight;
				content.css('height', 'calc(100% - 48px)');
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

	$(document).on('click', '.openWindow', function (e) {
		// Stop propagation to prevent desktop click handler from firing
		e.stopPropagation();

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
			content.css('height', 'auto'); // Reset first
			// Force reflow
			void content[0].offsetHeight;
			content.css('height', 'calc(100% - 48px)');
			// ---------------------------------------------------------------
		}
	});

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

	// Modify the desktop icons part to create Windows 11 style icons
	$('#icons').empty(); // Clear existing icons first

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

		// Add double-click behavior to match Windows
		shortcutEl.on('dblclick', function () {
			$(this).trigger('click');
		});
	});

	// --- Suggestions window: Discord webhook + CAPTCHA ---
	const DISCORD_WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL_HERE'; // <-- Replace with your webhook

	function generateCaptcha() {
		const a = Math.floor(Math.random() * 10) + 1;
		const b = Math.floor(Math.random() * 10) + 1;
		$('#captcha-question').text(`What is ${a} + ${b}?`);
		$('#captcha-answer').val('');
		return a + b;
	}

	let captchaAnswer = generateCaptcha();

	$(document).on('click', '#comment-submit', function () {
		const username = $('#comment-username').val().trim() || 'Anonymous';
		const text = $('#comment-text').val().trim();
		const captchaInput = $('#captcha-answer').val().trim();
		const $status = $('#comment-status');
		$status.text('');

		if (!text) {
			$status.text('Please enter a comment.');
			return;
		}
		if (parseInt(captchaInput, 10) !== captchaAnswer) {
			$status.text('Incorrect CAPTCHA answer.');
			captchaAnswer = generateCaptcha();
			return;
		}

		$status.text('Sending...');
		$('#comment-submit').prop('disabled', true);

		$.ajax({
			url: DISCORD_WEBHOOK_URL,
			method: 'POST',
			contentType: 'application/json',
			data: JSON.stringify({
				username: 'Suggestion Bot',
				embeds: [{
					title: 'New Suggestion',
					fields: [
						{ name: 'User', value: username },
						{ name: 'Comment', value: text }
					],
					timestamp: new Date().toISOString()
				}]
			}),
			success: function () {
				$status.text('Suggestion sent! Thank you.');
				$('#comment-text').val('');
				captchaAnswer = generateCaptcha();
			},
			error: function () {
				$status.text('Failed to send. Please try again later.');
			},
			complete: function () {
				$('#comment-submit').prop('disabled', false);
			}
		});
	});

	// Regenerate captcha when Suggestions window is opened
	$(document).on('click', '.openWindow', function (e) {
		// Stop propagation to prevent desktop click handler from firing
		e.stopPropagation();

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
			content.css('height', 'auto'); // Reset first
			// Force reflow
			void content[0].offsetHeight;
			content.css('height', 'calc(100% - 48px)');
			// ---------------------------------------------------------------
		}

		// If Suggestions window is opened, render comments
		if (win.data('title') === 'Suggestions') {
			captchaAnswer = generateCaptcha();
			$('#comment-status').text('');
		}
	});
});