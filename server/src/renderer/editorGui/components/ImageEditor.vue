<script lang="ts" setup>
import { defineExpose } from 'vue';

// Create placeholder SVG for images
function createPlaceholderSVG(shortDescription: string): string {
    const encodedText = encodeURIComponent(shortDescription || "Image placeholder");
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
        <rect width="300" height="200" fill="#f0f0f0" />
        <text x="50%" y="50%" font-family="Arial" font-size="16" text-anchor="middle" fill="#999">${encodedText}</text>
        <text x="50%" y="65%" font-family="Arial" font-size="12" text-anchor="middle" fill="#999">Click to generate</text>
    </svg>`;
}

function getCss(target: HTMLElement) {
    const compStyle = window.getComputedStyle(target);
    let css = {}
    if (compStyle.backgroundImage !== "none") {
        css = {
            backgroundImage: compStyle.backgroundImage,
            backgroundColor: compStyle.backgroundColor,
            borderRadius: compStyle.borderRadius
        }
    }
    return css;
}

async function getRelativeXPath(el: HTMLElement) {
    const getXPath = (await import('https://unpkg.com/get-xpath/index.esm.js')).default;
    const container = el.closest("[class^=component-guid-]");
    let containerXpath = getXPath(container);
    let xpath = getXPath(el);
    return xpath.slice(containerXpath.length - 1);
}

function createImageFloatingEditor(target: HTMLElement) {
    // remove existing editor if present
    const existing = document.getElementById("floating-editor");
    if (existing) existing.remove();

    const editor = document.createElement("div");
    editor.id = "floating-editor";
    editor.style.position = "absolute";
    editor.style.background = "#f0f0f0";
    editor.style.padding = "5px";
    editor.style.border = "1px solid #ccc";

    // Check if this is an image with short-description attribute
    if (target.tagName.toLowerCase() === "img" && target.hasAttribute("short-description")) {
        const generateButton = document.createElement("button");
        generateButton.textContent = "Generate Image";
        generateButton.addEventListener("click", async (e) => {
            e.stopPropagation();
            await handleImageGeneration(target);
        });
        editor.appendChild(generateButton);

        const editPromptButton = document.createElement("button");
        editPromptButton.textContent = "Edit Prompt";
        editPromptButton.addEventListener("click", (e) => {
            e.stopPropagation();
            openImageStudio(target);
        });
        editor.appendChild(editPromptButton);
    }
    // Add Change Image button for regular images
    else if (target.tagName.toLowerCase() === "img" && target.getAttribute("src")) {
        const changeImgButton = document.createElement("button");
        changeImgButton.textContent = "Change Image";
        changeImgButton.addEventListener("click", async (e) => {
            e.stopPropagation();
            const newUrl = prompt("Enter new image URL:");
            if (newUrl) {
                target.src = newUrl;
                let setAttributes = { src: newUrl };
                window.opener.updateFileContent({ xpath: await getRelativeXPath(target), setAttributes });
                target.dispatchEvent(new Event("input"));
            }
        });
        editor.appendChild(changeImgButton);
    }

    // Handle elements with background images
    const compStyle = window.getComputedStyle(target);
    if (compStyle.backgroundImage !== "none") {
        const changeImgButton = document.createElement("button");
        changeImgButton.textContent = "Change Image";
        changeImgButton.addEventListener("click", async (e) => {
            e.stopPropagation();
            const newUrl = prompt("Enter new image URL:");
            if (newUrl) {
                target.style.backgroundImage = `url(${newUrl})`;
                window.opener.updateFileContent({ xpath: await getRelativeXPath(target), css: getCss(target) });
                target.dispatchEvent(new Event("input"));
            }
        });
        editor.appendChild(changeImgButton);

        const editStyleButton = document.createElement("button");
        editStyleButton.textContent = "Edit Background Style";
        editStyleButton.addEventListener("click", (e) => {
            e.stopPropagation();
            const newBgColor = prompt("Enter new background color (e.g., #ffffff) or leave blank:", target.style.backgroundColor || "");
            const newBorderRadius = prompt("Enter new border radius (e.g., 5px) or leave blank:", target.style.borderRadius || "");
            if (newBgColor !== null && newBgColor.trim() !== "") {
                target.style.backgroundColor = newBgColor.trim();
            }
            if (newBorderRadius !== null && newBorderRadius.trim() !== "") {
                target.style.borderRadius = newBorderRadius.trim();
            }
            target.dispatchEvent(new Event("input"));
        });
        editor.appendChild(editStyleButton);
    }

    document.body.appendChild(editor);

    // position editor above target element
    const rect = target.getBoundingClientRect();
    editor.style.top = (window.scrollY + rect.top - editor.offsetHeight - 5) + "px";
    editor.style.left = (window.scrollX + rect.left) + "px";
}

// Handle image generation logic
async function handleImageGeneration(imgElement: HTMLElement) {
    const shortDescription = imgElement.getAttribute("short-description");
    const description = imgElement.getAttribute("description") || shortDescription;

    if (!shortDescription) {
        window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { title: "Error", message: "No short description provided for image generation" }
        }));
        return;
    }

    window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { title: "Generating Image", message: `Generating: ${shortDescription}` }
    }));

    try {
        // Call to parent window to handle image generation
        const result = await window.opener.generateImage(shortDescription, description) as {
            success: boolean,
            url?: string,
            objectId?: string,
            error?: string
        }
        console.log("Image generation result:", result);

        if (result && result.success) {
            // Handle case where we have objectId but no direct URL
            if (result.objectId) {
                imgElement.setAttribute("src", result.url);

                // Use the [img objectId] format
                console.log("Doing img reference")
                const imgReference = `[img ${result.objectId}]`;

                // Update the file content with the image reference
                console.log("updating file content with", imgReference);
                window.opener.updateFileContent({
                    xpath: await getRelativeXPath(imgElement),
                    setAttributes: { src: imgReference },
                });

                // Immediately try to resolve the URL for display in preview
                // await resolveImageUrls();
            } else if (result.url) {
                // If we have a direct URL (fallback)
                imgElement.setAttribute("src", result.url);
                window.opener.updateFileContent({
                    xpath: await getRelativeXPath(imgElement),
                    setAttributes: { src: result.url },
                });
            } else {
                throw new Error("Image generation succeeded but no objectId or URL was returned");
            }

            // Remove placeholder class if it exists
            imgElement.classList.remove('placeholder-image');
        } else {
            throw new Error(result?.error || "Failed to generate image");
        }
    } catch (error) {
        console.error("Image generation error:", error);
        window.dispatchEvent(new CustomEvent('show-toast', {
            detail: { title: "Error", message: "Failed to generate image: " + error }
        }));
    }
}

// Image studio for editing prompts
function openImageStudio(imgElement: HTMLElement) {
    // Close any existing studio
    const existingStudio = document.getElementById("image-prompt-studio");
    if (existingStudio) existingStudio.remove();

    const shortDescription = imgElement.getAttribute("short-description") || "";
    const description = imgElement.getAttribute("description") || "";

    // Create studio container
    const studio = document.createElement("div");
    studio.id = "image-prompt-studio";
    studio.className = "image-prompt-studio";

    // Add title
    const title = document.createElement("h3");
    title.textContent = "Edit Image Prompt";
    studio.appendChild(title);

    // Short description field
    const shortDescLabel = document.createElement("label");
    shortDescLabel.textContent = "Short Description:";
    studio.appendChild(shortDescLabel);

    const shortDescInput = document.createElement("input");
    shortDescInput.type = "text";
    shortDescInput.value = shortDescription;
    shortDescInput.className = "prompt-input";
    studio.appendChild(shortDescInput);

    // Description/prompt field
    const descLabel = document.createElement("label");
    descLabel.textContent = "Image Prompt:";
    studio.appendChild(descLabel);

    const descTextarea = document.createElement("textarea");
    descTextarea.value = description;
    descTextarea.rows = 5;
    descTextarea.className = "prompt-textarea";
    studio.appendChild(descTextarea);

    // Button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "button-container";

    // Generate button
    const generateButton = document.createElement("button");
    generateButton.textContent = "Generate Image";
    generateButton.className = "generate-button";
    generateButton.addEventListener("click", async () => {
        const newShortDesc = shortDescInput.value.trim();
        const newDesc = descTextarea.value.trim();

        if (!newShortDesc) {
            window.dispatchEvent(new CustomEvent('show-toast', {
                detail: { title: "Error", message: "Short description is required" }
            }));
            return;
        }

        // Update attributes on the image element
        imgElement.setAttribute("short-description", newShortDesc);
        imgElement.setAttribute("description", newDesc);

        // Close studio
        studio.remove();

        // Generate the image
        await handleImageGeneration(imgElement);
    });
    buttonContainer.appendChild(generateButton);

    // Cancel button
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.className = "cancel-button";
    cancelButton.addEventListener("click", () => {
        studio.remove();
    });
    buttonContainer.appendChild(cancelButton);

    studio.appendChild(buttonContainer);

    // Add to document
    document.body.appendChild(studio);
}

// Add placeholder SVGs to images with short-description but no src
function addPlaceholdersToImages() {
    const images = document.querySelectorAll('img[short-description]:not([src]), img[short-description][src=""]');
    images.forEach((img: HTMLImageElement) => {
        const shortDescription = img.getAttribute("short-description");
        img.src = createPlaceholderSVG(shortDescription);
        img.classList.add('placeholder-image');
    });
}


// Add function to resolve image URLs on page load
async function resolveImageUrls() {
    return;
    try {
        // Find all images with src attributes containing [img objectId] pattern
        const imgTags = document.querySelectorAll('img[src*="[img "]');

        if (imgTags.length === 0) {
            return { success: true, message: "No images to resolve" };
        }

        // Extract all unique objectIds
        const imageObjectIds = new Set<string>();
        imgTags.forEach(img => {
            const match = img.getAttribute('src')?.match(/\[img\s+([^\]]+)\]/);
            if (match && match[1]) {
                imageObjectIds.add(match[1]);
            }
        });

        if (imageObjectIds.size === 0) {
            return { success: true, message: "No valid objectIds found" };
        }

        // Call parent window to get URLs for these objectIds
        const result = await window.opener.getImageUrlsByObjectIds(Array.from(imageObjectIds));

        if (!result.success || !result.items) {
            throw new Error("Failed to fetch image URLs");
        }

        // Replace [img objectId] with actual URLs
        imgTags.forEach(img => {
            const match = img.getAttribute('src')?.match(/\[img\s+([^\]]+)\]/);
            if (match && match[1]) {
                const objectId = match[1];
                if (result.items[objectId]) {
                    img.setAttribute('src', "https://clientsites.dreamgenerator.ai/" + result.items[objectId][0].url);
                    img.classList.remove('placeholder-image');
                } else {
                    img.setAttribute('src', createPlaceholderSVG("Image not found"));
                    img.classList.add('placeholder-image');
                }
            }
        });

        return { success: true, message: `Resolved ${imgTags.length} image URLs` };
    } catch (err) {
        console.error("Error resolving image URLs", err);
        return { success: false, error: err.toString() };
    }
}

async function setupImageEditing() {
    // Resolve image URLs first, then add placeholders for any remaining images
    await resolveImageUrls()
    addPlaceholdersToImages();

    // Set up click handler for images
    document.body.addEventListener("click", async (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        // Handle click on image with short-description
        if (target.tagName.toLowerCase() === "img") {
            event.preventDefault();
            event.stopPropagation();

            // Check if we can edit the text in this element
            let xpath = await getRelativeXPath(target);
            let { result, error } = await window.opener.testIfCanEdit(xpath);

            if (!result) {
                window.dispatchEvent(new CustomEvent('show-toast', {
                    detail: { title: "Error Editing", message: error }
                }));
                return;
            }

            createImageFloatingEditor(target);
            return;
        }

        // Check for elements with background images
        const compStyle = window.getComputedStyle(target);
        if (compStyle.backgroundImage !== "none" && compStyle.backgroundImage !== "initial") {
            let xpath = await getRelativeXPath(target);
            let { result, error } = await window.opener.testIfCanEdit(xpath);

            if (!result) return;

            createImageFloatingEditor(target);
        }
    });

    // Watch for DOM changes to add placeholders to new images
    const observer = new MutationObserver((mutations) => {
        let shouldResolveUrls = false;
        let shouldAddPlaceholders = false;

        mutations.forEach(mutation => {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                if (mutation.type === 'attributes' &&
                    mutation.attributeName === 'src' &&
                    (mutation.target as HTMLElement).getAttribute('src')?.startsWith('[img ')) {
                    shouldResolveUrls = true;
                } else {
                    shouldAddPlaceholders = true;
                }
            }
        });

        if (shouldResolveUrls) {
            resolveImageUrls().then(() => {
                if (shouldAddPlaceholders) {
                    addPlaceholdersToImages();
                }
            });
        } else if (shouldAddPlaceholders) {
            addPlaceholdersToImages();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'short-description']
    });
}

defineExpose({
    setupImageEditing,
    addPlaceholdersToImages,
    resolveImageUrls
});
</script>

<template>
    <!-- No specific template needed as this is a utility component -->
</template>

<style>
/* Image studio for prompt editing */
.image-prompt-studio {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    width: 80%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.image-prompt-studio h3 {
    margin-top: 0;
    margin-bottom: 10px;
}

.prompt-input,
.prompt-textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-family: inherit;
}

.button-container {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 10px;
}

.generate-button,
.cancel-button {
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
}

.generate-button {
    background-color: #4CAF50;
    color: white;
}

.cancel-button {
    background-color: #f44336;
    color: white;
}

/* Placeholder image styles */
.placeholder-image {
    border: 1px dashed #ccc;
    cursor: pointer;
}
</style>
