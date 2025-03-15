<script lang="ts" setup>
import { onMounted, ref } from "vue";
import TextEditor from './components/TextEditor.vue';
import ImageEditor from './components/ImageEditor.vue';

function isInlineElement(el: HTMLElement): boolean {
    const display = window.getComputedStyle(el).display;
    return display === "inline" || display === "inline-block";
}



function isInlineContainer(el: HTMLElement): boolean {
    for (const child of el.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE && !isInlineElement(child as HTMLElement)) {
            return false;
        }
    }
    return true;
}

function getHighestInlineAncestor(el: HTMLElement): HTMLElement {
    let current = el;
    while (current.parentElement && isInlineElement(current.parentElement)) {
        current = current.parentElement;
    }
    return current;
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

// Create placeholder SVG for images
function createPlaceholderSVG(shortDescription: string): string {
    const encodedText = encodeURIComponent(shortDescription || "Image placeholder");
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
        <rect width="300" height="200" fill="#f0f0f0" />
        <text x="50%" y="50%" font-family="Arial" font-size="16" text-anchor="middle" fill="#999">${encodedText}</text>
        <text x="50%" y="65%" font-family="Arial" font-size="12" text-anchor="middle" fill="#999">Click to generate</text>
    </svg>`;
}

function createFloatingEditor(target: HTMLElement) {
    // remove existing editor if present
    const existing = document.getElementById("floating-editor");
    if (existing) existing.remove();

    const editor = document.createElement("div");
    editor.id = "floating-editor";
    editor.style.position = "absolute";
    editor.style.background = "#f0f0f0";
    editor.style.padding = "5px";
    editor.style.border = "1px solid #ccc";

    const boldButton = document.createElement("button");
    boldButton.textContent = "Bold";
    boldButton.addEventListener("click", (e) => {
        e.stopPropagation();
        document.execCommand("bold");
    });

    const italicButton = document.createElement("button");
    italicButton.textContent = "Italic";
    italicButton.addEventListener("click", (e) => {
        e.stopPropagation();
        document.execCommand("italic");
    });

    editor.appendChild(boldButton);
    editor.appendChild(italicButton);

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
    // New: Add Change Image button for regular images
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
        showToast("Error", "No short description provided for image generation");
        return;
    }

    showToast("Generating Image", `Generating: ${shortDescription}`);
    
    try {
        // Call to parent window to handle image generation
        const result = await window.opener.generateImage(shortDescription, description);
        if (result && result.url) {
            imgElement.setAttribute("src", result.url);
            window.opener.updateFileContent({ 
                xpath: await getRelativeXPath(imgElement), 
                setAttributes: { src: result.url } 
            });
        } else {
            showToast("Error", "Failed to generate image");
        }
    } catch (error) {
        console.error("Image generation error:", error);
        showToast("Error", "Failed to generate image: " + error);
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
            showToast("Error", "Short description is required");
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

async function getRelativeXPath(el: HTMLElement) {
    const getXPath = (await import('https://unpkg.com/get-xpath/index.esm.js')).default;
    const container = el.closest("[class^=component-guid-]");
    let containerXpath = getXPath(container);
    let xpath = getXPath(el);
    return xpath.slice(containerXpath.length - 1);
}

async function handleInput(event: Event) {
    const target = event.target as HTMLElement;
    const container = target.closest("[class^=component-guid-]");
    let relativeXpath = await getRelativeXPath(target);
    let guid = container.className.match(/component-guid-([^"']+)/)?.[1] || null;
    let html = target.innerHTML;
    window.opener.updateFileContent({ xpath: relativeXpath, guid, newContent: html });
}

function showToast(title: string, msg: string) {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  
  // Create new toast element
  const toast = document.createElement('div');
  toast.className = 'toast';
  
  const toastTitle = document.createElement('div');
  toastTitle.className = 'toast-title';
  toastTitle.textContent = title;
  
  const toastMessage = document.createElement('div');
  toastMessage.className = 'toast-message';
  toastMessage.textContent = msg;
  
  toast.appendChild(toastTitle);
  toast.appendChild(toastMessage);
  
  // Add to container (at the top)
  toastContainer.insertBefore(toast, toastContainer.firstChild);
  
  // Adjust positions of all toasts
  const toasts = toastContainer.querySelectorAll('.toast');
  let currentOffset = 0;
  
  toasts.forEach((t) => {
    (t as HTMLElement).style.transform = `translateY(${currentOffset}px)`;
    currentOffset += (t as HTMLElement).offsetHeight + 10; // 10px margin
  });
  
  // Set up fade in
  setTimeout(() => {
    toast.classList.add('visible');
  }, 10);
  
  // Set up fade out and removal
  setTimeout(() => {
    toast.classList.remove('visible');
    toast.classList.add('fading');
    
    // After fade out animation, remove toast and reposition others
    setTimeout(() => {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast);
        
        // Readjust positions after removal
        const remainingToasts = toastContainer.querySelectorAll('.toast');
        let newOffset = 0;
        
        remainingToasts.forEach((t) => {
          (t as HTMLElement).style.transform = `translateY(${newOffset}px)`;
          newOffset += (t as HTMLElement).offsetHeight + 10;
        });
      }
    }, 300); // Match the CSS transition time
  }, 3000); // Display for 3 seconds
}

const textEditorRef = ref<InstanceType<typeof TextEditor> | null>(null);
const imageEditorRef = ref<InstanceType<typeof ImageEditor> | null>(null);

onMounted(() => {
  console.log("Editor GUI mounted");
  
  // Set up toast event listener
  window.addEventListener('show-toast', ((event: CustomEvent) => {
    const { title, message } = event.detail;
    showToast(title, message);
  }) as EventListener);
  
  // Initialize text editing functionality
  if (textEditorRef.value) {
    textEditorRef.value.setupTextEditing();
  }
  
  // Initialize image editing functionality
  if (imageEditorRef.value) {
    imageEditorRef.value.setupImageEditing();
  }
});

// Add placeholder SVGs to images with short-description but no src
function addPlaceholdersToImages() {
    const images = document.querySelectorAll('img[short-description]:not([src]), img[short-description][src=""]');
    images.forEach((img: HTMLImageElement) => {
        const shortDescription = img.getAttribute("short-description");
        img.src = createPlaceholderSVG(shortDescription);
        img.classList.add('placeholder-image');
    });
}

// Add placeholder SVGs to images and resolve image URLs
function setupImages() {
    // First resolve any [img objectId] references
    window.opener.resolveImageUrls().then(result => {
        console.log("Image URL resolution result:", result);
        
        // Then add placeholders for any remaining images with short-description but no src
        addPlaceholdersToImages();
    }).catch(err => {
        console.error("Error resolving image URLs:", err);
        // Still try to add placeholders even if URL resolution fails
        addPlaceholdersToImages();
    });
}

onMounted(() => {
    console.log("mounted");
    
    // Initialize image processing
    if (imageEditorRef.value) {
        imageEditorRef.value.setupImageEditing();
        
        // Resolve image references on load
        imageEditorRef.value.resolveImageUrls().then(() => {
            // Add placeholders for any images without src
            imageEditorRef.value.addPlaceholdersToImages();
        });
    }

    // Initialize text editing
    if (textEditorRef.value) {
        textEditorRef.value.setupTextEditing();
    }
    
    // Set up click handler for the document
    document.body.addEventListener("click", async (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        console.log("Clicked element:", target);
        if (!target) return;
        
        // Handle click on image with short-description
        if (target.tagName.toLowerCase() === "img" && target.hasAttribute("short-description")) {
            event.preventDefault();
            event.stopPropagation();
            createFloatingEditor(target);
            return;
        }
        
        // Handle normal editable elements
        let editableElem: HTMLElement | null = null;
        let xpath = await getRelativeXPath(target);
        console.log("Can edit", await window.opener.testIfCanEdit(xpath))
        let { result, error } = await window.opener.testIfCanEdit(xpath);
        if (!result) {
            showToast("Error Editing", error);
            return;
        }
        if (isInlineElement(target)) {
            editableElem = getHighestInlineAncestor(target);
        } else if (isInlineContainer(target)) {
            editableElem = target;
        }
        if (!editableElem) {
            console.log("No editable element found");
            return;
        }

        if (!editableElem.hasAttribute("contenteditable") || editableElem.getAttribute("contenteditable") !== "true") {
            editableElem.setAttribute("contenteditable", "true");
            createFloatingEditor(editableElem);
            // Attach input listener to communicate changes to parent
            editableElem.addEventListener("input", handleInput);
        }
    });
    
    // Watch for DOM changes to add placeholders to new images
    const observer = new MutationObserver((mutations) => {
        let shouldProcessImages = false;
        
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'src' && 
                    (mutation.target as HTMLElement).getAttribute('src')?.startsWith('[img ')) {
                    shouldProcessImages = true;
                } else if (mutation.type === 'childList') {
                    // Check for new img elements with objectId references
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node as HTMLElement;
                            if (element.tagName === 'IMG' && element.getAttribute('src')?.startsWith('[img ')) {
                                shouldProcessImages = true;
                            } else if (element.querySelectorAll) {
                                const nestedImgs = element.querySelectorAll('img[src^="[img "]');
                                if (nestedImgs.length > 0) {
                                    shouldProcessImages = true;
                                }
                            }
                        }
                    });
                }
            }
        });
        
        if (shouldProcessImages) {
            window.opener.resolveImageUrls().then(() => {
                addPlaceholdersToImages();
            });
        } else {
            addPlaceholdersToImages();
        }
    });
    
    observer.observe(document.body, { 
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'short-description']
    });
});
</script>

<template>
    <div class="editor-gui">
        <TextEditor ref="textEditorRef" />
        <ImageEditor ref="imageEditorRef" />
    </div>
</template>

<style lang="scss">
.editor-gui {}

/* Toast notifications */
#toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.toast {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 12px 16px;
  margin-bottom: 10px;
  min-width: 250px;
  max-width: 350px;
  opacity: 0;
  transform: translateY(0);
  transition: opacity 0.3s ease, transform 0.3s ease;
  border-left: 4px solid #f44336;
}

.toast.visible {
  opacity: 1;
}

.toast.fading {
  opacity: 0;
}

.toast-title {
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.toast-message {
  color: #666;
  word-break: break-word;
}

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

.prompt-input, .prompt-textarea {
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

.generate-button, .cancel-button {
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

/* Floating editor enhancements */
#floating-editor {
  display: flex;
  gap: 5px;
}

#floating-editor button {
  padding: 4px 8px;
  border-radius: 3px;
  border: 1px solid #ccc;
  background-color: white;
  cursor: pointer;
}

#floating-editor button:hover {
  background-color: #f0f0f0;
}
</style>