(function () {
    const SCHOOL_LEVEL_PATHS = {
        'class 06': '/class06/',
        'class 07': '/class07/',
        'class 08': '/class08/',
        'class 09': '/class09/',
        'class 10': '/class10/',
        'class 11': '/class11/',
        'class 12': '/class12/'
    };

    const QUOTE_ROTATION_INTERVAL_MS = 10000;
    const TYPEWRITER_DEFAULT_DELAY_MS = 38;
    const TYPEWRITER_PUNCTUATION_DELAY_MS = 110;

    const SCHOOL_QUOTES = [
        'Programs must be written for people to read',
        'Talk is cheap. Show me the code',
        'Start with the problem, not the tool',
        'Debug with patience',
        'Algorithms are the poetry of computation',
        'Readability is a feature',
        'Small steps build strong systems',
        'Think in structures, not shortcuts',
        'Data structures matter',
        'Clarity beats cleverness',
        'Every bug is a clue',
        'Build, test, learn, repeat',
        'First principles create confidence',
        'Logic makes complexity manageable',
        'Good code is honest code',
        'Reason before you run',
        'The best solution is understandable',
        'Practice turns syntax into skill'
    ];

    const ADVANCED_QUOTES = [
        'Abstraction is a superpower',
        'Systems reward careful thought',
        'Measure before you optimize',
        'Complexity has a cost',
        'Design the interface before the implementation',
        'Concurrency demands precision',
        'Every model carries assumptions',
        'Scale is a property of structure',
        'The right invariant changes everything',
        'Optimization begins with understanding',
        'A clean architecture makes change possible',
        'Keep the contracts explicit',
        'Good software survives refactoring',
        'Rigour makes systems trustworthy',
        'The machine obeys exactly what you describe'
    ];

    const LOCKED_QUOTES = [
        'Choose your class or track first',
        'Set up your profile to continue',
        'Open the dashboard to unlock learning',
        'Start with the next right step',
        'Clear structure makes progress easier',
        'A small decision can unlock the path',
        'Learning grows from a clear map',
        'Prepare the foundation first',
        'Get started with your current class',
        'Build the route before the sprint'
    ];

    const state = {
        profile: null,
        educationLevel: '',
        trackType: 'guest',
        currentQuote: '',
        quoteRotationTimerId: null,
        quoteRotationToken: 0,
        quoteTypingTimerId: null,
        quoteTypingToken: 0
    };

    const elements = {};

    function normalizeEducationLevel(value) {
        return typeof value === 'string' ? value.trim().toLowerCase().replace(/\s+/g, ' ') : '';
    }

    function formatLevelLabel(level) {
        const normalized = normalizeEducationLevel(level);

        if (!normalized) {
            return '';
        }

        const schoolMatch = normalized.match(/^class\s*(\d{1,2})$/);
        if (schoolMatch) {
            return 'Class ' + schoolMatch[1].padStart(2, '0');
        }

        if (normalized === 'undergraduate') {
            return 'Undergraduate';
        }

        if (normalized === 'postgraduate') {
            return 'Postgraduate';
        }

        if (normalized === 'phd') {
            return 'PhD';
        }

        return normalized;
    }

    function getTrackType(level) {
        if (SCHOOL_LEVEL_PATHS[level]) {
            return 'school';
        }

        if (level === 'undergraduate' || level === 'postgraduate' || level === 'phd') {
            return 'advanced';
        }

        return 'locked';
    }

    function getQuotesForTrack(trackType) {
        if (trackType === 'school') {
            return SCHOOL_QUOTES;
        }

        if (trackType === 'advanced') {
            return ADVANCED_QUOTES;
        }

        return LOCKED_QUOTES;
    }

    function shouldReduceMotion() {
        return typeof window.matchMedia === 'function'
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function getTypingDelay(character) {
        if (!character || character === ' ') {
            return TYPEWRITER_DEFAULT_DELAY_MS * 0.75;
        }

        if (/[.,!?;:]/.test(character)) {
            return TYPEWRITER_PUNCTUATION_DELAY_MS;
        }

        return TYPEWRITER_DEFAULT_DELAY_MS;
    }

    function clearQuoteTimers() {
        state.quoteRotationToken += 1;
        state.quoteTypingToken += 1;

        if (state.quoteRotationTimerId !== null) {
            window.clearTimeout(state.quoteRotationTimerId);
            state.quoteRotationTimerId = null;
        }

        if (state.quoteTypingTimerId !== null) {
            window.clearTimeout(state.quoteTypingTimerId);
            state.quoteTypingTimerId = null;
        }

        if (elements.title) {
            elements.title.style.opacity = '';
        }
    }

    function getLearningPath(level) {
        if (SCHOOL_LEVEL_PATHS[level]) {
            return SCHOOL_LEVEL_PATHS[level];
        }

        return '';
    }

    function pickRandomQuote(quotes, previousQuote = '') {
        if (!Array.isArray(quotes) || !quotes.length) {
            return 'Keep learning';
        }

        const availableQuotes = previousQuote && quotes.length > 1
            ? quotes.filter((quote) => quote !== previousQuote)
            : quotes;

        const pool = availableQuotes.length ? availableQuotes : quotes;

        if (window.crypto && typeof window.crypto.getRandomValues === 'function' && pool.length > 1) {
            const randomValues = new Uint32Array(1);
            window.crypto.getRandomValues(randomValues);
            return pool[randomValues[0] % pool.length];
        }

        return pool[Math.floor(Math.random() * pool.length)] || pool[0];
    }

    function getQuoteForTrack(trackType, previousQuote = '') {
        return pickRandomQuote(getQuotesForTrack(trackType), previousQuote);
    }

    function animateQuoteTitle(text) {
        if (!elements.title) {
            return;
        }

        const quoteText = typeof text === 'string' ? text : '';
        const typingToken = ++state.quoteTypingToken;

        if (state.quoteTypingTimerId !== null) {
            window.clearTimeout(state.quoteTypingTimerId);
            state.quoteTypingTimerId = null;
        }

        if (shouldReduceMotion()) {
            elements.title.textContent = quoteText;
            return;
        }

        const characters = Array.from(quoteText);

        if (!characters.length) {
            elements.title.textContent = '';
            return;
        }

        const typeNextCharacter = (index) => {
            if (state.quoteTypingToken !== typingToken) {
                return;
            }

            elements.title.textContent = characters.slice(0, index + 1).join('');

            if (index + 1 >= characters.length) {
                state.quoteTypingTimerId = null;
                return;
            }

            state.quoteTypingTimerId = window.setTimeout(() => {
                typeNextCharacter(index + 1);
            }, getTypingDelay(characters[index]));
        };

        elements.title.textContent = characters[0];

        if (characters.length === 1) {
            state.quoteTypingTimerId = null;
            return;
        }

        state.quoteTypingTimerId = window.setTimeout(() => {
            typeNextCharacter(1);
        }, getTypingDelay(characters[0]));
    }

    function startQuoteRotation(trackType, initialQuote) {
        const quotes = getQuotesForTrack(trackType);

        clearQuoteTimers();

        if (!elements.title || !quotes.length) {
            state.currentQuote = typeof initialQuote === 'string' ? initialQuote : '';

            if (elements.title) {
                elements.title.textContent = state.currentQuote;
            }

            return;
        }

        const rotationToken = state.quoteRotationToken;

        const renderNextQuote = (forcedQuote) => {
            if (state.quoteRotationToken !== rotationToken) {
                return;
            }

            const nextQuote = typeof forcedQuote === 'string' && forcedQuote
                ? forcedQuote
                : getQuoteForTrack(trackType, state.currentQuote);

            state.currentQuote = nextQuote;
            animateQuoteTitle(nextQuote);

            state.quoteRotationTimerId = window.setTimeout(() => {
                renderNextQuote();
            }, QUOTE_ROTATION_INTERVAL_MS);
        };

        renderNextQuote(initialQuote || getQuoteForTrack(trackType, state.currentQuote));
    }

    function buildCardCopy(level, trackType) {
        if (trackType === 'school') {
            const label = formatLevelLabel(level);
            return {
                badge: label,
                title: getQuoteForTrack(trackType, state.currentQuote),
                copy: 'Continue from your selected class, open your dashboard, or ask RaushanSYNC AI for guidance.'
            };
        }

        if (trackType === 'advanced') {
            const label = formatLevelLabel(level);
            return {
                badge: label,
                title: getQuoteForTrack(trackType, state.currentQuote),
                copy: 'Continue from your selected level, open your dashboard, or ask RaushanSYNC AI for guidance.'
            };
        }

        return {
            badge: 'Profile incomplete',
            title: getQuoteForTrack(trackType, state.currentQuote),
            copy: 'Choose your class or study track in the dashboard first. That unlocks Start Learning, Dashboard access, and AI support.'
        };
    }

    function openProfileHelpModal() {
        if (!elements.profileModal) {
            return;
        }

        elements.profileModal.hidden = false;
        elements.profileModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('ai-chat-open');

        if (elements.profileDismiss && window.matchMedia('(pointer: fine)').matches) {
            elements.profileDismiss.focus();
        }
    }

    function closeProfileHelpModal() {
        if (!elements.profileModal) {
            return;
        }

        elements.profileModal.hidden = true;
        elements.profileModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('ai-chat-open');
    }

    function openTrackChoiceModal() {
        if (!elements.trackChoiceModal) {
            return;
        }

        elements.trackChoiceModal.hidden = false;
        elements.trackChoiceModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('ai-chat-open');

        if (elements.computerScienceButton && window.matchMedia('(pointer: fine)').matches) {
            elements.computerScienceButton.focus();
        }
    }

    function closeTrackChoiceModal() {
        if (!elements.trackChoiceModal) {
            return;
        }

        elements.trackChoiceModal.hidden = true;
        elements.trackChoiceModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('ai-chat-open');
    }

    function openLearningTrack(path) {
        if (!path) {
            return;
        }

        window.location.assign(path);
    }

    function blockLearningAction() {
        openProfileHelpModal();
    }

    function openDashboard() {
        if (state.trackType === 'locked') {
            blockLearningAction();
            return;
        }

        window.location.assign('/dashboard');
    }

    function startLearning() {
        if (state.trackType === 'locked') {
            blockLearningAction();
            return;
        }

        if (state.trackType === 'advanced') {
            openTrackChoiceModal();
            return;
        }

        const path = getLearningPath(state.educationLevel);
        if (!path) {
            blockLearningAction();
            return;
        }

        window.location.assign(path);
    }

    function askRaushanSyncAI() {
        if (typeof window.initAIChat !== 'function') {
            window.alert('AI assistant is not available right now. Please refresh and try again.');
            return;
        }

        window.initAIChat(
            {
                practiceTitle: 'Student Support',
                questionText: 'General learning support',
                userAnswer: 'Home page student support',
                correctAnswer: 'Not provided',
                explanation: 'General academic guidance, study planning, exam preparation, and motivation.',
                pageUrl: window.location.href
            },
            {
                mode: 'student-support',
                title: 'RaushanSYNC AI Assistant',
                subtitle: 'Ask for help with your selected class, study routine, or general student support.',
                assistantGreeting: 'Hi! I can help with your class, study planning, exam preparation, career guidance, and general student questions.',
                inputLabel: 'Ask RaushanSYNC AI',
                inputPlaceholder: 'Ask about your class, notes, practice, or study plan...',
                showContext: false
            }
        );
    }

    async function loadProfileState() {
        if (typeof window.getCurrentSession !== 'function') {
            return null;
        }

        try {
            const session = await window.getCurrentSession();
            if (!session?.user) {
                return null;
            }

            if (typeof window.getUserProfile === 'function') {
                const profile = await window.getUserProfile({ sync: false });
                if (profile) {
                    return profile;
                }
            }

            return {
                id: session.user.id,
                full_name: session.user.user_metadata?.full_name || '',
                education_level: session.user.user_metadata?.education_level || '',
                phone: session.user.user_metadata?.phone || null
            };
        } catch (error) {
            if (window.console && typeof window.console.warn === 'function') {
                window.console.warn('Unable to load homepage profile state:', error);
            }
            return null;
        }
    }

    function renderGuestState() {
        clearQuoteTimers();

        if (document.documentElement.classList) {
            document.documentElement.classList.remove('home-hero-reserved');
        }

        if (elements.guestButtons) {
            elements.guestButtons.style.display = 'flex';
        }

        if (elements.userCard) {
            elements.userCard.style.display = 'none';
        }
    }

    function renderLoggedInState(profile) {
        const educationLevel = normalizeEducationLevel(profile?.education_level || '');
        const trackType = getTrackType(educationLevel);
        const cardCopy = buildCardCopy(educationLevel, trackType);

        if (document.documentElement.classList) {
            document.documentElement.classList.add('home-hero-reserved');
        }

        state.profile = profile;
        state.educationLevel = educationLevel;
        state.trackType = trackType;

        if (elements.guestButtons) {
            elements.guestButtons.style.display = 'none';
        }

        if (elements.userCard) {
            elements.userCard.style.display = 'flex';
            elements.userCard.classList.toggle('home-learning-card--locked', trackType === 'locked');
        }

        if (elements.badge) {
            elements.badge.textContent = cardCopy.badge;
        }

        startQuoteRotation(trackType, cardCopy.title);

        if (elements.copy) {
            elements.copy.textContent = cardCopy.copy;
        }
    }

    async function renderHomepageState() {
        const profile = await loadProfileState();

        if (!profile) {
            state.profile = null;
            state.educationLevel = '';
            state.trackType = 'guest';
            renderGuestState();
            return;
        }

        renderLoggedInState(profile);
    }

    function bindEvents() {
        if (elements.startButton) {
            elements.startButton.addEventListener('click', startLearning);
        }

        if (elements.dashboardButton) {
            elements.dashboardButton.addEventListener('click', openDashboard);
        }

        if (elements.aiButton) {
            elements.aiButton.addEventListener('click', askRaushanSyncAI);
        }

        if (elements.profileClose) {
            elements.profileClose.addEventListener('click', closeProfileHelpModal);
        }

        if (elements.profileDismiss) {
            elements.profileDismiss.addEventListener('click', closeProfileHelpModal);
        }

        if (elements.profileModal) {
            elements.profileModal.addEventListener('click', (event) => {
                const target = event.target;
                if (target instanceof HTMLElement && target.hasAttribute('data-profile-help-close')) {
                    closeProfileHelpModal();
                }
            });
        }

        if (elements.trackChoiceClose) {
            elements.trackChoiceClose.addEventListener('click', closeTrackChoiceModal);
        }

        if (elements.trackChoiceModal) {
            elements.trackChoiceModal.addEventListener('click', (event) => {
                const target = event.target;
                if (target instanceof HTMLElement && target.hasAttribute('data-track-choice-close')) {
                    closeTrackChoiceModal();
                }
            });
        }

        if (elements.computerScienceButton) {
            elements.computerScienceButton.addEventListener('click', () => {
                openLearningTrack('/computer-science');
            });
        }

        if (elements.dataScienceButton) {
            elements.dataScienceButton.addEventListener('click', () => {
                openLearningTrack('/data-science');
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') {
                return;
            }

            if (elements.profileModal && !elements.profileModal.hidden) {
                closeProfileHelpModal();
            }

            if (elements.trackChoiceModal && !elements.trackChoiceModal.hidden) {
                closeTrackChoiceModal();
            }
        });

        window.addEventListener('rs:auth-state-change', () => {
            renderHomepageState();
        });
    }

    function cacheElements() {
        elements.guestButtons = document.getElementById('auth-buttons-guest');
        elements.userCard = document.getElementById('auth-buttons-user');
        elements.badge = document.getElementById('home-learning-badge');
        elements.title = document.getElementById('home-learning-title');
        elements.copy = document.getElementById('home-learning-copy');
        elements.startButton = document.getElementById('home-start-learning');
        elements.dashboardButton = document.getElementById('home-dashboard-link');
        elements.aiButton = document.getElementById('home-ask-ai');
        elements.profileModal = document.getElementById('profile-help-modal');
        elements.profileClose = document.getElementById('profile-help-close');
        elements.profileDismiss = document.getElementById('profile-help-dismiss');
        elements.trackChoiceModal = document.getElementById('track-choice-modal');
        elements.trackChoiceClose = document.getElementById('track-choice-close');
        elements.computerScienceButton = document.getElementById('track-choice-computer-science');
        elements.dataScienceButton = document.getElementById('track-choice-data-science');
    }

    async function initializeHomepageHero() {
        cacheElements();
        bindEvents();

        if (typeof window.whenAuthReady === 'function') {
            await window.whenAuthReady();
        }

        await renderHomepageState();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeHomepageHero);
    } else {
        initializeHomepageHero();
    }
})();
