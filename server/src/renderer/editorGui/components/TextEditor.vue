<script lang="ts" setup>
import { defineExpose } from 'vue';

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

async function getRelativeXPath(el: HTMLElement) {
    const getXPath = (await import('https://unpkg.com/get-xpath/index.esm.js')).default;
    const container = el.closest("[class^=component-guid-]");
    let containerXpath = getXPath(container);
    let xpath = getXPath(el);
    return xpath.slice(containerXpath.length - 1);
}

function createTextFloatingEditor(target: HTMLElement) {
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
    
    document.body.appendChild(editor);

    // position editor above target element
    const rect = target.getBoundingClientRect();
    editor.style.top = (window.scrollY + rect.top - editor.offsetHeight - 5) + "px";
    editor.style.left = (window.scrollX + rect.left) + "px";
}

async function handleInput(event: Event) {
    const target = event.target as HTMLElement;
    const container = target.closest("[class^=component-guid-]");
    let relativeXpath = await getRelativeXPath(target);
    let guid = container.className.match(/component-guid-([^"']+)/)?.[1] || null;
    let html = target.innerHTML;
    window.opener.updateFileContent({ xpath: relativeXpath, guid, newContent: html });
}

function setupTextEditing() {
    // Set up click handler for the document
    document.body.addEventListener("click", async (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        
        // Skip if target is an image (will be handled by ImageEditor)
        if (target.tagName.toLowerCase() === "img") return;
        
        // Handle normal editable elements
        let editableElem: HTMLElement | null = null;
        let xpath = await getRelativeXPath(target);
        let { result, error } = await window.opener.testIfCanEdit(xpath);
        
        if (!result) {
            window.dispatchEvent(new CustomEvent('show-toast', {
                detail: { title: "Error Editing", message: error }
            }));
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
            createTextFloatingEditor(editableElem);
            // Attach input listener to communicate changes to parent
            editableElem.addEventListener("input", handleInput);
        }
    });
}

defineExpose({
    setupTextEditing
});
</script>

<template>
    <!-- No specific template needed as this is a utility component -->
</template>

<style>
/* Floating editor styles */
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
