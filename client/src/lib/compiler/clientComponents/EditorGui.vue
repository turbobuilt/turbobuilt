<script lang="ts" setup>
import { onMounted } from "vue";

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

    // New: Add Change Image button if applicable
    const compStyle = window.getComputedStyle(target);
    if (compStyle.backgroundImage !== "none" || (target.tagName.toLowerCase() === "img" && target.getAttribute("src"))) {
        const changeImgButton = document.createElement("button");
        changeImgButton.textContent = "Change Image";
        changeImgButton.addEventListener("click", async (e) => {
            e.stopPropagation();
            const newUrl = prompt("Enter new image URL:");
            if (newUrl) {
                if (compStyle.backgroundImage !== "none") {
                    target.style.backgroundImage = `url(${newUrl})`;
                    window.opener.updateFileContent({ xpath: await getRelativeXPath(target), css: getCss(target) });
                } else if (target.tagName.toLowerCase() === "img") {
                    target.src = newUrl;
                    let setAttributes = { src: newUrl };
                    window.opener.updateFileContent({ xpath: await getRelativeXPath(target), setAttributes });
                }
                // Propagate the change back
                target.dispatchEvent(new Event("input"));
            }
        });
        editor.appendChild(changeImgButton);

        // New: For background elements, add extra CSS editor
        if (compStyle.backgroundImage !== "none") {
            const editStyleButton = document.createElement("button");
            editStyleButton.textContent = "Edit Background Style";
            editStyleButton.addEventListener("click", (e) => {
                e.stopPropagation();
                // Prompt for background color and border radius; leave blank to keep unchanged.
                const newBgColor = prompt("Enter new background color (e.g., #ffffff) or leave blank:", target.style.backgroundColor || "");
                const newBorderRadius = prompt("Enter new border radius (e.g., 5px) or leave blank:", target.style.borderRadius || "");
                if (newBgColor !== null && newBgColor.trim() !== "") {
                    target.style.backgroundColor = newBgColor.trim();
                }
                if (newBorderRadius !== null && newBorderRadius.trim() !== "") {
                    target.style.borderRadius = newBorderRadius.trim();
                }
                // Propagate CSS changes back
                target.dispatchEvent(new Event("input"));
            });
            editor.appendChild(editStyleButton);
        }
    }

    document.body.appendChild(editor);

    // position editor above target element
    const rect = target.getBoundingClientRect();
    editor.style.top = (window.scrollY + rect.top - editor.offsetHeight - 5) + "px";
    editor.style.left = (window.scrollX + rect.left) + "px";
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

function showToast(title, msg) {
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

onMounted(() => {
    console.log("mounted")
    document.body.addEventListener("click", async (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        console.log("Clicked element:", target);
        if (!target) return;
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
});
</script>
<template>
    <div class="editor-gui">

    </div>
</template>
<style lang="scss">
.editor-gui {}

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
</style>