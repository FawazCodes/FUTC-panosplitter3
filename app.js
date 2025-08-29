/**
 * Pano Slicer Pro - Modern Redesign
 * 
 * A clean, modern panorama slicing tool built with vanilla JavaScript
 */

(() => {
    'use strict';

    // ============================================================================
    // CONSTANTS & CONFIGURATION
    // ============================================================================
    
    const CONFIG = {
        ASPECT_RATIO: 4 / 5,
        STANDARD_WIDTH: 1080,
        STANDARD_HEIGHT: 1350,
        MIN_SLICES: 2,
        MAX_SLICES: 10,
        EXPORT_TYPE: 'image/png',
        STORAGE_KEY: 'pano_slicer_settings'
    };

    // ============================================================================
    // APPLICATION STATE
    // ============================================================================
    
    const state = {
        originalImage: null,
        slicedImages: [],
        currentTheme: 'dark',
        isProcessing: false,
        settings: {
            sliceCount: 3,
            highResolution: true,
            backgroundType: 'blur',
            blurIntensity: 10,
            blurDownscale: 35,
            watermarkType: 'none'
        }
    };

    // ============================================================================
    // DOM ELEMENTS
    // ============================================================================
    
    const elements = {
        // Core UI
        uploadArea: document.getElementById('upload-area'),
        fileInput: document.getElementById('file-input'),
        previewContainer: document.getElementById('preview-container'),
        resultContainer: document.getElementById('result-container'),
        
        // Preview elements
        previewImg: document.getElementById('preview-img'),
        selectedFilename: document.getElementById('selected-filename-preview'),
        
        // Settings controls
        sliceCountSlider: document.getElementById('slice-count'),
        sliceCountDisplay: document.getElementById('slice-count-display'),
        highResToggle: document.getElementById('high-res-toggle'),
        
        // Background settings
        bgTypeRadios: document.querySelectorAll('input[name="bg-type"]'),
        blurControls: document.getElementById('blur-controls'),
        colorControls: document.getElementById('color-controls'),
        gradientControls: document.getElementById('gradient-controls'),
        blurIntensity: document.getElementById('blur-intensity'),
        blurDownscale: document.getElementById('blur-downscale'),
        
        // Action buttons
        processBtn: document.getElementById('process-btn'),
        resetBtn: document.getElementById('reset-btn'),
        changeFileBtn: document.getElementById('change-file-btn'),
        downloadBtn: document.getElementById('download-btn'),
        processAnotherBtn: document.getElementById('process-another-btn'),
        
        // Results
        slicesPreview: document.getElementById('slices-preview'),
        originalSize: document.getElementById('original-size'),
        scaledSize: document.getElementById('scaled-size'),
        sliceResolution: document.getElementById('slice-resolution'),
        
        // Modals & overlays
        loadingOverlay: document.getElementById('loading-overlay'),
        shortcutsModal: document.getElementById('shortcuts-modal'),
        shortcutsBtn: document.getElementById('shortcuts-btn'),
        shortcutsClose: document.getElementById('shortcuts-close'),
        themeToggle: document.getElementById('theme-toggle'),
        
        // Error handling
        errorMessage: document.getElementById('error-message'),
        dismissError: document.getElementById('dismiss-error')
    };

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================
    
    const utils = {
        // Format file size
        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },

        // Format dimensions
        formatDimensions(width, height) {
            return `${width} × ${height}`;
        },

        // Show loading state
        showLoading(message = 'Processing...') {
            elements.loadingOverlay.classList.remove('hidden');
            if (elements.loadingText) {
                elements.loadingText.textContent = message;
            }
        },

        // Hide loading state
        hideLoading() {
            elements.loadingOverlay.classList.add('hidden');
        },

        // Show error message
        showError(message, suggestions = []) {
            elements.errorMessage.classList.remove('hidden');
            const errorSuggestions = document.getElementById('error-suggestions');
            
            if (errorSuggestions && suggestions.length > 0) {
                errorSuggestions.innerHTML = suggestions
                    .map(suggestion => `<li>${suggestion}</li>`)
                    .join('');
            }
        },

        // Hide error message
        hideError() {
            elements.errorMessage.classList.add('hidden');
        },

        // Save settings to localStorage
        saveSettings() {
            try {
                localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.settings));
            } catch (error) {
                console.warn('Failed to save settings:', error);
            }
        },

        // Load settings from localStorage
        loadSettings() {
            try {
                const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    Object.assign(state.settings, parsed);
                    this.applySettings();
                }
            } catch (error) {
                console.warn('Failed to load settings:', error);
            }
        },

        // Apply current settings to UI
        applySettings() {
            // Slice count
            if (elements.sliceCountSlider) {
                elements.sliceCountSlider.value = state.settings.sliceCount;
            }
            if (elements.sliceCountDisplay) {
                elements.sliceCountDisplay.textContent = state.settings.sliceCount;
            }

            // High resolution toggle
            if (elements.highResToggle) {
                elements.highResToggle.checked = state.settings.highResolution;
            }

            // Background type
            if (state.settings.backgroundType && elements.bgTypeRadios) {
                const radio = document.getElementById(`bg-type-${state.settings.backgroundType}`);
                if (radio) radio.checked = true;
                this.updateBackgroundControls();
            }

            // Blur settings
            if (elements.blurIntensity) {
                elements.blurIntensity.value = state.settings.blurIntensity;
            }
            if (elements.blurDownscale) {
                elements.blurDownscale.value = state.settings.blurDownscale;
            }
        },

        // Update background control visibility
        updateBackgroundControls() {
            const bgType = state.settings.backgroundType;
            
            // Hide all controls first
            [elements.blurControls, elements.colorControls, elements.gradientControls]
                .forEach(el => el?.classList.add('hidden'));
            
            // Show relevant controls
            switch (bgType) {
                case 'blur':
                    elements.blurControls?.classList.remove('hidden');
                    break;
                case 'color':
                    elements.colorControls?.classList.remove('hidden');
                    break;
                case 'gradient':
                    elements.gradientControls?.classList.remove('hidden');
                    break;
            }
        }
    };

    // ============================================================================
    // IMAGE PROCESSING
    // ============================================================================
    
    const imageProcessor = {
        // Process the uploaded image
        async processImage(imageFile) {
            try {
                utils.showLoading('Loading image...');
                
                // Create image element
                const img = await this.createImageElement(imageFile);
                
                // Store original image
                state.originalImage = img;
                
                // Update preview
                this.updatePreview(img, imageFile.name);
                
                // Show preview container
                elements.previewContainer.classList.remove('hidden');
                
                // Update image info
                this.updateImageInfo(img);
                
                utils.hideLoading();
                
            } catch (error) {
                console.error('Failed to process image:', error);
                utils.showError('Failed to process image', [
                    'Make sure the file is a valid image',
                    'Try a different image format',
                    'Check if the file is corrupted'
                ]);
                utils.hideLoading();
            }
        },

        // Create image element from file
        createImageElement(file) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = URL.createObjectURL(file);
            });
        },

        // Update preview display
        updatePreview(img, filename) {
            if (elements.previewImg) {
                elements.previewImg.src = img.src;
                elements.previewImg.alt = `Preview of ${filename}`;
            }
            
            if (elements.selectedFilename) {
                elements.selectedFilename.textContent = filename;
            }
        },

        // Update image information display
        updateImageInfo(img) {
            const { width, height } = img;
            const scaledWidth = CONFIG.STANDARD_WIDTH;
            const scaledHeight = Math.round(scaledWidth / (width / height));
            
            if (elements.originalSize) {
                elements.originalSize.textContent = utils.formatDimensions(width, height);
            }
            
            if (elements.scaledSize) {
                elements.scaledSize.textContent = utils.formatDimensions(scaledWidth, scaledHeight);
            }
            
            if (elements.sliceResolution) {
                const sliceWidth = Math.round(scaledWidth / state.settings.sliceCount);
                const sliceHeight = scaledHeight;
                elements.sliceResolution.textContent = utils.formatDimensions(sliceWidth, sliceHeight);
            }
        },

        // Generate slices from the image
        async generateSlices() {
            if (!state.originalImage) {
                utils.showError('No image loaded', ['Please upload an image first']);
                return;
            }

            try {
                utils.showLoading('Generating slices...');
                state.isProcessing = true;

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const { width, height } = state.originalImage;
                const targetWidth = CONFIG.STANDARD_WIDTH;
                const targetHeight = Math.round(targetWidth / (width / height));
                
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                
                // Draw and scale the image
                ctx.drawImage(state.originalImage, 0, 0, targetWidth, targetHeight);
                
                // Generate slices
                const sliceWidth = Math.round(targetWidth / state.settings.sliceCount);
                const slices = [];
                
                for (let i = 0; i < state.settings.sliceCount; i++) {
                    const sliceCanvas = document.createElement('canvas');
                    const sliceCtx = sliceCanvas.getContext('2d');
                    
                    sliceCanvas.width = sliceWidth;
                    sliceCanvas.height = targetHeight;
                    
                    // Extract slice
                    sliceCtx.drawImage(
                        canvas,
                        i * sliceWidth, 0, sliceWidth, targetHeight,
                        0, 0, sliceWidth, targetHeight
                    );
                    
                    // Convert to blob
                    const blob = await new Promise(resolve => {
                        sliceCanvas.toBlob(resolve, CONFIG.EXPORT_TYPE);
                    });
                    
                    slices.push({
                        index: i + 1,
                        blob,
                        dataUrl: sliceCanvas.toDataURL(CONFIG.EXPORT_TYPE)
                    });
                }
                
                state.slicedImages = slices;
                this.displaySlices(slices);
                elements.resultContainer.classList.remove('hidden');
                
                utils.hideLoading();
                state.isProcessing = false;
                
            } catch (error) {
                console.error('Failed to generate slices:', error);
                utils.showError('Failed to generate slices', [
                    'Try with a smaller image',
                    'Check if the image format is supported',
                    'Try refreshing the page'
                ]);
                utils.hideLoading();
                state.isProcessing = false;
            }
        },

        // Display generated slices
        displaySlices(slices) {
            if (!elements.slicesPreview) return;
            
            elements.slicesPreview.innerHTML = slices.map(slice => `
                <div class="slice-item">
                    <img src="${slice.dataUrl}" alt="Slice ${slice.index}" />
                    <div class="slice-actions">
                        <button class="btn btn-sm btn-secondary" onclick="app.downloadSlice(${slice.index - 1})">
                            <i data-lucide="download" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `).join('');
            
            // Reinitialize Lucide icons
            if (window.lucide) {
                lucide.createIcons();
            }
        },

        // Download a single slice
        downloadSlice(index) {
            const slice = state.slicedImages[index];
            if (!slice) return;
            
            const link = document.createElement('a');
            link.href = slice.dataUrl;
            link.download = `slice-${slice.index}.png`;
            link.click();
        },

        // Download all slices as ZIP
        async downloadAllSlices() {
            if (state.slicedImages.length === 0) {
                utils.showError('No slices to download', ['Generate slices first']);
                return;
            }

            try {
                utils.showLoading('Creating download...');
                
                // Create ZIP file
                const JSZip = window.JSZip;
                if (!JSZip) {
                    // Fallback to individual downloads
                    state.slicedImages.forEach(slice => this.downloadSlice(slice.index - 1));
                    utils.hideLoading();
                    return;
                }
                
                const zip = new JSZip();
                
                state.slicedImages.forEach(slice => {
                    zip.file(`slice-${slice.index}.png`, slice.blob);
                });
                
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                
                // Download ZIP
                const link = document.createElement('a');
                link.href = URL.createObjectURL(zipBlob);
                link.download = 'panorama-slices.zip';
                link.click();
                
                utils.hideLoading();
                
            } catch (error) {
                console.error('Failed to create ZIP:', error);
                utils.showError('Failed to create ZIP', [
                    'Try downloading slices individually',
                    'Check if your browser supports ZIP creation'
                ]);
                utils.hideLoading();
            }
        }
    };

    // ============================================================================
    // THEME MANAGEMENT
    // ============================================================================
    
    const themeManager = {
        init() {
            // Load saved theme
            const savedTheme = localStorage.getItem('pano_slicer_theme') || 'dark';
            this.setTheme(savedTheme);
            
            // Set up theme toggle
            if (elements.themeToggle) {
                elements.themeToggle.addEventListener('click', () => {
                    const newTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
                    this.setTheme(newTheme);
                });
            }
        },

        setTheme(theme) {
            state.currentTheme = theme;
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('pano_slicer_theme', theme);
            
            // Update theme toggle icon
            this.updateThemeIcon(theme);
        },

        updateThemeIcon(theme) {
            const darkIcon = document.getElementById('theme-icon-dark');
            const lightIcon = document.getElementById('theme-icon-light');
            
            if (darkIcon && lightIcon) {
                if (theme === 'dark') {
                    darkIcon.classList.remove('hidden');
                    lightIcon.classList.add('hidden');
                } else {
                    darkIcon.classList.add('hidden');
                    lightIcon.classList.remove('hidden');
                }
            }
        }
    };

    // ============================================================================
    // EVENT HANDLERS
    // ============================================================================
    
    const eventHandlers = {
        init() {
            // File input change
            if (elements.fileInput) {
                elements.fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        imageProcessor.processImage(file);
                    }
                });
            }

            // Drag and drop
            if (elements.uploadArea) {
                elements.uploadArea.addEventListener('dragover', this.handleDragOver);
                elements.uploadArea.addEventListener('drop', this.handleDrop);
                elements.uploadArea.addEventListener('dragleave', this.handleDragLeave);
            }

            // Process button
            if (elements.processBtn) {
                elements.processBtn.addEventListener('click', () => {
                    imageProcessor.generateSlices();
                });
            }

            // Download button
            if (elements.downloadBtn) {
                elements.downloadBtn.addEventListener('click', () => {
                    imageProcessor.downloadAllSlices();
                });
            }

            // Process another button
            if (elements.processAnotherBtn) {
                elements.processAnotherBtn.addEventListener('click', this.resetApp);
            }

            // Change file button
            if (elements.changeFileBtn) {
                elements.changeFileBtn.addEventListener('click', () => {
                    elements.fileInput.click();
                });
            }

            // Reset button
            if (elements.resetBtn) {
                elements.resetBtn.addEventListener('click', this.resetApp);
            }

            // Slice count slider
            if (elements.sliceCountSlider) {
                elements.sliceCountSlider.addEventListener('input', (e) => {
                    const count = parseInt(e.target.value);
                    state.settings.sliceCount = count;
                    if (elements.sliceCountDisplay) {
                        elements.sliceCountDisplay.textContent = count;
                    }
                    utils.saveSettings();
                });
            }

            // High resolution toggle
            if (elements.highResToggle) {
                elements.highResToggle.addEventListener('change', (e) => {
                    state.settings.highResolution = e.target.checked;
                    utils.saveSettings();
                });
            }

            // Background type radios
            if (elements.bgTypeRadios) {
                elements.bgTypeRadios.forEach(radio => {
                    radio.addEventListener('change', (e) => {
                        state.settings.backgroundType = e.target.value;
                        utils.updateBackgroundControls();
                        utils.saveSettings();
                    });
                });
            }

            // Blur controls
            if (elements.blurIntensity) {
                elements.blurIntensity.addEventListener('input', (e) => {
                    state.settings.blurIntensity = parseInt(e.target.value);
                    utils.saveSettings();
                });
            }

            if (elements.blurDownscale) {
                elements.blurDownscale.addEventListener('input', (e) => {
                    state.settings.blurDownscale = parseInt(e.target.value);
                    utils.saveSettings();
                });
            }

            // Error dismiss
            if (elements.dismissError) {
                elements.dismissError.addEventListener('click', () => {
                    utils.hideError();
                });
            }

            // Shortcuts modal
            if (elements.shortcutsBtn) {
                elements.shortcutsBtn.addEventListener('click', () => {
                    elements.shortcutsModal.classList.remove('hidden');
                });
            }

            if (elements.shortcutsClose) {
                elements.shortcutsClose.addEventListener('click', () => {
                    elements.shortcutsModal.classList.add('hidden');
                });
            }

            // Close modal on backdrop click
            if (elements.shortcutsModal) {
                elements.shortcutsModal.addEventListener('click', (e) => {
                    if (e.target === elements.shortcutsModal) {
                        elements.shortcutsModal.classList.add('hidden');
                    }
                });
            }

            // Keyboard shortcuts
            document.addEventListener('keydown', this.handleKeyboard);
        },

        handleDragOver(e) {
            e.preventDefault();
            elements.uploadArea.classList.add('drag-over');
        },

        handleDrop(e) {
            e.preventDefault();
            elements.uploadArea.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    imageProcessor.processImage(file);
                } else {
                    utils.showError('Invalid file type', ['Please select an image file']);
                }
            }
        },

        handleDragLeave(e) {
            e.preventDefault();
            elements.uploadArea.classList.remove('drag-over');
        },

        handleKeyboard(e) {
            // Ctrl+O: Open file
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                elements.fileInput.click();
            }
            
            // Enter: Process image
            if (e.key === 'Enter' && !state.isProcessing) {
                e.preventDefault();
                imageProcessor.generateSlices();
            }
            
            // Ctrl+S: Download
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                imageProcessor.downloadAllSlices();
            }
            
            // Ctrl+T: Toggle theme
            if (e.ctrlKey && e.key === 't') {
                e.preventDefault();
                const newTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
                themeManager.setTheme(newTheme);
            }
            
            // Escape: Close modals
            if (e.key === 'Escape') {
                elements.shortcutsModal?.classList.add('hidden');
            }
        },

        resetApp() {
            // Reset state
            state.originalImage = null;
            state.slicedImages = [];
            state.isProcessing = false;
            
            // Reset file input
            if (elements.fileInput) {
                elements.fileInput.value = '';
            }
            
            // Hide containers
            elements.previewContainer.classList.add('hidden');
            elements.resultContainer.classList.add('hidden');
            
            // Clear preview
            if (elements.previewImg) {
                elements.previewImg.src = '';
                elements.previewImg.alt = '';
            }
            
            // Clear filename
            if (elements.selectedFilename) {
                elements.selectedFilename.textContent = '';
            }
            
            // Clear slices preview
            if (elements.slicesPreview) {
                elements.slicesPreview.innerHTML = '';
            }
            
            // Clear image info
            ['originalSize', 'scaledSize', 'sliceResolution'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = '-';
            });
            
            // Hide error if visible
            utils.hideError();
        }
    };

    // ============================================================================
    // INITIALIZATION
    // ============================================================================
    
    const app = {
        init() {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        },

        setup() {
            try {
                // Initialize theme
                themeManager.init();
                
                // Load saved settings
                utils.loadSettings();
                
                // Set up event handlers
                eventHandlers.init();
                
                // Initialize Lucide icons
                if (window.lucide) {
                    lucide.createIcons();
                }
                
                console.log('Pano Slicer Pro initialized successfully');
                
            } catch (error) {
                console.error('Failed to initialize app:', error);
                utils.showError('Failed to initialize application', [
                    'Please refresh the page',
                    'Check browser console for details'
                ]);
            }
        },

        // Public methods for global access
        downloadSlice: (index) => imageProcessor.downloadSlice(index)
    };

    // Initialize the application
    app.init();

    // Make app globally accessible
    window.app = app;

})();

