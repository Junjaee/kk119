/**
 * 교권119 웹사이트 JavaScript 파일
 * 접근성과 사용자 경험을 고려한 인터랙션 구현
 */

// DOM 요소 선택
const elements = {
    mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
    navigation: document.querySelector('.navigation'),
    emergencyBtn: document.querySelector('.emergency-btn'),
    emergencyContact: document.querySelector('.btn-emergency'),
    serviceCards: document.querySelectorAll('.service-card'),
    serviceBtns: document.querySelectorAll('.service-btn'),
    navLinks: document.querySelectorAll('.nav-link'),
    heroActions: document.querySelectorAll('.hero-actions .btn')
};

/**
 * 초기화 함수
 */
function init() {
    setupMobileMenu();
    setupSmoothScrolling();
    setupEmergencyActions();
    setupServiceInteractions();
    setupAccessibilityFeatures();
    setupAnimations();
    console.log('교권119 웹사이트가 초기화되었습니다.');
}

/**
 * 모바일 메뉴 설정
 */
function setupMobileMenu() {
    if (!elements.mobileMenuBtn || !elements.navigation) return;
    
    let isMenuOpen = false;
    
    elements.mobileMenuBtn.addEventListener('click', function() {
        isMenuOpen = !isMenuOpen;
        toggleMobileMenu(isMenuOpen);
    });
    
    // ESC 키로 메뉴 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isMenuOpen) {
            isMenuOpen = false;
            toggleMobileMenu(false);
        }
    });
    
    // 메뉴 외부 클릭으로 닫기
    document.addEventListener('click', function(e) {
        if (isMenuOpen && 
            !elements.navigation.contains(e.target) && 
            !elements.mobileMenuBtn.contains(e.target)) {
            isMenuOpen = false;
            toggleMobileMenu(false);
        }
    });
}

/**
 * 모바일 메뉴 토글
 */
function toggleMobileMenu(isOpen) {
    const hamburgers = elements.mobileMenuBtn.querySelectorAll('.hamburger');
    
    if (isOpen) {
        elements.navigation.style.display = 'block';
        elements.navigation.style.position = 'absolute';
        elements.navigation.style.top = '100%';
        elements.navigation.style.left = '0';
        elements.navigation.style.width = '100%';
        elements.navigation.style.background = 'white';
        elements.navigation.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        elements.navigation.style.zIndex = '1000';
        
        const navList = elements.navigation.querySelector('.nav-list');
        if (navList) {
            navList.style.flexDirection = 'column';
            navList.style.padding = '1rem';
            navList.style.gap = '0.5rem';
        }
        
        // 햄버거 메뉴 애니메이션
        hamburgers[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
        hamburgers[1].style.opacity = '0';
        hamburgers[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
        
        elements.mobileMenuBtn.setAttribute('aria-expanded', 'true');
        elements.mobileMenuBtn.setAttribute('aria-label', '메뉴 닫기');
    } else {
        elements.navigation.style.display = 'none';
        
        // 햄버거 메뉴 초기화
        hamburgers.forEach(hamburger => {
            hamburger.style.transform = '';
            hamburger.style.opacity = '';
        });
        
        elements.mobileMenuBtn.setAttribute('aria-expanded', 'false');
        elements.mobileMenuBtn.setAttribute('aria-label', '메뉴 열기');
    }
}

/**
 * 부드러운 스크롤링 설정
 */
function setupSmoothScrolling() {
    elements.navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // 해시 링크인 경우
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    const headerHeight = document.querySelector('.header').offsetHeight;
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // 접근성: 포커스 이동
                    targetElement.focus();
                    targetElement.setAttribute('tabindex', '-1');
                }
            }
        });
    });
}

/**
 * 응급 상황 액션 설정
 */
function setupEmergencyActions() {
    // 응급 신고 버튼
    if (elements.emergencyBtn) {
        elements.emergencyBtn.addEventListener('click', function() {
            handleEmergencyAction('header');
        });
    }
    
    // 응급 연락처 버튼
    if (elements.emergencyContact) {
        elements.emergencyContact.addEventListener('click', function() {
            handleEmergencyAction('contact');
        });
    }
}

/**
 * 응급 상황 처리
 */
function handleEmergencyAction(source) {
    // 실제 구현에서는 전화 걸기 또는 신고 폼으로 이동
    const confirmed = confirm(
        '응급상황이신가요?\n\n' +
        '긴급한 경우 1588-7119로 즉시 전화하시고,\n' +
        '온라인 신고를 원하시면 "확인"을 클릭해주세요.'
    );
    
    if (confirmed) {
        // 신고 폼 페이지로 이동 또는 모달 표시
        showReportForm();
    } else {
        // 전화 걸기 (모바일에서)
        if (window.confirm('1588-7119로 전화를 걸까요?')) {
            window.location.href = 'tel:1588-7119';
        }
    }
    
    // 분석을 위한 이벤트 로깅
    console.log(`Emergency action triggered from: ${source}`);
}

/**
 * 신고 폼 표시 (모달 또는 페이지 이동)
 */
function showReportForm() {
    // 실제 구현에서는 모달을 표시하거나 신고 페이지로 이동
    alert('신고 폼이 곧 구현될 예정입니다.\n현재는 1588-7119로 전화 신고를 이용해주세요.');
}

/**
 * 서비스 카드 인터랙션 설정
 */
function setupServiceInteractions() {
    // 서비스 버튼 클릭 처리
    elements.serviceBtns.forEach((btn, index) => {
        btn.addEventListener('click', function() {
            const serviceCard = this.closest('.service-card');
            const serviceTitle = serviceCard.querySelector('.service-title').textContent;
            
            handleServiceAction(serviceTitle, index);
        });
    });
    
    // 히어로 섹션 액션 버튼
    elements.heroActions.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const buttonText = this.textContent.trim();
            
            if (buttonText.includes('신고')) {
                e.preventDefault();
                handleEmergencyAction('hero');
            } else if (buttonText.includes('알아보기')) {
                // 서비스 섹션으로 스크롤
                const servicesSection = document.getElementById('services');
                if (servicesSection) {
                    servicesSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

/**
 * 서비스 액션 처리
 */
function handleServiceAction(serviceTitle, index) {
    console.log(`Service requested: ${serviceTitle}`);
    
    switch(index) {
        case 0: // 응급 신고
            handleEmergencyAction('service');
            break;
        case 1: // 전문 상담
            showConsultationForm();
            break;
        case 2: // 법률 지원
            showLegalSupportForm();
            break;
        case 3: // 예방 교육
            showEducationPrograms();
            break;
        default:
            console.log('Unknown service index:', index);
    }
}

/**
 * 상담 신청 폼 표시
 */
function showConsultationForm() {
    alert('전문 상담 신청이 곧 구현될 예정입니다.\n현재는 1588-7119로 전화 상담을 이용해주세요.');
}

/**
 * 법률 지원 폼 표시
 */
function showLegalSupportForm() {
    alert('법률 지원 신청이 곧 구현될 예정입니다.\n현재는 1588-7119로 문의해주세요.');
}

/**
 * 교육 프로그램 정보 표시
 */
function showEducationPrograms() {
    alert('예방 교육 프로그램 정보가 곧 제공될 예정입니다.\n자세한 내용은 1588-7119로 문의해주세요.');
}

/**
 * 접근성 기능 설정
 */
function setupAccessibilityFeatures() {
    // 키보드 네비게이션 향상
    document.addEventListener('keydown', function(e) {
        // Tab 키 트랩핑 (모달에서 사용)
        if (e.key === 'Tab') {
            handleTabNavigation(e);
        }
        
        // Enter 키로 버튼 활성화
        if (e.key === 'Enter' && e.target.matches('.service-card')) {
            const btn = e.target.querySelector('.service-btn');
            if (btn) btn.click();
        }
    });
    
    // 고대비 모드 감지
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    if (mediaQuery.matches) {
        document.body.classList.add('high-contrast');
    }
    
    // 애니메이션 감소 설정 감지
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
        document.body.classList.add('reduced-motion');
    }
    
    // 포커스 가시성 향상
    document.addEventListener('focusin', function(e) {
        e.target.classList.add('focused');
    });
    
    document.addEventListener('focusout', function(e) {
        e.target.classList.remove('focused');
    });
}

/**
 * Tab 키 네비게이션 처리
 */
function handleTabNavigation(e) {
    // 현재 구현에서는 기본 동작 사용
    // 모달이 추가되면 Tab 트랩핑 구현
}

/**
 * 스크롤 애니메이션 설정
 */
function setupAnimations() {
    // Intersection Observer를 사용한 스크롤 애니메이션
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // 애니메이션 대상 요소들
    const animateElements = document.querySelectorAll(
        '.service-card, .step, .hero-stats .stat-item, .contact-method'
    );
    
    animateElements.forEach(el => {
        el.classList.add('animate-ready');
        observer.observe(el);
    });
}

/**
 * 에러 처리
 */
function handleError(error, context) {
    console.error(`Error in ${context}:`, error);
    
    // 사용자에게 친화적인 에러 메시지
    if (context.includes('emergency')) {
        alert('일시적인 오류가 발생했습니다.\n직접 1588-7119로 전화해주세요.');
    }
}

/**
 * 폼 검증 유틸리티
 */
function validateForm(formData) {
    const errors = [];
    
    // 기본 검증 로직
    if (!formData.name || formData.name.trim().length < 2) {
        errors.push('이름을 올바르게 입력해주세요.');
    }
    
    if (!formData.phone || !/^[0-9-+\s()]+$/.test(formData.phone)) {
        errors.push('전화번호를 올바르게 입력해주세요.');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * 로컬 스토리지 유틸리티
 */
const storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn('Local storage not available:', error);
        }
    },
    
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.warn('Error reading from local storage:', error);
            return null;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('Error removing from local storage:', error);
        }
    }
};

/**
 * 디바이스 감지 유틸리티
 */
const device = {
    isMobile: () => window.innerWidth < 768,
    isTablet: () => window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: () => window.innerWidth >= 1024,
    
    isTouchDevice: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    
    // iOS 감지
    isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent),
    
    // Android 감지
    isAndroid: () => /Android/.test(navigator.userAgent)
};

/**
 * 윈도우 리사이즈 핸들러
 */
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        // 모바일에서 데스크톱으로 전환 시 메뉴 초기화
        if (device.isDesktop()) {
            elements.navigation.style.display = '';
            elements.mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
        
        console.log('Window resized:', {
            width: window.innerWidth,
            height: window.innerHeight,
            device: {
                mobile: device.isMobile(),
                tablet: device.isTablet(),
                desktop: device.isDesktop()
            }
        });
    }, 250);
});

/**
 * 페이지 로드 완료 시 초기화
 */
document.addEventListener('DOMContentLoaded', function() {
    try {
        init();
    } catch (error) {
        handleError(error, 'initialization');
    }
});

/**
 * 페이지 언로드 시 정리
 */
window.addEventListener('beforeunload', function() {
    // 필요한 데이터 저장
    const userInteractions = {
        visitTime: Date.now(),
        deviceType: device.isMobile() ? 'mobile' : device.isTablet() ? 'tablet' : 'desktop'
    };
    
    storage.set('lastVisit', userInteractions);
});

// CSS 애니메이션 클래스 추가
const style = document.createElement('style');
style.textContent = `
    .animate-ready {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }
    
    .animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .focused {
        outline: 3px solid var(--primary-color) !important;
        outline-offset: 2px !important;
    }
    
    .high-contrast .service-card,
    .high-contrast .step {
        border: 2px solid var(--gray-800);
    }
    
    .reduced-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
    
    @media (max-width: 768px) {
        .navigation {
            display: none;
        }
    }
`;
document.head.appendChild(style);

// 전역 객체로 유틸리티 함수들 내보내기
window.TeacherRights119 = {
    device,
    storage,
    handleError,
    validateForm,
    showReportForm,
    handleEmergencyAction
};