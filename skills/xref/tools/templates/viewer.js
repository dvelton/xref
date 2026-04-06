// Xref Viewer JavaScript

(function() {
    'use strict';
    
    let currentPanel = null;
    let navigationStack = [];
    
    // Initialize on load
    document.addEventListener('DOMContentLoaded', init);
    
    function init() {
        setupTabs();
        setupSearch();
        setupInteractiveElements();
        setupKeyboardShortcuts();
        setupNavigation();
    }
    
    // Tab Switching
    function setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                
                // Update active button
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update active content
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.getElementById(`tab-${tabName}`).classList.add('active');
            });
        });
    }
    
    // Search Functionality
    function setupSearch() {
        const searchBox = document.getElementById('search-box');
        
        searchBox.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            
            if (!query) {
                clearSearchHighlights();
                return;
            }
            
            // Search in document text
            const content = document.querySelector('.document-text');
            const text = content.textContent;
            
            // Simple text search and highlight
            clearSearchHighlights();
            
            if (query.length >= 3) {
                highlightSearchMatches(query);
            }
        });
    }
    
    function highlightSearchMatches(query) {
        // Simple implementation - in production would use more sophisticated highlighting
        console.log('Searching for:', query);
    }
    
    function clearSearchHighlights() {
        document.querySelectorAll('.search-highlight').forEach(el => {
            el.classList.remove('search-highlight');
        });
    }
    
    // Interactive Elements
    function setupInteractiveElements() {
        // Mark up cross-references in the document text
        markupReferences();
        
        // Add event listeners to interactive elements
        document.querySelectorAll('.xref-link').forEach(el => {
            el.addEventListener('mouseenter', handleHover);
            el.addEventListener('mouseleave', handleUnhover);
            el.addEventListener('click', handleClick);
        });
        
        document.querySelectorAll('.defined-term').forEach(el => {
            el.addEventListener('mouseenter', handleHover);
            el.addEventListener('mouseleave', handleUnhover);
            el.addEventListener('click', handleClick);
        });
        
        document.querySelectorAll('.external-citation').forEach(el => {
            el.addEventListener('mouseenter', handleHover);
            el.addEventListener('mouseleave', handleUnhover);
            el.addEventListener('click', handleClick);
        });
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (currentPanel && !e.target.closest('.hover-panel') && 
                !e.target.closest('.xref-link') && 
                !e.target.closest('.defined-term') &&
                !e.target.closest('.external-citation')) {
                hidePanel();
            }
        });
    }
    
    function markupReferences() {
        const content = document.querySelector('.document-text');
        if (!content || !window.xrefData) return;
        
        let html = content.innerHTML;
        
        // Mark up internal references
        if (window.xrefData.internal_refs) {
            window.xrefData.internal_refs.forEach((ref, idx) => {
                const pattern = escapeRegExp(ref.text);
                html = html.replace(
                    new RegExp(pattern, 'g'),
                    `<span class="xref-link" data-ref-id="${ref.id}" data-section="${ref.target_section}">${ref.text}</span>`
                );
            });
        }
        
        // Mark up defined terms (longest first to avoid partial matches)
        if (window.xrefData.defined_terms) {
            const sorted = [...window.xrefData.defined_terms].sort(
                (a, b) => b.term.length - a.term.length
            );
            sorted.forEach((term) => {
                const pattern = `(?<![\\w">])${escapeRegExp(term.term)}(?![\\w<])`;
                html = html.replace(
                    new RegExp(pattern, 'g'),
                    `<span class="defined-term" data-term="${term.term}">${term.term}</span>`
                );
            });
        }
        
        content.innerHTML = html;
    }
    
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    function handleHover(e) {
        const element = e.target;
        let panelId;
        
        if (element.classList.contains('xref-link')) {
            panelId = `panel-${element.dataset.refId}`;
        } else if (element.classList.contains('defined-term')) {
            const term = element.dataset.term;
            const termIndex = window.xrefData.defined_terms.findIndex(t => t.term === term);
            panelId = `panel-term-${termIndex + 1}`;
        } else if (element.classList.contains('external-citation')) {
            // Find external citation index
            panelId = 'panel-ext-1'; // Simplified
        }
        
        if (panelId) {
            showPanel(panelId, element);
        }
    }
    
    function handleUnhover(e) {
        // Only hide if panel is not pinned
        if (currentPanel && !currentPanel.classList.contains('pinned')) {
            setTimeout(() => {
                if (!currentPanel.matches(':hover')) {
                    hidePanel();
                }
            }, 100);
        }
    }
    
    function handleClick(e) {
        e.stopPropagation();
        
        if (currentPanel) {
            currentPanel.classList.toggle('pinned');
        }
    }
    
    function showPanel(panelId, anchor) {
        hidePanel();
        
        const panel = document.getElementById(panelId);
        if (!panel) return;
        
        currentPanel = panel;
        panel.classList.add('visible');
        
        // Position panel near anchor
        const rect = anchor.getBoundingClientRect();
        panel.style.top = `${rect.bottom + 10}px`;
        panel.style.left = `${rect.left}px`;
        
        // Ensure panel stays within viewport
        setTimeout(() => {
            const panelRect = panel.getBoundingClientRect();
            if (panelRect.right > window.innerWidth) {
                panel.style.left = `${window.innerWidth - panelRect.width - 20}px`;
            }
            if (panelRect.bottom > window.innerHeight) {
                panel.style.top = `${rect.top - panelRect.height - 10}px`;
            }
        }, 0);
    }
    
    function hidePanel() {
        if (currentPanel) {
            currentPanel.classList.remove('visible', 'pinned');
            currentPanel = null;
        }
    }
    
    // Navigation
    function setupNavigation() {
        document.querySelectorAll('.jump-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                
                if (target) {
                    // Store current position in navigation stack
                    navigationStack.push(window.scrollY);
                    
                    // Scroll to target
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    target.classList.add('highlight');
                    
                    setTimeout(() => {
                        target.classList.remove('highlight');
                    }, 2000);
                    
                    hidePanel();
                }
            });
        });
        
        // TOC links
        document.querySelectorAll('.toc-item a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }
    
    // Keyboard Shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Escape - close panel
            if (e.key === 'Escape') {
                hidePanel();
            }
            
            // g - toggle glossary
            if (e.key === 'g' && !e.ctrlKey && !e.metaKey) {
                document.querySelector('[data-tab="glossary"]').click();
            }
            
            // h - toggle health
            if (e.key === 'h' && !e.ctrlKey && !e.metaKey) {
                document.querySelector('[data-tab="health"]').click();
            }
            
            // t - toggle TOC
            if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
                document.querySelector('[data-tab="toc"]').click();
            }
            
            // / or s - focus search
            if (e.key === '/' || e.key === 's') {
                e.preventDefault();
                document.getElementById('search-box').focus();
            }
            
            // n/N - next/previous unresolved
            if (e.key === 'n' || e.key === 'N') {
                navigateUnresolved(e.key === 'N');
            }
        });
    }
    
    function navigateUnresolved(backwards) {
        const unresolved = document.querySelectorAll('.broken-reference, .undefined-term, .external-doc-ref');
        if (!unresolved.length) return;
        
        let currentIndex = -1;
        const scrollPos = window.scrollY;
        
        unresolved.forEach((el, idx) => {
            const rect = el.getBoundingClientRect();
            if (rect.top > 0 && rect.top < window.innerHeight && currentIndex === -1) {
                currentIndex = idx;
            }
        });
        
        let targetIndex;
        if (backwards) {
            targetIndex = currentIndex > 0 ? currentIndex - 1 : unresolved.length - 1;
        } else {
            targetIndex = currentIndex < unresolved.length - 1 ? currentIndex + 1 : 0;
        }
        
        unresolved[targetIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Glossary item click - highlight term in document
    document.querySelectorAll('.glossary-item').forEach(item => {
        item.addEventListener('click', () => {
            const term = item.dataset.term;
            const firstOccurrence = document.querySelector(`.defined-term[data-term="${term}"]`);
            
            if (firstOccurrence) {
                firstOccurrence.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstOccurrence.classList.add('highlight');
                
                setTimeout(() => {
                    firstOccurrence.classList.remove('highlight');
                }, 2000);
            }
        });
    });
    
})();
