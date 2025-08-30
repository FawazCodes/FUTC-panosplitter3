/**
 * Pano Slicer Pro - Main Application Logic
 *
 * This script handles all client-side functionality for the panorama slicing tool,
 * including file handling, image processing, video generation, and UI interactions.
 * All processing is done locally in the user's browser.
 */

(() => {
    // --- Application Constants ---
    const ASPECT_RATIO = 4 / 5;
    const STANDARD_WIDTH = 1080;
    const STANDARD_HEIGHT = Math.round(STANDARD_WIDTH / ASPECT_RATIO);
    const MIN_SLICES = 2;
    const EXPORT_TYPE = 'image/png';
    const STORAGE_KEY = 'panorama_slicer_settings';

    // --- Application State ---
    let state = {
        originalImage: null,
        slicedImages: [],
        fullViewImage: null,
        videoBlob: null,
        currentVideoExt: 'webm',
        lastGradientPalette: [],
        watermarkImage: null,
        currentWatermarkType: 'none',
        isBottomSheetOpen: false,
        isLightboxOpen: false,
        currentLightboxImages: [],
        currentLightboxIndex: 0,
    };

    // --- DOM Element Cache ---
    const getEl = (id) => document.getElementById(id);
    const qs = (selector) => document.querySelector(selector);
    const qsa = (selector) => document.querySelectorAll(selector);

    const DOM = {
        uploadArea: getEl('upload-area'),
        fileInput: getEl('file-input'),
        errorMessage: getEl('error-message'),
        dismissError: getEl('dismiss-error'),
        previewContainer: getEl('preview-container'),
        previewImg: getEl('preview-img'),
        originalSizeText: getEl('original-size'),
        scaledSizeText: getEl('scaled-size'),
        sliceCountText: getEl('slice-count'),
        sliceResolutionText: getEl('slice-resolution'),
        highResToggle: getEl('high-res-toggle'),
        processBtn: getEl('process-btn'),
        resetBtn: getEl('reset-btn'),
        resultContainer: getEl('result-container'),
        slicesPreview: getEl('slices-preview'),
        downloadBtn: getEl('download-btn'),
        processAnotherBtn: getEl('process-another-btn'),
        loadingOverlay: getEl('loading-overlay'),
        loadingText: getEl('loading-text'),
        themeToggle: getEl('theme-toggle'),
        shortcutsBtn: getEl('shortcuts-btn'),
        shortcutsModal: getEl('shortcuts-modal'),
        shortcutsClose: getEl('shortcuts-close'),
        downloadBtnText: qs('#download-btn .btn-text'),
        downloadBtnLoader: qs('#download-btn .btn-loader'),
        
        // Background Controls
        fullViewSettings: getEl('full-view-settings'),
        bgTypeRadios: qsa('input[name="bg-type"]'),
        blurControls: getEl('blur-controls'),
        colorControls: getEl('color-controls'),
        blurIntensity: getEl('blur-intensity'),
        blurDownscale: getEl('blur-downscale'),
        bgColorPicker: getEl('bg-color-picker'),
        colorPalette: getEl('color-palette'),
        gradientControls: getEl('gradient-controls'),
        gradientType: getEl('gradient-type'),
        gradientStops: getEl('gradient-stops'),
        gradientBlend: getEl('gradient-blend'),
        gradientPreview: getEl('gradient-preview'),
        paletteFromImageBtn: getEl('palette-from-image'),

        // Video Controls
        videoFormatSelect: getEl('video-format'),
        videoEasingSelect: getEl('video-easing'),
        easingDescription: getEl('easing-description'),
        videoDurationInput: getEl('video-duration'),
        videoFpsInput: getEl('video-fps'),
        videoQualityInput: getEl('video-quality'),
        videoQualityLabel: getEl('video-quality-label'),
        generateVideoBtn: getEl('generate-video-btn'),
        downloadVideoBtn: getEl('download-video-btn'),
        panningVideo: getEl('panning-video'),
        videoResultCard: getEl('video-result-card'),
        uiFormatLabel: getEl('video-format-label'),
        generateVideoBtnText: qs('#generate-video-btn .btn-text'),
        generateVideoBtnLoader: qs('#generate-video-btn .btn-loader'),
        downloadVideoBtnText: qs('#download-video-btn .btn-text'),
        downloadVideoBtnLoader: qs('#download-video-btn .btn-loader'),
        
        // Enhanced UI Elements
        uploadPreview: getEl('upload-preview'),
        uploadPreviewImg: getEl('upload-preview-img'),
        progressContainer: getEl('progress-container'),
        progressBar: getEl('progress-bar'),
        progressText: getEl('progress-text'),
        successOverlay: getEl('success-overlay'),
        bottomSheet: getEl('bottom-sheet'),
        bottomSheetBackdrop: getEl('bottom-sheet-backdrop'),
        mobileFab: getEl('mobile-fab'),
        bottomSheetHandle: getEl('bottom-sheet-handle'),
        controls: getEl('controls'),
        videoSettings: getEl('video-settings'),
        mobileSlicingContent: getEl('mobile-slicing-content'),
        mobileBackgroundContent: getEl('mobile-background-content'),
        mobileVideoContent: getEl('mobile-video-content'),
        
        // Collapsible sections
        fullViewToggle: getEl('full-view-toggle'),
        fullViewContent: getEl('full-view-content'),
        videoToggle: getEl('video-toggle'),
        videoContent: getEl('video-content'),
        changeFileBtn: getEl('change-file-btn'),

        // Watermark Controls
        watermarkInput: getEl('watermark-input'),
        watermarkUploadBtn: getEl('watermark-upload-btn'),
        watermarkRemoveBtn: getEl('watermark-remove-btn'),
        watermarkFilename: getEl('watermark-filename'),
        watermarkPreview: getEl('watermark-preview'),
        watermarkPreviewImg: getEl('watermark-preview-img'),
        watermarkSettings: getEl('watermark-settings'),
        watermarkOpacity: getEl('watermark-opacity'),
        watermarkOpacityLabel: getEl('watermark-opacity-label'),
        watermarkSize: getEl('watermark-size'),
        watermarkSizeLabel: getEl('watermark-size-label'),
        watermarkPositionRadios: qsa('input[name="watermark-position"]'),
        textWatermarkPositionRadios: qsa('input[name="text-watermark-position"]'),
        textWatermarkOpacity: getEl('text-watermark-opacity'),
        textWatermarkOpacityLabel: getEl('text-watermark-opacity-label'),
        textWatermarkSize: getEl('text-watermark-size'),
        textWatermarkSizeLabel: getEl('text-watermark-size-label'),
        watermarkTypeRadios: qsa('input[name="watermark-type"]'),
        textWatermarkControls: getEl('text-watermark-controls'),
        imageWatermarkControls: getEl('image-watermark-controls'),
        watermarkText: getEl('watermark-text'),
        watermarkFontSize: getEl('watermark-font-size'),
        watermarkFontSizeLabel: getEl('watermark-font-size-label'),
        watermarkTextColor: getEl('watermark-text-color'),
        watermarkFontWeight: getEl('watermark-font-weight'),
        watermarkTextStroke: getEl('watermark-text-stroke'),

        // Lightbox
        lightbox: getEl('lightbox'),
        lightboxImage: getEl('lightbox-image'),
        lightboxTitle: getEl('lightbox-title'),
        lightboxResolution: getEl('lightbox-resolution'),
        lightboxDownload: getEl('lightbox-download'),
        lightboxPrev: getEl('lightbox-prev'),
        lightboxNext: getEl('lightbox-next'),
        lightboxClose: getEl('lightbox-close'),
    };


    // =========================================================================
    // UI Feedback and State Management Functions
    // =========================================================================

    const showLoading = (message, showProgress = false) => {
        DOM.loadingText.textContent = message;
        DOM.loadingOverlay.classList.add('active');
        if (showProgress) {
            DOM.progressContainer.classList.remove('hidden');
            DOM.progressText.classList.remove('hidden');
            updateProgress(0, 'Initializing...');
        } else {
            DOM.progressContainer.classList.add('hidden');
            DOM.progressText.classList.add('hidden');
        }
    };

    const hideLoading = () => {
        DOM.loadingOverlay.classList.remove('active');
        DOM.progressContainer.classList.add('hidden');
        DOM.progressText.classList.add('hidden');
    };

    const updateProgress = (percent, step) => {
        if (DOM.progressBar) DOM.progressBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
        if (DOM.progressText) DOM.progressText.textContent = step;
    };

    const showSuccess = (message = 'Complete!') => {
        qs('#success-overlay p').textContent = message;
        DOM.successOverlay.style.opacity = '1';
        DOM.successOverlay.style.pointerEvents = 'auto';
        if (navigator.vibrate) navigator.vibrate(60);
        setTimeout(() => {
            DOM.successOverlay.style.opacity = '0';
            DOM.successOverlay.style.pointerEvents = 'none';
        }, 500);
    };

    const showSuccessWithPulse = (message = 'Complete!') => {
        const messageEl = qs('#success-overlay p');
        messageEl.textContent = message;
        DOM.successOverlay.style.opacity = '1';
        DOM.successOverlay.style.pointerEvents = 'auto';
        DOM.successOverlay.classList.add('success-pulse');
        if (navigator.vibrate) navigator.vibrate(80);
        setTimeout(() => {
            DOM.successOverlay.classList.remove('success-pulse');
            DOM.successOverlay.style.opacity = '0';
            DOM.successOverlay.style.pointerEvents = 'none';
        }, 500);
    };

    const showButtonLoading = (button, text, loader) => {
        if (!button || !text || !loader) return;
        button.disabled = true;
        text.style.display = 'none';
        loader.style.display = 'inline-block';
    };

    const hideButtonLoading = (button, text, loader) => {
        if (!button || !text || !loader) return;
        button.disabled = false;
        text.style.display = 'flex';
        loader.style.display = 'none';
    };

    const showError = (message) => {
        const headline = DOM.errorMessage.querySelector('p, .font-semibold');
        if (headline) headline.textContent = message || 'Something went wrong';
        
        const suggestions = DOM.errorMessage.querySelector('#error-suggestions');
        if (suggestions) {
            suggestions.innerHTML = '';
            const tips = [];
            if (/clipboard/i.test(message || '')) {
                tips.push('Allow clipboard access in your browser settings.');
                tips.push('Try using the download button instead.');
            } else if (/video|record|MediaRecorder/i.test(message || '')) {
                tips.push('Try WebM format for widest support.');
                tips.push('Lower FPS or quality to reduce system load.');
            } else if (/image|load/i.test(message || '')) {
                tips.push('Ensure the image is a valid JPG, PNG, WebP, or AVIF.');
                tips.push('Try a smaller image or different file.');
            } else {
                tips.push('Refresh the page and try again.');
                tips.push('Check browser console for details (F12).');
            }
            tips.forEach(t => { const li = document.createElement('li'); li.textContent = t; suggestions.appendChild(li); });
        }
        
        DOM.errorMessage.style.display = 'block';
        DOM.errorMessage.scrollIntoView({ behavior: 'smooth' });
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    };

    const clearFieldError = (fieldElement) => {
        const container = fieldElement.closest('.field-container') || fieldElement.parentElement;
        const existingError = container.querySelector('.field-error');
        if (existingError) existingError.remove();
        fieldElement.classList.remove('input-error', 'shake-error');
        const errorIcon = container.querySelector('.error-icon');
        if (errorIcon) errorIcon.remove();
    };

    const showFieldError = (fieldElement, message, options = {}) => {
        clearFieldError(fieldElement);
        const container = fieldElement.closest('.field-container') || fieldElement.parentElement;
        fieldElement.classList.add('input-error');
        if (options.shake !== false) {
            fieldElement.classList.add('shake-error');
            setTimeout(() => fieldElement.classList.remove('shake-error'), 500);
        }
        const errorElement = document.createElement('span');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        if (options.showIcon !== false) {
            const iconElement = document.createElement('div');
            iconElement.className = 'error-icon';
            iconElement.innerHTML = `<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 14a1.25 1.25 0 100 2.5A1.25 1.25 0 0012 16zm-1-9h2v7h-2V7z"/></svg>`;
            container.style.position = 'relative';
            container.appendChild(iconElement);
        }
        container.appendChild(errorElement);
        if (options.autoClear !== false) setTimeout(() => clearFieldError(fieldElement), options.duration || 5000);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    };

    const showFieldSuccess = (fieldElement, options = {}) => {
        clearFieldError(fieldElement);
        fieldElement.classList.add('input-success');
        const container = fieldElement.closest('.field-container') || fieldElement.parentElement;
        if (container && !container.querySelector('.field-success')) {
            const successEl = document.createElement('span');
            successEl.className = 'field-success text-emerald-400 text-xs mt-1 block';
            successEl.textContent = options.message || 'Looks good';
            container.appendChild(successEl);
            setTimeout(() => successEl.remove(), options.duration || 2000);
        }
        if (options.temporary !== false) setTimeout(() => fieldElement.classList.remove('input-success'), 2000);
    };

    const resetApp = () => {
        DOM.fileInput.value = '';
        DOM.previewContainer.style.display = 'none';
        DOM.resultContainer.style.display = 'none';
        DOM.errorMessage.style.display = 'none';
        DOM.uploadArea.style.display = 'block';
        state.originalImage = null;
        state.slicedImages = [];
        state.fullViewImage = null;
        DOM.previewImg.src = '';
        DOM.colorPalette.innerHTML = '';
        state.lastGradientPalette = [];
        if (DOM.gradientPreview) DOM.gradientPreview.style.background = '';
        
        if (DOM.uploadPreview) {
            DOM.uploadPreview.classList.remove('show');
            DOM.uploadPreviewImg.src = '';
        }
        
        if (DOM.videoResultCard) DOM.videoResultCard.style.display = 'none';
        if (DOM.panningVideo) {
            if (DOM.panningVideo.src && DOM.panningVideo.src.startsWith('blob:')) {
                try { URL.revokeObjectURL(DOM.panningVideo.src); } catch (_) {}
            }
            DOM.panningVideo.removeAttribute('src');
            DOM.panningVideo.load();
        }
        state.videoBlob = null;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // =========================================================================
    // Validation Functions
    // =========================================================================

    const validateImageFile = (file) => {
        if (!file.type.startsWith('image/')) return { valid: false, message: 'Please select a valid image file (JPG, PNG, WebP, AVIF)' };
        if (file.size > 300 * 1024 * 1024) return { valid: false, message: 'Image file size must be less than 300MB' };
        return { valid: true };
    };

    const validateWatermarkFile = (file) => {
        const type = (file && file.type) ? file.type.toLowerCase() : '';
        const name = (file && file.name) ? file.name.toLowerCase() : '';
        if (!type.includes('png') && !name.endsWith('.png')) return { valid: false, message: 'Watermark must be a PNG file' };
        if (file.size > 50 * 1024 * 1024) return { valid: false, message: 'Watermark file size must be less than 50MB' };
        return { valid: true };
    };

    const validateImageDimensions = (img) => {
        if (!img || !img.width || !img.height) return { valid: false, message: 'Image dimensions could not be determined' };
        const aspectRatio = img.width / img.height;
        if (aspectRatio <= 1) return { valid: false, message: 'Panorama image must be wider than it is tall' };
        if (img.width < 1000) return { valid: false, message: 'Image width must be at least 1000 pixels' };
        if (aspectRatio > 10) return { valid: false, message: 'Image aspect ratio too extreme (max 10:1)' };
        return { valid: true };
    };

    // =========================================================================
    // Core Logic Functions
    // =========================================================================

    const handleFile = (file) => {
        const fileValidation = validateImageFile(file);
        if (!fileValidation.valid) {
            showFieldError(DOM.fileInput, fileValidation.message);
            return;
        }
        
        showFieldSuccess(DOM.fileInput);
        showLoading('Loading image...', true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                updateProgress(30, 'Validating dimensions...');
                const dimensionValidation = validateImageDimensions(img);
                if (!dimensionValidation.valid) {
                    showFieldError(DOM.fileInput, dimensionValidation.message);
                    hideLoading();
                    return;
                }
                updateProgress(60, 'Preparing preview...');
                state.originalImage = { element: img, width: img.width, height: img.height, src: e.target.result, name: file.name };
                updateImageDetails();
                DOM.previewImg.src = e.target.result;
                const nameEl = getEl('selected-filename-preview');
                if (nameEl) nameEl.textContent = file.name || 'Selected image';
                
                if (window.requestIdleCallback) requestIdleCallback(() => populateColorPalette(img));
                else setTimeout(() => populateColorPalette(img), 0);
                
                DOM.errorMessage.style.display = 'none';
                DOM.uploadArea.style.display = 'none';
                DOM.previewContainer.style.display = 'block';
                DOM.resultContainer.style.display = 'none';
                if (DOM.videoResultCard) DOM.videoResultCard.style.display = 'none';
                state.videoBlob = null;
                updateProgress(100, 'Ready');
                setTimeout(() => hideLoading(), 300);
                updateQualityLabel();
            };
            img.onerror = () => { showError('Could not load the image.'); hideLoading(); };
            img.src = e.target.result;
        };
        reader.onerror = () => { showError('Error reading the file.'); hideLoading(); };
        reader.readAsDataURL(file);
    };

    const updateImageDetails = () => {
        if (!state.originalImage) return;
        const { scaledWidth, scaledHeight, sliceCount, sliceWidth, sliceHeight } = calculateOptimalScaling(state.originalImage.width, state.originalImage.height);
        DOM.originalSizeText.textContent = `${state.originalImage.width}px × ${state.originalImage.height}px`;
        DOM.scaledSizeText.textContent = `${scaledWidth}px × ${scaledHeight}px (Full Resolution)`;
        DOM.sliceCountText.textContent = sliceCount;
        DOM.sliceResolutionText.textContent = `${sliceWidth}px × ${sliceHeight}px`;
    };

    const calculateOptimalScaling = (originalWidth, originalHeight) => {
        // Always use original image height for maximum resolution
        // This ensures we maintain the highest possible quality for all slices
        const sliceHeight = originalHeight;
        
        // Calculate ideal slice width based on aspect ratio
        const idealSliceWidth = Math.round(sliceHeight * ASPECT_RATIO);
        
        // Calculate how many full slices we can fit
        const fullSlices = Math.floor(originalWidth / idealSliceWidth);
        const remainingWidth = originalWidth - (fullSlices * idealSliceWidth);
        
        // Determine optimal slice count
        let finalSliceCount;
        if (fullSlices < MIN_SLICES) {
            // If we can't fit minimum slices, use minimum and adjust slice width
            finalSliceCount = MIN_SLICES;
        } else if (remainingWidth > (idealSliceWidth * 0.3) && fullSlices < 10) {
            // If remaining width is significant (>30% of slice width), add one more slice
            finalSliceCount = fullSlices + 1;
        } else {
            // Use the number of full slices we can fit, capped at 10
            finalSliceCount = Math.min(fullSlices, 10);
        }
        
        // Calculate actual slice width to evenly distribute the image
        // This ensures each slice gets an equal portion of the original image
        const actualSliceWidth = Math.round(originalWidth / finalSliceCount);
        
        // Calculate final dimensions
        // We maintain the original image dimensions for maximum quality
        const finalScaledWidth = originalWidth; // Use full original width
        const finalScaledHeight = sliceHeight; // Always use original height
        
        return { 
            scaledWidth: finalScaledWidth, 
            scaledHeight: finalScaledHeight, 
            sliceCount: finalSliceCount, 
            sliceWidth: actualSliceWidth, 
            sliceHeight: finalScaledHeight 
        };
    };

    const processImageWithProgress = async () => {
        if (!state.originalImage) return;
        
        updateProgress(5, 'Analyzing image dimensions...');
        await new Promise(r => setTimeout(r, 150));
        
        updateProgress(12, 'Calculating optimal slice parameters...');
        await new Promise(r => setTimeout(r, 100));
        
        const { scaledWidth, scaledHeight, sliceCount, sliceWidth, sliceHeight } = calculateOptimalScaling(state.originalImage.width, state.originalImage.height);
        
        updateProgress(25, 'Preparing rendering canvas...');
        // Use original image dimensions for maximum quality
        // This ensures we maintain the highest possible resolution throughout the process
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = state.originalImage.width;
        canvas.height = state.originalImage.height;
        
        updateProgress(30, 'Rendering base image...');
        // Draw original image at full resolution
        // No downscaling - we work with the original image at its native resolution
        ctx.drawImage(state.originalImage.element, 0, 0, state.originalImage.width, state.originalImage.height);
        
        state.slicedImages = [];
        const wmSettingsSlices = collectWatermarkSettings();
        
        for (let i = 0; i < sliceCount; i++) {
            const sliceCanvas = document.createElement('canvas');
            const sliceCtx = sliceCanvas.getContext('2d');
            sliceCanvas.width = sliceWidth;
            sliceCanvas.height = sliceHeight;
            
            const baseProgress = 35 + (i / sliceCount) * 30;
            updateProgress(baseProgress, `Rendering slice ${i + 1} of ${sliceCount}...`);
            
            // Calculate source coordinates for this slice
            // This ensures we extract the correct portion from the original image
            const sourceX = i * sliceWidth;
            const sourceY = 0;
            const sourceWidth = Math.min(sliceWidth, state.originalImage.width - sourceX);
            const sourceHeight = state.originalImage.height;
            
            // Draw the slice from the original image at full resolution
            // This preserves the original image quality in each slice
            sliceCtx.drawImage(
                canvas, 
                sourceX, sourceY, sourceWidth, sourceHeight, 
                0, 0, sliceWidth, sliceHeight
            );
            
            if (wmSettingsSlices.type !== 'none') {
                updateProgress(baseProgress + 2, `Adding watermark to slice ${i + 1}...`);
                applyWatermark(sliceCanvas, sliceCtx, wmSettingsSlices);
            }
            
            updateProgress(baseProgress + 5, `Converting slice ${i + 1} to PNG...`);
            state.slicedImages.push({ 
                dataURL: sliceCanvas.toDataURL(EXPORT_TYPE), 
                number: i + 1, 
                width: sliceWidth, 
                height: sliceHeight 
            });
            if (i % 3 === 0) await new Promise(r => setTimeout(r, 30));
        }
        
        updateProgress(75, 'Preparing full view...');
        await Promise.resolve(createFullViewImage(sliceWidth, sliceHeight));
        
        updateProgress(100, 'Completing processing...');
        await new Promise(r => setTimeout(r, 200));
        
        hideLoading();
        showSuccessWithPulse('Slices generated successfully!');
        displayResults();
    };

    const updateFullViewPreview = () => {
        if (!state.originalImage) return;
        const { sliceWidth, sliceHeight } = calculateOptimalScaling(state.originalImage.width, state.originalImage.height);
        createFullViewImage(sliceWidth, sliceHeight);
        const fullViewElement = qs('.full-view-item img');
        if (fullViewElement) fullViewElement.src = state.fullViewImage.dataURL;
    };

    const createFullViewImage = (sliceWidth, sliceHeight) => {
        if (!state.originalImage) return;
        const fullCanvas = document.createElement('canvas');
        const fullCtx = fullCanvas.getContext('2d');
        fullCanvas.width = sliceWidth;
        fullCanvas.height = sliceHeight;

        const selectedBgType = qs('input[name="bg-type"]:checked')?.value || 'blur';
        if (selectedBgType === 'blur') {
            const radius = parseInt(DOM.blurIntensity?.value || '10', 10);
            const downscalePct = Math.max(10, Math.min(100, parseInt(DOM.blurDownscale?.value || '35', 10)));
            const scale = downscalePct / 100;
            const smallW = Math.max(8, Math.round(sliceWidth * scale));
            const smallH = Math.max(8, Math.round(sliceHeight * scale));
            const tmp = document.createElement('canvas');
            tmp.width = smallW; tmp.height = smallH;
            const tctx = tmp.getContext('2d');
            tctx.drawImage(state.originalImage.element, 0, 0, smallW, smallH);
            stackBlurCanvasRGBA(tmp, 0, 0, smallW, smallH, Math.max(0, radius));
            fullCtx.imageSmoothingEnabled = true;
            fullCtx.imageSmoothingQuality = 'high';
            fullCtx.drawImage(tmp, 0, 0, sliceWidth, sliceHeight);
        } else if (selectedBgType === 'gradient') {
            const stops = Math.max(3, Math.min(5, parseInt(DOM.gradientStops?.value || '4', 10)));
            const colors = state.lastGradientPalette.length ? state.lastGradientPalette : extractPaletteKMeans(state.originalImage.element, stops);
            renderGradientBackground(fullCtx, sliceWidth, sliceHeight, colors, DOM.gradientType?.value || 'radial', DOM.gradientBlend?.value || 'normal');
        } else {
            fullCtx.fillStyle = DOM.bgColorPicker.value;
            fullCtx.fillRect(0, 0, sliceWidth, sliceHeight);
        }

        const margin = Math.round(sliceWidth * 0.08);
        const availableWidth = sliceWidth - (margin * 2);
        const availableHeight = sliceHeight - (margin * 2);
        const originalAspectRatio = state.originalImage.width / state.originalImage.height;
        let scaledPanoWidth, scaledPanoHeight;
        if ((availableWidth / availableHeight) < originalAspectRatio) {
            scaledPanoWidth = availableWidth;
            scaledPanoHeight = scaledPanoWidth / originalAspectRatio;
        } else {
            scaledPanoHeight = availableHeight;
            scaledPanoWidth = scaledPanoHeight * originalAspectRatio;
        }
        const x = Math.round((sliceWidth - scaledPanoWidth) / 2);
        const y = Math.round((sliceHeight - scaledPanoHeight) / 2);
        
        fullCtx.save();
        fullCtx.globalCompositeOperation = 'source-over';
        fullCtx.drawImage(state.originalImage.element, x, y, scaledPanoWidth, scaledPanoHeight);
        fullCtx.restore();
        
        const wmSettingsFull = collectWatermarkSettings();
        applyWatermark(fullCanvas, fullCtx, wmSettingsFull);
        
        state.fullViewImage = { dataURL: fullCanvas.toDataURL(EXPORT_TYPE), width: sliceWidth, height: sliceHeight };
    };

    // -------------------------------------------------------------------------
    // Blur helper: use Canvas2D filter if available, else simple multi-pass downscale
    // -------------------------------------------------------------------------
    function stackBlurCanvasRGBA(canvas, top_x, top_y, width, height, radius) {
        try {
            const ctx = canvas.getContext('2d');
            if ('filter' in ctx && radius > 0) {
                const img = ctx.getImageData(top_x, top_y, width, height);
                const off = document.createElement('canvas');
                off.width = width; off.height = height;
                const octx = off.getContext('2d');
                octx.putImageData(img, 0, 0);
                ctx.clearRect(top_x, top_y, width, height);
                ctx.filter = `blur(${Math.max(0.5, radius)}px)`;
                ctx.drawImage(off, top_x, top_y);
                ctx.filter = 'none';
                return;
            }
        } catch (_) {}
        // Fallback: repeated downscale/upsample approximation
        try {
            const ctx = canvas.getContext('2d');
            let w = width, h = height;
            let off = document.createElement('canvas');
            off.width = w; off.height = h;
            off.getContext('2d').drawImage(canvas, top_x, top_y, width, height, 0, 0, w, h);
            const passes = Math.max(1, Math.min(4, Math.round(radius / 10)));
            for (let i = 0; i < passes; i++) {
                w = Math.max(1, Math.round(w * 0.5));
                h = Math.max(1, Math.round(h * 0.5));
                const tmp = document.createElement('canvas');
                tmp.width = w; tmp.height = h;
                tmp.getContext('2d').drawImage(off, 0, 0, w, h);
                off = tmp;
            }
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(off, top_x, top_y, width, height);
        } catch (_) {}
    }

    const displayResults = () => {
        DOM.slicesPreview.innerHTML = '';
        if (state.fullViewImage) DOM.slicesPreview.appendChild(createSliceElement(state.fullViewImage, true));
        state.slicedImages.forEach(slice => DOM.slicesPreview.appendChild(createSliceElement(slice, false)));
        
        setupSwipeNavigation();
        
        DOM.resultContainer.style.display = 'block';
        window.scrollTo({ top: DOM.resultContainer.offsetTop - 20, behavior: 'smooth' });
    };

    const downloadZip = async () => {
        if (state.slicedImages.length === 0 && !state.fullViewImage) return;
        const zip = new JSZip();
        const baseName = state.originalImage.name.split('.').slice(0, -1).join('.') || 'pano-images';
        const folder = zip.folder(baseName);
        if (state.fullViewImage) folder.file(`${baseName}_full_view.png`, state.fullViewImage.dataURL.split(',')[1], { base64: true });
        state.slicedImages.forEach(slice => folder.file(`${baseName}_${String(slice.number).padStart(2, '0')}.png`, slice.dataURL.split(',')[1], { base64: true }));
        if (state.videoBlob) {
            const ext = state.currentVideoExt || (state.videoBlob.type && state.videoBlob.type.indexOf('mp4') !== -1 ? 'mp4' : 'webm');
            folder.file(`${baseName}_panning.${ext}`, state.videoBlob);
        }
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `${baseName}.zip`);
    };

    // =========================================================================
    // Feature-Specific Functions (Video, Watermark, Lightbox, etc.)
    // =========================================================================

    // Upload preview thumbnail (shown in the upload card)
    const showUploadPreview = (file) => {
        if (!DOM.uploadPreview || !DOM.uploadPreviewImg || !file) return;
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                DOM.uploadPreviewImg.src = e.target.result;
                DOM.uploadPreview.classList.add('show');
            };
            reader.readAsDataURL(file);
        } catch (_) {}
    };

    // Palette extraction (simple k-means on a downsized copy for performance)
    const extractPaletteKMeans = (img, k = 4) => {
        try {
            const sampleSize = 100;
            const scale = Math.min(sampleSize / img.width, sampleSize / img.height, 1);
            const w = Math.max(1, Math.round(img.width * scale));
            const h = Math.max(1, Math.round(img.height * scale));
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            const cx = c.getContext('2d');
            cx.drawImage(img, 0, 0, w, h);
            const data = cx.getImageData(0, 0, w, h).data;
            const pts = [];
            for (let i = 0; i < data.length; i += 16) { // sample every 4th pixel
                pts.push([data[i], data[i+1], data[i+2]]);
            }
            if (pts.length === 0) return ['#667eea', '#764ba2', '#f0abfc', '#60a5fa'];
            k = Math.max(2, Math.min(6, k|0));
            let centroids = pts.slice(0, k);
            for (let iter = 0; iter < 8; iter++) {
                const clusters = Array.from({ length: k }, () => []);
                for (const p of pts) {
                    let best = 0, bestD = Infinity;
                    for (let i = 0; i < k; i++) {
                        const c = centroids[i];
                        const d = (p[0]-c[0])**2 + (p[1]-c[1])**2 + (p[2]-c[2])**2;
                        if (d < bestD) { bestD = d; best = i; }
                    }
                    clusters[best].push(p);
                }
                centroids = clusters.map((cl, i) => {
                    if (!cl.length) return centroids[i];
                    const s = cl.reduce((a,p)=>[a[0]+p[0],a[1]+p[1],a[2]+p[2]],[0,0,0]);
                    return [Math.round(s[0]/cl.length), Math.round(s[1]/cl.length), Math.round(s[2]/cl.length)];
                });
            }
            return centroids.map(([r,g,b]) => `rgb(${r}, ${g}, ${b})`);
        } catch (_) {
            return ['#667eea', '#764ba2', '#f0abfc', '#60a5fa'];
        }
    };

    const populateColorPalette = (img) => {
        if (!DOM.colorPalette) return;
        const colors = extractPaletteKMeans(img, 6);
        state.lastGradientPalette = colors;
        DOM.colorPalette.innerHTML = '';
        colors.forEach(color => {
            const swatch = document.createElement('button');
            swatch.className = 'color-swatch';
            swatch.type = 'button';
            swatch.style.background = color;
            swatch.addEventListener('click', () => {
                if (DOM.bgColorPicker) DOM.bgColorPicker.value = rgbToHex(color);
                if (DOM.gradientPreview) DOM.gradientPreview.style.background = `linear-gradient(135deg, ${colors.join(', ')})`;
                qsa('.color-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                if (state.originalImage) updateFullViewPreview();
            });
            DOM.colorPalette.appendChild(swatch);
        });
        if (DOM.gradientPreview) DOM.gradientPreview.style.background = `linear-gradient(135deg, ${colors.join(', ')})`;
    };
    // Build a preview card for a slice/full-view image
    const createSliceElement = (slice, isFullView = false) => {
        const div = document.createElement('div');
        div.className = 'slice-item' + (isFullView ? ' full-view-item' : '');

        const img = document.createElement('img');
        img.src = slice.dataURL;
        img.alt = isFullView ? 'Full view' : `Slice ${slice.number}`;
        img.loading = 'lazy';
        div.appendChild(img);

        // Copy-to-clipboard button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-button';
        copyBtn.setAttribute('aria-label', 'Copy to clipboard');
        copyBtn.innerHTML = '<svg data-lucide="copy" class="w-4 h-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>';
        copyBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            try {
                const response = await fetch(slice.dataURL);
                const blob = await response.blob();
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                copyBtn.classList.add('copied');
                copyBtn.innerHTML = '<svg data-lucide="check" class="w-4 h-4"><polyline points="20,6 9,17 4,12"></polyline></svg>';
                setTimeout(() => { copyBtn.classList.remove('copied'); copyBtn.innerHTML = '<svg data-lucide="copy" class="w-4 h-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>'; }, 1800);
            } catch (err) {
                console.error('Failed to copy:', err);
                copyBtn.classList.add('copying');
                copyBtn.innerHTML = '<svg data-lucide="x" class="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                setTimeout(() => { copyBtn.classList.remove('copying'); copyBtn.innerHTML = '<svg data-lucide="copy" class="w-4 h-4"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>'; }, 1500);
            }
        });
        div.appendChild(copyBtn);

        if (isFullView) {
            const label = document.createElement('div');
            label.className = 'slice-label';
            label.textContent = 'Full View';
            div.appendChild(label);
        } else {
            const number = document.createElement('div');
            number.className = 'slice-number';
            number.textContent = slice.number;
            div.appendChild(number);
        }

        const resolution = document.createElement('div');
        resolution.className = 'resolution';
        resolution.textContent = `${slice.width}x${slice.height}`;
        div.appendChild(resolution);

        div.addEventListener('click', () => {
            // Build title
            const title = isFullView ? 'Full View' : `Slice ${slice.number}`;
            openLightbox(slice, title);
        });

        return div;
    };

    // Minimal lightbox helpers
    const openLightbox = (slice, title) => {
        const items = [];
        if (state.fullViewImage) items.push({ dataURL: state.fullViewImage.dataURL, width: state.fullViewImage.width, height: state.fullViewImage.height, title: 'Full View' });
        state.slicedImages.forEach(s => items.push({ dataURL: s.dataURL, width: s.width, height: s.height, title: `Slice ${s.number}` }));
        state.currentLightboxImages = items;
        state.currentLightboxIndex = Math.max(0, items.findIndex(i => i.dataURL === slice.dataURL));
        if (DOM.lightbox) { DOM.lightbox.classList.add('open'); DOM.lightbox.style.display = 'flex'; }
        if (DOM.lightboxDownload) DOM.lightboxDownload.setAttribute('download', `${(title || 'image').toLowerCase().replace(/\s+/g, '_')}.png`);
        updateLightbox();
    };

    const updateLightbox = () => {
        if (!state.currentLightboxImages.length) return;
        const current = state.currentLightboxImages[state.currentLightboxIndex];
        if (DOM.lightboxImage) DOM.lightboxImage.src = current.dataURL;
        if (DOM.lightboxTitle) DOM.lightboxTitle.textContent = current.title || `Image ${state.currentLightboxIndex + 1}`;
        if (DOM.lightboxResolution) DOM.lightboxResolution.textContent = `${current.width} x ${current.height}`;
        if (DOM.lightboxDownload) DOM.lightboxDownload.href = current.dataURL;
    };

    const nextLightboxImage = () => { if (state.currentLightboxIndex < state.currentLightboxImages.length - 1) { state.currentLightboxIndex++; updateLightbox(); } };
    const prevLightboxImage = () => { if (state.currentLightboxIndex > 0) { state.currentLightboxIndex--; updateLightbox(); } };
    const closeLightbox = () => { if (DOM.lightbox) { DOM.lightbox.classList.remove('open'); DOM.lightbox.style.display = 'none'; } };

    const setupSwipeNavigation = () => {
        const preview = DOM.slicesPreview;
        if (!preview || window.innerWidth >= 768) return;
        
        preview.style.position = 'relative';
        preview.style.display = 'flex';
        preview.style.flexWrap = 'nowrap';
        preview.style.overflowX = 'auto';
        preview.style.scrollSnapType = 'x mandatory';
        preview.querySelectorAll('.slice-item').forEach(el => {
            el.style.flex = '0 0 auto';
            el.style.scrollSnapAlign = 'start';
        });
        
        const indicator = document.createElement('div');
        indicator.className = 'swipe-indicator';
        indicator.innerHTML = `<svg data-lucide="hand" class="w-4 h-4"><path d="M8 13V7a2 2 0 1 1 4 0v6"/><path d="M12 13V5a2 2 0 1 1 4 0v8"/><path d="M16 13v-3a2 2 0 1 1 4 0v5a7 7 0 0 1-7 7h-1a7 7 0 0 1-7-7v-3"/></svg><span>Swipe to browse</span>`;
        preview.appendChild(indicator);
        lucide.createIcons();

        if (preview.scrollWidth > preview.clientWidth) {
            setTimeout(() => { if (indicator) indicator.style.opacity = '0'; }, 3000);
        } else {
            indicator.style.display = 'none';
        }
    };
    
    // =========================================================================
    // Watermark Helpers
    // =========================================================================

    const collectWatermarkSettings = () => {
        const watermarkType = qs('input[name="watermark-type"]:checked')?.value || 'none';
        if (watermarkType === 'image') {
            const opacity = parseInt(DOM.watermarkOpacity?.value || '70', 10) / 100;
            const size = parseInt(DOM.watermarkSize?.value || '15', 10) / 100; // relative to min(canvas w,h)
            const position = qs('input[name="watermark-position"]:checked')?.value || 'bottom-right';
            return { type: 'image', image: state.watermarkImage, opacity, size, position };
        }
        if (watermarkType === 'text') {
            const text = (DOM.watermarkText?.value || '').trim();
            if (!text) return { type: 'none' };
            const opacity = parseInt(DOM.textWatermarkOpacity?.value || '70', 10) / 100;
            const sizePct = parseInt(DOM.textWatermarkSize?.value || '15', 10) / 100; // 0..1 scale of min dimension
            const position = qs('input[name="text-watermark-position"]:checked')?.value || 'bottom-right';
            const fontSize = parseInt(DOM.watermarkFontSize?.value || '24', 10);
            const textColor = DOM.watermarkTextColor?.value || '#FFFFFF';
            const fontWeight = DOM.watermarkFontWeight?.value || 'bold';
            const textStroke = DOM.watermarkTextStroke?.value || 'thin';
            return { type: 'text', text, opacity, sizePct, position, fontSize, textColor, fontWeight, textStroke };
        }
        return { type: 'none' };
    };

    const calculateWatermarkPosition = (position, canvasWidth, canvasHeight, wmWidth, wmHeight, margin) => {
        switch (position) {
            case 'top-left': return { x: margin, y: margin };
            case 'top-center': return { x: canvasWidth / 2, y: margin };
            case 'top-right': return { x: canvasWidth - margin, y: margin };
            case 'center-left': return { x: margin, y: canvasHeight / 2 };
            case 'center': return { x: canvasWidth / 2, y: canvasHeight / 2 };
            case 'center-right': return { x: canvasWidth - margin, y: canvasHeight / 2 };
            case 'bottom-left': return { x: margin, y: canvasHeight - margin };
            case 'bottom-center': return { x: canvasWidth / 2, y: canvasHeight - margin };
            case 'bottom-right':
            default: return { x: canvasWidth - margin, y: canvasHeight - margin };
        }
    };

    const applyWatermark = (canvas, ctx, settings) => {
        if (!settings || settings.type === 'none') return;
        const { width, height } = canvas;
        const margin = Math.round(Math.min(width, height) * 0.05);
        if (settings.type === 'image' && settings.image) {
            const wmSize = Math.min(width, height) * settings.size;
            const aspect = settings.image.width / settings.image.height;
            const wmWidth = aspect >= 1 ? wmSize : wmSize * aspect;
            const wmHeight = aspect >= 1 ? wmSize / aspect : wmSize;
            const { x, y } = calculateWatermarkPosition(settings.position, width, height, wmWidth, wmHeight, margin);
            ctx.save();
            ctx.globalAlpha = settings.opacity;
            ctx.drawImage(settings.image, x - (settings.position.includes('center') ? wmWidth/2 : 0), y - (settings.position.includes('center') ? wmHeight/2 : 0), wmWidth, wmHeight);
            ctx.restore();
            return;
        }
        if (settings.type === 'text' && settings.text) {
            const base = Math.min(width, height);
            const px = Math.max(8, Math.round(base * settings.sizePct));
            const { x, y } = calculateWatermarkPosition(settings.position, width, height, 0, 0, margin);
            ctx.save();
            ctx.globalAlpha = settings.opacity;
            ctx.font = `${settings.fontWeight} ${px}px sans-serif`;
            ctx.fillStyle = settings.textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (settings.textStroke !== 'none') {
                ctx.lineWidth = settings.textStroke === 'thick' ? 3 : 1;
                ctx.strokeStyle = '#000';
                ctx.strokeText(settings.text, x, y);
            }
            ctx.fillText(settings.text, x, y);
            ctx.restore();
        }
    };

    // ... (All other feature-specific functions like video generation, watermark, etc.)
    // Video generation (MediaRecorder + canvas)

    const getVideoMimeType = (format) => {
        if ((format || 'webm').toLowerCase() === 'mp4') {
            if (MediaRecorder?.isTypeSupported && MediaRecorder.isTypeSupported('video/mp4')) return 'video/mp4';
        }
        if (MediaRecorder?.isTypeSupported) {
            if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) return 'video/webm;codecs=vp9';
            if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) return 'video/webm;codecs=vp8';
        }
        return 'video/webm';
    };

    const applyEasing = (t, easing) => {
        switch (easing) {
            case 'ease': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            case 'ease-in': return t * t;
            case 'ease-out': return t * (2 - t);
            case 'ease-in-out': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            case 'smooth': return t * t * (3 - 2 * t);
            case 'bounce':
                if (t < 1 / 2.75) return 7.5625 * t * t;
                if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
                if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
                return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
            default: return t;
        }
    };

    const createPanningVideo = async () => {
        if (!state.originalImage) throw new Error('No image loaded');
        const format = DOM.videoFormatSelect?.value || 'webm';
        const easing = DOM.videoEasingSelect?.value || 'linear';
        const duration = parseInt(DOM.videoDurationInput?.value || '10', 10);
        const fps = parseInt(DOM.videoFpsInput?.value || '30', 10);
        const quality = parseInt(DOM.videoQualityInput?.value || '80', 10);

        const { width, height } = computeVideoViewport();
        const mimeType = getVideoMimeType(format);
        const videoBitsPerSecond = Math.max(1, quality) * 1000000;

        if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
            throw new Error('MediaRecorder/canvas captureStream not supported');
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = width; canvas.height = height;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const stream = canvas.captureStream(fps);
        const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond });
        const chunks = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);

        const track = stream.getVideoTracks()[0];

        // Pre-render background layer
        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = width; bgCanvas.height = height;
        const bgCtx = bgCanvas.getContext('2d');
        bgCtx.imageSmoothingEnabled = true;
        bgCtx.imageSmoothingQuality = 'high';
        const bgType = qs('input[name="bg-type"]:checked')?.value || 'blur';
        if (bgType === 'gradient') {
            const colors = state.lastGradientPalette.length ? state.lastGradientPalette : extractPaletteKMeans(state.originalImage.element, 4);
            renderGradientBackground(bgCtx, width, height, colors, DOM.gradientType?.value || 'radial', DOM.gradientBlend?.value || 'normal');
        } else if (bgType === 'color') {
            bgCtx.fillStyle = DOM.bgColorPicker?.value || '#111827';
            bgCtx.fillRect(0, 0, width, height);
        } else {
            bgCtx.fillStyle = '#111827';
            bgCtx.fillRect(0, 0, width, height);
        }

        // Pre-render watermark layer
        const wmCanvas = document.createElement('canvas');
        wmCanvas.width = width; wmCanvas.height = height;
        const wmCtx = wmCanvas.getContext('2d');
        wmCtx.imageSmoothingEnabled = true;
        wmCtx.imageSmoothingQuality = 'high';
        const wmSettings = collectWatermarkSettings();
        applyWatermark(wmCanvas, wmCtx, wmSettings);
        const hasWatermark = wmSettings && wmSettings.type !== 'none';

        const startTime = performance.now();
        const totalDuration = duration * 1000;
        const frameInterval = 1000 / fps;

        return new Promise((resolve, reject) => {
            recorder.onstop = async () => {
                let blob = new Blob(chunks, { type: mimeType });
                // Optional: transcode WebM -> MP4 if requested and supported via ffmpeg.wasm
                const requestedMp4 = (format || 'webm').toLowerCase() === 'mp4';
                if (requestedMp4 && !mimeType.startsWith('video/mp4')) {
                    try {
                        const mp4Blob = await transcodeWebMToMp4(blob);
                        if (mp4Blob) { blob = mp4Blob; }
                    } catch (e) {
                        console.warn('MP4 transcode failed, keeping WebM:', e);
                    }
                }
                state.videoBlob = blob;
                state.currentVideoExt = (requestedMp4 && blob.type.indexOf('mp4') !== -1) ? 'mp4' : (format || 'webm');
                if (DOM.panningVideo) { DOM.panningVideo.src = URL.createObjectURL(blob); DOM.panningVideo.load(); }
                if (DOM.videoResultCard) DOM.videoResultCard.style.display = 'block';
                resolve(blob);
            };
            recorder.onerror = reject;
            recorder.start();

            const intervalId = setInterval(() => {
                const elapsed = performance.now() - startTime;
                const progress = Math.min(elapsed / totalDuration, 1);
                const eased = applyEasing(progress, easing);

                ctx.drawImage(bgCanvas, 0, 0);
                const panProgress = eased < 0.5 ? eased * 2 : 1 - (eased - 0.5) * 2;
                const maxPanX = Math.max(0, state.originalImage.width - width);
                const panX = panProgress * maxPanX;
                ctx.drawImage(state.originalImage.element, panX, 0, width, state.originalImage.height, 0, 0, width, height);
                if (hasWatermark) ctx.drawImage(wmCanvas, 0, 0);

                track?.requestFrame();

                if (progress >= 1) {
                    clearInterval(intervalId);
                    setTimeout(() => { try { recorder.stop(); } catch(_){} }, 0);
                }
            }, frameInterval);
        });
    };

    // Best-effort in-browser WebM -> MP4 using ffmpeg.wasm (loaded lazily)
    async function transcodeWebMToMp4(webmBlob) {
        try {
            // Load ffmpeg if not already
            if (!window.FFmpeg) {
                await new Promise((res, rej) => {
                    const s = document.createElement('script');
                    s.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/ffmpeg.min.js';
                    s.onload = res; s.onerror = () => rej(new Error('Failed to load ffmpeg'));
                    document.head.appendChild(s);
                });
            }
            const { createFFmpeg, fetchFile } = window.FFmpeg;
            const ffmpeg = createFFmpeg({ log: false });
            if (!ffmpeg.isLoaded()) await ffmpeg.load();
            const inputName = 'input.webm';
            const outputName = 'output.mp4';
            ffmpeg.FS('writeFile', inputName, await fetchFile(webmBlob));
            await ffmpeg.run('-i', inputName, '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', outputName);
            const data = ffmpeg.FS('readFile', outputName);
            return new Blob([data.buffer], { type: 'video/mp4' });
        } catch (e) {
            console.warn('ffmpeg transcode error', e);
            return null;
        }
    }

    // Note: The following functions are direct copies from the original script,
    // adapted to use the state and DOM objects where appropriate.

    const updateQualityLabel = () => {
        if (!DOM.videoQualityLabel || !DOM.videoQualityInput) return;
        const q = Math.max(10, Math.min(100, parseInt(DOM.videoQualityInput.value || '80', 10)));
        const dims = computeVideoViewport();
        const approxMbps = computeApproxBitrateMbps(q, parseInt(DOM.videoFpsInput?.value || '30', 10), dims.width, dims.height);
        DOM.videoQualityLabel.textContent = `≈ ${approxMbps.toFixed(1)} Mbps`;
        if (DOM.uiFormatLabel) {
            const fmt = (DOM.videoFormatSelect?.value || 'webm').toLowerCase();
            DOM.uiFormatLabel.textContent = fmt === 'mp4' ? 'MP4' : 'WebM';
        }
    };

    const updateEasingDescription = () => {
        if (!DOM.easingDescription || !DOM.videoEasingSelect) return;
        const easing = DOM.videoEasingSelect.value;
        const descriptions = {
            'linear': 'Constant speed throughout',
            'ease': 'Slow start, fast middle, slow end',
            'ease-in': 'Slow start, gradually accelerates',
            'ease-out': 'Fast start, gradually decelerates',
            'ease-in-out': 'Slow start and end, fast middle',
            'smooth': 'Very smooth acceleration and deceleration',
            'bounce': 'Elastic bounce effect at direction changes'
        };
        DOM.easingDescription.textContent = descriptions[easing] || descriptions['linear'];
    };

    const computeVideoViewport = () => {
        if (!state.originalImage) return { width: Math.round(STANDARD_HEIGHT * ASPECT_RATIO), height: STANDARD_HEIGHT };
        
        // Always use original image height for maximum resolution
        // This ensures videos maintain the highest possible quality
        const height = state.originalImage.height;
        let width = Math.round(height * ASPECT_RATIO);
        
        // If calculated width exceeds original image width, adjust proportionally
        // We maintain the original height to preserve maximum resolution
        if (width > state.originalImage.width) {
            width = state.originalImage.width;
            // Don't adjust height - keep original for maximum resolution
        }
        
        return { width, height };
    };

    const computeApproxBitrateMbps = (quality, fps, width, height) => {
        const minMbps = 1.0, maxMbps = 12.0;
        const base = minMbps + ((Math.max(10, Math.min(100, quality)) - 10) / 90) * (maxMbps - minMbps);
        const baselinePixelsPerSec = 1080 * 1350 * 30;
        const pixelsPerSec = Math.max(1, width * height * Math.max(10, Math.min(60, fps)));
        const scaled = base * (pixelsPerSec / baselinePixelsPerSec);
        return Math.max(0.8, Math.min(25, scaled));
    };

    // (rgbToHex defined earlier)

    // ... (All other functions from the original script are placed here)

    // =========================================================================
    // Initialization and Event Listeners Setup
    // =========================================================================

    function initApp() {
        lucide.createIcons();

        // Detect system theme
        try {
            const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
            const root = document.documentElement;
            if (!root.getAttribute('data-theme')) {
                root.setAttribute('data-theme', prefersLight ? 'light' : 'dark');
            }
            window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
                if (!localStorage.getItem('themeOverride')) {
                    root.setAttribute('data-theme', e.matches ? 'light' : 'dark');
                }
            });
        } catch (_) {}

        // Global error handling
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            try { hideLoading(); } catch(_) {}
            showError('An unexpected error occurred. Please try again.');
        });
        
        initEventListeners();
        loadSettings();
        initLiquidGlass();
        initAuroraEffect();
        setupCollapsible(DOM.fullViewToggle, DOM.fullViewContent);
        setupCollapsible(DOM.videoToggle, DOM.videoContent);
        updateQualityLabel();
        updateEasingDescription();
    }
    

    const setupCollapsible = (toggle, content) => {
        if (!toggle || !content) return;
        toggle.addEventListener('click', () => {
            const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';
            const icon = toggle.querySelector('.expand-icon');
            if (isOpen) { content.style.maxHeight = '0px'; if (icon) icon.classList.remove('expanded'); }
            else { content.style.maxHeight = content.scrollHeight + 'px'; if (icon) icon.classList.add('expanded'); }
        });
        // Initialize collapsed state
        content.style.overflow = 'hidden';
        content.style.maxHeight = '0px';
    };
    // Persisted settings loader (theme and future options)
    function loadSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return;
            const settings = JSON.parse(saved);
            if (settings && settings.theme) {
                document.documentElement.setAttribute('data-theme', settings.theme);
            }
            // TODO: hydrate background/watermark/video defaults if saved
        } catch (e) {
            console.warn('loadSettings failed', e);
        }
    }

    function initEventListeners() {
        DOM.uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); DOM.uploadArea.classList.add('drag-over'); });
        DOM.uploadArea.addEventListener('dragleave', (e) => { if (e.relatedTarget && DOM.uploadArea.contains(e.relatedTarget)) return; DOM.uploadArea.classList.remove('drag-over'); });
        DOM.fileInput.addEventListener('change', (e) => { if (e.target.files.length) { showUploadPreview(e.target.files[0]); handleFile(e.target.files[0]); } });
        DOM.uploadArea.addEventListener('drop', (e) => { e.preventDefault(); DOM.uploadArea.classList.remove('drag-over'); if (e.dataTransfer.files.length) { showUploadPreview(e.dataTransfer.files[0]); handleFile(e.dataTransfer.files[0]); } });
        
        DOM.processBtn.addEventListener('click', () => { showLoading('Generating slices...', true); setTimeout(async () => { try { await processImageWithProgress(); } catch (err) { console.error("Processing error:", err); showError("An unexpected error occurred during processing."); hideLoading(); } }, 50); });
        DOM.resetBtn.addEventListener('click', resetApp);
        DOM.processAnotherBtn.addEventListener('click', () => { resetApp(); DOM.uploadArea.scrollIntoView({ behavior: 'smooth' }); if (navigator.vibrate) navigator.vibrate(50); });
        DOM.dismissError.addEventListener('click', () => { DOM.errorMessage.style.display = 'none'; });
        DOM.downloadBtn.addEventListener('click', () => { showButtonLoading(DOM.downloadBtn, DOM.downloadBtnText, DOM.downloadBtnLoader); setTimeout(async () => { try { await downloadZip(); } catch (error) { console.error('Error creating zip:', error); showError('There was a problem creating your zip file.'); } finally { hideButtonLoading(DOM.downloadBtn, DOM.downloadBtnText, DOM.downloadBtnLoader); } }, 50); });

        // Video controls
        if (DOM.generateVideoBtn) {
            DOM.generateVideoBtn.addEventListener('click', async () => {
                if (!state.originalImage) { showError('Please upload an image first'); return; }
                showButtonLoading(DOM.generateVideoBtn, DOM.generateVideoBtnText, DOM.generateVideoBtnLoader);
                showLoading('Generating panning video...', true);
                try { await createPanningVideo(); showSuccess('Video generated successfully!'); }
                catch (err) { console.error('Video generation error:', err); showError(err.message || 'Failed to generate video'); }
                finally { hideButtonLoading(DOM.generateVideoBtn, DOM.generateVideoBtnText, DOM.generateVideoBtnLoader); hideLoading(); }
            });
        }
        if (DOM.downloadVideoBtn) {
            DOM.downloadVideoBtn.addEventListener('click', () => {
                if (!state.videoBlob) return;
                const url = URL.createObjectURL(state.videoBlob);
                const a = document.createElement('a');
                a.href = url; a.download = `panning_video.${state.currentVideoExt || 'webm'}`; a.click();
                setTimeout(() => URL.revokeObjectURL(url), 500);
            });
        }
        if (DOM.videoFormatSelect) DOM.videoFormatSelect.addEventListener('change', updateQualityLabel);
        if (DOM.videoEasingSelect) DOM.videoEasingSelect.addEventListener('change', updateEasingDescription);
        if (DOM.videoQualityInput) DOM.videoQualityInput.addEventListener('input', updateQualityLabel);
        if (DOM.videoFpsInput) DOM.videoFpsInput.addEventListener('input', updateQualityLabel);

        // Theme toggle
        if (DOM.themeToggle) {
            DOM.themeToggle.addEventListener('click', () => {
                const root = document.documentElement;
                const next = (root.getAttribute('data-theme') === 'light') ? 'dark' : 'light';
                root.setAttribute('data-theme', next);
                localStorage.setItem('themeOverride', next);
                const darkIcon = document.getElementById('theme-icon-dark');
                const lightIcon = document.getElementById('theme-icon-light');
                if (darkIcon && lightIcon) {
                    if (next === 'light') { darkIcon.classList.add('hidden'); lightIcon.classList.remove('hidden'); }
                    else { darkIcon.classList.remove('hidden'); lightIcon.classList.add('hidden'); }
                }
            });
        }

        // Shortcuts modal
        if (DOM.shortcutsBtn && DOM.shortcutsModal) {
            DOM.shortcutsBtn.addEventListener('click', () => { DOM.shortcutsModal.classList.add('open'); DOM.shortcutsModal.style.display = 'flex'; });
        }
        if (DOM.shortcutsClose && DOM.shortcutsModal) {
            DOM.shortcutsClose.addEventListener('click', () => { DOM.shortcutsModal.classList.remove('open'); DOM.shortcutsModal.style.display = 'none'; });
        }

        // Lightbox controls
        if (DOM.lightboxClose) DOM.lightboxClose.addEventListener('click', closeLightbox);
        if (DOM.lightboxPrev) DOM.lightboxPrev.addEventListener('click', prevLightboxImage);
        if (DOM.lightboxNext) DOM.lightboxNext.addEventListener('click', nextLightboxImage);

        // High-res toggle is no longer needed since we always use maximum resolution
        // DOM.highResToggle.addEventListener('change', () => { if (state.originalImage) { updateImageDetails(); updateQualityLabel(); } });

        // Background type change handlers
        qsa('input[name="bg-type"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const type = radio.value;
                if (DOM.blurControls) DOM.blurControls.style.display = type === 'blur' ? 'block' : 'none';
                if (DOM.colorControls) DOM.colorControls.style.display = type === 'color' ? 'block' : 'none';
                if (DOM.gradientControls) DOM.gradientControls.style.display = type === 'gradient' ? 'block' : 'none';
                
                if (state.originalImage) {
                    updateFullViewPreview();
                }
            });
        });

        // Background live controls
        if (DOM.blurIntensity) DOM.blurIntensity.addEventListener('input', () => state.originalImage && updateFullViewPreview());
        if (DOM.blurDownscale) DOM.blurDownscale.addEventListener('input', () => state.originalImage && updateFullViewPreview());
        if (DOM.bgColorPicker) DOM.bgColorPicker.addEventListener('input', () => state.originalImage && updateFullViewPreview());
        if (DOM.gradientType) DOM.gradientType.addEventListener('change', () => state.originalImage && updateFullViewPreview());
        if (DOM.gradientStops) DOM.gradientStops.addEventListener('input', () => state.originalImage && updateFullViewPreview());
        if (DOM.gradientBlend) DOM.gradientBlend.addEventListener('change', () => state.originalImage && updateFullViewPreview());
        if (DOM.paletteFromImageBtn) DOM.paletteFromImageBtn.addEventListener('click', () => { if (state.originalImage) { populateColorPalette(state.originalImage.element); updateFullViewPreview(); } });
        if (DOM.colorPalette) DOM.colorPalette.addEventListener('click', () => state.originalImage && updateFullViewPreview());

        // Watermark type change handlers
        qsa('input[name="watermark-type"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const type = radio.value;
                if (DOM.textWatermarkControls) DOM.textWatermarkControls.style.display = type === 'text' ? 'block' : 'none';
                if (DOM.imageWatermarkControls) DOM.imageWatermarkControls.style.display = type === 'image' ? 'block' : 'none';
                if (DOM.watermarkSettings) DOM.watermarkSettings.style.display = type !== 'none' ? 'block' : 'none';
                if (state.originalImage) updateFullViewPreview();
            });
        });

        // Watermark labels live updates
        if (DOM.watermarkOpacity && DOM.watermarkOpacityLabel) {
            DOM.watermarkOpacity.addEventListener('input', () => DOM.watermarkOpacityLabel.textContent = `${DOM.watermarkOpacity.value}%`);
        }
        if (DOM.watermarkSize && DOM.watermarkSizeLabel) {
            DOM.watermarkSize.addEventListener('input', () => DOM.watermarkSizeLabel.textContent = `${DOM.watermarkSize.value}%`);
        }
        if (DOM.textWatermarkOpacity && DOM.textWatermarkOpacityLabel) {
            DOM.textWatermarkOpacity.addEventListener('input', () => DOM.textWatermarkOpacityLabel.textContent = `${DOM.textWatermarkOpacity.value}%`);
        }
        if (DOM.textWatermarkSize && DOM.textWatermarkSizeLabel) {
            DOM.textWatermarkSize.addEventListener('input', () => DOM.textWatermarkSizeLabel.textContent = `${DOM.textWatermarkSize.value}%`);
        }
        if (DOM.watermarkFontSize && DOM.watermarkFontSizeLabel) {
            DOM.watermarkFontSize.addEventListener('input', () => DOM.watermarkFontSizeLabel.textContent = `${DOM.watermarkFontSize.value}px`);
        }

        // Watermark uploads and live text controls
        if (DOM.watermarkUploadBtn) DOM.watermarkUploadBtn.addEventListener('click', () => DOM.watermarkInput?.click());
        if (DOM.watermarkInput) {
            DOM.watermarkInput.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const validation = validateWatermarkFile(file);
                if (!validation.valid) { showFieldError(DOM.watermarkInput, validation.message); return; }
                const reader = new FileReader();
                reader.onload = (ev) => { const img = new Image(); img.onload = () => { state.watermarkImage = img; if (DOM.watermarkFilename) DOM.watermarkFilename.textContent = file.name; if (DOM.watermarkPreview && DOM.watermarkPreviewImg) { DOM.watermarkPreviewImg.src = ev.target.result; DOM.watermarkPreview.style.display = 'block'; } if (DOM.watermarkRemoveBtn) DOM.watermarkRemoveBtn.style.display = 'inline-block'; showFieldSuccess(DOM.watermarkInput); if (state.originalImage) updateFullViewPreview(); }; img.src = ev.target.result; };
                reader.readAsDataURL(file);
            });
        }
        if (DOM.watermarkRemoveBtn) DOM.watermarkRemoveBtn.addEventListener('click', () => { state.watermarkImage = null; if (DOM.watermarkFilename) DOM.watermarkFilename.textContent = 'No file selected'; if (DOM.watermarkPreview) DOM.watermarkPreview.style.display = 'none'; if (DOM.watermarkRemoveBtn) DOM.watermarkRemoveBtn.style.display = 'none'; if (DOM.watermarkInput) DOM.watermarkInput.value = ''; if (state.originalImage) updateFullViewPreview(); });

        ;['input','change'].forEach(evt => {
            if (DOM.watermarkText) DOM.watermarkText.addEventListener(evt, () => state.originalImage && updateFullViewPreview());
            if (DOM.watermarkFontSize) DOM.watermarkFontSize.addEventListener(evt, () => state.originalImage && updateFullViewPreview());
            if (DOM.watermarkTextColor) DOM.watermarkTextColor.addEventListener(evt, () => state.originalImage && updateFullViewPreview());
            if (DOM.watermarkFontWeight) DOM.watermarkFontWeight.addEventListener(evt, () => state.originalImage && updateFullViewPreview());
            if (DOM.watermarkTextStroke) DOM.watermarkTextStroke.addEventListener(evt, () => state.originalImage && updateFullViewPreview());
            if (DOM.textWatermarkOpacity) DOM.textWatermarkOpacity.addEventListener(evt, () => state.originalImage && updateFullViewPreview());
            if (DOM.textWatermarkSize) DOM.textWatermarkSize.addEventListener(evt, () => state.originalImage && updateFullViewPreview());
        });

        // Watermark position radios
        if (DOM.watermarkPositionRadios) DOM.watermarkPositionRadios.forEach(r => r.addEventListener('change', () => state.originalImage && updateFullViewPreview()));
        if (DOM.textWatermarkPositionRadios) DOM.textWatermarkPositionRadios.forEach(r => r.addEventListener('change', () => state.originalImage && updateFullViewPreview()));

        // Toggle visual watermark grid overlay
        const grid = document.getElementById('watermark-grid');
        qsa('input[name="watermark-type"]').forEach(r => r.addEventListener('change', () => {
            const type = qs('input[name="watermark-type"]:checked')?.value || 'none';
            if (grid) grid.classList.toggle('opacity-0', type === 'none');
        }));

        // ... (All other event listeners from the original file are placed here)

        document.addEventListener('paste', (e) => {
            const inEditable = e.target && (e.target.closest('input, textarea, [contenteditable="true"]'));
            if (inEditable || !e.clipboardData || !e.clipboardData.items) return;
            const file = [...e.clipboardData.items].find(item => item.type.startsWith('image/'))?.getAsFile();
            if (file) {
                e.preventDefault();
                showUploadPreview(file);
                handleFile(file);
                DOM.uploadArea.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    document.addEventListener('DOMContentLoaded', initApp);

})();

// =========================================================================
// Ambient Effects (outside IIFE not needed, but keep inside closure)
// =========================================================================

function initLiquidGlass() {
    document.addEventListener('mousemove', (e) => {
        const rect = document.body.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        document.documentElement.style.setProperty('--mx', `${x}%`);
        document.documentElement.style.setProperty('--my', `${y}%`);
    });
}

function initAuroraEffect() {
    const tick = () => {
        const t = Date.now() * 0.001;
        const orb1 = document.getElementById('aurora-orb-1');
        const orb2 = document.getElementById('aurora-orb-2');
        const orb3 = document.getElementById('aurora-orb-3');
        if (orb1) { orb1.style.setProperty('--orb-1-x', `${25 + Math.sin(t * 0.3) * 15}%`); orb1.style.setProperty('--orb-1-y', `${25 + Math.cos(t * 0.4) * 10}%`); }
        if (orb2) { orb2.style.setProperty('--orb-2-x', `${75 + Math.sin(t * 0.5) * 20}%`); orb2.style.setProperty('--orb-2-y', `${75 + Math.cos(t * 0.3) * 15}%`); }
        if (orb3) { orb3.style.setProperty('--orb-3-x', `${50 + Math.sin(t * 0.2) * 25}%`); orb3.style.setProperty('--orb-3-y', `${50 + Math.cos(t * 0.6) * 20}%`); }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}
